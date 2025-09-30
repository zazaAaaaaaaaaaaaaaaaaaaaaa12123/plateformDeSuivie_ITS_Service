# 🚀 Déploiement sur Render - Guide Complet

## 📋 Prérequis
- Compte GitHub avec le repository `plateformDeSuivie_ITS_Service`
- Nouveau compte Render
- Données PostgreSQL à migrer (optionnel)

## 🔧 Configuration Render

### 1. Créer la base de données PostgreSQL
1. Connectez-vous à votre Dashboard Render
2. Cliquez sur "New +" → "PostgreSQL"
3. Configurez :
   - **Name**: `plateformdesuivie-postgres`
   - **Database**: `plateformdesuivie_db`
   - **User**: `plateformdesuivie_user`
   - **Region**: Frankfurt (recommandé pour l'Europe)
   - **Plan**: Free (pour commencer)

### 2. Créer le Web Service
1. Dans le Dashboard Render, cliquez sur "New +" → "Web Service"
2. Connectez votre repository GitHub : `plateformDeSuivie_ITS_Service`
3. Configurez :
   - **Name**: `plateformdesuivie-its-service`
   - **Region**: Frankfurt
   - **Branch**: `master`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Variables d'environnement
Dans les paramètres du Web Service, ajoutez :

```
NODE_ENV=production
PORT=10000
DATABASE_URL=[URL de votre base PostgreSQL Render]
```

**Note**: L'URL `DATABASE_URL` sera automatiquement disponible une fois la base créée.

## 🗄️ Migration des données

### Automatique (via le script)
Le script `migrate.js` s'exécute automatiquement au déploiement et :
- Crée les tables nécessaires
- Insère un administrateur par défaut
- Teste la connexion

### Manuelle (depuis pgAdmin)
1. Exportez vos données actuelles depuis pgAdmin :
   ```sql
   pg_dump -h localhost -U votre_user -d votre_db > backup.sql
   ```
2. Importez dans la base Render via le terminal Render ou pgAdmin

## 🔐 Compte administrateur par défaut
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ IMPORTANT**: Changez ce mot de passe immédiatement après le premier login !

## 🌐 Accès à l'application
Une fois déployée, votre application sera disponible à :
```
https://plateformdesuivie-its-service.onrender.com
```

## 🔗 Configuration du domaine dossiv.ci
1. Une fois l'application fonctionnelle sur Render
2. Dans les paramètres du Web Service → "Custom Domains"
3. Ajoutez `dossiv.ci` et `www.dossiv.ci`
4. Configurez les enregistrements DNS chez votre registrar :
   ```
   Type: CNAME
   Name: www
   Value: plateformdesuivie-its-service.onrender.com
   
   Type: A
   Name: @
   Value: [IP fournie par Render]
   ```

## 🐛 Dépannage

### Erreur de connexion base de données
- Vérifiez que `DATABASE_URL` est correctement configurée
- La base PostgreSQL doit être dans la même région que le Web Service

### Application ne démarre pas
- Vérifiez les logs dans le Dashboard Render
- Assurez-vous que `PORT=10000` est configuré

### Migration échoue
- Exécutez manuellement : `npm run migrate` dans le terminal Render
- Vérifiez les permissions de la base de données

## 📞 Support
En cas de problème, consultez :
- [Documentation Render](https://render.com/docs)
- Logs de l'application dans le Dashboard Render