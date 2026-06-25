"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./horarios.module.css";

const LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ABREV  = ["Dom",     "Lun",   "Mar",    "Mié",       "Jue",    "Vie",     "Sáb"];

interface DayConfig {
  day_of_week: number;
  active: boolean;
  start_time: string;
  end_time: string;
}

interface Professional {
  id: string;
  name: string;
}

function parseDays(fromDb: any[]): DayConfig[] {
  return [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    const found = fromDb.find((d: any) => d.day_of_week === dow);
    return {
      day_of_week: dow,
      active: !!found,
      start_time: found?.start_time ?? "09:00",
      end_time: found?.end_time ?? "18:00",
    };
  });
}

export default function HorariosPage() {
  const [days, setDays] = useState<DayConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>("");

  useEffect(() => {
    async function load() {
      const [profsRes, hoursRes] = await Promise.all([
        fetch("/api/professionals").then((r) => r.json()),
        fetch("/api/workingHours").then((r) => r.json()),
      ]);
      setProfessionals(profsRes);
      if (profsRes.length > 0) {
        setSelectedProfId(profsRes[0].id);
      }
      setDays(parseDays(hoursRes.workingHours));
    }
    load();
  }, []);

  async function loadHours(profId: string) {
    const res = await fetch(`/api/workingHours?professionalId=${profId}`);
    const data = await res.json();
    setDays(parseDays(data.workingHours));
    setSaved(false);
  }

  function handleProfessionalChange(profId: string) {
    setSelectedProfId(profId);
    loadHours(profId);
  }

  function toggle(i: number, checked: boolean) {
    const updated = [...days];
    updated[i] = { ...updated[i], active: checked };
    setDays(updated);
    setSaved(false);
  }

  function updateTime(i: number, field: "start_time" | "end_time", value: string) {
    const updated = [...days];
    updated[i] = { ...updated[i], [field]: value };
    setDays(updated);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/workingHours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        professionalId: selectedProfId || undefined,
        hours: days.filter((d) => d.active).map(({ active, ...rest }) => rest),
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  const activeCount = days.filter((d) => d.active).length;

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <Link href="/dashboard/configuracion" className={styles.backBtn} aria-label="Volver">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <p className={styles.headerSub}>CONFIGURACIÓN</p>
          <h1 className={styles.headerTitle}>Horarios</h1>
        </div>
      </header>

      <div className={styles.content}>

        {professionals.length > 1 && (
          <div className={styles.profSelector}>
            <label className={styles.profLabel}>PROFESIONAL</label>
            <select
              className={styles.profSelect}
              value={selectedProfId}
              onChange={(e) => handleProfessionalChange(e.target.value)}
            >
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.summaryBadge}>
          <span className={styles.summaryDot} />
          {activeCount === 0
            ? "Sin días activos"
            : `${activeCount} día${activeCount > 1 ? "s" : ""} activo${activeCount > 1 ? "s" : ""}`}
        </div>

        <div className={styles.daysList}>
          {days.map((day, i) => (
            <div
              key={day.day_of_week}
              className={`${styles.dayRow} ${day.active ? styles.dayRowActive : ""}`}
            >
              <div className={styles.dayTop}>
                <div className={styles.dayLeft}>
                  <span className={styles.dayAbrev}>{ABREV[day.day_of_week]}</span>
                  <span className={styles.dayLabel}>{LABELS[day.day_of_week]}</span>
                </div>

                <button
                  role="switch"
                  aria-checked={day.active}
                  className={`${styles.toggle} ${day.active ? styles.toggleOn : ""}`}
                  onClick={() => toggle(i, !day.active)}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              {day.active && (
                <div className={styles.timeRow}>
                  <div className={styles.timeField}>
                    <label className={styles.timeLabel}>Desde</label>
                    <input
                      type="time"
                      className={styles.timeInput}
                      value={day.start_time}
                      onChange={(e) => updateTime(i, "start_time", e.target.value)}
                    />
                  </div>
                  <div className={styles.timeSep} />
                  <div className={styles.timeField}>
                    <label className={styles.timeLabel}>Hasta</label>
                    <input
                      type="time"
                      className={styles.timeInput}
                      value={day.end_time}
                      onChange={(e) => updateTime(i, "end_time", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ""}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Guardando…" : saved ? "¡Guardado!" : "Guardar horarios"}
        </button>

      </div>
    </div>
  );
}
