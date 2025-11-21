// d:\web-lomba\skema\jadwalEvent.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { type: String, required: true },    
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:mm
    desc: { type: String },
    priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
    poster: { type: String } // URL to poster image
}, {
    timestamps: true
});

// Index untuk query yang lebih cepat
eventSchema.index({ userId: 1, date: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;