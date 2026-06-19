import { Client, ConversationState, Tenant } from "@agenturn/db";
import { handleGreeting } from "./states/greeting";
import { handleSelectService } from "./states/select-service";
import { handleSelectProfessional } from "./states/select-professional";
import { handleSelectDate } from "./states/select-date";
import { handleSelectTime } from "./states/select-time";
import { handleConfirm } from "./states/confirm";
import { handleConfirmed } from "./states/confirmed";
import { handleCancelSelect } from "./states/cancel-select";
import { handleCancelConfirm } from "./states/cancel-confirm";
import { handleHumanHandoff } from "./states/human-handoff";
import { handleWaitlist } from "./states/waitlist";

type ConvState = InstanceType<typeof ConversationState>;
type TenantI = InstanceType<typeof Tenant>;
type ClientI = InstanceType<typeof Client>;

export async function dispatchState(
  conv: ConvState,
  tenant: TenantI,
  client: ClientI,
  body: string,
): Promise<void> {
  await conv.update({ updated_at: new Date() });

  switch (conv.state) {
    case "greeting":            return handleGreeting(conv, tenant, client, body);
    case "select_service":      return handleSelectService(conv, tenant, client, body);
    case "select_professional": return handleSelectProfessional(conv, tenant, client, body);
    case "select_date":         return handleSelectDate(conv, tenant, client, body);
    case "select_time":         return handleSelectTime(conv, tenant, client, body);
    case "confirm":             return handleConfirm(conv, tenant, client, body);
    case "confirmed":           return handleConfirmed(conv, tenant, client, body);
    case "cancel_select":       return handleCancelSelect(conv, tenant, client, body);
    case "cancel_confirm":      return handleCancelConfirm(conv, tenant, client, body);
    case "human_handoff":       return handleHumanHandoff(conv, tenant, client, body);
    case "waitlist":            return handleWaitlist(conv, tenant, client, body);
    default:
      await conv.update({ state: "greeting", temp_data: {} });
      return handleGreeting(conv, tenant, client, body);
  }
}
