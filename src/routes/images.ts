import express from 'express';
import path from 'path';
import fs from 'fs';
import { ADMIN_CONTENT_PATH, ADMIN_PRODUCTS_PATH } from '../config/paths';

const router = express.Router();

console.log('🔥 [IMAGES] Route images.ts chargée et prête!');
console.log('🔥 [IMAGES] Routes disponibles: /content/:filename et /products/:filename');
console.log('🔥 [IMAGES] Chemins configurés:');
console.log(`🔥 [IMAGES] Content: ${ADMIN_CONTENT_PATH}`);
console.log(`🔥 [IMAGES] Products: ${ADMIN_PRODUCTS_PATH}`);

// 🔧 Les headers CORS sont gérés par le middleware global dans index.ts

// 🖼️ Route pour servir les images de contenu depuis l'admin
router.get('/content/:filename', (req, res) => {
  const filename = req.params.filename;
  // Chemin vers le dossier uploads/content de l'admin
  const imagePath = path.join(ADMIN_CONTENT_PATH, filename);
  
  console.log('🖼️ [IMAGES] ===============================================');
  console.log(`🖼️ [IMAGES] NOUVELLE REQUÊTE: ${filename}`);
  console.log(`📁 [IMAGES] Chemin complet: ${imagePath}`);
  console.log(`🌐 [IMAGES] Headers de la requête:`);
  console.log(`🌐 [IMAGES] - Origin: ${req.headers.origin || 'Non spécifié'}`);
  console.log(`🌐 [IMAGES] - Referer: ${req.headers.referer || 'Non spécifié'}`);
  console.log(`🌐 [IMAGES] - User-Agent: ${req.headers['user-agent']?.substring(0, 100) || 'Non spécifié'}...`);
  console.log(`🌐 [IMAGES] - Accept: ${req.headers.accept || 'Non spécifié'}`);
  console.log(`🌐 [IMAGES] - Method: ${req.method}`);
  console.log(`🌐 [IMAGES] - URL: ${req.originalUrl}`);
  console.log('🖼️ [IMAGES] ===============================================');
  
  // 🔧 HEADERS CORS OBLIGATOIRES - AVANT TOUT TRAITEMENT
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Vary', 'Origin');
  console.log('🔧 [IMAGES] Headers CORS configurés pour:', filename);
  
  // Vérifier si le fichier existe
  if (fs.existsSync(imagePath)) {
    console.log(`✅ [IMAGES] Image trouvée: ${filename}`);
    
    // Obtenir les stats du fichier
    const stats = fs.statSync(imagePath);
    console.log(`📈 [IMAGES] Taille du fichier: ${stats.size} octets`);
    console.log(`📈 [IMAGES] Dernière modification: ${stats.mtime}`);
    
    // Définir le type de contenu selon l'extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    
    switch (ext) {
      case '.png': contentType = 'image/png'; break;
      case '.gif': contentType = 'image/gif'; break;
      case '.webp': contentType = 'image/webp'; break;
      case '.svg': contentType = 'image/svg+xml'; break;
      default: contentType = 'image/jpeg'; break;
    }
    
    console.log(`🎨 [IMAGES] Type de contenu déterminé: ${contentType} pour ${ext}`);
    
    // 🔧 Headers de contenu avec cache
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Last-Modified', stats.mtime.toUTCString());
    
    console.log(`📤 [IMAGES] ENVOI de l'image avec headers CORS: ${filename}`);
    console.log(`📤 [IMAGES] Headers de réponse configurés:`);
    console.log(`📤 [IMAGES] - Content-Type: ${contentType}`);
    console.log(`📤 [IMAGES] - Content-Length: ${stats.size}`);
    console.log(`📤 [IMAGES] - Access-Control-Allow-Origin: *`);
    console.log(`📤 [IMAGES] - Cross-Origin-Resource-Policy: cross-origin`);
    
    // Ajouter un handler pour les erreurs de réponse
    res.on('error', (err) => {
      console.log(`❌ [IMAGES] Erreur lors de l'envoi de ${filename}:`, err.message);
    });
    
    res.on('finish', () => {
      console.log(`✅ [IMAGES] Envoi terminé avec succès pour: ${filename}`);
    });
    
    res.sendFile(path.resolve(imagePath));
  } else {
    console.log(`❌ [IMAGES] Image non trouvée: ${filename}`);
    console.log(`❌ [IMAGES] Chemin testé: ${imagePath}`);
    console.log(`❌ [IMAGES] Vérification du répertoire parent:`);
    
    const parentDir = path.dirname(imagePath);
    if (fs.existsSync(parentDir)) {
      console.log(`📁 [IMAGES] Répertoire parent existe: ${parentDir}`);
      const files = fs.readdirSync(parentDir);
      console.log(`📁 [IMAGES] Fichiers disponibles (${files.length}):`, files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : ''));
    } else {
      console.log(`❌ [IMAGES] Répertoire parent n'existe pas: ${parentDir}`);
    }
    
    res.status(404).json({ 
      error: 'Image not found', 
      filename: filename,
      path: imagePath,
      timestamp: new Date().toISOString()
    });
  }
});

// 🖼️ Route pour servir les images de produits depuis l'admin
router.get('/products/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(ADMIN_PRODUCTS_PATH, filename);
  
  console.log(`🖼️ [PRODUCTS] Tentative de chargement: ${filename}`);
  
  // 🔧 HEADERS CORS OBLIGATOIRES - AVANT TOUT TRAITEMENT
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Vary', 'Origin');
  
  if (fs.existsSync(imagePath)) {
    console.log(`✅ [PRODUCTS] Image trouvée: ${filename}`);
    
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    
    switch (ext) {
      case '.png': contentType = 'image/png'; break;
      case '.gif': contentType = 'image/gif'; break;
      case '.webp': contentType = 'image/webp'; break;
      case '.svg': contentType = 'image/svg+xml'; break;
      default: contentType = 'image/jpeg'; break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    console.log(`📤 [PRODUCTS] Envoi avec headers CORS: ${filename}`);
    res.sendFile(path.resolve(imagePath));
  } else {
    console.log(`❌ [PRODUCTS] Image non trouvée: ${filename}`);
    res.status(404).json({ 
      error: 'Product image not found', 
      filename: filename,
      path: imagePath 
    });
  }
});

export default router;
