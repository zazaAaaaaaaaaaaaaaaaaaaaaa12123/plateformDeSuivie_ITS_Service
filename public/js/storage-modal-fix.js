// ===============================
// CORRECTION TEMPORAIRE POUR LA MODAL DE STOCKAGE
// ===============================

// Fonction utilitaire pour formater les bytes
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Fonction pour obtenir la configuration du statut
function getStatusConfig(status) {
  const configs = {
    'safe': { icon: 'fa-check-circle', text: 'Optimal', class: 'bg-success' },
    'warning': { icon: 'fa-exclamation-circle', text: 'Attention', class: 'bg-warning' },
    'critical': { icon: 'fa-exclamation-triangle', text: 'Critique', class: 'bg-danger' }
  };
  return configs[status] || configs['safe'];
}

// Fonction pour charger et afficher les données de stockage
async function loadStorageModalData() {
  const loadingElement = document.getElementById('storageModalLoading');
  const contentElement = document.getElementById('storageModalContent');
  
  if (loadingElement) loadingElement.style.display = 'block';
  if (contentElement) contentElement.style.display = 'none';

  try {
    const response = await fetch('/api/storage/usage');
    const data = await response.json();

    if (data.success) {
      updateStorageModalDisplay(data);
    } else {
      throw new Error(data.error || 'Erreur lors du chargement des données');
    }
  } catch (error) {
    console.error('[STORAGE MODAL] Erreur:', error);
    showStorageModalError(error.message);
  } finally {
    if (loadingElement) loadingElement.style.display = 'none';
    if (contentElement) contentElement.style.display = 'block';
  }
}

// Fonction pour mettre à jour l'affichage de la modal
function updateStorageModalDisplay(data) {
  const storage = data.storage;
  
  // Vérification des données essentielles
  if (!storage || !storage.total) {
    console.error('[STORAGE MODAL] Données de stockage manquantes');
    showStorageModalError('Données de stockage non disponibles');
    return;
  }

  // Indicateur principal
  const mainProgress = document.getElementById('storageModalMainProgress');
  const mainProgressText = document.getElementById('storageModalMainProgressText');
  const mainStatus = document.getElementById('storageModalMainStatus');
  const mainIcon = document.getElementById('storageModalMainIcon');
  const mainText = document.getElementById('storageModalMainText');
  const usedText = document.getElementById('storageModalUsedText');
  const limitText = document.getElementById('storageModalLimitText');

  if (mainProgress && mainProgressText && storage.total.percentage !== undefined) {
    const percentage = (storage.total.percentage || 0).toFixed(1);
    mainProgress.style.width = `${percentage}%`;
    mainProgressText.textContent = `${percentage}%`;

    // Couleur selon le pourcentage
    mainProgress.className = 'progress-bar progress-bar-striped progress-bar-animated';
    if (percentage > 80) {
      mainProgress.style.background = 'rgba(220, 53, 69, 0.9)'; // Rouge
    } else if (percentage > 60) {
      mainProgress.style.background = 'rgba(255, 193, 7, 0.9)'; // Jaune
    } else {
      mainProgress.style.background = 'rgba(255,255,255,0.9)'; // Blanc
    }
  }

  if (usedText && storage.total.used !== undefined) {
    usedText.textContent = `${formatBytes(storage.total.used)} utilisés`;
  }
  if (limitText && storage.total.limit !== undefined) {
    limitText.textContent = `${formatBytes(storage.total.limit)} disponibles`;
  }

  // Status badge
  if (mainStatus && mainIcon && mainText && storage.total.status) {
    const status = storage.total.status;
    let statusConfig = getStatusConfig(status);
    mainIcon.className = `fas ${statusConfig.icon} me-2`;
    mainText.textContent = statusConfig.text;
    mainStatus.className = `badge badge-xl p-3 ${statusConfig.class}`;
    mainStatus.style.fontSize = '1.2rem';
  }

  // Fichiers Uploads
  updateStorageCategory('Uploads', storage.uploads);
  
  // Base de données
  updateStorageCategory('Database', storage.database);

  // Métriques de performance
  updateStorageMetrics(data);
}

// Fonction pour mettre à jour une catégorie de stockage
function updateStorageCategory(type, categoryData) {
  if (!categoryData) return;

  const progress = document.getElementById(`storageModal${type}Progress`);
  const progressText = document.getElementById(`storageModal${type}ProgressText`);
  const used = document.getElementById(`storageModal${type}Used`);
  const limit = document.getElementById(`storageModal${type}Limit`);

  if (progress && progressText && categoryData.percentage !== undefined) {
    const percentage = (categoryData.percentage || 0).toFixed(1);
    progress.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}%`;
  }

  if (used && categoryData.size !== undefined) {
    used.textContent = formatBytes(categoryData.size || 0);
  }
  if (limit && categoryData.limit !== undefined) {
    limit.textContent = formatBytes(categoryData.limit || 0);
  }
}

// Fonction pour mettre à jour les métriques de performance
function updateStorageMetrics(data) {
  const calculationTime = document.getElementById('storageModalCalculationTime');
  const lastUpdate = document.getElementById('storageModalLastUpdate');
  const systemStatus = document.getElementById('storageModalSystemStatus');

  if (calculationTime && data.calculationTime) {
    calculationTime.textContent = `${data.calculationTime} ms`;
  }

  if (lastUpdate) {
    lastUpdate.textContent = new Date().toLocaleString('fr-FR');
  }

  if (systemStatus && data.storage?.total?.status) {
    const status = data.storage.total.status;
    const statusConfig = getStatusConfig(status);
    systemStatus.textContent = statusConfig.text;
    systemStatus.className = `badge ${statusConfig.class}`;
  }
}

// Fonction pour afficher une erreur dans la modal
function showStorageModalError(message) {
  const contentElement = document.getElementById('storageModalContent');
  if (contentElement) {
    contentElement.innerHTML = `
      <div class="alert alert-danger text-center py-5">
        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
        <h5>Erreur de chargement</h5>
        <p>${message}</p>
        <button class="btn btn-outline-danger" onclick="this.closest('.modal').querySelector('[data-bs-dismiss]').click()">
          Fermer
        </button>
      </div>
    `;
  }
}

// Attacher les événements quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
  // Réattacher l'événement au bouton de stockage
  const storageBtn = document.getElementById('storageMonitorBtn');
  if (storageBtn) {
    // Supprimer les anciens événements
    storageBtn.replaceWith(storageBtn.cloneNode(true));
    const newStorageBtn = document.getElementById('storageMonitorBtn');
    
    newStorageBtn.addEventListener('click', function() {
      // Vérifier si la modal existe déjà et la supprimer
      const existingModal = document.getElementById('storageModal');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Créer une nouvelle modal
      showStorageModal();
    });
  }
});

// Fonction pour afficher la modal de stockage
function showStorageModal() {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'storageModal';
  modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-info text-white">
          <h5 class="modal-title">
            <i class="fas fa-database me-2"></i>
            Niveau de Stockage - Plateforme ITS Service
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <div id="storageModalLoading" class="text-center py-5">
            <div class="spinner-border text-info" style="width: 3rem; height: 3rem;" role="status">
              <span class="visually-hidden">Chargement des données de stockage...</span>
            </div>
            <p class="mt-3 text-muted">Calcul de l'utilisation du stockage...</p>
          </div>
          <div id="storageModalContent" style="display: none;">
            <!-- Indicateur principal -->
            <div class="row mb-4">
              <div class="col-12">
                <div class="card border-0 bg-gradient" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <div class="card-body text-white text-center py-4">
                    <h3 class="mb-3">
                      <i class="fas fa-chart-pie me-2"></i>
                      Utilisation Globale du Stockage
                    </h3>
                    <div class="row align-items-center">
                      <div class="col-md-8">
                        <div class="progress mb-3" style="height: 30px; background: rgba(255,255,255,0.2);">
                          <div id="storageModalMainProgress" 
                               class="progress-bar progress-bar-striped progress-bar-animated" 
                               role="progressbar" 
                               style="width: 0%; background: rgba(255,255,255,0.9);">
                            <span id="storageModalMainProgressText" class="fw-bold text-dark">0%</span>
                          </div>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span id="storageModalUsedText" class="fw-semibold">0 MB utilisés</span>
                          <span id="storageModalLimitText" class="fw-semibold">0 MB disponibles</span>
                        </div>
                      </div>
                      <div class="col-md-4 text-center">
                        <span id="storageModalMainStatus" class="badge badge-xl p-3" style="font-size: 1.2rem;">
                          <i id="storageModalMainIcon" class="fas fa-check-circle me-2"></i>
                          <span id="storageModalMainText">Optimal</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Détails par catégorie -->
            <div class="row mb-4">
              <!-- Fichiers Uploads -->
              <div class="col-lg-6 mb-3">
                <div class="card h-100 border-primary">
                  <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">
                      <i class="fas fa-file-upload me-2"></i>
                      Fichiers Uploads
                    </h5>
                  </div>
                  <div class="card-body">
                    <div class="progress mb-3" style="height: 25px;">
                      <div id="storageModalUploadsProgress" 
                           class="progress-bar bg-primary" 
                           role="progressbar" 
                           style="width: 0%">
                        <span id="storageModalUploadsProgressText" class="fw-bold">0%</span>
                      </div>
                    </div>
                    <div class="d-flex justify-content-between mb-3">
                      <span><strong>Utilisé:</strong> <span id="storageModalUploadsUsed">0 MB</span></span>
                      <span><strong>Limite:</strong> <span id="storageModalUploadsLimit">0 MB</span></span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Base de Données -->
              <div class="col-lg-6 mb-3">
                <div class="card h-100 border-success">
                  <div class="card-header bg-success text-white">
                    <h5 class="mb-0">
                      <i class="fas fa-database me-2"></i>
                      Base de Données
                    </h5>
                  </div>
                  <div class="card-body">
                    <div class="progress mb-3" style="height: 25px;">
                      <div id="storageModalDatabaseProgress" 
                           class="progress-bar bg-success" 
                           role="progressbar" 
                           style="width: 0%">
                        <span id="storageModalDatabaseProgressText" class="fw-bold">0%</span>
                      </div>
                    </div>
                    <div class="d-flex justify-content-between mb-3">
                      <span><strong>Utilisé:</strong> <span id="storageModalDatabaseUsed">0 MB</span></span>
                      <span><strong>Limite:</strong> <span id="storageModalDatabaseLimit">0 MB</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Métriques de performance -->
            <div class="row mb-4">
              <div class="col-12">
                <div class="card border-info">
                  <div class="card-header bg-info text-white">
                    <h6 class="mb-0">
                      <i class="fas fa-tachometer-alt me-2"></i>
                      Métriques de Performance
                    </h6>
                  </div>
                  <div class="card-body">
                    <div class="row text-center">
                      <div class="col-md-4">
                        <div class="border rounded p-3">
                          <i class="fas fa-clock text-primary fa-2x mb-2"></i>
                          <p class="mb-1"><strong>Temps de calcul</strong></p>
                          <span id="storageModalCalculationTime" class="text-muted">-- ms</span>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="border rounded p-3">
                          <i class="fas fa-sync-alt text-success fa-2x mb-2"></i>
                          <p class="mb-1"><strong>Dernière MAJ</strong></p>
                          <span id="storageModalLastUpdate" class="text-muted">--</span>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="border rounded p-3">
                          <i class="fas fa-shield-alt text-info fa-2x mb-2"></i>
                          <p class="mb-1"><strong>Statut</strong></p>
                          <span id="storageModalSystemStatus" class="badge bg-success">Sain</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer bg-light">
          <div class="d-flex w-100 justify-content-between align-items-center">
            <div class="d-flex gap-2">
              <button id="storageModalRefreshBtn" class="btn btn-outline-primary">
                <i class="fas fa-sync-alt me-1"></i>
                Actualiser
              </button>
            </div>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Ajouter la modal au DOM
  document.body.appendChild(modal);
  
  // Événement refresh
  const refreshBtn = modal.querySelector('#storageModalRefreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadStorageModalData();
    });
  }
  
  // Afficher la modal
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
  
  // Charger les données
  loadStorageModalData();
  
  // Nettoyer la modal à sa fermeture
  modal.addEventListener('hidden.bs.modal', () => {
    document.body.removeChild(modal);
  });
}
