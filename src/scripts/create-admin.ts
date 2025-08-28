import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

async function createAdminUser() {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@birkshoes.store' }
    });

    if (existingAdmin) {
      console.log('✅ Admin utilisateur existe déjà');
      return;
    }

    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123456', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@birkshoes.store',
        password: hashedPassword,
        name: 'Admin Birkshoes',
        role: 'ADMIN'
      }
    });

    console.log('✅ Utilisateur admin créé avec succès:');
    console.log('📧 Email: admin@birkshoes.store');
    console.log('🔑 Mot de passe: admin123456');
    console.log('👤 ID:', admin.id);
    
    return admin;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si lancé directement
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { createAdminUser };
