"use client";

import { useEffect, useState } from "react";
import styles from "./metricas.module.css";

const COLORS = [
  "var(--terra)",
  "var(--plum)",
  "var(--sand)",
  "var(--sage)",
  "var(--sky)",
];

export default function MetricasPage() {
  const now = new Date();
  const mes = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const mesLabel = now.toLocaleDateString("es-AR", { month: "long" }).toUpperCase();

  const [metrics, setMetrics] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar métricas");
        return r.json();
      })
      .then((data) => {
        setMetrics(data);
        setTimeout(() => setLoaded(true), 50);
      })
      .catch(() => {
        setMetrics({ monthTotal: 0, cancelledMonth: 0, uniqueClients: 0, revenue: 0, topServices: [] });
        setLoaded(true);
      });
  }, []);

  const topServices: { name: string; count: number }[] = metrics?.topServices ?? [];
  const maxCount = topServices[0]?.count ?? 1;

  const revenue = metrics?.revenue != null
    ? new Intl.NumberFormat("es-AR").format(metrics.revenue)
    : null;

  return (
    <div className={`${styles.page} ${loaded ? styles.loaded : ""}`}>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <p className={styles.headerSub}>{mes.toUpperCase()}</p>
          <h1 className={styles.headerTitle}>Métricas</h1>
        </div>
      </header>

      <div className={styles.content}>

        {/* Hero — ingresos */}
        <div className={`${styles.heroCard} ${styles.reveal}`} style={{ "--delay": "0ms" } as React.CSSProperties}>
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <p className={styles.heroEyebrow}>INGRESOS · {mesLabel}</p>
              <div className={styles.heroAmount}>
                <span className={styles.heroCurrency}>$</span>
                <span className={styles.heroFigure}>
                  {revenue ?? "—"}
                </span>
              </div>
            </div>
            <div className={styles.heroOrb} aria-hidden />
          </div>
          <div className={styles.heroDivider} />
          <p className={styles.heroSub}>del mes en curso</p>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={`${styles.statCard} ${styles.reveal}`} style={{ "--delay": "80ms" } as React.CSSProperties}>
            <span className={styles.statEmoji}>📅</span>
            <span className={styles.statValue}>{metrics?.monthTotal ?? "—"}</span>
            <span className={styles.statLabel}>Turnos</span>
          </div>

          <div className={`${styles.statCard} ${styles.reveal}`} style={{ "--delay": "140ms" } as React.CSSProperties}>
            <span className={styles.statEmoji}>👤</span>
            <span className={styles.statValue}>{metrics?.uniqueClients ?? "—"}</span>
            <span className={styles.statLabel}>Clientes</span>
          </div>

          <div className={`${styles.statCard} ${styles.statCardRed} ${styles.reveal}`} style={{ "--delay": "200ms" } as React.CSSProperties}>
            <span className={styles.statEmoji}>✕</span>
            <span className={styles.statValue}>{metrics?.cancelledMonth ?? "—"}</span>
            <span className={styles.statLabel}>Cancelados</span>
          </div>
        </div>

        {/* Ranking */}
        <div className={`${styles.rankingCard} ${styles.reveal}`} style={{ "--delay": "260ms" } as React.CSSProperties}>
          <div className={styles.rankingHeader}>
            <p className={styles.rankingTitle}>Servicios más pedidos</p>
            <span className={styles.rankingBadge}>{mesLabel}</span>
          </div>

          {topServices.length === 0 && (
            <p className={styles.rankingEmpty}>Sin datos este mes aún</p>
          )}

          <ol className={styles.rankingList}>
            {topServices.map((s, i) => (
              <li key={s.name} className={styles.rankingRow} style={{ "--row-delay": `${320 + i * 60}ms` } as React.CSSProperties}>
                <div className={styles.rankingLeft}>
                  <span className={styles.rankingIndex} style={{ color: COLORS[i] }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.rankingName}>{s.name}</span>
                </div>
                <div className={styles.rankingRight}>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${loaded ? styles.barAnimate : ""}`}
                      style={{
                        "--bar-width": `${(s.count / maxCount) * 100}%`,
                        "--bar-color": COLORS[i],
                        "--bar-delay": `${400 + i * 80}ms`,
                      } as React.CSSProperties}
                    />
                  </div>
                  <span className={styles.rankingCount}>{s.count}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  );
}
