import { getSessionOrUnauthorized, getTenantId } from "@/lib/session";
import { clients, db, professionalCategories, professionals, serviceCategories, services } from "@agenturn/db";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = await getTenantId(session);

  const [profRows, servicesRows, clientsRows] = await Promise.all([
    db
      .select({
        id: professionals.id,
        name: professionals.name,
        active: professionals.active,
        tenant_id: professionals.tenant_id,
        categoryId: serviceCategories.id,
        categoryName: serviceCategories.name,
      })
      .from(professionals)
      .leftJoin(professionalCategories, eq(professionalCategories.professional_id, professionals.id))
      .leftJoin(serviceCategories, eq(serviceCategories.id, professionalCategories.category_id))
      .where(eq(professionals.tenant_id, tenantId)),
    db.select().from(services).where(eq(services.tenant_id, tenantId)),
    db.select().from(clients).where(eq(clients.tenant_id, tenantId)).orderBy(desc(clients.created_at)),
  ]);

  const grouped = profRows.reduce((acc, row) => {
    if (!acc[row.id]) {
      acc[row.id] = { id: row.id, name: row.name, active: row.active, tenant_id: row.tenant_id, serviceCategories: [] };
    }
    if (row.categoryId) {
      acc[row.id].serviceCategories.push({ id: row.categoryId, name: row.categoryName });
    }
    return acc;
  }, {} as Record<string, { id: string; name: string | null; active: boolean | null; tenant_id: string | null; serviceCategories: { id: string; name: string | null }[] }>);

  return NextResponse.json({
    professionals: Object.values(grouped),
    services: servicesRows,
    clients: clientsRows,
  });
}
