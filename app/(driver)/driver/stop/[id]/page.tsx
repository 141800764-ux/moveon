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

  async function updateStop(status: "COMPLETED" | "FAILED") {
    if (status === "COMPLETED" && !photo) {
      toast.error("Please take a proof of delivery photo");
      return;
    }

    setUpdating(true);
    try {
      // Upload photo first
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
          ? "Delivery confirmed!"
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

  function openNavigation() {
    if (!stop) return;
    const address = stop.address as any;
    const query = encodeURIComponent(
      `${address?.address}, ${address?.city}`
    );
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`,
      "_blank"
    );
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
      <div className="py-20 text-center">
        <p style={{ color: "var(--muted-foreground)" }}>Stop not found.</p>
      </div>
    );
  }

  const address = stop.address as any;

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

      {/* Address */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-white font-semibold text-lg">{address?.address}</p>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          {address?.city}
        </p>
        {stop.contactName && (
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            {stop.contactName}{" "}
            {stop.contactPhone && `· ${stop.contactPhone}`}
          </p>
        )}

        {stop.shipment?.order?.driverPayout != null && (
          <div
            className="mt-3 pt-3 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              You'll earn
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: "var(--gold)" }}
            >
              R{Number(stop.shipment.order.driverPayout).toFixed(2)}
            </span>
          </div>
        )}

        <Button
          onClick={openNavigation}
          className="mt-4 w-full font-semibold text-white flex items-center gap-2"
          style={{ background: "var(--gold)" }}
        >
          <Navigation size={16} />
          Navigate
        </Button>
      </div>

      {/* Actions */}
      {stop.status === "PENDING" && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2 className="font-semibold text-white">Update Stop</h2>

          {/* Photo capture */}
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
      )}

      {stop.status !== "PENDING" && (
        <div
          className="rounded-2xl p-5 text-center space-y-3"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="font-semibold"
            style={{
              color: stop.status === "COMPLETED" ? "#10b981" : "#ef4444",
            }}
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
            <p
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {stop.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}