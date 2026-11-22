import { useEffect, useState } from 'react';
import { BookOpen, LayoutDashboard, PlusCircle, BarChart3, Bot, Sparkles, RefreshCcw } from 'lucide-react';
import { dayBookSupabase } from './supabaseClient';
import { TransactionForm } from './TransactionForm';
import { LedgerTable } from './LedgerTable';
import { Dashboard } from './Dashboard';
import { Analytics } from './Analytics';
import { AiAdvisor } from './AiAdvisor';
import type { Transaction } from './types';

export function DayBookApp() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'ledger' | 'analytics' | 'advisor'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', date: '2026-03-01', type: 'income', amount: 450000, category: 'Sales', description: 'Kitenge wholesale batch', payment_method: 'MTN_MoMo', created_by: 'Agent' },
    { id: '2', date: '2026-03-02', type: 'expense', amount: 200000, category: 'Stock Purchase', description: 'Fabrics from Kikuubo', payment_method: 'Cash', created_by: 'Owner' },
    { id: '3', date: '2026-03-03', type: 'income', amount: 180000, category: 'Sales', description: 'Retail dress sale', payment_method: 'MTN_MoMo', created_by: 'Agent' },
    { id: '4', date: '2026-03-04', type: 'expense', amount: 50000, category: 'Transport', description: 'Boda delivery to Ntinda', payment_method: 'Cash', created_by: 'Agent' },
  ]);
  const [loading, setLoading] = useState(true);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const { data, error } = await dayBookSupabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setTransactions(data);
      }
    } catch (err) {
      console.log('Using local mock transactions for DayBook');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  function handleAdded(newTx: Transaction) {
    setTransactions((prev) => [newTx, ...prev]);
    setActiveTab('ledger');
  }

  function handleDelete(id: string) {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    dayBookSupabase.from('transactions').delete().eq('id', id).then();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/25">
              <BookOpen size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">DayBook UG</h1>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">UGX Pro</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Business Accounting, P&L, Seasonal Analytics & AI Business Advisor for Uganda</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => fetchTransactions()}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCcw size={18} />
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className="flex-1 md:flex-initial py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <PlusCircle size={18} /> New Entry
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <LayoutDashboard size={18} /> P&L Dashboard
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <BookOpen size={18} /> Live Ledger ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'form' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <PlusCircle size={18} /> Record Entry
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <BarChart3 size={18} /> Seasonal Analytics
          </button>
          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'advisor' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <Bot size={18} /> AI Business Advisor
          </button>
        </div>

        <main>
          {loading && (
            <div className="py-16 text-center text-slate-400 text-sm">Loading DayBook financial records...</div>
          )}

          {!loading && activeTab === 'dashboard' && <Dashboard transactions={transactions} />}
          {!loading && activeTab === 'ledger' && <LedgerTable transactions={transactions} onDelete={handleDelete} />}
          {!loading && activeTab === 'form' && <TransactionForm onAdded={handleAdded} />}
          {!loading && activeTab === 'analytics' && <Analytics transactions={transactions} />}
          {!loading && activeTab === 'advisor' && <AiAdvisor transactions={transactions} />}
        </main>
      </div>
    </div>
  );
}
