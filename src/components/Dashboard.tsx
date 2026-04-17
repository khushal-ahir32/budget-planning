import { useState, useEffect } from "react";
import { Inbox, PiggyBank, Receipt, TrendingUp } from "lucide-react";
import { getAllRecords, getSetting } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCategoryColor, getCategoryIcon, ALLOCATION_COLORS } from "@/lib/categories";
import { DEFAULT_SPLIT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CommonTabProps, Income, Expense, BudgetSplit } from "@/types";

interface DashboardData {
  totalIncome: number;
  allocations: BudgetSplit;
  totalExpenses: number;
  split: BudgetSplit;
  recentExpenses: Expense[];
}

export default function Dashboard({ selectedMonth, refreshKey }: CommonTabProps) {
  const [data, setData] = useState<DashboardData>({
    totalIncome: 0,
    allocations: { savings: 0, expenses: 0, investments: 0 },
    totalExpenses: 0,
    split: DEFAULT_SPLIT,
    recentExpenses: [],
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth, refreshKey]);

  const loadData = async () => {
    try {
      const savedSplit = await getSetting<BudgetSplit>("splitRatio");
      const split = savedSplit ?? DEFAULT_SPLIT;

      const allIncomes = await getAllRecords<Income>("incomes");
      const monthIncomes = allIncomes.filter((i) => i.month === selectedMonth);
      const totalIncome = monthIncomes.reduce((sum, i) => sum + Number(i.amount), 0);

      const allocations: BudgetSplit = {
        savings: (totalIncome * split.savings) / 100,
        expenses: (totalIncome * split.expenses) / 100,
        investments: (totalIncome * split.investments) / 100,
      };

      const allExpenses = await getAllRecords<Expense>("expenses");
      const monthExpenses = allExpenses.filter((e) => e.month === selectedMonth);
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      const recentExpenses = monthExpenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setData({ totalIncome, allocations, totalExpenses, split, recentExpenses });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  const remaining = data.allocations.expenses - data.totalExpenses;
  const budgetPercent = data.allocations.expenses > 0
    ? Math.round((data.totalExpenses / data.allocations.expenses) * 100)
    : 0;

  const stats = [
    { label: "Total Income", value: formatCurrency(data.totalIncome), color: "text-success" },
    { label: "Spent", value: formatCurrency(data.totalExpenses), color: "text-primary" },
    { label: "Savings Goal", value: formatCurrency(data.allocations.savings), color: "text-info" },
    { label: "Investments", value: formatCurrency(data.allocations.investments), color: "text-purple" },
  ];

  const allocationItems = [
    { key: "savings", label: "Savings", icon: PiggyBank, color: ALLOCATION_COLORS.savings!, valueColor: "text-info" },
    { key: "expenses", label: "Expenses", icon: Receipt, color: ALLOCATION_COLORS.expenses!, valueColor: "text-primary" },
    { key: "investments", label: "Investments", icon: TrendingUp, color: ALLOCATION_COLORS.investments!, valueColor: "text-purple" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-lg p-4 lg:p-5 border border-border hover:border-secondary transition-colors"
          >
            <div className="text-[11px] text-text-muted uppercase tracking-wide mb-1.5">
              {stat.label}
            </div>
            <div className={cn("text-xl lg:text-2xl font-bold", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget Remaining */}
        <div className="bg-card rounded-lg p-5 border border-border transition-colors hover:border-secondary">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold">Expense Budget</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {remaining >= 0
                  ? `${formatCurrency(remaining)} remaining`
                  : `${formatCurrency(Math.abs(remaining))} over budget!`}
              </p>
            </div>
            <div className={cn("text-[28px] font-bold", remaining >= 0 ? "text-success" : "text-primary")}>
              {budgetPercent}%
            </div>
          </div>
          <div>
            <div className="w-full h-2.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#ff6b81] transition-all duration-500"
                style={{ width: `${Math.min(100, budgetPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Allocation Breakdown */}
        <div className="bg-card rounded-lg p-5 border border-border transition-colors hover:border-secondary">
          <h3 className="text-base font-semibold mb-4">Budget Allocation</h3>
          {allocationItems.map((item) => {
            const Icon = item.icon;
            const percent = data.split[item.key];
            const amount = data.allocations[item.key];
            return (
              <div key={item.key} className="mb-3.5 last:mb-0">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[13px] font-medium flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    {item.label} ({percent}%)
                  </span>
                  <span className={cn("text-[13px] font-semibold", item.valueColor)}>
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-card rounded-lg p-5 border border-border transition-colors hover:border-secondary">
        <h3 className="text-base font-semibold mb-3">Recent Expenses</h3>
        {data.recentExpenses.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No expenses recorded this month</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-0 lg:gap-x-6">
            {data.recentExpenses.map((expense) => {
              const Icon = getCategoryIcon(expense.category);
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ background: getCategoryColor(expense.category) + "22" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: getCategoryColor(expense.category) }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{expense.description}</div>
                      <div className="text-[11px] text-text-muted">{formatDate(expense.date)}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-primary shrink-0 ml-3">
                    -{formatCurrency(expense.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
