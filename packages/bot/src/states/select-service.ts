import { conversationStates, db, services } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { sendListMessage } from "../whatsapp/whatsapp";

export async function handleSelectService(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  const { category_id } = conv.temp_data as { category_id?: string };

  const conditions = [eq(services.tenant_id, tenant.id), eq(services.active, true)];
  if (category_id) conditions.push(eq(services.category_id, category_id));

  const serviceList = await db
    .select()
    .from(services)
    .where(and(...conditions));

  const selected = serviceList.find((s) => s.id === body);

  if (selected) {
    const newTempData = {
      ...conv.temp_data as object,
      service_id: selected.id,
      service_name: selected.name,
      service_duration: selected.duration_minutes,
    };
    await db.update(conversationStates).set({ state: "select_professional", temp_data: newTempData }).where(eq(conversationStates.id, conv.id));
    conv.state = "select_professional";
    conv.temp_data = newTempData;
    const { handleSelectProfessional } = await import("./select-professional");
    return handleSelectProfessional(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Qué servicio querés reservar?",
    "Ver servicios",
    [
      ...serviceList.slice(0, 9).map((s) => ({
        id: s.id,
        title: s.name ?? "",
        description: `${s.duration_minutes} min - $${s.price}`,
      })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
