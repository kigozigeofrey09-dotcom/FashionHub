import type { AccountRole, Session, User } from '../types';
import { supabase } from './supabaseClient';

export const authService = {
  getSession: async (): Promise<Session> => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) throw new Error('Not authenticated');
    const user = data.session.user;

    let role = (user.user_metadata?.role as AccountRole) || 'buyer';
    let name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    let countryCode = user.user_metadata?.countryCode || 'UG';

    if (user.email?.toLowerCase() === 'kigozigeofrey09@gmail.com') {
      role = 'admin';
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profile) {
        if (profile.role) role = profile.role as AccountRole;
        if (profile.name) name = profile.name;
        if (profile.country_code) countryCode = profile.country_code;
        if (profile.email?.toLowerCase() === 'kigozigeofrey09@gmail.com') role = 'admin';
      }
    } catch {}

    return {
      user: {
        id: user.id,
        name,
        email: user.email || '',
        role,
        countryCode
      }
    };
  },

  signIn: async (input: { email: string; password: string; role: AccountRole }) => {
    const isSuperAdmin = input.email.toLowerCase() === 'kigozigeofrey09@gmail.com';
    const assignedRole = isSuperAdmin ? 'admin' : input.role;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });
    if (error) throw new Error(error.message);
    const user = data.user;

    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email,
        role: assignedRole,
        is_super_admin: isSuperAdmin,
        country_code: user.user_metadata?.countryCode || 'UG'
      });

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Welcome back to FashionHub! 🎉',
        body: 'Your account session is active. Check out the latest Kampala fashion drops and active orders.',
        type: 'info',
        is_read: false
      });
    } catch {}

    return {
      user: {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: assignedRole,
        countryCode: user.user_metadata?.countryCode || 'UG'
      }
    };
  },

  signUp: async (input: { name: string; email: string; password: string; role: AccountRole; countryCode: string }) => {
    const isSuperAdmin = input.email.toLowerCase() === 'kigozigeofrey09@gmail.com';
    const assignedRole = isSuperAdmin ? 'admin' : input.role;

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          role: assignedRole,
          countryCode: input.countryCode,
          isSuperAdmin
        }
      }
    });
    if (error) throw new Error(error.message);

    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: input.name,
          email: input.email,
          role: assignedRole,
          is_super_admin: isSuperAdmin,
          country_code: input.countryCode
        });

        await supabase.from('notifications').insert({
          user_id: data.user.id,
          title: 'Welcome to FashionHub! 🎉',
          body: 'Your account is active. Explore independent fashion, connect with makers, and enjoy your 1-month free trial.',
          type: 'info',
          is_read: false
        });
      } catch {}
    }

    return { message: 'Account created successfully! Please sign in with your email and password.' };
  },

  requestPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
    return { message: 'Password reset email sent.' };
  },

  confirmPasswordReset: async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return { message: 'Password updated successfully.' };
  },

  whoAmI: async (): Promise<User> => {
    const session = await authService.getSession();
    return session.user;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
};
