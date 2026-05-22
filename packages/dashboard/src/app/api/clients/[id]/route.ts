import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { Appointment, Client, Professional, Service } from "@agenturn/db";
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

  const client = await Client.findOne({
    where: { id, tenant_id: tenantID },
    include: [
      {
        model: Appointment,
        as: "appointments",
        include: [
          { model: Service, as: "service" },
          { model: Professional, as: "professional" },
        ],
      },
    ],
  });

  if (!client) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(client);
}
