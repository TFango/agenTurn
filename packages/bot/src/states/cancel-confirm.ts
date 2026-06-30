import { appointments, conversationStates, db, notifications } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { sendPushToTenant } from "../push/push";
import { sendButtonMessage, sendTextMessage } from "../whatsapp/whatsapp";

export async function handleCancelConfirm(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  const { appointment_id } = conv.temp_data as { appointment_id: string };

  if (body === "yes") {
    await db
      .update(appointments)
      .set({ status: "cancelled" })
      .where(and(eq(appointments.id, appointment_id), eq(appointments.client_id, client.id)));

    await db.insert(notifications).values({
      type: "cancelled_appointment",
      title: "Turno cancelado",
      body: `${client.name} cancelo su turno`,
      tenant_id: tenant.id,
    });

    await sendPushToTenant(tenant.id, "Turno cancelado", `${client.name} canceló su turno`);

    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id));
    conv.state = "greeting";

    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "✅ Turno cancelado. ¡Hasta la próxima!",
    );
    return;
  }

  if (body === "no") {
    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id));
    conv.state = "greeting";
    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "Perfecto, el turno sigue en pie. 👍",
    );
    return;
  }

  await sendButtonMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Confirmás la cancelación del turno?",
    [
      { id: "yes", title: "✅ Sí, cancelar" },
      { id: "no", title: "↩️ No, mantener" },
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
