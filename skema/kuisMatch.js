import mongoose from 'mongoose';

const kuisMatchSchema = new mongoose.Schema({
    kuis: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Kuis',
        required: true
    },
    player1: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        attemptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'KuisAttempt'
        },
        score: {
            type: Number,
            default: 0
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        finishedAt: {
            type: Date,
            default: null
        }
    },
    player2: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        attemptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'KuisAttempt',
            default: null
        },
        score: {
            type: Number,
            default: 0
        },
        joinedAt: {
            type: Date,
            default: null
        },
        finishedAt: {
            type: Date,
            default: null
        }
    },
    status: {
        type: String,
        enum: ['waiting', 'in_progress', 'completed'],
        default: 'waiting'
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    firstFinished: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    firstFinishedTime: {
        type: Number, // seconds
        default: 0
    },
    duration: {
        type: Number, // Quiz duration
        required: true
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const KuisMatch = mongoose.model('KuisMatch', kuisMatchSchema);
export default KuisMatch;