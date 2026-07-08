import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CustomerProfileForm from "@/components/customer/CustomerProfileForm";

export default async function CustomerProfilePage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { customerProfile: true },
  });

  return (
    <div className="max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Manage your personal information
        </p>
      </div>
      <CustomerProfileForm user={user} />
    </div>
  );
}