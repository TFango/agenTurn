import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Service } from "@agenturn/db";
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

  const [affectedRows] = await Service.update(body, {
    where: { id, tenant_id: tenantId },
  });

  if (affectedRows === 0) {
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

  const [affectedRows] = await Service.update(
    { active: false },
    { where: { id, tenant_id: tenantId } },
  );

  if (affectedRows === 0) {
    return NextResponse.json(
      { error: "No se encontro el servicio" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
