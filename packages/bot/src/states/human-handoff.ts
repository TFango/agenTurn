import { conversationStates, db, notifications } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { sendPushToTenant } from "../push/push";
import { sendTextMessage } from "../whatsapp/whatsapp";

export async function handleHumanHandoff(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  if (body.toLowerCase().includes("turno")) {
    await db.update(conversationStates).set({ state: "select_service" }).where(eq(conversationStates.id, conv.id));
    conv.state = "select_service";
    const { handleSelectService } = await import("./select-service");
    return handleSelectService(conv, tenant, client, body);
  }

  const tempData = conv.temp_data as Record<string, unknown>;
  if (Object.keys(tempData).length === 0) {
    await db.insert(notifications).values({
      type: "human_handoff",
      title: "Solicitud de atencion",
      body: `${client.name} quiere hablar con alguien`,
      tenant_id: tenant.id,
    });

    await sendPushToTenant(tenant.id, "Atención requerida", `${client.name} quiere hablar con alguien`);

    await sendTextMessage(
      tenant.phone_number_id,
      tenant.meta_access_token!,
      conv.client_whatsapp,
      `Un momento, le avisamos a *${tenant.name}* que querés hablar. Te responderán a la brevedad.\n\nCuando quieras sacar un turno, escribí "quiero turno".`,
    );

    await db.update(conversationStates).set({ temp_data: { notified: true } }).where(eq(conversationStates.id, conv.id));
    conv.temp_data = { notified: true };
  }
}
