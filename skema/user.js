import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    description: {
        type: String,
        default: '',
        maxlength: 500
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    selectedSubjects: [{
        type: String,
        enum: ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia', 
               'Bahasa Inggris', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi']
    }],
    avatar: {
        type: String,
        default: '/public/defaultp.png'
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    achievements: [{
        name: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password sebelum save
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method untuk compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isAdmin = function() {
    return this.role === 'ADMIN';
};

// Method untuk menghitung level dari XP
userSchema.methods.calculateLevel = function() {
    this.level = Math.floor(this.xp / 100) + 1;
    return this.level;
};

// Method untuk menambah XP
userSchema.methods.addXP = function(amount) {
    this.xp += amount;
    this.calculateLevel();
    return this.xp;
};

// Virtual untuk data publik (tanpa password)
userSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,
        username: this.username,
        displayName: this.displayName,
        email: this.email,
        description: this.description,
        level: this.level,
        role: this.role,
        xp: this.xp,
        friends: this.friends,
        selectedSubjects: this.selectedSubjects,
        avatar: this.avatar,
        achievements: this.achievements,
        lastLogin: this.lastLogin,
        createdAt: this.createdAt
    };
};

const User = mongoose.model('User', userSchema);

export default User;