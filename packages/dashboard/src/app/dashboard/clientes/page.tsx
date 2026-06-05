"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./clientes.module.css";

interface Client {
  id: string;
  name: string;
  whatsapp_number: string;
}

const AVATAR_COLORS: { bg: string; fg: string }[] = [
  { bg: "#f5e2d8", fg: "#c45c34" },
  { bg: "#e8eee0", fg: "#7a8961" },
  { bg: "#dee9ec", fg: "#6f95a3" },
  { bg: "#ece1ea", fg: "#8a5879" },
  { bg: "#f3ead8", fg: "#c9a766" },
  { bg: "#f5dfde", fg: "#b8625e" },
  { bg: "#e8eee0", fg: "#5a7a45" },
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/clients`)
      .then((r) => r.json())
      .then(setClients);
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.whatsapp_number.includes(search),
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.headerCount}>{clients.length} REGISTRADAS</p>
          <h1 className={styles.headerTitle}>Clientes</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} aria-label="Notificaciones">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className={styles.notifDot} />
          </button>
        </div>
      </header>

      {/* Buscador */}
      <div className={styles.searchWrapper}>
        <svg
          className={styles.searchIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      <div className={styles.list}>
        {filtered.map((client, i) => {
          const color = getAvatarColor(i);
          return (
            <div
              key={client.id}
              className={styles.row}
              onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
            >
              <div
                className={styles.avatar}
                style={{ background: color.bg, color: color.fg }}
              >
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.info}>
                <p className={styles.name}>{client.name}</p>
                <p className={styles.phone}>{client.whatsapp_number}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
