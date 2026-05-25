"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./profesionales.module.css";

interface ProfessionalInterface {
  id: string;
  name: string;
  active: boolean;
}

const AVATAR_COLORS = [
  { bg: "var(--terra-soft)", color: "var(--terra)" },
  { bg: "var(--plum-soft)", color: "var(--plum)" },
  { bg: "var(--sage-soft)", color: "var(--sage)" },
  { bg: "var(--sand-soft)", color: "var(--sand)" },
  { bg: "var(--sky-soft)", color: "var(--sky)" },
];

export default function ProfesionalesPage() {
  const [professionals, setProfessionals] = useState<ProfessionalInterface[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/professionals")
      .then((r) => r.json())
      .then(setProfessionals);
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    if (!name) {
      setError("El nombre es obligatorio");
      setLoading(false);
      return;
    }

    const nuevo = await fetch("/api/professionals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, active: true }),
    }).then((r) => r.json());

    setProfessionals([...professionals, nuevo]);
    setName("");
    setLoading(false);
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/professionals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setProfessionals(professionals.map((p) =>
      p.id === id ? { ...p, active: !active } : p
    ));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/professionals/${id}`, { method: "DELETE" });
    setProfessionals(professionals.filter((p) => p.id !== id));
  }

  const activeCount = professionals.filter((p) => p.active).length;

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <Link href="/dashboard/configuracion" className={styles.backBtn} aria-label="Volver">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <p className={styles.headerSub}>CONFIGURACIÓN</p>
          <h1 className={styles.headerTitle}>Profesionales</h1>
        </div>
      </header>

      <div className={styles.content}>

        {/* Formulario */}
        <div className={styles.formCard}>
          <p className={styles.formTitle}>Agregar al equipo</p>
          <form onSubmit={handleAdd} className={styles.form}>
            <div className={styles.inputRow}>
              <input
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                className={`${styles.nameInput} ${error ? styles.nameInputError : ""}`}
              />
              <button type="submit" disabled={loading} className={styles.addBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            {error && <p className={styles.errorMsg} role="alert">{error}</p>}
          </form>
        </div>

        {/* Lista */}
        <div className={styles.teamCard}>
          <div className={styles.teamHeader}>
            <p className={styles.teamTitle}>Equipo</p>
            {professionals.length > 0 && (
              <span className={styles.teamMeta}>
                {activeCount} de {professionals.length} disponible{activeCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {professionals.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className={styles.emptyText}>Sin profesionales</p>
              <p className={styles.emptySub}>Agregá el primer miembro del equipo</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {professionals.map((p, i) => {
                const avatar = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <li key={p.id} className={`${styles.listItem} ${!p.active ? styles.listItemInactive : ""}`}>
                    <div className={styles.itemLeft}>
                      <div
                        className={styles.avatar}
                        style={{ background: avatar.bg, color: avatar.color }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={styles.itemName}>{p.name}</p>
                        <span className={`${styles.statusBadge} ${p.active ? styles.statusActive : styles.statusPaused}`}>
                          {p.active ? "Disponible" : "En pausa"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.itemActions}>
                      <button
                        className={`${styles.toggleBtn} ${p.active ? styles.toggleBtnActive : ""}`}
                        onClick={() => handleToggle(p.id, p.active)}
                        aria-label={p.active ? "Pausar" : "Activar"}
                      >
                        <span className={styles.toggleThumb} />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(p.id)}
                        aria-label="Eliminar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
