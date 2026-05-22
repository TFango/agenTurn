'use client';

import styles from './metricas.module.css';

const SERVICIOS = [
  { nombre: 'Corte',       count: 18, color: 'var(--terra)' },
  { nombre: 'Coloración',  count: 12, color: 'var(--plum)'  },
  { nombre: 'Mechado',     count: 9,  color: 'var(--sand)'  },
  { nombre: 'Alisado',     count: 5,  color: 'var(--sage)'  },
  { nombre: 'Peinado',     count: 3,  color: 'var(--sky)'   },
];

const MAX = SERVICIOS[0].count;

// Puntos del sparkline — decorativo, representa tendencia mensual
const SPARK = [62, 55, 70, 58, 74, 68, 80, 72, 84, 78, 90, 88];

function Sparkline() {
  const w = 300;
  const h = 48;
  const pad = 4;
  const xs = SPARK.map((_, i) => pad + (i / (SPARK.length - 1)) * (w - pad * 2));
  const min = Math.min(...SPARK);
  const max = Math.max(...SPARK);
  const ys = SPARK.map((v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.sparkline} preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--sand)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill="var(--sand)" opacity="0.9" />
    </svg>
  );
}

export default function MetricasPage() {
  const now = new Date();
  const mes = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <p className={styles.headerSub}>{mes}</p>
          <h1 className={styles.headerTitle}>Métricas</h1>
        </div>
        <button className={styles.iconBtn} aria-label="Notificaciones">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className={styles.notifDot} />
        </button>
      </header>

      <div className={styles.content}>

        {/* Hero card — ingresos */}
        <div className={styles.heroCard}>
          <p className={styles.heroLabel}>INGRESOS · MAYO</p>
          <div className={styles.heroAmount}>
            <span className={styles.heroSymbol}>$</span>
            <span className={styles.heroNumber}>284</span>
            <span className={styles.heroDecimal}>.500</span>
          </div>
          <p className={styles.heroMeta}>
            74% de la meta
            <span className={styles.heroDelta}>&nbsp;· +18% vs abril</span>
          </p>
          <Sparkline />
        </div>

        {/* Grid 2×2 stat cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>TURNOS</span>
              <span className={`${styles.statDelta} ${styles.deltaPos}`}>+18%</span>
            </div>
            <span className={styles.statNumber}>47</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>CLIENTES</span>
              <span className={`${styles.statDelta} ${styles.deltaPos}`}>+12%</span>
            </div>
            <span className={styles.statNumber}>23</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>CANCELADOS</span>
              <span className={`${styles.statDelta} ${styles.deltaNeg}`}>-20%</span>
            </div>
            <span className={`${styles.statNumber} ${styles.statRed}`}>4</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>OCUPACIÓN</span>
              <span className={`${styles.statDelta} ${styles.deltaPos}`}>+5%</span>
            </div>
            <span className={`${styles.statNumber} ${styles.statPlum}`}>74%</span>
          </div>
        </div>

        {/* Ranking de servicios */}
        <div className={styles.rankingCard}>
          <p className={styles.rankingTitle}>SERVICIOS MÁS PEDIDOS</p>
          <div className={styles.rankingList}>
            {SERVICIOS.map((s) => (
              <div key={s.nombre} className={styles.rankingRow}>
                <div className={styles.rankingMeta}>
                  <span className={styles.rankingNombre}>{s.nombre}</span>
                  <span className={styles.rankingCount}>{s.count}</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${(s.count / MAX) * 100}%`,
                      background: s.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
