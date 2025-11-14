import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./konfigurasi/database.js";
import prosesHalaman, { watchFiles } from "./konfigurasi/prosesHalaman.js";

import { default as APIroute } from "./api.js";
import { redirectIfAuth, requireAuth } from "./middleware/auth.js";
import UserRoute from "./uRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Watch files
watchFiles();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-session-key-ganti-ini',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/aplikasi_belajar',
        touchAfter: 24 * 3600 // lazy session update (seconds)
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.ENV === 'PROD', // true di production
        sameSite: 'lax'
    }
}));

// Routes
app.use("/api", APIroute);
app.use("/u", requireAuth, UserRoute); // Protected route

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Public routes
app.get("/", (req, res) => {
    res.send(prosesHalaman("utama"));
});

app.get("/login", redirectIfAuth, (req, res) => {
    res.send(prosesHalaman("login"));
});

app.get("/daftar", redirectIfAuth, (req, res) => {
    res.send(prosesHalaman("daftar"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server',
        error: process.env.ENV === 'DEV' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route tidak ditemukan'
    });
});

export default app;

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server aktif pada http://localhost:${port}/`);
});