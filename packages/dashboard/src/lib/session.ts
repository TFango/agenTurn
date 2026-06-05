import { NextResponse } from "next/server";
import { auth } from "./auth";

export async function getSessionOrUnauthorized() {
  const session = await auth();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unautrhorized" }, { status: 401 }),
    };
  }

  return { session, error: null };
}

export async function getTenantId(session: any) {
  return (session.user as any).tenantId as string;
}
