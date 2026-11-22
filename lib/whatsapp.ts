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
