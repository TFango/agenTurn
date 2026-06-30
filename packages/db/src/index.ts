export { db } from "./db";

export {
  tenants,
  professionals,
  serviceCategories,
  professionalCategories,
  services,
  workingHours,
  appointments,
  blockedDates,
  users,
  clients,
  conversationStates,
  waitlist,
  notifications,
  pushSubscriptions,
} from "./schema";

export { getAvailableSlots } from "./scheduling";
export type {
  WorkingHoursRange,
  TimeSlot,
  ExistingAppointment,
} from "./scheduling";

export type ConversationStateEnum =
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
  | "waitlist"
  | "select_category";
