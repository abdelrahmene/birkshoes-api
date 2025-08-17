import { Router } from 'express';
import { prisma } from '../config/prisma';
import { auth, adminOnly } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { CreateCustomerRequest } from '../types';

const router = Router();

// GET /api/customers
router.get('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const { search, page = '1', limit = '20' } = req.query;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.customer.count({ where })
  ]);

  res.json({
    customers,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// GET /api/customers/:id
router.get('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.json(customer);
}));

// POST /api/customers
router.post('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const customerData = req.body as CreateCustomerRequest;

  const customer = await prisma.customer.create({
    data: {
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email || null,
      phone: customerData.phone,
      wilaya: customerData.wilaya,
      commune: customerData.commune,
      address: customerData.address
    },
    include: {
      _count: {
        select: { orders: true }
      }
    }
  });

  res.status(201).json(customer);
}));

// PUT /api/customers/:id
router.put('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, wilaya, commune, address } = req.body;

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      firstName,
      lastName,
      email: email || null,
      phone,
      wilaya,
      commune,
      address
    },
    include: {
      _count: {
        select: { orders: true }
      }
    }
  });

  res.json(customer);
}));

// DELETE /api/customers/:id
router.delete('/:id', auth, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if customer has orders
  const ordersCount = await prisma.order.count({
    where: { customerId: id }
  });

  if (ordersCount > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete customer with orders. Archive customer instead.' 
    });
  }

  await prisma.customer.delete({
    where: { id }
  });

  res.json({ message: 'Customer deleted successfully' });
}));

// GET /api/customers/search
router.get('/search', auth, adminOnly, asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.json([]);
  }

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { firstName: { contains: q as string, mode: 'insensitive' } },
        { lastName: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
        { phone: { contains: q as string, mode: 'insensitive' } }
      ]
    },
    take: 10,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      wilaya: true,
      commune: true
    }
  });

  res.json(customers);
}));

export default router;
