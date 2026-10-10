export const categories = [
  'Personal',
  'Work',
  'Projects',
  'Education',
  'Internships',
  'Job Applications',
  'Meetings',
  'Deadlines',
  'Certifications',
  'Other',
];
export const statuses = ['To Do', 'In Progress', 'Completed'];
export const priorities = ['Low', 'Medium', 'High'];
export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export const formatDate = (value) =>
  new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
export function deadline(task, today = localToday()) {
  if (task.status === 'Completed') return { label: 'Completed', kind: 'done' };
  const days = Math.round((Date.parse(task.dueDate.slice(0, 10)) - Date.parse(today)) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, kind: 'overdue' };
  if (days === 0) return { label: 'Due today', kind: 'soon' };
  if (days <= 3) return { label: days === 1 ? 'Tomorrow' : `In ${days} days`, kind: 'soon' };
  return { label: formatDate(task.dueDate), kind: '' };
}
