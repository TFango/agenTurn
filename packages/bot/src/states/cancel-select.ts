import {
  ConversationState,
  Tenant,
  Client,
  Appointment,
  Service,
} from "@agenturn/db";
import { sendListMessage, sendTextMessage } from "../whatsapp/whatsapp";
import { Op } from "sequelize";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleCancelSelect(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const turns = await Appointment.findAll({
    where: {
      tenant_id: tenant.id,
      client_id: client.id,
      status: "confirmed",
      datetime: { [Op.gte]: new Date() },
    },
    include: [{ model: Service, as: "service" }],
    order: [["datetime", "ASC"]],
  });

  const selected = turns.find((s) => s.id === body);

  if (turns.length === 0) {
    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "No tenés turnos próximos para cancelar.",
    );
    await conv.update({
      state: "greeting",
    });
    return;
  }

  if (selected) {
    await conv.update({
      state: "cancel_confirm",
      temp_data: { appointment_id: selected.id },
    });
    const { handleCancelConfirm } = await import("./cancel-confirm");
    return handleCancelConfirm(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Cuál turno querés cancelar?",
    "Ver turnos",
    turns.map((t) => {
      const dt = new Date(t.datetime);
      return {
        id: t.id,
        title: (t as any).service?.name ?? "Turno",
        description: `${dt.getDate()}/${dt.getMonth() + 1} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2, "0")}hs`,
      };
    }),
  );
}
