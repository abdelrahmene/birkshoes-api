/**
 * 🏠 SCRIPT D'INITIALISATION - Ajouter la section Hero
 * Ce script ajoute la section Hero manquante dans la base de données
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addHeroSection() {
  try {
    console.log('🚀 Ajout de la section Hero...');

    // Vérifier si la section hero existe déjà
    const existingHero = await prisma.homeSection.findFirst({
      where: { type: 'hero' }
    });

    if (existingHero) {
      console.log('✅ Section Hero existe déjà:', existingHero.title);
      return existingHero;
    }

    // Créer la section hero
    const heroSection = await prisma.homeSection.create({
      data: {
        title: 'Hero Slider',
        description: 'Section principale avec slider et carte de fidélité',
        type: 'hero',
        content: JSON.stringify({
          type: 'hero-slider',
          slides: [
            {
              type: 'loyalty-card',
              isLoyaltyCard: true,
              title: 'Carte Fidélité',
              subtitle: 'Programme Exclusif',
              description: 'Collectionnez vos tampons et profitez d\'avantages exclusifs',
              stampCount: 6
            }
          ],
          autoplay: true,
          duration: 12000
        }),
        isVisible: true,
        order: 0 // Premier élément
      }
    });

    console.log('✅ Section Hero créée avec succès:', heroSection.id);
    return heroSection;

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la section Hero:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-exécution
addHeroSection()
  .then(() => {
    console.log('🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec du script:', error);
    process.exit(1);
  });
