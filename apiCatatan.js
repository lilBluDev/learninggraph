import { Router } from "express";
import { verifyToken } from "./middleware/auth.js";
import Catatan from "./skema/catatan.js";

const route = Router();

// Get all catatan milik user (dengan filter)
route.get("/", verifyToken, async (req, res) => {
    try {        
        const { mataPelajaran, tag, search, archived } = req.query;
        
        let filter = { 
            userId: req.userId,
            isArchived: archived === 'true' ? true : false
        };

        if (mataPelajaran) filter.mataPelajaran = mataPelajaran;
        if (tag) filter.tags = tag;
        if (search) {
            filter.$or = [
                { judul: { $regex: search, $options: 'i' } },
                { konten: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        const catatan = await Catatan.find(filter)
            .sort({ isPinned: -1, lastEdited: -1 })
            .select('-konten') // Tidak load konten lengkap untuk list
            .lean();

        res.json({
            success: true,
            data: catatan
        });

    } catch (error) {
        console.error('Get catatan error:', error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil catatan: " + error.message
        });
    }
});

// Get single catatan by ID
route.get("/:id", verifyToken, async (req, res) => {
    try {
        const catatan = await Catatan.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!catatan) {
            return res.status(404).json({
                success: false,
                message: "Catatan tidak ditemukan."
            });
        }

        res.json({
            success: true,
            data: catatan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil catatan."
        });
    }
});

// Create new catatan
route.post("/", verifyToken, async (req, res) => {
    try {
        const { judul, mataPelajaran, konten, tags, warna } = req.body;

        if (!judul || !mataPelajaran || !konten) {
            return res.status(400).json({
                success: false,
                message: "Judul, mata pelajaran, dan konten wajib diisi."
            });
        }

        const catatan = new Catatan({
            userId: req.userId,
            judul,
            mataPelajaran,
            konten,
            tags: tags || [],
            warna: warna || '#667eea'
        });

        await catatan.save();

        res.status(201).json({
            success: true,
            message: "Catatan berhasil dibuat!",
            data: catatan
        });

    } catch (error) {
        console.error('Create catatan error:', error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat catatan."
        });
    }
});

// Update catatan
route.put("/:id", verifyToken, async (req, res) => {
    try {
        const { judul, mataPelajaran, konten, tags, warna, isPinned } = req.body;

        const catatan = await Catatan.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!catatan) {
            return res.status(404).json({
                success: false,
                message: "Catatan tidak ditemukan."
            });
        }

        if (judul !== undefined) catatan.judul = judul;
        if (mataPelajaran !== undefined) catatan.mataPelajaran = mataPelajaran;
        if (konten !== undefined) catatan.konten = konten;
        if (tags !== undefined) catatan.tags = tags;
        if (warna !== undefined) catatan.warna = warna;
        if (isPinned !== undefined) catatan.isPinned = isPinned;

        await catatan.save();

        res.json({
            success: true,
            message: "Catatan berhasil diupdate!",
            data: catatan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengupdate catatan."
        });
    }
});

// Archive/Unarchive catatan
route.patch("/:id/archive", verifyToken, async (req, res) => {
    try {
        const catatan = await Catatan.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!catatan) {
            return res.status(404).json({
                success: false,
                message: "Catatan tidak ditemukan."
            });
        }

        catatan.isArchived = !catatan.isArchived;
        await catatan.save();

        res.json({
            success: true,
            message: catatan.isArchived ? "Catatan diarsipkan!" : "Catatan dipulihkan!",
            data: catatan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengarsipkan catatan."
        });
    }
});

// Delete catatan
route.delete("/:id", verifyToken, async (req, res) => {
    try {
        const catatan = await Catatan.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!catatan) {
            return res.status(404).json({
                success: false,
                message: "Catatan tidak ditemukan."
            });
        }

        res.json({
            success: true,
            message: "Catatan berhasil dihapus!"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal menghapus catatan."
        });
    }
});

// Get statistics
route.get("/stats/summary", verifyToken, async (req, res) => {
    try {
        const stats = await Catatan.aggregate([
            { $match: { userId: req.userId, isArchived: false } },
            { 
                $group: {
                    _id: '$mataPelajaran',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const totalCatatan = await Catatan.countDocuments({ 
            userId: req.userId, 
            isArchived: false 
        });

        res.json({
            success: true,
            data: {
                total: totalCatatan,
                bySubject: stats
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil statistik."
        });
    }
});

export default route;