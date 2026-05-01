# agenTurn — Plan 3: Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisito:** Plan 1 completado. `@agenturn/db` disponible.

**Goal:** Construir el panel web Next.js con autenticación por roles, 5 pantallas (Agenda, Servicios, Clientes, Métricas, Configuración), human handoff desde el panel, cancelación de turnos con notificación al cliente, y configuración PWA.

**Architecture:** Next.js 14 App Router. CSS Modules para estilos. NextAuth v5 con credentials provider. API Routes en `/app/api/`. Los datos se cargan server-side via Server Components o Client Components con fetch. Deploy en Vercel.

**Tech Stack:** Next.js 14, TypeScript, React, NextAuth v5, CSS Modules, next-pwa, @agenturn/db, Vercel

---

## Estructura de archivos

```
packages/dashboard/
├── package.json
├── next.config.js
├── tsconfig.json
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/                   # Íconos PWA (192x192, 512x512)
└── app/
    ├── layout.tsx                # Root layout
    ├── globals.css
    ├── (auth)/
    │   ├── login/
    │   │   ├── page.tsx
    │   │   └── login.module.css
    │   └── register/
    │       ├── page.tsx
    │       └── register.module.css
    ├── dashboard/
    │   ├── layout.tsx            # Dashboard layout con Sidebar
    │   ├── page.tsx              # Agenda (redirect o default)
    │   ├── agenda/
    │   │   ├── page.tsx
    │   │   └── agenda.module.css
    │   ├── servicios/
    │   │   ├── page.tsx
    │   │   └── servicios.module.css
    │   ├── clientes/
    │   │   ├── page.tsx
    │   │   ├── [id]/page.tsx     # Detalle del cliente
    │   │   └── clientes.module.css
    │   ├── metricas/
    │   │   ├── page.tsx
    │   │   └── metricas.module.css
    │   └── configuracion/
    │       ├── page.tsx
    │       └── configuracion.module.css
    └── api/
        ├── auth/[...nextauth]/route.ts
        ├── appointments/route.ts
        ├── appointments/[id]/route.ts
        ├── services/route.ts
        ├── services/[id]/route.ts
        ├── clients/route.ts
        ├── clients/[id]/route.ts
        ├── metrics/route.ts
        ├── config/working-hours/route.ts
        ├── config/professionals/route.ts
        ├── config/blocked-dates/route.ts
        └── config/users/route.ts
```

---

### Task 1: Next.js setup + PWA

**Files:**
- Create: `packages/dashboard/package.json`
- Create: `packages/dashboard/tsconfig.json`
- Create: `packages/dashboard/next.config.js`
- Create: `packages/dashboard/public/manifest.json`
- Create: `packages/dashboard/app/layout.tsx`
- Create: `packages/dashboard/app/globals.css`

- [ ] **Step 1: Crear package.json del dashboard**

```json
// packages/dashboard/package.json
{
  "name": "@agenturn/dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "@agenturn/db": "*",
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-auth": "^5.0.0-beta.16",
    "next-pwa": "^5.6.0",
    "bcryptjs": "^2.4.3",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "@testing-library/react": "^15.0.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

- [ ] **Step 2: Crear next.config.js con PWA**

```javascript
// packages/dashboard/next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@agenturn/db'],
};

module.exports = withPWA(nextConfig);
```

- [ ] **Step 3: Crear manifest.json PWA**

```json
// packages/dashboard/public/manifest.json
{
  "name": "agenTurn — Panel",
  "short_name": "agenTurn",
  "description": "Panel de gestión de turnos",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0f0f19",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 4: Crear root layout con PWA meta tags**

```tsx
// packages/dashboard/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'agenTurn',
  description: 'Panel de gestión de turnos',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'agenTurn' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Crear globals.css**

```css
/* packages/dashboard/app/globals.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0f0f19;
  --surface: rgba(255,255,255,0.04);
  --border: rgba(255,255,255,0.08);
  --text: #e2e8f0;
  --text-muted: rgba(255,255,255,0.4);
  --primary: #6366f1;
  --primary-light: rgba(99,102,241,0.15);
  --green: #10b981;
  --orange: #f59e0b;
  --red: #ef4444;
  --radius: 8px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

button { cursor: pointer; border: none; font-family: inherit; font-size: inherit; }
input, select, textarea { font-family: inherit; font-size: inherit; }
a { color: inherit; text-decoration: none; }
```

- [ ] **Step 6: Instalar y verificar que Next.js levanta**

```bash
cd packages/dashboard && npm install && npm run dev
```

Expected: `ready - started server on 0.0.0.0:3000`

- [ ] **Step 7: Commit**

```bash
git add packages/dashboard/
git commit -m "feat: Next.js dashboard setup with PWA config"
```

---

### Task 2: NextAuth + autenticación por roles

**Files:**
- Create: `packages/dashboard/app/api/auth/[...nextauth]/route.ts`
- Create: `packages/dashboard/lib/auth.ts`
- Create: `packages/dashboard/app/(auth)/login/page.tsx`
- Create: `packages/dashboard/app/(auth)/register/page.tsx`
- Create: `packages/dashboard/middleware.ts`

- [ ] **Step 1: Crear lib/auth.ts con NextAuth config**

```typescript
// packages/dashboard/lib/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { User } from '@agenturn/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await User.findOne({ where: { email: credentials.email as string, active: true } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password_hash);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenant_id,
          role: user.role,
          professionalId: user.professional_id,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;
        token.professionalId = (user as any).professionalId;
      }
      return token;
    },
    session({ session, token }) {
      (session.user as any).tenantId = token.tenantId;
      (session.user as any).role = token.role;
      (session.user as any).professionalId = token.professionalId;
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});
```

- [ ] **Step 2: Crear route handler de NextAuth**

```typescript
// packages/dashboard/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Crear middleware para proteger rutas**

```typescript
// packages/dashboard/middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
});

export const config = { matcher: ['/dashboard/:path*', '/login', '/register'] };
```

- [ ] **Step 4: Crear página de login**

```tsx
// packages/dashboard/app/(auth)/login/page.tsx
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    });
    if (result?.error) {
      setError('Email o contraseña incorrectos.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>agenTurn</h1>
        <p className={styles.subtitle}>Ingresá a tu panel</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input name="email" type="email" placeholder="Email" required className={styles.input} />
          <input name="password" type="password" placeholder="Contraseña" required className={styles.input} />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <a href="/register" className={styles.link}>¿No tenés cuenta? Registrarse</a>
      </div>
    </div>
  );
}
```

```css
/* packages/dashboard/app/(auth)/login/login.module.css */
.container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 40px; width: 100%; max-width: 380px; }
.title { font-size: 24px; font-weight: 700; color: var(--primary); margin-bottom: 4px; }
.subtitle { color: var(--text-muted); margin-bottom: 24px; }
.form { display: flex; flex-direction: column; gap: 12px; }
.input { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 14px; color: var(--text); width: 100%; }
.input:focus { outline: none; border-color: var(--primary); }
.error { color: var(--red); font-size: 13px; }
.button { background: var(--primary); color: white; padding: 10px; border-radius: var(--radius); font-weight: 600; margin-top: 4px; }
.button:disabled { opacity: 0.6; cursor: not-allowed; }
.link { display: block; text-align: center; margin-top: 20px; color: var(--text-muted); font-size: 13px; }
.link:hover { color: var(--primary); }
```

- [ ] **Step 5: Crear página de register**

```tsx
// packages/dashboard/app/(auth)/register/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        localName: form.get('localName'),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Error al registrarse.');
      setLoading(false);
    } else {
      router.push('/login?registered=1');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Registrá tu local en agenTurn</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input name="localName" type="text" placeholder="Nombre del local" required className={styles.input} />
          <input name="name" type="text" placeholder="Tu nombre" required className={styles.input} />
          <input name="email" type="email" placeholder="Email" required className={styles.input} />
          <input name="password" type="password" placeholder="Contraseña" required minLength={8} className={styles.input} />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <a href="/login" className={styles.link}>¿Ya tenés cuenta? Ingresar</a>
      </div>
    </div>
  );
}
```

```typescript
// packages/dashboard/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Tenant, User } from '@agenturn/db';

export async function POST(req: NextRequest) {
  const { name, email, password, localName } = await req.json();
  if (!name || !email || !password || !localName) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
  }
  const existing = await User.findOne({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Ya existe una cuenta con ese email.' }, { status: 409 });

  const tenant = await Tenant.create({ name: localName, whatsapp_number: '', plan: 'free', subscription_status: 'trial' });
  const password_hash = await bcrypt.hash(password, 10);
  await User.create({ tenant_id: tenant.id, name, email, password_hash, role: 'admin', professional_id: null });

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/dashboard/
git commit -m "feat: NextAuth credentials auth with role-based JWT"
```

---

### Task 3: Layout + Sidebar

**Files:**
- Create: `packages/dashboard/app/dashboard/layout.tsx`
- Create: `packages/dashboard/components/Sidebar.tsx`
- Create: `packages/dashboard/components/sidebar.module.css`

- [ ] **Step 1: Implementar Sidebar**

```tsx
// packages/dashboard/components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import styles from './sidebar.module.css';

const adminLinks = [
  { href: '/dashboard/agenda', label: '📅 Agenda' },
  { href: '/dashboard/servicios', label: '✂️ Servicios' },
  { href: '/dashboard/clientes', label: '👥 Clientes' },
  { href: '/dashboard/metricas', label: '📊 Métricas' },
  { href: '/dashboard/configuracion', label: '⚙️ Configuración' },
];

const professionalLinks = [
  { href: '/dashboard/agenda', label: '📅 Mi Agenda' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const links = role === 'admin' ? adminLinks : professionalLinks;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.logo}>agenTurn</span>
        <span className={styles.tenantName}>Cargando...</span>
      </div>
      <nav className={styles.nav}>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.link} ${pathname.startsWith(link.href) ? styles.active : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className={styles.footer}>
        <span className={styles.userName}>{session?.user?.name}</span>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className={styles.signOut}>
          Salir
        </button>
      </div>
    </aside>
  );
}
```

```css
/* packages/dashboard/components/sidebar.module.css */
.sidebar { width: 200px; min-height: 100vh; background: rgba(10,10,20,0.9); border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
.header { padding: 20px 16px 16px; border-bottom: 1px solid var(--border); }
.logo { font-size: 15px; font-weight: 700; color: var(--primary); display: block; }
.tenantName { font-size: 11px; color: var(--text-muted); margin-top: 2px; display: block; }
.nav { flex: 1; padding: 8px 0; display: flex; flex-direction: column; gap: 2px; }
.link { display: block; padding: 9px 16px; font-size: 13px; color: var(--text-muted); border-left: 3px solid transparent; transition: all 0.15s; }
.link:hover { color: var(--text); background: var(--surface); }
.active { color: var(--text); background: var(--primary-light); border-left-color: var(--primary); font-weight: 600; }
.footer { padding: 16px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; }
.userName { font-size: 12px; font-weight: 600; }
.signOut { background: transparent; color: var(--text-muted); font-size: 12px; padding: 0; text-align: left; }
.signOut:hover { color: var(--red); }
```

- [ ] **Step 2: Crear dashboard layout**

```tsx
// packages/dashboard/app/dashboard/layout.tsx
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from './layout.module.css';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <SessionProvider session={session}>
      <div className={styles.shell}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
      </div>
    </SessionProvider>
  );
}
```

```css
/* packages/dashboard/app/dashboard/layout.module.css */
.shell { display: flex; min-height: 100vh; }
.main { flex: 1; overflow-y: auto; padding: 24px; }
```

- [ ] **Step 3: Commit**

```bash
git add packages/dashboard/app/dashboard/ packages/dashboard/components/
git commit -m "feat: dashboard layout with role-based sidebar"
```

---

### Task 4: API Routes (appointments, services, clients, metrics)

**Files:**
- Create: `packages/dashboard/app/api/appointments/route.ts`
- Create: `packages/dashboard/app/api/appointments/[id]/route.ts`
- Create: `packages/dashboard/app/api/services/route.ts`
- Create: `packages/dashboard/app/api/services/[id]/route.ts`
- Create: `packages/dashboard/app/api/clients/route.ts`
- Create: `packages/dashboard/app/api/clients/[id]/route.ts`
- Create: `packages/dashboard/app/api/metrics/route.ts`
- Create: `packages/dashboard/lib/session.ts`

- [ ] **Step 1: Crear helper para extraer sesión en API routes**

```typescript
// packages/dashboard/lib/session.ts
import { auth } from './auth';
import { NextResponse } from 'next/server';

export async function getSessionOrUnauthorized() {
  const session = await auth();
  if (!session?.user) return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { session, error: null };
}

export function getTenantId(session: NonNullable<Awaited<ReturnType<typeof auth>>>) {
  return (session.user as any).tenantId as string;
}
```

- [ ] **Step 2: appointments/route.ts (GET listado semanal)**

```typescript
// packages/dashboard/app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { Appointment, Client, Service, Professional } from '@agenturn/db';
import { Op } from 'sequelize';

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = getTenantId(session!);
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? new Date().toISOString().split('T')[0];
  const to = searchParams.get('to') ?? from;

  const professionalId = (session!.user as any).professionalId;
  const whereClause: Record<string, unknown> = {
    tenant_id: tenantId,
    status: { [Op.ne]: 'cancelled' },
    datetime: { [Op.between]: [new Date(`${from}T00:00:00`), new Date(`${to}T23:59:59`)] },
  };
  if (professionalId) whereClause.professional_id = professionalId;

  const appointments = await Appointment.findAll({
    where: whereClause,
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name', 'whatsapp_number'] },
      { model: Service, as: 'service', attributes: ['id', 'name', 'duration_minutes'] },
      { model: Professional, as: 'professional', attributes: ['id', 'name'] },
    ],
    order: [['datetime', 'ASC']],
  });

  return NextResponse.json(appointments);
}
```

- [ ] **Step 3: appointments/[id]/route.ts (PATCH para cancelar)**

```typescript
// packages/dashboard/app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { Appointment, Client, Tenant } from '@agenturn/db';
import { sendTextMessage } from '@agenturn/bot/whatsapp'; // importar cliente WPP

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = getTenantId(session!);
  const { status } = await req.json();

  const appointment = await Appointment.findOne({ where: { id: params.id, tenant_id: tenantId } });
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await appointment.update({ status });

  // Si el dueño cancela, notificar al cliente via WhatsApp
  if (status === 'cancelled') {
    const client = await Client.findByPk(appointment.client_id);
    const tenant = await Tenant.findByPk(tenantId);
    if (client && tenant) {
      await sendTextMessage(
        tenant.whatsapp_number,
        client.whatsapp_number,
        `Hola ${client.name}! Te informamos que tu turno del ${new Date(appointment.datetime).toLocaleDateString('es-AR')} fue cancelado. Disculpá los inconvenientes. Escribinos para reagendar.`,
      ).catch(console.error); // No bloquear si falla el envío
    }
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: services/route.ts (CRUD)**

```typescript
// packages/dashboard/app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { Service } from '@agenturn/db';

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const services = await Service.findAll({ where: { tenant_id: getTenantId(session!), active: true } });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const { name, duration_minutes, price } = await req.json();
  const service = await Service.create({ tenant_id: getTenantId(session!), name, duration_minutes, price });
  return NextResponse.json(service, { status: 201 });
}
```

```typescript
// packages/dashboard/app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { Service } from '@agenturn/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const data = await req.json();
  await Service.update(data, { where: { id: params.id, tenant_id: getTenantId(session!) } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  await Service.update({ active: false }, { where: { id: params.id, tenant_id: getTenantId(session!) } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: metrics/route.ts**

```typescript
// packages/dashboard/app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { Appointment, Service } from '@agenturn/db';
import { Op, fn, col, literal } from 'sequelize';

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const tenantId = getTenantId(session!);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const [monthTotal, weekTotal, cancelledMonth] = await Promise.all([
    Appointment.count({ where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfMonth } } }),
    Appointment.count({ where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfWeek } } }),
    Appointment.count({ where: { tenant_id: tenantId, status: 'cancelled', datetime: { [Op.gte]: startOfMonth } } }),
  ]);

  // Clientes únicos del mes
  const uniqueClients = await Appointment.findAll({
    where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfMonth } },
    attributes: [[fn('COUNT', fn('DISTINCT', col('client_id'))), 'count']],
    raw: true,
  });

  // Top servicios
  const topServices = await Appointment.findAll({
    where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfMonth } },
    attributes: ['service_id', [fn('COUNT', col('id')), 'count']],
    include: [{ model: Service, as: 'service', attributes: ['name'] }],
    group: ['service_id', 'service.id'],
    order: [[literal('count'), 'DESC']],
    limit: 5,
    raw: false,
  });

  return NextResponse.json({
    monthTotal,
    weekTotal,
    cancelledMonth,
    uniqueClientsMonth: (uniqueClients[0] as any)?.count ?? 0,
    topServices: topServices.map(a => ({ name: (a as any).service?.name, count: (a as any).dataValues?.count })),
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/dashboard/app/api/ packages/dashboard/lib/
git commit -m "feat: dashboard API routes (appointments, services, clients, metrics)"
```

---

### Task 5: Pantalla Agenda

**Files:**
- Create: `packages/dashboard/app/dashboard/agenda/page.tsx`
- Create: `packages/dashboard/app/dashboard/agenda/agenda.module.css`

- [ ] **Step 1: Implementar AgendaPage**

```tsx
// packages/dashboard/app/dashboard/agenda/page.tsx
'use client';
import { useState, useEffect } from 'react';
import styles from './agenda.module.css';

interface Appointment {
  id: string;
  datetime: string;
  status: string;
  service: { name: string; duration_minutes: number };
  client: { name: string };
  professional: { name: string };
}

const SERVICE_COLORS: Record<string, string> = {};
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6'];
let colorIndex = 0;
function getServiceColor(name: string) {
  if (!SERVICE_COLORS[name]) SERVICE_COLORS[name] = COLORS[colorIndex++ % COLORS.length];
  return SERVICE_COLORS[name];
}

function getWeekDates(baseDate: Date): string[] {
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - (baseDate.getDay() === 0 ? 6 : baseDate.getDay() - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 a 18:00

export default function AgendaPage() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const weekDates = getWeekDates(baseDate);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch(`/api/appointments?from=${weekDates[0]}&to=${weekDates[6]}`)
      .then(r => r.json()).then(setAppointments);
  }, [baseDate]);

  function prevWeek() { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d); }
  function nextWeek() { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d); }

  async function cancelAppointment(id: string) {
    if (!confirm('¿Cancelar este turno? Se le notificará al cliente.')) return;
    await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
    setAppointments(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Agenda</h1>
          <p className={styles.subtitle}>{weekDates[0]} → {weekDates[6]}</p>
        </div>
        <div className={styles.nav}>
          <button onClick={prevWeek} className={styles.navBtn}>← Anterior</button>
          <button onClick={() => setBaseDate(new Date())} className={styles.navBtnPrimary}>Hoy</button>
          <button onClick={nextWeek} className={styles.navBtn}>Siguiente →</button>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.timeCol} />
        {weekDates.map((date, i) => (
          <div key={date} className={`${styles.dayHeader} ${date === today ? styles.today : ''}`}>
            {DAY_LABELS[i]} {date.split('-')[2]}/{date.split('-')[1]}
          </div>
        ))}
        {HOURS.map(hour => (
          <>
            <div key={`h${hour}`} className={styles.hourLabel}>{hour}:00</div>
            {weekDates.map(date => {
              const cellAppts = appointments.filter(a => {
                const dt = new Date(a.datetime);
                return a.datetime.startsWith(date) && dt.getHours() === hour;
              });
              return (
                <div key={`${date}-${hour}`} className={`${styles.cell} ${date === today ? styles.todayCol : ''}`}>
                  {cellAppts.map(a => (
                    <div key={a.id} className={styles.apptCard} style={{ borderLeftColor: getServiceColor(a.service.name) }}>
                      <strong>{a.service.name}</strong>
                      <span>{a.client.name}</span>
                      <span className={styles.duration}>{a.service.duration_minutes} min</span>
                      <button onClick={() => cancelAppointment(a.id)} className={styles.cancelBtn} title="Cancelar turno">✕</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
```

```css
/* packages/dashboard/app/dashboard/agenda/agenda.module.css */
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.title { font-size: 20px; font-weight: 700; }
.subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.nav { display: flex; gap: 8px; }
.navBtn { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 8px 14px; border-radius: var(--radius); font-size: 12px; }
.navBtnPrimary { background: var(--primary-light); border: 1px solid var(--primary); color: var(--primary); padding: 8px 14px; border-radius: var(--radius); font-size: 12px; font-weight: 600; }
.grid { display: grid; grid-template-columns: 48px repeat(7, 1fr); gap: 1px; background: var(--border); border-radius: var(--radius); overflow: hidden; }
.timeCol, .dayHeader { background: rgba(10,10,20,0.9); }
.dayHeader { padding: 10px 6px; text-align: center; font-size: 12px; font-weight: 600; }
.today { background: var(--primary-light); color: var(--primary); }
.todayCol { background: rgba(99,102,241,0.04); }
.hourLabel { background: rgba(10,10,20,0.9); padding: 6px 4px; text-align: right; font-size: 11px; color: var(--text-muted); }
.cell { background: var(--bg); padding: 4px; min-height: 48px; position: relative; }
.apptCard { background: var(--surface); border-left: 3px solid var(--green); border-radius: 4px; padding: 4px 6px; font-size: 11px; margin-bottom: 2px; display: flex; flex-direction: column; gap: 1px; position: relative; }
.apptCard strong { font-size: 11px; }
.apptCard span { color: var(--text-muted); }
.duration { font-size: 10px; }
.cancelBtn { position: absolute; top: 3px; right: 3px; background: transparent; color: var(--text-muted); font-size: 10px; padding: 0 2px; }
.cancelBtn:hover { color: var(--red); }
```

- [ ] **Step 2: Commit**

```bash
git add packages/dashboard/app/dashboard/agenda/
git commit -m "feat: agenda screen with weekly calendar view"
```

---

### Task 6: Pantalla Servicios

**Files:**
- Create: `packages/dashboard/app/dashboard/servicios/page.tsx`
- Create: `packages/dashboard/app/dashboard/servicios/servicios.module.css`

- [ ] **Step 1: Implementar ServiciosPage**

```tsx
// packages/dashboard/app/dashboard/servicios/page.tsx
'use client';
import { useState, useEffect } from 'react';
import styles from './servicios.module.css';

interface Service { id: string; name: string; duration_minutes: number; price: number; active: boolean; }

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);

  useEffect(() => { fetch('/api/services').then(r => r.json()).then(setServices); }, []);

  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/services' : `/api/services/${editing.id}`;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    const saved = await res.json();
    setServices(prev => isNew ? [...prev, saved] : prev.map(s => s.id === editing.id ? { ...s, ...editing } : s));
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm('¿Desactivar este servicio?')) return;
    await fetch(`/api/services/${id}`, { method: 'DELETE' });
    setServices(prev => prev.filter(s => s.id !== id));
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Servicios</h1>
        <button onClick={() => setEditing({})} className={styles.addBtn}>+ Agregar servicio</button>
      </div>

      {editing !== null && (
        <div className={styles.form}>
          <h3>{editing.id ? 'Editar servicio' : 'Nuevo servicio'}</h3>
          <input placeholder="Nombre" value={editing.name ?? ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} className={styles.input} />
          <input placeholder="Duración (minutos)" type="number" value={editing.duration_minutes ?? ''} onChange={e => setEditing(p => ({ ...p, duration_minutes: +e.target.value }))} className={styles.input} />
          <input placeholder="Precio (ARS)" type="number" value={editing.price ?? ''} onChange={e => setEditing(p => ({ ...p, price: +e.target.value }))} className={styles.input} />
          <div className={styles.formActions}>
            <button onClick={save} className={styles.saveBtn}>Guardar</button>
            <button onClick={() => setEditing(null)} className={styles.cancelBtn}>Cancelar</button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {services.map(s => (
          <div key={s.id} className={styles.row}>
            <div className={styles.name}>{s.name}</div>
            <div className={styles.meta}>⏱ {s.duration_minutes} min</div>
            <div className={styles.meta}>💲 ${s.price.toLocaleString('es-AR')}</div>
            <div className={styles.actions}>
              <button onClick={() => setEditing(s)} className={styles.editBtn}>✏️ Editar</button>
              <button onClick={() => remove(s.id)} className={styles.deleteBtn}>🗑 Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```css
/* packages/dashboard/app/dashboard/servicios/servicios.module.css */
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.title { font-size: 20px; font-weight: 700; }
.addBtn { background: var(--primary); color: white; padding: 8px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 600; }
.form { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; max-width: 400px; }
.form h3 { font-size: 14px; font-weight: 600; }
.input { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px 12px; color: var(--text); width: 100%; }
.formActions { display: flex; gap: 8px; }
.saveBtn { background: var(--primary); color: white; padding: 8px 16px; border-radius: var(--radius); font-size: 13px; }
.cancelBtn { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); padding: 8px 16px; border-radius: var(--radius); font-size: 13px; }
.list { display: flex; flex-direction: column; gap: 8px; }
.row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 12px; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 16px; }
.name { font-weight: 600; }
.meta { color: var(--text-muted); font-size: 13px; }
.actions { display: flex; gap: 8px; }
.editBtn, .deleteBtn { background: transparent; color: var(--text-muted); font-size: 12px; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border); }
.editBtn:hover { color: var(--primary); border-color: var(--primary); }
.deleteBtn:hover { color: var(--red); border-color: var(--red); }
```

- [ ] **Step 2: Commit**

```bash
git add packages/dashboard/app/dashboard/servicios/
git commit -m "feat: servicios screen with CRUD"
```

---

### Task 7: Pantallas Clientes y Métricas

**Files:**
- Create: `packages/dashboard/app/dashboard/clientes/page.tsx`
- Create: `packages/dashboard/app/dashboard/clientes/clientes.module.css`
- Create: `packages/dashboard/app/dashboard/metricas/page.tsx`
- Create: `packages/dashboard/app/dashboard/metricas/metricas.module.css`
- Create: `packages/dashboard/app/api/clients/route.ts`

- [ ] **Step 1: API clients/route.ts**

```typescript
// packages/dashboard/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { Client, Appointment } from '@agenturn/db';
import { fn, col } from 'sequelize';

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const clients = await Client.findAll({
    where: { tenant_id: getTenantId(session!) },
    order: [['created_at', 'DESC']],
  });
  return NextResponse.json(clients);
}
```

- [ ] **Step 2: Implementar ClientesPage**

```tsx
// packages/dashboard/app/dashboard/clientes/page.tsx
'use client';
import { useState, useEffect } from 'react';
import styles from './clientes.module.css';

interface Client { id: string; name: string; whatsapp_number: string; created_at: string; }

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { fetch('/api/clients').then(r => r.json()).then(setClients); }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.whatsapp_number.includes(search),
  );

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <span className={styles.count}>{clients.length} clientes</span>
      </div>
      <input
        placeholder="🔍 Buscar por nombre o número..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={styles.search}
      />
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>NOMBRE</span><span>WHATSAPP</span><span>DESDE</span>
        </div>
        {filtered.map(c => (
          <div key={c.id} className={styles.row}>
            <div className={styles.avatar}>
              <span className={styles.initials}>{c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
              <strong>{c.name}</strong>
            </div>
            <span className={styles.muted}>{c.whatsapp_number}</span>
            <span className={styles.muted}>{new Date(c.created_at).toLocaleDateString('es-AR')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```css
/* packages/dashboard/app/dashboard/clientes/clientes.module.css */
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.title { font-size: 20px; font-weight: 700; }
.count { color: var(--text-muted); font-size: 13px; }
.search { width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 14px; color: var(--text); margin-bottom: 16px; display: block; }
.table { display: flex; flex-direction: column; gap: 4px; }
.tableHeader { display: grid; grid-template-columns: 2fr 1.5fr 1fr; gap: 12px; padding: 8px 16px; font-size: 11px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.05em; }
.row { display: grid; grid-template-columns: 2fr 1.5fr 1fr; gap: 12px; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 16px; }
.avatar { display: flex; align-items: center; gap: 10px; }
.initials { width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.muted { color: var(--text-muted); font-size: 13px; }
```

- [ ] **Step 3: Implementar MétricasPage**

```tsx
// packages/dashboard/app/dashboard/metricas/page.tsx
import styles from './metricas.module.css';
import { auth } from '@/lib/auth';
import { Appointment, Service, Client } from '@agenturn/db';
import { Op, fn, col, literal } from 'sequelize';

export default async function MetricasPage() {
  const session = await auth();
  const tenantId = (session?.user as any)?.tenantId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const [monthTotal, weekTotal, cancelledMonth] = await Promise.all([
    Appointment.count({ where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfMonth } } }),
    Appointment.count({ where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfWeek } } }),
    Appointment.count({ where: { tenant_id: tenantId, status: 'cancelled', datetime: { [Op.gte]: startOfMonth } } }),
  ]);

  const topServices = await Appointment.findAll({
    where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfMonth } },
    attributes: ['service_id', [fn('COUNT', col('Appointment.id')), 'count']],
    include: [{ model: Service, as: 'service', attributes: ['name'] }],
    group: ['service_id', 'service.id'],
    order: [[literal('count'), 'DESC']],
    limit: 5,
    raw: false,
  });

  const maxCount = Math.max(...topServices.map((a: any) => +a.dataValues.count), 1);

  return (
    <div>
      <h1 className={styles.title}>Métricas</h1>
      <div className={styles.stats}>
        <div className={styles.statCard} style={{ borderColor: 'rgba(99,102,241,0.4)' }}>
          <span className={styles.statNumber} style={{ color: '#818cf8' }}>{monthTotal}</span>
          <span className={styles.statLabel}>Turnos este mes</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: 'rgba(16,185,129,0.4)' }}>
          <span className={styles.statNumber} style={{ color: '#34d399' }}>{weekTotal}</span>
          <span className={styles.statLabel}>Esta semana</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
          <span className={styles.statNumber} style={{ color: '#f87171' }}>{cancelledMonth}</span>
          <span className={styles.statLabel}>Cancelados este mes</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Servicios más pedidos</h2>
      <div className={styles.bars}>
        {topServices.map((a: any) => {
          const count = +a.dataValues.count;
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={a.service_id} className={styles.barRow}>
              <span className={styles.barLabel}>{a.service?.name}</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${pct}%` }} />
              </div>
              <span className={styles.barCount}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

```css
/* packages/dashboard/app/dashboard/metricas/metricas.module.css */
.title { font-size: 20px; font-weight: 700; margin-bottom: 20px; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
.statCard { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.statNumber { font-size: 32px; font-weight: 700; }
.statLabel { font-size: 12px; color: var(--text-muted); }
.sectionTitle { font-size: 14px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 12px; }
.bars { display: flex; flex-direction: column; gap: 10px; }
.barRow { display: flex; align-items: center; gap: 12px; font-size: 13px; }
.barLabel { width: 120px; flex-shrink: 0; }
.barTrack { flex: 1; background: var(--surface); border-radius: 4px; height: 10px; overflow: hidden; }
.barFill { height: 100%; background: var(--primary); border-radius: 4px; transition: width 0.3s; }
.barCount { width: 30px; text-align: right; color: var(--text-muted); font-size: 12px; }
```

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/app/dashboard/clientes/ packages/dashboard/app/dashboard/metricas/ packages/dashboard/app/api/clients/
git commit -m "feat: clientes and metricas screens"
```

---

### Task 8: Pantalla Configuración

**Files:**
- Create: `packages/dashboard/app/dashboard/configuracion/page.tsx`
- Create: `packages/dashboard/app/dashboard/configuracion/configuracion.module.css`
- Create: `packages/dashboard/app/api/config/working-hours/route.ts`
- Create: `packages/dashboard/app/api/config/professionals/route.ts`
- Create: `packages/dashboard/app/api/config/blocked-dates/route.ts`

- [ ] **Step 1: API config routes**

```typescript
// packages/dashboard/app/api/config/working-hours/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { WorkingHours, Professional } from '@agenturn/db';

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const professionals = await Professional.findAll({
    where: { tenant_id: getTenantId(session!) },
    include: [{ model: WorkingHours, as: 'workingHours' }],
  });
  return NextResponse.json(professionals);
}

export async function PUT(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const { professional_id, hours } = await req.json();
  // hours: [{ day_of_week, start_time, end_time }]
  await WorkingHours.destroy({ where: { professional_id } });
  if (hours.length > 0) await WorkingHours.bulkCreate(hours.map((h: any) => ({ ...h, professional_id })));
  return NextResponse.json({ ok: true });
}
```

```typescript
// packages/dashboard/app/api/config/blocked-dates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { BlockedDate, Professional } from '@agenturn/db';

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const professionals = await Professional.findAll({ where: { tenant_id: getTenantId(session!), active: true } });
  const ids = professionals.map(p => p.id);
  const blocked = await BlockedDate.findAll({ where: { professional_id: ids } });
  return NextResponse.json(blocked);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const { professional_id, date, reason } = await req.json();
  const bd = await BlockedDate.create({ professional_id, date, reason });
  return NextResponse.json(bd, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const { id } = await req.json();
  await BlockedDate.destroy({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Implementar ConfiguracionPage**

```tsx
// packages/dashboard/app/dashboard/configuracion/page.tsx
'use client';
import { useState, useEffect } from 'react';
import styles from './configuracion.module.css';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface BlockedDate { id: string; professional_id: string; date: string; reason: string | null; }
interface WorkingDay { day_of_week: number; start_time: string; end_time: string; }
interface Professional { id: string; name: string; workingHours?: WorkingDay[]; }

export default function ConfiguracionPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newDateProf, setNewDateProf] = useState('');
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    fetch('/api/config/working-hours').then(r => r.json()).then(setProfessionals);
    fetch('/api/config/blocked-dates').then(r => r.json()).then(setBlockedDates);
  }, []);

  async function saveWorkingHours(profId: string, hours: WorkingDay[]) {
    await fetch('/api/config/working-hours', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ professional_id: profId, hours }) });
  }

  async function addBlockedDate() {
    if (!newDate || !newDateProf) return;
    const res = await fetch('/api/config/blocked-dates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ professional_id: newDateProf, date: newDate, reason: newReason }) });
    const bd = await res.json();
    setBlockedDates(prev => [...prev, bd]);
    setNewDate(''); setNewReason('');
  }

  async function removeBlockedDate(id: string) {
    await fetch('/api/config/blocked-dates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setBlockedDates(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div>
      <h1 className={styles.title}>Configuración</h1>

      {professionals.map(prof => (
        <div key={prof.id} className={styles.section}>
          <h2 className={styles.sectionTitle}>Horarios — {prof.name}</h2>
          <div className={styles.days}>
            {[1,2,3,4,5,6,0].map(day => {
              const wh = prof.workingHours?.find(w => w.day_of_week === day);
              return (
                <div key={day} className={styles.dayRow}>
                  <span className={styles.dayName}>{DAY_NAMES[day]}</span>
                  <input type="time" defaultValue={wh?.start_time ?? ''} id={`${prof.id}-${day}-start`} className={styles.timeInput} />
                  <span>–</span>
                  <input type="time" defaultValue={wh?.end_time ?? ''} id={`${prof.id}-${day}-end`} className={styles.timeInput} />
                </div>
              );
            })}
          </div>
          <button
            onClick={() => {
              const hours = [1,2,3,4,5,6,0].filter(day => {
                const s = (document.getElementById(`${prof.id}-${day}-start`) as HTMLInputElement)?.value;
                const e = (document.getElementById(`${prof.id}-${day}-end`) as HTMLInputElement)?.value;
                return s && e;
              }).map(day => ({
                day_of_week: day,
                start_time: (document.getElementById(`${prof.id}-${day}-start`) as HTMLInputElement).value,
                end_time: (document.getElementById(`${prof.id}-${day}-end`) as HTMLInputElement).value,
              }));
              saveWorkingHours(prof.id, hours);
            }}
            className={styles.saveBtn}
          >
            Guardar horarios
          </button>
        </div>
      ))}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Días bloqueados</h2>
        <div className={styles.blockedList}>
          {blockedDates.map(b => (
            <div key={b.id} className={styles.blockedTag}>
              <span>{b.date}{b.reason ? ` — ${b.reason}` : ''}</span>
              <button onClick={() => removeBlockedDate(b.id)} className={styles.removeBtn}>✕</button>
            </div>
          ))}
        </div>
        <div className={styles.addBlocked}>
          <select value={newDateProf} onChange={e => setNewDateProf(e.target.value)} className={styles.select}>
            <option value="">Profesional</option>
            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className={styles.dateInput} />
          <input placeholder="Motivo (opcional)" value={newReason} onChange={e => setNewReason(e.target.value)} className={styles.reasonInput} />
          <button onClick={addBlockedDate} className={styles.addBtn}>+ Bloquear</button>
        </div>
      </div>
    </div>
  );
}
```

```css
/* packages/dashboard/app/dashboard/configuracion/configuracion.module.css */
.title { font-size: 20px; font-weight: 700; margin-bottom: 24px; }
.section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; }
.sectionTitle { font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 16px; letter-spacing: 0.05em; }
.days { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.dayRow { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.dayName { width: 32px; color: var(--text-muted); }
.timeInput { background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 6px 10px; color: var(--text); font-size: 13px; }
.saveBtn { background: var(--primary); color: white; padding: 8px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 600; }
.blockedList { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.blockedTag { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 20px; padding: 4px 12px; font-size: 12px; display: flex; align-items: center; gap: 8px; }
.removeBtn { background: transparent; color: var(--red); font-size: 11px; padding: 0; }
.addBlocked { display: flex; gap: 8px; flex-wrap: wrap; }
.select, .dateInput, .reasonInput { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px 12px; color: var(--text); font-size: 13px; }
.reasonInput { flex: 1; min-width: 150px; }
.addBtn { background: var(--primary-light); border: 1px solid var(--primary); color: var(--primary); padding: 8px 14px; border-radius: var(--radius); font-size: 13px; font-weight: 600; white-space: nowrap; }
```

- [ ] **Step 3: Commit**

```bash
git add packages/dashboard/app/dashboard/configuracion/ packages/dashboard/app/api/config/
git commit -m "feat: configuracion screen with working hours and blocked dates"
```

---

### Task 9: Human Handoff panel + Deploy Vercel

**Files:**
- Create: `packages/dashboard/app/api/conversations/route.ts`
- Create: `packages/dashboard/app/api/conversations/[id]/handoff/route.ts`
- Create: `packages/dashboard/components/HandoffNotification.tsx`

- [ ] **Step 1: API para conversaciones en handoff**

```typescript
// packages/dashboard/app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { ConversationState, Client } from '@agenturn/db';

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  const convs = await ConversationState.findAll({
    where: { tenant_id: getTenantId(session!), state: 'HUMAN_HANDOFF' },
    order: [['updated_at', 'DESC']],
  });
  return NextResponse.json(convs);
}
```

```typescript
// packages/dashboard/app/api/conversations/[id]/handoff/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrUnauthorized } from '@/lib/session';
import { ConversationState } from '@agenturn/db';

// El dueño presiona "Pasar a bot" — cambia el estado a SELECT_SERVICE
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;
  await ConversationState.update(
    { state: 'SELECT_SERVICE', temp_data: {} },
    { where: { id: params.id } },
  );
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Agregar HandoffNotification al dashboard layout**

```tsx
// packages/dashboard/components/HandoffNotification.tsx
'use client';
import { useState, useEffect } from 'react';
import styles from './handoff.module.css';

interface Conv { id: string; client_whatsapp: string; updated_at: string; }

export default function HandoffNotification() {
  const [convs, setConvs] = useState<Conv[]>([]);

  useEffect(() => {
    const load = () => fetch('/api/conversations').then(r => r.json()).then(setConvs).catch(() => {});
    load();
    const interval = setInterval(load, 15000); // poll cada 15s
    return () => clearInterval(interval);
  }, []);

  async function passToBot(id: string) {
    await fetch(`/api/conversations/${id}/handoff`, { method: 'POST' });
    setConvs(prev => prev.filter(c => c.id !== id));
  }

  if (convs.length === 0) return null;

  return (
    <div className={styles.container}>
      {convs.map(c => (
        <div key={c.id} className={styles.notification}>
          <span className={styles.dot} />
          <span className={styles.text}>
            <strong>Cliente quiere hablar</strong> — {c.client_whatsapp}
          </span>
          <button onClick={() => passToBot(c.id)} className={styles.botBtn}>Pasar a bot →</button>
        </div>
      ))}
    </div>
  );
}
```

```css
/* packages/dashboard/components/handoff.module.css */
.container { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 100; }
.notification { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.4); border-radius: var(--radius); padding: 12px 16px; display: flex; align-items: center; gap: 10px; min-width: 320px; backdrop-filter: blur(8px); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
.text { flex: 1; font-size: 13px; }
.botBtn { background: var(--primary); color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; white-space: nowrap; }
```

- [ ] **Step 3: Agregar HandoffNotification al layout**

En `packages/dashboard/app/dashboard/layout.tsx`, importar y agregar `<HandoffNotification />` dentro del `<main>`.

- [ ] **Step 4: Deploy a Vercel**

1. Ir a [vercel.com](https://vercel.com) → New Project → Import de GitHub
2. Root directory: `packages/dashboard`
3. Build command: `next build`
4. Variables de entorno: `DATABASE_URL`, `NEXTAUTH_SECRET` (generar con `openssl rand -base64 32`), `NEXTAUTH_URL` (URL de Vercel)
5. Deploy

- [ ] **Step 5: Commit final**

```bash
git add packages/dashboard/
git commit -m "feat: human handoff UI, handoff API, Vercel deploy config"
```

---

**Plan 3 completado. agenTurn MVP completo:**
- ✅ Bot de WhatsApp en Railway recibiendo mensajes
- ✅ Panel web en Vercel con 5 pantallas
- ✅ Motor de scheduling sin conflictos de horario
- ✅ Human handoff bidireccional
- ✅ Cancelación desde bot y desde panel
- ✅ PWA instalable desde el navegador
- ✅ Multi-tenant, roles admin/profesional
