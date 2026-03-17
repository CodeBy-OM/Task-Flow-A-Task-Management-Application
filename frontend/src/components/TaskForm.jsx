import React, { useState } from 'react';
import { Button, Input, Textarea, Select } from './UI';

const INITIAL = {
  title: '', description: '', status: 'pending',
  priority: 'medium', due_date: '',
};

export default function TaskForm({ onSubmit, initial = {}, loading }) {
  const [form, setForm] = useState({ ...INITIAL, ...initial });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.title.length > 200) errs.title = 'Title is too long';
    if (form.description.length > 2000) errs.description = 'Description is too long';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form };
    if (!payload.due_date) delete payload.due_date;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        id="title" label="Title *" placeholder="What needs to be done?"
        value={form.title} onChange={set('title')} error={errors.title}
        maxLength={200} autoFocus
      />
      <Textarea
        id="description" label="Description"
        placeholder="Add details about this task..."
        value={form.description} onChange={set('description')} error={errors.description}
        rows={4}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Select id="status" label="Status" value={form.status} onChange={set('status')}>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select id="priority" label="Priority" value={form.priority} onChange={set('priority')}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>
      <Input
        id="due_date" label="Due Date" type="datetime-local"
        value={form.due_date} onChange={set('due_date')}
      />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
        <Button type="submit" loading={loading}>
          {initial.title ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
