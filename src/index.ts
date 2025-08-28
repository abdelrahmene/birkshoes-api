import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config/config';
import { errorHandler, notFound } from './middlewares/errorHandler';

// Routes imports
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import categoriesRoutes from './routes/categories';
import collectionsRoutes from './routes/collections';
import customersRoutes from './routes/customers';
import ordersRoutes from './routes/orders';
import inventoryRoutes from './routes/inventory';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';
import uploadRoutes from './routes/upload';
import contentRoutes from './routes/content';
import mediaRoutes from './routes/media';
import imagesRoutes from './routes/images';

const app = express();

app.set('trust proxy', true);
// Security middleware avec configuration CORS adaptée
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Configuration CORS étendue
app.use(cors({
  origin: function(origin, callback) {
    // Permettre les requêtes sans origin (comme les apps mobiles) et localhost en développement
    if (!origin || config.allowedOrigins.includes(origin) || 
        (config.nodeEnv === 'development' && origin?.includes('localhost'))) {
      callback(null, true);
    } else {
      console.log(`❌ [CORS] Origin refusé: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Range', 
    'Cache-Control',
    'X-Requested-With',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'User-Agent',
    'Referer',
    'Accept-Encoding',
    'Accept-Language',
    'Connection'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
   skip: (req) => !req.headers['x-forwarded-for']

});
app.use('/api/', limiter);

// Middleware pour gérer les requêtes preflight CORS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`✅ [PREFLIGHT] ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,HEAD,PATCH');
    res.header('Access-Control-Allow-Headers', 
      'Content-Type,Authorization,Accept,Range,Cache-Control,X-Requested-With,Origin,Access-Control-Request-Method,Access-Control-Request-Headers,User-Agent,Referer,Accept-Encoding,Accept-Language,Connection'
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 heures
    return res.status(200).json({});
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 🖼️ Configuration pour les images statiques
app.use('/images', (req, res, next) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  console.log('\n🎨 [STATIC-IMAGE] ====================================');
  console.log(`📝 [STATIC-${requestId}] Requête image statique`);
  console.log(`🔧 [STATIC-${requestId}] Détails:`, {
    url: req.originalUrl,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  // Vérification du fichier statique
  const filePath = path.join(__dirname, '..', 'public', 'images', req.path);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`❌ [STATIC-${requestId}] Image non trouvée:`, {
        requestedPath: req.path,
        fullPath: filePath,
        error: err.message
      });
    } else {
      console.log(`✅ [STATIC-${requestId}] Image existe:`, {
        requestedPath: req.path,
        fullPath: filePath
      });
    }
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`🏁 [STATIC-${requestId}] Réponse:`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentType: res.getHeader('content-type')
    });
    console.log('🎨 [STATIC-IMAGE] ====================================\n');
  });

  next();
});

// 🔧 Debug endpoint pour vérifier la configuration CORS
app.get('/debug/cors', (req, res) => {
  console.log('🔧 [DEBUG] Headers de la requête:', req.headers);
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'Non spécifié',
    userAgent: req.headers['user-agent'] || 'Non spécifié',
    method: req.method,
    url: req.url,
    allowedOrigins: config.allowedOrigins,
    corsHeaders: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
    },
    message: 'Configuration CORS active'
  };
  
  console.log('🔧 [DEBUG] Info CORS:', debugInfo);
  res.json(debugInfo);
});

// 🖼️ Configuration globale pour les uploads avec CORS et logging détaillé
app.use('/uploads', (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log('\n🌍 [UPLOADS-REQUEST] ====================================');
  console.log(`� [UPLOADS-${requestId}] Nouvelle requête image`);
  console.log(`🔧 [UPLOADS-${requestId}] Détails de la requête:`, {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Log des headers importants
  console.log(`� [UPLOADS-${requestId}] Headers:`, {
    origin: req.headers.origin || 'Non spécifié',
    referer: req.headers.referer || 'Non spécifié',
    userAgent: req.headers['user-agent'],
    accept: req.headers.accept,
    host: req.headers.host,
    range: req.headers.range,
    ifNoneMatch: req.headers['if-none-match'],
    ifModifiedSince: req.headers['if-modified-since']
  });

  // Vérification du fichier
  const filePath = path.join(__dirname, '..', req.path);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`❌ [UPLOADS-${requestId}] Fichier non trouvé:`, {
        requestedPath: req.path,
        fullPath: filePath,
        error: err.message
      });
    } else {
      console.log(`✅ [UPLOADS-${requestId}] Fichier existe:`, {
        requestedPath: req.path,
        fullPath: filePath
      });
    }
  });

  // Intercepter la fin de la requête pour les logs
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`🏁 [UPLOADS-${requestId}] Requête terminée:`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentType: res.getHeader('content-type'),
      contentLength: res.getHeader('content-length')
    });
    console.log('🌍 [UPLOADS-REQUEST] ====================================\n');
  });

  // Headers CORS obligatoires pour tous les uploads
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Range',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Cross-Origin-Opener-Policy': 'unsafe-none',
    'Referrer-Policy': 'no-referrer-when-downgrade',
    'Vary': 'Origin'
  };
  
  // Appliquer tous les headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
    console.log(`⚙️ [UPLOADS-HEADERS] ${key}: ${value}`);
  });
  
  // Gestion des requêtes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    console.log('✅ [UPLOADS-OPTIONS] Requête OPTIONS détectée - Traitement preflight CORS');
    console.log('✅ [UPLOADS-OPTIONS] Headers OPTIONS envoyés, réponse 200');
    res.status(200).end();
    return;
  }
  
  console.log('➡️ [UPLOADS-MIDDLEWARE] Passage au middleware suivant...');
  next();
});

// 🖼️ Routes personnalisées pour les images depuis l'admin (prioritaires)
app.use('/uploads', imagesRoutes);

// 🖼️ Fallback pour servir les fichiers statiques locaux
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/media', mediaRoutes);

// Les fichiers statiques sont maintenant servis avec les headers CORS appropriés ci-dessus

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS enabled for: ${config.allowedOrigins.join(', ')}`);
});

export default app;
