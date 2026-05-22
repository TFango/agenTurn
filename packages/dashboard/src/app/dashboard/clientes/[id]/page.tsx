'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './cliente.module.css';

interface Turno {
  id: string;
  servicio: string;
  profesional: string;
  fecha: string;
  cancelado?: boolean;
}

interface ClienteDetalle {
  id: string;
  name: string;
  phone: string;
  avatarBg: string;
  turnos: number;
  gastado: string;
  ultimo: string;
  notas: string;
  historial: Turno[];
}

const CLIENTES: Record<string, ClienteDetalle> = {
  '1': {
    id: '1',
    name: 'Valentina Gómez',
    phone: '+54911  2345-6789',
    avatarBg: 'linear-gradient(135deg, #c45c34, #8a3a1e)',
    turnos: 8,
    gastado: '$48k',
    ultimo: '28 abr',
    notas: 'Prefiere turnos por la mañana. Alérgica a tintes con amoníaco.',
    historial: [
      { id: 'h1', servicio: 'Corte',     profesional: 'Analía', fecha: '28 abr 2026' },
      { id: 'h2', servicio: 'Coloración',profesional: 'Analía', fecha: '15 mar 2026' },
      { id: 'h3', servicio: 'Peinado',   profesional: 'Sofía',  fecha: '10 feb 2026', cancelado: true },
    ],
  },
  '2': {
    id: '2',
    name: 'Camila Rodríguez',
    phone: '+54911  8765-4321',
    avatarBg: 'linear-gradient(135deg, #7a8961, #4a5a3a)',
    turnos: 3,
    gastado: '$18k',
    ultimo: '20 abr',
    notas: '',
    historial: [
      { id: 'h1', servicio: 'Corte',  profesional: 'Analía', fecha: '20 abr 2026' },
      { id: 'h2', servicio: 'Mechado',profesional: 'Analía', fecha: '10 mar 2026' },
      { id: 'h3', servicio: 'Corte',  profesional: 'Sofía',  fecha: '5 ene 2026' },
    ],
  },
};

const DOT_COLORS = ['var(--sage)', 'var(--terra)', 'var(--rose)'];

export default function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const cliente = CLIENTES[id];

  const [notas, setNotas] = useState(cliente?.notas ?? '');

  if (!cliente) {
    return (
      <div className={styles.page}>
        <p style={{ padding: 24, color: 'var(--ink-3)' }}>Cliente no encontrado.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Back header */}
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="Volver">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.topLabel}>CLIENTE</span>
      </header>

      {/* Avatar + nombre */}
      <div className={styles.profile}>
        <div className={styles.avatar} style={{ background: cliente.avatarBg }}>
          {cliente.name.charAt(0)}
        </div>
        <h1 className={styles.name}>{cliente.name}</h1>
        <div className={styles.phone}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={styles.waIcon}>
            <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path fill="#25D366" d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.167L2 22l4.985-1.407A9.945 9.945 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.94 7.94 0 0 1-4.078-1.124l-.292-.174-3.017.851.814-2.981-.19-.306A7.944 7.944 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
          </svg>
          {cliente.phone}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{cliente.turnos}</span>
          <span className={styles.statLabel}>TURNOS</span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statNumber} ${styles.statGastado}`}>{cliente.gastado}</span>
          <span className={styles.statLabel}>GASTADO</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{cliente.ultimo}</span>
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
          {cliente.historial.map((t, i) => (
            <div key={t.id} className={styles.historialRow}>
              <span
                className={styles.dot}
                style={{ background: t.cancelado ? 'var(--rose)' : DOT_COLORS[i % 2] }}
              />
              <div className={styles.historialInfo}>
                <p className={styles.historialServicio} style={{ color: t.cancelado ? 'var(--rose)' : 'var(--terra)' }}>
                  {t.servicio}
                </p>
                <p className={styles.historialMeta}>{t.profesional} · {t.fecha}</p>
              </div>
              {t.cancelado && (
                <span className={styles.canceladoBadge}>Cancelado</span>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
