# Migración Sequelize → Drizzle ORM — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar Sequelize por Drizzle ORM + `@neondatabase/serverless` en todo el monorepo para resolver el error de bundling de `pg` en Vercel/Turbopack.

**Architecture:** El paquete `@agenturn/db` pasa de exportar clases Sequelize a exportar el cliente Drizzle (`db`) y el schema (`schema.ts`). Dashboard y bot consumen esas exportaciones con la API de Drizzle. Las tablas en NeonDB no se tocan — solo cambia cómo el código las consulta.

**Tech Stack:** `drizzle-orm`, `@neondatabase/serverless`, TypeScript, Next.js 16 App Router, Node.js/Express.

---

## Estructura de archivos

### `packages/db` — cambia completamente

| Archivo | Acción |
|---|---|
| `src/schema.ts` | **CREAR** — todas las tablas con `pgTable()` |
| `src/db.ts` | **CREAR** — cliente `neon()` + `drizzle()` |
| `src/index.ts` | **MODIFICAR** — exportar `db`, `schema`, `getAvailableSlots` |
| `src/connection.ts` | **BORRAR** |
| `src/models/` (todo) | **BORRAR** |
| `src/sync.ts` | **BORRAR** |
| `package.json` | **MODIFICAR** — quitar sequelize/pg, agregar drizzle |

### `packages/dashboard` — 22 archivos

| Archivo | Acción |
|---|---|
| `src/lib/auth.ts` | **MODIFICAR** — pasar de `Pool` de `pg` a Drizzle |
| `src/app/api/appointments/route.ts` | **MODIFICAR** |
| `src/app/api/appointments/[id]/route.ts` | **MODIFICAR** |
| `src/app/api/clients/route.ts` | **MODIFICAR** |
| `src/app/api/clients/[id]/route.ts` | **MODIFICAR** |
| `src/app/api/professionals/route.ts` | **MODIFICAR** |
| `src/app/api/professionals/[id]/route.ts` | **MODIFICAR** |
| `src/app/api/services/route.ts` | **MODIFICAR** |
| `src/app/api/services/[id]/route.ts` | **MODIFICAR** |
| `src/app/api/categories/route.ts` | **MODIFICAR** |
| `src/app/api/categories/[id]/route.ts` | **MODIFICAR** |
| `src/app/api/blockedDates/route.ts` | **MODIFICAR** |
| `src/app/api/blockedDates/[id]/route.ts` | **MODIFICAR** |
| `src/app/api/workingHours/route.ts` | **MODIFICAR** |
| `src/app/api/tenant/route.ts` | **MODIFICAR** |
| `src/app/api/config-summary/route.ts` | **MODIFICAR** |
| `src/app/api/register/route.ts` | **MODIFICAR** |
| `src/app/api/metrics/route.ts` | **MODIFICAR** |
| `src/app/api/notifications/route.ts` | **MODIFICAR** |
| `src/app/api/notifications/[id]/route.ts` | **MODIFICAR** |
| `src/app/api/push-subscriptions/route.ts` | **MODIFICAR** |
| `src/app/api/agenda/form-data/route.ts` | **MODIFICAR** |

### `packages/bot` — 10 archivos

| Archivo | Acción |
|---|---|
| `src/router.ts` | **MODIFICAR** |
| `src/client-lookup.ts` | **MODIFICAR** |
| `src/ttl-cleanup.ts` | **MODIFICAR** |
| `src/push/push.ts` | **MODIFICAR** |
| `src/state-machine.ts` | **MODIFICAR** — quitar tipos Sequelize |
| `src/states/greeting.ts` | **MODIFICAR** |
| `src/states/select-category.ts` | **MODIFICAR** |
| `src/states/select-service.ts` | **MODIFICAR** |
| `src/states/select-professional.ts` | **MODIFICAR** |
| `src/states/select-date.ts` | **MODIFICAR** |
| `src/states/select-time.ts` | **MODIFICAR** — usa `getSlotsForDate` sin cambios de firma |
| `src/states/confirm.ts` | **MODIFICAR** — quita tipos Sequelize |
| `src/states/confirmed.ts` | **MODIFICAR** |
| `src/states/cancel-select.ts` | **MODIFICAR** |
| `src/states/cancel-confirm.ts` | **MODIFICAR** |
| `src/states/human-handoff.ts` | **MODIFICAR** |
| `src/states/waitlist.ts` | **MODIFICAR** |

---

## Task 1: Setup de ramas git

**Files:**
- N/A (solo git)

- [ ] **Step 1: Crear rama principal de migración**

```bash
git checkout -b feat/migrate-drizzle
```

- [ ] **Step 2: Crear subbrama para @agenturn/db**

```bash
git checkout -b feat/migrate-drizzle/db
```

---

## Task 2: Instalar dependencias Drizzle en `@agenturn/db`

**Files:**
- Modify: `packages/db/package.json`

- [ ] **Step 1: Instalar Drizzle y el driver de NeonDB**

```bash
npm install drizzle-orm @neondatabase/serverless --workspace=packages/db
```

- [ ] **Step 2: Desinstalar Sequelize y pg**

```bash
npm uninstall sequelize pg pg-hstore --workspace=packages/db
```

- [ ] **Step 3: Verificar `package.json` resultante**

```bash
cat packages/db/package.json
```

Esperado: solo `drizzle-orm` y `@neondatabase/serverless` en `dependencies` (más `dotenv`). Sin `sequelize`, `pg`, `pg-hstore`.

---

## Task 3: Crear `packages/db/src/schema.ts`

**Files:**
- Create: `packages/db/src/schema.ts`

> **Concepto clave antes de empezar:** En Drizzle no hay clases ni instancias. Una tabla es un objeto JavaScript creado con `pgTable("nombre_en_db", { columnas })`. Cada columna es un helper tipado: `uuid()`, `varchar()`, `integer()`, `boolean()`, `timestamp()`, `text()`, `jsonb()`. Para columnas con valores restringidos usás `pgEnum()` — que además crea el tipo enum en Postgres.

- [ ] **Step 1: Crear el archivo con los enums y la tabla `tenants`**

```ts
// packages/db/src/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  jsonb,
  pgEnum,
  date,
  time,
} from "drizzle-orm/pg-core"

export const planEnum = pgEnum("plan", ["free", "pro"])
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "inactive", "trial"])
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "cancelled"])
export const userRoleEnum = pgEnum("role", ["admin", "professional"])
export const notificationTypeEnum = pgEnum("notification_type", ["new_appointment", "cancelled_appointment", "human_handoff"])
export const conversationStateEnum = pgEnum("conversation_state_enum", [
  "greeting", "select_service", "select_professional", "select_date",
  "select_time", "confirm", "confirmed", "cancel_select", "cancel_confirm",
  "human_handoff", "waitlist", "select_category",
])

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  whatsapp_number: varchar("whatsapp_number", { length: 50 }),
  phone_number_id: varchar("phone_number_id", { length: 50 }),
  plan: planEnum("plan").notNull(),
  subscription_status: subscriptionStatusEnum("subscription_status").notNull(),
  slot_interval_minutes: integer("slot_interval_minutes"),
  created_at: timestamp("created_at").defaultNow(),
})
```

- [ ] **Step 2: Agregar el resto de tablas al mismo archivo**

```ts
export const professionals = pgTable("professionals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }),
  active: boolean("active"),
})

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
})

export const professionalCategories = pgTable("professional_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  professional_id: uuid("professional_id").notNull(),
  category_id: uuid("category_id").notNull(),
})

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }),
  duration_minutes: integer("duration_minutes"),
  price: integer("price"),
  active: boolean("active"),
  category_id: uuid("category_id"),
})

export const workingHours = pgTable("working_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  professional_id: uuid("professional_id").notNull(),
  day_of_week: integer("day_of_week"),
  start_time: time("start_time"),
  end_time: time("end_time"),
})

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  professional_id: uuid("professional_id").notNull(),
  service_id: uuid("service_id").notNull(),
  client_id: uuid("client_id").notNull(),
  datetime: timestamp("datetime"),
  status: appointmentStatusEnum("status"),
})

export const blockedDates = pgTable("blocked_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  professional_id: uuid("professional_id").notNull(),
  date: date("date"),
  reason: varchar("reason", { length: 255 }),
})

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  professional_id: uuid("professional_id"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  password_hash: varchar("password_hash", { length: 255 }),
  role: userRoleEnum("role"),
  active: boolean("active"),
  created_at: timestamp("created_at").defaultNow(),
})

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }),
  whatsapp_number: varchar("whatsapp_number", { length: 50 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
})

export const conversationStates = pgTable("conversation_states", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  client_whatsapp: varchar("client_whatsapp", { length: 50 }),
  state: varchar("state", { length: 50 }),
  temp_data: jsonb("temp_data").$type<Record<string, unknown>>(),
  updated_at: timestamp("updated_at"),
})

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  client_id: uuid("client_id").notNull(),
  service_id: uuid("service_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
})

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  type: notificationTypeEnum("type"),
  title: varchar("title", { length: 255 }),
  body: varchar("body", { length: 500 }),
  read: boolean("read").default(false),
  created_at: timestamp("created_at").defaultNow(),
})

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  tenant_id: uuid("tenant_id").notNull(),
  endpoint: text("endpoint"),
  keys: jsonb("keys").$type<{ p256dh: string; auth: string }>().notNull(),
  created_at: timestamp("created_at").defaultNow(),
})
```

- [ ] **Step 3: Verificar que TypeScript no tiene errores**

```bash
cd "packages/db" && npx tsc --noEmit --skipLibCheck 2>&1 | head -30
```

---

## Task 4: Crear `packages/db/src/db.ts`

**Files:**
- Create: `packages/db/src/db.ts`

> **Concepto clave:** `neon()` de `@neondatabase/serverless` crea una función SQL que habla con NeonDB por HTTP (sin TCP, sin `pg`). `drizzle()` envuelve esa función y le agrega la API de query-building. El `schema` que le pasamos es lo que permite las queries type-safe.

- [ ] **Step 1: Crear el cliente**

```ts
// packages/db/src/db.ts
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

- [ ] **Step 2: Verificar que compila**

```bash
cd "packages/db" && npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

Esperado: sin errores sobre `db.ts`.

---

## Task 5: Actualizar `packages/db/src/index.ts`

**Files:**
- Modify: `packages/db/src/index.ts`

> **Concepto clave:** El contrato de `@agenturn/db` cambia. Antes exportaba clases (`Tenant`, `User`, etc.). Ahora exporta: `db` (el cliente para hacer queries), y los objetos de tabla (`tenants`, `users`, etc.) que se usan en las queries. Los consumidores importan así: `import { db, tenants, users } from "@agenturn/db"`.

- [ ] **Step 1: Reemplazar el contenido de `index.ts`**

```ts
// packages/db/src/index.ts
export { db } from "./db"
export {
  tenants,
  professionals,
  serviceCategories,
  professionalCategories,
  services,
  workingHours,
  appointments,
  blockedDates,
  users,
  clients,
  conversationStates,
  waitlist,
  notifications,
  pushSubscriptions,
} from "./schema"
export { getAvailableSlots } from "./scheduling"
export type { WorkingHoursRange, TimeSlot, ExistingAppointment } from "./scheduling"

// Re-export del tipo de estado de conversación para el bot
export type ConversationStateEnum =
  | "greeting" | "select_service" | "select_professional" | "select_date"
  | "select_time" | "confirm" | "confirmed" | "cancel_select" | "cancel_confirm"
  | "human_handoff" | "waitlist" | "select_category"
```

- [ ] **Step 2: Borrar los archivos Sequelize que ya no se usan**

```bash
rm "packages/db/src/connection.ts"
rm "packages/db/src/sync.ts"
rm -rf "packages/db/src/models"
```

- [ ] **Step 3: Build del paquete**

```bash
npm run build --workspace=packages/db
```

Esperado: `dist/index.js` generado sin errores.

- [ ] **Step 4: Commit**

```bash
git add packages/db/
git commit -m "feat(db): migrate @agenturn/db from Sequelize to Drizzle ORM"
```

---

## Task 6: Setup subbrama dashboard y actualizar auth

**Files:**
- Modify: `packages/dashboard/src/lib/auth.ts`

- [ ] **Step 1: Mergear rama db a feat/migrate-drizzle y crear subbrama dashboard**

```bash
git checkout feat/migrate-drizzle
git merge feat/migrate-drizzle/db
git checkout -b feat/migrate-drizzle/dashboard
```

- [ ] **Step 2: Instalar drizzle-orm en el dashboard (si no viene del workspace)**

```bash
npm install drizzle-orm @neondatabase/serverless --workspace=packages/dashboard
```

- [ ] **Step 3: Migrar `src/lib/auth.ts` — reemplazar `Pool` de `pg` por Drizzle**

> La query que hace auth es `SELECT * FROM users WHERE email = $1`. En Drizzle: `db.select().from(users).where(eq(users.email, email)).then(r => r[0])`.

```ts
// packages/dashboard/src/lib/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db, users } from "@agenturn/db"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .then(r => r[0])

        if (!user) throw new Error("No existe este usuario")

        const valid = await bcrypt.compare(credentials.password as string, user.password_hash!)
        if (!valid) throw new Error("Contraseña incorrecta")

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenant_id,
          role: user.role,
          professionalId: user.professional_id,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as any).tenantId
        token.role = (user as any).role
        token.professionalId = (user as any).professionalId
      }
      return token
    },
    session({ session, token }) {
      (session.user as any).tenantId = token.tenantId
      (session.user as any).role = token.role
      (session.user as any).professionalId = token.professionalId
      return session
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
})
```

- [ ] **Step 4: Verificar que TypeScript no tiene errores en auth.ts**

```bash
cd "packages/dashboard" && npx tsc --noEmit --skipLibCheck 2>&1 | grep "auth.ts" | head -10
```

---

## Task 7: Migrar routes simples del dashboard (CRUD sin joins)

**Files:**
- Modify: `packages/dashboard/src/app/api/clients/route.ts`
- Modify: `packages/dashboard/src/app/api/services/route.ts`
- Modify: `packages/dashboard/src/app/api/services/[id]/route.ts`
- Modify: `packages/dashboard/src/app/api/categories/route.ts`
- Modify: `packages/dashboard/src/app/api/categories/[id]/route.ts`
- Modify: `packages/dashboard/src/app/api/tenant/route.ts`
- Modify: `packages/dashboard/src/app/api/notifications/route.ts`
- Modify: `packages/dashboard/src/app/api/notifications/[id]/route.ts`
- Modify: `packages/dashboard/src/app/api/register/route.ts`

> **Concepto clave — patrón Drizzle para CRUD:**
> - `SELECT WHERE` → `db.select().from(tabla).where(eq(tabla.col, val))`
> - `SELECT` todos → `db.select().from(tabla).where(and(eq(...), eq(...)))`
> - `INSERT` → `db.insert(tabla).values({...}).returning()`
> - `UPDATE` → `db.update(tabla).set({...}).where(eq(tabla.id, id))`
> - `DELETE` → `db.delete(tabla).where(eq(tabla.id, id))`
> - `findOne` → igual que `select` + `.then(r => r[0])`
> - Ordenar → `.orderBy(desc(tabla.created_at))` (importar `desc` de `drizzle-orm`)
> - Limitar → `.limit(30)`

- [ ] **Step 1: Migrar `clients/route.ts`**

```ts
// packages/dashboard/src/app/api/clients/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, clients } from "@agenturn/db"
import { eq, desc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.tenant_id, tenantId))
    .orderBy(desc(clients.created_at))

  return NextResponse.json(result)
}
```

- [ ] **Step 2: Migrar `services/route.ts`**

```ts
// packages/dashboard/src/app/api/services/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, services } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const result = await db.select().from(services).where(eq(services.tenant_id, tenantId))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, durationMinutes, price, active, category_id } = body

  if (!name || !durationMinutes || !price) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 })
  }

  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const [service] = await db.insert(services).values({
    tenant_id: tenantId,
    name,
    duration_minutes: durationMinutes,
    price,
    active,
    category_id,
  }).returning()

  return NextResponse.json(service, { status: 201 })
}
```

- [ ] **Step 3: Migrar `services/[id]/route.ts`**

```ts
// packages/dashboard/src/app/api/services/[id]/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, services } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const result = await db
    .update(services)
    .set(body)
    .where(and(eq(services.id, id), eq(services.tenant_id, tenantId)))
    .returning()

  if (result.length === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const result = await db
    .update(services)
    .set({ active: false })
    .where(and(eq(services.id, id), eq(services.tenant_id, tenantId)))
    .returning()

  if (result.length === 0) {
    return NextResponse.json({ error: "No se encontro el servicio" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Migrar `categories/route.ts`**

```ts
// packages/dashboard/src/app/api/categories/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, serviceCategories } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const result = await db.select().from(serviceCategories).where(eq(serviceCategories.tenant_id, tenantId))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const body = await req.json()
  const tenantId = await getTenantId(session)
  const { name } = body

  if (!name) {
    return NextResponse.json({ message: "El nombre de la categoría es obligatorio" }, { status: 400 })
  }

  const [category] = await db.insert(serviceCategories).values({
    name,
    tenant_id: tenantId,
  }).returning()

  return NextResponse.json(category)
}
```

- [ ] **Step 5: Migrar `categories/[id]/route.ts`**

```ts
// packages/dashboard/src/app/api/categories/[id]/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, serviceCategories } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const { id } = await params
  const body = await req.json()
  const { name } = body

  const result = await db
    .update(serviceCategories)
    .set({ name })
    .where(and(eq(serviceCategories.id, id), eq(serviceCategories.tenant_id, tenantId)))
    .returning()

  if (result.length === 0) {
    return NextResponse.json({ message: "No se encontro la categoria a editar" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const { id } = await params

  await db.delete(serviceCategories).where(and(eq(serviceCategories.id, id), eq(serviceCategories.tenant_id, tenantId)))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Migrar `tenant/route.ts`**

```ts
// packages/dashboard/src/app/api/tenant/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, tenants } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).then(r => r[0])

  if (!tenant) {
    return NextResponse.json({ message: "No se encontro el tenant" }, { status: 404 })
  }

  return NextResponse.json(tenant)
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const body = await req.json()
  const { name, whatsapp_number, phone_number_id, slot_interval_minutes } = body

  await db
    .update(tenants)
    .set({ name, whatsapp_number, phone_number_id, slot_interval_minutes })
    .where(eq(tenants.id, tenantId))

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Migrar `notifications/route.ts`**

```ts
// packages/dashboard/src/app/api/notifications/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, notifications } from "@agenturn/db"
import { and, eq, desc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.tenant_id, tenantId))
    .orderBy(desc(notifications.created_at))
    .limit(30)

  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.tenant_id, tenantId), eq(notifications.read, false)))

  return NextResponse.json(true)
}
```

- [ ] **Step 8: Migrar `notifications/[id]/route.ts`**

```ts
// packages/dashboard/src/app/api/notifications/[id]/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, notifications } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const { id } = await params

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.tenant_id, tenantId), eq(notifications.read, false)))

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const { id } = await params

  await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.tenant_id, tenantId)))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 9: Migrar `register/route.ts`**

```ts
// packages/dashboard/src/app/api/register/route.ts
import { db, tenants, users } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, password, localName } = body

  if (!name || !email || !password || !localName) {
    return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 })
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then(r => r[0])

  if (existingUser) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 })
  }

  const [tenant] = await db.insert(tenants).values({
    name: localName,
    whatsapp_number: "",
    phone_number_id: "",
    plan: "free",
    subscription_status: "active",
    slot_interval_minutes: 0,
  }).returning()

  const hash = await bcrypt.hash(password, 10)

  await db.insert(users).values({
    tenant_id: tenant.id,
    name,
    email,
    password_hash: hash,
    role: "admin",
    active: true,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
```

- [ ] **Step 10: Verificar que compila**

```bash
cd "packages/dashboard" && npx tsc --noEmit --skipLibCheck 2>&1 | head -40
```

---

## Task 8: Migrar routes con joins — appointments, clients/[id], push-subscriptions

**Files:**
- Modify: `packages/dashboard/src/app/api/appointments/route.ts`
- Modify: `packages/dashboard/src/app/api/appointments/[id]/route.ts`
- Modify: `packages/dashboard/src/app/api/clients/[id]/route.ts`
- Modify: `packages/dashboard/src/app/api/push-subscriptions/route.ts`

> **Concepto clave — joins en Drizzle:** No hay `include` como en Sequelize. Un join se hace con `.innerJoin(otraTabla, eq(tabla.fk, otraTabla.id))`. El resultado es un array de objetos planos con todas las columnas juntas. Para "LEFT JOIN" (incluir aunque no haya relación) usás `.leftJoin()`. Para queries complejas con varios joins conviene `sql` template literal o construir el resultado en memoria.

- [ ] **Step 1: Migrar `appointments/route.ts`**

```ts
// packages/dashboard/src/app/api/appointments/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, appointments, clients, services, professionals } from "@agenturn/db"
import { and, between, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const result = await db
    .select({
      id: appointments.id,
      tenant_id: appointments.tenant_id,
      professional_id: appointments.professional_id,
      service_id: appointments.service_id,
      client_id: appointments.client_id,
      datetime: appointments.datetime,
      status: appointments.status,
      client: { id: clients.id, name: clients.name, whatsapp_number: clients.whatsapp_number },
      service: { id: services.id, name: services.name, duration_minutes: services.duration_minutes, price: services.price },
      professional: { id: professionals.id, name: professionals.name },
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.client_id, clients.id))
    .leftJoin(services, eq(appointments.service_id, services.id))
    .leftJoin(professionals, eq(appointments.professional_id, professionals.id))
    .where(
      and(
        eq(appointments.tenant_id, tenantId),
        between(
          appointments.datetime,
          new Date(`${from}T00:00:00`),
          new Date(`${to}T23:59:59`),
        ),
      ),
    )
    .orderBy(appointments.datetime)

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const body = await req.json()
  const { professional_id, service_id, client_id, datetime } = body

  const service = await db.select().from(services).where(eq(services.id, service_id)).then(r => r[0])
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
  }

  const newStart = new Date(datetime)
  const newEnd = new Date(newStart.getTime() + service.duration_minutes! * 60 * 1000)

  const dayStart = new Date(datetime)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(datetime)
  dayEnd.setHours(23, 59, 59, 999)

  const existing = await db
    .select({
      id: appointments.id,
      datetime: appointments.datetime,
      duration_minutes: services.duration_minutes,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.service_id, services.id))
    .where(
      and(
        eq(appointments.professional_id, professional_id),
        eq(appointments.status, "confirmed"),
        between(appointments.datetime, dayStart, dayEnd),
      ),
    )

  const conflict = existing.some((a) => {
    const aStart = new Date(a.datetime!)
    const aEnd = new Date(aStart.getTime() + (a.duration_minutes ?? 0) * 60 * 1000)
    return newStart < aEnd && newEnd > aStart
  })

  if (conflict) {
    return NextResponse.json({ error: "Ese horario ya está ocupado" }, { status: 409 })
  }

  const [created] = await db.insert(appointments).values({
    tenant_id: tenantId,
    professional_id,
    service_id,
    client_id,
    datetime: new Date(datetime),
    status: "confirmed",
  }).returning()

  return NextResponse.json(created)
}
```

- [ ] **Step 2: Migrar `appointments/[id]/route.ts`**

```ts
// packages/dashboard/src/app/api/appointments/[id]/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, appointments } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const result = await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(and(eq(appointments.id, id), eq(appointments.tenant_id, tenantId)))
    .returning()

  if (result.length === 0) {
    return NextResponse.json({ message: "Este turno no existe" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Migrar `clients/[id]/route.ts`**

```ts
// packages/dashboard/src/app/api/clients/[id]/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, clients, appointments, services, professionals } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.tenant_id, tenantId)))
    .then(r => r[0])

  if (!client) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const clientAppointments = await db
    .select({
      id: appointments.id,
      datetime: appointments.datetime,
      status: appointments.status,
      service: { id: services.id, name: services.name, duration_minutes: services.duration_minutes },
      professional: { id: professionals.id, name: professionals.name },
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.service_id, services.id))
    .leftJoin(professionals, eq(appointments.professional_id, professionals.id))
    .where(eq(appointments.client_id, id))
    .orderBy(appointments.datetime)

  return NextResponse.json({ ...client, appointments: clientAppointments })
}
```

- [ ] **Step 4: Migrar `push-subscriptions/route.ts`**

```ts
// packages/dashboard/src/app/api/push-subscriptions/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { NextRequest, NextResponse } from "next/server"
import { db, pushSubscriptions } from "@agenturn/db"
import { and, eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const body = await req.json()
  const { endpoint, keys } = body
  const userId = (session.user as any).id

  if (!endpoint || !keys) {
    return NextResponse.json({ message: "Endpoint y Keys son necesarios" }, { status: 400 })
  }

  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.user_id, userId), eq(pushSubscriptions.endpoint, endpoint)))
    .then(r => r[0])

  if (existing) {
    return NextResponse.json({ message: "Este endpoint ya existe" }, { status: 200 })
  }

  await db.insert(pushSubscriptions).values({
    user_id: userId,
    tenant_id: tenantId,
    endpoint,
    keys,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const body = await req.json()
  const { endpoint } = body
  const userId = (session.user as any).id

  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.user_id, userId), eq(pushSubscriptions.endpoint, endpoint)))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Verificar que compila**

```bash
cd "packages/dashboard" && npx tsc --noEmit --skipLibCheck 2>&1 | head -40
```

---

## Task 9: Migrar routes complejas — professionals, workingHours, blockedDates, config-summary, agenda/form-data

**Files:**
- Modify: `packages/dashboard/src/app/api/professionals/route.ts`
- Modify: `packages/dashboard/src/app/api/professionals/[id]/route.ts`
- Modify: `packages/dashboard/src/app/api/workingHours/route.ts`
- Modify: `packages/dashboard/src/app/api/blockedDates/route.ts`
- Modify: `packages/dashboard/src/app/api/blockedDates/[id]/route.ts`
- Modify: `packages/dashboard/src/app/api/config-summary/route.ts`
- Modify: `packages/dashboard/src/app/api/agenda/form-data/route.ts`

> **Concepto clave — muchos-a-muchos sin ORM mágico:** Sequelize tenía `addServiceCategories()` y `setServiceCategories()` generados automáticamente. Drizzle no tiene eso — las relaciones many-to-many se manejan insertando/borrando manualmente en la tabla intermedia (`professional_categories`). Para obtener categorías de un profesional: hacer un join de `professionals` con `professional_categories` y `service_categories`.

- [ ] **Step 1: Migrar `professionals/route.ts`**

```ts
// packages/dashboard/src/app/api/professionals/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, professionals, professionalCategories, serviceCategories } from "@agenturn/db"
import { and, eq, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const profs = await db.select().from(professionals).where(eq(professionals.tenant_id, tenantId))

  // Para cada profesional, traer sus categorías
  const profsWithCategories = await Promise.all(
    profs.map(async (p) => {
      const cats = await db
        .select({ id: serviceCategories.id, name: serviceCategories.name })
        .from(professionalCategories)
        .innerJoin(serviceCategories, eq(professionalCategories.category_id, serviceCategories.id))
        .where(eq(professionalCategories.professional_id, p.id))
      return { ...p, serviceCategories: cats }
    }),
  )

  return NextResponse.json(profsWithCategories)
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const body = await req.json()
  const { name, categoryIds } = body

  if (!name) {
    return NextResponse.json({ message: "El nombre del profesional es obligatorio" }, { status: 400 })
  }

  const [professional] = await db.insert(professionals).values({
    tenant_id: tenantId,
    name,
    active: true,
  }).returning()

  if (categoryIds?.length > 0) {
    await db.insert(professionalCategories).values(
      categoryIds.map((categoryId: string) => ({
        professional_id: professional.id,
        category_id: categoryId,
      })),
    )
  }

  return NextResponse.json(professional)
}
```

- [ ] **Step 2: Migrar `professionals/[id]/route.ts`**

```ts
// packages/dashboard/src/app/api/professionals/[id]/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, professionals, professionalCategories } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const body = await req.json()
  const { id } = await params
  const { name, active, categoryIds } = body

  await db
    .update(professionals)
    .set({ name, active })
    .where(and(eq(professionals.id, id), eq(professionals.tenant_id, tenantId)))

  if (categoryIds !== undefined) {
    await db.delete(professionalCategories).where(eq(professionalCategories.professional_id, id))
    if (categoryIds.length > 0) {
      await db.insert(professionalCategories).values(
        categoryIds.map((categoryId: string) => ({
          professional_id: id,
          category_id: categoryId,
        })),
      )
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const { id } = await params

  await db.delete(professionals).where(and(eq(professionals.id, id), eq(professionals.tenant_id, tenantId)))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Migrar `workingHours/route.ts`**

```ts
// packages/dashboard/src/app/api/workingHours/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, professionals, workingHours } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const { searchParams } = new URL(req.url)
  const professionalId = searchParams.get("professionalId")

  let profId: string | undefined = professionalId ?? undefined

  if (!profId) {
    const professional = await db
      .select()
      .from(professionals)
      .where(eq(professionals.tenant_id, tenantId))
      .then(r => r[0])
    profId = professional?.id
  }

  const result = await db
    .select()
    .from(workingHours)
    .where(eq(workingHours.professional_id, profId!))

  return NextResponse.json({ workingHours: result })
}

export async function PUT(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const { professionalId, hours } = await req.json()
  const tenantId = await getTenantId(session)

  let profId: string | undefined = professionalId

  if (!profId) {
    const professional = await db
      .select()
      .from(professionals)
      .where(eq(professionals.tenant_id, tenantId))
      .then(r => r[0])
    profId = professional?.id
  }

  if (!profId) {
    return NextResponse.json({ message: "No se encontro el profesional" }, { status: 404 })
  }

  await db.delete(workingHours).where(eq(workingHours.professional_id, profId))

  if (hours.length > 0) {
    await db.insert(workingHours).values(
      hours.map((item: any) => ({ ...item, professional_id: profId })),
    )
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Migrar `blockedDates/route.ts`**

```ts
// packages/dashboard/src/app/api/blockedDates/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, blockedDates, professionals } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const { searchParams } = new URL(req.url)
  const professionalId = searchParams.get("professionalId")

  let profId: string | undefined = professionalId ?? undefined

  if (!profId) {
    const professional = await db
      .select()
      .from(professionals)
      .where(eq(professionals.tenant_id, tenantId))
      .then(r => r[0])
    profId = professional?.id
  }

  if (!profId) {
    return NextResponse.json({ message: "No se encontro el profesional" }, { status: 404 })
  }

  const result = await db.select().from(blockedDates).where(eq(blockedDates.professional_id, profId))
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const body = await req.json()
  const { date, reason, professionalId } = body

  if (!date) {
    return NextResponse.json({ message: "La fecha es obligatoria" }, { status: 400 })
  }

  const tenantId = await getTenantId(session)
  let profId: string | undefined = professionalId

  if (!profId) {
    const professional = await db
      .select()
      .from(professionals)
      .where(eq(professionals.tenant_id, tenantId))
      .then(r => r[0])
    profId = professional?.id
  }

  if (!profId) {
    return NextResponse.json({ message: "No se encontro el profesional" }, { status: 404 })
  }

  await db.insert(blockedDates).values({ professional_id: profId, date, reason })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Migrar `blockedDates/[id]/route.ts`**

```ts
// packages/dashboard/src/app/api/blockedDates/[id]/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, blockedDates, professionals } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)
  const { id } = await params

  const blocked = await db
    .select({ id: blockedDates.id, professional_id: blockedDates.professional_id })
    .from(blockedDates)
    .where(eq(blockedDates.id, id))
    .then(r => r[0])

  if (!blocked) {
    return NextResponse.json({ message: "El blockedDate no existe" }, { status: 404 })
  }

  const professional = await db
    .select({ tenant_id: professionals.tenant_id })
    .from(professionals)
    .where(eq(professionals.id, blocked.professional_id))
    .then(r => r[0])

  if (professional?.tenant_id !== tenantId) {
    return NextResponse.json({ message: "Este blockedDate no pertenece al usuario" }, { status: 404 })
  }

  await db.delete(blockedDates).where(eq(blockedDates.id, id))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Migrar `config-summary/route.ts`**

```ts
// packages/dashboard/src/app/api/config-summary/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, tenants, professionals, workingHours, blockedDates } from "@agenturn/db"
import { and, count, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const professional = await db
    .select()
    .from(professionals)
    .where(eq(professionals.tenant_id, tenantId))
    .then(r => r[0])

  const profId = professional?.id

  const [tenant, workingHoursDaysResult, activeProfessionalsResult, blockedDatesResult] = await Promise.all([
    db.select({ name: tenants.name, plan: tenants.plan }).from(tenants).where(eq(tenants.id, tenantId)).then(r => r[0]),
    profId
      ? db.select({ count: count() }).from(workingHours).where(eq(workingHours.professional_id, profId)).then(r => r[0]?.count ?? 0)
      : Promise.resolve(0),
    db.select({ count: count() }).from(professionals).where(and(eq(professionals.tenant_id, tenantId), eq(professionals.active, true))).then(r => r[0]?.count ?? 0),
    profId
      ? db.select({ count: count() }).from(blockedDates).where(eq(blockedDates.professional_id, profId)).then(r => r[0]?.count ?? 0)
      : Promise.resolve(0),
  ])

  return NextResponse.json({
    tenant: tenant ? { name: tenant.name, plan: tenant.plan } : null,
    workingHoursDays: workingHoursDaysResult,
    activeProfessionals: activeProfessionalsResult,
    blockedDates: blockedDatesResult,
  })
}
```

- [ ] **Step 7: Migrar `agenda/form-data/route.ts`**

```ts
// packages/dashboard/src/app/api/agenda/form-data/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, professionals, services, clients, professionalCategories, serviceCategories } from "@agenturn/db"
import { desc, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const [profs, servicesResult, clientsResult] = await Promise.all([
    db.select().from(professionals).where(eq(professionals.tenant_id, tenantId)),
    db.select().from(services).where(eq(services.tenant_id, tenantId)),
    db.select().from(clients).where(eq(clients.tenant_id, tenantId)).orderBy(desc(clients.created_at)),
  ])

  const profsWithCategories = await Promise.all(
    profs.map(async (p) => {
      const cats = await db
        .select({ id: serviceCategories.id, name: serviceCategories.name })
        .from(professionalCategories)
        .innerJoin(serviceCategories, eq(professionalCategories.category_id, serviceCategories.id))
        .where(eq(professionalCategories.professional_id, p.id))
      return { ...p, serviceCategories: cats }
    }),
  )

  return NextResponse.json({ professionals: profsWithCategories, services: servicesResult, clients: clientsResult })
}
```

- [ ] **Step 8: Verificar que compila todo el dashboard**

```bash
cd "packages/dashboard" && npx tsc --noEmit --skipLibCheck 2>&1 | head -50
```

Esperado: 0 errores.

---

## Task 10: Migrar `metrics/route.ts`

**Files:**
- Modify: `packages/dashboard/src/app/api/metrics/route.ts`

> **Concepto clave — SQL crudo en Drizzle:** Para `COUNT(DISTINCT col)`, `SUM()` con joins, y `GROUP BY`, Drizzle tiene `sql` template literal y helpers `count()`, `sum()`. La sintaxis es: `` sql`COUNT(DISTINCT ${appointments.client_id})` ``. Para queries de agregación con grupos, se usa `.groupBy(col)` en el query builder.

- [ ] **Step 1: Reemplazar `metrics/route.ts`**

```ts
// packages/dashboard/src/app/api/metrics/route.ts
import { getSessionOrUnauthorized, getTenantId } from "@/lib/session"
import { db, appointments, services } from "@agenturn/db"
import { and, count, eq, gte, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized()
  if (error) return error

  const tenantId = await getTenantId(session)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [monthTotal, cancelledMonth, uniqueClientsResult, revenueResult, topServicesResult] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(appointments)
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "confirmed"), gte(appointments.datetime, startOfMonth)))
        .then(r => r[0]?.count ?? 0),

      db
        .select({ count: count() })
        .from(appointments)
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "cancelled"), gte(appointments.datetime, startOfMonth)))
        .then(r => r[0]?.count ?? 0),

      db
        .select({ count: sql<number>`COUNT(DISTINCT ${appointments.client_id})` })
        .from(appointments)
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "confirmed"), gte(appointments.datetime, startOfMonth)))
        .then(r => r[0]?.count ?? 0),

      db
        .select({ total: sql<number>`SUM(${services.price})` })
        .from(appointments)
        .leftJoin(services, eq(appointments.service_id, services.id))
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "confirmed"), gte(appointments.datetime, startOfMonth)))
        .then(r => +(r[0]?.total ?? 0)),

      db
        .select({
          service_id: appointments.service_id,
          name: services.name,
          count: sql<number>`COUNT(${appointments.id})`,
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.service_id, services.id))
        .where(and(eq(appointments.tenant_id, tenantId), eq(appointments.status, "confirmed"), gte(appointments.datetime, startOfMonth)))
        .groupBy(appointments.service_id, services.name)
        .orderBy(sql`COUNT(${appointments.id}) DESC`)
        .limit(5),
    ])

  return NextResponse.json({
    monthTotal,
    cancelledMonth,
    uniqueClients: uniqueClientsResult,
    revenue: revenueResult,
    topServices: topServicesResult.map(r => ({ name: r.name, count: +r.count })),
  })
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd "packages/dashboard" && npx tsc --noEmit --skipLibCheck 2>&1 | grep "metrics" | head -10
```

- [ ] **Step 3: Desinstalar pg del dashboard**

```bash
npm uninstall pg pg-hstore --workspace=packages/dashboard
```

- [ ] **Step 4: Commit del dashboard**

```bash
git add packages/dashboard/
git commit -m "feat(dashboard): migrate all API routes from Sequelize to Drizzle ORM"
```

- [ ] **Step 5: Mergear a feat/migrate-drizzle y crear subbrama bot**

```bash
git checkout feat/migrate-drizzle
git merge feat/migrate-drizzle/dashboard
git checkout -b feat/migrate-drizzle/bot
```

---

## Task 11: Migrar el bot — tipos y state machine

**Files:**
- Modify: `packages/bot/src/state-machine.ts`
- Modify: `packages/bot/src/client-lookup.ts`
- Modify: `packages/bot/src/router.ts`
- Modify: `packages/bot/src/ttl-cleanup.ts`
- Modify: `packages/bot/src/push/push.ts`

> **Concepto clave para el bot:** En Sequelize el bot usaba instancias de clase (`ConversationState`, `Tenant`, `Client`) con métodos como `conv.update({})` y `tenant.phone_number_id`. En Drizzle ya no hay clases ni instancias — las filas son objetos TypeScript planos. Esto significa: no más `conv.update()`, sino `await db.update(conversationStates).set({...}).where(eq(...))`. Los tipos pasan de `InstanceType<typeof ConversationState>` a tipos inferidos del schema Drizzle o interfaces propias.

> **Cómo tipar filas Drizzle:** Se usa el helper `InferSelectModel<typeof tabla>` (de `drizzle-orm`). Por ejemplo: `type ConversationRow = InferSelectModel<typeof conversationStates>`.

- [ ] **Step 1: Reemplazar `state-machine.ts`**

```ts
// packages/bot/src/state-machine.ts
import { db, conversationStates, tenants, clients } from "@agenturn/db"
import type { InferSelectModel } from "drizzle-orm"

export type ConvRow = InferSelectModel<typeof conversationStates>
export type TenantRow = InferSelectModel<typeof tenants>
export type ClientRow = InferSelectModel<typeof clients>

import { handleGreeting } from "./states/greeting"
import { handleSelectCategory } from "./states/select-category"
import { handleSelectService } from "./states/select-service"
import { handleSelectProfessional } from "./states/select-professional"
import { handleSelectDate } from "./states/select-date"
import { handleSelectTime } from "./states/select-time"
import { handleConfirm } from "./states/confirm"
import { handleConfirmed } from "./states/confirmed"
import { handleCancelSelect } from "./states/cancel-select"
import { handleCancelConfirm } from "./states/cancel-confirm"
import { handleHumanHandoff } from "./states/human-handoff"
import { handleWaitlist } from "./states/waitlist"
import { eq } from "drizzle-orm"

export async function dispatchState(
  conv: ConvRow,
  tenant: TenantRow,
  client: ClientRow,
  body: string,
): Promise<void> {
  await db.update(conversationStates).set({ updated_at: new Date() }).where(eq(conversationStates.id, conv.id))

  switch (conv.state) {
    case "greeting":            return handleGreeting(conv, tenant, client, body)
    case "select_category":     return handleSelectCategory(conv, tenant, client, body)
    case "select_service":      return handleSelectService(conv, tenant, client, body)
    case "select_professional": return handleSelectProfessional(conv, tenant, client, body)
    case "select_date":         return handleSelectDate(conv, tenant, client, body)
    case "select_time":         return handleSelectTime(conv, tenant, client, body)
    case "confirm":             return handleConfirm(conv, tenant, client, body)
    case "confirmed":           return handleConfirmed(conv, tenant, client, body)
    case "cancel_select":       return handleCancelSelect(conv, tenant, client, body)
    case "cancel_confirm":      return handleCancelConfirm(conv, tenant, client, body)
    case "human_handoff":       return handleHumanHandoff(conv, tenant, client, body)
    case "waitlist":            return handleWaitlist(conv, tenant, client, body)
    default:
      await db.update(conversationStates).set({ state: "greeting", temp_data: {} }).where(eq(conversationStates.id, conv.id))
      const refreshed = { ...conv, state: "greeting" as const, temp_data: {} }
      return handleGreeting(refreshed, tenant, client, body)
  }
}
```

- [ ] **Step 2: Reemplazar `client-lookup.ts`**

```ts
// packages/bot/src/client-lookup.ts
import { db, clients } from "@agenturn/db"
import { and, eq } from "drizzle-orm"

export async function findOrCreateClient(
  tenantId: string,
  whatsappNumber: string,
  contactName?: string,
) {
  if (!whatsappNumber) throw new Error("El numero de wpp es requerido")

  const existing = await db
    .select()
    .from(clients)
    .where(and(eq(clients.tenant_id, tenantId), eq(clients.whatsapp_number, whatsappNumber)))
    .then(r => r[0])

  if (existing) return existing

  const [created] = await db.insert(clients).values({
    tenant_id: tenantId,
    name: contactName ?? `Cliente ${whatsappNumber.slice(-4)}`,
    whatsapp_number: whatsappNumber,
  }).returning()

  return created
}
```

- [ ] **Step 3: Reemplazar `router.ts`**

```ts
// packages/bot/src/router.ts
import { db, tenants, conversationStates } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { findOrCreateClient } from "./client-lookup"
import { dispatchState } from "./state-machine"

const RESET_KEYWORDS = ["salir", "menu", "menú", "turno"]

export async function routeMessage(
  from: string,
  to: string,
  body: string,
  contactName?: string,
) {
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.whatsapp_number, to))
    .then(r => r[0])

  if (!tenant) return

  const client = await findOrCreateClient(tenant.id, from, contactName)

  let conv = await db
    .select()
    .from(conversationStates)
    .where(and(eq(conversationStates.client_whatsapp, from), eq(conversationStates.tenant_id, tenant.id)))
    .then(r => r[0])

  if (!conv) {
    const [created] = await db.insert(conversationStates).values({
      tenant_id: tenant.id,
      client_whatsapp: from,
      state: "greeting",
      temp_data: {},
    }).returning()
    conv = created
  }

  if (body.toLowerCase().trim() === "cancelar turno") {
    await db.update(conversationStates).set({ state: "cancel_select" }).where(eq(conversationStates.id, conv.id))
    conv = { ...conv, state: "cancel_select" }
  } else if (
    body === "back_to_menu" ||
    (RESET_KEYWORDS.some((kw) => body.toLowerCase().trim().includes(kw)) && conv.state !== "greeting")
  ) {
    await db.update(conversationStates).set({ state: "greeting", temp_data: {} }).where(eq(conversationStates.id, conv.id))
    conv = { ...conv, state: "greeting", temp_data: {} }
  }

  await dispatchState(conv, tenant, client, body)
}
```

- [ ] **Step 4: Reemplazar `ttl-cleanup.ts`**

```ts
// packages/bot/src/ttl-cleanup.ts
import { db, conversationStates } from "@agenturn/db"
import { lt } from "drizzle-orm"

const TTL_MINUTES = 30

export async function cleanStaleConversations(): Promise<void> {
  const cutoff = new Date(Date.now() - TTL_MINUTES * 60 * 1000)
  const deleted = await db
    .delete(conversationStates)
    .where(lt(conversationStates.updated_at, cutoff))
    .returning()
  if (deleted.length > 0) console.log(`TTL cleanup: ${deleted.length} conversaciones eliminadas`)
}

export function startTTLCleanup(): void {
  setInterval(() => {
    cleanStaleConversations().catch(console.error)
  }, 5 * 60 * 1000)
}
```

- [ ] **Step 5: Reemplazar `push/push.ts`**

```ts
// packages/bot/src/push/push.ts
import { db, pushSubscriptions } from "@agenturn/db"
import { eq } from "drizzle-orm"
import webpush from "web-push"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushToTenant(tenantId: string, title: string, body: string) {
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.tenant_id, tenantId))
  if (subs.length === 0) return

  await Promise.all(
    subs.map(async (p) => {
      try {
        await webpush.sendNotification(
          { endpoint: p.endpoint!, keys: p.keys },
          JSON.stringify({ title, body }),
        )
      } catch (err: any) {
        if (err.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, p.id))
        }
        console.error(`[Push] Error enviado a ${p.endpoint}: `, err.message)
      }
    }),
  )
}
```

---

## Task 12: Migrar los states del bot

**Files:**
- Modify: `packages/bot/src/states/greeting.ts`
- Modify: `packages/bot/src/states/select-category.ts`
- Modify: `packages/bot/src/states/select-service.ts`
- Modify: `packages/bot/src/states/select-professional.ts`
- Modify: `packages/bot/src/states/select-date.ts`
- Modify: `packages/bot/src/states/select-time.ts`
- Modify: `packages/bot/src/states/confirm.ts`
- Modify: `packages/bot/src/states/confirmed.ts`
- Modify: `packages/bot/src/states/cancel-select.ts`
- Modify: `packages/bot/src/states/cancel-confirm.ts`
- Modify: `packages/bot/src/states/human-handoff.ts`
- Modify: `packages/bot/src/states/waitlist.ts`

> **Patrón para actualizar el estado de conversación en los states:** Ya que `conv` es un objeto plano (no instancia), no tiene `.update()`. Hay dos cosas que hacer: (1) actualizar la DB con `db.update(conversationStates).set({...}).where(eq(conversationStates.id, conv.id))`, y (2) si el state handler inmediatamente llama al próximo handler con la misma `conv`, necesitás pasar una copia actualizada: `const updated = { ...conv, state: "nuevo_state", temp_data: {...} }`.

- [ ] **Step 1: Reemplazar `states/greeting.ts`**

```ts
// packages/bot/src/states/greeting.ts
import { db, conversationStates } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { sendButtonMessage } from "../whatsapp/whatsapp"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleGreeting(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  if (body === "book") {
    await db.update(conversationStates).set({ state: "select_category" }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "select_category" as const }
    const { handleSelectCategory } = await import("./select-category")
    return handleSelectCategory(updated, tenant, client, body)
  }
  if (body === "cancel_appt") {
    await db.update(conversationStates).set({ state: "cancel_select" }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "cancel_select" as const }
    const { handleCancelSelect } = await import("./cancel-select")
    return handleCancelSelect(updated, tenant, client, body)
  }
  if (body === "human") {
    await db.update(conversationStates).set({ state: "human_handoff" }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "human_handoff" as const }
    const { handleHumanHandoff } = await import("./human-handoff")
    return handleHumanHandoff(updated, tenant, client, body)
  }

  await sendButtonMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    `¡Hola! 👋 Soy el asistente de *${tenant.name}*. ¿Qué querés hacer?`,
    [
      { id: "book", title: "📅 Sacar turno" },
      { id: "cancel_appt", title: "❌ Cancelar turno" },
      { id: "human", title: "💬 Hablar con alguien" },
    ],
  )
}
```

- [ ] **Step 2: Reemplazar `states/select-category.ts`**

```ts
// packages/bot/src/states/select-category.ts
import { db, conversationStates, serviceCategories } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { sendListMessage } from "../whatsapp/whatsapp"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleSelectCategory(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  const categories = await db.select().from(serviceCategories).where(eq(serviceCategories.tenant_id, tenant.id))

  if (categories.length === 0) {
    await db.update(conversationStates).set({ state: "select_service" }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "select_service" as const }
    const { handleSelectService } = await import("./select-service")
    return handleSelectService(updated, tenant, client, body)
  }

  const selected = categories.find((s) => s.id === body)

  if (selected) {
    const newTempData = { ...(conv.temp_data as Record<string, unknown>), category_id: selected.id }
    await db.update(conversationStates).set({ state: "select_service", temp_data: newTempData }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "select_service" as const, temp_data: newTempData }
    const { handleSelectService } = await import("./select-service")
    return handleSelectService(updated, tenant, client, body)
  }

  await sendListMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    "¿Qué tipo de servicio estás buscando?",
    "Ver opciones",
    [
      ...categories.slice(0, 9).map((c) => ({ id: c.id, title: c.name! })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  )
}
```

- [ ] **Step 3: Reemplazar `states/select-service.ts`**

```ts
// packages/bot/src/states/select-service.ts
import { db, conversationStates, services } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { sendListMessage } from "../whatsapp/whatsapp"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleSelectService(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  const tempData = conv.temp_data as Record<string, unknown>
  const categoryId = tempData?.category_id as string | undefined

  const whereClause = categoryId
    ? and(eq(services.tenant_id, tenant.id), eq(services.active, true), eq(services.category_id, categoryId))
    : and(eq(services.tenant_id, tenant.id), eq(services.active, true))

  const serviceList = await db.select().from(services).where(whereClause)

  const selected = serviceList.find((s) => s.id === body)

  if (selected) {
    const newTempData = {
      ...tempData,
      service_id: selected.id,
      service_name: selected.name,
      service_duration: selected.duration_minutes,
    }
    await db.update(conversationStates).set({ state: "select_professional", temp_data: newTempData }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "select_professional" as const, temp_data: newTempData }
    const { handleSelectProfessional } = await import("./select-professional")
    return handleSelectProfessional(updated, tenant, client, body)
  }

  await sendListMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    "¿Qué servicio querés reservar?",
    "Ver servicios",
    [
      ...serviceList.slice(0, 9).map((s) => ({
        id: s.id,
        title: s.name!,
        description: `${s.duration_minutes} min - $${s.price}`,
      })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  )
}
```

- [ ] **Step 4: Reemplazar `states/select-professional.ts`**

```ts
// packages/bot/src/states/select-professional.ts
import { db, conversationStates, professionals, serviceCategories, professionalCategories } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { sendListMessage, sendTextMessage } from "../whatsapp/whatsapp"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleSelectProfessional(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string): Promise<void> {
  const tempData = conv.temp_data as Record<string, unknown>
  const categoryId = tempData?.category_id as string | undefined

  let profList: typeof professionals.$inferSelect[]
  if (categoryId) {
    const rows = await db
      .select({ id: professionals.id, name: professionals.name, tenant_id: professionals.tenant_id, active: professionals.active })
      .from(professionals)
      .innerJoin(professionalCategories, eq(professionalCategories.professional_id, professionals.id))
      .where(and(eq(professionals.active, true), eq(professionalCategories.category_id, categoryId)))
    profList = rows
  } else {
    profList = await db.select().from(professionals).where(and(eq(professionals.tenant_id, tenant.id), eq(professionals.active, true)))
  }

  if (profList.length === 0) {
    await sendTextMessage(
      tenant.phone_number_id!,
      conv.client_whatsapp!,
      "No hay profesionales disponibles en este momento. Volvé a intentar más tarde.\n\nEscribí *turno* para volver al menú.",
    )
    await db.update(conversationStates).set({ state: "greeting", temp_data: {} }).where(eq(conversationStates.id, conv.id))
    return
  }

  const selected = profList.find((s) => s.id === body)

  const goToDate = async (profId: string, profName: string) => {
    const newTempData = { ...tempData, professional_id: profId, professional_name: profName }
    await db.update(conversationStates).set({ state: "select_date", temp_data: newTempData }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "select_date" as const, temp_data: newTempData }
    const { handleSelectDate } = await import("./select-date")
    return handleSelectDate(updated, tenant, client, body)
  }

  if (profList.length === 1) return goToDate(profList[0].id, profList[0].name!)
  if (selected) return goToDate(selected.id, selected.name!)

  await sendListMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    "¿Con quién querés atenderte?",
    "Ver profesionales",
    [
      ...profList.slice(0, 9).map((p) => ({ id: p.id, title: p.name! })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  )
}
```

- [ ] **Step 5: Reemplazar `states/select-date.ts`**

```ts
// packages/bot/src/states/select-date.ts
import { db, conversationStates, workingHours, blockedDates, appointments, services, getAvailableSlots } from "@agenturn/db"
import { and, between, eq } from "drizzle-orm"
import { sendListMessage, sendTextMessage } from "../whatsapp/whatsapp"
import { todayAR, nowAR, getHoursAR, getMinutesAR } from "../utils/date"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

function formatDateAR(dateStr: string): string {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const date = new Date(`${dateStr}T12:00:00`)
  const [, m, d] = dateStr.split("-")
  return `${days[date.getDay()]} ${d}/${m}`
}

export async function getSlotsForDate(
  professionalId: string,
  date: string,
  serviceDuration: number,
  slotInterval: number,
) {
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay()

  const wh = await db
    .select()
    .from(workingHours)
    .where(and(eq(workingHours.professional_id, professionalId), eq(workingHours.day_of_week, dayOfWeek)))
    .then(r => r[0])
  if (!wh) return []

  const blocked = await db
    .select()
    .from(blockedDates)
    .where(and(eq(blockedDates.professional_id, professionalId), eq(blockedDates.date, date)))
    .then(r => r[0])
  if (blocked) return []

  const dateStart = new Date(`${date}T00:00:00`)
  const dateEnd = new Date(`${date}T23:59:59`)

  const dayAppointmentsRaw = await db
    .select({
      datetime: appointments.datetime,
      duration_minutes: services.duration_minutes,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.service_id, services.id))
    .where(
      and(
        eq(appointments.professional_id, professionalId),
        eq(appointments.status, "confirmed"),
        between(appointments.datetime, dateStart, dateEnd),
      ),
    )

  const dayAppointments = dayAppointmentsRaw.map((a) => {
    const dt = new Date(a.datetime!)
    return {
      startHour: getHoursAR(dt),
      startMinute: getMinutesAR(dt),
      duration_minutes: a.duration_minutes ?? 0,
    }
  })

  const slots = getAvailableSlots(
    { start_time: wh.start_time!, end_time: wh.end_time! },
    dayAppointments,
    serviceDuration,
    slotInterval,
  )

  if (date === todayAR()) {
    const now = nowAR()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    return slots.filter((s) => {
      const [h, m] = s.start.split(":").map(Number)
      return h * 60 + m > nowMinutes
    })
  }

  return slots
}

async function getAvailableDays(professionalId: string, serviceDuration: number, slotInterval: number): Promise<string[]> {
  const available: string[] = []
  const todayStr = todayAR()
  const [y, m, d2] = todayStr.split("-").map(Number)

  for (let i = 1; i <= 14; i++) {
    const d = new Date(y, m - 1, d2 + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const slots = await getSlotsForDate(professionalId, dateStr, serviceDuration, slotInterval)
    if (slots.length > 0) available.push(dateStr)
  }

  return available
}

export async function handleSelectDate(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  const tempData = conv.temp_data as Record<string, unknown>
  const { professional_id, service_duration } = tempData as { professional_id: string; service_duration: number }

  if (body && body.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const slots = await getSlotsForDate(professional_id, body, service_duration, tenant.slot_interval_minutes!)

    if (slots.length > 0) {
      const newTempData = { ...tempData, selected_date: body }
      await db.update(conversationStates).set({ state: "select_time", temp_data: newTempData }).where(eq(conversationStates.id, conv.id))
      const updated = { ...conv, state: "select_time" as const, temp_data: newTempData }
      const { handleSelectTime } = await import("./select-time")
      return handleSelectTime(updated, tenant, client, body)
    }

    await sendTextMessage(tenant.phone_number_id!, conv.client_whatsapp!, "Ese día no tengo lugar disponible. Acá te muestro los días que sí tienen:")
  }

  const availableDays = await getAvailableDays(professional_id, service_duration, tenant.slot_interval_minutes!)

  if (availableDays.length === 0) {
    await db.update(conversationStates).set({ state: "waitlist", temp_data: tempData }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "waitlist" as const }
    const { handleWaitlist } = await import("./waitlist")
    return handleWaitlist(updated, tenant, client, body)
  }

  await sendListMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    "¿Qué día preferís?",
    "Ver días",
    [
      ...availableDays.slice(0, 9).map((d) => ({ id: d, title: formatDateAR(d) })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  )
}
```

- [ ] **Step 6: Reemplazar `states/select-time.ts`**

```ts
// packages/bot/src/states/select-time.ts
import { db, conversationStates } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { sendListMessage } from "../whatsapp/whatsapp"
import { getSlotsForDate } from "./select-date"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleSelectTime(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  const tempData = conv.temp_data as Record<string, unknown>
  const { professional_id, service_duration, selected_date } = tempData as {
    professional_id: string
    service_duration: number
    selected_date: string
  }

  const slots = await getSlotsForDate(professional_id, selected_date, service_duration, tenant.slot_interval_minutes!)
  const selected = slots.find((s) => s.start === body)

  if (selected) {
    const newTempData = { ...tempData, selected_time: selected.start }
    await db.update(conversationStates).set({ state: "confirm", temp_data: newTempData }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "confirm" as const, temp_data: newTempData }
    const { handleConfirm } = await import("./confirm")
    return handleConfirm(updated, tenant, client, body)
  }

  await sendListMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    `¿A qué hora? (${selected_date})`,
    "Ver horarios",
    [
      ...slots.slice(0, 9).map((s) => ({ id: s.start, title: s.start, description: `Termina ${s.end}` })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  )
}
```

- [ ] **Step 7: Reemplazar `states/confirm.ts`**

```ts
// packages/bot/src/states/confirm.ts
import { db, conversationStates } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { sendButtonMessage } from "../whatsapp/whatsapp"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleConfirm(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  const tempData = conv.temp_data as Record<string, string>
  const { service_name, professional_name, selected_date, selected_time, service_duration } = tempData

  if (body === "confirm_yes") {
    await db.update(conversationStates).set({ state: "confirmed" }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "confirmed" as const }
    const { handleConfirmed } = await import("./confirmed")
    return handleConfirmed(updated, tenant, client, body)
  }
  if (body === "confirm_change") {
    await db.update(conversationStates).set({ state: "select_service", temp_data: {} }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "select_service" as const, temp_data: {} }
    const { handleSelectService } = await import("./select-service")
    return handleSelectService(updated, tenant, client, body)
  }

  await sendButtonMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    `*Resumen de tu turno:*\n📋 Servicio: ${service_name}\n👩 Profesional: ${professional_name}\n📅 Fecha: ${selected_date}\n⏰ Hora: ${selected_time} (${service_duration} min)\n\n¿Confirmás?`,
    [
      { id: "confirm_yes", title: "✅ Sí, confirmar" },
      { id: "confirm_change", title: "✏️ Cambiar algo" },
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  )
}
```

- [ ] **Step 8: Reemplazar `states/confirmed.ts`**

```ts
// packages/bot/src/states/confirmed.ts
import { db, conversationStates, appointments, notifications } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { sendTextMessage } from "../whatsapp/whatsapp"
import { getSlotsForDate } from "./select-date"
import { sendPushToTenant } from "../push/push"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleConfirmed(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string): Promise<void> {
  const tempData = conv.temp_data as Record<string, string>
  const { professional_id, service_id, selected_date, selected_time, service_name, service_duration } = tempData

  const slots = await getSlotsForDate(professional_id, selected_date, Number(service_duration), tenant.slot_interval_minutes!)
  const stillAvailable = slots.some((s) => s.start === selected_time)

  if (!stillAvailable) {
    await sendTextMessage(tenant.phone_number_id!, conv.client_whatsapp!, "😕 Ese horario se acaba de ocupar. Te muestro los que quedan:")
    const newTempData = { ...tempData, selected_time: undefined }
    await db.update(conversationStates).set({ state: "select_time", temp_data: newTempData }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "select_time" as const, temp_data: newTempData }
    const { handleSelectTime } = await import("./select-time")
    return handleSelectTime(updated, tenant, client, "")
  }

  await db.insert(appointments).values({
    tenant_id: tenant.id,
    professional_id,
    service_id,
    client_id: client.id,
    datetime: new Date(`${selected_date}T${selected_time}:00`),
    status: "confirmed",
  })

  await db.insert(notifications).values({
    tenant_id: tenant.id,
    type: "new_appointment",
    title: "Nuevo turno",
    body: `${client.name} saco turno para ${service_name} a las ${selected_time}`,
  })

  await sendPushToTenant(tenant.id, "Nuevo turno", `${client.name} sacó turno para ${service_name} a las ${selected_time}`)

  await sendTextMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    `✅ *¡Turno confirmado!*\n\nTe esperamos el ${selected_date} a las ${selected_time} hs.\n\nSi necesitás cancelar, escribí "cancelar turno".`,
  )

  await db.update(conversationStates).set({ state: "greeting", temp_data: {} }).where(eq(conversationStates.id, conv.id))
}
```

- [ ] **Step 9: Reemplazar `states/cancel-select.ts`**

```ts
// packages/bot/src/states/cancel-select.ts
import { db, conversationStates, appointments, services } from "@agenturn/db"
import { and, eq, gte } from "drizzle-orm"
import { sendListMessage, sendTextMessage } from "../whatsapp/whatsapp"
import { nowAR, formatDateTimeAR } from "../utils/date"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleCancelSelect(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  const turns = await db
    .select({
      id: appointments.id,
      datetime: appointments.datetime,
      service_name: services.name,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.service_id, services.id))
    .where(
      and(
        eq(appointments.tenant_id, tenant.id),
        eq(appointments.client_id, client.id),
        eq(appointments.status, "confirmed"),
        gte(appointments.datetime, nowAR()),
      ),
    )
    .orderBy(appointments.datetime)

  const selected = turns.find((s) => s.id === body)

  if (turns.length === 0) {
    await sendTextMessage(tenant.phone_number_id!, conv.client_whatsapp!, "No tenés turnos próximos para cancelar.")
    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id))
    return
  }

  if (selected) {
    const newTempData = { appointment_id: selected.id }
    await db.update(conversationStates).set({ state: "cancel_confirm", temp_data: newTempData }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "cancel_confirm" as const, temp_data: newTempData }
    const { handleCancelConfirm } = await import("./cancel-confirm")
    return handleCancelConfirm(updated, tenant, client, body)
  }

  await sendListMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    "¿Cuál turno querés cancelar?",
    "Ver turnos",
    [
      ...turns.slice(0, 9).map((t) => ({
        id: t.id,
        title: t.service_name ?? "Turno",
        description: formatDateTimeAR(new Date(t.datetime!)),
      })),
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  )
}
```

- [ ] **Step 10: Reemplazar `states/cancel-confirm.ts`**

```ts
// packages/bot/src/states/cancel-confirm.ts
import { db, conversationStates, appointments, notifications } from "@agenturn/db"
import { and, eq } from "drizzle-orm"
import { sendButtonMessage, sendTextMessage } from "../whatsapp/whatsapp"
import { sendPushToTenant } from "../push/push"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleCancelConfirm(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  const { appointment_id } = conv.temp_data as { appointment_id: string }

  if (body === "yes") {
    await db
      .update(appointments)
      .set({ status: "cancelled" })
      .where(and(eq(appointments.id, appointment_id), eq(appointments.client_id, client.id)))

    await db.insert(notifications).values({
      type: "cancelled_appointment",
      title: "Turno cancelado",
      body: `${client.name} cancelo su turno`,
      tenant_id: tenant.id,
    })

    await sendPushToTenant(tenant.id, "Turno cancelado", `${client.name} canceló su turno`)
    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id))
    await sendTextMessage(tenant.phone_number_id!, conv.client_whatsapp!, "✅ Turno cancelado. ¡Hasta la próxima!")
    return
  }

  if (body === "no") {
    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id))
    await sendTextMessage(tenant.phone_number_id!, conv.client_whatsapp!, "Perfecto, el turno sigue en pie. 👍")
    return
  }

  await sendButtonMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    "¿Confirmás la cancelación del turno?",
    [
      { id: "yes", title: "✅ Sí, cancelar" },
      { id: "no", title: "↩️ No, mantener" },
      { id: "back_to_menu", title: "← Volver al menú" },
    ],
  )
}
```

- [ ] **Step 11: Reemplazar `states/human-handoff.ts`**

```ts
// packages/bot/src/states/human-handoff.ts
import { db, conversationStates, notifications } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { sendTextMessage } from "../whatsapp/whatsapp"
import { sendPushToTenant } from "../push/push"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleHumanHandoff(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  if (body.toLowerCase().includes("turno")) {
    await db.update(conversationStates).set({ state: "select_service" }).where(eq(conversationStates.id, conv.id))
    const updated = { ...conv, state: "select_service" as const }
    const { handleSelectService } = await import("./select-service")
    return handleSelectService(updated, tenant, client, body)
  }

  const tempData = conv.temp_data as Record<string, unknown>
  if (Object.keys(tempData).length === 0) {
    await db.insert(notifications).values({
      type: "human_handoff",
      title: "Solicitud de atencion",
      body: `${client.name} quiere hablar con alguien`,
      tenant_id: tenant.id,
    })

    await sendPushToTenant(tenant.id, "Atención requerida", `${client.name} quiere hablar con alguien`)
    await sendTextMessage(
      tenant.phone_number_id!,
      conv.client_whatsapp!,
      `Un momento, le avisamos a *${tenant.name}* que querés hablar. Te responderán a la brevedad.\n\nCuando quieras sacar un turno, escribí "quiero turno".`,
    )
    await db.update(conversationStates).set({ temp_data: { notified: true } }).where(eq(conversationStates.id, conv.id))
  }
}
```

- [ ] **Step 12: Reemplazar `states/waitlist.ts`**

```ts
// packages/bot/src/states/waitlist.ts
import { db, conversationStates, waitlist } from "@agenturn/db"
import { eq } from "drizzle-orm"
import { sendButtonMessage, sendTextMessage } from "../whatsapp/whatsapp"
import type { ConvRow, TenantRow, ClientRow } from "../state-machine"

export async function handleWaitlist(conv: ConvRow, tenant: TenantRow, client: ClientRow, body: string) {
  const { service_id } = conv.temp_data as { service_id: string }

  if (body === "waitlist_yes") {
    await db.insert(waitlist).values({ tenant_id: tenant.id, client_id: client.id, service_id })
    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id))
    await sendTextMessage(tenant.phone_number_id!, conv.client_whatsapp!, "✅ Te anotamos en la lista de espera. Te avisamos cuando haya un lugar disponible.")
    return
  }

  if (body === "waitlist_no") {
    await sendTextMessage(tenant.phone_number_id!, conv.client_whatsapp!, "Entendido. Escribinos cuando quieras para consultar disponibilidad. 👋")
    await db.update(conversationStates).set({ state: "greeting" }).where(eq(conversationStates.id, conv.id))
    return
  }

  await sendButtonMessage(
    tenant.phone_number_id!,
    conv.client_whatsapp!,
    "Por el momento no hay turnos disponibles en los próximos 14 días. ¿Querés que te avisemos cuando haya lugar?",
    [
      { id: "waitlist_yes", title: "✅ Sí, avisarme" },
      { id: "waitlist_no", title: "❌ No, gracias" },
    ],
  )
}
```

---

## Task 13: Verificar, commit y merge final

**Files:** N/A

- [ ] **Step 1: Verificar que el bot compila sin errores**

```bash
cd "packages/bot" && npx tsc --noEmit --skipLibCheck 2>&1 | head -50
```

Esperado: 0 errores.

- [ ] **Step 2: Verificar que los tests existentes siguen pasando**

```bash
npm run test --workspace=packages/db
npm run test --workspace=packages/bot
```

- [ ] **Step 3: Commit del bot**

```bash
git add packages/bot/
git commit -m "feat(bot): migrate all state machine files from Sequelize to Drizzle ORM"
```

- [ ] **Step 4: Mergear subbrama bot a feat/migrate-drizzle**

```bash
git checkout feat/migrate-drizzle
git merge feat/migrate-drizzle/bot
```

- [ ] **Step 5: Verificar build completo del monorepo**

```bash
npm run build --workspace=packages/db
cd "packages/dashboard" && npx tsc --noEmit --skipLibCheck 2>&1 | head -20
cd "packages/bot" && npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

- [ ] **Step 6: Mergear a main**

```bash
git checkout main
git merge feat/migrate-drizzle
```

Vercel y Railway redeplegan automáticamente al detectar el push a main.

---

## Self-Review

### Spec coverage
- ✅ Instalar `drizzle-orm` + `@neondatabase/serverless`, desinstalar `sequelize`/`pg` — Task 2
- ✅ `schema.ts` con todas las tablas — Task 3
- ✅ `db.ts` con cliente Drizzle — Task 4
- ✅ `index.ts` actualizado — Task 5
- ✅ `src/models/` borrado — Task 5
- ✅ `auth.ts` migrado de `Pool` a Drizzle — Task 6
- ✅ 21 routes del dashboard migradas — Tasks 7–10
- ✅ 17 archivos del bot migrados — Tasks 11–12
- ✅ Orden de ramas: db → dashboard → bot → main — Tasks 1, 6 Step 1, 10 Step 5, 13 Step 6
- ✅ `scheduling.ts` no se toca — no aparece en ningún task de modificación
- ✅ Tests no se tocan — Task 13 Step 2 solo los corre para verificar

### Sin placeholders verificado ✅
### Tipos consistentes: `ConvRow`, `TenantRow`, `ClientRow` definidos en `state-machine.ts` y reutilizados en todos los states ✅
