import { appointments, conversationStates, db, services } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { and, asc, eq, gte } from "drizzle-orm";
import { formatDateTimeAR, nowAR } from "../utils/date";
import { sendListMessage, sendTextMessage } from "../whatsapp/whatsapp";

export async function handleCancelSelect(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  const turns = await db
    .select({
      id: appointments.id,
      datetime: appointments.datetime,
      serviceName: services.name,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.service_id, services.id))
    .where(
      and(
        eq(appointments.tenant_id, tenant.id),
        eq(appointments.client_id, client.id),
        eq(appointments.status, "confirmed"),
        gte(appointments.datetime, nowAR()),
      ),
    )
    .orderBy(asc(appointments.datetime));

  if (turns.length === 0) {
    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "No tenés turnos próximos para cancelar.",
    );
    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id));
    conv.state = "greeting";
    return;
  }

  const selected = turns.find((t) => t.id === body);

  if (selected) {
    const newTempData = { ...conv.temp_data as object, appointment_id: selected.id };
    await db.update(conversationStates).set({ state: "cancel_confirm", temp_data: newTempData }).where(eq(conversationStates.id, conv.id));
    conv.state = "cancel_confirm";
    conv.temp_data = newTempData;
    const { handleCancelConfirm } = await import("./cancel-confirm");
    return handleCancelConfirm(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Cuál turno querés cancelar?",
    "Ver turnos",
    [
      ...turns.slice(0, 9).map((t) => ({
        id: t.id,
        title: t.serviceName ?? "Turno",
        description: t.datetime ? formatDateTimeAR(new Date(t.datetime)) : "",
      })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
