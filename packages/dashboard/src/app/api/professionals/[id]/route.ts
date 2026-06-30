import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { db, professionals, professionalCategories } from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = await getTenantId(session);
  const body = await req.json();
  const { id } = await params;
  const { name, active, categoryIds } = body;

  await db
    .update(professionals)
    .set({ name, active })
    .where(and(eq(professionals.id, id), eq(professionals.tenant_id, tenantId)));

  if (categoryIds) {
    // Reemplazar categorías: borrar las existentes e insertar las nuevas
    await db.delete(professionalCategories).where(eq(professionalCategories.professional_id, id));

    if (categoryIds.length > 0) {
      await db.insert(professionalCategories).values(
        categoryIds.map((categoryId: string) => ({
          professional_id: id,
          category_id: categoryId,
        }))
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = await getTenantId(session);
  const { id } = await params;

  await db
    .delete(professionals)
    .where(and(eq(professionals.id, id), eq(professionals.tenant_id, tenantId)));

  return NextResponse.json({ ok: true });
}
