import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* LEFT — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a0a00 50%, #2a1500 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/images/MoveOnLogo.png"
            alt="MoveOn"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--gold)" }}
          >
            MoveOn
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Logistics that
            <span style={{ color: "var(--gold)" }}> moves</span>
            <br />
            with you.
          </h1>
          <p className="text-lg" style={{ color: "var(--muted-foreground)" }}>
            Real-time fleet management, route optimization, and delivery
            tracking — all in one platform built for South Africa.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: "Deliveries", value: "50K+" },
              { label: "Active Drivers", value: "1,200+" },
              { label: "Cities", value: "12" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ background: "rgba(200,146,42,0.1)", border: "1px solid rgba(200,146,42,0.2)" }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--gold)" }}
                >
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          © 2026 MoveOn. All rights reserved.
        </p>
      </div>

      {/* RIGHT — form */}
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ background: "var(--background)" }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Image
              src="/images/MoveOnLogo.png"
              alt="MoveOn"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <span
              className="text-xl font-bold"
              style={{ color: "var(--gold)" }}
            >
              MoveOn
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}