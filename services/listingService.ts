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
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      shopId: row.shop_id,
      shopName: row.shops?.name || 'Store',
      name: row.name,
      category: row.category,
      type: row.type,
      description: row.description || '',
      price: Number(row.price),
      currency: row.currency || 'UGX',
      countryCode: row.shops?.country_code || 'UG',
      countryName: row.shops?.country_name || 'Uganda',
      city: row.shops?.city || 'Kampala',
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
      shopName: data.shops?.name || 'Store',
      name: data.name,
      category: data.category,
      type: data.type,
      description: data.description || '',
      price: Number(data.price),
      currency: data.currency || 'UGX',
      countryCode: data.shops?.country_code || 'UG',
      countryName: data.shops?.country_name || 'Uganda',
      city: data.shops?.city || 'Kampala',
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
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      shopId: row.shop_id,
      shopName: row.shops?.name || 'Store',
      name: row.name,
      category: row.category,
      type: row.type,
      description: row.description || '',
      price: Number(row.price),
      currency: row.currency || 'UGX',
      countryCode: row.shops?.country_code || 'UG',
      countryName: row.shops?.country_name || 'Uganda',
      city: row.shops?.city || 'Kampala',
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
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      shopId: row.shop_id,
      shopName: row.shops?.name || 'Store',
      name: row.name,
      category: row.category,
      type: row.type,
      description: row.description || '',
      price: Number(row.price),
      currency: row.currency || 'UGX',
      countryCode: row.shops?.country_code || 'UG',
      countryName: row.shops?.country_name || 'Uganda',
      city: row.shops?.city || 'Kampala',
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
    const { data, error } = await supabase.from('listings').insert({
      shop_id: input.shopId,
      name: input.name,
      category: input.category,
      type: input.type,
      description: input.description,
      price: input.price,
      currency: input.currency || 'UGX',
      image: input.imageUrl || (Array.isArray(input.imageUrls) ? input.imageUrls[0] : ''),
      images: input.imageUrls || [],
      sizes: input.sizes,
      colour: input.colour,
      service_details: input.serviceDetails,
      enquiry_label: input.enquiryLabel,
      is_active: true
    }).select('*, shops(name, city, country_code, country_name, whatsapp_number, is_verified)').single();
    if (error) throw error;
    return {
      id: data.id,
      shopId: data.shop_id,
      shopName: data.shops?.name || 'Store',
      name: data.name,
      category: data.category,
      type: data.type,
      description: data.description || '',
      price: Number(data.price),
      currency: data.currency || 'UGX',
      countryCode: data.shops?.country_code || 'UG',
      countryName: data.shops?.country_name || 'Uganda',
      city: data.shops?.city || 'Kampala',
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
    if (input.price !== undefined) updatePayload.price = input.price;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.imageUrl !== undefined) updatePayload.image = input.imageUrl;
    if (input.isActive !== undefined) updatePayload.is_active = input.isActive;

    const { data, error } = await supabase.from('listings').update(updatePayload).eq('id', id).select('*, shops(name, city, country_code, country_name, whatsapp_number, is_verified)').single();
    if (error) throw error;
    return {
      id: data.id,
      shopId: data.shop_id,
      shopName: data.shops?.name || 'Store',
      name: data.name,
      category: data.category,
      type: data.type,
      description: data.description || '',
      price: Number(data.price),
      currency: data.currency || 'UGX',
      countryCode: data.shops?.country_code || 'UG',
      countryName: data.shops?.country_name || 'Uganda',
      city: data.shops?.city || 'Kampala',
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
