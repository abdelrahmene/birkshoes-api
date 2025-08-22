import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { config } from '../config/config';
import { asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}));

// Me - Get current user info
router.get('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
const token = req.header('Authorization')?.replace('Bearer ', '');
  
if (!token) {
  return res.status(401).json({ error: 'No token provided' });
}

try {
const decoded = jwt.verify(token, config.jwtSecret) as { id: string };

const user = await prisma.user.findUnique({
  where: { id: decoded.id },
    select: { id: true, email: true, name: true, role: true }
    });

if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
    }

res.json({ user });
} catch (error) {
res.status(401).json({ error: 'Invalid token' });
}
}));

// Register (admin only - pour créer des utilisateurs)
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = registerSchema.parse(req.body);

  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN'
    }
  });

  const token = jwt.sign(
    { id: user.id },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}));

export default router;
