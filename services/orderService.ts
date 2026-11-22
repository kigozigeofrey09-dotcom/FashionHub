import type { Order, OrderCreateInput, OrderStatusUpdate } from '../types';
import { supabase } from './supabaseClient';

export const orderService = {
  create: async (input: OrderCreateInput): Promise<Order> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('orders').insert({
      buyer_id: user.user.id,
      listing_id: input.listingId,
      shop_id: input.shopId,
      total_amount: input.totalAmount || 0,
      status: 'pending'
    }).select('*').single();

    if (error) throw error;
    return {
      id: data.id,
      buyerId: data.buyer_id,
      listingId: data.listing_id,
      shopId: data.shop_id,
      status: data.status,
      totalAmount: Number(data.total_amount),
      createdAt: data.created_at
    };
  },

  mine: async (): Promise<Order[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      const { data, error } = await supabase.from('orders').select('*').eq('buyer_id', user.user.id);
      if (error) return [];
      return (data || []).map((row: any) => ({
        id: row.id,
        buyerId: row.buyer_id,
        listingId: row.listing_id,
        shopId: row.shop_id,
        status: row.status,
        totalAmount: Number(data.total_amount),
        createdAt: row.created_at
      }));
    } catch {
      return [];
    }
  },

  sellerOrders: async (): Promise<Order[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.user.id).maybeSingle();
      if (!shop) return [];
      const { data, error } = await supabase.from('orders').select('*').eq('shop_id', shop.id);
      if (error) return [];
      return (data || []).map((row: any) => ({
        id: row.id,
        buyerId: row.buyer_id,
        listingId: row.listing_id,
        shopId: row.shop_id,
        status: row.status,
        totalAmount: Number(row.total_amount),
        createdAt: row.created_at
      }));
    } catch {
      return [];
    }
  },

  updateStatus: async (id: string, input: OrderStatusUpdate): Promise<Order> => {
    const { data, error } = await supabase.from('orders').update({ status: input.status }).eq('id', id).select('*').single();
    if (error) throw error;
    return {
      id: data.id,
      buyerId: data.buyer_id,
      listingId: data.listing_id,
      shopId: data.shop_id,
      status: data.status,
      totalAmount: Number(data.total_amount),
      createdAt: data.created_at
    };
  },

  markReadyForPickup: async (id: string, _note?: string): Promise<Order> => orderService.updateStatus(id, { status: 'pickup_ready' }),
  markInDelivery: async (id: string, _note?: string): Promise<Order> => orderService.updateStatus(id, { status: 'delivery' }),
};
