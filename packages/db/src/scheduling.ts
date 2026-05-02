export type WorkingHoursRange = {
  start_time: string;
  end_time: string;
};

export type TimeSlot = {
  start: string;
  end: string;
};

function timeToMinutes(time: string): number {
  const parts = time.split(":");

  const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);

  return minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function getAvailableSlots(
  workingHours: WorkingHoursRange,
  existingAppointments: any[],
  serviceDurationMinutes: number,
  slotIntervalMinutes: number,
  date: string,
): TimeSlot[] {
  const { start_time, end_time } = workingHours;

  const start_work = timeToMinutes(start_time);
  const end_work = timeToMinutes(end_time);

  const slots: TimeSlot[] = [];

  for (
    let current = start_work;
    current + serviceDurationMinutes <= end_work;
    current += slotIntervalMinutes
  ) {
    const slot = {
      start: minutesToTime(current),
      end: minutesToTime(current + serviceDurationMinutes),
    };
    slots.push(slot);
  }

  return slots.filter((slot) => {
    const slotStart = timeToMinutes(slot.start);
    const slotEnd = timeToMinutes(slot.end);

    return !existingAppointments.some((appt) => {
      const apptStart =
        appt.datetime.getHours() * 60 + appt.datetime.getMinutes();
      const apptEnd = apptStart + appt.duration_minutes;

      return slotStart < apptEnd && slotEnd > apptStart;
    });
  });
}
