import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface ServiceCategoryAttributes {
  id: string;
  name: string;
  tenant_id: string;
  created_at: Date;
}

interface ServiceCategoryCreateAttributes {
  name: string;
  tenant_id: string;
}

export class ServiceCategory extends Model<
  ServiceCategoryAttributes,
  ServiceCategoryCreateAttributes
> {
  declare id: string;
  declare name: string;
  declare tenant_id: string;
  declare created_at: Date;
}

ServiceCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: { type: DataTypes.STRING },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    created_at: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: "service_categories",
  },
);
