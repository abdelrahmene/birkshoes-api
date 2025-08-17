import { prisma } from '../config/prisma';
import type { CreateProductInput, UpdateProductInput } from '../types/product';

export class ProductService {
  async getAllProducts(options: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { category, status, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (category) where.categoryId = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          variants: true,
          _count: { select: { variants: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return {
      products: products.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : []
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) return null;

    return {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      variants: product.variants.map(variant => ({
        ...variant,
        options: variant.options ? JSON.parse(variant.options) : {}
      }))
    };
  }

  async createProduct(data: CreateProductInput) {
    return await prisma.product.create({
      data: {
        ...data,
        images: data.images ? JSON.stringify(data.images) : '[]'
      },
      include: {
        category: true,
        variants: true
      }
    });
  }

  async updateProduct(id: string, data: UpdateProductInput) {
    return await prisma.product.update({
      where: { id },
      data: {
        ...data,
        images: data.images ? JSON.stringify(data.images) : undefined
      },
      include: {
        category: true,
        variants: true
      }
    });
  }

  async deleteProduct(id: string) {
    await prisma.product.delete({ where: { id } });
  }

  async toggleProductStatus(id: string, isActive: boolean) {
    return await prisma.product.update({
      where: { id },
      data: { isActive },
      include: {
        category: true,
        variants: true
      }
    });
  }
}

export const productService = new ProductService();
