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
        token.role = (user as any).role;
        token.roles = (user as any).roles;
        token.driverStatus = (user as any).driverStatus;
      }

      // Allows the client to call update() after switching active role,
      // or after a driver application is approved, without forcing re-login.
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