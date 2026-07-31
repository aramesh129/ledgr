import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCurrency } from "../lib/utils";
import { SpendingChart } from "../components/charts/SpendingChart";
import { CategoryPie } from "../components/charts/CategoryPie";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

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
  const allTxns = useQuery(api.transactions.list, {});
  const latestInsight = useQuery(api.insights.latest);
  const goals = useQuery(api.goals.list);
  const saveInsight = useMutation(api.insights.saveAndClean);

  const [insightText, setInsightText] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Real computed values from actual data
  const totalBalance = allTxns?.reduce((s, t) => s + t.amount, 0) ?? 0;
  const totalSaved = goals?.reduce((s, g) => s + g.savedAmount, 0) ?? 0;

  async function fetchInsights() {
    if (!summary) {
      toast.error("No financial data available yet");
      return;
    }
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
            currentBalance: totalBalance,
            spendingByCategory: Object.entries(summary.byCategory).map(
              ([category, amount]) => ({ category, amount })
            ),
            topMerchants: [],
            goals: goals?.map((g) => ({
              title: g.name,
              currentAmount: g.savedAmount,
              targetAmount: g.targetAmount,
              isActive: true,
            })) ?? [],
            monthlyTrend: [],
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`AI service returned ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error ?? "AI service failed");
      }

      const text =
        data.insights?.spendingHighlights?.positiveReinforcement ??
        JSON.stringify(data.insights, null, 2);

      setInsightText(text);
      await saveInsight({ content: text });
      toast.success("Insights generated");
    } catch (err) {
      const msg =
        err.message?.includes("fetch")
          ? "AI service is not running. Start it with: python server.py"
          : err.message ?? "Failed to generate insights";
      setInsightText(msg);
      toast.error(msg);
    }
    setLoadingInsight(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-[#e2e8f0]">Overview</h1>

      {/* Summary stat cards — all driven by real Convex data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Balance"
          value={formatCurrency(totalBalance)}
          sub="across all transactions"
          accent="text-[#a78bfa]"
        />
        <StatCard
          label="Spent this month"
          value={formatCurrency(summary?.spent ?? 0)}
          sub="this month"
          accent="text-[#f87171]"
        />
        <StatCard
          label="Income this month"
          value={formatCurrency(summary?.income ?? 0)}
          sub="received"
          accent="text-[#34d399]"
        />
        <StatCard
          label="Saved to goals"
          value={formatCurrency(totalSaved)}
          sub={`across ${goals?.length ?? 0} goals`}
          accent="text-[#38bdf8]"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#18181f] border border-white/5 rounded-xl p-4">
          <p className="text-sm font-medium text-[#d1d5db] mb-4">
            Income vs. spending (6 months)
          </p>
          <SpendingChart />
        </div>
        <div className="bg-[#18181f] border border-white/5 rounded-xl p-4">
          <p className="text-sm font-medium text-[#d1d5db] mb-4">
            Spending by category
          </p>
          <CategoryPie data={summary?.byCategory ?? {}} />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-[#18181f] border border-white/5 rounded-xl p-4">
        <p className="text-sm font-medium text-[#d1d5db] mb-3">
          Recent transactions
        </p>
        {recentTxns === undefined && (
          <p className="text-sm text-[#4b5563] text-center py-6">Loading...</p>
        )}
        {recentTxns?.length === 0 && (
          <p className="text-sm text-[#4b5563] text-center py-6">
            No transactions yet. Add one manually or upload a bank statement.
          </p>
        )}
        {recentTxns?.map((t) => (
          <div
            key={t._id}
            className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-[#e2e8f0]">{t.merchant}</p>
              <p className="text-xs text-[#4b5563]">
                {t.date} · {t.category}
              </p>
            </div>
            <span
              className={`text-sm font-semibold ${
                t.amount < 0 ? "text-[#f87171]" : "text-[#34d399]"
              }`}
            >
              {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-[#18181f] border border-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-[#d1d5db] flex items-center gap-2">
              <Sparkles size={16} className="text-[#a78bfa]" /> AI insights
            </p>
            <p className="text-xs text-[#4b5563] mt-0.5">
              Powered by LLaMA via your local service
            </p>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loadingInsight || !summary}
            className="bg-[#7F77DD] hover:bg-[#6b63cc] text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingInsight ? "Thinking..." : "Get insights"}
          </button>
        </div>
        {(insightText || latestInsight) && (
          <div className="bg-[#0f0f18] border border-[#a78bfa]/20 rounded-lg p-3 text-sm text-[#c4b5fd] leading-relaxed whitespace-pre-wrap">
            {insightText || latestInsight?.content}
          </div>
        )}
        {latestInsight && (
          <p className="text-[10px] text-[#4b5563] mt-2">
            Last generated: {new Date(latestInsight.generatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}