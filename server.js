import { Redis } from "@upstash/redis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./konfigurasi/database.js";
import prosesHalaman from "./konfigurasi/prosesHalaman.js";

import { default as APIroute } from "./api.js";
import UpstashStore from "./konfigurasi/UpstashStore.js";
import { redirectIfAuth, requireAuth } from "./middleware/auth.js";
import UserRoute from "./uRoute.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------
// 1. Connect Mongo (works fine on Vercel serverless)
// ----------------------------------------------------
connectDB();

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

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
        sameSite: process.env.ENV !== "DEV" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        path: '/'
    }
};

// CRITICAL: Add domain for production
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
app.use("/public", express.static(path.join(__dirname, "public")));

// App routes
app.use("/api", APIroute);
app.use("/u", requireAuth, UserRoute);

app.get("/", (req, res) => {
    res.send(prosesHalaman("utama"));
});

app.get("/login", redirectIfAuth, (req, res) => {
    res.send(prosesHalaman("login"));
});

app.get("/daftar", redirectIfAuth, (req, res) => {
    res.send(prosesHalaman("daftar"));
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