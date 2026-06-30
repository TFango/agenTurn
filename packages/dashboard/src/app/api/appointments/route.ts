import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import {
  db,
  appointments,
  clients,
  services,
  professionals,
} from "@agenturn/db";
import { and, between, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const result = await db
    .select({
      id: appointments.id,
      tenant_id: appointments.tenant_id,
      professional_id: appointments.professional_id,
      service_id: appointments.service_id,
      client_id: appointments.client_id,
      datetime: appointments.datetime,
      status: appointments.status,
      client: {
        id: clients.id,
        name: clients.name,
        whatsapp_number: clients.whatsapp_number,
      },
      service: {
        id: services.id,
        name: services.name,
        duration_minutes: services.duration_minutes,
        price: services.price,
      },
      professional: { id: professionals.id, name: professionals.name },
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.client_id, clients.id))
    .leftJoin(services, eq(appointments.service_id, services.id))
    .leftJoin(professionals, eq(appointments.professional_id, professionals.id))
    .where(
      and(
        eq(appointments.tenant_id, tenantId),
        between(
          appointments.datetime,
          new Date(`${from}T00:00:00`),
          new Date(`${to}T23:59:59`),
        ),
      ),
    )
    .orderBy(appointments.datetime);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const body = await req.json();

  const { professional_id, service_id, client_id, datetime } = body;

  const service = await db
    .select()
    .from(services)
    .where(eq(services.id, service_id))
    .then((r) => r[0]);

  if (!service) {
    return NextResponse.json(
      { error: "Servicio no encontrado" },
      { status: 404 },
    );
  }

  const newStart = new Date(datetime);
  const newEnd = new Date(
    newStart.getTime() + service.duration_minutes! * 60 * 1000,
  );

  const dayStart = new Date(datetime);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(datetime);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await db
    .select({
      id: appointments.id,
      datetime: appointments.datetime,
      duration_minutes: services.duration_minutes,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.service_id, services.id))
    .where(
      and(
        eq(appointments.professional_id, professional_id),
        eq(appointments.status, "confirmed"),
        between(appointments.datetime, dayStart, dayEnd),
      ),
    );

  const conflict = existing.some((a) => {
    const aStart = new Date(a.datetime!);
    const aEnd = new Date(
      aStart.getTime() + (a as any).service.duration_minutes * 60 * 1000,
    );
    return newStart < aEnd && newEnd > aStart;
  });

  if (conflict) {
    return NextResponse.json(
      { error: "Ese horario ya está ocupado" },
      { status: 409 },
    );
  }

  const [created] = await db
    .insert(appointments)
    .values({
      tenant_id: tenantId,
      professional_id,
      service_id,
      client_id,
      datetime: new Date(datetime),
      status: "confirmed",
    })
    .returning();

  return NextResponse.json(created);
}
