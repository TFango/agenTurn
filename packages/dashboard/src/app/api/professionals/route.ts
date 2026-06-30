import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import {
  db,
  professionals,
  professionalCategories,
  serviceCategories,
} from "@agenturn/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }

  const tenantId = await getTenantId(session);

  const rows = await db
    .select({
      id: professionals.id,
      name: professionals.name,
      active: professionals.active,
      tenant_id: professionals.tenant_id,
      categoryId: serviceCategories.id,
      categoryName: serviceCategories.name,
    })
    .from(professionals)
    .leftJoin(
      professionalCategories,
      eq(professionalCategories.professional_id, professionals.id),
    )
    .leftJoin(
      serviceCategories,
      eq(serviceCategories.id, professionalCategories.category_id),
    )
    .where(eq(professionals.tenant_id, tenantId));

  const grouped = rows.reduce(
    (acc, row) => {
      if (!acc[row.id]) {
        acc[row.id] = {
          id: row.id,
          name: row.name,
          active: row.active,
          tenant_id: row.tenant_id,
          serviceCategories: [],
        };
      }
      if (row.categoryId) {
        acc[row.id].serviceCategories.push({
          id: row.categoryId,
          name: row.categoryName,
        });
      }
      return acc;
    },
    {} as Record<
      string,
      {
        id: string;
        name: string | null;
        active: boolean | null;
        tenant_id: string | null;
        serviceCategories: { id: string; name: string | null }[];
      }
    >,
  );

  return NextResponse.json(Object.values(grouped));
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();

  if (error) {
    return error;
  }
  const tenantId = await getTenantId(session);
  const body = await req.json();

  const { name, categoryIds } = body;

  if (!name) {
    return NextResponse.json(
      { message: "El nombre del profesional es obligatorio" },
      { status: 400 },
    );
  }

  const [profesional] = await db
    .insert(professionals)
    .values({ tenant_id: tenantId, name, active: true })
    .returning();

  if (categoryIds?.length > 0) {
    await db.insert(professionalCategories).values(
      categoryIds.map((categoryId: string) => ({
        professional_id: profesional.id,
        category_id: categoryId,
      })),
    );
  }

  return NextResponse.json(profesional);
}
