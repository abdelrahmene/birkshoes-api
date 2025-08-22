const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger
const files = [
  'src/routes/categories.ts',
  'src/routes/collections.ts', 
  'src/routes/content.ts',
  'src/routes/customers.ts',
  'src/routes/dashboard.ts',
  'src/routes/inventory.ts',
  'src/routes/media.ts',
  'src/routes/orders.ts',
  'src/routes/products.ts',
  'src/routes/settings.ts',
  'src/routes/stock.ts',
  'src/routes/upload.ts'
];

console.log('Fixing TypeScript type errors...');

files.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Correction principale: remplacer `req: Request` par `req: AuthRequest` dans les routes protégées
      content = content.replace(
        /router\.(get|post|put|delete)\([^,]+,\s*auth[^,]*,\s*[^,]*,\s*asyncHandler\(async\s*\(\s*req:\s*Request,/g, 
        (match) => match.replace('req: Request,', 'req: AuthRequest,')
      );
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Fixed ${filePath}`);
    } else {
      console.log(`✗ File not found: ${filePath}`);
    }
  } catch (error) {
    console.log(`✗ Error fixing ${filePath}:`, error.message);
  }
});

console.log('Type fixes completed!');
