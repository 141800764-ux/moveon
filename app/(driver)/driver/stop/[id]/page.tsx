"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, XCircle, Navigation,
  Loader2, Camera, X, Package, MapPin,
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
        // If this is a DELIVERY stop, show pickup step first
        // If this is a PICKUP stop, show pickup UI directly
        if (data.stop?.type === "PICKUP") {
          setPickedUp(false);
        }
      })
      .catch(() => setLoading(false));
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

  function openNavigation(
    lat: number | null | undefined,
    lng: number | null | undefined,
    address: string | undefined,
    city: string | undefined
  ) {
    // Use coordinates if available and valid
    if (lat && lng && Math.abs(lat) > 0.001 && Math.abs(lng) > 0.001) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
        "_blank"
      );
    } else {
      // Fall back to address text search
      const query = encodeURIComponent(
        `${address || ""} ${city || ""} South Africa`.trim()
      );
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`,
        "_blank"
      );
    }
  }

  async function handlePickupComplete() {
    // Mark the PICKUP stop as completed and go back to route
    if (stop?.type === "PICKUP") {
      setUpdating(true);
      try {
        const res = await fetch(`/api/stops/${params.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETED",
            actualArrivalAt: new Date().toISOString(),
            notes: "Package collected from sender",
          }),
        });
        if (!res.ok) {
          toast.error("Failed to confirm pickup");
          return;
        }
        toast.success("Package collected! Check your route for the delivery stop.");
        router.push("/driver");
        router.refresh();
      } catch {
        toast.error("Something went wrong");
      } finally {
        setUpdating(false);
      }
    } else {
      // DELIVERY stop — just advance to delivery step
      setPickedUp(true);
    }
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
        status === "COMPLETED"
          ? "Delivery confirmed! Well done!"
          : "Stop marked as failed"
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
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: "var(--gold)" }}
        />
      </div>
    );
  }

  if (!stop) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-white font-semibold">Stop not found</p>
        <Link href="/driver">
          <Button
            className="font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            Back to Route
          </Button>
        </Link>
      </div>
    );
  }

  const stopAddress = stop.address as any;
  const order = stop.shipment?.order;
  const origin = order?.origin as any;
  const destination = order?.destination as any;
  const payment = order?.payment;
  const isPickupStop = stop.type === "PICKUP";
  const isDeliveryStop = stop.type === "DELIVERY";

  // For DELIVERY stops — pickup address comes from order.origin
  // For PICKUP stops — the stop address IS the pickup address
  const pickupAddress = isPickupStop
    ? stopAddress
    : origin;
  const pickupLat = isPickupStop
    ? stop.latitude
    : order?.originLat;
  const pickupLng = isPickupStop
    ? stop.longitude
    : order?.originLng;

  // Delivery address
  const deliveryAddress = isDeliveryStop
    ? stopAddress
    : destination;
  const deliveryLat = isDeliveryStop
    ? stop.latitude
    : order?.destinationLat;
  const deliveryLng = isDeliveryStop
    ? stop.longitude
    : order?.destinationLng;

  return (
    <div className="space-y-5 py-8">
      {/* Header */}
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
          <h1 className="text-2xl font-bold text-white">
            Stop {stop.sequence}
          </h1>
          <p
            className="text-sm mt-0.5 font-semibold uppercase tracking-wider"
            style={{ color: "var(--gold)" }}
          >
            {stop.type}
          </p>
        </div>
      </div>

      {/* Progress steps — show for all pending stops */}
      {stop.status === "PENDING" && (
        <div className="flex items-center gap-2">
          <div
            className="flex-1 flex items-center gap-2 p-3 rounded-xl"
            style={{
              background: !pickedUp
                ? "rgba(200,146,42,0.15)"
                : "rgba(16,185,129,0.1)",
              border: !pickedUp
                ? "1px solid rgba(200,146,42,0.4)"
                : "1px solid rgba(16,185,129,0.3)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: !pickedUp ? "var(--gold)" : "#10b981",
                color: "white",
              }}
            >
              {pickedUp ? "✓" : "1"}
            </div>
            <p
              className="text-sm font-medium"
              style={{
                color: !pickedUp ? "var(--gold)" : "#10b981",
              }}
            >
              Pickup
            </p>
          </div>
          <div
            className="w-6 h-0.5 shrink-0"
            style={{
              background: pickedUp ? "#10b981" : "var(--border)",
            }}
          />
          <div
            className="flex-1 flex items-center gap-2 p-3 rounded-xl"
            style={{
              background: pickedUp
                ? "rgba(16,185,129,0.15)"
                : "var(--card)",
              border: pickedUp
                ? "1px solid rgba(16,185,129,0.4)"
                : "1px solid var(--border)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: pickedUp ? "#10b981" : "var(--muted)",
                color: "white",
              }}
            >
              2
            </div>
            <p
              className="text-sm font-medium"
              style={{
                color: pickedUp ? "#10b981" : "var(--muted-foreground)",
              }}
            >
              Deliver
            </p>
          </div>
        </div>
      )}

      {/* ===== STEP 1: PICKUP ===== */}
      {stop.status === "PENDING" && !pickedUp && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Package size={18} style={{ color: "var(--gold)" }} />
            <h2 className="font-semibold text-white">
              {isPickupStop ? "Pickup Package" : "Step 1 — Collect Package"}
            </h2>
          </div>

          {/* Pickup address */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--background)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--gold)" }}
            >
              📍 Pickup Address
            </p>
            {pickupAddress ? (
              <>
                <p className="text-white font-semibold text-base">
                  {pickupAddress?.address || "Address not available"}
                </p>
                <p
                  className="mt-0.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {pickupAddress?.city || ""}
                </p>
              </>
            ) : (
              <p style={{ color: "var(--muted-foreground)" }}>
                No pickup address available
              </p>
            )}
          </div>

          {/* Order summary */}
          {order && (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{
                background: "rgba(200,146,42,0.08)",
                border: "1px solid rgba(200,146,42,0.2)",
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Delivering to
                </span>
                <span className="text-white font-medium text-sm">
                  {order.recipientName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Your earnings
                </span>
                <span
                  className="font-bold text-lg"
                  style={{ color: "var(--gold)" }}
                >
                  R{Number(order.driverPayout ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Payment info */}
          {payment && (
            <div
              className="rounded-xl p-4"
              style={{
                background:
                  payment.method === "CASH"
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(16,185,129,0.08)",
                border:
                  payment.method === "CASH"
                    ? "1px solid rgba(239,68,68,0.3)"
                    : "1px solid rgba(16,185,129,0.3)",
              }}
            >
              <p
                className="font-bold text-sm mb-3"
                style={{
                  color: payment.method === "CASH" ? "#ef4444" : "#10b981",
                }}
              >
                {payment.method === "CASH"
                  ? "💵 CASH — Collect from recipient"
                  : "💳 CARD — Already paid online"}
              </p>
              <div className="space-y-1.5">
                {payment.method === "CASH" && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Total to collect
                    </span>
                    <span className="text-white font-bold">
                      R{Number(order?.deliveryFee ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>
                    Return to office (20%)
                  </span>
                  <span style={{ color: "#ef4444" }}>
                    R{Number(order?.platformFee ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>
                    {payment.method === "CASH"
                      ? "You keep (80%)"
                      : "Weekly payout (80%)"}
                  </span>
                  <span style={{ color: "var(--gold)" }}>
                    R{Number(order?.driverPayout ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigate to pickup */}
          <Button
            onClick={() =>
              openNavigation(
                pickupLat,
                pickupLng,
                pickupAddress?.address,
                pickupAddress?.city
              )
            }
            className="w-full font-semibold text-white flex items-center gap-2"
            style={{ background: "var(--gold)" }}
          >
            <Navigation size={16} />
            Navigate to Pickup Address
          </Button>

          {/* Confirm collected */}
          <Button
            onClick={handlePickupComplete}
            disabled={updating}
            className="w-full font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: "#3b82f6" }}
          >
            {updating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Package size={16} />
            )}
            {updating
              ? "Confirming..."
              : "Package Collected — Proceed to Delivery"}
          </Button>
        </div>
      )}

      {/* ===== STEP 2: DELIVERY ===== */}
      {stop.status === "PENDING" && pickedUp && isDeliveryStop && (
        <div className="space-y-4">
          {/* Delivery address card */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2">
              <MapPin size={18} style={{ color: "#10b981" }} />
              <h2 className="font-semibold text-white">
                Step 2 — Deliver Package
              </h2>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: "var(--background)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "#10b981" }}
              >
                📦 Delivery Address
              </p>
              <p className="text-white font-semibold text-base">
                {deliveryAddress?.address || stopAddress?.address}
              </p>
              <p
                className="mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {deliveryAddress?.city || stopAddress?.city}
              </p>
              {stop.contactName && (
                <div
                  className="mt-2 pt-2"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <p
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {stop.contactName}
                    {stop.contactPhone && ` · ${stop.contactPhone}`}
                  </p>
                </div>
              )}
            </div>

            {/* Cash reminder */}
            {payment?.method === "CASH" && (
              <div
                className="rounded-xl p-3"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#ef4444" }}
                >
                  ⚠️ Collect R{Number(order?.deliveryFee ?? 0).toFixed(2)}{" "}
                  cash from {order?.recipientName}
                </p>
              </div>
            )}

            <Button
              onClick={() =>
                openNavigation(
                  deliveryLat,
                  deliveryLng,
                  deliveryAddress?.address || stopAddress?.address,
                  deliveryAddress?.city || stopAddress?.city
                )
              }
              className="w-full font-semibold text-white flex items-center gap-2"
              style={{ background: "#10b981" }}
            >
              <Navigation size={16} />
              Navigate to Delivery Address
            </Button>

            <button
              onClick={() => setPickedUp(false)}
              className="w-full text-sm text-center py-2 hover:opacity-80 transition"
              style={{ color: "var(--muted-foreground)" }}
            >
              ← Back to pickup step
            </button>
          </div>

          {/* Delivery confirmation */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2 className="font-semibold text-white">Confirm Delivery</h2>

            {/* POD Photo */}
            <div className="space-y-1.5">
              <Label className="text-white">
                Proof of Delivery Photo *
              </Label>
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="POD"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.7)" }}
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2 transition hover:opacity-80"
                  style={{
                    background: "var(--background)",
                    border: "2px dashed var(--border)",
                  }}
                >
                  <Camera
                    size={28}
                    style={{ color: "var(--muted-foreground)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Tap to take or upload photo
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

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-white">Notes</Label>
              <Textarea
                placeholder="Any delivery notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={inputStyle}
                rows={2}
              />
            </div>

            {/* Failure reason */}
            <div className="space-y-1.5">
              <Label className="text-white">
                Failure Reason (if failed)
              </Label>
              <Textarea
                placeholder="Recipient not home, wrong address..."
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                style={inputStyle}
                rows={2}
              />
            </div>

            {/* Delivered / Failed buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => updateStop("COMPLETED")}
                disabled={updating}
                className="w-full font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: "#10b981" }}
              >
                {updating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Delivered
              </Button>
              <Button
                onClick={() => updateStop("FAILED")}
                disabled={updating}
                className="w-full font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: "#ef4444" }}
              >
                {updating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Failed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== COMPLETED / FAILED STATE ===== */}
      {stop.status !== "PENDING" && (
        <div
          className="rounded-2xl p-6 text-center space-y-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{
              background:
                stop.status === "COMPLETED"
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(239,68,68,0.15)",
            }}
          >
            {stop.status === "COMPLETED" ? (
              <CheckCircle size={36} style={{ color: "#10b981" }} />
            ) : (
              <XCircle size={36} style={{ color: "#ef4444" }} />
            )}
          </div>

          <div>
            <p
              className="font-bold text-xl"
              style={{
                color:
                  stop.status === "COMPLETED" ? "#10b981" : "#ef4444",
              }}
            >
              {stop.status === "COMPLETED"
                ? stop.type === "PICKUP"
                  ? "Package Collected!"
                  : "Delivered!"
                : "Failed"}
            </p>
            {stop.type === "PICKUP" &&
              stop.status === "COMPLETED" && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Proceed to the delivery stop
                </p>
              )}
          </div>

          {stop.podPhotoUrl && (
            <img
              src={stop.podPhotoUrl}
              alt="Proof of delivery"
              className="w-full h-48 object-cover rounded-xl"
            />
          )}

          {stop.notes && (
            <p
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {stop.notes}
            </p>
          )}

          <Link href="/driver">
            <Button
              className="w-full font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              {stop.type === "PICKUP" && stop.status === "COMPLETED"
                ? "Go to Delivery Stop →"
                : "Back to Route"}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}