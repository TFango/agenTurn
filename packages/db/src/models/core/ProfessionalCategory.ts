import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../connection";

interface ProfessionalCategoryAttributes {
  id: string;
  professional_id: string;
  category_id: string;
}

interface ProfessionalCategoryCreateAttributes {
  professional_id: string;
  category_id: string;
}

export class ProfessionalCategory extends Model<
  ProfessionalCategoryAttributes,
  ProfessionalCategoryCreateAttributes
> {
  declare id: string;
  declare professional_id: string;
  declare category_id: string;
}

ProfessionalCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    professional_id: { type: DataTypes.UUID, allowNull: false },
    category_id: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    tableName: "professional_categories",
  },
);
