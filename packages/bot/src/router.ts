import { ConversationState, Tenant } from "@agenturn/db";
import { findOrCreateClient } from "./client-lookup";
import { dispatchState } from "./state-machine";

const RESET_KEYWORDS = ["cancelar", "salir", "menu", "menú"];

export async function routeMessage(
  from: string,
  to: string,
  body: string,
  contactName?: string,
) {
  const tenant = await Tenant.findOne({ where: { whatsapp_number: to } });

  if (!tenant) {
    return;
  }

  const client = await findOrCreateClient(tenant.id, from, contactName);

  const [instance, created] = await ConversationState.findOrCreate({
    where: { client_whatsapp: from, tenant_id: tenant.id },
    defaults: {
      tenant_id: tenant.id,
      client_whatsapp: from,
      state: "greeting",
      temp_data: {},
    },
  });

  if (body.toLowerCase().trim() === "cancelar turno") {
    await instance.update({ state: "cancel_select" });
  } else if (
    body === "back_to_menu" ||
    (RESET_KEYWORDS.some((kw) => body.toLowerCase().trim().includes(kw)) &&
    instance.state !== "greeting")
  ) {
    await instance.update({ state: "greeting", temp_data: {} });
  }

  await dispatchState(instance, tenant, client, body);
}
