import { conversationStates, db } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { sendButtonMessage } from "../whatsapp/whatsapp";

export async function handleGreeting(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  if (body === "book") {
    await db.update(conversationStates).set({ state: "select_category" }).where(eq(conversationStates.id, conv.id));
    conv.state = "select_category";
    const { handleSelectCategory } = await import("./select-category");
    return handleSelectCategory(conv, tenant, client, body);
  }
  if (body === "cancel_appt") {
    await db.update(conversationStates).set({ state: "cancel_select" }).where(eq(conversationStates.id, conv.id));
    conv.state = "cancel_select";
    const { handleCancelSelect } = await import("./cancel-select");
    return handleCancelSelect(conv, tenant, client, body);
  }
  if (body === "human") {
    await db.update(conversationStates).set({ state: "human_handoff" }).where(eq(conversationStates.id, conv.id));
    conv.state = "human_handoff";
    const { handleHumanHandoff } = await import("./human-handoff");
    return handleHumanHandoff(conv, tenant, client, body);
  }

  await sendButtonMessage(
    tenant.phone_number_id,
    tenant.meta_access_token!,
    conv.client_whatsapp,
    `¡Hola! 👋 Soy el asistente de *${tenant.name}*. ¿Qué querés hacer?`,
    [
      { id: "book", title: "📅 Sacar turno" },
      { id: "cancel_appt", title: "❌ Cancelar turno" },
      { id: "human", title: "💬 Hablar con alguien" },
    ],
  );
}
