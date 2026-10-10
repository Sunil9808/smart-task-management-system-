import mongoose from 'mongoose';
import { categories, statuses, priorities } from '../utils/taskValues.js';
const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 5000 },
    category: { type: String, enum: categories, default: 'Personal', required: true },
    priority: { type: String, enum: priorities, default: 'Medium', required: true },
    status: { type: String, enum: statuses, default: 'To Do', required: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1, dueDate: 1 });
taskSchema.index({ user: 1, category: 1, priority: 1 });
export const Task = mongoose.model('Task', taskSchema);
