"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function DriverBankingForm({ banking }: { banking: any }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bankName: banking?.bankName || "",
    accountHolder: banking?.accountHolder || "",
    accountNumber: banking?.accountNumber || "",
    branchCode: banking?.branchCode || "",
    accountType: banking?.accountType || "CHEQUE",
  });

  const inputStyle = {
    background: "var(--input)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/driver/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Failed to save banking details");
        return;
      }

      toast.success("Banking details saved!");
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
      <div className="flex items-center gap-3">
        <CreditCard size={20} style={{ color: "var(--gold)" }} />
        <h3 className="font-semibold text-white">Banking Details</h3>
      </div>
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        Required for weekly payout processing
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-white">Bank Name *</Label>
          <Select
            value={form.bankName}
            onValueChange={(v) => setForm((p) => ({ ...p, bankName: v }))}
          >
            <SelectTrigger style={inputStyle}>
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ABSA">ABSA</SelectItem>
              <SelectItem value="FNB">FNB</SelectItem>
              <SelectItem value="STANDARD_BANK">Standard Bank</SelectItem>
              <SelectItem value="NEDBANK">Nedbank</SelectItem>
              <SelectItem value="CAPITEC">Capitec</SelectItem>
              <SelectItem value="AFRICAN_BANK">African Bank</SelectItem>
              <SelectItem value="INVESTEC">Investec</SelectItem>
              <SelectItem value="TYME_BANK">TymeBank</SelectItem>
              <SelectItem value="DISCOVERY">Discovery Bank</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-white">Account Holder Name *</Label>
          <Input
            placeholder="Full name as on bank account"
            value={form.accountHolder}
            onChange={(e) => setForm((p) => ({ ...p, accountHolder: e.target.value }))}
            required
            style={inputStyle}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-white">Account Number *</Label>
          <Input
            placeholder="Your account number"
            value={form.accountNumber}
            onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
            required
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-white">Branch Code *</Label>
            <Input
              placeholder="e.g. 632005"
              value={form.branchCode}
              onChange={(e) => setForm((p) => ({ ...p, branchCode: e.target.value }))}
              required
              style={inputStyle}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white">Account Type *</Label>
            <Select
              value={form.accountType}
              onValueChange={(v) => setForm((p) => ({ ...p, accountType: v }))}
            >
              <SelectTrigger style={inputStyle}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="SAVINGS">Savings</SelectItem>
                <SelectItem value="TRANSMISSION">Transmission</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full font-semibold text-white"
          style={{ background: "var(--gold)" }}
        >
          {loading && <Loader2 size={16} className="animate-spin mr-2" />}
          Save Banking Details
        </Button>
      </form>
    </div>
  );
}