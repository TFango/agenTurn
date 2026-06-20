import { ConversationState, Tenant, Client, Appointment } from "@agenturn/db";
import { sendButtonMessage, sendTextMessage } from "../whatsapp/whatsapp";

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
    await conv.update({ state: "greeting" });
    await sendTextMessage(
      tenant.whatsapp_number,
      conv.client_whatsapp,
      "✅ Turno cancelado. ¡Hasta la próxima!",
    );
    
    return;
  } else if (body === "no") {
    await conv.update({ state: "greeting" });
    await sendTextMessage(
      tenant.whatsapp_number,
      conv.client_whatsapp,
      "Perfecto, el turno sigue en pie. 👍",
    );

    return;
  }

  await sendButtonMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    "¿Confirmás la cancelación del turno?",
    [
      { id: "yes", title: "✅ Sí, cancelar" },
      { id: "no", title: "↩️ No, mantener" },
    ],
  );
}
