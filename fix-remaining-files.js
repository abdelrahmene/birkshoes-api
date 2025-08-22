#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger
const files = [
  'src/routes/content.ts',
  'src/routes/customers.ts',
  'src/routes/dashboard.ts',
  'src/routes/inventory.ts',
  'src/routes/media.ts',
  'src/routes/orders.ts'
];

console.log('Correcting remaining TypeScript files...');

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Correction 1: Ajouter l'import d'AuthRequest si manquant
    if (!content.includes('AuthRequest') && content.includes('auth, adminOnly')) {
      content = content.replace(
        /import \{ auth, adminOnly \} from '\.\.\/middlewares\/auth';/,
        "import { auth, adminOnly, AuthRequest } from '../middlewares/auth';"
      );
    }
    
    // Correction 2: Remplacer req: Request par req: AuthRequest dans les routes protégées
    content = content.replace(
      /(router\.(get|post|put|delete)\([^,]+,\s*auth[^,]*,\s*[^,]*,\s*asyncHandler\(async\s*\(\s*)req:\s*Request(,\s*res:\s*Response)/g,
      '$1req: AuthRequest$2'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed ${file}`);
  } else {
    console.log(`✗ File not found: ${file}`);
  }
});

console.log('All files corrected!');
