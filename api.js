import { Router } from "express";
import catatanRoute from "./apiCatatan.js";
import { generateToken, verifyToken } from "./middleware/auth.js";
import User from "./skema/user.js";

const route = Router();

route.use("/catatan", catatanRoute);

// Register
route.post("/register", async (req, res) => {
    try {
        const { username, displayName, email, password, selectedSubjects } = req.body;

        // Validasi input
        if (!username || !displayName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Semua field wajib diisi."
            });
        }

        // Cek apakah username atau email sudah ada
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.username === username 
                    ? "Username sudah digunakan." 
                    : "Email sudah terdaftar."
            });
        }

        // Buat user baru
        const user = new User({
            username,
            displayName,
            email,
            password,
            selectedSubjects: selectedSubjects || []
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Simpan ke session
        req.session.userId = user._id;
        req.session.token = token;

        res.status(201).json({
            success: true,
            message: "Pendaftaran berhasil!",
            data: {
                token,
                user: user.toPublicJSON()
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mendaftar.",
            error: error.message
        });
    }
});

// Login
route.post("/login", async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Username/email dan password wajib diisi."
            });
        }

        // Cari user berdasarkan username atau email
        const user = await User.findOne({
            $or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Username/email atau password salah."
            });
        }

        // Cek password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Username/email atau password salah."
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Simpan ke session
        req.session.userId = user._id;
        req.session.token = token;

        res.json({
            success: true,
            message: "Login berhasil!",
            data: {
                token,
                user: user.toPublicJSON()
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat login.",
            error: error.message
        });
    }
});

// Logout
route.post("/logout", verifyToken, async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Gagal logout."
                });
            }

            res.clearCookie('connect.sid');
            res.json({
                success: true,
                message: "Logout berhasil!"
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat logout."
        });
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



export default route;