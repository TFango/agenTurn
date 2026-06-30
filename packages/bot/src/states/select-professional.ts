import { conversationStates, db, professionalCategories, professionals } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { sendListMessage, sendTextMessage } from "../whatsapp/whatsapp";

export async function handleSelectProfessional(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
): Promise<void> {
  const { category_id } = conv.temp_data as { category_id?: string };

  const profList = category_id
    ? await db
        .select({ id: professionals.id, name: professionals.name })
        .from(professionals)
        .innerJoin(professionalCategories, eq(professionalCategories.professional_id, professionals.id))
        .where(and(eq(professionals.tenant_id, tenant.id), eq(professionals.active, true), eq(professionalCategories.category_id, category_id)))
    : await db
        .select({ id: professionals.id, name: professionals.name })
        .from(professionals)
        .where(and(eq(professionals.tenant_id, tenant.id), eq(professionals.active, true)));

  if (profList.length === 0) {
    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "No hay profesionales disponibles en este momento. Volvé a intentar más tarde.\n\nEscribí *turno* para volver al menú.",
    );
    await db.update(conversationStates).set({ state: "greeting", temp_data: {} }).where(eq(conversationStates.id, conv.id));
    conv.state = "greeting";
    conv.temp_data = {};
    return;
  }

  const selected = profList.find((p) => p.id === body);

  if (profList.length === 1 || selected) {
    const prof = selected ?? profList[0];
    const newTempData = { ...conv.temp_data as object, professional_id: prof.id, professional_name: prof.name };
    await db.update(conversationStates).set({ state: "select_date", temp_data: newTempData }).where(eq(conversationStates.id, conv.id));
    conv.state = "select_date";
    conv.temp_data = newTempData;
    const { handleSelectDate } = await import("./select-date");
    return handleSelectDate(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Con quién querés atenderte?",
    "Ver profesionales",
    [
      ...profList.slice(0, 9).map((p) => ({ id: p.id, title: p.name ?? "" })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
