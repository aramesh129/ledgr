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

