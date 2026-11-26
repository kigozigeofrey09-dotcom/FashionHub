import { supabase } from './supabaseClient';
import type { Notification } from '../types';

function mapNotificationRow(row: any): Notification {
  return {
    id: String(row?.id ?? ''),
    kind: String(row?.kind ?? row?.type ?? 'update'),
    title: String(row?.title ?? 'Notification'),
    message: String(row?.message ?? row?.body ?? ''),
    createdAt: String(row?.created_at ?? row?.createdAt ?? new Date().toISOString()),
    readAt: row?.read_at ?? row?.readAt ?? null,
    href: row?.href ?? row?.link ?? undefined,
  };
}

export const notificationService = {
  mine: async (): Promise<Notification[]> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !Array.isArray(data)) return [];
      return data.map(mapNotificationRow);
    } catch {
      return [];
    }
  },

  unreadCount: async (): Promise<{ unread: number }> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return { unread: 0 };

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .limit(100);

      if (error || !Array.isArray(data)) return { unread: 0 };
      const unread = data.filter((row: any) => !row?.read_at && !row?.readAt && row?.is_read !== true).length;
      return { unread };
    } catch {
      return { unread: 0 };
    }
  },

  markRead: async (id: string): Promise<Notification | void> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId || !id) return;

      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle();

      if (!error && data) return mapNotificationRow(data);
    } catch {
      // ignore if table/columns differ
    }
  },

  markAllRead: async (): Promise<void> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return;

      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
    } catch {
      // ignore if table/columns differ
    }
  },
};