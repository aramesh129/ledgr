import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const GOAL_COLORS = ["#7F77DD", "#1D9E75", "#EF9F27", "#378ADD", "#D85A30"];

export function Goals() {
  const goals = useQuery(api.goals.list);
  const createGoal = useMutation(api.goals.create);
  const updateSaved = useMutation(api.goals.updateSaved);
  const removeGoal = useMutation(api.goals.remove);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", targetAmount: "", savedAmount: "", icon: "🎯", deadline: "",
  });

  async function handleCreate() {
    if (!form.name || !form.targetAmount) {
      toast.error("Please enter a name and target amount");
      return;
    }
    try {
      await createGoal({
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        savedAmount: parseFloat(form.savedAmount) || 0,
        icon: form.icon,
        color: GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)],
        deadline: form.deadline || undefined,
      });
      toast.success("Goal created");
      setForm({ name: "", targetAmount: "", savedAmount: "", icon: "🎯", deadline: "" });
      setOpen(false);
    } catch {
      toast.error("Failed to create goal");
    }
  }

  async function handleRemoveGoal(id) {
    try {
      await removeGoal({ id });
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  }

  async function handleUpdateSaved(goal, amt) {
    try {
      await updateSaved({ id: goal._id, savedAmount: goal.savedAmount + amt });
      toast.success(`Added $${amt} to ${goal.name}`);
    } catch {
      toast.error("Failed to update goal");
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#e2e8f0]">Savings goals</h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-[#7F77DD] hover:bg-[#6b63cc] text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        >
          <Plus size={14} /> Add goal
        </button>
      </div>

      {open && (
        <div className="bg-[#18181f] border border-[#a78bfa]/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-[#d1d5db]">New goal</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Goal name (e.g. New laptop)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD] col-span-2"
            />
            <input
              type="number"
              placeholder="Target amount ($)"
              value={form.targetAmount}
              onChange={(e) => setForm((p) => ({ ...p, targetAmount: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
            />
            <input
              type="number"
              placeholder="Already saved ($)"
              value={form.savedAmount}
              onChange={(e) => setForm((p) => ({ ...p, savedAmount: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
            />
            <input
              placeholder="Icon emoji"
              value={form.icon}
              onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] focus:outline-none focus:border-[#7F77DD]"
            />
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
              className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e2e8f0] focus:outline-none focus:border-[#7F77DD]"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="bg-[#7F77DD] hover:bg-[#6b63cc] text-white rounded-lg px-4 py-1.5 text-xs font-medium">
              Create goal
            </button>
            <button onClick={() => setOpen(false)} className="bg-[#0f0f18] border border-white/10 text-[#6b7280] rounded-lg px-4 py-1.5 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goals?.length === 0 && !open && (
          <p className="text-sm text-[#4b5563] col-span-2 text-center py-12">
            No goals yet. Create one to start saving!
          </p>
        )}
        {goals?.map((g) => {
          const pct = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
          return (
            <div key={g._id} className="bg-[#18181f] border border-white/5 rounded-xl p-4 space-y-3 group relative">
              <button
                onClick={() => handleRemoveGoal(g._id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-[#4b5563] hover:text-[#f87171] transition-all"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex items-start justify-between pr-6">
                <div>
                  <span className="text-2xl">{g.icon ?? "🎯"}</span>
                  <p className="text-sm font-medium text-[#e2e8f0] mt-1">{g.name}</p>
                  {g.deadline && <p className="text-xs text-[#4b5563]">By {g.deadline}</p>}
                </div>
                <span className="text-xl font-bold" style={{ color: g.color ?? "#7F77DD" }}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 bg-[#0f0f18] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: g.color ?? "#7F77DD" }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#6b7280]">
                <span>${g.savedAmount.toLocaleString()} saved</span>
                <span>${(g.targetAmount - g.savedAmount).toLocaleString()} to go</span>
              </div>
              <div className="flex gap-2">
                {[10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleUpdateSaved(g, amt)}
                    className="flex-1 bg-[#0f0f18] hover:bg-white/5 border border-white/10 text-[#6b7280] hover:text-[#d1d5db] rounded-lg py-1 text-xs transition-colors"
                  >
                    +${amt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}