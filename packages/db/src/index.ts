export { sequelize } from './connection'

export { Tenant } from './models/core/Tenant'
export { Professional } from './models/core/Professional'
export { Service } from './models/core/Service'
export { WorkingHours } from './models/calendar/WorkingHours'
export { Appointment } from './models/calendar/Appointment'
export { BlockedDate } from './models/calendar/BlockedDate'
export { User } from './models/users/User'
export { Client } from './models/client/Client'
export { ConversationState } from './models/client/ConversationState'
export { WaitList } from './models/client/Waitlist'
export { Notification } from './models/core/Notification'

export { getAvailableSlots } from './scheduling'
export type { WorkingHoursRange, TimeSlot } from './scheduling'

import './models/associations'
