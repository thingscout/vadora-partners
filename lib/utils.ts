export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMonthYear(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10));
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

// Order status display helpers
export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:            { label: "Confirmed",            color: "#5A8F6B", bg: "#5A8F6B15" },
  packed:               { label: "Packed",               color: "#6B7FD7", bg: "#6B7FD715" },
  shipped:              { label: "Shipped",              color: "#D4A843", bg: "#D4A84315" },
  delivered:            { label: "Delivered",            color: "#5A8F6B", bg: "#5A8F6B15" },
  commission_eligible:  { label: "Commission Earned",   color: "#8B5E83", bg: "#8B5E8315" },
  cancelled:            { label: "Cancelled",            color: "#C0616B", bg: "#C0616B15" },
  returned:             { label: "Returned",             color: "#C0616B", bg: "#C0616B15" },
};
