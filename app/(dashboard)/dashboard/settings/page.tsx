import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: {
      customerProfile: true,
      driverProfile: true,
      staffProfile: true,
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Manage your account and preferences
        </p>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}