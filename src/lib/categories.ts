import {
  UtensilsCrossed,
  Car,
  Lightbulb,
  Clapperboard,
  ShoppingBag,
  Heart,
  GraduationCap,
  Home,
  MoreHorizontal,
  PiggyBank,
  Receipt,
  TrendingUp,
} from "lucide-react";
import type { CategoryDef, ExpenseCategory } from "@/types";
import type { LucideIcon } from "lucide-react";

export const CATEGORIES: CategoryDef[] = [
  { id: "food", label: "Food & Dining", icon: UtensilsCrossed, color: "#ff6b6b" },
  { id: "transport", label: "Transport", icon: Car, color: "#4da6ff" },
  { id: "utilities", label: "Utilities", icon: Lightbulb, color: "#f5a623" },
  { id: "entertainment", label: "Entertainment", icon: Clapperboard, color: "#a855f7" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "#e94560" },
  { id: "health", label: "Health", icon: Heart, color: "#00c897" },
  { id: "education", label: "Education", icon: GraduationCap, color: "#4da6ff" },
  { id: "rent", label: "Rent / Housing", icon: Home, color: "#f5a623" },
  { id: "other", label: "Other", icon: MoreHorizontal, color: "#6b6b80" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<ExpenseCategory, CategoryDef>;

export function getCategoryColor(category: string): string {
  return CATEGORY_MAP[category as ExpenseCategory]?.color ?? "#6b6b80";
}

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_MAP[category as ExpenseCategory]?.icon ?? MoreHorizontal;
}

export const ALLOCATION_ICONS: Record<string, LucideIcon> = {
  savings: PiggyBank,
  expenses: Receipt,
  investments: TrendingUp,
};

export const ALLOCATION_COLORS: Record<string, string> = {
  savings: "#4da6ff",
  expenses: "#e94560",
  investments: "#a855f7",
};
