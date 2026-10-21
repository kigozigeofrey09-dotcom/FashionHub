import type { Country } from '../types';
import { supabase } from './supabaseClient';

export const countryService = {
  list: async (): Promise<Country[]> => {
    const { data, error } = await supabase.from('countries').select('*');
    if (error) return [];
    return (data || []).map((row: any) => ({
      code: row.code,
      name: row.name,
      currency: row.currency,
      cities: row.cities || [],
      paymentInstructions: row.payment_instructions
    }));
  },
  listAdmin: async (): Promise<Country[]> => countryService.list(),
  create: async (country: Country): Promise<Country> => {
    const { data, error } = await supabase.from('countries').upsert({
      code: country.code,
      name: country.name,
      currency: country.currency,
      cities: country.cities,
      payment_instructions: country.paymentInstructions,
      enabled: true
    }).select('*').single();
    if (error) throw error;
    return {
      code: data.code,
      name: data.name,
      currency: data.currency,
      cities: data.cities || [],
      paymentInstructions: data.payment_instructions
    };
  },
  updateCurrency: async (code: string, currency: string): Promise<Country> => {
    const { data, error } = await supabase.from('countries').update({ currency }).eq('code', code).select('*').single();
    if (error) throw error;
    return {
      code: data.code,
      name: data.name,
      currency: data.currency,
      cities: data.cities || [],
      paymentInstructions: data.payment_instructions
    };
  },
  updatePaymentInstructions: async (code: string, paymentInstructions: string): Promise<Country> => {
    const { data, error } = await supabase.from('countries').update({ payment_instructions: paymentInstructions }).eq('code', code).select('*').single();
    if (error) throw error;
    return {
      code: data.code,
      name: data.name,
      currency: data.currency,
      cities: data.cities || [],
      paymentInstructions: data.payment_instructions
    };
  },
};
