import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function AuthPage() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      await signIn("password", { email, password, flow: mode, name });
    } catch (e) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-semibold bg-gradient-to-r from-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent mb-2">
            Ledgr
          </div>
          <p className="text-[#6b7280] text-sm">Smart finances</p>
        </div>

        <div className="bg-[#18181f] border border-white/5 rounded-2xl p-6 space-y-4">
          {mode === "signUp" && (
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0f0f18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0f0f18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0f0f18] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#7F77DD]"
          />

          {error && <p className="text-[#f87171] text-xs">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#7F77DD] hover:bg-[#6b63cc] text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "signIn" ? "Sign in" : "Create account"}
          </button>

          <button
            onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            className="w-full text-[#6b7280] text-xs hover:text-[#9ca3af] transition-colors"
          >
            {mode === "signIn" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}