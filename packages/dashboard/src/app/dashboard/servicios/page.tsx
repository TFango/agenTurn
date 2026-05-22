'use client';

import { useState, useEffect } from 'react';
import styles from './servicios.module.css';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
}

const SERVICE_COLORS = [
  'var(--terra)',
  'var(--plum)',
  'var(--sand)',
  'var(--sage)',
  'var(--sky)',
  'var(--rose)',
];

function getColor(index: number) {
  return SERVICE_COLORS[index % SERVICE_COLORS.length];
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then(setServices);
  }, []);

  const activeCount = services.filter((s) => s.active).length;

  async function toggleActive(service: Service) {
    const updated = { ...service, active: !service.active };
    setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
    await fetch(`/api/services/${service.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !service.active }),
    });
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
          <button className={styles.iconBtn} aria-label="Notificaciones">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className={styles.notifDot} />
          </button>

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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={styles.clockIcon}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {service.duration_minutes} min &nbsp; ${service.price.toLocaleString('es-AR')}
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
      <button className={styles.fab} aria-label="Agregar servicio">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

    </div>
  );
}
