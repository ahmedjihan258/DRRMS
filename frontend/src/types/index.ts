export type Role = "ADMIN" | "AUTHORITY" | "DISPATCHER" | "VOLUNTEER" | "CITIZEN";

export interface LoginResponse {
  token: string;
  user: {
    user_id: number;
    user_name: string;
    email: string;
    roles: Role[];
  };
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}

export interface MeResponse {
  user: {
    user_id: number;
    user_name: string;
    email: string;
    created_at: string;
  };
  roles: Role[];
}

export interface Incident {
  id: number;
  title: string;
  description: string | null;
  disaster_type: "FLOOD" | "CYCLONE" | "FIRE" | "LANDSLIDE" | "EARTHQUAKE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  latitude: number;
  longitude: number;
  status: "REPORTED" | "IN_PROGRESS" | "RESOLVED";
  reported_by: number;
  created_at: string;
  reporter_name: string | null;
}

export interface IncidentUpdate {
  update_id: number;
  incident_id: number;
  update_message: string;
  updated_by: number;
  updated_at: string;
}

export interface IncidentDetails {
  incident: Incident;
  updates: IncidentUpdate[];
}

export interface Resource {
  id: number;
  resource_name: string;
  unit: string;
  type: string;
}

export interface ResourceStock {
  id: number;
  resource_id: number;
  warehouse_id?: number;
  quantity: number;
  location: string;
  last_updated: string;
  resource_name: string;
  unit: string;
}

export interface Shelter {
  id: number;
  name: string;
  location: string;
  capacity: number;
  current_occupancy: number;
}

export interface Volunteer {
  id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  availability: "AVAILABLE" | "BUSY";
  created_at: string;
  user_name?: string; // joined
  email?: string; // joined
  skills?: string; // joined string of skills
  skill_ids?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'ALERT' | 'INFO' | 'WARNING';
  created_at: string;
  is_read: number;
  read_at: string | null;
}

export interface Skill {
  id: number;
  name: string;
}
