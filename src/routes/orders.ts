import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { CreateOrderRequest } from '../types';

const router = Router();

// GET /api/orders
router.get('/', auth, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;
  
  const where: any = {};
  if (status) {
    where.status = status;
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: true }
            },
            productVariant: {
              select: { id: true, name: true, options: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  const ordersWithImages = orders.map(order => ({
    ...order,
    items: order.items.map(item => ({
      ...item,
      product: {
        ...item.product,
        images: item.product.images ? JSON.parse(item.product.images) : []
      },
      productVariant: item.productVariant ? {
        ...item.productVariant,
        options: item.productVariant.options ? JSON.parse(item.productVariant.options) : {}
      } : null,
      variantOptions: item.variantOptions ? JSON.parse(item.variantOptions) : null
    }))
  }));

  res.json({
    orders: ordersWithImages,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// GET /api/orders/:id
router.get('/:id', auth, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            select: { id: true, name: true, images: true }
          },
          productVariant: {
            select: { id: true, name: true, options: true }
          }
        }
      }
    }
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const orderWithImages = {
    ...order,
    items: (order.items || []).map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        images: item.product.images ? JSON.parse(item.product.images) : []
      },
      productVariant: item.productVariant ? {
        ...item.productVariant,
        options: item.productVariant.options ? JSON.parse(item.productVariant.options) : {}
      } : null,
      variantOptions: item.variantOptions ? JSON.parse(item.variantOptions) : null
    }))
  };

  res.json(orderWithImages);
}));

// POST /api/orders
router.post('/', auth, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const orderData = req.body as CreateOrderRequest;

  // Generate order number
  const orderNumber = `BRK-${Date.now()}`;

  // Calculate totals
  let subtotal = 0;
  const items = [];

  for (const item of orderData.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { variants: true }
    });

    if (!product) {
      return res.status(400).json({ error: `Product ${item.productId} not found` });
    }

    let variant = null;
    if (item.productVariantId) {
      variant = product.variants.find(v => v.id === item.productVariantId);
      if (!variant) {
        return res.status(400).json({ error: `Variant ${item.productVariantId} not found` });
      }
    }

    const unitPrice = variant?.price || product.price;
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;

    items.push({
      productId: item.productId,
      productVariantId: item.productVariantId || null,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      productName: product.name,
      productSku: variant?.sku || product.sku || '',
      variantOptions: variant ? JSON.stringify(JSON.parse(variant.options)) : null
    });
  }

  const shippingCost = orderData.shippingCost || 0;
  const total = subtotal + shippingCost;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: orderData.customerId,
      subtotal,
      shippingCost,
      total,
      paymentMethod: orderData.paymentMethod || 'COD',
      shippingMethod: orderData.shippingMethod || 'standard',
      notes: orderData.notes,
      internalNotes: orderData.internalNotes,
      items: {
        create: items
      }
    },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            select: { id: true, name: true, images: true }
          },
          productVariant: {
            select: { id: true, name: true, options: true }
          }
        }
      }
    }
  });

  // Update stock
  for (const item of order.items || []) {
    if (item.productVariantId) {
      await prisma.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { decrement: item.quantity } }
      });
    } else {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    // Create stock movement
    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        productVariantId: item.productVariantId,
        type: 'OUT',
        quantity: -item.quantity,
        reason: 'Order',
        reference: order.id
      }
    });
  }

  const orderWithImages = {
    ...order,
    items: (order.items || []).map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        images: item.product.images ? JSON.parse(item.product.images) : []
      },
      productVariant: item.productVariant ? {
        ...item.productVariant,
        options: item.productVariant.options ? JSON.parse(item.productVariant.options) : {}
      } : null,
      variantOptions: item.variantOptions ? JSON.parse(item.variantOptions) : null
    }))
  };

  res.status(201).json(orderWithImages);
}));

// PUT /api/orders/:id
router.put('/:id', auth, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, paymentStatus, trackingNumber, yalidineId, notes, internalNotes } = req.body;

  const updateData: any = {};
  
  if (status) {
    updateData.status = status as any;
    
    // Set timestamps based on status
    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    } else if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }
  }

  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (yalidineId) updateData.yalidineId = yalidineId;
  if (notes !== undefined) updateData.notes = notes;
  if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      customer: true,
      items: {
        include: {
          product: {
            select: { id: true, name: true, images: true }
          },
          productVariant: {
            select: { id: true, name: true, options: true }
          }
        }
      }
    }
  });

  const orderWithImages = {
    ...order,
    items: (order.items || []).map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        images: item.product.images ? JSON.parse(item.product.images) : []
      },
      productVariant: item.productVariant ? {
        ...item.productVariant,
        options: item.productVariant.options ? JSON.parse(item.productVariant.options) : {}
      } : null,
      variantOptions: item.variantOptions ? JSON.parse(item.variantOptions) : null
    }))
  };

  res.json(orderWithImages);
}));

// DELETE /api/orders/:id
router.delete('/:id', auth, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'PENDING') {
    return res.status(400).json({ 
      error: 'Cannot delete order that is not pending. Cancel it instead.' 
    });
  }

  // Restore stock
  for (const item of order.items) {
    if (item.productVariantId) {
      await prisma.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { increment: item.quantity } }
      });
    } else {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });
    }

    // Create stock movement
    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        productVariantId: item.productVariantId,
        type: 'IN',
        quantity: item.quantity,
        reason: 'Order deleted',
        reference: order.id
      }
    });
  }

  await prisma.order.delete({
    where: { id }
  });

  res.json({ message: 'Order deleted successfully' });
}));

export default router;
