import { API_CONFIG } from "./config";
import { auth } from "./auth";
import type {
  Incident,
  IncidentDetails,
  Resource,
  ResourceStock,
  Shelter,
  Volunteer,
  Notification,
  MeResponse,
  LoginResponse,
  RegisterResponse,
  Skill,
} from "../types";

function withAuthHeaders(): HeadersInit {
  const token = auth.getToken();
  return {
    ...API_CONFIG.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((json as any).error || (json as any).message || response.statusText);
  }
  return json as T;
}

async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: "GET",
    headers: withAuthHeaders(),
  });
  return handleResponse<T>(response);
}

async function post<T>(endpoint: string, data: any, includeAuth = true): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: "POST",
    headers: includeAuth ? withAuthHeaders() : API_CONFIG.headers,
    body: JSON.stringify(data),
  });
  return handleResponse<T>(response);
}

async function put<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: withAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<T>(response);
}

export interface User {
  user_id: number;
  user_name: string;
  email: string;
  phone_number: string;
  roles: string[];
  created_at?: string;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    post<LoginResponse>("/api/login", credentials, false),

  register: (data: { user_name: string; email: string; password: string; role: string; phone_number: string; skills?: number[]; latitude?: number; longitude?: number; }) =>
    post<RegisterResponse>("/api/register", data, false),

  verify: (data: { email: string; code: string }) =>
    post<{ message: string }>("/api/verify", data, false),

  resendVerification: (data: { email: string }) =>
    post<{ message: string }>("/api/resend-verification", data, false),

  getSkills: async () => {
    const data = await get<{ skills: Skill[] }>("/api/skills");
    return data.skills;
  },

  me: () => get<MeResponse>("/api/me"),

  // Users (Admin)
  getUsers: async () => {
    const data = await get<{ users: User[] }>("/api/users");
    return data.users;
  },
  updateUserRole: (userId: number, role: string) =>
    put<{ message: string }>(`/api/users/${userId}/role`, { role }),

  updateProfile: (data: { user_name?: string; email?: string; phone_number?: string }) =>
    put<{ message: string }>("/api/users/me", data),

  setMyAvailability: (availability: 'AVAILABLE' | 'BUSY') =>
    put<{ message: string }>("/api/volunteers/availability", { availability }),

  // Incidents

  // Incidents
  getIncidents: async () => {
    const data = await get<{ incidents: Incident[] }>("/api/incidents");
    return data.incidents;
  },

  getIncident: async (id: number) => {
    const data = await get<IncidentDetails>(`/api/incidents/${id}`);
    return data;
  },

  createIncident: (data: {
    title: string;
    description?: string;
    disaster_type: Incident["disaster_type"];
    severity: Incident["severity"];
    latitude: number;
    longitude: number;
  }) => post<{ message: string; incident_id: number }>("/api/incidents", data),

  updateIncidentStatus: (id: number, status: Incident["status"]) =>
    put<{ message: string }>(`/api/incidents/${id}/status`, { status }),

  addIncidentUpdate: (incidentId: number, message: string) =>
    post<{ message: string; update_id: number }>(`/api/incidents/${incidentId}/updates`, { update_message: message }),
  getResources: async () => {
    const data = await get<{ resources: Resource[] }>("/api/resources");
    return data.resources;
  },

  // Resource Stocks 
  getStocks: async () => {
    const data = await get<{ stocks: ResourceStock[] }>("/api/stocks");
    return data.stocks;
  },

  updateStock: (id: number, quantity: number) =>
    put<{ message: string }>(`/api/stocks/${id}`, { quantity }),

  addStock: (data: { resource_id: number; quantity: number; warehouse_id: number }) =>
    post<{ message: string; stock_id: number }>("/api/stocks", data),

  getWarehouses: async () => {
    const data = await get<{ warehouses: { id: number; name: string }[] }>("/api/warehouses");
    return data.warehouses;
  },

  updateWarehouse: (id: number, data: { name: string, latitude?: number, longitude?: number }) =>
    put<{ message: string }>(`/api/warehouses/${id}`, data),

  deleteWarehouse: (id: number) =>
    fetch(`${API_CONFIG.BASE_URL}/api/warehouses/${id}`, {
      method: "DELETE",
      headers: withAuthHeaders(),
    }).then(handleResponse<{ message: string }>),

  createWarehouse: (data: { name: string; latitude?: number; longitude?: number }) =>
    post<{ message: string; warehouse_id: number }>("/api/warehouses", data),

  createResource: (data: { resource_name: string; unit: string; type: string }) =>
    post<{ message: string; resource_id: number }>("/api/resources", data),

  // Shelters
  getShelters: async () => {
    const data = await get<{ shelters: Shelter[] }>("/api/shelters");
    return data.shelters;
  },

  createShelter: (data: { name: string; location: string; capacity: number; latitude?: number; longitude?: number }) =>
    post<{ message: string; shelter_id: number }>("/api/shelters", data),

  updateShelter: (id: number, data: Partial<Shelter>) =>
    put<{ message: string }>(`/api/shelters/${id}`, data),

  deleteShelter: (id: number) =>
    fetch(`${API_CONFIG.BASE_URL}/api/shelters/${id}`, {
      method: "DELETE",
      headers: withAuthHeaders(),
    }).then(handleResponse<{ message: string }>),

  // Volunteers
  getVolunteers: async () => {
    const data = await get<{ volunteers: Volunteer[] }>("/api/volunteers");
    return data.volunteers || [];
  },

  getVolunteerProfile: async () => {
    const data = await get<{ volunteer: Volunteer }>("/api/volunteers/me");
    return data.volunteer;
  },

  updateVolunteerStatus: (volunteerId: number, availability: 'AVAILABLE' | 'BUSY') =>
    put<{ message: string }>(`/api/volunteers/${volunteerId}/availability`, { availability }),

  updateVolunteerSkills: (volunteerId: number, skills: number[]) =>
    put<{ message: string }>(`/api/volunteers/${volunteerId}/skills`, { skills }),

  assignVolunteer: (volunteerId: number, incidentId: number) =>
    post<{ message: string; assignment_id: number }>("/api/assignments", { volunteer_id: volunteerId, incident_id: incidentId }),

  // Incident Management
  deployResource: (stockId: number, incidentId: number, quantity: number) =>
    post<{ message: string }>("/api/deployments", { stock_id: stockId, incident_id: incidentId, quantity }),

  createVolunteerProfile: (data: any) => post("/api/volunteers/profile", data),

  // Notifications
  getNotifications: async () => {
    const data = await get<{ notifications: Notification[] }>("/api/notifications");
    return data.notifications;
  },

  markNotificationRead: (id: number) =>
    put<{ message: string }>(`/api/notifications/${id}/read`, {}),

  createNotification: (data: {
    title: string;
    message: string;
    type: 'ALERT' | 'INFO' | 'WARNING';
    target_type: 'GLOBAL' | 'ROLE' | 'USER';
    role_name?: string;
    user_id?: number;
  }) =>
    post<{ message: string }>("/api/notifications", data),

  // Shelter Occupancy
  logShelterOccupancy: (shelterId: number, personName: string, action: 'IN' | 'OUT') =>
    post<{ message: string }>("/api/shelters/occupancy", { shelter_id: shelterId, person_name: personName, action }),

  adjustShelterOccupancy: (shelterId: number, delta: 1 | -1) =>
    post<{ message: string }>("/api/shelters/adjust_occupancy", { shelter_id: shelterId, delta }),

  getShelterLogs: async (shelterId: number) => {
    const data = await get<{ logs: any[] }>(`/api/shelters/${shelterId}/logs`);
    return data.logs;
  },

  getShelterResidents: async (shelterId: number) => {
    const data = await get<{ residents: any[] }>(`/api/shelters/${shelterId}/residents`);
    return data.residents;
  },
  // Blood Donors
  getBloodDonors: async () => {
    const data = await get<{ donors: any[] }>("/api/donors");
    return data.donors;
  },
  getMyDonorProfile: async () => {
    return get<{ is_donor: boolean; donor?: any }>("/api/donors/me");
  },
  registerDonor: (data: { blood_group: string; last_donation_date: string | null }) =>
    post<{ message: string }>("/api/donors", data),
  updateDonorProfile: (data: { status?: 'ACTIVE' | 'INACTIVE'; last_donation_date?: string }) =>
    put<{ message: string }>("/api/donors/me", data),
};
