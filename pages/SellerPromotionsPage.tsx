import { useEffect, useState, type FormEvent } from 'react';
import { Megaphone, Plus, CheckCircle, Clock, XCircle, CreditCard } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { uploadService } from '../services/uploadService';
import { PageTitle, Notice, Loading, EmptyState, StatusBadge } from '../components/ui';
import { useAppContext } from '../context/AppContext';

const packages = [
  { id: 'Featured Shop Badge', name: 'Featured Shop Badge', price: 37000, duration: '1 week', slot: 'badge' },
  { id: 'Top Search Position', name: 'Top Search Position', price: 55000, duration: '1 week', slot: 'search' },
  { id: 'Homepage Hero Banner', name: 'Homepage Hero Banner', price: 95000, duration: '1 week', slot: 'homepage' },
];

export function SellerPromotionsPage() {
  const { session } = useAppContext();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [packageName, setPackageName] = useState(packages[0].name);
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedPkg = packages.find(p => p.name === packageName) || packages[0];

  async function loadCampaigns() {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('seller_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, [session]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      let bannerUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85';
      if (bannerFile) {
        const uploaded = await uploadService.image(bannerFile, 'storefront');
        bannerUrl = uploaded.url;
      }

      const { error: insertErr } = await supabase.from('ad_campaigns').insert({
        seller_id: session.user.id,
        package_name: packageName,
        banner_url: bannerUrl,
        target_url: targetUrl || '/',
        placement_slot: selectedPkg.slot,
        start_date: startDate,
        end_date: endDate,
        payment_status: 'paid',
        approval_status: 'pending',
        is_active: false
      });

      if (insertErr) throw insertErr;

      setMessage('Ad campaign submitted successfully! Pending admin approval after MTN MoMo payment confirmation (0773927881 / Kabesha Bankenga).');
      setTargetUrl('');
      setTransactionRef('');
      setBannerFile(null);
      loadCampaigns();
    } catch (err: any) {
      setError(err?.message || 'Could not submit ad campaign.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return <div className="content-page text-center py-16"><h2>Sign in required</h2><p>Please sign in as a seller to book promotional campaigns.</p></div>;
  }

  return (
    <div className="content-page max-w-5xl mx-auto py-8">
      <PageTitle eyebrow="SELLER PROMOTIONS & ADS" title={<>Boost your <em>brand visibility.</em></>}>
        Book sponsored ad placements to feature your shop or listings at the top of the FashionHub marketplace.
      </PageTitle>

      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Megaphone size={18} className="text-emerald-600" /> Book New Ad Campaign
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Ad Package</label>
              <select
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
              >
                {packages.map(p => <option key={p.id} value={p.name}>{p.name} — UGX {p.price.toLocaleString()} ({p.duration})</option>)}
              </select>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
              <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5"><CreditCard size={15} /> MTN Mobile Money Payment</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Send <strong>UGX {selectedPkg.price.toLocaleString()}</strong> to MTN MoMo: <strong>0773927881</strong> (Name: <strong>Kabesha Bankenga</strong>). Enter your transaction reference below.
              </p>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="MTN MoMo Transaction Reference / SMS Code"
                required
                className="w-full px-3 py-2 bg-white rounded-lg border border-emerald-200 text-xs text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Target Link (Shop or Product URL)</label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="e.g. /shops/my-shop-id or /listings/item-id"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Upload Ad Banner / Image</label>
              <input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
            </div>

            <button type="submit" disabled={submitting} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-md transition-all">
              {submitting ? 'Submitting Campaign...' : 'Submit Ad for Review'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Your Ad Campaigns</h3>
          <div className="overflow-y-auto flex-1 space-y-3">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{camp.package_name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{camp.start_date} to {camp.end_date}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${
                    camp.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    camp.approval_status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {camp.approval_status}
                  </span>
                  <span className={`block text-[9px] font-bold mt-1 ${camp.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {camp.is_active ? 'Active on Storefront' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
            {!campaigns.length && !loading && (
              <div className="text-center py-12 text-slate-400 text-xs">No ad campaigns booked yet. Submit your first campaign on the left!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
