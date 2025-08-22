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
      // Affichage principal
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

      // Barre de progression
      const progressBar = document.getElementById("storageProgressBar");
      if (progressBar) {
        const percentage = Math.min(stats.usagePercentage, 100);
        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `${percentage}%`;
        progressBar.setAttribute("aria-valuenow", percentage);

        // Couleur de la barre selon le niveau d'utilisation
        progressBar.className = "progress-bar";
        if (percentage < 50) {
          progressBar.classList.add("bg-success");
        } else if (percentage < 80) {
          progressBar.classList.add("bg-warning");
        } else {
          progressBar.classList.add("bg-danger");
        }
      }

      // Tableau par type
      this.displayTypeBreakdown(stats);

      // Dernière mise à jour
      const lastUpdatedEl = document.getElementById("lastUpdatedDisplay");
      if (lastUpdatedEl) {
        const lastUpdated = new Date(stats.lastUpdated).toLocaleString("fr-FR");
        lastUpdatedEl.textContent = lastUpdated;
      }
    } catch (error) {
      console.error("[STORAGE] Erreur lors de l'affichage:", error);
      this.showError("Erreur lors de l'affichage des statistiques");
    }
  }

  displayTypeBreakdown(stats) {
    const tableBody = document.getElementById("storageByTypeTable");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    const typeLabels = {
      suppression: "Dossiers supprimés",
      livraison: "Dossiers livrés",
      mise_en_livraison: "Mise en livraison",
      ordre_livraison_etabli: "Ordre de livraison établi",
    };

    const totalSize = stats.totalSizeBytes;

    Object.entries(stats.sizeByType).forEach(([type, data]) => {
      const row = document.createElement("tr");
      const percentage =
        totalSize > 0 ? Math.round((data.bytes / totalSize) * 100) : 0;

      row.innerHTML = `
        <td>
          <i class="fas fa-${this.getTypeIcon(type)} me-2 text-muted"></i>
          ${typeLabels[type] || type}
        </td>
        <td><strong>${data.formatted}</strong></td>
        <td>
          <div class="d-flex align-items-center">
            <span class="me-2">${percentage}%</span>
            <div class="progress flex-grow-1" style="height: 8px; width: 60px;">
              <div 
                class="progress-bar bg-secondary" 
                style="width: ${percentage}%"
              ></div>
            </div>
          </div>
        </td>
      `;

      tableBody.appendChild(row);
    });
  }

  getTypeIcon(type) {
    const icons = {
      suppression: "trash",
      livraison: "truck",
      mise_en_livraison: "shipping-fast",
      ordre_livraison_etabli: "clipboard-list",
    };
    return icons[type] || "archive";
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
