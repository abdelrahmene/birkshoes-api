export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  sku?: string;
  categoryId: string;
  collectionId?: string;
  images: string[];
  variants: CreateProductVariantInput[];
  specifications?: Record<string, any>;
  isActive?: boolean;
  stock?: number;
  lowStockThreshold?: number;
}

export interface CreateProductVariantInput {
  name: string;
  price: number;
  stock: number;
  sku?: string;
  attributes: Record<string, string>;
  options?: Record<string, any>;
  isActive?: boolean;
  lowStockThreshold?: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  sku?: string;
  categoryId?: string;
  collectionId?: string;
  images?: string[];
  variants?: UpdateProductVariantInput[];
  specifications?: Record<string, any>;
  isActive?: boolean;
  stock?: number;
  lowStockThreshold?: number;
}

export interface UpdateProductVariantInput {
  id?: string;
  name?: string;
  price?: number;
  stock?: number;
  sku?: string;
  attributes?: Record<string, string>;
  options?: Record<string, any>;
  isActive?: boolean;
  lowStockThreshold?: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  categoryId: string;
  collectionId: string | null;
  images: string[];
  specifications: Record<string, any> | null;
  isActive: boolean;
  stock: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
  collection?: {
    id: string;
    name: string;
  } | null;
  variants: ProductVariantResponse[];
}

export interface ProductVariantResponse {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock: number;
  sku: string | null;
  attributes: Record<string, string>;
  isActive: boolean;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}
