# agenTurn — Plan 1: Infraestructura

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el monorepo con npm workspaces, configurar la conexión a NeonDB, definir todos los modelos Sequelize y construir el motor de scheduling con TDD.

**Architecture:** Monorepo con 3 paquetes: `packages/db` (modelos compartidos), `packages/bot` (Plan 2), `packages/dashboard` (Plan 3). El paquete `db` es importado por los otros dos como `@agenturn/db`.

**Tech Stack:** TypeScript, Sequelize 6, pg (postgres driver), Vitest, NeonDB (Postgres serverless)

---

## Estructura de archivos

```
agenTurn/
├── package.json                          # npm workspaces root
├── tsconfig.base.json                    # tsconfig compartido
├── .env.example
├── packages/
│   ├── db/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── sequelize.ts              # Conexión a NeonDB
│   │       ├── scheduling.ts             # Motor de scheduling (función pura)
│   │       ├── models/
│   │       │   ├── Tenant.ts
│   │       │   ├── User.ts
│   │       │   ├── Professional.ts
│   │       │   ├── Service.ts
│   │       │   ├── WorkingHours.ts
│   │       │   ├── Appointment.ts
│   │       │   ├── BlockedDate.ts
│   │       │   ├── Client.ts
│   │       │   ├── ConversationState.ts
│   │       │   └── Waitlist.ts
│   │       └── index.ts                  # Re-exports
│   └── (bot y dashboard — Planes 2 y 3)
└── vitest.config.ts
```

---

### Task 1: Monorepo setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`

- [ ] **Step 1: Crear el package.json raíz**

```json
// package.json
{
  "name": "agenturn",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build:db": "tsc -p packages/db/tsconfig.json"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: Crear tsconfig base compartido**

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Crear package.json del paquete db**

```json
// packages/db/package.json
{
  "name": "@agenturn/db",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "sequelize": "^6.37.0",
    "pg": "^8.11.0",
    "pg-hstore": "^2.3.4"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 4: Crear tsconfig del paquete db**

```json
// packages/db/tsconfig.json
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

- [ ] **Step 5: Crear .env.example**

```bash
# .env.example
DATABASE_URL=postgresql://user:password@host/agenturn?sslmode=require
TEST_DATABASE_URL=postgresql://user:password@host/agenturn_test?sslmode=require
```

- [ ] **Step 6: Instalar dependencias**

```bash
npm install
```

Expected: `node_modules/` creado en raíz y en `packages/db/`.

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: monorepo setup with npm workspaces"
```

---

### Task 2: Conexión Sequelize + NeonDB

**Files:**
- Create: `packages/db/src/sequelize.ts`
- Create: `packages/db/src/sequelize.test.ts`

- [ ] **Step 1: Escribir el test de conexión**

```typescript
// packages/db/src/sequelize.test.ts
import { describe, it, expect } from 'vitest';
import sequelize from './sequelize';

describe('sequelize connection', () => {
  it('connects to NeonDB successfully', async () => {
    await expect(sequelize.authenticate()).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

```bash
DATABASE_URL=$TEST_DATABASE_URL npx vitest run packages/db/src/sequelize.test.ts
```

Expected: FAIL — `Cannot find module './sequelize'`

- [ ] **Step 3: Implementar la conexión**

```typescript
// packages/db/src/sequelize.ts
import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL env var is required');

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});

export default sequelize;
```

- [ ] **Step 4: Correr el test**

```bash
DATABASE_URL=$TEST_DATABASE_URL npx vitest run packages/db/src/sequelize.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/sequelize.ts packages/db/src/sequelize.test.ts
git commit -m "feat: NeonDB connection via Sequelize"
```

---

### Task 3: Modelos core (Tenant, User, Professional, Service)

**Files:**
- Create: `packages/db/src/models/Tenant.ts`
- Create: `packages/db/src/models/User.ts`
- Create: `packages/db/src/models/Professional.ts`
- Create: `packages/db/src/models/Service.ts`

- [ ] **Step 1: Implementar Tenant**

```typescript
// packages/db/src/models/Tenant.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';

export interface TenantAttributes {
  id: string;
  name: string;
  whatsapp_number: string;
  plan: 'free' | 'pro';
  subscription_status: 'active' | 'inactive' | 'trial';
  slot_interval_minutes: number;
  created_at: Date;
}

type TenantCreation = Optional<TenantAttributes, 'id' | 'created_at' | 'plan' | 'subscription_status' | 'slot_interval_minutes'>;

export class Tenant extends Model<TenantAttributes, TenantCreation> implements TenantAttributes {
  declare id: string;
  declare name: string;
  declare whatsapp_number: string;
  declare plan: 'free' | 'pro';
  declare subscription_status: 'active' | 'inactive' | 'trial';
  declare slot_interval_minutes: number;
  declare created_at: Date;
}

Tenant.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  whatsapp_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  plan: { type: DataTypes.ENUM('free', 'pro'), defaultValue: 'free' },
  subscription_status: { type: DataTypes.ENUM('active', 'inactive', 'trial'), defaultValue: 'trial' },
  slot_interval_minutes: { type: DataTypes.INTEGER, defaultValue: 30 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'tenants', timestamps: false });

export default Tenant;
```

- [ ] **Step 2: Implementar Professional**

```typescript
// packages/db/src/models/Professional.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Tenant from './Tenant';

export interface ProfessionalAttributes {
  id: string;
  tenant_id: string;
  name: string;
  active: boolean;
}

type ProfessionalCreation = Optional<ProfessionalAttributes, 'id' | 'active'>;

export class Professional extends Model<ProfessionalAttributes, ProfessionalCreation> implements ProfessionalAttributes {
  declare id: string;
  declare tenant_id: string;
  declare name: string;
  declare active: boolean;
}

Professional.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenant_id: { type: DataTypes.UUID, allowNull: false, references: { model: Tenant, key: 'id' } },
  name: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'professionals', timestamps: false });

Tenant.hasMany(Professional, { foreignKey: 'tenant_id' });
Professional.belongsTo(Tenant, { foreignKey: 'tenant_id' });

export default Professional;
```

- [ ] **Step 3: Implementar User**

```typescript
// packages/db/src/models/User.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Tenant from './Tenant';
import Professional from './Professional';

export interface UserAttributes {
  id: string;
  tenant_id: string;
  professional_id: string | null;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'professional';
  active: boolean;
  created_at: Date;
}

type UserCreation = Optional<UserAttributes, 'id' | 'created_at' | 'active' | 'professional_id'>;

export class User extends Model<UserAttributes, UserCreation> implements UserAttributes {
  declare id: string;
  declare tenant_id: string;
  declare professional_id: string | null;
  declare name: string;
  declare email: string;
  declare password_hash: string;
  declare role: 'admin' | 'professional';
  declare active: boolean;
  declare created_at: Date;
}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenant_id: { type: DataTypes.UUID, allowNull: false, references: { model: Tenant, key: 'id' } },
  professional_id: { type: DataTypes.UUID, allowNull: true, references: { model: Professional, key: 'id' } },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'professional'), allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'users', timestamps: false });

Tenant.hasMany(User, { foreignKey: 'tenant_id' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id' });
User.belongsTo(Professional, { foreignKey: 'professional_id' });

export default User;
```

- [ ] **Step 4: Implementar Service**

```typescript
// packages/db/src/models/Service.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Tenant from './Tenant';

export interface ServiceAttributes {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
}

type ServiceCreation = Optional<ServiceAttributes, 'id' | 'active'>;

export class Service extends Model<ServiceAttributes, ServiceCreation> implements ServiceAttributes {
  declare id: string;
  declare tenant_id: string;
  declare name: string;
  declare duration_minutes: number;
  declare price: number;
  declare active: boolean;
}

Service.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenant_id: { type: DataTypes.UUID, allowNull: false, references: { model: Tenant, key: 'id' } },
  name: { type: DataTypes.STRING, allowNull: false },
  duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'services', timestamps: false });

Tenant.hasMany(Service, { foreignKey: 'tenant_id' });
Service.belongsTo(Tenant, { foreignKey: 'tenant_id' });

export default Service;
```

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/models/
git commit -m "feat: core Sequelize models (Tenant, User, Professional, Service)"
```

---

### Task 4: Modelos de agenda y bot

**Files:**
- Create: `packages/db/src/models/WorkingHours.ts`
- Create: `packages/db/src/models/Appointment.ts`
- Create: `packages/db/src/models/BlockedDate.ts`
- Create: `packages/db/src/models/Client.ts`
- Create: `packages/db/src/models/ConversationState.ts`
- Create: `packages/db/src/models/Waitlist.ts`
- Create: `packages/db/src/index.ts`

- [ ] **Step 1: Implementar WorkingHours**

```typescript
// packages/db/src/models/WorkingHours.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Professional from './Professional';

export interface WorkingHoursAttributes {
  id: string;
  professional_id: string;
  day_of_week: number; // 0=Domingo, 1=Lunes ... 6=Sábado
  start_time: string;  // "09:00"
  end_time: string;    // "19:00"
}

type WorkingHoursCreation = Optional<WorkingHoursAttributes, 'id'>;

export class WorkingHours extends Model<WorkingHoursAttributes, WorkingHoursCreation> implements WorkingHoursAttributes {
  declare id: string;
  declare professional_id: string;
  declare day_of_week: number;
  declare start_time: string;
  declare end_time: string;
}

WorkingHours.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  professional_id: { type: DataTypes.UUID, allowNull: false, references: { model: Professional, key: 'id' } },
  day_of_week: { type: DataTypes.INTEGER, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
}, { sequelize, tableName: 'working_hours', timestamps: false });

Professional.hasMany(WorkingHours, { foreignKey: 'professional_id' });
WorkingHours.belongsTo(Professional, { foreignKey: 'professional_id' });

export default WorkingHours;
```

- [ ] **Step 2: Implementar Appointment**

```typescript
// packages/db/src/models/Appointment.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Tenant from './Tenant';
import Professional from './Professional';
import Service from './Service';

export interface AppointmentAttributes {
  id: string;
  tenant_id: string;
  professional_id: string;
  service_id: string;
  client_id: string;
  datetime: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

type AppointmentCreation = Optional<AppointmentAttributes, 'id' | 'status'>;

export class Appointment extends Model<AppointmentAttributes, AppointmentCreation> implements AppointmentAttributes {
  declare id: string;
  declare tenant_id: string;
  declare professional_id: string;
  declare service_id: string;
  declare client_id: string;
  declare datetime: Date;
  declare status: 'pending' | 'confirmed' | 'cancelled';
}

Appointment.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenant_id: { type: DataTypes.UUID, allowNull: false, references: { model: Tenant, key: 'id' } },
  professional_id: { type: DataTypes.UUID, allowNull: false, references: { model: Professional, key: 'id' } },
  service_id: { type: DataTypes.UUID, allowNull: false, references: { model: Service, key: 'id' } },
  client_id: { type: DataTypes.UUID, allowNull: false },
  datetime: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'), defaultValue: 'confirmed' },
}, { sequelize, tableName: 'appointments', timestamps: false });

Tenant.hasMany(Appointment, { foreignKey: 'tenant_id' });
Appointment.belongsTo(Service, { foreignKey: 'service_id' });
Appointment.belongsTo(Professional, { foreignKey: 'professional_id' });

export default Appointment;
```

- [ ] **Step 3: Implementar BlockedDate, Client, ConversationState, Waitlist**

```typescript
// packages/db/src/models/BlockedDate.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Professional from './Professional';

export interface BlockedDateAttributes {
  id: string;
  professional_id: string;
  date: string; // "2026-05-01"
  reason: string | null;
}

export class BlockedDate extends Model<BlockedDateAttributes, Optional<BlockedDateAttributes, 'id' | 'reason'>> implements BlockedDateAttributes {
  declare id: string;
  declare professional_id: string;
  declare date: string;
  declare reason: string | null;
}

BlockedDate.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  professional_id: { type: DataTypes.UUID, allowNull: false, references: { model: Professional, key: 'id' } },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  reason: { type: DataTypes.STRING, allowNull: true },
}, { sequelize, tableName: 'blocked_dates', timestamps: false });

Professional.hasMany(BlockedDate, { foreignKey: 'professional_id' });
BlockedDate.belongsTo(Professional, { foreignKey: 'professional_id' });

export default BlockedDate;
```

```typescript
// packages/db/src/models/Client.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Tenant from './Tenant';

export interface ClientAttributes {
  id: string;
  tenant_id: string;
  name: string;
  whatsapp_number: string;
  notes: string | null;
  created_at: Date;
}

export class Client extends Model<ClientAttributes, Optional<ClientAttributes, 'id' | 'created_at' | 'notes'>> implements ClientAttributes {
  declare id: string;
  declare tenant_id: string;
  declare name: string;
  declare whatsapp_number: string;
  declare notes: string | null;
  declare created_at: Date;
}

Client.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenant_id: { type: DataTypes.UUID, allowNull: false, references: { model: Tenant, key: 'id' } },
  name: { type: DataTypes.STRING, allowNull: false },
  whatsapp_number: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'clients', timestamps: false });

Tenant.hasMany(Client, { foreignKey: 'tenant_id' });
Client.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Appointment.belongsTo(Client, { foreignKey: 'client_id' });

export default Client;
```

```typescript
// packages/db/src/models/ConversationState.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Tenant from './Tenant';

export type BotState =
  | 'GREETING' | 'SELECT_SERVICE' | 'SELECT_PROFESSIONAL'
  | 'SELECT_DATE' | 'SELECT_TIME' | 'CONFIRM' | 'CONFIRMED'
  | 'CANCEL_SELECT' | 'CANCEL_CONFIRM' | 'HUMAN_HANDOFF' | 'WAITLIST';

export interface ConversationStateAttributes {
  id: string;
  tenant_id: string;
  client_whatsapp: string;
  state: BotState;
  temp_data: Record<string, unknown>;
  updated_at: Date;
}

export class ConversationState extends Model<ConversationStateAttributes, Optional<ConversationStateAttributes, 'id' | 'updated_at' | 'temp_data'>> implements ConversationStateAttributes {
  declare id: string;
  declare tenant_id: string;
  declare client_whatsapp: string;
  declare state: BotState;
  declare temp_data: Record<string, unknown>;
  declare updated_at: Date;
}

ConversationState.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenant_id: { type: DataTypes.UUID, allowNull: false, references: { model: Tenant, key: 'id' } },
  client_whatsapp: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  temp_data: { type: DataTypes.JSONB, defaultValue: {} },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'conversation_states', timestamps: false });

export default ConversationState;
```

```typescript
// packages/db/src/models/Waitlist.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../sequelize';
import Tenant from './Tenant';
import Client from './Client';
import Service from './Service';

export interface WaitlistAttributes {
  id: string;
  tenant_id: string;
  client_id: string;
  service_id: string;
  created_at: Date;
}

export class Waitlist extends Model<WaitlistAttributes, Optional<WaitlistAttributes, 'id' | 'created_at'>> implements WaitlistAttributes {
  declare id: string;
  declare tenant_id: string;
  declare client_id: string;
  declare service_id: string;
  declare created_at: Date;
}

Waitlist.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenant_id: { type: DataTypes.UUID, allowNull: false, references: { model: Tenant, key: 'id' } },
  client_id: { type: DataTypes.UUID, allowNull: false, references: { model: Client, key: 'id' } },
  service_id: { type: DataTypes.UUID, allowNull: false, references: { model: Service, key: 'id' } },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'waitlist', timestamps: false });

export default Waitlist;
```

- [ ] **Step 4: Crear el index.ts del paquete db**

```typescript
// packages/db/src/index.ts
export { default as sequelize } from './sequelize';
export { default as Tenant } from './models/Tenant';
export { default as User } from './models/User';
export { default as Professional } from './models/Professional';
export { default as Service } from './models/Service';
export { default as WorkingHours } from './models/WorkingHours';
export { default as Appointment } from './models/Appointment';
export { default as BlockedDate } from './models/BlockedDate';
export { default as Client } from './models/Client';
export { default as ConversationState } from './models/ConversationState';
export { default as Waitlist } from './models/Waitlist';
export { getAvailableSlots } from './scheduling';
export type { BotState } from './models/ConversationState';
export type { TenantAttributes } from './models/Tenant';
export type { UserAttributes } from './models/User';
export type { AppointmentAttributes } from './models/Appointment';
export type { ClientAttributes } from './models/Client';
export type { ConversationStateAttributes } from './models/ConversationState';
```

- [ ] **Step 5: Sincronizar esquema con NeonDB**

```typescript
// packages/db/src/sync.ts  (script de uso único, no parte del bundle)
import './models/Tenant';
import './models/User';
import './models/Professional';
import './models/Service';
import './models/WorkingHours';
import './models/Appointment';
import './models/BlockedDate';
import './models/Client';
import './models/ConversationState';
import './models/Waitlist';
import sequelize from './sequelize';

sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Tablas sincronizadas con NeonDB');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error al sincronizar:', err);
  process.exit(1);
});
```

Correr:
```bash
DATABASE_URL=<tu_neondb_url> npx ts-node packages/db/src/sync.ts
```

Expected: `✅ Tablas sincronizadas con NeonDB`

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/
git commit -m "feat: todos los modelos Sequelize + sync a NeonDB"
```

---

### Task 5: Motor de scheduling (TDD)

**Files:**
- Create: `packages/db/src/scheduling.ts`
- Create: `packages/db/src/scheduling.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// packages/db/src/scheduling.test.ts
import { describe, it, expect } from 'vitest';
import { getAvailableSlots } from './scheduling';

const workingHours = { start_time: '09:00', end_time: '19:00' };

describe('getAvailableSlots', () => {
  it('returns all slots when no appointments exist', () => {
    const slots = getAvailableSlots(workingHours, [], 40, 30, '2026-05-05');
    // 9:00 a 19:00, cada 30 min, para un servicio de 40 min
    // Último slot válido: 18:20 (termina 19:00)
    expect(slots[0].start).toBe('09:00');
    expect(slots[0].end).toBe('09:40');
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every(s => s.end <= '19:00')).toBe(true);
  });

  it('blocks slots that would overlap with an existing appointment', () => {
    // Turno confirmado: corte (40 min) a las 13:00
    const existing = [{
      datetime: new Date('2026-05-05T13:00:00'),
      duration_minutes: 40,
    }];
    const slots = getAvailableSlots(workingHours, existing, 90, 30, '2026-05-05');
    const startTimes = slots.map(s => s.start);
    // 12:00 terminaría 13:30 → pisa el turno de 13:00
    expect(startTimes).not.toContain('12:00');
    // 12:30 terminaría 14:00 → pisa el turno de 13:00-13:40
    expect(startTimes).not.toContain('12:30');
    // 11:00 terminaría 12:30 → no pisa
    expect(startTimes).toContain('11:00');
    // 13:30 terminaría 15:00 → no pisa (turno termina 13:40, slot empieza 13:30 → pisa)
    expect(startTimes).not.toContain('13:30');
    // 14:00 terminaría 15:30 → no pisa (turno termina 13:40)
    expect(startTimes).toContain('14:00');
  });

  it('handles the example from the spec: mechado with two cortes', () => {
    const existing = [
      { datetime: new Date('2026-05-05T13:00:00'), duration_minutes: 40 },
      { datetime: new Date('2026-05-05T14:00:00'), duration_minutes: 40 },
    ];
    const slots = getAvailableSlots(workingHours, existing, 90, 30, '2026-05-05');
    const startTimes = slots.map(s => s.start);
    expect(startTimes).toContain('09:00'); // termina 10:30 ✅
    expect(startTimes).toContain('11:00'); // termina 12:30 ✅
    expect(startTimes).not.toContain('12:00'); // termina 13:30 ❌
    expect(startTimes).toContain('14:40'); // termina 16:10 ✅
  });

  it('returns empty array when day is fully blocked', () => {
    const existing = [
      { datetime: new Date('2026-05-05T09:00:00'), duration_minutes: 600 }, // 10 hs
    ];
    const slots = getAvailableSlots(workingHours, existing, 40, 30, '2026-05-05');
    expect(slots).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Correr para verificar que falla**

```bash
npx vitest run packages/db/src/scheduling.test.ts
```

Expected: FAIL — `Cannot find module './scheduling'`

- [ ] **Step 3: Implementar el motor de scheduling**

```typescript
// packages/db/src/scheduling.ts

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "09:40"
}

export interface ExistingAppointment {
  datetime: Date;
  duration_minutes: number;
}

export interface WorkingHoursRange {
  start_time: string;
  end_time: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function getAvailableSlots(
  workingHours: WorkingHoursRange,
  existingAppointments: ExistingAppointment[],
  serviceDurationMinutes: number,
  slotIntervalMinutes: number,
  date: string, // "2026-05-05" — usado para comparar con datetimes
): TimeSlot[] {
  const startMinutes = timeToMinutes(workingHours.start_time);
  const endMinutes = timeToMinutes(workingHours.end_time);
  const slots: TimeSlot[] = [];

  for (let m = startMinutes; m + serviceDurationMinutes <= endMinutes; m += slotIntervalMinutes) {
    slots.push({ start: minutesToTime(m), end: minutesToTime(m + serviceDurationMinutes) });
  }

  // Filtrar los slots del mismo día
  const dayAppointments = existingAppointments.filter(appt => {
    const apptDateStr = appt.datetime.toISOString().split('T')[0];
    return apptDateStr === date;
  });

  return slots.filter(slot => {
    const slotStart = timeToMinutes(slot.start);
    const slotEnd = timeToMinutes(slot.end);
    return !dayAppointments.some(appt => {
      const apptStart = appt.datetime.getHours() * 60 + appt.datetime.getMinutes();
      const apptEnd = apptStart + appt.duration_minutes;
      return slotStart < apptEnd && slotEnd > apptStart;
    });
  });
}
```

- [ ] **Step 4: Correr los tests**

```bash
npx vitest run packages/db/src/scheduling.test.ts
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/scheduling.ts packages/db/src/scheduling.test.ts
git commit -m "feat: scheduling engine with TDD — slot conflict detection"
```

---

**Plan 1 completado.** El paquete `@agenturn/db` está listo. Continuar con Plan 2 (Bot Service) o Plan 3 (Dashboard).
