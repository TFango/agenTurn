"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./cliente.module.css";

interface Client {
  id: string;
  tenant_id: string;
  name: string;
  whatsapp_number: string;
  notes: string;
  appointments: Appointment[];
}

interface Appointment {
  id: string;
  professional: Professional;
  service: Service;
  datetime: string;
  status: "pending" | "confirmed" | "cancelled";
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface Professional {
  id: string;
  name: string;
}

function formatDate(datetime: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(datetime));
}

function formatDateShort(datetime: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(new Date(datetime));
}

function formatWhatsApp(number: string) {
  const digits = number.replace(/\D/g, "");
  // Argentina: +54 9 11 XXXX-XXXX
  if (digits.startsWith("549") && digits.length === 13) {
    return `+54 9 ${digits.slice(3, 5)} ${digits.slice(5, 9)}-${digits.slice(9)}`;
  }
  // fallback: +XX X XXXX-XXXX
  if (digits.length >= 10) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return number;
}

const DOT_COLORS = ["var(--sage)", "var(--terra)"];

export default function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cliente, setCliente] = useState<Client | null>(null);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then(setCliente);
  }, [id]);
  
  const [notas, setNotas] = useState(cliente?.notes ?? "");

  useEffect(() => {
    if (cliente) setNotas(cliente.notes ?? "");
  }, [cliente]);


  if (!cliente) {
    return (
      <div className={styles.page}>
        <p style={{ padding: 24, color: "var(--ink-3)" }}>
          Cliente no encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Back header */}
      <header className={styles.topBar}>
        <button
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="Volver"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.topLabel}>CLIENTE</span>
      </header>

      {/* Avatar + nombre */}
      <div className={styles.profile}>
        <h1 className={styles.name}>{cliente.name}</h1>
        <div className={styles.phone}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className={styles.waIcon}
          >
            <path
              fill="#25D366"
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
            />
            <path
              fill="#25D366"
              d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.167L2 22l4.985-1.407A9.945 9.945 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.94 7.94 0 0 1-4.078-1.124l-.292-.174-3.017.851.814-2.981-.19-.306A7.944 7.944 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"
            />
          </svg>
          {formatWhatsApp(cliente.whatsapp_number)}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {cliente.appointments.length}
          </span>
          <span className={styles.statLabel}>TURNOS</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {cliente.appointments[0]
              ? formatDateShort(cliente.appointments[0].datetime)
              : "-"}
          </span>
          <span className={styles.statLabel}>ÚLTIMO</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Notas */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>NOTAS</p>
        <textarea
          className={styles.notasInput}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Agregar nota..."
          rows={3}
        />
      </section>

      <div className={styles.divider} />

      {/* Historial */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>HISTORIAL</p>
        <div className={styles.historial}>
          {cliente.appointments.map((t, i) => (
            <div key={t.id} className={styles.historialRow}>
              <span
                className={styles.dot}
                style={{
                  background:
                    t.status === "cancelled"
                      ? "var(--rose)"
                      : DOT_COLORS[i % 2],
                }}
              />
              <div className={styles.historialInfo}>
                <p
                  className={styles.historialServicio}
                  style={{
                    color:
                      t.status === "cancelled" ? "var(--rose)" : "var(--terra)",
                  }}
                >
                  {t.service.name}
                </p>
                <p className={styles.historialMeta}>
                  {t.professional.name} · {formatDate(t.datetime)}
                </p>
              </div>
              {t.status === "cancelled" && (
                <span className={styles.canceladoBadge}>Cancelado</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
