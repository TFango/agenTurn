import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Notification } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const { id } = await params;

  await Notification.update(
    { read: true },
    { where: { id: id, read: false, tenant_id: tenantId } },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const { id } = await params;

  await Notification.destroy({ where: { id, tenant_id: tenantId } });

  return NextResponse.json({ ok: true });
}
