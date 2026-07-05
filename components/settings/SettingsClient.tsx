"use client";

import { useState } from "react";
import { User, Lock, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  user: { name: string | null; email: string | null; image: string | null; role: string };
  customer: {
    phone: string | null;
    city: string | null;
    country: string;
    bio: string | null;
    address: any;
  } | null;
  carrier: { name: string; email: string; phone: string | null; address: any } | null;
  isCarrierAdmin: boolean;
};

const inputStyle = {
  background: "var(--input)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
};

export default function SettingsClient({ user, customer, carrier, isCarrierAdmin }: Props) {
  const [tab, setTab] = useState<"profile" | "security" | "company">("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    ...(isCarrierAdmin ? [{ id: "company", label: "Company", icon: Building2 }] : []),
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all"
            style={{
              color: tab === t.id ? "var(--gold)" : "var(--muted-foreground)",
              borderBottom: tab === t.id ? "2px solid var(--gold)" : "2px solid transparent",
            }}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab user={user} customer={customer} />}
      {tab === "security" && <SecurityTab />}
      {tab === "company" && carrier && <CompanyTab carrier={carrier} />}
    </div>
  );
}

function ProfileTab({
  user,
  customer,
}: {
  user: Props["user"];
  customer: Props["customer"];
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    image: user.image || "",
    phone: customer?.phone || "",
    city: customer?.city || "",
    country: customer?.country || "ZA",
    bio: customer?.bio || "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to update profile");
        return;
      }

      toast.success("Profile updated!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-4 mb-2">
        {form.image ? (
          <img src={form.image} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: "rgba(200,146,42,0.15)", color: "var(--gold)" }}
          >
            {form.name?.[0] || "U"}
          </div>
        )}
        <div className="space-y-1.5 flex-1">
          <Label className="text-white">Avatar URL</Label>
          <Input
            placeholder="https://..."
            value={form.image}
            onChange={(e) => update("image", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-white">Full Name</Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} style={inputStyle} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white">Email</Label>
          <Input value={user.email || ""} disabled style={{ ...inputStyle, opacity: 0.6 }} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white">Phone</Label>
          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} style={inputStyle} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white">City</Label>
          <Input value={form.city} onChange={(e) => update("city", e.target.value)} style={inputStyle} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-white">Bio</Label>
          <Input value={form.bio} onChange={(e) => update("bio", e.target.value)} style={inputStyle} />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="font-semibold text-white"
        style={{ background: "var(--gold)" }}
      >
        {loading && <Loader2 size={16} className="animate-spin mr-2" />}
        Save Changes
      </Button>
    </div>
  );
}

function SecurityTab() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update password");
        return;
      }

      toast.success("Password updated!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="space-y-1.5">
        <Label className="text-white">Current Password</Label>
        <Input
          type="password"
          value={form.currentPassword}
          onChange={(e) => update("currentPassword", e.target.value)}
          style={inputStyle}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white">New Password</Label>
        <Input
          type="password"
          value={form.newPassword}
          onChange={(e) => update("newPassword", e.target.value)}
          style={inputStyle}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white">Confirm New Password</Label>
        <Input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          style={inputStyle}
        />
      </div>
      <Button
        onClick={handleSave}
        disabled={loading}
        className="font-semibold text-white"
        style={{ background: "var(--gold)" }}
      >
        {loading && <Loader2 size={16} className="animate-spin mr-2" />}
        Update Password
      </Button>
    </div>
  );
}

function CompanyTab({
  carrier,
}: {
  carrier: { name: string; email: string; phone: string | null; address: any };
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: carrier.name,
    email: carrier.email,
    phone: carrier.phone || "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/carrier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to update company");
        return;
      }

      toast.success("Company details updated!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-white">Company Name</Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} style={inputStyle} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white">Company Email</Label>
          <Input value={form.email} onChange={(e) => update("email", e.target.value)} style={inputStyle} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-white">Phone</Label>
          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} style={inputStyle} />
        </div>
      </div>
      <Button
        onClick={handleSave}
        disabled={loading}
        className="font-semibold text-white"
        style={{ background: "var(--gold)" }}
      >
        {loading && <Loader2 size={16} className="animate-spin mr-2" />}
        Save Company Details
      </Button>
    </div>
  );
}