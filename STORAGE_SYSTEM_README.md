# 📊 Système de Gestion du Stockage - Plateforme ITS Service

## Vue d'ensemble

Le système de gestion du stockage est une solution complète et professionnelle qui surveille en temps réel l'utilisation de l'espace de stockage de la plateforme. Il a été conçu pour éviter les coûts supplémentaires sur Render tout en offrant une expérience utilisateur de niveau entreprise.

## 🎯 Fonctionnalités Principales

### 1. **Monitoring en Temps Réel**

- Surveillance automatique toutes les 10 minutes
- Calcul précis de l'utilisation (fichiers + base de données)
- Alertes automatiques aux seuils critiques
- Cache intelligent pour optimiser les performances

### 2. **Interface Utilisateur Avancée**

- **Indicateur principal** : Barre de progression avec pourcentage d'utilisation
- **Détails par catégorie** : Fichiers uploads et base de données séparément
- **Analyse des types de fichiers** : Répartition par extension
- **Statistiques des archives** : Taille et nombre d'archives
- **Recommandations intelligentes** : Suggestions d'optimisation

### 3. **Outils de Maintenance**

- **Nettoyage automatique** : Suppression des anciens fichiers
- **Optimisation de la base** : VACUUM et compaction des archives
- **Détection des orphelins** : Suppression des fichiers non référencés
- **Mode simulation** : Prévisualisation avant suppression

### 4. **Système d'Alertes**

- **Niveau Optimal** (<70%) : Statut vert
- **Niveau Attention** (70-85%) : Statut orange
- **Niveau Critique** (>85%) : Statut rouge avec animations
- **Logs automatiques** : Historique des alertes dans storage-alerts.log

## 🛠️ Architecture Technique

### Backend (Node.js)

#### Endpoints API

```javascript
GET / api / storage / usage; // Calcul complet du stockage
GET / api / storage / status; // Statut rapide (avec cache)
POST / api / storage / cleanup; // Nettoyage des anciens fichiers
POST / api / storage / optimize; // Optimisation du stockage
```

#### Fonctions Principales

- `calculateStorageUsage()` : Calcul précis de l'utilisation
- `calculateDirectorySize()` : Taille des répertoires
- `calculateDatabaseSize()` : Taille PostgreSQL
- `analyzeFileTypes()` : Analyse des types de fichiers
- `cleanupOldFiles()` : Nettoyage automatique
- `optimizeStorage()` : Optimisation complète

### Frontend (JavaScript)

#### Classes Principales

- `ArchivesManager` : Gestion des archives avec stockage intégré
- `StorageWidget` : Widget compact pour autres pages

#### Fonctionnalités Interface

- Mise à jour automatique toutes les minutes
- Modales interactives pour nettoyage/optimisation
- Animations et effets visuels selon le statut
- Responsive design pour mobile

## 📋 Utilisation

### 1. **Page des Archives**

La page `archives.html` inclut automatiquement le panneau de stockage en haut :

- Affichage complet des métriques
- Boutons d'action pour maintenance
- Recommandations personnalisées

### 2. **Widget sur Autres Pages**

Pour ajouter le widget compact sur d'autres pages :

```html
<!-- HTML -->
<div id="monWidgetStockage"></div>

<!-- JavaScript -->
<script src="../js/storage-widget.js"></script>
<script>
  // Widget compact
  new StorageWidget("monWidgetStockage", { compact: true });

  // Widget détaillé
  new StorageWidget("monWidgetStockage", { compact: false });
</script>
```

### 3. **Configuration**

```javascript
// Options du widget
const options = {
  compact: true, // Mode compact ou détaillé
  autoRefresh: true, // Mise à jour automatique
  refreshInterval: 60000, // Intervalle en ms
  showDetails: false, // Afficher les détails supplémentaires
};
```

## ⚙️ Configuration des Seuils

### Limites par Défaut

```javascript
const limits = {
  uploads_warning: 100 * 1024 * 1024, // 100 MB
  uploads_critical: 200 * 1024 * 1024, // 200 MB
  uploads_max: 300 * 1024 * 1024, // 300 MB
  database_warning: 50 * 1024 * 1024, // 50 MB
  database_critical: 100 * 1024 * 1024, // 100 MB
  database_max: 150 * 1024 * 1024, // 150 MB
};
```

### Personnalisation

Modifiez ces valeurs dans `serverITS.js` fonction `calculateStorageUsage()` selon vos besoins.

## 🔧 Maintenance et Optimisation

### 1. **Nettoyage Automatique**

```javascript
// Nettoyer les fichiers de plus de 30 jours
POST /api/storage/cleanup
{
  "days": 30,
  "dryRun": false
}
```

### 2. **Optimisation Base de Données**

```javascript
// Optimisation complète
POST / api / storage / optimize;
```

### 3. **Surveillance des Logs**

Les alertes sont automatiquement sauvegardées dans :

- `storage-alerts.log` : Historique des alertes
- Console serveur : Logs en temps réel

## 📈 Métriques et Reporting

### Données Collectées

- **Taille totale** : Fichiers + Base de données
- **Répartition par type** : Extensions de fichiers
- **Archives** : Nombre et taille des données archivées
- **Fichiers orphelins** : Fichiers non référencés
- **Performance** : Temps de calcul

### Format des Données

```javascript
{
  total: {
    used: 52428800,           // Octets utilisés
    limit: 471859200,         // Limite totale
    percentage: 11,           // Pourcentage d'utilisation
    status: "safe",           // safe|warning|critical
    statusColor: "#28a745"    // Couleur du statut
  },
  uploads: { /* détails fichiers */ },
  database: { /* détails base */ },
  recommendations: [ /* suggestions */ ]
}
```

## 🚨 Alertes et Notifications

### Niveaux d'Alerte

1. **Optimal** (0-69%) : Fonctionnement normal
2. **Attention** (70-84%) : Surveillance accrue
3. **Critique** (85-100%) : Action immédiate requise

### Actions Automatiques

- Log des alertes dans fichier dédié
- Affichage d'animations visuelles
- Recommandations contextuelles
- Prêt pour notifications email (TODO)

## 🎨 Personnalisation CSS

Le fichier `storage-monitor.css` contient tous les styles :

- Animations et transitions
- Couleurs par statut
- Responsive design
- Mode sombre (auto-détection)

### Classes Importantes

```css
.storage-critical    /* Animation pulse rouge */
/* Animation pulse rouge */
.storage-warning     /* Animation pulse jaune */
.bg-success-gradient /* Dégradé vert */
.bg-warning-gradient /* Dégradé orange */
.bg-danger-gradient; /* Dégradé rouge */
```

## 🔄 Intégration avec les Archives

Le système se met automatiquement à jour lors :

- **Ajout d'archive** : Recalcul après 1 seconde
- **Suppression d'archive** : Recalcul après 1 seconde
- **Restauration de dossier** : Mise à jour des métriques

## 📱 Compatibilité

### Navigateurs Supportés

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Responsive Design

- Mobile : Widget compact automatique
- Tablette : Interface adaptée
- Desktop : Interface complète

## 🔐 Sécurité

### Permissions

- Lecture des métriques : Tous les utilisateurs
- Nettoyage/Optimisation : À sécuriser selon besoins
- Logs d'alertes : Accès serveur uniquement

### Validation

- Validation des paramètres API
- Protection contre les requêtes excessives
- Cache pour éviter la surcharge

## 🚀 Évolutions Futures

### Fonctionnalités Planifiées

1. **Notifications Email** : Alertes aux administrateurs
2. **Webhook External** : Intégration monitoring externe
3. **Historique Graphique** : Évolution dans le temps
4. **Compression Automatique** : Optimisation fichiers
5. **Quotas Utilisateurs** : Limites par rôle

### Améliorations Techniques

1. **Worker Background** : Calculs asynchrones
2. **Cache Redis** : Performance accrue
3. **API GraphQL** : Requêtes optimisées
4. **Progressive Web App** : Notifications push

---

## 📞 Support

Pour toute question ou problème :

1. Vérifiez les logs serveur
2. Consultez `storage-alerts.log`
3. Testez l'API directement
4. Vérifiez la console navigateur

**Le système de stockage est maintenant opérationnel et surveille automatiquement votre plateforme !** 🎉
