import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { z } from 'zod';

const router = Router();

// Get all settings
router.get('/', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await prisma.setting.findMany({
    orderBy: { key: 'asc' }
  });

  const settingsMap = settings.reduce((acc, setting) => {
    let value = setting.value;
    try {
      value = JSON.parse(setting.value);
    } catch {
      // Keep as string if not valid JSON
    }
    
    acc[setting.key] = {
      value,
      type: setting.type
    };
    return acc;
  }, {} as Record<string, any>);

  res.json(settingsMap);
}));

// Update setting
const updateSettingSchema = z.object({
  key: z.string(),
  value: z.any(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional()
});

router.put('/:key', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { value, type = 'string' } = updateSettingSchema.parse(req.body);

  let stringValue: string;
  if (typeof value === 'object') {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }

  const setting = await prisma.setting.upsert({
    where: { key },
    update: {
      value: stringValue,
      type
    },
    create: {
      key,
      value: stringValue,
      type
    }
  });

  res.json(setting);
}));

// Delete setting
router.delete('/:key', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;

  await prisma.setting.delete({
    where: { key }
  });

  res.json({ message: 'Setting deleted successfully' });
}));

// Get store configuration
router.get('/store', asyncHandler(async (req: Request, res: Response) => {
  const storeSettings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'store_name',
          'store_description',
          'store_logo',
          'store_favicon',
          'contact_email',
          'contact_phone',
          'store_address',
          'currency',
          'timezone',
          'store_status'
        ]
      }
    }
  });

  const config = storeSettings.reduce((acc, setting) => {
    let value = setting.value;
    try {
      value = JSON.parse(setting.value);
    } catch {
      // Keep as string if not valid JSON
    }
    
    acc[setting.key] = value;
    return acc;
  }, {} as Record<string, any>);

  res.json(config);
}));

// Update store configuration
const updateStoreConfigSchema = z.object({
  store_name: z.string().optional(),
  store_description: z.string().optional(),
  store_logo: z.string().optional(),
  store_favicon: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  store_address: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  store_status: z.enum(['open', 'closed', 'maintenance']).optional()
});

router.put('/store', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const updates = updateStoreConfigSchema.parse(req.body);

  const results = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      const setting = await prisma.setting.upsert({
        where: { key },
        update: { value: stringValue },
        create: {
          key,
          value: stringValue,
          type: typeof value === 'object' ? 'json' : 'string'
        }
      });
      
      results.push(setting);
    }
  }

  res.json({ message: 'Store configuration updated', settings: results });
}));

// Get payment settings
router.get('/payment', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const paymentSettings = await prisma.setting.findMany({
    where: {
      key: {
        startsWith: 'payment_'
      }
    }
  });

  const config = paymentSettings.reduce((acc, setting) => {
    let value = setting.value;
    try {
      value = JSON.parse(setting.value);
    } catch {
      // Keep as string if not valid JSON
    }
    
    acc[setting.key] = value;
    return acc;
  }, {} as Record<string, any>);

  res.json(config);
}));

// Update payment settings
router.put('/payment', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const updates = req.body;

  const results = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key.startsWith('payment_')) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      const setting = await prisma.setting.upsert({
        where: { key },
        update: { value: stringValue },
        create: {
          key,
          value: stringValue,
          type: typeof value === 'object' ? 'json' : 'string'
        }
      });
      
      results.push(setting);
    }
  }

  res.json({ message: 'Payment settings updated', settings: results });
}));

// Get shipping settings
router.get('/shipping', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shippingSettings = await prisma.setting.findMany({
    where: {
      key: {
        startsWith: 'shipping_'
      }
    }
  });

  const config = shippingSettings.reduce((acc, setting) => {
    let value = setting.value;
    try {
      value = JSON.parse(setting.value);
    } catch {
      // Keep as string if not valid JSON
    }
    
    acc[setting.key] = value;
    return acc;
  }, {} as Record<string, any>);

  res.json(config);
}));

// Update shipping settings
router.put('/shipping', auth, adminOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const updates = req.body;

  const results = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key.startsWith('shipping_')) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      const setting = await prisma.setting.upsert({
        where: { key },
        update: { value: stringValue },
        create: {
          key,
          value: stringValue,
          type: typeof value === 'object' ? 'json' : 'string'
        }
      });
      
      results.push(setting);
    }
  }

  res.json({ message: 'Shipping settings updated', settings: results });
}));

export default router;
