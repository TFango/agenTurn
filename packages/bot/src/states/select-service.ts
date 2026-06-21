import { Client, ConversationState, Service, Tenant } from "@agenturn/db";
import { sendListMessage } from "../whatsapp/whatsapp";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleSelectService(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const services = await Service.findAll({
    where: { tenant_id: tenant.id, active: true },
  });

  const selected = services.find((s) => s.id === body);

  if (selected) {
    await conv.update({
      state: "select_professional",
      temp_data: {
        ...conv.temp_data,
        service_id: selected.id,
        service_name: selected.name,
        service_duration: selected.duration_minutes,
      },
    });

    const { handleSelectProfessional } = await import("./select-professional")
    return handleSelectProfessional(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Qué servicio querés reservar?",
    "Ver servicios",
    services.map((s) => ({
      id: s.id,
      title: s.name,
      description: `${s.duration_minutes} min - $${s.price}`,
    })),
  );
}
