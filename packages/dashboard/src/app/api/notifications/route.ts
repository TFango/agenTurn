import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { notifications, db } from "@agenturn/db";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.tenant_id, tenantId))
    .orderBy(desc(notifications.created_at))
    .limit(30);

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(eq(notifications.tenant_id, tenantId), eq(notifications.read, false)),
    );

  return NextResponse.json(true);
}
