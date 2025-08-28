import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { CreateProductRequest } from '../types';

const router = Router();

// Get all products with filters
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = '1', 
    limit = '20', 
    category, 
    collection, 
    status, 
    featured, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  
  if (category) {
    where.categoryId = category;
  }
  
  if (collection) {
    where.collectionId = collection;
  }
  
  if (status) {
    where.status = status;
  }
  
  if (featured === 'true') {
    where.isFeatured = true;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { description: { contains: search as string } },
      { sku: { contains: search as string } }
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        collection: {
          select: { id: true, name: true, slug: true }
        },
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            options: true
          }
        }
      },
      orderBy: { [sortBy as string]: sortOrder }
    }),
    prisma.product.count({ where })
  ]);

  const productsWithParsedData = products.map(product => ({
    ...product,
    images: product.images ? JSON.parse(product.images) : [],
    tags: product.tags ? JSON.parse(product.tags) : [],
    variants: product.variants.map(variant => ({
      ...variant,
      options: variant.options ? JSON.parse(variant.options) : {}
    }))
  }));

  res.json({
    products: productsWithParsedData,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// Get product by slug
router.get('/slug/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        select: { id: true, name: true, slug: true }
      },
      collection: {
        select: { id: true, name: true, slug: true }
      },
      variants: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          options: true,
          sku: true
        }
      }
    }
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const productWithParsedData = {
    ...product,
    images: product.images ? JSON.parse(product.images) : [],
    tags: product.tags ? JSON.parse(product.tags) : [],
    variants: product.variants.map(variant => ({
      ...variant,
      options: variant.options ? JSON.parse(variant.options) : {}
    }))
  };

  res.json(productWithParsedData);
}));

// Get single product
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true, slug: true }
      },
      collection: {
        select: { id: true, name: true, slug: true }
      },
      variants: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          options: true,
          sku: true
        }
      }
    }
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const productWithParsedData = {
    ...product,
    images: product.images ? JSON.parse(product.images) : [],
    tags: product.tags ? JSON.parse(product.tags) : [],
    variants: product.variants.map(variant => ({
      ...variant,
      options: variant.options ? JSON.parse(variant.options) : {}
    }))
  };

  res.json(productWithParsedData);
}));

// Create product
router.post('/', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data: CreateProductRequest = req.body;

  // Generate unique slug from name
  let baseSlug = data.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  // Check for existing slug
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Check for existing SKU if provided
  if (data.sku) {
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      return res.status(400).json({ 
        error: "Resource already exists", 
        details: "A product with this SKU already exists" 
      });
    }
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      sku: data.sku,
      categoryId: data.categoryId,
      collectionId: data.collectionId,
      images: data.images ? JSON.stringify(data.images) : null,
      stock: data.stock || 0,
      lowStock: data.lowStockThreshold || 5,
      isActive: data.isActive ?? true,
      status: 'ACTIVE',
      variants: data.variants ? {
        create: data.variants.map(variant => ({
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
          options: JSON.stringify(variant.options)
        }))
      } : undefined
    },
    include: {
      category: true,
      collection: true,
      variants: true
    }
  });

  res.status(201).json(product);
}));

// Update product
router.put('/:id', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      sku: data.sku,
      categoryId: data.categoryId,
      collectionId: data.collectionId,
      images: data.images ? JSON.stringify(data.images) : undefined,
      stock: data.stock,
      lowStock: data.lowStockThreshold,
      isActive: data.isActive,
      status: data.status
    },
    include: {
      category: true,
      collection: true,
      variants: true
    }
  });

  res.json(product);
}));

// Search products
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  
  if (!q) {
    return res.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q as string } },
        { sku: { contains: q as string } }
      ],
      isActive: true
    },
    take: 10,
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      sku: true
    }
  });

  const productsWithImages = products.map(product => ({
    ...product,
    images: product.images ? JSON.parse(product.images) : []
  }));

  res.json({ products: productsWithImages });
}));

// Delete product
router.delete('/:id', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await prisma.product.delete({
    where: { id }
  });

  res.json({ message: 'Product deleted successfully' });
}));

export default router;