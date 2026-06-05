"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar() {
  const { data: session } = useSession();

  return (
    <div>
      <div>
        <div>
          <h1>agenTurn</h1>
          <span>Mi local</span>
        </div>

        {session?.user.role === "admin" && (
          <ul>
            <li><Link href="/dashboard/agenda">Agenda</Link></li>
            <li><Link href="/dashboard/servicios">Servicios</Link></li>
            <li><Link href="/dashboard/clientes">Clientes</Link></li>
            <li><Link href="/dashboard/metricas">Métricas</Link></li>
            <li><Link href="/dashboard/configuracion">Configuración</Link></li>
          </ul>
        )}

        {session?.user.role === "professional" && (
          <ul>
            <li><Link href="/dashboard/agenda">Agenda</Link></li>
          </ul>
        )}

        <div>
          <div>
            <h2>{session?.user.name}</h2>
            <p>{session?.user.role}</p>
          </div>

          <button onClick={() => signOut({ callbackUrl: "/login" })}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
