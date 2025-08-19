/**
 * 🧪 SCRIPT DE TEST ET INITIALISATION
 * Ce script teste la connexion API et initialise les sections manquantes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAndInitialize() {
  try {
    console.log('🔌 Test de la connexion à la base de données...');
    
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier les sections existantes
    console.log('🔍 Vérification des sections existantes...');
    const sections = await prisma.homeSection.findMany({
      orderBy: { order: 'asc' }
    });
    
    console.log(`📊 ${sections.length} sections trouvées dans la base:`);
    sections.forEach(section => {
      console.log(`  - ${section.type}: "${section.title}" (${section.isVisible ? 'Visible' : 'Masqué'}) [Ordre: ${section.order}]`);
    });
    
    // Vérifier si la section Hero existe
    const heroSection = sections.find(s => s.type === 'hero');
    if (!heroSection) {
      console.log('⚠️ Aucune section Hero trouvée, création...');
      await createHeroSection();
    } else {
      console.log('✅ Section Hero existe:', heroSection.title);
    }
    
    // Créer des sections par défaut si nécessaire
    await createDefaultSections();
    
    // Afficher le résumé final
    console.log('📋 Résumé final des sections:');
    const finalSections = await prisma.homeSection.findMany({
      where: { isVisible: true },
      orderBy: { order: 'asc' }
    });
    
    console.log(`🎯 ${finalSections.length} sections visibles:`);
    finalSections.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.type.toUpperCase()}: "${section.title}" [Ordre: ${section.order}]`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createHeroSection() {
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
      order: 0
    }
  });
  
  console.log('✅ Section Hero créée:', heroSection.id);
  return heroSection;
}

async function createDefaultSections() {
  const existingTypes = await prisma.homeSection.findMany({
    select: { type: true }
  });
  const existingTypesList = existingTypes.map(s => s.type);
  
  const defaultSections = [
    {
      title: 'Nos Catégories',
      description: 'Explorez notre gamme complète de chaussures',
      type: 'categories',
      content: JSON.stringify({
        layout: 'grid',
        showDescription: true
      }),
      isVisible: true,
      order: 1
    },
    {
      title: 'Nouveaux Produits',
      description: 'Découvrez nos dernières nouveautés',
      type: 'new-products',
      content: JSON.stringify({
        limit: 8,
        layout: 'carousel'
      }),
      isVisible: true,
      order: 2
    },
    {
      title: 'Nos Avantages',
      description: 'Ce qui nous différencie',
      type: 'advantages',
      content: JSON.stringify({
        features: [
          {
            title: 'Livraison Gratuite',
            description: 'Livraison gratuite à domicile',
            icon: 'truck'
          },
          {
            title: 'Qualité Premium',
            description: 'Matériaux de haute qualité',
            icon: 'award'
          },
          {
            title: 'Service Client',
            description: 'Support client 24/7',
            icon: 'phone'
          }
        ]
      }),
      isVisible: true,
      order: 3
    }
  ];
  
  for (const sectionData of defaultSections) {
    if (!existingTypesList.includes(sectionData.type)) {
      const section = await prisma.homeSection.create({ data: sectionData });
      console.log(`✅ Section "${sectionData.type}" créée:`, section.title);
    } else {
      console.log(`⏭️ Section "${sectionData.type}" existe déjà`);
    }
  }
}

// Auto-exécution
testAndInitialize()
  .then(() => {
    console.log('🎉 Test et initialisation terminés avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec:', error);
    process.exit(1);
  });
