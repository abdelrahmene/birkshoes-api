/**
 * Script pour insérer des sections de test dans la base de données
 * À exécuter une fois pour créer du contenu de test
 */

// Sections de test à insérer
const testSections = [
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

console.log('📄 Sections de test à insérer:');
testSections.forEach(section => {
  console.log(`- ${section.title} (${section.type})`);
});

// Ce fichier peut être utilisé pour créer des insertions SQL
const generateSQLInserts = () => {
  return testSections.map(section => 
    `INSERT INTO HomeSection (id, title, description, type, content, isVisible, \`order\`, createdAt, updatedAt) 
     VALUES ('${section.id}', '${section.title}', '${section.description}', '${section.type}', '${section.content}', ${section.isVisible}, ${section.order}, NOW(), NOW());`
  ).join('\n');
};

console.log('\n📝 SQL à exécuter:');
console.log(generateSQLInserts());

module.exports = { testSections, generateSQLInserts };
