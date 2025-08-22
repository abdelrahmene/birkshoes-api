import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { z } from 'zod';

const router = Router();

// GET /api/media - Get all media files
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { folder, search, page = '1', limit = '100', type } = req.query;
  
  const where: any = {};
  
  if (folder && folder !== '/') {
    where.folder = folder as string;
  }
  
  if (search) {
    where.OR = [
      { filename: { contains: search as string } },
      { originalName: { contains: search as string } },
      { alt: { contains: search as string } }
    ];
  }

  if (type && type !== 'all') {
    if (type === 'images') {
      where.mimeType = { startsWith: 'image/' };
    } else if (type === 'videos') {
      where.mimeType = { startsWith: 'video/' };
    } else if (type === 'documents') {
      where.AND = [
        { mimeType: { not: { startsWith: 'image/' } } },
        { mimeType: { not: { startsWith: 'video/' } } }
      ];
    }
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  try {
    const [files, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.mediaFile.count({ where })
    ]);

    const filesWithTags = files.map(file => ({
      ...file,
      tags: file.tags ? JSON.parse(file.tags) : []
    }));

    res.json({
      files: filesWithTags,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({ error: 'Failed to fetch media files' });
  }
}));

// GET /api/media/:id - Get single media file
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id }
  });

  if (!mediaFile) {
    return res.status(404).json({ error: 'Media file not found' });
  }

  res.json({
    ...mediaFile,
    tags: mediaFile.tags ? JSON.parse(mediaFile.tags) : []
  });
}));

// PUT /api/media/:id - Update media file metadata
const updateMediaSchema = z.object({
  alt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional()
});

router.put('/:id', auth, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateMediaSchema.parse(req.body);

  const updateData: any = { ...data };
  if (data.tags !== undefined) {
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

// DELETE /api/media/:id - Delete media file
router.delete('/:id', auth, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // First check if file exists and get usage count
  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id }
  });

  if (!mediaFile) {
    return res.status(404).json({ error: 'File not found' });
  }

  // For now, allow deletion even if used (you can uncomment below to prevent)
  // if (mediaFile.usageCount > 0) {
  //   return res.status(400).json({ 
  //     error: 'Cannot delete file that is being used' 
  //   });
  // }

  try {
    // Delete from database
    await prisma.mediaFile.delete({
      where: { id }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}));

// GET /api/media/folders/list - Get list of folders
router.get('/folders/list', asyncHandler(async (req: Request, res: Response) => {
  const folders = await prisma.mediaFile.findMany({
    select: { folder: true },
    distinct: ['folder']
  });

  const folderList = folders
    .map(f => f.folder)
    .filter(folder => folder && folder !== '/')
    .sort();
  
  res.json({ folders: folderList });
}));

export default router;
