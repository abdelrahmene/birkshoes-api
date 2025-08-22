export * from './express';
export * from './global';
export * from './product';

export interface CreateOrderRequest {
  customerId: string;
  items: OrderItemInput[];
  shippingMethod?: string;
  shippingCost?: number;
  paymentMethod?: 'COD' | 'BANK_TRANSFER' | 'CCP' | 'EDAHABIA';
  notes?: string;
  internalNotes?: string;
}

export interface OrderItemInput {
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  sku?: string;
  categoryId?: string;
  collectionId?: string;
  images?: string[];
  variants?: CreateProductVariantInput[];
  isActive?: boolean;
  stock?: number;
  lowStockThreshold?: number;
}

export interface CreateProductVariantInput {
  name: string;
  sku?: string;
  price?: number;
  stock: number;
  options: Record<string, any>;
}

export interface UpdateProductVariantInput {
  id?: string;
  name?: string;
  sku?: string;
  price?: number;
  stock?: number;
  options?: Record<string, any>;
}
