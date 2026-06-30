import { clients, db } from "@agenturn/db";
import { and, eq } from "drizzle-orm";

export async function findOrCreateClient(
  tenantId: string,
  whatsappNumber: string,
  contactName?: string,
) {
  if (!whatsappNumber) {
    throw new Error("El numero de wpp es requerido");
  }

  await db
    .insert(clients)
    .values({
      tenant_id: tenantId,
      whatsapp_number: whatsappNumber,
      name: contactName ?? `Cliente ${whatsappNumber.slice(-4)}`,
    })
    .onConflictDoNothing();

  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.tenant_id, tenantId), eq(clients.whatsapp_number, whatsappNumber)))
    .then((r) => r[0]);

  return client;
}
