import React from 'react';
import './Components.css';

// ── Button ────────────────────────────────────────────────
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled, className = '', ...props
}) => (
  <button
    className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <span className="btn__spinner" />}
    {children}
  </button>
);

// ── Input ─────────────────────────────────────────────────
export const Input = ({ label, error, id, className = '', ...props }) => (
  <div className={`field ${className}`}>
    {label && <label className="field__label" htmlFor={id}>{label}</label>}
    <input id={id} className={`field__input ${error ? 'field__input--error' : ''}`} {...props} />
    {error && <span className="field__error">{error}</span>}
  </div>
);

// ── Textarea ──────────────────────────────────────────────
export const Textarea = ({ label, error, id, className = '', ...props }) => (
  <div className={`field ${className}`}>
    {label && <label className="field__label" htmlFor={id}>{label}</label>}
    <textarea id={id} className={`field__input field__textarea ${error ? 'field__input--error' : ''}`} {...props} />
    {error && <span className="field__error">{error}</span>}
  </div>
);

// ── Select ────────────────────────────────────────────────
export const Select = ({ label, error, id, children, className = '', ...props }) => (
  <div className={`field ${className}`}>
    {label && <label className="field__label" htmlFor={id}>{label}</label>}
    <select id={id} className={`field__input field__select ${error ? 'field__input--error' : ''}`} {...props}>
      {children}
    </select>
    {error && <span className="field__error">{error}</span>}
  </div>
);

// ── Card ──────────────────────────────────────────────────
export const Card = ({ children, className = '', onClick, ...props }) => (
  <div className={`card ${onClick ? 'card--clickable' : ''} ${className}`} onClick={onClick} {...props}>
    {children}
  </div>
);

// ── Modal ─────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal--${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};

// ── Badge ─────────────────────────────────────────────────
export const StatusBadge = ({ status }) => (
  <span className={`badge badge--${status}`}>
    {status?.replace('_', ' ')}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`badge badge--${priority}`}>
    {priority}
  </span>
);

// ── Skeleton ──────────────────────────────────────────────
export const Skeleton = ({ width, height = '16px', className = '' }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width: width || '100%', height }}
  />
);

// ── Pagination ─────────────────────────────────────────────
export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span className="pagination__info">
        {from}–{to} of {total}
      </span>
      <div className="pagination__controls">
        <button
          className="pagination__btn"
          disabled={!pagination.hasPrevPage}
          onClick={() => onPageChange(page - 1)}
        >‹</button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          return (
            <button
              key={p}
              className={`pagination__btn ${p === page ? 'pagination__btn--active' : ''}`}
              onClick={() => onPageChange(p)}
            >{p}</button>
          );
        })}
        <button
          className="pagination__btn"
          disabled={!pagination.hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >›</button>
      </div>
    </div>
  );
};

// ── ConfirmDialog ─────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p style={{ color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);
