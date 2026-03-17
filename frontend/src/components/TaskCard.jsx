import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isPast, parseISO } from 'date-fns';
import { StatusBadge, PriorityBadge, Button, ConfirmDialog } from './UI';
import { useDeleteTask, useUpdateTaskStatus } from '../hooks/useTasks';
import './TaskCard.css';

export default function TaskCard({ task, onEdit }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: deleteTask, isPending: deleting } = useDeleteTask();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const isOverdue = task.due_date &&
    isPast(typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date)) &&
    !['completed', 'cancelled'].includes(task.status);

  const nextStatus = {
    pending: 'in_progress',
    in_progress: 'completed',
    completed: null,
    cancelled: null,
  }[task.status];

  const nextLabel = { pending: 'Start', in_progress: 'Complete' }[task.status];

  return (
    <>
      <div className="task-card" onClick={() => navigate(`/tasks/${task.id}`)}>
        <div className="task-card__header">
          <div className="task-card__badges">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {isOverdue && <span className="badge badge--cancelled">Overdue</span>}
          </div>
          <div className="task-card__actions" onClick={(e) => e.stopPropagation()}>
            {nextStatus && (
              <button
                className="task-card__action-btn"
                onClick={() => updateStatus({ id: task.id, status: nextStatus })}
                title={`Mark as ${nextStatus}`}
              >
                {nextStatus === 'in_progress' ? '▷' : '✓'}
              </button>
            )}
            <button
              className="task-card__action-btn"
              onClick={() => onEdit(task)}
              title="Edit task"
            >✎</button>
            <button
              className="task-card__action-btn task-card__action-btn--danger"
              onClick={() => setConfirmDelete(true)}
              title="Delete task"
            >✕</button>
          </div>
        </div>

        <h3 className="task-card__title">{task.title}</h3>

        {task.description && (
          <p className="task-card__desc">{task.description}</p>
        )}

        <div className="task-card__footer">
          {task.due_date && (
            <span className={`task-card__due ${isOverdue ? 'task-card__due--overdue' : ''}`}>
              ⏱ {format(
                typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date),
                'MMM d, yyyy'
              )}
            </span>
          )}
          <span className="task-card__created">
            {format(
              typeof task.created_at === 'string' ? parseISO(task.created_at) : new Date(task.created_at),
              'MMM d'
            )}
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteTask(task.id)}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
