import { getSessionOrUnauthorized, getTenantId } from '@/lib/session';
import { Appointment, Service } from '@agenturn/db';
import { NextRequest, NextResponse } from 'next/server';
import { Op, fn, col, literal } from 'sequelize';

// fn, col, literal son helpers de Sequelize para escribir funciones SQL (COUNT, etc.)
// Op contiene operadores de comparación: Op.gte = ">=" , Op.between = "BETWEEN", etc.

export async function GET(_req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const tenantId = await getTenantId(session);

  const now = new Date();

  // Primer día del mes actual — para filtrar turnos "de este mes"
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Primer día de la semana actual (domingo = 0) — para filtrar "esta semana"
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  // Promise.all lanza las tres consultas al mismo tiempo en paralelo.
  // Si las hiciéramos en secuencia tardaría 3x más.
  // Desestructuramos el resultado en orden: [primera, segunda, tercera]
  const [monthTotal, weekTotal, cancelledMonth] = await Promise.all([
    // Turnos confirmados desde el inicio del mes
    Appointment.count({
      where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfMonth } },
    }),
    // Turnos confirmados desde el inicio de la semana
    Appointment.count({
      where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfWeek } },
    }),
    // Turnos cancelados desde el inicio del mes
    Appointment.count({
      where: { tenant_id: tenantId, status: 'cancelled', datetime: { [Op.gte]: startOfMonth } },
    }),
  ]);

  // Top 5 servicios más pedidos del mes.
  // attributes: le decimos a Sequelize qué columnas traer.
  //   - 'service_id': el ID del servicio
  //   - fn('COUNT', col('Appointment.id')): cuenta cuántos appointments hay por servicio (SQL: COUNT(Appointment.id))
  // group: agrupa los resultados por servicio — sin esto COUNT no tiene sentido
  // order: ordena de mayor a menor por el count
  // limit: solo los 5 primeros
  // raw: false — para que Sequelize devuelva instancias del modelo (con el include de service)
  const topServices = await Appointment.findAll({
    where: { tenant_id: tenantId, status: 'confirmed', datetime: { [Op.gte]: startOfMonth } },
    attributes: ['service_id', [fn('COUNT', col('Appointment.id')), 'count']],
    include: [{ model: Service, as: 'service', attributes: ['name'] }],
    group: ['service_id', 'service.id'],
    order: [[literal('count'), 'DESC']],
    limit: 5,
    raw: false,
  });

  return NextResponse.json({
    monthTotal,
    weekTotal,
    cancelledMonth,
    // Mapeamos el resultado a un formato más simple para el frontend
    // a.service?.name → el nombre del servicio (del include)
    // +a.dataValues.count → el COUNT viene como string, lo convertimos a número con +
    topServices: topServices.map((a: any) => ({
      name: a.service?.name,
      count: +a.dataValues.count,
    })),
  });
}
