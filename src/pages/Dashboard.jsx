import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCurrency } from "../lib/utils";
import { SpendingChart } from "../components/charts/SpendingChart";
import { CategoryPie } from "../components/charts/CategoryPie";
import { useState } from "react";
import { Sparkles } from "lucide-react";

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-[#18181f] border border-white/5 rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${accent}`}>{value}</p>
      <p className="text-[11px] text-[#4b5563] mt-1">{sub}</p>
    </div>
  );
}

export function Dashboard() {
  const summary = useQuery(api.transactions.summary);
  const recentTxns = useQuery(api.transactions.list, { limit: 5 });
  const latestInsight = useQuery(api.insights.latest);
  const saveInsight = useMutation(api.insights.save);

  const [insightText, setInsightText] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  async function fetchInsights() {
    if (!summary) return;
    setLoadingInsight(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_AI_SERVICE_URL}/generate-insights`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalIncome: summary.income,
            totalSpending: summary.spent,
            netFlow: summary.income - summary.spent,
            currentBalance: 2847.63,
            spendingByCategory: Object.entries(summary.byCategory).map(
              ([category, amount]) => ({ category, amount })
            ),
            topMerchants: [],
            goals: [],
            monthlyTrend: [],
          }),
        }
      );
      const data = await res.json();
      const text =
        data.insights?.spendingHighlights?.positiveReinforcement ??
        JSON.stringify(data.insights, null, 2);
      setInsightText(text);
      await saveInsight({ content: text });
    } catch {
      setInsightText(
        "Couldn't load insights right now. Make sure the AI service is running!"
      );
    }
    setLoadingInsight(false);
  }