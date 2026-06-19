import { ConversationState, Tenant, Client, Appointment } from "@agenturn/db";
import { sendTextMessage } from "../whatsapp/whatsapp";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleConfirmed(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const { professional_id, service_id, selected_date, selected_time } =
    conv.temp_data as Record<string, string>;

  await Appointment.create({
    tenant_id: tenant.id,
    professional_id,
    service_id,
    client_id: client.id,
    datetime: new Date(`${selected_date}T${selected_time}:00`),
    status: "confirmed",
  });

  await sendTextMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    "¡Turno agendado con exito!",
  );

  await conv.update({
    state: "greeting",
    temp_data: {},
  });
}
