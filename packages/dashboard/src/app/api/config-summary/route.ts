import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { blockedDates, db, professionals, tenants, workingHours } from "@agenturn/db";
import { and, count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = await getTenantId(session);

  const professional = await db
    .select({ id: professionals.id })
    .from(professionals)
    .where(eq(professionals.tenant_id, tenantId))
    .then((r) => r[0]);

  const profId = professional?.id;

  const [tenantRow, workingHoursDaysRow, activeProfessionalsRow, blockedDatesRow] =
    await Promise.all([
      db
        .select({ name: tenants.name, plan: tenants.plan })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .then((r) => r[0]),
      profId
        ? db
            .select({ value: count() })
            .from(workingHours)
            .where(eq(workingHours.professional_id, profId))
            .then((r) => r[0].value)
        : 0,
      db
        .select({ value: count() })
        .from(professionals)
        .where(and(eq(professionals.tenant_id, tenantId), eq(professionals.active, true)))
        .then((r) => r[0].value),
      profId
        ? db
            .select({ value: count() })
            .from(blockedDates)
            .where(eq(blockedDates.professional_id, profId))
            .then((r) => r[0].value)
        : 0,
    ]);

  return NextResponse.json({
    tenant: tenantRow ? { name: tenantRow.name, plan: tenantRow.plan } : null,
    workingHoursDays: workingHoursDaysRow,
    activeProfessionals: activeProfessionalsRow,
    blockedDates: blockedDatesRow,
  });
}
