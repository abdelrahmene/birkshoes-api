const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin déjà existant:', existingAdmin.email);
      return;
    }

    // Créer un admin par défaut
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@birkshoes.com',
        password: hashedPassword,
        name: 'Admin BirkShoes',
        role: 'ADMIN'
      }
    });

    console.log('✅ Utilisateur admin créé avec succès!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Mot de passe: admin123');
    console.log('👤 ID:', admin.id);

  } catch (error) {
    console.error('❌ Erreur lors de la création admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();