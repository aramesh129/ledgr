import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CATEGORY_COLORS } from "../../lib/utils";

export function CategoryPie({ data }) {
  const entries = Object.entries(data).map(([name, value]) => ({ name, value }));

  if (entries.length === 0) {
    return <p className="text-xs text-[#4b5563] text-center py-10">No spending data yet</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={entries} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
            {entries.map((e, i) => (
              <Cell key={i} fill={CATEGORY_COLORS[e.name] ?? "#888780"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#1e1e27", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`$${v.toFixed(2)}`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-2">
        {entries.map((e) => (
          <div key={e.name} className="flex justify-between text-xs text-[#9ca3af]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ background: CATEGORY_COLORS[e.name] ?? "#888780" }} />
              {e.name}
            </span>
            <span>${e.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}