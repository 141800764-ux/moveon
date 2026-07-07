import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { driverProfile: true },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          roles: user.roles,
          driverStatus: user.driverProfile?.verificationStatus ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as any;
        session.user.roles = (token.roles as any) ?? ["CUSTOMER"];
        session.user.driverStatus = (token.driverStatus as any) ?? null;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
      }

      // Always sync role/roles/driverStatus from the database,
      // so Google sign-ins (and role changes) are reflected correctly.
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { driverProfile: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.roles = dbUser.roles;
          token.driverStatus = dbUser.driverProfile?.verificationStatus ?? null;
        }
      }

      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.roles) token.roles = session.roles;
        if (session.driverStatus !== undefined) token.driverStatus = session.driverStatus;
      }

      return token;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  secret: process.env.AUTH_SECRET,
});