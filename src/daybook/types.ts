export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'MTN_MoMo' | 'Cash' | 'Bank';

export interface Transaction {
  id: string;
  created_at?: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  payment_method: PaymentMethod;
  created_by: string;
}

export interface MonthlyAnalytics {
  id: string;
  year_month: string; // YYYY-MM
  total_income: number;
  total_expense: number;
  net_profit: number;
  performance_label: 'High Sales' | 'Average' | 'Low Sales';
  ai_advice_summary: string;
}
