import { Customer, Product } from "../utils/api";
import { putInStore, readAllFromStore } from "./db";

type CachedProduct = Product & { local_id: string; cached_at: string };
type CachedCustomer = Customer & { local_id: string; cached_at: string };

function stripCacheFields<T extends { local_id?: string; cached_at?: string }>(
  value: T
) {
  const { local_id, cached_at, ...rest } = value;
  return rest;
}

export async function cacheProducts(products: Product[]) {
  const cachedAt = new Date().toISOString();
  for (const product of products) {
    await putInStore<CachedProduct>("products", {
      ...product,
      local_id: `product:${product.product_id}`,
      cached_at: cachedAt,
    });
  }
}

export async function readCachedProducts() {
  const rows = await readAllFromStore<CachedProduct>("products");
  return rows
    .map((row) => stripCacheFields(row) as Product)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function cacheCustomers(customers: Customer[]) {
  const cachedAt = new Date().toISOString();
  for (const customer of customers) {
    await putInStore<CachedCustomer>("customers", {
      ...customer,
      local_id: `customer:${customer.customer_id}`,
      cached_at: cachedAt,
    });
  }
}

export async function readCachedCustomers() {
  const rows = await readAllFromStore<CachedCustomer>("customers");
  return rows
    .map((row) => stripCacheFields(row) as Customer)
    .sort((a, b) => a.name.localeCompare(b.name));
}
