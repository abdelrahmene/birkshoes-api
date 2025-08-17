import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma';
import { auth, adminOnly } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { config } from '../config/config';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || '/';
    const fullPath = path.join(uploadDir, folder);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// File filter for allowed file types
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB by default
  }
});

// POST /api/upload/single - Upload single file
router.post('/single', auth, adminOnly, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { alt, tags, folder = '/' } = req.body;
  const userId = req.user?.id;

  // Generate URL
  const relativePath = path.relative(uploadDir, req.file.path);
  const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;

  // Save to database
  const mediaFile = await prisma.mediaFile.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url,
      alt: alt || null,
      tags: tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : null,
      folder,
      uploadedBy: userId
    }
  });

  res.status(201).json({
    id: mediaFile.id,
    url: mediaFile.url,
    filename: mediaFile.filename,
    originalName: mediaFile.originalName,
    size: mediaFile.size,
    mimeType: mediaFile.mimeType,
    alt: mediaFile.alt,
    tags: mediaFile.tags ? JSON.parse(mediaFile.tags) : [],
    folder: mediaFile.folder
  });
}));

// POST /api/upload/multiple - Upload multiple files
router.post('/multiple', auth, adminOnly, upload.array('files', 10), asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const { folder = '/', tags } = req.body;
  const userId = req.user?.id;

  const uploadedFiles = [];

  for (const file of files) {
    const relativePath = path.relative(uploadDir, file.path);
    const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    const mediaFile = await prisma.mediaFile.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url,
        folder,
        tags: tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : null,
        uploadedBy: userId
      }
    });

    uploadedFiles.push({
      id: mediaFile.id,
      url: mediaFile.url,
      filename: mediaFile.filename,
      originalName: mediaFile.originalName,
      size: mediaFile.size,
      mimeType: mediaFile.mimeType,
      tags: mediaFile.tags ? JSON.parse(mediaFile.tags) : []
    });
  }

  res.status(201).json({
    files: uploadedFiles,
    count: uploadedFiles.length
  });
}));

// DELETE /api/upload/:id - Delete uploaded file
router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id }
  });

  if (!mediaFile) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Check if file is being used
  if (mediaFile.usageCount > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete file that is being used' 
    });
  }

  try {
    // Delete physical file
    if (fs.existsSync(mediaFile.path)) {
      fs.unlinkSync(mediaFile.path);
    }

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

// GET /api/upload/folders - Get folder structure
router.get('/folders', auth, adminOnly, asyncHandler(async (req, res) => {
  const folders = await prisma.mediaFile.findMany({
    select: { folder: true },
    distinct: ['folder']
  });

  const folderList = folders.map(f => f.folder).filter(Boolean).sort();
  
  res.json(folderList);
}));

// POST /api/upload/folder - Create new folder
router.post('/folder', auth, adminOnly, asyncHandler(async (req, res) => {
  const { name, parent = '/' } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  const folderPath = path.join(parent, name);
  const fullPath = path.join(uploadDir, folderPath);

  try {
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    res.status(201).json({ 
      folder: folderPath,
      message: 'Folder created successfully' 
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
}));

// GET /api/upload/usage/:id - Get file usage information
router.get('/usage/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id }
  });

  if (!mediaFile) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Check usage in products
  const productUsage = await prisma.product.count({
    where: {
      images: {
        contains: mediaFile.url
      }
    }
  });

  // Check usage in categories
  const categoryUsage = await prisma.category.count({
    where: {
      image: mediaFile.url
    }
  });

  // Check usage in collections
  const collectionUsage = await prisma.collection.count({
    where: {
      image: mediaFile.url
    }
  });

  // Check usage in home sections
  const homeSectionUsage = await prisma.homeSection.count({
    where: {
      content: {
        contains: mediaFile.url
      }
    }
  });

  const totalUsage = productUsage + categoryUsage + collectionUsage + homeSectionUsage;

  // Update usage count if different
  if (totalUsage !== mediaFile.usageCount) {
    await prisma.mediaFile.update({
      where: { id },
      data: { usageCount: totalUsage }
    });
  }

  res.json({
    id: mediaFile.id,
    filename: mediaFile.filename,
    url: mediaFile.url,
    usageCount: totalUsage,
    usageDetails: {
      products: productUsage,
      categories: categoryUsage,
      collections: collectionUsage,
      homeSections: homeSectionUsage
    }
  });
}));

export default router;