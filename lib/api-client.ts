import { ApiResponse } from "./api-response";
import { csrfFetch } from "./csrf-client";

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
    let errorMessage = 'Unknown error';
    let errorDetails = {};
    
    try {
      const errorResponse = await response.json();
      errorMessage = errorResponse.message || errorResponse.error || errorMessage;
      errorDetails = errorResponse;
    } catch (parseError) {
      // If we can't parse the response, use the status text
      errorMessage = response.statusText || `HTTP ${response.status}`;
    }
    
    // API Error logged silently
    
    throw new ApiError(response.status, errorMessage);
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
    const response = await csrfFetch(url, {
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
  getById: async (id: string, params?: { page?: number; pageSize?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    return await apiFetch(`/api/rfq/${id}?${queryParams.toString()}`);
  },
  list: async (params?: { page?: string; pageSize?: string; status?: string; search?: string; sortField?: string; sortOrder?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page);
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortField) queryParams.append('sortField', params.sortField);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    return apiFetch("/api/rfq", { params: Object.fromEntries(queryParams.entries()) });
  },
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
  getQuotationHistory: async (rfqId: string) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/versions`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to fetch quotation history' };
    }
  },
  createQuotation: async (rfqId: string, quotationData: any) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotationData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to create quotation' };
    }
  },
  createVersion: async (rfqId: string, versionData: any) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to create version' };
    }
  },
  updateVersionStatus: async (rfqId: string, versionId: number, status: string) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/versions/${versionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to update version status' };
    }
  },
  recordCustomerResponse: async (rfqId: string, versionId: number, customerResponse: any) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/versions/${versionId}/customer-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerResponse),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to record customer response' };
    }
  },
  // Quotation Response endpoints
  getQuotationResponses: async (rfqId: string, versionId: string) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/quotation/${versionId}/responses`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to fetch quotation responses' };
    }
  },
  createQuotationResponse: async (rfqId: string, versionId: string, responseData: any) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/quotation/${versionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to create quotation response' };
    }
  },
  getQuotationResponse: async (rfqId: string, versionId: string, responseId: string) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/quotation/${versionId}/responses/${responseId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to fetch quotation response' };
    }
  },
  getItemVersions: async (rfqId: string, sku: string) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/items/${sku}/versions`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to fetch item versions' };
    }
  },
  createItemVersion: async (rfqId: string, sku: string, versionData: any) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/items/${sku}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to create item version' };
    }
  },
  updateItemVersionStatus: async (rfqId: string, sku: string, versionNumber: number, status: string) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/items/${sku}/versions/${versionNumber}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to update item version status' };
    }
  },
  recordItemCustomerResponse: async (rfqId: string, sku: string, versionNumber: number, customerResponse: any) => {
    try {
      const response = await fetch(`/api/rfq/${rfqId}/items/${sku}/versions/${versionNumber}/customer-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerResponse),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to record item customer response' };
    }
  },
  getAllTabData: async (rfqId: string, params?: { page?: number; pageSize?: number }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      
      const response = await fetch(`/api/rfq/${rfqId}/all-data?${queryParams.toString()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Failed to fetch ALL tab data' };
    }
  },
};

// Customer API endpoints
export const customerApi = {
  getById: (id: string) => apiFetch(`/api/customers/${id}`),
  list: (params?: Record<string, string | undefined>) =>
    apiFetch("/api/customers", { params }),
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
    apiFetch("/api/inventory", { params }),
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
  getHistory: (id: string, params?: { period?: string; fromDate?: string; toDate?: string }) =>
    apiFetch(`/api/inventory/${id}/history`, { params }),
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

// Vendor API endpoints
export const vendorApi = {
  list: () => apiFetch("/api/vendors/list"),
  create: (data: any) =>
    apiFetch("/api/vendors/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch(`/api/vendors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/api/vendors/${id}`, {
      method: "DELETE",
    }),
};

// Negotiation API endpoints
export const negotiationApi = {
  // Communication endpoints
  getCommunications: (rfqId: string) => 
    apiFetch(`/api/rfq/${rfqId}/communications`),
  createCommunication: (rfqId: string, data: any) =>
    apiFetch(`/api/rfq/${rfqId}/communications`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getCommunication: (communicationId: string) =>
    apiFetch(`/api/communications/${communicationId}`),
  updateCommunication: (communicationId: string, data: any) =>
    apiFetch(`/api/communications/${communicationId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCommunication: (communicationId: string) =>
    apiFetch(`/api/communications/${communicationId}`, {
      method: "DELETE",
    }),
  completeFollowUp: (communicationId: string, completed: boolean = true) =>
    apiFetch(`/api/communications/${communicationId}/follow-up`, {
      method: "PUT",
      body: JSON.stringify({ followUpCompleted: completed }),
    }),

  // SKU change history endpoints
  getSkuHistory: (rfqId: string) =>
    apiFetch(`/api/rfq/${rfqId}/sku-history`),
  createSkuChange: (rfqId: string, data: any) =>
    apiFetch(`/api/rfq/${rfqId}/sku-changes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSkuChangesByItem: (rfqId: string, skuId: string) =>
    apiFetch(`/api/rfq/${rfqId}/sku/${skuId}/history`),

  // Negotiation analytics
  getNegotiationSummary: (rfqId: string) =>
    apiFetch(`/api/rfq/${rfqId}/negotiation-summary`),
  getCommunicationSummary: (rfqId: string) =>
    apiFetch(`/api/rfq/${rfqId}/communication-summary`),
};
