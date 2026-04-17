import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Banknote, Plus, X, Inbox } from "lucide-react";
import { addRecord, getAllRecords, deleteRecord } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { INCOME_SOURCES } from "@/lib/constants";
import type { CommonTabProps, Income } from "@/types";

const incomeSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  source: z.string().min(1, "Select a source"),
  date: z.string().min(1, "Select a date"),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export default function IncomeForm({
  selectedMonth,
  showToast,
  triggerRefresh,
  refreshKey,
}: CommonTabProps) {
  const [incomes, setIncomes] = useState<Income[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: undefined,
      source: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    loadIncomes();
  }, [selectedMonth, refreshKey]);

  const loadIncomes = async () => {
    try {
      const all = await getAllRecords<Income>("incomes");
      const filtered = all.filter((i) => i.month === selectedMonth);
      setIncomes(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error("Error loading incomes:", err);
    }
  };

  const onSubmit = async (values: IncomeFormValues) => {
    const month = values.date.substring(0, 7);
    try {
      await addRecord("incomes", {
        amount: values.amount,
        source: values.source,
        date: values.date,
        month,
        createdAt: new Date().toISOString(),
      });
      reset({ amount: undefined, source: "", date: new Date().toISOString().split("T")[0] });
      showToast("Income added successfully!");
      triggerRefresh();
      loadIncomes();
    } catch (err) {
      console.error("Error adding income:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRecord("incomes", id);
      showToast("Income deleted");
      triggerRefresh();
      loadIncomes();
    } catch (err) {
      console.error("Error deleting income:", err);
    }
  };

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr] gap-4 lg:gap-6 items-start">
      {/* Left: Form */}
      <div className="space-y-4 lg:sticky lg:top-16">
        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="text-base font-semibold mb-4">Add Income</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                {...register("amount")}
                placeholder="Enter income amount"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground font-sans text-sm outline-none transition-colors focus:border-primary placeholder:text-text-muted"
                min="0"
                step="100"
              />
              {errors.amount && (
                <p className="text-primary text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">
                  Source
                </label>
                <select
                  {...register("source")}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground font-sans text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="">Select source</option>
                  {INCOME_SOURCES.map((s) => (
                    <option key={s} value={s.toLowerCase()}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.source && (
                  <p className="text-primary text-xs mt-1">{errors.source.message}</p>
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

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg border-none font-sans text-sm font-semibold cursor-pointer transition-all bg-gradient-to-br from-primary to-[#ff6b81] text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Income
            </button>
          </form>
        </div>

        {/* Monthly Total */}
        <div className="bg-card rounded-lg p-5 border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Monthly Total</h3>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalIncome)}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Income List */}
      <div className="bg-card rounded-lg p-5 border border-border">
        <h3 className="text-base font-semibold mb-3">Income History</h3>
        {incomes.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No income recorded this month</p>
          </div>
        ) : (
          incomes.map((income) => (
            <div
              key={income.id}
              className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-success/15 shrink-0">
                  <Banknote className="w-4 h-4 text-success" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium capitalize truncate">{income.source}</div>
                  <div className="text-[11px] text-text-muted">{formatDate(income.date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-success font-semibold text-sm">
                  +{formatCurrency(income.amount)}
                </span>
                <button
                  onClick={() => handleDelete(income.id!)}
                  className="w-7 h-7 rounded-md border border-primary/50 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
