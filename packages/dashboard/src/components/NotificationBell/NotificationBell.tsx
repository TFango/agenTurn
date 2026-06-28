"use client";

import { useNotifications } from "@/components/NotificationProvider/NotificationProvider";
import { useState } from "react";
import styles from "./NotificationBell.module.css";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function typeIcon(type: string): string {
  if (type === "new_appointment") return "📅";
  if (type === "cancelled_appointment") return "❌";
  if (type === "human_handoff") return "💬";
  return "🔔";
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.bell}
        onClick={() => setOpen(!open)}
        aria-label="Notificaciones"
      >
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
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Notificaciones</span>
            {unreadCount > 0 && (
              <button className={styles.markAll} onClick={markAllAsRead}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className={styles.empty}>Sin notificaciones</p>
          ) : (
            <div className={styles.list}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.item} ${n.read ? styles.itemRead : ""}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <span className={styles.itemIcon}>{typeIcon(n.type)}</span>
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>{n.title}</span>
                    <span className={styles.itemBody}>{n.body}</span>
                    <span className={styles.itemTime}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <button
                    className={styles.itemDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    aria-label="Borrar"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
