"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--input)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(16,185,129,0.1)" }}
        >
          <CheckCircle size={32} style={{ color: "#10b981" }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="mt-2" style={{ color: "var(--muted-foreground)" }}>
            We've sent a password reset link to
          </p>
          <p className="font-semibold text-white mt-1">{email}</p>
        </div>
        <div
          className="rounded-xl p-4 text-left"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            The link expires in <span className="text-white font-semibold">1 hour</span>. 
            Check your spam folder if you don't see it in your inbox.
          </p>
        </div>
        <div className="space-y-3">
          <Button
            onClick={() => { setSent(false); setEmail(""); }}
            className="w-full h-11"
            style={{
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            Try a different email
          </Button>
          <Link href="/sign-in">
            <Button
              className="w-full h-11 font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/sign-in"
          className="flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(200,146,42,0.1)" }}
        >
          <Mail size={24} style={{ color: "var(--gold)" }} />
        </div>
        <h2 className="text-3xl font-bold text-white">Forgot password?</h2>
        <p className="mt-2" style={{ color: "var(--muted-foreground)" }}>
          No worries. Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full h-11 font-semibold text-white"
          style={{ background: "var(--gold)" }}
        >
          {loading && <Loader2 size={18} className="animate-spin mr-2" />}
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
        Remember your password?{" "}
        <Link
          href="/sign-in"
          className="font-semibold hover:underline"
          style={{ color: "var(--gold)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}