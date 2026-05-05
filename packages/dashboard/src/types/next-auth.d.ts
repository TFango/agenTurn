import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      role: "admin" | "professional";
      tenantId: string;
      professionalId: string | null;
    };
  }
}
