import {
  ConversationState,
  Tenant,
  Client,
  Appointment,
  Notification,
} from "@agenturn/db";
import { sendButtonMessage, sendTextMessage } from "../whatsapp/whatsapp";
import { sendPushToTenant } from "../push/push";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleCancelConfirm(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const { appointment_id } = conv.temp_data as { appointment_id: string };

  if (body === "yes") {
    await Appointment.update(
      { status: "cancelled" },
      { where: { id: appointment_id, client_id: client.id } },
    );

    await Notification.create({
      type: "cancelled_appointment",
      title: "Turno cancelado",
      body: `${client.name} cancelo su turno`,
      tenant_id: tenant.id,
    });

    await sendPushToTenant(tenant.id, "Turno cancelado", `${client.name} canceló su turno`);

    await conv.update({ state: "greeting" });

    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "✅ Turno cancelado. ¡Hasta la próxima!",
    );

    return;
  } else if (body === "no") {
    await conv.update({ state: "greeting" });
    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "Perfecto, el turno sigue en pie. 👍",
    );

    return;
  }

  await sendButtonMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Confirmás la cancelación del turno?",
    [
      { id: "yes", title: "✅ Sí, cancelar" },
      { id: "no", title: "↩️ No, mantener" },
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
