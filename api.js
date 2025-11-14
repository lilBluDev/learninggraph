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
            selectedSubjects: selectedSubjects || []
        });

        await user.save();

        // Create JWT
        const token = generateToken(user._id);

        // Save to session (ONLY userId)
        req.session.userId = user._id;

        req.session.save(() => {
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                maxAge: 1000 * 60 * 60 * 24 * 7,
            });

            res.status(201).json({
                success: true,
                message: "Pendaftaran berhasil!",
                data: { token, user: user.toPublicJSON() }
            });
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

        // Only store userId in session
        req.session.userId = user._id;

        req.session.save(() => {
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
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
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat login." });
    }
});


// Logout
route.post("/logout", verifyToken, (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.clearCookie("token");

        res.json({
            success: true,
            message: "Logout berhasil!"
        });
    });
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