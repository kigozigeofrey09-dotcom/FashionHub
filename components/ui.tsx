import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, MapPin, MessageCircle } from 'lucide-react';
import type { Listing } from '../types';
import { getWhatsAppLink } from '../lib/whatsapp';

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

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetPhone = listing?.sellerWhatsapp || '256773927881';
    const waUrl = getWhatsAppLink(targetPhone, listing?.name, listing?.price);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

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
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={handleWhatsAppClick}
          className="button button-dark"
          style={{ width: '100%', fontSize: '10px', padding: '8px 12px', background: '#25D366', color: '#fff', border: 0, fontWeight: 700, cursor: 'pointer', display: 'flex', items: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <MessageCircle size={15} /> Chat on WhatsApp
        </button>
      </div>
    </div>
  </article>;
}

export function StatusBadge({ children, status }: { children: React.ReactNode; status: string }) {
  return <span className={`status-badge status-${(status || '').replaceAll('_', '-')}`}>{children}</span>;
}

export function FormError({ message }: { message?: string }) {
  return message ? <p className="field-error" role="alert">{message}</p> : null;
}
