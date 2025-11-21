import mongoose from 'mongoose';

const kuisAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    kuis: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Kuis',
        required: true
    },
    mode: {
        type: String,
        enum: ['solo', 'match'],
        required: true
    },
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KuisMatch',
        default: null
    },
    opponent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Only populated for match mode
    },
    answers: [{
        questionId: String,
        selectedAnswers: [String], // Array to support multiple correct answers
        isCorrect: Boolean,
        pointsEarned: Number
    }],
    score: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        required: true
    },
    timeSpent: {
        type: Number, // seconds
        default: 0
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const KuisAttempt = mongoose.model('KuisAttempt', kuisAttemptSchema);
export default KuisAttempt;