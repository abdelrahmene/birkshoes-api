import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCategoriesSection() {
  console.log('🚀 Création de la section catégories...');

  // Supprimer l'ancienne section si elle existe
  await prisma.homeSection.deleteMany({
    where: {
      id: 'categories-section-main'
    }
  });

  // Créer la section catégories avec des données par défaut
  const categoriesSection = {
    id: 'categories-section-main',
    title: 'Nos Catégories',
    description: 'Découvrez toutes nos gammes de produits',
    type: 'categories',
    content: JSON.stringify({
      type: 'categories',
      title: 'Nos Catégories',
      subtitle: 'Découvrez toutes nos gammes de produits',
      description: 'Explorez notre large sélection organisée par catégories pour trouver exactement ce que vous cherchez',
      layout: {
        type: 'grid',
        columns: 3,
        gap: 24,
        mobileColumns: 1
      },
      style: {
        backgroundColor: '#f8fafc',
        textColor: '#1f2937',
        titleColor: '#111827',
        subtitleColor: '#6b7280',
        padding: {
          top: 80,
          bottom: 80,
          left: 32,
          right: 32
        }
      },
      categories: [
        {
          id: 'cat-chaussures-homme',
          name: 'Chaussures Homme',
          slug: 'chaussures-homme',
          image: '/images/categories/homme.jpg',
          description: 'Style et confort pour homme',
          link: '/categories/chaussures-homme',
          isActive: true,
          order: 0,
          style: {
            backgroundColor: '#1e293b',
            textColor: '#ffffff',
            hoverColor: '#3b82f6',
            borderRadius: 16,
            imageOpacity: 80,
            overlayColor: '#000000',
            overlayOpacity: 40,
            textAlign: 'center',
            imageFit: 'cover',
            imagePosition: 'center center'
          }
        },
        {
          id: 'cat-chaussures-femme',
          name: 'Chaussures Femme',
          slug: 'chaussures-femme',
          image: '/images/categories/femme.jpg',
          description: 'Élégance et raffinement',
          link: '/categories/chaussures-femme',
          isActive: true,
          order: 1,
          style: {
            backgroundColor: '#be185d',
            textColor: '#ffffff',
            hoverColor: '#ec4899',
            borderRadius: 16,
            imageOpacity: 85,
            overlayColor: '#000000',
            overlayOpacity: 30,
            textAlign: 'center',
            imageFit: 'cover',
            imagePosition: 'center center'
          }
        },
        {
          id: 'cat-chaussures-enfant',
          name: 'Chaussures Enfant',
          slug: 'chaussures-enfant',
          image: '/images/categories/enfant.jpg',
          description: 'Confort et sécurité pour les plus petits',
          link: '/categories/chaussures-enfant',
          isActive: true,
          order: 2,
          style: {
            backgroundColor: '#059669',
            textColor: '#ffffff',
            hoverColor: '#10b981',
            borderRadius: 16,
            imageOpacity: 90,
            overlayColor: '#000000',
            overlayOpacity: 25,
            textAlign: 'center',
            imageFit: 'cover',
            imagePosition: 'center center'
          }
        },
        {
          id: 'cat-chaussures-sport',
          name: 'Chaussures de Sport',
          slug: 'chaussures-sport',
          image: '/images/categories/sport.jpg',
          description: 'Performance et style pour vos activités',
          link: '/categories/chaussures-sport',
          isActive: true,
          order: 3,
          style: {
            backgroundColor: '#dc2626',
            textColor: '#ffffff',
            hoverColor: '#ef4444',
            borderRadius: 16,
            imageOpacity: 85,
            overlayColor: '#000000',
            overlayOpacity: 35,
            textAlign: 'center',
            imageFit: 'cover',
            imagePosition: 'center center'
          }
        },
        {
          id: 'cat-accessoires',
          name: 'Accessoires',
          slug: 'accessoires',
          image: '/images/categories/accessoires.jpg',
          description: 'Complétez votre style',
          link: '/categories/accessoires',
          isActive: true,
          order: 4,
          style: {
            backgroundColor: '#7c3aed',
            textColor: '#ffffff',
            hoverColor: '#8b5cf6',
            borderRadius: 16,
            imageOpacity: 80,
            overlayColor: '#000000',
            overlayOpacity: 30,
            textAlign: 'center',
            imageFit: 'cover',
            imagePosition: 'center center'
          }
        },
        {
          id: 'cat-nouveautes',
          name: 'Nouveautés',
          slug: 'nouveautes',
          image: '/images/categories/nouveautes.jpg',
          description: 'Les dernières tendances',
          link: '/categories/nouveautes',
          isActive: true,
          order: 5,
          style: {
            backgroundColor: '#ea580c',
            textColor: '#ffffff',
            hoverColor: '#f97316',
            borderRadius: 16,
            imageOpacity: 85,
            overlayColor: '#000000',
            overlayOpacity: 35,
            textAlign: 'center',
            imageFit: 'cover',
            imagePosition: 'center center'
          }
        }
      ],
      animation: {
        enabled: true,
        type: 'fade',
        duration: 600,
        delay: 150,
        stagger: true
      }
    }),
    isVisible: true,
    order: 2
  };

  try {
    const created = await prisma.homeSection.create({
      data: categoriesSection
    });
    console.log(`✅ Section catégories créée: ${created.title}`);
    console.log(`📊 Catégories incluses: ${JSON.parse(created.content).categories.length}`);
  } catch (error) {
    console.error(`❌ Erreur création section catégories:`, error.message);
  }

  console.log('🎉 Section catégories créée avec succès!');
}

createCategoriesSection()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
