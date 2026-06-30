import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { services, db } from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const result = await db
    .update(services)
    .set(body)
    .where(and(eq(services.id, id), eq(services.tenant_id, tenantId)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const result = await db
    .update(services)
    .set({ active: false })
    .where(and(eq(services.id, id), eq(services.tenant_id, tenantId)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json(
      { error: "No se encontro el servicio" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
