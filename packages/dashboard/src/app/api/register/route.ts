import { Tenant, User } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { name, email, password, localName } = body;

  if (!name || !email || !password || !localName) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
  }

  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    return NextResponse.json({ error: 'Ya existe una cuenta con ese email.' }, { status: 409 });
  }

  const tenant = await Tenant.create({
    name: localName,
    whatsapp_number: '',
    plan: 'free',
    subscription_status: 'active',
    slot_interval_minutes: 0,
  });

  const hash = await bcrypt.hash(password, 10);

  await User.create({
    tenant_id: tenant.id,
    name,
    email,
    password_hash: hash,
    role: 'admin',
    active: true,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
