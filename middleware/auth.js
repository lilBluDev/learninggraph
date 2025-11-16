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
        console.error("Token verification error:", error);
        return res.status(401).json({ success: false, message: "Token tidak valid atau kadaluarsa." });
    }
};


// ================================
// SESSION AUTH (HTML PAGES)
// ================================
export const requireAuth = async (req, res, next) => {
    try {
        console.log('=== RequireAuth Check ===');
        console.log('Session ID:', req.sessionID);
        console.log('Session:', req.session);
        console.log('Cookies:', req.cookies);
        
        // Check session
        if (!req.session || !req.session.userId) {
            console.log('No session or userId found - redirecting to login');
            return res.redirect("/login");
        }

        console.log('Found userId in session:', req.session.userId);

        // Optional: Verify user still exists
        const user = await User.findById(req.session.userId);
        if (!user) {
            console.log('User not found in database - destroying session');
            req.session.destroy(() => {
                res.redirect("/login");
            });
            return;
        }

        console.log('User authenticated:', user.username);
        req.userId = req.session.userId;
        next();
    } catch (error) {
        console.error("RequireAuth error:", error);
        res.redirect("/login");
    }
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
        { userId: userId.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};