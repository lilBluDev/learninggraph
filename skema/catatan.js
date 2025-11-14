import mongoose from 'mongoose';

const catatanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    judul: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    mataPelajaran: {
        type: String,
        required: true,
        enum: ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia', 
               'Bahasa Inggris', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi', 'Lainnya']
    },
    konten: {
        type: String,
        required: true,
        maxlength: 50000 // 50KB text max
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 30
    }],
    warna: {
        type: String,
        default: '#667eea',
        match: /^#[0-9A-Fa-f]{6}$/
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    lastEdited: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index untuk query efisien
catatanSchema.index({ userId: 1, isPinned: -1, lastEdited: -1 });
catatanSchema.index({ userId: 1, mataPelajaran: 1 });
catatanSchema.index({ userId: 1, tags: 1 });

// Method untuk update lastEdited
catatanSchema.pre('save', function(next) {
    if (this.isModified('konten') || this.isModified('judul')) {
        this.lastEdited = Date.now();
    }
    next();
});

// Virtual untuk preview konten (100 karakter pertama)
catatanSchema.virtual('preview').get(function() {
    return this.konten.substring(0, 100) + (this.konten.length > 100 ? '...' : '');
});

// Method untuk JSON response
catatanSchema.methods.toJSON = function() {
    const obj = this.toObject();
    obj.preview = this.preview;
    return obj;
};

const Catatan = mongoose.model('Catatan', catatanSchema);

export default Catatan;