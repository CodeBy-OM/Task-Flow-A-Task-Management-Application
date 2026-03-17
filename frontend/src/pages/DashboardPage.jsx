import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTaskStats, useTasks, useCreateTask, useUpdateTask } from '../hooks/useTasks';
import StatsCard from '../components/StatsCard';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { Modal, Skeleton, Button } from '../components/UI';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const { data: stats, isLoading: statsLoading } = useTaskStats();
  const { data, isLoading: tasksLoading } = useTasks({ limit: 6, sortBy: 'created_at', sortOrder: 'desc' });
  const { mutate: createTask, isPending: creating } = useCreateTask();
  const { mutate: updateTask, isPending: updating } = useUpdateTask();

  const recentTasks = data?.tasks || [];

  const handleCreate = (formData) => {
    createTask(formData, { onSuccess: () => setShowCreate(false) });
  };

  const handleUpdate = (formData) => {
    updateTask({ id: editTask.id, data: formData }, { onSuccess: () => setEditTask(null) });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__greeting">
            {greeting}, <span className="dashboard__name">{user?.full_name || user?.username}</span> 👋
          </h1>
          <p className="dashboard__sub">Here's what's happening with your tasks today.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          + New Task
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="dashboard__stats">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stats-skeleton">
              <Skeleton height="80px" />
            </div>
          ))
        ) : (
          <>
            <StatsCard label="Total Tasks" value={stats?.total} icon="◈" color="var(--accent)" />
            <StatsCard label="In Progress" value={stats?.in_progress} icon="▷" color="var(--status-in_progress)" />
            <StatsCard label="Completed" value={stats?.completed} icon="✓" color="var(--status-completed)" />
            <StatsCard label="Overdue" value={stats?.overdue} icon="⚠" color="var(--status-cancelled)"
              sub={stats?.overdue > 0 ? 'Needs attention' : 'All on track'} />
          </>
        )}
      </div>

      {/* Progress Bar */}
      {stats && stats.total > 0 && (
        <div className="dashboard__progress-section">
          <div className="dashboard__progress-header">
            <span className="dashboard__progress-label">Overall Progress</span>
            <span className="dashboard__progress-pct">
              {Math.round((stats.completed / stats.total) * 100)}% complete
            </span>
          </div>
          <div className="dashboard__progress-bar">
            <div
              className="dashboard__progress-fill"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            />
          </div>
          <div className="dashboard__progress-legend">
            <span style={{ color: 'var(--status-pending)' }}>● Pending: {stats.pending}</span>
            <span style={{ color: 'var(--status-in_progress)' }}>● In Progress: {stats.in_progress}</span>
            <span style={{ color: 'var(--status-completed)' }}>● Done: {stats.completed}</span>
            {stats.cancelled > 0 && <span style={{ color: 'var(--status-cancelled)' }}>● Cancelled: {stats.cancelled}</span>}
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="dashboard__section">
        <div className="dashboard__section-header">
          <h2 className="dashboard__section-title">Recent Tasks</h2>
          <button className="dashboard__view-all" onClick={() => navigate('/tasks')}>
            View all →
          </button>
        </div>

        {tasksLoading ? (
          <div className="dashboard__tasks-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton height="120px" />
              </div>
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">◈</div>
            <div className="empty-state__title">No tasks yet</div>
            <div className="empty-state__sub">Create your first task to get started</div>
            <Button onClick={() => setShowCreate(true)} style={{ marginTop: 12 }}>
              + Create Task
            </Button>
          </div>
        ) : (
          <div className="dashboard__tasks-grid">
            {recentTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={setEditTask} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Task">
        <TaskForm onSubmit={handleCreate} loading={creating} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Edit Task">
        {editTask && (
          <TaskForm
            initial={{
              title: editTask.title,
              description: editTask.description || '',
              status: editTask.status,
              priority: editTask.priority,
              due_date: editTask.due_date ? editTask.due_date.slice(0, 16) : '',
            }}
            onSubmit={handleUpdate}
            loading={updating}
          />
        )}
      </Modal>
    </div>
  );
}
