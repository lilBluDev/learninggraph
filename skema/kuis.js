import mongoose from 'mongoose';

const kuisSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        default: '',
        maxlength: 1000
    },
    subject: {
        type: String,
        enum: ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia', 
               'Bahasa Inggris', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi'],
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    duration: {
        type: Number,
        required: true,
        default: 600, // seconds (10 minutes)
        min: 60,
        max: 3600
    },
    questions: [{
        id: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['multiple_choice', 'multiple_complex', 'matching'],
            required: true
        },
        question: {
            type: String,
            required: true
        },
        image: {
            type: String, // URL to blob storage
            default: null
        },
        // For multiple_choice and multiple_complex
        options: [{
            id: String,
            text: String,
            isCorrect: Boolean
        }],
        // For multiple_complex (can have multiple correct answers)
        // For matching: pairs of items to match
        pairs: [{
            leftId: String,
            leftText: String,
            rightId: String,
            rightText: String,
            correctMatch: String // rightId that matches with this pair
        }],
        points: {
            type: Number,
            default: 10,
            min: 1
        }
    }],
    totalPoints: {
        type: Number,
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Update totalPoints before save
kuisSchema.pre('save', function(next) {
    if (this.questions && this.questions.length > 0) {
        this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 10), 0);
    }
    next();
});

const Kuis = mongoose.model('Kuis', kuisSchema);
export default Kuis;