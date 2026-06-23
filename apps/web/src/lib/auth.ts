import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@agenttoruk/database";
import { getUserMembership } from "./org";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!valid) {
          return null;
        }

        const membership = await getUserMembership(user.id);

        if (!membership) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          organizationId: membership.organizationId,
          organizationName: membership.organization.name,
          organizationSlug: membership.organization.slug,
          role: membership.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.organizationSlug = user.organizationSlug;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.organizationSlug = token.organizationSlug as string;
        session.user.role = token.role as NonNullable<typeof token.role>;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
