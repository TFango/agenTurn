import { appointments, conversationStates, db, notifications } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { sendPushToTenant } from "../push/push";
import { sendTextMessage } from "../whatsapp/whatsapp";
import { getSlotsForDate } from "./select-date";

export async function handleConfirmed(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
): Promise<void> {
  const { professional_id, service_id, selected_date, selected_time, service_name, service_duration } =
    conv.temp_data as Record<string, string>;

  const slots = await getSlotsForDate(
    professional_id,
    selected_date,
    Number(service_duration),
    tenant.slot_interval_minutes,
  );

  const stillAvailable = slots.some((s) => s.start === selected_time);

  if (!stillAvailable) {
    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "😕 Ese horario se acaba de ocupar. Te muestro los que quedan:",
    );
    const newTempData = { ...conv.temp_data as object, selected_time: undefined };
    await db.update(conversationStates).set({ state: "select_time", temp_data: newTempData }).where(eq(conversationStates.id, conv.id));
    conv.state = "select_time";
    conv.temp_data = newTempData;
    const { handleSelectTime } = await import("./select-time");
    return handleSelectTime(conv, tenant, client, "");
  }

  await db.insert(appointments).values({
    tenant_id: tenant.id,
    professional_id,
    service_id,
    client_id: client.id,
    datetime: new Date(`${selected_date}T${selected_time}:00`),
    status: "confirmed",
  });

  await db.insert(notifications).values({
    tenant_id: tenant.id,
    type: "new_appointment",
    title: "Nuevo turno",
    body: `${client.name} saco turno para ${service_name} a las ${selected_time}`,
  });

  await sendPushToTenant(tenant.id, "Nuevo turno", `${client.name} sacó turno para ${service_name} a las ${selected_time}`);

  await sendTextMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    `✅ *¡Turno confirmado!*\n\nTe esperamos el ${selected_date} a las ${selected_time} hs.\n\nSi necesitás cancelar, escribí "cancelar turno".`,
  );

  await db.update(conversationStates).set({ state: "greeting", temp_data: {} }).where(eq(conversationStates.id, conv.id));
  conv.state = "greeting";
  conv.temp_data = {};
}
