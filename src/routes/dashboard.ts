import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// GET /api/dashboard - Dashboard stats
router.get('/', auth, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { period = '30' } = req.query;
  
  const daysBack = parseInt(period as string);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get basic stats
  const [
    totalProducts,
    totalCustomers,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    shippedOrders,
    deliveredOrders,
    totalRevenue,
    recentOrders,
    lowStockProducts,
    topProducts,
    revenueData
  ] = await Promise.all([
    // Total products
    prisma.product.count(),
    
    // Total customers
    prisma.customer.count(),
    
    // Total orders
    prisma.order.count(),
    
    // Orders by status
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'CONFIRMED' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    
    // Total revenue
    prisma.order.aggregate({
      where: { 
        status: { in: ['DELIVERED', 'SHIPPED'] },
        createdAt: { gte: startDate }
      },
      _sum: { total: true }
    }),
    
    // Recent orders
    prisma.order.findMany({
      take: 10,
      include: {
        customer: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    
    // Low stock products
    prisma.product.findMany({
      where: {
        OR: [
          { stock: { lte: 5 } },
          { variants: { some: { stock: { lte: 5 } } } }
        ],
        isActive: true
      },
      take: 10,
      include: {
        variants: {
          where: { stock: { lte: 5 } }
        }
      }
    }),
    
    // Top selling products
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { in: ['DELIVERED', 'SHIPPED'] }
        }
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10
    }),
    
    // Revenue data for chart (last 7 days)
    prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        status: { in: ['DELIVERED', 'SHIPPED'] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      _sum: { total: true }
    })
  ]);

  // Get product details for top products
  const topProductsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, price: true, images: true }
      });
      return {
        ...product,
        soldQuantity: item._sum.quantity || 0,
        images: product?.images ? JSON.parse(product.images) : []
      };
    })
  );

  // Parse images for low stock products
  const lowStockWithImages = lowStockProducts.map(product => ({
    ...product,
    images: product.images ? JSON.parse(product.images) : []
  }));

  const stats = {
    totalProducts,
    totalCustomers,
    totalOrders,
    ordersByStatus: {
      pending: pendingOrders,
      confirmed: confirmedOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders
    },
    totalRevenue: totalRevenue._sum.total || 0,
    recentOrders,
    lowStockProducts: lowStockWithImages,
    topProducts: topProductsWithDetails,
    revenueChart: revenueData
  };

  res.json(stats);
}));

// GET /api/dashboard/analytics - Advanced analytics
router.get('/analytics', auth, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { period = '30' } = req.query;
  
  const daysBack = parseInt(period as string);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Sales analytics
  const [
    salesData,
    categoryData,
    customerData,
    inventoryData
  ] = await Promise.all([
    // Daily sales data
    prisma.order.findMany({
      where: {
        status: { in: ['DELIVERED', 'SHIPPED'] },
        createdAt: { gte: startDate }
      },
      select: {
        total: true,
        createdAt: true
      }
    }),
    
    // Sales by category
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { in: ['DELIVERED', 'SHIPPED'] },
          createdAt: { gte: startDate }
        }
      },
      _sum: { totalPrice: true, quantity: true }
    }),
    
    // Customer analytics
    prisma.customer.findMany({
      include: {
        orders: {
          where: { createdAt: { gte: startDate } },
          select: { total: true, status: true }
        }
      }
    }),
    
    // Inventory turnover
    prisma.stockMovement.groupBy({
      by: ['productId', 'type'],
      where: { createdAt: { gte: startDate } },
      _sum: { quantity: true }
    })
  ]);

  res.json({
    salesData,
    categoryData,
    customerData,
    inventoryData
  });
}));

export default router;
