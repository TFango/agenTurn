'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './configuracion.module.css';

const OPCIONES: { id: string; label: string; sub: string; subColor?: string; href?: string; icon: React.ReactNode }[] = [
  {
    id: 'horarios',
    label: 'Horarios de atención',
    sub: '6 días activos',
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
    sub: '2 activas',
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
    sub: '1 día',
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
  {
    id: 'cuenta',
    label: 'Cuenta y datos',
    sub: 'Studio Salvia',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function ConfiguracionPage() {
  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <p className={styles.headerSub}>STUDIO SALVIA</p>
          <h1 className={styles.headerTitle}>Ajustes</h1>
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

        {/* Card de perfil */}
        <button className={styles.profileCard}>
          <div className={styles.profileAvatar}>A</div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>Analía Torres</p>
            <p className={styles.profileSub}>Studio Salvia · Plan Pro</p>
          </div>
          <span className={styles.chevron}><ChevronRight /></span>
        </button>

        {/* Opciones */}
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
              ? <Link key={op.id} href={op.href} className={`${styles.optionRow} ${i < OPCIONES.length - 1 ? styles.optionBorder : ''}`}>{inner}</Link>
              : <button key={op.id} className={`${styles.optionRow} ${i < OPCIONES.length - 1 ? styles.optionBorder : ''}`}>{inner}</button>;
          })}
        </div>

        {/* Cerrar sesión */}
        <button
          className={styles.signOutBtn}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Cerrar sesión
        </button>

        {/* Footer */}
        <p className={styles.version}>agenTurn · v1.0.0</p>

      </div>
    </div>
  );
}
