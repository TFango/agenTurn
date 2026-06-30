# Migración de Sequelize a Drizzle ORM

## Problema raíz

El dashboard (Next.js 16 en Vercel) usa `@agenturn/db` que internamente usa Sequelize. Sequelize llama `require('pg')` dinámicamente al cargar el módulo. Turbopack (bundler por defecto en Next.js 16) bundlea esto y no puede resolver `pg` en el contexto serverless de Vercel, causando:

```
Error: Please install pg package manually
```

Este error aparece en cualquier route que importe `@agenturn/db`, bloqueando el login y todas las APIs del dashboard.

## Solución elegida

Reemplazar Sequelize por **Drizzle ORM** + **`@neondatabase/serverless`** en todo el monorepo.

- **Drizzle** — ORM moderno, liviano, con queries type-safe en TypeScript
- **`@neondatabase/serverless`** — driver HTTP para NeonDB, sin dependencia de `pg`, compatible con entornos serverless

`@agenturn/db` se mantiene como paquete compartido en el monorepo, pero ahora exporta el schema Drizzle y el cliente en vez de modelos Sequelize.

## Arquitectura resultante

```
packages/
├── db/
│   ├── src/
│   │   ├── schema.ts      ← tablas definidas con Drizzle (reemplaza src/models/)
│   │   ├── db.ts          ← cliente Drizzle + NeonDB (reemplaza connection.ts)
│   │   ├── scheduling.ts  ← sin cambios (función pura)
│   │   └── index.ts       ← exporta db, schema, getAvailableSlots
│   └── package.json       ← dependencias: drizzle-orm, @neondatabase/serverless
├── dashboard/
│   └── src/app/api/**     ← 21 routes migradas de Sequelize a Drizzle
└── bot/
    └── src/**             ← 17 archivos migrados de Sequelize a Drizzle
```

## Qué cambia en `@agenturn/db`

**Desaparece:**
- `src/connection.ts`
- `src/models/` (todos los archivos)
- `src/sync.ts`
- Dependencias: `sequelize`, `pg`, `pg-hstore`

**Se agrega:**
- `src/schema.ts` — todas las tablas definidas con `pgTable()` de Drizzle
- `src/db.ts` — cliente con `neon()` + `drizzle()`
- Dependencias: `drizzle-orm`, `@neondatabase/serverless`

**No cambia:**
- `src/scheduling.ts`
- `src/index.ts` (se actualiza para exportar lo nuevo)

### Ejemplo: schema Drizzle

```ts
// src/schema.ts
import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core"

export const planEnum = pgEnum("plan", ["free", "pro"])
export const statusEnum = pgEnum("subscription_status", ["active", "inactive", "trial"])

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  whatsapp_number: varchar("whatsapp_number", { length: 50 }),
  phone_number_id: varchar("phone_number_id", { length: 50 }),
  plan: planEnum("plan").notNull(),
  subscription_status: statusEnum("subscription_status").notNull(),
  slot_interval_minutes: integer("slot_interval_minutes"),
  created_at: timestamp("created_at").defaultNow(),
})
```

### Ejemplo: cliente Drizzle

```ts
// src/db.ts
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

## Qué cambia en el dashboard (21 routes)

Patrón general de migración:

```ts
// ANTES — Sequelize
import { User } from "@agenturn/db"
const user = await User.findOne({ where: { email } })

// DESPUÉS — Drizzle
import { db, users } from "@agenturn/db"
import { eq } from "drizzle-orm"
const user = await db.select().from(users).where(eq(users.email, email)).then(r => r[0])
```

Operadores Sequelize → Drizzle:
- `Op.gte` → `gte()`
- `Op.lte` → `lte()`
- `Op.between` → `and(gte(), lte())`
- `Op.in` → `inArray()`
- `findAll` → `db.select().from(tabla).where(...)`
- `findOne` → igual + `.then(r => r[0])`
- `create` → `db.insert(tabla).values({...}).returning()`
- `update` → `db.update(tabla).set({...}).where(...)`
- `destroy` → `db.delete(tabla).where(...)`

También se migra `src/lib/auth.ts` que actualmente usa una query `pg` directa temporaria (agregada como workaround) — pasa a usar Drizzle igual que las routes.

Routes más complejas a prestar atención:
- `appointments/route.ts` — joins con Client, Service, Professional + lógica de conflictos
- `metrics/route.ts` — COUNT, SUM, GROUP BY con `sql` template literal de Drizzle
- `agenda/form-data/route.ts` — joins con ServiceCategory

## Qué cambia en el bot (17 archivos)

Mismo patrón de migración que el dashboard. Los archivos con más queries complejas:
- `states/select-date.ts` — ranges de fechas, joins con Service
- `states/confirmed.ts` — múltiples inserts y updates
- `states/cancel-confirm.ts` — updates de estado

## Qué NO cambia

- **Tablas en NeonDB** — ya existen, no se corren migraciones
- **`scheduling.ts`** — función pura sin DB, sin tocar
- **`DATABASE_URL`** — misma variable de entorno en Vercel y Railway
- **`middleware.ts` del dashboard** — sin tocar
- **Lógica de negocio** — solo cambia cómo se habla con la DB
- **Tests** — no se tocan en esta migración
- **`seed.ts`** — se actualiza después del MVP

## Orden de implementación

Todo el trabajo se hace en ramas separadas que se mergean antes del push a main:

```
main
└── feat/migrate-drizzle              ← rama principal
    ├── feat/migrate-drizzle/db       ← paso 1: @agenturn/db
    ├── feat/migrate-drizzle/dashboard ← paso 2: dashboard
    └── feat/migrate-drizzle/bot      ← paso 3: bot
```

### Pasos

1. Crear `feat/migrate-drizzle` desde `main`
2. Crear `feat/migrate-drizzle/db` desde `feat/migrate-drizzle`
   - Instalar dependencias Drizzle en `@agenturn/db`
   - Escribir `schema.ts` con todas las tablas
   - Escribir `db.ts` con el cliente
   - Actualizar `index.ts`
   - Borrar `src/models/`, `connection.ts`, `sync.ts`
   - Mergear a `feat/migrate-drizzle`
3. Crear `feat/migrate-drizzle/dashboard` desde `feat/migrate-drizzle`
   - Migrar las 21 routes
   - Verificar que compila con `tsc`
   - Mergear a `feat/migrate-drizzle`
4. Crear `feat/migrate-drizzle/bot` desde `feat/migrate-drizzle`
   - Migrar los 17 archivos
   - Verificar que compila con `tsc`
   - Mergear a `feat/migrate-drizzle`
5. Mergear `feat/migrate-drizzle` a `main` — Vercel y Railway redeplegan automáticamente

## Por qué esto resuelve el problema

Sequelize hace `require('pg')` dinámicamente dentro de `ConnectionManager`. Turbopack no puede resolver esto en build time ni en runtime serverless.

Drizzle + `@neondatabase/serverless` usan HTTP para conectarse a NeonDB — no hay `require('pg')` en ningún lugar del código. El bundler no encuentra nada que no pueda resolver.
