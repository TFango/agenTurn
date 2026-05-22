import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface BlockedDateAttributes {
  id: string;
  professional_id: string;
  date: Date;
  reason: string;
}

export class BlockedDate extends Model<
  BlockedDateAttributes,
  BlockedDateAttributes
> {
  declare id: string;
  declare professional_id: string;
  declare date: Date;
  declare reason: string;
}

BlockedDate.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    professional_id: { type: DataTypes.UUID },
    date: { type: DataTypes.DATE },
    reason: { type: DataTypes.STRING },
  },
  { sequelize, tableName: "blocked_dates" },
);
