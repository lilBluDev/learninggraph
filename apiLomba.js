// apiLomba.js - Create this new file
import { del, put } from '@vercel/blob';
import { Router } from 'express';
import formidable from 'formidable';
import { verifyToken } from './middleware/auth.js';
import Lomba from './skema/lomba.js';
import User from './skema/user.js';

const route = Router();

// Get all lombas
route.get('/', async (req, res) => {
    try {
        const lombas = await Lomba.find().sort({ createdAt: -1 });
        res.json(lombas);
    } catch (error) {
        console.error('Get lombas error:', error);
        res.status(500).json({ error: 'Failed to fetch lombas' });
    }
});

// Get lomba posters only (open endpoint for homepage)
route.get('/posters', async (req, res) => {
    try {
        // only approved lombas with a poster
        const lombas = await Lomba.find({ status: 'approved', poster: { $exists: true, $ne: null } })
            .select('poster title')
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();

        const data = lombas.map(l => ({ id: l._id, title: l.title, poster: l.poster }));
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get lomba posters error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch lomba posters' });
    }
});

// Get a single lomba by ID
route.get('/:id', async (req, res) => {
    try {
        const lomba = await Lomba.findById(req.params.id);
        if (!lomba) {
            return res.status(404).json({ error: 'Lomba not found' });
        }
        res.json(lomba);
    } catch (error) {
        console.error('Get lomba error:', error);
        res.status(500).json({ error: 'Failed to fetch lomba' });
    }
});

// Create a new lomba (with poster upload to Vercel Blob)
route.post('/', async (req, res) => {
    console.log('POST /lombas received');
    console.log('Content-Type:', req.headers['content-type']);
    
    // Check if it's JSON request (from frontend with base64)
    if (req.headers['content-type']?.includes('application/json')) {
        try {
            console.log('Processing JSON request');
            const { title, category, level, deadline, organizer, description, prize, contact, registrationLink, poster, status } = req.body;

            // Validate required fields
            if (!title || !category || !level || !deadline || !organizer || !description || !contact || !registrationLink) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'All required fields must be filled.' 
                });
            }

            let posterUrl = null;

            // Handle base64 poster
            if (poster && poster.startsWith('data:image')) {
                console.log('Uploading poster to Blob Storage...');
                const matches = poster.match(/^data:image\/(\w+);base64,(.+)$/);
                if (matches) {
                    const ext = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    const blob = await put(
                        `lombas/${Date.now()}_poster.${ext}`,
                        buffer,
                        {
                            access: 'public',
                            token: process.env.BLOB_READ_WRITE_TOKEN
                        }
                    );
                    
                    posterUrl = blob.url;
                    console.log('Poster uploaded:', posterUrl);
                }
            }

            // Create lomba document
            const lombaData = {
                title,
                category,
                level,
                deadline,
                organizer,
                description,
                prize: prize || '',
                contact,
                registrationLink,
                poster: posterUrl,
                status: status || 'pending'
            };

            const lomba = new Lomba(lombaData);
            await lomba.save();

            console.log('Lomba created successfully:', lomba._id);

            res.status(201).json({
                success: true,
                message: 'Lomba created successfully!',
                data: lomba
            });

        } catch (error) {
            console.error('Create lomba error (JSON):', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to create lomba', 
                details: error.message 
            });
        }
    } else {
        // Handle multipart/form-data
        const form = formidable({ 
            maxFileSize: 5 * 1024 * 1024,
            keepExtensions: true
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('Form parse error:', err);
                return res.status(400).json({ 
                    success: false, 
                    message: 'File too large or invalid.' 
                });
            }

            try {
                let posterUrl = null;

                if (files.poster) {
                    const file = Array.isArray(files.poster) ? files.poster[0] : files.poster;
                    
                    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.mimetype)) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' 
                        });
                    }

                    const fs = await import('fs');
                    const fileBuffer = await fs.promises.readFile(file.filepath);
                    
                    const blob = await put(
                        `lombas/${Date.now()}_${file.originalFilename || 'poster.jpg'}`,
                        fileBuffer,
                        {
                            access: 'public',
                            token: process.env.BLOB_READ_WRITE_TOKEN
                        }
                    );
                    
                    posterUrl = blob.url;
                }

                const getValue = (field) => Array.isArray(field) ? field[0] : field;

                const lombaData = {
                    title: getValue(fields.title),
                    category: getValue(fields.category),
                    level: getValue(fields.level),
                    deadline: getValue(fields.deadline),
                    organizer: getValue(fields.organizer),
                    description: getValue(fields.description),
                    prize: getValue(fields.prize) || '',
                    contact: getValue(fields.contact),
                    registrationLink: getValue(fields.registrationLink),
                    poster: posterUrl,
                    status: getValue(fields.status) || 'pending'
                };

                if (!lombaData.title || !lombaData.category || !lombaData.level || 
                    !lombaData.deadline || !lombaData.organizer || !lombaData.description || 
                    !lombaData.contact || !lombaData.registrationLink) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'All required fields must be filled.' 
                    });
                }

                const lomba = new Lomba(lombaData);
                await lomba.save();

                res.status(201).json({
                    success: true,
                    message: 'Lomba created successfully!',
                    data: lomba
                });

            } catch (error) {
                console.error('Create lomba error (multipart):', error);
                res.status(500).json({ 
                    success: false, 
                    error: 'Failed to create lomba', 
                    details: error.message 
                });
            }
        });
    }
});

// Update a lomba by ID
route.put('/:id', async (req, res) => {
    console.log('PUT /lombas/:id received');
    
    if (req.headers['content-type']?.includes('application/json')) {
        try {
            const lomba = await Lomba.findById(req.params.id);
            if (!lomba) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Lomba not found' 
                });
            }

            const { title, category, level, deadline, organizer, description, prize, contact, registrationLink, poster, status } = req.body;

            let posterUrl = lomba.poster;

            // Handle base64 poster
            if (poster && poster.startsWith('data:image')) {
                // Delete old poster
                if (lomba.poster) {
                    try {
                        await del(lomba.poster, {
                            token: process.env.BLOB_READ_WRITE_TOKEN
                        });
                    } catch (delError) {
                        console.error('Error deleting old poster:', delError);
                    }
                }

                const matches = poster.match(/^data:image\/(\w+);base64,(.+)$/);
                if (matches) {
                    const ext = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    const blob = await put(
                        `lombas/${Date.now()}_poster.${ext}`,
                        buffer,
                        {
                            access: 'public',
                            token: process.env.BLOB_READ_WRITE_TOKEN
                        }
                    );
                    
                    posterUrl = blob.url;
                }
            }

            // Update fields
            if (title) lomba.title = title;
            if (category) lomba.category = category;
            if (level) lomba.level = level;
            if (deadline) lomba.deadline = deadline;
            if (organizer) lomba.organizer = organizer;
            if (description) lomba.description = description;
            if (prize !== undefined) lomba.prize = prize;
            if (contact) lomba.contact = contact;
            if (registrationLink) lomba.registrationLink = registrationLink;
            if (status) lomba.status = status;
            lomba.poster = posterUrl;

            await lomba.save();

            res.json({
                success: true,
                message: 'Lomba updated successfully!',
                data: lomba
            });

        } catch (error) {
            console.error('Update lomba error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to update lomba',
                details: error.message 
            });
        }
    } else {
        const form = formidable({ 
            maxFileSize: 5 * 1024 * 1024,
            keepExtensions: true
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('Form parse error:', err);
                return res.status(400).json({ 
                    success: false, 
                    message: 'File too large or invalid.' 
                });
            }

            try {
                const lomba = await Lomba.findById(req.params.id);
                if (!lomba) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Lomba not found' 
                    });
                }

                let posterUrl = lomba.poster;

                if (files.poster) {
                    if (lomba.poster) {
                        try {
                            await del(lomba.poster, {
                                token: process.env.BLOB_READ_WRITE_TOKEN
                            });
                        } catch (delError) {
                            console.error('Error deleting old poster:', delError);
                        }
                    }

                    const file = Array.isArray(files.poster) ? files.poster[0] : files.poster;
                    
                    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.mimetype)) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Invalid file type.' 
                        });
                    }

                    const fs = await import('fs');
                    const fileBuffer = await fs.promises.readFile(file.filepath);
                    
                    const blob = await put(
                        `lombas/${Date.now()}_${file.originalFilename || 'poster.jpg'}`,
                        fileBuffer,
                        {
                            access: 'public',
                            token: process.env.BLOB_READ_WRITE_TOKEN
                        }
                    );
                    
                    posterUrl = blob.url;
                }

                const getValue = (field) => Array.isArray(field) ? field[0] : field;

                if (fields.title) lomba.title = getValue(fields.title);
                if (fields.category) lomba.category = getValue(fields.category);
                if (fields.level) lomba.level = getValue(fields.level);
                if (fields.deadline) lomba.deadline = getValue(fields.deadline);
                if (fields.organizer) lomba.organizer = getValue(fields.organizer);
                if (fields.description) lomba.description = getValue(fields.description);
                if (fields.prize !== undefined) lomba.prize = getValue(fields.prize);
                if (fields.contact) lomba.contact = getValue(fields.contact);
                if (fields.registrationLink) lomba.registrationLink = getValue(fields.registrationLink);
                if (fields.status) lomba.status = getValue(fields.status);
                lomba.poster = posterUrl;

                await lomba.save();

                res.json({
                    success: true,
                    message: 'Lomba updated successfully!',
                    data: lomba
                });

            } catch (error) {
                console.error('Update lomba error (multipart):', error);
                res.status(500).json({ 
                    success: false, 
                    error: 'Failed to update lomba',
                    details: error.message 
                });
            }
        });
    }
});

// Delete a lomba by ID
route.delete('/:id', async (req, res) => {
    try {
        const lomba = await Lomba.findById(req.params.id);
        if (!lomba) {
            return res.status(404).json({ 
                success: false, 
                error: 'Lomba not found' 
            });
        }

        // Delete poster from Vercel Blob if exists
        if (lomba.poster) {
            try {
                await del(lomba.poster, {
                    token: process.env.BLOB_READ_WRITE_TOKEN
                });
            } catch (delError) {
                console.error('Error deleting poster:', delError);
            }
        }

        await Lomba.findByIdAndDelete(req.params.id);

        res.json({ 
            success: true, 
            message: 'Lomba deleted successfully' 
        });

    } catch (error) {
        console.error('Delete lomba error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete lomba' 
        });
    }
});

// Approve lomba (admin only)
route.patch('/:id/approve', verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized. Admin access required.' 
            });
        }

        const lomba = await Lomba.findById(req.params.id);
        if (!lomba) {
            return res.status(404).json({ 
                success: false, 
                error: 'Lomba not found' 
            });
        }

        lomba.status = 'approved';
        await lomba.save();

        res.json({
            success: true,
            message: 'Lomba approved successfully!',
            data: lomba
        });

    } catch (error) {
        console.error('Approve lomba error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to approve lomba' 
        });
    }
});

export default route;