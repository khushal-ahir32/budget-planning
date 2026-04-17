export function formatCurrency(amount: number): string {
  return "₹" + Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year!, month! - 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
