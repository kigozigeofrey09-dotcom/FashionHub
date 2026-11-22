import { useState } from 'react';
import { Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, Smartphone, Banknote, Landmark } from 'lucide-react';
import type { Transaction, TransactionType } from './types';

interface LedgerTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function LedgerTable({ transactions, onDelete }: LedgerTableProps) {
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;

    if (dateRange === 'today') {
      if (tx.date !== todayStr) return false;
    } else if (dateRange === 'week') {
      const txDate = new Date(tx.date);
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      if (txDate < weekAgo) return false;
    } else if (dateRange === 'month') {
      const txMonth = tx.date.slice(0, 7);
      const currentMonth = todayStr.slice(0, 7);
      if (txMonth !== currentMonth) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      const matchBy = tx.created_by.toLowerCase().includes(q);
      if (!matchCat && !matchDesc && !matchBy) return false;
    }

    return true;
  });

  const formatUgx = (amount: number) => `UGX ${amount.toLocaleString()}`;

  const getMethodIcon = (method: string) => {
    if (method === 'MTN_MoMo') return <Smartphone size={14} className="text-amber-600" />;
    if (method === 'Cash') return <Banknote size={14} className="text-emerald-600" />;
    return <Landmark size={14} className="text-blue-600" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search category, description..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'income' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'expense' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500'}`}
            >
              Expense
            </button>
          </div>

          <select
            value={dateRange}
            onChange={(e: any) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Type & Category</th>
              <th className="py-3 px-6">Payment Method</th>
              <th className="py-3 px-6">Description</th>
              <th className="py-3 px-6">Agent</th>
              <th className="py-3 px-6 text-right">Amount (UGX)</th>
              <th className="py-3 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-4 px-6 font-medium text-slate-600 whitespace-nowrap">{tx.date}</td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </span>
                    <div>
                      <strong className="block text-slate-800 text-sm">{tx.category}</strong>
                      <span className="text-[10px] text-slate-400 capitalize">{tx.type}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                    {getMethodIcon(tx.payment_method)}
                    <span>{tx.payment_method.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-600 max-w-xs truncate">{tx.description || '—'}</td>
                <td className="py-4 px-6 text-slate-500 text-xs whitespace-nowrap">{tx.created_by}</td>
                <td className={`py-4 px-6 text-right font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatUgx(tx.amount)}
                </td>
                <td className="py-4 px-6 text-center whitespace-nowrap">
                  <button
                    onClick={() => onDelete(tx.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete transaction"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                  No transactions found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
