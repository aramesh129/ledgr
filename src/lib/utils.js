import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const CATEGORY_COLORS = {
  Food: "#1D9E75",
  Income: "#7F77DD",
  Transport: "#378ADD",
  Entertainment: "#D85A30",
  Shopping: "#EF9F27",
  Bills: "#E24B4A",
  Other: "#888780",
};
