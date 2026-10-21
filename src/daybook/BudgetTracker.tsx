import { useState } from 'react';
import { Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Transaction } from './types';

interface BudgetTrackerProps {
  transactions: Transaction[];
}

export function BudgetTracker({ transactions }: BudgetTrackerProps) {
  const [monthlyCap, setMonthlyCap] = useState(2500000);

  const now = new Date();
  const currentMonth = now.toISOString().split('T')[0].slice(0, 7);

  const monthExpenses = transactions
    .filter((tx) => tx.type === 'expense' && tx.date.startsWith(currentMonth))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const percentage = Math.min(100, Math.round((monthExpenses / monthlyCap) * 100));

  let barColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-100 text-emerald-800';
  let statusText = 'Within Budget';

  if (percentage >= 85) {
    barColor = 'bg-rose-600';
    badgeColor = 'bg-rose-100 text-rose-800';
    statusText = 'Budget Cap Exceeded / Near Limit!';
  } else if (percentage >= 70) {
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-100 text-amber-800';
    statusText = 'Approaching Limit';
  }

  const formatUgx = (n: number) => `UGX ${n.toLocaleString()}`;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Target size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Monthly Expense Cap & Budget</h3>
            <p className="text-xs text-slate-500">Tracking expenses for {currentMonth}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Cap:</span>
          <select
            value={monthlyCap}
            onChange={(e) => setMonthlyCap(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value={1500000}>UGX 1.5M</option>
            <option value={2500000}>UGX 2.5M</option>
            <option value={5000000}>UGX 5.0M</option>
            <option value={10000000}>UGX 10.0M</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-600">Spent: {formatUgx(monthExpenses)}</span>
          <span className="text-slate-400">Cap: {formatUgx(monthlyCap)}</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${badgeColor}`}>
          {percentage >= 85 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          {statusText} ({percentage}%)
        </span>
        <span className="text-xs text-slate-400 font-medium">
          Remaining: {formatUgx(Math.max(0, monthlyCap - monthExpenses))}
        </span>
      </div>
    </div>
  );
}
