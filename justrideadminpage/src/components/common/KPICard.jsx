import React from 'react';
import './KPICard.css';

export default function KPICard({
  title,
  value,
  trend,
  trendPositive,
  trendIcon,
  subtext,
  icon,
  iconColor = 'text-primary',
  watermark,
}) {
  return (
    <div className="custom-kpi-card">
      {watermark && (
        <div className="kpi-watermark-bg">
          <span className="material-symbols-outlined watermark-glyph">{watermark}</span>
        </div>
      )}

      <div className="kpi-card-header">
        <span className="kpi-title-text">{title}</span>
        {icon && (
          <span className={`material-symbols-outlined kpi-header-icon ${iconColor}`}>
            {icon}
          </span>
        )}
      </div>

      <div className="kpi-card-body">
        <span className="kpi-value-num">{value}</span>
        {trend && (
          <span
            className={`kpi-trend-pill ${
              trendPositive ? 'trend-up' : 'trend-down'
            }`}
          >
            {trendIcon && (
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {trendIcon}
              </span>
            )}
            {trend}
          </span>
        )}
      </div>

      {subtext && <p className="kpi-subtext-msg">{subtext}</p>}
    </div>
  );
}
