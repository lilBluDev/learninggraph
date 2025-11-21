import mongoose from 'mongoose';

const lombaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    level: { type: String, required: true },
    deadline: { type: Date, required: true },
    organizer: { type: String, required: true },
    description: { type: String, required: true },
    prize: { type: String },
    contact: { type: String, required: true },
    registrationLink: { type: String, required: true },
    poster: { type: String },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' }
}, { timestamps: true });

const Lomba = mongoose.model('Lomba', lombaSchema);
export default Lomba;