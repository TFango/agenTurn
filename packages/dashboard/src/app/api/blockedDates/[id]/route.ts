import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { BlockedDate, Professional } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

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

  const blockDate = await BlockedDate.findOne({
    where: { id },
    include: [{ model: Professional, as: "professional" }],
  });

  if (!blockDate) {
    return NextResponse.json(
      { message: "El blockedDate no existe" },
      { status: 404 },
    );
  }

  if ((blockDate as any).professional.tenant_id !== tenantId) {
    return NextResponse.json(
      {
        message: "Este blockedDate no pertenece al usuario",
      },
      { status: 404 },
    );
  }

  await blockDate.destroy();

  return NextResponse.json({ ok: true });
}
