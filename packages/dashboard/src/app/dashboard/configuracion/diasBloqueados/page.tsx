"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./diasBloqueados.module.css";

interface DaysBlocked {
  id: string;
  date: string;
  reason: string;
}

interface Professional {
  id: string;
  name: string;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function DiasBloqueadosPage() {
  const [blocked, setBlocked] = useState<DaysBlocked[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [profsRes, blockedRes] = await Promise.all([
        fetch("/api/professionals").then((r) => r.json()),
        fetch("/api/blockedDates").then((r) => r.json()),
      ]);
      setProfessionals(profsRes);
      if (profsRes.length > 0) {
        setSelectedProfId(profsRes[0].id);
      }
      setBlocked(blockedRes);
    }
    load();
  }, []);

  async function loadBlocked(profId: string) {
    const res = await fetch(`/api/blockedDates?professionalId=${profId}`);
    const data = await res.json();
    setBlocked(data);
  }

  function handleProfessionalChange(profId: string) {
    setSelectedProfId(profId);
    loadBlocked(profId);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    if (!date) {
      setError("La fecha es obligatoria");
      setLoading(false);
      return;
    }

    setError("");

    await fetch("/api/blockedDates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        reason: reason || "",
        professionalId: selectedProfId || undefined,
      }),
    });

    await loadBlocked(selectedProfId);
    setDate("");
    setReason("");
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/blockedDates/${id}`, { method: "DELETE" });
    setBlocked(blocked.filter((b) => b.id !== id));
  }

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
          <h1 className={styles.headerTitle}>Días bloqueados</h1>
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

        {/* Formulario */}
        <div className={styles.formCard}>
          <p className={styles.formTitle}>Bloquear un día</p>
          <form onSubmit={handleAdd} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setError(""); }}
                className={`${styles.dateInput} ${error ? styles.dateInputError : ""}`}
              />
              {error && <p className={styles.errorMsg}>{error}</p>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Motivo <span className={styles.optional}>(opcional)</span></label>
              <input
                type="text"
                placeholder="ej. Vacaciones, feriado…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={styles.reasonInput}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.addBtn}>
              {loading ? "Agregando…" : "Bloquear día"}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <p className={styles.listTitle}>Días bloqueados</p>
            {blocked.length > 0 && (
              <span className={styles.listCount}>{blocked.length}</span>
            )}
          </div>

          {blocked.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className={styles.emptyText}>Sin días bloqueados</p>
              <p className={styles.emptySub}>Los días que agregues no estarán disponibles para turnos</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {blocked.map((b) => (
                <li key={b.id} className={styles.listItem}>
                  <div className={styles.itemLeft}>
                    <div className={styles.itemDot} />
                    <div>
                      <p className={styles.itemDate}>{formatDate(b.date)}</p>
                      {b.reason && <p className={styles.itemReason}>{b.reason}</p>}
                    </div>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(b.id)}
                    aria-label="Eliminar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
