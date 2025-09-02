# Système de Gestion des Accès ITS Service

## Vue d'ensemble

Le nouveau système de gestion des accès remplace l'ancien système d'inscription directe par un processus de demande d'accès avec validation administrative.

## Comment ça fonctionne

### Pour les utilisateurs (Demandeurs d'accès)

1. **Page d'accueil** : Plus de bouton "S'inscrire", remplacé par "Demande d'accès"
2. **Demande d'accès** :

   - Cliquer sur "Demande d'accès" dans le header
   - Remplir le formulaire : nom, email, date
   - Cliquer sur "Envoyer la requête"
   - Attendre 6 secondes (simulation de traitement)
   - Recevoir la confirmation d'envoi

3. **Connexion** :
   - Une fois l'accès approuvé par l'admin
   - Utiliser l'email + le code d'accès fourni
   - Accès direct au tableau de bord

### Pour les administrateurs

1. **Connexion admin** :

   - Email: `admin@itsservice.com`
   - Mot de passe: `Admin123!`
   - Accès automatique à l'interface de gestion

2. **Interface de gestion** (`/html/access-management.html`) :
   - Tableau de bord avec statistiques
   - Liste des demandes en attente
   - Traitement des demandes :
     - Voir les détails de l'utilisateur
     - Générer automatiquement un mot de passe
     - Approuver ou rejeter la demande
   - Notifications en temps réel

## Fonctionnalités

### Interface utilisateur

- ✅ Suppression du système d'inscription
- ✅ Nouveau bouton "Demande d'accès"
- ✅ Modal de demande avec champs obligatoires
- ✅ Animation de chargement (6 secondes)
- ✅ Modal de confirmation
- ✅ Connexion adaptée au nouveau système

### Interface administrateur

- ✅ Interface dédiée moderne et responsive
- ✅ Statistiques en temps réel
- ✅ Gestion des demandes d'accès
- ✅ Génération automatique de mots de passe
- ✅ Système de notifications
- ✅ Création automatique de comptes utilisateurs

### Backend

- ✅ Nouvelles routes API pour les demandes d'accès
- ✅ Table `access_requests` pour stocker les demandes
- ✅ Système de rôles (admin/user)
- ✅ Création automatique de l'admin par défaut
- ✅ Hashage sécurisé des mots de passe
- ✅ Vérification des doublons

## API Endpoints

### Nouvelles routes ajoutées :

1. **POST /api/access-request**

   - Recevoir une nouvelle demande d'accès
   - Corps : `{ name, email, date }`

2. **GET /api/get-new-access-requests**

   - Récupérer les demandes en attente
   - Réponse : `{ success, requests[] }`

3. **POST /api/create-user-account**
   - Créer un compte après approbation
   - Corps : `{ name, email, password }`

### Route modifiée :

1. **POST /api/login**
   - Maintenant retourne `isAdmin` pour la redirection
   - Gère les rôles admin/user

## Structure des fichiers

### Nouveaux fichiers :

- `public/html/access-management.html` - Interface d'administration
- `public/js/access-management.js` - Logique de l'interface admin
- `public/css/access-management.css` - Styles pour l'interface admin

### Fichiers modifiés :

- `public/html/index.html` - Suppression inscription, ajout demande d'accès
- `public/js/script.js` - Nouvelle logique de connexion et demandes
- `serverITS.js` - Nouvelles routes API et gestion des rôles

## Base de données

### Nouvelle table `access_requests` :

```sql
CREATE TABLE access_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  request_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  processed_by VARCHAR(255) NULL
);
```

### Table `users` modifiée :

- Ajout de la colonne `role` (admin/user)
- Utilisateur admin créé automatiquement

## Sécurité

- ✅ Hachage bcrypt pour tous les mots de passe
- ✅ Validation des données côté serveur
- ✅ Vérification des doublons
- ✅ Gestion des rôles et permissions
- ✅ Protection contre les injections SQL

## Utilisation

### Démarrage

1. Démarrer le serveur : `node serverITS.js`
2. Accéder à l'interface : `http://localhost:3000`
3. Interface admin : Se connecter avec les identifiants admin

### Test du flux complet

1. Faire une demande d'accès depuis la page d'accueil
2. Se connecter en tant qu'admin
3. Approuver la demande
4. Tester la connexion avec les nouveaux identifiants

## Notes importantes

⚠️ **Sécurité en production** :

- Changer le mot de passe admin par défaut
- Configurer des variables d'environnement sécurisées
- Mettre en place HTTPS

🔄 **Compatibilité** :

- Le système est rétrocompatible avec les utilisateurs existants
- Les anciennes routes de connexion continuent de fonctionner

📱 **Responsive** :

- Toutes les interfaces sont adaptatives
- Optimisées pour mobile et desktop
