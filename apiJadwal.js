// d:\web-lomba\apiJadwal.js
// API route for jadwal (events & todos) - Per User
import express from 'express';
import Event from './skema/jadwalEvent.js';
import Todo from './skema/jadwalTodo.js';
import { verifyToken } from './middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// --- Event Routes ---
// Get all events for logged-in user
router.get('/events', async (req, res) => {
    try {
        const events = await Event.find({ userId: req.userId })
            .sort({ date: 1, time: 1 });
        res.json(events);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Create event for logged-in user
router.post('/events', async (req, res) => {
    try {
        const eventData = { 
            ...req.body,
            userId: req.userId // Attach user ID
        };
        const event = new Event(eventData);
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(400).json({ error: 'Failed to create event', details: err.message });
    }
});

// Delete event (only if owned by user)
router.delete('/events/:id', async (req, res) => {
    try {
        const event = await Event.findOne({ 
            _id: req.params.id, 
            userId: req.userId 
        });
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found or unauthorized' });
        }
        
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(400).json({ error: 'Failed to delete event' });
    }
});

// --- Todo Routes ---
// Get all todos for logged-in user
router.get('/todos', async (req, res) => {
    try {
        const todos = await Todo.find({ userId: req.userId })
            .sort({ createdAt: -1 });
        res.json(todos);
    } catch (err) {
        console.error('Error fetching todos:', err);
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

// Create todo for logged-in user
router.post('/todos', async (req, res) => {
    try {
        const todoData = {
            ...req.body,
            userId: req.userId // Attach user ID
        };
        const todo = new Todo(todoData);
        await todo.save();
        res.status(201).json(todo);
    } catch (err) {
        console.error('Error creating todo:', err);
        res.status(400).json({ error: 'Failed to create todo' });
    }
});

// Update todo (only if owned by user)
router.put('/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findOne({ 
            _id: req.params.id, 
            userId: req.userId 
        });
        
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found or unauthorized' });
        }
        
        const updatedTodo = await Todo.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );
        res.json(updatedTodo);
    } catch (err) {
        console.error('Error updating todo:', err);
        res.status(400).json({ error: 'Failed to update todo' });
    }
});

// Delete todo (only if owned by user)
router.delete('/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findOne({ 
            _id: req.params.id, 
            userId: req.userId 
        });
        
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found or unauthorized' });
        }
        
        await Todo.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting todo:', err);
        res.status(400).json({ error: 'Failed to delete todo' });
    }
});

export default router;