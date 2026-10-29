import type { Enquiry, EnquiryMessage } from '../types';
import { supabase } from './supabaseClient';

export const enquiryService = {
  create: async (input: { listingId: string; message: string }): Promise<Enquiry> => {
    const { data: userData } = await supabase.auth.getUser();
    const buyerId = userData.user?.id;
    if (!buyerId) throw new Error('You must be signed in to send an enquiry.');

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, shop_id, name')
      .eq('id', input.listingId)
      .maybeSingle();

    if (listingError || !listing) throw new Error('Listing could not be found.');
    const shopId = listing.shop_id;

    const { data: shop } = await supabase
      .from('shops')
      .select('owner_id, name')
      .eq('id', shopId)
      .maybeSingle();

    const sellerId = shop?.owner_id;

    if (sellerId && sellerId === buyerId) {
      throw new Error('You cannot send an enquiry to your own listing.');
    }

    // Insert into enquiries with fallback if seller_id column is missing in schema cache
    let enquiryRecord: any = null;
    const insertPayload: Record<string, any> = {
      listing_id: input.listingId,
      shop_id: shopId,
      buyer_id: buyerId,
      message: input.message,
      status: 'pending'
    };
    if (sellerId) insertPayload.seller_id = sellerId;

    const { data, error } = await supabase
      .from('enquiries')
      .insert(insertPayload)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      // Retry without seller_id if column missing in schema cache
      const { data: retryData, error: retryError } = await supabase
        .from('enquiries')
        .insert({
          listing_id: input.listingId,
          shop_id: shopId,
          buyer_id: buyerId,
          message: input.message,
          status: 'pending'
        })
        .select('*')
        .single();

      if (retryError) throw new Error(retryError.message || 'Could not send your enquiry.');
      enquiryRecord = retryData;
    } else {
      enquiryRecord = data;
    }

    // Insert initial message into enquiry_messages
    try {
      await supabase.from('enquiry_messages').insert({
        enquiry_id: enquiryRecord.id,
        sender_id: buyerId,
        body: input.message
      });
    } catch {}

    // Trigger notification to seller
    if (sellerId) {
      try {
        await supabase.from('notifications').insert({
          user_id: sellerId,
          title: 'New Product Enquiry 💬',
          body: `You received a new enquiry about "${listing.name || 'your listing'}": "${input.message}"`,
          type: 'enquiry',
          is_read: false
        });
      } catch {}
    }

    return {
      id: enquiryRecord.id,
      listingId: enquiryRecord.listing_id,
      shopId: enquiryRecord.shop_id,
      buyerId: enquiryRecord.buyer_id,
      message: enquiryRecord.message,
      status: enquiryRecord.status,
      createdAt: enquiryRecord.created_at
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

    // Fetch enquiries for shops owned by this seller or where seller_id matches
    const { data: shops } = await supabase.from('shops').select('id').eq('owner_id', sellerId);
    const shopIds = (shops || []).map((s: any) => s.id);

    let query = supabase.from('enquiries').select('*');
    if (shopIds.length) {
      query = query.in('shop_id', shopIds);
    } else {
      query = query.eq('seller_id', sellerId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
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

      // Notify buyer about reply
      if (data?.buyer_id && data.buyer_id !== senderId) {
        try {
          await supabase.from('notifications').insert({
            user_id: data.buyer_id,
            title: 'Seller Replied to Enquiry 💬',
            body: `The seller replied: "${message}"`,
            type: 'enquiry',
            is_read: false
          });
        } catch {}
      }
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
      .select('id, buyer_id, seller_id, shop_id')
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

    const isBuyer = senderId === enquiry?.buyer_id;

    if (enquiry) {
      if (!isBuyer) {
        await supabase.from('enquiries').update({ status: 'replied' }).eq('id', enquiryId);
        // Notify buyer
        if (enquiry.buyer_id) {
          try {
            await supabase.from('notifications').insert({
              user_id: enquiry.buyer_id,
              title: 'New Message from Seller 💬',
              body: `"${message}"`,
              type: 'enquiry',
              is_read: false
            });
          } catch {}
        }
      } else {
        // Notify seller / shop owner
        const { data: shop } = await supabase.from('shops').select('owner_id').eq('id', enquiry.shop_id).maybeSingle();
        const sellerId = shop?.owner_id || enquiry.seller_id;
        if (sellerId) {
          try {
            await supabase.from('notifications').insert({
              user_id: sellerId,
              title: 'New Message from Buyer 💬',
              body: `"${message}"`,
              type: 'enquiry',
              is_read: false
            });
          } catch {}
        }
      }
    }

    return {
      id: data.id,
      enquiryId: data.enquiry_id,
      senderId: data.sender_id,
      senderRole: isBuyer ? 'buyer' : 'seller',
      body: data.body,
      createdAt: data.created_at
    };
  },
};
