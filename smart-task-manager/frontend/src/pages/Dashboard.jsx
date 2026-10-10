import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
  ListTodo,
  CircleDashed,
  CircleDot,
  CircleCheck,
  Clock3,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../hooks/useApp';
import { useResource } from '../hooks/useResource';
import { localToday, deadline } from '../utils/tasks';
import { Loading, ErrorState, EmptyState, Badge } from '../components/Common';
import { TaskForm } from '../components/TaskForm';
import { TaskDetails } from '../components/TaskDialogs';
import { TaskList } from '../components/TaskList';
const colors = ['#dbe7e1', '#ecb86c', '#28765f'];
export function Dashboard() {
  const { user } = useAuth(),
    { data, loading, error, reload } = useResource(`/dashboard/stats?today=${localToday()}`),
    [dialog, setDialog] = useState(null);
  const close = () => setDialog(null);
  const hour = new Date().getHours(),
    greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={reload} />;
  const chart = [
    { name: 'To Do', value: data.pending },
    { name: 'In Progress', value: data.inProgress },
    { name: 'Completed', value: data.completed },
  ];
  const cards = [
    ['Total tasks', data.total, ListTodo, 'neutral', 'Everything in your workspace'],
    ['To do', data.pending, CircleDashed, 'gray', 'Ready when you are'],
    ['In progress', data.inProgress, CircleDot, 'amber', 'A little closer, every day'],
    ['Completed', data.completed, CircleCheck, 'green', 'Small wins worth celebrating'],
  ];
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">LET’S MAKE A LITTLE PROGRESS</span>
          <h1>
            {greeting}, {user.name.split(' ')[0]}
            <span className="heading-dot">.</span>
          </h1>
          <p>Here’s what’s happening in your workspace today.</p>
        </div>
        <button className="button primary" onClick={() => setDialog({ type: 'form' })}>
          <Plus size={18} />
          New task
        </button>
      </div>
      <div className="focus-banner">
        <span className="focus-icon">
          <Sparkles size={21} />
        </span>
        <div>
          <strong>
            {data.today
              ? `${data.today} task${data.today === 1 ? '' : 's'} to focus on today`
              : 'A fresh opportunity to move things forward'}
          </strong>
          <p>
            {data.overdue
              ? `${data.overdue} overdue task${data.overdue === 1 ? ' needs' : 's need'} a little attention. You’ve got this.`
              : 'Find your focus. Take it one task at a time.'}
          </p>
        </div>
        <Link to="/today">
          Plan your day <ArrowRight size={17} />
        </Link>
      </div>
      <div className="stats-grid">
        {cards.map(([label, value, Icon, color, note]) => (
          <div className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <span className={`stat-icon ${color}`}>
                <Icon size={18} />
              </span>
            </div>
            <strong className="stat-value">{value.toString().padStart(2, '0')}</strong>
            <span className="stat-note">{note}</span>
          </div>
        ))}
      </div>
      <div className="dashboard-middle">
        <section className="panel progress-panel">
          <div className="panel-heading">
            <div>
              <h2>Your progress</h2>
              <p>Every completed task counts.</p>
            </div>
            <span className="subtle-chip">All time</span>
          </div>
          <div className="progress-content">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.total ? chart : [{ name: 'No tasks yet', value: 1 }]}
                    dataKey="value"
                    innerRadius={61}
                    outerRadius={78}
                    paddingAngle={data.total ? 4 : 0}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {(data.total ? chart : [{ name: 'Empty' }]).map((item, index) => (
                      <Cell key={item.name} fill={data.total ? colors[index] : '#eef1ee'} />
                    ))}
                  </Pie>
                  {data.total > 0 && <Tooltip />}
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-label">
                <strong>{data.completion}%</strong>
                <span>completed</span>
              </div>
            </div>
            <div className="chart-legend">
              {chart.map((item, index) => (
                <div key={item.name}>
                  <span className="legend-dot" style={{ background: colors[index] }} />
                  <span>{item.name}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
              <span className="chart-caption">
                {data.completed} of {data.total} tasks completed
              </span>
            </div>
          </div>
        </section>
        <section className="panel deadlines-panel">
          <div className="panel-heading">
            <div>
              <h2>On the horizon</h2>
              <p>Your next deadlines, at a glance.</p>
            </div>
            <Link to="/upcoming" className="icon-button" aria-label="View all upcoming deadlines">
              <ArrowUpRight size={19} />
            </Link>
          </div>
          {data.upcoming.length ? (
            <div className="deadline-list">
              {data.upcoming.slice(0, 3).map((task) => {
                const due = deadline(task);
                return (
                  <button
                    className="deadline-item"
                    key={task._id}
                    onClick={() => setDialog({ type: 'details', id: task._id })}
                  >
                    <span className="deadline-calendar">
                      <span>
                        {new Date(`${task.dueDate.slice(0, 10)}T12:00:00`).toLocaleDateString(
                          undefined,
                          { month: 'short' },
                        )}
                      </span>
                      <strong>{Number(task.dueDate.slice(8, 10))}</strong>
                    </span>
                    <span className="deadline-info">
                      <strong>{task.title}</strong>
                      <span>
                        {task.category} <span className="separator-dot">·</span>{' '}
                        <span className={due.kind}>{due.label}</span>
                      </span>
                    </span>
                    <Badge value={task.priority} />
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="A little breathing room"
              text="Your upcoming deadlines will appear here."
            />
          )}
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent tasks</h2>
            <p>Your latest plans, all in one place.</p>
          </div>
          <Link to="/tasks" className="text-link">
            View all tasks <ArrowRight size={16} />
          </Link>
        </div>
        {data.recent.length ? (
          <TaskList
            compact
            tasks={data.recent}
            onDetails={(id) => setDialog({ type: 'details', id })}
          />
        ) : (
          <EmptyState
            action={
              <button className="button secondary" onClick={() => setDialog({ type: 'form' })}>
                <Plus size={16} />
                Create your first task
              </button>
            }
          />
        )}
      </section>
      <div className="dashboard-bottom">
        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <h2>Life, in categories</h2>
              <p>A little perspective on your plate.</p>
            </div>
            <CalendarDays size={19} />
          </div>
          <div className="category-grid">
            {data.categories.map((category) => (
              <Link key={category.name} to={`/tasks?category=${encodeURIComponent(category.name)}`}>
                <span>{category.name}</span>
                <strong>{category.count}</strong>
              </Link>
            ))}
          </div>
        </section>
        <section className="panel priority-panel">
          <div className="panel-heading">
            <div>
              <h2>What needs attention</h2>
              <p>Your tasks by priority.</p>
            </div>
            <Clock3 size={19} />
          </div>
          <div className="priority-summary">
            {[...data.priorities].reverse().map((priority) => (
              <Link to={`/tasks?priority=${priority.name}`} key={priority.name}>
                <Badge value={priority.name} />
                <span>
                  {priority.count} task{priority.count !== 1 ? 's' : ''}
                </span>
              </Link>
            ))}
            <div className="overdue-summary">
              <span>Overdue, unfinished tasks</span>
              <strong>{data.overdue}</strong>
            </div>
          </div>
        </section>
      </div>
      {dialog?.type === 'form' && (
        <TaskForm
          task={dialog.task}
          onClose={close}
          onSaved={() => {
            close();
            reload();
          }}
        />
      )}{' '}
      {dialog?.type === 'details' && (
        <TaskDetails
          id={dialog.id}
          onClose={close}
          onEdit={(task) => setDialog({ type: 'form', task })}
        />
      )}
    </>
  );
}
