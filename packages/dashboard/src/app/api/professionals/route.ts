import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Professional, ServiceCategory } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const professionals = await Professional.findAll({
    where: { tenant_id: tenantId },
    include: { model: ServiceCategory },
  });

  return NextResponse.json(professionals);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }
  const tenantId = await getTenantId(session);
  const body = await req.json();

  const { name, categoryIds } = body;

  if (!name) {
    return NextResponse.json(
      { message: "El nombre del profesional es obligatorio" },
      { status: 400 },
    );
  }

  const profesional = await Professional.create({
    tenant_id: tenantId,
    name,
    active: true,
  });

  if (categoryIds?.length > 0) {
    await (profesional as any).addServiceCategories(categoryIds);
  }

  return NextResponse.json(profesional);
}
