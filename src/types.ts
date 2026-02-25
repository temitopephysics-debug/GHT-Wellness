export interface Product {
  id: string;
  name: string;
  product_code: string;
  image_url: string;
  price_naira: number;
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
