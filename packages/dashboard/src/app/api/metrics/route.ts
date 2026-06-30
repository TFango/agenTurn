import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { appointments, db, services } from "@agenturn/db";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = await getTenantId(session);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthTotal, cancelledMonth, uniqueClientsResult, revenueResult, topServicesResult] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(appointments)
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "confirmed"), gte(appointments.datetime, startOfMonth)))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ count: count() })
        .from(appointments)
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "cancelled"), gte(appointments.datetime, startOfMonth)))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ count: sql<number>`COUNT(DISTINCT ${appointments.client_id})` })
        .from(appointments)
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "confirmed"), gte(appointments.datetime, startOfMonth)))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ total: sql<number>`SUM(${services.price})` })
        .from(appointments)
        .leftJoin(services, eq(appointments.service_id, services.id))
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "confirmed"), gte(appointments.datetime, startOfMonth)))
        .then((r) => +(r[0]?.total ?? 0)),

      db
        .select({
          service_id: appointments.service_id,
          name: services.name,
          count: sql<number>`COUNT(${appointments.id})`,
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.service_id, services.id))
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "confirmed"), gte(appointments.datetime, startOfMonth)))
        .groupBy(appointments.service_id, services.name)
        .orderBy(sql`COUNT(${appointments.id}) DESC`)
        .limit(5),
    ]);

  return NextResponse.json({
    monthTotal,
    cancelledMonth,
    uniqueClients: uniqueClientsResult,
    revenue: revenueResult,
    topServices: topServicesResult.map((r) => ({ name: r.name, count: +r.count })),
  });
}
