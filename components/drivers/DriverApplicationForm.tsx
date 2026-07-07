"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const LICENSE_CLASSES = ["A1", "A", "B", "EB", "C1", "C", "EC1", "EC"];

const DOCUMENT_FIELDS = [
  { key: "ID_DOCUMENT", label: "ID Document / Passport" },
  { key: "DRIVERS_LICENSE", label: "Driver's License (photo)" },
  { key: "PROOF_OF_ADDRESS", label: "Proof of Address" },
  { key: "PROFILE_PHOTO", label: "Profile Photo" },
] as const;

type DocKey = (typeof DOCUMENT_FIELDS)[number]["key"];

async function uploadFile(file: File): Promise<string> {
    const blob = await upload(`driver-docs/${Date.now()}-${file.name}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
    });
    return blob.url;
  }

export default function DriverApplicationForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<DocKey | null>(null);

  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiresAt, setLicenseExpiresAt] = useState("");
  const [licenseClasses, setLicenseClasses] = useState<string[]>([]);
  const [docs, setDocs] = useState<Record<string, string>>({});

  function toggleClass(cls: string) {
    setLicenseClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  }

  async function handleFileChange(key: DocKey, file: File | null) {
    if (!file) return;
    setUploading(key);
    try {
      const url = await uploadFile(file);
      setDocs((prev) => ({ ...prev, [key]: url }));
      toast.success(`${key.replace(/_/g, " ")} uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!phone || !licenseNumber || !licenseExpiresAt) {
      toast.error("Please fill in all required fields");
      return;
    }
    const missingDocs = DOCUMENT_FIELDS.filter((d) => !docs[d.key]);
    if (missingDocs.length > 0) {
      toast.error(`Please upload: ${missingDocs.map((d) => d.label).join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/drivers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          licenseNumber,
          licenseExpiresAt,
          licenseClasses,
          documents: Object.entries(docs).map(([type, fileUrl]) => ({ type, fileUrl })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      toast.success("Application submitted! We'll review it shortly.");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+27 82 123 4567"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="licenseNumber">Driver's License Number</Label>
        <Input
          id="licenseNumber"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="licenseExpiresAt">License Expiry Date</Label>
        <Input
          id="licenseExpiresAt"
          type="date"
          value={licenseExpiresAt}
          onChange={(e) => setLicenseExpiresAt(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>License Classes</Label>
        <div className="flex flex-wrap gap-2">
          {LICENSE_CLASSES.map((cls) => (
            <button
              key={cls}
              type="button"
              onClick={() => toggleClass(cls)}
              className="px-3 py-1.5 rounded-md text-sm font-medium border"
              style={{
                background: licenseClasses.includes(cls) ? "var(--gold)" : "var(--input)",
                color: licenseClasses.includes(cls) ? "white" : "var(--foreground)",
                borderColor: "var(--border)",
              }}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Documents</Label>
        {DOCUMENT_FIELDS.map((doc) => (
          <div key={doc.key} className="flex items-center justify-between gap-3 p-3 rounded-md border" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              {docs[doc.key] ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Upload size={18} style={{ color: "var(--muted-foreground)" }} />
              )}
              <span className="text-sm">{doc.label}</span>
            </div>
            <label className="text-sm font-medium cursor-pointer" style={{ color: "var(--gold)" }}>
              {uploading === doc.key ? (
                <Loader2 size={16} className="animate-spin" />
              ) : docs[doc.key] ? (
                "Replace"
              ) : (
                "Upload"
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        ))}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-11 font-semibold text-white"
        style={{ background: "var(--gold)" }}
      >
        {submitting && <Loader2 size={18} className="animate-spin mr-2" />}
        Submit Application
      </Button>
    </form>
  );
}