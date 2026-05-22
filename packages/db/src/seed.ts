import bcrypt from 'bcryptjs';
import { sequelize } from './connection';
import './models/associations';
import { Tenant } from './models/core/Tenant';
import { Professional } from './models/core/Professional';
import { Service } from './models/core/Service';
import { Client } from './models/client/Client';
import { User } from './models/users/User';
import { Appointment } from './models/calendar/Appointment';

async function main() {
  const tenant = await Tenant.create({
    name: 'Studio Salvia',
    whatsapp_number: '+5491112345678',
    plan: 'pro',
    subscription_status: 'active',
    slot_interval_minutes: 30,
  });

  const professional = await Professional.create({
    id: crypto.randomUUID(),
    tenant_id: tenant.id,
    name: 'Analía',
    active: true,
  });

  const service = await Service.create({
    tenant_id: tenant.id,
    name: 'Corte',
    duration_minutes: 45,
    price: 3500,
    active: true,
  });

  const client = await Client.create({
    id: crypto.randomUUID(),
    tenant_id: tenant.id,
    name: 'Valentina Gómez',
    whatsapp_number: '+5491187654321',
    notes: '',
    created_at: new Date(),
  });

  const password_hash = await bcrypt.hash('admin123', 10);
  await User.create({
    tenant_id: tenant.id,
    professional_id: null,
    name: 'Admin',
    email: 'admin@studiosalvia.com',
    password_hash,
    role: 'admin',
    active: true,
  });

  const today = new Date();
  today.setHours(9, 0, 0, 0);

  await Appointment.create({
    id: crypto.randomUUID(),
    tenant_id: tenant.id,
    professional_id: professional.id,
    service_id: service.id,
    client_id: client.id,
    datetime: today,
    status: 'confirmed',
  });

  console.log('Seed completado.');
  console.log(`Email: admin@studiosalvia.com`);
  console.log(`Password: admin123`);

  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
