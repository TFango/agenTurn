import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { db, clients } from "@agenturn/db";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.tenant_id, tenantId))
    .orderBy(desc(clients.created_at));

  return NextResponse.json(result);
}
