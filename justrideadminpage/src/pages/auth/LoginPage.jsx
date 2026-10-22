import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../App.css';

export default function LoginPage({ onLoginSuccess }) {
  const { login, authError } = useAuth();
  const [identifier, setIdentifier] = useState('admin@justride.io');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // 'admin' | 'staff'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await login({
        identifier,
        password,
        role,
      });

      if (onLoginSuccess && result) {
        onLoginSuccess({
          role: result.role,
          user: result.user,
        });
      }
    } catch (err) {
      console.warn('Backend login attempt returned:', err.message);
      const message =
        err.data?.message ||
        err.message ||
        'Authentication failed. Please verify credentials.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'admin') {
      setIdentifier('admin@justride.io');
    } else {
      setIdentifier('');
    }
    setPassword('');
    setErrorMsg('');
  };

  return (
    <div className="login-page">
      <aside className="login-intro" aria-label="JustRide operations">
        <div className="login-intro__brand"><img src="/favicon.svg" alt="" /><span>Just<span>Ride</span></span></div>
        <h2>Your operations.<br /><span>In view.</span></h2>
        <p>Manage devices, releases and rider support from one connected workspace.</p>
      </aside>
      <main className="login-card">
        {/* Subtle Top Accent */}
        <div className="top-accent" />

        {/* Header */}
        <div className="card-header">
          <div className="logo-badge">
            <img src="/favicon.svg" alt="JustRide" style={{ width: '28px', height: '28px' }} />
          </div>
          <h1 className="brand-title">JustRide</h1>
          <h2 className="portal-title">
            {role === 'admin' ? 'Administrator Portal' : 'Staff Helper Portal'}
          </h2>
          <p className="portal-subtitle">Sign in to JustRide IoT Operations</p>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            background: 'var(--bg-layer-2)',
            padding: '0.25rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-standard)',
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: role === 'admin' ? 'var(--color-primary)' : 'transparent',
              color: role === 'admin' ? 'var(--bg-layer-0)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => handleTabChange('admin')}
          >
            Admin Portal
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: role === 'staff' ? 'var(--color-primary)' : 'transparent',
              color: role === 'staff' ? 'var(--color-on-primary)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => handleTabChange('staff')}
          >
            Staff / Helper Portal
          </button>
        </div>

        {(errorMsg || authError) && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(var(--rgb-danger), 0.15)',
              border: '1px solid rgba(var(--rgb-danger), 0.4)',
              borderRadius: '8px',
              color: 'var(--color-danger-light)',
              fontSize: '12px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              error
            </span>
            <span>{errorMsg || authError}</span>
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Employee ID / Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="identifier">
              EMPLOYEE ID / USERNAME / EMAIL
            </label>
            <div className="input-wrapper input-glow">
              <span className="material-symbols-outlined input-icon">person</span>
              <input
                id="identifier"
                type="text"
                className="form-input"
                placeholder={role === 'admin' ? 'admin@justride.io' : 'EMP-001001 / staff@justride.io'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              PASSWORD
            </label>
            <div className="input-wrapper input-glow">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input password-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="form-controls">
            <label className="remember-label">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {rememberMe && (
                  <span
                    className="material-symbols-outlined checkbox-check-icon"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                )}
              </div>
              <span className="remember-text">Remember session</span>
            </label>
            <a
              href="#demo-credentials"
              className="forgot-link"
              onClick={(e) => {
                e.preventDefault();
                alert('Default credentials: Admin (admin@justride.io / password123) or Staff (EMP-001001 / staff123)');
              }}
            >
              Need credentials?
            </a>
          </div>

          {/* Submit Button */}
          <div className="submit-wrapper">
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-btn btn-glow"
              style={
                role === 'staff'
                  ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', opacity: isSubmitting ? 0.7 : 1 }
                  : { opacity: isSubmitting ? 0.7 : 1 }
              }
            >
              <span>
                {isSubmitting ? 'Authenticating...' : `Sign In as ${role === 'admin' ? 'Admin' : 'Staff'}`}
              </span>
              <span className="material-symbols-outlined submit-arrow-icon">
                {isSubmitting ? 'sync' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </form>

        {/* Environment Indicator */}
        <div className="security-tag">
          <span className="material-symbols-outlined" style={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '4px' }}>
            shield
          </span>
          <span>SECURE 256-BIT ENCRYPTED CONNECTION</span>
        </div>
      </main>
    </div>
  );
}
