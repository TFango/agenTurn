"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then(setNotifications);
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel("notifications");

    channel.onmessage = (event) => {
      setNotifications((prev) => [event.data, ...prev]);
    };

    return () => channel.close();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  async function markAllAsRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function deleteNotification(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications debe usarse dentro de NotificationProvider",
    );
  return context;
}
