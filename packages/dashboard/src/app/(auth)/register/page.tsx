"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Register.module.css";

export default function Register() {
  const [localName, setLocalName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    if (!localName || !name || !email || !password) return;

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, localName }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push("/login");
    } else {
      setError(data.error);
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.decoration} aria-hidden="true">
        <span className={styles.circle} />
        <span className={styles.circle} />
      </div>

      <div className={styles.container}>
        <p className={styles.logo}>
          agen<span className={styles.logoAccent}>Turn</span>
        </p>

        <div className={styles.heading}>
          <h1 className={styles.title}>Creá tu</h1>
          <h1 className={`${styles.title} ${styles.titleItalic}`}>cuenta.</h1>
        </div>

        <p className={styles.subtitle}>Registrá tu local y empezá a gestionar tus turnos.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="localName" className={styles.label}>Nombre del local</label>
            <input
              type="text"
              id="localName"
              name="localName"
              placeholder="Ej: Peluquería Luna"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>Tu nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ej: María"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="vos@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="········"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
              minLength={8}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className={styles.footer}>
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className={styles.link}>Ingresá</a>
        </p>
      </div>
    </main>
  );
}
