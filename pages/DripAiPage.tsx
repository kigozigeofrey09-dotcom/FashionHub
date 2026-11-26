import { useEffect, useState } from 'react';
import { PageTitle, ListingCard, Loading, EmptyState } from '../components/ui';
import { listingService } from '../services/listingService';
import { getWhatsAppShareLink } from '../lib/whatsapp';
import { Share2, Sparkles } from 'lucide-react';
import type { Listing } from '../types';

const occasions = ['Campus Party', 'Sunday Service', 'Job Interview', 'Casual Sunday', 'Wedding Guest'];

const occasionKeywords: Record<string, string[]> = {
  'Campus Party': ['denim', 'sneaker', 'jacket', 'crop', 'street', 'bag', 'dress', 'top'],
  'Sunday Service': ['dress', 'suit', 'blazer', 'heel', 'silk', 'linen', 'shirt', 'skirt'],
  'Job Interview': ['blazer', 'shirt', 'trouser', 'suit', 'loafer', 'formal', 'oxford', 'bag'],
  'Casual Sunday': ['cotton', 'tee', 't-shirt', 'sandal', 'shorts', 'linen', 'casual', 'shirt'],
  'Wedding Guest': ['gown', 'dress', 'suit', 'heel', 'jewellery', 'clutch', 'silk', 'velvet'],
};

export function DripAiPage() {
  const [budget, setBudget] = useState(100000);
  const [selectedOccasion, setSelectedOccasion] = useState('Campus Party');
  const [generating, setGenerating] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [curated, setCurated] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listingService.search(new URLSearchParams()).then((res) => {
      if (active) {
        setListings(res);
        setCurated(res.slice(0, 3));
      }
    }).catch(() => {
      if (active) setListings([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      const withinBudget = listings.filter((item) => item.price <= budget);
      const keywords = occasionKeywords[selectedOccasion] ?? [];
      const occasionMatched = withinBudget.filter((item) => {
        const haystack = `${item.name} ${item.category} ${item.description ?? ''}`.toLowerCase();
        return keywords.some((kw) => haystack.includes(kw));
      });
      const pool = occasionMatched.length ? occasionMatched : withinBudget;
      setCurated(pool.length ? pool.slice(0, 6) : listings.slice(0, 2));
      setGenerating(false);
    }, 450);
  }

  function handleShareBundle() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fashion-hub-day-book3.vercel.app';
    const total = curated.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const title = `${selectedOccasion} Lookbook (${curated.length} pieces)`;
    const shareUrl = getWhatsAppShareLink(title, total, `${origin}/drip-ai`, 'Kampala');
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  const bundleTotal = curated.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <div className="content-page tb-ebay-page tb-page-drip-ai-page">
      <PageTitle eyebrow="DRIP AI STYLIST" title={<>Your personal <em>outfit curator.</em></>}>
        Select your budget in UGX and occasion, and let Drip AI curate the perfect local look for you from live marketplace items.
      </PageTitle>

      <div style={{ background: '#fff', padding: '25px', border: '1px solid #e5e2da', margin: '20px 0', display: 'grid', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 650, marginBottom: '8px' }}>
            Maximum Budget per Item: <strong>UGX {budget.toLocaleString()}</strong>
          </label>
          <input type="range" min="20000" max="500000" step="10000" value={budget} onChange={(e) => setBudget(Number(e.target.value))} style={{ width: '100%', accentColor: '#496a4d' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 650, marginBottom: '8px' }}>Select Occasion</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {occasions.map((occ) => (
              <button key={occ} onClick={() => setSelectedOccasion(occ)} style={{ padding: '8px 14px', border: `1px solid ${selectedOccasion === occ ? '#496a4d' : '#e5e2da'}`, background: selectedOccasion === occ ? '#496a4d' : '#fff', color: selectedOccasion === occ ? '#fff' : '#20251f', fontSize: '10px', cursor: 'pointer', borderRadius: '99px' }}>
                {occ}
              </button>
            ))}
          </div>
        </div>

        <button className="button button-dark" onClick={handleGenerate} style={{ background: '#496a4d', color: '#fff', padding: '12px', border: 0, fontWeight: 650, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Sparkles size={16} /> Curate Outfit Bundle
        </button>
      </div>

      <div className="section-heading compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <p className="eyebrow">CURATED FOR YOU</p>
          <h2>AI Outfit Matches for <em>{selectedOccasion}</em></h2>
        </div>
        {curated.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#496a4d', fontWeight: 650 }}>
              Bundle Est: UGX {bundleTotal.toLocaleString()}
            </span>
            <button type="button" onClick={handleShareBundle} style={{ padding: '8px 14px', borderRadius: '999px', border: '1px solid #d8d4ca', background: '#fff', color: '#2c4734', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Share2 size={14} /> Share Lookbook
            </button>
          </div>
        )}
      </div>

      {loading ? <Loading label="Loading live marketplace catalog..." /> : generating ? <Loading label="Drip AI is matching styles and prices..." /> : (
        curated.length > 0 ? (
          <div className="product-grid tb-ebay-catalog" style={{ marginTop: '20px' }}>
            {curated.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <EmptyState title="No live listings found for this budget">Try increasing your UGX budget or add live listings through your seller studio.</EmptyState>
        )
      )}
    </div>
  );
}
