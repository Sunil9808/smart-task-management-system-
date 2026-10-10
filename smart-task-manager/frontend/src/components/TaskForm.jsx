import { useState } from 'react';
import { Modal } from './Modal';
import { categories, priorities, statuses, localToday } from '../utils/tasks';
import { api, errorMessage } from '../services/api';
import { useToast } from '../hooks/useApp';
export function TaskForm({ task, onClose, onSaved }) {
  const [values, setValues] = useState({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || 'Personal',
    status: task?.status || 'To Do',
    priority: task?.priority || 'Medium',
    dueDate: task?.dueDate?.slice(0, 10) || localToday(),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    notify = useToast();
  const change = (event) => setValues({ ...values, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!values.title.trim()) return setError('Give your task a title.');
    if (!values.dueDate) return setError('Choose a due date.');
    setBusy(true);
    try {
      if (task) await api.put(`/tasks/${task._id}`, values);
      else await api.post('/tasks', values);
      notify(task ? 'Task updated.' : 'Your next step is on the list.');
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={task ? 'Edit task' : 'Create a new task'} onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="task-form">
        <p className="form-intro">Big ideas start with a small next step.</p>
        <label>
          Task title <span className="required">*</span>
          <input
            autoFocus
            name="title"
            value={values.title}
            onChange={change}
            placeholder="What would you like to get done?"
            required
            maxLength={160}
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            value={values.description}
            onChange={change}
            placeholder="Add a little context, a plan, or a helpful note…"
            rows={4}
            maxLength={5000}
          />
        </label>
        <div className="form-grid">
          <label>
            Category
            <select name="category" value={values.category} onChange={change}>
              {categories.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Due date <span className="required">*</span>
            <input
              type="date"
              name="dueDate"
              value={values.dueDate}
              onChange={change}
              required
              min="1900-01-01"
              max="2199-12-31"
            />
          </label>
          <label>
            Priority
            <select name="priority" value={values.priority} onChange={change}>
              {priorities.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={values.status} onChange={change}>
              {statuses.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
