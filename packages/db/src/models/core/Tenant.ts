import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface TenantAttributes {
  id: string;
  name: string;
  whatsapp_number: string;
  plan: "free" | "pro";
  subscription_status: "active" | "inactive" | "trial";
  slot_interval_minutes: number;
  created_at: Date;
}

export class Tenant extends Model<TenantAttributes, TenantAttributes> {
  declare id: string;
  declare name: string;
  declare whatsapp_number: string;
  declare plan: "free" | "pro";
  declare subscription_status: "active" | "inactive" | "trial";
  declare slot_interval_minutes: number;
  declare created_at: Date;
}

Tenant.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    name: { type: DataTypes.STRING },
    whatsapp_number: { type: DataTypes.STRING },
    plan: { type: DataTypes.ENUM("free", "pro"), allowNull: false },
    subscription_status: {
      type: DataTypes.ENUM("active", "inactive", "trial"),
      allowNull: false,
    },
    slot_interval_minutes: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "tenants" },
);
