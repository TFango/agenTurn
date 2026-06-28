import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

interface PushSubscriptionAttributes {
  id: string;
  user_id: string;
  tenant_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  created_at: Date;
}

interface PushSubscriptionCreateAttributes {
  user_id: string;
  tenant_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export class PushSubscription extends Model<
  PushSubscriptionAttributes,
  PushSubscriptionCreateAttributes
> {
  declare id: string;
  declare user_id: string;
  declare tenant_id: string;
  declare endpoint: string;
  declare keys: { p256dh: string; auth: string };
  declare created_at: Date;
}

PushSubscription.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: { type: DataTypes.UUID, allowNull: false },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    endpoint: { type: DataTypes.STRING },
    keys: { type: DataTypes.JSONB, allowNull: false },
    created_at: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: "push_subscriptions",
  },
);
