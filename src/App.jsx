import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useConvexAuth } from "convex/react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Goals } from "./pages/Goals";
import { Investments } from "./pages/Investments";
import { AuthPage } from "./pages/Auth";

function PrivateLayout() {
  return (
    <div className="flex h-screen bg-[#0f0f12]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/investments" element={<Investments />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-[#6b7280] text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to="/" /> : <AuthPage />}
        />
        <Route
          path="/*"
          element={isAuthenticated ? <PrivateLayout /> : <Navigate to="/auth" />}
        />
      </Routes>
    </BrowserRouter>
  );
}