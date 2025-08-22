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
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } }
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
    // Generate slug from name
    const slug = data.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        sku: data.sku,
        images: data.images ? JSON.stringify(data.images) : '[]',
        stock: data.stock || 0,
        lowStock: data.lowStockThreshold || 5,
        isActive: data.isActive ?? true,
        status: 'ACTIVE',
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
        collection: data.collectionId ? { connect: { id: data.collectionId } } : undefined,
        variants: data.variants ? {
          create: data.variants.map(variant => ({
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            options: variant.options ? JSON.stringify(variant.options) : '{}'
          }))
        } : undefined
      },
      include: {
        category: true,
        variants: true
      }
    });
  }

  async updateProduct(id: string, data: UpdateProductInput) {
    const updateData: any = {
      name: data.name,
      description: data.description,
      price: data.price,
      sku: data.sku,
      images: data.images ? JSON.stringify(data.images) : undefined,
      stock: data.stock,
      lowStock: data.lowStockThreshold,
      isActive: data.isActive
    };

    // Handle category connection
    if (data.categoryId) {
      updateData.category = { connect: { id: data.categoryId } };
    }

    // Handle collection connection
    if (data.collectionId) {
      updateData.collection = { connect: { id: data.collectionId } };
    }

    return await prisma.product.update({
      where: { id },
      data: updateData,
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