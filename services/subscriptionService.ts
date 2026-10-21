import type { SubscriptionAccess, SubscriptionPlan, SubscriptionRecord, SubscriptionStatus } from '../types';
import { supabase } from './supabaseClient';
import { seedPlans } from '../data/seed';

export const subscriptionService = {
  plans: async (): Promise<SubscriptionPlan[]> => seedPlans,

  mine: async (): Promise<SubscriptionRecord[]> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.user.id).maybeSingle();
    if (!shop) return [];
    const { data, error } = await supabase.from('subscriptions').select('*').eq('shop_id', shop.id);
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      shopId: row.shop_id,
      planId: row.plan_id,
      planName: row.plan_name,
      payerType: row.payer_type || 'seller',
      countryCode: row.country_code || 'UG',
      transactionReference: row.transaction_reference,
      receiptUrl: row.receipt_url,
      status: row.status || 'pending_verification',
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      expiresAt: row.expires_at
    }));
  },

  accessRules: async () => ({ requiredRoles: ['buyer'] as Array<'buyer' | 'seller'> }),

  access: async (): Promise<SubscriptionAccess> => ({ hasAccess: true, isTrial: true }),

  cancel: async (id: string): Promise<SubscriptionRecord> => {
    const { data, error } = await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', id).select('*').single();
    if (error) throw error;
    return {
      id: data.id,
      shopId: data.shop_id,
      planId: data.plan_id,
      planName: data.plan_name,
      payerType: data.payer_type,
      countryCode: data.country_code,
      transactionReference: data.transaction_reference,
      status: data.status,
      submittedAt: data.submitted_at
    };
  },

  requestRenewal: async (id: string): Promise<SubscriptionRecord> => subscriptionService.status(id),

  status: async (id: string): Promise<SubscriptionRecord> => {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id).single();
    if (error) throw error;
    return {
      id: data.id,
      shopId: data.shop_id,
      planId: data.plan_id,
      planName: data.plan_name,
      payerType: data.payer_type,
      countryCode: data.country_code,
      transactionReference: data.transaction_reference,
      status: data.status,
      submittedAt: data.submitted_at
    };
  },

  normalizeStatus: (status: SubscriptionStatus) => status,
};
