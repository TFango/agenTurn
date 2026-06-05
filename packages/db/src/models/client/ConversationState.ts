import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection";

type ConversationStateEnum =
  | "greeting"
  | "select_service"
  | "select_professional"
  | "select_date"
  | "select_time"
  | "confirm"
  | "confirmed"
  | "cancel_select"
  | "cancel_confirm"
  | "human_handoff"
  | "waitlist";

interface ConversationStateAttributes {
  id: string;
  tenant_id: string;
  client_whatsapp: string;
  state: ConversationStateEnum;
  temp_data: Record<string, unknown>;
  updated_at: Date;
}

export class ConversationState extends Model<
  ConversationStateAttributes,
  ConversationStateAttributes
> {
  declare id: string;
  declare tenant_id: string;
  declare client_whatsapp: string;
  declare state: ConversationStateEnum;
  declare temp_data: Record<string, unknown>;
  declare updated_at: Date;
}

ConversationState.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { type: DataTypes.UUID },
    client_whatsapp: { type: DataTypes.STRING },
    state: {
      type: DataTypes.ENUM(
        "greeting",
        "select_service",
        "select_professional",
        "select_date",
        "select_time",
        "confirm",
        "confirmed",
        "cancel_select",
        "cancel_confirm",
        "human_handoff",
        "waitlist",
      ),
    },
    temp_data: { type: DataTypes.JSONB },
    updated_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "conversation_states" },
);
