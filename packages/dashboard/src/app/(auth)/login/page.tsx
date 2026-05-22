"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) return;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
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
          <h1 className={styles.title}>Bienvenida</h1>
          <h1 className={`${styles.title} ${styles.titleItalic}`}>de vuelta.</h1>
        </div>

        <p className={styles.subtitle}>Tu agenda, tus clientes, todo en un solo lugar.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
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
            />
            <span className={styles.hint}>Demo: cualquier email + contraseña</span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className={styles.footer}>
          ¿No tenés cuenta?{" "}
          <a href="/register" className={styles.link}>Registrate</a>
        </p>
      </div>
    </main>
  );
}
