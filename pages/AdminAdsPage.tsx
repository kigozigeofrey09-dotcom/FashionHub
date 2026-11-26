import { useEffect, useState } from 'react';
import { ShieldAlert, Check, X, Megaphone, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { PageTitle, Notice, Loading, EmptyState } from '../components/ui';

export function AdminAdsPage() {
  const { session } = useAppContext();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const isSuperAdmin = session?.user?.email?.toLowerCase() === 'kigozigeofrey09@gmail.com';

  async function loadAllCampaigns() {
    if (!isSuperAdmin) return;
    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error loading ads:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllCampaigns();
  }, [session]);

  async function updateStatus(id: string, approvalStatus: 'approved' | 'rejected', isActive: boolean) {
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ approval_status: approvalStatus, is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      setMessage(`Campaign successfully ${approvalStatus}!`);
      loadAllCampaigns();
    } catch (err: any) {
      alert(err.message || 'Could not update campaign status.');
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Are you sure you want to delete this ad campaign?')) return;
    try {
      const { error } = await supabase.from('ad_campaigns').delete().eq('id', id);
      if (error) throw error;
      setMessage('Campaign deleted successfully.');
      loadAllCampaigns();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="content-page text-center py-20">
        <div className="inline-flex p-4 bg-rose-50 text-rose-600 rounded-2xl mb-4">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">403 Forbidden</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          This advertisements control suite is strictly restricted to the Super Admin (<strong>kigozigeofrey09@gmail.com</strong>).
        </p>
      </div>
    );
  }

  return (
    <div className="content-page max-w-6xl mx-auto py-8">
      <PageTitle eyebrow="ADMIN ADVERTISEMENTS SUITE" title={<>Super Admin <em>Ad Moderation.</em></>}>
        Review, approve, reject, and manage sponsored seller campaigns across the platform.
      </PageTitle>

      {message && <Notice tone="success">{message}</Notice>}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Megaphone size={18} className="text-emerald-600" /> Pending & Active Ad Campaigns ({campaigns.length})
        </h3>

        {loading ? <Loading label="Loading ad campaigns..." /> : (
          <div className="space-y-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <img src={camp.banner_url} alt="" className="w-20 h-14 object-cover rounded-lg border border-slate-200" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{camp.package_name}</h4>
                    <p className="text-xs text-slate-500">Target: <a href={camp.target_url} target="_blank" rel="noreferrer" className="text-emerald-600 underline">{camp.target_url}</a></p>
                    <small className="text-[10px] text-slate-400">Duration: {camp.start_date} to {camp.end_date}</small>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    camp.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    camp.approval_status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {camp.approval_status}
                  </span>

                  {camp.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(camp.id, 'approved', true)}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Check size={14} /> Approve & Launch
                      </button>
                      <button
                        onClick={() => updateStatus(camp.id, 'rejected', false)}
                        className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => deleteCampaign(camp.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete campaign"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {!campaigns.length && !loading && (
              <EmptyState title="No ad campaigns submitted yet">Seller promotional bookings will appear here for admin review.</EmptyState>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
