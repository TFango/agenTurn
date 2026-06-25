import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Professional, WorkingHours } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const { searchParams } = new URL(req.url);
  const professionalId = searchParams.get("professionalId");

  let profId: string | undefined = professionalId ?? undefined;

  if (!profId) {
    const profesional = await Professional.findOne({
      where: { tenant_id: tenantId },
    });
    profId = profesional?.id;
  }

  const workingHours = await WorkingHours.findAll({
    where: { professional_id: profId },
  });

  return NextResponse.json({ workingHours });
}

export async function PUT(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const { professionalId, hours } = await req.json();
  const tenantId = await getTenantId(session);

  let profId: string | undefined = professionalId;

  if (!profId) {
    const profesional = await Professional.findOne({
      where: { tenant_id: tenantId },
    });
    profId = profesional?.id;
  }

  if (!profId) {
    return NextResponse.json(
      { message: "No se encontro el profesional" },
      { status: 404 },
    );
  }

  await WorkingHours.destroy({ where: { professional_id: profId } });

  await WorkingHours.bulkCreate(
    hours.map((item: any) => ({ ...item, professional_id: profId })),
  );

  return NextResponse.json({ ok: true });
}
