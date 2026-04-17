import type { LucideIcon } from "lucide-react";

export type ExpenseCategory =
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "shopping"
  | "health"
  | "education"
  | "rent"
  | "other";

export interface Income {
  id?: number;
  amount: number;
  source: string;
  date: string;
  month: string;
  createdAt: string;
}

export interface Expense {
  id?: number;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string;
  month: string;
  createdAt: string;
}

export interface BudgetSplit {
  savings: number;
  expenses: number;
  investments: number;
}

export interface CommonTabProps {
  selectedMonth: string;
  showToast: (msg: string) => void;
  triggerRefresh: () => void;
  refreshKey: number;
}

export type TabId = "dashboard" | "income" | "expenses" | "reports" | "settings";

export interface CategoryDef {
  id: ExpenseCategory;
  label: string;
  icon: LucideIcon;
  color: string;
}

export interface NavItem {
  id: TabId;
  icon: LucideIcon;
  label: string;
}

export interface TrendItem {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  split: BudgetSplit;
  categoryBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  trend: TrendItem[];
  allocations: BudgetSplit;
}

export type StoreName = "incomes" | "expenses" | "allocations" | "settings";
