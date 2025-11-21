// d:\web-lomba\apiJadwal.js
// API route for jadwal (events & todos)
import express from 'express';
import Event from './skema/jadwalEvent.js';
import Todo from './skema/jadwalTodo.js';

const router = express.Router();

// --- Event Routes ---
router.get('/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1, time: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Create event with poster upload
router.post('/events', async (req, res) => {
    try {
        const eventData = { ...req.body };
        const event = new Event(eventData);
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create event', details: err.message });
    }
});

router.delete('/events/:id', async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Failed to delete event' });
    }
});

// --- Todo Routes ---
router.get('/todos', async (req, res) => {
    try {
        const todos = await Todo.find();
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

router.post('/todos', async (req, res) => {
    try {
        const todo = new Todo(req.body);
        await todo.save();
        res.status(201).json(todo);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create todo' });
    }
});

router.put('/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(todo);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update todo' });
    }
});

router.delete('/todos/:id', async (req, res) => {
    try {
        await Todo.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Failed to delete todo' });
    }
});

export default router;
