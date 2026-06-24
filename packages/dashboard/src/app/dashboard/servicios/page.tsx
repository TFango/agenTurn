"use client";

import React, { useState, useEffect } from "react";
import styles from "./servicios.module.css";
import NotificationBell from "@/components/NotificationBell/NotificationBell";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const SERVICE_COLORS = [
  "var(--terra)",
  "var(--plum)",
  "var(--sand)",
  "var(--sage)",
  "var(--sky)",
  "var(--rose)",
];

function getColor(index: number) {
  return SERVICE_COLORS[index % SERVICE_COLORS.length];
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const [servs, cats] = await Promise.all([
        fetch("/api/services").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ]);
      setServices(servs);
      setCategories(cats);
    }
    load();
  }, []);

  const activeCount = services.filter((s) => s.active).length;
  const uncategorizedServices = services.filter((s) => !s.category_id);

  function toggleAccordion(categoryId: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  function openServiceModal(categoryId: string | null) {
    setActiveCategoryId(categoryId);
    setName("");
    setDuration("");
    setPrice("");
    setModalOpen(true);
  }

  async function toggleActive(service: Service) {
    const updated = { ...service, active: !service.active };
    setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
    await fetch(`/api/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        durationMinutes: Number(duration),
        price: Number(price),
        active: true,
        category_id: activeCategoryId,
      }),
    });

    setModalOpen(false);
    setActiveCategoryId(null);

    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices);
  }

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryName }),
    });

    setCategoryModalOpen(false);
    setCategoryName("");

    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }

  async function handleDeleteCategory(categoryId: string) {
    await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setServices((prev) =>
      prev.map((s) => (s.category_id === categoryId ? { ...s, category_id: null } : s)),
    );
  }

  function renderServiceCard(service: Service, index: number) {
    return (
      <div key={service.id} className={styles.card}>
        <div className={styles.colorBar} style={{ background: getColor(index) }} />
        <div className={styles.cardBody}>
          <p className={styles.serviceName} style={{ color: getColor(index) }}>
            {service.name}
          </p>
          <p className={styles.serviceMeta}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={styles.clockIcon}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {service.duration_minutes} min &nbsp; $
            {service.price.toLocaleString("es-AR")}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={service.active}
          onClick={() => toggleActive(service)}
          className={`${styles.toggle} ${service.active ? styles.toggleOn : styles.toggleOff}`}
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.headerCount}>{activeCount} ACTIVOS</p>
          <h1 className={styles.headerTitle}>Servicios</h1>
        </div>
        <div className={styles.headerActions}>
          <NotificationBell />
        </div>
      </header>

      {/* Botones de acción */}
      <div className={styles.actionButtons}>
        <button className={styles.actionBtn} onClick={() => setCategoryModalOpen(true)}>
          + Nueva categoría
        </button>
        <button className={styles.actionBtn} onClick={() => openServiceModal(null)}>
          + Nuevo servicio
        </button>
      </div>

      {/* Categorías con acordeón */}
      <div className={styles.list}>
        {categories.map((category) => {
          const categoryServices = services.filter((s) => s.category_id === category.id);
          const isOpen = openCategories.has(category.id);

          return (
            <div key={category.id} className={styles.accordion}>
              <div className={styles.accordionHeader} onClick={() => toggleAccordion(category.id)}>
                <div className={styles.accordionLeft}>
                  <span className={`${styles.accordionArrow} ${isOpen ? styles.accordionArrowOpen : ""}`}>
                    ›
                  </span>
                  <span className={styles.accordionTitle}>{category.name}</span>
                  <span className={styles.accordionCount}>{categoryServices.length}</span>
                </div>
                <div className={styles.accordionActions}>
                  <button
                    className={styles.accordionAddBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openServiceModal(category.id);
                    }}
                    aria-label="Agregar servicio"
                  >
                    +
                  </button>
                  <button
                    className={styles.accordionDeleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                    aria-label="Eliminar categoría"
                  >
                    ×
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className={styles.accordionBody}>
                  {categoryServices.length === 0 ? (
                    <p className={styles.accordionEmpty}>Sin servicios en esta categoría</p>
                  ) : (
                    categoryServices.map((service, i) => renderServiceCard(service, i))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Servicios sin categoría */}
        {uncategorizedServices.length > 0 && (
          <>
            {categories.length > 0 && (
              <p className={styles.uncategorizedTitle}>SIN CATEGORÍA</p>
            )}
            {uncategorizedServices.map((service, i) => renderServiceCard(service, i))}
          </>
        )}
      </div>

      {/* Modal nuevo servicio */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>
              {activeCategoryId
                ? `Nuevo servicio en ${categories.find((c) => c.id === activeCategoryId)?.name}`
                : "Nuevo servicio"}
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Ej: Corte, Coloración..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="duration">Duración (minutos)</label>
                <input
                  type="number"
                  id="duration"
                  placeholder="45"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="price">Precio</label>
                <input
                  type="number"
                  id="price"
                  placeholder="3500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnPrimary}>Guardar</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nueva categoría */}
      {categoryModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setCategoryModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>Nueva categoría</p>
            <form onSubmit={handleCreateCategory} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label htmlFor="categoryName">Nombre</label>
                <input
                  type="text"
                  id="categoryName"
                  placeholder="Ej: Peluquería, Depilación..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnPrimary}>Crear</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setCategoryModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
