export interface CreateProductRequest {
  name: string;
  slug?: string;
  description?: string;
  shortDesc?: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  trackStock?: boolean;
  stock?: number;
  lowStock?: number;
  weight?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  seoTitle?: string;
  seoDesc?: string;
  images?: string[];
  categoryId?: string;
  collectionId?: string;
  hasVariants?: boolean;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  name: string;
  sku?: string;
  price?: number;
  stock: number;
  options: Record<string, any>;
}

export interface CreateOrderRequest {
  customerId: string;
  items: OrderItem[];
  shippingCost?: number;
  paymentMethod?: 'COD' | 'BANK_TRANSFER' | 'CCP' | 'EDAHABIA';
  shippingMethod?: string;
  notes?: string;
  internalNotes?: string;
}

export interface OrderItem {
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
}
