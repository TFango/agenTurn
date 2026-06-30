import { conversationStates, db } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { sendListMessage } from "../whatsapp/whatsapp";
import { getSlotsForDate } from "./select-date";

export async function handleSelectTime(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  const { professional_id, service_duration, selected_date } = conv.temp_data as {
    professional_id: string;
    service_duration: number;
    selected_date: string;
  };

  const slots = await getSlotsForDate(professional_id, selected_date, service_duration, tenant.slot_interval_minutes);

  const selected = slots.find((s) => s.start === body);

  if (selected) {
    const newTempData = { ...conv.temp_data as object, selected_time: selected.start };
    await db.update(conversationStates).set({ state: "confirm", temp_data: newTempData }).where(eq(conversationStates.id, conv.id));
    conv.state = "confirm";
    conv.temp_data = newTempData;
    const { handleConfirm } = await import("./confirm");
    return handleConfirm(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    `¿A qué hora? (${selected_date})`,
    "Ver horarios",
    [
      ...slots.slice(0, 9).map((s) => ({
        id: s.start,
        title: s.start,
        description: `Termina ${s.end}`,
      })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
