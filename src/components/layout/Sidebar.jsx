import { NavLink } from "react-router";
import { LayoutDashboard, CreditCard, Target, TrendingUp, LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

const nav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: CreditCard, label: "Transactions" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/investments", icon: TrendingUp, label: "Investing" },
];

export function Sidebar() {
  const { signOut } = useAuthActions();

  return (
    <aside className="w-56 bg-[#18181f] border-r border-white/5 flex flex-col">
      <div className="p-5 border-b border-white/5">
        <span className="text-xl font-semibold bg-gradient-to-r from-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent">
          💸 Ledgr
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#7F77DD]/20 text-[#a78bfa] font-medium"
                  : "text-[#6b7280] hover:text-[#d1d5db] hover:bg-white/5"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6b7280] hover:text-[#f87171] hover:bg-white/5 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}