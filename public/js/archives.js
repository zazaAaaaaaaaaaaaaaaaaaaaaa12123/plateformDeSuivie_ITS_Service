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
    this.allCombinedArchives = []; // Toutes les archives combinées pour l'onglet "Toutes les Archives"
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

    // 🔧 CORRECTION: Nettoyer les backdrops au démarrage (après que toutes les méthodes soient définies)
    setTimeout(() => {
      if (this.cleanupModalBackdrop) {
        this.cleanupModalBackdrop();
      }
    }, 100);
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

        // 🎯 Pour l'onglet "Toutes les Archives", recalculer la pagination côté client
        if (this.selectedTab === "all" && this.allCombinedArchives.length > 0) {
          console.log(
            `[ARCHIVES] 📊 Changement de taille de page: ${this.itemsPerPage} (onglet: Toutes les Archives)`
          );

          // Recalculer la pagination avec la nouvelle taille
          this.pagination = {
            currentPage: this.currentPage,
            totalPages: Math.ceil(
              this.allCombinedArchives.length / this.itemsPerPage
            ),
            totalItems: this.allCombinedArchives.length,
            itemsPerPage: this.itemsPerPage,
          };

          this.renderAllArchivesPagination();
          this.renderPagination();
        } else {
          this.renderCurrentView();
        }
      });
    }

    // Onglets
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tab) => {
      tab.addEventListener("shown.bs.tab", async (e) => {
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

            // 🔧 DEBUG SPÉCIAL pour l'onglet Ordres
            if (this.selectedTab === "orders") {
              console.log(
                "🔍 [DEBUG ORDRES] Chargement de l'onglet Ordres de livraison..."
              );
              // Forcer le rechargement des données pour éviter le cache
              this.allArchivesData = null;
              this.lastDataRefresh = 0;
            }

            this.performSearch(); // Recharger avec le nouveau filtre
          } else {
            console.log(
              `[ARCHIVES] Onglet ${this.selectedTab} non trouvé dans le mapping`
            );
            this.renderCurrentView();
          }
        } else if (actionFilter && this.selectedTab === "all") {
          // 🎯 CORRECTION: Pour "Toutes les Archives", additionner les compteurs des autres onglets
          console.log(
            "[ARCHIVES] 🔄 Chargement de TOUTES les archives (addition des compteurs)"
          );
          this.currentFilters.action_type = ""; // Garder vide pour l'affichage
          actionFilter.value = "";
          await this.loadAllCombinedArchivesByAddition(); // Nouvelle méthode simple
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
        // Mise à jour du compteur en temps réel
        await this.updateCounts();

        // *** NOTIFICATION STOCKAGE - AJOUT ***
        document.dispatchEvent(
          new CustomEvent("archiveUpdated", { detail: { action: "added" } })
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
        // Mise à jour du compteur en temps réel
        await this.updateCounts();

        // *** NOTIFICATION STOCKAGE - AJOUT ***
        document.dispatchEvent(
          new CustomEvent("archiveUpdated", { detail: { action: "added" } })
        );
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

      // 🎯 NOUVEAU: Si on est sur l'onglet "Toutes les Archives", utiliser la méthode combinée
      if (this.selectedTab === "all") {
        console.log(
          "[ARCHIVES] 🎯 Onglet 'Toutes les Archives' détecté - Utilisation de loadAllCombinedArchivesByAddition()"
        );
        await this.loadAllCombinedArchivesByAddition();
        return; // Sortir tôt car loadAllCombinedArchivesByAddition() gère tout
      }

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

      // 🔧 DEBUG SPÉCIAL pour ordre_livraison_etabli
      if (
        this.currentFilters.action_type === "ordre_livraison_etabli" &&
        data.archives
      ) {
        console.log(
          "🔍 [DEBUG ORDRES] Données reçues:",
          data.archives.slice(0, 2)
        );
        data.archives.forEach((archive, index) => {
          if (index < 3) {
            // Montrer seulement les 3 premiers
            console.log(`🔍 [DEBUG ORDRES] Archive ${index + 1}:`, {
              id: archive.id,
              dossier_reference: archive.dossier_reference,
              client_name: archive.client_name,
              action_type: archive.action_type,
            });
          }
        });
      }

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

  // 🎯 NOUVELLE MÉTHODE: Charger toutes les archives combinées pour l'onglet "Toutes les Archives"
  async loadAllCombinedArchives() {
    try {
      this.showLoading(true);
      console.log(
        "[ARCHIVES] 🔄 Chargement de TOUTES les archives combinées..."
      );

      // 📊 Faire des appels parallèles pour chaque type d'archive - SANS LIMITE pour récupérer TOUT
      const promises = [
        fetch(`/api/archives?action_type=suppression&limit=9999&page=1`).then(
          (r) => r.json()
        ),
        fetch(`/api/archives?action_type=livraison&limit=9999&page=1`).then(
          (r) => r.json()
        ),
        fetch(
          `/api/archives?action_type=mise_en_livraison&limit=9999&page=1`
        ).then((r) => r.json()),
        fetch(
          `/api/archives?action_type=ordre_livraison_etabli&limit=9999&page=1`
        ).then((r) => r.json()),
      ];

      const [suppressionData, livraisonData, miseEnLivraisonData, ordreData] =
        await Promise.all(promises);

      // 🔗 Combiner toutes les archives
      let allCombinedArchives = [];

      if (suppressionData.success && suppressionData.archives) {
        allCombinedArchives = allCombinedArchives.concat(
          suppressionData.archives
        );
        console.log(
          `[ARCHIVES] ➕ ${suppressionData.archives.length} archives supprimées ajoutées`
        );
      }
      if (livraisonData.success && livraisonData.archives) {
        allCombinedArchives = allCombinedArchives.concat(
          livraisonData.archives
        );
        console.log(
          `[ARCHIVES] ➕ ${livraisonData.archives.length} archives livrées ajoutées`
        );
      }
      if (miseEnLivraisonData.success && miseEnLivraisonData.archives) {
        allCombinedArchives = allCombinedArchives.concat(
          miseEnLivraisonData.archives
        );
        console.log(
          `[ARCHIVES] ➕ ${miseEnLivraisonData.archives.length} archives en livraison ajoutées`
        );
      }
      if (ordreData.success && ordreData.archives) {
        allCombinedArchives = allCombinedArchives.concat(ordreData.archives);
        console.log(
          `[ARCHIVES] ➕ ${ordreData.archives.length} ordres de livraison ajoutés`
        );
      }

      // 📅 Trier par date de création (plus récent en premier)
      allCombinedArchives.sort(
        (a, b) => new Date(b.archived_at) - new Date(a.archived_at)
      );

      // � Stocker TOUTES les archives pour la pagination frontend
      this.allArchives = allCombinedArchives;
      const totalItems = allCombinedArchives.length;

      // 📑 Appliquer la pagination côté frontend
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.filteredArchives = allCombinedArchives.slice(startIndex, endIndex);

      this.pagination = {
        currentPage: this.currentPage,
        totalPages: Math.ceil(totalItems / this.itemsPerPage),
        totalItems: totalItems,
        itemsPerPage: this.itemsPerPage,
      };

      console.log(
        `[ARCHIVES] ✅ ${allCombinedArchives.length} archives TOTALES chargées, affichage de ${this.filteredArchives.length} (page ${this.currentPage})`
      );

      // 🎯 Mettre à jour le badge de l'onglet "Toutes les Archives" avec le total
      const allTabBadge = document.querySelector("#all-tab .badge");
      if (allTabBadge) {
        allTabBadge.textContent = totalItems;
        allTabBadge.title = `${totalItems} archives au total`;
        console.log(
          `[ARCHIVES] 📊 Badge "Toutes les Archives" mis à jour: ${totalItems}`
        );
      }

      // 🎯 Mettre à jour l'affichage
      this.renderCurrentView();
      this.renderPagination();
      await this.updateCounts();
    } catch (error) {
      console.error(
        "[ARCHIVES] ❌ Erreur lors du chargement des archives combinées:",
        error
      );
      this.showNotification("Erreur lors du chargement des archives", "error");
    } finally {
      this.showLoading(false);
    }
  }

  // 🎯 MÉTHODE SIMPLE: Additionner les compteurs des autres onglets pour "Toutes les Archives"
  async loadAllCombinedArchivesByAddition() {
    try {
      this.showLoading(true);
      console.log(
        "[ARCHIVES] 🔄 Calcul du total par addition des compteurs des onglets..."
      );

      // � D'abord s'assurer que tous les compteurs sont chargés
      await this.updateCounts();

      // �📊 Récupérer les badges des autres onglets pour additionner leurs valeurs
      const deletedBadge = document.querySelector("#deletedCount");
      const deliveredBadge = document.querySelector("#deliveredCount");
      const shippingBadge = document.querySelector("#shippingCount");
      const ordersBadge = document.querySelector("#ordersCount");

      // 🧮 Additionner les valeurs des badges
      let totalCount = 0;

      const deletedCount = deletedBadge
        ? parseInt(deletedBadge.textContent) || 0
        : 0;
      const deliveredCount = deliveredBadge
        ? parseInt(deliveredBadge.textContent) || 0
        : 0;
      const shippingCount = shippingBadge
        ? parseInt(shippingBadge.textContent) || 0
        : 0;
      const ordersCount = ordersBadge
        ? parseInt(ordersBadge.textContent) || 0
        : 0;

      totalCount = deletedCount + deliveredCount + shippingCount + ordersCount;

      console.log(`[ARCHIVES] 📊 Calcul du total:`);
      console.log(`  - Dossiers supprimés: ${deletedCount}`);
      console.log(`  - Dossiers livrés: ${deliveredCount}`);
      console.log(`  - Mis en livraison: ${shippingCount}`);
      console.log(`  - Ordres de livraison: ${ordersCount}`);
      console.log(`  - TOTAL ADDITIONNÉ: ${totalCount}`);

      // 🎯 Mettre à jour le badge de l'onglet "Toutes les Archives" avec le total additionné
      const allTabBadge = document.querySelector("#allCount");
      if (allTabBadge) {
        allTabBadge.textContent = totalCount;
        allTabBadge.title = `${totalCount} archives au total (${deletedCount}+${deliveredCount}+${shippingCount}+${ordersCount})`;
        console.log(
          `[ARCHIVES] ✅ Badge "Toutes les Archives" mis à jour: ${totalCount}`
        );
      } else {
        console.warn("[ARCHIVES] ⚠️ Badge #allCount non trouvé !");
      }

      // 📑 Pour l'affichage, charger TOUTES les archives de tous les types pour respecter le badge
      console.log(
        "[ARCHIVES] 🔄 Chargement de TOUTES les archives pour affichage..."
      );

      // 📊 Faire des appels parallèles pour récupérer TOUTES les archives de chaque type
      const cacheBuster = Date.now(); // Cache buster pour forcer le rechargement
      const promises = [
        fetch(
          `/api/archives?action_type=suppression&limit=99999&page=1&cb=${cacheBuster}`
        ).then((r) => r.json()),
        fetch(
          `/api/archives?action_type=livraison&limit=99999&page=1&cb=${cacheBuster}`
        ).then((r) => r.json()),
        fetch(
          `/api/archives?action_type=mise_en_livraison&limit=99999&page=1&cb=${cacheBuster}`
        ).then((r) => r.json()),
        fetch(
          `/api/archives?action_type=ordre_livraison_etabli&limit=99999&page=1&cb=${cacheBuster}`
        ).then((r) => r.json()),
      ];

      const [suppressionData, livraisonData, miseEnLivraisonData, ordreData] =
        await Promise.all(promises);

      // � DIAGNOSTIC: Afficher les résultats détaillés
      console.log("[ARCHIVES] 🔍 DIAGNOSTIC des données récupérées:");
      console.log("  - suppressionData:", {
        success: suppressionData.success,
        archivesLength: suppressionData.archives
          ? suppressionData.archives.length
          : 0,
        pagination: suppressionData.pagination,
      });
      console.log("  - livraisonData:", {
        success: livraisonData.success,
        archivesLength: livraisonData.archives
          ? livraisonData.archives.length
          : 0,
        pagination: livraisonData.pagination,
      });
      console.log("  - miseEnLivraisonData:", {
        success: miseEnLivraisonData.success,
        archivesLength: miseEnLivraisonData.archives
          ? miseEnLivraisonData.archives.length
          : 0,
        pagination: miseEnLivraisonData.pagination,
      });
      console.log("  - ordreData:", {
        success: ordreData.success,
        archivesLength: ordreData.archives ? ordreData.archives.length : 0,
        pagination: ordreData.pagination,
      });

      // �🔗 Combiner toutes les archives
      let allCombinedArchives = [];

      if (suppressionData.success && suppressionData.archives) {
        allCombinedArchives = allCombinedArchives.concat(
          suppressionData.archives
        );
        console.log(
          `[ARCHIVES] ➕ ${suppressionData.archives.length} archives supprimées récupérées`
        );
      }
      if (livraisonData.success && livraisonData.archives) {
        allCombinedArchives = allCombinedArchives.concat(
          livraisonData.archives
        );
        console.log(
          `[ARCHIVES] ➕ ${livraisonData.archives.length} archives livrées récupérées`
        );
      }
      if (miseEnLivraisonData.success && miseEnLivraisonData.archives) {
        allCombinedArchives = allCombinedArchives.concat(
          miseEnLivraisonData.archives
        );
        console.log(
          `[ARCHIVES] ➕ ${miseEnLivraisonData.archives.length} archives mises en livraison récupérées`
        );
      }
      if (ordreData.success && ordreData.archives) {
        allCombinedArchives = allCombinedArchives.concat(ordreData.archives);
        console.log(
          `[ARCHIVES] ➕ ${ordreData.archives.length} ordres de livraison récupérés`
        );
      }

      // 📅 Trier par date (plus récent en premier)
      allCombinedArchives.sort(
        (a, b) =>
          new Date(b.archived_at || b.created_at) -
          new Date(a.archived_at || a.created_at)
      );

      console.log(
        `[ARCHIVES] 🎯 Total d'archives combinées: ${allCombinedArchives.length} (doit correspondre au badge: ${totalCount})`
      );

      // 💾 Stocker toutes les archives combinées pour la pagination
      this.allCombinedArchives = allCombinedArchives;

      // 🎯 Appliquer la pagination côté client pour l'affichage
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.filteredArchives = this.allCombinedArchives.slice(
        startIndex,
        endIndex
      );

      this.pagination = {
        currentPage: this.currentPage,
        totalPages: Math.ceil(allCombinedArchives.length / this.itemsPerPage),
        totalItems: allCombinedArchives.length, // Utiliser le nombre réel d'archives récupérées
        itemsPerPage: this.itemsPerPage,
      };

      console.log(
        `[ARCHIVES] ✅ Affichage: ${this.filteredArchives.length} archives sur ${allCombinedArchives.length} (page ${this.currentPage}/${this.pagination.totalPages})`
      );

      // 🎯 Mettre à jour l'affichage
      this.renderCurrentView();
      this.renderPagination();
    } catch (error) {
      console.error("[ARCHIVES] ❌ Erreur lors du calcul du total:", error);
      this.showNotification("Erreur lors du calcul du total", "error");
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

      // CALCUL DU TOTAL : Addition des autres onglets
      const totalCalcule =
        counts.suppression +
        counts.livraison +
        counts.mise_en_livraison +
        counts.ordre_livraison_etabli;
      console.log(
        `[ARCHIVES] Total calculé: ${counts.suppression} + ${counts.livraison} + ${counts.mise_en_livraison} + ${counts.ordre_livraison_etabli} = ${totalCalcule}`
      );

      // Mettre à jour l'affichage
      document.getElementById("allCount").textContent = totalCalcule;
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

      // CALCUL DU TOTAL FALLBACK : Addition des autres onglets
      const totalFallback =
        fallbackCounts.suppression +
        fallbackCounts.livraison +
        fallbackCounts.mise_en_livraison +
        fallbackCounts.ordre_livraison_etabli;
      console.log(
        `[ARCHIVES] Total fallback calculé: ${fallbackCounts.suppression} + ${fallbackCounts.livraison} + ${fallbackCounts.mise_en_livraison} + ${fallbackCounts.ordre_livraison_etabli} = ${totalFallback}`
      );

      document.getElementById("allCount").textContent = totalFallback;
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

    // 🔧 DEBUG: Afficher les données de la référence pour ordre_livraison_etabli
    if (archive.action_type === "ordre_livraison_etabli") {
      console.log("🔍 [DEBUG ORDRE] Archive:", {
        id: archive.id,
        dossier_reference: archive.dossier_reference,
        dossier_data_number: archive.dossier_data?.dossier_number,
        dossier_data_container: archive.dossier_data?.container_number,
        intitule: archive.intitule,
        client_name: archive.client_name,
      });

      // Debug du HTML généré
      const referenceHtml = `<strong style="color: #000 !important; font-weight: bold !important;">${
        archive.dossier_reference || "N/A"
      }</strong>`;
      console.log("🔍 [DEBUG ORDRE] HTML référence:", referenceHtml);
    }

    return `
            <tr class="${rowClass}">
                <td class="col-id">
                    <small class="text-muted">#${archive.id}</small>
                </td>
                <td class="col-reference" style="min-width: 120px;">
                    <strong style="color: #000 !important; font-weight: bold !important; display: block !important;">${
                      (archive.dossier_data &&
                        archive.dossier_data.dossier_number) ||
                      archive.dossier_reference ||
                      "N/A"
                    }</strong>
                    ${
                      archive.intitule && archive.intitule.trim() !== ""
                        ? `<br><span class="text-info" style="font-weight: 600; font-size: 0.9em;">${archive.intitule}</span>`
                        : archive.dossier_data &&
                          archive.dossier_data.container_type_and_content &&
                          archive.dossier_data.container_type_and_content.trim() !==
                            ""
                        ? `<br><span class="text-info" style="font-weight: 600; font-size: 0.9em;">${archive.dossier_data.container_type_and_content}</span>`
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

      // *** ÉTAPE 1 : Récupérer les détails de l'archive avant suppression ***
      const archiveToDelete = this.allArchives.find((a) => a.id == archiveId);
      console.log("🗑️ [ARCHIVES] Archive à supprimer:", archiveToDelete);

      const response = await fetch(`/api/archives/${archiveId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // *** ÉTAPE 2 : Supprimer aussi du localStorage pour éviter re-création ***
        if (archiveToDelete && archiveToDelete.action_type === "livraison") {
          await this.removeFromLocalStorageHistory(archiveToDelete);
        }

        this.showNotification("Archive supprimée définitivement", "success");
        await this.loadArchives(); // Recharger la liste

        // *** ÉTAPE 3 : MISE À JOUR DU COMPTEUR EN TEMPS RÉEL ***
        await this.updateCounts();
        console.log("✅ [ARCHIVES] Compteurs mis à jour après suppression");

        // *** NOTIFICATION STOCKAGE - SUPPRESSION ***
        document.dispatchEvent(
          new CustomEvent("archiveUpdated", { detail: { action: "deleted" } })
        );
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

  // *** NOUVELLE MÉTHODE : Supprimer du localStorage pour éviter re-création ***
  async removeFromLocalStorageHistory(archiveToDelete) {
    try {
      const historyKey = "professional_delivery_history";
      const historyData = JSON.parse(localStorage.getItem(historyKey) || "[]");

      if (historyData.length === 0) {
        console.log("📝 [ARCHIVES] Aucun historique localStorage à nettoyer");
        return;
      }

      // Identifier l'entrée à supprimer selon la référence du dossier
      const dossierRef = archiveToDelete.dossier_reference;
      const clientName = archiveToDelete.client_name;

      console.log(
        `🔍 [ARCHIVES] Recherche dans localStorage: ${dossierRef} - ${clientName}`
      );

      // Filtrer pour supprimer l'entrée correspondante
      const filteredHistory = historyData.filter((item) => {
        const itemRef = item.declaration_number || item.dossier_number || "";
        const itemClient = item.client_name || "";

        // Supprimer si la référence ET le client correspondent
        const shouldRemove =
          itemRef === dossierRef && itemClient === clientName;

        if (shouldRemove) {
          console.log(
            `🗑️ [ARCHIVES] Suppression localStorage: ${itemRef} - ${itemClient}`
          );
        }

        return !shouldRemove;
      });

      // Sauvegarder le localStorage nettoyé
      localStorage.setItem(historyKey, JSON.stringify(filteredHistory));

      const removedCount = historyData.length - filteredHistory.length;
      console.log(
        `✅ [ARCHIVES] ${removedCount} entrée(s) supprimée(s) du localStorage`
      );
    } catch (error) {
      console.warn(
        "⚠️ [ARCHIVES] Erreur lors du nettoyage localStorage:",
        error
      );
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

          // 🎯 Pour l'onglet "Toutes les Archives", utiliser la pagination côté client
          if (
            this.selectedTab === "all" &&
            this.allCombinedArchives.length > 0
          ) {
            console.log(
              `[ARCHIVES] 📄 Navigation côté client vers la page ${page} (onglet: Toutes les Archives)`
            );
            this.renderAllArchivesPagination();
          } else {
            console.log(
              `[ARCHIVES] 📄 Navigation serveur vers la page ${page} (onglet: ${this.selectedTab})`
            );
            this.loadArchives();
          }
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

  // 🎯 Méthode pour gérer la pagination côté client pour l'onglet "Toutes les Archives"
  renderAllArchivesPagination() {
    try {
      console.log(
        `[ARCHIVES] 🔄 Pagination côté client - Page ${this.currentPage}`
      );

      if (!this.allCombinedArchives || this.allCombinedArchives.length === 0) {
        console.warn(
          "[ARCHIVES] ⚠️ Aucune archive combinée disponible pour la pagination"
        );
        return;
      }

      // 🎯 Appliquer la pagination côté client
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.filteredArchives = this.allCombinedArchives.slice(
        startIndex,
        endIndex
      );

      console.log(
        `[ARCHIVES] ✅ Page ${this.currentPage}: Affichage de ${
          this.filteredArchives.length
        } archives (${startIndex + 1}-${Math.min(
          endIndex,
          this.allCombinedArchives.length
        )} sur ${this.allCombinedArchives.length})`
      );

      // 🎯 Mettre à jour l'affichage
      this.renderCurrentView();
      this.updatePaginationInfo();
    } catch (error) {
      console.error(
        "[ARCHIVES] ❌ Erreur lors de la pagination côté client:",
        error
      );
    }
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

/**
 * StorageManager - Système de suivi du stockage des archives en temps réel
 */
class StorageManager {
  constructor(archivesManager) {
    this.archivesManager = archivesManager; // Peut être null
    this.storageCapacity = 10240; // 10 GB en MB (VRAIE CAPACITÉ PAYANTE)
    this.realCapacity = null; // Vraie capacité de la base de données
    this.storageHistory = [];
    this.chart = null;

    console.log(
      "[STORAGE] Construction du StorageManager avec archivesManager:",
      !!archivesManager
    );
    this.init();
  }

  init() {
    this.bindEvents();

    // Debug: Vérifier si nous sommes sur la bonne page
    console.log("🔍 [DEBUG] Initialisation StorageManager");
    const totalCapacityEl = document.getElementById("totalStorageCapacity");
    const totalAvailableEl = document.getElementById("totalAvailableStorage");
    console.log("🔍 [DEBUG] Éléments trouvés:", {
      totalCapacityEl: !!totalCapacityEl,
      totalAvailableEl: !!totalAvailableEl,
    });

    this.loadRealDatabaseCapacity(); // Charger la vraie capacité de la DB

    // Forcer le calcul et l'affichage des données de stockage dès l'initialisation
    setTimeout(() => {
      console.log("🔍 [DEBUG] Calcul différé des données de stockage...");
      this.calculateStorageData();
    }, 1000); // Délai pour laisser le temps à la capacité de se charger

    console.log("✅ [STORAGE] Système de stockage initialisé");
  }

  bindEvents() {
    // Bouton d'ouverture de la modale
    const storageBtn = document.getElementById("storageStatusBtn");
    if (storageBtn) {
      storageBtn.addEventListener("click", () => this.showStorageModal());
    }

    // Boutons dans la modale
    const refreshBtn = document.getElementById("refreshStorageBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshStorageData());
    }

    const optimizeBtn = document.getElementById("optimizeStorageBtn");
    if (optimizeBtn) {
      optimizeBtn.addEventListener("click", () => this.optimizeStorage());
    }

    // Écouter les événements de mise à jour des archives
    document.addEventListener("archiveUpdated", () => {
      this.updateStorageData();
    });

    // ⏰ MISE À JOUR AUTOMATIQUE EN TEMPS RÉEL toutes les 30 secondes
    this.startAutoRefresh();
  }

  startAutoRefresh() {
    // Mise à jour automatique du widget Render toutes les 30 secondes
    console.log("🔄 [RENDER] Démarrage de la mise à jour automatique (30s)");

    this.autoRefreshInterval = setInterval(async () => {
      try {
        console.log("🔄 [RENDER] Mise à jour automatique du widget...");

        // Récupérer les nouvelles données de capacité
        const response = await fetch("/api/database/capacity");
        if (response.ok) {
          const capacityData = await response.json();
          this.updateRenderWidget(capacityData);
          console.log("✅ [RENDER] Widget mis à jour automatiquement");
        }
      } catch (error) {
        console.error("❌ [RENDER] Erreur lors de la mise à jour auto:", error);
      }
    }, 30000); // 30 secondes
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      console.log("⏹️ [RENDER] Mise à jour automatique arrêtée");
    }
  }

  // *** CHARGEMENT DE LA VRAIE CAPACITÉ DE LA BASE DE DONNÉES ***
  async loadRealDatabaseCapacity() {
    try {
      console.log(
        "🔄 [STORAGE] Chargement de la vraie capacité de la base de données..."
      );

      const response = await fetch("/api/database/capacity");
      console.log("🔍 [DEBUG] Réponse API:", response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 [DEBUG] Données reçues:", data);

        // Convertir en MB (la réponse est en bytes) - utiliser la nouvelle structure
        this.realCapacity = Math.round(
          data.database.total_capacity_bytes / (1024 * 1024)
        );
        this.storageCapacity = this.realCapacity;

        console.log(
          `✅ [STORAGE] Capacité réelle détectée: ${this.realCapacity} MB (${data.render_info.estimated_plan})`
        );
        console.log(
          `📊 [STORAGE] Plan détecté: ${
            data.render_info.is_paid_plan ? "Payant (10GB)" : "Gratuit (1GB)"
          }`
        );

        // Mettre à jour l'affichage de l'espace total immédiatement
        const totalCapacityEl = document.getElementById("totalStorageCapacity");
        console.log(
          "🔍 [DEBUG] Élément totalStorageCapacity trouvé:",
          !!totalCapacityEl
        );
        if (totalCapacityEl) {
          const newValue = `${(this.storageCapacity / 1024).toFixed(1)} GB`;
          totalCapacityEl.textContent = newValue;
          console.log(
            `📊 [STORAGE] Interface mise à jour: ${newValue} affiché`
          );
          console.log(
            "🔍 [DEBUG] Valeur après mise à jour:",
            totalCapacityEl.textContent
          );
        }

        // Mettre à jour l'espace disponible avec une estimation basée sur la vraie taille de la DB
        const totalAvailableStorageEl = document.getElementById(
          "totalAvailableStorage"
        );
        console.log(
          "🔍 [DEBUG] Élément totalAvailableStorage trouvé:",
          !!totalAvailableStorageEl
        );
        if (totalAvailableStorageEl) {
          // Utiliser la taille réelle de la DB retournée par l'API
          const currentUsedMB = Math.round(
            data.database.current_size_bytes / (1024 * 1024)
          );
          const availableMB = this.storageCapacity - currentUsedMB;
          const newAvailableValue = `${availableMB.toFixed(1)} MB`;
          totalAvailableStorageEl.textContent = newAvailableValue;
          console.log(
            `📊 [STORAGE] Espace disponible estimé: ${newAvailableValue} (DB actuelle: ${currentUsedMB} MB)`
          );
          console.log(
            "🔍 [DEBUG] Valeur espace disponible après mise à jour:",
            totalAvailableStorageEl.textContent
          );
        }
      } else {
        console.warn(
          "⚠️ [STORAGE] Impossible de récupérer la capacité réelle, utilisation de 1GB par défaut"
        );
        this.realCapacity = 1024; // 1GB par défaut
        this.storageCapacity = this.realCapacity;
      }
    } catch (error) {
      console.error(
        "❌ [STORAGE] Erreur lors du chargement de la capacité:",
        error
      );
      this.realCapacity = 1024; // 1GB par défaut
      this.storageCapacity = this.realCapacity;
    }
  }

  async showStorageModal() {
    console.log("📊 [STORAGE] Ouverture du modal de stockage");

    // Nettoyer d'abord
    this.cleanupModalBackdrop();

    // Récupérer l'élément modal
    const modalElement = document.getElementById("storageModal");

    if (!modalElement) {
      console.error("❌ Modal storageModal non trouvé");
      return;
    }

    // Créer le modal
    const modal = new bootstrap.Modal(modalElement);

    // Gestionnaire quand le modal est COMPLÈTEMENT affiché
    modalElement.addEventListener(
      "shown.bs.modal",
      () => {
        console.log("📊 [STORAGE] Modal affiché, mise à jour des données...");

        // Délai pour s'assurer que tous les éléments DOM sont présents
        setTimeout(() => {
          this.updateModalWithSafeData();
        }, 100);
      },
      { once: true }
    );

    // Gestionnaire de fermeture
    modalElement.addEventListener(
      "hidden.bs.modal",
      () => {
        this.cleanupModalBackdrop();
      },
      { once: true }
    );

    // Afficher le modal
    modal.show();
  }

  // 🔧 MÉTHODE CORRIGÉE: Mise à jour avec les vraies données
  async updateModalWithSafeData() {
    console.log("📊 [STORAGE] Mise à jour avec les vraies données du modal");

    try {
      // 1. Récupérer le vrai nombre d'archives selon l'onglet actuel
      let realArchiveCount = 0;
      let realEstimatedSize = 0;

      if (this.archivesManager) {
        if (
          this.archivesManager.selectedTab === "all" &&
          this.archivesManager.allCombinedArchives
        ) {
          realArchiveCount = this.archivesManager.allCombinedArchives.length;
          realEstimatedSize = this.archivesManager.allCombinedArchives.reduce(
            (total, archive) => {
              return total + this.estimateArchiveSize(archive);
            },
            0
          );
        } else if (this.archivesManager.allArchives) {
          realArchiveCount = this.archivesManager.allArchives.length;
          realEstimatedSize = this.archivesManager.allArchives.reduce(
            (total, archive) => {
              return total + this.estimateArchiveSize(archive);
            },
            0
          );
        }
      }

      // 2. Si pas de données locales, récupérer depuis l'API
      if (realArchiveCount === 0) {
        try {
          console.log(
            "📊 [STORAGE] Récupération des vraies données depuis l'API..."
          );

          // Récupérer tous les types d'archives
          const promises = [
            fetch("/api/archives?action_type=suppression&limit=9999").then(
              (r) => r.json()
            ),
            fetch("/api/archives?action_type=livraison&limit=9999").then((r) =>
              r.json()
            ),
            fetch(
              "/api/archives?action_type=mise_en_livraison&limit=9999"
            ).then((r) => r.json()),
            fetch(
              "/api/archives?action_type=ordre_livraison_etabli&limit=9999"
            ).then((r) => r.json()),
          ];

          const [
            suppressionData,
            livraisonData,
            miseEnLivraisonData,
            ordreData,
          ] = await Promise.all(promises);

          // Compter toutes les archives
          realArchiveCount =
            (suppressionData.success ? suppressionData.archives.length : 0) +
            (livraisonData.success ? livraisonData.archives.length : 0) +
            (miseEnLivraisonData.success
              ? miseEnLivraisonData.archives.length
              : 0) +
            (ordreData.success ? ordreData.archives.length : 0);

          // Calculer la taille estimée
          const allArchives = [
            ...(suppressionData.success ? suppressionData.archives : []),
            ...(livraisonData.success ? livraisonData.archives : []),
            ...(miseEnLivraisonData.success
              ? miseEnLivraisonData.archives
              : []),
            ...(ordreData.success ? ordreData.archives : []),
          ];

          realEstimatedSize = allArchives.reduce((total, archive) => {
            return total + this.estimateArchiveSize(archive);
          }, 0);

          console.log(
            `📊 [STORAGE] Données API: ${realArchiveCount} archives, ${realEstimatedSize.toFixed(
              1
            )} MB`
          );
        } catch (apiError) {
          console.error(
            "❌ [STORAGE] Erreur API, utilisation des données par défaut",
            apiError
          );
          realArchiveCount = 10; // Valeur par défaut
          realEstimatedSize = 5.0; // 5 MB par défaut
        }
      }

      const totalCapacity = 10240; // 10 GB en MB
      const usedPercent = Math.min(
        (realEstimatedSize / totalCapacity) * 100,
        100
      );
      const availableSize = totalCapacity - realEstimatedSize;

      // Vérifier que le modal est bien visible
      const modalElement = document.getElementById("storageModal");
      if (!modalElement || !modalElement.classList.contains("show")) {
        console.warn("⚠️ [STORAGE] Modal non visible, arrêt de la mise à jour");
        return;
      }

      // Mise à jour avec les vraies données
      const updates = [
        { id: "totalArchiveCount", value: realArchiveCount.toString() },
        { id: "totalUsedStorage", value: `${realEstimatedSize.toFixed(1)} MB` },
        {
          id: "totalAvailableStorage",
          value: `${availableSize.toFixed(1)} MB`,
        },
        { id: "totalStorageCapacity", value: "10.0 GB" },
        { id: "storagePercentage", value: `${usedPercent.toFixed(1)}%` },
        { id: "chartCenterValue", value: `${usedPercent.toFixed(0)}%` },
        { id: "lastUpdateTime", value: new Date().toLocaleString("fr-FR") },
      ];

      let successCount = 0;
      updates.forEach((update) => {
        if (this.safeUpdateElement(update.id, update.value)) {
          successCount++;
        }
      });

      // Mise à jour de la barre de progression avec vérification
      const progressBar = document.getElementById("storageProgressBar");
      if (progressBar) {
        progressBar.style.width = `${usedPercent}%`;
        progressBar.setAttribute("aria-valuenow", usedPercent);

        // Couleur selon le niveau
        if (usedPercent > 90) {
          progressBar.style.background =
            "linear-gradient(90deg, #ef4444, #dc2626)";
        } else if (usedPercent > 75) {
          progressBar.style.background =
            "linear-gradient(90deg, #f59e0b, #d97706)";
        } else {
          progressBar.style.background =
            "linear-gradient(90deg, #10b981, #059669)";
        }
        successCount++;
      }

      console.log(
        `✅ [STORAGE] ${successCount}/${
          updates.length + 1
        } éléments mis à jour avec succès`
      );
      console.log(
        `📊 [STORAGE] Vraies données: ${realArchiveCount} archives, ${realEstimatedSize.toFixed(
          1
        )} MB utilisés`
      );
    } catch (error) {
      console.error(
        "❌ [STORAGE] Erreur lors de la mise à jour avec vraies données:",
        error
      );
    }
  }

  // 🔧 MÉTHODE UTILITAIRE: Mise à jour sécurisée d'un élément000
  safeUpdateElement(elementId, value) {
    try {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value;
        console.log(`✅ Élément ${elementId} mis à jour: ${value}`);
        return true;
      } else {
        console.warn(`⚠️ Élément ${elementId} non trouvé dans le DOM`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour de ${elementId}:`, error);
      return false;
    }
  } // 🔧 NOUVELLE MÉTHODE: Nettoyer le backdrop du modal
  cleanupModalBackdrop() {
    // Supprimer tous les backdrops existants
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => {
      backdrop.remove();
    });

    // S'assurer que la classe modal-open est retirée du body
    document.body.classList.remove("modal-open");

    // Remettre le scroll du body
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";

    console.log("🧹 [STORAGE] Backdrop nettoyé");
  }

  async calculateStorageData() {
    try {
      console.log("🔄 [STORAGE] Calcul des données de stockage...");

      // FORCER l'utilisation des vraies données depuis resp_liv.html
      console.log(
        "✅ [STORAGE] Utilisation des vraies données depuis resp_liv.html"
      );
      await this.processRealArchiveData();
    } catch (error) {
      console.error("❌ [STORAGE] Erreur lors du calcul:", error);
      await this.calculateLocalStats();
    }
  }

  // Méthode pour récupérer les statistiques du serveur
  async fetchServerStats() {
    try {
      console.log("📊 Récupération des statistiques serveur...");

      // Simulation temporaire de données serveur pour test
      const simulatedStats = {
        summary: {
          total_storage_size: 15728640, // 15 MB
          total_storage_formatted: "15.0 MB",
          archives_size: 12582912, // 12 MB
          archives_formatted: "12.0 MB",
          uploads_size: 3145728, // 3 MB
          uploads_formatted: "3.0 MB",
          total_archives_count: 42,
          uploads_count: 15,
          estimated_monthly_growth: 1048576, // 1 MB/mois
        },
        by_type: [
          {
            action_type: "livraison",
            count: 25,
            size_bytes: 8388608,
            size_formatted: "8.0 MB",
            oldest_date: "2025-01-01T00:00:00Z",
            newest_date: "2025-08-20T00:00:00Z",
          },
          {
            action_type: "suppression",
            count: 10,
            size_bytes: 2097152,
            size_formatted: "2.0 MB",
            oldest_date: "2025-02-01T00:00:00Z",
            newest_date: "2025-08-15T00:00:00Z",
          },
          {
            action_type: "mise_en_livraison",
            count: 5,
            size_bytes: 1572864,
            size_formatted: "1.5 MB",
            oldest_date: "2025-03-01T00:00:00Z",
            newest_date: "2025-08-10T00:00:00Z",
          },
          {
            action_type: "ordre_livraison_etabli",
            count: 2,
            size_bytes: 524288,
            size_formatted: "512 KB",
            oldest_date: "2025-07-01T00:00:00Z",
            newest_date: "2025-08-05T00:00:00Z",
          },
        ],
        monthly_stats: [
          {
            month: "2025-08-01T00:00:00Z",
            count: 8,
            size_bytes: 2097152,
            size_formatted: "2.0 MB",
          },
          {
            month: "2025-07-01T00:00:00Z",
            count: 12,
            size_bytes: 3145728,
            size_formatted: "3.0 MB",
          },
        ],
        top_largest: [
          {
            id: 1,
            dossier_reference: "DOS-2025-001",
            client_name: "Client Premium",
            action_type: "livraison",
            size_bytes: 1048576,
            size_formatted: "1.0 MB",
            archived_at: "2025-08-20T10:30:00Z",
          },
        ],
        generated_at: new Date().toISOString(),
      };

      // Tentative de vraie récupération avec fallback
      try {
        const response = await fetch("/api/storage-stats");

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log("✅ Données serveur récupérées avec succès");
            return result.data;
          }
        }
      } catch (serverError) {
        console.warn(
          "⚠️ Serveur non disponible, utilisation des données simulées"
        );
      }

      console.log("📊 Utilisation des données simulées pour démonstration");
      return simulatedStats;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des statistiques serveur:",
        error
      );
      return null;
    }
  }

  // Traitement des statistiques serveur
  processServerStats(stats) {
    // Si les stats serveur ne sont pas disponibles ou sont simulées, utiliser les vraies données locales
    if (!stats || this.isSimulatedData(stats)) {
      this.processRealArchiveData();
      return;
    }

    // Mettre à jour les éléments de l'interface avec les vraies données serveur (si ils existent)
    const totalStorageEl = document.getElementById("totalStorageSize");
    if (totalStorageEl) {
      totalStorageEl.textContent = stats.summary.total_storage_formatted;
    }

    const archivesCountEl = document.getElementById("archivesCount");
    if (archivesCountEl) {
      archivesCountEl.textContent =
        stats.summary.total_archives_count.toLocaleString();
    }

    const uploadsSizeEl = document.getElementById("uploadsSize");
    if (uploadsSizeEl) {
      uploadsSizeEl.textContent = stats.summary.uploads_formatted;
    }

    const uploadsCountEl = document.getElementById("uploadsCount");
    if (uploadsCountEl) {
      uploadsCountEl.textContent = stats.summary.uploads_count.toLocaleString();
    }

    // Calculer le pourcentage d'utilisation (capacité par défaut: 1GB)
    const usagePercent =
      (stats.summary.total_storage_size /
        (this.storageCapacity * 1024 * 1024)) *
      100;
    document.getElementById("storageUsagePercent").textContent =
      Math.min(100, usagePercent).toFixed(1) + "%";

    // Mettre à jour la barre de progression
    const progressBar = document.getElementById("storageProgressBar");
    if (progressBar) {
      progressBar.style.width = Math.min(100, usagePercent) + "%";
      progressBar.className = `progress-bar ${
        usagePercent > 80
          ? "bg-danger"
          : usagePercent > 60
          ? "bg-warning"
          : "bg-success"
      }`;
    }

    // Mettre à jour le tableau des types avec les vraies données serveur
    this.updateTypeTable(stats.by_type);

    // Mettre à jour les détails par type avec les vraies données serveur
    this.updateStorageDetails(stats.by_type);

    // Mettre à jour les graphiques avec les vraies données
    this.chartData = stats;

    // Prédiction de croissance
    const monthlyGrowth = stats.summary.estimated_monthly_growth;
    const currentSize = stats.summary.total_storage_size;
    const capacity = this.storageCapacity * 1024 * 1024; // en bytes

    if (monthlyGrowth > 0) {
      const monthsUntilFull = Math.ceil(
        (capacity - currentSize) / monthlyGrowth
      );
      document.getElementById("growthPrediction").textContent =
        monthsUntilFull > 0 ? `${monthsUntilFull} mois` : "Capacité dépassée";
    } else {
      document.getElementById("growthPrediction").textContent =
        "Croissance stable";
    }
  }

  // Vérifier si les données sont simulées
  isSimulatedData(stats) {
    return stats && stats.summary && stats.summary.total_archives_count === 42; // Valeur simulée caractéristique
  }

  // Traitement des vraies données d'archives locales avec données en temps réel
  async processRealArchiveData() {
    console.log("📊 Utilisation des vraies données d'archives + temps réel");

    // 1. Récupérer les vraies données de capacité de la base de données
    let realDatabaseInfo = null;
    try {
      const dbResponse = await fetch("/api/database/capacity");
      if (dbResponse.ok) {
        realDatabaseInfo = await dbResponse.json();
        console.log(
          "✅ [STORAGE] Vraies données DB récupérées:",
          realDatabaseInfo
        );

        // Mettre à jour la capacité avec les vraies données
        this.realCapacity = Math.round(
          realDatabaseInfo.database.total_capacity_bytes / (1024 * 1024)
        );
        this.storageCapacity = this.realCapacity;

        console.log(
          `📊 [STORAGE] Capacité mise à jour: ${this.realCapacity} MB (${realDatabaseInfo.render_info.estimated_plan})`
        );
      }
    } catch (error) {
      console.error("❌ [STORAGE] Erreur récupération données DB:", error);
    }

    // 2. Récupérer les archives réelles selon l'onglet actuel
    let archives;

    // 🎯 NOUVEAU: Utiliser les bonnes données selon l'onglet actuel
    // 🔧 CORRECTION: Vérifier que archivesManager existe avant d'y accéder
    if (!this.archivesManager) {
      console.warn(
        "⚠️ [STORAGE] ArchivesManager non disponible, utilisation de données par défaut"
      );
      archives = [];
    } else if (
      this.archivesManager.selectedTab === "all" &&
      this.archivesManager.allCombinedArchives &&
      this.archivesManager.allCombinedArchives.length > 0
    ) {
      archives = this.archivesManager.allCombinedArchives;
      console.log(
        `📊 [STORAGE] Utilisation des archives combinées (onglet "Toutes les Archives"): ${archives.length} archives`
      );
    } else if (this.archivesManager.allArchives) {
      archives = this.archivesManager.allArchives;
      console.log(
        `📊 [STORAGE] Utilisation des archives standard (onglet "${
          this.archivesManager.selectedTab || "unknown"
        }"): ${archives.length} archives`
      );
    } else {
      console.warn("⚠️ [STORAGE] Aucunes archives disponibles");
      archives = [];
    }

    // 3. Récupérer les données en temps réel depuis les différentes sources
    const realTimeData = await this.fetchRealTimeData();

    // Calculer les vraies statistiques par type
    let realStats = {
      suppression: { count: 0, size: 0, archives: [] },
      livraison: { count: 0, size: 0, archives: [] },
      mise_en_livraison: {
        count: realTimeData.mise_en_livraison || 0,
        size: 0,
        archives: [],
      },
      ordre_livraison_etabli: {
        count: realTimeData.ordres_livraison || 0,
        size: 0,
        archives: [],
      },
    };

    let totalSize = 0;
    let totalCount = archives.length;

    // 🎯 NOUVEAU: Si on n'est pas sur l'onglet "all", filtrer pour ne montrer que le type actuel
    let archivesToProcess = archives;

    // 🔧 CORRECTION: Vérifier que archivesManager existe avant d'accéder à selectedTab
    if (this.archivesManager && this.archivesManager.selectedTab !== "all") {
      // Mapper l'onglet au type d'action
      const tabToActionMap = {
        deleted: "suppression",
        delivered: "livraison",
        shipping: "mise_en_livraison",
        orders: "ordre_livraison_etabli",
      };

      const targetActionType = tabToActionMap[this.archivesManager.selectedTab];
      if (targetActionType) {
        archivesToProcess = archives.filter(
          (archive) => archive.action_type === targetActionType
        );
        totalCount = archivesToProcess.length;
        console.log(
          `📊 [STORAGE] Filtrage pour onglet "${this.archivesManager.selectedTab}" (${targetActionType}): ${totalCount} archives`
        );

        // Réinitialiser les stats pour ne montrer que le type actuel
        realStats = {
          suppression: { count: 0, size: 0, archives: [] },
          livraison: { count: 0, size: 0, archives: [] },
          mise_en_livraison: { count: 0, size: 0, archives: [] },
          ordre_livraison_etabli: { count: 0, size: 0, archives: [] },
        };
      }
    }

    // Calculer les données des archives
    archivesToProcess.forEach((archive) => {
      const archiveSize = this.estimateArchiveSize(archive);
      const actionType = archive.action_type;

      if (realStats[actionType]) {
        // Pour mise_en_livraison et ordre_livraison_etabli, on utilise les comptes réels quand on est sur "all"
        // 🔧 CORRECTION: Vérifier que archivesManager existe avant d'accéder à selectedTab
        if (
          this.archivesManager &&
          this.archivesManager.selectedTab === "all"
        ) {
          if (
            actionType !== "mise_en_livraison" &&
            actionType !== "ordre_livraison_etabli"
          ) {
            realStats[actionType].count++;
          }
        } else {
          // Pour les onglets spécifiques, on compte normalement
          realStats[actionType].count++;
        }

        realStats[actionType].size += archiveSize;
        realStats[actionType].archives.push(archive);
      }

      totalSize += archiveSize;
    });

    console.log("📊 Données temps réel récupérées:", realTimeData);
    console.log("📊 Statistiques finales:", realStats);

    // *** MISE À JOUR DE L'INTERFACE PRINCIPALE AVEC LES VRAIES DONNÉES ***
    this.updateStorageInterface(totalSize, totalCount, realStats);

    // Mise à jour des autres éléments spécifiques (si ils existent)
    const totalSizeMB = totalSize;
    const totalSizeFormatted = this.formatBytes(totalSizeMB * 1024 * 1024);

    const totalStorageEl = document.getElementById("totalStorageSize");
    if (totalStorageEl) {
      totalStorageEl.textContent = totalSizeFormatted;
    }

    const archivesCountEl = document.getElementById("archivesCount");
    if (archivesCountEl) {
      archivesCountEl.textContent = totalCount.toLocaleString();
    }

    const uploadsSizeEl = document.getElementById("uploadsSize");
    if (uploadsSizeEl) {
      uploadsSizeEl.textContent = "Calcul en cours...";
    }

    const uploadsCountEl = document.getElementById("uploadsCount");
    if (uploadsCountEl) {
      uploadsCountEl.textContent = "N/A";
    }

    // Calculer le pourcentage d'utilisation avec la vraie capacité
    const usagePercent = (totalSizeMB / this.storageCapacity) * 100;
    const storageUsageEl = document.getElementById("storageUsagePercent");
    if (storageUsageEl) {
      storageUsageEl.textContent = Math.min(100, usagePercent).toFixed(1) + "%";
    }

    // Mettre à jour la barre de progression
    const progressBar = document.getElementById("storageProgressBar");
    if (progressBar) {
      progressBar.style.width = Math.min(100, usagePercent) + "%";
      progressBar.className = `progress-bar ${
        usagePercent > 80
          ? "bg-danger"
          : usagePercent > 60
          ? "bg-warning"
          : "bg-success"
      }`;
    }

    // Mettre à jour les détails par type avec les vraies données
    this.updateRealStorageDetails(realStats);

    // Mettre à jour le tableau des types avec les vraies données
    this.updateRealTypeTable(realStats);

    const growthPredictionEl = document.getElementById("growthPrediction");
    if (growthPredictionEl) {
      growthPredictionEl.textContent = "Basé sur données réelles";
    }

    console.log(
      `📊 [STORAGE] Interface mise à jour - Utilisé: ${totalSize.toFixed(
        1
      )} MB / Total: ${(this.storageCapacity / 1024).toFixed(1)} GB`
    );
  }

  // Récupérer les données en temps réel depuis les différentes sources
  async fetchRealTimeData() {
    const realTimeData = {
      mise_en_livraison: 0,
      ordres_livraison: 0,
      dossiers_actifs: 0,
    };

    try {
      // 1. Récupérer les vrais dossiers mis en livraison depuis localStorage
      // C'est la source de vérité selon l'utilisateur - onglet "Mis en Livraison"
      const dossiersMisEnLiv = await fetch("/deliveries/status");
      if (dossiersMisEnLiv.ok) {
        const deliveriesData = await dossiersMisEnLiv.json();
        if (deliveriesData.success && deliveriesData.deliveries) {
          // Compter EXACTEMENT comme resp_liv.html :
          // 1. Dossiers avec status "mise_en_livraison_acconier"
          // 2. MAIS EXCLURE ceux qui ont le statut "Livré"
          const miseEnLivraisonDossiers = deliveriesData.deliveries.filter(
            (delivery) => {
              // Doit avoir le bon statut de base
              const hasCorrectStatus =
                delivery.delivery_status_acconier ===
                "mise_en_livraison_acconier";

              // Vérifier si le dossier n'est PAS livré
              let isNotDelivered = true;
              if (delivery.bl_statuses) {
                // Vérifier tous les statuts des conteneurs
                const statuses = Object.values(delivery.bl_statuses);
                isNotDelivered = !statuses.some(
                  (status) => status === "livre" || status === "livré"
                );
              }

              // Inclure seulement si: bon statut ET pas livré
              return hasCorrectStatus && isNotDelivered;
            }
          );

          realTimeData.mise_en_livraison = miseEnLivraisonDossiers.length;
          console.log(
            `📊 Dossiers en mise en livraison (SANS les livrés): ${realTimeData.mise_en_livraison}`
          );
          console.log(
            `🔍 DEBUG: Total dossiers API: ${deliveriesData.deliveries.length}`
          );
          console.log(
            `🔍 DEBUG: Avec status mise_en_livraison_acconier: ${
              deliveriesData.deliveries.filter(
                (d) =>
                  d.delivery_status_acconier === "mise_en_livraison_acconier"
              ).length
            }`
          );
          console.log(
            `🔍 DEBUG: Final après exclusion des livrés: ${miseEnLivraisonDossiers.length}`
          );
        }
        console.log(
          `� Dossiers mis en livraison depuis localStorage: ${realTimeData.mise_en_livraison}`
        );
      } else {
        console.log(
          "⚠️ Erreur lors de la récupération des dossiers depuis resp_liv API"
        );
      }

      // 2. Récupérer les dossiers actifs depuis l'API deliveries/status comme backup
      const deliveriesResponse = await fetch("/deliveries/status");
      if (deliveriesResponse.ok) {
        const deliveriesData = await deliveriesResponse.json();
        if (deliveriesData.success && deliveriesData.deliveries) {
          // Compter tous les dossiers actifs (non archivés)
          realTimeData.dossiers_actifs = deliveriesData.deliveries.filter(
            (d) => !d.archived && !d.is_archived
          ).length;

          // Si pas de données localStorage, utiliser l'API comme fallback
          if (realTimeData.mise_en_livraison === 0) {
            realTimeData.mise_en_livraison = realTimeData.dossiers_actifs;
            console.log(
              `📊 Utilisation API comme fallback: ${realTimeData.mise_en_livraison} dossiers`
            );
          }
        }
      }

      // 3. Récupérer les ordres de livraison depuis l'API archives (comme pour mise_en_livraison)
      try {
        const ordresResponse = await fetch(
          "/api/archives?action_type=ordre_livraison_etabli"
        );
        if (ordresResponse.ok) {
          const ordresData = await ordresResponse.json();
          if (ordresData.success && ordresData.total !== undefined) {
            realTimeData.ordres_livraison = ordresData.total;
            console.log(
              `📊 Ordres de livraison depuis API archives: ${realTimeData.ordres_livraison}`
            );
          } else if (ordresData.archives) {
            realTimeData.ordres_livraison = ordresData.archives.length;
            console.log(
              `📊 Ordres de livraison comptés: ${realTimeData.ordres_livraison}`
            );
          }
        } else {
          console.log(
            "⚠️ Erreur lors de la récupération des ordres de livraison"
          );
        }
      } catch (apiError) {
        console.warn("⚠️ API ordres de livraison non disponible");
      }

      console.log("✅ Données temps réel récupérées:", realTimeData);
      return realTimeData;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des données temps réel:",
        error
      );
      return realTimeData;
    }
  }

  // Formatter les bytes en format lisible
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Mettre à jour les détails par type avec les vraies données
  updateRealStorageDetails(realStats) {
    const container = document.getElementById("storageDetailsContainer");
    if (!container) return;

    console.log("🔄 updateRealStorageDetails appelée avec:", realStats);
    console.log(
      "🔍 mise_en_livraison count:",
      realStats.mise_en_livraison?.count
    );

    const typeLabels = {
      livraison: "Dossiers Livrés",
      suppression: "Dossiers Supprimés",
      mise_en_livraison: "Mise en Livraison",
      ordre_livraison_etabli: "Ordres de Livraison",
    };

    const typeColors = {
      livraison: "#10b981",
      suppression: "#ef4444",
      mise_en_livraison: "#f59e0b",
      ordre_livraison_etabli: "#3b82f6",
    };

    container.innerHTML = Object.entries(realStats)
      .map(([type, data]) => {
        const label = typeLabels[type] || type;
        const color = typeColors[type] || "#6b7280";
        const percentage =
          realStats.livraison.count > 0
            ? ((data.count / realStats.livraison.count) * 100).toFixed(1)
            : 0;

        return `
        <div class="col-md-3 mb-3">
          <div class="card h-100" style="border: 2px solid ${color}20; border-radius: 12px; background: ${color}05;">
            <div class="card-body text-center p-3">
              <div style="color: ${color}; font-size: 2.2em; font-weight: 700; margin-bottom: 8px;">
                ${data.count}
              </div>
              <div style="color: #374151; font-weight: 600; margin-bottom: 8px;">${label}</div>
              <div style="color: #6b7280; font-size: 0.85em; margin-bottom: 8px;">
                ${this.formatBytes(data.size * 1024 * 1024)}
              </div>
              <div class="progress" style="height: 6px; background: ${color}20;">
                <div class="progress-bar" style="background: ${color}; width: ${percentage}%"></div>
              </div>
              <small style="color: #9ca3af; margin-top: 4px; display: block;">
                ${
                  data.archives.length > 0
                    ? `Dernière: ${new Date(
                        data.archives[data.archives.length - 1].archived_at
                      ).toLocaleDateString()}`
                    : "Aucune archive"
                }
              </small>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // Mettre à jour le tableau des types avec les vraies données
  updateRealTypeTable(realStats) {
    const tableBody = document.querySelector("#typeStatsTable tbody");
    if (!tableBody) return;

    const typeLabels = {
      livraison: "Dossiers Livrés",
      suppression: "Dossiers Supprimés",
      mise_en_livraison: "Mise en Livraison",
      ordre_livraison_etabli: "Ordres de Livraison",
    };

    tableBody.innerHTML = Object.entries(realStats)
      .filter(([type, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([type, data]) => {
        const label = typeLabels[type] || type;
        const newestArchive =
          data.archives.length > 0
            ? data.archives.reduce((newest, archive) =>
                new Date(archive.archived_at) > new Date(newest.archived_at)
                  ? archive
                  : newest
              )
            : null;

        return `
          <tr>
            <td><span class="badge bg-primary">${label}</span></td>
            <td><strong>${data.count}</strong></td>
            <td>${this.formatBytes(data.size * 1024 * 1024)}</td>
            <td><small>${
              newestArchive
                ? new Date(newestArchive.archived_at).toLocaleDateString()
                : "N/A"
            }</small></td>
          </tr>
        `;
      })
      .join("");

    // Si le tableau est vide, ajouter un message
    if (Object.values(realStats).every((data) => data.count === 0)) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted py-4">
            <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
            Aucune archive trouvée
          </td>
        </tr>
      `;
    }
  }

  // Calculs locaux en fallback
  async calculateLocalStats() {
    try {
      // 🔧 CORRECTION: Vérifier que archivesManager existe avant d'accéder à allArchives
      if (!this.archivesManager || !this.archivesManager.allArchives) {
        console.warn(
          "⚠️ [STORAGE] ArchivesManager ou allArchives non disponible pour calculateLocalStats"
        );
        // Utiliser des données par défaut
        this.updateStorageInterface(0, 0, {
          suppression: { count: 0, size: 0, archives: [] },
          livraison: { count: 0, size: 0, archives: [] },
          mise_en_livraison: { count: 0, size: 0, archives: [] },
          ordre_livraison_etabli: { count: 0, size: 0, archives: [] },
        });
        return;
      }

      // Récupérer toutes les archives
      const archives = this.archivesManager.allArchives;

      // Calculer la taille de chaque type d'archive
      const storageByType = {
        suppression: { count: 0, size: 0 },
        livraison: { count: 0, size: 0 },
        mise_en_livraison: { count: 0, size: 0 },
        ordre_livraison_etabli: { count: 0, size: 0 },
      };

      let totalSize = 0;
      let totalCount = 0;

      archives.forEach((archive) => {
        // Estimer la taille de l'archive basée sur son contenu
        const archiveSize = this.estimateArchiveSize(archive);
        const actionType = archive.action_type;

        if (storageByType[actionType]) {
          storageByType[actionType].count++;
          storageByType[actionType].size += archiveSize;
        }

        totalSize += archiveSize;
        totalCount++;
      });

      // Mettre à jour l'interface avec les calculs locaux
      this.updateStorageInterface(totalSize, totalCount, storageByType);
      this.updateStorageDetails(storageByType);

      // Ajouter à l'historique
      this.addToHistory(`Calcul local: ${totalSize.toFixed(2)} MB utilisés`);

      console.log(
        `✅ [STORAGE] ${totalSize.toFixed(
          2
        )} MB calculés pour ${totalCount} archives`
      );
    } catch (error) {
      console.error("❌ [STORAGE] Erreur lors du calcul:", error);
    }
  }

  // Mettre à jour le tableau des types avec les données serveur
  updateTypeTable(typeStats) {
    const tableBody = document.querySelector("#typeStatsTable tbody");
    if (!tableBody) return;

    tableBody.innerHTML = typeStats
      .map(
        (type) => `
      <tr>
        <td><span class="badge bg-primary">${type.action_type}</span></td>
        <td>${type.count.toLocaleString()}</td>
        <td>${type.size_formatted}</td>
        <td><small>${new Date(
          type.newest_date
        ).toLocaleDateString()}</small></td>
      </tr>
    `
      )
      .join("");
  }

  estimateArchiveSize(archive) {
    // Estimation RÉALISTE de la taille d'une archive en MB
    let size = 0;

    // 🔧 TAILLE DE BASE PLUS RÉALISTE
    size += 0.1; // 100 KB pour les métadonnées de base (au lieu de 10 KB)

    // Taille basée sur le contenu des données
    if (archive.dossier_data) {
      const dataString = JSON.stringify(archive.dossier_data);
      size += (dataString.length / (1024 * 1024)) * 2; // Facteur x2 pour les données complexes
    }

    // Taille basée sur les métadonnées
    if (archive.metadata) {
      const metaString = JSON.stringify(archive.metadata);
      size += (metaString.length / (1024 * 1024)) * 1.5; // Facteur x1.5 pour les métadonnées
    }

    // 🔧 FACTEURS MULTIPLICATEURS PLUS RÉALISTES
    const typeSizeFactors = {
      livraison: 2.5, // Les dossiers livrés contiennent plus de données (documents, statuts, etc.)
      mise_en_livraison: 2.0, // Données intermédiaires importantes
      ordre_livraison_etabli: 1.8, // Ordres avec détails et références
      suppression: 1.2, // Même supprimés, ils gardent des données importantes
    };

    const factor = typeSizeFactors[archive.action_type] || 1.5;
    size *= factor;

    // 🔧 TAILLE MINIMUM PLUS RÉALISTE
    // Chaque archive doit faire au minimum 0.3 MB (300 KB) - taille réaliste pour un dossier
    return Math.max(size, 0.3);
  }

  async updateStorageInterface(
    totalSize = null,
    totalCount = null,
    storageByType = null
  ) {
    // Si pas de données fournies, utiliser les dernières données calculées
    if (totalSize === null || totalCount === null || storageByType === null) {
      console.log(
        "📊 [STORAGE] Mise à jour de l'interface avec la nouvelle capacité"
      );
      // Si nous n'avons pas de données, ne pas mettre à jour l'interface pour le moment
      return;
    }

    try {
      // Récupérer les vraies données de capacité depuis l'API
      const response = await fetch("/api/database/capacity");
      const capacityData = await response.json();

      if (capacityData && capacityData.database) {
        // Utiliser les vraies données de la base de données
        const totalCapacityGB = capacityData.database.total_capacity_formatted;
        const availableGB = capacityData.database.available_space_formatted;

        // Mise à jour avec les vraies données
        // 🔧 CORRECTION: Vérifier que les éléments existent avant de modifier leur contenu
        const totalUsedEl = document.getElementById("totalUsedStorage");
        if (totalUsedEl) {
          totalUsedEl.textContent = `${totalSize.toFixed(1)} MB`;
        } else {
          console.warn("⚠️ [STORAGE] Élément 'totalUsedStorage' non trouvé");
        }

        const totalAvailableEl = document.getElementById(
          "totalAvailableStorage"
        );
        if (totalAvailableEl) {
          totalAvailableEl.textContent = availableGB;
        } else {
          console.warn(
            "⚠️ [STORAGE] Élément 'totalAvailableStorage' non trouvé"
          );
        }

        // Afficher la vraie capacité totale
        const totalCapacityEl = document.getElementById("totalStorageCapacity");
        if (totalCapacityEl) {
          totalCapacityEl.textContent = totalCapacityGB;
        }

        // Calculer le pourcentage basé sur les vraies données
        const totalCapacityBytes = capacityData.database.total_capacity_bytes;
        const usedPercent = Math.min(
          ((totalSize * 1024 * 1024) / totalCapacityBytes) * 100,
          100
        );

        // Mise à jour sécurisée des éléments
        this.safeUpdateElement("totalArchiveCount", totalCount.toString());
        this.safeUpdateElement(
          "storagePercentage",
          `${usedPercent.toFixed(1)}%`
        );

        // Mise à jour du widget Render
        this.updateRenderWidget(capacityData);

        console.log(
          `✅ Capacité réelle affichée: ${totalCapacityGB} (${availableGB} disponible)`
        );
      } else {
        // Fallback vers l'ancien système si l'API échoue
        this.fallbackStorageDisplay(totalSize, totalCount, storageByType);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération de la capacité:", error);
      // Fallback vers l'ancien système
      this.fallbackStorageDisplay(totalSize, totalCount, storageByType);
    }
  }

  fallbackStorageDisplay(totalSize, totalCount, storageByType) {
    console.log("🔄 [STORAGE] Utilisation du système de fallback");

    try {
      // Méthode fallback utilisant l'ancien système
      const usedPercent = Math.min(
        (totalSize / this.storageCapacity) * 100,
        100
      );
      const availableSize = Math.max(this.storageCapacity - totalSize, 0);

      // Mise à jour sécurisée de tous les éléments
      this.safeUpdateElement("totalUsedStorage", `${totalSize.toFixed(1)} MB`);
      this.safeUpdateElement(
        "totalAvailableStorage",
        `${availableSize.toFixed(1)} MB`
      );
      this.safeUpdateElement(
        "totalStorageCapacity",
        `${(this.storageCapacity / 1024).toFixed(1)} GB`
      );
      this.safeUpdateElement("totalArchiveCount", totalCount.toString());
      this.safeUpdateElement("storagePercentage", `${usedPercent.toFixed(1)}%`);
      this.safeUpdateElement("chartCenterValue", `${usedPercent.toFixed(0)}%`);

      // Mise à jour de la barre de progression avec vérification
      const progressBar = document.getElementById("storageProgressBar");
      if (progressBar) {
        progressBar.style.width = `${usedPercent}%`;
        progressBar.setAttribute("aria-valuenow", usedPercent);

        // Couleur de la barre selon le niveau
        if (usedPercent > 90) {
          progressBar.style.background =
            "linear-gradient(90deg, #ef4444, #dc2626)";
        } else if (usedPercent > 75) {
          progressBar.style.background =
            "linear-gradient(90deg, #f59e0b, #d97706)";
        } else {
          progressBar.style.background =
            "linear-gradient(90deg, #10b981, #059669)";
        }
        console.log(`✅ Barre de progression mise à jour: ${usedPercent}%`);
      } else {
        console.warn(
          "⚠️ [STORAGE] Élément 'storageProgressBar' non trouvé dans fallback"
        );
      }

      // Mise à jour des détails par type
      this.updateStorageDetails(storageByType);

      // Mise à jour du timestamp
      this.safeUpdateElement(
        "lastUpdateTime",
        new Date().toLocaleString("fr-FR")
      );

      console.log(
        `✅ [STORAGE] Fallback terminé: ${totalCount} archives, ${totalSize.toFixed(
          1
        )} MB`
      );
    } catch (error) {
      console.error("❌ [STORAGE] Erreur dans fallbackStorageDisplay:", error);
    }
  }

  updateRenderWidget(capacityData) {
    try {
      // Mise à jour du type de plan
      const planTypeEl = document.getElementById("renderPlanType");
      if (planTypeEl && capacityData.render_info) {
        const isPayant = capacityData.render_info.is_paid_plan;
        planTypeEl.textContent = capacityData.render_info.estimated_plan;
        planTypeEl.className = isPayant
          ? "badge bg-success px-2 py-1"
          : "badge bg-warning px-2 py-1";
      }

      // Mise à jour de l'usage de la base de données
      const dbUsageEl = document.getElementById("renderDbUsage");
      if (dbUsageEl && capacityData.database) {
        const currentSize = capacityData.database.current_size_formatted;
        const totalSize = capacityData.database.total_capacity_formatted;
        dbUsageEl.textContent = `${currentSize} / ${totalSize}`;
      }

      // Mise à jour de la barre de progression
      const progressBarEl = document.getElementById("renderProgressBar");
      if (progressBarEl && capacityData.database) {
        const usagePercent = capacityData.database.usage_percentage || 0;
        progressBarEl.style.width = `${usagePercent}%`;
        progressBarEl.setAttribute("aria-valuenow", usagePercent);

        // Couleur de la barre selon l'usage
        if (usagePercent > 90) {
          progressBarEl.style.background =
            "linear-gradient(90deg, #ef4444, #dc2626)";
        } else if (usagePercent > 75) {
          progressBarEl.style.background =
            "linear-gradient(90deg, #f59e0b, #d97706)";
        } else {
          progressBarEl.style.background =
            "linear-gradient(90deg, #10b981, #059669)";
        }
      }

      // Mise à jour de la capacité totale
      const totalCapacityEl = document.getElementById("renderTotalCapacity");
      if (totalCapacityEl && capacityData.database) {
        totalCapacityEl.textContent =
          capacityData.database.total_capacity_formatted;
      }

      // Mise à jour de l'espace disponible
      const availableSpaceEl = document.getElementById("renderAvailableSpace");
      if (availableSpaceEl && capacityData.database) {
        availableSpaceEl.textContent =
          capacityData.database.available_space_formatted;
      }

      console.log("🎯 Widget Render mis à jour avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de la mise à jour du widget Render:",
        error
      );
    }
  }

  updateStorageDetails(typeStats) {
    const container = document.getElementById("storageDetailsContainer");
    if (!container) return;

    const typeLabels = {
      suppression: {
        name: "Dossiers Supprimés",
        icon: "fa-trash",
        color: "#ef4444",
      },
      livraison: {
        name: "Dossiers Livrés",
        icon: "fa-check-circle",
        color: "#10b981",
      },
      mise_en_livraison: {
        name: "Mise en Livraison",
        icon: "fa-shipping-fast",
        color: "#f59e0b",
      },
      ordre_livraison_etabli: {
        name: "Ordres de Livraison",
        icon: "fa-clipboard-list",
        color: "#3b82f6",
      },
    };

    // Si typeStats est un array (données serveur), le transformer en objet
    let statsObject = {};
    if (Array.isArray(typeStats)) {
      typeStats.forEach((stat) => {
        statsObject[stat.action_type] = {
          count: stat.count,
          size: stat.size_bytes / (1024 * 1024), // Convertir en MB
          newest_date: stat.newest_date,
        };
      });
    } else {
      // Format local déjà en objet
      statsObject = typeStats;
    }

    const maxCount = Math.max(
      ...Object.values(statsObject).map((s) => s.count),
      1
    );

    container.innerHTML = Object.entries(typeLabels)
      .map(([type, config]) => {
        const data = statsObject[type] || { count: 0, size: 0 };
        const percentage = ((data.count / maxCount) * 100).toFixed(1);

        return `
        <div class="col-md-3 mb-3">
          <div class="card h-100" style="border: 2px solid ${
            config.color
          }20; border-radius: 12px; background: ${config.color}05;">
            <div class="card-body text-center p-3">
              <div style="color: ${
                config.color
              }; font-size: 2.2em; font-weight: 700; margin-bottom: 8px;">
                ${data.count}
              </div>
              <div style="color: #374151; font-weight: 600; margin-bottom: 8px;">
                <i class="fas ${config.icon} me-2"></i>${config.name}
              </div>
              <div style="color: #6b7280; font-size: 0.85em; margin-bottom: 8px;">
                ${this.formatBytes(data.size * 1024 * 1024)}
              </div>
              <div class="progress" style="height: 6px; background: ${
                config.color
              }20;">
                <div class="progress-bar" style="background: ${
                  config.color
                }; width: ${percentage}%"></div>
              </div>
              <small style="color: #9ca3af; margin-top: 4px; display: block;">
                ${
                  data.newest_date
                    ? `Dernière: ${new Date(
                        data.newest_date
                      ).toLocaleDateString()}`
                    : "Aucune archive"
                }
              </small>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  createChart() {
    const canvas = document.getElementById("storageChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const totalUsed = parseFloat(
      document.getElementById("totalUsedStorage").textContent
    );
    const usedPercent = (totalUsed / this.storageCapacity) * 100;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 70;

    // Cercle de fond
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 12;
    ctx.stroke();

    // Arc de progression
    if (usedPercent > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (2 * Math.PI * usedPercent) / 100;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);

      // Couleur selon le niveau
      if (usedPercent > 90) {
        ctx.strokeStyle = "#ef4444";
      } else if (usedPercent > 75) {
        ctx.strokeStyle = "#f59e0b";
      } else {
        ctx.strokeStyle = "#10b981";
      }

      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  async refreshStorageData() {
    console.log("🔄 [STORAGE] Actualisation des données...");

    // Recharger les archives
    await this.archivesManager.loadArchives();

    // Recalculer le stockage
    await this.calculateStorageData();

    // Recréer le graphique
    this.createChart();

    this.addToHistory("Données de stockage actualisées");
  }

  async optimizeStorage() {
    console.log("🧹 [STORAGE] Optimisation du stockage...");

    // Simuler une optimisation (pourrait appeler une API côté serveur)
    this.addToHistory("Optimisation du stockage lancée");

    // Dans une vraie implémentation, cela pourrait:
    // - Compresser les anciennes archives
    // - Supprimer les doublons
    // - Nettoyer les métadonnées inutiles

    setTimeout(() => {
      this.addToHistory("Optimisation terminée - Espace récupéré");
      this.refreshStorageData();
    }, 2000);
  }

  addToHistory(message) {
    const timestamp = new Date().toLocaleTimeString("fr-FR");
    this.storageHistory.unshift({ time: timestamp, message });

    // Garder seulement les 10 dernières entrées
    if (this.storageHistory.length > 10) {
      this.storageHistory = this.storageHistory.slice(0, 10);
    }

    this.updateHistoryDisplay();
  }

  updateHistoryDisplay() {
    const container = document.getElementById("storageHistoryContainer");
    if (!container) return;

    if (this.storageHistory.length === 0) {
      container.innerHTML =
        '<div class="text-muted text-center">Aucune activité récente</div>';
      return;
    }

    const html = this.storageHistory
      .map(
        (entry) => `
      <div class="d-flex justify-content-between align-items-center py-1" style="border-bottom: 1px solid #f3f4f6;">
        <span style="font-size: 0.9em;">${entry.message}</span>
        <small class="text-muted">${entry.time}</small>
      </div>
    `
      )
      .join("");

    container.innerHTML = html;
  }

  // Méthode appelée quand une archive est ajoutée ou supprimée
  async updateStorageData() {
    console.log(
      "🔄 [STORAGE] Mise à jour des données suite à un changement d'archive"
    );

    // Si la modale est ouverte, mettre à jour en temps réel
    const modalElement = document.getElementById("storageModal");
    if (modalElement && modalElement.classList.contains("show")) {
      console.log("📊 [STORAGE] Modal ouvert, mise à jour en temps réel...");

      // Invalider le cache des données d'archives pour forcer le rechargement
      if (this.archivesManager) {
        this.archivesManager.allArchivesData = null;
        this.archivesManager.lastDataRefresh = 0;
      }

      // Mettre à jour le modal avec les nouvelles données
      await this.updateModalWithSafeData();
    } else {
      console.log(
        "📊 [STORAGE] Modal fermé, données mises à jour en arrière-plan"
      );
    }
  }
}

// Initialisation quand la page est chargée
document.addEventListener("DOMContentLoaded", function () {
  console.log("[INIT] Chargement de la page détecté");

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

  // TOUJOURS initialiser le gestionnaire de stockage (même sans ArchivesManager)
  console.log("[STORAGE] Initialisation forcée du StorageManager");
  window.storageManager = new StorageManager(window.archivesManager || null);
});
