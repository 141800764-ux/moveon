import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  MapPin,
  Phone,
  CheckCircle,
  Circle,
  Truck,
  Home,
} from "lucide-react";

const STATUS_STEPS = [
  { key: "CREATED", label: "Order Created", icon: Package },
  { key: "IN_TRANSIT", label: "In Transit", icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: MapPin },
  { key: "DELIVERED", label: "Delivered", icon: Home },
];

const STATUS_ORDER = [
  "CREATED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ tracking: string }>;
}) {
  const { tracking } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber: tracking },
    include: {
      order: {
        include: { customer: true },
      },
      events: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shipment) {
    // Try finding by order tracking number
    const order = await prisma.order.findUnique({
      where: { trackingNumber: tracking },
      include: {
        customer: true,
        shipments: {
          include: { events: { orderBy: { createdAt: "desc" } } },
          take: 1,
        },
      },
    });

    if (!order) notFound();

    const destination = order.destination as any;
    const currentStep = STATUS_ORDER.indexOf("CREATED");

    return <TrackingView
      trackingNumber={order.trackingNumber}
      status="CREATED"
      recipientName={order.recipientName}
      recipientPhone={order.recipientPhone}
      destination={destination}
      events={[]}
      currentStep={currentStep}
    />;
  }

  const destination = shipment.order.destination as any;
  const currentStep = STATUS_ORDER.indexOf(shipment.status);

  return <TrackingView
    trackingNumber={shipment.trackingNumber}
    status={shipment.status}
    recipientName={shipment.order.recipientName}
    recipientPhone={shipment.order.recipientPhone}
    destination={destination}
    events={shipment.events}
    currentStep={currentStep}
    deliveredAt={shipment.deliveredAt}
    estimatedAt={shipment.estimatedAt}
  />;
}

function TrackingView({
  trackingNumber,
  status,
  recipientName,
  recipientPhone,
  destination,
  events,
  currentStep,
  deliveredAt,
  estimatedAt,
}: any) {
  const isFailed = status === "FAILED" || status === "CANCELLED" || status === "RETURNED";

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/MoveOnLogo.png"
            alt="MoveOn"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-bold text-lg" style={{ color: "var(--gold)" }}>
            MoveOn
          </span>
        </Link>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Shipment Tracking
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        {/* Tracking number */}
        <div className="text-center">
          <p className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>
            Tracking Number
          </p>
          <h1
            className="text-3xl font-bold font-mono"
            style={{ color: "var(--gold)" }}
          >
            {trackingNumber}
          </h1>
          {isFailed && (
            <span className="inline-block mt-3 text-sm font-semibold px-3 py-1 rounded-full bg-red-500/10 text-red-400">
              {status.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Progress */}
        {!isFailed && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, index) => {
                const done = index <= currentStep;
                const active = index === currentStep;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center">
                    <div className="relative flex items-center w-full">
                      {index > 0 && (
                        <div
                          className="flex-1 h-0.5"
                          style={{
                            background: index <= currentStep
                              ? "var(--gold)"
                              : "var(--border)",
                          }}
                        />
                      )}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: done
                            ? "rgba(200,146,42,0.2)"
                            : "var(--muted)",
                          border: active
                            ? "2px solid var(--gold)"
                            : done
                            ? "2px solid var(--gold)"
                            : "2px solid var(--border)",
                        }}
                      >
                        <step.icon
                          size={18}
                          style={{
                            color: done ? "var(--gold)" : "var(--muted-foreground)",
                          }}
                        />
                      </div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div
                          className="flex-1 h-0.5"
                          style={{
                            background: index < currentStep
                              ? "var(--gold)"
                              : "var(--border)",
                          }}
                        />
                      )}
                    </div>
                    <p
                      className="text-xs mt-2 text-center"
                      style={{
                        color: done ? "var(--gold)" : "var(--muted-foreground)",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery info */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-semibold text-white">Delivery Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Package size={16} style={{ color: "var(--gold)" }} />
              <span className="text-white">{recipientName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} style={{ color: "var(--gold)" }} />
              <span style={{ color: "var(--muted-foreground)" }}>
                {recipientPhone}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} style={{ color: "var(--gold)" }} />
              <span style={{ color: "var(--muted-foreground)" }}>
                {destination?.address}, {destination?.city}
              </span>
            </div>
            {estimatedAt && (
              <div className="flex items-center gap-3">
                <CheckCircle size={16} style={{ color: "var(--gold)" }} />
                <span style={{ color: "var(--muted-foreground)" }}>
                  Estimated:{" "}
                  {new Date(estimatedAt).toLocaleDateString("en-ZA")}
                </span>
              </div>
            )}
            {deliveredAt && (
              <div className="flex items-center gap-3">
                <CheckCircle size={16} style={{ color: "#10b981" }} />
                <span style={{ color: "#10b981" }}>
                  Delivered:{" "}
                  {new Date(deliveredAt).toLocaleDateString("en-ZA")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        {events.length > 0 && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="font-semibold text-white mb-4">Timeline</h2>
            <div className="space-y-4">
              {events.map((event: any) => (
                <div key={event.id} className="flex gap-4">
                  <div
                    className="w-2 h-2 rounded-full mt-2 shrink-0"
                    style={{ background: "var(--gold)" }}
                  />
                  <div>
                    <p className="text-white font-medium">{event.description}</p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {new Date(event.createdAt).toLocaleString("en-ZA")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p
          className="text-center text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          Need help?{" "}
          <span style={{ color: "var(--gold)" }}>Contact MoveOn Support</span>
        </p>
      </div>
    </div>
  );
}