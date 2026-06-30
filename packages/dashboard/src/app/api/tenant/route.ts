import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { db, tenants } from "@agenturn/db";
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
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .then((r) => r[0]);

  if (!result) {
    return NextResponse.json(
      { message: "No se encontro el tenant" },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const body = await req.json();

  const { name, whatsapp_number, phone_number_id, slot_interval_minutes } =
    body;

  await db
    .update(tenants)
    .set({ name, whatsapp_number, phone_number_id, slot_interval_minutes })
    .where(eq(tenants.id, tenantId));

  return NextResponse.json({ ok: true });
}
