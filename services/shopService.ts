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
    return (data || []).map((row) => ({
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
    const { data, error } = await supabase.from('shops').insert({
      owner_id: user.user.id,
      name: input.name,
      story: input.story,
      tagline: input.tagline,
      categories: input.categories,
      sell_type: input.sellType,
      country_code: input.countryCode,
      country_name: input.countryName,
      city: input.city,
      accent: input.accent,
      whatsapp_number: input.whatsappNumber,
      logo_url: input.logoUrl,
      cover_url: input.coverUrl
    }).select('*').single();
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
    const { data, error } = await supabase.from('shops').update({
      name: input.name,
      story: input.story,
      tagline: input.tagline,
      categories: input.categories,
      sell_type: input.sellType,
      city: input.city,
      accent: input.accent,
      whatsapp_number: input.whatsappNumber,
      logo_url: input.logoUrl,
      cover_url: input.coverUrl
    }).eq('id', id).select('*').single();
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
      cover_url: data.cover_url,
      isVerified: Boolean(data.is_verified)
    };
  },
};
