import { Router } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// GET /api/collections
router.get('/', asyncHandler(async (req, res) => {
  const { includeProducts } = req.query;

  const collections = await prisma.collection.findMany({
    include: {
      category: {
        select: { id: true, name: true }
      },
      ...(includeProducts && {
        products: {
          where: { isActive: true },
          select: { id: true, name: true, price: true, images: true }
        }
      }),
      _count: {
        select: { products: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const collectionsWithImages = collections.map(collection => ({
    ...collection,
    ...(includeProducts && {
      products: collection.products?.map((product: any) => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : []
      }))
    })
  }));

  res.json(collectionsWithImages);
}));

// GET /api/collections/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true }
      },
      products: {
        where: { isActive: true },
        include: {
          variants: true
        }
      }
    }
  });

  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  const collectionWithImages = {
    ...collection,
    products: collection.products?.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      tags: product.tags ? JSON.parse(product.tags) : [],
      variants: product.variants?.map(variant => ({
        ...variant,
        options: variant.options ? JSON.parse(variant.options) : {}
      })) || []
    }))
  };

  res.json(collectionWithImages);
}));

// POST /api/collections
router.post('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const { name, slug, description, image, categoryId, isActive } = req.body;

  const collectionSlug = slug || name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const collection = await prisma.collection.create({
    data: {
      name,
      slug: collectionSlug,
      description,
      image,
      categoryId: categoryId || null,
      isActive: isActive ?? true
    },
    include: {
      category: {
        select: { id: true, name: true }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  res.status(201).json(collection);
}));

// PUT /api/collections/:id
router.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, image, categoryId, isActive } = req.body;

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      image,
      categoryId: categoryId || null,
      isActive
    },
    include: {
      category: {
        select: { id: true, name: true }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  res.json(collection);
}));

// DELETE /api/collections/:id
router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if collection has products
  const productsCount = await prisma.product.count({
    where: { collectionId: id }
  });

  if (productsCount > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete collection with products. Remove products first.' 
    });
  }

  await prisma.collection.delete({
    where: { id }
  });

  res.json({ message: 'Collection deleted successfully' });
}));

export default router;
