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
    tenant.phone_number_id,
    conv.client_whatsapp,
    `*Resumen de tu turno:*\n📋 Servicio: ${service_name}\n👩 Profesional: ${professional_name}\n📅 Fecha: ${selected_date}\n⏰ Hora: ${selected_time} (${service_duration} min)\n\n¿Confirmás?`,
    [
      { id: "confirm_yes", title: "✅ Sí, confirmar" },
      { id: "confirm_change", title: "✏️ Cambiar algo" },
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
