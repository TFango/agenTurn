'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './configuracion.module.css';
import NotificationBell from "@/components/NotificationBell/NotificationBell";

type PushStatus = 'loading' | 'unsupported' | 'denied' | 'active' | 'inactive';

function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? 'active' : 'inactive');
    });
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        setLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, keys }),
      });
      setStatus('active');
    } catch {
      setStatus('inactive');
    }
    setLoading(false);
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const { endpoint } = sub.toJSON() as { endpoint: string };
        await fetch('/api/push-subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus('inactive');
    } catch {
      setStatus('inactive');
    }
    setLoading(false);
  }

  return { status, loading, subscribe, unsubscribe };
}

interface ConfigSummary {
  tenant: { name: string; plan: string } | null;
  workingHoursDays: number;
  activeProfessionals: number;
  blockedDates: number;
}

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<ConfigSummary | null>(null);

  useEffect(() => {
    fetch('/api/config-summary')
      .then(r => r.ok ? r.json() : null)
      .then(setSummary);
  }, []);

  const OPCIONES = [
    {
      id: 'horarios',
      label: 'Horarios de atención',
      sub: !summary?.workingHoursDays ? 'Sin días activos' : `${summary.workingHoursDays} día${summary.workingHoursDays !== 1 ? 's' : ''} activo${summary.workingHoursDays !== 1 ? 's' : ''}`,
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
      sub: !summary?.activeProfessionals ? 'Sin profesionales' : `${summary.activeProfessionals} activa${summary.activeProfessionals !== 1 ? 's' : ''}`,
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
      sub: !summary?.blockedDates ? 'Sin días bloqueados' : `${summary.blockedDates} día${summary.blockedDates !== 1 ? 's' : ''}`,
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

  const { status: pushStatus, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  const userName = session?.user?.name ?? '—';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <div>
          <p className={styles.headerSub}>{summary?.tenant?.name?.toUpperCase() ?? '—'}</p>
          <h1 className={styles.headerTitle}>Ajustes</h1>
        </div>
        <NotificationBell />
      </header>

      <div className={styles.content}>

        <Link href="/dashboard/configuracion/cuenta" className={styles.profileCard}>
          <div className={styles.profileAvatar}>{userInitial}</div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{userName}</p>
            <p className={styles.profileSub}>{summary?.tenant ? `${summary.tenant.name} · Plan ${summary.tenant.plan === 'pro' ? 'Pro' : 'Free'}` : '—'}</p>
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

        {pushStatus !== 'unsupported' && pushStatus !== 'loading' && (
          <div className={styles.pushCard}>
            <div className={styles.pushLeft}>
              <div className={`${styles.pushIcon} ${pushStatus === 'active' ? styles.pushIconActive : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className={styles.pushText}>
                <p className={styles.pushTitle}>Notificaciones push</p>
                <p className={styles.pushSub}>
                  {pushStatus === 'active' && 'Activadas en este dispositivo'}
                  {pushStatus === 'inactive' && 'Recibí alertas de turnos y mensajes'}
                  {pushStatus === 'denied' && 'Bloqueadas por el navegador'}
                </p>
              </div>
            </div>
            {pushStatus === 'denied' ? (
              <span className={styles.pushDeniedBadge}>Bloqueado</span>
            ) : (
              <button
                className={`${styles.pushToggle} ${pushStatus === 'active' ? styles.pushToggleOn : ''}`}
                onClick={pushStatus === 'active' ? unsubscribe : subscribe}
                disabled={pushLoading}
              >
                <span className={styles.pushToggleThumb} />
              </button>
            )}
          </div>
        )}

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
