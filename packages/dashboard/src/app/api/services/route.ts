import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { db, services } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const result = await db
    .select()
    .from(services)
    .where(eq(services.tenant_id, tenantId));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, durationMinutes, price, active, category_id } = body;

  if (!name || !durationMinutes || !price) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios" },
      { status: 400 },
    );
  }

  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const [service] = await db
    .insert(services)
    .values({
      tenant_id: tenantId,
      name,
      duration_minutes: durationMinutes,
      price,
      active,
      category_id,
    })
    .returning();

  return NextResponse.json(service, { status: 201 });
}
