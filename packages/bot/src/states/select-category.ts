import {
  ConversationState,
  Tenant,
  Client,
  ServiceCategory,
} from "@agenturn/db";
import { sendListMessage } from "../whatsapp/whatsapp";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleSelectCategory(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const categories = await ServiceCategory.findAll({
    where: { tenant_id: tenant.id },
  });

  if (categories.length === 0) {
    await conv.update({ state: "select_service" });
    const { handleSelectService } = await import("./select-service");
    return handleSelectService(conv, tenant, client, body);
  }

  const selected = categories.find((s) => s.id === body);

  if (selected) {
    await conv.update({
      state: "select_service",
      temp_data: {
        ...conv.temp_data,
        category_id: selected.id,
      },
    });

    const { handleSelectService } = await import("./select-service");
    return handleSelectService(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Qué tipo de servicio estás buscando?",
    "Ver opciones",
    [
      ...categories.slice(0, 9).map((c) => ({
        id: c.id,
        title: c.name,
      })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
