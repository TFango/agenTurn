import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { PushSubscription } from "@agenturn/db";

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const body = await req.json();
  const { endpoint, keys } = body;
  const userId = (session.user as any).id;

  if (!endpoint || !keys) {
    return NextResponse.json(
      { message: "Endpoint y Keys son necesarios" },
      { status: 400 },
    );
  }
  const [subs, created] = await PushSubscription.findOrCreate({
    where: { user_id: userId, endpoint },
    defaults: {
      user_id: userId,
      tenant_id: tenantId,
      endpoint,
      keys,
    },
  });

  if (!created) {
    return NextResponse.json(
      { message: "Este endpoint ya existe" },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const body = await req.json();
  const { endpoint } = body;
  const userId = (session.user as any).id;

  await PushSubscription.destroy({ where: { user_id: userId, endpoint } });

  return NextResponse.json({ ok: true });
}
