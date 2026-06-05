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
