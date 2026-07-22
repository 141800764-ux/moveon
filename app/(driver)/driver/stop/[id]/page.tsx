"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Navigation,
  Loader2,
  Camera,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function StopDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [stop, setStop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pickedUp, setPickedUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/stops/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setStop(data.stop);
        setLoading(false);
      });
  }, [params.id]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(stopId: string): Promise<string | null> {
    if (!photo) return null;
    try {
      const formData = new FormData();
      formData.append("photo", photo);
      const res = await fetch(`/api/stops/${stopId}/pod`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.url ?? null;
    } catch {
      return null;
    }
  }

  function openNavigationToPickup() {
    if (!stop) return;
    const order = stop.shipment?.order;
    if (!order) return;
    const origin = order.origin as any;
    const query = encodeURIComponent(
      `${origin?.address || ""}, ${origin?.city || ""}, South Africa`
    );
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`,
      "_blank"
    );
  }

  function openNavigationToDropoff() {
    if (!stop) return;
    const address = stop.address as any;
    const query = encodeURIComponent(
      `${address?.address || ""}, ${address?.city || ""}, South Africa`
    );
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`,
      "_blank"
    );
  }

  async function updateStop(status: "COMPLETED" | "FAILED") {
    if (status === "COMPLETED" && !photo) {
      toast.error("Please take a proof of delivery photo");
      return;
    }

    setUpdating(true);
    try {
      const photoUrl = await uploadPhoto(params.id as string);

      const res = await fetch(`/api/stops/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes,
          failureReason: status === "FAILED" ? failureReason : null,
          actualArrivalAt: new Date().toISOString(),
          podPhotoUrl: photoUrl,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to update stop");
        return;
      }

      toast.success(
        status === "COMPLETED" ? "Delivery confirmed!" : "Stop marked as failed"
      );
      router.push("/driver");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdating(false);
    }
  }

  const inputStyle = {
    background: "var(--input)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  if (!stop) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: "var(--muted-foreground)" }}>Stop not found.</p>
      </div>
    );
  }

  const address = stop.address as any;
  const order = stop.shipment?.order;
  const origin = order?.origin as any;

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center gap-4">
        <Link href="/driver">
          <button
            className="p-2 rounded-xl transition hover:bg-white/5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Stop {stop.sequence}</h1>
          <p className="text-sm mt-0.5 uppercase font-semibold" style={{ color: "var(--gold)" }}>
            {stop.type}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      {stop.status === "PENDING" && (
        <div className="flex items-center gap-3">
          <div
            className="flex-1 flex items-center gap-2 p-3 rounded-xl"
            style={{
              background: !pickedUp ? "rgba(200,146,42,0.15)" : "var(--card)",
              border: !pickedUp ? "1px solid rgba(200,146,42,0.4)" : "1px solid var(--border)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: !pickedUp ? "var(--gold)" : "var(--muted)", color: "white" }}
            >
              1
            </div>
            <p className="text-sm font-medium" style={{ color: !pickedUp ? "var(--gold)" : "var(--muted-foreground)" }}>
              Pickup
            </p>
          </div>
          <div className="w-6 h-0.5" style={{ background: "var(--border)" }} />
          <div
            className="flex-1 flex items-center gap-2 p-3 rounded-xl"
            style={{
              background: pickedUp ? "rgba(16,185,129,0.15)" : "var(--card)",
              border: pickedUp ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--border)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: pickedUp ? "#10b981" : "var(--muted)", color: "white" }}
            >
              2
            </div>
            <p className="text-sm font-medium" style={{ color: pickedUp ? "#10b981" : "var(--muted-foreground)" }}>
              Deliver
            </p>
          </div>
        </div>
      )}

      {/* Pickup step */}
      {!pickedUp && stop.status === "PENDING" && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} style={{ color: "var(--gold)" }} />
            <p className="font-semibold text-white">Step 1 — Pickup Package</p>
          </div>

          {origin ? (
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--background)" }}
            >
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--gold)" }}>
                Pickup Address
              </p>
              <p className="text-white font-medium">{origin?.address}</p>
              <p style={{ color: "var(--muted-foreground)" }}>{origin?.city}</p>
            </div>
          ) : (
            <div className="rounded-xl p-4" style={{ background: "var(--background)" }}>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--gold)" }}>
                Delivery Address
              </p>
              <p className="text-white font-medium">{address?.address}</p>
              <p style={{ color: "var(--muted-foreground)" }}>{address?.city}</p>
            </div>
          )}

          {stop.shipment?.order?.driverPayout != null && (
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "rgba(200,146,42,0.08)", border: "1px solid rgba(200,146,42,0.2)" }}
            >
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                You'll earn
              </span>
              <span className="text-lg font-bold" style={{ color: "var(--gold)" }}>
                R{Number(stop.shipment.order.driverPayout).toFixed(2)}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {origin && (
              <Button
                onClick={openNavigationToPickup}
                className="w-full font-semibold text-white flex items-center gap-2"
                style={{ background: "var(--gold)" }}
              >
                <Navigation size={16} />
                Navigate to Pickup
              </Button>
            )}
            <Button
              onClick={() => setPickedUp(true)}
              className="w-full font-semibold text-white flex items-center gap-2"
              style={{ background: "#3b82f6" }}
            >
              <Package size={16} />
              Package Collected — Go to Delivery
            </Button>
          </div>
        </div>
      )}
      {/* Payment info */}
{stop.shipment?.order?.payment && (
  <div
    className="rounded-xl p-4 space-y-2"
    style={{
      background: stop.shipment.order.payment.method === "CASH"
        ? "rgba(239,68,68,0.1)"
        : "rgba(16,185,129,0.1)",
      border: stop.shipment.order.payment.method === "CASH"
        ? "1px solid rgba(239,68,68,0.4)"
        : "1px solid rgba(16,185,129,0.4)",
    }}
  >
    <div className="flex items-center justify-between">
      <p
        className="font-bold text-sm"
        style={{
          color: stop.shipment.order.payment.method === "CASH"
            ? "#ef4444"
            : "#10b981",
        }}
      >
        {stop.shipment.order.payment.method === "CASH"
          ? "💵 CASH PAYMENT"
          : "💳 CARD PAYMENT"}
      </p>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: stop.shipment.order.payment.status === "PAID"
            ? "rgba(16,185,129,0.2)"
            : "rgba(234,179,8,0.2)",
          color: stop.shipment.order.payment.status === "PAID"
            ? "#10b981"
            : "#eab308",
        }}
      >
        {stop.shipment.order.payment.status}
      </span>
    </div>

    {stop.shipment.order.payment.method === "CASH" ? (
      <div className="space-y-1">
        <p className="text-white text-sm font-semibold">
          ⚠️ Collect R{Number(stop.shipment.order.deliveryFee ?? 0).toFixed(2)} cash from recipient
        </p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Return R{Number(stop.shipment.order.platformFee ?? 0).toFixed(2)} (20%) to the office after delivery.
          You keep R{Number(stop.shipment.order.driverPayout ?? 0).toFixed(2)} (80%).
        </p>
      </div>
    ) : (
      <div className="space-y-1">
        <p className="text-white text-sm">
          ✓ Customer paid by card
        </p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Return R{Number(stop.shipment.order.platformFee ?? 0).toFixed(2)} (20%) to the office.
          R{Number(stop.shipment.order.driverPayout ?? 0).toFixed(2)} will be paid to you weekly.
        </p>
      </div>
    )}
  </div>
)}

      {/* Delivery step */}
      {pickedUp && stop.status === "PENDING" && (
        <div className="space-y-4">
          {/* Delivery address */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Navigation size={16} style={{ color: "#10b981" }} />
              <p className="font-semibold text-white">Step 2 — Deliver Package</p>
            </div>
            <p className="text-white font-semibold text-lg">{address?.address}</p>
            <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
              {address?.city}
            </p>
            {stop.contactName && (
              <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                {stop.contactName} {stop.contactPhone && `· ${stop.contactPhone}`}
              </p>
            )}
            <Button
              onClick={openNavigationToDropoff}
              className="mt-4 w-full font-semibold text-white flex items-center gap-2"
              style={{ background: "#10b981" }}
            >
              <Navigation size={16} />
              Navigate to Delivery
            </Button>
          </div>

          {/* Actions */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="font-semibold text-white">Confirm Delivery</h2>

            {/* Photo capture */}
            <div className="space-y-1.5">
              <Label className="text-white">Proof of Delivery Photo *</Label>
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="POD"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2 transition hover:bg-white/5"
                  style={{ background: "var(--background)", border: "2px dashed var(--border)" }}
                >
                  <Camera size={28} style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Take or upload a photo
                  </p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white">Notes</Label>
              <Textarea
                placeholder="Any notes about this delivery..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={inputStyle}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white">Failure Reason (if failed)</Label>
              <Textarea
                placeholder="Recipient not home, wrong address..."
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                style={inputStyle}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => updateStop("COMPLETED")}
                disabled={updating}
                className="w-full font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: "#10b981" }}
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Delivered
              </Button>
              <Button
                onClick={() => updateStop("FAILED")}
                disabled={updating}
                className="w-full font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: "#ef4444" }}
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Failed
              </Button>
            </div>

            <button
              onClick={() => setPickedUp(false)}
              className="w-full text-sm text-center"
              style={{ color: "var(--muted-foreground)" }}
            >
              ← Back to pickup
            </button>
          </div>
        </div>
      )}

      {/* Completed/Failed state */}
      {stop.status !== "PENDING" && (
        <div
          className="rounded-2xl p-5 text-center space-y-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p
            className="font-semibold"
            style={{ color: stop.status === "COMPLETED" ? "#10b981" : "#ef4444" }}
          >
            This stop is {stop.status.toLowerCase()}
          </p>
          {stop.podPhotoUrl && (
            <img
              src={stop.podPhotoUrl}
              alt="Proof of delivery"
              className="w-full h-48 object-cover rounded-xl mx-auto"
            />
          )}
          {stop.notes && (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {stop.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}