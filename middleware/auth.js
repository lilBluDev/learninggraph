import jwt from 'jsonwebtoken';
import User from '../skema/user.js';

// ================================
// JWT MIDDLEWARE (API PROTECTION)
// ================================
export const verifyToken = async (req, res, next) => {
    try {
        const token =
            req.headers.authorization?.split(" ")[1] ||
            req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token tidak ditemukan."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ success: false, message: "User tidak ditemukan." });
        }

        req.user = user;
        req.userId = decoded.userId;

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token tidak valid atau kadaluarsa." });
    }
};


// ================================
// SESSION AUTH (HTML PAGES)
// ================================
export const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect("/login");
    }
    next();
};

export const redirectIfAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.redirect("/u");
    }
    next();
};

// ================================
// JWT GENERATOR
// ================================
export const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};
