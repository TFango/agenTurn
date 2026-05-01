# agenTurn — Design Spec
**Fecha:** 2026-04-30  
**Empresa:** Certezza  
**Autor:** Ema  

---

## 1. Contexto y objetivo

agenTurn es un SaaS B2B para peluquerías y centros de estética en Argentina. El producto automatiza la gestión de turnos mediante un chatbot de WhatsApp y un panel web administrativo.

**Problema que resuelve:** Los locales de belleza gestionan turnos por llamadas o mensajes manuales de WhatsApp, lo que demanda tiempo del profesional y genera errores de agenda. agenTurn automatiza el flujo completo: el cliente saca turno solo, el sistema calcula disponibilidad según duración del servicio, y el dueño tiene visibilidad en tiempo real desde el panel.

**Modelo de negocio:** Suscripción mensual en USD (cobrada en pesos al tipo de cambio del día via Mercado Pago). Precio estimado: USD 15–25/mes por local. La conversación iniciada por el cliente en WhatsApp no tiene costo (ventana de 24hs gratuita de Meta). Mercado Pago se integra en una fase posterior al MVP.

**Validación:** MVP se testea con una peluquera con base de clientes activa antes de salir al mercado.

---

## 2. Arquitectura general

Dos servicios independientes que comparten una sola base de datos:

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│  Dashboard (Next.js)     │     │  Bot Service (Node.js)        │
│  Vercel                  │     │  Railway                      │
│                          │     │                               │
│  Panel web del dueño     │     │  Webhook de Meta              │
│  API REST interna        │     │  Máquina de estados por conv. │
└───────────┬──────────────┘     └──────────────┬───────────────┘
            │                                   │
            └──────────────┬────────────────────┘
                           │
                 ┌─────────▼──────────┐
                 │  NeonDB (Postgres)  │
                 │  Multi-tenant       │
                 │  via tenant_id      │
                 └────────────────────┘
```

**Multi-tenancy:** Cada local es un tenant. Todos los registros tienen `tenant_id`. Cada local conecta su propio número de WhatsApp Business. El bot rutea los mensajes entrantes por el número de destino (`to`) para identificar al tenant y cargar su configuración.

**Servicios externos (MVP):**
- **Meta Cloud API** — webhooks de WhatsApp, gratuito cuando el cliente inicia la conversación
- **Mercado Pago** — cobro de suscripciones (fase post-MVP)

**Stack técnico:**
- Next.js + TypeScript + React (dashboard)
- Node.js + TypeScript (bot service)
- NeonDB — Postgres serverless
- Sequelize — ORM
- Vercel (dashboard deploy)
- Railway (bot service deploy)

---

## 3. Base de datos

### Tablas core

**`tenants`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| name | string | Nombre del local |
| whatsapp_number | string | Número de WPP Business conectado |
| plan | enum | `free` / `pro` |
| subscription_status | enum | `active` / `inactive` / `trial` |
| slot_interval_minutes | integer | Intervalo entre slots generados (default: 30) |
| created_at | timestamp | |

**`professionals`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | |
| name | string | |
| active | boolean | |

**`services`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | |
| name | string | ej. "Mechado", "Color completo" |
| duration_minutes | integer | Duración real del servicio |
| price | integer | En pesos ARS |
| active | boolean | |

### Tablas de agenda

**`working_hours`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| professional_id | UUID FK | |
| day_of_week | integer | 0=Domingo … 6=Sábado |
| start_time | time | ej. "09:00" |
| end_time | time | ej. "19:00" |

**`appointments`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | |
| professional_id | UUID FK | |
| service_id | UUID FK | |
| client_id | UUID FK | |
| datetime | timestamp | Inicio del turno |
| status | enum | `pending` / `confirmed` / `cancelled` |

**`blocked_dates`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| professional_id | UUID FK | |
| date | date | Día completo bloqueado |
| reason | string | Opcional |

### Tabla de usuarios

**`users`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | Siempre ligado a un local |
| professional_id | UUID FK nullable | Solo si el usuario es un profesional del local |
| name | string | |
| email | string | Único por tenant |
| password_hash | string | |
| role | enum | `admin` / `professional` |
| active | boolean | |
| created_at | timestamp | |

El dueño tiene `professional_id = null` y `role = admin`. Un empleado tiene `role = professional` y su `professional_id` apunta a su registro en `professionals`. Un local puede tener solo el admin sin ningún empleado cargado — la peluquera que trabaja sola nunca necesita crear usuarios adicionales.

### Tablas de clientes y bot

**`clients`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | |
| name | string | Se completa automático desde WPP |
| whatsapp_number | string | |
| notes | text | Notas del dueño sobre el cliente |
| created_at | timestamp | |

**`conversation_states`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | |
| client_whatsapp | string | Número del cliente |
| state | enum | Ver estados en sección 4 |
| temp_data | JSONB | Selecciones parciales del flujo |
| updated_at | timestamp | TTL: limpiar si > 30 min sin actividad |

**`waitlist`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | |
| client_id | UUID FK | |
| service_id | UUID FK | |
| created_at | timestamp | |

---

## 4. Motor de scheduling

El bot nunca improvisa disponibilidad — la calcula en tiempo real.

**Algoritmo para generar slots disponibles:**
1. Obtener `working_hours` del profesional para el día solicitado
2. Generar slots cada `slot_interval_minutes` (del tenant) desde `start_time` hasta `end_time`
3. Para cada slot: verificar que `slot_inicio + duration_minutes` del servicio no se superponga con ningún `appointment` confirmado del día
4. Filtrar slots que caigan en `blocked_dates`
5. Retornar solo slots válidos

**Ejemplo:** Profesional trabaja 9:00–19:00. Tiene turno de corte (40 min) a las 13:00 y otro a las 14:00. Para un mechado (90 min):
- 9:00 ✅ (termina 10:30)
- 11:00 ✅ (termina 12:30)
- 12:00 ❌ (termina 13:30 → pisa el turno de 13:00)
- 14:40 ✅ (termina 16:10, tras el turno de 14:00 que dura 40 min)

---

## 5. Bot de WhatsApp — máquina de estados

Cada conversación tiene un estado persistido en `conversation_states`. Los mensajes entrantes avanzan, retroceden o resetean el estado.

### Estados

| Estado | Descripción |
|---|---|
| `GREETING` | Bienvenida + opciones: Sacar turno / Cancelar turno / Hablar con alguien |
| `SELECT_SERVICE` | Lista de servicios activos del tenant |
| `SELECT_PROFESSIONAL` | Lista de profesionales activos (se omite si el tenant tiene solo uno) |
| `SELECT_DATE` | Próximos 14 días con al menos un slot disponible para servicio + profesional |
| `SELECT_TIME` | Slots válidos para el día elegido (calculados por el motor de scheduling) |
| `CONFIRM` | Resumen completo: servicio, profesional, día, hora. Opciones: Confirmar / Cambiar |
| `CONFIRMED` | Turno guardado en DB. Notificación al panel. |
| `CANCEL_SELECT` | Lista de próximos turnos del cliente para cancelar |
| `CANCEL_CONFIRM` | Confirmación de cancelación. Bot actualiza DB y libera el slot. |
| `HUMAN_HANDOFF` | El dueño atiende desde el panel. Bot en pausa. |
| `WAITLIST` | Sin disponibilidad en 14 días. Cliente pregunta si quiere ser avisado. |

### Transiciones especiales

- **Día sin lugar:** Si el cliente elige una fecha sin slots para ese servicio → bot responde con otros días disponibles, no sale del estado `SELECT_DATE`.
- **Sin disponibilidad total:** Si ningún día en 14 días tiene slots → pasa a `WAITLIST`.
- **Human handoff → bot:** El dueño presiona "Pasar a bot" en el panel → estado vuelve a `SELECT_SERVICE`. El cliente también puede escribir "quiero turno" para reactivar el bot en cualquier momento.
- **Cancelar:** Cualquier mensaje con "cancelar", "salir" o "menú" → resetea a `GREETING`.
- **TTL:** Si `updated_at` tiene más de 30 minutos → `conversation_states` se limpia automáticamente (job periódico o trigger en DB).

### Creación del registro de cliente

Cuando un número desconocido escribe por primera vez, el bot crea un registro en `clients` con el número de WhatsApp y un nombre provisional (el display name de WPP si está disponible, o "Cliente" + últimos 4 dígitos). El dueño puede editar el nombre desde el panel. Esto garantiza que `client_id` existe antes de llegar al estado `WAITLIST` o `CONFIRMED`.

### Ruteo multi-tenant

Meta envía todos los mensajes al mismo webhook. El bot identifica el tenant por el número de destino (`to` field del payload de Meta). Si el número no corresponde a ningún tenant activo, el mensaje se ignora.

---

## 6. Dashboard web — MVP

### Pantallas

**Agenda (`/dashboard`)**
- Vista semanal con todos los turnos del período
- Cada turno muestra: servicio, nombre del cliente, duración
- Color por tipo de servicio
- Día actual resaltado
- Navegación entre semanas
- Notificaciones en tiempo real de nuevos turnos o mensajes de human handoff

**Servicios (`/dashboard/servicios`)**
- Lista de servicios con nombre, duración en minutos y precio
- Alta, edición y baja de servicios
- Toggle activo/inactivo (sin borrar el historial)

**Clientes (`/dashboard/clientes`)**
- Tabla con buscador
- Columnas: nombre, número de WhatsApp, cantidad de turnos, último turno
- Vista de detalle: historial completo de turnos del cliente + campo de notas

**Métricas (`/dashboard/metricas`)**
- Turnos del mes actual y de la semana
- Clientes únicos del mes
- Cantidad de cancelados
- Ranking de servicios más pedidos (barras)

**Configuración (`/dashboard/configuracion`)**
- Horario laboral por día de la semana (start/end time, o "Cerrado")
- Intervalo mínimo entre turnos (default: 30 min)
- Gestión de profesionales (nombre, activo/inactivo)
- Días bloqueados: agregar/eliminar fechas con motivo opcional
- Estado de conexión de WhatsApp Business

### Autenticación y roles

NextAuth con credenciales (email + password). Múltiples usuarios por tenant, cada uno con su rol:

- **Admin:** accede a todo el panel (agenda completa, servicios, clientes, métricas, configuración, gestión de empleados)
- **Profesional:** accede solo a su agenda personal filtrada por su `professional_id`

El primer usuario de cada tenant se crea como `admin` al registrarse. Desde Configuración, el admin puede agregar empleados (nombre, email, contraseña inicial) y asignarlos a un profesional existente. Si el local trabaja solo, nunca necesita crear usuarios adicionales.

---

## 7. Flujo de onboarding de un nuevo local

1. Dueño se registra en la web (email + contraseña)
2. Completa nombre del local
3. Carga sus servicios con duraciones y precios
4. Configura su horario laboral por día
5. Conecta su número de WhatsApp Business via Meta Cloud API (flujo guiado paso a paso)
6. El bot queda activo — cualquier cliente que escriba al número ya puede sacar turno

---

## 8. Decisiones descartadas

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| API oficial Meta | Biblioteca no-oficial (baileys) | Riesgo de ban a escala, inestable |
| Suscripción en USD | Precio fijo en ARS | La inflación destruye precios fijos en ARS |
| MVP peluquería+estética | Los 3 rubros desde el arranque | Scope excesivo para validación; tattoo tiene flujo diferente |
| Bot solo WPP | WPP + Telegram | Telegram genera fricción en clientes de peluquería |
| Next.js + bot separado | Monolito Next.js | Vercel tiene límite de 10s en funciones; bot necesita tiempo de respuesta flexible |

---

## 9. Fuera de scope del MVP

- Recordatorios automáticos de turno (requiere mensajes iniciados por el negocio = costo Meta)
- Pagos online del turno
- Integración con Mercado Pago (suscripciones)
- Notificaciones push al dueño
- Exportación de reportes

## 9b. En scope (incorporado tras revisión)

**Múltiples profesionales por local**
- Centros de estética tienen varios profesionales (uñas, masajes, depilación, etc.)
- El bot agrega el estado `SELECT_PROFESSIONAL` entre `SELECT_SERVICE` y `SELECT_DATE`
- Flujo completo: servicio → profesional → fecha → horario → confirmar
- Cada profesional tiene su propio horario (`working_hours`) y días bloqueados (`blocked_dates`)
- La agenda del panel muestra todos los profesionales del local, filtrable por profesional

**PWA (Progressive Web App)**
- El dashboard de Next.js se configura como PWA con `next-pwa`
- El dueño puede instalarlo en su teléfono desde el navegador (ícono en pantalla de inicio, funciona offline en modo lectura)
- No requiere App Store ni desarrollo nativo

**Cancelación de turnos**
- *Por el cliente via bot:* Nueva opción en `GREETING` — "Cancelar un turno". El bot lista los próximos turnos del cliente, el cliente elige cuál cancelar, bot confirma y actualiza el status a `cancelled` en DB.
- *Por el dueño via panel:* Botón "Cancelar" en cada turno de la agenda. Al cancelar, el bot envía automáticamente un mensaje al cliente notificando la cancelación (mensaje iniciado por el negocio — costo mínimo de Meta).
- El motor de scheduling libera automáticamente el slot cancelado para nuevas reservas.

---

## 10. Criterios de éxito del MVP

- La peluquera puede configurar sus servicios y horario sin ayuda
- Un cliente puede sacar turno completo via WhatsApp sin intervención humana
- El turno aparece en el panel web en tiempo real
- El scheduling no genera conflictos de horario
- El human handoff funciona: cliente habla con el dueño y el bot puede retomar
