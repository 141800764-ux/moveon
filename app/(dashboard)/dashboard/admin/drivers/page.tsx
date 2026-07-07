import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DriverApprovalCard from "@/components/admin/DriverApprovalCard";

const ADMIN_ROLES = ["SUPER_ADMIN", "CARRIER_ADMIN", "DISPATCHER"];

export default async function PendingDriversPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (!ADMIN_ROLES.some((r) => session.user.roles.includes(r as any))) {
    redirect("/dashboard");
  }

  const pending = await prisma.driver.findMany({
    where: { verificationStatus: "PENDING" },
    include: {
      documents: true,
      user: { select: { name: true, email: true, image: true } },
    },
    orderBy: { appliedAt: "asc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Driver Applications</h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          {pending.length} application{pending.length !== 1 ? "s" : ""} awaiting review
        </p>
      </div>

      {pending.length === 0 ? (
        <p style={{ color: "var(--muted-foreground)" }}>No pending applications right now.</p>
      ) : (
        <div className="space-y-4">
          {pending.map((driver) => (
            <DriverApprovalCard
              key={driver.id}
              driver={JSON.parse(JSON.stringify(driver))}
            />
          ))}
        </div>
      )}
    </div>
  );
}