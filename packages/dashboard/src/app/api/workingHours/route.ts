import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { db, professionals, workingHours } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = await getTenantId(session);
  const { searchParams } = new URL(req.url);
  const professionalId = searchParams.get("professionalId");

  let profId: string | undefined = professionalId ?? undefined;

  if (!profId) {
    const profesional = await db
      .select({ id: professionals.id })
      .from(professionals)
      .where(eq(professionals.tenant_id, tenantId))
      .then((r) => r[0]);
    profId = profesional?.id;
  }

  const hours = await db
    .select()
    .from(workingHours)
    .where(eq(workingHours.professional_id, profId!));

  return NextResponse.json({ workingHours: hours });
}

export async function PUT(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { professionalId, hours } = await req.json();
  const tenantId = await getTenantId(session);

  let profId: string | undefined = professionalId;

  if (!profId) {
    const profesional = await db
      .select({ id: professionals.id })
      .from(professionals)
      .where(eq(professionals.tenant_id, tenantId))
      .then((r) => r[0]);
    profId = profesional?.id;
  }

  if (!profId) {
    return NextResponse.json({ message: "No se encontro el profesional" }, { status: 404 });
  }

  // Reemplazar horarios: borrar los existentes e insertar los nuevos
  await db.delete(workingHours).where(eq(workingHours.professional_id, profId));

  await db.insert(workingHours).values(
    hours.map((item: any) => ({ ...item, professional_id: profId }))
  );

  return NextResponse.json({ ok: true });
}
