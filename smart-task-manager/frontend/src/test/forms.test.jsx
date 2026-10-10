import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useApp';
import { ToastContext } from '../context/ToastContext';
import { AuthPage } from '../pages/AuthPage';
import { TaskForm } from '../components/TaskForm';
import { DeleteTask } from '../components/TaskDialogs';
import { TaskList } from '../components/TaskList';
import { api } from '../services/api';
import { deadline, localToday } from '../utils/tasks';
vi.mock('../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  errorMessage: () => 'Server rejected this request.',
}));
const task = {
  _id: 'task-1',
  title: 'Review project',
  description: '',
  status: 'To Do',
  priority: 'High',
  category: 'Work',
  dueDate: '2026-10-10T00:00:00.000Z',
};
beforeEach(() => vi.clearAllMocks());
function auth(register, authenticate = vi.fn()) {
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: null, authenticate }}>
        <AuthPage register={register} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return authenticate;
}
describe('authentication forms', () => {
  it('recovers from a session-load error after successful sign-in', async () => {
    api.get.mockRejectedValue(new Error('initial connection failed'));
    api.post.mockResolvedValue({ data: { data: { user: { name: 'Asha' } } } });
    function SessionProbe() {
      const { user, error, authenticate } = useAuth();
      return (
        <>
          <p>{user?.name || 'Signed out'}</p>
          {error && <p role="alert">{error}</p>}
          <button
            onClick={() =>
              authenticate('login', { email: 'asha@example.com', password: 'password-123' })
            }
          >
            Recover session
          </button>
        </>
      );
    }
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Server rejected');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Recover session' }));
    expect(await screen.findByText('Asha')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('validates registration before calling the API', async () => {
    const authenticate = auth(true),
      user = userEvent.setup();
    await user.type(screen.getByLabelText('Full name'), 'A');
    await user.type(screen.getByLabelText('Email address'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('at least 2 characters');
    await user.type(screen.getByLabelText('Full name'), 'sha');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('at least 8 characters');
    expect(authenticate).not.toHaveBeenCalled();
  });
  it('submits login and shows API errors without claiming success', async () => {
    const authenticate = auth(false, vi.fn().mockRejectedValue(new Error('denied'))),
      user = userEvent.setup();
    await user.type(screen.getByLabelText('Email address'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(authenticate).toHaveBeenCalledWith('login', {
      email: 'asha@example.com',
      password: 'password-123',
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Server rejected');
  });
});
describe('task interactions', () => {
  it('rejects a whitespace title and saves a valid task using the API', async () => {
    const saved = vi.fn(),
      notify = vi.fn(),
      user = userEvent.setup();
    api.post.mockResolvedValue({});
    render(
      <ToastContext.Provider value={notify}>
        <TaskForm onClose={vi.fn()} onSaved={saved} />
      </ToastContext.Provider>,
    );
    await user.type(screen.getByLabelText(/Task title/), '   ');
    await user.click(screen.getByRole('button', { name: 'Create task' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Give your task a title');
    expect(api.post).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText(/Task title/));
    await user.type(screen.getByLabelText(/Task title/), 'Plan my day');
    await user.selectOptions(screen.getByLabelText('Category'), 'Work');
    await user.click(screen.getByRole('button', { name: 'Create task' }));
    expect(api.post).toHaveBeenCalledWith(
      '/tasks',
      expect.objectContaining({ title: 'Plan my day', category: 'Work' }),
    );
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
  });
  it('preserves edited fields and keeps the form open after a failed save', async () => {
    const saved = vi.fn(),
      user = userEvent.setup();
    api.put.mockRejectedValue(new Error('offline'));
    render(
      <ToastContext.Provider value={vi.fn()}>
        <TaskForm task={task} onClose={vi.fn()} onSaved={saved} />
      </ToastContext.Provider>,
    );
    expect(screen.getByLabelText(/Due date/)).toHaveValue('2026-10-10');
    await user.selectOptions(screen.getByLabelText('Priority'), 'Low');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Priority')).toHaveValue('Low');
  });
  it('requires an explicit delete action and waits for success', async () => {
    const deleted = vi.fn(),
      user = userEvent.setup();
    api.delete.mockResolvedValue({});
    render(
      <ToastContext.Provider value={vi.fn()}>
        <DeleteTask task={task} onClose={vi.fn()} onDeleted={deleted} />
      </ToastContext.Provider>,
    );
    expect(api.delete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete task' }));
    expect(api.delete).toHaveBeenCalledWith('/tasks/task-1');
    await waitFor(() => expect(deleted).toHaveBeenCalledOnce());
  });
  it('opens task details and changes status using accessible controls', async () => {
    const details = vi.fn(),
      status = vi.fn(),
      user = userEvent.setup();
    render(
      <TaskList
        tasks={[task]}
        onDetails={details}
        onStatus={status}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Review project' }));
    expect(details).toHaveBeenCalledWith('task-1');
    await user.selectOptions(screen.getByLabelText('Status of Review project'), 'Completed');
    expect(status).toHaveBeenCalledWith(task, 'Completed');
  });
});
describe('calendar rules', () => {
  it('classifies deadlines without marking completed tasks overdue', () => {
    expect(deadline(task, '2026-10-11')).toEqual({ label: '1d overdue', kind: 'overdue' });
    expect(deadline(task, '2026-10-10').label).toBe('Due today');
    expect(deadline(task, '2026-10-09').label).toBe('Tomorrow');
    expect(deadline({ ...task, status: 'Completed' }, '2026-10-12').kind).toBe('done');
    expect(localToday(new Date(2026, 9, 10, 23, 59))).toBe('2026-10-10');
  });
});
