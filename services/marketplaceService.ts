import type { Listing, Shop } from '../types';
import { supabase } from './supabaseClient';

export const marketplaceService = {
  searchListings: async (filters: URLSearchParams): Promise<Listing[]> => {
    let query = supabase.from('listings').select('*, shops(name, city, country_code, country_name, whatsapp_number, is_verified)').eq('is_active', true);
    const category = filters.get('category');
    const type = filters.get('type');
    const shopId = filters.get('shopId');
    const term = filters.get('q');
    const country = filters.get('country');
    const city = filters.get('city');

    if (category && category !== 'All finds') query = query.eq('category', category);
    if (type && type !== 'all') query = query.eq('type', type);
    if (shopId) query = query.eq('shop_id', shopId);
    if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    let results = (data || []).map((row: any) => ({
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

    if (country) results = results.filter(l => l.countryCode === country);
    if (city) results = results.filter(l => l.city.toLowerCase().includes(city.toLowerCase()));

    // Sort verified shops to the top
    results.sort((a: any, b: any) => {
      const shopA = (data || []).find((r: any) => r.id === a.id)?.shops;
      const shopB = (data || []).find((r: any) => r.id === b.id)?.shops;
      const verA = shopA?.is_verified ? 1 : 0;
      const verB = shopB?.is_verified ? 1 : 0;
      return verB - verA;
    });

    return results;
  },

  searchShops: async (filters: URLSearchParams): Promise<Shop[]> => {
    let query = supabase.from('shops').select('*');
    const country = filters.get('country');
    const city = filters.get('city');
    const category = filters.get('category');
    const term = filters.get('q');

    if (country) query = query.eq('country_code', country);
    if (city) query = query.ilike('city', `%${city}%`);
    if (category && category !== 'All finds') query = query.contains('categories', [category]);
    if (term) query = query.or(`name.ilike.%${term}%,story.ilike.%${term}%,tagline.ilike.%${term}%`);

    const { data, error } = await query.order('created_at', { ascending: false });
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
};
