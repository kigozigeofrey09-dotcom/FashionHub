export const getWhatsAppLink = (phoneNumber: string, productTitle?: string, price?: number | string) => {
  // Clean phone number (default to fallback vendor number if missing)
  const cleanPhone = (phoneNumber || '256773927881').replace(/[^0-9]/g, '');

  // Pre-fill message text with item context
  let message = "Hello! I am interested in your item listed on FashionHub.";
  if (productTitle) {
    message = `Hello! I am inquiring about "${productTitle}"${price ? ` listed for UGX ${Number(price).toLocaleString()}` : ''} on FashionHub. Is it still available?`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
export const getWhatsAppShareLink = (
  productTitle?: string,
  price?: number | string,
  shareUrl?: string,
  locationHint?: string
) => {
  const baseUrl =
    shareUrl ||
    (typeof window !== 'undefined' ? window.location.href : 'https://fashion-hub-day-book3.vercel.app');
  const priceText = price ?  — UGX  : '';
  const locText = locationHint ?  () : '';
  const message = productTitle
    ? Check out "" on FashionHub: 
    : Check out this find on FashionHub: ;
  return https://wa.me/?text=;
};
