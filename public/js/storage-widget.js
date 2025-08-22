/**
 * Storage Widget - Composant compact pour afficher le niveau de stockage
 * Peut être intégré dans n'importe quelle page de la plateforme
 */

class StorageWidget {
  constructor(containerId = "storageWidget", options = {}) {
    this.containerId = containerId;
    this.options = {
      showDetails: options.showDetails || false,
      autoRefresh: options.autoRefresh !== false, // true par défaut
      refreshInterval: options.refreshInterval || 60000, // 1 minute
      compact: options.compact !== false, // true par défaut
      ...options,
    };

    this.storageData = null;
    this.lastUpdate = 0;
    this.refreshInterval = null;

    this.init();
  }

  async init() {
    this.createWidget();
    await this.updateData();

    if (this.options.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  createWidget() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(
        `[STORAGE WIDGET] Container ${this.containerId} non trouvé`
      );
      return;
    }

    const widgetHTML = this.options.compact
      ? this.createCompactWidget()
      : this.createDetailedWidget();
    container.innerHTML = widgetHTML;

    // Lier les événements
    this.bindEvents();
  }

  createCompactWidget() {
    return `
      <div class="storage-widget-compact">
        <div class="d-flex align-items-center">
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small class="text-muted fw-bold">Stockage</small>
              <span id="storageWidgetStatus" class="badge badge-sm">
                <i id="storageWidgetIcon" class="fas fa-database me-1"></i>
                <span id="storageWidgetText">--</span>
              </span>
            </div>
            <div class="progress" style="height: 6px;">
              <div id="storageWidgetProgress" 
                   class="progress-bar" 
                   role="progressbar" 
                   style="width: 0%">
              </div>
            </div>
            <div class="d-flex justify-content-between mt-1">
              <small id="storageWidgetUsed" class="text-muted">-- MB</small>
              <small id="storageWidgetPercentage" class="text-muted">--%</small>
            </div>
          </div>
          <div class="ms-2">
            <button id="storageWidgetRefresh" 
                    class="btn btn-sm btn-outline-secondary" 
                    title="Actualiser">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  createDetailedWidget() {
    return `
      <div class="storage-widget-detailed">
        <div class="card border-info">
          <div class="card-header bg-info text-white py-2">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0">
                <i class="fas fa-database me-2"></i>
                Stockage
              </h6>
              <div class="d-flex align-items-center">
                <small id="storageWidgetLastUpdate" class="me-2 opacity-75">--</small>
                <button id="storageWidgetRefresh" 
                        class="btn btn-sm btn-outline-light" 
                        title="Actualiser">
                  <i class="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="card-body p-3">
            <div id="storageWidgetLoading" class="text-center py-2" style="display: none;">
              <div class="spinner-border spinner-border-sm text-info" role="status">
                <span class="visually-hidden">Chargement...</span>
              </div>
            </div>
            <div id="storageWidgetContent">
              <!-- Indicateur principal -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="mb-0">Utilisation</h6>
                  <span id="storageWidgetStatus" class="badge">
                    <i id="storageWidgetIcon" class="fas fa-database me-1"></i>
                    <span id="storageWidgetText">--</span>
                  </span>
                </div>
                <div class="progress mb-2" style="height: 20px;">
                  <div id="storageWidgetProgress" 
                       class="progress-bar progress-bar-striped" 
                       role="progressbar" 
                       style="width: 0%">
                    <span id="storageWidgetPercentage" class="fw-bold">--%</span>
                  </div>
                </div>
                <div class="d-flex justify-content-between small text-muted">
                  <span id="storageWidgetUsed">-- MB utilisés</span>
                  <span id="storageWidgetAvailable">-- MB disponibles</span>
                </div>
              </div>
              
              <!-- Détails rapides -->
              <div class="row">
                <div class="col-6">
                  <div class="text-center p-2 bg-light rounded">
                    <i class="fas fa-file-upload text-primary"></i>
                    <div class="small fw-bold">Fichiers</div>
                    <div id="storageWidgetUploads" class="small text-muted">-- MB</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-center p-2 bg-light rounded">
                    <i class="fas fa-database text-success"></i>
                    <div class="small fw-bold">Base</div>
                    <div id="storageWidgetDatabase" class="small text-muted">-- MB</div>
                  </div>
                </div>
              </div>
              
              <!-- Lien vers les archives -->
              <div class="text-center mt-3">
                <a href="../html/archives.html" class="btn btn-sm btn-outline-info">
                  <i class="fas fa-chart-line me-1"></i>
                  Voir les détails
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const refreshBtn = document.getElementById("storageWidgetRefresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.updateData(true);
      });
    }
  }

  async updateData(forceRefresh = false) {
    const now = Date.now();

    // Éviter les mises à jour trop fréquentes
    if (!forceRefresh && this.storageData && now - this.lastUpdate < 30000) {
      return;
    }

    try {
      this.showLoading(true);

      // Utiliser l'endpoint de statut rapide
      const response = await fetch("/api/storage/status");
      const data = await response.json();

      if (data.success) {
        this.storageData = data.storage;
        this.lastUpdate = now;
        this.renderData();
      } else {
        throw new Error(data.message || "Erreur lors de la récupération");
      }
    } catch (error) {
      console.error("[STORAGE WIDGET] Erreur:", error);
      this.showError();
    } finally {
      this.showLoading(false);
    }
  }

  renderData() {
    if (!this.storageData) return;

    const { percentage, status, statusColor, used, limit } = this.storageData;

    // Status badge
    const statusElement = document.getElementById("storageWidgetStatus");
    const iconElement = document.getElementById("storageWidgetIcon");
    const textElement = document.getElementById("storageWidgetText");

    if (statusElement && iconElement && textElement) {
      statusElement.className = `badge bg-${this.getBootstrapColor(
        statusColor
      )}`;
      iconElement.className = `fas ${this.getStatusIcon(status)} me-1`;
      textElement.textContent = this.getStatusText(status);
    }

    // Progress bar
    const progressElement = document.getElementById("storageWidgetProgress");
    const percentageElement = document.getElementById(
      "storageWidgetPercentage"
    );

    if (progressElement) {
      progressElement.style.width = `${percentage}%`;
      progressElement.className = `progress-bar progress-bar-striped bg-${this.getBootstrapColor(
        statusColor
      )}`;
    }

    if (percentageElement) {
      percentageElement.textContent = `${percentage}%`;
    }

    // Textes d'utilisation
    const usedElement = document.getElementById("storageWidgetUsed");
    if (usedElement) {
      usedElement.textContent = this.options.compact
        ? this.formatBytes(used)
        : this.formatBytes(used) + " utilisés";
    }

    const availableElement = document.getElementById("storageWidgetAvailable");
    if (availableElement) {
      availableElement.textContent =
        this.formatBytes(limit - used) + " disponibles";
    }

    // Dernière mise à jour
    const lastUpdateElement = document.getElementById(
      "storageWidgetLastUpdate"
    );
    if (lastUpdateElement) {
      const date = new Date(this.storageData.lastUpdate);
      lastUpdateElement.textContent = `${date.toLocaleTimeString("fr-FR")}`;
    }

    // Ajouter une classe CSS pour l'animation si critique
    const container = document.getElementById(this.containerId);
    if (container) {
      container.classList.remove("storage-critical", "storage-warning");
      if (status === "critical") {
        container.classList.add("storage-critical");
      } else if (status === "warning") {
        container.classList.add("storage-warning");
      }
    }
  }

  showLoading(show) {
    const loadingElement = document.getElementById("storageWidgetLoading");
    const contentElement = document.getElementById("storageWidgetContent");

    if (loadingElement) {
      loadingElement.style.display = show ? "block" : "none";
    }

    if (contentElement) {
      contentElement.style.display = show ? "none" : "block";
    }

    // Spinner sur le bouton
    const refreshBtn = document.getElementById("storageWidgetRefresh");
    if (refreshBtn) {
      const icon = refreshBtn.querySelector("i");
      if (icon) {
        if (show) {
          icon.className = "fas fa-spinner fa-spin";
        } else {
          icon.className = "fas fa-sync-alt";
        }
      }
    }
  }

  showError() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger alert-sm">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Erreur de chargement du stockage
        </div>
      `;
    }
  }

  getBootstrapColor(statusColor) {
    if (statusColor === "#dc3545") return "danger";
    if (statusColor === "#ffc107") return "warning";
    return "success";
  }

  getStatusIcon(status) {
    switch (status) {
      case "critical":
        return "fa-exclamation-triangle";
      case "warning":
        return "fa-exclamation-circle";
      default:
        return "fa-check-circle";
    }
  }

  getStatusText(status) {
    switch (status) {
      case "critical":
        return "Critique";
      case "warning":
        return "Attention";
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

  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      this.updateData();
    }, this.options.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  destroy() {
    this.stopAutoRefresh();

    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = "";
    }
  }
}

// Export pour utilisation globale
window.StorageWidget = StorageWidget;

// Fonction utilitaire pour créer rapidement un widget
window.createStorageWidget = function (containerId, options = {}) {
  return new StorageWidget(containerId, options);
};

console.log("[STORAGE WIDGET] 📊 Composant de widget de stockage chargé");
