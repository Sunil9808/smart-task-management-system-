import { Check, Inbox, LoaderCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Taskly home">
      <span className="brand-mark">
        <Check size={23} strokeWidth={3} />
      </span>
      taskly<span className="brand-dot">.</span>
    </Link>
  );
}
export function Loading() {
  return (
    <div className="state-box" role="status">
      <LoaderCircle className="spin" size={25} />
      <span>Getting things ready…</span>
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="state-box error-state" role="alert">
      <h3>We couldn’t load this page</h3>
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          <RefreshCw size={16} />
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title = 'A little space for your next big thing',
  text = 'Create a task and take the first step.',
  action,
}) {
  return (
    <div className="state-box empty-state">
      <span className="empty-icon">
        <Inbox size={30} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Badge({ value }) {
  return (
    <span className={`badge badge-${value.toLowerCase().replaceAll(' ', '-')}`}>
      <span />
      {value}
    </span>
  );
}
