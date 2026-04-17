import { useState, useEffect } from "react";
import { Trash2, Receipt, PiggyBank, TrendingUp } from "lucide-react";
import { getSetting, setSetting, clearStore } from "@/lib/db";
import { DEFAULT_SPLIT, PRESETS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CommonTabProps, BudgetSplit } from "@/types";

export default function SettingsPage({ showToast, triggerRefresh }: CommonTabProps) {
  const [split, setSplitState] = useState<BudgetSplit>(DEFAULT_SPLIT);
  const [showResetModal, setShowResetModal] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSplit = await getSetting<BudgetSplit>("splitRatio");
      if (savedSplit) setSplitState(savedSplit);
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const handleSliderChange = (field: keyof BudgetSplit, value: string) => {
    const numVal = parseInt(value);
    const newSplit = { ...split, [field]: numVal };

    const others = (Object.keys(newSplit) as (keyof BudgetSplit)[]).filter((k) => k !== field);
    const remaining = 100 - numVal;
    const currentOthersTotal = others.reduce((s, k) => s + newSplit[k], 0);

    if (currentOthersTotal === 0) {
      others.forEach((k) => {
        newSplit[k] = Math.round(remaining / others.length);
      });
    } else {
      others.forEach((k) => {
        newSplit[k] = Math.round((newSplit[k] / currentOthersTotal) * remaining);
      });
    }

    const total = Object.values(newSplit).reduce((s, v) => s + v, 0);
    if (total !== 100 && others[0]) {
      newSplit[others[0]] += 100 - total;
    }

    (Object.keys(newSplit) as (keyof BudgetSplit)[]).forEach((k) => {
      newSplit[k] = Math.max(0, Math.min(100, newSplit[k]));
    });

    setSplitState(newSplit);
    setActivePreset(null);
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setSplitState({ ...preset.split });
    setActivePreset(preset.name);
  };

  const handleSave = async () => {
    try {
      await setSetting("splitRatio", split);
      showToast("Settings saved!");
      triggerRefresh();
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const handleReset = async () => {
    try {
      await clearStore("incomes");
      await clearStore("expenses");
      await clearStore("allocations");
      setSplitState(DEFAULT_SPLIT);
      setShowResetModal(false);
      showToast("All data cleared");
      triggerRefresh();
    } catch (err) {
      console.error("Error resetting data:", err);
    }
  };

  const total = split.savings + split.expenses + split.investments;

  const sliders = [
    { key: "expenses" as const, label: "Expenses", icon: Receipt, color: "#e94560", textColor: "text-primary" },
    { key: "savings" as const, label: "Savings", icon: PiggyBank, color: "#4da6ff", textColor: "text-info" },
    { key: "investments" as const, label: "Investments", icon: TrendingUp, color: "#a855f7", textColor: "text-purple" },
  ];

  const splitBarSegments = [
    { key: "expenses" as const, color: "var(--color-primary)" },
    { key: "savings" as const, color: "var(--color-info)" },
    { key: "investments" as const, color: "var(--color-purple)" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      {/* Split Configuration — main column */}
      <div className="bg-card rounded-lg p-5 border border-border">
        <h3 className="text-base font-semibold mb-1">Budget Split</h3>
        <p className="text-text-muted text-xs mb-4">Customize how your income is allocated</p>

        {/* Presets */}
        <div className="mb-5">
          <div className="text-[13px] font-medium text-muted-foreground mb-1.5">Quick Presets</div>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all border font-sans",
                  activePreset === preset.name
                    ? "bg-secondary border-info text-foreground"
                    : "bg-background border-border text-muted-foreground hover:bg-secondary hover:border-info hover:text-foreground"
                )}
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        {sliders.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  {s.label}
                </span>
                <span className={cn("text-base font-bold", s.textColor)}>{split[s.key]}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0"
                max="100"
                value={split[s.key]}
                onChange={(e) => handleSliderChange(s.key, e.target.value)}
                style={{ accentColor: s.color }}
              />
            </div>
          );
        })}

        {/* Visual Split Bar */}
        <div className="flex rounded-lg overflow-hidden h-8 mb-3">
          {splitBarSegments.map((seg) => (
            <div
              key={seg.key}
              className="flex items-center justify-center text-[10px] font-semibold text-white transition-all duration-300"
              style={{
                width: `${split[seg.key]}%`,
                background: seg.color,
                minWidth: split[seg.key] > 5 ? "auto" : 0,
              }}
            >
              {split[seg.key] > 10 ? `${split[seg.key]}%` : ""}
            </div>
          ))}
        </div>

        {total !== 100 && (
          <div className="text-primary text-xs mb-3 text-center">
            Total: {total}% (must equal 100%)
          </div>
        )}

        <button
          className={cn(
            "w-full py-3 px-6 rounded-lg border-none font-sans text-sm font-semibold cursor-pointer transition-all bg-gradient-to-br from-primary to-[#ff6b81] text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40",
            total !== 100 && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleSave}
          disabled={total !== 100}
        >
          Save Settings
        </button>
      </div>

      {/* Sidebar — Data Management */}
      <div className="space-y-4">
        <div className="bg-card rounded-lg p-5 border border-border lg:sticky lg:top-4">
          <h3 className="text-base font-semibold mb-3">Data Management</h3>
          <p className="text-text-muted text-xs mb-4">
            Clear all saved income, expenses, and allocation data from this device.
          </p>
          <button
            className="w-full py-3 px-6 rounded-lg border border-primary text-primary font-sans text-sm font-semibold cursor-pointer transition-all hover:bg-primary hover:text-white flex items-center justify-center gap-2"
            onClick={() => setShowResetModal(true)}
          >
            <Trash2 className="w-4 h-4" />
            Reset All Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-5"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="bg-card rounded-lg p-6 w-full max-w-[400px] border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Reset All Data?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This will permanently delete all your income, expense, and allocation data. This action
              cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                className="flex-1 py-3 px-6 rounded-lg border-none font-sans text-sm font-semibold cursor-pointer transition-all bg-secondary text-white"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 px-6 rounded-lg border-none font-sans text-sm font-semibold cursor-pointer transition-all bg-primary text-white"
                onClick={handleReset}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
