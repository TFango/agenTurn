import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { db, serviceCategories } from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const { id } = await params;
  const body = await req.json();
  const { name } = body;

  const result = await db
    .update(serviceCategories)
    .set({ name })
    .where(
      and(
        eq(serviceCategories.id, id),
        eq(serviceCategories.tenant_id, tenantId),
      ),
    )
    .returning();

  if (result.length === 0) {
    return NextResponse.json(
      { message: "No se encontro la categoria a editar" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const { id } = await params;

  await db
    .delete(serviceCategories)
    .where(
      and(
        eq(serviceCategories.id, id),
        eq(serviceCategories.tenant_id, tenantId),
      ),
    );

  return NextResponse.json({ ok: true });
}
