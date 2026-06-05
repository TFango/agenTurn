import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { BlockedDate, Professional } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const professional = await Professional.findOne({
    where: { tenant_id: tenantId },
  });

  if (!professional) {
    return NextResponse.json(
      { message: "El profesional no existe" },
      { status: 404 },
    );
  }

  const daysBlocked = await BlockedDate.findAll({
    where: { professional_id: professional.id },
  });

  return NextResponse.json(daysBlocked);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const body = await req.json();
  const { date, reason } = body;

  if (!date) {
    return NextResponse.json(
      {
        message: "La fecha es obligatoria",
      },
      {
        status: 400,
      },
    );
  }
  const tenantId = await getTenantId(session);

  const profesional = await Professional.findOne({
    where: { tenant_id: tenantId },
  });

  if (!profesional) {
    return NextResponse.json(
      { message: "No se encontro el profesional" },
      { status: 404 },
    );
  }

  await BlockedDate.create({
    professional_id: profesional.id,
    date,
    reason,
  });

  return NextResponse.json({ OK: true });
}
