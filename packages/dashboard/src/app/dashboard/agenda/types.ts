export interface Appointment {
  id: string;
  tenant_id: string;
  service: Service;
  professional: Professional | null;
  client: Client;
  datetime: string;
  status: "pending" | "confirmed" | "cancelled";
}

 export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  whatsapp_number: string;
  notes: string;
  created_at: Date;
}

export interface Professional {
  id: string;
  tenant_id: string;
  name: string;
  active: boolean;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
}

