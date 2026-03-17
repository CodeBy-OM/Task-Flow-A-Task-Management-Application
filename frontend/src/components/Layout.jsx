import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Layout.css';

const NAV = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/tasks',     icon: '◈', label: 'Tasks' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <div className={`layout ${collapsed ? 'layout--collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar__header">
          <span className="sidebar__logo">
            <span className="sidebar__logo-icon">◈</span>
            {!collapsed && <span className="sidebar__logo-text">TaskFlow</span>}
          </span>
          <button className="sidebar__toggle" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
              <span className="sidebar__link-icon">{icon}</span>
              {!collapsed && <span className="sidebar__link-label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          {!collapsed && (
            <div className="sidebar__user">
              <div className="sidebar__avatar">
                {(user?.username?.[0] || 'U').toUpperCase()}
              </div>
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">{user?.username}</div>
                <div className="sidebar__user-email">{user?.email}</div>
              </div>
            </div>
          )}
          <button className="sidebar__logout" onClick={handleLogout} title="Logout">
            <span>⎋</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="layout__main">
        <div className="layout__content fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
