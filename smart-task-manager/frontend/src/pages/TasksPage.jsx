import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  SlidersHorizontal,
  ArrowDownWideNarrow,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Loading, ErrorState, EmptyState } from '../components/Common';
import { TaskForm } from '../components/TaskForm';
import { TaskDetails, DeleteTask } from '../components/TaskDialogs';
import { TaskList } from '../components/TaskList';
import { useResource } from '../hooks/useResource';
import { useToast } from '../hooks/useApp';
import { api, errorMessage } from '../services/api';
import { categories, priorities, statuses, localToday } from '../utils/tasks';
const pageText = {
  all: [
    'A PLACE FOR EVERY NEXT STEP',
    'All tasks',
    'Bring a little clarity to everything on your plate.',
  ],
  today: ['ONE DAY AT A TIME', 'Today', 'Focus on what’s due today. Make each small step count.'],
  upcoming: [
    'LOOKING A LITTLE AHEAD',
    'Upcoming deadlines',
    'A clear view of what’s next, in deadline order.',
  ],
};
export function TasksPage({ view = 'all' }) {
  const [params, setParams] = useSearchParams(),
    [search, setSearch] = useState(params.get('search') || ''),
    [dialog, setDialog] = useState(null),
    [busyId, setBusyId] = useState(null),
    notify = useToast();
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);
  useEffect(() => {
    if (params.get('new') === '1') {
      setDialog({ type: 'form' });
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);
  const page = Number(params.get('page')) || 1;
  const query = new URLSearchParams({
    view,
    today: localToday(),
    page: String(page),
    sort: params.get('sort') || (view === 'all' ? '-createdAt' : 'dueDate'),
  });
  for (const key of ['status', 'priority', 'category'])
    if (params.get(key)) query.set(key, params.get(key));
  if (debounced) query.set('search', debounced);
  const { data, loading, error, reload } = useResource(`/tasks?${query}`);
  const changeFilter = (key, value) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  const close = () => setDialog(null),
    saved = () => {
      close();
      reload();
    };
  async function status(task, value) {
    setBusyId(task._id);
    try {
      await api.patch(`/tasks/${task._id}/status`, { status: value });
      notify('Status updated.');
      reload();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }
  const [eyebrow, title, description] = pageText[view];
  const hasFilters = search || ['status', 'priority', 'category'].some((key) => params.has(key));
  function reset() {
    setSearch('');
    setDebounced('');
    setParams({});
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>
            {title}
            <span className="heading-dot">.</span>
          </h1>
          <p>{description}</p>
        </div>
        <button className="button primary" onClick={() => setDialog({ type: 'form' })}>
          <Plus size={18} />
          New task
        </button>
      </div>
      <section className="panel tasks-panel">
        <div className="tasks-toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Search tasks"
              placeholder="Search your tasks…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                changeFilter('search', event.target.value);
              }}
            />
          </label>
          <div className="sort-field">
            <ArrowDownWideNarrow size={17} />
            <select
              aria-label="Sort tasks"
              value={query.get('sort')}
              onChange={(event) => changeFilter('sort', event.target.value)}
            >
              <option value="-createdAt">Newest first</option>
              <option value="createdAt">Oldest first</option>
              <option value="dueDate">Due date: soonest</option>
              <option value="-dueDate">Due date: latest</option>
            </select>
          </div>
        </div>
        <div className="filters">
          <span className="filter-label">
            <SlidersHorizontal size={15} />
            Filter by
          </span>
          {[
            ['status', statuses],
            ['priority', priorities],
            ['category', categories],
          ].map(([key, values]) => (
            <select
              key={key}
              aria-label={`Filter by ${key}`}
              value={params.get(key) || ''}
              onChange={(event) => changeFilter(key, event.target.value)}
            >
              <option value="">
                All{' '}
                {key === 'status' ? 'statuses' : key === 'priority' ? 'priorities' : 'categories'}
              </option>
              {values.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          ))}
          {hasFilters && (
            <button className="text-button" onClick={reset}>
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : data.tasks.length ? (
          <TaskList
            tasks={data.tasks}
            onDetails={(id) => setDialog({ type: 'details', id })}
            onEdit={(task) => setDialog({ type: 'form', task })}
            onDelete={(task) => setDialog({ type: 'delete', task })}
            onStatus={status}
            busyId={busyId}
          />
        ) : (
          <EmptyState
            title={
              hasFilters
                ? 'No tasks match just yet'
                : view === 'today'
                  ? 'A clear day ahead'
                  : view === 'upcoming'
                    ? 'Nothing on the horizon yet'
                    : undefined
            }
            text={
              hasFilters
                ? 'Try a different search or clear your filters.'
                : view === 'today'
                  ? 'You have no tasks due today.'
                  : view === 'upcoming'
                    ? 'Future unfinished tasks will appear here.'
                    : undefined
            }
            action={
              <button
                className="button secondary"
                onClick={hasFilters ? reset : () => setDialog({ type: 'form' })}
              >
                {hasFilters ? 'Clear filters' : 'Create a task'}
              </button>
            }
          />
        )}
        {data && !loading && !error && (
          <div className="pagination">
            <span>
              {data.pagination.total} task{data.pagination.total !== 1 ? 's' : ''} · Page {page} of{' '}
              {Math.max(1, data.pagination.pages)}
            </span>
            <div>
              <button
                className="icon-button"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set('page', page - 1);
                  setParams(next);
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="Next page"
                disabled={page >= data.pagination.pages}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set('page', page + 1);
                  setParams(next);
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>
      {dialog?.type === 'form' && <TaskForm task={dialog.task} onClose={close} onSaved={saved} />}
      {dialog?.type === 'details' && (
        <TaskDetails
          id={dialog.id}
          onClose={close}
          onEdit={(task) => setDialog({ type: 'form', task })}
        />
      )}
      {dialog?.type === 'delete' && (
        <DeleteTask
          task={dialog.task}
          onClose={close}
          onDeleted={() => {
            close();
            if (data.tasks.length === 1 && page > 1) {
              const next = new URLSearchParams(params);
              next.set('page', page - 1);
              setParams(next);
            } else reload();
          }}
        />
      )}
    </>
  );
}
