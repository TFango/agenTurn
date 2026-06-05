import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Client } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const clients = await Client.findAll({
    where: { tenant_id: tenantId },
    order: [["created_at", "DESC"]],
  });

  return NextResponse.json(clients);
}
