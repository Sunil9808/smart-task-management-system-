import { Task } from '../models/Task.js';
import { categories, priorities, dayStart } from '../utils/taskValues.js';
import { statsQuerySchema } from '../utils/validation.js';
export async function dashboardStats(req, res) {
  const { today: date } = statsQuerySchema.parse(req.query);
  const today = dayStart(date);
  const user = req.user._id;
  const [summary] = await Task.aggregate([
    { $match: { user } },
    {
      $facet: {
        statuses: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        categories: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
        priorities: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        overdue: [
          { $match: { status: { $ne: 'Completed' }, dueDate: { $lt: today } } },
          { $count: 'count' },
        ],
        today: [{ $match: { dueDate: today, status: { $ne: 'Completed' } } }, { $count: 'count' }],
        recent: [{ $sort: { createdAt: -1, _id: -1 } }, { $limit: 5 }],
        upcoming: [
          { $match: { status: { $ne: 'Completed' }, dueDate: { $gte: today } } },
          { $sort: { dueDate: 1, _id: 1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);
  const count = (status) => summary.statuses.find((item) => item._id === status)?.count || 0;
  const pending = count('To Do'),
    inProgress = count('In Progress'),
    completed = count('Completed');
  const total = pending + inProgress + completed;
  const distribution = (values, field) =>
    values.map((name) => ({
      name,
      count: summary[field].find((item) => item._id === name)?.count || 0,
    }));
  res.json({
    data: {
      total,
      pending,
      inProgress,
      completed,
      overdue: summary.overdue[0]?.count || 0,
      today: summary.today[0]?.count || 0,
      completion: total ? Math.round((completed / total) * 100) : 0,
      categories: distribution(categories, 'categories'),
      priorities: distribution(priorities, 'priorities'),
      recent: summary.recent,
      upcoming: summary.upcoming,
    },
  });
}
