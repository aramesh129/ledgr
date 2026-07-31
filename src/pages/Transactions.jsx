import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../lib/utils";
import { Plus, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "All", "Food", "Transport", "Entertainment", "Shopping", "Bills", "Income", "Other",
];

export function Transactions() {
  const [filter, setFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState({ date: "", merchant: "", amount: "", category: "Food" });
  const [uploading, setUploading] = useState(false);

  const txns = useQuery(api.transactions.list, filter !== "All" ? { category: filter } : {});
  const addTxn = useMutation(api.transactions.add);
  const removeTxn = useMutation(api.transactions.remove);

  async function handleAdd() {
    if (!form.merchant || !form.amount || !form.date) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await addTxn({
        date: form.date,
        merchant: form.merchant,
        amount: parseFloat(form.amount),
        category: form.category,
        icon: CATEGORY_ICONS[form.category],
        source: "manual",
      });
      toast.success("Transaction added");
      setForm({ date: "", merchant: "", amount: "", category: "Food" });
      setAddOpen(false);
    } catch {
      toast.error("Failed to add transaction");
    }
  }

  async function handleRemove(id) {
    try {
      await removeTxn({ id });
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction");
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }
    setUploading(true);

    // Convert to base64 — matches what pdf_processor.py expects
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_PDF_SERVICE_URL}/process-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfData: base64 }),
        }
      );
      const data = await res.json();
      for (const t of data.transactions ?? []) {
        await addTxn({
          date: t.date,
          merchant: t.merchant,
          amount: t.amount,
          category: t.category,
          source: "pdf",
        });
      }
      toast.success(`Imported ${data.transactions?.length ?? 0} transactions!`);
    } catch {
      toast.error("Failed to parse PDF. Make sure the PDF service is running.");
    }
    setUploading(false);
    setUploadOpen(false);
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#e2e8f0]">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 bg-[#18181f] border border-white/10 hover:border-white/20 text-[#9ca3af] hover:text-[#d1d5db] rounded-lg px-3 py-1.5 text-xs transition-colors"
          >
            <Upload size={14} /> Upload PDF
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 bg-[#7F77DD] hover:bg-[#6b63cc] text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              filter === c
                ? "bg-[#7F77DD] text-white"
                : "bg-[#18181f] border border-white/10 text-[#6b7280] hover:text-[#d1d5db]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {addOpen && (
        <div className="bg-[#18181f] border border-[#a78bfa]/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-[#d1d5db]">Add transaction</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] focus:outline-none focus:border-[#7F77DD]"
            />
            <input
              placeholder="Merchant"
              value={form.merchant}
              onChange={(e) => setForm((p) => ({ ...p, merchant: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
            />
            <input
              type="number"
              placeholder="Amount (negative = expense)"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] focus:outline-none focus:border-[#7F77DD]"
            >
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-[#7F77DD] hover:bg-[#6b63cc] text-white rounded-lg px-4 py-1.5 text-xs font-medium">
              Save
            </button>
            <button onClick={() => setAddOpen(false)} className="bg-[#0f0f18] border border-white/10 text-[#6b7280] rounded-lg px-4 py-1.5 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {uploadOpen && (
        <div className="bg-[#18181f] border border-dashed border-white/20 rounded-xl p-6 text-center">
          <p className="text-sm text-[#9ca3af] mb-3">Upload a bank statement PDF</p>
          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="text-sm text-[#6b7280] file:mr-3 file:rounded-lg file:border-0 file:bg-[#7F77DD] file:text-white file:px-3 file:py-1.5 file:text-xs file:cursor-pointer"
          />
          {uploading && <p className="text-xs text-[#4b5563] mt-2">Parsing PDF...</p>}
          <button
            onClick={() => setUploadOpen(false)}
            className="block mx-auto mt-3 text-xs text-[#4b5563] hover:text-[#6b7280]"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="bg-[#18181f] border border-white/5 rounded-xl overflow-hidden">
        {txns?.length === 0 && (
          <p className="text-sm text-[#4b5563] text-center py-8">No transactions found.</p>
        )}
        {txns?.map((t, i) => (
          <div
            key={t._id}
            className={`flex justify-between items-center px-4 py-3 ${
              i < (txns.length - 1) ? "border-b border-white/5" : ""
            } group`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{t.icon ?? CATEGORY_ICONS[t.category] ?? "💳"}</span>
              <div>
                <p className="text-sm font-medium text-[#e2e8f0]">{t.merchant}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-xs text-[#4b5563]">{t.date}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: (CATEGORY_COLORS[t.category] ?? "#888780") + "22",
                      color: CATEGORY_COLORS[t.category] ?? "#888780",
                    }}
                  >
                    {t.category}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${t.amount < 0 ? "text-[#f87171]" : "text-[#34d399]"}`}>
                {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toFixed(2)}
              </span>
              <button
                onClick={() => handleRemove(t._id)}
                className="opacity-0 group-hover:opacity-100 text-[#4b5563] hover:text-[#f87171] transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}