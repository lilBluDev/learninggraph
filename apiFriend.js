// apiFriend.js - API Endpoint untuk Sistem Pertemanan
import { Router } from 'express';
import mongoose from 'mongoose';
import { verifyToken } from './middleware/auth.js';
import User from './skema/user.js';

const route = Router();

// ============================================
// Friend Request Schema
// ============================================
const friendRequestSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Prevent duplicate requests
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

const FriendRequest = mongoose.models.FriendRequest || mongoose.model('FriendRequest', friendRequestSchema);

// ============================================
// ENDPOINTS
// ============================================

// 1. Search users by username or display name
route.get('/search', verifyToken, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ success: true, users: [] });
        }

        const currentUser = await User.findById(req.userId);
        
        if (!currentUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Find users matching search query (exclude current user)
        const users = await User.find({
            _id: { $ne: req.userId },
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { displayName: { $regex: q, $options: 'i' } }
            ]
        })
        .select('username displayName avatar level xp')
        .limit(20)
        .lean();

        // Add friendship status to each user
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            // Check if already friends
            const isFriend = currentUser.friends.some(
                friendId => friendId.toString() === user._id.toString()
            );

            let requestStatus = null;
            
            if (!isFriend) {
                // Check if there's a pending request sent by current user
                const sentRequest = await FriendRequest.findOne({
                    from: req.userId,
                    to: user._id,
                    status: 'pending'
                });

                // Check if there's a pending request received from this user
                const receivedRequest = await FriendRequest.findOne({
                    from: user._id,
                    to: req.userId,
                    status: 'pending'
                });

                if (sentRequest) requestStatus = 'sent';
                if (receivedRequest) requestStatus = 'received';
            }

            return {
                ...user,
                isFriend,
                requestStatus
            };
        }));

        res.json({ success: true, users: usersWithStatus });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ success: false, message: 'Failed to search users' });
    }
});

// 2. Get friend list
route.get('/list', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('friends', 'username displayName avatar level xp lastLogin')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, friends: user.friends || [] });
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ success: false, message: 'Failed to get friends' });
    }
});

// 3. Send friend request
route.post('/request', verifyToken, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }

        if (userId === req.userId) {
            return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
        }

        // Check if target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const currentUser = await User.findById(req.userId);

        // Check if already friends
        if (currentUser.friends.includes(userId)) {
            return res.status(400).json({ success: false, message: 'Already friends' });
        }

        // Check for existing pending request (either direction)
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { from: req.userId, to: userId, status: 'pending' },
                { from: userId, to: req.userId, status: 'pending' }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ 
                success: false, 
                message: 'Friend request already exists' 
            });
        }

        // Create new friend request
        const friendRequest = new FriendRequest({
            from: req.userId,
            to: userId
        });

        await friendRequest.save();

        res.json({ 
            success: true, 
            message: 'Friend request sent!',
            request: friendRequest
        });
    } catch (error) {
        console.error('Send friend request error:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Friend request already exists' 
            });
        }
        
        res.status(500).json({ success: false, message: 'Failed to send friend request' });
    }
});

// 4. Get pending friend requests (received)
route.get('/requests/received', verifyToken, async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            to: req.userId,
            status: 'pending'
        })
        .populate('from', 'username displayName avatar level xp')
        .sort({ createdAt: -1 })
        .lean();

        res.json({ success: true, requests });
    } catch (error) {
        console.error('Get received requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to get requests' });
    }
});

// 5. Get sent friend requests
route.get('/requests/sent', verifyToken, async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            from: req.userId,
            status: 'pending'
        })
        .populate('to', 'username displayName avatar level xp')
        .sort({ createdAt: -1 })
        .lean();

        res.json({ success: true, requests });
    } catch (error) {
        console.error('Get sent requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to get sent requests' });
    }
});

// 6. Accept friend request
route.post('/request/:requestId/accept', verifyToken, async (req, res) => {
    try {
        const friendRequest = await FriendRequest.findById(req.params.requestId);

        if (!friendRequest) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Verify that current user is the recipient
        if (friendRequest.to.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (friendRequest.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Request already processed' });
        }

        // Add to friends list (both users)
        await User.findByIdAndUpdate(friendRequest.from, {
            $addToSet: { friends: friendRequest.to }
        });

        await User.findByIdAndUpdate(friendRequest.to, {
            $addToSet: { friends: friendRequest.from }
        });

        // Update request status
        friendRequest.status = 'accepted';
        await friendRequest.save();

        res.json({ 
            success: true, 
            message: 'Friend request accepted!' 
        });
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({ success: false, message: 'Failed to accept request' });
    }
});

// 7. Reject friend request
route.post('/request/:requestId/reject', verifyToken, async (req, res) => {
    try {
        const friendRequest = await FriendRequest.findById(req.params.requestId);

        if (!friendRequest) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Verify that current user is the recipient
        if (friendRequest.to.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (friendRequest.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Request already processed' });
        }

        // Update request status to rejected
        friendRequest.status = 'rejected';
        await friendRequest.save();

        res.json({ 
            success: true, 
            message: 'Friend request rejected' 
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject request' });
    }
});

// 8. Cancel sent friend request
route.delete('/request/:requestId/cancel', verifyToken, async (req, res) => {
    try {
        const friendRequest = await FriendRequest.findById(req.params.requestId);

        if (!friendRequest) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Verify that current user is the sender
        if (friendRequest.from.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Delete the request
        await FriendRequest.findByIdAndDelete(req.params.requestId);

        res.json({ 
            success: true, 
            message: 'Friend request cancelled' 
        });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel request' });
    }
});

// 9. Remove friend (unfriend)
route.delete('/:friendId', verifyToken, async (req, res) => {
    try {
        const { friendId } = req.params;

        // Verify friend exists
        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove from both users' friend lists
        await User.findByIdAndUpdate(req.userId, {
            $pull: { friends: friendId }
        });

        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: req.userId }
        });

        res.json({ 
            success: true, 
            message: 'Friend removed successfully' 
        });
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove friend' });
    }
});

// 10. Get friend statistics (bonus endpoint)
route.get('/stats', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const totalFriends = user.friends.length;
        
        const pendingReceived = await FriendRequest.countDocuments({
            to: req.userId,
            status: 'pending'
        });
        
        const pendingSent = await FriendRequest.countDocuments({
            from: req.userId,
            status: 'pending'
        });

        res.json({
            success: true,
            stats: {
                totalFriends,
                pendingReceived,
                pendingSent
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to get statistics' });
    }
});

export default route;