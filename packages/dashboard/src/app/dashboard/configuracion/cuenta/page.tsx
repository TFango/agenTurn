"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./cuenta.module.css";

interface TenantData {
  plan: "free" | "pro";
  subscription_status: "active" | "inactive" | "trial";
}

export default function CuentaPage() {
  const { data: session } = useSession();
  const [tenant, setTenant] = useState<TenantData | null>(null);

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then(setTenant);
  }, []);

  const PLAN_LABEL = { free: "Free", pro: "Pro" };
  const STATUS_LABEL = {
    active: "Activo",
    inactive: "Inactivo",
    trial: "Período de prueba",
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link
          href="/dashboard/configuracion"
          className={styles.backBtn}
          aria-label="Volver"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <p className={styles.headerSub}>CONFIGURACIÓN</p>
          <h1 className={styles.headerTitle}>Cuenta y datos</h1>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Mi cuenta</p>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>
              {session?.user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{session?.user?.name ?? "—"}</p>
              <p className={styles.profileEmail}>{session?.user?.email ?? "—"}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Suscripción</p>
          <div className={styles.card}>
            <div className={styles.row}>
              <p className={styles.rowLabel}>Plan</p>
              <span
                className={`${styles.badge} ${tenant?.plan === "pro" ? styles.badgePro : styles.badgeFree}`}
              >
                {tenant ? PLAN_LABEL[tenant.plan] : "—"}
              </span>
            </div>
            <div className={`${styles.row} ${styles.rowLast}`}>
              <p className={styles.rowLabel}>Estado</p>
              <span
                className={`${styles.badge} ${tenant?.subscription_status === "active" ? styles.badgeActive : styles.badgeInactive}`}
              >
                {tenant ? STATUS_LABEL[tenant.subscription_status] : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
