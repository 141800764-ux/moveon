import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DriverApplicationForm from "@/components/drivers/DriverApplicationForm";
import SwitchToDriverButton from "@/components/drivers/SwitchToDriverButton";

export default async function BecomeDriverPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const driver = await prisma.driver.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-1">Become a Driver</h1>
      <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
        Deliver with MoveOn and earn on your own schedule.
      </p>

      {!driver && <DriverApplicationForm />}

      {driver?.verificationStatus === "PENDING" && (
        <div className="p-4 rounded-md border" style={{ borderColor: "var(--border)" }}>
          <p className="font-medium">Your application is under review</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Submitted {driver.appliedAt.toLocaleDateString()}. We'll notify you once it's been reviewed.
          </p>
        </div>
      )}

      {driver?.verificationStatus === "REJECTED" && (
        <div className="p-4 rounded-md border border-red-500/40 bg-red-500/5">
          <p className="font-medium text-red-500">Application not approved</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {driver.rejectionReason || "Please contact support for details."}
          </p>
        </div>
      )}

      {driver?.verificationStatus === "APPROVED" && (
        <div className="p-4 rounded-md border" style={{ borderColor: "var(--border)" }}>
          <p className="font-medium mb-3">You're approved to drive! 🎉</p>
          <SwitchToDriverButton />
        </div>
      )}
    </div>
  );
}