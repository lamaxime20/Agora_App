import { apiFetch } from './api.js';

export async function getNotifications({ page = 1, limit = 25, filter = 'all', search = '' } = {}) {
  const params = new URLSearchParams({ page, limit, filter });
  if (search) params.set('search', search);
  return apiFetch(`notifications?${params}`);
}

export async function getUnreadCount() {
  return apiFetch('notifications/unread-count');
}

export async function markRead(id) {
  return apiFetch(`notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllRead() {
  return apiFetch('notifications/read-all', { method: 'PATCH' });
}

export async function archiveNotification(id) {
  return apiFetch(`notifications/${id}/archive`, { method: 'PATCH' });
}

export async function archiveAll() {
  return apiFetch('notifications/archive-all', { method: 'PATCH' });
}

export async function deleteNotification(id) {
  return apiFetch(`notifications/${id}`, { method: 'DELETE' });
}

export async function deleteNotificationsBulk(ids) {
  return apiFetch('notifications/bulk', { method: 'DELETE', body: { ids } });
}

export async function deleteArchivedNotifications() {
  return apiFetch('notifications/archived', { method: 'DELETE' });
}
