import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// Get products with stock info
router.get('/products', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { lowStock, status } = req.query;
  
  const where: any = {};
  
  if (status) {
    where.status = status;
  }

  if (lowStock === 'true') {
    where.OR = [
      { stock: { lte: 5 } },
      { variants: { some: { stock: { lte: 5 } } } }
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      variants: true,
      category: {
        select: { name: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const productsWithStock = products.map(product => {
    const variants = product.variants?.map(variant => ({
      ...variant,
      options: variant.options ? JSON.parse(variant.options) : {}
    })) || [];

    const totalVariantStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
    const effectiveStock = variants.length > 0 ? totalVariantStock : product.stock;
    
    return {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      variants,
      effectiveStock,
      isLowStock: variants.length > 0 
        ? variants.some(v => v.stock <= 5)
        : product.stock <= product.lowStock
    };
  });

  res.json(productsWithStock);
}));

// Get stock movements
router.get('/movements', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, type, page = '1', limit = '50' } = req.query;
  
  const where: any = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },
        productVariant: {
          select: { id: true, name: true, sku: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.stockMovement.count({ where })
  ]);

  res.json({
    movements,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// Get stock alerts
router.get('/alerts', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const lowStockProducts = await prisma.product.findMany({
    where: {
      OR: [
        { stock: { lte: 5 } },
        { variants: { some: { stock: { lte: 5 } } } }
      ],
      isActive: true
    },
    include: {
      variants: {
        where: { stock: { lte: 5 } }
      }
    }
  });

  const alerts = lowStockProducts.flatMap(product => {
    const productAlerts = [];
    
    if (product.stock <= product.lowStock && product.variants.length === 0) {
      productAlerts.push({
        type: 'product',
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.stock,
        lowStockThreshold: product.lowStock,
        severity: product.stock === 0 ? 'critical' : 'warning'
      });
    }

    product.variants.forEach(variant => {
      productAlerts.push({
        type: 'variant',
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantName: variant.name,
        sku: variant.sku,
        currentStock: variant.stock,
        lowStockThreshold: 5,
        severity: variant.stock === 0 ? 'critical' : 'warning'
      });
    });

    return productAlerts;
  });

  res.json(alerts);
}));

// Sync stock
router.post('/sync-stock', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  let syncedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const product of products) {
      if (product.variants.length > 0) {
        const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
        if (product.stock !== totalStock) {
          await tx.product.update({
            where: { id: product.id },
            data: { stock: totalStock }
          });
          syncedCount++;
        }
      }
    }
  });

  res.json({ message: 'Stock synchronization completed', syncedCount });
}));

export default router;