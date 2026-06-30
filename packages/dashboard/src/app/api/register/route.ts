import { tenants, users, db } from "@agenturn/db";
import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { name, email, password, localName } = body;

  if (!name || !email || !password || !localName) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios." },
      { status: 400 },
    );
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((r) => r[0]);

  if (existingUser) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email." },
      { status: 409 },
    );
  }

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: localName,
      whatsapp_number: "",
      phone_number_id: "",
      plan: "free",
      subscription_status: "active",
      slot_interval_minutes: 0,
    })
    .returning();

  const hash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    tenant_id: tenant.id,
    name,
    email,
    password_hash: hash,
    role: "admin",
    active: true,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
