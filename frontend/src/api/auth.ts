const TOKEN_KEY = "drrms_token";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost/drrms/backend/public";

export type MeResponse = {
  user?: {
    user_id?: number;
    user_name?: string;
    email?: string;
    phone_number?: string;
    created_at?: string;
  };
  roles?: string[];
};

async function apiGet<T>(path: string): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText || "Request failed";
    throw new Error(msg);
  }

  return data as T;
}

export const auth = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  // fetches current user + roles from backend
  getMe: async (): Promise<MeResponse> => {
    return apiGet<MeResponse>("/api/me");
  },
};