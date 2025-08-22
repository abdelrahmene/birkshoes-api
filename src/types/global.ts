export interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface StockAlert {
  type: 'product' | 'variant';
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku?: string;
  currentStock: number;
  lowStockThreshold: number;
  severity: 'warning' | 'critical';
}
