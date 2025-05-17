import { ApiResponse } from "./api-response";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | undefined>;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new ApiError(response.status, error.message || "An error occurred");
  }
  return response.json();
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    });
    url += `?${searchParams.toString()}`;
  }

  // Set default headers
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    return handleResponse<ApiResponse<T>>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Network error");
  }
}

// RFQ API endpoints
export const rfqApi = {
  getById: (id: string) => apiFetch(`/api/rfq/${id}`),
  list: (params?: Record<string, string | undefined>) =>
    apiFetch("/api/rfq/", { params }),
  create: (data: any) =>
    apiFetch("/api/rfq/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch(`/api/rfq/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/api/rfq/${id}`, {
      method: "DELETE",
    }),
  search: (query: string, params?: Record<string, string | undefined>) =>
    apiFetch("/api/rfq/search", {
      params: { query, ...params },
    }),
};

// Customer API endpoints
export const customerApi = {
  getById: (id: string) => apiFetch(`/api/customers/${id}`),
  list: (params?: Record<string, string | undefined>) =>
    apiFetch("/api/customers/", { params }),
  create: (data: any) =>
    apiFetch("/api/customers/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getHistory: (id: string, period?: string) =>
    apiFetch(`/api/customers/${id}/history`, {
      params: period ? { period } : undefined,
    }),
  search: (query: string, params?: Record<string, string | undefined>) =>
    apiFetch("/api/customers/search", {
      params: { query, ...params },
    }),
};

// Inventory API endpoints
export const inventoryApi = {
  list: (params?: Record<string, string | undefined>) =>
    apiFetch("/api/inventory/", { params }),
  search: (query: string, params?: Record<string, string | undefined>) =>
    apiFetch("/api/inventory/search", {
      params: { query, ...params },
    }),
  create: (data: any) =>
    apiFetch("/api/inventory/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (id: string) =>
    apiFetch(`/api/inventory/${id}`),
  update: (id: string, data: any) =>
    apiFetch(`/api/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/api/inventory/${id}`, {
      method: "DELETE",
    }),
};

// Dashboard API endpoints
export const dashboardApi = {
  getMetrics: () => apiFetch("/api/dashboard/metrics"),
  getRfqStats: () => apiFetch("/api/dashboard/rfq-stats"),
  getInventoryStats: () => apiFetch("/api/dashboard/inventory-stats"),
  getCustomerStats: () => apiFetch("/api/dashboard/customer-stats"),
};

// Settings API endpoints
export const settingsApi = {
  getSystem: () => apiFetch("/api/settings/system"),
  getUserPreferences: () => apiFetch("/api/settings/user-preferences"),
  getCurrency: () => apiFetch("/api/settings/currency"),
  updateUserPreferences: (data: any) =>
    apiFetch("/api/settings/user-preferences", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Currency API endpoints
export const currencyApi = {
  getRates: () => apiFetch("/api/currency/rates"),
  convert: (amount: number, from: string, to: string) =>
    apiFetch("/api/currency/convert", {
      method: "POST",
      body: JSON.stringify({ amount, fromCurrency: from, toCurrency: to }),
    }),
};
