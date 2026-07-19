"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Camera, Upload, CheckCircle } from "lucide-react";
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

export default function DriverApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    licenseExpiresAt: "",
    licenseClasses: "EB",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleReg: "",
    vehicleType: "CAR",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    branchCode: "",
    accountType: "CHEQUE",
  });
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [idPhoto, setIdPhoto] = useState<string>("");
  const [vehiclePhoto, setVehiclePhoto] = useState<string>("");
  const [uploading, setUploading] = useState<string>("");

  useEffect(() => {
    fetch(`/api/driver-applications/${params.token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setApplication(data.application);
          setForm((p) => ({ ...p, email: data.application.email }));
        }
        setLoading(false);
      });
  }, [params.token]);

  async function uploadFile(file: File, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url || "";
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "id" | "vehicle"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    try {
      const url = await uploadFile(file, `driver-${type}`);
      if (type === "profile") setProfilePhoto(url);
      if (type === "id") setIdPhoto(url);
      if (type === "vehicle") setVehiclePhoto(url);
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!profilePhoto) {
      toast.error("Profile photo is required");
      return;
    }
    if (!idPhoto) {
      toast.error("ID document photo is required");
      return;
    }
    if (!vehiclePhoto) {
      toast.error("Vehicle photo is required");
      return;
    }

    const year = parseInt(form.vehicleYear);
    if (year < 2015) {
      toast.error("Vehicle must be 2015 or newer");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/driver-applications/${params.token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          licenseExpiresAt: new Date(form.licenseExpiresAt).toISOString(),
          licenseClasses: form.licenseClasses.split(",").map((c) => c.trim()),
          vehicleYear: year,
          profilePhotoUrl: profilePhoto,
          idPhotoUrl: idPhoto,
          vehiclePhotoUrl: vehiclePhoto,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to submit");
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#f5f5f5",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#c8922a" }} />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p style={{ color: "#a0a0a0" }}>This application link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-center space-y-4 p-8">
          <CheckCircle size={64} className="mx-auto" style={{ color: "#10b981" }} />
          <h1 className="text-2xl font-bold text-white">Application Submitted!</h1>
          <p style={{ color: "#a0a0a0" }}>
            Thank you for applying to drive with MoveOn. We'll review your application and get back to you shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#0a0a0a" }}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/images/MoveOnLogo.png" alt="MoveOn" width={48} height={48} className="rounded-xl" />
            <span className="text-2xl font-bold" style={{ color: "#c8922a" }}>MoveOn</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Driver Application</h1>
          <p style={{ color: "#a0a0a0" }}>Complete all fields to apply as a MoveOn driver</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111111", border: "1px solid #2a2a2a" }}>
            <h2 className="text-lg font-semibold text-white">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-white">Full Name *</Label>
                <Input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" required style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+27 82 000 0000" required style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Email</Label>
                <Input value={form.email} disabled style={{ ...inputStyle, opacity: 0.6 }} />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111111", border: "1px solid #2a2a2a" }}>
            <h2 className="text-lg font-semibold text-white">Required Photos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Profile Photo *", type: "profile" as const, value: profilePhoto },
                { label: "ID Document *", type: "id" as const, value: idPhoto },
                { label: "Vehicle Photo *", type: "vehicle" as const, value: vehiclePhoto },
              ].map((item) => (
                <div key={item.type} className="space-y-1.5">
                  <Label className="text-white text-sm">{item.label}</Label>
                  <label className="block cursor-pointer">
                    <div
                      className="h-32 rounded-xl flex flex-col items-center justify-center overflow-hidden transition hover:opacity-90"
                      style={{ background: "#1a1a1a", border: "2px dashed #2a2a2a" }}
                    >
                      {item.value ? (
                        <img src={item.value} alt={item.label} className="w-full h-full object-cover" />
                      ) : uploading === item.type ? (
                        <Loader2 size={24} className="animate-spin" style={{ color: "#c8922a" }} />
                      ) : (
                        <>
                          <Camera size={24} style={{ color: "#a0a0a0" }} />
                          <p className="text-xs mt-1" style={{ color: "#a0a0a0" }}>Upload</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture={item.type === "profile" ? "user" : "environment"}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, item.type)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* License */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111111", border: "1px solid #2a2a2a" }}>
            <h2 className="text-lg font-semibold text-white">Driver's License</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white">License Number *</Label>
                <Input value={form.licenseNumber} onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))} required style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Expiry Date *</Label>
                <Input type="date" value={form.licenseExpiresAt} onChange={(e) => setForm((p) => ({ ...p, licenseExpiresAt: e.target.value }))} required style={inputStyle} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-white">License Classes</Label>
                <Input value={form.licenseClasses} onChange={(e) => setForm((p) => ({ ...p, licenseClasses: e.target.value }))} placeholder="EB, EC1" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111111", border: "1px solid #2a2a2a" }}>
            <h2 className="text-lg font-semibold text-white">Vehicle Details (2015 or newer)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white">Make *</Label>
                <Input value={form.vehicleMake} onChange={(e) => setForm((p) => ({ ...p, vehicleMake: e.target.value }))} placeholder="Toyota" required style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Model *</Label>
                <Input value={form.vehicleModel} onChange={(e) => setForm((p) => ({ ...p, vehicleModel: e.target.value }))} placeholder="Corolla" required style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Year * (2015+)</Label>
                <Input type="number" min="2015" max={new Date().getFullYear()} value={form.vehicleYear} onChange={(e) => setForm((p) => ({ ...p, vehicleYear: e.target.value }))} required style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Registration *</Label>
                <Input value={form.vehicleReg} onChange={(e) => setForm((p) => ({ ...p, vehicleReg: e.target.value }))} placeholder="CA 123-456" required style={inputStyle} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-white">Vehicle Type</Label>
                <Select value={form.vehicleType} onValueChange={(v) => setForm((p) => ({ ...p, vehicleType: v }))}>
                  <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIKE">Bike</SelectItem>
                    <SelectItem value="CAR">Car</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="TRUCK">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Banking */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111111", border: "1px solid #2a2a2a" }}>
            <h2 className="text-lg font-semibold text-white">Banking Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-white">Bank *</Label>
                <Select value={form.bankName} onValueChange={(v) => setForm((p) => ({ ...p, bankName: v }))}>
                  <SelectTrigger style={inputStyle}><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>
                    {["ABSA", "FNB", "STANDARD_BANK", "NEDBANK", "CAPITEC", "TYME_BANK", "AFRICAN_BANK"].map((b) => (
                      <SelectItem key={b} value={b}>{b.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Account Holder *</Label>
                <Input value={form.accountHolder} onChange={(e) => setForm((p) => ({ ...p, accountHolder: e.target.value }))} required style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Account Number *</Label>
                <Input value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} required style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Branch Code *</Label>
                <Input value={form.branchCode} onChange={(e) => setForm((p) => ({ ...p, branchCode: e.target.value }))} required style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white">Account Type</Label>
                <Select value={form.accountType} onValueChange={(v) => setForm((p) => ({ ...p, accountType: v }))}>
                  <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-12 font-semibold text-white text-base" style={{ background: "#c8922a" }}>
            {submitting && <Loader2 size={18} className="animate-spin mr-2" />}
            Submit Application
          </Button>
        </form>
      </div>
    </div>
  );
}