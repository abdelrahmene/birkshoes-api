const { execSync } = require('child_process');

try {
  console.log('🚀 Running TypeScript build...');
  execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Build successful!');
} catch (error) {
  console.log('❌ Build failed with errors');
  process.exit(1);
}
