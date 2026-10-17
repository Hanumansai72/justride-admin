import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { usersApi } from '../../api/services';
import './ProvisionStaff.css';

export default function CreateUser({ onNavigate, onLogout }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('RiderPass123!');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: fullName.trim(),
        email: email.trim(),
        phonenumber: phone.trim() || undefined,
        password: password,
        emergency_contacts: emergencyContact.trim()
          ? [{ name: 'Primary Contact', phone: emergencyContact.trim(), relation: 'Emergency' }]
          : [],
      };

      const res = await usersApi.createUser(payload);
      if (res?.success) {
        alert(`Rider account created successfully for ${res.data?.name || fullName}!`);
        if (onNavigate) onNavigate('users');
      }
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="provision-staff-page">
      {/* Universal Sidebar */}
      <Sidebar activeRoute="users" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Pane */}
      <div className="provision-main-wrapper">
        {/* TopNavBar */}
        <header className="provision-topbar">
          <div className="topbar-right-controls">

            <button
              type="button"
              className="icon-btn"
              aria-label="Notifications"
              onClick={() => onNavigate && onNavigate('notifications')}
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div
              className="user-profile-avatar-h"
              onClick={() => onNavigate && onNavigate('helpers')}
              style={{ cursor: 'pointer' }}
              title="Staff Accounts"
            >
              <span>H</span>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="provision-canvas-content">
          <div className="canvas-max-wrap">
            {/* Header / Intro */}
            <div className="page-header-row">
              <h1 className="page-main-heading">Register Rider Profile</h1>
              <p className="page-sub-heading">
                Provision a new mobile application user account with emergency contact records.
              </p>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(var(--rgb-danger), 0.15)',
                  border: '1px solid rgba(var(--rgb-danger), 0.4)',
                  borderRadius: '8px',
                  color: 'var(--color-danger-light)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span className="material-symbols-outlined">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="provision-bento-grid">
                {/* Left: Form Sections (8 cols) */}
                <div className="form-left-col">
                  {/* Identity Section */}
                  <section className="form-card-section">
                    <div className="section-header-row">
                      <span className="material-symbols-outlined text-primary">person</span>
                      <h3 className="section-title">Rider Identity &amp; Contact</h3>
                    </div>

                    <div className="fields-grid-2x2">
                      {/* Full Name */}
                      <div className="field-group">
                        <label className="field-label">Full Name</label>
                        <input
                          type="text"
                          className="custom-form-input"
                          placeholder="e.g. Alex Mercer"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>

                      {/* Email */}
                      <div className="field-group">
                        <label className="field-label">Email Address</label>
                        <input
                          type="email"
                          className="custom-form-input"
                          placeholder="alex@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="field-group">
                        <label className="field-label">Phone Number</label>
                        <input
                          type="tel"
                          className="custom-form-input"
                          placeholder="+1 (555) 019-2834"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>

                      {/* Emergency Contact */}
                      <div className="field-group">
                        <label className="field-label">Emergency Contact Phone</label>
                        <input
                          type="tel"
                          className="custom-form-input"
                          placeholder="+1 (555) 888-0000"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                        />
                      </div>

                      {/* Initial Password */}
                      <div className="field-group" style={{ gridColumn: 'span 2' }}>
                        <label className="field-label">Account Password</label>
                        <input
                          type="password"
                          className="custom-form-input"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right: Live Profile Preview (4 cols) */}
                <div className="preview-right-col">
                  <div className="sticky-preview-wrapper">
                    <h3 className="preview-heading">Profile Preview</h3>

                    <div className="profile-preview-card">
                      <div className="preview-banner-bg">
                        <div className="banner-diagonal-pattern" />
                      </div>

                      <div className="preview-card-body">
                        <div className="preview-avatar-circle">
                          <span className="material-symbols-outlined default-user-icon">
                            person
                          </span>
                        </div>

                        <div className="preview-name-center">
                          <h4 className="preview-full-name truncate">
                            {fullName || 'New Rider Account'}
                          </h4>
                          <p className="preview-role-dept">
                            Standard Rider • ACTIVE
                          </p>
                          <div className="preview-status-pill pill-active">
                            <span>ACTIVE</span>
                          </div>
                        </div>

                        <div className="preview-meta-rows">
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">mail</span>
                            <span className="truncate">{email || 'email@example.com'}</span>
                          </div>
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">phone</span>
                            <span>{phone || 'Pending Phone'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="provision-action-bar">
                <button
                  type="button"
                  className="btn-cancel-action"
                  onClick={() => onNavigate && onNavigate('users')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-create-action btn-glow"
                  style={{ opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Registering...' : 'Register Rider Profile'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
