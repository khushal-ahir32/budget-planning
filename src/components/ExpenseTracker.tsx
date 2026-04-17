import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Inbox } from "lucide-react";
import { addRecord, getAllRecords, deleteRecord } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { CATEGORIES, getCategoryColor, getCategoryIcon } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { CommonTabProps, Expense, ExpenseCategory } from "@/types";

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(1, "Enter a description"),
  date: z.string().min(1, "Select a date"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpenseTracker({
  selectedMonth,
  showToast,
  triggerRefresh,
  refreshKey,
}: CommonTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      description: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth, refreshKey]);

  const loadExpenses = async () => {
    try {
      const all = await getAllRecords<Expense>("expenses");
      const filtered = all.filter((e) => e.month === selectedMonth);
      setExpenses(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error("Error loading expenses:", err);
    }
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!category) {
      showToast("Please select a category");
      return;
    }

    const month = values.date.substring(0, 7);
    try {
      await addRecord("expenses", {
        amount: values.amount,
        description: values.description,
        category,
        date: values.date,
        month,
        createdAt: new Date().toISOString(),
      });
      reset({ amount: undefined, description: "", date: new Date().toISOString().split("T")[0] });
      setCategory("");
      showToast("Expense added!");
      triggerRefresh();
      loadExpenses();
    } catch (err) {
      console.error("Error adding expense:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRecord("expenses", id);
      showToast("Expense deleted");
      triggerRefresh();
      loadExpenses();
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  const filteredExpenses =
    filterCategory === "all"
      ? expenses
      : expenses.filter((e) => e.category === filterCategory);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] xl:grid-cols-[480px_1fr] gap-4 lg:gap-6 items-start">
      {/* Left: Form */}
      <div className="bg-card rounded-lg p-5 border border-border lg:sticky lg:top-16">
        <h3 className="text-base font-semibold mb-4">Add Expense</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                {...register("amount")}
                placeholder="Amount"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground font-sans text-sm outline-none transition-colors focus:border-primary placeholder:text-text-muted"
                min="0"
                step="10"
              />
              {errors.amount && (
                <p className="text-primary text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">
                Date
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground font-sans text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">
              Description
            </label>
            <input
              type="text"
              {...register("description")}
              placeholder="What was this expense for?"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground font-sans text-sm outline-none transition-colors focus:border-primary placeholder:text-text-muted"
            />
            {errors.description && (
              <p className="text-primary text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "py-2.5 px-2 rounded-lg flex flex-col items-center gap-1 text-[11px] font-sans cursor-pointer transition-all",
                      isSelected
                        ? "border-2 text-foreground"
                        : "border border-border text-foreground bg-background hover:border-secondary"
                    )}
                    style={
                      isSelected
                        ? { borderColor: cat.color, background: cat.color + "33" }
                        : undefined
                    }
                  >
                    <Icon className="w-[18px] h-[18px]" style={{ color: cat.color }} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-lg border-none font-sans text-sm font-semibold cursor-pointer transition-all bg-gradient-to-br from-primary to-[#ff6b81] text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </form>
      </div>

      {/* Right: Expense List */}
      <div className="bg-card rounded-lg p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Expenses</h3>
          <div className="text-xl font-bold text-primary">
            {formatCurrency(totalExpenses)}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 lg:flex-wrap">
          <button
            className={cn(
              "px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap border font-sans",
              filterCategory === "all"
                ? "bg-secondary border-info text-foreground"
                : "bg-background border-border text-muted-foreground hover:bg-secondary"
            )}
            onClick={() => setFilterCategory("all")}
          >
            All
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap border font-sans flex items-center gap-1.5",
                  filterCategory === cat.id
                    ? "bg-secondary border-info text-foreground"
                    : "bg-background border-border text-muted-foreground hover:bg-secondary"
                )}
                onClick={() => setFilterCategory(cat.id)}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Expense List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No expenses found</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const Icon = getCategoryIcon(expense.category);
            return (
              <div
                key={expense.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: getCategoryColor(expense.category) + "22" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: getCategoryColor(expense.category) }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{expense.description}</div>
                    <div className="text-[11px] text-text-muted">
                      {formatDate(expense.date)} · <span className="capitalize">{expense.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-sm font-semibold text-primary">
                    -{formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(expense.id!)}
                    className="w-7 h-7 rounded-md border border-primary/50 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
