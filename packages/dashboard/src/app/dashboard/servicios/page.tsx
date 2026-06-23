"use client";

import React, { useState, useEffect } from "react";
import styles from "./servicios.module.css";
import NotificationBell from "@/components/NotificationBell/NotificationBell";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
}

const SERVICE_COLORS = [
  "var(--terra)",
  "var(--plum)",
  "var(--sand)",
  "var(--sage)",
  "var(--sky)",
  "var(--rose)",
];

function getColor(index: number) {
  return SERVICE_COLORS[index % SERVICE_COLORS.length];
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices);
  }, []);

  const activeCount = services.filter((s) => s.active).length;

  async function toggleActive(service: Service) {
    const updated = { ...service, active: !service.active };
    setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
    await fetch(`/api/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await fetch(`/api/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        durationMinutes: Number(duration),
        price: Number(price),
        active: true,
      }),
    });

    setModalOpen(false);

    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.headerCount}>{activeCount} ACTIVOS</p>
          <h1 className={styles.headerTitle}>Servicios</h1>
        </div>
        <div className={styles.headerActions}>
          <NotificationBell />
        </div>
      </header>

      {/* Lista */}
      <div className={styles.list}>
        {services.map((service, i) => (
          <div key={service.id} className={styles.card}>
            <div
              className={styles.colorBar}
              style={{ background: getColor(i) }}
            />
            <div className={styles.cardBody}>
              <p className={styles.serviceName} style={{ color: getColor(i) }}>
                {service.name}
              </p>
              <p className={styles.serviceMeta}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className={styles.clockIcon}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {service.duration_minutes} min &nbsp; $
                {service.price.toLocaleString("es-AR")}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={service.active}
              onClick={() => toggleActive(service)}
              className={`${styles.toggle} ${service.active ? styles.toggleOn : styles.toggleOff}`}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        className={styles.fab}
        aria-label="Agregar servicio"
        onClick={() => setModalOpen(true)}
      >
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

      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>Nuevo servicio</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Ej: Corte, Coloración..."
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="duration">Duración (minutos)</label>
                <input
                  type="number"
                  name="duration"
                  id="duration"
                  placeholder="45"
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="price">Precio</label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  placeholder="3500"
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnPrimary}>Guardar</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
