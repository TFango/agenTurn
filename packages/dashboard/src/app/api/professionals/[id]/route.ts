import { getSessionOrUnauthorized } from "@/lib/session";
import { Professional } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const body = await req.json();
  const { id } = await params;

  const { name, active } = body;

  await Professional.update({ name, active }, { where: { id } });

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

  const { id } = await params;

  await Professional.destroy({ where: { id } });

  return NextResponse.json({ ok: true });
}
