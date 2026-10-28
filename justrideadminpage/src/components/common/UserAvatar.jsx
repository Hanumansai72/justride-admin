import React, { useState } from 'react';
import './UserAvatar.css';

export default function UserAvatar({ src, name, email }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const label = name?.trim() || email?.trim() || 'User';
  return src && src !== failedSrc
    ? <img className="jr-user-avatar" src={src} alt={label} loading="lazy" onError={() => setFailedSrc(src)} />
    : <span className="jr-user-avatar jr-user-initial" role="img" aria-label={label}>{Array.from(label)[0].toUpperCase()}</span>;
}
