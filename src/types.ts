export interface Product {
  id: string;
  name: string;
  product_code: string;
  image_url: string;
  image_desc_url?: string;
  price_naira: number;
  discount_percent: number;
  short_desc: string;
  long_desc?: string;
  health_benefits: string[];
  package?: string;
  usage?: string;
  ingredients?: string;
  warning?: string;
  stock_quantity?: number;
}

export interface PackageData {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  package_image_url?: string;
  health_benefits: string[];
  symptoms: string[];
  package_code?: string;
  products: Product[];
}

export type OrderStatus = 'pending' | 'verified' | 'paid' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentMethod = 'pod' | 'transfer';

export interface Order {
  id: string;
  created_at: string;
  full_name: string;
  phone_number: string;
  delivery_address: string;
  landmark?: string;
  delivery_date: string;
  payment_method: PaymentMethod;
  sender_name?: string;
  items: any[];
  total_amount: number;
  status: OrderStatus;
  access_token: string;
}
