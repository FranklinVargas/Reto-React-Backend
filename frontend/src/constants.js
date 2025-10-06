export const ORDER_STATUSES = ["Pending", "InProgress", "Completed"];

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString();
}
