import { Client, ConversationState, Tenant } from "@agenturn/db";
import { sendButtonMessage } from "../whatsapp/whatsapp";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleGreeting(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  await sendButtonMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    `¡Hola! 👋 Soy el asistente de *${tenant.name}*. ¿Qué querés hacer?`,
    [
      { id: "book", title: "📅 Sacar turno" },
      { id: "cancel_appt", title: "❌ Cancelar turno" },
      { id: "human", title: "💬 Hablar con alguien" },
    ],
  );

  if (body === "book") {
    await conv.update({ state: "select_service" });
    const { handleSelectService } = await import("./select-service");
    return handleSelectService(conv, tenant, client, body);
  }
  if (body === "cancel_appt") {
    await conv.update({ state: "cancel_select" });
    const { handleCancelSelect } = await import("./cancel-select");
    return handleCancelSelect(conv, tenant, client, body);
  }
  if (body === "human") {
    await conv.update({ state: "human_handoff" });
    const { handleHumanHandoff } = await import("./human-handoff");
    return handleHumanHandoff(conv, tenant, client, body);
  }
}
