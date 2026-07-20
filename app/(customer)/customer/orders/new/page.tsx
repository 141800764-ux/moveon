"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MapPin, CreditCard, Banknote } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AddressInput from "@/components/ui/AddressInput";

type Quote = {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  distanceKm: number;
  deliveryFee: number;
  driverPayout: number;
  platformFee: number;
};

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | null>(null);
  const [form, setForm] = useState({
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    originAddress: "",
    originCity: "",
    originLat: 0,
    originLng: 0,
    destinationAddress: "",
    destinationCity: "",
    destinationLat: 0,
    destinationLng: 0,
    weightKg: "",
    serviceLevel: "STANDARD",
    notes: "",
    declaredValue: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (
      ["originAddress", "originCity", "destinationAddress", "destinationCity"].includes(field)
    ) {
      setQuote(null);
      setPaymentMethod(null);
    }
  }

  async function handleGetQuote() {
    if (!form.originAddress || !form.destinationAddress) {
      toast.error("Please fill in both addresses first");
      return;
    }

    if (!form.originLat || !form.destinationLat) {
      toast.error("Please select addresses from the dropdown suggestions");
      return;
    }

    setQuoting(true);
    try {
      const res = await fetch("/api/orders/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originLat: form.originLat,
          originLng: form.originLng,
          destinationLat: form.destinationLat,
          destinationLng: form.destinationLng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Could not calculate quote");
        return;
      }
      setQuote(data);
      toast.success(`Quote ready — R${data.deliveryFee} for ${data.distanceKm}km`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setQuoting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!quote) {
      toast.error("Please get a delivery quote first");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!form.recipientName || !form.recipientPhone) {
      toast.error("Please fill in recipient details");
      return;
    }

    setLoading(true);
    try {
      // Create order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          originLat: quote.origin.lat,
          originLng: quote.origin.lng,
          destinationLat: quote.destination.lat,
          destinationLng: quote.destination.lng,
          distanceKm: quote.distanceKm,
          deliveryFee: quote.deliveryFee,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to create order");
        return;
      }

      const orderId = data.order.id;

      // Create payment record
      const payRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, method: paymentMethod }),
      });
      const payData = await payRes.json();

      if (!payRes.ok) {
        toast.error("Order created but payment setup failed");
        router.push(`/customer/orders/${orderId}`);
        return;
      }

      if (paymentMethod === "CARD" && payData.payfastUrl) {
        toast.success("Redirecting to payment...");
        window.location.href = payData.payfastUrl;
        return;
      }

      toast.success("Order placed! Pay the driver on delivery.");
      router.push(`/customer/orders/${orderId}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--input)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Link href="/customer/orders">
          <button
            className="p-2 rounded-xl transition hover:bg-white/5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Order</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Fill in the details to place a delivery
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Recipient Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white">Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={form.recipientName}
                onChange={(e) => update("recipientName", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Phone *</Label>
              <Input
                placeholder="+27 82 000 0000"
                value={form.recipientPhone}
                onChange={(e) => update("recipientPhone", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={form.recipientEmail}
                onChange={(e) => update("recipientEmail", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Pickup */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Pickup Address</h2>
          <div className="space-y-1.5">
            <Label className="text-white">Search Address *</Label>
            <AddressInput
              placeholder="Start typing pickup address..."
              value={form.originAddress}
              onChange={(val) => {
                setForm((p) => ({ ...p, originAddress: val }));
                setQuote(null);
                setPaymentMethod(null);
              }}
              onSelect={(data) => {
                setForm((p) => ({
                  ...p,
                  originAddress: data.address,
                  originCity: data.city,
                  originLat: data.lat,
                  originLng: data.lng,
                }));
                setQuote(null);
                setPaymentMethod(null);
              }}
              style={inputStyle}
            />
          </div>
          {form.originCity && (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              City: <span className="text-white">{form.originCity}</span>
            </p>
          )}
        </div>

        {/* Delivery */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Delivery Address</h2>
          <div className="space-y-1.5">
            <Label className="text-white">Search Address *</Label>
            <AddressInput
              placeholder="Start typing delivery address..."
              value={form.destinationAddress}
              onChange={(val) => {
                setForm((p) => ({ ...p, destinationAddress: val }));
                setQuote(null);
                setPaymentMethod(null);
              }}
              onSelect={(data) => {
                setForm((p) => ({
                  ...p,
                  destinationAddress: data.address,
                  destinationCity: data.city,
                  destinationLat: data.lat,
                  destinationLng: data.lng,
                }));
                setQuote(null);
                setPaymentMethod(null);
              }}
              style={inputStyle}
            />
          </div>
          {form.destinationCity && (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              City: <span className="text-white">{form.destinationCity}</span>
            </p>
          )}
        </div>

        {/* Quote */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Delivery Quote</h2>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                R15 per km · R50 minimum
              </p>
            </div>
            <Button
              type="button"
              onClick={handleGetQuote}
              disabled={quoting}
              style={{
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              {quoting && <Loader2 size={16} className="animate-spin mr-2" />}
              {quoting ? "Calculating..." : "Get Quote"}
            </Button>
          </div>

          {quote && (
            <div
              className="rounded-xl p-5 space-y-3"
              style={{
                background: "rgba(200,146,42,0.08)",
                border: "1px solid rgba(200,146,42,0.3)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={18} style={{ color: "var(--gold)" }} />
                  <span className="text-white font-medium">{quote.distanceKm} km</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: "var(--gold)" }}>
                  R{quote.deliveryFee}
                </span>
              </div>
              <div
                className="pt-3 space-y-1.5"
                style={{ borderTop: "1px solid rgba(200,146,42,0.2)" }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>Driver (80%)</span>
                  <span className="text-white">R{quote.driverPayout}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>Platform (20%)</span>
                  <span className="text-white">R{quote.platformFee}</span>
                </div>
              </div>
            </div>
          )}

          {!quote && (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Select both addresses above then click Get Quote.
            </p>
          )}
        </div>

        {/* Payment Method — only show after quote */}
        {quote && (
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-lg font-semibold text-white">Payment Method</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Choose how you'll pay for this delivery
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className="flex flex-col items-center gap-3 p-4 rounded-xl transition"
                style={{
                  background:
                    paymentMethod === "CASH"
                      ? "rgba(16,185,129,0.15)"
                      : "var(--background)",
                  border:
                    paymentMethod === "CASH"
                      ? "2px solid #10b981"
                      : "2px solid var(--border)",
                }}
              >
                <Banknote
                  size={28}
                  style={{ color: paymentMethod === "CASH" ? "#10b981" : "var(--muted-foreground)" }}
                />
                <div className="text-center">
                  <p className="font-semibold text-white">Cash</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    Pay driver on delivery
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className="flex flex-col items-center gap-3 p-4 rounded-xl transition"
                style={{
                  background:
                    paymentMethod === "CARD"
                      ? "rgba(200,146,42,0.15)"
                      : "var(--background)",
                  border:
                    paymentMethod === "CARD"
                      ? "2px solid var(--gold)"
                      : "2px solid var(--border)",
                }}
              >
                <CreditCard
                  size={28}
                  style={{ color: paymentMethod === "CARD" ? "var(--gold)" : "var(--muted-foreground)" }}
                />
                <div className="text-center">
                  <p className="font-semibold text-white">Card</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    Pay now via PayFast
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Package Details */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Package Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white">Weight (kg)</Label>
              <Input
                type="number"
                placeholder="1.5"
                value={form.weightKg}
                onChange={(e) => update("weightKg", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Declared Value (R)</Label>
              <Input
                type="number"
                placeholder="500"
                value={form.declaredValue}
                onChange={(e) => update("declaredValue", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Service Level</Label>
              <Select
                value={form.serviceLevel}
                onValueChange={(v) => update("serviceLevel", v)}
              >
                <SelectTrigger style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ECONOMY">Economy</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="EXPRESS">Express</SelectItem>
                  <SelectItem value="SAME_DAY">Same Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label className="text-white">Notes</Label>
              <Textarea
                placeholder="Any special instructions..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                style={inputStyle}
                rows={3}
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !quote || !paymentMethod}
          className="w-full h-12 font-semibold text-white text-base"
          style={{
            background: quote && paymentMethod ? "var(--gold)" : "var(--muted)",
            opacity: !quote || !paymentMethod ? 0.6 : 1,
          }}
        >
          {loading && <Loader2 size={18} className="animate-spin mr-2" />}
          {!quote
            ? "Get a quote first"
            : !paymentMethod
            ? "Select payment method"
            : paymentMethod === "CASH"
            ? `Place Order — R${quote.deliveryFee} (Cash)`
            : `Place Order & Pay — R${quote.deliveryFee}`}
        </Button>
      </form>
    </div>
  );
}