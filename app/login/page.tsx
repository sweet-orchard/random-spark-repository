"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#f8f8f6" }}>
      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 380, background: "#fff", border: "1px solid #e1dfdb", borderRadius: 12, padding: "22px 20px", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#2f2d29" }}>Log in</h1>
        <p style={{ margin: "6px 0 18px", fontSize: 13, color: "rgba(55,53,47,0.6)" }}>Use your email and password to continue.</p>

        <label style={{ fontSize: 12, color: "rgba(55,53,47,0.75)", display: "block", marginBottom: 6 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{ width: "100%", border: "1px solid #d8d4cc", borderRadius: 8, padding: "10px 12px", fontSize: 14, marginBottom: 12, outline: "none" }}
        />

        <label style={{ fontSize: 12, color: "rgba(55,53,47,0.75)", display: "block", marginBottom: 6 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{ width: "100%", border: "1px solid #d8d4cc", borderRadius: 8, padding: "10px 12px", fontSize: 14, marginBottom: 12, outline: "none" }}
        />

        {error && <p style={{ margin: "0 0 12px", fontSize: 12, color: "#c83c3c" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", border: "none", background: "#37352f", color: "#fff", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1 }}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p style={{ margin: "14px 0 0", fontSize: 13, color: "rgba(55,53,47,0.65)", textAlign: "center" }}>
          No account? <Link href="/signup" style={{ color: "#2f2d29", fontWeight: 600 }}>Create one</Link>
        </p>
      </form>
    </main>
  );
}
