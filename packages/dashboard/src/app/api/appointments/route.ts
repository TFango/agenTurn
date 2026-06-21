import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Appointment, Client, Professional, Service } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";
import { Op } from "sequelize";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const appointments = await Appointment.findAll({
    where: {
      tenant_id: tenantId,
      datetime: {
        [Op.between]: [
          new Date(`${from}T00:00:00`),
          new Date(`${to}T23:59:59`),
        ],
      },
    },
    include: [
      { model: Client, as: "client" },
      { model: Service, as: "service" },
      {
        model: Professional,
        as: "professional",
      },
    ],
    order: [["datetime", "ASC"]],
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);
  const body = await req.json();

  const { professional_id, service_id, client_id, datetime } = body;

  const service = await Service.findByPk(service_id);
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  const newStart = new Date(datetime);
  const newEnd = new Date(newStart.getTime() + service.duration_minutes * 60 * 1000);

  const existing = await Appointment.findAll({
    where: { professional_id, status: "confirmed" },
    include: [{ model: Service, as: "service" }],
  });

  const conflict = existing.some((a) => {
    const aStart = new Date(a.datetime);
    const aEnd = new Date(aStart.getTime() + (a as any).service.duration_minutes * 60 * 1000);
    return newStart < aEnd && newEnd > aStart;
  });

  if (conflict) {
    return NextResponse.json({ error: "Ese horario ya está ocupado" }, { status: 409 });
  }

  const created = await Appointment.create({
    tenant_id: tenantId,
    professional_id,
    service_id,
    client_id,
    datetime,
    status: "confirmed",
  });

  return NextResponse.json(created);
}
