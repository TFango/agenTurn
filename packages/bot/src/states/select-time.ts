import { ConversationState, Tenant, Client } from "@agenturn/db";
import { sendListMessage } from "../whatsapp/whatsapp";
import { getSlotsForDate } from "./select-date";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleSelectTime(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const { professional_id, service_duration, selected_date } =
    conv.temp_data as {
      professional_id: string;
      service_duration: number;
      selected_date: string;
    };

  // Si el cliente ya eligió un horario (formato HH:MM)
  if (body.match(/^\d{2}:\d{2}$/)) {
    await conv.update({
      state: "confirm",
      temp_data: { ...conv.temp_data, selected_time: body },
    });
    const { handleConfirm } = await import("./confirm");
    return handleConfirm(conv, tenant, client, body);
  }

  // Mostrar slots disponibles para la fecha elegida
  const slots = await getSlotsForDate(
    professional_id,
    selected_date,
    service_duration,
    tenant.slot_interval_minutes,
  );

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    `¿A qué hora? (${selected_date})`,
    "Ver horarios",
    [
      ...slots.slice(0, 9).map((s) => ({
        id: s.start,
        title: s.start,
        description: `Termina ${s.end}`,
      })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}
