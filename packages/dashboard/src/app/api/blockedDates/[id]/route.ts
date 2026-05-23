import { getSessionOrUnauthorized } from "@/lib/session";
import { BlockedDate } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const { id } = await params;

  await BlockedDate.destroy({ where: { id: id } });

  return NextResponse.json({ ok: true });
}
