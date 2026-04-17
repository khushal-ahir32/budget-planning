import type { BudgetSplit } from "@/types";

export const DEFAULT_SPLIT: BudgetSplit = {
  savings: 20,
  expenses: 50,
  investments: 30,
};

export const PRESETS = [
  { name: "50/30/20", split: { expenses: 50, savings: 30, investments: 20 }, desc: "Needs / Wants / Savings" },
  { name: "60/20/20", split: { expenses: 60, savings: 20, investments: 20 }, desc: "Conservative" },
  { name: "40/30/30", split: { expenses: 40, savings: 30, investments: 30 }, desc: "Aggressive Saver" },
  { name: "70/20/10", split: { expenses: 70, savings: 20, investments: 10 }, desc: "High Expenses" },
] as const;

export const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Part-time",
  "Investment Returns",
  "Gift",
  "Other",
] as const;

export const COLORS: Record<string, string> = {
  savings: "#4da6ff",
  expenses: "#e94560",
  investments: "#a855f7",
  food: "#ff6b6b",
  transport: "#4da6ff",
  utilities: "#f5a623",
  entertainment: "#a855f7",
  shopping: "#e94560",
  health: "#00c897",
  education: "#6dc0ff",
  rent: "#f5a623",
  other: "#6b6b80",
};
