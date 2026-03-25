"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${basePath}/reset-password` : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("If this email exists, a reset link was sent. Check your inbox.");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#f8f8f6" }}>
      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 380, background: "#fff", border: "1px solid #e1dfdb", borderRadius: 12, padding: "22px 20px", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#2f2d29" }}>Forgot password</h1>
        <p style={{ margin: "6px 0 18px", fontSize: 13, color: "rgba(55,53,47,0.6)" }}>Enter your email to receive a reset link.</p>

        <label style={{ fontSize: 12, color: "rgba(55,53,47,0.75)", display: "block", marginBottom: 6 }}>Email</label>
        <input
          suppressHydrationWarning
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{ width: "100%", border: "1px solid #d8d4cc", borderRadius: 8, padding: "10px 12px", fontSize: 14, marginBottom: 12, outline: "none" }}
        />

        {error && <p style={{ margin: "0 0 12px", fontSize: 12, color: "#c83c3c" }}>{error}</p>}
        {message && <p style={{ margin: "0 0 12px", fontSize: 12, color: "#2f2d29" }}>{message}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", border: "none", background: "#37352f", color: "#fff", borderRadius: 4, padding: "10px 12px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1 }}
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <p style={{ margin: "14px 0 0", fontSize: 13, color: "rgba(55,53,47,0.65)", textAlign: "center" }}>
          Back to <Link href="/login" style={{ color: "#2f2d29", fontWeight: 600 }}>Log in</Link>
        </p>
      </form>
    </main>
  );
}
