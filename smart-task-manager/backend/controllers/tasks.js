import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { ApiError } from '../utils/errors.js';
import { taskSchema, statusSchema, querySchema } from '../utils/validation.js';
import { dayStart } from '../utils/taskValues.js';
function ownedId(req) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid task ID.');
  return { _id: req.params.id, user: req.user._id };
}
const requireTask = (task) => {
  if (!task) throw new ApiError(404, 'Task not found.');
  return task;
};
export async function listTasks(req, res) {
  const q = querySchema.parse(req.query);
  const filter = { user: req.user._id };
  for (const key of ['status', 'priority', 'category']) if (q[key]) filter[key] = q[key];
  if (q.search) {
    const search = q.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const today = dayStart(q.today);
  if (q.view === 'today') filter.dueDate = today;
  if (q.view === 'upcoming' || q.view === 'overdue') {
    filter.dueDate = q.view === 'upcoming' ? { $gte: today } : { $lt: today };
    // An explicit Completed filter must remain empty in an unfinished-task view.
    filter.status = q.status ? { $eq: q.status, $ne: 'Completed' } : { $ne: 'Completed' };
  }
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ [q.sort.replace('-', '')]: q.sort.startsWith('-') ? -1 : 1, _id: 1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Task.countDocuments(filter),
  ]);
  res.json({
    data: {
      tasks,
      pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) },
    },
  });
}
export async function getTask(req, res) {
  res.json({ data: { task: requireTask(await Task.findOne(ownedId(req)).lean()) } });
}
export async function createTask(req, res) {
  const data = taskSchema.parse(req.body);
  const task = await Task.create({ ...data, dueDate: dayStart(data.dueDate), user: req.user._id });
  res.status(201).json({ data: { task } });
}
export async function updateTask(req, res) {
  const data = taskSchema.parse(req.body);
  const task = requireTask(
    await Task.findOneAndUpdate(
      ownedId(req),
      { ...data, dueDate: dayStart(data.dueDate) },
      { new: true, runValidators: true },
    ),
  );
  res.json({ data: { task } });
}
export async function changeStatus(req, res) {
  const data = statusSchema.parse(req.body);
  const task = requireTask(
    await Task.findOneAndUpdate(ownedId(req), data, { new: true, runValidators: true }),
  );
  res.json({ data: { task } });
}
export async function deleteTask(req, res) {
  requireTask(await Task.findOneAndDelete(ownedId(req)));
  res.status(204).end();
}
