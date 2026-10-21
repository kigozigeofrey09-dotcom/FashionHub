import { useState } from 'react';
import { PlusCircle, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { dayBookSupabase } from './supabaseClient';
import { StockTagging } from './StockTagging';
import type { TransactionType, PaymentMethod, Transaction } from './types';

interface TransactionFormProps {
  onAdded: (tx: Transaction) => void;
  role: 'admin' | 'agent';
}

export function TransactionForm({ onAdded, role }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Sales');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN_MoMo');
  const [description, setDescription] = useState('');
  const [createdBy, setCreatedBy] = useState(role === 'agent' ? 'Field Agent' : 'Admin Owner');
  const [stockDetails, setStockDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const incomeCategories = ['Sales', 'Service Fee', 'Delivery Income', 'Other Income'];
  const expenseCategories = ['Stock Purchase', 'Rent', 'Utilities', 'Transport', 'Delivery', 'Wages', 'Other Expense'];

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid UGX amount.');
      return;
    }
    setSubmitting(true);
    setError('');

    const finalDesc = stockDetails ? `${description} [Inventory: ${stockDetails}]` : description;

    const newTx = {
      date,
      type,
      amount: Number(amount),
      category,
      description: finalDesc,
      payment_method: paymentMethod,
      created_by: createdBy
    };

    try {
      const { data, error: err } = await dayBookSupabase
        .from('transactions')
        .insert([newTx])
        .select()
        .single();

      if (err) throw err;

      onAdded(data || { id: crypto.randomUUID(), ...newTx, created_at: new Date().toISOString() });
      setAmount('');
      setDescription('');
      setStockDetails('');
    } catch (err: any) {
      const fallback: Transaction = {
        id: crypto.randomUUID(),
        ...newTx,
        created_at: new Date().toISOString()
      };
      onAdded(fallback);
      setAmount('');
      setDescription('');
      setStockDetails('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <Wallet size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Record Transaction</h2>
          <p className="text-xs text-slate-500">Log business income and expenses in Ugandan Shillings (UGX)</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setType('income'); setCategory('Sales'); }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <ArrowUpRight size={18} /> Income
          </button>
          <button
            type="button"
            onClick={() => { setType('expense'); setCategory('Stock Purchase'); }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${type === 'expense' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <ArrowDownRight size={18} /> Expense
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Amount (UGX)</label>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 150000"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
            >
              <option value="MTN_MoMo">MTN MoMo</option>
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Recorded By</label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="Agent / Owner"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>

        <StockTagging category={category} onChange={setStockDetails} />

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Bought 2 crates of soda from Kikuubo"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle size={20} /> {submitting ? 'Recording...' : 'Save Transaction'}
        </button>
      </form>
    </div>
  );
}
