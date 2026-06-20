import { ConversationState, Tenant, Client, WaitList } from "@agenturn/db";
import { sendButtonMessage, sendTextMessage } from "../whatsapp/whatsapp";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleWaitlist(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const { service_id } = conv.temp_data as { service_id: string };

  if (body === "waitlist_yes") {
    await WaitList.create({
      tenant_id: tenant.id,
      client_id: client.id,
      service_id: service_id,
    });
    await conv.update({ state: "greeting" });
    await sendTextMessage(
      tenant.whatsapp_number,
      conv.client_whatsapp,
      "✅ Te anotamos en la lista de espera. Te avisamos cuando haya un lugar disponible.",
    );
    return;
  } else if (body === "waitlist_no") {
    await sendTextMessage(
      tenant.whatsapp_number,
      conv.client_whatsapp,
      "Entendido. Escribinos cuando quieras para consultar disponibilidad. 👋",
    );
    await conv.update({ state: "greeting" });
    return;
  }

  await sendButtonMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    "Por el momento no hay turnos disponibles en los próximos 14 días. ¿Querés que te avisemos cuando haya lugar?",
    [
      { id: "waitlist_yes", title: "✅ Sí, avisarme" },
      { id: "waitlist_no", title: "❌ No, gracias" },
    ],
  );
}
