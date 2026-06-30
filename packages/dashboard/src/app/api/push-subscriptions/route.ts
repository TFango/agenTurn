import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { db, pushSubscriptions } from "@agenturn/db";
import { and, eq } from "drizzle-orm";

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

  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.user_id, userId),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    )
    .then((r) => r[0]);

  if (existing) {
    return NextResponse.json(
      { message: "Este endpoint ya existe" },
      { status: 200 },
    );
  }

  await db.insert(pushSubscriptions).values({
    user_id: userId,
    tenant_id: tenantId,
    endpoint,
    keys,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const body = await req.json();
  const { endpoint } = body;
  const userId = (session.user as any).id;

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.user_id, userId),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    );

  return NextResponse.json({ ok: true });
}
