import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bell } from "lucide-react";

export function TopBar() {
  const user = useQuery(api.auth.currentUser);

  return (
    <header className="h-14 bg-[#18181f] border-b border-white/5 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="text-[#6b7280] hover:text-[#d1d5db] transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#7F77DD] flex items-center justify-center text-xs font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="text-sm text-[#9ca3af]">{user?.name ?? "Student"}</span>
        </div>
      </div>
    </header>
  );
}