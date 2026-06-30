import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { blockedDates, db, professionals } from "@agenturn/db";
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
    const professional = await db
      .select({ id: professionals.id })
      .from(professionals)
      .where(eq(professionals.tenant_id, tenantId))
      .then((r) => r[0]);
    profId = professional?.id;
  }

  if (!profId) {
    return NextResponse.json({ message: "No se encontro el profesional" }, { status: 404 });
  }

  const days = await db
    .select()
    .from(blockedDates)
    .where(eq(blockedDates.professional_id, profId));

  return NextResponse.json(days);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();
  const { date, reason, professionalId } = body;

  if (!date) {
    return NextResponse.json({ message: "La fecha es obligatoria" }, { status: 400 });
  }

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

  await db.insert(blockedDates).values({ professional_id: profId, date, reason });

  return NextResponse.json({ ok: true });
}
