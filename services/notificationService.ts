import type { Notification } from '../types';
import { supabase } from './supabaseClient';

export const notificationService = {
  mine: async (): Promise<Notification[]> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.user.id).order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      type: row.type || 'info',
      isRead: Boolean(row.is_read),
      createdAt: row.created_at
    }));
  },

  unreadCount: async (): Promise<{ unread: number }> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return { unread: 0 };
    const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.user.id).eq('is_read', false);
    if (error) return { unread: 0 };
    return { unread: count || 0 };
  },

  markRead: async (id: string): Promise<Notification> => {
    const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select('*').single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      body: data.body,
      type: data.type || 'info',
      isRead: Boolean(data.is_read),
      createdAt: data.created_at
    };
  },

  markAllRead: async (): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.user.id);
  },
};
