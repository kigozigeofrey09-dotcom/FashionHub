import { supabase } from './supabaseClient';
import { UGANDA_DISCOVERY_CATEGORIES, type DiscoveryCategory } from '../types';

export type ProductCondition = 'new' | 'used' | 'refurbished';
export type SourceIntegrationMethod = 'csv_import' | 'api_feed' | 'manual_submission';
export type SourcePermissionStatus = 'authorised' | 'pending' | 'revoked';
export type AvailabilityStatus = 'in_stock' | 'limited_stock' | 'out_of_stock';
export type ProductVerificationStatus = 'verified' | 'pending' | 'unverified';

export interface DiscoveryProduct {
  id: string;
  canonicalProductKey: string;
  name: string;
  description: string;
  brand: string;
  category: DiscoveryCategory | string;
  subcategory: string;
  images: string[];
  priceUgx: number;
  currency: 'UGX';
  condition: ProductCondition;
  sellerName: string;
  sellerLocation: string;
  sellerWhatsapp?: string;
  externalUrl?: string;
  originalSource: string;
  sourceType: SourceIntegrationMethod;
  sourceId?: string;
  availabilityStatus: AvailabilityStatus;
  verificationStatus: ProductVerificationStatus;
  updatedAt: string;
}

export interface ProductSourceRecord {
  id: string;
  businessName: string;
  website?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  country: string;
  integrationMethod: SourceIntegrationMethod;
  permissionStatus: SourcePermissionStatus;
  importFrequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  lastSyncedAt?: string;
  status: 'active' | 'suspended';
  apiEndpoint?: string;
}

export interface ProductImportLog {
  id: string;
  sourceId?: string;
  sourceName: string;
  importMethod: SourceIntegrationMethod;
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  status: 'completed' | 'partial' | 'failed';
  notes?: string;
  createdAt: string;
}

export interface ProductSearchParams {
  query?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  minPriceUgx?: number;
  maxPriceUgx?: number;
  location?: string;
  condition?: ProductCondition | '';
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  pageSize?: number;
}

export interface CsvRowPreview {
  rowNumber: number;
  valid: boolean;
  duplicateOfExisting: boolean;
  errors: string[];
  product?: Omit<DiscoveryProduct, 'id' | 'updatedAt'>;
}

export const CSV_TEMPLATE_HEADER =
  'name,description,brand,category,subcategory,price_ugx,condition,seller_name,seller_location,seller_whatsapp,external_url,canonical_sku,availability_status,image_url';

export function buildCsvTemplate(): string {
  const sampleRow =
    '"Samsung Galaxy A15 128GB 8GB RAM","Factory unlocked smartphone with 50MP main camera","Samsung","Phones and Electronics","Smartphones",450000,"new","Kampala Tech Hub","Kampala Road","256700000000","https://example-store.ug/galaxy-a15","SKU-SAM-A15-128","in_stock","https://www.terrabok.com/icon.svg"';
  return `${CSV_TEMPLATE_HEADER}\n${sampleRow}\n`;
}

export function normalizeCanonicalKey(input: {
  canonicalSku?: string;
  brand?: string;
  name: string;
  condition?: string;
}): string {
  const explicitSku = (input.canonicalSku || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (explicitSku.length >= 4) {
    return `sku:${explicitSku}`;
  }
  const brandSlug = (input.brand || 'generic').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const nameSlug = input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48);
  const cond = (input.condition || 'new').trim().toLowerCase();
  return `prod:${brandSlug}:${nameSlug}:${cond}`;
}

export function buildWhatsAppDiscoveryUrl(params: {
  whatsappNumber?: string;
  productName: string;
  priceUgx: number;
  listingUrl: string;
  sellerName?: string;
}): string | null {
  const digits = (params.whatsappNumber || '').replace(/[^0-9]/g, '');
  if (!digits || digits.length < 9) return null;
  const normalizedPhone = digits.startsWith('0') && digits.length === 10 ? `256${digits.slice(1)}` : digits;
  const formattedPrice = `UGX ${Math.round(params.priceUgx).toLocaleString('en-UG')}`;
  const text = `Hello ${params.sellerName || 'Seller'}, I saw "${params.productName}" (${formattedPrice}) on TerraBok (${params.listingUrl}). Is it still available?`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function mapRow(row: any): DiscoveryProduct {
  const imgs = Array.isArray(row?.images)
    ? row.images.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0)
    : [];
  return {
    id: String(row?.id ?? ''),
    canonicalProductKey: String(row?.canonical_product_key ?? ''),
    name: String(row?.name ?? ''),
    description: String(row?.description ?? ''),
    brand: String(row?.brand ?? 'Unbranded'),
    category: String(row?.category ?? UGANDA_DISCOVERY_CATEGORIES[0]),
    subcategory: String(row?.subcategory ?? 'General'),
    images: imgs,
    priceUgx: Number(row?.price_ugx ?? 0),
    currency: 'UGX',
    condition: (row?.product_condition as ProductCondition) || 'new',
    sellerName: String(row?.seller_name ?? 'Verified Seller'),
    sellerLocation: String(row?.seller_location ?? 'Kampala'),
    sellerWhatsapp: row?.seller_whatsapp || undefined,
    externalUrl: row?.external_url || undefined,
    originalSource: String(row?.original_source ?? 'Direct Seller'),
    sourceType: (row?.source_type as SourceIntegrationMethod) || 'manual_submission',
    sourceId: row?.source_id || undefined,
    availabilityStatus: (row?.availability_status as AvailabilityStatus) || 'in_stock',
    verificationStatus: (row?.verification_status as ProductVerificationStatus) || 'pending',
    updatedAt: String(row?.updated_at ?? row?.created_at ?? new Date().toISOString()),
  };
}

export const discoveryCatalogService = {
  searchProducts: async (
    params: ProductSearchParams = {}
  ): Promise<{ items: DiscoveryProduct[]; total: number; page: number; pageSize: number }> => {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 24));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      let queryBuilder = supabase
        .from('discovery_products')
        .select('*', { count: 'exact' });

      const cleanQ = (params.query || '').trim();
      if (cleanQ) {
        const tsQuery = cleanQ
          .split(/\s+/)
          .filter(Boolean)
          .map((token) => `${token.replace(/[^a-zA-Z0-9_-]/g, '')}:*`)
          .filter((t) => t.length > 2)
          .join(' & ');
        if (tsQuery) {
          queryBuilder = queryBuilder.textSearch('search_tsv', tsQuery, { config: 'simple' });
        } else {
          queryBuilder = queryBuilder.ilike('name', `%${cleanQ}%`);
        }
      }

      if (params.brand && params.brand.trim()) {
        queryBuilder = queryBuilder.ilike('brand', `%${params.brand.trim()}%`);
      }
      if (params.category && params.category !== 'All') {
        queryBuilder = queryBuilder.eq('category', params.category);
      }
      if (params.subcategory && params.subcategory !== 'All') {
        queryBuilder = queryBuilder.eq('subcategory', params.subcategory);
      }
      if (typeof params.minPriceUgx === 'number' && !Number.isNaN(params.minPriceUgx) && params.minPriceUgx >= 0) {
        queryBuilder = queryBuilder.gte('price_ugx', params.minPriceUgx);
      }
      if (typeof params.maxPriceUgx === 'number' && !Number.isNaN(params.maxPriceUgx) && params.maxPriceUgx > 0) {
        queryBuilder = queryBuilder.lte('price_ugx', params.maxPriceUgx);
      }
      if (params.location && params.location !== 'All' && params.location.trim()) {
        queryBuilder = queryBuilder.ilike('seller_location', `%${params.location.trim()}%`);
      }
      if (params.condition) {
        queryBuilder = queryBuilder.eq('product_condition', params.condition);
      }

      if (params.sortBy === 'price_asc') {
        queryBuilder = queryBuilder.order('price_ugx', { ascending: true });
      } else if (params.sortBy === 'price_desc') {
        queryBuilder = queryBuilder.order('price_ugx', { ascending: false });
      } else {
        queryBuilder = queryBuilder.order('updated_at', { ascending: false });
      }

      const { data, error, count } = await queryBuilder.range(from, to);
      if (error) {
        return { items: [], total: 0, page, pageSize };
      }

      return {
        items: (data || []).map(mapRow),
        total: count ?? (data?.length || 0),
        page,
        pageSize,
      };
    } catch {
      return { items: [], total: 0, page, pageSize };
    }
  },

  getProductById: async (id: string): Promise<DiscoveryProduct | null> => {
    try {
      const { data, error } = await supabase
        .from('discovery_products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      return mapRow(data);
    } catch {
      return null;
    }
  },

  getOffersForCanonicalKey: async (canonicalProductKey: string): Promise<DiscoveryProduct[]> => {
    if (!canonicalProductKey) return [];
    try {
      const { data, error } = await supabase
        .from('discovery_products')
        .select('*')
        .eq('canonical_product_key', canonicalProductKey)
        .neq('availability_status', 'out_of_stock')
        .order('price_ugx', { ascending: true })
        .limit(50);
      if (error || !Array.isArray(data)) return [];
      return data.map(mapRow);
    } catch {
      return [];
    }
  },

  listSources: async (): Promise<ProductSourceRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('product_sources')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !Array.isArray(data)) return [];
      return data.map((s: any) => ({
        id: String(s.id),
        businessName: String(s.business_name || ''),
        website: s.website || undefined,
        contactName: s.contact_name || undefined,
        contactPhone: s.contact_phone || undefined,
        contactEmail: s.contact_email || undefined,
        country: String(s.country || 'Uganda'),
        integrationMethod: (s.integration_method as SourceIntegrationMethod) || 'csv_import',
        permissionStatus: (s.permission_status as SourcePermissionStatus) || 'pending',
        importFrequency: s.import_frequency || 'daily',
        lastSyncedAt: s.last_synced_at || undefined,
        status: s.status === 'suspended' ? 'suspended' : 'active',
        apiEndpoint: s.api_endpoint || undefined,
      }));
    } catch {
      return [];
    }
  },

  upsertSource: async (input: Partial<ProductSourceRecord> & { businessName: string }): Promise<ProductSourceRecord | null> => {
    const payload: any = {
      business_name: input.businessName.trim(),
      website: input.website?.trim() || null,
      contact_name: input.contactName?.trim() || null,
      contact_phone: input.contactPhone?.trim() || null,
      contact_email: input.contactEmail?.trim() || null,
      country: 'Uganda',
      integration_method: input.integrationMethod || 'csv_import',
      permission_status: input.permissionStatus || 'pending',
      import_frequency: input.importFrequency || 'daily',
      status: input.status || 'active',
      api_endpoint: input.apiEndpoint?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (input.id) payload.id = input.id;

    const { data, error } = await supabase
      .from('product_sources')
      .upsert(payload)
      .select('*')
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || 'Failed to save product source');
    return {
      id: String(data.id),
      businessName: String(data.business_name),
      website: data.website || undefined,
      contactName: data.contact_name || undefined,
      contactPhone: data.contact_phone || undefined,
      contactEmail: data.contact_email || undefined,
      country: String(data.country || 'Uganda'),
      integrationMethod: data.integration_method,
      permissionStatus: data.permission_status,
      importFrequency: data.import_frequency,
      lastSyncedAt: data.last_synced_at || undefined,
      status: data.status === 'suspended' ? 'suspended' : 'active',
      apiEndpoint: data.api_endpoint || undefined,
    };
  },

  previewCsvImport: async (
    csvText: string,
    source: ProductSourceRecord
  ): Promise<{ rows: CsvRowPreview[]; validCount: number; invalidCount: number; duplicateCount: number }> => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length <= 1) {
      return { rows: [], validCount: 0, invalidCount: 0, duplicateCount: 0 };
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const idx = (name: string) => headers.indexOf(name);

    const candidateKeys: string[] = [];
    const parsedRows: CsvRowPreview[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const errors: string[] = [];

      const name = idx('name') >= 0 ? cols[idx('name')] || '' : '';
      const description = idx('description') >= 0 ? cols[idx('description')] || '' : '';
      const brand = idx('brand') >= 0 ? cols[idx('brand')] || 'Unbranded' : 'Unbranded';
      const category = idx('category') >= 0 ? cols[idx('category')] || '' : '';
      const subcategory = idx('subcategory') >= 0 ? cols[idx('subcategory')] || 'General' : 'General';
      const rawPrice = idx('price_ugx') >= 0 ? Number(String(cols[idx('price_ugx')] || '').replace(/[^0-9.]/g, '')) : NaN;
      const rawCondition = (idx('condition') >= 0 ? cols[idx('condition')] || 'new' : 'new').toLowerCase();
      const sellerName = idx('seller_name') >= 0 ? cols[idx('seller_name')] || source.businessName : source.businessName;
      const sellerLocation = idx('seller_location') >= 0 ? cols[idx('seller_location')] || 'Kampala' : 'Kampala';
      const sellerWhatsapp = idx('seller_whatsapp') >= 0 ? cols[idx('seller_whatsapp')] || source.contactPhone : source.contactPhone;
      const externalUrl = idx('external_url') >= 0 ? cols[idx('external_url')] || source.website : source.website;
      const canonicalSku = idx('canonical_sku') >= 0 ? cols[idx('canonical_sku')] || '' : '';
      const rawAvail = (idx('availability_status') >= 0 ? cols[idx('availability_status')] || 'in_stock' : 'in_stock').toLowerCase();
      const imageUrl = idx('image_url') >= 0 ? cols[idx('image_url')] || '' : '';

      if (source.permissionStatus !== 'authorised' || source.status !== 'active') {
        errors.push('Source must be active and explicitly authorised before importing catalogue data.');
      }
      if (!name || name.length < 2) errors.push('Product name is required.');
      if (!category || !UGANDA_DISCOVERY_CATEGORIES.includes(category as DiscoveryCategory)) {
        errors.push(`Category must match one of the 12 Ugandan discovery categories (got "${category}").`);
      }
      if (!Number.isFinite(rawPrice) || rawPrice <= 0) errors.push('Valid positive UGX price is required.');

      const condition: ProductCondition =
        rawCondition === 'used' || rawCondition === 'refurbished' ? rawCondition : 'new';
      const availabilityStatus: AvailabilityStatus =
        rawAvail === 'limited_stock' || rawAvail === 'out_of_stock' ? rawAvail : 'in_stock';
      const canonicalProductKey = normalizeCanonicalKey({ canonicalSku, brand, name, condition });

      if (errors.length === 0) {
        candidateKeys.push(canonicalProductKey);
        parsedRows.push({
          rowNumber: i + 1,
          valid: true,
          duplicateOfExisting: false,
          errors: [],
          product: {
            canonicalProductKey,
            name,
            description,
            brand,
            category,
            subcategory,
            images: imageUrl ? [imageUrl] : [],
            priceUgx: Math.round(rawPrice),
            currency: 'UGX',
            condition,
            sellerName,
            sellerLocation,
            sellerWhatsapp: sellerWhatsapp || undefined,
            externalUrl: externalUrl || undefined,
            originalSource: source.businessName,
            sourceType: 'csv_import',
            sourceId: source.id,
            availabilityStatus,
            verificationStatus: source.permissionStatus === 'authorised' ? 'verified' : 'pending',
          },
        });
      } else {
        parsedRows.push({
          rowNumber: i + 1,
          valid: false,
          duplicateOfExisting: false,
          errors,
        });
      }
    }

    const existingKeys = new Set<string>();
    if (candidateKeys.length > 0 && source.id) {
      const uniqueBatchKeys = Array.from(new Set(candidateKeys)).slice(0, 500);
      const { data: existing } = await supabase
        .from('discovery_products')
        .select('canonical_product_key')
        .eq('source_id', source.id)
        .in('canonical_product_key', uniqueBatchKeys);
      for (const row of existing || []) {
        if (row?.canonical_product_key) existingKeys.add(String(row.canonical_product_key));
      }
    }

    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    for (const r of parsedRows) {
      if (!r.valid || !r.product) {
        invalidCount++;
        continue;
      }
      if (existingKeys.has(r.product.canonicalProductKey)) {
        r.duplicateOfExisting = true;
        duplicateCount++;
      } else {
        validCount++;
      }
    }

    return { rows: parsedRows, validCount, invalidCount, duplicateCount };
  },

  commitCsvBatch: async (
    rows: CsvRowPreview[],
    source: ProductSourceRecord,
    skipDuplicates = true
  ): Promise<{ imported: number; skippedDuplicates: number; invalid: number }> => {
    if (source.permissionStatus !== 'authorised' || source.status !== 'active') {
      throw new Error('Cannot import products: source is not active and authorised.');
    }

    const toInsert = rows
      .filter((r) => r.valid && r.product && (!skipDuplicates || !r.duplicateOfExisting))
      .map((r) => ({
        canonical_product_key: r.product!.canonicalProductKey,
        name: r.product!.name,
        description: r.product!.description,
        brand: r.product!.brand,
        category: r.product!.category,
        subcategory: r.product!.subcategory,
        images: r.product!.images,
        price_ugx: r.product!.priceUgx,
        currency: 'UGX',
        product_condition: r.product!.condition,
        seller_name: r.product!.sellerName,
        seller_location: r.product!.sellerLocation,
        seller_whatsapp: r.product!.sellerWhatsapp || null,
        external_url: r.product!.externalUrl || null,
        original_source: source.businessName,
        source_type: 'csv_import',
        source_id: source.id,
        availability_status: r.product!.availabilityStatus,
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      }));

    let imported = 0;
    const chunkSize = 250;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const batch = toInsert.slice(i, i + chunkSize);
      const { error } = await supabase.from('discovery_products').insert(batch);
      if (error) throw new Error(error.message);
      imported += batch.length;
    }

    const skippedDuplicates = rows.filter((r) => r.valid && r.duplicateOfExisting && skipDuplicates).length;
    const invalid = rows.filter((r) => !r.valid).length;

    await supabase
      .from('product_sources')
      .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', source.id);

    await supabase.from('product_import_logs').insert({
      source_id: source.id,
      source_name: source.businessName,
      import_method: 'csv_import',
      total_rows: rows.length,
      imported_count: imported,
      duplicate_count: skippedDuplicates,
      invalid_count: invalid,
      status: invalid > 0 ? 'partial' : 'completed',
      notes: `CSV batch commit (${imported} added, ${skippedDuplicates} duplicates skipped, ${invalid} invalid).`,
    });

    return { imported, skippedDuplicates, invalid };
  },

  listImportLogs: async (): Promise<ProductImportLog[]> => {
    try {
      const { data, error } = await supabase
        .from('product_import_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error || !Array.isArray(data)) return [];
      return data.map((row: any) => ({
        id: String(row.id),
        sourceId: row.source_id || undefined,
        sourceName: String(row.source_name || ''),
        importMethod: (row.import_method as SourceIntegrationMethod) || 'csv_import',
        totalRows: Number(row.total_rows || 0),
        importedCount: Number(row.imported_count || 0),
        duplicateCount: Number(row.duplicate_count || 0),
        invalidCount: Number(row.invalid_count || 0),
        status: row.status || 'completed',
        notes: row.notes || undefined,
        createdAt: String(row.created_at || new Date().toISOString()),
      }));
    } catch {
      return [];
    }
  },
};