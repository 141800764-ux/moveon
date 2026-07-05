import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { customerProfile: true, staffProfile: true },
  });

  if (!user) redirect("/sign-in");

  let carrier = null;
  if (user.staffProfile?.role === "CARRIER_ADMIN") {
    carrier = await prisma.carrier.findUnique({
      where: { id: user.staffProfile.carrierId },
    });
  }

  return (
    <SettingsClient
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }}
      customer={
        user.customerProfile
          ? {
              phone: user.customerProfile.phone,
              city: user.customerProfile.city,
              country: user.customerProfile.country,
              bio: user.customerProfile.bio,
              address: user.customerProfile.address as any,
            }
          : null
      }
      carrier={carrier}
      isCarrierAdmin={user.staffProfile?.role === "CARRIER_ADMIN"}
    />
  );
}