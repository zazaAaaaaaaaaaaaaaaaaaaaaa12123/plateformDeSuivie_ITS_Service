# Guide de Déploiement - Plateforme de Suivi ITS

## 🚨 Problèmes actuels identifiés

### 1. Erreur Cloudflare 1000
- **Cause** : Configuration DNS incorrecte avec IP statique en conflit
- **Solution** : Utiliser CNAME au lieu d'enregistrement A

### 2. Compte Render suspendu
- **Cause** : Activité suspecte détectée par Render
- **Solution** : Migrer vers une alternative

## 🛠️ Solutions de déploiement

### Option 1 : Heroku (Recommandé)

```bash
# 1. Installer Heroku CLI
# 2. Se connecter
heroku login

# 3. Créer l'application
heroku create dossiv-platform

# 4. Configurer les variables d'environnement
heroku config:set PGUSER=votre_user
heroku config:set PGHOST=votre_host
heroku config:set PGDATABASE=votre_db
heroku config:set PGPASSWORD=votre_password
heroku config:set PGPORT=5432

# 5. Déployer
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Option 2 : Railway

1. Aller sur railway.app
2. Connecter votre repo GitHub
3. Configurer les variables d'environnement
4. Déploiement automatique

### Option 3 : DigitalOcean App Platform

1. Créer un compte DigitalOcean
2. Utiliser App Platform
3. Connecter GitHub et déployer

## 🔧 Configuration DNS Cloudflare

### Étapes à suivre :

1. **Supprimer l'enregistrement A actuel**
   - Type: A
   - Nom: @ ou dossiv.ci
   - Valeur: 160.155.240.158
   → SUPPRIMER CET ENREGISTREMENT

2. **Créer un enregistrement CNAME**
   - Type: CNAME
   - Nom: @
   - Cible: votre-nouvelle-app.herokuapp.com (ou autre plateforme)
   - Proxy: DÉSACTIVÉ (nuage gris)

3. **Ajouter CNAME pour www**
   - Type: CNAME
   - Nom: www
   - Cible: votre-nouvelle-app.herokuapp.com
   - Proxy: DÉSACTIVÉ (nuage gris)

## 📝 Fichiers nécessaires pour le déploiement

### Procfile (pour Heroku)
```
web: node serverITS.js
```

### package.json (vérifier les scripts)
```json
{
  "scripts": {
    "start": "node serverITS.js"
  }
}
```

## 🎯 Actions immédiates

1. **Choisir une nouvelle plateforme de déploiement**
2. **Configurer les variables d'environnement** 
3. **Déployer l'application**
4. **Mettre à jour DNS sur Cloudflare**
5. **Tester le fonctionnement**

## 🆘 En cas d'urgence

Si vous avez besoin d'une solution temporaire immédiate :

1. **Désactiver Cloudflare temporairement** :
   - Changer les nameservers vers ceux de votre registrar
   - Pointer directement vers une nouvelle plateforme

2. **Utiliser un sous-domaine temporaire** :
   - app.dossiv.ci ou api.dossiv.ci
   - Plus facile à configurer rapidement