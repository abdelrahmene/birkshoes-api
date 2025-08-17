# BirkShoes E-commerce API

Une API REST complète pour une plateforme e-commerce de chaussures, développée avec Node.js, TypeScript, Prisma et MySQL.

## 🚀 Fonctionnalités

### ✅ Authentification & Autorisation
- JWT tokens avec refresh tokens
- Rôles utilisateur (admin/user)
- Middleware de sécurité complet

### ✅ Gestion des Produits
- CRUD complet avec variantes
- Gestion des images multiples
- Catégories et collections
- Système de stock avec historique
- Recherche et filtrage avancé

### ✅ Gestion des Commandes
- Système de panier
- Gestion des stocks automatique
- États de commande (en attente, confirmée, expédiée, livrée)
- Calcul automatique des totaux

### ✅ Gestion des Clients
- Profils clients complets
- Adresses multiples
- Historique des commandes

### ✅ CMS & Contenu
- Sections page d'accueil personnalisables
- Pages catégories customisables
- Gestionnaire de médias
- Upload de fichiers sécurisé

### ✅ Dashboard Administrateur
- Statistiques en temps réel
- Analyses de vente
- Gestion des utilisateurs

## 🛠 Stack Technique

- **Backend**: Node.js, Express.js, TypeScript
- **Base de données**: MySQL avec Prisma ORM
- **Authentification**: JWT + bcrypt
- **Validation**: Zod
- **Upload**: Multer
- **Sécurité**: Helmet, CORS, Rate limiting
- **Containerisation**: Docker

## 📦 Installation

### Prérequis
- Node.js 16+
- MySQL 8+
- Docker (optionnel)

### Installation locale

1. **Cloner le projet**
```bash
git clone <repository-url>
cd birkshoes-api
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration environnement**
```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos configurations :
```env
DATABASE_URL="mysql://username:password@localhost:3306/birkshoes"
JWT_SECRET="votre-secret-jwt-tres-securise"
JWT_REFRESH_SECRET="votre-refresh-secret-tres-securise"
ADMIN_EMAIL="admin@birkshoes.com"
ADMIN_PASSWORD="admin123"
PORT=3000
NODE_ENV="development"
```

4. **Configurer la base de données**
```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate dev

# (Optionnel) Seed initial
npx prisma db seed
```

5. **Démarrer le serveur**
```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

### Installation avec Docker

```bash
# Construire et démarrer les services
docker-compose up -d

# Exécuter les migrations
docker-compose exec api npx prisma migrate dev
```

## 🌐 API Endpoints

### Authentification
```
POST   /api/auth/register     - Inscription
POST   /api/auth/login        - Connexion
POST   /api/auth/refresh      - Renouveler token
POST   /api/auth/logout       - Déconnexion
GET    /api/auth/profile      - Profil utilisateur
PUT    /api/auth/profile      - Modifier profil
```

### Produits
```
GET    /api/products          - Liste des produits
GET    /api/products/:id      - Détails produit
POST   /api/products          - Créer produit (admin)
PUT    /api/products/:id      - Modifier produit (admin)
DELETE /api/products/:id      - Supprimer produit (admin)
GET    /api/products/search   - Rechercher produits
```

### Catégories
```
GET    /api/categories        - Liste des catégories
GET    /api/categories/:id    - Détails catégorie
POST   /api/categories        - Créer catégorie (admin)
PUT    /api/categories/:id    - Modifier catégorie (admin)
DELETE /api/categories/:id    - Supprimer catégorie (admin)
```

### Collections
```
GET    /api/collections       - Liste des collections
GET    /api/collections/:id   - Détails collection
POST   /api/collections       - Créer collection (admin)
PUT    /api/collections/:id   - Modifier collection (admin)
DELETE /api/collections/:id   - Supprimer collection (admin)
```

### Commandes
```
GET    /api/orders           - Mes commandes
GET    /api/orders/all       - Toutes les commandes (admin)
GET    /api/orders/:id       - Détails commande
POST   /api/orders           - Créer commande
PUT    /api/orders/:id       - Modifier commande
DELETE /api/orders/:id       - Supprimer commande
PATCH  /api/orders/:id/status - Changer statut (admin)
```

### Clients
```
GET    /api/customers         - Liste clients (admin)
GET    /api/customers/:id     - Détails client
POST   /api/customers         - Créer client
PUT    /api/customers/:id     - Modifier client
DELETE /api/customers/:id     - Supprimer client
```

### Upload & Médias
```
POST   /api/upload/single     - Upload fichier unique
POST   /api/upload/multiple   - Upload multiples fichiers
GET    /api/upload/folders    - Liste dossiers
POST   /api/upload/folder     - Créer dossier
DELETE /api/upload/:id        - Supprimer fichier
GET    /api/upload/usage/:id  - Usage d'un fichier
```

### Contenu CMS
```
GET    /api/content/home-sections     - Sections page d'accueil
POST   /api/content/home-sections     - Créer section (admin)
PUT    /api/content/home-sections/:id - Modifier section (admin)
DELETE /api/content/home-sections/:id - Supprimer section (admin)
PATCH  /api/content/home-sections/reorder - Réorganiser sections

GET    /api/content/category-pages/:categoryId - Page catégorie
POST   /api/content/category-pages    - Créer page catégorie (admin)
PUT    /api/content/category-pages/:id - Modifier page catégorie (admin)

GET    /api/content/media             - Gestionnaire médias (admin)
POST   /api/content/media             - Ajouter média (admin)
PUT    /api/content/media/:id         - Modifier média (admin)
DELETE /api/content/media/:id         - Supprimer média (admin)
```

### Dashboard
```
GET    /api/dashboard/stats           - Statistiques générales (admin)
GET    /api/dashboard/sales           - Analyses des ventes (admin)
GET    /api/dashboard/products        - Statistiques produits (admin)
GET    /api/dashboard/customers       - Statistiques clients (admin)
GET    /api/dashboard/recent-activity - Activité récente (admin)
```

## 🗄 Schéma de Base de Données

### Modèles Principaux

- **User** - Utilisateurs du système
- **Customer** - Profils clients
- **Category** - Catégories de produits
- **Collection** - Collections de produits
- **Product** - Produits avec variantes
- **ProductVariant** - Variantes (couleur, taille, etc.)
- **Order** - Commandes
- **OrderItem** - Articles de commande
- **StockMovement** - Mouvements de stock
- **HomeSection** - Sections page d'accueil
- **CategoryPage** - Pages catégories personnalisées
- **MediaFile** - Gestionnaire de médias
- **Setting** - Paramètres système

## 🔐 Sécurité

- **Rate Limiting** : 100 requêtes/15min par IP
- **CORS** : Configuration restrictive
- **Helmet** : Headers de sécurité
- **Validation** : Toutes les entrées validées avec Zod
- **JWT** : Tokens sécurisés avec expiration
- **Password Hashing** : bcrypt avec salt

## 📝 Variables d'Environnement

```env
# Base de données
DATABASE_URL="mysql://user:password@localhost:3306/birkshoes"

# JWT
JWT_SECRET="your-very-secure-secret-key"
JWT_REFRESH_SECRET="your-very-secure-refresh-secret"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Admin par défaut
ADMIN_EMAIL="admin@birkshoes.com"
ADMIN_PASSWORD="securepassword123"

# Serveur
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR="uploads"
```

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 📊 Monitoring

Le projet inclut un système de logging complet avec :
- Logs des requêtes (Morgan)
- Logs d'erreurs
- Métriques de performance
- Monitoring de la base de données

## 🚀 Déploiement

### Production avec Docker

```bash
# Build production
docker build -t birkshoes-api .

# Run container
docker run -d -p 3000:3000 --env-file .env.production birkshoes-api
```

### Variables d'environnement Production

```env
NODE_ENV=production
DATABASE_URL="mysql://user:password@prod-server:3306/birkshoes"
JWT_SECRET="production-secret-very-secure"
CORS_ORIGIN="https://yourdomain.com"
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour obtenir de l'aide :
- Créer une issue GitHub
- Consulter la documentation API
- Contacter l'équipe de développement

---

**Développé avec ❤️ pour BirkShoes**
