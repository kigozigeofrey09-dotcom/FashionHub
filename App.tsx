import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Shell } from './components/Shell';
import { MarketplacePage } from './pages/MarketplacePage';
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
import { AuthPage } from './pages/AuthPage';
import { SellerOnboardingPage, SellerDashboardPage } from './pages/SellerPages';
import { SellerPromotionsPage } from './pages/SellerPromotionsPage';
const AdminAdsPage = lazy(() => import('./pages/AdminAdsPage').then((m) => ({ default: m.AdminAdsPage })));
import { ListingDetailPage, ShopPage } from './pages/DetailsPages';
import { AccountPage } from './pages/AccountPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { SupportPage, InformationPage } from './pages/InfoPages';
const DripAiPage = lazy(() => import('./pages/DripAiPage').then((m) => ({ default: m.DripAiPage })));
const StyleSwipePage = lazy(() => import('./pages/StyleSwipePage').then((m) => ({ default: m.StyleSwipePage })));
const VaultPage = lazy(() => import('./pages/VaultPage').then((m) => ({ default: m.VaultPage })));
import { DayBookApp } from './src/daybook/DayBookApp';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
const TeammateOpsPage = lazy(() => import('./pages/TeammateOpsPage').then((m) => ({ default: m.TeammateOpsPage })));
export function App() {
  return (
    <AppProvider>
      <Suspense fallback={<div style={{ padding: '48px 24px', textAlign: 'center', color: '#6E6D68' }}>Loading studio…</div>}><Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/teammate/dashboard" element={<TeammateOpsPage />} />
          <Route path="/admin/advertisements" element={<AdminAdsPage />} />
          <Route path="/seller/setup" element={<SellerOnboardingPage />} />
          <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
          <Route path="/seller/promotions" element={<SellerPromotionsPage />} />
          <Route path="/listings/:listingId" element={<ListingDetailPage />} />
          <Route path="/shops" element={<MarketplacePage />} />
          <Route path="/shops/:shopId" element={<ShopPage />} />
          <Route path="/drip-ai" element={<DripAiPage />} />
          <Route path="/style-swipe" element={<StyleSwipePage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/daybook" element={<DayBookApp />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/policies" element={<InformationPage />} />
          <Route path="/auth/:mode" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Route>
      </Routes></Suspense>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <a href="#/">Discover</a>
        <a href="#/style-swipe">Swipe</a>
        <a href="#/drip-ai">Drip AI</a>
        <a href="#/account">Saved</a>
        <a href="#/seller/dashboard">Studio</a>
      </nav>
    </AppProvider>
  );
}
export default App;



