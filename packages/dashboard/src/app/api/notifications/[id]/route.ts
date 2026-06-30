import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { notifications, db } from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const { id } = await params;

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.read, false)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const { id } = await params;

  await db
    .delete(notifications)
    .where(
      and(eq(notifications.id, id), eq(notifications.tenant_id, tenantId)),
    );

  return NextResponse.json({ ok: true });
}
