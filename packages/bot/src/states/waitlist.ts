import { conversationStates, db, waitlist } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { sendButtonMessage, sendTextMessage } from "../whatsapp/whatsapp";

export async function handleWaitlist(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  const { service_id } = conv.temp_data as { service_id: string };

  if (body === "waitlist_yes") {
    await db.insert(waitlist).values({ tenant_id: tenant.id, client_id: client.id, service_id });
    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id));
    conv.state = "greeting";
    await sendTextMessage(
      tenant.phone_number_id,
      tenant.meta_access_token!,
      conv.client_whatsapp,
      "✅ Te anotamos en la lista de espera. Te avisamos cuando haya un lugar disponible.",
    );
    return;
  }

  if (body === "waitlist_no") {
    await sendTextMessage(
      tenant.phone_number_id,
      tenant.meta_access_token!,
      conv.client_whatsapp,
      "Entendido. Escribinos cuando quieras para consultar disponibilidad. 👋",
    );
    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id));
    conv.state = "greeting";
    return;
  }

  await sendButtonMessage(
    tenant.phone_number_id,
    tenant.meta_access_token!,
    conv.client_whatsapp,
    "Por el momento no hay turnos disponibles en los próximos 14 días. ¿Querés que te avisemos cuando haya lugar?",
    [
      { id: "waitlist_yes", title: "✅ Sí, avisarme" },
      { id: "waitlist_no", title: "❌ No, gracias" },
    ],
  );
}
