import { prisma } from '../config/prisma';
import { OrderStatus } from '@prisma/client';

export class OrderService {
  async getAllOrders(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { email: { contains: search } } },
        { customer: { firstName: { contains: search } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          items: {
            include: {
              product: {
                select: { name: true, images: true }
              },
              productVariant: {
                select: { name: true, options: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders: orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          product: item.product ? {
            ...item.product,
            images: item.product.images ? JSON.parse(item.product.images) : []
          } : null,
          productVariant: item.productVariant ? {
            ...item.productVariant,
            options: item.productVariant.options ? JSON.parse(item.productVariant.options) : {}
          } : null
        }))
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            productVariant: true
          }
        }
      }
    });

    if (!order) return null;

    return {
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: item.product ? {
          ...item.product,
          images: item.product.images ? JSON.parse(item.product.images) : []
        } : null,
        productVariant: item.productVariant ? {
          ...item.productVariant,
          options: item.productVariant.options ? JSON.parse(item.productVariant.options) : {}
        } : null
      }))
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    return await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: true
      }
    });
  }
}

export const orderService = new OrderService();