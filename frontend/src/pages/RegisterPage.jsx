import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/UI';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => {
    setForm((prev) => ({ ...prev, [f]: e.target.value }));
    if (errors[f]) setErrors((prev) => ({ ...prev, [f]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username))
      errs.username = 'Username: 3-30 chars, letters/numbers/underscores only';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      errs.password = 'Must include upper, lower, and digit';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to TaskFlow 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
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
          <h1 className="auth-card__title">Create account</h1>
          <p className="auth-card__sub">Start managing your tasks today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            id="full_name" label="Full Name (optional)"
            placeholder="Jane Doe"
            value={form.full_name} onChange={set('full_name')}
            autoFocus
          />
          <Input
            id="username" label="Username *"
            placeholder="janedoe"
            value={form.username} onChange={set('username')} error={errors.username}
            autoComplete="username"
          />
          <Input
            id="email" label="Email *" type="email"
            placeholder="you@example.com"
            value={form.email} onChange={set('email')} error={errors.email}
            autoComplete="email"
          />
          <Input
            id="password" label="Password *" type="password"
            placeholder="Min. 8 chars, upper + lower + digit"
            value={form.password} onChange={set('password')} error={errors.password}
            autoComplete="new-password"
          />
          <Button type="submit" loading={loading} size="lg" style={{ width: '100%', marginTop: 4 }}>
            Create Account
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
