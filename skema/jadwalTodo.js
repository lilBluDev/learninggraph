// d:\web-lomba\skema\jadwalTodo.js
import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Index untuk query yang lebih cepat
todoSchema.index({ userId: 1 });

const Todo = mongoose.model('Todo', todoSchema);
export default Todo;