import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { blockedDates, db, professionals } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = await getTenantId(session);
  const { id } = await params;

  // Verificar que el blockedDate pertenece al tenant via JOIN
  const row = await db
    .select({ blockedDateId: blockedDates.id, tenantId: professionals.tenant_id })
    .from(blockedDates)
    .leftJoin(professionals, eq(professionals.id, blockedDates.professional_id))
    .where(eq(blockedDates.id, id))
    .then((r) => r[0]);

  if (!row) {
    return NextResponse.json({ message: "El blockedDate no existe" }, { status: 404 });
  }

  if (row.tenantId !== tenantId) {
    return NextResponse.json({ message: "Este blockedDate no pertenece al usuario" }, { status: 403 });
  }

  await db.delete(blockedDates).where(eq(blockedDates.id, id));

  return NextResponse.json({ ok: true });
}
