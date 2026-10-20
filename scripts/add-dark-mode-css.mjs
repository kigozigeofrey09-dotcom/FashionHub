import fs from 'fs';
const darkModeCss = `

/* Organic Maker Dark Mode Support */
body.dark-mode {
  --paper: #121815;
  --white: #18221d;
  --ink: #f0f2ee;
  --muted: #a0a49c;
  --line: #24302a;
  --green: #58805c;
  --green-dark: #3f6644;
  background: #121815 !important;
  color: #f0f2ee !important;
}
body.dark-mode .site-header {
  background: rgba(18, 24, 21, 0.95) !important;
  border-bottom-color: var(--line) !important;
}
body.dark-mode .admin-panel, body.dark-mode .dialog, body.dark-mode .auth-form-wrap, body.dark-mode .detail-layout, body.dark-mode .shop-profile, body.dark-mode .setup-step, body.dark-mode .setup-aside, body.dark-mode .subsection, body.dark-mode .account-summary, body.dark-mode .saved-item, body.dark-mode .subscription-record, body.dark-mode .review-row, body.dark-mode .inquiry-row {
  background: #18221d !important;
  border-color: var(--line) !important;
  color: #f0f2ee !important;
}
body.dark-mode input, body.dark-mode select, body.dark-mode textarea {
  background: #121815 !important;
  color: #f0f2ee !important;
  border-color: #2a3832 !important;
}
`;
fs.appendFileSync('styles.css', darkModeCss);
console.log('Dark mode CSS added successfully!');
