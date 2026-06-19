import { ConversationState, Tenant, Client } from "@agenturn/db";
import { sendButtonMessage } from "../whatsapp/whatsapp";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleConfirm(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const {
    service_name,
    professional_name,
    selected_date,
    selected_time,
    service_duration,
  } = conv.temp_data as Record<string, string>;

  if (body === "confirm_yes") {
    await conv.update({
      state: "confirmed",
    });
    const { handleConfirmed } = await import("./confirmed");
    return handleConfirmed(conv, tenant, client, body);
  }
  if (body === "confirm_change") {
    await conv.update({
      state: "select_service",
      temp_data: {},
    });
    const { handleSelectService } = await import("./select-service");
    return handleSelectService(conv, tenant, client, body);
  }

  await sendButtonMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    `Servicio: ${service_name}, Profesional: ${professional_name}, Fecha: ${selected_date}, Horario: ${selected_time}, Duracion: ${service_duration}`,
    [
      { id: "confirm_yes", title: "Confirmar" },
      { id: "confirm_change", title: "Modificar" },
    ],
  );
}
