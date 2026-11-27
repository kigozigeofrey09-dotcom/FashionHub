import type { AccountSettings, Listing } from '../types';
import { supabase } from './supabaseClient';
import { authService } from './authService';

export const accountService = {
  savedListings: async (): Promise<Listing[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      const { data, error } = await supabase
        .from('saved')
        .select('listings(*, shops(name, city, country_code, country_name, whatsapp_number, is_verified))')
        .eq('user_id', user.user.id);
      if (error) return [];
      return (data || [])
        .map((row: any) => {
          const l = row.listings;
          if (!l) return null;
          return {
            id: l.id,
            shopId: l.shop_id,
            shopName: l.shops?.name || 'Store',
            name: l.name,
            category: l.category,
            type: l.type,
            description: l.description || '',
            price: Number(l.price),
            currency: l.currency || 'UGX',
            countryCode: l.shops?.country_code || 'UG',
            countryName: l.shops?.country_name || 'Uganda',
            city: l.shops?.city || 'Kampala',
            image: l.image || l.image_url || '',
            images: l.images || [],
            sizes: l.sizes,
            colour: l.colour,
            serviceDetails: l.service_details,
            enquiryLabel: l.enquiry_label,
            sellerWhatsapp: l.shops?.whatsapp_number,
            isActive: l.is_active,
          };
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  },

  saveListing: async (listingId: string): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('saved').insert({ user_id: user.user.id, listing_id: listingId });
    if (error && error.code !== '23505') throw error;
  },

  removeSavedListing: async (listingId: string): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('saved').delete().eq('user_id', user.user.id).eq('listing_id', listingId);
    if (error) throw error;
  },

  settings: async (): Promise<AccountSettings> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return { name: '', email: '', role: 'buyer', countryCode: 'UG' };

    const metaRole = (user.user.user_metadata?.role as any) || 'buyer';
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.user.id).maybeSingle();
      return {
        name: data?.name || user.user.user_metadata?.name || user.user.email?.split('@')[0] || 'User',
        email: user.user.email || '',
        role:
          user.user.email?.toLowerCase() === 'kigozigeofrey09@gmail.com'
            ? 'admin'
            : (data?.role || metaRole),
        countryCode: data?.country_code || user.user.user_metadata?.countryCode || 'UG',
        city: data?.city || '',
      };
    } catch {
      return {
        name: user.user.user_metadata?.name || user.user.email?.split('@')[0] || 'User',
        email: user.user.email || '',
        role: user.user.email?.toLowerCase() === 'kigozigeofrey09@gmail.com' ? 'admin' : metaRole,
        countryCode: user.user.user_metadata?.countryCode || 'UG',
        city: '',
      };
    }
  },

  updateSettings: async (input: Partial<AccountSettings>): Promise<AccountSettings> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const update: any = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.countryCode !== undefined) update.country_code = input.countryCode;
    if (input.city !== undefined) update.city = input.city;

    await supabase.from('profiles').upsert({
      id: user.user.id,
      email: user.user.email,
      name: input.name || user.user.user_metadata?.name || user.user.email?.split('@')[0] || 'User',
      ...update,
    });
    return accountService.settings();
  },

  switchRole: async (targetRole: 'buyer' | 'seller'): Promise<AccountSettings> => {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;
    if (authErr || !user) throw new Error('Please sign in first.');

    if (user.email?.toLowerCase() === 'kigozigeofrey09@gmail.com') {
      return accountService.settings();
    }

    const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    const countryCode = user.user_metadata?.countryCode || 'UG';

    // 1. Update auth user_metadata and refresh session token
    const { error: metaError } = await supabase.auth.updateUser({
      data: { ...(user.user_metadata || {}), role: targetRole },
    });
    try {
      await supabase.auth.refreshSession();
    } catch {
      // ignore if session refresh is not needed
    }

    // 2. Update existing profile row first, then upsert with required fields if missing
    const { data: updatedRows, error: updateError } = await supabase
      .from('profiles')
      .update({ role: targetRole })
      .eq('id', user.id)
      .select('id');

    if (updateError || !updatedRows || updatedRows.length === 0) {
      const { error: upsertError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email,
          name: displayName,
          role: targetRole,
          country_code: countryCode,
        },
        { onConflict: 'id' }
      );
      if (upsertError && metaError) {
        throw new Error(upsertError.message || metaError.message || 'Could not switch role.');
      }
    }

    const latest = await accountService.settings();
    return { ...latest, role: targetRole };
  },

  deleteAccount: async (_confirmation: string): Promise<void> => {
    await supabase.auth.signOut();
  },

  requestSessionRefresh: () => authService.getSession(),
};