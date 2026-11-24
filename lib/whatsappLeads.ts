const STORAGE_KEY = 'fashionhub_whatsapp_leads_v1';

export interface WhatsAppLeadCounts {
  byShop: Record<string, number>;
  byListing: Record<string, number>;
  total: number;
}

function readLeads(): WhatsAppLeadCounts {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { byShop: {}, byListing: {}, total: 0 };
    const parsed = JSON.parse(raw) as Partial<WhatsAppLeadCounts>;
    return {
      byShop: parsed.byShop ?? {},
      byListing: parsed.byListing ?? {},
      total: typeof parsed.total === 'number' ? parsed.total : 0,
    };
  } catch {
    return { byShop: {}, byListing: {}, total: 0 };
  }
}

export function recordWhatsAppLead(shopId?: string, listingId?: string): number {
  const current = readLeads();
  if (shopId) {
    current.byShop[shopId] = (current.byShop[shopId] ?? 0) + 1;
  }
  if (listingId) {
    current.byListing[listingId] = (current.byListing[listingId] ?? 0) + 1;
  }
  current.total += 1;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
  return current.total;
}

export function getShopWhatsAppLeads(shopId?: string): number {
  if (!shopId) return 0;
  return readLeads().byShop[shopId] ?? 0;
}
