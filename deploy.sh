#!/bin/bash

# Script de déploiement production - API (api.birkshoes.store)

echo "🚀 Déploiement de l'API Birkshoes en production..."

PROJECT_DIR="/var/www/birkshoes-api"
cd $PROJECT_DIR

# Pull du code
git fetch --all
git reset --hard origin/main

# Installation et build
npm ci --only=production
npm run build:prod

# Migration DB production
npm run db:migrate:prod

# Redémarrage PM2
pm2 restart birkshoes-api || pm2 start ecosystem.config.json

echo "✅ Déploiement API terminé !"
