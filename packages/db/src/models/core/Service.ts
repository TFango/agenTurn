import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface ServiceAttributes {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
}

export class Service extends Model<ServiceAttributes, Omit<ServiceAttributes, "id">> {
  declare id: string;
  declare tenant_id: string;
  declare name: string;
  declare duration_minutes: number;
  declare price: number;
  declare active: boolean;
}

Service.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    tenant_id: { type: DataTypes.UUID },
    name: { type: DataTypes.STRING },
    duration_minutes: { type: DataTypes.INTEGER },
    price: { type: DataTypes.INTEGER },
    active: { type: DataTypes.BOOLEAN },
  },
  { sequelize, tableName: "services" },
);
