import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Lock, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { PageTitle, Loading, EmptyState, Notice, ListingCard } from '../components/ui';
import { listingService } from '../services/listingService';
import { getWhatsAppLink, getWhatsAppShareLink } from '../lib/whatsapp';
import { recordWhatsAppLead } from '../lib/whatsappLeads';
import { useAppContext } from '../context/AppContext';
import type { Listing } from '../types';

const VAULT_STORAGE_KEY = 'fashionhub_monthly_vault_v1';

interface VaultConfig {
  monthLabel: string;
  editionTitle: string;
  stockNote: string;
  winnerId: string;
  runnerUpIds: string[];
}

const DEFAULT_VAULT: VaultConfig = {
  monthLabel: 'November 2026',
  editionTitle: 'Monthly Admin Crown Drop',
  stockNote: 'Limited monthly vault allocation · While stock lasts',
  winnerId: '',
  runnerUpIds: [],
};

export function VaultPage() {
  const { session } = useAppContext();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [vault, setVault] = useState<VaultConfig>(() => {
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      return raw ? { ...DEFAULT_VAULT, ...(JSON.parse(raw) as Partial<VaultConfig>) } : DEFAULT_VAULT;
    } catch {
      return DEFAULT_VAULT;
    }
  });
  const [winnerInput, setWinnerInput] = useState(vault.winnerId);
  const [editionInput, setEditionInput] = useState(vault.editionTitle);
  const [monthInput, setMonthInput] = useState(vault.monthLabel);
  const [stockInput, setStockInput] = useState(vault.stockNote);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    let active = true;
    listingService
      .search(new URLSearchParams())
      .then((res) => {
        if (!active) return;
        setListings(res);
        setVault((prev) => {
          const resolvedWinnerId =
            prev.winnerId && res.some((item) => item.id === prev.winnerId)
              ? prev.winnerId
              : res[0]?.id ?? '';
          const resolvedRunners = prev.runnerUpIds.length
            ? prev.runnerUpIds.filter((id) => id !== resolvedWinnerId && res.some((item) => item.id === id))
            : res.filter((item) => item.id !== resolvedWinnerId).slice(0, 3).map((item) => item.id);
          setWinnerInput((cur) => cur || resolvedWinnerId);
          return { ...prev, winnerId: resolvedWinnerId, runnerUpIds: resolvedRunners };
        });
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

  const winner = listings.find((item) => item.id === vault.winnerId) ?? listings[0];
  const supportingItems = listings.filter((item) => vault.runnerUpIds.includes(item.id) && item.id !== winner?.id);

  function saveMonthlyVault(e: React.FormEvent) {
    e.preventDefault();
    const chosenId = winnerInput || listings[0]?.id || '';
    const updatedRunners = listings
      .filter((item) => item.id !== chosenId)
      .slice(0, 3)
      .map((item) => item.id);
    const nextConfig: VaultConfig = {
      monthLabel: monthInput.trim() || DEFAULT_VAULT.monthLabel,
      editionTitle: editionInput.trim() || DEFAULT_VAULT.editionTitle,
      stockNote: stockInput.trim() || DEFAULT_VAULT.stockNote,
      winnerId: chosenId,
      runnerUpIds: updatedRunners,
    };
    setVault(nextConfig);
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(nextConfig));
    } catch {
      // ignore storage errors
    }
    setStatusMsg(`Updated ${nextConfig.monthLabel} Vault winner.`);
    setTimeout(() => setStatusMsg(''), 2500);
  }

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
        Handpicked monthly winning piece unlocked in The Vault—limited attention, verified seller inquiry, and instant WhatsApp sharing.
      </PageTitle>

      {statusMsg && <Notice tone="success">{statusMsg}</Notice>}

      {loading ? (
        <Loading label="Unlocking this month's Vault selection..." />
      ) : !winner ? (
        <EmptyState title="No listings available for The Vault yet">
          Publish at least one listing in your seller studio to crown this month's Vault winner.
        </EmptyState>
      ) : (
        <>
          <section
            aria-label="Monthly winning product"
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
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2c4734', color: '#fff', padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, width: 'fit-content' }}>
                <Crown size={14} /> {vault.monthLabel} Winner
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

          <section style={{ marginTop: '36px', background: '#fff', border: '1px solid #e5e2da', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>ADMIN CURATION DESK</p>
                <h3 style={{ margin: '2px 0 0', font: '500 20px var(--serif)' }}>Pick This Month's Winning Vault Product</h3>
              </div>
              {!session && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6e6d68' }}>
                  <Lock size={14} /> Sign in as admin to lock changes across sessions
                </span>
              )}
            </div>

            <form onSubmit={saveMonthlyVault} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <label className="field">
                <span>Winning Product</span>
                <select value={winnerInput} onChange={(e) => setWinnerInput(e.target.value)}>
                  {listings.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — UGX {Number(item.price).toLocaleString()} ({item.shopName})
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Month Label</span>
                <input value={monthInput} onChange={(e) => setMonthInput(e.target.value)} placeholder="November 2026" />
              </label>

              <label className="field">
                <span>Vault Edition Title</span>
                <input value={editionInput} onChange={(e) => setEditionInput(e.target.value)} placeholder="Monthly Admin Crown Drop" />
              </label>

              <label className="field">
                <span>Scarcity / Stock Note</span>
                <input value={stockInput} onChange={(e) => setStockInput(e.target.value)} placeholder="Only 3 pieces left" />
              </label>

              <button type="submit" className="button button-dark" style={{ height: '42px', cursor: 'pointer' }}>
                Put Winner in Vault
              </button>
            </form>
          </section>

          {supportingItems.length > 0 && (
            <section style={{ marginTop: '36px' }}>
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">ALSO IN THE VAULT</p>
                  <h2>Supporting <em>Contenders</em></h2>
                </div>
              </div>
              <div className="product-grid" style={{ marginTop: '16px' }}>
                {supportingItems.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
