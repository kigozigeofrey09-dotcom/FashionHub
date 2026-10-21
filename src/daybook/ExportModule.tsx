import { FileSpreadsheet, Printer } from 'lucide-react';
import type { Transaction } from './types';

interface ExportModuleProps {
  transactions: Transaction[];
}

export function ExportModule({ transactions }: ExportModuleProps) {
  function exportCsv() {
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount (UGX)', 'Payment Method', 'Description', 'Recorded By'];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.date,
      tx.type,
      `"${tx.category}"`,
      tx.amount,
      tx.payment_method,
      `"${tx.description || ''}"`,
      `"${tx.created_by}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DayBook_UG_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function printPdf() {
    window.print();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCsv}
        className="flex items-center gap-1.5 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 shadow-sm transition-all"
      >
        <FileSpreadsheet size={16} className="text-emerald-600" /> Export CSV
      </button>
      <button
        onClick={printPdf}
        className="flex items-center gap-1.5 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 shadow-sm transition-all"
      >
        <Printer size={16} className="text-blue-600" /> Print Statement
      </button>
    </div>
  );
}
