export function calculateGstExclusive(orderAmount: number): number {
  return orderAmount / 1.18;
}

export function calculateCommission(gstExclusiveAmount: number, tierRatePercent: number): number {
  return (gstExclusiveAmount * tierRatePercent) / 100;
}

export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function getInitials(name: string): string {
  return (name.split(" ")[0]?.[0] || "").toUpperCase();
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

export const MIN_DATE_OF_BIRTH = "1900-01-01";

// <input type="date"> lets a typed year run past four digits, so a slip like
// "51983-06-19" reaches us as a value the browser considers valid. Returns a
// message to show, or null when the date is usable.
export function dateOfBirthError(value: string, today: Date = new Date()): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Enter a valid date of birth";

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects dates that roll over, e.g. 31 February.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return "Enter a valid date of birth";
  }
  if (value < MIN_DATE_OF_BIRTH) return "Enter a valid date of birth";

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > todayUtc) return "Date of birth can't be in the future";
  // Registration also asks partners to confirm they are 18 or older.
  if (Date.UTC(year + 18, month - 1, day) > todayUtc) return "You must be 18 or older to register";

  return null;
}

// YYYY-MM-DD in local time, for a date input's max attribute.
export function todayISODate(today: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
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
  confirmed:            { label: "Confirmed",            color: "#4C7A4C", bg: "#4C7A4C15" },
  packed:               { label: "Packed",               color: "#6B7FD7", bg: "#6B7FD715" },
  shipped:              { label: "Shipped",              color: "#E0A94C", bg: "#E0A94C15" },
  delivered:            { label: "Delivered",            color: "#4C7A4C", bg: "#4C7A4C15" },
  commission_eligible:  { label: "Commission Earned",   color: "#E8792B", bg: "#E8792B15" },
  cancelled:            { label: "Cancelled",            color: "#C6483B", bg: "#C6483B15" },
  returned:             { label: "Returned",             color: "#C6483B", bg: "#C6483B15" },
};
