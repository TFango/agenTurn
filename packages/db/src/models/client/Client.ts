import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface ClientAtributtes {
  id: string;
  tenant_id: string;
  name: string;
  whatsapp_number: string;
  notes: string;
  created_at: Date;
}

interface ClientCreationAttributes {
  tenant_id: string;
  name: string;
  whatsapp_number: string;
  notes?: string;
  created_at?: Date;
}

export class Client extends Model<ClientAtributtes, ClientCreationAttributes> {
  declare id: string;
  declare tenant_id: string;
  declare name: string;
  declare whatsapp_number: string;
  declare notes: string;
  declare created_at: Date;
}

Client.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { type: DataTypes.UUID },
    name: { type: DataTypes.STRING },
    whatsapp_number: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "clients" },
);
