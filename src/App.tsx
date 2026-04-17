import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentMonth } from "@/lib/db";
import { formatMonth } from "@/lib/format";
import type { TabId, NavItem } from "@/types";
import Dashboard from "@/components/Dashboard";
import IncomeForm from "@/components/IncomeForm";
import ExpenseTracker from "@/components/ExpenseTracker";
import Reports from "@/components/Reports";
import SettingsPage from "@/components/Settings";

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "income", icon: Wallet, label: "Income" },
  { id: "expenses", icon: CreditCard, label: "Expenses" },
  { id: "reports", icon: BarChart3, label: "Reports" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const navigateMonth = (direction: number) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year!, month! - 1 + direction, 1);
    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const commonProps = { selectedMonth, showToast, triggerRefresh, refreshKey };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard {...commonProps} />;
      case "income":
        return <IncomeForm {...commonProps} />;
      case "expenses":
        return <ExpenseTracker {...commonProps} />;
      case "reports":
        return <Reports {...commonProps} />;
      case "settings":
        return <SettingsPage {...commonProps} />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-muted border-r border-border z-50">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-[#ff6b81] rounded-[10px] flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
            BudgetPro
          </h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-none font-sans text-sm font-medium cursor-pointer transition-all duration-200",
                activeTab === item.id
                  ? "bg-primary/15 text-primary"
                  : "bg-transparent text-muted-foreground hover:bg-card hover:text-foreground"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {!isOnline && (
          <div className="px-5 pb-4">
            <span className="inline-flex items-center bg-warning text-black px-2.5 py-1 rounded-full text-[11px] font-semibold animate-pulse">
              Offline
            </span>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-gradient-to-br from-muted to-card px-5 py-3.5 flex items-center justify-between border-b border-border sticky top-0 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-[#ff6b81] rounded-lg flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
            BudgetPro
          </h1>
        </div>
        {!isOnline && (
          <span className="bg-warning text-black px-2.5 py-1 rounded-full text-[11px] font-semibold animate-pulse">
            Offline
          </span>
        )}
      </header>

      {/* Main Area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Month Selector Bar */}
        <div className="sticky top-0 lg:top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-center gap-4 py-3 px-5">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-8 h-8 rounded-full bg-card border border-border text-foreground flex items-center justify-center transition-colors hover:bg-secondary cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold min-w-[140px] text-center">
              {formatMonth(selectedMonth)}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="w-8 h-8 rounded-full bg-card border border-border text-foreground flex items-center justify-center transition-colors hover:bg-secondary cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 px-4 py-5 pb-20 lg:pb-5 lg:px-8 xl:px-12 max-w-[1400px] w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-muted border-t border-border flex justify-around py-2 pb-[max(8px,env(safe-area-inset-bottom))] z-50">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 border-none bg-transparent cursor-pointer font-sans text-[10px] font-medium transition-all duration-300 rounded-lg",
              activeTab === item.id ? "text-primary" : "text-text-muted"
            )}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon
              className={cn(
                "w-5 h-5 transition-transform duration-300",
                activeTab === item.id && "scale-110"
              )}
            />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
