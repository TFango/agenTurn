import { conversationStates, db } from "@agenturn/db";
import type { Client, ConversationState, Tenant } from "@agenturn/db";
import { eq } from "drizzle-orm";
import { handleGreeting } from "./states/greeting";
import { handleSelectCategory } from "./states/select-category";
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

export async function dispatchState(
  conv: ConversationState,
  tenant: Tenant,
  client: Client,
  body: string,
): Promise<void> {
  await db
    .update(conversationStates)
    .set({ updated_at: new Date() })
    .where(eq(conversationStates.id, conv.id));

  switch (conv.state) {
    case "greeting":            return handleGreeting(conv, tenant, client, body);
    case "select_category":     return handleSelectCategory(conv, tenant, client, body);
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
      await db
        .update(conversationStates)
        .set({ state: "greeting", temp_data: {} })
        .where(eq(conversationStates.id, conv.id));
      conv.state = "greeting";
      return handleGreeting(conv, tenant, client, body);
  }
}
