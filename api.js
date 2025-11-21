import { del, put } from '@vercel/blob';
import { Router } from "express";
import formidable from 'formidable';
import multer from 'multer';
import catatanRoute from "./apiCatatan.js";
import friendRoute from './apiFriend.js';
import kuisRoute from './apiKuis.js';
import lombaRoute from './apiLomba.js';
import postRoute from './apiPost.js';
import { generateToken, verifyToken } from "./middleware/auth.js";
import User from "./skema/user.js";

const route = Router();

route.use("/kuis", kuisRoute);
route.use("/friends", friendRoute);
route.use("/lombas", lombaRoute);
route.use("/catatan", catatanRoute);
route.use('/posts', postRoute);

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

route.post("/register", async (req, res) => {
    try {
        const { username, displayName, email, password, selectedSubjects } = req.body;

        if (!username || !displayName || !email || !password) {
            return res.status(400).json({ success: false, message: "Semua field wajib diisi." });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.username === username
                    ? "Username sudah digunakan."
                    : "Email sudah terdaftar."
            });
        }

        const user = new User({
            username,
            displayName,
            email,
            password,
            selectedSubjects: selectedSubjects || [],
            role: 'USER' // explicitly set default role on registration
        });

        await user.save();

        // Create JWT
        const token = generateToken(user._id);

        // CRITICAL: Regenerate session to avoid fixation attacks and ensure clean state
        await new Promise((resolve, reject) => {
            req.session.regenerate((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Save userId to session
        req.session.userId = user._id.toString();

        // Save session explicitly
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    reject(err);
                } else {
                    console.log('Session saved successfully');
                    resolve();
                }
            });
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.ENV !== "DEV",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        res.status(201).json({
            success: true,
            message: "Pendaftaran berhasil!",
            data: { token, user: user.toPublicJSON() }
        });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat mendaftar." });
    }
});


// Login
route.post("/login", async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        const user = await User.findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
        });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: "Username/email atau password salah."
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);

        // Only store userId in session (as string)
        req.session.userId = user._id.toString();

        // CRITICAL: Use Promise-based session save for Vercel
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.ENV !== "DEV",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        res.json({
            success: true,
            message: "Login berhasil!",
            data: {
                token,
                userid: user._id,
                user: user.toPublicJSON()
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat login." });
    }
});


// Logout
route.post("/logout", verifyToken, async (req, res) => {
    try {
        // CRITICAL: Use Promise-based session destroy for Vercel
        await new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.clearCookie("connect.sid");
        res.json({ success: true, message: "Logout berhasil!" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat logout." });
    }
});

// Get current user data
route.get("/user", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('friends', 'username displayName avatar')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan."
            });
        }

        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                description: user.description,
                level: user.level,
                xp: user.xp,
                friends: user.friends || [],
                selectedSubjects: user.selectedSubjects || [],
                avatar: user.avatar,
                achievements: user.achievements || [],
                notifications: user.notifications || [],
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil data user." });
    }
});

// Get current user profile
route.get("/me", verifyToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user.toPublicJSON()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data profile."
        });
    }
});

// Update profile
route.put("/profile", verifyToken, async (req, res) => {
    try {
        const { displayName, description, selectedSubjects } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan."
            });
        }

        if (displayName) user.displayName = displayName;
        if (description !== undefined) user.description = description;
        if (selectedSubjects) user.selectedSubjects = selectedSubjects;

        await user.save();

        res.json({
            success: true,
            message: "Profile berhasil diupdate!",
            data: {
                user: user.toPublicJSON()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal update profile."
        });
    }
});

// Add friend
route.post("/friend/add/:friendId", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const friendId = req.params.friendId;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan."
            });
        }

        if (user.friends.includes(friendId)) {
            return res.status(400).json({
                success: false,
                message: "Sudah berteman dengan user ini."
            });
        }

        user.friends.push(friendId);
        await user.save();

        res.json({
            success: true,
            message: "Berhasil menambahkan teman!",
            data: {
                friends: user.friends
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal menambahkan teman."
        });
    }
});

// Add XP
route.post("/xp/add", verifyToken, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan."
            });
        }

        user.addXP(amount || 10);
        await user.save();

        res.json({
            success: true,
            message: `Berhasil menambahkan ${amount || 10} XP!`,
            data: {
                xp: user.xp,
                level: user.level
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal menambahkan XP."
        });
    }
});

// Upload user avatar (Vercel Blob Storage)
route.post('/user/avatar', verifyToken, async (req, res) => {
    const form = formidable({ maxFileSize: 1 * 1024 * 1024 }); // 1MB limit
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({ success: false, message: 'File too large or invalid.' });
        }
        const file = files.avatar;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            return res.status(400).json({ success: false, message: 'Invalid file type.' });
        }
        try {
            const user = await User.findById(req.userId);
            if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
            // Delete old avatar if not default
            if (user.avatar && !user.avatar.includes('defaultp')) {
                try { await del(user.avatar); } catch (e) { /* ignore */ }
            }
            // Upload new avatar
            const blob = await put(`avatars/${user._id}_${Date.now()}`, file.filepath, { access: 'public' });
            user.avatar = blob.url;
            await user.save();
            res.json({ success: true, url: blob.url });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Upload failed.' });
        }
    });
});


export default route;