export function notificationTarget(notification) {
  if (notification.data?.ticket_id) return `/support/${encodeURIComponent(notification.data.ticket_id)}`;
  if (notification.type === 'NEW_USER_REGISTERED' && notification.data?.user_id) return `/users/${encodeURIComponent(notification.data.user_id)}`;
  if (notification.type === 'ADMIN_SIGN_IN') return '/audit-logs';
  return '/notifications';
}
