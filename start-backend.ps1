#!/usr/bin/env pwsh

Write-Host "🚀 Démarrage du serveur backend BirkShoes API..." -ForegroundColor Green
Write-Host "📍 Répertoire: $(Get-Location)" -ForegroundColor Cyan

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé ou inaccessible!" -ForegroundColor Red
    Write-Host "📥 Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour continuer..."
    exit 1
}

# Vérifier si les modules npm sont installés
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances!" -ForegroundColor Red
        Read-Host "Appuyez sur Entrée pour continuer..."
        exit 1
    }
}

# Vérifier la base de données
Write-Host "🗄️ Configuration de la base de données..." -ForegroundColor Yellow
npx prisma generate
npx prisma db push

Write-Host "" 
Write-Host "🎯 Démarrage du serveur..." -ForegroundColor Green
Write-Host "📡 API sera accessible sur: http://localhost:4000" -ForegroundColor Cyan
Write-Host "🔧 Mode: Développement avec rechargement automatique" -ForegroundColor Cyan
Write-Host "🛑 Pour arrêter le serveur: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur
npm run dev
