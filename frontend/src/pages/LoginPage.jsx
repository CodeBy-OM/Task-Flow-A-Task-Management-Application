import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/UI';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => {
    setForm((prev) => ({ ...prev, [f]: e.target.value }));
    if (errors[f]) setErrors((prev) => ({ ...prev, [f]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      if (err.response?.status === 401) {
        setErrors({ email: ' ', password: 'Invalid email or password' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg__orb auth-bg__orb--1" />
        <div className="auth-bg__orb auth-bg__orb--2" />
      </div>

      <div className="auth-card fade-in">
        <div className="auth-card__brand">
          <span className="auth-card__brand-icon">◈</span>
          <span className="auth-card__brand-name">TaskFlow</span>
        </div>

        <div className="auth-card__header">
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__sub">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            id="email" label="Email" type="email"
            placeholder="you@example.com"
            value={form.email} onChange={set('email')} error={errors.email}
            autoComplete="email" autoFocus
          />
          <Input
            id="password" label="Password" type="password"
            placeholder="••••••••"
            value={form.password} onChange={set('password')} error={errors.password}
            autoComplete="current-password"
          />
          <Button type="submit" loading={loading} size="lg" style={{ width: '100%', marginTop: 4 }}>
            Sign In
          </Button>
        </form>

        <p className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-card__link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
