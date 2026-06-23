'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './configuracion.module.css';
import NotificationBell from "@/components/NotificationBell/NotificationBell";

interface Tenant {
  name: string;
  plan: string;
}

interface Counts {
  horarios: number;
  profesionales: number;
  bloqueados: number;
}

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [counts, setCounts] = useState<Counts>({ horarios: 0, profesionales: 0, bloqueados: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/tenant').then(r => r.json()),
      fetch('/api/workingHours').then(r => r.json()),
      fetch('/api/professionals').then(r => r.json()),
      fetch('/api/blockedDates').then(r => r.json()),
    ]).then(([tenantData, horariosData, profesionalesData, bloqueadosData]) => {
      setTenant(tenantData);
      setCounts({
        horarios: horariosData.workingHours.length,
        profesionales: profesionalesData.filter((p: any) => p.active).length,
        bloqueados: bloqueadosData.length,
      });
    });
  }, []);

  const OPCIONES = [
    {
      id: 'horarios',
      label: 'Horarios de atención',
      sub: counts.horarios === 0 ? 'Sin días activos' : `${counts.horarios} día${counts.horarios !== 1 ? 's' : ''} activo${counts.horarios !== 1 ? 's' : ''}`,
      href: '/dashboard/configuracion/horarios',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'profesionales',
      label: 'Profesionales',
      sub: counts.profesionales === 0 ? 'Sin profesionales' : `${counts.profesionales} activa${counts.profesionales !== 1 ? 's' : ''}`,
      href: '/dashboard/configuracion/profesionales',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'bloqueados',
      label: 'Días bloqueados',
      sub: counts.bloqueados === 0 ? 'Sin días bloqueados' : `${counts.bloqueados} día${counts.bloqueados !== 1 ? 's' : ''}`,
      href: '/dashboard/configuracion/diasBloqueados',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Business',
      sub: 'Conectado',
      subColor: 'var(--sage)',
      href: '/dashboard/configuracion/whatsapp',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
  ];

  const userName = session?.user?.name ?? '—';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <div>
          <p className={styles.headerSub}>{tenant?.name?.toUpperCase() ?? '—'}</p>
          <h1 className={styles.headerTitle}>Ajustes</h1>
        </div>
        <NotificationBell />
      </header>

      <div className={styles.content}>

        <Link href="/dashboard/configuracion/cuenta" className={styles.profileCard}>
          <div className={styles.profileAvatar}>{userInitial}</div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{userName}</p>
            <p className={styles.profileSub}>{tenant ? `${tenant.name} · Plan ${tenant.plan === 'pro' ? 'Pro' : 'Free'}` : '—'}</p>
          </div>
          <span className={styles.chevron}><ChevronRight /></span>
        </Link>

        <div className={styles.optionsCard}>
          {OPCIONES.map((op, i) => {
            const inner = (
              <>
                <span className={styles.optionIcon}>{op.icon}</span>
                <div className={styles.optionText}>
                  <p className={styles.optionLabel}>{op.label}</p>
                  <p className={styles.optionSub} style={op.subColor ? { color: op.subColor } : undefined}>
                    {op.sub}
                  </p>
                </div>
                <span className={styles.chevron}><ChevronRight /></span>
              </>
            );

            return op.href
              ? <Link key={op.id} href={op.href} className={styles.optionRow}>{inner}</Link>
              : <button key={op.id} className={styles.optionRow}>{inner}</button>;
          })}
        </div>

        <button
          className={styles.signOutBtn}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Cerrar sesión
        </button>

        <p className={styles.version}>agenTurn · v1.0.0</p>

      </div>
    </div>
  );
}
