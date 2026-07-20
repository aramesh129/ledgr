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