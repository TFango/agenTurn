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

Tenant.hasMany(Professional, { foreignKey: "tenant_id" });
Professional.belongsTo(Tenant, { foreignKey: "tenant_id" });

Tenant.hasMany(Service, { foreignKey: "tenant_id" });
Service.belongsTo(Tenant, { foreignKey: "tenant_id" });

Tenant.hasMany(User, { foreignKey: "tenant_id" });
User.belongsTo(Tenant, { foreignKey: "tenant_id" });

Tenant.hasMany(Client, { foreignKey: "tenant_id" });
Client.belongsTo(Tenant, { foreignKey: "tenant_id" });

Tenant.hasMany(Appointment, { foreignKey: "tenant_id" });
Appointment.belongsTo(Tenant, { foreignKey: "tenant_id" });

Tenant.hasMany(ConversationState, { foreignKey: "tenant_id" });
ConversationState.belongsTo(Tenant, { foreignKey: "tenant_id" });

Tenant.hasMany(WaitList, { foreignKey: "tenant_id" });
WaitList.belongsTo(Tenant, { foreignKey: "tenant_id" });

Professional.hasMany(WorkingHours, { foreignKey: "professional_id" });
WorkingHours.belongsTo(Professional, { foreignKey: "professional_id" });

Professional.hasMany(Appointment, {
  foreignKey: "professional_id",
  as: "appointments",
});
Appointment.belongsTo(Professional, {
  foreignKey: "professional_id",
  as: "professional",
});

Professional.hasMany(BlockedDate, { foreignKey: "professional_id" });
BlockedDate.belongsTo(Professional, { foreignKey: "professional_id" });

Professional.belongsTo(User, { foreignKey: "professional_id", as: "user" });

Service.hasMany(Appointment, { foreignKey: "service_id" });
Appointment.belongsTo(Service, { foreignKey: "service_id", as: "service" });

Service.hasMany(WaitList, { foreignKey: "service_id" });
WaitList.belongsTo(Service, { foreignKey: "service_id" });

Client.hasMany(Appointment, { foreignKey: "client_id", as: "appointments" });
Appointment.belongsTo(Client, { foreignKey: "client_id", as: "client" });

Client.hasMany(WaitList, { foreignKey: "client_id" });
WaitList.belongsTo(Client, { foreignKey: "client_id" });

Tenant.hasMany(ServiceCategory, { foreignKey: "tenant_id" });
ServiceCategory.belongsTo(Tenant, { foreignKey: "tenant_id" });
