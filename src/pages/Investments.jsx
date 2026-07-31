import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function Investments() {
  const investments = useQuery(api.investments.list);
  const addInvestment = useMutation(api.investments.add);
  const updatePrice = useMutation(api.investments.updatePrice);
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ ticker: "", name: "", shares: "", purchasePrice: "" });

  const totalValue =
    investments?.reduce((s, i) => s + (i.currentPrice ?? i.purchasePrice) * i.shares, 0) ?? 0;
  const totalCost =
    investments?.reduce((s, i) => s + i.purchasePrice * i.shares, 0) ?? 0;
  const totalGain = totalValue - totalCost;

  async function handleAdd() {
    if (!form.ticker || !form.shares || !form.purchasePrice) return;
    await addInvestment({
      ticker: form.ticker.toUpperCase(),
      name: form.name || form.ticker.toUpperCase(),
      shares: parseFloat(form.shares),
      purchasePrice: parseFloat(form.purchasePrice),
    });
    setForm({ ticker: "", name: "", shares: "", purchasePrice: "" });
    setOpen(false);
  }

  async function refreshPrices() {
    if (!investments || investments.length === 0) {
      toast.error("No holdings to refresh");
      return;
    }
    setRefreshing(true);
    let updated = 0;
    for (const inv of investments) {
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${inv.ticker}&apikey=${import.meta.env.VITE_ALPHA_VANTAGE_KEY}`
        );
        const data = await res.json();
        const price = parseFloat(data["Global Quote"]?.["05. price"] ?? "0");
        if (price > 0) {
          await updatePrice({ id: inv._id, currentPrice: price });
          updated++;
        }
      } catch {
        toast.error(`Failed to fetch price for ${inv.ticker}`);
      }
    }
    toast.success(`Updated ${updated} of ${investments.length} holdings`);
    setRefreshing(false);
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#e2e8f0]">Investments</h1>
        <div className="flex gap-2">
          <button
            onClick={refreshPrices}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-[#18181f] border border-white/10 hover:border-white/20 text-[#9ca3af] hover:text-[#d1d5db] rounded-lg px-3 py-1.5 text-xs transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh prices
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-[#7F77DD] hover:bg-[#6b63cc] text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Plus size={14} /> Add holding
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Portfolio value", value: `$${totalValue.toFixed(2)}`, accent: "text-[#38bdf8]" },
          {
            label: "Total gain/loss",
            value: `${totalGain >= 0 ? "+" : ""}$${totalGain.toFixed(2)}`,
            accent: totalGain >= 0 ? "text-[#34d399]" : "text-[#f87171]",
          },
          { label: "Holdings", value: String(investments?.length ?? 0), accent: "text-[#a78bfa]" },
        ].map((c) => (
          <div key={c.label} className="bg-[#18181f] border border-white/5 rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">{c.label}</p>
            <p className={`text-xl font-semibold ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {open && (
        <div className="bg-[#18181f] border border-[#a78bfa]/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-[#d1d5db]">Add holding</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Ticker (e.g. VTI)"
              value={form.ticker}
              onChange={(e) => setForm((p) => ({ ...p, ticker: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
            />
            <input
              placeholder="Name (e.g. Vanguard Total Market)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
            />
            <input
              type="number"
              step="0.001"
              placeholder="Shares"
              value={form.shares}
              onChange={(e) => setForm((p) => ({ ...p, shares: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
            />
            <input
              type="number"
              placeholder="Purchase price ($)"
              value={form.purchasePrice}
              onChange={(e) => setForm((p) => ({ ...p, purchasePrice: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-[#7F77DD] hover:bg-[#6b63cc] text-white rounded-lg px-4 py-1.5 text-xs font-medium">
              Save
            </button>
            <button onClick={() => setOpen(false)} className="bg-[#0f0f18] border border-white/10 text-[#6b7280] rounded-lg px-4 py-1.5 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#18181f] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-2.5 border-b border-white/5 text-[11px] uppercase tracking-wider text-[#4b5563]">
          <span>Asset</span>
          <span className="text-right">Price</span>
          <span className="text-right">Gain/Loss</span>
          <span className="text-right">Value</span>
        </div>
        {investments?.length === 0 && (
          <p className="text-sm text-[#4b5563] text-center py-8">No holdings yet.</p>
        )}
        {investments?.map((inv, i) => {
          const price = inv.currentPrice ?? inv.purchasePrice;
          const value = price * inv.shares;
          const gain = (price - inv.purchasePrice) * inv.shares;
          const gainPct = ((price - inv.purchasePrice) / inv.purchasePrice) * 100;
          return (
            <div
              key={inv._id}
              className={`grid grid-cols-4 px-4 py-3 items-center ${
                i < (investments.length - 1) ? "border-b border-white/5" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-[#e2e8f0]">{inv.ticker}</p>
                <p className="text-xs text-[#4b5563]">{inv.name} · {inv.shares} shares</p>
              </div>
              <p className="text-sm text-[#d1d5db] text-right">${price.toLocaleString()}</p>
              <p className={`text-sm font-medium text-right ${gain >= 0 ? "text-[#34d399]" : "text-[#f87171]"}`}>
                {gain >= 0 ? "+" : ""}${gain.toFixed(2)} ({gainPct.toFixed(1)}%)
              </p>
              <p className="text-sm font-semibold text-[#38bdf8] text-right">${value.toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}