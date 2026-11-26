import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle, Notice, EmptyState, Loading } from '../components/ui';
import { listingService } from '../services/listingService';
import { getWhatsAppLink, getWhatsAppShareLink } from '../lib/whatsapp';
import { recordWhatsAppLead } from '../lib/whatsappLeads';
import { Heart, MessageCircle, Share2, Trash2, X } from 'lucide-react';
import type { Listing } from '../types';

const WISHLIST_KEY = 'fashionhub_drip_wishlist_v1';

export function StyleSwipePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listingService.search(new URLSearchParams()).then((res) => {
      if (active) setItems(res);
    }).catch(() => {
      if (active) setItems([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(liked));
    } catch {
      // ignore storage quota errors
    }
  }, [liked]);

  const currentItem = items[currentIndex];
  const savedItems = items.filter((item) => liked.includes(item.id));

  function openWhatsAppInquiry(item: Listing) {
    const targetPhone = item.sellerWhatsapp || '256773927881';
    recordWhatsAppLead(item.shopId, item.id);
    const waUrl = getWhatsAppLink(targetPhone, item.name, item.price);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  function shareListing(item: Listing) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fashion-hub-day-book3.vercel.app';
    const shareUrl = getWhatsAppShareLink(item.name, item.price, `${origin}/listing/${item.id}`, item.city);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  function handleSwipe(action: 'drip' | 'pass') {
    if (!currentItem) return;
    if (action === 'drip') {
      setLiked((prev) => (prev.includes(currentItem.id) ? prev : [...prev, currentItem.id]));
      setMessage(`Added "${currentItem.name}" to your Drip Wishlist ✨`);
    } else {
      setMessage('Passed on item.');
    }
    setTimeout(() => setMessage(''), 1500);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }

  return (
    <div className="content-page tb-ebay-page tb-page-style-swipe-page" style={{ maxWidth: '640px', margin: '30px auto', textAlign: 'center' }}>
      <PageTitle eyebrow="STYLE SWIPE FEED" title={<>Drip or <em>Pass.</em></>}>
        Swipe right to save items to your wishlist, or tap WhatsApp to message the Kampala seller directly.
      </PageTitle>

      {message && <Notice tone="success">{message}</Notice>}

      {loading ? <Loading label="Loading live style feed..." /> : items.length === 0 ? (
        <EmptyState title="No active listings in the feed">Publish listings through your seller studio to see them appear here in real-time.</EmptyState>
      ) : currentItem ? (
        <div style={{ maxWidth: '460px', margin: '20px auto 0', background: '#fff', border: '1px solid #e5e2da', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', position: 'relative' }}>
          <Link to={`/listing/${currentItem.id}`} style={{ display: 'block', height: '400px', background: '#e9e5da', position: 'relative' }}>
            <img src={currentItem.image} alt={currentItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <span style={{ position: 'absolute', top: '15px', left: '15px', background: '#315039', color: '#fff', padding: '6px 12px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '99px' }}>
              {currentItem.category}
            </span>
          </Link>
          <div style={{ padding: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
              <Link to={`/listing/${currentItem.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ margin: '0 0 4px', font: '500 22px var(--serif)' }}>{currentItem.name}</h3>
              </Link>
              <button type="button" onClick={() => shareListing(currentItem)} aria-label="Share item on WhatsApp" style={{ border: '1px solid #e5e2da', background: '#fff', color: '#2c4734', borderRadius: '999px', padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <Share2 size={12} /> Share
              </button>
            </div>
            <p style={{ color: '#496a4d', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>UGX {currentItem.price.toLocaleString()}</p>
            <p style={{ color: '#73776e', fontSize: '11px', margin: '0 0 18px' }}>{currentItem.shopName} · {currentItem.city}</p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
              <button type="button" onClick={() => handleSwipe('pass')} title="Pass" style={{ width: '54px', height: '54px', borderRadius: '50%', border: '2px solid #df705e', background: '#fff', color: '#df705e', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <X size={24} />
              </button>
              <button type="button" onClick={() => openWhatsAppInquiry(currentItem)} style={{ flex: 1, height: '50px', borderRadius: '999px', border: 0, background: '#25D366', color: '#fff', fontWeight: 650, fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,211,102,0.25)' }}>
                <MessageCircle size={18} /> Ask on WhatsApp
              </button>
              <button type="button" onClick={() => handleSwipe('drip')} title="Save to Wishlist" style={{ width: '54px', height: '54px', borderRadius: '50%', border: '2px solid #496a4d', background: '#496a4d', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Heart size={24} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {savedItems.length > 0 && (
        <section style={{ marginTop: '36px', textAlign: 'left', background: '#fff', border: '1px solid #e5e2da', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>SAVED LOOKBOOK</p>
              <h3 style={{ margin: '2px 0 0', font: '500 18px var(--serif)' }}>Your Drip Wishlist ({savedItems.length})</h3>
            </div>
            <button type="button" onClick={() => setLiked([])} style={{ background: 'none', border: 0, color: '#73776e', fontSize: '11px', cursor: 'pointer' }}>
              Clear all
            </button>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {savedItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', border: '1px solid #efede7', borderRadius: '10px' }}>
                <Link to={`/listing/${item.id}`}>
                  <img src={item.image} alt={item.name} style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', display: 'block' }} />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/listing/${item.id}`} style={{ fontWeight: 600, fontSize: '13px', color: '#20251f', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </Link>
                  <span style={{ fontSize: '12px', color: '#496a4d', fontWeight: 600 }}>UGX {item.price.toLocaleString()}</span>
                </div>
                <button type="button" onClick={() => openWhatsAppInquiry(item)} style={{ padding: '7px 12px', borderRadius: '999px', border: 0, background: '#25D366', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <MessageCircle size={13} /> WhatsApp
                </button>
                <button type="button" onClick={() => setLiked((prev) => prev.filter((id) => id !== item.id))} aria-label="Remove from wishlist" style={{ padding: '6px', border: '1px solid #e5e2da', borderRadius: '50%', background: '#fff', color: '#73776e', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
