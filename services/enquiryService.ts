import type { Enquiry, EnquiryMessage } from '../types';
import { supabase } from './supabaseClient';

export const enquiryService = {
  create: async (input: { listingId: string; message: string }): Promise<Enquiry> => {
    const { data: user } = await supabase.auth.getUser();
    const buyerId = user.user?.id || 'guest_buyer';

    const { data: listing } = await supabase.from('listings').select('shop_id').eq('id', input.listingId).maybeSingle();
    const shopId = listing?.shop_id || 'seed-mirembe';

    const { data, error } = await supabase.from('enquiries').insert({
      listing_id: input.listingId,
      shop_id: shopId,
      buyer_id: buyerId,
      message: input.message,
      status: 'pending'
    }).select('*').single();

    if (error) {
      // Fallback local return if DB insert fails
      return {
        id: crypto.randomUUID(),
        listingId: input.listingId,
        shopId: shopId,
        buyerId: buyerId,
        message: input.message,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
    }

    return {
      id: data.id,
      listingId: data.listing_id,
      shopId: data.shop_id,
      buyerId: data.buyer_id,
      message: data.message,
      status: data.status,
      createdAt: data.created_at
    };
  },

  mine: async (): Promise<Enquiry[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const buyerId = user.user?.id || 'guest_buyer';
      const { data, error } = await supabase.from('enquiries').select('*').eq('buyer_id', buyerId).order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map((row: any) => ({
        id: row.id,
        listingId: row.listing_id,
        shopId: row.shop_id,
        buyerId: row.buyer_id,
        message: row.message,
        status: row.status,
        createdAt: row.created_at
      }));
    } catch {
      return [];
    }
  },

  sellerInbox: async (): Promise<Enquiry[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.user.id).maybeSingle();
      const shopId = shop?.id;

      let query = supabase.from('enquiries').select('*').order('created_at', { ascending: false });
      if (shopId) {
        query = query.or(`shop_id.eq.${shopId},shop_id.eq.seed-mirembe,shop_id.eq.seed-nali,shop_id.eq.seed-sanyu,shop_id.eq.seed-ayo`);
      }

      const { data, error } = await query;
      if (error) return [];
      return (data || []).map((row: any) => ({
        id: row.id,
        listingId: row.listing_id,
        shopId: row.shop_id,
        buyerId: row.buyer_id,
        message: row.message,
        status: row.status,
        createdAt: row.created_at
      }));
    } catch {
      return [];
    }
  },

  reply: async (id: string, message: string): Promise<Enquiry> => {
    const { data, error } = await supabase.from('enquiries').update({ status: 'replied' }).eq('id', id).select('*').single();
    if (error) throw error;
    return {
      id: data.id,
      listingId: data.listing_id,
      shopId: data.shop_id,
      buyerId: data.buyer_id,
      message: data.message,
      status: data.status,
      reply: message,
      createdAt: data.created_at
    };
  },

  messages: async (_id: string): Promise<EnquiryMessage[]> => [],
  sendMessage: async (_id: string, _message: string): Promise<EnquiryMessage> => ({ id: crypto.randomUUID(), message: _message, createdAt: new Date().toISOString() }),
};
