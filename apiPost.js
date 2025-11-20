import { Router } from 'express';
import { verifyToken } from './middleware/auth.js';
import Post from './skema/post.js';

const route = Router();

// Create a new post
route.post('/', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || content.length > 500) {
            return res.status(400).json({ success: false, message: 'Content required, max 500 chars.' });
        }
        const post = new Post({
            content,
            author: req.userId
        });
        await post.save();
        await post.populate('author', 'username displayName avatar');
        res.json({ success: true, post });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to create post.' });
    }
});

// List all posts (newest first)
route.get('/', verifyToken, async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('author', 'username displayName avatar')
            .lean();
        res.json({ success: true, posts });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch posts.' });
    }
});

// Edit a post (only author)
route.put('/:id', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
        if (String(post.author) !== req.userId) {
            return res.status(403).json({ success: false, message: 'Not your post.' });
        }
        if (!content || content.length > 500) {
            return res.status(400).json({ success: false, message: 'Content required, max 500 chars.' });
        }
        post.content = content;
        post.updatedAt = new Date();
        await post.save();
        res.json({ success: true, post });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to edit post.' });
    }
});

// Delete a post (only author)
route.delete('/:id', verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
        if (String(post.author) !== req.userId) {
            return res.status(403).json({ success: false, message: 'Not your post.' });
        }
        await post.deleteOne();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to delete post.' });
    }
});

// Like a post
route.post('/:id/like', verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
        // Remove dislike if exists
        post.dislikes = post.dislikes.filter(u => String(u) !== req.userId);
        // Toggle like
        if (post.likes.some(u => String(u) === req.userId)) {
            post.likes = post.likes.filter(u => String(u) !== req.userId);
        } else {
            post.likes.push(req.userId);
        }
        await post.save();
        res.json({ success: true, likes: post.likes.length, dislikes: post.dislikes.length });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to like post.' });
    }
});

// Dislike a post
route.post('/:id/dislike', verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
        // Remove like if exists
        post.likes = post.likes.filter(u => String(u) !== req.userId);
        // Toggle dislike
        if (post.dislikes.some(u => String(u) === req.userId)) {
            post.dislikes = post.dislikes.filter(u => String(u) !== req.userId);
        } else {
            post.dislikes.push(req.userId);
        }
        await post.save();
        res.json({ success: true, likes: post.likes.length, dislikes: post.dislikes.length });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to dislike post.' });
    }
});

export default route;
