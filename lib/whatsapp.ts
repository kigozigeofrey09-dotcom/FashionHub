export const getWhatsAppLink = (phoneNumber: string, productTitle?: string, price?: number | string) => {
  const cleanPhone = (phoneNumber || '256773927881').replace(/[^0-9]/g, '');

  let message = 'Hello! I am interested in your item listed on FashionHub.';
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
  const priceText = price ? ` - UGX ${Number(price).toLocaleString()}` : '';
  const locText = locationHint ? ` (${locationHint})` : '';
  const message = productTitle
    ? `Check out "${productTitle}"${priceText}${locText} on FashionHub: ${baseUrl}`
    : `Check out this find on FashionHub: ${baseUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};
