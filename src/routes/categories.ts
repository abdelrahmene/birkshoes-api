import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// GET /api/categories
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { includeProducts } = req.query;

  const categories = await prisma.category.findMany({
    include: {
      parent: {
        select: { id: true, name: true }
      },
      children: {
        select: { id: true, name: true, slug: true }
      },
      ...(includeProducts && {
        products: {
          where: { isActive: true },
          select: { id: true, name: true, price: true, images: true }
        }
      }),
      _count: {
        select: { products: true, children: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  const categoriesWithImages = categories.map(category => ({
    ...category,
    ...(includeProducts && {
      products: category.products?.map((product: any) => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : []
      }))
    })
  }));

  res.json(categoriesWithImages);
}));

// GET /api/categories/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: {
        select: { id: true, name: true }
      },
      children: true,
      products: {
        where: { isActive: true },
        include: {
          variants: true
        }
      },
      categoryPage: true
    }
  });

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const categoryWithImages = {
    ...category,
    products: category.products?.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      tags: product.tags ? JSON.parse(product.tags) : [],
      variants: product.variants?.map(variant => ({
        ...variant,
        options: variant.options ? JSON.parse(variant.options) : {}
      })) || []
    }))
  };

  res.json(categoryWithImages);
}));

// POST /api/categories
router.post('/', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, slug, description, image, parentId } = req.body;

  const categorySlug = slug || name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const category = await prisma.category.create({
    data: {
      name,
      slug: categorySlug,
      description,
      image,
      parentId: parentId || null
    },
    include: {
      parent: {
        select: { id: true, name: true }
      },
      children: true,
      _count: {
        select: { products: true, children: true }
      }
    }
  });

  res.status(201).json(category);
}));

// PUT /api/categories/:id
router.put('/:id', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, slug, description, image, parentId } = req.body;

  const category = await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      image,
      parentId: parentId || null
    },
    include: {
      parent: {
        select: { id: true, name: true }
      },
      children: true,
      _count: {
        select: { products: true, children: true }
      }
    }
  });

  res.json(category);
}));

// DELETE /api/categories/:id
router.delete('/:id', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if category has products
  const productsCount = await prisma.product.count({
    where: { categoryId: id }
  });

  if (productsCount > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete category with products. Move products first.' 
    });
  }

  // Check if category has children
  const childrenCount = await prisma.category.count({
    where: { parentId: id }
  });

  if (childrenCount > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete category with subcategories. Delete subcategories first.' 
    });
  }

  await prisma.category.delete({
    where: { id }
  });

  res.json({ message: 'Category deleted successfully' });
}));

export default router;
