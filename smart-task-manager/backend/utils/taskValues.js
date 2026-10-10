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
export const utcToday = () => new Date().toISOString().slice(0, 10);
export const dayStart = (date) => new Date(`${date}T00:00:00.000Z`);
