import { Client } from "@agenturn/db";

export async function findOrCreateClient(
  tenantId: string,
  whatsappNumber: string,
  contactName?: string,
) {
  if (!whatsappNumber) {
    throw new Error("El numero de wpp es requerido");
  }

  const [instance, create] = await Client.findOrCreate({
    where: { tenant_id: tenantId, whatsapp_number: whatsappNumber },
    defaults: {
      tenant_id: tenantId,
      name: contactName ?? `Cliente ${whatsappNumber.slice(-4)}`,
      whatsapp_number: whatsappNumber,
    },
  });

  return instance;
}
