import { Package } from 'lucide-react';

interface StockTaggingProps {
  category: string;
  onChange: (details: string) => void;
}

export function StockTagging({ category, onChange }: StockTaggingProps) {
  if (category !== 'Stock Purchase') return null;

  return (
    <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
      <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
        <Package size={16} /> Inventory / Stock Tagging
      </div>
      <p className="text-xs text-slate-600">Specify item names and quantities purchased for stock tracking:</p>
      <input
        type="text"
        placeholder="e.g. 5 Rolls of Ankara Fabric, 10 Pairs of Leather Shoes"
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
      />
    </div>
  );
}
