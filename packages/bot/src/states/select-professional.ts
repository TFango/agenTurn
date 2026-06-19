import { ConversationState, Tenant, Client, Professional } from "@agenturn/db";
import { sendListMessage } from "../whatsapp/whatsapp";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleSelectProfessional(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const professionals = await Professional.findAll({
    where: { tenant_id: tenant.id, active: true },
  });

  const selected = professionals.find((s) => s.id === body);

  if (professionals.length === 1) {
    await conv.update({
      state: "select_date",
      temp_data: {
        ...conv.temp_data,
        professional_id: professionals[0].id,
        professional_name: professionals[0].name,
      },
    });
    const { handleSelectDate } = await import("./select-date");
    return handleSelectDate(conv, tenant, client, body);
  }

  if (selected) {
    await conv.update({
      state: "select_date",
      temp_data: {
        ...conv.temp_data,
        professional_id: selected.id,
        professional_name: selected.name,
      },
    });
    const { handleSelectDate } = await import("./select-date");
    return handleSelectDate(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    "¿Que profesional desea elegir?",
    "Ver profesionales",
    professionals.map((p) => ({
      id: p.id,
      title: p.name,
    })),
  );
}
