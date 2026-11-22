import fs from 'fs';
const tvCss = `

/* Smart TV & 10-Foot UI Responsive Support (Large Screens / TVs) */
@media(min-width: 1440px) {
  :root { --page: 1560px; }
  body { font-size: 16px !important; }
  .site-header { height: 88px !important; padding: 0 4rem !important; }
  .product-grid { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; gap: 32px 24px !important; }
  .button { min-height: 52px !important; font-size: 13px !important; padding: 0 24px !important; }
  .market-hero { padding: 80px 10% !important; min-height: 600px !important; }
  button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 4px solid var(--lime) !important;
    outline-offset: 4px !important;
    transform: scale(1.03);
  }
}
`;
fs.appendFileSync('styles.css', tvCss);
console.log('Smart TV responsive styles added successfully!');
