import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Calendar, Award, Sparkles } from 'lucide-react';
import type { Transaction } from './types';

interface AnalyticsProps {
  transactions: Transaction[];
}

export function Analytics({ transactions }: AnalyticsProps) {
  const monthlyMap: Record<string, { income: number; expense: number }> = {};

  transactions.forEach((tx) => {
    const month = tx.date ? tx.date.slice(0, 7) : '2026-01';
    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') monthlyMap[month].income += tx.amount;
    else monthlyMap[month].expense += tx.amount;
  });

  const chartData = Object.keys(monthlyMap)
    .sort()
    .map((m) => {
      const inc = monthlyMap[m].income;
      const exp = monthlyMap[m].expense;
      const net = inc - exp;
      let label: 'High Sales' | 'Average' | 'Low Sales' = 'Average';
      if (inc > 5000000) label = 'High Sales';
      else if (inc < 1500000) label = 'Low Sales';

      return {
        month: m,
        Income: inc,
        Expense: exp,
        Net: net,
        performance: label
      };
    });

  const finalData = chartData.length ? chartData : [
    { month: '2026-01', Income: 3200000, Expense: 2100000, Net: 1100000, performance: 'Average' },
    { month: '2026-02', Income: 6800000, Expense: 3400000, Net: 3400000, performance: 'High Sales' },
    { month: '2026-03', Income: 2400000, Expense: 2200000, Net: 200000, performance: 'Low Sales' },
  ];

  const formatUgx = (val: number) => `UGX ${(val / 1000000).toFixed(1)}M`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-emerald-600" size={22} /> Seasonal Sales & Profit Trends
            </h3>
            <p className="text-xs text-slate-500">Monthly revenue vs expenses with automated performance labels</p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatUgx} />
              <Tooltip formatter={(value: any) => [`UGX ${Number(value).toLocaleString()}`, '']} />
              <Legend />
              <Bar dataKey="Income" fill="#059669" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expense" fill="#e11d48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Award className="text-amber-500" size={20} /> Seasonality Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {finalData.map((item) => (
            <div key={item.month} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block">{item.month}</span>
                <span className="text-base font-extrabold text-slate-800">UGX {item.Income.toLocaleString()}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                item.performance === 'High Sales' ? 'bg-emerald-100 text-emerald-800' :
                item.performance === 'Low Sales' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {item.performance}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
