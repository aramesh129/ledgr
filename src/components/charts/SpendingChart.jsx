import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export function SpendingChart() {
  const txns = useQuery(api.transactions.list, {});

  // Build last 6 months of data from real transactions
  const data = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short" });

    const monthTxns = (txns ?? []).filter((t) => t.date.startsWith(prefix));
    const income = monthTxns
      .filter((t) => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    const spent = monthTxns
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    return { month: label, income: parseFloat(income.toFixed(2)), spent: parseFloat(spent.toFixed(2)) };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#1e1e27", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [`$${v}`, ""]}
        />
        <Bar dataKey="income" fill="#7F77DD" radius={[3, 3, 0, 0]} name="Income" />
        <Bar dataKey="spent" fill="#D85A30" radius={[3, 3, 0, 0]} name="Spent" />
      </BarChart>
    </ResponsiveContainer>
  );
}