// Fix: Added mock data to be used throughout the application.
import { Product, Category, Supplier, Order, Sale } from './types';

export const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Beverages' },
  { id: 'cat-2', name: 'Snacks' },
  { id: 'cat-3', name: 'Electronics' },
  { id: 'cat-4', name: 'Apparel' },
];

export const SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Techtronics Inc.', contactPerson: 'John Doe', phone: '555-1234', email: 'john@techtronics.com', address: '123 Tech Lane, Silicon Valley, CA' },
  { id: 'sup-2', name: 'Global Foods Co.', contactPerson: 'Jane Smith', phone: '555-5678', email: 'jane@globalfoods.com', address: '456 Foodie Ave, Gourmet City, NY' },
  { id: 'sup-3', name: 'Fashion Forward', contactPerson: 'Emily White', phone: '555-8765', email: 'emily@fashionfwd.com', address: '789 Style St, Fashion District, LA' },
];

export const PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Espresso Machine', sku: 'EM-001', price: 299.99, stock: 15, categoryId: 'cat-3', supplierId: 'sup-1', barcode: '123456789012' },
  { id: 'prod-2', name: 'Organic Coffee Beans', sku: 'CB-001', price: 24.50, stock: 50, categoryId: 'cat-1', supplierId: 'sup-2', barcode: '123456789013' },
  { id: 'prod-3', name: 'Gourmet Chocolate Bar', sku: 'CB-002', price: 5.99, stock: 120, categoryId: 'cat-2', supplierId: 'sup-2', barcode: '123456789014' },
  { id: 'prod-4', name: 'Wireless Headphones', sku: 'WH-001', price: 149.99, stock: 8, categoryId: 'cat-3', supplierId: 'sup-1', barcode: '123456789015' },
  { id: 'prod-5', name: 'Designer T-Shirt', sku: 'TS-001', price: 49.99, stock: 35, categoryId: 'cat-4', supplierId: 'sup-3', barcode: '123456789016' },
  { id: 'prod-6', name: 'Sparkling Water 12-pack', sku: 'SW-001', price: 12.00, stock: 0, categoryId: 'cat-1', supplierId: 'sup-2', barcode: '123456789017' },
];

export const SALES_DATA: Sale[] = [
    { date: 'Mon', amount: 4000 },
    { date: 'Tue', amount: 3000 },
    { date: 'Wed', amount: 2000 },
    { date: 'Thu', amount: 2780 },
    { date: 'Fri', amount: 1890 },
    { date: 'Sat', amount: 2390 },
    { date: 'Sun', amount: 3490 },
];

const generateDate = (daysAgo: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
}

export const ORDERS: Order[] = [
    {
        id: 'ord-12345', date: generateDate(1),
        items: [
            { id: 'item-1', productId: 'prod-2', name: 'Organic Coffee Beans', price: 24.50, quantity: 2, categoryId: 'cat-1' },
            { id: 'item-2', productId: 'prod-3', name: 'Gourmet Chocolate Bar', price: 5.99, quantity: 5, categoryId: 'cat-2' },
        ],
        subtotal: 78.95, tax: 6.32, total: 85.27, paymentMethod: 'card',
    },
    {
        id: 'ord-12346', date: generateDate(8),
        items: [{ id: 'item-3', productId: 'prod-5', name: 'Designer T-Shirt', price: 49.99, quantity: 1, categoryId: 'cat-4' }],
        subtotal: 49.99, tax: 4.00, total: 53.99, paymentMethod: 'cash',
    },
    {
        id: 'ord-12347', date: generateDate(35),
        items: [{ id: 'item-4', productId: 'prod-4', name: 'Wireless Headphones', price: 149.99, quantity: 1, categoryId: 'cat-3' }],
        subtotal: 149.99, tax: 12.00, total: 161.99, paymentMethod: 'card',
    },
     {
        id: 'ord-12348', date: generateDate(40),
        items: [{ id: 'item-5', productId: 'prod-1', name: 'Espresso Machine', price: 299.99, quantity: 1, categoryId: 'cat-3' }],
        subtotal: 299.99, tax: 24.00, total: 323.99, paymentMethod: 'card',
    },
     {
        id: 'ord-12349', date: generateDate(400),
        items: [{ id: 'item-6', productId: 'prod-2', name: 'Organic Coffee Beans', price: 24.50, quantity: 10, categoryId: 'cat-1' }],
        subtotal: 245.00, tax: 19.60, total: 264.60, paymentMethod: 'card',
    },
];