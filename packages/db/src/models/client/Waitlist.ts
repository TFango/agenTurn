import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface WaitlistAttributes {
  id: string;
  tenant_id: string;
  client_id: string;
  service_id: string;
  created_at: Date;
}

export class WaitList extends Model<WaitlistAttributes, WaitlistAttributes> {
  declare id: string;
  declare tenant_id: string;
  declare client_id: string;
  declare service_id: string;
  declare created_at: Date;
}

WaitList.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    tenant_id: { type: DataTypes.UUID },
    client_id: { type: DataTypes.UUID },
    service_id: { type: DataTypes.UUID },
    created_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "waitlist" },
);
