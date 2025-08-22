import path from 'path';
import os from 'os';

// 📁 Configuration centralisée des chemins - adaptée pour l'environnement
const isWindows = os.platform() === 'win32';

// Chemin de base adapté selon l'environnement
export const ADMIN_UPLOADS_BASE_PATH = isWindows 
  ? 'C:\\Users\\abdelrahmene fares\\Desktop\\admin.Birkshoes.store\\public\\uploads'
  : '/var/www/admin.Birkshoes.store/public/uploads'; // Chemin Linux pour le serveur

export const ADMIN_CONTENT_PATH = path.join(ADMIN_UPLOADS_BASE_PATH, 'content');
export const ADMIN_PRODUCTS_PATH = path.join(ADMIN_UPLOADS_BASE_PATH, 'products');

console.log('📁 [CONFIG] Chemins configurés:');
console.log('📁 [CONFIG] Content:', ADMIN_CONTENT_PATH);
console.log('📁 [CONFIG] Products:', ADMIN_PRODUCTS_PATH);
console.log('📁 [CONFIG] OS Platform:', os.platform());
