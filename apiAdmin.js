import { Router } from "express";
import { verifyToken, isAdmin } from "./middleware/auth.js";
import User from "./skema/user.js";
import Kuis from "./skema/kuis.js";
import KuisAttempt from "./skema/kuisAttempt.js";
import KuisMatch from "./skema/kuisMatch.js";

const route = Router();

// ==================== STATS ====================
route.get("/stats", verifyToken, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalQuizzes = await Kuis.countDocuments();
        const totalAttempts = await KuisAttempt.countDocuments();
        const totalMatches = await KuisMatch.countDocuments();

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('-password');

        const recentQuizzes = await Kuis.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('createdBy', 'displayName');

        res.json({
            success: true,
            data: {
                totalUsers,
                totalQuizzes,
                totalAttempts,
                totalMatches,
                recentUsers,
                recentQuizzes
            }
        });
    } catch (error) {
        console.error("Stats error:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil statistik" });
    }
});

// ==================== USERS MANAGEMENT ====================
route.get("/users", verifyToken, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (page - 1) * limit;

        const filter = search ? {
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { displayName: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password');

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengambil daftar user" });
    }
});

route.get("/users/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('friends', 'displayName')
            .select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        const attempts = await KuisAttempt.countDocuments({ user: req.params.id });
        const matches = await KuisMatch.countDocuments({
            $or: [
                { 'player1.userId': req.params.id },
                { 'player2.userId': req.params.id }
            ]
        });

        res.json({
            success: true,
            data: {
                ...user.toObject(),
                totalAttempts: attempts,
                totalMatches: matches
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengambil detail user" });
    }
});

route.post("/users/:id/promote", verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        if (user.role === 'ADMIN') {
            return res.status(400).json({ success: false, message: "User sudah admin" });
        }

        user.role = 'ADMIN';
        await user.save();

        res.json({
            success: true,
            message: "User berhasil dipromosikan menjadi admin"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mempromosikan user" });
    }
});

route.post("/users/:id/demote", verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        if (user.role === 'USER') {
            return res.status(400).json({ success: false, message: "User bukan admin" });
        }

        user.role = 'USER';
        await user.save();

        res.json({
            success: true,
            message: "User berhasil diturunkan menjadi user biasa"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menurunkan user" });
    }
});

route.delete("/users/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        // Delete user's data
        await KuisAttempt.deleteMany({ user: req.params.id });
        await KuisMatch.deleteMany({
            $or: [
                { 'player1.userId': req.params.id },
                { 'player2.userId': req.params.id }
            ]
        });

        res.json({
            success: true,
            message: "User berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus user" });
    }
});

// ==================== QUIZZES MANAGEMENT ====================
route.get("/quizzes", verifyToken, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", subject = "" } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};

        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        if (subject) {
            filter.subject = subject;
        }

        const quizzes = await Kuis.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'displayName');

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
        res.status(500).json({ success: false, message: "Gagal mengambil daftar kuis" });
    }
});

route.delete("/quizzes/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const quiz = await Kuis.findByIdAndDelete(req.params.id);

        if (!quiz) {
            return res.status(404).json({ success: false, message: "Kuis tidak ditemukan" });
        }

        // Delete related attempts and matches
        const attempts = await KuisAttempt.find({ kuis: req.params.id });
        const attemptIds = attempts.map(a => a._id);
        await KuisAttempt.deleteMany({ kuis: req.params.id });
        await KuisMatch.deleteMany({ kuis: req.params.id });

        res.json({
            success: true,
            message: "Kuis berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus kuis" });
    }
});

route.get("/quizzes/:id/analytics", verifyToken, isAdmin, async (req, res) => {
    try {
        const quiz = await Kuis.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ success: false, message: "Kuis tidak ditemukan" });
        }

        const attempts = await KuisAttempt.find({ kuis: req.params.id })
            .populate('user', 'displayName');

        const matches = await KuisMatch.find({ kuis: req.params.id })
            .populate('player1.userId', 'displayName')
            .populate('player2.userId', 'displayName');

        const averageScore = attempts.length > 0
            ? (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length).toFixed(2)
            : 0;

        const averageTime = attempts.length > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.timeSpent, 0) / attempts.length)
            : 0;

        res.json({
            success: true,
            data: {
                quizTitle: quiz.title,
                totalAttempts: attempts.length,
                totalMatches: matches.length,
                averageScore,
                averageTime,
                attempts,
                matches
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengambil analitik kuis" });
    }
});

// ==================== REPORTS ====================
route.get("/reports/daily", verifyToken, isAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newUsers = await User.countDocuments({
            createdAt: { $gte: today }
        });

        const newAttempts = await KuisAttempt.countDocuments({
            createdAt: { $gte: today }
        });

        const newMatches = await KuisMatch.countDocuments({
            createdAt: { $gte: today }
        });

        res.json({
            success: true,
            data: {
                date: today.toISOString().split('T')[0],
                newUsers,
                newAttempts,
                newMatches
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengambil laporan harian" });
    }
});

export default route;