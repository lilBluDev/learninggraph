import jwt from 'jsonwebtoken';
import User from '../skema/user.js';

// Middleware untuk verifikasi JWT token
export const verifyToken = async (req, res, next) => {
    try {
        // Ambil token dari header, cookie, atau session
        const token = req.headers.authorization?.split(' ')[1] || 
                     req.cookies?.token || 
                     req.session?.token;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Akses ditolak. Token tidak ditemukan.' 
            });
        }

        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key-default-ganti-ini');
        
        // Cari user berdasarkan ID dari token
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User tidak ditemukan.' 
            });
        }

        // Attach user ke request
        req.user = user;
        req.userId = decoded.userId;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token telah kadaluarsa. Silakan login kembali.' 
            });
        }
        
        return res.status(401).json({ 
            success: false, 
            message: 'Token tidak valid.' 
        });
    }
};

// Middleware untuk cek apakah sudah login (untuk route HTML)
export const requireAuth = (req, res, next) => {
    console.log("Checking auth", req.session);
    if (!req.session?.userId) {
        return res.redirect('/login');
    }
    next();
};

// Middleware untuk redirect jika sudah login
export const redirectIfAuth = (req, res, next) => {
    if (req.session?.userId) {
        return res.redirect('/u');
    }
    next();
};

// Generate JWT token
export const generateToken = (userId) => {
    return jwt.sign(
        { userId }, 
        process.env.JWT_SECRET || 'secret-key-default-ganti-ini',
        { expiresIn: '7d' }
    );
};