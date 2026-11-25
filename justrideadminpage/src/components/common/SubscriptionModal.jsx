import React, { useEffect, useRef, useState } from 'react';
import { usersApi } from '../../api/services';
import './SubscriptionModal.css';

export default function SubscriptionModal({ user, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [customDays, setCustomDays] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const node = dialogRef.current;
    if (node && !node.open) {
      node.showModal();
    }
    return () => {
      if (node?.open) node.close();
    };
  }, []);

  const now = new Date();
  const currentPremiumUntil = user?.premium_until ? new Date(user.premium_until) : null;
  const isCurrentlyPremium = currentPremiumUntil && currentPremiumUntil > now;
  const daysRemaining = isCurrentlyPremium
    ? Math.max(0, Math.ceil((currentPremiumUntil - now) / (1000 * 60 * 60 * 24)))
    : 0;

  // Calculate projected date
  let effectiveDays = 0;
  if (isRevoking) {
    effectiveDays = 0;
  } else if (isCustom) {
    effectiveDays = parseInt(customDays, 10) || 0;
  } else {
    effectiveDays = selectedDays;
  }

  const projectedDate = effectiveDays > 0 ? new Date(Date.now() + effectiveDays * 86400000) : null;

  const handleApply = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isRevoking && (!effectiveDays || effectiveDays < 1 || effectiveDays > 1095)) {
      setErrorMsg('Please specify between 1 and 1095 subscription days.');
      return;
    }

    setIsBusy(true);
    try {
      const res = await usersApi.updateSubscription(user.id || user._id, effectiveDays);
      if (res?.success) {
        onSaved?.(res.data?.premiumUntil ?? null);
        onClose?.();
      } else {
        throw new Error(res?.message || 'Failed to update subscription.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Subscription update failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="jr-sub-modal" onClose={onClose}>
      <div className="sub-modal-content">
        {/* Header */}
        <div className="sub-modal-header">
          <div className="sub-modal-title-wrap">
            <div className="sub-crown-icon">
              <span className="material-symbols-outlined">workspace_premium</span>
            </div>
            <div>
              <h2 className="sub-modal-title">Manage Subscription</h2>
              <p className="sub-modal-user">{user?.name || 'User'} &bull; <span className="sub-modal-email">{user?.email}</span></p>
            </div>
          </div>
          <button type="button" className="sub-close-btn" onClick={onClose} aria-label="Close dialog">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Current Status Card */}
        <div className={`sub-status-card ${isCurrentlyPremium ? 'is-premium' : 'is-free'}`}>
          <div className="sub-status-left">
            <span className="sub-status-label">Current Plan</span>
            <div className="sub-status-val">
              {isCurrentlyPremium ? (
                <>
                  <span className="sub-pill premium">⭐ PREMIUM ACTIVE</span>
                  <span className="sub-days-left">{daysRemaining} days remaining</span>
                </>
              ) : currentPremiumUntil ? (
                <>
                  <span className="sub-pill expired">EXPIRED</span>
                  <span className="sub-expired-date">Ended {currentPremiumUntil.toLocaleDateString()}</span>
                </>
              ) : (
                <span className="sub-pill free">FREE TIER</span>
              )}
            </div>
          </div>
          {isCurrentlyPremium && (
            <div className="sub-status-expiry">
              <span>Valid Until:</span>
              <strong>{currentPremiumUntil.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
            </div>
          )}
        </div>

        {/* Form Options */}
        <form onSubmit={handleApply} className="sub-form">
          <label className="sub-section-heading">Select Subscription Duration</label>

          {/* Quick Presets */}
          <div className="sub-presets-grid">
            {[
              { days: 30, label: '1 Month', badge: '30 Days' },
              { days: 90, label: '3 Months', badge: '90 Days' },
              { days: 180, label: '6 Months', badge: '180 Days' },
              { days: 365, label: '1 Year', badge: '365 Days' },
            ].map((preset) => {
              const active = !isCustom && !isRevoking && selectedDays === preset.days;
              return (
                <button
                  type="button"
                  key={preset.days}
                  className={`sub-preset-btn ${active ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDays(preset.days);
                    setIsCustom(false);
                    setIsRevoking(false);
                  }}
                >
                  <span className="preset-label">{preset.label}</span>
                  <span className="preset-days">{preset.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Days Input */}
          <div className="sub-custom-row">
            <button
              type="button"
              className={`sub-preset-btn custom-toggle ${isCustom ? 'active' : ''}`}
              onClick={() => {
                setIsCustom(true);
                setIsRevoking(false);
              }}
            >
              <span className="material-symbols-outlined">tune</span>
              <span>Custom Days</span>
            </button>

            {isCustom && (
              <div className="sub-custom-input-wrap">
                <input
                  type="number"
                  min="1"
                  max="1095"
                  placeholder="e.g. 60"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="sub-custom-input"
                  autoFocus
                />
                <span className="sub-input-suffix">Days (max 1095)</span>
              </div>
            )}
          </div>

          {/* Revoke Option */}
          {isCurrentlyPremium && (
            <div className="sub-revoke-wrap">
              <button
                type="button"
                className={`sub-revoke-btn ${isRevoking ? 'active' : ''}`}
                onClick={() => {
                  setIsRevoking(!isRevoking);
                  setIsCustom(false);
                }}
              >
                <span className="material-symbols-outlined">cancel</span>
                <span>{isRevoking ? 'Cancel Revocation' : 'Revoke Premium Access (Reset to Free)'}</span>
              </button>
            </div>
          )}

          {/* Preview New Date */}
          <div className="sub-preview-box">
            <span className="sub-preview-label">Action Outcome:</span>
            {isRevoking ? (
              <span className="sub-preview-outcome danger">User will immediately revert to Free Tier</span>
            ) : projectedDate ? (
              <span className="sub-preview-outcome success">
                Premium will be active until <strong>{projectedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong> ({effectiveDays} days)
              </span>
            ) : (
              <span className="sub-preview-outcome text-muted">Enter valid days to see preview</span>
            )}
          </div>

          {errorMsg && <div className="sub-error-alert">{errorMsg}</div>}

          {/* Actions */}
          <div className="sub-actions-row">
            <button type="button" className="sub-btn-cancel" onClick={onClose} disabled={isBusy}>
              Cancel
            </button>
            <button
              type="submit"
              className={`sub-btn-apply ${isRevoking ? 'danger' : 'primary'}`}
              disabled={isBusy || (!isRevoking && (!effectiveDays || effectiveDays < 1))}
            >
              {isBusy ? (
                <>
                  <span className="material-symbols-outlined spin-icon">sync</span>
                  <span>Updating...</span>
                </>
              ) : isRevoking ? (
                'Revoke Subscription'
              ) : (
                'Enable Subscription'
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
