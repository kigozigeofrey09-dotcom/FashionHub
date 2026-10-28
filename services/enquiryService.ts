import type { Enquiry, EnquiryMessage } from '../types';
import { supabase } from './supabaseClient';

export const enquiryService = {
  create: async (input: { listingId: string; message: string }): Promise<Enquiry> => {
    const { data: userData } = await supabase.auth.getUser();
    const buyerId = userData.user?.id;
    if (!buyerId) throw new Error('You must be signed in to send an enquiry.');

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, shop_id')
      .eq('id', input.listingId)
      .maybeSingle();

    if (listingError || !listing) throw new Error('Listing could not be found.');
    const shopId = listing.shop_id;

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('owner_id')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError || !shop) throw new Error('Seller shop could not be found.');
    const sellerId = shop.owner_id;

    if (sellerId === buyerId) {
      throw new Error('You cannot send an enquiry to your own listing.');
    }

    const { data, error } = await supabase
      .from('enquiries')
      .insert({
        listing_id: input.listingId,
        shop_id: shopId,
        buyer_id: buyerId,
        seller_id: sellerId,
        message: input.message,
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message || 'Could not send your enquiry.');

    // Also insert initial message into enquiry_messages
    await supabase.from('enquiry_messages').insert({
      enquiry_id: data.id,
      sender_id: buyerId,
      body: input.message
    });

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
    const { data: userData } = await supabase.auth.getUser();
    const buyerId = userData.user?.id;
    if (!buyerId) return [];

    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

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
  },

  sellerInbox: async (): Promise<Enquiry[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const sellerId = userData.user?.id;
    if (!sellerId) return [];

    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback to all if seller_id column is missing or restricted
      const { data: allData } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });
      return (allData || []).map((row: any) => ({
        id: row.id,
        listingId: row.listing_id,
        shopId: row.shop_id,
        buyerId: row.buyer_id,
        message: row.message,
        status: row.status,
        createdAt: row.created_at
      }));
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      listingId: row.listing_id,
      shopId: row.shop_id,
      buyerId: row.buyer_id,
      message: row.message,
      status: row.status,
      createdAt: row.created_at
    }));
  },

  reply: async (id: string, message: string): Promise<Enquiry> => {
    const { data: userData } = await supabase.auth.getUser();
    const senderId = userData.user?.id;

    const { data, error } = await supabase
      .from('enquiries')
      .update({ status: 'replied' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    if (senderId) {
      await supabase.from('enquiry_messages').insert({
        enquiry_id: id,
        sender_id: senderId,
        body: message
      });
    }

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

  messages: async (enquiryId: string): Promise<EnquiryMessage[]> => {
    const { data: enquiry } = await supabase
      .from('enquiries')
      .select('id, buyer_id, seller_id')
      .eq('id', enquiryId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('enquiry_messages')
      .select('*')
      .eq('enquiry_id', enquiryId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      enquiryId: row.enquiry_id,
      senderId: row.sender_id,
      senderRole: row.sender_id === enquiry?.buyer_id ? 'buyer' : 'seller',
      body: row.body || row.message,
      createdAt: row.created_at
    }));
  },

  sendMessage: async (enquiryId: string, message: string): Promise<EnquiryMessage> => {
    const { data: userData } = await supabase.auth.getUser();
    const senderId = userData.user?.id;
    if (!senderId) throw new Error('You must be signed in to send a message.');

    const { data: enquiry } = await supabase
      .from('enquiries')
      .select('id, buyer_id, seller_id')
      .eq('id', enquiryId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('enquiry_messages')
      .insert({
        enquiry_id: enquiryId,
        sender_id: senderId,
        body: message
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message || 'Could not send message.');

    // Update enquiry status to replied if seller sent it
    if (enquiry && enquiry.seller_id === senderId) {
      await supabase.from('enquiries').update({ status: 'replied' }).eq('id', enquiryId);
    }

    return {
      id: data.id,
      enquiryId: data.enquiry_id,
      senderId: data.sender_id,
      senderRole: senderId === enquiry?.buyer_id ? 'buyer' : 'seller',
      body: data.body,
      createdAt: data.created_at
    };
  },
};
