import { request } from './http';
import type { Notification } from '../types';

export const notificationService = {
  mine: async (): Promise<Notification[]> => {
    try {
      return await request<Notification[]>('/account/notifications');
    } catch {
      return [];
    }
  },
  unreadCount: async (): Promise<{ unread: number }> => {
    try {
      return await request<{ unread: number }>('/account/notifications/unread-count');
    } catch {
      return { unread: 0 };
    }
  },
  markRead: (id: string) =>
    request<Notification>(`/account/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' }),
  markAllRead: () => request<void>('/account/notifications/read-all', { method: 'POST' }),
};
