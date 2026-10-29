import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, MapPin, MessageCircle, MessageSquare, X } from 'lucide-react';
import type { Listing } from '../types';
import { enquiryService } from '../services/enquiryService';
import { errorMessage } from '../services/http';
import { supabase } from '../services/supabaseClient';

export function PageTitle({ eyebrow, title, children, action }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode }) {
  return <div className="page-title"><div><p className="eyebrow"><span className="eyebrow-line" />{eyebrow}</p><h1>{title}</h1>{children && <p className="page-description">{children}</p>}</div>{action && <div className="page-title-action">{action}</div>}</div>;
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warning' | 'error' | 'success'; title?: string; children: React.ReactNode }) {
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{title && <strong>{title}</strong>}<div>{children}</div></div>;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}</div>;
}

export function EmptyState({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-mark">✳</span><h2>{title}</h2><p>{children}</p>{action}</div>;
}

export function SeedNotice() {
  return <Notice tone="warning" title="Development seed data">These sample listings are bundled for preview. They are not live, shared, or available to purchase.</Notice>;
}

export function whatsappHref(phone: string, message: string) {
  const internationalDigits = phone.replace(/\D/g, '');
  return `https://wa.me/${internationalDigits}?text=${encodeURIComponent(message)}`;
}

export function ListingCard({ listing, onSave, saved = false }: { listing: Listing; onSave?: (listing: Listing) => void; saved?: boolean }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85';

  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [activeEnquiryProduct, setActiveEnquiryProduct] = useState<Listing | null>(null);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleEnquiry = async (targetProduct: Listing) => {
    try {
      if (!targetProduct || !targetProduct.id) {
        console.warn("No product provided for enquiry");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      if (!currentUser) {
        alert("Please sign in to send an enquiry to the seller.");
        window.location.href = `/auth/sign-in?redirect=/listings/${targetProduct.id}`;
        return;
      }

      setActiveEnquiryProduct(targetProduct);
      setIsEnquiryModalOpen(true);
    } catch (err) {
      console.error("Failed to open enquiry:", err);
    }
  };

  async function submitQuickEnquiry(e: FormEvent) {
    e.preventDefault();
    if (!activeEnquiryProduct?.id) return;
    setSubmitting(true);
    setFeedback('');
    try {
      await enquiryService.create({ listingId: activeEnquiryProduct.id, message: enquiryMessage.trim() || 'Hi, is this product still available?' });
      setFeedback('Enquiry sent successfully!');
      setTimeout(() => {
        setIsEnquiryModalOpen(false);
        setEnquiryMessage('');
        setFeedback('');
      }, 1500);
    } catch (err) {
      setFeedback(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return <article className="listing-card">
    <Link className="listing-image" to={`/listings/${listing?.id ?? ''}`} aria-label={`View ${listing?.name ?? 'listing'}`}>
      <img
        src={listing?.image || fallbackImage}
        alt={listing?.name || 'Listing'}
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
      />
      <span className="listing-category">{listing?.category || 'Product'}</span>
      {listing?.isSeed && <span className="sample-corner">SAMPLE</span>}
      {listing?.promotionLabel && <span className="paid-promotion-badge">{listing.promotionLabel === 'Sponsored' ? 'SPONSORED' : 'FEATURED'}</span>}
    </Link>
    {onSave && <button className={`icon-button save-button ${saved ? 'is-saved' : ''}`} aria-label={saved ? `Remove ${listing?.name} from saved items` : `Save ${listing?.name}`} onClick={() => onSave(listing)}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>}
    <div className="listing-card-body">
      <div className="listing-name-price"><Link to={`/listings/${listing?.id ?? ''}`}><h3>{listing?.name || 'Listing'}</h3></Link><strong>{listing?.currency || 'UGX'} {(listing?.price || 0).toLocaleString()}</strong></div>
      <Link className="listing-shop" to={`/shops/${listing?.shopId ?? ''}`}>{listing?.shopName || 'Store'}<ArrowUpRight size={13} /></Link>
      <div className="listing-location"><MapPin size={12} />{listing?.city || 'Kampala'}, {listing?.countryName || 'Uganda'}<span>· {listing?.type || 'product'}</span></div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        {listing?.sellerWhatsapp ? <a className="button button-outline" style={{ flex: 1, fontSize: '9px', padding: '0 8px', minHeight: '34px' }} href={whatsappHref(listing.sellerWhatsapp, `Hi, I found ${listing?.name} on FashionHub. Is it available?`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={13} /> WhatsApp</a> : <Link className="button button-outline" style={{ flex: 1, fontSize: '9px', padding: '0 8px', minHeight: '34px' }} to={`/listings/${listing?.id ?? ''}#whatsapp-order`}><MessageCircle size={13} /> WhatsApp</Link>}
        <button onClick={() => handleEnquiry(listing)} className="button button-dark" style={{ flex: 1, fontSize: '9px', padding: '0 8px', minHeight: '34px', background: '#315039', border: 0, cursor: 'pointer' }}><MessageSquare size={13} /> Enquiry</button>
      </div>
    </div>

    {/* Safe Enquiry Modal with optional chaining */}
    {isEnquiryModalOpen && (
      <div className="dialog-backdrop" role="presentation" onClick={() => setIsEnquiryModalOpen(false)}>
        <div className="dialog" onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '420px', width: '100%', position: 'relative' }}>
          <button onClick={() => setIsEnquiryModalOpen(false)} style={{ position: 'absolute', right: '14px', top: '14px', background: 'transparent', border: 0, cursor: 'pointer' }}><X size={18} /></button>
          <p className="eyebrow">SELLER ENQUIRY</p>
          <h2 style={{ font: '500 20px var(--serif)', margin: '4px 0 12px' }}>{activeEnquiryProduct?.name || activeEnquiryProduct?.title || 'Product Enquiry'}</h2>
          <p style={{ fontSize: '11px', color: '#73776e', marginBottom: '16px' }}>
            Price: <strong>{activeEnquiryProduct?.currency || 'UGX'} {(activeEnquiryProduct?.price || 0).toLocaleString()}</strong> · Sold by {activeEnquiryProduct?.shopName || 'Store'}
          </p>
          {feedback && <Notice tone={feedback.includes('success') ? 'success' : 'error'}>{feedback}</Notice>}
          <form onSubmit={submitQuickEnquiry} className="form-stack">
            <label className="field">
              <span>Your Message</span>
              <textarea
                value={enquiryMessage}
                onChange={e => setEnquiryMessage(e.target.value)}
                rows={3}
                required
                minLength={5}
                maxLength={800}
                placeholder="Hi, is this item still available? I would like to know..."
              />
            </label>
            <button className="button button-dark" type="submit" disabled={submitting} style={{ background: '#315039', color: '#fff', width: '100%', justifyContent: 'center', marginTop: '10px' }}>
              {submitting ? 'Sending Enquiry...' : 'Send Enquiry to Seller'}
            </button>
          </form>
        </div>
      </div>
    )}
  </article>;
}

export function StatusBadge({ children, status }: { children: React.ReactNode; status: string }) {
  return <span className={`status-badge status-${(status || '').replaceAll('_', '-')}`}>{children}</span>;
}

export function FormError({ message }: { message?: string }) {
  return message ? <p className="field-error" role="alert">{message}</p> : null;
}
