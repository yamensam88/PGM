import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      organization_id: string;
      first_name?: string | null;
      last_name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    organization_id: string;
    first_name?: string | null;
    last_name?: string | null;
  }
}
