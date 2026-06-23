import type { MembershipRole } from "@agenttoruk/database";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
      role: MembershipRole;
    } & DefaultSession["user"];
  }

  interface User {
    organizationId?: string;
    organizationName?: string;
    organizationSlug?: string;
    role?: MembershipRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    organizationName?: string;
    organizationSlug?: string;
    role?: MembershipRole;
  }
}
