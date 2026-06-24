import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Service } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const services = await Service.findAll({
    where: {
      tenant_id: tenantId,
    },
  });

  return NextResponse.json(services);
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

  const service = await Service.create({
    tenant_id: tenantId,
    name,
    duration_minutes: durationMinutes,
    price,
    active,
    category_id,
  });

  return NextResponse.json(service, { status: 201 });
}
