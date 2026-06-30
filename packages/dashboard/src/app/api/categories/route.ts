import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { serviceCategories, db } from "@agenturn/db";
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
    .from(serviceCategories)
    .where(eq(serviceCategories.tenant_id, tenantId));

  return NextResponse.json(result);
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

  const [category] = await db
    .insert(serviceCategories)
    .values({
      name,
      tenant_id: tenantId,
    })
    .returning();

  return NextResponse.json(category);
}
