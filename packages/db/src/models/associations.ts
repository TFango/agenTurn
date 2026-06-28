import { Tenant } from "./core/Tenant";
import { Professional } from "./core/Professional";
import { Service } from "./core/Service";
import { WorkingHours } from "./calendar/WorkingHours";
import { Appointment } from "./calendar/Appointment";
import { BlockedDate } from "./calendar/BlockedDate";
import { User } from "./users/User";
import { Client } from "./client/Client";
import { ConversationState } from "./client/ConversationState";
import { WaitList } from "./client/Waitlist";
import { ServiceCategory } from "./core/ServiceCategory";
import { ProfessionalCategory } from "./core/ProfessionalCategory";
import { PushSubscription } from "./core/PushSubscription";

Tenant.hasMany(Professional, { foreignKey: "tenant_id", as: "professionals" });
Professional.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

Tenant.hasMany(Service, { foreignKey: "tenant_id", as: "services" });
Service.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

Tenant.hasMany(User, { foreignKey: "tenant_id", as: "users" });
User.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

Tenant.hasMany(Client, { foreignKey: "tenant_id", as: "clients" });
Client.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

Tenant.hasMany(Appointment, { foreignKey: "tenant_id", as: "appointments" });
Appointment.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

Tenant.hasMany(ConversationState, { foreignKey: "tenant_id", as: "conversationStates" });
ConversationState.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

Tenant.hasMany(WaitList, { foreignKey: "tenant_id", as: "waitlists" });
WaitList.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

Professional.hasMany(WorkingHours, { foreignKey: "professional_id", as: "workingHours" });
WorkingHours.belongsTo(Professional, { foreignKey: "professional_id", as: "professional" });

Professional.hasMany(Appointment, { foreignKey: "professional_id", as: "appointments" });
Appointment.belongsTo(Professional, { foreignKey: "professional_id", as: "professional" });

Professional.hasMany(BlockedDate, { foreignKey: "professional_id", as: "blockedDates" });
BlockedDate.belongsTo(Professional, { foreignKey: "professional_id", as: "professional" });

Professional.belongsTo(User, { foreignKey: "professional_id", as: "user" });

Service.hasMany(Appointment, { foreignKey: "service_id", as: "serviceAppointments" });
Appointment.belongsTo(Service, { foreignKey: "service_id", as: "service" });

Service.hasMany(WaitList, { foreignKey: "service_id", as: "serviceWaitlists" });
WaitList.belongsTo(Service, { foreignKey: "service_id", as: "service" });

Client.hasMany(Appointment, { foreignKey: "client_id", as: "appointments" });
Appointment.belongsTo(Client, { foreignKey: "client_id", as: "client" });

Client.hasMany(WaitList, { foreignKey: "client_id", as: "clientWaitlists" });
WaitList.belongsTo(Client, { foreignKey: "client_id", as: "client" });

Tenant.hasMany(ServiceCategory, { foreignKey: "tenant_id", as: "serviceCategories" });
ServiceCategory.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

Professional.belongsToMany(ServiceCategory, {
  through: ProfessionalCategory,
  foreignKey: "professional_id",
  as: "serviceCategories",
});
ServiceCategory.belongsToMany(Professional, {
  through: ProfessionalCategory,
  foreignKey: "category_id",
  as: "professionals",
});

ServiceCategory.hasMany(Service, { foreignKey: "category_id", as: "services" });
Service.belongsTo(ServiceCategory, { foreignKey: "category_id", as: "category" });

User.hasMany(PushSubscription, { foreignKey: "user_id", as: "pushSubscriptions" });
PushSubscription.belongsTo(User, { foreignKey: "user_id", as: "user" });

Tenant.hasMany(PushSubscription, { foreignKey: "tenant_id", as: "pushSubscriptions" });
PushSubscription.belongsTo(Tenant, { foreignKey: "tenant_id", as: "pushTenant" });
