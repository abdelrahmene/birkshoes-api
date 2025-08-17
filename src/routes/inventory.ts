import { Router } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { z } from 'zod';

const router = Router();

// Get inventory overview
router.get('/overview', auth, adminOnly, asyncHandler(async (req, res) => {
  const [totalProducts, lowStockProducts, outOfStockProducts, totalCategories] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { stock: { lte: 5 } },
              { variants: { some: { stock: { lte: 5 } } } }
            ]
          }
        ]
      }
    }),
    prisma.product.count({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { stock: 0 },
              { variants: { every: { stock: 0 } } }
            ]
          }
        ]
      }
    }),
    prisma.category.count({ where: { isActive: true } })
  ]);

  res.json({
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCategories
  });
}));

// Get all products with inventory details
router.get('/products', auth, adminOnly, asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', search, category, status } = req.query;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { sku: { contains: search as string } }
    ];
  }
  
  if (category) {
    where.categoryId = category;
  }
  
  if (status) {
    if (status === 'low_stock') {
      where.OR = [
        { stock: { lte: 5 } },
        { variants: { some: { stock: { lte: 5 } } } }
      ];
    } else if (status === 'out_of_stock') {
      where.OR = [
        { stock: 0 },
        { variants: { every: { stock: 0 } } }
      ];
    }
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        category: true,
        variants: true
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.product.count({ where })
  ]);

  const productsWithInventory = products.map(product => {
    const variants = product.variants?.map(variant => ({
      ...variant,
      options: variant.options ? JSON.parse(variant.options) : {}
    })) || [];
    
    const totalStock = variants.length > 0 
      ? variants.reduce((sum, variant) => sum + variant.stock, 0)
      : product.stock;
    
    return {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      variants,
      totalStock,
      isLowStock: variants.length > 0 
        ? variants.some(v => v.stock <= 5)
        : product.stock <= product.lowStock
    };
  });

  res.json({
    products: productsWithInventory,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// Update product stock
const updateStockSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  newStock: z.number().min(0),
  reason: z.string().optional()
});

router.patch('/stock', auth, adminOnly, asyncHandler(async (req, res) => {
  const { productId, variantId, newStock, reason } = updateStockSchema.parse(req.body);

  await prisma.$transaction(async (tx) => {
    if (variantId) {
      // Update variant stock
      const oldVariant = await tx.productVariant.findUnique({
        where: { id: variantId }
      });
      
      if (!oldVariant) {
        throw new Error('Variant not found');
      }

      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock }
      });

      // Log stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          productVariantId: variantId,
          type: newStock > oldVariant.stock ? 'IN' : 'OUT',
          quantity: Math.abs(newStock - oldVariant.stock),
          previousStock: oldVariant.stock,
          newStock,
          reason: reason || 'Manual adjustment'
        }
      });

      // Update product total stock
      const allVariants = await tx.productVariant.findMany({
        where: { productId }
      });
      const totalStock = allVariants.reduce((sum, v) => sum + (v.id === variantId ? newStock : v.stock), 0);
      
      await tx.product.update({
        where: { id: productId },
        data: { stock: totalStock }
      });
    } else {
      // Update product stock directly
      const oldProduct = await tx.product.findUnique({
        where: { id: productId }
      });
      
      if (!oldProduct) {
        throw new Error('Product not found');
      }

      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock }
      });

      // Log stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: newStock > oldProduct.stock ? 'IN' : 'OUT',
          quantity: Math.abs(newStock - oldProduct.stock),
          previousStock: oldProduct.stock,
          newStock,
          reason: reason || 'Manual adjustment'
        }
      });
    }
  });

  res.json({ message: 'Stock updated successfully' });
}));

// Bulk stock update
const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    newStock: z.number().min(0)
  })),
  reason: z.string().optional()
});

router.patch('/stock/bulk', auth, adminOnly, asyncHandler(async (req, res) => {
  const { updates, reason } = bulkUpdateSchema.parse(req.body);

  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      if (update.variantId) {
        const oldVariant = await tx.productVariant.findUnique({
          where: { id: update.variantId }
        });
        
        if (oldVariant) {
          await tx.productVariant.update({
            where: { id: update.variantId },
            data: { stock: update.newStock }
          });

          await tx.stockMovement.create({
            data: {
              productId: update.productId,
              productVariantId: update.variantId,
              type: update.newStock > oldVariant.stock ? 'IN' : 'OUT',
              quantity: Math.abs(update.newStock - oldVariant.stock),
              previousStock: oldVariant.stock,
              newStock: update.newStock,
              reason: reason || 'Bulk adjustment'
            }
          });
        }
      } else {
        const oldProduct = await tx.product.findUnique({
          where: { id: update.productId }
        });
        
        if (oldProduct) {
          await tx.product.update({
            where: { id: update.productId },
            data: { stock: update.newStock }
          });

          await tx.stockMovement.create({
            data: {
              productId: update.productId,
              type: update.newStock > oldProduct.stock ? 'IN' : 'OUT',
              quantity: Math.abs(update.newStock - oldProduct.stock),
              previousStock: oldProduct.stock,
              newStock: update.newStock,
              reason: reason || 'Bulk adjustment'
            }
          });
        }
      }
    }
  });

  res.json({ message: `Updated stock for ${updates.length} items` });
}));

export default router;