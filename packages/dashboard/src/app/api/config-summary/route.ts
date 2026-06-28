import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { BlockedDate, Professional, Tenant, WorkingHours } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const professional = await Professional.findOne({
    where: { tenant_id: tenantId },
  });

  const profId = professional?.id;

  const [tenant, workingHoursDays, activeProfessionals, blockedDates] =
    await Promise.all([
      Tenant.findOne({
        where: { id: tenantId },
        attributes: ["name", "plan"],
      }),
      profId
        ? WorkingHours.count({ where: { professional_id: profId } })
        : 0,
      Professional.count({ where: { tenant_id: tenantId, active: true } }),
      profId
        ? BlockedDate.count({ where: { professional_id: profId } })
        : 0,
    ]);

  return NextResponse.json({
    tenant: tenant ? { name: tenant.name, plan: tenant.plan } : null,
    workingHoursDays,
    activeProfessionals,
    blockedDates,
  });
}
