import { conversationStates, db, serviceCategories } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { sendListMessage } from "../whatsapp/whatsapp";

export async function handleSelectCategory(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  const categories = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.tenant_id, tenant.id));

  if (categories.length === 0) {
    await db.update(conversationStates).set({ state: "select_service" }).where(eq(conversationStates.id, conv.id));
    conv.state = "select_service";
    const { handleSelectService } = await import("./select-service");
    return handleSelectService(conv, tenant, client, body);
  }

  const selected = categories.find((c) => c.id === body);

  if (selected) {
    const newTempData = { ...conv.temp_data as object, category_id: selected.id };
    await db.update(conversationStates).set({ state: "select_service", temp_data: newTempData }).where(eq(conversationStates.id, conv.id));
    conv.state = "select_service";
    conv.temp_data = newTempData;
    const { handleSelectService } = await import("./select-service");
    return handleSelectService(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    tenant.meta_access_token!,
    conv.client_whatsapp,
    "¿Qué tipo de servicio estás buscando?",
    "Ver opciones",
    [
      ...categories.slice(0, 9).map((c) => ({ id: c.id, title: c.name ?? "" })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
