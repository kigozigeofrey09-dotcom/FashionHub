import { Bot, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import type { Transaction } from './types';

interface AiAdvisorProps {
  transactions: Transaction[];
}

export function AiAdvisor({ transactions }: AiAdvisorProps) {
  const totalRevenue = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netProfit = totalRevenue - totalExpense;
  const expenseRatio = totalRevenue > 0 ? (totalExpense / totalRevenue) * 100 : 0;

  const tips = [];
  let statusBadge = { text: 'Stable Financial Health', color: 'bg-emerald-100 text-emerald-800' };

  if (expenseRatio > 80) {
    statusBadge = { text: 'High Expense Risk', color: 'bg-rose-100 text-rose-800' };
    tips.push({
      title: 'Cost Control Warning',
      desc: `Your expenses consume ${expenseRatio.toFixed(1)}% of your revenue. Consider reviewing supplier prices at Kikuubo or cutting non-essential utility expenses.`
    });
  } else if (expenseRatio < 40 && totalRevenue > 1000000) {
    statusBadge = { text: 'Strong Profit Margin', color: 'bg-emerald-100 text-emerald-800' };
    tips.push({
      title: 'Reinvestment Opportunity',
      desc: 'Your profit margins are excellent! Consider reinvesting 30% of your net profits into expanding your stock ahead of upcoming festive seasons.'
    });
  }

  tips.push({
    title: 'Stock Up Recommendation',
    desc: 'Historical sales in Uganda peak towards month-end and holiday periods. Prepare inventory 2 weeks prior to avoid stockouts in high-demand categories.'
  });

  tips.push({
    title: 'Cash Flow & MTN MoMo Hygiene',
    desc: 'Keep your digital MTN MoMo float separate from petty cash to ensure seamless restocking and vendor payments.'
  });

  if (netProfit < 0) {
    tips.push({
      title: 'Urgent: Operating at a Loss',
      desc: 'Current expenses exceed income. Review daily ledger entries and pause discretionary spending immediately.'
    });
  }

  const formatUgx = (val: number) => `UGX ${val.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-10 text-emerald-400">
          <Bot size={120} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Bot size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold">DayBook AI Business Advisor</h3>
            <p className="text-xs text-slate-400">Real-time P&L analysis tailored for Ugandan small businesses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Overall Status</span>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>
              {statusBadge.text}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Expense-to-Revenue Ratio</span>
            <span className="text-lg font-extrabold text-white mt-1 block">{expenseRatio.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Net Earnings</span>
            <span className={`text-lg font-extrabold mt-1 block ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatUgx(netProfit)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Lightbulb className="text-amber-500" size={20} /> Actionable Recommendations
        </h3>
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div key={index} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mt-0.5">
                <CheckCircle size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{tip.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
