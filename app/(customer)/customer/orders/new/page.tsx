"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
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

export default function CustomerNewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
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
  }

  const fetchQuote = useCallback(
    async (originLat: number, originLng: number, destinationLat: number, destinationLng: number) => {
      setQuoting(true);
      try {
        const res = await fetch("/api/orders/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ originLat, originLng, destinationLat, destinationLng }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Could not calculate a quote");
          return;
        }

        setQuote(data);
        toast.success(`Quote ready — R${data.deliveryFee} for ${data.distanceKm}km`);
      } catch {
        toast.error("Something went wrong getting the quote");
      } finally {
        setQuoting(false);
      }
    },
    []
  );

  function handleOriginSelect(data: { address: string; city: string; lat: number; lng: number }) {
    const updated = {
      ...form,
      originAddress: data.address,
      originCity: data.city,
      originLat: data.lat,
      originLng: data.lng,
    };
    setForm(updated);
    setQuote(null);

    if (updated.destinationLat) {
      fetchQuote(data.lat, data.lng, updated.destinationLat, updated.destinationLng);
    }
  }

  function handleDestinationSelect(data: { address: string; city: string; lat: number; lng: number }) {
    const updated = {
      ...form,
      destinationAddress: data.address,
      destinationCity: data.city,
      destinationLat: data.lat,
      destinationLng: data.lng,
    };
    setForm(updated);
    setQuote(null);

    if (updated.originLat) {
      fetchQuote(updated.originLat, updated.originLng, data.lat, data.lng);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!quote) {
      toast.error("Please select both pickup and delivery addresses to get a quote");
      return;
    }

    setLoading(true);

    try {
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
          driverPayout: quote.driverPayout,
          platformFee: quote.platformFee,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create order");
        return;
      }

      toast.success("Order placed successfully!");
      router.push("/customer/orders");
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
    <div className="max-w-2xl space-y-6 py-8">
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
          <h1 className="text-3xl font-bold text-white">Place Order</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Send a package anywhere in South Africa
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Recipient</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
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
            <div className="space-y-1.5">
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
          className="rounded-2xl p-6 space-y-4"
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
              }}
              onSelect={handleOriginSelect}
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
          className="rounded-2xl p-6 space-y-4"
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
              }}
              onSelect={handleDestinationSelect}
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
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-semibold text-white">Delivery Price</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              R15 per km, R50 minimum — calculated automatically
            </p>
          </div>

          {quoting && (
            <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Calculating price...</span>
            </div>
          )}

          {quote && !quoting && (
            <div
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: "rgba(200,146,42,0.1)", border: "1px solid rgba(200,146,42,0.3)" }}
            >
              <div className="flex items-center gap-3">
                <MapPin size={20} style={{ color: "var(--gold)" }} />
                <div>
                  <p className="text-white font-semibold">{quote.distanceKm} km</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Estimated distance
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: "var(--gold)" }}>
                  R{quote.deliveryFee}
                </p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Total delivery fee
                </p>
              </div>
            </div>
          )}

          {!quote && !quoting && (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Select both pickup and delivery addresses above — the price will appear automatically.
            </p>
          )}
        </div>

        {/* Package */}
        <div
          className="rounded-2xl p-6 space-y-4"
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
              <Label className="text-white">Value (R)</Label>
              <Input
                type="number"
                placeholder="500"
                value={form.declaredValue}
                onChange={(e) => update("declaredValue", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Service</Label>
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
          disabled={loading || !quote}
          className="w-full h-12 font-semibold text-white text-base"
          style={{ background: "var(--gold)" }}
        >
          {loading && <Loader2 size={18} className="animate-spin mr-2" />}
          {!quote ? "Select addresses to see price" : `Place Order — R${quote.deliveryFee}`}
        </Button>
      </form>
    </div>
  );
}