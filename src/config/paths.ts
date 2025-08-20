import path from 'path';

// 📁 Configuration centralisée des chemins
export const ADMIN_UPLOADS_BASE_PATH = 'C:\\Users\\abdelrahmene fares\\Desktop\\admin.Birkshoes.store\\public\\uploads';

export const ADMIN_CONTENT_PATH = path.join(ADMIN_UPLOADS_BASE_PATH, 'content');
export const ADMIN_PRODUCTS_PATH = path.join(ADMIN_UPLOADS_BASE_PATH, 'products');

console.log('📁 [CONFIG] Chemins configurés:');
console.log('📁 [CONFIG] Content:', ADMIN_CONTENT_PATH);
console.log('📁 [CONFIG] Products:', ADMIN_PRODUCTS_PATH);
