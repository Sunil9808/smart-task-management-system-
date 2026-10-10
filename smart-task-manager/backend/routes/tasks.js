import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  changeStatus,
  deleteTask,
} from '../controllers/tasks.js';
export const taskRouter = Router();
taskRouter.use(authenticate);
taskRouter.route('/').get(listTasks).post(createTask);
taskRouter.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
taskRouter.patch('/:id/status', changeStatus);
