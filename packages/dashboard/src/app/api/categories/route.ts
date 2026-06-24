import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { ServiceCategory } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const categories = await ServiceCategory.findAll({
    where: { tenant_id: tenantId },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const body = await req.json();
  const tenantId = await getTenantId(session);

  const { name } = body;

  if (!name) {
    return NextResponse.json(
      {
        message: "El nombre de la categoría es obligatorio",
      },
      {
        status: 400,
      },
    );
  }

  const categorie = await ServiceCategory.create({
    name: name,
    tenant_id: tenantId,
  });

  return NextResponse.json(categorie);
}
