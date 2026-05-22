import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface AppointmentAttributes {
  id: string;
  tenant_id: string;
  professional_id: string;
  service_id: string;
  client_id: string;
  datetime: Date;
  status: "pending" | "confirmed" | "cancelled";
}

export class Appointment extends Model<
  AppointmentAttributes,
  AppointmentAttributes
> {
  declare id: string;
  declare tenant_id: string;
  declare professional_id: string;
  declare service_id: string;
  declare client_id: string;
  declare datetime: string;
  declare status: "pending" | "confirmed" | "cancelled";
}

Appointment.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { type: DataTypes.UUID },
    professional_id: { type: DataTypes.UUID },
    service_id: { type: DataTypes.UUID },
    client_id: { type: DataTypes.UUID },
    datetime: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM("pending", "confirmed", "cancelled") },
  },
  { sequelize, tableName: "appointments" },
);
