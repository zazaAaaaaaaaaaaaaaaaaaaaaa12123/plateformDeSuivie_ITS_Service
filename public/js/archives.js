/**
 * Archives.js - Gestion de l'interface des archives
 * Système de centralisation, recherche et restauration des dossiers archivés
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

    this.init();
  }

  init() {
    this.bindEvents();
    this.setupRealTimeNotifications(); // Nouveau système de notifications

    // Ne charger les archives que si nous sommes sur la page d'archives
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      this.loadArchives();
      this.setDefaultDates();
    }
  }

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

  // *** SYSTÈME DE NOTIFICATIONS EN TEMPS RÉEL ***
  setupRealTimeNotifications() {
    // Vérifier si nous sommes sur la page archives
    const searchBtn = document.getElementById("searchBtn");
    if (!searchBtn) {
      console.log("[ARCHIVES] Page non détectée, notifications désactivées");
      return;
    }

    // Écouter les événements personnalisés (même onglet)
    window.addEventListener("orderValidated", (event) => {
      console.log(
        "📢 [ARCHIVES] Notification reçue - Nouvel ordre validé:",
        event.detail
      );
      this.handleNewOrderNotification(event.detail);
    });

    // Écouter les changements du localStorage (autres onglets)
    window.addEventListener("storage", (event) => {
      if (event.key === "archiveNotification" && event.newValue) {
        try {
          const notification = JSON.parse(event.newValue);
          console.log(
            "📢 [ARCHIVES] Notification localStorage reçue:",
            notification
          );
          if (notification.type === "ORDER_VALIDATED") {
            this.handleNewOrderNotification({
              type: "ordre_livraison_etabli",
              data: notification.data,
              timestamp: notification.timestamp,
            });
          }
        } catch (error) {
          console.warn("⚠️ [ARCHIVES] Erreur parse notification:", error);
        }
      }
    });

    console.log("✅ [ARCHIVES] Système de notifications en temps réel activé");
  }

  // Gérer la réception d'une notification de nouvel ordre
  async handleNewOrderNotification(notificationDetail) {
    try {
      // Vérifier si on est sur l'onglet "Ordres de Livraison"
      const ordersTab = document.getElementById("orders-tab");
      const isOrdersTabActive =
        ordersTab && ordersTab.classList.contains("active");

      console.log("📋 [ARCHIVES] Onglet Ordres actif:", isOrdersTabActive);

      if (isOrdersTabActive) {
        // Recharger immédiatement si on est sur l'onglet ordres
        console.log(
          "🔄 [ARCHIVES] Rechargement automatique de l'onglet Ordres..."
        );
        this.currentFilters.action_type = "ordre_livraison_etabli";
        await this.loadArchives();

        // Notification visuelle
        this.showNotificationToast(
          "📋 Nouvel ordre de livraison ajouté aux archives !"
        );
      } else {
        // Sinon, juste mettre à jour le cache pour le prochain affichage
        console.log(
          "💾 [ARCHIVES] Cache invalidé, rechargement au prochain affichage"
        );
        this.allArchivesData = null;
        this.lastDataRefresh = 0;

        // Optionnel : Badge de notification sur l'onglet
        this.addNotificationBadge("orders-tab");
      }
    } catch (error) {
      console.warn("⚠️ [ARCHIVES] Erreur traitement notification:", error);
    }
  }

  // Afficher une notification toast
  showNotificationToast(message) {
    // Créer un toast simple
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 600;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animation d'entrée
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
    }, 100);

    // Suppression automatique
    setTimeout(() => {
      toast.style.transform = "translateX(400px)";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Ajouter un badge de notification sur un onglet
  addNotificationBadge(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    // Supprimer l'ancien badge s'il existe
    const existingBadge = tab.querySelector(".notification-badge");
    if (existingBadge) {
      existingBadge.remove();
    }

    // Créer le nouveau badge
    const badge = document.createElement("span");
    badge.className = "notification-badge";
    badge.style.cssText = `
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      animation: pulse 2s infinite;
    `;
    badge.textContent = "!";

    // Ajouter l'animation CSS
    if (!document.getElementById("notification-badge-style")) {
      const style = document.createElement("style");
      style.id = "notification-badge-style";
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    // Positioner le parent en relatif et ajouter le badge
    tab.style.position = "relative";
    tab.appendChild(badge);

    // Supprimer le badge quand on clique sur l'onglet
    tab.addEventListener(
      "click",
      () => {
        if (badge.parentNode) {
          badge.parentNode.removeChild(badge);
        }
      },
      { once: true }
    );
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

  // Debounce pour la recherche en temps réel
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
        await this.updateCounts();

        // Afficher les résultats filtrés

        this.renderCurrentView();
        this.renderPagination();

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

  async syncLocalStorageHistory() {
    console.log(
      "[ARCHIVES] 🔄 Synchronisation de l'historique localStorage..."
    );

    try {
      // Récupérer l'historique depuis localStorage (même clé que resp_liv.html)
      const historyKey = "professional_delivery_history";
      const historyData = JSON.parse(localStorage.getItem(historyKey) || "[]");

      if (historyData.length === 0) {
        console.log("[ARCHIVES] Aucun historique trouvé dans localStorage");
        return { success: true, synced_count: 0 };
      }

      console.log(
        `[ARCHIVES] Trouvé ${historyData.length} entrées dans l'historique localStorage`
      );

      // FILTRER : Exclure tous les dossiers avec "N/A" comme référence
      const validHistoryData = historyData.filter((item) => {
        const dossierRef = item.declaration_number || item.dossier_number || "";
        const isValid =
          dossierRef && dossierRef.trim() && dossierRef.trim() !== "N/A";

        if (!isValid) {
          console.log(
            `[ARCHIVES] ❌ Dossier filtré (N/A): ${dossierRef} - ${item.client_name}`
          );
        }

        return isValid;
      });

      console.log(
        `[ARCHIVES] Après filtrage N/A: ${
          validHistoryData.length
        } entrées valides (${
          historyData.length - validHistoryData.length
        } filtrées)`
      );

      if (validHistoryData.length === 0) {
        console.log("[ARCHIVES] Aucun dossier valide après filtrage N/A");
        return { success: true, synced_count: 0 };
      }

      // Envoyer les données FILTRÉES au backend pour synchronisation
      const response = await fetch("/api/archives/sync-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          historyData: validHistoryData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(
          `[ARCHIVES] ✅ Synchronisation réussie: ${result.synced_count} dossiers synchronisés`
        );
        return result;
      } else {
        console.error(
          "[ARCHIVES] ❌ Erreur lors de la synchronisation:",
          result.message
        );
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error(
        "[ARCHIVES] ❌ Erreur lors de la synchronisation localStorage:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  async updateCounts() {
    console.log(
      "[ARCHIVES] Mise à jour des compteurs - appels backend séparés..."
    );

    try {
      // D'abord synchroniser l'historique localStorage pour les dossiers livrés
      console.log(
        "[ARCHIVES] Synchronisation de l'historique avant calcul des compteurs..."
      );
      await this.syncLocalStorageHistory();

      // Faire des appels séparés pour chaque action_type pour obtenir les vrais compteurs
      const countPromises = [
        fetch("/api/archives?action_type=suppression&limit=1").then((r) =>
          r.json()
        ),
        fetch("/api/archives?action_type=livraison&limit=1").then((r) =>
          r.json()
        ),
        fetch("/api/archives?action_type=mise_en_livraison&limit=1").then((r) =>
          r.json()
        ),
        fetch("/api/archives?action_type=ordre_livraison_etabli&limit=1").then(
          (r) => r.json()
        ),
        fetch("/api/archives?limit=1").then((r) => r.json()), // Pour le total
      ];

      const [
        suppressionData,
        livraisonData,
        miseEnLivraisonData,
        ordreData,
        allData,
      ] = await Promise.all(countPromises);

      const counts = {
        suppression: suppressionData.pagination?.totalItems || 0,
        livraison: livraisonData.pagination?.totalItems || 0,
        mise_en_livraison: miseEnLivraisonData.pagination?.totalItems || 0,
        ordre_livraison_etabli: ordreData.pagination?.totalItems || 0,
        all: allData.pagination?.totalItems || 0,
      };

      console.log("[ARCHIVES] Vrais compteurs backend récupérés:", counts);

      // Mettre à jour l'affichage
      document.getElementById("allCount").textContent = counts.all;
      document.getElementById("deletedCount").textContent = counts.suppression;
      document.getElementById("deliveredCount").textContent = counts.livraison;
      document.getElementById("shippingCount").textContent =
        counts.mise_en_livraison;
      document.getElementById("ordersCount").textContent =
        counts.ordre_livraison_etabli;
    } catch (error) {
      console.error("[ARCHIVES] Erreur lors du calcul des compteurs:", error);
      // Fallback vers l'ancienne méthode en cas d'erreur
      const fallbackCounts = {
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

      document.getElementById("allCount").textContent = fallbackCounts.all;
      document.getElementById("deletedCount").textContent =
        fallbackCounts.suppression;
      document.getElementById("deliveredCount").textContent =
        fallbackCounts.livraison;
      document.getElementById("shippingCount").textContent =
        fallbackCounts.mise_en_livraison;
      document.getElementById("ordersCount").textContent =
        fallbackCounts.ordre_livraison_etabli;
    }
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
      // Gérer spécifiquement l'erreur 409 (doublon) - ne pas afficher d'erreur
      if (response.status === 409) {
        console.log(
          `[ARCHIVE] Dossier "${archiveData.dossier_reference}" déjà archivé pour l'action "${actionType}" - ignoré silencieusement`
        );
        return true; // Considérer comme un succès car l'objectif est atteint
      } else {
        console.error("Erreur lors de l'archivage:", result.message);
        return false;
      }
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
