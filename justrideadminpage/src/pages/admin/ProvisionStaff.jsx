import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { helpersApi } from '../../api/services';
import './ProvisionStaff.css';

export default function ProvisionStaff({ onNavigate, onLogout }) {
  const [empId, setEmpId] = useState(`EMP-${String(Math.floor(100000 + Math.random() * 900000))}`);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('HELPER');
  const [department, setDepartment] = useState('ble');
  const [tempPassword, setTempPassword] = useState('StaffPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const regenerateEmpId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setEmpId(`EMP-${randomNum}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: fullName.trim(),
        email: email.trim(),
        username: username.trim() || undefined,
        employee_id: empId.trim().toUpperCase(),
        password: tempPassword,
        phonenumber: phone.trim() || undefined,
        role: role,
      };

      const res = await helpersApi.createHelper(payload);
      if (res?.success) {
        alert(`Staff account provisioned successfully: [${res.data?.employee_id || empId}] ${fullName}`);
        if (onNavigate) onNavigate('helpers');
      }
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to provision staff account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDepartmentLabel = (deptKey) => {
    switch (deptKey) {
      case 'ble':
        return 'BLE Systems';
      case 'hardware':
        return 'Hardware Diagnostics';
      case 'account':
        return 'Account Recovery';
      default:
        return 'BLE Systems';
    }
  };

  const getRoleLabel = (roleKey) => {
    switch (roleKey) {
      case 'HELPER':
        return 'Helper';
      case 'SENIOR_HELPER':
        return 'Senior Helper';
      case 'LEAD_SUPPORT':
        return 'Lead Support';
      default:
        return 'Helper';
    }
  };

  return (
    <div className="provision-staff-page">
      {/* Universal Sidebar */}
      <Sidebar activeRoute="helpers" onNavigate={onNavigate} onLogout={onLogout} />

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
              <h1 className="page-main-heading">Provision Staff Member</h1>
              <p className="page-sub-heading">
                Create a corporate customer support or diagnostics engineer account.
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
                      <span className="material-symbols-outlined text-primary">badge</span>
                      <h3 className="section-title">Identity &amp; Employee ID</h3>
                    </div>

                    <div className="fields-grid-2x2">
                      {/* Auto-generated Employee ID banner */}
                      <div className="employee-id-banner">
                        <div>
                          <label className="field-label-sm">
                            Employee ID (Unique Corporate Key)
                          </label>
                          <span className="emp-id-val font-mono">{empId}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-refresh-id"
                          title="Generate new ID"
                          onClick={regenerateEmpId}
                        >
                          <span className="material-symbols-outlined">refresh</span>
                        </button>
                      </div>

                      {/* Full Name */}
                      <div className="field-group">
                        <label className="field-label">Full Name</label>
                        <input
                          type="text"
                          className="custom-form-input"
                          placeholder="e.g. Jane Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>

                      {/* Username */}
                      <div className="field-group">
                        <label className="field-label">Username</label>
                        <input
                          type="text"
                          className="custom-form-input"
                          placeholder="e.g. jdoe"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>

                      {/* Corporate Email */}
                      <div className="field-group">
                        <label className="field-label">Corporate Email</label>
                        <input
                          type="email"
                          className="custom-form-input"
                          placeholder="name@justride.io"
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
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Access & Role Section */}
                  <section className="form-card-section">
                    <div className="section-header-row">
                      <span className="material-symbols-outlined text-primary">
                        admin_panel_settings
                      </span>
                      <h3 className="section-title">Access &amp; Role</h3>
                    </div>

                    <div className="fields-grid-3">
                      <div className="field-group">
                        <label className="field-label">Role</label>
                        <select
                          className="custom-form-input appearance-none"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                        >
                          <option value="HELPER">Helper (Support Specialist)</option>
                          <option value="SENIOR_HELPER">Senior Helper</option>
                          <option value="LEAD_SUPPORT">Lead Support Engineer</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Department</label>
                        <select
                          className="custom-form-input appearance-none"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                        >
                          <option value="ble">BLE & Telemetry</option>
                          <option value="hardware">Hardware Diagnostics</option>
                          <option value="account">Account & Billing</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Security Section */}
                  <section className="form-card-section">
                    <div className="section-header-row">
                      <span className="material-symbols-outlined text-primary">lock</span>
                      <h3 className="section-title">Initial Credentials</h3>
                    </div>

                    <div className="security-form-stack">
                      <div className="field-group">
                        <label className="field-label">Temporary Password</label>
                        <div className="password-input-wrap">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="custom-form-input"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="btn-toggle-pw"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <span className="material-symbols-outlined icon-16">
                              {showPassword ? 'visibility' : 'visibility_off'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right: Live Profile Preview (4 cols) */}
                <div className="preview-right-col">
                  <div className="sticky-preview-wrapper">
                    <h3 className="preview-heading">Profile Preview</h3>

                    <div className="profile-preview-card">
                      {/* Banner Pattern */}
                      <div className="preview-banner-bg">
                        <div className="banner-diagonal-pattern" />
                      </div>

                      <div className="preview-card-body">
                        {/* Avatar */}
                        <div className="preview-avatar-circle">
                          <span className="material-symbols-outlined default-user-icon">
                            badge
                          </span>
                        </div>

                        {/* Text Header */}
                        <div className="preview-name-center">
                          <h4 className="preview-full-name truncate">
                            {fullName || 'New Staff Member'}
                          </h4>
                          <p className="preview-role-dept">
                            {getRoleLabel(role)} • {getDepartmentLabel(department)}
                          </p>
                          <div className="preview-status-pill pill-active">
                            <span>ACTIVE</span>
                          </div>
                        </div>

                        {/* Metadata Rows */}
                        <div className="preview-meta-rows">
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">badge</span>
                            <span className="font-mono">{empId}</span>
                          </div>
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">mail</span>
                            <span className="truncate">{email || 'email@justride.io'}</span>
                          </div>
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">phone</span>
                            <span>{phone || 'Pending'}</span>
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
                  onClick={() => onNavigate && onNavigate('helpers')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-create-action btn-glow"
                  style={{ opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Creating Account...' : 'Provision Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
