import { supabase } from './supabaseClient';
import type { Listing } from '../types';

export const VAULT_STORAGE_KEY = 'fashionhub_monthly_vault_v1';
export const VAULT_DROP_ALERT_KEY = 'fashionhub_vault_drop_alert_v1';
export const VAULT_SETTINGS_KEY = 'monthly_vault_drop_v1';
export const VAULT_ALERT_SETTINGS_KEY = 'monthly_vault_alert_v1';
export const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export interface VaultConfig {
  monthLabel: string;
  editionTitle: string;
  stockNote: string;
  winnerId: string;
  runnerUpIds: string[];
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface VaultDropAlertPayload {
  dropId: string;
  title: string;
  message: string;
  winnerName: string;
  monthLabel: string;
  expiresAt: string;
  createdAt: string;
}

export const DEFAULT_VAULT: VaultConfig = {
  monthLabel: 'November 2026',
  editionTitle: 'Monthly Admin Crown Drop',
  stockNote: 'Limited 5-day vault drop · While stock lasts',
  winnerId: '',
  runnerUpIds: [],
  startedAt: '',
  expiresAt: '',
  isActive: false,
};

export function readLocalVault(): VaultConfig {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return raw ? { ...DEFAULT_VAULT, ...(JSON.parse(raw) as Partial<VaultConfig>) } : DEFAULT_VAULT;
  } catch {
    return DEFAULT_VAULT;
  }
}

export function writeLocalVault(config: VaultConfig): void {
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

export async function fetchSharedVault(): Promise<VaultConfig> {
  const local = readLocalVault();
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', VAULT_SETTINGS_KEY)
      .maybeSingle();

    if (!error && data?.value) {
      const remote = { ...DEFAULT_VAULT, ...(data.value as Partial<VaultConfig>) };
      const remoteStart = remote.startedAt ? new Date(remote.startedAt).getTime() : 0;
      const localStart = local.startedAt ? new Date(local.startedAt).getTime() : 0;
      if (remoteStart >= localStart) {
        writeLocalVault(remote);
        return remote;
      }
    }
  } catch {
    // fallback to local
  }
  return local;
}

export async function persistVaultAndNotify(
  config: VaultConfig,
  alertPayload?: VaultDropAlertPayload
): Promise<VaultConfig> {
  writeLocalVault(config);

  try {
    await supabase
      .from('settings')
      .upsert(
        { key: VAULT_SETTINGS_KEY, value: config, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
  } catch {
    // keep local copy if offline/RLS restricted
  }

  if (alertPayload) {
    try {
      localStorage.setItem(VAULT_DROP_ALERT_KEY, JSON.stringify(alertPayload));
      window.dispatchEvent(new CustomEvent('fashionhub-vault-drop', { detail: alertPayload }));
    } catch {
      // ignore storage/event errors
    }

    try {
      await supabase
        .from('settings')
        .upsert(
          { key: VAULT_ALERT_SETTINGS_KEY, value: alertPayload, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
    } catch {
      // ignore
    }

    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(alertPayload.title, {
          body: alertPayload.message,
          tag: alertPayload.dropId,
        });
      }
    } catch {
      // ignore browser notification errors
    }

    try {
      await supabase.from('notifications').insert({
        kind: 'vault_drop',
        title: alertPayload.title,
        message: alertPayload.message,
        href: '/vault',
      });
    } catch {
      // ignore if notifications table/RLS blocks insert
    }
  }

  return config;
}

export function isVaultCurrentlyLive(config: VaultConfig, nowMs: number = Date.now()): boolean {
  return Boolean(config.isActive) && Boolean(config.expiresAt) && new Date(config.expiresAt).getTime() > nowMs;
}

export function formatVaultTimeLeft(expiresAt: string, nowMs: number = Date.now()): string {
  if (!expiresAt) return 'Not scheduled';
  const diff = new Date(expiresAt).getTime() - nowMs;
  if (diff <= 0) return 'Expired (off display)';
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${mins}m left`;
}

export function buildWhatsAppOrderUrl(listing: Listing, isVaultWinner = false): string {
  const digits = (listing.sellerWhatsapp || '').replace(/[^\d]/g, '');
  const normalizedPhone = digits.startsWith('0') && digits.length === 10 ? `256${digits.slice(1)}` : digits;
  const prefix = isVaultWinner ? '[THE VAULT 5-DAY DROP] ' : '';
  const text = encodeURIComponent(
    `Hi ${listing.shopName || 'Seller'}, I saw "${prefix}${listing.name}" (${listing.currency || 'UGX'} ${Number(listing.price || 0).toLocaleString()}) on Terrabok in ${listing.city || 'Kampala'}. Is this still available?`
  );
  return normalizedPhone ? `https://wa.me/${normalizedPhone}?text=${text}` : `https://wa.me/?text=${text}`;
}


