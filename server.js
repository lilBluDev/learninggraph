import { Redis } from "@upstash/redis";
import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./konfigurasi/database.js";
import prosesHalaman, { watchFiles } from "./konfigurasi/prosesHalaman.js";

import { default as APIroute } from "./api.js";
import apiJadwal from './apiJadwal.js';
import UpstashStore from "./konfigurasi/UpstashStore.js";
import { redirectIfAuth, requireAuth } from "./middleware/auth.js";
import UserRoute from "./uRoute.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Performance: Enable compression early
const compressionMiddleware = compression({
    threshold: 1024, // Only compress responses > 1KB
    level: 6, // Balance between compression ratio and speed
});

// ----------------------------------------------------
// 1. Connect Mongo (works fine on Vercel serverless)
// ----------------------------------------------------
connectDB();
watchFiles();

// ----------------------------------------------------
// 2. Initialize Redis Session Store (REQUIRED FOR VERCEL)
// ----------------------------------------------------
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const sessionStore = new UpstashStore({ client: redis })

// ----------------------------------------------------
const app = express();

// Performance: Apply compression middleware first
app.use(compressionMiddleware);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ----------------------------------------------------
// Fix for Vercel: sessions MUST use Redis
// ----------------------------------------------------
const sessionConfig = {
    name: 'sessionId', // IMPORTANT: Explicit session cookie name
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        secure: process.env.ENV !== "DEV",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        path: '/'
    }
};

// CRITICAL: Add domain for production
app.use('/api/jadwal', apiJadwal);
if (process.env.ENV === "PROD" && process.env.COOKIE_DOMAIN) {
    sessionConfig.cookie.domain = process.env.COOKIE_DOMAIN;
}

app.use(session(sessionConfig));

// Debug middleware (remove in production)
app.use((req, res, next) => {
    // console.log('Incoming request:', {
    //     method: req.method,
    //     path: req.path,
    //     sessionID: req.sessionID,
    //     hasSession: !!req.session,
    //     cookies: req.cookies
    // });
    next();
});

// Static files
app.use("/public", express.static(path.join(__dirname, "public"), {
    maxAge: "1d", // Cache static files for 1 day
    etag: false, // Disable ETag for performance
    lastModified: false
}));

// Also serve public files at the root path so assets work whether
// HTML references "/public/asset" or "/asset" (helps some deployments).
app.use(express.static(path.join(__dirname, "public"), {
    maxAge: "1d",
    etag: false,
    lastModified: false
}));
// App routes
app.use("/api", APIroute);
app.use("/u", requireAuth, UserRoute);

// Cache control middleware for public pages
const setCacheHeaders = (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=300"); // 5 minutes cache
    next();
};

app.get("/", setCacheHeaders, (req, res) => {
    res.send(prosesHalaman("utama"));
});

app.get("/matapelajaran", setCacheHeaders, (req, res) => {
    res.send(prosesHalaman("mataPelajaran"));
});

app.get("/ulasan", setCacheHeaders, (req, res) => {
    res.send(prosesHalaman("ulasan"));
});

app.get("/kontak", setCacheHeaders, (req, res) => {
    res.send(prosesHalaman("kontak"));
});

app.get("/daftarlogin", redirectIfAuth, (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(prosesHalaman("daftarlogin"));
});

app.get("/login", redirectIfAuth, (req, res) => {
    res.redirect("/daftarlogin");
});

app.get("/daftar", redirectIfAuth, (req, res) => {
    res.redirect("/daftarlogin");
});

// 500 Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
        error: process.env.ENV === "DEV" ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route tidak ditemukan"
    });
});

if (process.env.ENV !== "PROD") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}

// ----------------------------------------------------
// ⚠ Vercel: DO NOT CALL app.listen()
// ----------------------------------------------------
export default app;