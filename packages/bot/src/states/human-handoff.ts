import { ConversationState, Tenant, Client, Notification } from "@agenturn/db";
import { sendTextMessage } from "../whatsapp/whatsapp";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleHumanHandoff(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  if (body.toLowerCase().includes("turno")) {
    await conv.update({ state: "select_service" });
    const { handleSelectService } = await import("./select-service");
    return handleSelectService(conv, tenant, client, body);
  }

  if (Object.keys(conv.temp_data).length === 0) {
    await Notification.create({
      type: "human_handoff",
      title: "Solicitud de atencion",
      body: `${client.name} quiere hablar con alguien`,
      tenant_id: tenant.id,
    });
    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      `Un momento, le avisamos a *${tenant.name}* que querés hablar. Te responderán a la brevedad.\n\nCuando quieras sacar un turno, escribí "quiero turno".`,
    );
    await conv.update({ temp_data: { notified: true } });
  }
}
