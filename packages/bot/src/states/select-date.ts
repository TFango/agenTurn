import { appointments, blockedDates, conversationStates, db, getAvailableSlots, services, workingHours } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { and, between, eq } from "drizzle-orm";
import { getHoursAR, getMinutesAR, nowAR, todayAR } from "../utils/date";
import { sendListMessage, sendTextMessage } from "../whatsapp/whatsapp";

function formatDateAR(dateStr: string): string {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const date = new Date(`${dateStr}T12:00:00`);
  const [, m, d] = dateStr.split("-");
  return `${days[date.getDay()]} ${d}/${m}`;
}

export async function handleSelectDate(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
) {
  const { professional_id, service_duration } = conv.temp_data as {
    professional_id: string;
    service_duration: number;
  };

  if (body && body.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const slots = await getSlotsForDate(professional_id, body, service_duration, tenant.slot_interval_minutes);

    if (slots.length > 0) {
      const newTempData = { ...conv.temp_data as object, selected_date: body };
      await db.update(conversationStates).set({ state: "select_time", temp_data: newTempData }).where(eq(conversationStates.id, conv.id));
      conv.state = "select_time";
      conv.temp_data = newTempData;
      const { handleSelectTime } = await import("./select-time");
      return handleSelectTime(conv, tenant, client, body);
    }

    await sendTextMessage(
      tenant.phone_number_id,
      conv.client_whatsapp,
      "Ese día no tengo lugar disponible. Acá te muestro los días que sí tienen:",
    );
  }

  const availableDays = await getAvailableDays(professional_id, service_duration, tenant.slot_interval_minutes);

  if (availableDays.length === 0) {
    await db.update(conversationStates).set({ state: "waitlist", temp_data: conv.temp_data }).where(eq(conversationStates.id, conv.id));
    conv.state = "waitlist";
    const { handleWaitlist } = await import("./waitlist");
    return handleWaitlist(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.phone_number_id,
    conv.client_whatsapp,
    "¿Qué día preferís?",
    "Ver días",
    [
      ...availableDays.slice(0, 9).map((d) => ({ id: d, title: formatDateAR(d) })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  );
}

export async function getSlotsForDate(
  professionalId: string,
  date: string,
  serviceDuration: number,
  slotInterval: number,
) {
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

  const wh = await db
    .select()
    .from(workingHours)
    .where(and(eq(workingHours.professional_id, professionalId), eq(workingHours.day_of_week, dayOfWeek)))
    .then((r) => r[0]);
  if (!wh) return [];

  const blocked = await db
    .select({ id: blockedDates.id })
    .from(blockedDates)
    .where(and(eq(blockedDates.professional_id, professionalId), eq(blockedDates.date, date)))
    .then((r) => r[0]);
  if (blocked) return [];

  const dateStart = new Date(`${date}T00:00:00`);
  const dateEnd = new Date(`${date}T23:59:59`);

  const dayAppointments = await db
    .select({ datetime: appointments.datetime, duration_minutes: services.duration_minutes })
    .from(appointments)
    .leftJoin(services, eq(appointments.service_id, services.id))
    .where(
      and(
        eq(appointments.professional_id, professionalId),
        eq(appointments.status, "confirmed"),
        between(appointments.datetime, dateStart, dateEnd),
      ),
    );

  const existingAppointments = dayAppointments.map((a) => {
    const dt = new Date(a.datetime);
    return {
      startHour: getHoursAR(dt),
      startMinute: getMinutesAR(dt),
      duration_minutes: a.duration_minutes ?? serviceDuration,
    };
  });

  const slots = getAvailableSlots(
    { start_time: wh.start_time!, end_time: wh.end_time! },
    existingAppointments,
    serviceDuration,
    slotInterval,
  );

  if (date === todayAR()) {
    const now = nowAR();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.filter((s) => {
      const [h, m] = s.start.split(":").map(Number);
      return h * 60 + m > nowMinutes;
    });
  }

  return slots;
}

async function getAvailableDays(
  professionalId: string,
  serviceDuration: number,
  slotInterval: number,
): Promise<string[]> {
  const available: string[] = [];
  const todayStr = todayAR();
  const [y, m, d2] = todayStr.split("-").map(Number);

  for (let i = 1; i <= 14; i++) {
    const d = new Date(y, m - 1, d2 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const slots = await getSlotsForDate(professionalId, dateStr, serviceDuration, slotInterval);
    if (slots.length > 0) available.push(dateStr);
  }

  return available;
}
