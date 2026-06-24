import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface ServiceAttributes {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  category_id: string | null;
}

export class Service extends Model<
  ServiceAttributes,
  Omit<ServiceAttributes, "id">
> {
  declare id: string;
  declare tenant_id: string;
  declare name: string;
  declare duration_minutes: number;
  declare price: number;
  declare active: boolean;
  declare category_id: string | null;
}

Service.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tenant_id: { type: DataTypes.UUID },
    name: { type: DataTypes.STRING },
    duration_minutes: { type: DataTypes.INTEGER },
    price: { type: DataTypes.INTEGER },
    active: { type: DataTypes.BOOLEAN },
    category_id: { type: DataTypes.UUID, allowNull: true },
  },
  { sequelize, tableName: "services" },
);
