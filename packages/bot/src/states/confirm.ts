import { conversationStates, db } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { sendButtonMessage } from "../whatsapp/whatsapp";

export async function handleConfirm(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  const { service_name, professional_name, selected_date, selected_time, service_duration } =
    conv.temp_data as Record<string, string>;

  if (body === "confirm_yes") {
    await db.update(conversationStates).set({ state: "confirmed" }).where(eq(conversationStates.id, conv.id));
    conv.state = "confirmed";
    const { handleConfirmed } = await import("./confirmed");
    return handleConfirmed(conv, tenant, client, body);
  }
  if (body === "confirm_change") {
    await db.update(conversationStates).set({ state: "select_category", temp_data: {} }).where(eq(conversationStates.id, conv.id));
    conv.state = "select_category";
    conv.temp_data = {};
    const { handleSelectCategory } = await import("./select-category");
    return handleSelectCategory(conv, tenant, client, body);
  }

  await sendButtonMessage(
    tenant.phone_number_id,
    tenant.meta_access_token!,
    conv.client_whatsapp,
    `*Resumen de tu turno:*\n📋 Servicio: ${service_name}\n👩 Profesional: ${professional_name}\n📅 Fecha: ${selected_date}\n⏰ Hora: ${selected_time} (${service_duration} min)\n\n¿Confirmás?`,
    [
      { id: "confirm_yes", title: "✅ Sí, confirmar" },
      { id: "confirm_change", title: "✏️ Cambiar algo" },
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
