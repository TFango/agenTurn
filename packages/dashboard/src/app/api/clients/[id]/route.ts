import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import {
  db,
  clients,
  appointments,
  services,
  professionals,
} from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantID = await getTenantId(session);

  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.tenant_id, tenantID)))
    .then((r) => r[0]);

  if (!client) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const clientAppointments = await db
    .select({
      id: appointments.id,
      datetime: appointments.datetime,
      status: appointments.status,
      service: {
        id: services.id,
        name: services.name,
        duration_minutes: services.duration_minutes,
      },
      professional: { id: professionals.id, name: professionals.name },
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.service_id, services.id))
    .leftJoin(professionals, eq(appointments.professional_id, professionals.id))
    .where(eq(appointments.client_id, id))
    .orderBy(appointments.datetime);

  return NextResponse.json({ ...client, appointments: clientAppointments });
}
