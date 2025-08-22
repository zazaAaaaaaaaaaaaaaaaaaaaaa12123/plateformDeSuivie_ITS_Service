/**
 * storageStats.js - Gestionnaire des statistiques de stockage des archives
 * Système de suivi du niveau de stockage pour toutes les pages
 */

/**
 * Gestionnaire des statistiques de stockage
 */
class StorageStatsManager {
  constructor() {
    this.modal = null;
    this.lastStats = null;
    this.init();
  }

  init() {
    // Vérifier si nous avons les éléments nécessaires ET si nous sommes sur la page archives
    const storageBtn = document.getElementById("storageStatsBtn");
    const isArchivePage =
      document.getElementById("searchBtn") ||
      document.querySelector(".nav-tabs");

    if (!storageBtn || !isArchivePage) {
      console.log(
        "[STORAGE] Niveau de stockage disponible uniquement sur la page Archives"
      );
      return;
    }

    this.modal = document.getElementById("storageStatsModal");
    this.bindEvents();
    console.log(
      "[STORAGE] Gestionnaire de stockage initialisé pour la page Archives"
    );
  }

  bindEvents() {
    // Événement lors de l'ouverture de la modale
    if (this.modal) {
      this.modal.addEventListener("shown.bs.modal", () => {
        this.loadStorageStats();
      });
    }

    // Bouton de recalcul
    const recalculateBtn = document.getElementById("recalculateStorageBtn");
    if (recalculateBtn) {
      recalculateBtn.addEventListener("click", () => {
        this.recalculateStorage();
      });
    }
  }

  async loadStorageStats() {
    try {
      this.showLoading();
      console.log("[STORAGE] Chargement des statistiques de stockage...");

      const response = await fetch("/api/storage-stats");

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const stats = await response.json();
      this.lastStats = stats;
      this.displayStats(stats);
      this.hideLoading();

      console.log("[STORAGE] Statistiques chargées:", stats);
    } catch (error) {
      console.error("[STORAGE] Erreur lors du chargement:", error);
      this.showError(
        "Impossible de charger les statistiques de stockage: " + error.message
      );
      this.hideLoading();
    }
  }

  async recalculateStorage() {
    try {
      const recalculateBtn = document.getElementById("recalculateStorageBtn");
      const originalText = recalculateBtn.innerHTML;

      // Désactiver le bouton et afficher le spinner
      recalculateBtn.disabled = true;
      recalculateBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin me-1"></i>Recalcul en cours...';

      console.log("[STORAGE] Démarrage du recalcul des tailles...");

      const response = await fetch("/api/storage-stats/recalculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log("[STORAGE] Recalcul terminé:", result);

      // Recharger les statistiques
      await this.loadStorageStats();

      // Réactiver le bouton
      recalculateBtn.disabled = false;
      recalculateBtn.innerHTML = originalText;

      // Afficher une notification de succès
      this.showSuccessMessage(
        `Recalcul terminé: ${result.recalculated} archives mises à jour`
      );
    } catch (error) {
      console.error("[STORAGE] Erreur lors du recalcul:", error);

      // Réactiver le bouton
      const recalculateBtn = document.getElementById("recalculateStorageBtn");
      if (recalculateBtn) {
        recalculateBtn.disabled = false;
        recalculateBtn.innerHTML =
          '<i class="fas fa-sync-alt me-1"></i>Recalculer';
      }

      this.showError("Erreur lors du recalcul: " + error.message);
    }
  }

  displayStats(stats) {
    try {
      // === MÉTRIQUES PRINCIPALES ===
      const totalSizeEl = document.getElementById("totalSizeDisplay");
      const totalArchivesEl = document.getElementById("totalArchivesCount");
      const usagePercentageEl = document.getElementById(
        "usagePercentageDisplay"
      );
      const maxStorageEl = document.getElementById("maxStorageDisplay");

      if (totalSizeEl) totalSizeEl.textContent = stats.totalSizeFormatted;
      if (totalArchivesEl)
        totalArchivesEl.textContent = `${stats.totalArchives} archive${
          stats.totalArchives > 1 ? "s" : ""
        }`;
      if (usagePercentageEl)
        usagePercentageEl.textContent = `${stats.usagePercentage}%`;
      if (maxStorageEl)
        maxStorageEl.textContent = `sur ${stats.maxStorageFormatted}`;

      // === DERNIÈRE SYNCHRONISATION ===
      const lastSyncEl = document.getElementById("lastSyncDisplay");
      if (lastSyncEl) {
        const now = new Date();
        const syncTime = now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        lastSyncEl.textContent = syncTime;
      }

      // === BADGE DE STATUT ===
      const statusBadge = document.getElementById("storageStatusBadge");
      if (statusBadge) {
        const percentage = stats.usagePercentage;
        if (percentage < 50) {
          statusBadge.textContent = "Optimal";
          statusBadge.className = "badge bg-success";
        } else if (percentage < 80) {
          statusBadge.textContent = "Attention";
          statusBadge.className = "badge bg-warning";
        } else {
          statusBadge.textContent = "Critique";
          statusBadge.className = "badge bg-danger";
        }
      }

      // === AFFICHAGE D'EFFICACITÉ ===
      const efficiencyDisplay = document.getElementById("efficiencyDisplay");
      if (efficiencyDisplay) {
        const efficiency = Math.max(0, 100 - stats.usagePercentage);
        efficiencyDisplay.textContent = `${efficiency}%`;
      }

      // === BARRE DE PROGRESSION LINÉAIRE ===
      const progressBar = document.getElementById("storageProgressBar");
      const progressText = document.getElementById("progressPercentageText");
      if (progressBar && progressText) {
        const percentage = Math.min(stats.usagePercentage, 100);
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute("aria-valuenow", percentage);
        progressText.textContent = `${percentage}%`;

        // Animation CSS pour la barre
        progressBar.style.transition = "width 1.5s ease-in-out";

        // Couleur adaptative avec gradient
        if (percentage < 50) {
          progressBar.style.background =
            "linear-gradient(90deg, #10b981 0%, #059669 100%)";
        } else if (percentage < 80) {
          progressBar.style.background =
            "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)";
        } else {
          progressBar.style.background =
            "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)";
        }
      }

      // === GRAPHIQUE CIRCULAIRE ===
      const circleProgress = document.getElementById("circleProgress");
      const circlePercentage = document.getElementById("circlePercentage");
      if (circleProgress && circlePercentage) {
        const percentage = Math.min(stats.usagePercentage, 100);
        const circumference = 2 * Math.PI * 45; // rayon = 45
        const offset = circumference - (percentage / 100) * circumference;

        circleProgress.style.strokeDashoffset = offset;
        circleProgress.style.transition = "stroke-dashoffset 2s ease-in-out";
        circlePercentage.textContent = `${percentage}%`;

        // Couleur adaptative du cercle
        if (percentage < 50) {
          circleProgress.style.stroke = "#10b981";
        } else if (percentage < 80) {
          circleProgress.style.stroke = "#f59e0b";
        } else {
          circleProgress.style.stroke = "#ef4444";
        }
      }

      // === TABLEAU DÉTAILLÉ PREMIUM ===
      this.displayPremiumTypeBreakdown(stats);

      // === DERNIÈRE MISE À JOUR ===
      const lastUpdatedEl = document.getElementById("lastUpdatedDisplay");
      if (lastUpdatedEl) {
        const lastUpdated = new Date(stats.lastUpdated).toLocaleString(
          "fr-FR",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        );
        lastUpdatedEl.textContent = lastUpdated;
      }

      // === ANIMATIONS D'ENTRÉE ===
      this.animateCounters(stats);
    } catch (error) {
      console.error("[STORAGE] Erreur lors de l'affichage:", error);
      this.showError("Erreur lors de l'affichage des analytics de stockage");
    }
  }

  displayPremiumTypeBreakdown(stats) {
    const tableBody = document.getElementById("storageByTypeTable");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    const typeLabels = {
      suppression: "Dossiers supprimés",
      livraison: "Dossiers livrés",
      mise_en_livraison: "Mise en livraison",
      ordre_livraison_etabli: "Ordres établis",
    };

    const typeIcons = {
      suppression: "fas fa-trash-alt",
      livraison: "fas fa-truck",
      mise_en_livraison: "fas fa-shipping-fast",
      ordre_livraison_etabli: "fas fa-clipboard-list",
    };

    const typeColors = {
      suppression: "#ef4444",
      livraison: "#10b981",
      mise_en_livraison: "#3b82f6",
      ordre_livraison_etabli: "#8b5cf6",
    };

    const totalSize = stats.totalSizeBytes;

    Object.entries(stats.sizeByType).forEach(([type, data]) => {
      const row = document.createElement("tr");
      const percentage =
        totalSize > 0 ? Math.round((data.bytes / totalSize) * 100) : 0;
      const color = typeColors[type] || "#6b7280";

      // Déterminer le statut
      let statusBadge = "";
      if (percentage > 40) {
        statusBadge = '<span class="badge bg-warning">Élevé</span>';
      } else if (percentage > 20) {
        statusBadge = '<span class="badge bg-info">Modéré</span>';
      } else {
        statusBadge = '<span class="badge bg-success">Normal</span>';
      }

      row.innerHTML = `
        <td class="py-3">
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0 me-3">
              <div class="rounded-circle d-flex align-items-center justify-content-center" 
                   style="width: 40px; height: 40px; background: ${color}15; color: ${color};">
                <i class="${
                  typeIcons[type] || "fas fa-archive"
                }" style="font-size: 1.1rem;"></i>
              </div>
            </div>
            <div>
              <div class="fw-medium text-dark">${typeLabels[type] || type}</div>
              <small class="text-muted">${this.formatArchiveCount(
                type,
                stats
              )}</small>
            </div>
          </div>
        </td>
        <td class="py-3">
          <div class="fw-bold text-dark">${data.formatted}</div>
          <small class="text-muted">${this.formatBytes(
            data.bytes
          )} bruts</small>
        </td>
        <td class="py-3">
          <div class="d-flex align-items-center">
            <div class="flex-grow-1 me-3">
              <div class="progress" style="height: 8px; border-radius: 10px;">
                <div class="progress-bar" 
                     style="width: ${percentage}%; background: ${color}; border-radius: 10px;"></div>
              </div>
            </div>
            <span class="fw-medium text-dark" style="min-width: 40px;">${percentage}%</span>
          </div>
        </td>
        <td class="py-3">
          ${statusBadge}
        </td>
      `;

      tableBody.appendChild(row);
    });
  }

  formatArchiveCount(type, stats) {
    // Simulation du nombre d'archives par type (à adapter selon vos données réelles)
    const counts = {
      suppression: Math.floor(stats.totalArchives * 0.4),
      livraison: Math.floor(stats.totalArchives * 0.35),
      mise_en_livraison: Math.floor(stats.totalArchives * 0.15),
      ordre_livraison_etabli: Math.floor(stats.totalArchives * 0.1),
    };

    return `${counts[type] || 0} éléments`;
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  animateCounters(stats) {
    // Animation des compteurs principaux
    this.animateCounter("totalSizeDisplay", stats.totalSizeFormatted);
    this.animateCounter("usagePercentageDisplay", `${stats.usagePercentage}%`);

    // Animation du nombre total d'archives
    const archivesEl = document.getElementById("totalArchivesCount");
    if (archivesEl) {
      this.animateNumber(
        archivesEl,
        stats.totalArchives,
        (num) => `${num} archive${num > 1 ? "s" : ""}`
      );
    }
  }

  animateCounter(elementId, finalValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Animation de fondu
    element.style.opacity = "0";
    element.style.transform = "translateY(10px)";
    element.style.transition = "all 0.6s ease";

    setTimeout(() => {
      element.textContent = finalValue;
      element.style.opacity = "1";
      element.style.transform = "translateY(0)";
    }, 300);
  }

  animateNumber(element, finalNumber, formatter) {
    if (!element) return;

    let current = 0;
    const increment = Math.ceil(finalNumber / 30);
    const timer = setInterval(() => {
      current += increment;
      if (current >= finalNumber) {
        current = finalNumber;
        clearInterval(timer);
      }
      element.textContent = formatter(current);
    }, 50);
  }

  showLoading() {
    const loadingEl = document.getElementById("storageStatsLoading");
    const contentEl = document.getElementById("storageStatsContent");
    const errorEl = document.getElementById("storageStatsError");

    if (loadingEl) loadingEl.style.display = "block";
    if (contentEl) contentEl.style.display = "none";
    if (errorEl) errorEl.style.display = "none";
  }

  hideLoading() {
    const loadingEl = document.getElementById("storageStatsLoading");
    const contentEl = document.getElementById("storageStatsContent");

    if (loadingEl) loadingEl.style.display = "none";
    if (contentEl) contentEl.style.display = "block";
  }

  showError(message) {
    const errorEl = document.getElementById("storageStatsError");
    const errorMessageEl = document.getElementById("storageStatsErrorMessage");
    const contentEl = document.getElementById("storageStatsContent");
    const loadingEl = document.getElementById("storageStatsLoading");

    if (errorEl) errorEl.style.display = "block";
    if (errorMessageEl) errorMessageEl.textContent = message;
    if (contentEl) contentEl.style.display = "none";
    if (loadingEl) loadingEl.style.display = "none";
  }

  showSuccessMessage(message) {
    // Utiliser le système de toast existant si disponible
    if (typeof showToast === "function") {
      showToast(message, "success");
    } else if (typeof showNotification === "function") {
      showNotification(message, "success");
    } else {
      // Fallback: utiliser une alerte simple
      console.log("[STORAGE] Succès:", message);
      // Créer une notification temporaire
      this.createTempNotification(message, "success");
    }
  }

  createTempNotification(message, type = "info") {
    // Créer une notification temporaire en cas d'absence de système de toast
    const notification = document.createElement("div");
    notification.className = `alert alert-${
      type === "success" ? "success" : "info"
    } position-fixed`;
    notification.style.cssText = `
      top: 20px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    notification.innerHTML = `
      <i class="fas fa-${
        type === "success" ? "check-circle" : "info-circle"
      } me-2"></i>
      ${message}
    `;

    document.body.appendChild(notification);

    // Animation d'apparition
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 100);

    // Suppression automatique après 4 secondes
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
  }
}

// Initialisation automatique
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.storageManager === "undefined") {
    window.storageManager = new StorageStatsManager();
    console.log("[STORAGE] Gestionnaire de stockage global initialisé");
  }
});

// Export pour usage dans d'autres scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = StorageStatsManager;
}
