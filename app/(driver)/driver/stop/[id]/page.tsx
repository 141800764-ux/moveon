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
        // If this is already a DELIVERY type stop (not pickup), skip to delivery step
        if (data.stop?.type === "DELIVERY") {
          setPickedUp(true);
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

  function openNavigation(lat?: number, lng?: number, address?: string, city?: string) {
    if (lat && lng && lat !== 0 && lng !== 0) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
        "_blank"
      );
    } else if (address || city) {
      const query = encodeURIComponent(
        `${address || ""} ${city || ""} South Africa`.trim()
      );
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`,
        "_blank"
      );
    }
  }

  function navigateToPickup() {
    const order = stop?.shipment?.order;
    const origin = order?.origin as any;
    openNavigation(
      order?.originLat,
      order?.originLng,
      origin?.address,
      origin?.city
    );
  }

  function navigateToDelivery() {
    const addr = stop?.address as any;
    openNavigation(
      stop?.latitude,
      stop?.longitude,
      addr?.address,
      addr?.city
    );
  }

  async function markPickupStop() {
    // If this is a PICKUP type stop, mark it complete and go to delivery
    if (stop?.type === "PICKUP") {
      setUpdating(true);
      try {
        await fetch(`/api/stops/${params.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETED",
            actualArrivalAt: new Date().toISOString(),
            notes: "Package collected",
          }),
        });
        // Go back to driver home to see next stop
        toast.success("Package collected! Proceed to delivery stop.");
        router.push("/driver");
      } catch {
        toast.error("Something went wrong");
      } finally {
        setUpdating(false);
      }
    } else {
      // If it's a single DELIVERY stop, just show the delivery flow
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
      <div className="py-20 text-center space-y-3">
        <p className="text-white font-semibold">Stop not found</p>
        <Link href="/driver">
          <Button style={{ background: "var(--gold)" }} className="text-white">
            Back to route
          </Button>
        </Link>
      </div>
    );
  }

  const stopAddress = stop.address as any;
  const order = stop.shipment?.order;
  const origin = order?.origin as any;
  const payment = order?.payment;
  const isPickupStop = stop.type === "PICKUP";
  const isDeliveryStop = stop.type === "DELIVERY";

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
            className="text-sm mt-0.5 uppercase font-semibold"
            style={{ color: "var(--gold)" }}
          >
            {stop.type}
          </p>
        </div>
      </div>

      {/* Step indicator — only show for DELIVERY stops that need pickup first */}
      {isDeliveryStop && stop.status === "PENDING" && (
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
                background: pickedUp ? "#10b981" : "var(--gold)",
                color: "white",
              }}
            >
              {pickedUp ? "✓" : "1"}
            </div>
            <p
              className="text-sm font-medium"
              style={{
                color: pickedUp ? "#10b981" : "var(--gold)",
              }}
            >
              Pickup package
            </p>
          </div>
          <div
            className="w-8 h-0.5 shrink-0"
            style={{ background: pickedUp ? "#10b981" : "var(--border)" }}
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
                color: pickedUp
                  ? "#10b981"
                  : "var(--muted-foreground)",
              }}
            >
              Deliver
            </p>
          </div>
        </div>
      )}

      {/* PICKUP STOP */}
      {isPickupStop && stop.status === "PENDING" && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Package size={18} style={{ color: "var(--gold)" }} />
            <h2 className="font-semibold text-white">Pickup Address</h2>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: "var(--background)" }}
          >
            <p className="text-white font-semibold text-lg">
              {stopAddress?.address}
            </p>
            <p style={{ color: "var(--muted-foreground)" }}>
              {stopAddress?.city}
            </p>
          </div>

          {order && (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{
                background: "rgba(200,146,42,0.08)",
                border: "1px solid rgba(200,146,42,0.2)",
              }}
            >
              <div className="flex justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Delivering to
                </span>
                <span className="text-white text-sm font-medium">
                  {order.recipientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Your earnings
                </span>
                <span
                  className="font-bold"
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
                className="font-bold text-sm mb-2"
                style={{
                  color:
                    payment.method === "CASH" ? "#ef4444" : "#10b981",
                }}
              >
                {payment.method === "CASH"
                  ? "💵 CASH COLLECTION REQUIRED"
                  : "💳 CARD PAYMENT — Already Paid"}
              </p>
              {payment.method === "CASH" ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Collect from recipient
                    </span>
                    <span className="text-white font-bold">
                      R{Number(order?.deliveryFee ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Return to office
                    </span>
                    <span style={{ color: "#ef4444" }}>
                      R{Number(order?.platformFee ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>
                      You keep
                    </span>
                    <span style={{ color: "var(--gold)" }}>
                      R{Number(order?.driverPayout ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Return to office
                    </span>
                    <span style={{ color: "#ef4444" }}>
                      R{Number(order?.platformFee ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Weekly payout to you
                    </span>
                    <span style={{ color: "var(--gold)" }}>
                      R{Number(order?.driverPayout ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={navigateToPickup}
            className="w-full font-semibold text-white flex items-center gap-2"
            style={{ background: "var(--gold)" }}
          >
            <Navigation size={16} />
            Navigate to Pickup
          </Button>

          <Button
            onClick={markPickupStop}
            disabled={updating}
            className="w-full font-semibold text-white flex items-center gap-2"
            style={{ background: "#3b82f6" }}
          >
            {updating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Package size={16} />
            )}
            Package Collected — Go to Delivery
          </Button>
        </div>
      )}

      {/* DELIVERY STOP — Step 1: Pickup phase */}
      {isDeliveryStop && !pickedUp && stop.status === "PENDING" && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Package size={18} style={{ color: "var(--gold)" }} />
            <h2 className="font-semibold text-white">
              Step 1 — Pickup Package
            </h2>
          </div>

          {/* Pickup address from order origin */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--background)" }}
          >
            <p
              className="text-xs font-semibold uppercase mb-2"
              style={{ color: "var(--gold)" }}
            >
              Pickup Address
            </p>
            {origin ? (
              <>
                <p className="text-white font-semibold">
                  {origin?.address}
                </p>
                <p style={{ color: "var(--muted-foreground)" }}>
                  {origin?.city}
                </p>
              </>
            ) : (
              <p style={{ color: "var(--muted-foreground)" }}>
                No pickup address on file
              </p>
            )}
          </div>

          {/* Earnings */}
          {order?.driverPayout != null && (
            <div
              className="flex justify-between items-center p-3 rounded-xl"
              style={{
                background: "rgba(200,146,42,0.08)",
                border: "1px solid rgba(200,146,42,0.2)",
              }}
            >
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
                R{Number(order.driverPayout).toFixed(2)}
              </span>
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
                className="font-bold text-sm mb-2"
                style={{
                  color:
                    payment.method === "CASH" ? "#ef4444" : "#10b981",
                }}
              >
                {payment.method === "CASH"
                  ? "💵 CASH — Collect from recipient"
                  : "💳 CARD — Already paid"}
              </p>
              <div className="space-y-1 text-sm">
                {payment.method === "CASH" && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Collect
                    </span>
                    <span className="text-white font-bold">
                      R{Number(order?.deliveryFee ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>
                    Return to office (20%)
                  </span>
                  <span style={{ color: "#ef4444" }}>
                    R{Number(order?.platformFee ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>
                    You keep (80%)
                  </span>
                  <span style={{ color: "var(--gold)" }}>
                    R{Number(order?.driverPayout ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={navigateToPickup}
            className="w-full font-semibold text-white flex items-center gap-2"
            style={{ background: "var(--gold)" }}
          >
            <Navigation size={16} />
            Navigate to Pickup Address
          </Button>

          <Button
            onClick={() => setPickedUp(true)}
            className="w-full font-semibold text-white flex items-center gap-2"
            style={{ background: "#3b82f6" }}
          >
            <Package size={16} />
            Package Collected — Proceed to Delivery
          </Button>
        </div>
      )}

      {/* DELIVERY STOP — Step 2: Delivery phase */}
      {isDeliveryStop && pickedUp && stop.status === "PENDING" && (
        <div className="space-y-4">
          {/* Delivery address */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
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
                className="text-xs font-semibold uppercase mb-2"
                style={{ color: "#10b981" }}
              >
                Delivery Address
              </p>
              <p className="text-white font-semibold">
                {stopAddress?.address}
              </p>
              <p style={{ color: "var(--muted-foreground)" }}>
                {stopAddress?.city}
              </p>
              {stop.contactName && (
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {stop.contactName}
                  {stop.contactPhone && ` · ${stop.contactPhone}`}
                </p>
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
                  ⚠️ Collect R{Number(order?.deliveryFee ?? 0).toFixed(2)} cash from{" "}
                  {order?.recipientName}
                </p>
              </div>
            )}

            <Button
              onClick={navigateToDelivery}
              className="w-full font-semibold text-white flex items-center gap-2"
              style={{ background: "#10b981" }}
            >
              <Navigation size={16} />
              Navigate to Delivery Address
            </Button>

            <button
              onClick={() => setPickedUp(false)}
              className="w-full text-sm text-center py-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              ← Back to pickup step
            </button>
          </div>

          {/* Delivery confirmation */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
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

            {/* Action buttons */}
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

      {/* Completed or Failed state */}
      {stop.status !== "PENDING" && (
        <div
          className="rounded-2xl p-6 text-center space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
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
              <CheckCircle size={32} style={{ color: "#10b981" }} />
            ) : (
              <XCircle size={32} style={{ color: "#ef4444" }} />
            )}
          </div>
          <p
            className="font-bold text-xl"
            style={{
              color:
                stop.status === "COMPLETED" ? "#10b981" : "#ef4444",
            }}
          >
            {stop.status === "COMPLETED" ? "Delivered!" : "Failed"}
          </p>
          {stop.podPhotoUrl && (
            <img
              src={stop.podPhotoUrl}
              alt="Proof of delivery"
              className="w-full h-48 object-cover rounded-xl"
            />
          )}
          {stop.notes && (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {stop.notes}
            </p>
          )}
          <Link href="/driver">
            <Button
              className="w-full font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              Back to Route
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}