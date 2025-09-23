// Fix: Added type definitions for the application
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  categoryId: string;
  supplierId?: string;
  barcode?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  categoryId: string; // Added for easier filtering
}

export interface Order {
  id: string;
  date: Date;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount?: number; // value of discount
  discountAmount?: number; // calculated amount
  discountType?: 'percentage' | 'fixed'; // type of discount
  paymentMethod: 'cash' | 'card';
}

export interface Sale {
  date: string;
  amount: number;
}