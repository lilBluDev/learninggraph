import { put } from "@vercel/blob";
import { Router } from "express";
import formidable from "formidable";
import { isAdmin, verifyToken } from "./middleware/auth.js";
import Kuis from "./skema/kuis.js";
import KuisAttempt from "./skema/kuisAttempt.js";
import KuisMatch from "./skema/kuisMatch.js";
import User from "./skema/user.js";

const route = Router();

// ==================== ADMIN: CREATE/EDIT QUIZ ====================
route.post("/create", verifyToken, isAdmin, async (req, res) => {
    try {
        const { title, description, subject, duration, questions } = req.body;

        if (!title || !subject || !questions || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Title, subject, dan questions wajib diisi."
            });
        }

        // Validate questions structure
        for (let q of questions) {
            if (!q.id || !q.type || !q.question) {
                return res.status(400).json({
                    success: false,
                    message: "Setiap soal harus memiliki id, type, dan question."
                });
            }
            
            if (q.type === 'multiple_choice' || q.type === 'multiple_complex') {
                if (!q.options || q.options.length < 2) {
                    return res.status(400).json({
                        success: false,
                        message: "Soal pilihan ganda harus memiliki minimal 2 opsi."
                    });
                }
            } else if (q.type === 'matching') {
                if (!q.pairs || q.pairs.length < 2) {
                    return res.status(400).json({
                        success: false,
                        message: "Soal matching harus memiliki minimal 2 pasangan."
                    });
                }
            }
        }

        const kuis = new Kuis({
            title,
            description: description || '',
            subject,
            duration: duration || 600,
            questions,
            createdBy: req.userId,
            isPublished: false
            // totalPoints akan dihitung otomatis di pre-save hook
        });

        await kuis.save();

        res.status(201).json({
            success: true,
            message: "Kuis berhasil dibuat!",
            data: kuis
        });
    } catch (error) {
        console.error("Create quiz error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Gagal membuat kuis." 
        });
    }
});

route.put("/edit/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const { title, description, subject, duration, questions } = req.body;
        const kuis = await Kuis.findById(req.params.id);

        if (!kuis) {
            return res.status(404).json({ success: false, message: "Kuis tidak ditemukan." });
        }

        if (kuis.createdBy.toString() !== req.userId && !req.user.isAdmin()) {
            return res.status(403).json({ success: false, message: "Anda tidak memiliki akses." });
        }

        if (title) kuis.title = title;
        if (description !== undefined) kuis.description = description;
        if (subject) kuis.subject = subject;
        if (duration) kuis.duration = duration;
        if (questions) kuis.questions = questions;

        await kuis.save();

        res.json({
            success: true,
            message: "Kuis berhasil diupdate!",
            data: kuis
        });
    } catch (error) {
        console.error("Edit quiz error:", error);
        res.status(500).json({ success: false, message: "Gagal mengupdate kuis." });
    }
});

route.post("/publish/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const kuis = await Kuis.findById(req.params.id);

        if (!kuis) {
            return res.status(404).json({ success: false, message: "Kuis tidak ditemukan." });
        }

        kuis.isPublished = !kuis.isPublished;
        await kuis.save();

        res.json({
            success: true,
            message: `Kuis berhasil di${kuis.isPublished ? 'publish' : 'unpublish'}!`,
            data: kuis
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengubah status kuis." });
    }
});

// ==================== UPLOAD IMAGE ====================
route.post("/upload-image", verifyToken, isAdmin, async (req, res) => {
    const form = formidable({ maxFileSize: 5 * 1024 * 1024 }); // 5MB limit

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({ success: false, message: "File terlalu besar." });
        }

        const file = files.image;
        if (!file) {
            return res.status(400).json({ success: false, message: "Tidak ada file yang diupload." });
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            return res.status(400).json({ success: false, message: "Format file tidak didukung." });
        }

        try {
            const blob = await put(
                `kuis-images/${req.userId}_${Date.now()}_${file.originalFilename}`,
                file.filepath,
                { access: 'public' }
            );

            res.json({
                success: true,
                url: blob.url
            });
        } catch (e) {
            console.error("Upload error:", e);
            res.status(500).json({ success: false, message: "Gagal mengupload gambar." });
        }
    });
});

// ==================== GET QUIZZES ====================
route.get("/list", async (req, res) => {
    try {
        const { subject, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const filter = { isPublished: true };
        if (subject) filter.subject = subject;

        // Fetch quizzes including questions temporarily so we can compute questionsCount,
        // then strip full questions from response to avoid sending large payloads.
        const quizzesRaw = await Kuis.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'displayName avatar');

        const quizzes = quizzesRaw.map(q => {
            const obj = q.toObject ? q.toObject() : q;
            obj.questionsCount = Array.isArray(obj.questions) ? obj.questions.length : 0;
            delete obj.questions;
            return obj;
        });

        const total = await Kuis.countDocuments(filter);

        res.json({
            success: true,
            data: quizzes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengambil daftar kuis." });
    }
});

route.get("/:id", async (req, res) => {
    try {
        const kuis = await Kuis.findById(req.params.id)
            .populate('createdBy', 'displayName avatar');

        if (!kuis || !kuis.isPublished) {
            return res.status(404).json({ success: false, message: "Kuis tidak ditemukan." });
        }

        res.json({
            success: true,
            data: kuis
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengambil kuis." });
    }
});

// ==================== SOLO MODE ====================
route.post("/attempt/start/:kuisId", verifyToken, async (req, res) => {
    try {
        const kuis = await Kuis.findById(req.params.kuisId);

        if (!kuis || !kuis.isPublished) {
            return res.status(404).json({ success: false, message: "Kuis tidak ditemukan." });
        }

        const attempt = new KuisAttempt({
            user: req.userId,
            kuis: req.params.kuisId,
            mode: 'solo',
            totalScore: kuis.totalPoints
        });

        await attempt.save();

        res.status(201).json({
            success: true,
            data: {
                attemptId: attempt._id,
                duration: kuis.duration,
                totalQuestions: kuis.questions.length,
                totalPoints: kuis.totalPoints
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memulai attempt." });
    }
});

route.post("/attempt/submit/:attemptId", verifyToken, async (req, res) => {
    try {
        const { answers, timeSpent } = req.body;
        const attempt = await KuisAttempt.findById(req.params.attemptId)
            .populate('kuis');

        if (!attempt) {
            return res.status(404).json({ success: false, message: "Attempt tidak ditemukan." });
        }

        if (attempt.user.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Anda tidak memiliki akses." });
        }

        let score = 0;
        const processedAnswers = answers.map(answer => {
            const question = attempt.kuis.questions.find(q => q.id === answer.questionId);
            if (!question) return answer;

            let isCorrect = false;
            let pointsEarned = 0;

            if (question.type === 'matching') {
                isCorrect = answer.selectedAnswers[0] === question.pairs[0].correctMatch;
            } else if (question.type === 'multiple_complex') {
                const correctIds = question.options
                    .filter(opt => opt.isCorrect)
                    .map(opt => opt.id);
                isCorrect = JSON.stringify(answer.selectedAnswers.sort()) === 
                           JSON.stringify(correctIds.sort());
            } else {
                isCorrect = question.options.find(opt => opt.isCorrect)?.id === answer.selectedAnswers[0];
            }

            if (isCorrect) {
                pointsEarned = question.points || 10;
                score += pointsEarned;
            }

            return {
                questionId: answer.questionId,
                selectedAnswers: answer.selectedAnswers,
                isCorrect,
                pointsEarned
            };
        });

        attempt.answers = processedAnswers;
        attempt.score = score;
        attempt.timeSpent = timeSpent;
        attempt.status = 'completed';
        attempt.completedAt = new Date();

        await attempt.save();

        // Add XP
        const user = await User.findById(req.userId);
        user.addXP(Math.floor(score / 2));
        await user.save();

        const percentage = (score / attempt.totalScore * 100).toFixed(2);

        res.json({
            success: true,
            message: "Jawaban berhasil disubmit!",
            data: {
                score,
                totalScore: attempt.totalScore,
                percentage,
                timeSpent,
                answers: processedAnswers
            }
        });
    } catch (error) {
        console.error("Submit error:", error);
        res.status(500).json({ success: false, message: "Gagal mensubmit jawaban." });
    }
});

// ==================== MATCH MODE ====================
route.post("/match/create/:kuisId", verifyToken, async (req, res) => {
    try {
        const kuis = await Kuis.findById(req.params.kuisId);

        if (!kuis || !kuis.isPublished) {
            return res.status(404).json({ success: false, message: "Kuis tidak ditemukan." });
        }

        const attempt = new KuisAttempt({
            user: req.userId,
            kuis: req.params.kuisId,
            mode: 'match',
            totalScore: kuis.totalPoints
        });

        await attempt.save();

        const match = new KuisMatch({
            kuis: req.params.kuisId,
            duration: kuis.duration,
            player1: {
                userId: req.userId,
                attemptId: attempt._id,
                joinedAt: new Date()
            }
        });

        await match.save();

        res.status(201).json({
            success: true,
            data: {
                matchId: match._id,
                attemptId: attempt._id,
                status: 'waiting'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal membuat match." });
    }
});

route.post("/match/join/:matchId", verifyToken, async (req, res) => {
    try {
        const match = await KuisMatch.findById(req.params.matchId);

        if (!match) {
            return res.status(404).json({ success: false, message: "Match tidak ditemukan." });
        }

        if (match.status !== 'waiting') {
            return res.status(400).json({ success: false, message: "Match sudah dimulai atau selesai." });
        }

        if (match.player1.userId.toString() === req.userId) {
            return res.status(400).json({ success: false, message: "Anda tidak bisa join match sendiri." });
        }

        const kuis = await Kuis.findById(match.kuis);

        const attempt = new KuisAttempt({
            user: req.userId,
            kuis: match.kuis,
            mode: 'match',
            matchId: match._id,
            opponent: match.player1.userId,
            totalScore: kuis.totalPoints
        });

        await attempt.save();

        match.player2 = {
            userId: req.userId,
            attemptId: attempt._id,
            joinedAt: new Date()
        };
        match.status = 'in_progress';
        match.startedAt = new Date();

        await match.save();

        res.json({
            success: true,
            data: {
                matchId: match._id,
                attemptId: attempt._id,
                opponent: {
                    userId: match.player1.userId,
                    attemptId: match.player1.attemptId
                },
                status: 'in_progress'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal join match." });
    }
});

route.post("/match/submit/:attemptId", verifyToken, async (req, res) => {
    try {
        const { answers, timeSpent } = req.body;
        const attempt = await KuisAttempt.findById(req.params.attemptId)
            .populate('kuis');

        if (!attempt) {
            return res.status(404).json({ success: false, message: "Attempt tidak ditemukan." });
        }

        if (attempt.user.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Anda tidak memiliki akses." });
        }

        // Grade answers (same logic as solo)
        let score = 0;
        const processedAnswers = answers.map(answer => {
            const question = attempt.kuis.questions.find(q => q.id === answer.questionId);
            if (!question) return answer;

            let isCorrect = false;
            let pointsEarned = 0;

            if (question.type === 'matching') {
                isCorrect = answer.selectedAnswers[0] === question.pairs[0].correctMatch;
            } else if (question.type === 'multiple_complex') {
                const correctIds = question.options
                    .filter(opt => opt.isCorrect)
                    .map(opt => opt.id);
                isCorrect = JSON.stringify(answer.selectedAnswers.sort()) === 
                           JSON.stringify(correctIds.sort());
            } else {
                isCorrect = question.options.find(opt => opt.isCorrect)?.id === answer.selectedAnswers[0];
            }

            if (isCorrect) {
                pointsEarned = question.points || 10;
                score += pointsEarned;
            }

            return {
                questionId: answer.questionId,
                selectedAnswers: answer.selectedAnswers,
                isCorrect,
                pointsEarned
            };
        });

        attempt.answers = processedAnswers;
        attempt.score = score;
        attempt.timeSpent = timeSpent;
        attempt.status = 'completed';
        attempt.completedAt = new Date();

        await attempt.save();

        const match = await KuisMatch.findById(attempt.matchId);
        if (match.player1.attemptId.toString() === req.params.attemptId) {
            match.player1.score = score;
            match.player1.finishedAt = new Date();
            if (!match.firstFinished) {
                match.firstFinished = match.player1.userId;
                match.firstFinishedTime = timeSpent;
            }
        } else {
            match.player2.score = score;
            match.player2.finishedAt = new Date();
            if (!match.firstFinished) {
                match.firstFinished = match.player2.userId;
                match.firstFinishedTime = timeSpent;
            }
        }

        // Check if both players finished
        if (match.player1.finishedAt && match.player2.finishedAt) {
            match.status = 'completed';
            match.completedAt = new Date();
            match.winner = match.player1.score > match.player2.score ? match.player1.userId :
                          match.player2.score > match.player1.score ? match.player2.userId : null;
        }

        await match.save();

        // Add XP
        const user = await User.findById(req.userId);
        user.addXP(Math.floor(score / 2));
        await user.save();

        res.json({
            success: true,
            message: "Jawaban berhasil disubmit!",
            data: {
                score,
                totalScore: attempt.totalScore,
                timeSpent
            }
        });
    } catch (error) {
        console.error("Match submit error:", error);
        res.status(500).json({ success: false, message: "Gagal mensubmit jawaban." });
    }
});

route.get("/match/:matchId", verifyToken, async (req, res) => {
    try {
        const match = await KuisMatch.findById(req.params.matchId)
            .populate('player1.userId', 'displayName avatar')
            .populate('player2.userId', 'displayName avatar');

        if (!match) {
            return res.status(404).json({ success: false, message: "Match tidak ditemukan." });
        }

        res.json({
            success: true,
            data: match
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengambil data match." });
    }
});


// Add this route to apiKuis.js

// Get quiz attempt for player
route.get("/attempt/:attemptId", verifyToken, async (req, res) => {
    try {
        const attempt = await KuisAttempt.findById(req.params.attemptId);

        if (!attempt) {
            return res.status(404).json({ success: false, message: "Attempt tidak ditemukan." });
        }

        if (attempt.user.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Anda tidak memiliki akses." });
        }

        const kuis = await Kuis.findById(attempt.kuis);

        if (!kuis) {
            return res.status(404).json({ success: false, message: "Kuis tidak ditemukan." });
        }

        res.json({
            success: true,
            data: {
                attemptId: attempt._id,
                duration: kuis.duration,
                kuisTitle: kuis.title,
                kuisSubject: kuis.subject,
                questions: kuis.questions.map(q => ({
                    id: q.id,
                    type: q.type,
                    question: q.question,
                    image: q.image,
                    points: q.points,
                    options: q.type === 'multiple_choice' || q.type === 'multiple_complex' ? q.options : null,
                    pairs: q.type === 'matching' ? q.pairs : null
                })),
                totalQuestions: kuis.questions.length,
                totalPoints: kuis.totalPoints
            }
        });
    } catch (error) {
        console.error("Get attempt error:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil attempt." });
    }
});

// Get attempt results
route.get("/attempt/:attemptId/results", verifyToken, async (req, res) => {
    try {
        const attempt = await KuisAttempt.findById(req.params.attemptId)
            .populate('kuis')
            .populate('user', 'displayName avatar');

        if (!attempt) {
            return res.status(404).json({ success: false, message: "Attempt tidak ditemukan." });
        }

        if (attempt.user._id.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Anda tidak memiliki akses." });
        }

        const percentage = (attempt.score / attempt.totalScore * 100).toFixed(2);

        // Determine grade
        let grade = 'F';
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';

        res.json({
            success: true,
            data: {
                attemptId: attempt._id,
                quizTitle: attempt.kuis.title,
                quizSubject: attempt.kuis.subject,
                score: attempt.score,
                totalScore: attempt.totalScore,
                percentage: parseFloat(percentage),
                grade,
                timeSpent: attempt.timeSpent,
                totalTime: attempt.kuis.duration,
                status: attempt.status,
                mode: attempt.mode,
                completedAt: attempt.completedAt,
                answers: attempt.answers,
                user: {
                    displayName: attempt.user.displayName,
                    avatar: attempt.user.avatar
                }
            }
        });
    } catch (error) {
        console.error("Get results error:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil hasil." });
    }
});

// Get match details for watching
route.get("/match/watch/:matchId", verifyToken, async (req, res) => {
    try {
        const match = await KuisMatch.findById(req.params.matchId)
            .populate('player1.userId', 'displayName avatar level')
            .populate('player2.userId', 'displayName avatar level')
            .populate('kuis', 'title subject');

        if (!match) {
            return res.status(404).json({ success: false, message: "Match tidak ditemukan." });
        }

        // Check if user is participant or admin
        const isParticipant = match.player1.userId._id.toString() === req.userId ||
                            (match.player2.userId && match.player2.userId._id.toString() === req.userId);
        
        if (!isParticipant) {
            const user = await User.findById(req.userId);
            if (!user.isAdmin()) {
                return res.status(403).json({ success: false, message: "Anda tidak memiliki akses." });
            }
        }

        res.json({
            success: true,
            data: {
                matchId: match._id,
                quizTitle: match.kuis.title,
                quizSubject: match.kuis.subject,
                status: match.status,
                player1: {
                    userId: match.player1.userId._id,
                    displayName: match.player1.userId.displayName,
                    avatar: match.player1.userId.avatar,
                    level: match.player1.userId.level,
                    score: match.player1.score,
                    finishedAt: match.player1.finishedAt,
                    joinedAt: match.player1.joinedAt
                },
                player2: match.player2.userId ? {
                    userId: match.player2.userId._id,
                    displayName: match.player2.userId.displayName,
                    avatar: match.player2.userId.avatar,
                    level: match.player2.userId.level,
                    score: match.player2.score,
                    finishedAt: match.player2.finishedAt,
                    joinedAt: match.player2.joinedAt
                } : null,
                winner: match.winner,
                firstFinished: match.firstFinished,
                firstFinishedTime: match.firstFinishedTime,
                startedAt: match.startedAt,
                completedAt: match.completedAt,
                duration: match.duration
            }
        });
    } catch (error) {
        console.error("Watch match error:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil data match." });
    }
});


export default route;