import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useTask, useUpdateTask, useDeleteTask, useUpdateTaskStatus } from '../hooks/useTasks';
import TaskForm from '../components/TaskForm';
import { Modal, Button, StatusBadge, PriorityBadge, ConfirmDialog, Skeleton } from '../components/UI';
import './TaskDetailPage.css';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: task, isLoading, isError } = useTask(id);
  const { mutate: updateTask, isPending: updating } = useUpdateTask();
  const { mutate: deleteTask, isPending: deleting } = useDeleteTask();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const handleUpdate = (formData) => {
    updateTask({ id, data: formData }, { onSuccess: () => setShowEdit(false) });
  };

  const handleDelete = () => {
    deleteTask(id, { onSuccess: () => navigate('/tasks') });
  };

  const fmt = (d) => {
    if (!d) return '—';
    try { return format(typeof d === 'string' ? parseISO(d) : new Date(d), 'MMM d, yyyy · h:mm a'); }
    catch { return d; }
  };

  if (isLoading) {
    return (
      <div className="task-detail">
        <Skeleton height="32px" width="200px" style={{ marginBottom: 24 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height="40px" />
          <Skeleton height="120px" />
          <Skeleton height="60px" />
        </div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="task-detail">
        <div className="empty-state">
          <div className="empty-state__icon">⚠</div>
          <div className="empty-state__title">Task not found</div>
          <Button onClick={() => navigate('/tasks')} style={{ marginTop: 12 }}>← Back to Tasks</Button>
        </div>
      </div>
    );
  }

  const STATUS_TRANSITIONS = {
    pending: [{ status: 'in_progress', label: 'Start Task', icon: '▷' }, { status: 'cancelled', label: 'Cancel', icon: '✕' }],
    in_progress: [{ status: 'completed', label: 'Complete', icon: '✓' }, { status: 'pending', label: 'Pause', icon: '⏸' }],
    completed: [{ status: 'pending', label: 'Reopen', icon: '↩' }],
    cancelled: [{ status: 'pending', label: 'Reopen', icon: '↩' }],
  };

  const transitions = STATUS_TRANSITIONS[task.status] || [];

  return (
    <div className="task-detail fade-in">
      {/* Back */}
      <button className="task-detail__back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="task-detail__layout">
        {/* Main content */}
        <div className="task-detail__main">
          <div className="task-detail__card">
            <div className="task-detail__badges">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>

            <h1 className="task-detail__title">{task.title}</h1>

            <div className="task-detail__description">
              {task.description
                ? <p>{task.description}</p>
                : <p className="task-detail__no-desc">No description provided.</p>
              }
            </div>

            {/* Status transitions */}
            {transitions.length > 0 && (
              <div className="task-detail__transitions">
                {transitions.map(({ status, label, icon }) => (
                  <Button
                    key={status}
                    variant={status === 'completed' ? 'success' : status === 'cancelled' ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => updateStatus({ id, status })}
                  >
                    {icon} {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="task-detail__sidebar">
          <div className="task-detail__meta-card">
            <h3 className="task-detail__meta-title">Task Details</h3>
            <div className="task-detail__meta-list">
              <div className="task-detail__meta-row">
                <span className="task-detail__meta-key">Status</span>
                <StatusBadge status={task.status} />
              </div>
              <div className="task-detail__meta-row">
                <span className="task-detail__meta-key">Priority</span>
                <PriorityBadge priority={task.priority} />
              </div>
              <div className="task-detail__meta-row">
                <span className="task-detail__meta-key">Due Date</span>
                <span className="task-detail__meta-val">{fmt(task.due_date)}</span>
              </div>
              <div className="task-detail__meta-row">
                <span className="task-detail__meta-key">Created</span>
                <span className="task-detail__meta-val">{fmt(task.created_at)}</span>
              </div>
              <div className="task-detail__meta-row">
                <span className="task-detail__meta-key">Updated</span>
                <span className="task-detail__meta-val">{fmt(task.updated_at)}</span>
              </div>
              <div className="task-detail__meta-row">
                <span className="task-detail__meta-key">ID</span>
                <span className="task-detail__meta-val task-detail__meta-id">{task.id}</span>
              </div>
            </div>

            <div className="task-detail__actions">
              <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)} style={{ flex: 1 }}>
                ✎ Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)} style={{ flex: 1 }}>
                ✕ Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Task">
        <TaskForm
          initial={{
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            due_date: task.due_date ? task.due_date.slice(0, 16) : '',
          }}
          onSubmit={handleUpdate}
          loading={updating}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        danger
      />
    </div>
  );
}
