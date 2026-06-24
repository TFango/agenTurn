import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { ServiceCategory } from "@agenturn/db";
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

  const [affectedRows] = await ServiceCategory.update(
    { name },
    { where: { id, tenant_id: tenantId } },
  );

  if (affectedRows === 0) {
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

  await ServiceCategory.destroy({ where: { tenant_id: tenantId, id } });

  return NextResponse.json({ ok: true });
}
