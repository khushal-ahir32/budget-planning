import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { getAllRecords, getSetting } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { DEFAULT_SPLIT, COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CommonTabProps, Income, Expense, BudgetSplit, ReportData } from "@/types";

type ReportTab = "overview" | "categories" | "trend";

export default function Reports({ selectedMonth, refreshKey }: CommonTabProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");

  useEffect(() => {
    loadData();
  }, [selectedMonth, refreshKey]);

  const loadData = async () => {
    try {
      const split = (await getSetting<BudgetSplit>("splitRatio")) ?? DEFAULT_SPLIT;
      const allIncomes = await getAllRecords<Income>("incomes");
      const allExpenses = await getAllRecords<Expense>("expenses");

      const monthIncomes = allIncomes.filter((i) => i.month === selectedMonth);
      const monthExpenses = allExpenses.filter((e) => e.month === selectedMonth);

      const totalIncome = monthIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      const categoryBreakdown: Record<string, number> = {};
      monthExpenses.forEach((e) => {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] ?? 0) + Number(e.amount);
      });

      const trend = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(selectedMonth + "-01");
        d.setMonth(d.getMonth() - i);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const mIncome = allIncomes.filter((inc) => inc.month === m).reduce((s, inc) => s + Number(inc.amount), 0);
        const mExpense = allExpenses.filter((exp) => exp.month === m).reduce((s, exp) => s + Number(exp.amount), 0);
        trend.push({
          month: d.toLocaleDateString("en-IN", { month: "short" }),
          income: mIncome,
          expenses: mExpense,
          savings: mIncome - mExpense,
        });
      }

      const sourceBreakdown: Record<string, number> = {};
      monthIncomes.forEach((i) => {
        sourceBreakdown[i.source] = (sourceBreakdown[i.source] ?? 0) + Number(i.amount);
      });

      setData({
        totalIncome,
        totalExpenses,
        split,
        categoryBreakdown,
        sourceBreakdown,
        trend,
        allocations: {
          savings: (totalIncome * split.savings) / 100,
          expenses: (totalIncome * split.expenses) / 100,
          investments: (totalIncome * split.investments) / 100,
        },
      });
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };

  if (!data) {
    return (
      <div className="bg-card rounded-lg p-5 border border-border">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const tabs: { id: ReportTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "categories", label: "Categories" },
    { id: "trend", label: "Trend" },
  ];

  const donutData = [
    { name: "Expenses", value: data.split.expenses, color: COLORS.expenses! },
    { name: "Savings", value: data.split.savings, color: COLORS.savings! },
    { name: "Investments", value: data.split.investments, color: COLORS.investments! },
  ];

  const categoryData = Object.entries(data.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      amount,
      color: COLORS[cat] ?? "#6b6b80",
      percentage: data.totalExpenses > 0 ? ((amount / data.totalExpenses) * 100).toFixed(1) : "0",
    }));

  const maxCategoryAmount = Math.max(...Object.values(data.categoryBreakdown), 1);

  return (
    <div className="space-y-4">
      {/* Tab Toggle */}
      <div className="flex bg-background rounded-lg p-1 max-w-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "flex-1 py-2 px-3 border-none font-sans text-xs font-medium cursor-pointer rounded-md transition-all",
              activeTab === tab.id
                ? "bg-secondary text-foreground"
                : "bg-transparent text-text-muted hover:text-muted-foreground"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Desktop: side-by-side donut + summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Budget Allocation Donut */}
            <div className="bg-card rounded-lg p-5 border border-border">
              <h3 className="text-base font-semibold mb-4">Budget Allocation</h3>
              <div className="flex justify-center mb-4">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mb-4">
                <div className="text-[11px] text-text-muted">Total Income</div>
                <div className="text-lg font-bold">{formatCurrency(data.totalIncome)}</div>
              </div>
              <div className="flex justify-center gap-5 flex-wrap">
                {donutData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    {item.name} ({item.value}%)
                  </div>
                ))}
              </div>
            </div>

            {/* Summary + Income Sources stacked */}
            <div className="space-y-4">
              <div className="bg-card rounded-lg p-5 border border-border">
                <h3 className="text-base font-semibold mb-3">Monthly Summary</h3>

                {/* Actuals */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-[13px] text-muted-foreground">Total Income</span>
                  <span className="text-sm font-semibold text-success">{formatCurrency(data.totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[13px] text-muted-foreground">Total Spent</span>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(data.totalExpenses)}</span>
                </div>

                {/* Budget Allocations */}
                <div className="border-t border-border mt-2 pt-2">
                  <div className="text-[11px] text-text-muted uppercase tracking-wide mb-1">Budget Allocations</div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[13px] text-muted-foreground">Expense Budget</span>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(data.allocations.expenses)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[13px] text-muted-foreground">Savings Budget</span>
                    <span className="text-sm font-semibold text-info">{formatCurrency(data.allocations.savings)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[13px] text-muted-foreground">Investment Budget</span>
                    <span className="text-sm font-semibold text-purple">{formatCurrency(data.allocations.investments)}</span>
                  </div>
                </div>

                {/* Remaining from expense budget */}
                <div className="border-t border-border mt-2 pt-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[13px] text-muted-foreground font-semibold">Expense Remaining</span>
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        data.allocations.expenses - data.totalExpenses >= 0 ? "text-success" : "text-primary"
                      )}
                    >
                      {formatCurrency(data.allocations.expenses - data.totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Income Sources */}
              {Object.keys(data.sourceBreakdown).length > 0 && (
                <div className="bg-card rounded-lg p-5 border border-border">
                  <h3 className="text-base font-semibold mb-3">Income Sources</h3>
                  {Object.entries(data.sourceBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, amount]) => (
                      <div key={source} className="flex justify-between items-center py-2">
                        <span className="text-[13px] text-muted-foreground capitalize">{source}</span>
                        <span className="text-sm font-semibold text-success">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "categories" && (
        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="text-base font-semibold mb-4">Expense by Category</h3>
          {categoryData.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No expense data for this month</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3.5">
              {categoryData.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[13px] font-medium capitalize">
                      {cat.name} ({cat.percentage}%)
                    </span>
                    <span className="text-[13px] font-semibold" style={{ color: cat.color }}>
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(cat.amount / maxCategoryAmount) * 100}%`,
                        background: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "trend" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="bg-card rounded-lg p-5 border border-border">
            <h3 className="text-base font-semibold mb-4">6-Month Trend</h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.trend} barGap={2}>
                <XAxis dataKey="month" tick={{ fill: "#6b6b80", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    background: "#16213e",
                    border: "1px solid #2a2a42",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="income" fill="#00c897" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#e94560" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-5 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-success" />
                Income
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                Expenses
              </div>
            </div>
          </div>

          {/* Trend Table - sidebar on desktop */}
          <div className="bg-card rounded-lg p-5 border border-border">
            <h3 className="text-base font-semibold mb-3">Monthly Breakdown</h3>
            {data.trend.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                <span className="text-[13px] text-muted-foreground font-medium">{item.month}</span>
                <div className="flex gap-4">
                  <span className="text-success text-xs font-semibold">+{formatCurrency(item.income)}</span>
                  <span className="text-primary text-xs font-semibold">-{formatCurrency(item.expenses)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
