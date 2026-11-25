import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Clock, Sparkles, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Loading } from '../components/ui';
import { listingService } from '../services/listingService';
import {
  buildWhatsAppOrderUrl,
  fetchSharedVault,
  formatVaultTimeLeft,
  isVaultCurrentlyLive,
  readLocalVault,
  type VaultConfig,
} from '../services/vaultService';
import { seedListings } from '../data/seed';
import type { Listing } from '../types';

export function VaultPage() {
  const [vault, setVault] = useState<VaultConfig>(() => readLocalVault());
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [itemsRes, sharedVault] = await Promise.all([
          listingService.search(new URLSearchParams()).catch(() => [] as Listing[]),
          fetchSharedVault(),
        ]);
        if (!mounted) return;
        setListings(itemsRes.length > 0 ? itemsRes : seedListings);
        setVault(sharedVault);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const live = isVaultCurrentlyLive(vault, nowMs);
  const winner = live ? listings.find((item) => item.id === vault.winnerId) || listings[0] : undefined;

  return (
    <div style={{ minHeight: '80vh', background: '#FAF9F6', color: '#141414', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header
          style={{
            background: '#FFFFFF',
            border: '1px solid #E6E4DE',
            borderRadius: '16px',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4734', textTransform: 'uppercase' }}>
              <Crown size={14} /> The Vault · {vault.monthLabel || 'November 2026'}
            </div>
            <h1 style={{ margin: '6px 0 6px', fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '36px', fontWeight: 500 }}>
              {vault.editionTitle || 'Monthly Admin Crown Drop'}
            </h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#5A5852' }}>
              {vault.stockNote || 'Each selected Vault winner stays on display for 5 days before automatically closing.'}
            </p>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: live ? '#EEF2EC' : '#F3F0E8',
              color: live ? '#2C4734' : '#5A5852',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={14} />
            {live ? formatVaultTimeLeft(vault.expiresAt, nowMs) : 'No active 5-day drop'}
          </div>
        </header>

        {loading ? (
          <Loading label="Checking active Vault drop..." />
        ) : live && winner ? (
          <section
            style={{
              background: '#FFFFFF',
              border: '1px solid #D6DDD7',
              borderRadius: '16px',
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <img
              src={winner.image || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85'}
              alt={winner.name}
              style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', borderRadius: '12px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span
                style={{
                  alignSelf: 'flex-start',
                  background: '#2C4734',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Sparkles size={12} /> VAULT WINNER · 5-DAY SPOTLIGHT
              </span>

              <h2 style={{ margin: 0, fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '30px', fontWeight: 500 }}>
                {winner.name}
              </h2>

              <div style={{ fontSize: '18px', fontWeight: 700, color: '#141414' }}>
                {winner.currency || 'UGX'} {Number(winner.price || 0).toLocaleString()}
              </div>

              <p style={{ margin: 0, fontSize: '13.5px', color: '#4A4945', lineHeight: 1.55 }}>
                {winner.description || 'Featured monthly Vault selection from FashionHub.'}
              </p>

              <div style={{ fontSize: '12px', color: '#6E6D68' }}>
                Sold by <strong>{winner.shopName || 'FashionHub Seller'}</strong> · {winner.city || 'Kampala'}, {winner.countryName || 'Uganda'}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                <a
                  href={buildWhatsAppOrderUrl(winner, true)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: '#2C4734',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  <MessageCircle size={15} /> Order on WhatsApp
                </a>

                <Link
                  to={`/listings/${winner.id}`}
                  style={{
                    padding: '10px 15px',
                    borderRadius: '10px',
                    border: '1px solid #D4D0C5',
                    background: '#FAF9F6',
                    color: '#141414',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  Listing Details <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section
            style={{
              background: '#FFFFFF',
              border: '1px solid #E6E4DE',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '28px', fontWeight: 500 }}>
              No active Vault winner on display
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#6E6D68' }}>
              This 5-day Vault drop has ended or no winner is currently active. Check back for the next monthly drop.
            </p>
            <Link
              to="/marketplace"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '10px',
                background: '#141414',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Browse Marketplace <ArrowUpRight size={14} />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

export default VaultPage;
