import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface WorkingHoursAttributes {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export class WorkingHours extends Model<
  WorkingHoursAttributes,
  WorkingHoursAttributes
> {
  declare id: string;
  declare professional_id: string;
  declare day_of_week: number;
  declare start_time: string;
  declare end_time: string;
}

WorkingHours.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    professional_id: { type: DataTypes.UUID },
    day_of_week: { type: DataTypes.INTEGER },
    start_time: { type: DataTypes.TIME },
    end_time: { type: DataTypes.TIME },
  },
  { sequelize, tableName: "working_hours" },
);
