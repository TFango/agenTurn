import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Tenant } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const tenant = await Tenant.findOne({ where: { id: tenantId } });

  if (!tenant) {
    return NextResponse.json(
      { message: "No se encontro el tenant" },
      { status: 404 },
    );
  }

  return NextResponse.json(tenant);
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const body = await req.json();

  const { name, whatsapp_number, phone_number_id, slot_interval_minutes } = body;

  await Tenant.update(
    { name, whatsapp_number, phone_number_id, slot_interval_minutes },
    { where: { id: tenantId } },
  );

  return NextResponse.json({ ok: true });
}
