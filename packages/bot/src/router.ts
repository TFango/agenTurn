import { conversationStates, db, tenants } from "@agenturn/db";
import type { ConversationState, Tenant } from "@agenturn/db";
import { and, eq } from "drizzle-orm";
import { findOrCreateClient } from "./client-lookup";
import { dispatchState } from "./state-machine";

const RESET_KEYWORDS = ["salir", "menu", "menú", "turno"];

export async function routeMessage(
  from: string,
  to: string,
  body: string,
  contactName?: string,
) {
  const tenant: Tenant | undefined = await db
    .select()
    .from(tenants)
    .where(eq(tenants.whatsapp_number, to))
    .then((r) => r[0]);

  if (!tenant) return;

  const client = await findOrCreateClient(tenant.id, from, contactName);

  // findOrCreate: intentar insertar, si ya existe no hacer nada, luego traer
  await db
    .insert(conversationStates)
    .values({
      tenant_id: tenant.id,
      client_whatsapp: from,
      state: "greeting",
      temp_data: {},
    })
    .onConflictDoNothing();

  const conv: ConversationState = await db
    .select()
    .from(conversationStates)
    .where(and(eq(conversationStates.client_whatsapp, from), eq(conversationStates.tenant_id, tenant.id)))
    .then((r) => r[0]);

  if (body.toLowerCase().trim() === "cancelar turno") {
    await db
      .update(conversationStates)
      .set({ state: "cancel_select" })
      .where(eq(conversationStates.id, conv.id));
    conv.state = "cancel_select";
  } else if (
    body === "back_to_menu" ||
    (RESET_KEYWORDS.some((kw) => body.toLowerCase().trim().includes(kw)) &&
      conv.state !== "greeting")
  ) {
    await db
      .update(conversationStates)
      .set({ state: "greeting", temp_data: {} })
      .where(eq(conversationStates.id, conv.id));
    conv.state = "greeting";
    conv.temp_data = {};
  }

  await dispatchState(conv, tenant, client, body);
}
