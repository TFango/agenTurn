import {
  ConversationState,
  Tenant,
  Client,
  Appointment,
  Notification,
} from "@agenturn/db";
import { sendTextMessage } from "../whatsapp/whatsapp";
import { getSlotsForDate } from "./select-date";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleConfirmed(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  const {
    professional_id,
    service_id,
    selected_date,
    selected_time,
    service_name,
    service_duration,
  } = conv.temp_data as Record<string, string>;

  const slots = await getSlotsForDate(
    professional_id,
    selected_date,
    Number(service_duration),
    tenant.slot_interval_minutes,
  );

  const stillAvailable = slots.some((s) => s.start === selected_time);

  if (!stillAvailable) {
    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "😕 Ese horario se acaba de ocupar. Te muestro los que quedan:",
    );
    await conv.update({ state: "select_time", temp_data: { ...conv.temp_data, selected_time: undefined } });
    const { handleSelectTime } = await import("./select-time");
    return handleSelectTime(conv, tenant, client, "");
  }

  await Appointment.create({
    tenant_id: tenant.id,
    professional_id,
    service_id,
    client_id: client.id,
    datetime: new Date(`${selected_date}T${selected_time}:00`),
    status: "confirmed",
  });

  await Notification.create({
    tenant_id: tenant.id,
    type: "new_appointment",
    title: "Nuevo turno",
    body: `${client.name} saco turno para ${service_name} a las ${selected_time}`,
  });

  await sendTextMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    `✅ *¡Turno confirmado!*\n\nTe esperamos el ${selected_date} a las ${selected_time} hs.\n\nSi necesitás cancelar, escribí "cancelar turno".`,
  );

  await conv.update({
    state: "greeting",
    temp_data: {},
  });
}
