import { useEffect, useState } from 'react';
import { ExternalLink, MessageCircle, ShieldCheck, Store } from 'lucide-react';
import {
  buildWhatsAppDiscoveryUrl,
  discoveryCatalogService,
  normalizeCanonicalKey,
  type DiscoveryProduct,
} from '../services/discoveryCatalogService';
import type { Listing } from '../types';

interface MultiSellerOfferComparisonProps {
  listing: Listing;
}

export function MultiSellerOfferComparison({ listing }: MultiSellerOfferComparisonProps) {
  const [offers, setOffers] = useState<DiscoveryProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const canonicalKey =
    listing.canonicalProductKey ||
    normalizeCanonicalKey({
      brand: listing.brand || listing.shopName,
      name: listing.name,
      condition: listing.condition || (listing.isThrift ? 'used' : 'new'),
    });

  const listingUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/#/listings/${encodeURIComponent(listing.id)}`
      : `https://www.terrabok.com/#/listings/${encodeURIComponent(listing.id)}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    void discoveryCatalogService
      .getOffersForCanonicalKey(canonicalKey)
      .then((rows) => {
        if (active) setOffers(rows);
      })
      .catch(() => {
        if (active) setOffers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canonicalKey]);

  const primaryWaUrl = buildWhatsAppDiscoveryUrl({
    whatsappNumber: listing.sellerWhatsapp,
    productName: listing.name,
    priceUgx: Number(listing.price || 0),
    listingUrl,
    sellerName: listing.shopName,
  });

  const combinedOffers: Array<{
    id: string;
    sellerName: string;
    sellerLocation: string;
    priceUgx: number;
    condition: string;
    availability: string;
    sourceLabel: string;
    whatsappUrl: string | null;
    externalUrl?: string;
    updatedAt?: string;
    verified?: boolean;
  }> =
    offers.length > 0
      ? offers.map((o) => ({
          id: o.id,
          sellerName: o.sellerName,
          sellerLocation: o.sellerLocation,
          priceUgx: o.priceUgx,
          condition: o.condition,
          availability: o.availabilityStatus.replace('_', ' '),
          sourceLabel: o.originalSource || o.sourceType,
          whatsappUrl: buildWhatsAppDiscoveryUrl({
            whatsappNumber: o.sellerWhatsapp,
            productName: o.name,
            priceUgx: o.priceUgx,
            listingUrl,
            sellerName: o.sellerName,
          }),
          externalUrl: o.externalUrl,
          updatedAt: o.updatedAt,
          verified: o.verificationStatus === 'verified',
        }))
      : [
          {
            id: listing.id,
            sellerName: listing.shopName || 'Seller',
            sellerLocation: listing.city || listing.countryName || 'Kampala, Uganda',
            priceUgx: Number(listing.price || 0),
            condition: listing.condition || (listing.isThrift ? 'used' : 'new'),
            availability: listing.isActive === false ? 'out of stock' : 'in stock',
            sourceLabel: listing.externalUrl ? 'Authorised Retailer Feed' : 'TerraBok Seller',
            whatsappUrl: primaryWaUrl,
            externalUrl: listing.externalUrl,
            updatedAt: listing.lastUpdatedAt,
            verified: listing.verificationStatus === 'verified',
          },
        ];

  return (
    <section
      style={{
        marginTop: '24px',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #E6E4DE',
        background: '#FFFFFF',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        {primaryWaUrl && (
          <a
            href={primaryWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-dark"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <MessageCircle size={15} /> Chat with Seller on WhatsApp
          </a>
        )}
        {listing.externalUrl && (
          <a
            href={listing.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <ExternalLink size={15} /> Visit Original Store
          </a>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Seller Offers &amp; Price Comparison (UGX)</h3>
        <span style={{ fontSize: '12px', color: '#6E6D68' }}>
          {loading ? 'Checking offers…' : `${combinedOffers.length} ${combinedOffers.length === 1 ? 'offer' : 'offers'} · Discovery only (no checkout)`}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E6E4DE', textAlign: 'left', color: '#6E6D68', fontSize: '12px' }}>
              <th style={{ padding: '8px 6px' }}>Seller</th>
              <th style={{ padding: '8px 6px' }}>Location</th>
              <th style={{ padding: '8px 6px' }}>Condition</th>
              <th style={{ padding: '8px 6px' }}>Price</th>
              <th style={{ padding: '8px 6px' }}>Source</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Direct Action</th>
            </tr>
          </thead>
          <tbody>
            {combinedOffers.map((offer) => (
              <tr key={offer.id} style={{ borderBottom: '1px solid #F1EFEA' }}>
                <td style={{ padding: '10px 6px', fontWeight: 600 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Store size={13} /> {offer.sellerName}
                    {offer.verified && <ShieldCheck size={13} color="#2C4734" />}
                  </span>
                </td>
                <td style={{ padding: '10px 6px', color: '#4A4945' }}>{offer.sellerLocation}</td>
                <td style={{ padding: '10px 6px', textTransform: 'capitalize' }}>{offer.condition}</td>
                <td style={{ padding: '10px 6px', fontWeight: 700, color: '#141414' }}>
                  UGX {Math.round(offer.priceUgx).toLocaleString('en-UG')}
                </td>
                <td style={{ padding: '10px 6px', color: '#6E6D68', fontSize: '12px' }}>
                  {offer.sourceLabel}
                  {offer.updatedAt ? ` · ${new Date(offer.updatedAt).toLocaleDateString('en-UG')}` : ''}
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {offer.whatsappUrl ? (
                    <a
                      href={offer.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginRight: '10px', fontWeight: 600, color: '#2C4734', textDecoration: 'none' }}
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {offer.externalUrl ? (
                    <a
                      href={offer.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 600, color: '#141414', textDecoration: 'none' }}
                    >
                      Store ↗
                    </a>
                  ) : !offer.whatsappUrl ? (
                    <span style={{ color: '#6E6D68', fontSize: '12px' }}>See shop</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}