import React, { useState, useCallback } from 'react';
import { useTasks, useCreateTask, useUpdateTask } from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { Modal, Pagination, Button, Select, Skeleton } from '../components/UI';
import './TasksPage.css';

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITIES = [
  { value: '', label: 'All Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'title', label: 'Title' },
  { value: 'priority', label: 'Priority' },
];

export default function TasksPage() {
  const [filters, setFilters] = useState({
    page: 1, limit: 12, status: '', priority: '',
    search: '', sortBy: 'created_at', sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // Debounced search
  const [searchTimer, setSearchTimer] = useState(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => {
      setFilters((f) => ({ ...f, search: val, page: 1 }));
    }, 400));
  };

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
  );

  const { data, isLoading, isError } = useTasks(activeFilters);
  const tasks = data?.tasks || [];
  const pagination = data?.pagination;

  const { mutate: createTask, isPending: creating } = useCreateTask();
  const { mutate: updateTask, isPending: updating } = useUpdateTask();

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value, page: 1 }));
  };

  const handleCreate = (formData) => {
    createTask(formData, { onSuccess: () => setShowCreate(false) });
  };

  const handleUpdate = (formData) => {
    updateTask({ id: editTask.id, data: formData }, { onSuccess: () => setEditTask(null) });
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 12, status: '', priority: '', search: '', sortBy: 'created_at', sortOrder: 'desc' });
    setSearchInput('');
  };

  const hasActiveFilters = filters.status || filters.priority || filters.search;

  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="tasks-page__header">
        <div>
          <h1 className="tasks-page__title">Tasks</h1>
          {pagination && (
            <p className="tasks-page__count">{pagination.total} task{pagination.total !== 1 ? 's' : ''}</p>
          )}
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Task</Button>
      </div>

      {/* Filters Bar */}
      <div className="tasks-page__filters">
        <div className="tasks-page__search-wrap">
          <span className="tasks-page__search-icon">⌕</span>
          <input
            className="tasks-page__search"
            placeholder="Search by title..."
            value={searchInput}
            onChange={handleSearchChange}
          />
          {searchInput && (
            <button className="tasks-page__clear-search"
              onClick={() => { setSearchInput(''); setFilters((f) => ({ ...f, search: '', page: 1 })); }}>
              ✕
            </button>
          )}
        </div>

        <Select value={filters.status} onChange={setFilter('status')} style={{ minWidth: 140 }}>
          {STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>

        <Select value={filters.priority} onChange={setFilter('priority')} style={{ minWidth: 140 }}>
          {PRIORITIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>

        <Select value={filters.sortBy} onChange={setFilter('sortBy')} style={{ minWidth: 160 }}>
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>

        <button
          className={`tasks-page__sort-order ${filters.sortOrder === 'asc' ? 'tasks-page__sort-order--asc' : ''}`}
          onClick={() => setFilters((f) => ({ ...f, sortOrder: f.sortOrder === 'desc' ? 'asc' : 'desc' }))}
          title={`Sort ${filters.sortOrder === 'desc' ? 'ascending' : 'descending'}`}
        >
          {filters.sortOrder === 'desc' ? '↓' : '↑'}
        </button>

        {hasActiveFilters && (
          <button className="tasks-page__clear-filters" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {/* Task Grid */}
      {isLoading ? (
        <div className="tasks-page__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="160px" style={{ borderRadius: 'var(--radius)' }} />
          ))}
        </div>
      ) : isError ? (
        <div className="empty-state">
          <div className="empty-state__icon">⚠</div>
          <div className="empty-state__title">Failed to load tasks</div>
          <div className="empty-state__sub">Please try refreshing the page</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">◈</div>
          <div className="empty-state__title">
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          </div>
          <div className="empty-state__sub">
            {hasActiveFilters ? 'Try adjusting your search or filters' : 'Create your first task to get started'}
          </div>
          {!hasActiveFilters && (
            <Button onClick={() => setShowCreate(true)} style={{ marginTop: 12 }}>
              + Create Task
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="tasks-page__grid">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={setEditTask} />
            ))}
          </div>
          <Pagination
            pagination={pagination}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </>
      )}

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
