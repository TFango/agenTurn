# agenTurn — Plan 2: Bot Service

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisito:** Plan 1 completado. `@agenturn/db` disponible con modelos y scheduling engine.

**Goal:** Construir el servicio Node.js que recibe webhooks de Meta, rutea mensajes por tenant, maneja la máquina de estados de conversación y envía respuestas vía WhatsApp Business API.

**Architecture:** Express server con un endpoint de webhook. Cada mensaje entrante pasa por: verificación de firma → router multi-tenant → carga/actualización de `conversation_states` → handler del estado actual → respuesta WhatsApp.

**Tech Stack:** Node.js, Express, TypeScript, @agenturn/db, Vitest, supertest, Railway (deploy)

---

## Estructura de archivos

```
packages/bot/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts                  # Entry point — arranca el servidor
    ├── server.ts                 # Express app (exportada para tests)
    ├── webhook.ts                # POST /webhook — recibe mensajes de Meta
    ├── router.ts                 # Multi-tenant routing por número WPP
    ├── whatsapp.ts               # Cliente Meta API — enviar mensajes
    ├── client-lookup.ts          # Auto-creación de Client en DB
    ├── state-machine.ts          # Dispatcher de estados
    ├── ttl-cleanup.ts            # Job periódico — limpia estados vencidos
    └── states/
        ├── greeting.ts           # GREETING
        ├── select-service.ts     # SELECT_SERVICE
        ├── select-professional.ts # SELECT_PROFESSIONAL
        ├── select-date.ts        # SELECT_DATE
        ├── select-time.ts        # SELECT_TIME
        ├── confirm.ts            # CONFIRM
        ├── confirmed.ts          # CONFIRMED
        ├── cancel-select.ts      # CANCEL_SELECT
        ├── cancel-confirm.ts     # CANCEL_CONFIRM
        ├── human-handoff.ts      # HUMAN_HANDOFF
        └── waitlist.ts           # WAITLIST
```

---

### Task 1: Express server setup

**Files:**
- Create: `packages/bot/package.json`
- Create: `packages/bot/tsconfig.json`
- Create: `packages/bot/src/server.ts`
- Create: `packages/bot/src/index.ts`
- Create: `packages/bot/src/server.test.ts`

- [ ] **Step 1: Crear package.json del bot**

```json
// packages/bot/package.json
{
  "name": "@agenturn/bot",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@agenturn/db": "*",
    "express": "^4.19.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2",
    "ts-node-dev": "^2.0.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Crear tsconfig del bot**

```json
// packages/bot/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.test.ts", "dist"]
}
```

- [ ] **Step 3: Escribir test de health check**

```typescript
// packages/bot/src/server.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './server';

describe('GET /health', () => {
  it('returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 4: Correr para verificar que falla**

```bash
cd packages/bot && npx vitest run src/server.test.ts
```

Expected: FAIL

- [ ] **Step 5: Implementar el servidor Express**

```typescript
// packages/bot/src/server.ts
import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

export default app;
```

```typescript
// packages/bot/src/index.ts
import app from './server';

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Bot service running on port ${PORT}`);
});
```

- [ ] **Step 6: Correr los tests**

```bash
cd packages/bot && npx vitest run src/server.test.ts
```

Expected: PASS

- [ ] **Step 7: Instalar dependencias y commit**

```bash
cd packages/bot && npm install
git add packages/bot/
git commit -m "feat: Express bot server setup"
```

---

### Task 2: Meta webhook verification + recepción de mensajes

**Files:**
- Create: `packages/bot/src/webhook.ts`
- Create: `packages/bot/src/webhook.test.ts`
- Modify: `packages/bot/src/server.ts`

- [ ] **Step 1: Escribir tests del webhook**

```typescript
// packages/bot/src/webhook.test.ts
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from './server';

describe('GET /webhook — Meta verification', () => {
  it('returns the challenge when verify_token matches', async () => {
    process.env.META_VERIFY_TOKEN = 'test_token';
    const res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test_token',
        'hub.challenge': 'challenge_abc',
      });
    expect(res.status).toBe(200);
    expect(res.text).toBe('challenge_abc');
  });

  it('returns 403 when verify_token does not match', async () => {
    process.env.META_VERIFY_TOKEN = 'test_token';
    const res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'challenge_abc',
      });
    expect(res.status).toBe(403);
  });
});

describe('POST /webhook — incoming message', () => {
  it('returns 200 immediately (before processing)', async () => {
    const payload = buildMetaPayload('5491112345678', '5491199999999', 'Hola');
    const res = await request(app).post('/webhook').send(payload);
    expect(res.status).toBe(200);
  });
});

function buildMetaPayload(from: string, to: string, text: string) {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          metadata: { phone_number_id: 'phone_id_1', display_phone_number: to },
          contacts: [{ profile: { name: 'Test User' }, wa_id: from }],
          messages: [{
            from,
            id: 'wamid.test123',
            timestamp: '1700000000',
            type: 'text',
            text: { body: text },
          }],
        },
        field: 'messages',
      }],
    }],
  };
}
```

- [ ] **Step 2: Correr para verificar que falla**

```bash
cd packages/bot && npx vitest run src/webhook.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implementar el webhook**

```typescript
// packages/bot/src/webhook.ts
import { Router, Request, Response } from 'express';

const router = Router();

// Meta webhook verification
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Incoming messages
router.post('/', (req: Request, res: Response) => {
  // Meta requiere respuesta 200 inmediata — procesar async
  res.sendStatus(200);

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  if (!change?.messages) return;

  const message = change.messages[0];
  const from: string = message.from;
  const to: string = change.metadata.display_phone_number;
  const body: string = message.type === 'text'
    ? message.text.body
    : message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id ?? '';

  // Dispatch async — no bloquea la respuesta 200
  handleIncomingMessage(from, to, body, change.contacts?.[0]?.profile?.name).catch(console.error);
});

async function handleIncomingMessage(
  from: string,
  to: string,
  body: string,
  contactName?: string,
): Promise<void> {
  // Importar aquí para evitar circular deps en tests
  const { routeMessage } = await import('./router');
  await routeMessage(from, to, body, contactName);
}

export default router;
```

- [ ] **Step 4: Agregar el webhook al servidor**

```typescript
// packages/bot/src/server.ts
import express from 'express';
import webhookRouter from './webhook';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/webhook', webhookRouter);

export default app;
```

- [ ] **Step 5: Correr los tests**

```bash
cd packages/bot && npx vitest run src/webhook.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/bot/src/
git commit -m "feat: Meta webhook verification and message reception"
```

---

### Task 3: WhatsApp API client (enviar mensajes)

**Files:**
- Create: `packages/bot/src/whatsapp.ts`
- Create: `packages/bot/src/whatsapp.test.ts`

- [ ] **Step 1: Escribir tests**

```typescript
// packages/bot/src/whatsapp.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

import { sendTextMessage, sendButtonMessage, sendListMessage } from './whatsapp';

beforeEach(() => {
  process.env.META_ACCESS_TOKEN = 'test_token';
  vi.clearAllMocks();
  (mockedAxios.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { messages: [{ id: 'wamid.test' }] } });
});

describe('sendTextMessage', () => {
  it('calls Meta API with correct payload', async () => {
    await sendTextMessage('phone_id_1', '5491112345678', 'Hola!');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://graph.facebook.com/v18.0/phone_id_1/messages',
      expect.objectContaining({ to: '5491112345678', type: 'text' }),
      expect.any(Object),
    );
  });
});

describe('sendButtonMessage', () => {
  it('sends interactive button message', async () => {
    await sendButtonMessage('phone_id_1', '5491112345678', '¿Qué querés?', [
      { id: 'book', title: 'Sacar turno' },
      { id: 'cancel', title: 'Cancelar turno' },
    ]);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ type: 'interactive' }),
      expect.any(Object),
    );
  });
});
```

- [ ] **Step 2: Implementar whatsapp.ts**

```typescript
// packages/bot/src/whatsapp.ts
import axios from 'axios';

const BASE_URL = 'https://graph.facebook.com/v18.0';

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string,
): Promise<void> {
  await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } },
    { headers: getHeaders() },
  );
}

export async function sendButtonMessage(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
): Promise<void> {
  await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
        },
      },
    },
    { headers: getHeaders() },
  );
}

export async function sendListMessage(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttonLabel: string,
  rows: Array<{ id: string; title: string; description?: string }>,
): Promise<void> {
  await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: { button: buttonLabel, sections: [{ title: 'Opciones', rows }] },
      },
    },
    { headers: getHeaders() },
  );
}
```

- [ ] **Step 3: Correr tests**

```bash
cd packages/bot && npx vitest run src/whatsapp.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/bot/src/whatsapp.ts packages/bot/src/whatsapp.test.ts
git commit -m "feat: WhatsApp Meta API client — text, button, list messages"
```

---

### Task 4: Multi-tenant router + auto-creación de cliente

**Files:**
- Create: `packages/bot/src/router.ts`
- Create: `packages/bot/src/client-lookup.ts`
- Create: `packages/bot/src/router.test.ts`

- [ ] **Step 1: Implementar client-lookup.ts**

```typescript
// packages/bot/src/client-lookup.ts
import { Client, Tenant } from '@agenturn/db';

export async function findOrCreateClient(
  tenantId: string,
  whatsappNumber: string,
  contactName?: string,
): Promise<InstanceType<typeof Client>> {
  const [client] = await Client.findOrCreate({
    where: { tenant_id: tenantId, whatsapp_number: whatsappNumber },
    defaults: {
      tenant_id: tenantId,
      whatsapp_number: whatsappNumber,
      name: contactName ?? `Cliente ${whatsappNumber.slice(-4)}`,
    },
  });
  return client;
}
```

- [ ] **Step 2: Implementar router.ts**

```typescript
// packages/bot/src/router.ts
import { Tenant, ConversationState, BotState } from '@agenturn/db';
import { findOrCreateClient } from './client-lookup';
import { dispatchState } from './state-machine';

const RESET_KEYWORDS = ['cancelar', 'salir', 'menú', 'menu', 'inicio'];

export async function routeMessage(
  from: string,       // número del cliente
  to: string,         // número del local (para identificar tenant)
  body: string,
  contactName?: string,
): Promise<void> {
  // 1. Encontrar tenant por número WPP
  const tenant = await Tenant.findOne({ where: { whatsapp_number: to, subscription_status: 'active' } });
  if (!tenant) return; // Número no registrado o tenant inactivo — ignorar

  // 2. Auto-crear cliente si es nuevo
  const client = await findOrCreateClient(tenant.id, from, contactName);

  // 3. Cargar o crear el estado de conversación
  let [convState] = await ConversationState.findOrCreate({
    where: { tenant_id: tenant.id, client_whatsapp: from },
    defaults: { tenant_id: tenant.id, client_whatsapp: from, state: 'GREETING', temp_data: {} },
  });

  // 4. Keyword reset — cualquier mensaje con palabra clave vuelve a GREETING
  if (RESET_KEYWORDS.some(kw => body.toLowerCase().includes(kw)) && convState.state !== 'GREETING') {
    await convState.update({ state: 'GREETING', temp_data: {} });
  }

  // 5. Despachar al handler del estado actual
  await dispatchState(convState, tenant, client, body);
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/bot/src/router.ts packages/bot/src/client-lookup.ts
git commit -m "feat: multi-tenant router and client auto-creation"
```

---

### Task 5: State machine + flujo de booking

**Files:**
- Create: `packages/bot/src/state-machine.ts`
- Create: `packages/bot/src/states/greeting.ts`
- Create: `packages/bot/src/states/select-service.ts`
- Create: `packages/bot/src/states/select-professional.ts`
- Create: `packages/bot/src/states/select-date.ts`
- Create: `packages/bot/src/states/select-time.ts`
- Create: `packages/bot/src/states/confirm.ts`
- Create: `packages/bot/src/states/confirmed.ts`

- [ ] **Step 1: Implementar state-machine.ts (dispatcher)**

```typescript
// packages/bot/src/state-machine.ts
import { ConversationState, Tenant, Client } from '@agenturn/db';
import { handleGreeting } from './states/greeting';
import { handleSelectService } from './states/select-service';
import { handleSelectProfessional } from './states/select-professional';
import { handleSelectDate } from './states/select-date';
import { handleSelectTime } from './states/select-time';
import { handleConfirm } from './states/confirm';
import { handleCancelSelect } from './states/cancel-select';
import { handleCancelConfirm } from './states/cancel-confirm';
import { handleHumanHandoff } from './states/human-handoff';
import { handleWaitlist } from './states/waitlist';

type ConvStateInstance = InstanceType<typeof ConversationState>;
type TenantInstance = InstanceType<typeof Tenant>;
type ClientInstance = InstanceType<typeof Client>;

export async function dispatchState(
  conv: ConvStateInstance,
  tenant: TenantInstance,
  client: ClientInstance,
  body: string,
): Promise<void> {
  await conv.update({ updated_at: new Date() });

  switch (conv.state) {
    case 'GREETING':          return handleGreeting(conv, tenant, client, body);
    case 'SELECT_SERVICE':    return handleSelectService(conv, tenant, client, body);
    case 'SELECT_PROFESSIONAL': return handleSelectProfessional(conv, tenant, client, body);
    case 'SELECT_DATE':       return handleSelectDate(conv, tenant, client, body);
    case 'SELECT_TIME':       return handleSelectTime(conv, tenant, client, body);
    case 'CONFIRM':           return handleConfirm(conv, tenant, client, body);
    case 'CANCEL_SELECT':     return handleCancelSelect(conv, tenant, client, body);
    case 'CANCEL_CONFIRM':    return handleCancelConfirm(conv, tenant, client, body);
    case 'HUMAN_HANDOFF':     return handleHumanHandoff(conv, tenant, client, body);
    case 'WAITLIST':          return handleWaitlist(conv, tenant, client, body);
    default:
      await conv.update({ state: 'GREETING', temp_data: {} });
      return handleGreeting(conv, tenant, client, body);
  }
}
```

- [ ] **Step 2: Implementar greeting.ts**

```typescript
// packages/bot/src/states/greeting.ts
import { ConversationState, Tenant, Client } from '@agenturn/db';
import { sendButtonMessage } from '../whatsapp';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleGreeting(
  conv: ConvState,
  tenant: TenantI,
  _client: ClientI,
  _body: string,
): Promise<void> {
  await sendButtonMessage(
    tenant.whatsapp_number,  // phone_number_id — en prod usar el ID de Meta, no el número
    conv.client_whatsapp,
    `¡Hola! Soy el asistente de *${tenant.name}*. ¿Qué querés hacer?`,
    [
      { id: 'book', title: '📅 Sacar turno' },
      { id: 'cancel_appt', title: '❌ Cancelar turno' },
      { id: 'human', title: '💬 Hablar con alguien' },
    ],
  );
  await conv.update({ state: 'GREETING', temp_data: {} });
  
  // Procesar respuesta si ya hay selección
  if (_body === 'book') {
    await conv.update({ state: 'SELECT_SERVICE' });
    const { handleSelectService } = await import('./select-service');
    return handleSelectService(conv, tenant, _client, _body);
  }
  if (_body === 'cancel_appt') {
    await conv.update({ state: 'CANCEL_SELECT' });
    const { handleCancelSelect } = await import('./cancel-select');
    return handleCancelSelect(conv, tenant, _client, _body);
  }
  if (_body === 'human') {
    await conv.update({ state: 'HUMAN_HANDOFF' });
    const { handleHumanHandoff } = await import('./human-handoff');
    return handleHumanHandoff(conv, tenant, _client, _body);
  }
}
```

- [ ] **Step 3: Implementar select-service.ts**

```typescript
// packages/bot/src/states/select-service.ts
import { ConversationState, Tenant, Client, Service } from '@agenturn/db';
import { sendListMessage, sendTextMessage } from '../whatsapp';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleSelectService(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  const services = await Service.findAll({ where: { tenant_id: tenant.id, active: true } });

  // Si el usuario ya eligió un servicio (body = service id)
  const selected = services.find(s => s.id === body);
  if (selected) {
    await conv.update({ state: 'SELECT_PROFESSIONAL', temp_data: { ...conv.temp_data, service_id: selected.id, service_name: selected.name, service_duration: selected.duration_minutes } });
    const { handleSelectProfessional } = await import('./select-professional');
    return handleSelectProfessional(conv, tenant, client, body);
  }

  // Mostrar lista de servicios
  if (services.length === 0) {
    await sendTextMessage(tenant.whatsapp_number, conv.client_whatsapp, 'Lo siento, no hay servicios disponibles en este momento.');
    return;
  }

  await sendListMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    '¿Qué servicio querés reservar?',
    'Ver servicios',
    services.map(s => ({ id: s.id, title: s.name, description: `${s.duration_minutes} min — $${s.price.toLocaleString('es-AR')}` })),
  );
}
```

- [ ] **Step 4: Implementar select-professional.ts**

```typescript
// packages/bot/src/states/select-professional.ts
import { ConversationState, Tenant, Client, Professional } from '@agenturn/db';
import { sendListMessage } from '../whatsapp';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleSelectProfessional(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  const professionals = await Professional.findAll({ where: { tenant_id: tenant.id, active: true } });

  // Si hay solo un profesional, saltar este paso automáticamente
  if (professionals.length === 1) {
    await conv.update({ state: 'SELECT_DATE', temp_data: { ...conv.temp_data, professional_id: professionals[0].id, professional_name: professionals[0].name } });
    const { handleSelectDate } = await import('./select-date');
    return handleSelectDate(conv, tenant, client, body);
  }

  // Si el usuario ya eligió
  const selected = professionals.find(p => p.id === body);
  if (selected) {
    await conv.update({ state: 'SELECT_DATE', temp_data: { ...conv.temp_data, professional_id: selected.id, professional_name: selected.name } });
    const { handleSelectDate } = await import('./select-date');
    return handleSelectDate(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    '¿Con quién querés atenderte?',
    'Ver profesionales',
    professionals.map(p => ({ id: p.id, title: p.name })),
  );
}
```

- [ ] **Step 5: Implementar select-date.ts**

```typescript
// packages/bot/src/states/select-date.ts
import { ConversationState, Tenant, Client, WorkingHours, Appointment, BlockedDate, Service, getAvailableSlots } from '@agenturn/db';
import { sendListMessage, sendTextMessage } from '../whatsapp';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

function formatDateAR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const date = new Date(`${dateStr}T12:00:00`);
  return `${days[date.getDay()]} ${d}/${m}`;
}

export async function handleSelectDate(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  const { professional_id, service_duration } = conv.temp_data as { professional_id: string; service_id: string; service_duration: number };

  // Si el usuario ya eligió una fecha
  if (body && body.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const slots = await getSlotsForDate(professional_id, body, service_duration, tenant.slot_interval_minutes);
    if (slots.length > 0) {
      await conv.update({ state: 'SELECT_TIME', temp_data: { ...conv.temp_data, selected_date: body } });
      const { handleSelectTime } = await import('./select-time');
      return handleSelectTime(conv, tenant, client, body);
    } else {
      // Fecha sin lugar — mostrar otros días disponibles
      await sendTextMessage(tenant.whatsapp_number, conv.client_whatsapp, `Ese día no tengo lugar disponible. Acá te muestro los días que sí tienen:`);
    }
  }

  // Generar próximos 14 días disponibles
  const availableDays = await getAvailableDaysForProfessional(professional_id, service_duration, tenant.slot_interval_minutes);

  if (availableDays.length === 0) {
    await conv.update({ state: 'WAITLIST', temp_data: conv.temp_data });
    const { handleWaitlist } = await import('./waitlist');
    return handleWaitlist(conv, tenant, client, body);
  }

  await sendListMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    '¿Qué día preferís?',
    'Ver días',
    availableDays.map(d => ({ id: d, title: formatDateAR(d) })),
  );
}

async function getSlotsForDate(
  professionalId: string,
  date: string,
  serviceDuration: number,
  slotInterval: number,
) {
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
  const wh = await WorkingHours.findOne({ where: { professional_id: professionalId, day_of_week: dayOfWeek } });
  if (!wh) return [];

  const blocked = await BlockedDate.findOne({ where: { professional_id: professionalId, date } });
  if (blocked) return [];

  const dateStart = new Date(`${date}T00:00:00`);
  const dateEnd = new Date(`${date}T23:59:59`);
  const appointments = await Appointment.findAll({
    where: { professional_id: professionalId, status: 'confirmed' },
    include: [{ model: Service, as: 'service' }],
  });
  const dayAppointments = appointments
    .filter(a => a.datetime >= dateStart && a.datetime <= dateEnd)
    .map(a => ({ datetime: a.datetime, duration_minutes: (a as any).service.duration_minutes }));

  return getAvailableSlots({ start_time: wh.start_time, end_time: wh.end_time }, dayAppointments, serviceDuration, slotInterval, date);
}

async function getAvailableDaysForProfessional(
  professionalId: string,
  serviceDuration: number,
  slotInterval: number,
): Promise<string[]> {
  const available: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const slots = await getSlotsForDate(professionalId, dateStr, serviceDuration, slotInterval);
    if (slots.length > 0) available.push(dateStr);
  }
  return available;
}
```

- [ ] **Step 6: Implementar select-time.ts**

```typescript
// packages/bot/src/states/select-time.ts
import { ConversationState, Tenant, Client } from '@agenturn/db';
import { sendListMessage } from '../whatsapp';
import { getSlotsForDate } from './select-date'; // reusar la función

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleSelectTime(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  const { professional_id, service_duration, selected_date } = conv.temp_data as { professional_id: string; service_duration: number; selected_date: string };

  // Si el usuario eligió un horario (formato "HH:MM")
  if (body.match(/^\d{2}:\d{2}$/)) {
    await conv.update({ state: 'CONFIRM', temp_data: { ...conv.temp_data, selected_time: body } });
    const { handleConfirm } = await import('./confirm');
    return handleConfirm(conv, tenant, client, body);
  }

  const slots = await getSlotsForDate(professional_id, selected_date, service_duration, tenant.slot_interval_minutes);

  await sendListMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    `¿A qué hora? (${selected_date})`,
    'Ver horarios',
    slots.map(s => ({ id: s.start, title: s.start, description: `Termina ${s.end}` })),
  );
}
```

- [ ] **Step 7: Implementar confirm.ts y confirmed.ts**

```typescript
// packages/bot/src/states/confirm.ts
import { ConversationState, Tenant, Client } from '@agenturn/db';
import { sendButtonMessage } from '../whatsapp';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleConfirm(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  const { service_name, professional_name, selected_date, selected_time, service_duration } = conv.temp_data as Record<string, string>;

  if (body === 'confirm_yes') {
    await conv.update({ state: 'CONFIRMED' });
    const { handleConfirmed } = await import('./confirmed');
    return handleConfirmed(conv, tenant, client, body);
  }
  if (body === 'confirm_change') {
    await conv.update({ state: 'SELECT_SERVICE', temp_data: {} });
    const { handleSelectService } = await import('./select-service');
    return handleSelectService(conv, tenant, client, '');
  }

  const [y, m, d] = selected_date.split('-');
  const summary = [
    `*Resumen de tu turno:*`,
    `📋 Servicio: ${service_name}`,
    professional_name ? `👩 Profesional: ${professional_name}` : '',
    `📅 Fecha: ${d}/${m}/${y}`,
    `⏰ Hora: ${selected_time} (${service_duration} min)`,
    `\n¿Confirmás?`,
  ].filter(Boolean).join('\n');

  await sendButtonMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    summary,
    [
      { id: 'confirm_yes', title: '✅ Sí, confirmar' },
      { id: 'confirm_change', title: '✏️ Cambiar algo' },
    ],
  );
}
```

```typescript
// packages/bot/src/states/confirmed.ts
import { ConversationState, Tenant, Client, Appointment } from '@agenturn/db';
import { sendTextMessage } from '../whatsapp';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleConfirmed(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  _body: string,
): Promise<void> {
  const { professional_id, service_id, selected_date, selected_time } = conv.temp_data as Record<string, string>;

  const datetime = new Date(`${selected_date}T${selected_time}:00`);

  await Appointment.create({
    tenant_id: tenant.id,
    professional_id,
    service_id,
    client_id: client.id,
    datetime,
    status: 'confirmed',
  });

  await sendTextMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    `✅ *¡Turno confirmado!*\n\nTe esperamos el ${selected_date} a las ${selected_time} hs.\n\nSi necesitás cancelar, escribí "cancelar turno".`,
  );

  // Limpiar estado
  await conv.update({ state: 'GREETING', temp_data: {} });
}
```

- [ ] **Step 8: Commit**

```bash
git add packages/bot/src/
git commit -m "feat: booking flow state machine (GREETING → CONFIRMED)"
```

---

### Task 6: Flujo de cancelación + handoff + waitlist + TTL

**Files:**
- Create: `packages/bot/src/states/cancel-select.ts`
- Create: `packages/bot/src/states/cancel-confirm.ts`
- Create: `packages/bot/src/states/human-handoff.ts`
- Create: `packages/bot/src/states/waitlist.ts`
- Create: `packages/bot/src/ttl-cleanup.ts`

- [ ] **Step 1: cancel-select.ts**

```typescript
// packages/bot/src/states/cancel-select.ts
import { ConversationState, Tenant, Client, Appointment, Service } from '@agenturn/db';
import { sendListMessage, sendTextMessage } from '../whatsapp';
import { Op } from 'sequelize';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleCancelSelect(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  // Si el usuario eligió un turno a cancelar
  if (body && body !== 'cancel_appt') {
    await conv.update({ state: 'CANCEL_CONFIRM', temp_data: { appointment_id: body } });
    const { handleCancelConfirm } = await import('./cancel-confirm');
    return handleCancelConfirm(conv, tenant, client, body);
  }

  const upcoming = await Appointment.findAll({
    where: { tenant_id: tenant.id, client_id: client.id, status: 'confirmed', datetime: { [Op.gte]: new Date() } },
    include: [{ model: Service }],
    order: [['datetime', 'ASC']],
    limit: 5,
  });

  if (upcoming.length === 0) {
    await sendTextMessage(tenant.whatsapp_number, conv.client_whatsapp, 'No tenés turnos próximos para cancelar.');
    await conv.update({ state: 'GREETING', temp_data: {} });
    return;
  }

  await sendListMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    '¿Cuál turno querés cancelar?',
    'Ver turnos',
    upcoming.map(a => {
      const dt = new Date(a.datetime);
      const label = `${dt.getDate()}/${dt.getMonth() + 1} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}hs`;
      return { id: a.id, title: (a as any).service?.name ?? 'Turno', description: label };
    }),
  );
}
```

- [ ] **Step 2: cancel-confirm.ts**

```typescript
// packages/bot/src/states/cancel-confirm.ts
import { ConversationState, Tenant, Client, Appointment } from '@agenturn/db';
import { sendButtonMessage, sendTextMessage } from '../whatsapp';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleCancelConfirm(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  const { appointment_id } = conv.temp_data as { appointment_id: string };

  if (body === 'cancel_yes') {
    await Appointment.update({ status: 'cancelled' }, { where: { id: appointment_id, client_id: client.id } });
    await sendTextMessage(tenant.whatsapp_number, conv.client_whatsapp, '✅ Turno cancelado. ¡Hasta la próxima!');
    await conv.update({ state: 'GREETING', temp_data: {} });
    return;
  }
  if (body === 'cancel_no') {
    await sendTextMessage(tenant.whatsapp_number, conv.client_whatsapp, 'Perfecto, el turno sigue en pie.');
    await conv.update({ state: 'GREETING', temp_data: {} });
    return;
  }

  await sendButtonMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    '¿Confirmás la cancelación del turno?',
    [
      { id: 'cancel_yes', title: '✅ Sí, cancelar' },
      { id: 'cancel_no', title: '↩️ No, mantener' },
    ],
  );
}
```

- [ ] **Step 3: human-handoff.ts**

```typescript
// packages/bot/src/states/human-handoff.ts
import { ConversationState, Tenant, Client } from '@agenturn/db';
import { sendTextMessage } from '../whatsapp';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleHumanHandoff(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  // Si el cliente escribe "quiero turno", reactivar el bot
  if (body.toLowerCase().includes('quiero turno') || body.toLowerCase().includes('turno')) {
    await conv.update({ state: 'SELECT_SERVICE', temp_data: {} });
    const { handleSelectService } = await import('./select-service');
    return handleSelectService(conv, tenant, client, body);
  }

  // Primera vez en este estado — notificar al cliente
  if (Object.keys(conv.temp_data).length === 0) {
    await sendTextMessage(
      tenant.whatsapp_number,
      conv.client_whatsapp,
      `Un momento, le avisamos a ${tenant.name} que querés hablar. Te responderán a la brevedad.\n\nCuando quieras sacar un turno, escribí "quiero turno".`,
    );
    await conv.update({ temp_data: { notified: true } });
  }
  // Si ya fue notificado, los mensajes quedan sin respuesta del bot — el dueño atiende desde el panel
}
```

- [ ] **Step 4: waitlist.ts**

```typescript
// packages/bot/src/states/waitlist.ts
import { ConversationState, Tenant, Client, Waitlist } from '@agenturn/db';
import { sendButtonMessage, sendTextMessage } from '../whatsapp';

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function handleWaitlist(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  const { service_id } = conv.temp_data as { service_id: string };

  if (body === 'waitlist_yes') {
    await Waitlist.create({ tenant_id: tenant.id, client_id: client.id, service_id });
    await sendTextMessage(tenant.whatsapp_number, conv.client_whatsapp, '✅ Te anotamos en la lista de espera. Te avisamos cuando haya un lugar disponible.');
    await conv.update({ state: 'GREETING', temp_data: {} });
    return;
  }
  if (body === 'waitlist_no') {
    await sendTextMessage(tenant.whatsapp_number, conv.client_whatsapp, 'Entendido. Escribinos cuando quieras para consultar disponibilidad.');
    await conv.update({ state: 'GREETING', temp_data: {} });
    return;
  }

  await sendButtonMessage(
    tenant.whatsapp_number,
    conv.client_whatsapp,
    'Por el momento no hay turnos disponibles en los próximos 14 días. ¿Querés que te avisemos cuando haya lugar?',
    [
      { id: 'waitlist_yes', title: '✅ Sí, avisarme' },
      { id: 'waitlist_no', title: '❌ No, gracias' },
    ],
  );
}
```

- [ ] **Step 5: ttl-cleanup.ts (job periódico)**

```typescript
// packages/bot/src/ttl-cleanup.ts
import { ConversationState } from '@agenturn/db';
import { Op } from 'sequelize';

const TTL_MINUTES = 30;

export async function cleanStaleConversations(): Promise<void> {
  const cutoff = new Date(Date.now() - TTL_MINUTES * 60 * 1000);
  const deleted = await ConversationState.destroy({
    where: { updated_at: { [Op.lt]: cutoff } },
  });
  if (deleted > 0) console.log(`TTL cleanup: ${deleted} conversaciones eliminadas`);
}

export function startTTLCleanup(): void {
  setInterval(() => {
    cleanStaleConversations().catch(console.error);
  }, 5 * 60 * 1000); // cada 5 minutos
}
```

- [ ] **Step 6: Agregar TTL cleanup al index.ts**

```typescript
// packages/bot/src/index.ts
import app from './server';
import { startTTLCleanup } from './ttl-cleanup';

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Bot service running on port ${PORT}`);
  startTTLCleanup();
});
```

- [ ] **Step 7: Commit**

```bash
git add packages/bot/src/
git commit -m "feat: cancellation flow, human handoff, waitlist, TTL cleanup"
```

---

### Task 7: Deploy a Railway

**Files:**
- Create: `packages/bot/Dockerfile`
- Create: `packages/bot/.env.example`

- [ ] **Step 1: Crear Dockerfile**

```dockerfile
# packages/bot/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/db/package*.json ./packages/db/
COPY packages/bot/package*.json ./packages/bot/
RUN npm ci --workspace=packages/db --workspace=packages/bot
COPY packages/db ./packages/db
COPY packages/bot ./packages/bot
COPY tsconfig.base.json .
RUN npm run build:db && cd packages/bot && npm run build
EXPOSE 3001
CMD ["node", "packages/bot/dist/index.js"]
```

- [ ] **Step 2: Crear .env.example del bot**

```bash
# packages/bot/.env.example
DATABASE_URL=postgresql://...
META_VERIFY_TOKEN=tu_token_secreto_para_verificacion
META_ACCESS_TOKEN=tu_meta_access_token
PORT=3001
```

- [ ] **Step 3: Deploy a Railway**

1. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Seleccionar el repo `agenturn`
3. En Variables de entorno: agregar `DATABASE_URL`, `META_VERIFY_TOKEN`, `META_ACCESS_TOKEN`
4. Railway auto-detecta el Dockerfile y hace el build
5. Copiar la URL pública generada (ej: `https://agenturn-bot.up.railway.app`)

- [ ] **Step 4: Configurar webhook en Meta**

En Meta for Developers → tu app → WhatsApp → Configuration:
- Webhook URL: `https://agenturn-bot.up.railway.app/webhook`
- Verify Token: el valor de `META_VERIFY_TOKEN`
- Suscribir al evento: `messages`

- [ ] **Step 5: Commit**

```bash
git add packages/bot/Dockerfile packages/bot/.env.example
git commit -m "chore: Railway deployment config"
```

---

**Plan 2 completado.** El bot está deployado en Railway y recibe mensajes de WhatsApp. Continuar con Plan 3 (Dashboard).
