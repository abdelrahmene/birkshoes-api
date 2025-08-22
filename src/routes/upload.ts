import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma';
import { auth, adminOnly, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { config } from '../config/config';

const router = Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || '/';
    const uploadPath = path.join(config.uploadDir, folder);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + fileExtension;
    cb(null, filename);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize
  }
});

// Upload single file
router.post('/single', auth, adminOnly, upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { alt, tags } = req.body;
  const folder = req.body.folder || '/';
  
  const mediaFile = await prisma.mediaFile.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads${folder}${req.file.filename}`,
      alt: alt || null,
      tags: tags ? JSON.stringify(tags) : null,
      folder: folder,
      uploadedBy: req.user?.id
    }
  });

  res.json(mediaFile);
}));

// Upload multiple files
router.post('/multiple', auth, adminOnly, upload.array('files', 10), asyncHandler(async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const { alt, tags } = req.body;
  const folder = req.body.folder || '/';
  
  const mediaFiles = await Promise.all(
    files.map(file => 
      prisma.mediaFile.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/uploads${folder}${file.filename}`,
          alt: alt || null,
          tags: tags ? JSON.stringify(tags) : null,
          folder: folder,
          uploadedBy: req.user?.id
        }
      })
    )
  );

  res.json(mediaFiles);
}));

// Delete file
router.delete('/:id', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id }
  });

  if (!mediaFile) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Delete physical file
  try {
    if (fs.existsSync(mediaFile.path)) {
      fs.unlinkSync(mediaFile.path);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  // Delete from database
  await prisma.mediaFile.delete({
    where: { id }
  });

  res.json({ message: 'File deleted successfully' });
}));

// Get folders
router.get('/folders', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const folders = await prisma.mediaFile.groupBy({
    by: ['folder'],
    _count: { id: true }
  });

  res.json(folders);
}));

// Create folder
router.post('/folder', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { folderPath } = req.body;
  
  if (!folderPath) {
    return res.status(400).json({ error: 'Folder path is required' });
  }

  const fullPath = path.join(config.uploadDir, folderPath);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  res.json({ message: 'Folder created successfully', path: folderPath });
}));

// Get file usage
router.get('/usage/:id', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id }
  });

  if (!mediaFile) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.json({
    file: mediaFile,
    isUsed: mediaFile.isUsed,
    usageCount: mediaFile.usageCount
  });
}));

export default router;