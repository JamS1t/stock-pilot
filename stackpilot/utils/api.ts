import { getAuthContext } from "@/context/AuthContext";

// Configurable per environment. In dev, `.env.development` points this at the
// local backend (http://localhost:5000/api). Production builds fall back to Railway.
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "https://stock-pilot-production.up.railway.app/api";

let refreshPromise: Promise<string | null> | null = null;

// Keep bearer tokens out of persistent storage; refresh stays in HttpOnly cookie.
const getAccessToken = (): string | null => {
  return sessionStorage.getItem("accessToken");
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
      sessionStorage.setItem("accessToken", newToken);
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
export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  page_count: number;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

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
  supplier_id: number | null;
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
  no_barcode_only?: boolean;
  sort_by?:
    | "name"
    | "category"
    | "sku"
    | "barcode"
    | "selling_price"
    | "stock"
    | "stock_status";
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<Product[]>> => {
  const query = new URLSearchParams();
  if (filters?.search) query.append("search", filters.search);
  if (filters?.category_id)
    query.append("category_id", filters.category_id.toString());
  if (filters?.supplier_id)
    query.append("supplier_id", filters.supplier_id.toString());
  if (filters?.stock_status) query.append("stock_status", filters.stock_status);
  if (filters?.no_barcode_only) query.append("no_barcode_only", "true");
  if (filters?.sort_by) query.append("sort_by", filters.sort_by);
  if (filters?.sort_dir) query.append("sort_dir", filters.sort_dir);
  if (filters?.page) query.append("page", filters.page.toString());
  if (filters?.page_size)
    query.append("page_size", filters.page_size.toString());
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
  const endpoint = `/products/pos?${query.toString()}`;
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

export interface ProcessOrderPayload {
  sub_total: number;
  tax: number;
  total: number;
  discount: number;
  discount_amount: number;
  discount_type: string | null;
  payment_method: string;
  items: {
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    category_id: number;
  }[];
  client_mutation_id?: string;
  device_id?: string;
  local_id?: string;
}

// --- ORDER PROCEDURES INTEGRATION ---

export const processOrderPOS = async (
  payload: ProcessOrderPayload
): Promise<{ message: string; data: ProcessOrderResponse }> => {
  return fetchApi("/orders/process", "POST", { payload });
};

export const getOrderInvoice = async (params: {
  id?: number;
  searchTerm?: string;
  payment_method?: "cash" | "gcash" | "utang";
  date_from?: string;
  date_to?: string;
  sort_by?: "order_id" | "order_date" | "items" | "total" | "payment";
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<(OrdersListRow | InvoiceRow)[] | InvoiceData>> => {
  const query = new URLSearchParams();
  if (params.id !== undefined && params.id !== null) {
    query.append("id", String(params.id));
  }
  if (params.searchTerm) {
    query.append("searchTerm", params.searchTerm);
  }
  if (params.payment_method) {
    query.append("payment_method", params.payment_method);
  }
  if (params.date_from) query.append("date_from", params.date_from);
  if (params.date_to) query.append("date_to", params.date_to);
  if (params.sort_by) query.append("sort_by", params.sort_by);
  if (params.sort_dir) query.append("sort_dir", params.sort_dir);
  if (params.page) query.append("page", params.page.toString());
  if (params.page_size) query.append("page_size", params.page_size.toString());
  const endpoint = `/orders/history${
    query.toString() ? `?${query.toString()}` : ""
  }`;
  return fetchApi(endpoint, "GET");
};

export const voidOrder = async (
  orderId: number,
  action: "cancel" | "refund"
): Promise<{
  message: string;
  data: { order_id: number; status: "cancelled" | "refunded"; restored_items: number };
}> => {
  return fetchApi(`/orders/${orderId}/void`, "POST", { action });
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

// --- Counter Ledger API Calls ---
export interface Customer {
  customer_id: number;
  name: string;
  phone: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  balance?: number;
  last_activity_at?: string | null;
}

export interface CustomerInput {
  name: string;
  phone?: string | null;
  photo_url?: string | null;
  notes?: string | null;
}

export interface UtangItemInput {
  product_id?: number | null;
  name: string;
  quantity?: number;
  unit_price?: number | null;
  line_total?: number | null;
}

export type UtangSource = "manual" | "voice" | "ocr";

export interface UtangEntry {
  entry_id: number;
  customer_id: number;
  amount: number;
  note: string | null;
  source: UtangSource;
  created_by: number | null;
  created_at: string;
  voided_at: string | null;
  voided_by: number | null;
  items: UtangItemInput[] | null;
}

export interface CreateUtangInput {
  customer_id: number;
  amount: number;
  note?: string | null;
  source?: UtangSource;
  items?: UtangItemInput[] | null;
  client_mutation_id?: string;
  device_id?: string;
  local_id?: string;
}

export type LedgerPaymentMethod = "cash" | "gcash" | "other";

export interface UtangPayment {
  payment_id: number;
  customer_id: number;
  amount: number;
  method: LedgerPaymentMethod;
  note: string | null;
  created_by: number | null;
  created_at: string;
  voided_at: string | null;
  voided_by: number | null;
}

export interface CreatePaymentInput {
  customer_id: number;
  amount: number;
  method?: LedgerPaymentMethod;
  note?: string | null;
  client_mutation_id?: string;
  device_id?: string;
  local_id?: string;
}

export interface CustomerBalance {
  customer_id: number;
  balance: number;
  last_activity_at: string | null;
}

export interface WhoOwesCustomer {
  customer_id: number;
  name: string;
  phone: string | null;
  photo_url: string | null;
  balance: number;
  last_activity_at: string | null;
  oldest_unpaid_at: string | null;
}

export interface MutationResult {
  affected_rows: number;
}

export interface CreatedCustomerResult {
  customer_id: number;
}

export interface CreatedUtangResult {
  entry_id: number;
}

export interface CreatedPaymentResult {
  payment_id: number;
}

export const getCustomers = async (filters?: {
  id?: number;
  search?: string;
}): Promise<{ message: string; data: Customer[] }> => {
  const query = new URLSearchParams();
  if (filters?.id) query.append("id", filters.id.toString());
  if (filters?.search) query.append("search", filters.search);
  const endpoint = `/customers${query.toString() ? `?${query.toString()}` : ""}`;
  return fetchApi(endpoint, "GET");
};

export const createCustomer = async (
  customer: CustomerInput
): Promise<{ message: string; data: CreatedCustomerResult }> => {
  return fetchApi("/customers", "POST", customer);
};

export const updateCustomer = async (
  id: number,
  customer: CustomerInput
): Promise<{ message: string; data: MutationResult }> => {
  return fetchApi(`/customers/${id}`, "PUT", customer);
};

export const deleteCustomer = async (
  id: number
): Promise<{ message: string; data: MutationResult }> => {
  return fetchApi(`/customers/${id}`, "DELETE");
};

export const listUtang = async (filters?: {
  customer_id?: number;
  from?: string;
  to?: string;
}): Promise<{ message: string; data: UtangEntry[] }> => {
  const query = new URLSearchParams();
  if (filters?.customer_id)
    query.append("customer_id", filters.customer_id.toString());
  if (filters?.from) query.append("from", filters.from);
  if (filters?.to) query.append("to", filters.to);
  const endpoint = `/utang${query.toString() ? `?${query.toString()}` : ""}`;
  return fetchApi(endpoint, "GET");
};

export const createUtang = async (
  utang: CreateUtangInput
): Promise<{ message: string; data: CreatedUtangResult }> => {
  return fetchApi("/utang", "POST", utang);
};

export const voidUtang = async (
  id: number
): Promise<{ message: string; data: MutationResult }> => {
  return fetchApi(`/utang/${id}/void`, "POST");
};

export const getWhoOwes = async (): Promise<{
  message: string;
  data: WhoOwesCustomer[];
}> => {
  return fetchApi("/utang/who-owes", "GET");
};

export const getCustomerBalance = async (
  customerId: number
): Promise<{ message: string; data: CustomerBalance }> => {
  return fetchApi(`/utang/customers/${customerId}/balance`, "GET");
};

export const listPayments = async (filters?: {
  customer_id?: number;
  from?: string;
  to?: string;
}): Promise<{ message: string; data: UtangPayment[] }> => {
  const query = new URLSearchParams();
  if (filters?.customer_id)
    query.append("customer_id", filters.customer_id.toString());
  if (filters?.from) query.append("from", filters.from);
  if (filters?.to) query.append("to", filters.to);
  const endpoint = `/payments${query.toString() ? `?${query.toString()}` : ""}`;
  return fetchApi(endpoint, "GET");
};

export const recordPayment = async (
  payment: CreatePaymentInput
): Promise<{ message: string; data: CreatedPaymentResult }> => {
  return fetchApi("/payments", "POST", payment);
};

export const voidPayment = async (
  id: number
): Promise<{ message: string; data: MutationResult }> => {
  return fetchApi(`/payments/${id}/void`, "POST");
};

// --- Cash Session API Calls ---
export interface CashSession {
  cash_session_id: number;
  opened_by: number | null;
  closed_by?: number | null;
  opened_at: string;
  closed_at?: string | null;
  opening_cash: number;
  expected_cash?: number | null;
  actual_cash?: number | null;
  difference?: number | null;
  status: "open" | "closed";
}

export interface OpenCashSessionResult {
  cash_session_id: number;
}

export const getOpenCashSession = async (): Promise<{
  message: string;
  data: CashSession | null;
}> => {
  return fetchApi("/cash-sessions/open", "GET");
};

export const listCashSessions = async (status?: "open" | "closed"): Promise<{
  message: string;
  data: CashSession[];
}> => {
  const endpoint = status ? `/cash-sessions?status=${status}` : "/cash-sessions";
  return fetchApi(endpoint, "GET");
};

export const openCashSession = async (
  opening_cash: number
): Promise<{ message: string; data: OpenCashSessionResult }> => {
  return fetchApi("/cash-sessions/open", "POST", { opening_cash });
};

export const closeCashSession = async (
  id: number,
  payload: { expected_cash: number; actual_cash: number }
): Promise<{ message: string; data: MutationResult }> => {
  return fetchApi(`/cash-sessions/${id}/close`, "POST", payload);
};

// --- Stock Movement API Calls ---
export type StockMovementReason =
  | "sale"
  | "stock_in"
  | "return"
  | "damage"
  | "expired"
  | "owner_use"
  | "correction";

export interface StockMovement {
  movement_id: number;
  product_id: number;
  quantity_delta: number;
  reason: StockMovementReason;
  source_type: string | null;
  source_id: number | null;
  note: string | null;
  created_by: number | null;
  created_at: string;
  client_mutation_id: string | null;
}

export interface CreateStockMovementInput {
  product_id: number;
  quantity_delta: number;
  reason: StockMovementReason;
  source_type?: string | null;
  source_id?: number | null;
  note?: string | null;
  client_mutation_id?: string;
}

export interface CreatedStockMovementResult {
  movement_id: number;
}

export const createStockMovement = async (
  movement: CreateStockMovementInput
): Promise<{ message: string; data: CreatedStockMovementResult }> => {
  return fetchApi("/stock-movements", "POST", movement);
};

export const listStockMovements = async (filters?: {
  product_id?: number;
  from?: string;
  to?: string;
}): Promise<{ message: string; data: StockMovement[] }> => {
  const query = new URLSearchParams();
  if (filters?.product_id)
    query.append("product_id", filters.product_id.toString());
  if (filters?.from) query.append("from", filters.from);
  if (filters?.to) query.append("to", filters.to);
  const endpoint = `/stock-movements${
    query.toString() ? `?${query.toString()}` : ""
  }`;
  return fetchApi(endpoint, "GET");
};

// --- Settings API Calls ---
export type StoreRole = "owner" | "admin" | "staff";

export interface StoreSettings {
  store_id: number;
  name: string;
  timezone: string;
  currency: string;
  receipt_name: string | null;
  receipt_address: string | null;
  receipt_phone: string | null;
  receipt_footer: string | null;
  tax_enabled: boolean;
  tax_rate: number;
  tax_label: string;
  require_cash_session: boolean;
  allow_negative_stock: boolean;
}

export interface StoreUser {
  user_id: number;
  email: string;
  name: string | null;
  is_active: boolean;
  role: StoreRole;
  joined_at: string;
}

export const getStoreSettings = async (): Promise<{
  message: string;
  data: StoreSettings;
}> => {
  return fetchApi("/settings/store", "GET");
};

export const updateStoreSettings = async (
  settings: Omit<StoreSettings, "store_id">
): Promise<{ message: string; data: StoreSettings }> => {
  return fetchApi("/settings/store", "PUT", settings);
};

export const listStoreUsers = async (): Promise<{
  message: string;
  data: StoreUser[];
}> => {
  return fetchApi("/settings/users", "GET");
};

export const updateStoreUserRole = async (
  userId: number,
  role: StoreRole
): Promise<{ message: string; data: MutationResult }> => {
  return fetchApi(`/settings/users/${userId}/role`, "PATCH", { role });
};
