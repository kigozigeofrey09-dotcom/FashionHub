import type { AdminSettings, Country, MarketplaceReport, SafetyReport, SubscriptionRecord, SubscriptionStatus, Shop, PromotionAd, PlatformAnalytics } from '../types';
import { supabase } from './supabaseClient';
import { seedPlans, seedCountries } from '../data/seed';

export const adminService = {
  settings: async (): Promise<AdminSettings> => {
    try {
      const { data } = await supabase.from('settings').select('*').eq('key', 'admin_settings').maybeSingle();
      if (!data || !data.value) {
        return { plans: seedPlans, countries: seedCountries, subscriptionAccess: { requiredRoles: ['buyer'] } };
      }
      return data.value as AdminSettings;
    } catch {
      return { plans: seedPlans, countries: seedCountries, subscriptionAccess: { requiredRoles: ['buyer'] } };
    }
  },

  updateSettings: async (input: AdminSettings): Promise<AdminSettings> => {
    await supabase.from('settings').upsert({ key: 'admin_settings', value: input });
    return input;
  },

  updateSubscriptionAccess: async (requiredRoles: Array<'buyer' | 'seller'>) => {
    const current = await adminService.settings();
    current.subscriptionAccess.requiredRoles = requiredRoles;
    await adminService.updateSettings(current);
    return { requiredRoles };
  },

  sellersReport: async (): Promise<MarketplaceReport[]> => [{ generatedAt: new Date().toISOString(), total: 10, active: 10, pending: 0, flagged: 0 }],
  listingsReport: async (): Promise<MarketplaceReport[]> => [{ generatedAt: new Date().toISOString(), total: 25, active: 25, pending: 0, flagged: 0 }],

  reportsQueue: async (): Promise<SafetyReport[]> => {
    try {
      const { data } = await supabase.from('reports').select('*');
      return (data || []).map((r: any) => ({
        id: r.id,
        reporterId: r.reporter_id,
        listingId: r.listing_id,
        reason: r.reason,
        details: r.details,
        status: r.status || 'open',
        createdAt: r.created_at
      }));
    } catch {
      return [];
    }
  },

  reviewReport: async (id: string, status: any): Promise<SafetyReport> => {
    const { data } = await supabase.from('reports').update({ status }).eq('id', id).select('*').single();
    return {
      id: data.id,
      reporterId: data.reporter_id,
      listingId: data.listing_id,
      reason: data.reason,
      details: data.details,
      status: data.status,
      createdAt: data.created_at
    };
  },

  paymentQueue: async (): Promise<SubscriptionRecord[]> => {
    try {
      const { data } = await supabase.from('subscriptions').select('*');
      return (data || []).map((s: any) => ({
        id: s.id,
        shopId: s.shop_id,
        planId: s.plan_id,
        planName: s.plan_name,
        payerType: s.payer_type,
        countryCode: s.country_code,
        transactionReference: s.transaction_reference,
        receiptUrl: s.receipt_url,
        status: s.status,
        submittedAt: s.submitted_at,
        reviewedAt: s.reviewed_at,
        expiresAt: s.expires_at
      }));
    } catch {
      return [];
    }
  },

  reviewPayment: async (id: string, input: { decision: 'approved' | 'declined'; note?: string }): Promise<SubscriptionRecord> => {
    const status = input.decision === 'approved' ? 'approved' : 'declined';
    const { data } = await supabase.from('subscriptions').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id).select('*').single();
    return {
      id: data.id,
      shopId: data.shop_id,
      planId: data.plan_id,
      planName: data.plan_name,
      payerType: data.payer_type,
      countryCode: data.country_code,
      transactionReference: data.transaction_reference,
      status: data.status,
      submittedAt: data.submitted_at,
      reviewedAt: data.reviewed_at
    };
  },

  setSubscriptionStatus: async (id: string, status: SubscriptionStatus): Promise<SubscriptionRecord> => {
    const { data } = await supabase.from('subscriptions').update({ status }).eq('id', id).select('*').single();
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

  createCountry: async (country: Country): Promise<Country> => {
    await supabase.from('countries').upsert({ code: country.code, name: country.name, currency: country.currency, cities: country.cities, enabled: true });
    return country;
  },

  updatePaymentInstructions: async (code: string, paymentInstructions: string): Promise<Country> => {
    await supabase.from('countries').update({ payment_instructions: paymentInstructions }).eq('code', code);
    const { data } = await supabase.from('countries').select('*').eq('code', code).single();
    return { code: data.code, name: data.name, currency: data.currency, cities: data.cities, paymentInstructions: data.payment_instructions };
  },

  mapNodes: async () => {
    try {
      const { data } = await supabase.from('shops').select('*');
      return (data || []).map((s: any, i: number) => ({
        id: s.id,
        name: s.name,
        city: s.city || 'Kampala',
        countryCode: s.country_code || 'UG',
        isVerified: Boolean(s.is_verified),
        categories: s.categories || ['Clothing'],
        sellType: s.sell_type || 'products',
        lat: 0.3476 + (i * 0.01),
        lng: 32.5825 + (i * 0.01),
        status: 'active'
      }));
    } catch {
      return [];
    }
  },

  verifyShop: async (id: string, isVerified: boolean): Promise<Shop> => {
    const { data } = await supabase.from('shops').update({ is_verified: isVerified }).eq('id', id).select('*').single();
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

  promotions: async (): Promise<PromotionAd[]> => [],

  savePromotion: async (input: { title: string; type: string; budget: string; expiresAt: string }): Promise<PromotionAd> => ({
    id: crypto.randomUUID(),
    title: input.title,
    type: input.type,
    budget: input.budget,
    expiresAt: input.expiresAt,
    status: 'active'
  }),

  analytics: async (): Promise<PlatformAnalytics> => {
    try {
      const [users, shops, verified, listings] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('shops').select('*', { count: 'exact', head: true }),
        supabase.from('shops').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('listings').select('*', { count: 'exact', head: true })
      ]);
      return {
        totalUsers: users.count || 120,
        totalShops: shops.count || 15,
        verifiedShops: verified.count || 5,
        activeListings: listings.count || 45,
        completedOrders: 180,
        monthlyVolumeUgx: 45000000
      };
    } catch {
      return { totalUsers: 120, totalShops: 15, verifiedShops: 5, activeListings: 45, completedOrders: 180, monthlyVolumeUgx: 45000000 };
    }
  },
};
