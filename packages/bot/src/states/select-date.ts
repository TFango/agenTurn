import {
  ConversationState,
  Tenant,
  Client,
  WorkingHours,
  Appointment,
  BlockedDate,
  Service,
  getAvailableSlots,
} from "@agenturn/db";
import { sendListMessage, sendTextMessage } from "../whatsapp/whatsapp";

type ConversationI = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

function formatDateAR(dateStr: string): string {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const date = new Date(`${dateStr}T12:00:00`);
  const [, m, d] = dateStr.split("-");
  return `${days[date.getDay()]} ${d}/${m}`;
}

export async function handleSelectDate(
  conv: ConversationI,
  tenant: TenantI,
  client: ClientI,
  body: string,
) {
  const { professional_id, service_duration } = conv.temp_data as {
    professional_id: string;
    service_duration: number;
  };

  // Si el cliente ya eligió una fecha (formato YYYY-MM-DD)
  if (body && body.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const slots = await getSlotsForDate(
      professional_id,
      body,
      service_duration,
      tenant.slot_interval_minutes,
    );

    if (slots.length > 0) {
      await conv.update({
        state: "select_time",
        temp_data: { ...conv.temp_data, selected_date: body },
      });
      const { handleSelectTime } = await import("./select-time");
      return handleSelectTime(conv, tenant, client, body);
    }

    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "Ese día no tengo lugar disponible. Acá te muestro los días que sí tienen:",
    );
  }

  // Generar próximos 14 días con disponibilidad
  const availableDays = await getAvailableDays(
    professional_id,
    service_duration,
    tenant.slot_interval_minutes,
  );

  if (availableDays.length === 0) {
    await conv.update({ state: "waitlist", temp_data: conv.temp_data });
    const { handleWaitlist } = await import("./waitlist");
    return handleWaitlist(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Qué día preferís?",
    "Ver días",
    availableDays.slice(0, 10).map((d) => ({ id: d, title: formatDateAR(d) })),
  );
}

// Obtiene los slots disponibles para una fecha específica
export async function getSlotsForDate(
  professionalId: string,
  date: string,
  serviceDuration: number,
  slotInterval: number,
) {
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

  // ¿Trabaja ese día?
  const wh = await WorkingHours.findOne({
    where: { professional_id: professionalId, day_of_week: dayOfWeek },
  });
  if (!wh) return [];

  // ¿Está bloqueado?
  const blocked = await BlockedDate.findOne({
    where: { professional_id: professionalId, date },
  });
  if (blocked) return [];

  // Buscar turnos confirmados de ese día
  const dateStart = new Date(`${date}T00:00:00`);
  const dateEnd = new Date(`${date}T23:59:59`);
  const appointments = await Appointment.findAll({
    where: { professional_id: professionalId, status: "confirmed" },
    include: [{ model: Service, as: "service" }],
  });

  const dayAppointments = appointments
    .filter((a) => {
      const dt = new Date(a.datetime);
      return dt >= dateStart && dt <= dateEnd;
    })
    .map((a) => ({
      datetime: new Date(a.datetime),
      duration_minutes: (a as any).service.duration_minutes,
    }));

  return getAvailableSlots(
    { start_time: wh.start_time, end_time: wh.end_time },
    dayAppointments,
    serviceDuration,
    slotInterval,
    date,
  );
}

// Busca los próximos 14 días que tengan al menos un slot disponible
async function getAvailableDays(
  professionalId: string,
  serviceDuration: number,
  slotInterval: number,
): Promise<string[]> {
  const available: string[] = [];
  const today = new Date();

  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const slots = await getSlotsForDate(
      professionalId,
      dateStr,
      serviceDuration,
      slotInterval,
    );
    if (slots.length > 0) available.push(dateStr);
  }

  return available;
}
