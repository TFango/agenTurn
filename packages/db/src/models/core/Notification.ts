import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

type NotificationType =
  | "new_appointment"
  | "cancelled_appointment"
  | "human_handoff";

interface NotificationAttributes {
  id: string;
  tenant_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: Date;
}

interface NotificationCreationAttributes {
  tenant_id: string;
  type: NotificationType;
  title: string;
  body: string;
}

export class Notification extends Model<
  NotificationAttributes,
  NotificationCreationAttributes
> {
  declare id: string;
  declare tenant_id: string;
  declare type: NotificationType;
  declare title: string;
  declare body: string;
  declare read: boolean;
  declare created_at: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        "new_appointment",
        "cancelled_appointment",
        "human_handoff",
      ),
    },

    title: { type: DataTypes.STRING },
    body: { type: DataTypes.STRING },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: "notifications",
  },
);
