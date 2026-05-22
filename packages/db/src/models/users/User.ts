import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface UserAttributes {
  id: string;
  tenant_id: string;
  professional_id: string | null;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "professional";
  active: boolean;
  created_at: Date;
}

export class User extends Model<
  UserAttributes,
  Omit<UserAttributes, "id" | "created_at">
> {
  declare id: string;
  declare tenant_id: string;
  declare professional_id: string | null;
  declare name: string;
  declare email: string;
  declare password_hash: string;
  declare role: "admin" | "professional";
  declare active: boolean;
  declare created_at: Date;
}

User.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { type: DataTypes.UUID },
    professional_id: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    password_hash: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM("admin", "professional") },
    active: { type: DataTypes.BOOLEAN },
    created_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "users" },
);
