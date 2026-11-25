import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Crown, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { PageTitle, Loading, EmptyState } from '../components/ui';
import { listingService } from '../services/listingService';
import { getWhatsAppLink, getWhatsAppShareLink } from '../lib/whatsapp';
import { recordWhatsAppLead } from '../lib/whatsappLeads';
import type { Listing } from '../types';

const VAULT_STORAGE_KEY = 'fashionhub_monthly_vault_v1';

interface VaultConfig {
  monthLabel: string;
  editionTitle: string;
  stockNote: string;
  winnerId: string;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
}

const DEFAULT_VAULT: VaultConfig = {
  monthLabel: 'November 2026',
  editionTitle: 'Monthly Admin Crown Drop',
  stockNote: 'Limited 5-day vault drop · While stock lasts',
  winnerId: '',
  startedAt: '',
  expiresAt: '',
  isActive: false,
};

function readVault(): VaultConfig {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return raw ? { ...DEFAULT_VAULT, ...(JSON.parse(raw) as Partial<VaultConfig>) } : DEFAULT_VAULT;
  } catch {
    return DEFAULT_VAULT;
  }
}

function formatCountdown(expiresAt: string, nowMs: number): string {
  const diff = new Date(expiresAt).getTime() - nowMs;
  if (diff <= 0) return 'Ended';
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${mins}m remaining`;
}

export function VaultPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [vault, setVault] = useState<VaultConfig>(() => readVault());
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setVault(readVault());
    let active = true;
    listingService
      .search(new URLSearchParams())
      .then((res) => {
        if (active) setListings(res);
      })
      .catch(() => {
        if (active) setListings([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const expiresMs = vault.expiresAt ? new Date(vault.expiresAt).getTime() : 0;
  const isLive = Boolean(vault.isActive) && expiresMs > nowMs;
  const winner = isLive ? listings.find((item) => item.id === vault.winnerId) : undefined;

  function handleWhatsAppWinner(item: Listing) {
    const phone = item.sellerWhatsapp || '256773927881';
    recordWhatsAppLead(item.shopId, item.id);
    const url = getWhatsAppLink(phone, `[THE VAULT - ${vault.monthLabel}] ${item.name}`, item.price);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleShareWinner(item: Listing) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fashion-hub-day-book3.vercel.app';
    const shareUrl = getWhatsAppShareLink(
      `${vault.monthLabel} Vault Winner: ${item.name}`,
      item.price,
      `${origin}/vault`,
      item.city
    );
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="content-page">
      <PageTitle eyebrow={`THE VAULT · ${vault.monthLabel.toUpperCase()}`} title={<>{vault.editionTitle} <em>Spotlight.</em></>}>
        Each selected Vault winner stays on display for 5 days before automatically closing.
      </PageTitle>

      {loading ? (
        <Loading label="Checking The Vault..." />
      ) : !winner ? (
        <EmptyState title="No active Vault winner on display">
          This 5-day Vault drop has ended or no winner is currently active. Check back for the next monthly drop.
        </EmptyState>
      ) : (
        <section
          aria-label="Winning product in The Vault"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            background: '#fff',
            border: '1px solid #d8d4ca',
            borderRadius: '18px',
            padding: '20px',
            marginTop: '20px',
            boxShadow: '0 12px 32px rgba(24, 35, 27, 0.08)',
            alignItems: 'center',
          }}
        >
          <Link to={`/listings/${winner.id}`} style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', background: '#ece8de', aspectRatio: '4 / 5' }}>
            <img src={winner.image} alt={winner.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </Link>

          <div style={{ display: 'grid', gap: '12px', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2c4734', color: '#fff', padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                <Crown size={14} /> {vault.monthLabel} Winner
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f2ea', color: '#315039', padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }}>
                <Clock size={13} /> {formatCountdown(vault.expiresAt, nowMs)}
              </span>
            </div>

            <h2 style={{ margin: 0, font: '500 28px/1.2 var(--serif)', color: '#20251f' }}>{winner.name}</h2>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#2c4734' }}>
              UGX {Number(winner.price).toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#5b6159' }}>
              {winner.shopName} · {winner.city}
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: '#f5f2ea', color: '#315039', fontSize: '12px', fontWeight: 600 }}>
              <Sparkles size={15} /> {vault.stockNote}
            </div>

            {winner.description && (
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: '#494e47' }}>
                {winner.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => handleWhatsAppWinner(winner)}
                style={{
                  flex: 1,
                  minWidth: '180px',
                  padding: '12px 18px',
                  borderRadius: '999px',
                  border: 0,
                  background: '#25D366',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <MessageCircle size={17} /> Claim on WhatsApp
              </button>

              <button
                type="button"
                onClick={() => handleShareWinner(winner)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '999px',
                  border: '1px solid #d8d4ca',
                  background: '#fff',
                  color: '#2c4734',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <Share2 size={15} /> Share Drop
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
