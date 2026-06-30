import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { db, appointments } from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const result = await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(and(eq(appointments.id, id), eq(appointments.tenant_id, tenantId)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json(
      { message: "Este turno no existe" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
