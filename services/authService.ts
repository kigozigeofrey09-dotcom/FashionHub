import type { AccountRole, Session, User } from '../types';
import { supabase } from './supabaseClient';

export const authService = {
  getSession: async (): Promise<Session> => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) throw new Error('Not authenticated');
    const user = data.session.user;

    // Fetch or fallback profile from profiles table
    let role = (user.user_metadata?.role as AccountRole) || 'buyer';
    let name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    let countryCode = user.user_metadata?.countryCode || 'UG';

    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profile) {
        if (profile.role) role = profile.role as AccountRole;
        if (profile.name) name = profile.name;
        if (profile.country_code) countryCode = profile.country_code;
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });
    if (error) throw new Error(error.message);
    const user = data.user;

    // Ensure profile row exists in database
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email,
        role: input.role,
        country_code: user.user_metadata?.countryCode || 'UG'
      });
    } catch {}

    return {
      user: {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: input.role,
        countryCode: user.user_metadata?.countryCode || 'UG'
      }
    };
  },

  signUp: async (input: { name: string; email: string; password: string; role: AccountRole; countryCode: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          role: input.role,
          countryCode: input.countryCode
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
          role: input.role,
          country_code: input.countryCode
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
