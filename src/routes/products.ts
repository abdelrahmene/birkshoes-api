import { Router } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { CreateProductRequest } from '../types';

const router = Router();

// GET /api/products
router.get('/', asyncHandler(async (req, res) => {
  const { limit, status, search, category, collection } = req.query;
  
  const where: any = {};
  
  if (status === 'active') {
    where.isActive = true;
    where.status = 'ACTIVE';
  } else if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { sku: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  if (collection) {
    where.collectionId = collection;
  }

  const products = await prisma.product.findMany({
    where,
    take: limit ? parseInt(limit as string) : undefined,
    include: {
      category: {
        select: { name: true }
      },
      collection: {
        select: { name: true }
      },
      variants: true,
      _count: {
        select: {
          variants: true,
          orderItems: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // Parse JSON fields
  const productsWithImages = products.map(product => ({
    ...product,
    images: product.images ? JSON.parse(product.images) : [],
    tags: product.tags ? JSON.parse(product.tags) : [],
    variants: product.variants?.map(variant => ({
      ...variant,
      options: variant.options ? JSON.parse(variant.options) : {}
    })) || []
  }));

  res.json(productsWithImages);
}));

// GET /api/products/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true }
      },
      collection: {
        select: { id: true, name: true }
      },
      variants: true
    }
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const productWithImages = {
    ...product,
    images: product.images ? JSON.parse(product.images) : [],
    tags: product.tags ? JSON.parse(product.tags) : [],
    variants: product.variants?.map(variant => ({
      ...variant,
      options: variant.options ? JSON.parse(variant.options) : {}
    })) || []
  };

  res.json(productWithImages);
}));

// POST /api/products
router.post('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const body = req.body as CreateProductRequest;
  
  const {
    name,
    slug,
    description,
    shortDesc,
    price,
    comparePrice,
    cost,
    sku,
    barcode,
    trackStock,
    stock,
    lowStock,
    weight,
    status,
    isActive,
    isFeatured,
    tags,
    seoTitle,
    seoDesc,
    images,
    categoryId,
    collectionId,
    hasVariants,
    variants
  } = body;

  // Generate slug if not provided
  const productSlug = slug || name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Use transaction for product and variants
  const result = await prisma.$transaction(async (tx) => {
    // Calculate stock based on variants
    let productStock = 0;
    if (hasVariants && variants && Array.isArray(variants) && variants.length > 0) {
      productStock = 0; // Stock principal = 0 pour les produits avec variantes
    } else {
      productStock = parseInt(String(stock)) || 0;
    }

    // Create product
    const product = await tx.product.create({
      data: {
        name,
        slug: productSlug,
        description,
        shortDesc,
        price: parseFloat(String(price)),
        comparePrice: comparePrice ? parseFloat(String(comparePrice)) : null,
        cost: cost ? parseFloat(String(cost)) : null,
        sku,
        barcode,
        trackStock: trackStock ?? true,
        stock: productStock,
        lowStock: parseInt(String(lowStock)) || 5,
        weight: weight ? parseFloat(String(weight)) : null,
        status: status || 'DRAFT',
        isActive: isActive ?? false,
        isFeatured: isFeatured ?? false,
        tags: tags ? JSON.stringify(tags) : null,
        seoTitle,
        seoDesc,
        images: images ? JSON.stringify(images) : null,
        categoryId: categoryId || null,
        collectionId: collectionId || null
      }
    });

    // Create variants if provided
    if (hasVariants && variants && Array.isArray(variants) && variants.length > 0) {
      const variantData = variants.map((variant: any) => ({
        productId: product.id,
        name: variant.name,
        sku: variant.sku || null,
        price: variant.price ? parseFloat(String(variant.price)) : null,
        stock: parseInt(String(variant.stock)) || 0,
        options: JSON.stringify(variant.options || {})
      }));

      await tx.productVariant.createMany({
        data: variantData
      });
    }

    return await tx.product.findUnique({
      where: { id: product.id },
      include: {
        category: { select: { name: true } },
        collection: { select: { name: true } },
        variants: true
      }
    });
  });

  // Parse response data
  const productWithParsedData = {
    ...result,
    images: result!.images ? JSON.parse(result!.images) : [],
    tags: result!.tags ? JSON.parse(result!.tags) : [],
    variants: result!.variants?.map(variant => ({
      ...variant,
      options: variant.options ? JSON.parse(variant.options) : {}
    })) || []
  };

  res.status(201).json(productWithParsedData);
}));

// PUT /api/products/:id
router.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { variants: newVariants, hasVariants, ...updateData } = req.body;

  // Convert numeric fields
  if (updateData.price) updateData.price = parseFloat(updateData.price);
  if (updateData.comparePrice) updateData.comparePrice = parseFloat(updateData.comparePrice);
  if (updateData.cost) updateData.cost = parseFloat(updateData.cost);
  if (updateData.stock) updateData.stock = parseInt(updateData.stock);
  if (updateData.lowStock) updateData.lowStock = parseInt(updateData.lowStock);
  if (updateData.weight) updateData.weight = parseFloat(updateData.weight);

  // Handle JSON fields
  if (updateData.tags) updateData.tags = JSON.stringify(updateData.tags);
  if (updateData.images) updateData.images = JSON.stringify(updateData.images);

  const result = await prisma.$transaction(async (tx) => {
    // Calculate stock
    if (hasVariants && newVariants && Array.isArray(newVariants) && newVariants.length > 0) {
      updateData.stock = 0; // Stock principal = 0 pour les variantes
    } else if (hasVariants === false) {
      // Conversion vers produit simple
    }

    // Update product
    const product = await tx.product.update({
      where: { id },
      data: updateData
    });

    // Handle variants
    if (hasVariants && newVariants && Array.isArray(newVariants)) {
      // Delete existing variants
      await tx.productVariant.deleteMany({
        where: { productId: id }
      });

      // Create new variants
      if (newVariants.length > 0) {
        const variantData = newVariants.map((variant: any) => ({
          productId: id,
          name: variant.name,
          sku: variant.sku || null,
          price: variant.price ? parseFloat(variant.price) : null,
          stock: parseInt(variant.stock) || 0,
          options: JSON.stringify(variant.options || {})
        }));

        await tx.productVariant.createMany({
          data: variantData
        });
      }
    } else if (hasVariants === false) {
      // Delete all variants if switching to simple product
      await tx.productVariant.deleteMany({
        where: { productId: id }
      });
    }

    return await tx.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        collection: { select: { name: true } },
        variants: true
      }
    });
  });

  const productWithParsedData = {
    ...result,
    images: result!.images ? JSON.parse(result!.images) : [],
    tags: result!.tags ? JSON.parse(result!.tags) : [],
    variants: result!.variants?.map(variant => ({
      ...variant,
      options: variant.options ? JSON.parse(variant.options) : {}
    })) || []
  };

  res.json(productWithParsedData);
}));

// GET /api/products/search - Must be BEFORE /:id route
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { sku: { contains: q as string, mode: 'insensitive' } }
      ]
    },
    take: 10,
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      images: true
    }
  });

  const productsWithImages = products.map(product => ({
    ...product,
    images: product.images ? JSON.parse(product.images) : []
  }));

  res.json(productsWithImages);
}));

// DELETE /api/products/:id
router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if product has orders
  const ordersCount = await prisma.orderItem.count({
    where: { productId: id }
  });

  if (ordersCount > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete product with existing orders. Archive it instead.' 
    });
  }

  await prisma.product.delete({
    where: { id }
  });

  res.json({ message: 'Product deleted successfully' });
}));

export default router;
