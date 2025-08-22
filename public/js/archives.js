/**
 * Archives.js - Gestion de l'interface des archives
 * Système de centralisation, recherche et restauration des dossiers archivés
 * Inclut le système de gestion du stockage avancé
 */

class ArchivesManager {
  constructor() {
    this.currentPage = 1;
    this.itemsPerPage = 50;
    this.currentFilters = {
      search: "",
      action_type: "",
      role_source: "",
      date_start: "",
      date_end: "",
    };
    this.allArchives = []; // Données complètes pour les compteurs
    this.filteredArchives = []; // Données filtrées à afficher
    this.selectedTab = "all";
    this.allArchivesData = null; // Cache pour toutes les données non filtrées
    this.lastDataRefresh = 0; // Timestamp du dernier rafraîchissement
    this.cacheTimeout = 30000; // 30 secondes de cache

    // Nouveau: Gestion du stockage
    this.storageData = null;
    this.storageUpdateInterval = null;
    this.lastStorageUpdate = 0;
    this.storageUpdateTimeout = 60000; // 1 minute

    this.init();
  }

  init() {
    this.bindEvents();

    // Ne charger les archives que si nous sommes sur la page d'archives
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      this.loadArchives();
      this.setDefaultDates();

      // Nouveau: Initialiser le système de stockage
      this.initializeStorageMonitoring();
    }
  }

  // ===============================
  // SYSTÈME DE GESTION DU STOCKAGE
  // ===============================

  async initializeStorageMonitoring() {
    console.log("[STORAGE] 🚀 Initialisation du monitoring du stockage...");

    // Créer l'interface de stockage si elle n'existe pas
    this.createStorageInterface();

    // Charger les données initiales
    await this.updateStorageData();

    // Mettre à jour périodiquement
    this.storageUpdateInterval = setInterval(() => {
      this.updateStorageData();
    }, this.storageUpdateTimeout);

    console.log("[STORAGE] ✅ Monitoring du stockage initialisé");
  }

  createStorageInterface() {
    const container = document.querySelector(".container-fluid");
    if (!container) return;

    // Vérifier si l'interface existe déjà
    if (document.getElementById("storageMonitorContainer")) {
      return;
    }

    const storageHTML = `
      <div id="storageMonitorContainer" class="mb-4">
        <div class="card border-info">
          <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
              <i class="fas fa-database me-2"></i>
              Niveau de Stockage Plateforme
            </h6>
            <div class="d-flex align-items-center">
              <small id="storageLastUpdate" class="me-3 opacity-75">Chargement...</small>
              <button id="refreshStorageBtn" class="btn btn-sm btn-outline-light" title="Actualiser">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
          <div class="card-body p-3">
            <div id="storageLoadingSpinner" class="text-center py-3">
              <div class="spinner-border text-info" role="status">
                <span class="visually-hidden">Chargement des données de stockage...</span>
              </div>
            </div>
            <div id="storageContent" style="display: none;">
              <!-- Indicateur principal -->
              <div class="row mb-3">
                <div class="col-12">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">Utilisation Globale</h6>
                    <span id="storageMainStatus" class="badge badge-lg">
                      <i id="storageMainIcon" class="fas fa-check-circle me-1"></i>
                      <span id="storageMainText">Optimal</span>
                    </span>
                  </div>
                  <div class="progress mb-2" style="height: 25px;">
                    <div id="storageMainProgress" 
                         class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" 
                         style="width: 0%">
                      <span id="storageMainProgressText" class="fw-bold">0%</span>
                    </div>
                  </div>
                  <div class="d-flex justify-content-between small text-muted">
                    <span id="storageUsedText">0 MB utilisés</span>
                    <span id="storageLimitText">0 MB disponibles</span>
                  </div>
                </div>
              </div>
              
              <!-- Détails par catégorie -->
              <div class="row">
                <!-- Fichiers Uploads -->
                <div class="col-md-6 mb-3">
                  <div class="card border-secondary h-100">
                    <div class="card-header bg-light py-2">
                      <h6 class="mb-0">
                        <i class="fas fa-file-upload text-primary me-2"></i>
                        Fichiers Uploads
                      </h6>
                    </div>
                    <div class="card-body p-3">
                      <div class="progress mb-2" style="height: 20px;">
                        <div id="uploadsProgress" 
                             class="progress-bar" 
                             role="progressbar" 
                             style="width: 0%">
                          <span id="uploadsProgressText" class="small">0%</span>
                        </div>
                      </div>
                      <div class="d-flex justify-content-between small">
                        <span id="uploadsUsed">0 MB</span>
                        <span id="uploadsLimit">0 MB</span>
                      </div>
                      <div id="uploadsFileTypes" class="mt-2">
                        <!-- Types de fichiers injectés ici -->
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Base de Données -->
                <div class="col-md-6 mb-3">
                  <div class="card border-secondary h-100">
                    <div class="card-header bg-light py-2">
                      <h6 class="mb-0">
                        <i class="fas fa-database text-success me-2"></i>
                        Base de Données
                      </h6>
                    </div>
                    <div class="card-body p-3">
                      <div class="progress mb-2" style="height: 20px;">
                        <div id="databaseProgress" 
                             class="progress-bar bg-success" 
                             role="progressbar" 
                             style="width: 0%">
                          <span id="databaseProgressText" class="small">0%</span>
                        </div>
                      </div>
                      <div class="d-flex justify-content-between small">
                        <span id="databaseUsed">0 MB</span>
                        <span id="databaseLimit">0 MB</span>
                      </div>
                      <div id="archivesStats" class="mt-2">
                        <!-- Statistiques archives injectées ici -->
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Recommandations -->
              <div id="storageRecommendations" class="mt-3">
                <!-- Recommandations injectées ici -->
              </div>
              
              <!-- Actions rapides -->
              <div class="mt-3 text-center">
                <button id="cleanOldFilesBtn" class="btn btn-outline-warning btn-sm me-2">
                  <i class="fas fa-broom me-1"></i>
                  Nettoyer les anciens fichiers
                </button>
                <button id="optimizeStorageBtn" class="btn btn-outline-info btn-sm">
                  <i class="fas fa-magic me-1"></i>
                  Optimiser le stockage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insérer avant le premier élément de contenu
    const firstCard = container.querySelector(".card");
    if (firstCard) {
      firstCard.insertAdjacentHTML("beforebegin", storageHTML);
    } else {
      container.insertAdjacentHTML("afterbegin", storageHTML);
    }

    // Lier les événements
    this.bindStorageEvents();
  }

  bindStorageEvents() {
    // Bouton de rafraîchissement
    const refreshBtn = document.getElementById("refreshStorageBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.updateStorageData(true);
      });
    }

    // Bouton nettoyage
    const cleanBtn = document.getElementById("cleanOldFilesBtn");
    if (cleanBtn) {
      cleanBtn.addEventListener("click", () => {
        this.showCleanupDialog();
      });
    }

    // Bouton optimisation
    const optimizeBtn = document.getElementById("optimizeStorageBtn");
    if (optimizeBtn) {
      optimizeBtn.addEventListener("click", () => {
        this.showOptimizationDialog();
      });
    }
  }

  async updateStorageData(forceRefresh = false) {
    const now = Date.now();

    // Vérifier si on doit rafraîchir
    if (
      !forceRefresh &&
      this.storageData &&
      now - this.lastStorageUpdate < this.storageUpdateTimeout
    ) {
      return;
    }

    try {
      console.log("[STORAGE] 📊 Récupération des données de stockage...");

      // Afficher le spinner
      const spinner = document.getElementById("storageLoadingSpinner");
      const content = document.getElementById("storageContent");

      if (spinner && content) {
        spinner.style.display = "block";
        content.style.display = "none";
      }

      // Récupérer les données
      const response = await fetch("/api/storage/usage");
      const data = await response.json();

      if (data.success) {
        this.storageData = data.storage;
        this.lastStorageUpdate = now;

        // Mettre à jour l'interface
        this.renderStorageInterface();

        console.log("[STORAGE] ✅ Données de stockage mises à jour");
      } else {
        throw new Error(
          data.message || "Erreur lors de la récupération des données"
        );
      }
    } catch (error) {
      console.error("[STORAGE] ❌ Erreur:", error);
      this.showStorageError(error.message);
    } finally {
      // Masquer le spinner
      const spinner = document.getElementById("storageLoadingSpinner");
      const content = document.getElementById("storageContent");

      if (spinner && content) {
        spinner.style.display = "none";
        content.style.display = "block";
      }
    }
  }

  renderStorageInterface() {
    if (!this.storageData) return;

    const { total, uploads, database, performance, recommendations } =
      this.storageData;

    // Mise à jour de l'indicateur principal
    this.updateMainStorageIndicator(total);

    // Mise à jour des uploads
    this.updateUploadsSection(uploads);

    // Mise à jour de la base de données
    this.updateDatabaseSection(database);

    // Mise à jour des recommandations
    this.updateRecommendations(recommendations);

    // Mise à jour du timestamp
    this.updateLastUpdateTime(performance.lastUpdate);
  }

  updateMainStorageIndicator(total) {
    // Status badge
    const statusElement = document.getElementById("storageMainStatus");
    const iconElement = document.getElementById("storageMainIcon");
    const textElement = document.getElementById("storageMainText");

    if (statusElement && iconElement && textElement) {
      statusElement.className = `badge badge-lg bg-${this.getStatusColor(
        total.status
      )}`;
      iconElement.className = `fas ${total.statusIcon} me-1`;
      textElement.textContent = this.getStatusText(total.status);
    }

    // Progress bar
    const progressElement = document.getElementById("storageMainProgress");
    const progressTextElement = document.getElementById(
      "storageMainProgressText"
    );

    if (progressElement && progressTextElement) {
      progressElement.style.width = `${total.percentage}%`;
      progressElement.className = `progress-bar progress-bar-striped progress-bar-animated bg-${this.getStatusColor(
        total.status
      )}`;
      progressTextElement.textContent = `${total.percentage}%`;
    }

    // Textes d'utilisation
    const usedElement = document.getElementById("storageUsedText");
    const limitElement = document.getElementById("storageLimitText");

    if (usedElement && limitElement) {
      usedElement.textContent = this.formatBytes(total.used) + " utilisés";
      limitElement.textContent =
        this.formatBytes(total.available) + " disponibles";
    }
  }

  updateUploadsSection(uploads) {
    // Progress bar
    const progressElement = document.getElementById("uploadsProgress");
    const progressTextElement = document.getElementById("uploadsProgressText");

    if (progressElement && progressTextElement) {
      progressElement.style.width = `${uploads.percentage}%`;
      progressElement.className = `progress-bar bg-${this.getStatusColor(
        uploads.status
      )}`;
      progressTextElement.textContent = `${uploads.percentage}%`;
    }

    // Textes
    const usedElement = document.getElementById("uploadsUsed");
    const limitElement = document.getElementById("uploadsLimit");

    if (usedElement && limitElement) {
      usedElement.textContent = this.formatBytes(uploads.size);
      limitElement.textContent = this.formatBytes(uploads.limit);
    }

    // Types de fichiers
    this.updateFileTypesDisplay(uploads.fileTypes);
  }

  updateDatabaseSection(database) {
    // Progress bar
    const progressElement = document.getElementById("databaseProgress");
    const progressTextElement = document.getElementById("databaseProgressText");

    if (progressElement && progressTextElement) {
      progressElement.style.width = `${database.percentage}%`;
      progressElement.className = `progress-bar bg-${this.getStatusColor(
        database.status
      )}`;
      progressTextElement.textContent = `${database.percentage}%`;
    }

    // Textes
    const usedElement = document.getElementById("databaseUsed");
    const limitElement = document.getElementById("databaseLimit");

    if (usedElement && limitElement) {
      usedElement.textContent = this.formatBytes(database.size);
      limitElement.textContent = this.formatBytes(database.limit);
    }

    // Statistiques des archives
    this.updateArchivesStats(database.archives);
  }

  updateFileTypesDisplay(fileTypes) {
    const container = document.getElementById("uploadsFileTypes");
    if (!container || !fileTypes) return;

    const sortedTypes = Object.entries(fileTypes)
      .sort((a, b) => b[1].totalSize - a[1].totalSize)
      .slice(0, 3); // Top 3

    if (sortedTypes.length === 0) {
      container.innerHTML = '<small class="text-muted">Aucun fichier</small>';
      return;
    }

    container.innerHTML = sortedTypes
      .map(
        ([ext, data]) => `
      <div class="small d-flex justify-content-between">
        <span>${ext.toUpperCase()} (${data.count})</span>
        <span class="text-muted">${this.formatBytes(data.totalSize)}</span>
      </div>
    `
      )
      .join("");
  }

  updateArchivesStats(archives) {
    const container = document.getElementById("archivesStats");
    if (!container || !archives) return;

    const totalArchives = archives.totalArchives || 0;
    const totalSize = archives.totalDataSize || 0;

    container.innerHTML = `
      <div class="small d-flex justify-content-between">
        <span>Archives totales</span>
        <span class="text-muted">${totalArchives.toLocaleString()}</span>
      </div>
      <div class="small d-flex justify-content-between">
        <span>Données archives</span>
        <span class="text-muted">${this.formatBytes(totalSize)}</span>
      </div>
    `;
  }

  updateRecommendations(recommendations) {
    const container = document.getElementById("storageRecommendations");
    if (!container) return;

    if (!recommendations || recommendations.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = recommendations
      .map(
        (rec) => `
      <div class="alert alert-${
        rec.type === "critical" ? "danger" : "warning"
      } py-2 mb-2">
        <div class="d-flex align-items-start">
          <i class="fas fa-${
            rec.type === "critical" ? "exclamation-triangle" : "info-circle"
          } me-2 mt-1"></i>
          <div class="flex-grow-1">
            <strong>${rec.message}</strong>
            <br>
            <small>${rec.action}</small>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  updateLastUpdateTime(lastUpdate) {
    const element = document.getElementById("storageLastUpdate");
    if (!element) return;

    const date = new Date(lastUpdate);
    element.textContent = `Mis à jour: ${date.toLocaleTimeString("fr-FR")}`;
  }

  getStatusColor(status) {
    switch (status) {
      case "critical":
        return "danger";
      case "warning":
        return "warning";
      case "safe":
      default:
        return "success";
    }
  }

  getStatusText(status) {
    switch (status) {
      case "critical":
        return "Critique";
      case "warning":
        return "Attention";
      case "safe":
      default:
        return "Optimal";
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  showStorageError(message) {
    const content = document.getElementById("storageContent");
    if (content) {
      content.innerHTML = `
        <div class="alert alert-danger text-center">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Erreur lors du chargement des données de stockage
          <br>
          <small>${message}</small>
        </div>
      `;
    }
  }

  showCleanupDialog() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-warning text-dark">
            <h5 class="modal-title">
              <i class="fas fa-broom me-2"></i>
              Nettoyage des Anciens Fichiers
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <i class="fas fa-info-circle me-2"></i>
              Cette fonction supprime définitivement les fichiers uploadés qui sont plus anciens que la période spécifiée.
            </div>
            
            <div class="mb-3">
              <label for="cleanupDays" class="form-label">Supprimer les fichiers de plus de :</label>
              <select id="cleanupDays" class="form-select">
                <option value="7">7 jours</option>
                <option value="15">15 jours</option>
                <option value="30" selected>30 jours</option>
                <option value="60">60 jours</option>
                <option value="90">90 jours</option>
              </select>
            </div>
            
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="dryRunCheck" checked>
              <label class="form-check-label" for="dryRunCheck">
                Mode simulation (voir ce qui serait supprimé sans supprimer)
              </label>
            </div>
            
            <div id="cleanupResults" style="display: none;">
              <!-- Résultats injectés ici -->
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
            <button type="button" id="startCleanupBtn" class="btn btn-warning">
              <i class="fas fa-play me-1"></i>
              Démarrer l'analyse
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);

    // Gérer le bouton de nettoyage
    modal
      .querySelector("#startCleanupBtn")
      .addEventListener("click", async () => {
        const days = parseInt(modal.querySelector("#cleanupDays").value);
        const dryRun = modal.querySelector("#dryRunCheck").checked;

        await this.performCleanup(days, dryRun, modal);
      });

    // Nettoyer le modal à sa fermeture
    modal.addEventListener("hidden.bs.modal", () => {
      document.body.removeChild(modal);
    });

    modalInstance.show();
  }

  async performCleanup(days, dryRun, modal) {
    const btn = modal.querySelector("#startCleanupBtn");
    const resultsDiv = modal.querySelector("#cleanupResults");

    // Changer l'état du bouton
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>En cours...';

    try {
      console.log(
        `[CLEANUP] Début du ${
          dryRun ? "simulation" : "nettoyage"
        } pour ${days} jours`
      );

      const response = await fetch("/api/storage/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days, dryRun }),
      });

      const data = await response.json();

      if (data.success) {
        const cleanup = data.cleanup;

        resultsDiv.style.display = "block";
        resultsDiv.innerHTML = `
          <div class="alert alert-${dryRun ? "info" : "success"}">
            <h6><i class="fas fa-check-circle me-2"></i>${data.message}</h6>
            <div class="row">
              <div class="col-md-6">
                <strong>Fichiers scannés :</strong> ${cleanup.filesScanned.toLocaleString()}<br>
                <strong>Fichiers ${
                  dryRun ? "à supprimer" : "supprimés"
                } :</strong> ${cleanup.filesDeleted.toLocaleString()}<br>
                <strong>Espace ${
                  dryRun ? "à libérer" : "libéré"
                } :</strong> ${this.formatBytes(cleanup.spaceFreed)}
              </div>
              <div class="col-md-6">
                ${
                  cleanup.errors.length > 0
                    ? `
                  <strong class="text-warning">Erreurs :</strong> ${cleanup.errors.length}<br>
                `
                    : ""
                }
                ${
                  cleanup.deletedFiles.length > 0
                    ? `
                  <details class="mt-2">
                    <summary>Voir les fichiers concernés (${
                      cleanup.deletedFiles.length
                    })</summary>
                    <ul class="small mt-2">
                      ${cleanup.deletedFiles
                        .slice(0, 10)
                        .map(
                          (file) => `
                        <li>${file.name} (${this.formatBytes(file.size)})</li>
                      `
                        )
                        .join("")}
                      ${
                        cleanup.deletedFiles.length > 10
                          ? `<li>... et ${
                              cleanup.deletedFiles.length - 10
                            } autres</li>`
                          : ""
                      }
                    </ul>
                  </details>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        `;

        if (dryRun && cleanup.filesDeleted > 0) {
          btn.innerHTML =
            '<i class="fas fa-trash me-1"></i>Supprimer maintenant';
          btn.className = "btn btn-danger";
          btn.disabled = false;

          // Changer l'action du bouton pour un vrai nettoyage
          btn.onclick = async () => {
            modal.querySelector("#dryRunCheck").checked = false;
            await this.performCleanup(days, false, modal);
          };
        } else {
          btn.innerHTML = '<i class="fas fa-check me-1"></i>Terminé';

          // Actualiser les données de stockage
          await this.updateStorageData(true);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("[CLEANUP] Erreur:", error);
      resultsDiv.style.display = "block";
      resultsDiv.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Erreur lors du nettoyage : ${error.message}
        </div>
      `;

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-redo me-1"></i>Réessayer';
    }
  }

  showOptimizationDialog() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">
              <i class="fas fa-magic me-2"></i>
              Optimisation du Stockage
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <i class="fas fa-info-circle me-2"></i>
              Cette fonction optimise automatiquement le stockage en :
              <ul class="mb-0 mt-2">
                <li>Compactant la base de données</li>
                <li>Réduisant la taille des archives anciennes</li>
                <li>Supprimant les fichiers orphelins</li>
              </ul>
            </div>
            
            <div id="optimizationProgress" style="display: none;">
              <div class="progress mb-3">
                <div id="optimizationProgressBar" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
              </div>
              <div id="optimizationSteps"></div>
            </div>
            
            <div id="optimizationResults" style="display: none;">
              <!-- Résultats injectés ici -->
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
            <button type="button" id="startOptimizationBtn" class="btn btn-info">
              <i class="fas fa-magic me-1"></i>
              Démarrer l'optimisation
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);

    // Gérer le bouton d'optimisation
    modal
      .querySelector("#startOptimizationBtn")
      .addEventListener("click", async () => {
        await this.performOptimization(modal);
      });

    // Nettoyer le modal à sa fermeture
    modal.addEventListener("hidden.bs.modal", () => {
      document.body.removeChild(modal);
    });

    modalInstance.show();
  }

  async performOptimization(modal) {
    const btn = modal.querySelector("#startOptimizationBtn");
    const progressDiv = modal.querySelector("#optimizationProgress");
    const resultsDiv = modal.querySelector("#optimizationResults");
    const progressBar = modal.querySelector("#optimizationProgressBar");
    const stepsDiv = modal.querySelector("#optimizationSteps");

    // Changer l'état du bouton
    btn.disabled = true;
    btn.innerHTML =
      '<i class="fas fa-spinner fa-spin me-1"></i>Optimisation...';

    // Afficher la barre de progression
    progressDiv.style.display = "block";

    try {
      console.log("[OPTIMIZATION] Début de l'optimisation");

      // Simulation des étapes
      const steps = [
        "Analyse de la base de données...",
        "Compaction des archives...",
        "Nettoyage des fichiers orphelins...",
        "Finalisation...",
      ];

      let currentStep = 0;

      const updateProgress = (step, percentage) => {
        progressBar.style.width = `${percentage}%`;
        stepsDiv.innerHTML = `
          <small class="text-muted">
            Étape ${step}/${steps.length}: ${steps[step - 1]}
          </small>
        `;
      };

      // Démarrer l'optimisation
      updateProgress(1, 25);

      const response = await fetch("/api/storage/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      updateProgress(4, 100);

      const data = await response.json();

      if (data.success) {
        const optimization = data.optimization;

        progressDiv.style.display = "none";
        resultsDiv.style.display = "block";

        resultsDiv.innerHTML = `
          <div class="alert alert-success">
            <h6><i class="fas fa-check-circle me-2"></i>${data.message}</h6>
            <div class="row">
              <div class="col-md-6">
                <h6>Base de données :</h6>
                <span class="badge bg-${
                  optimization.databaseOptimization.status === "success"
                    ? "success"
                    : "danger"
                }">
                  ${
                    optimization.databaseOptimization.status === "success"
                      ? "Optimisée"
                      : "Erreur"
                  }
                </span>
                <small class="d-block text-muted">${
                  optimization.databaseOptimization.message
                }</small>
              </div>
              <div class="col-md-6">
                <h6>Archives :</h6>
                ${
                  optimization.archivesCompaction.status === "success"
                    ? `
                  <span class="badge bg-success">Compactées</span>
                  <small class="d-block text-muted">
                    ${
                      optimization.archivesCompaction.archivesProcessed
                    } archives traitées<br>
                    ${this.formatBytes(
                      optimization.archivesCompaction.spaceOptimized
                    )} économisés
                  </small>
                `
                    : `
                  <span class="badge bg-warning">Erreur</span>
                  <small class="d-block text-muted">${optimization.archivesCompaction.message}</small>
                `
                }
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <h6>Fichiers orphelins :</h6>
                ${
                  optimization.orphanedFilesCleanup.status === "success"
                    ? `
                  <span class="badge bg-success">Nettoyés</span>
                  <small class="d-block text-muted">
                    ${
                      optimization.orphanedFilesCleanup.filesDeleted
                    } fichiers supprimés, 
                    ${this.formatBytes(
                      optimization.orphanedFilesCleanup.spaceFreed
                    )} libérés
                  </small>
                `
                    : `
                  <span class="badge bg-warning">Erreur</span>
                  <small class="d-block text-muted">${optimization.orphanedFilesCleanup.message}</small>
                `
                }
              </div>
            </div>
            <hr>
            <small class="text-muted">
              Optimisation terminée en ${optimization.optimizationTime}ms
            </small>
          </div>
        `;

        btn.innerHTML = '<i class="fas fa-check me-1"></i>Terminé';

        // Actualiser les données de stockage
        await this.updateStorageData(true);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("[OPTIMIZATION] Erreur:", error);

      progressDiv.style.display = "none";
      resultsDiv.style.display = "block";
      resultsDiv.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Erreur lors de l'optimisation : ${error.message}
        </div>
      `;

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-redo me-1"></i>Réessayer';
    }
  }

  // Nettoyer les intervalles lors de la destruction
  destroy() {
    if (this.storageUpdateInterval) {
      clearInterval(this.storageUpdateInterval);
      this.storageUpdateInterval = null;
    }
  }

  // ===============================
  // MÉTHODES EXISTANTES (conservées)
  // ===============================

  bindEvents() {
    // Vérifier si nous sommes sur la page archives avant de lier les événements
    const searchBtn = document.getElementById("searchBtn");
    if (!searchBtn) {
      console.log(
        "[ARCHIVES] Interface d'archives non détectée, événements non liés"
      );
      return;
    }

    // Boutons de recherche et reset
    searchBtn.addEventListener("click", () => this.performSearch());

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetFilters());
    }

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.reload());
    }

    // Filtres en temps réel
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.debounceSearch());
    }

    const actionFilter = document.getElementById("actionFilter");
    if (actionFilter) {
      actionFilter.addEventListener("change", () => this.performSearch());
    }

    const roleFilter = document.getElementById("roleFilter");
    if (roleFilter) {
      roleFilter.addEventListener("change", () => this.performSearch());
    }

    const dateStart = document.getElementById("dateStart");
    if (dateStart) {
      dateStart.addEventListener("change", () => this.performSearch());
    }

    const dateEnd = document.getElementById("dateEnd");
    if (dateEnd) {
      dateEnd.addEventListener("change", () => this.performSearch());
    }

    // Pagination
    const itemsPerPage = document.getElementById("itemsPerPage");
    if (itemsPerPage) {
      itemsPerPage.addEventListener("change", (e) => {
        this.itemsPerPage = parseInt(e.target.value);
        this.currentPage = 1;
        this.renderCurrentView();
      });
    }

    // Onglets
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tab) => {
      tab.addEventListener("shown.bs.tab", (e) => {
        this.selectedTab = e.target.id.replace("-tab", "");
        this.currentPage = 1;

        // Si on change d'onglet, adapter les filtres en conséquence
        const actionFilter = document.getElementById("actionFilter");
        if (actionFilter && this.selectedTab !== "all") {
          // Mapper les onglets aux types d'action
          const tabToActionMap = {
            deleted: "suppression",
            delivered: "livraison",
            shipping: "mise_en_livraison",
            orders: "ordre_livraison_etabli",
          };

          if (tabToActionMap[this.selectedTab]) {
            // Mettre à jour le filtre et appliquer la recherche
            this.currentFilters.action_type = tabToActionMap[this.selectedTab];
            actionFilter.value = tabToActionMap[this.selectedTab];
            console.log(
              `[ARCHIVES] Onglet ${
                this.selectedTab
              } sélectionné, filtrage par: ${tabToActionMap[this.selectedTab]}`
            );
            this.performSearch(); // Recharger avec le nouveau filtre
          } else {
            console.log(
              `[ARCHIVES] Onglet ${this.selectedTab} non trouvé dans le mapping`
            );
            this.renderCurrentView();
          }
        } else if (actionFilter && this.selectedTab === "all") {
          // Si on revient à "all", vider le filtre action_type
          this.currentFilters.action_type = "";
          actionFilter.value = "";
          this.performSearch();
        } else {
          this.renderCurrentView();
        }
      });
    });

    // Raccourcis clavier
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.id === "searchInput") {
        this.performSearch();
      }
      if (e.key === "Escape") {
        this.resetFilters();
      }
    });
  }

  setDefaultDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // 3 mois par défaut

    document.getElementById("dateEnd").value = this.formatDateForInput(endDate);
    document.getElementById("dateStart").value =
      this.formatDateForInput(startDate);
  }

  formatDateForInput(date) {
    return date.toISOString().split("T")[0];
  }

  // Debounce pour la recherche en temps réel - 1
  debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.performSearch(), 300);
  }

  async performSearch() {
    this.showLoading(true);

    // Collecter les filtres
    this.currentFilters = {
      search: document.getElementById("searchInput").value.trim(),
      action_type: document.getElementById("actionFilter").value,
      role_source: document.getElementById("roleFilter").value,
      date_start: document.getElementById("dateStart").value,
      date_end: document.getElementById("dateEnd").value,
    };

    console.log("[ARCHIVES] Recherche avec filtres:", this.currentFilters);

    // Vérifier si au moins un filtre est défini
    const hasFilters = Object.values(this.currentFilters).some(
      (value) => value && value.trim() !== ""
    );
    console.log("[ARCHIVES] Des filtres sont-ils appliqués ?", hasFilters);

    this.currentPage = 1;
    await this.loadArchives();
  }

  resetFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("actionFilter").value = "";
    document.getElementById("roleFilter").value = "";

    this.setDefaultDates();

    this.currentFilters = {
      search: "",
      action_type: "",
      role_source: "",
      date_start: document.getElementById("dateStart").value,
      date_end: document.getElementById("dateEnd").value,
    };

    this.currentPage = 1;
    this.loadArchives();
  }

  // Méthode pour forcer le rechargement complet des données
  async reload() {
    console.log("[ARCHIVES] Rechargement forcé des données...");
    this.allArchivesData = null; // Vider le cache
    this.lastDataRefresh = 0; // Forcer le rafraîchissement
    this.currentPage = 1;
    await this.loadArchives();
  }

  async loadArchives() {
    try {
      this.showLoading(true);

      // Vérifier si nous devons rafraîchir les données (cache expiré ou pas de données)
      const now = Date.now();
      const shouldRefresh =
        !this.allArchivesData || now - this.lastDataRefresh > this.cacheTimeout;

      // Charger toutes les données pour les compteurs
      if (shouldRefresh) {
        console.log(
          "[ARCHIVES] Rafraîchissement des données (cache expiré ou inexistant)..."
        );
        const allDataResponse = await fetch("/api/archives?limit=10000"); // Récupérer toutes les données
        const allData = await allDataResponse.json();
        if (allData.success) {
          this.allArchivesData = allData.archives;
          this.lastDataRefresh = now;
          console.log(
            "[ARCHIVES] Données complètes rafraîchies:",
            this.allArchivesData.length,
            "archives"
          );
        }
      } else {
        console.log(
          "[ARCHIVES] Utilisation du cache existant (",
          this.allArchivesData.length,
          "archives )"
        );
      }

      // Ensuite charger les données filtrées
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.itemsPerPage,
        ...this.currentFilters,
      });

      console.log("[ARCHIVES] Chargement avec paramètres:", params.toString());

      const response = await fetch(`/api/archives?${params}`);
      const data = await response.json();

      console.log("[ARCHIVES] Réponse reçue:", {
        success: data.success,
        archivesCount: data.archives ? data.archives.length : 0,
        totalCount: data.pagination ? data.pagination.total : 0,
      });

      if (data.success) {
        this.filteredArchives = data.archives; // Données filtrées pour l'affichage
        this.allArchives = this.allArchivesData || []; // Données complètes pour les compteurs
        this.pagination = data.pagination;

        // Mettre à jour les compteurs avec les données complètes
        this.updateCounts();

        // Afficher les résultats filtrés
        this.renderCurrentView();
        this.renderPagination();

        // Nouveau: Mettre à jour les données de stockage après chargement des archives
        await this.updateStorageData();

        console.log(
          "[ARCHIVES] Rendu terminé - Archives filtrées:",
          this.filteredArchives.length
        );
      } else {
        console.error("[ARCHIVES] Erreur serveur:", data.message);
        this.showNotification(
          data.message || "Erreur lors du chargement des archives",
          "error"
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des archives:", error);
      this.showNotification("Erreur de connexion", "error");
    } finally {
      this.showLoading(false);
    }
  }

  updateCounts() {
    const counts = {
      all: this.allArchives.length,
      suppression: this.allArchives.filter(
        (a) => a.action_type === "suppression"
      ).length,
      livraison: this.allArchives.filter((a) => a.action_type === "livraison")
        .length,
      mise_en_livraison: this.allArchives.filter(
        (a) => a.action_type === "mise_en_livraison"
      ).length,
      ordre_livraison_etabli: this.allArchives.filter(
        (a) => a.action_type === "ordre_livraison_etabli"
      ).length,
    };

    console.log("[ARCHIVES] Compteurs mis à jour:", counts);

    document.getElementById("allCount").textContent = counts.all;
    document.getElementById("deletedCount").textContent = counts.suppression;
    document.getElementById("deliveredCount").textContent = counts.livraison;
    document.getElementById("shippingCount").textContent =
      counts.mise_en_livraison;
    document.getElementById("ordersCount").textContent =
      counts.ordre_livraison_etabli;
  }

  renderCurrentView() {
    let archivesToRender = this.filteredArchives;

    // Si des filtres sont appliqués côté serveur, utiliser directement les données filtrées
    const hasServerFilters =
      this.currentFilters.search ||
      this.currentFilters.action_type ||
      this.currentFilters.role_source ||
      this.currentFilters.date_start ||
      this.currentFilters.date_end;

    console.log(
      "[ARCHIVES] Rendu - Onglet:",
      this.selectedTab,
      "| Filtres serveur:",
      hasServerFilters,
      "| Données filtrées:",
      this.filteredArchives.length
    );

    // Si aucun filtre serveur n'est appliqué, filtrer selon l'onglet actif
    if (!hasServerFilters) {
      switch (this.selectedTab) {
        case "deleted":
          archivesToRender = this.filteredArchives.filter(
            (a) => a.action_type === "suppression"
          );
          break;
        case "delivered":
          archivesToRender = this.filteredArchives.filter(
            (a) => a.action_type === "livraison"
          );
          break;
        case "shipping":
          archivesToRender = this.filteredArchives.filter(
            (a) => a.action_type === "mise_en_livraison"
          );
          break;
        case "orders":
          archivesToRender = this.filteredArchives.filter(
            (a) => a.action_type === "ordre_livraison_etabli"
          );
          break;
        default:
          // Pour "all", garder toutes les données filtrées
          archivesToRender = this.filteredArchives;
          break;
      }
    }

    console.log("[ARCHIVES] Archives à rendre:", archivesToRender.length);
    this.renderTable(archivesToRender);
    this.updatePaginationInfo();
  }

  renderTable(archives) {
    const containerId = this.getTableContainerId();
    const container = document.getElementById(containerId);

    console.log("[ARCHIVES] renderTable appelé avec:", {
      containerId,
      archivesLength: archives.length,
      selectedTab: this.selectedTab,
      currentFilters: this.currentFilters,
    });

    if (archives.length === 0) {
      console.log(
        "[ARCHIVES] Aucune archive à afficher - rendu de l'état vide"
      );
      container.innerHTML = this.renderEmptyState();
      return;
    }

    console.log("[ARCHIVES] Rendu de", archives.length, "archives");

    const table = `
            <div class="table-container">
                <table class="table table-hover archives-table">
                    <thead>
                        <tr>
                            <th class="col-id">ID</th>
                            <th class="col-reference">Référence</th>
                            <th class="col-action">Action</th>
                            <th class="d-none d-md-table-cell">Client</th>
                            <th class="col-role d-none d-lg-table-cell">Rôle/Source</th>
                            <th class="col-date">Date d'archive</th>
                            <th class="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${archives
                          .map((archive) => this.renderTableRow(archive))
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;

    container.innerHTML = table;
    this.addTableEventListeners();
  }

  renderTableRow(archive) {
    const isRecent = this.isRecentArchive(archive.archived_at);
    const rowClass = isRecent ? "recent-archive" : "";

    return `
            <tr class="${rowClass}">
                <td class="col-id">
                    <small class="text-muted">#${archive.id}</small>
                </td>
                <td class="col-reference">
                    <strong>${archive.dossier_reference || "N/A"}</strong>
                    ${
                      archive.intitule
                        ? `<br><small class="text-muted">${this.truncateText(
                            archive.intitule,
                            30
                          )}</small>`
                        : ""
                    }
                </td>
                <td class="col-action">
                    ${this.renderActionBadge(archive.action_type)}
                </td>
                <td class="d-none d-md-table-cell">
                    ${
                      archive.client_name ||
                      (archive.dossier_data &&
                        archive.dossier_data.client_name) ||
                      "N/A"
                    }
                </td>
                <td class="col-role d-none d-lg-table-cell">
                    <span class="badge badge-role">${archive.role_source}</span>
                    <br><small class="text-muted">${this.getPageName(
                      archive.page_origine
                    )}</small>
                </td>
                <td class="col-date">
                    ${this.formatDate(archive.archived_at)}
                    <br><small class="text-muted">${this.getTimeAgo(
                      archive.archived_at
                    )}</small>
                    ${this.renderDeliveryStatus(archive)}
                </td>
                <td class="col-actions">
                    ${this.renderActionButtons(archive)}
                </td>
            </tr>
        `;
  }

  renderActionBadge(actionType) {
    const badges = {
      suppression:
        '<span class="badge badge-suppression"><i class="fas fa-trash me-1"></i>Supprimé</span>',
      livraison:
        '<span class="badge badge-livraison"><i class="fas fa-check-circle me-1"></i>Livré</span>',
      mise_en_livraison:
        '<span class="badge badge-mise_en_livraison"><i class="fas fa-truck-loading me-1"></i>Mis en livraison</span>',
      ordre_livraison_etabli:
        '<span class="badge badge-ordre-livraison"><i class="fas fa-file-alt me-1"></i>Ordre établi</span>',
    };
    return (
      badges[actionType] ||
      `<span class="badge bg-secondary">${actionType}</span>`
    );
  }

  // Afficher le statut de livraison pour les dossiers mis en livraison
  renderDeliveryStatus(archive) {
    if (archive.action_type === "mise_en_livraison") {
      const deliveredArchive = this.findCorrespondingDeliveredArchive(archive);
      if (deliveredArchive) {
        return `<br><small class="text-success"><i class="fas fa-check-circle me-1"></i>était mis en livraison - ${this.formatDate(
          deliveredArchive.archived_at
        )}</small>`;
      }
    }
    return "";
  }

  // Trouver l'archive correspondante qui a été livrée
  findCorrespondingDeliveredArchive(miseEnLivraisonArchive) {
    if (!this.allArchives || !miseEnLivraisonArchive.dossier_reference) {
      return null;
    }

    // Chercher un dossier avec la même référence mais avec action_type "livraison"
    return this.allArchives.find(
      (archive) =>
        archive.dossier_reference ===
          miseEnLivraisonArchive.dossier_reference &&
        archive.action_type === "livraison" &&
        archive.id !== miseEnLivraisonArchive.id
    );
  }

  renderActionButtons(archive) {
    const canRestore =
      archive.is_restorable &&
      archive.dossier_data &&
      archive.action_type === "suppression"; // Seuls les dossiers supprimés peuvent être restaurés

    let restoreTooltip = "Dossier non restaurable";
    if (archive.action_type === "livraison") {
      restoreTooltip = "Les dossiers livrés ne peuvent pas être restaurés";
    } else if (archive.action_type === "mise_en_livraison") {
      restoreTooltip =
        "Les dossiers mis en livraison ne peuvent pas être restaurés";
    } else if (archive.action_type === "suppression" && canRestore) {
      restoreTooltip = "Restaurer le dossier dans l'interface employé";
    } else if (archive.action_type === "suppression") {
      restoreTooltip = "Données insuffisantes pour la restauration";
    }

    return `
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-outline-info btn-details" 
                        data-archive-id="${
                          archive.id
                        }" title="Voir les détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-restore ${
                  !canRestore ? "disabled" : ""
                }" 
                        data-archive-id="${archive.id}" 
                        title="${restoreTooltip}"
                        ${!canRestore ? "disabled" : ""}>
                    <i class="fas fa-undo"></i>
                </button>
                <button type="button" class="btn btn-delete-permanent" 
                        data-archive-id="${
                          archive.id
                        }" title="Supprimer définitivement">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
  }

  addTableEventListeners() {
    // Boutons de détails
    document.querySelectorAll(".btn-details").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const archiveId = e.currentTarget.dataset.archiveId;
        this.showDetails(archiveId);
      });
    });

    // Boutons de restauration
    document.querySelectorAll(".btn-restore:not(.disabled)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const archiveId = e.currentTarget.dataset.archiveId;
        this.confirmRestore(archiveId);
      });
    });

    // Boutons de suppression définitive
    document.querySelectorAll(".btn-delete-permanent").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const archiveId = e.currentTarget.dataset.archiveId;
        this.confirmDelete(archiveId);
      });
    });
  }

  showDetails(archiveId) {
    const archive = this.allArchives.find((a) => a.id == archiveId);
    if (!archive) return;

    console.log("[DEBUG] showDetails - Archive complète:", archive);
    console.log("[DEBUG] showDetails - dossier_data:", archive.dossier_data);

    const modalBody = document.getElementById("detailsModalBody");
    modalBody.innerHTML = this.renderDetailsContent(archive);

    const modal = new bootstrap.Modal(document.getElementById("detailsModal"));
    modal.show();
  }

  renderDetailsContent(archive) {
    console.log("Archive complète reçue:", archive);
    const dossierData = archive.dossier_data || {};
    console.log("Données du dossier:", dossierData);

    // Logique améliorée pour récupérer le nom du client
    const clientName =
      dossierData.client_name ||
      archive.client_name ||
      (archive.dossier_data && archive.dossier_data.client_name) ||
      "Non spécifié";

    return `
            <div class="row">
                <!-- Colonne gauche -->
                <div class="col-md-6">
                    <div class="detail-section-compact">
                        <h6 class="mb-3"><i class="fas fa-info-circle me-2"></i>Informations générales</h6>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label-compact">ID:</span>
                                <span class="detail-value-compact">#${
                                  archive.id
                                }</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Référence:</span>
                                <span class="detail-value-compact">${
                                  archive.dossier_reference || "N/A"
                                }</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Action:</span>
                                <span class="detail-value-compact">${this.renderActionBadge(
                                  archive.action_type
                                )}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Client:</span>
                                <span class="detail-value-compact">${clientName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Intitulé:</span>
                                <span class="detail-value-compact">${
                                  dossierData.container_type_and_content ||
                                  archive.intitule ||
                                  "N/A"
                                }</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section-compact">
                        <h6 class="mb-3"><i class="fas fa-database me-2"></i>Données du dossier</h6>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label-compact">Employé:</span>
                                <span class="detail-value-compact">${
                                  dossierData.employee_name ||
                                  archive.employee_name ||
                                  "N/A"
                                }</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Client (données):</span>
                                <span class="detail-value-compact">${clientName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Conteneur:</span>
                                <span class="detail-value-compact">${
                                  this.formatContainerNumbers(dossierData) ||
                                  archive.container_numbers ||
                                  "N/A"
                                }</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Type/Contenu:</span>
                                <span class="detail-value-compact">${
                                  dossierData.container_type_and_content ||
                                  dossierData.container_content ||
                                  archive.container_type ||
                                  "N/A"
                                }</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Transporteur:</span>
                                <span class="detail-value-compact">${
                                  dossierData.transporter ||
                                  archive.transporter ||
                                  "N/A"
                                }</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Lieu:</span>
                                <span class="detail-value-compact">${
                                  dossierData.lieu || archive.lieu || "N/A"
                                }</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Statut:</span>
                                <span class="detail-value-compact">
                                    <span class="badge badge-status">${
                                      dossierData.status ||
                                      dossierData.delivery_status_acconier ||
                                      archive.status ||
                                      "N/A"
                                    }</span>
                                </span>
                            </div>
                            ${
                              dossierData.delivery_date || archive.delivery_date
                                ? `
                            <div class="detail-item">
                                <span class="detail-label-compact">Livraison:</span>
                                <span class="detail-value-compact">${
                                  dossierData.delivery_date ||
                                  archive.delivery_date
                                } ${
                                    dossierData.delivery_time ||
                                    archive.delivery_time ||
                                    ""
                                  }</span>
                            </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                </div>

                <!-- Colonne droite -->
                <div class="col-md-6">
                    <div class="detail-section-compact">
                        <h6 class="mb-3"><i class="fas fa-user me-2"></i>Source et archivage</h6>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label-compact">Source:</span>
                                <span class="detail-value-compact">${
                                  archive.role_source
                                }</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Page:</span>
                                <span class="detail-value-compact">${this.getPageName(
                                  archive.page_origine
                                )}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Date:</span>
                                <span class="detail-value-compact">${this.formatDate(
                                  archive.archived_at
                                )}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Délai:</span>
                                <span class="detail-value-compact">${this.getTimeAgo(
                                  archive.archived_at
                                )}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section-compact">
                        <h6 class="mb-3"><i class="fas fa-cogs me-2"></i>État de restauration</h6>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label-compact">Restaurable:</span>
                                <span class="detail-value-compact">
                                    ${
                                      archive.is_restorable
                                        ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Oui</span>'
                                        : '<span class="badge bg-danger"><i class="fas fa-times me-1"></i>Non</span>'
                                    }
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label-compact">Données:</span>
                                <span class="detail-value-compact">
                                    ${
                                      archive.dossier_data
                                        ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Complètes</span>'
                                        : '<span class="badge bg-warning"><i class="fas fa-exclamation-triangle me-1"></i>Partielles</span>'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  confirmRestore(archiveId) {
    const archive = this.allArchives.find((a) => a.id == archiveId);
    if (!archive) return;

    this.showConfirmModal(
      "Confirmer la restauration",
      `Êtes-vous sûr de vouloir restaurer le dossier <strong>${
        archive.dossier_reference || archive.id
      }</strong> ?<br><br>
            <small class="text-muted">Le dossier sera remis dans son interface d'origine et ne pourra plus être restauré à nouveau.</small>`,
      "Restaurer",
      "btn-success",
      () => this.restoreArchive(archiveId)
    );
  }

  confirmDelete(archiveId) {
    const archive = this.allArchives.find((a) => a.id == archiveId);
    if (!archive) return;

    this.showConfirmModal(
      "Supprimer définitivement",
      `<div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Attention !</strong> Cette action est irréversible.
            </div>
            Êtes-vous sûr de vouloir supprimer définitivement l'archive <strong>${
              archive.dossier_reference || archive.id
            }</strong> ?<br><br>
            <small class="text-muted">Toutes les données seront perdues définitivement.</small>`,
      "Supprimer définitivement",
      "btn-danger",
      () => this.deleteArchive(archiveId)
    );
  }

  showConfirmModal(title, content, actionText, actionClass, callback) {
    document.getElementById("confirmModalLabel").textContent = title;
    document.getElementById("confirmModalBody").innerHTML = content;

    const actionBtn = document.getElementById("confirmAction");
    actionBtn.textContent = actionText;
    actionBtn.className = `btn ${actionClass}`;

    // Supprimer les anciens event listeners
    actionBtn.replaceWith(actionBtn.cloneNode(true));
    const newActionBtn = document.getElementById("confirmAction");

    newActionBtn.addEventListener("click", () => {
      bootstrap.Modal.getInstance(
        document.getElementById("confirmModal")
      ).hide();
      callback();
    });

    const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
    modal.show();
  }

  async restoreArchive(archiveId) {
    try {
      console.log("🔄 Tentative de restauration pour l'archive ID:", archiveId);
      this.showLoading(true);

      const requestData = {
        restored_by: this.getCurrentUser(),
        restored_by_email: this.getCurrentUserEmail(),
      };

      console.log("📤 Données envoyées au serveur:", requestData);

      const response = await fetch(`/api/archives/${archiveId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("📥 Réponse du serveur - Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur HTTP:", response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("📊 Données de réponse:", data);

      if (data.success) {
        this.showNotification("✅ Dossier restauré avec succès", "success");
        console.log("✅ Archive restaurée, rechargement de la liste...");
        await this.loadArchives(); // Recharger la liste

        // Fermer le modal si ouvert
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("detailsModal")
        );
        if (modal) {
          modal.hide();
        }
      } else {
        console.error("❌ Échec de la restauration:", data.message);
        this.showNotification(
          `❌ ${data.message || "Erreur lors de la restauration"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("🚨 Erreur lors de la restauration:", error);
      this.showNotification(
        `🚨 Erreur de connexion: ${error.message}`,
        "error"
      );
    } finally {
      this.showLoading(false);
    }
  }

  async deleteArchive(archiveId) {
    try {
      this.showLoading(true);

      const response = await fetch(`/api/archives/${archiveId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification("Archive supprimée définitivement", "success");
        await this.loadArchives(); // Recharger la liste
      } else {
        this.showNotification(
          data.message || "Erreur lors de la suppression",
          "error"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      this.showNotification("Erreur de connexion", "error");
    } finally {
      this.showLoading(false);
    }
  }

  renderPagination() {
    const nav = document.getElementById("paginationNav");
    if (!this.pagination || this.pagination.totalPages <= 1) {
      nav.innerHTML = "";
      return;
    }

    const { currentPage, totalPages } = this.pagination;
    let pages = [];

    // Logique de pagination intelligente
    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 4) {
        pages = [1, 2, 3, 4, 5, "...", totalPages];
      } else if (currentPage >= totalPages - 3) {
        pages = [
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      } else {
        pages = [
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        ];
      }
    }

    nav.innerHTML = `
            <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
            ${pages
              .map((page) => {
                if (page === "...") {
                  return '<li class="page-item disabled"><span class="page-link">...</span></li>';
                }
                return `
                    <li class="page-item ${
                      page === currentPage ? "active" : ""
                    }">
                        <a class="page-link" href="#" data-page="${page}">${page}</a>
                    </li>
                `;
              })
              .join("")}
            <li class="page-item ${
              currentPage === totalPages ? "disabled" : ""
            }">
                <a class="page-link" href="#" data-page="${currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

    // Event listeners pour la pagination
    nav.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = parseInt(e.target.closest(".page-link").dataset.page);
        if (
          page &&
          page !== this.currentPage &&
          page >= 1 &&
          page <= totalPages
        ) {
          this.currentPage = page;
          this.loadArchives();
        }
      });
    });
  }

  updatePaginationInfo() {
    const info = document.getElementById("paginationInfo");
    if (!this.pagination) {
      info.textContent = "Aucun élément";
      return;
    }

    const { currentPage, itemsPerPage, totalItems } = this.pagination;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    info.textContent = `Affichage de ${startItem} à ${endItem} sur ${totalItems} éléments`;
  }

  renderEmptyState() {
    const messages = {
      all: "Aucune archive trouvée",
      deleted: "Aucun dossier supprimé",
      delivered: "Aucun dossier livré archivé",
      shipping: "Aucun dossier mis en livraison archivé",
    };

    return `
            <div class="empty-state">
                <i class="fas fa-archive"></i>
                <h5>${messages[this.selectedTab]}</h5>
                <p class="text-muted">Modifiez vos critères de recherche ou la période sélectionnée.</p>
            </div>
        `;
  }

  getTableContainerId() {
    const mapping = {
      all: "allArchivesTable",
      deleted: "deletedArchivesTable",
      delivered: "deliveredArchivesTable",
      shipping: "shippingArchivesTable",
      orders: "ordersArchivesTable",
    };
    return mapping[this.selectedTab] || "allArchivesTable";
  }

  // Fonction pour formater l'affichage des numéros de conteneurs
  formatContainerNumbers(dossierData) {
    try {
      console.log(
        "[DEBUG] formatContainerNumbers - Données complètes reçues:",
        dossierData
      );

      let containers = [];

      // Méthode 1: Vérifier container_numbers_list (format tableau)
      if (
        dossierData.container_numbers_list &&
        Array.isArray(dossierData.container_numbers_list)
      ) {
        containers = dossierData.container_numbers_list.filter(
          (c) => c && c.toString().trim()
        );
        console.log("[DEBUG] Méthode 1 - Array containers:", containers);
      }

      // Méthode 2: Vérifier container_numbers_list (format string JSON)
      if (
        containers.length === 0 &&
        dossierData.container_numbers_list &&
        typeof dossierData.container_numbers_list === "string"
      ) {
        try {
          const parsed = JSON.parse(dossierData.container_numbers_list);
          if (Array.isArray(parsed)) {
            containers = parsed.filter((c) => c && c.toString().trim());
            console.log("[DEBUG] Méthode 2 - JSON containers:", containers);
          }
        } catch (e) {
          console.warn("Erreur parsing container_numbers_list:", e);
        }
      }

      // Méthode 3: Analyser container_number pour détecter plusieurs conteneurs
      if (containers.length === 0 && dossierData.container_number) {
        const containerStr = dossierData.container_number.toString().trim();

        // Essayer différents séparateurs
        const separators = [",", ";", "|", "\n", "\r\n", "\r", "\t"];
        for (const sep of separators) {
          if (containerStr.includes(sep)) {
            containers = containerStr
              .split(sep)
              .map((c) => c.trim())
              .filter((c) => c.length > 0);
            console.log(`[DEBUG] Méthode 3 - Séparateur '${sep}':`, containers);
            break;
          }
        }

        // Si pas de séparateurs trouvés, utiliser comme un seul conteneur
        if (containers.length === 0) {
          containers = [containerStr];
        }
      }

      // Méthode 4: Utiliser container_statuses pour extraire les conteneurs
      if (containers.length <= 1 && dossierData.container_statuses) {
        try {
          let statuses = dossierData.container_statuses;
          if (typeof statuses === "string") {
            statuses = JSON.parse(statuses);
          }

          if (typeof statuses === "object" && statuses !== null) {
            const statusContainers = Object.keys(statuses).filter(
              (key) => key && key.trim()
            );
            if (statusContainers.length > containers.length) {
              containers = statusContainers;
              console.log(
                "[DEBUG] Méthode 4 - Container statuses:",
                containers
              );
            }
          }
        } catch (e) {
          console.warn("Erreur parsing container_statuses:", e);
        }
      }

      // Méthode 5: Si on détecte qu'il y a plusieurs conteneurs mais qu'on n'a pas tous les numéros
      if (
        containers.length <= 1 &&
        this.shouldHaveMultipleContainers(dossierData)
      ) {
        return this.createContainerDropdown(
          dossierData,
          containers[0] || dossierData.container_number
        );
      }

      // Formatage final
      if (containers.length === 0) {
        console.log("[DEBUG] Aucun conteneur trouvé, retour N/A");
        return "N/A";
      } else if (containers.length === 1) {
        console.log("[DEBUG] Un seul conteneur:", containers[0]);
        return containers[0];
      } else {
        console.log("[DEBUG] Plusieurs conteneurs trouvés:", containers);
        return this.createContainerDropdown(dossierData, null, containers);
      }
    } catch (error) {
      console.error("Erreur formatContainerNumbers:", error);
      return dossierData.container_number || "N/A";
    }
  }

  // Fonction pour détecter si un dossier devrait avoir plusieurs conteneurs
  shouldHaveMultipleContainers(dossierData) {
    // Vérifier number_of_containers
    if (
      dossierData.number_of_containers &&
      parseInt(dossierData.number_of_containers) > 1
    ) {
      return true;
    }

    // Vérifier container_type_and_content pour détecter plusieurs conteneurs
    if (dossierData.container_type_and_content) {
      const typeContent = dossierData.container_type_and_content.toString();
      const sizes = typeContent
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (sizes.length > 1) {
        return true;
      }
    }

    return false;
  }

  // Fonction pour créer un menu déroulant avec les conteneurs
  createContainerDropdown(
    dossierData,
    firstContainer = null,
    allContainers = null
  ) {
    const dossierId = dossierData.id;
    const dropdownId = `containerDropdown_${dossierId}`;

    if (allContainers && allContainers.length > 1) {
      // Cas où on a tous les conteneurs
      return `
        <div class="dropdown">
          <button class="btn btn-sm btn-outline-info dropdown-toggle" type="button" id="${dropdownId}" data-bs-toggle="dropdown">
            ${allContainers.length} conteneurs
          </button>
          <ul class="dropdown-menu">
            ${allContainers
              .map(
                (container, index) =>
                  `<li><a class="dropdown-item" href="#">📦 ${container}</a></li>`
              )
              .join("")}
          </ul>
        </div>
      `;
    } else {
      // Cas où on doit récupérer les conteneurs depuis la BD
      const containerCount = this.getEstimatedContainerCount(dossierData);
      return `
        <div class="dropdown">
          <button class="btn btn-sm btn-outline-warning dropdown-toggle" type="button" id="${dropdownId}" data-bs-toggle="dropdown" onclick="archivesManager.loadContainerDetails('${dossierId}', '${dropdownId}')">
            ${containerCount} conteneur${
        containerCount > 1 ? "s" : ""
      } <small>(cliquer pour voir)</small>
          </button>
          <ul class="dropdown-menu" id="${dropdownId}_menu">
            <li><a class="dropdown-item" href="#"><i class="fas fa-spinner fa-spin"></i> Chargement...</a></li>
          </ul>
        </div>
      `;
    }
  }

  // Fonction pour estimer le nombre de conteneurs
  getEstimatedContainerCount(dossierData) {
    if (
      dossierData.number_of_containers &&
      parseInt(dossierData.number_of_containers) > 1
    ) {
      return parseInt(dossierData.number_of_containers);
    }

    if (dossierData.container_type_and_content) {
      const typeContent = dossierData.container_type_and_content.toString();
      const sizes = typeContent
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return sizes.length;
    }

    return 2; // Par défaut, supposer 2 conteneurs
  }

  // Fonction pour charger les détails des conteneurs depuis la BD
  async loadContainerDetails(dossierId, dropdownId) {
    try {
      console.log("[DEBUG] Chargement des détails pour dossier:", dossierId);

      const response = await fetch(
        `/api/archives/container-details/${dossierId}`
      );
      const data = await response.json();

      const menuElement = document.getElementById(`${dropdownId}_menu`);

      if (data.success && data.containers && data.containers.length > 0) {
        menuElement.innerHTML = data.containers
          .map(
            (container) =>
              `<li><a class="dropdown-item" href="#">📦 ${container}</a></li>`
          )
          .join("");
      } else {
        menuElement.innerHTML =
          '<li><a class="dropdown-item" href="#">❌ Aucun détail disponible</a></li>';
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      const menuElement = document.getElementById(`${dropdownId}_menu`);
      if (menuElement) {
        menuElement.innerHTML =
          '<li><a class="dropdown-item" href="#">❌ Erreur de chargement</a></li>';
      }
    }
  }

  getPageName(url) {
    const pageNames = {
      "resp_liv.html": "Responsable Livraison",
      "resp_acconier.html": "Responsable Acconier",
      "interfaceFormulaireEmployer.html": "Agent Acconier",
    };

    for (const [page, name] of Object.entries(pageNames)) {
      if (url.includes(page)) return name;
    }

    // Pour les ordres établis, ne pas afficher "Interface inconnue"
    return "";
  }

  isRecentArchive(dateStr) {
    const archiveDate = new Date(dateStr);
    const now = new Date();
    const diffHours = (now - archiveDate) / (1000 * 60 * 60);
    return diffHours < 24; // Considéré récent si < 24h
  }

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  getTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Il y a moins d'1h";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 30)
      return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `Il y a ${diffMonths} mois`;

    const diffYears = Math.floor(diffMonths / 12);
    return `Il y a ${diffYears} an${diffYears > 1 ? "s" : ""}`;
  }

  truncateText(text, length) {
    return text && text.length > length
      ? text.substring(0, length) + "..."
      : text;
  }

  showLoading(show) {
    const spinner = document.getElementById("loadingSpinner");
    spinner.style.display = show ? "block" : "none";
  }

  showNotification(message, type = "info") {
    const toast = document.getElementById("notificationToast");
    const title = document.getElementById("toastTitle");
    const body = document.getElementById("toastBody");

    const types = {
      success: { title: "Succès", class: "text-success" },
      error: { title: "Erreur", class: "text-danger" },
      warning: { title: "Attention", class: "text-warning" },
      info: { title: "Information", class: "text-info" },
    };

    const config = types[type] || types.info;
    title.textContent = config.title;
    title.className = `me-auto ${config.class}`;
    body.textContent = message;

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  }

  getCurrentUser() {
    // Priorité 1: Acconier connecté
    const acconierUser = localStorage.getItem("acconier_user");
    if (acconierUser) {
      try {
        const userData = JSON.parse(acconierUser);
        if (userData.nom) {
          return userData.nom;
        }
      } catch (e) {
        console.warn("Erreur parsing acconier_user:", e);
      }
    }

    // Priorité 2: Utilisateur connecté via auth standard
    const userName = localStorage.getItem("userName");
    if (userName && userName.trim() !== "") {
      return userName;
    }

    // Priorité 3: Utilisateur courant (ancien système)
    const currentUser = localStorage.getItem("currentUser");
    if (
      currentUser &&
      currentUser.trim() !== "" &&
      currentUser !== "Administrateur"
    ) {
      return currentUser;
    }

    // Fallback: Utilisateur par défaut uniquement si aucune info trouvée
    return "Administrateur";
  }

  getCurrentUserEmail() {
    // Priorité 1: Acconier connecté
    const acconierUser = localStorage.getItem("acconier_user");
    if (acconierUser) {
      try {
        const userData = JSON.parse(acconierUser);
        if (userData.email) {
          return userData.email;
        }
      } catch (e) {
        console.warn("Erreur parsing acconier_user:", e);
      }
    }

    // Priorité 2: Utilisateur connecté via auth standard
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail && userEmail.trim() !== "") {
      return userEmail;
    }

    // Priorité 3: Utilisateur courant (ancien système)
    const currentUserEmail = localStorage.getItem("currentUserEmail");
    if (
      currentUserEmail &&
      currentUserEmail.trim() !== "" &&
      currentUserEmail !== "admin@its-service.com"
    ) {
      return currentUserEmail;
    }

    // Fallback: Email par défaut uniquement si aucune info trouvée
    return "admin@its-service.com";
  }

  // Méthode pour rafraîchir les données complètes (cache)
  async refreshAllData() {
    try {
      const allDataResponse = await fetch("/api/archives?limit=1000");
      const allData = await allDataResponse.json();
      if (allData.success) {
        this.allArchivesData = allData.archives;
        this.allArchives = this.allArchivesData;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
      return false;
    }
  }

  // Méthode publique pour recharger complètement les archives
  async reload() {
    console.log("[ARCHIVES] Rechargement complet des archives...");
    this.allArchivesData = null; // Vider le cache
    this.filteredArchives = []; // Vider les données filtrées
    this.currentPage = 1; // Remettre à la première page
    await this.loadArchives();
  }
}

// Fonction utilitaire pour archiver un dossier (appelée depuis les autres interfaces)
window.archiveDossier = async function (
  dossierData,
  actionType,
  roleSource,
  pageOrigine
) {
  try {
    // Récupérer les informations utilisateur correctes (vraies, pas génériques)
    let userName = "Utilisateur";
    let userEmail = "";

    // Priorité 1: Acconier connecté (interface employeur - le plus courant)
    const acconierUser = localStorage.getItem("acconier_user");
    if (acconierUser) {
      try {
        const userData = JSON.parse(acconierUser);
        userName = userData.nom || "Utilisateur";
        userEmail = userData.email || "";
        console.log(
          "[ARCHIVE] Utilisateur trouvé via acconier_user:",
          userName,
          userEmail
        );
      } catch (e) {
        console.warn(
          "[ARCHIVE] Erreur lors du parsing des données acconier_user:",
          e
        );
      }
    } else {
      // Priorité 2: Utilisateur connecté via auth standard
      const storedUserName = localStorage.getItem("userName");
      const storedUserEmail = localStorage.getItem("userEmail");

      if (storedUserName && storedUserName.trim() !== "") {
        userName = storedUserName;
        userEmail = storedUserEmail || "";
        console.log(
          "[ARCHIVE] Utilisateur trouvé via userName/userEmail:",
          userName,
          userEmail
        );
      } else {
        // Priorité 3: Données dans "user" object
        const userFromStorage = localStorage.getItem("user");
        if (userFromStorage) {
          try {
            const parsed = JSON.parse(userFromStorage);
            userName = parsed.nom || parsed.name || userName;
            userEmail = parsed.email || userEmail;
            console.log(
              "[ARCHIVE] Utilisateur trouvé via user object:",
              userName,
              userEmail
            );
          } catch (e) {
            console.warn("[ARCHIVE] Erreur parsing user object:", e);
          }
        } else {
          // Fallback vers currentUser seulement si pas d'autres données
          const currentUser = localStorage.getItem("currentUser");
          const currentUserEmail = localStorage.getItem("currentUserEmail");

          // Éviter les valeurs génériques par défaut
          if (currentUser && currentUser !== "Administrateur") {
            userName = currentUser;
            userEmail = currentUserEmail || "";
            console.log(
              "[ARCHIVE] Utilisateur trouvé via currentUser:",
              userName,
              userEmail
            );
          } else {
            console.log(
              "[ARCHIVE] Aucun utilisateur spécifique trouvé, utilisation de 'Utilisateur'"
            );
          }
        }
      }
    }

    const archiveData = {
      dossier_id: dossierData.id,
      dossier_reference:
        dossierData.dossier_number || dossierData.container_number,
      intitule: dossierData.container_type_and_content || "",
      client_name: dossierData.client_name,
      role_source: roleSource,
      page_origine: pageOrigine,
      action_type: actionType,
      archived_by: userName,
      archived_by_email: userEmail,
      dossier_data: dossierData,
      metadata: {
        archived_from_url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    };

    const response = await fetch("/api/archives", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(archiveData),
    });

    const result = await response.json();
    if (result.success) {
      console.log("Dossier archivé avec succès:", result.archive);

      // Rafraîchir les données si on est sur la page des archives
      if (
        window.archivesManager &&
        typeof window.archivesManager.reload === "function"
      ) {
        console.log(
          "[ARCHIVE] Rafraîchissement des données après archivage..."
        );
        await window.archivesManager.reload();
      }

      return true;
    } else {
      console.error("Erreur lors de l'archivage:", result.message);
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de l'archivage:", error);
    return false;
  }
};

// Initialisation quand la page est chargée
document.addEventListener("DOMContentLoaded", function () {
  // Vérifier si nous sommes sur la page d'archives
  const archivesContainer =
    document.getElementById("searchBtn") || document.querySelector(".nav-tabs");
  if (archivesContainer) {
    console.log("[ARCHIVES] Initialisation de l'interface d'archives");
    window.archivesManager = new ArchivesManager();
  } else {
    console.log(
      "[ARCHIVES] Interface d'archives non détectée, initialisation ignorée"
    );
  }
});
