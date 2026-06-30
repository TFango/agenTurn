"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./whatsapp.module.css";

export default function WhatsAppPage() {
  const [wpp, setWpp] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [slotInterval, setSlotInterval] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((data) => {
        setWpp(data.whatsapp_number ?? "");
        setPhoneNumberId(data.phone_number_id ?? "");
        setMetaAccessToken(data.meta_access_token ?? "");
        setSlotInterval(data.slot_interval_minutes ?? "");
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/tenant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp_number: wpp,
        phone_number_id: phoneNumberId,
        meta_access_token: metaAccessToken,
        slot_interval_minutes: slotInterval,
      }),
    });
    setSaving(false);
    setSaved(true);
  }

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
          <h1 className={styles.headerTitle}>WhatsApp Business</h1>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.statusRow}>
          <span className={styles.statusDot} />
          <span className={styles.statusLabel}>Conectado</span>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.fieldCard}>
            <label className={styles.fieldLabel}>Número de WhatsApp</label>
            <p className={styles.fieldHint}>
              El número que usan tus clientes para escribirte
            </p>
            <input
              type="tel"
              className={styles.input}
              placeholder="+5491155667788"
              value={wpp}
              onChange={(e) => {
                setWpp(e.target.value);
                setSaved(false);
              }}
            />
          </div>

          <div className={styles.fieldCard}>
            <label className={styles.fieldLabel}>Phone Number ID</label>
            <p className={styles.fieldHint}>
              El ID que te da Meta para este número (lo encontrás en la configuración de tu app de Meta)
            </p>
            <input
              type="text"
              className={styles.input}
              placeholder="123456789012345"
              value={phoneNumberId}
              onChange={(e) => {
                setPhoneNumberId(e.target.value);
                setSaved(false);
              }}
            />
          </div>

          <div className={styles.fieldCard}>
            <label className={styles.fieldLabel}>Access Token de Meta</label>
            <p className={styles.fieldHint}>
              El token que te da Meta para autenticar el envío de mensajes
            </p>
            <input
              type="text"
              className={styles.input}
              placeholder="EAAxxxxxxx..."
              value={metaAccessToken}
              onChange={(e) => {
                setMetaAccessToken(e.target.value);
                setSaved(false);
              }}
            />
          </div>

          <div className={styles.fieldCard}>
            <label className={styles.fieldLabel}>Intervalo de turnos</label>
            <p className={styles.fieldHint}>
              Cada cuántos minutos se generan slots disponibles
            </p>
            <input
              type="number"
              className={styles.input}
              placeholder="30"
              min={5}
              value={slotInterval}
              onChange={(e) => {
                setSlotInterval(Number(e.target.value));
                setSaved(false);
              }}
            />
          </div>

          <button
            type="submit"
            className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ""}`}
            disabled={saving || loading}
          >
            {saving ? "Guardando…" : saved ? "¡Guardado!" : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
