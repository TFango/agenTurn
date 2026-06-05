"use client";

import { useEffect, useState } from "react";
import styles from "./agenda.module.css";
import type { Appointment, Client, Professional, Service } from "./types";

const DAY_LABELS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function getMonthDays(base: Date): Date[] {
  const year = base.getFullYear();
  const month = base.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  return Array.from(
    { length: totalDays },
    (_, i) => new Date(year, month, i + 1),
  );
}

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function toTimeString(datetime: string): string {
  const d = new Date(datetime);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const PROF_COLORS: Record<string, { bg: string; fg: string }> = {
  Analía: { bg: "var(--terra-soft)", fg: "var(--terra)" },
  Sofía: { bg: "var(--plum-soft)", fg: "var(--plum)" },
  default: { bg: "var(--sand-soft)", fg: "var(--sand)" },
};

function profColor(name: string) {
  return PROF_COLORS[name] ?? PROF_COLORS["default"];
}

export default function AgendaPage() {
  const today = new Date();
  const monthDays = getMonthDays(today);
  const todayDate = today.getDate();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const date = selectedDate.toISOString().split("T")[0];
    fetch(`/api/appointments?from=${date}&to=${date}`)
      .then((r) => r.json())
      .then(setAppointments);
  }, [selectedDate]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.headerDate}>
            {today
              .toLocaleDateString("es-AR", {
                weekday: "short",
                day: "numeric",
                month: "long",
              })
              .toUpperCase()}
          </p>
          <h1 className={styles.headerTitle}>Agenda</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} aria-label="Notificaciones">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className={styles.notifDot} />
          </button>
        </div>
      </header>

      <div className={styles.divider} />

      {/* Selector de días */}
      <div className={styles.dayStripWrapper}>
        <p className={styles.dayStripMonth}>
          {today.toLocaleDateString("es-AR", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <div className={styles.dayStrip}>
          {monthDays.map((d) => (
            <button
              onClick={() => setSelectedDate(d)}
              key={d.getDate()}
              className={`${styles.dayItem} ${d.getDate() === selectedDate.getDate() ? styles.dayActive : ""}`}
            >
              <span className={styles.dayLabel}>{DAY_LABELS[d.getDay()]}</span>
              <span className={styles.dayNumber}>{d.getDate()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{appointments.length}</span>
          <span className={styles.statLabel}>TURNOS HOY</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardSage}`}>
          <span className={styles.statNumber}>
            {appointments.filter((a) => a.status === "confirmed").length}
          </span>
          <span className={styles.statLabel}>CONFIRMADOS</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardSand}`}>
          <span className={styles.statNumber}>
            {appointments
              .filter((a) => a.status === "confirmed")
              .reduce((suma, a) => suma + a.service.price, 0)}
          </span>
          <span className={styles.statLabel}>INGRESOS</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Lista de turnos */}
      <section className={styles.daySection}>
        <p className={styles.daySectionTitle}>TU DÍA</p>

        <div className={styles.appointments}>
          {appointments.map((a) => {
            const timeStart = toTimeString(a.datetime);

            return (
              <div className={styles.appointmentRow} key={a.id}>
                <div className={styles.timeCol}>
                  <span className={styles.timeStart}>{timeStart}</span>
                  <span className={styles.timeDuration}>
                    {a.service.duration_minutes}m
                  </span>
                  <span className={styles.timeEnd}>
                    {addMinutes(timeStart, a.service.duration_minutes)}
                  </span>
                </div>
                <div className={styles.timelineCol}>
                  <span className={styles.dot} />
                  <span
                    className={styles.line}
                    style={{ height: `${a.service.duration_minutes * 0.8}px` }}
                  />
                </div>
                <div className={styles.appointmentCard}>
                  <h3 className={styles.cardService}>{a.service.name}</h3>
                  <p className={styles.cardClient}>{a.client.name}</p>
                  <div className={styles.cardMeta}>
                    <span
                      className={styles.cardProfessional}
                      style={{
                        background: profColor(a.professional?.name ?? '').bg,
                        color: profColor(a.professional?.name ?? '').fg,
                      }}
                    >
                      {a.professional?.name}
                    </span>
                    <span className={styles.cardPrice}>${a.service.price.toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Botón flotante */}
      <button className={styles.fab} aria-label="Nuevo turno">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
