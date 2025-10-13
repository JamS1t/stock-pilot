import { getAuthContext } from "@/context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let refreshPromise: Promise<string | null> | null = null;

// Function to get the access token from local storage
const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const fetchApi = async <T>(
  endpoint: string,
  method: string = "GET",
  body?: object,
  isRetry: boolean = false
): Promise<T> => {
  const { login, logout } = getAuthContext();
  let token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // 🔒 If access token expired
    if (response.status === 401 && !isRetry) {
      // console.warn("🔄 Access token expired, attempting refresh...");

      // ✅ Use shared refresh promise so multiple requests don't overlap
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }

      const newToken = await refreshPromise;
      refreshPromise = null; // reset lock when done

      if (newToken) {
        // Restore session data
        const storedUser = localStorage.getItem("user");
        const storedStore = localStorage.getItem("store");
        const storedRole = localStorage.getItem("role");
        const storedMetadata = localStorage.getItem("metadata");

        if (storedUser && storedStore && storedRole && storedMetadata) {
          login({
            accessToken: newToken,
            user: JSON.parse(storedUser),
            store: JSON.parse(storedStore),
            role: storedRole,
            metadata: JSON.parse(storedMetadata),
          });
        }

        // Retry the original request once
        return fetchApi<T>(endpoint, method, body, true);
      } else {
        // console.error("Refresh token failed, logging out...");
        logout();
        throw new Error("Session expired. Please log in again.");
      }
    }

    // ❌ If still not ok after retry
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // console.error("Network or API call error:", error);
    throw error;
  }
};

// 🔄 Handles refresh flow (with credentials for HttpOnly cookie)
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // send refresh cookie
    });

    if (!response.ok) {
      // console.warn("Refresh token request failed:", response.status);
      return null;
    }

    const data = await response.json();
    const newToken = data?.accessToken;

    if (newToken) {
      localStorage.setItem("accessToken", newToken);
      // console.info("✅ Access token refreshed successfully.");
      return newToken;
    }

    return null;
  } catch (err) {
    // console.error("Failed to refresh token:", err);
    return null;
  }
};

// --- Authentication API Calls ---
export const googleLogin = async (token: string): Promise<any> => {
  return fetchApi("/auth/google-login", "POST", { token });
};

export const setupStore = async (
  userId: number,
  storeName: string,
  timezone: string,
  currency: string
): Promise<any> => {
  return fetchApi("/auth/setup-store", "POST", {
    user_id: userId,
    store_name: storeName,
    timezone,
    currency,
  });
};

export const logout = async (): Promise<any> => {
  // Refresh token is expected to be in cookies, so no payload needed
  return fetchApi("/auth/logout", "POST");
};

export const refreshToken = async (): Promise<any> => {
  // Refresh token is expected to be in cookies
  return fetchApi("/auth/refresh", "POST");
};

// --- Category API Calls ---
export interface Category {
  // Export the interface
  category_id: number;
  name: string;
  store_id: number;
}

export const getCategories = async (
  id?: number
): Promise<{ message: string; data: Category[] | Category }> => {
  const endpoint = id ? `/categories?id=${id}` : "/categories";
  return fetchApi(endpoint, "GET");
};

export const createCategory = async (
  name: string
): Promise<{ message: string; data: Category }> => {
  return fetchApi("/categories", "POST", { name });
};

export const updateCategory = async (
  id: number,
  name: string
): Promise<{ message: string; data: Category }> => {
  return fetchApi(`/categories/${id}`, "PUT", { name });
};

export const deleteCategory = async (
  id: number
): Promise<{ message: string; data: Category }> => {
  return fetchApi(`/categories/${id}`, "DELETE");
};

// --- Supplier API Calls ---
export interface Supplier {
  // Export the interface
  supplier_id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  store_id: number;
}

export const getSuppliers = async (
  id?: number
): Promise<{ message: string; data: Supplier[] | Supplier }> => {
  const endpoint = id ? `/suppliers?id=${id}` : "/suppliers";
  return fetchApi(endpoint, "GET");
};

export const createSupplier = async (
  supplier: Omit<Supplier, "supplier_id" | "store_id">
): Promise<{ message: string; data: Supplier }> => {
  return fetchApi("/suppliers", "POST", supplier);
};

export const updateSupplier = async (
  id: number,
  supplier: Omit<Supplier, "supplier_id" | "store_id">
): Promise<{ message: string; data: Supplier }> => {
  return fetchApi(`/suppliers/${id}`, "PUT", supplier);
};

export const deleteSupplier = async (
  id: number
): Promise<{ message: string; data: Supplier }> => {
  return fetchApi(`/suppliers/${id}`, "DELETE");
};

// --- Product API Calls ---
export interface Product {
  // Export the interface
  product_id: number;
  name: string;
  sku: string | null;
  unit_price: number;
  selling_price: number;
  stock: number;
  category_id: number;
  category_name?: string; // Optional for some responses
  supplier_id: number;
  supplier_name?: string; // Optional for some responses
  barcode: string | null;
  store_id: number;
  stock_status?: string; // Optional for some responses
}

export const getProducts = async (filters?: {
  search?: string;
  category_id?: number;
  supplier_id?: number;
  stock_status?: "Out of Stock" | "Low Stock" | "In Stock";
}): Promise<{ message: string; data: Product[] }> => {
  const query = new URLSearchParams();
  if (filters?.search) query.append("search", filters.search);
  if (filters?.category_id)
    query.append("category_id", filters.category_id.toString());
  if (filters?.supplier_id)
    query.append("supplier_id", filters.supplier_id.toString());
  if (filters?.stock_status) query.append("stock_status", filters.stock_status);
  const endpoint = `/products${query.toString() ? `?${query.toString()}` : ""}`;
  return fetchApi(endpoint, "GET");
};

export const getProductById = async (
  id: number
): Promise<{ message: string; data: Product }> => {
  return fetchApi(`/products/${id}`, "GET");
};

export const createProduct = async (
  product: Omit<
    Product,
    | "product_id"
    | "store_id"
    | "category_name"
    | "supplier_name"
    | "stock_status"
  >
): Promise<{ message: string; data: Product }> => {
  return fetchApi("/products", "POST", product);
};

export const updateProduct = async (
  id: number,
  product: Omit<
    Product,
    | "product_id"
    | "store_id"
    | "category_name"
    | "supplier_name"
    | "stock_status"
  >
): Promise<{ message: string; data: Product }> => {
  return fetchApi(`/products/${id}`, "PUT", product);
};

export const deleteProduct = async (
  id: number
): Promise<{ message: string; data: Product }> => {
  return fetchApi(`/products/${id}`, "DELETE");
};

export const searchProductsForPos = async (
  search: string,
  categoryId?: number
): Promise<{ message: string; data: Product[] }> => {
  const query = new URLSearchParams({ search });
  if (categoryId) query.append("category_id", categoryId.toString());
  const endpoint = `/products/search?${query.toString()}`;
  return fetchApi(endpoint, "GET");
};

// --- Order API Calls ---
export interface OrderItem {
  // Export the interface
  product_id: number;
  quantity: number;
  price_at_sale: number;
  product_name?: string; // For history
}

export interface Order {
  // Export the interface
  order_id: number;
  store_id: number;
  total_amount: number;
  payment_method: string;
  order_date: string;
  items?: OrderItem[]; // For history
}

export interface InvoiceData {
  header: {
    invoice_number: number;
    date: string;
  };
  items: {
    item: string;
    qty: number;
    price: number;
    total: number;
  }[];
  totals: {
    subtotal: number;
    discount: number | null;
    total: number;
  };
}

export interface OrderListItem {
  order_id: number;
  order_date: string;
  sub_total: number;
  discount: number | null;
  total: number;
  status: string;
  items: {
    product: string;
    qty: number;
    price: number;
    total: number;
  }[];
  payment_method?: string;
}

export interface OrdersListRow {
  orders_json?: string | OrderListItem[]; // list-mode column
}

export interface InvoiceRow {
  invoice_json?: string | InvoiceData; // invoice-mode column
}

interface ProcessOrderResponse {
  order_id: number;
}

// --- ORDER PROCEDURES INTEGRATION ---

export const processOrderPOS = async (
  payload: any
): Promise<{ message: string; data: ProcessOrderResponse }> => {
  return fetchApi("/orders/process", "POST", { payload });
};

export const getOrderInvoice = async (params: {
  id?: number;
  searchTerm?: string;
}): Promise<{ message: string; data: (OrdersListRow | InvoiceRow)[] }> => {
  const query = new URLSearchParams();
  if (params.id !== undefined && params.id !== null) {
    query.append("id", String(params.id));
  }
  if (params.searchTerm) {
    query.append("searchTerm", params.searchTerm);
  }
  const endpoint = `/orders/history${
    query.toString() ? `?${query.toString()}` : ""
  }`;
  return fetchApi(endpoint, "GET");
};

// --- Report API Calls ---
export interface ProductSalesReport {
  // Export the interface
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
}

export interface SalesChartPoint {
  period: string;
  revenue: number;
  profit: number;
}

export interface SalesSummary {
  total_revenue: number;
  total_profit: number;
  total_items_sold: number;
  total_sales: number;
}

export interface SalesReportResponse {
  summary: SalesSummary;
  chart: SalesChartPoint[];
}

export const getSalesReport = async (
  start_date: string,
  end_date: string,
  granularity: "minute" | "day",
  filters?: { category_id?: number; product_id?: number }
): Promise<{ message: string; data: SalesReportResponse }> => {
  const query = new URLSearchParams({ start_date, end_date, granularity });
  if (filters?.category_id)
    query.append("category_id", filters.category_id.toString());
  if (filters?.product_id)
    query.append("product_id", filters.product_id.toString());
  const endpoint = `/reports/sales?${query.toString()}`;
  return fetchApi(endpoint, "GET");
};
