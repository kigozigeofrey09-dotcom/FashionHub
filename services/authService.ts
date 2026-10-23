import type { AccountRole, Session, User } from '../types';
import { supabase } from './supabaseClient';

export const authService = {
  getSession: async (): Promise<Session> => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) throw new Error('Not authenticated');
    const user = data.session.user;
    return {
      user: {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: (user.user_metadata?.role as AccountRole) || 'buyer',
        countryCode: user.user_metadata?.countryCode || 'UG'
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
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error('Not authenticated');
    const user = data.user;
    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      role: (user.user_metadata?.role as AccountRole) || 'buyer',
      countryCode: user.user_metadata?.countryCode || 'UG'
    };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
};
