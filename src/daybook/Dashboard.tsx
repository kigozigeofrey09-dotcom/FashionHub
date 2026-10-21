import { TrendingUp, TrendingDown, DollarSign, Smartphone, Banknote, Landmark, PieChart as PieIcon } from 'lucide-react';
import type { Transaction } from './types';

interface DashboardProps {
  transactions: Transaction[];
}

export function Dashboard({ transactions }: DashboardProps) {
  const totalRevenue = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netProfit = totalRevenue - totalExpense;

  const momoTotal = transactions
    .filter((tx) => tx.payment_method === 'MTN_MoMo')
    .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

  const cashTotal = transactions
    .filter((tx) => tx.payment_method === 'Cash')
    .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

  const bankTotal = transactions
    .filter((tx) => tx.payment_method === 'Bank')
    .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

  const formatUgx = (amount: number) => `UGX ${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800">{formatUgx(totalRevenue)}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">Inflow from sales & services</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Expenses</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800">{formatUgx(totalExpense)}</h3>
          <p className="text-xs text-rose-600 font-medium mt-1">Stock purchase, rent, transport</p>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg shadow-slate-900/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Profit / Loss</span>
            <div className={`p-2.5 rounded-xl ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <DollarSign size={20} />
            </div>
          </div>
          <h3 className={`text-3xl font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatUgx(netProfit)}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Revenue minus total expenses</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <PieIcon size={18} className="text-emerald-600" /> Payment Methods Breakdown (Cash vs Digital)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl">
              <Smartphone size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase">MTN MoMo Net</span>
              <h4 className="text-xl font-extrabold text-slate-800">{formatUgx(momoTotal)}</h4>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-xl">
              <Banknote size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase">Cash on Hand</span>
              <h4 className="text-xl font-extrabold text-slate-800">{formatUgx(cashTotal)}</h4>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-xl">
              <Landmark size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-800 uppercase">Bank Balance</span>
              <h4 className="text-xl font-extrabold text-slate-800">{formatUgx(bankTotal)}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
