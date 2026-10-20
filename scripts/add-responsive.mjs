import fs from 'fs';
const css = `

/* Responsive Layouts for Phones, Tablets, and PCs */
@media(max-width: 768px) {
  .tabor-admin-layout { grid-template-columns: 1fr !important; }
  .market-hero { grid-template-columns: 1fr !important; padding: 25px 4% !important; }
  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px 8px !important; }
  .auth-page, .detail-layout, .setup-layout, .subscription-layout, .admin-grid, .policy-grid, .orders-layout { grid-template-columns: 1fr !important; gap: 16px !important; }
  .site-header { height: 64px !important; padding: 0 15px !important; }
  .main-nav { display: none !important; }
  .mobile-menu { display: block !important; }
}
@media(min-width: 769px) and (max-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  .admin-grid, .setup-layout, .subscription-layout, .detail-layout { grid-template-columns: 1fr 1fr !important; }
}
`;
fs.appendFileSync('styles.css', css);
console.log('Responsive styles added successfully!');
