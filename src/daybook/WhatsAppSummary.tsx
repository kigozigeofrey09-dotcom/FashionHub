import { useState } from 'react';
import { MessageSquare, Copy, Check } from 'lucide-react';
import type { Transaction } from './types';

interface WhatsAppSummaryProps {
  transactions: Transaction[];
}

export function WhatsAppSummary({ transactions }: WhatsAppSummaryProps) {
  const [copied, setCopied] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTxs = transactions.filter((tx) => tx.date === todayStr);

  const revenue = todayTxs.filter((tx) => tx.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = todayTxs.filter((tx) => tx.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = revenue - expense;

  const momo = todayTxs.filter((tx) => tx.payment_method === 'MTN_MoMo').reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  const cash = todayTxs.filter((tx) => tx.payment_method === 'Cash').reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

  const summaryText = `📊 *DayBook UG - Daily Business Report* (${todayStr})
🟢 Total Revenue: *UGX ${revenue.toLocaleString()}*
🔴 Total Expenses: *UGX ${expense.toLocaleString()}*
💰 Net Cash Flow: *UGX ${net.toLocaleString()}*

📱 MTN MoMo Net: UGX ${momo.toLocaleString()}
💵 Cash on Hand: UGX ${cash.toLocaleString()}
📝 Total Transactions Logged: ${todayTxs.length}

_Generated via DayBook Uganda_`;

  function handleCopy() {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Daily WhatsApp Summary</h3>
            <p className="text-xs text-slate-600">Instantly share today's P&L update with business partners</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied to Clipboard!' : 'Copy for WhatsApp'}
        </button>
      </div>

      <div className="bg-white/80 rounded-xl p-4 font-mono text-xs text-slate-700 whitespace-pre-wrap border border-emerald-100">
        {summaryText}
      </div>
    </div>
  );
}
