"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsForm({ user }: { user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Failed to update profile");
        return;
      }

      toast.success("Profile updated!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update password");
        return;
      }

      toast.success("Password updated!");
      setPasswords({ current: "", newPassword: "", confirm: "" });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPasswordLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--input)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(200,146,42,0.1)" }}
          >
            <User size={20} style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Update your personal information
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white">Full Name</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white">Role</Label>
            <Input
              value={user?.role?.toLowerCase() || ""}
              disabled
              style={{ ...inputStyle, opacity: 0.5 }}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            {loading && <Loader2 size={16} className="animate-spin mr-2" />}
            Save Changes
          </Button>
        </form>
      </div>

      {/* Password */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(200,146,42,0.1)" }}
          >
            <Lock size={20} style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Password</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Change your account password
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white">Current Password</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, current: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white">New Password</Label>
            <Input
              type="password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, newPassword: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white">Confirm New Password</Label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirm: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <Button
            type="submit"
            disabled={passwordLoading}
            className="font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            {passwordLoading && (
              <Loader2 size={16} className="animate-spin mr-2" />
            )}
            Update Password
          </Button>
        </form>
      </div>

      {/* Account info */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Account Information
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span style={{ color: "var(--muted-foreground)" }}>User ID</span>
            <span className="text-white font-mono text-sm">{user?.id}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--muted-foreground)" }}>Role</span>
            <span className="text-white">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--muted-foreground)" }}>Member since</span>
            <span className="text-white">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-ZA")
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}