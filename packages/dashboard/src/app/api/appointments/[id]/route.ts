import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Appointment } from "@agenturn/db";
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

  const appointment = await Appointment.findOne({
    where: { id, tenant_id: tenantId },
  });

  if (!appointment) {
    return NextResponse.json(
      { message: "Este turno no existe" },
      { status: 404 },
    );
  }

  await appointment.update({ status: "cancelled" });

  return NextResponse.json({ ok: true });
}
