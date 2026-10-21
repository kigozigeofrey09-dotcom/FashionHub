import type { AccountSettings, Listing, Session } from '../types';
import { supabase } from './supabaseClient';
import { authService } from './authService';

export const accountService = {
  savedListings: async (): Promise<Listing[]> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];
    const { data, error } = await supabase.from('saved').select('listings(*, shops(name, city, country_code, country_name, whatsapp_number, is_verified))').eq('user_id', user.user.id);
    if (error) throw error;
    return (data || []).map((row: any) => {
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
        isActive: l.is_active
      };
    }).filter(Boolean);
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
    const { data } = await supabase.from('profiles').select('*').eq('id', user.user.id).maybeSingle();
    return {
      name: data?.name || user.user.user_metadata?.name || '',
      email: user.user.email || '',
      role: data?.role || user.user.user_metadata?.role || 'buyer',
      countryCode: data?.country_code || user.user.user_metadata?.countryCode || 'UG'
    };
  },

  updateSettings: async (input: Partial<AccountSettings>): Promise<AccountSettings> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const update: any = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.countryCode !== undefined) update.country_code = input.countryCode;

    await supabase.from('profiles').update(update).eq('id', user.user.id);
    return accountService.settings();
  },

  deleteAccount: async (_confirmation: string): Promise<void> => {
    await supabase.auth.signOut();
  },

  requestSessionRefresh: () => authService.getSession(),
};
