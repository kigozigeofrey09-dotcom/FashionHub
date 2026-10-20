import fs from 'fs';
const watchCss = `

/* Smart Watch & Wear OS Responsive Support (< 320px) */
@media(max-width: 320px) {
  body { font-size: 11px !important; }
  .site-header { height: 48px !important; padding: 0 8px !important; }
  .brand span:not(.brand-mark) { display: none !important; }
  .content-page { padding: 16px 4% !important; }
  .product-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
  .button { min-height: 34px !important; font-size: 9px !important; padding: 0 8px !important; }
  .market-hero h1 { font-size: 28px !important; }
  .site-footer { flex-direction: column; text-align: center; gap: 8px; }
  .tabor-admin-layout { grid-template-columns: 1fr !important; padding: 4px !important; }
}
`;
fs.appendFileSync('styles.css', watchCss);
console.log('Smart watch responsive styles added successfully!');
