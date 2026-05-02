import { describe, it, expect } from "vitest";
import { getAvailableSlots } from "../scheduling";

describe("getAvailableSlots", () => {
  it("retorna todos los slots cuando no hay turnos", () => {
    const workingHours = { start_time: "09:00", end_time: "19:00" };
    const existingAppointments = [];
    const serviceDurationMinutes = 30;
    const slotIntervalMinutes = 30;
    const date = "2026-05-10";
    const resultado = getAvailableSlots(
      workingHours,
      existingAppointments,
      serviceDurationMinutes,
      slotIntervalMinutes,
      date,
    );

    expect(resultado[0]).toEqual({ start: "09:00", end: "09:30" });
  });

  it("excluye slots que se solapan con turnos existentes", () => {
    const existingAppointments = [
      {
        datetime: new Date("2026-05-10T10:00:00"),
        duration_minutes: 60,
      },
    ];
    const resultado = getAvailableSlots(
      { start_time: "09:00", end_time: "19:00" },
      existingAppointments,
      30,
      30,
      "2026-05-10",
    );

    expect(resultado).not.toContainEqual({ start: "10:00", end: "10:30" });
  });
});
