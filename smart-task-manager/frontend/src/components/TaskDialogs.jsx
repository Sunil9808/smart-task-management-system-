import { useState } from 'react';
import { Modal } from './Modal';
import { Badge, ErrorState, Loading } from './Common';
import { api, errorMessage } from '../services/api';
import { useResource } from '../hooks/useResource';
import { useToast } from '../hooks/useApp';
import { formatDate } from '../utils/tasks';
export function DeleteTask({ task, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    notify = useToast();
  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/tasks/${task._id}`);
      notify('Task deleted.');
      onDeleted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Delete this task?" onClose={onClose} busy={busy}>
      <div className="modal-content">
        <p>“{task.title}” will be permanently removed. This cannot be undone.</p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="button secondary" disabled={busy} onClick={onClose}>
            Keep task
          </button>
          <button className="button danger" disabled={busy} onClick={remove}>
            {busy ? 'Deleting…' : 'Delete task'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
export function TaskDetails({ id, onClose, onEdit }) {
  const { data, loading, error, reload } = useResource(`/tasks/${id}`);
  const task = data?.task;
  return (
    <Modal title="Task details" onClose={onClose}>
      <div className="modal-content">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : (
          <>
            <span className="eyebrow">{task.category}</span>
            <h3 className="detail-title">{task.title}</h3>
            <div className="flex gap-2">
              <Badge value={task.status} />
              <Badge value={task.priority} />
            </div>
            <p className="detail-description">{task.description || 'No description added.'}</p>
            <dl className="detail-dates">
              <div>
                <dt>Due date</dt>
                <dd>{formatDate(task.dueDate)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(task.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{new Date(task.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
            <div className="modal-actions">
              <button className="button primary" onClick={() => onEdit(task)}>
                Edit task
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
