import { UserRole, DriverVerificationStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      roles: UserRole[];
      driverStatus: DriverVerificationStatus | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    roles: UserRole[];
    driverStatus?: DriverVerificationStatus | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    roles: UserRole[];
    driverStatus: DriverVerificationStatus | null;
  }
}