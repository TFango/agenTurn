import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface ProfessionalAttributes {
  id: string;
  tenant_id: string;
  name: string;
  active: boolean;
}

export class Professional extends Model<
  ProfessionalAttributes,
  ProfessionalAttributes
> {
  declare id: string;
  declare tenant_id: string;
  declare name: string;
  declare active: boolean;
}

Professional.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING },
    active: { type: DataTypes.BOOLEAN },
  },
  { sequelize, tableName: "professionals" },
);
