import React from 'react';
import './StatsCard.css';

export default function StatsCard({ label, value, icon, color, sub }) {
  return (
    <div className="stats-card" style={{ '--stats-color': color }}>
      <div className="stats-card__icon">{icon}</div>
      <div className="stats-card__body">
        <div className="stats-card__value">{value ?? '—'}</div>
        <div className="stats-card__label">{label}</div>
        {sub && <div className="stats-card__sub">{sub}</div>}
      </div>
    </div>
  );
}
