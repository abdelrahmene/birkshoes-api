import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestSections() {
  console.log('🚀 Création des sections de test...');

  // Supprimer les anciennes sections de test
  await prisma.homeSection.deleteMany({
    where: {
      id: {
        in: ['hero-section-1', 'categories-section', 'collections-section', 'featured-products-section']
      }
    }
  });

  // Créer les nouvelles sections
  const sections = [
    {
      id: 'hero-section-1',
      title: 'Bienvenue chez Birkshoes',
      description: 'Découvrez notre collection exclusive',
      type: 'hero',
      content: JSON.stringify({
        slides: [
          {
            id: 'slide-1',
            title: 'Collection Été 2024',
            subtitle: 'Nouveautés disponibles',
            description: 'Découvrez nos dernières créations',
            image: '/images/hero-slide-1.jpg',
            ctaText: 'Découvrir',
            ctaLink: '/collections'
          },
          {
            id: 'slide-2',
            title: 'Confort Premium',
            subtitle: 'Qualité garantie',
            description: 'Des chaussures conçues pour votre bien-être',
            image: '/images/hero-slide-2.jpg',
            ctaText: 'Voir plus',
            ctaLink: '/collections'
          }
        ]
      }),
      isVisible: true,
      order: 1
    },
    {
      id: 'categories-section',
      title: 'Nos Catégories',
      description: 'Explorez toutes nos gammes',
      type: 'categories',
      content: JSON.stringify({}),
      isVisible: true,
      order: 2
    },
    {
      id: 'collections-section',
      title: 'Nos Collections',
      description: 'Des styles uniques pour tous les goûts',
      type: 'collection',
      content: JSON.stringify({
        title: 'Nos Collections',
        subtitle: 'Des pièces uniques pour tous les styles',
        items: [
          {
            id: 'collection-1',
            title: 'Collection Classique',
            subtitle: 'Élégance intemporelle',
            description: 'Des modèles classiques qui ne se démodent jamais',
            image: '/images/collection-classic.jpg',
            link: '/collections/classique',
            accent: 'from-blue-800 to-purple-950',
            textColor: 'text-white',
            buttonColor: 'bg-white text-black hover:bg-gray-100',
            ctaText: 'Découvrir',
            imageOpacity: 70
          },
          {
            id: 'collection-2',
            title: 'Collection Sport',
            subtitle: 'Performance et style',
            description: 'Alliant confort et performance pour vos activités',
            image: '/images/collection-sport.jpg',
            link: '/collections/sport',
            accent: 'from-green-800 to-blue-950',
            textColor: 'text-white',
            buttonColor: 'bg-white text-black hover:bg-gray-100',
            ctaText: 'Explorer',
            imageOpacity: 70
          }
        ]
      }),
      isVisible: true,
      order: 3
    },
    {
      id: 'featured-products-section',
      title: 'Produits en Vedette',
      description: 'Nos coups de cœur du moment',
      type: 'featured_products',
      content: JSON.stringify({
        products: []
      }),
      isVisible: true,
      order: 4
    }
  ];

  for (const section of sections) {
    try {
      const created = await prisma.homeSection.create({
        data: section
      });
      console.log(`✅ Section créée: ${created.title} (${created.type})`);
    } catch (error) {
      console.error(`❌ Erreur création section ${section.title}:`, error.message);
    }
  }

  console.log('🎉 Sections de test créées avec succès!');
}

createTestSections()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
