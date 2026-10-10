import { Pencil, Trash2, CalendarDays, Circle, CircleCheck, CircleDot } from 'lucide-react';
import { Badge } from './Common';
import { deadline, statuses } from '../utils/tasks';
export function TaskList({
  tasks,
  onDetails,
  onEdit,
  onDelete,
  onStatus,
  busyId,
  compact = false,
}) {
  return (
    <div className={`task-list ${compact ? 'compact' : ''}`}>
      <div className="task-table-head">
        <span>Task name</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Due date</span>
        {!compact && <span>Actions</span>}
      </div>
      {tasks.map((task) => {
        const due = deadline(task),
          Icon =
            task.status === 'Completed'
              ? CircleCheck
              : task.status === 'In Progress'
                ? CircleDot
                : Circle;
        return (
          <article
            className={`task-row ${task.status === 'Completed' ? 'is-completed' : ''}`}
            key={task._id}
          >
            <div className="task-name-cell">
              <Icon
                size={20}
                className={`task-status-icon ${task.status === 'Completed' ? 'text-green' : ''}`}
              />
              <div>
                <button className="task-title" onClick={() => onDetails(task._id)}>
                  {task.title}
                </button>
                <span className="task-category">{task.category}</span>
              </div>
            </div>
            <div className="task-priority">
              <Badge value={task.priority} />
            </div>
            <div className="task-status">
              {onStatus ? (
                <select
                  aria-label={`Status of ${task.title}`}
                  className={`status-select badge-${task.status.toLowerCase().replaceAll(' ', '-')}`}
                  value={task.status}
                  disabled={busyId === task._id}
                  onChange={(event) => onStatus(task, event.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              ) : (
                <Badge value={task.status} />
              )}
            </div>
            <div className={`task-due ${due.kind}`}>
              <CalendarDays size={14} />
              {due.label}
            </div>
            {!compact && (
              <div className="task-actions">
                <button
                  className="icon-button"
                  aria-label={`Edit ${task.title}`}
                  onClick={() => onEdit(task)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button delete-button"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => onDelete(task)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
