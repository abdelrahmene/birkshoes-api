import { Router } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { z } from 'zod';

const router = Router();

// GET /api/content/home-sections - Get home page sections (avec debug amélioré)
router.get('/home-sections', asyncHandler(async (req, res) => {
  console.log('🔍 API: Récupération des sections home...');
  
  const sections = await prisma.homeSection.findMany({
    where: { isVisible: true },
    orderBy: { order: 'asc' }
  });

  console.log(`✅ API: ${sections.length} sections trouvées`);
  sections.forEach(section => {
    console.log(`📄 API: Section - ID: ${section.id}, Type: ${section.type}, Titre: ${section.title}, Visible: ${section.isVisible}, Ordre: ${section.order}`);
  });

  const sectionsWithParsedContent = sections.map(section => ({
    ...section,
    content: section.content ? JSON.parse(section.content) : {}
  }));

  console.log('✅ API: Sections avec contenu parsé renvoyées');
  res.json(sectionsWithParsedContent);
}));

// GET /api/content/home-sections/all (admin) - Temporairement sans auth pour test
router.get('/home-sections/all', asyncHandler(async (req, res) => {
  const sections = await prisma.homeSection.findMany({
    orderBy: { order: 'asc' }
  });

  const sectionsWithParsedContent = sections.map(section => ({
    ...section,
    content: section.content ? JSON.parse(section.content) : {}
  }));

  res.json(sectionsWithParsedContent);
}));

// GET /api/content/home-section/:id - Get specific home section
router.get('/home-section/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const section = await prisma.homeSection.findUnique({
    where: { id }
  });

  if (!section) {
    return res.status(404).json({ error: 'Home section not found' });
  }

  res.json({
    ...section,
    content: section.content ? JSON.parse(section.content) : {}
  });
}));

// POST /api/content/home-sections
const createHomeSectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1), // hero, categories, collection, etc.
  content: z.object({}).passthrough(), // Accept any JSON object
  isVisible: z.boolean().default(true),
  order: z.number().default(0)
});

router.post('/home-sections', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = createHomeSectionSchema.parse(req.body);

  const section = await prisma.homeSection.create({
    data: {
      ...data,
      content: JSON.stringify(data.content)
    }
  });

  res.status(201).json({
    ...section,
    content: JSON.parse(section.content)
  });
}));

// PUT /api/content/home-sections/:id
const updateHomeSectionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().min(1).optional(),
  content: z.object({}).passthrough().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().optional()
});

router.put('/home-sections/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateHomeSectionSchema.parse(req.body);

  const updateData: any = { ...data };
  if (data.content) {
    updateData.content = JSON.stringify(data.content);
  }

  const section = await prisma.homeSection.update({
    where: { id },
    data: updateData
  });

  res.json({
    ...section,
    content: JSON.parse(section.content)
  });
}));

// DELETE /api/content/home-sections/:id
router.delete('/home-sections/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.homeSection.delete({
    where: { id }
  });

  res.json({ message: 'Home section deleted successfully' });
}));

// PATCH /api/content/home-sections/reorder
const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string())
});

router.patch('/home-sections/reorder', auth, adminOnly, asyncHandler(async (req, res) => {
  const { sectionIds } = reorderSectionsSchema.parse(req.body);

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < sectionIds.length; i++) {
      await tx.homeSection.update({
        where: { id: sectionIds[i] },
        data: { order: i }
      });
    }
  });

  res.json({ message: 'Sections reordered successfully' });
}));

// GET /api/content/category-pages/:categoryId
router.get('/category-pages/:categoryId', asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const categoryPage = await prisma.categoryPage.findUnique({
    where: { categoryId },
    include: {
      category: {
        select: { id: true, name: true, slug: true }
      }
    }
  });

  if (!categoryPage) {
    return res.status(404).json({ error: 'Category page not found' });
  }

  res.json(categoryPage);
}));

// POST /api/content/category-pages
const createCategoryPageSchema = z.object({
  categoryId: z.string(),
  heroImage: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  description: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  customCss: z.string().optional(),
  isActive: z.boolean().default(true)
});

router.post('/category-pages', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = createCategoryPageSchema.parse(req.body);

  const categoryPage = await prisma.categoryPage.create({
    data,
    include: {
      category: {
        select: { id: true, name: true, slug: true }
      }
    }
  });

  res.status(201).json(categoryPage);
}));

// PUT /api/content/category-pages/:id
const updateCategoryPageSchema = z.object({
  heroImage: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  description: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  customCss: z.string().optional(),
  isActive: z.boolean().optional()
});

router.put('/category-pages/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateCategoryPageSchema.parse(req.body);

  const categoryPage = await prisma.categoryPage.update({
    where: { id },
    data,
    include: {
      category: {
        select: { id: true, name: true, slug: true }
      }
    }
  });

  res.json(categoryPage);
}));

// GET /api/content/media - Temporairement sans auth pour test
router.get('/media', asyncHandler(async (req, res) => {
  const { folder, search, page = '1', limit = '20' } = req.query;
  
  const where: any = {};
  
  if (folder) where.folder = folder;
  if (search) {
    where.OR = [
      { filename: { contains: search as string } },
      { originalName: { contains: search as string } },
      { alt: { contains: search as string } }
    ];
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const [media, total] = await Promise.all([
    prisma.mediaFile.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.mediaFile.count({ where })
  ]);

  const mediaWithTags = media.map(file => ({
    ...file,
    tags: file.tags ? JSON.parse(file.tags) : []
  }));

  res.json({
    media: mediaWithTags,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// POST /api/content/media
const createMediaFileSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  path: z.string(),
  url: z.string(),
  alt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().default('/'),
  uploadedBy: z.string().optional()
});

router.post('/media', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = createMediaFileSchema.parse(req.body);

  const mediaFile = await prisma.mediaFile.create({
    data: {
      ...data,
      tags: data.tags ? JSON.stringify(data.tags) : null
    }
  });

  res.status(201).json({
    ...mediaFile,
    tags: mediaFile.tags ? JSON.parse(mediaFile.tags) : []
  });
}));

// PUT /api/content/media/:id
const updateMediaFileSchema = z.object({
  alt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
  isUsed: z.boolean().optional()
});

router.put('/media/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateMediaFileSchema.parse(req.body);

  const updateData: any = { ...data };
  if (data.tags) {
    updateData.tags = JSON.stringify(data.tags);
  }

  const mediaFile = await prisma.mediaFile.update({
    where: { id },
    data: updateData
  });

  res.json({
    ...mediaFile,
    tags: mediaFile.tags ? JSON.parse(mediaFile.tags) : []
  });
}));

// DELETE /api/content/media/:id
router.delete('/media/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id }
  });

  if (!mediaFile) {
    return res.status(404).json({ error: 'Media file not found' });
  }

  if (mediaFile.usageCount > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete media file that is being used' 
    });
  }

  await prisma.mediaFile.delete({
    where: { id }
  });

  res.json({ message: 'Media file deleted successfully' });
}));

export default router;
