"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

    if (!localName || !name || !email || !password) {
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, localName }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push("/login");
      setLoading(false);
    } else {
      setError(data.error);
    }
  }

  return (
    <main>
      <div>
        <form action="" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="">Nombre del local</label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="">Tu nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        {error && <p>{error}</p>}
      </div>
    </main>
  );
}
