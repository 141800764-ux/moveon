"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Eye, EyeOff, CheckCircle,
  XCircle, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    validateToken();
  }, []);

  async function validateToken() {
    try {
      const res = await fetch(
        `/api/auth/reset-password?token=${params.token}`
      );
      const data = await res.json();
      setTokenValid(data.valid);
      if (data.email) setUserEmail(data.email);
    } catch {
      setTokenValid(false);
    }
  }

  function getPasswordStrength(pwd: string): {
    score: number;
    label: string;
    color: string;
  } {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
    if (score <= 2) return { score, label: "Fair", color: "#eab308" };
    if (score <= 3) return { score, label: "Good", color: "#3b82f6" };
    return { score, label: "Strong", color: "#10b981" };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to reset password");
        return;
      }

      setDone(true);
      setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
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

  const strength = getPasswordStrength(password);

  // Loading token validation
  if (tokenValid === null) {
    return (
      <div className="space-y-6 text-center">
        <Loader2
          size={32}
          className="animate-spin mx-auto"
          style={{ color: "var(--gold)" }}
        />
        <p style={{ color: "var(--muted-foreground)" }}>
          Validating reset link...
        </p>
      </div>
    );
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <div className="space-y-6 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(239,68,68,0.1)" }}
        >
          <XCircle size={32} style={{ color: "#ef4444" }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Link expired</h2>
          <p className="mt-2" style={{ color: "var(--muted-foreground)" }}>
            This password reset link is invalid or has expired.
            Reset links are only valid for 1 hour.
          </p>
        </div>
        <Link href="/forgot-password">
          <Button
            className="w-full h-11 font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            Request a new link
          </Button>
        </Link>
        <Link href="/sign-in">
          <p
            className="text-sm text-center hover:underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            Back to sign in
          </p>
        </Link>
      </div>
    );
  }

  // Success
  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(16,185,129,0.1)" }}
        >
          <CheckCircle size={32} style={{ color: "#10b981" }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Password reset!</h2>
          <p className="mt-2" style={{ color: "var(--muted-foreground)" }}>
            Your password has been changed successfully.
            Redirecting you to sign in...
          </p>
        </div>
        <Link href="/sign-in">
          <Button
            className="w-full h-11 font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            Sign In Now
          </Button>
        </Link>
      </div>
    );
  }

  // Reset form
  return (
    <div className="space-y-6">
      <div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(200,146,42,0.1)" }}
        >
          <Lock size={24} style={{ color: "var(--gold)" }} />
        </div>
        <h2 className="text-3xl font-bold text-white">Create new password</h2>
        {userEmail && (
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            For <span className="text-white">{userEmail}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-white">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ ...inputStyle, paddingRight: "2.5rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted-foreground)" }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password strength */}
          {password.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-all"
                    style={{
                      background:
                        i <= strength.score ? strength.color : "var(--border)",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: strength.color }}>
                {strength.label} password
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-white">
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                ...inputStyle,
                paddingRight: "2.5rem",
                borderColor:
                  confirmPassword.length > 0
                    ? password === confirmPassword
                      ? "#10b981"
                      : "#ef4444"
                    : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted-foreground)" }}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs" style={{ color: "#ef4444" }}>
              Passwords don't match
            </p>
          )}
          {confirmPassword.length > 0 && password === confirmPassword && (
            <p className="text-xs" style={{ color: "#10b981" }}>
              ✓ Passwords match
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={
            loading ||
            password.length < 8 ||
            password !== confirmPassword
          }
          className="w-full h-11 font-semibold text-white"
          style={{
            background:
              password.length >= 8 && password === confirmPassword
                ? "var(--gold)"
                : "var(--muted)",
          }}
        >
          {loading && <Loader2 size={18} className="animate-spin mr-2" />}
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}