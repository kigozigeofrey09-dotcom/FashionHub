import type { Shop } from '../types';
import { supabase } from './supabaseClient';

export const shopService = {
  get: async (id: string): Promise<Shop> => {
    const { data, error } = await supabase.from('shops').select('*').eq('id', id).single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      story: data.story || '',
      tagline: data.tagline || '',
      categories: data.categories || [],
      sellType: data.sell_type || 'products',
      countryCode: data.country_code,
      countryName: data.country_name || 'Uganda',
      city: data.city,
      accent: data.accent || '#496a4d',
      whatsappNumber: data.whatsapp_number,
      logoUrl: data.logo_url,
      coverUrl: data.cover_url,
      isVerified: Boolean(data.is_verified)
    };
  },

  getMine: async (): Promise<Shop | null> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;
    const { data, error } = await supabase.from('shops').select('*').eq('owner_id', user.user.id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      story: data.story || '',
      tagline: data.tagline || '',
      categories: data.categories || [],
      sellType: data.sell_type || 'products',
      countryCode: data.country_code,
      countryName: data.country_name || 'Uganda',
      city: data.city,
      accent: data.accent || '#496a4d',
      whatsappNumber: data.whatsapp_number,
      logoUrl: data.logo_url,
      coverUrl: data.cover_url,
      isVerified: Boolean(data.is_verified)
    };
  },

  list: async (): Promise<Shop[]> => {
    const { data, error } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      story: row.story || '',
      tagline: row.tagline || '',
      categories: row.categories || [],
      sellType: row.sell_type || 'products',
      countryCode: row.country_code,
      countryName: row.country_name || 'Uganda',
      city: row.city,
      accent: row.accent || '#496a4d',
      whatsappNumber: row.whatsapp_number,
      logoUrl: row.logo_url,
      coverUrl: row.cover_url,
      isVerified: Boolean(row.is_verified)
    }));
  },

  create: async (input: Record<string, unknown>): Promise<Shop> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const insertPayload = {
      owner_id: user.user.id,
      name: input.name,
      story: input.story,
      tagline: input.tagline || '',
      categories: input.categories || [],
      sell_type: input.sellType || 'products',
      country_code: input.countryCode,
      country_name: input.countryName || 'Uganda',
      city: input.city,
      accent: input.accent || '#496a4d',
      whatsapp_number: input.whatsappNumber || '',
      logo_url: input.logoUrl || null,
      cover_url: input.coverUrl || null
    };

    const { data, error } = await supabase.from('shops').insert(insertPayload).select('*').single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      story: data.story || '',
      tagline: data.tagline || '',
      categories: data.categories || [],
      sellType: data.sell_type || 'products',
      countryCode: data.country_code,
      countryName: data.country_name || 'Uganda',
      city: data.city,
      accent: data.accent || '#496a4d',
      whatsappNumber: data.whatsapp_number,
      logoUrl: data.logo_url,
      coverUrl: data.cover_url,
      isVerified: Boolean(data.is_verified)
    };
  },

  update: async (id: string, input: Record<string, unknown>): Promise<Shop> => {
    const updatePayload: Record<string, unknown> = {};
    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.story !== undefined) updatePayload.story = input.story;
    if (input.tagline !== undefined) updatePayload.tagline = input.tagline;
    if (input.categories !== undefined) updatePayload.categories = input.categories;
    if (input.sellType !== undefined) updatePayload.sell_type = input.sellType;
    if (input.countryCode !== undefined) updatePayload.country_code = input.countryCode;
    if (input.countryName !== undefined) updatePayload.country_name = input.countryName;
    if (input.city !== undefined) updatePayload.city = input.city;
    if (input.accent !== undefined) updatePayload.accent = input.accent;
    if (input.whatsappNumber !== undefined) updatePayload.whatsapp_number = input.whatsappNumber;
    if (input.logoUrl !== undefined) updatePayload.logo_url = input.logoUrl || null;
    if (input.coverUrl !== undefined) updatePayload.cover_url = input.coverUrl || null;

    const { data, error } = await supabase.from('shops').update(updatePayload).eq('id', id).select('*').single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      story: data.story || '',
      tagline: data.tagline || '',
      categories: data.categories || [],
      sellType: data.sell_type || 'products',
      countryCode: data.country_code,
      countryName: data.country_name || 'Uganda',
      city: data.city,
      accent: data.accent || '#496a4d',
      whatsappNumber: data.whatsapp_number,
      logoUrl: data.logo_url,
      coverUrl: data.cover_url,
      isVerified: Boolean(data.is_verified)
    };
  },
};
