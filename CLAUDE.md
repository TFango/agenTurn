# agenTurn — Contexto del proyecto

## Qué es

SaaS B2B para peluquerías y centros de estética en Argentina. Automatiza la gestión de turnos via un chatbot de WhatsApp y un panel web administrativo. El cliente saca turno solo por WhatsApp; el dueño gestiona su agenda desde el panel.

**Modelo de negocio:** Suscripción mensual en USD, cobrada en pesos ARS al tipo de cambio del día via Mercado Pago (post-MVP).

**MVP:** Se testea con una peluquera real antes de salir al mercado.

---

## Arquitectura

Monorepo con npm workspaces. Tres packages:

```
packages/
├── db/          → @agenturn/db — modelos Sequelize compartidos
├── bot/         → servicio Node.js — deploy en Railway
└── dashboard/   → app Next.js — deploy en Vercel
```

Ambos servicios comparten una sola base de datos en **NeonDB (Postgres serverless)**.

**Multi-tenancy:** Cada local es un tenant. Todos los registros tienen `tenant_id`. El bot identifica al tenant por el número de WhatsApp de destino (`to` field del webhook de Meta).

**Servicios externos:**
- Meta Cloud API — webhooks de WhatsApp (gratis cuando el cliente inicia la conversación)
- NeonDB — base de datos
- Mercado Pago — cobro de suscripciones (post-MVP)

---

## Tech stack

| Área | Tecnología |
|---|---|
| Dashboard | Next.js 16 + React 19 + TypeScript |
| Estilos | CSS Modules (sin Tailwind) |
| Bot service | Node.js + TypeScript + Express |
| ORM | Sequelize |
| Base de datos | NeonDB (Postgres) |
| Auth | NextAuth v5 — credenciales email/password |
| PWA | next-pwa |
| Tests | Vitest |
| Deploy dashboard | Vercel |
| Deploy bot | Railway |

---

## Base de datos — tablas principales

| Tabla | Descripción |
|---|---|
| `tenants` | Cada local. Tiene `whatsapp_number`, `slot_interval_minutes` (default 30) |
| `professionals` | Profesionales del local. Pueden ser varios por tenant |
| `services` | Servicios con `duration_minutes` y `price` |
| `working_hours` | Horario laboral por día de semana por profesional |
| `appointments` | Turnos. Status: `pending` / `confirmed` / `cancelled` |
| `blocked_dates` | Días completos bloqueados por profesional |
| `users` | Usuarios del panel. Roles: `admin` / `professional` |
| `clients` | Clientes que escriben por WhatsApp |
| `conversation_states` | Estado actual de cada conversación (TTL 30 min) |
| `waitlist` | Clientes sin disponibilidad en 14 días |

Todos los registros tienen `tenant_id`. Los `users` tienen `professional_id nullable` — si es admin es null, si es profesional apunta a su registro en `professionals`.

---

## Motor de scheduling

Función pura `getAvailableSlots()` en `packages/db/src/scheduling.ts`. Nunca improvisa disponibilidad.

**Algoritmo:**
1. Obtener `working_hours` del profesional para el día
2. Generar slots cada `slot_interval_minutes` desde `start_time` hasta `end_time`
3. Para cada slot: verificar que `slot_inicio + duration_minutes` no se superponga con ningún appointment confirmado
4. Filtrar slots en `blocked_dates`
5. Retornar solo slots válidos

---

## Bot — máquina de estados

Estados persistidos en `conversation_states`. Flujo principal:

```
GREETING → SELECT_SERVICE → SELECT_PROFESSIONAL → SELECT_DATE → SELECT_TIME → CONFIRM → CONFIRMED
```

Estados adicionales:
- `CANCEL_SELECT` / `CANCEL_CONFIRM` — cancelación por el cliente
- `HUMAN_HANDOFF` — bot en pausa, atiende el dueño desde el panel
- `WAITLIST` — sin disponibilidad en 14 días

**Transiciones especiales:**
- SELECT_PROFESSIONAL se omite si el tenant tiene un solo profesional
- "cancelar" / "salir" / "menú" en cualquier momento → resetea a GREETING
- TTL: si `updated_at > 30 min` → se limpia el estado (job periódico)
- Human handoff → bot: dueño presiona "Pasar a bot" en el panel, o cliente escribe "quiero turno"

---

## Dashboard — pantallas (App Router)

| Ruta | Pantalla |
|---|---|
| `/dashboard` | Agenda semanal con todos los turnos |
| `/dashboard/servicios` | CRUD de servicios |
| `/dashboard/clientes` | Tabla de clientes + historial |
| `/dashboard/metricas` | Stats del mes + ranking de servicios |
| `/dashboard/configuracion` | Horarios, profesionales, días bloqueados, WhatsApp |

**Roles:**
- `admin` — accede a todo
- `professional` — solo ve su agenda filtrada por `professional_id`

---

## Convenciones de desarrollo

- **CSS Modules** para estilos — sin Tailwind
- **TDD** con Vitest, especialmente para el motor de scheduling
- Commits frecuentes y pequeños
- Sin abstracciones especulativas (YAGNI)
- Sin manejo de errores para escenarios imposibles
- Validación solo en boundaries del sistema (input de usuario, webhooks externos)

---

## Modo de trabajo con el desarrollador

El desarrollador está aprendiendo activamente. Estas reglas son prioritarias en toda interacción:

**Rol de profesor:**
- Actuar siempre como profesor, no como implementador
- Antes de cada tarea, dar un pantallazo con los conceptos clave y el approach — sin resolver nada todavía
- No dar el código completo salvo que el desarrollador lo pida explícitamente ("dame el código", "hacelo vos", etc.)
- Guiar con pistas, preguntas y fragmentos parciales en lugar de soluciones completas

**Correcciones:**
- Cuando haya un error, explicar qué está mal y por qué — no corregirlo directamente
- Si el desarrollador dice que se trabó, ahí sí corregirlo completamente
- Si hay un error grave (seguridad, bug crítico, lógica rota), corregirlo directamente sin esperar

**Librerías externas:**
- Para librerías que el desarrollador probablemente no conoce (Meta Cloud API, sequelize, NextAuth, next-pwa, Vitest, etc.), dar más contexto: qué hace, cómo funciona, conceptos clave antes de pedir que lo implemente

**CSS:**
- El CSS no es prioridad de aprendizaje — se puede ayudar más directamente con estilos sin restringir el código

---

## Planes de implementación

Los planes detallados con código, tests y comandos están en:

- [Plan 1 — Infraestructura](docs/superpowers/plans/2026-04-30-agenturn-plan-1-infrastructure.md) — Monorepo, NeonDB, modelos, scheduling engine
- [Plan 2 — Bot service](docs/superpowers/plans/2026-04-30-agenturn-plan-2-bot.md) — Express, webhook Meta, máquina de estados
- [Plan 3 — Dashboard](docs/superpowers/plans/2026-04-30-agenturn-plan-3-dashboard.md) — Next.js, NextAuth, pantallas, PWA

El design spec completo está en [docs/superpowers/specs/2026-04-30-agenturn-design.md](docs/superpowers/specs/2026-04-30-agenturn-design.md).
