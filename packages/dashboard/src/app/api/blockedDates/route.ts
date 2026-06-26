import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { BlockedDate, Professional } from "@agenturn/db";
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
    const professional = await Professional.findOne({
      where: { tenant_id: tenantId },
    });
    profId = professional?.id;
  }

  if (!profId) {
    return NextResponse.json(
      { message: "No se encontro el profesional" },
      { status: 404 },
    );
  }

  const daysBlocked = await BlockedDate.findAll({
    where: { professional_id: profId },
  });

  return NextResponse.json(daysBlocked);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const body = await req.json();
  const { date, reason, professionalId } = body;

  if (!date) {
    return NextResponse.json(
      { message: "La fecha es obligatoria" },
      { status: 400 },
    );
  }

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

  await BlockedDate.create({
    professional_id: profId,
    date,
    reason,
  });

  return NextResponse.json({ ok: true });
}
