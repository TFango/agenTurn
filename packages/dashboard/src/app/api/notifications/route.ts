import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Notification } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const notifications = await Notification.findAll({
    where: { tenant_id: tenantId },
    order: [["created_at", "DESC"]],
    limit: 30,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  await Notification.update(
    { read: true },
    { where: { tenant_id: tenantId, read: false } },
  );

  return NextResponse.json(true);
}
