# Synchronisation des Cartes du Tableau de Bord

## 📋 Vue d'ensemble

Ce document décrit la mise en place du système de synchronisation automatique entre les trois cartes principales du tableau de bord :

1. **"En cours de paiement"** - Dossiers en attente de paiement
2. **"Dossiers mis en livraison"** - Dossiers en cours de livraison
3. **"Dossiers livrés"** - Dossiers complètement livrés

## 🔄 Logique de Synchronisation

### Flux des Transitions

```
En attente de paiement → Mise en livraison → Livré
     (Carte 1)              (Carte 2)       (Carte 3)
```

### Règles de Comptage

#### Carte 1: "En cours de paiement"

- **Critères d'inclusion** :
  - `delivery_status_acconier = "en attente de paiement"` OU
  - Statut non défini ET pas tous les BL en `mise_en_livraison`
- **Critères d'exclusion** :
  - `delivery_status_acconier = "mise_en_livraison_acconier"`
  - Tous les BL en `mise_en_livraison`
  - Dossier complètement livré

#### Carte 2: "Dossiers mis en livraison"

- **Critères d'inclusion** :
  - `delivery_status_acconier = "mise_en_livraison_acconier"` OU
  - Tous les BL en `mise_en_livraison`
- **Critères d'exclusion** :
  - Dossier complètement livré (tous conteneurs livrés)

#### Carte 3: "Dossiers livrés"

- **Critères d'inclusion** :
  - Tous les conteneurs du dossier ont le statut `livre` ou `livré`
- **Priorité absolue** : Cette carte a la priorité sur les autres

## 🚀 Points de Synchronisation

### 1. Changement de Statut BL (resp_acconier → resp_liv)

**Fichier**: `serverITS.js` - Route `PATCH /deliveries/:id/bl-status`

**Trigger**: Quand tous les BL d'un dossier passent en `mise_en_livraison`

**Action**:

- Décrément "En cours de paiement"
- Incrément "Dossiers mis en livraison"

### 2. Livraison de Conteneurs (resp_liv)

**Fichier**: `serverITS.js` - Route `PATCH /deliveries/:id/container-status`

**Trigger**: Changement de statut de conteneur

**Actions possibles**:

- **Premier conteneur livré**: "En attente" → "Mise en livraison"
- **Dernier conteneur livré**: "Mise en livraison" → "Livré"
- **Conteneur intermédiaire**: Pas de changement de carte

### 3. WebSocket en Temps Réel

**Fichier**: `tableauDeBord.html`

**Types d'événements écoutés**:

- `dossier-entre-en-livraison`: Transition carte 1 → carte 2
- `status-change` avec `action: "delivery_completed"`: Transition carte 2 → carte 3
- `status-change` avec `action: "delivery_started"`: Transition carte 1 → carte 2

## 📡 API de Comptage

### Endpoint: `GET /api/deliveries/status-counts`

**Réponse**:

```json
{
  "success": true,
  "counts": {
    "en_attente_paiement": 15,
    "mise_en_livraison": 8,
    "livres": 23,
    "en_retard": 3
  }
}
```

## 🔧 Fonctions de Diagnostic

### Côté Client (Console du navigateur)

```javascript
// Diagnostic complet
window.diagnoseTablóeDeBord();

// Forcer la synchronisation
window.updateCardCounters();

// Corriger manuellement
window.fixCardCounters();
```

### Logs Serveur

- `[COUNTS]` : Comptage des dossiers par catégorie
- `[TRANSITION]` : Changements d'état des dossiers
- `[CARD SYNC]` : Diffusion WebSocket des synchronisations

## ⚡ Synchronisation Automatique

### Périodicité

- **Mise à jour automatique** : Toutes les 30 secondes
- **Mise à jour en temps réel** : Via WebSocket lors des changements

### Déclencheurs WebSocket

1. Changement de statut BL
2. Livraison de conteneur
3. Mise à jour forcée via `forceCounterUpdate: true`

## 🐛 Débogage

### Problèmes Courants

1. **Compteurs incorrects**

   - Vérifier la console pour les logs `[COUNTS]`
   - Exécuter `window.diagnoseTablóeDeBord()`

2. **Synchronisation lente**

   - Vérifier la connexion WebSocket
   - Forcer avec `window.updateCardCounters()`

3. **Valeurs figées**
   - Rechargeur la page
   - Vérifier l'API `/api/deliveries/status-counts`

### Commandes de Test

```javascript
// Test API
fetch("/api/deliveries/status-counts")
  .then((r) => r.json())
  .then(console.log);

// Test synchronisation
window.updateCardCounters();

// Diagnostic complet
window.diagnoseTablóeDeBord();
```

## 📈 Performances

### Optimisations Implémentées

1. **Logique de priorité** : Évite la double comptabilisation
2. **Cache WebSocket** : Mise à jour uniquement si nécessaire
3. **Délais optimisés** : 50-100ms pour la synchronisation temps réel
4. **Logs structurés** : Facilite le débogage

### Surveillance

- Logs automatiques dans la console
- Compteurs visibles en temps réel
- Alertes visuelles lors des changements

## 🎯 Validation

Pour valider que tout fonctionne :

1. Ouvrir la console du navigateur sur le tableau de bord
2. Exécuter `window.diagnoseTablóeDeBord()`
3. Vérifier que toutes les cartes sont ✅
4. Tester une transition depuis resp_acconier ou resp_liv
5. Observer la synchronisation en temps réel

---

**Note**: Cette synchronisation assure une cohérence parfaite entre les cartes du tableau de bord et l'état réel des dossiers dans le système.
