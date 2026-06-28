import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Client, Professional, Service, ServiceCategory } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const [professionals, services, clients] = await Promise.all([
    Professional.findAll({
      where: { tenant_id: tenantId },
      include: { model: ServiceCategory, as: "serviceCategories" },
    }),
    Service.findAll({ where: { tenant_id: tenantId } }),
    Client.findAll({
      where: { tenant_id: tenantId },
      order: [["created_at", "DESC"]],
    }),
  ]);

  return NextResponse.json({ professionals, services, clients });
}
