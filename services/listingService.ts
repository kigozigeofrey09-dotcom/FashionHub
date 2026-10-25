import type { Listing } from '../types';
import { supabase } from './supabaseClient';

export const listingService = {
  search: async (filters: URLSearchParams): Promise<Listing[]> => {
    let query = supabase.from('listings').select('*, shops(name, city, country_code, country_name, whatsapp_number, is_verified)').eq('is_active', true);
    const category = filters.get('category');
    const type = filters.get('type');
    const shopId = filters.get('shopId');
    const term = filters.get('q');
    if (category) query = query.eq('category', category);
    if (type) query = query.eq('type', type);
    if (shopId) query = query.eq('shop_id', shopId);
    if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return [];

    return (data || []).map((row: any) => ({
      id: row.id,
      shopId: row.shop_id,
      shopName: row.shops?.name || row.shop_name || 'Store',
      name: row.name,
      category: row.category,
      type: row.type,
      description: row.description || '',
      price: Number(row.price),
      currency: row.currency || 'UGX',
      countryCode: row.shops?.country_code || row.country_code || 'UG',
      countryName: row.shops?.country_name || row.country_name || 'Uganda',
      city: row.shops?.city || row.city || 'Kampala',
      image: row.image || row.image_url || '',
      images: row.images || [],
      sizes: row.sizes,
      colour: row.colour,
      serviceDetails: row.service_details,
      enquiryLabel: row.enquiry_label,
      sellerWhatsapp: row.shops?.whatsapp_number,
      isActive: row.is_active
    }));
  },

  get: async (id: string): Promise<Listing> => {
    const { data, error } = await supabase.from('listings').select('*, shops(name, city, country_code, country_name, whatsapp_number, is_verified)').eq('id', id).single();
    if (error) throw error;
    return {
      id: data.id,
      shopId: data.shop_id,
      shopName: data.shops?.name || data.shop_name || 'Store',
      name: data.name,
      category: data.category,
      type: data.type,
      description: data.description || '',
      price: Number(data.price),
      currency: data.currency || 'UGX',
      countryCode: data.shops?.country_code || data.country_code || 'UG',
      countryName: data.shops?.country_name || data.country_name || 'Uganda',
      city: data.shops?.city || data.city || 'Kampala',
      image: data.image || data.image_url || '',
      images: data.images || [],
      sizes: data.sizes,
      colour: data.colour,
      serviceDetails: data.service_details,
      enquiryLabel: data.enquiry_label,
      sellerWhatsapp: data.shops?.whatsapp_number,
      isActive: data.is_active
    };
  },

  forShop: async (shopId: string): Promise<Listing[]> => {
    const { data, error } = await supabase.from('listings').select('*, shops(name, city, country_code, country_name, whatsapp_number, is_verified)').eq('shop_id', shopId);
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      shopId: row.shop_id,
      shopName: row.shops?.name || row.shop_name || 'Store',
      name: row.name,
      category: row.category,
      type: row.type,
      description: row.description || '',
      price: Number(row.price),
      currency: row.currency || 'UGX',
      countryCode: row.shops?.country_code || row.country_code || 'UG',
      countryName: row.shops?.country_name || row.country_name || 'Uganda',
      city: row.shops?.city || row.city || 'Kampala',
      image: row.image || row.image_url || '',
      images: row.images || [],
      sizes: row.sizes,
      colour: row.colour,
      serviceDetails: row.service_details,
      enquiryLabel: row.enquiry_label,
      sellerWhatsapp: row.shops?.whatsapp_number,
      isActive: row.is_active
    }));
  },

  mine: async (): Promise<Listing[]> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.user.id).maybeSingle();
    if (!shop) return [];
    const { data, error } = await supabase.from('listings').select('*, shops(name, city, country_code, country_name, whatsapp_number, is_verified)').eq('shop_id', shop.id);
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      shopId: row.shop_id,
      shopName: row.shops?.name || row.shop_name || 'Store',
      name: row.name,
      category: row.category,
      type: row.type,
      description: row.description || '',
      price: Number(row.price),
      currency: row.currency || 'UGX',
      countryCode: row.shops?.country_code || row.country_code || 'UG',
      countryName: row.shops?.country_name || row.country_name || 'Uganda',
      city: row.shops?.city || row.city || 'Kampala',
      image: row.image || row.image_url || '',
      images: row.images || [],
      sizes: row.sizes,
      colour: row.colour,
      serviceDetails: row.service_details,
      enquiryLabel: row.enquiry_label,
      sellerWhatsapp: row.shops?.whatsapp_number,
      isActive: row.is_active
    }));
  },

  create: async (input: Record<string, unknown>): Promise<Listing> => {
    const shopId = (input.shopId || input.shop_id) as string;
    const { data: shopData } = await supabase.from('shops').select('*').eq('id', shopId).single();

    const insertPayload = {
      shop_id: shopId,
      shop_name: shopData?.name || 'Store',
      name: input.name,
      category: input.category,
      type: input.type || 'product',
      description: input.description,
      price: Number(input.price),
      currency: (input.currency as string) || 'UGX',
      country_code: shopData?.country_code || 'UG',
      country_name: shopData?.country_name || 'Uganda',
      city: shopData?.city || 'Kampala',
      image: (input.imageUrl as string) || (Array.isArray(input.imageUrls) ? input.imageUrls[0] : '') || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85',
      images: (input.imageUrls as string[]) || [],
      sizes: input.sizes || null,
      colour: input.colour || null,
      service_details: input.serviceDetails || null,
      enquiry_label: input.enquiryLabel || null,
      is_active: true
    };

    const { data, error } = await supabase.from('listings').insert(insertPayload).select('*, shops(name, city, country_code, country_name, whatsapp_number, is_verified)').single();
    if (error) throw error;

    return {
      id: data.id,
      shopId: data.shop_id,
      shopName: data.shops?.name || data.shop_name || 'Store',
      name: data.name,
      category: data.category,
      type: data.type,
      description: data.description || '',
      price: Number(data.price),
      currency: data.currency || 'UGX',
      countryCode: data.shops?.country_code || data.country_code || 'UG',
      countryName: data.shops?.country_name || data.country_name || 'Uganda',
      city: data.shops?.city || data.city || 'Kampala',
      image: data.image || data.image_url || '',
      images: data.images || [],
      sizes: data.sizes,
      colour: data.colour,
      serviceDetails: data.service_details,
      enquiryLabel: data.enquiry_label,
      sellerWhatsapp: data.shops?.whatsapp_number,
      isActive: data.is_active
    };
  },

  update: async (id: string, input: Record<string, unknown>): Promise<Listing> => {
    const updatePayload: Record<string, unknown> = {};
    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.price !== undefined) updatePayload.price = Number(input.price);
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.imageUrl !== undefined) updatePayload.image = input.imageUrl;
    if (input.isActive !== undefined) updatePayload.is_active = input.isActive;

    const { data, error } = await supabase.from('listings').update(updatePayload).eq('id', id).select('*, shops(name, city, country_code, country_name, whatsapp_number, is_verified)').single();
    if (error) throw error;

    return {
      id: data.id,
      shopId: data.shop_id,
      shopName: data.shops?.name || data.shop_name || 'Store',
      name: data.name,
      category: data.category,
      type: data.type,
      description: data.description || '',
      price: Number(data.price),
      currency: data.currency || 'UGX',
      countryCode: data.shops?.country_code || data.country_code || 'UG',
      countryName: data.shops?.country_name || data.country_name || 'Uganda',
      city: data.shops?.city || data.city || 'Kampala',
      image: data.image || data.image_url || '',
      images: data.images || [],
      sizes: data.sizes,
      colour: data.colour,
      serviceDetails: data.service_details,
      enquiryLabel: data.enquiry_label,
      sellerWhatsapp: data.shops?.whatsapp_number,
      isActive: data.is_active
    };
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) throw error;
  },
};
