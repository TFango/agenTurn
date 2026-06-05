import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Professional, WorkingHours } from "@agenturn/db";
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
      { messsage: "No se encontro el profesional" },
      { status: 404 },
    );
  }

  const workingHours = await WorkingHours.findAll({
    where: { professional_id: professional.id },
  });

  return NextResponse.json({ workingHours });
}

export async function PUT(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const body = await req.json();

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

  await WorkingHours.destroy({ where: { professional_id: profesional.id } });

  await WorkingHours.bulkCreate(
    body.map((item: any) => ({ ...item, professional_id: profesional.id })),
  );

  return NextResponse.json({ ok: true });
}
