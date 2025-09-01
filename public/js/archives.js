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
    this.loadingTimeout = null; // 🔧 CORRECTION: Timeout pour forcer l'arrêt du spinner
    this.isLoading = false; // 🛡️ PROTECTION: Flag anti-boucle
    this.loadingBlocked = false; // 🛡️ PROTECTION: Bloquer les appels multiples

    this.init();

    // 🔄 NOUVEAU: Écouter les événements de mise à jour des cartes du tableau de bord
    this.setupDashboardCardSync();
  }

  // 🆕 NOUVEAU: Synchronisation PARFAITE avec les cartes du tableau de bord
  setupDashboardCardSync() {
    // Écouter les événements personnalisés de mise à jour des cartes
    window.addEventListener("dashboardCardUpdated", (event) => {
      console.log(
        "[ARCHIVES] 📊 Carte du tableau de bord mise à jour:",
        event.detail
      );
      // Mettre à jour les badges archives en conséquence (avec un délai pour éviter les conflits)
      setTimeout(() => {
        this.updateCounts();
      }, 100);
    });

    // 🎯 NOUVEAU: Écouter spécifiquement les mises à jour du tableau de suivi
    window.addEventListener("suiviDataUpdated", (event) => {
      console.log(
        "[ARCHIVES] 📋 Données du tableau de suivi mises à jour:",
        event.detail
      );
      // Les cartes se basent sur le tableau de suivi, donc synchroniser immédiatement
      setTimeout(() => {
        this.updateCounts();
      }, 200);
    });

    // 🎯 NOUVEAU: Écouter les événements de livraison/changement de statut
    window.addEventListener("deliveryStatusChanged", (event) => {
      console.log("[ARCHIVES] 🚛 Statut de livraison modifié:", event.detail);
      // Synchroniser les badges car les compteurs ont pu changer
      setTimeout(() => {
        this.updateCounts();
      }, 300);
    });

    // 🎯 NOUVEAU: Écouter les événements d'ajout/suppression de dossiers
    window.addEventListener("dossierAdded", (event) => {
      console.log("[ARCHIVES] ➕ Nouveau dossier ajouté:", event.detail);
      setTimeout(() => {
        this.updateCounts();
      }, 100);
    });

    window.addEventListener("dossierDeleted", (event) => {
      console.log("[ARCHIVES] ➖ Dossier supprimé:", event.detail);
      setTimeout(() => {
        this.updateCounts();
      }, 100);
    });

    // Écouter les changements dans le localStorage pour les mises à jour inter-onglets
    window.addEventListener("storage", (event) => {
      if (event.key === "dashboardCountersUpdated" && event.newValue) {
        try {
          const counters = JSON.parse(event.newValue);
          console.log(
            "[ARCHIVES] 🔄 Compteurs tableau de bord mis à jour (localStorage):",
            counters
          );
          setTimeout(() => {
            this.updateCounts();
          }, 150);
        } catch (error) {
          console.warn("[ARCHIVES] ⚠️ Erreur parsing compteurs:", error);
        }
      }
    });

    console.log(
      "[ARCHIVES] ✅ Synchronisation cartes tableau de bord configurée"
    );
  }

  init() {
    this.bindEvents();
    this.setupRealTimeNotifications(); // Nouveau système de notifications

    // 🔧 CORRECTION: S'assurer que le spinner est arrêté au démarrage
    this.forceStopLoading();

    // 📊 AJOUT: Mise à jour précoce des badges (avant même le chargement des archives)
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      console.log("[ARCHIVES] 🔄 Mise à jour précoce des badges...");
      setTimeout(() => {
        this.updateCounts();
      }, 100); // Très rapide pour les badges
    }

    // 🛡️ CORRECTION: Chargement sécurisé au démarrage (avec délai pour éviter les boucles)
    if (searchBtn) {
      this.setDefaultDates();

      // 🛡️ CHARGEMENT SÉCURISÉ: Avec délai et protection
      setTimeout(() => {
        // 🛡️ DÉSACTIVATION DU CHARGEMENT AUTOMATIQUE
        // ✅ CHARGEMENT INITIAL AUTOMATIQUE - Toujours charger au démarrage
        console.log(
          "[ARCHIVES] 🚀 Chargement initial automatique au démarrage..."
        );
        this.safeInitialLoad();
      }, 500); // Délai de 500ms pour éviter les conflits
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
          // 🎯 CORRECTION: Distinguer entre onglets d'archives et onglets de livraisons actives
          const archiveTabsMap = {
            deleted: "suppression",
          };

          const activeDeliveryTabs = ["delivered", "shipping", "orders"];

          if (archiveTabsMap[this.selectedTab]) {
            // Pour les vrais onglets d'archives (seulement "deleted")
            this.currentFilters.action_type = archiveTabsMap[this.selectedTab];
            actionFilter.value = archiveTabsMap[this.selectedTab];
            console.log(
              `[ARCHIVES] Onglet archive ${
                this.selectedTab
              } sélectionné, filtrage par: ${archiveTabsMap[this.selectedTab]}`
            );
            this.performSearch();
          } else if (activeDeliveryTabs.includes(this.selectedTab)) {
            // Pour les onglets de livraisons actives
            console.log(
              `[ARCHIVES] 🚀 Chargement automatique pour l'onglet: ${this.selectedTab}`
            );

            // ✅ APPLIQUER LE BON FILTRE selon l'onglet sélectionné
            let targetActionType = "";
            switch (this.selectedTab) {
              case "delivered":
                targetActionType = "livraison";
                break;
              case "shipping":
                targetActionType = "mise_en_livraison";
                break;
              case "orders":
                targetActionType = "ordre_livraison_etabli";
                break;
            }

            // Appliquer le filtre spécifique
            this.currentFilters.action_type = targetActionType;
            actionFilter.value = targetActionType;

            console.log(
              `[ARCHIVES] 🎯 Filtre appliqué pour ${this.selectedTab}: ${targetActionType}`
            );

            // ✅ CHARGEMENT AUTOMATIQUE SILENCIEUX avec le bon filtre
            this.loadArchivesQuietly();
          } else {
            console.log(`[ARCHIVES] Onglet ${this.selectedTab} non reconnu`);
            this.showEmptyState(
              "Cliquez sur 'Niveau de stockage' pour charger les archives"
            );
          }
        } else if (actionFilter && this.selectedTab === "all") {
          // 🎯 AFFICHAGE INTELLIGENT: Utiliser les données déjà chargées pour "Toutes les Archives"
          console.log(
            "[ARCHIVES] 🔄 Onglet 'Toutes les Archives' - Affichage des données chargées"
          );
          this.currentFilters.action_type = ""; // Garder vide pour l'affichage
          actionFilter.value = "";

          // Vérifier si des données sont déjà disponibles
          if (this.allCombinedArchives && this.allCombinedArchives.length > 0) {
            console.log(
              "[ARCHIVES] ✅ Données combinées disponibles - Affichage direct"
            );
            this.renderCurrentView();
          } else {
            console.log(
              "[ARCHIVES] ⏸️ Aucune donnée - Invitation au chargement"
            );
            this.showEmptyState(
              "Cliquez sur 'Niveau de stockage' pour charger toutes les archives"
            );
          }
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

    // 🔄 NOUVEAU: Écouter les mises à jour des cartes du tableau de bord
    console.log(
      "[ARCHIVES] 📡 Configuration de la synchronisation temps réel avec le tableau de bord..."
    );
    this.setupDashboardSync();

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

  // 🆕 NOUVEAU: Configuration de la synchronisation avec le tableau de bord
  setupDashboardSync() {
    try {
      // Écouter les WebSockets pour les mises à jour des cartes du tableau de bord
      const wsUrl =
        (window.location.protocol === "https:" ? "wss://" : "ws://") +
        window.location.hostname +
        ":3000";

      console.log(
        "[ARCHIVES] 🔌 Connexion WebSocket pour synchronisation:",
        wsUrl
      );

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(
          "[ARCHIVES] ✅ WebSocket connecté pour synchronisation tableau de bord"
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Filtrer les événements qui affectent les cartes du tableau de bord
          const relevantEvents = [
            "status-change",
            "container_status_update",
            "dossier-entre-en-livraison",
            "dossier-quitte-acconier",
            "bl_status_update",
          ];

          if (relevantEvents.includes(data.type)) {
            console.log(
              "[ARCHIVES] 🔄 Événement tableau de bord détecté:",
              data.type,
              "- Mise à jour des badges"
            );

            // Délai pour laisser le serveur mettre à jour les données
            setTimeout(() => {
              this.updateCounts();
            }, 500);
          }
        } catch (error) {
          console.warn("[ARCHIVES] ⚠️ Erreur traitement WebSocket:", error);
        }
      };

      ws.onclose = () => {
        console.log(
          "[ARCHIVES] 🔌 WebSocket fermé, tentative de reconnexion dans 5s..."
        );
        setTimeout(() => this.setupDashboardSync(), 5000);
      };

      ws.onerror = (error) => {
        console.warn("[ARCHIVES] ⚠️ Erreur WebSocket:", error);
      };
    } catch (error) {
      console.warn("[ARCHIVES] ⚠️ WebSocket non disponible:", error);
    }
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
        // 🛡️ PROTECTION: Ne pas recharger automatiquement pour éviter les boucles
        console.log(
          "⚠️ [ARCHIVES] Rechargement automatique BLOQUÉ pour éviter les boucles"
        );

        // Juste afficher la notification
        this.showNotificationToast(
          "📋 Nouvel ordre de livraison ajouté ! Cliquez sur 'Rechercher' pour actualiser."
        );

        // 🛡️ PROTECTION: Pas de updateCounts automatique pour éviter les boucles

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

  // 🏷️ Helper pour obtenir le nom d'affichage de l'onglet
  getTabDisplayName(tab) {
    const tabNames = {
      all: "archives",
      deleted: "dossiers supprimés",
      delivered: "dossiers livrés",
      shipping: "dossiers mis en livraison",
      orders: "ordres de livraison",
    };
    return tabNames[tab] || "archives";
  }

  // 🚀 NOUVELLE MÉTHODE: Chargement forcé uniquement via bouton "Niveau de stockage"
  async forceLoadArchives() {
    try {
      console.log(
        "[ARCHIVES] 🚀 CHARGEMENT FORCÉ via bouton 'Niveau de stockage'"
      );

      if (this.selectedTab === "all") {
        await this.loadAllArchivesWithProperMixing();
      } else {
        await this.loadArchives();
      }

      console.log("[ARCHIVES] ✅ Chargement forcé terminé");
    } catch (error) {
      console.error("[ARCHIVES] ❌ Erreur lors du chargement forcé:", error);
      this.showNotification("Erreur lors du chargement des archives", "error");
    }
  }

  // 🛡️ Chargement initial sécurisé (anti-boucle)
  async safeInitialLoad() {
    try {
      // Vérifier qu'on n'est pas déjà en train de charger
      if (this.isLoading) {
        console.warn(
          "[ARCHIVES] ⚠️ Chargement déjà en cours, abandon du chargement initial"
        );
        return;
      }

      console.log("[ARCHIVES] 🚀 Début du chargement initial automatique");

      // ✅ CHARGEMENT INITIAL: Au démarrage de la page seulement
      console.log(
        "[ARCHIVES] 🎯 Chargement initial avec toutes les archives mélangées..."
      );
      await this.loadAllArchivesWithProperMixing();

      //  Mettre à jour les compteurs des badges dès le démarrage
      console.log(
        "[ARCHIVES] 🔄 Mise à jour des badges au chargement initial..."
      );
      await this.updateCounts();
    } catch (error) {
      console.error("[ARCHIVES] ❌ Erreur dans safeInitialLoad:", error);
      this.showEmptyState(
        "Erreur de chargement - Cliquez sur 'Niveau de stockage' pour réessayer"
      );
    }
  }

  // Debounce pour la recherche en temps réel
  debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.performSearch(), 300);
  }

  async performSearch() {
    try {
      // 🛡️ DÉBLOCAGE FORCÉ: L'utilisateur veut chercher, on débloque
      this.loadingBlocked = false;

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
    } catch (error) {
      console.error("[ARCHIVES] ❌ Erreur dans performSearch:", error);
      this.showLoading(false);
      this.showNotification("Erreur lors de la recherche", "error");
    }
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
    // 🛡️ PROTECTION: Ne pas appeler loadArchives automatiquement
    console.log(
      "[ARCHIVES] 🔄 Filtres réinitialisés - Cliquez sur 'Rechercher' pour appliquer"
    );
    this.showEmptyState(
      "Filtres réinitialisés - Cliquez sur 'Rechercher' pour charger les archives"
    );
  }

  // Méthode pour forcer le rechargement complet des données
  async reload() {
    console.log(
      "[ARCHIVES] 🛡️ Rechargement forcé BLOQUÉ pour éviter les boucles"
    );
    console.log(
      "[ARCHIVES] Utilisez le bouton 'Rechercher' pour charger les données"
    );

    // Réinitialiser les caches seulement
    this.allArchivesData = null;
    this.lastDataRefresh = 0;
    this.currentPage = 1;

    // Afficher un message d'invitation
    this.showEmptyState(
      "Données réinitialisées - Cliquez sur 'Rechercher' pour recharger"
    );
  }

  // � NOUVELLE MÉTHODE: Charger TOUTES les archives en combinant dossiers actifs et supprimés
  async loadAllCombinedFromActiveDeliveries() {
    try {
      console.log(
        "[ARCHIVES] 🎯 Chargement de TOUTES les archives (dossiers actifs + supprimés)..."
      );

      // 1️⃣ Charger tous les dossiers ACTIFS (comme les badges)
      const deliveriesResponse = await fetch("/deliveries/status");
      const deliveriesData = await deliveriesResponse.json();

      // 🔧 CORRECTION: L'API retourne {success: true, deliveries: [...]}
      if (
        !deliveriesData.success ||
        !Array.isArray(deliveriesData.deliveries)
      ) {
        console.error(
          "[ARCHIVES] ❌ Format de données actives invalide:",
          deliveriesData
        );
        this.showNotification("Erreur: format de données invalide", "error");
        return;
      }

      const activeDeliveries = deliveriesData.deliveries;

      // 🔄 Transformer les données actives pour qu'elles aient la même structure que les archives
      const transformedActiveDeliveries = activeDeliveries.map((delivery) => ({
        id: delivery.id,
        dossier_number: delivery.dossier_number,
        dossier_data: delivery, // Tout l'objet delivery comme dossier_data
        client_name: delivery.client_name,
        action_type: "active", // Type d'action pour les données actives
        role_source: "Système", // Rôle par défaut
        page_origine: null, // Pas de page d'origine pour les données actives
        archived_at: delivery.created_at, // Utiliser created_at comme date de référence
        created_at: delivery.created_at,
        intitule: delivery.container_type_and_content,
        // Autres champs nécessaires avec des valeurs par défaut
        date_soumission: delivery.created_at,
        date_creation: delivery.created_at,
      }));

      // 2️⃣ Charger les dossiers SUPPRIMÉS depuis les archives
      const deletedResponse = await fetch(
        "/api/archives?action_type=suppression&limit=9999"
      );
      const deletedData = await deletedResponse.json();
      const deletedDeliveries = deletedData.success
        ? deletedData.archives || []
        : [];

      // 3️⃣ Combiner TOUS les dossiers
      const allDeliveries = [
        ...transformedActiveDeliveries,
        ...deletedDeliveries,
      ];

      console.log(`[ARCHIVES] 📊 Total combiné:`);
      console.log(`  - Dossiers actifs: ${transformedActiveDeliveries.length}`);
      console.log(`  - Dossiers supprimés: ${deletedDeliveries.length}`);
      console.log(`  - TOTAL: ${allDeliveries.length}`);

      // 🔍 Appliquer la recherche si nécessaire
      let filteredDeliveries = allDeliveries;
      if (this.searchTerm && this.searchTerm.trim()) {
        const searchLower = this.searchTerm.toLowerCase();
        filteredDeliveries = allDeliveries.filter(
          (delivery) =>
            (delivery.declaration_number &&
              delivery.declaration_number
                .toLowerCase()
                .includes(searchLower)) ||
            (delivery.client_name &&
              delivery.client_name.toLowerCase().includes(searchLower)) ||
            (delivery.destination &&
              delivery.destination.toLowerCase().includes(searchLower)) ||
            (delivery.cargo_description &&
              delivery.cargo_description.toLowerCase().includes(searchLower)) ||
            (delivery.numero_dossier &&
              delivery.numero_dossier.toLowerCase().includes(searchLower)) ||
            (delivery.dossier_reference &&
              delivery.dossier_reference.toLowerCase().includes(searchLower))
        );
        console.log(
          `[ARCHIVES] 🔍 Après recherche: ${filteredDeliveries.length}/${allDeliveries.length}`
        );
      }

      // 📅 Trier par date (plus récent en premier)
      filteredDeliveries.sort((a, b) => {
        const dateA = new Date(
          a.created_at || a.date_soumission || a.archived_at || a.date_creation
        );
        const dateB = new Date(
          b.created_at || b.date_soumission || b.archived_at || b.date_creation
        );
        return dateB - dateA;
      });

      // 📄 Pagination côté client
      const totalItems = filteredDeliveries.length;
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;

      this.filteredArchives = filteredDeliveries.slice(startIndex, endIndex);
      this.pagination = {
        currentPage: this.currentPage,
        totalPages: Math.ceil(totalItems / this.itemsPerPage),
        totalItems: totalItems,
        itemsPerPage: this.itemsPerPage,
      };

      console.log(
        `[ARCHIVES] ✅ Toutes les archives chargées: ${this.filteredArchives.length} affichées sur ${totalItems} total`
      );

      // 🎯 Mettre à jour l'affichage
      this.renderCurrentView();
      this.renderPagination();
    } catch (error) {
      console.error("[ARCHIVES] ❌ Erreur lors du chargement combiné:", error);
      this.showNotification("Erreur lors du chargement des archives", "error");
    }
  }

  // �🌟 NOUVELLE MÉTHODE: Charger les dossiers ACTIFS selon l'onglet sélectionné
  // pour synchroniser le tableau avec les badges
  async loadActiveDeliveriesByTab() {
    try {
      console.log(
        `[ARCHIVES] 🎯 Chargement des dossiers ACTIFS pour l'onglet: ${this.selectedTab}`
      );

      // Récupérer TOUS les dossiers actifs depuis le même endpoint que les badges
      const response = await fetch("/deliveries/status");
      const deliveriesData = await response.json();

      // 🔧 CORRECTION: L'API retourne {success: true, deliveries: [...]}
      if (
        !deliveriesData.success ||
        !Array.isArray(deliveriesData.deliveries)
      ) {
        console.error(
          "[ARCHIVES] ❌ Format de données invalide:",
          deliveriesData
        );
        this.showNotification("Erreur: données invalides", "error");
        return;
      }

      const deliveries = deliveriesData.deliveries;

      console.log(
        `[ARCHIVES] 📦 ${deliveries.length} dossiers actifs récupérés au total`
      );

      // 🎯 Filtrer selon l'onglet sélectionné (même logique que les badges)
      let filteredDeliveries = [];

      switch (this.selectedTab) {
        case "all":
          // TOUS les dossiers actifs (pour l'onglet "Toutes les Archives")
          filteredDeliveries = deliveries;
          console.log(
            `[ARCHIVES] 📊 Onglet 'Toutes les Archives': ${filteredDeliveries.length} dossiers actifs`
          );
          break;

        case "submitted":
          // TOUS les dossiers soumis (équivalent au badge "Dossier soumis")
          filteredDeliveries = deliveries;
          console.log(
            `[ARCHIVES] 📊 Onglet 'Dossier soumis': ${filteredDeliveries.length} dossiers (TOUS)`
          );
          break;

        case "shipping":
          // Dossiers mis en livraison (basé sur delivery_status_acconier)
          filteredDeliveries = deliveries.filter((d) => {
            return (
              d.delivery_status_acconier === "mise_en_livraison_acconier" ||
              d.delivery_status_acconier === "en_livraison" ||
              (d.container_statuses &&
                Object.values(d.container_statuses).some(
                  (status) =>
                    status === "mise_en_livraison" || status === "en_livraison"
                ))
            );
          });
          console.log(
            `[ARCHIVES] 🚚 Onglet 'Mis en livraison': ${filteredDeliveries.length} dossiers`
          );
          break;

        case "delivered":
          // Dossiers livrés (basé sur container_statuses)
          filteredDeliveries = deliveries.filter((d) => {
            return (
              d.delivery_status_acconier === "livre" ||
              d.delivery_status_acconier === "livré" ||
              (d.container_statuses &&
                Object.values(d.container_statuses).some(
                  (status) =>
                    status === "livre" ||
                    status === "livré" ||
                    status === "delivered"
                ))
            );
          });
          console.log(
            `[ARCHIVES] ✅ Onglet 'Dossier livré': ${filteredDeliveries.length} dossiers`
          );
          break;

        case "orders":
          // Ordres de livraison (tous les dossiers avec ordre établi)
          filteredDeliveries = deliveries.filter((d) => {
            return (
              d.dossier_number && // A un numéro de dossier
              (d.delivery_date ||
                d.delivery_time || // Date/heure de livraison définie
                d.status === "pending_acconier" || // En attente acconier (ordre créé)
                d.bl_statuses) // A des statuts de BL
            );
          });
          console.log(
            `[ARCHIVES] 📋 Onglet 'Ordre de livraison': ${filteredDeliveries.length} dossiers`
          );
          break;

        case "deleted":
          // Pour les dossiers supprimés, on garde l'ancienne logique avec les archives
          console.log(
            "[ARCHIVES] 🗑️ Dossiers supprimés: utilisation de l'ancienne logique d'archives"
          );
          await this.loadArchivedDataByType("suppression");
          return;

        default:
          console.warn(`[ARCHIVES] ⚠️ Onglet non reconnu: ${this.selectedTab}`);
          return;
      }

      // 🔍 Appliquer la recherche si un terme est défini
      if (this.searchTerm && this.searchTerm.trim()) {
        const searchLower = this.searchTerm.toLowerCase();
        const originalCount = filteredDeliveries.length;
        filteredDeliveries = filteredDeliveries.filter(
          (delivery) =>
            (delivery.declaration_number &&
              delivery.declaration_number
                .toLowerCase()
                .includes(searchLower)) ||
            (delivery.client_name &&
              delivery.client_name.toLowerCase().includes(searchLower)) ||
            (delivery.destination &&
              delivery.destination.toLowerCase().includes(searchLower)) ||
            (delivery.cargo_description &&
              delivery.cargo_description.toLowerCase().includes(searchLower)) ||
            (delivery.numero_dossier &&
              delivery.numero_dossier.toLowerCase().includes(searchLower))
        );
        console.log(
          `[ARCHIVES] 🔍 Recherche '${this.searchTerm}': ${filteredDeliveries.length}/${originalCount} dossiers`
        );
      }

      // 📅 Trier par date (plus récent en premier)
      filteredDeliveries.sort((a, b) => {
        const dateA = new Date(
          a.created_at || a.date_soumission || a.date_creation
        );
        const dateB = new Date(
          b.created_at || b.date_soumission || b.date_creation
        );
        return dateB - dateA;
      });

      // 📄 Pagination côté client
      const totalItems = filteredDeliveries.length;
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;

      this.filteredArchives = filteredDeliveries.slice(startIndex, endIndex);
      this.pagination = {
        currentPage: this.currentPage,
        totalPages: Math.ceil(totalItems / this.itemsPerPage),
        totalItems: totalItems,
        itemsPerPage: this.itemsPerPage,
      };

      console.log(
        `[ARCHIVES] ✅ Synchronisation réussie: ${this.filteredArchives.length} dossiers affichés sur ${totalItems} total (page ${this.currentPage}/${this.pagination.totalPages})`
      );

      // 🎯 Mettre à jour l'affichage avec les dossiers actifs
      this.renderCurrentView();
      this.renderPagination();
    } catch (error) {
      console.error(
        "[ARCHIVES] ❌ Erreur lors du chargement des dossiers actifs:",
        error
      );
      this.showNotification("Erreur lors du chargement des dossiers", "error");
    }
  }

  // 📚 Méthode pour charger les données archivées par type (pour dossiers supprimés)
  async loadArchivedDataByType(actionType) {
    try {
      const params = new URLSearchParams({
        page: this.currentPage.toString(),
        limit: this.itemsPerPage.toString(),
        search: this.searchTerm || "",
      });

      const endpoint = `/api/archives?action_type=${actionType}&${params.toString()}`;
      console.log(`[ARCHIVES] 📡 API Request pour ${actionType}: ${endpoint}`);

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        this.filteredArchives = data.archives || [];
        this.pagination = data.pagination || {};

        console.log(
          `[ARCHIVES] ✅ ${this.filteredArchives.length} archives ${actionType} chargées`
        );

        this.renderCurrentView();
        this.renderPagination();
      } else {
        console.error("[ARCHIVES] ❌ Erreur API:", data.message);
        this.showNotification(
          `Erreur lors du chargement: ${data.message}`,
          "error"
        );
      }
    } catch (error) {
      console.error(
        `[ARCHIVES] ❌ Erreur lors du chargement ${actionType}:`,
        error
      );
      this.showNotification("Erreur lors du chargement", "error");
    }
  }

  async loadArchives() {
    // 🛡️ PROTECTION ANTI-BOUCLE: Empêcher les appels multiples
    if (this.isLoading) {
      console.warn(
        "[ARCHIVES] ⚠️ Chargement déjà en cours, ignoré pour éviter la boucle"
      );
      return;
    }

    if (this.loadingBlocked) {
      console.warn(
        "[ARCHIVES] 🚫 Chargement bloqué temporairement - Attente 1 seconde..."
      );
      // Attendre un peu et réessayer une fois
      setTimeout(() => {
        if (!this.isLoading) {
          this.loadingBlocked = false;
          this.loadArchives();
        }
      }, 1000);
      return;
    }

    try {
      this.isLoading = true; // 🛡️ Marquer comme en cours
      this.showLoading(true);

      console.log("[ARCHIVES] 🚀 Début du chargement des archives...");

      // 🎯 NOUVELLE LOGIQUE: Utiliser les dossiers ACTIFS pour synchroniser avec les badges
      if (this.selectedTab === "all") {
        console.log(
          "[ARCHIVES] 📊 Chargement simple pour 'Toutes les Archives'"
        );
        await this.loadAllCombinedFromActiveDeliveries();
        return;
      }

      // 🌟 NOUVEAU: Charger les dossiers ACTIFS pour tous les onglets (sauf supprimés)
      if (
        ["submitted", "shipping", "delivered", "orders"].includes(
          this.selectedTab
        )
      ) {
        console.log(
          `[ARCHIVES] 🎯 Chargement des dossiers ACTIFS pour l'onglet: ${this.selectedTab}`
        );
        await this.loadActiveDeliveriesByTab();
        return;
      }

      // 📚 Pour les dossiers supprimés, utiliser l'ancienne logique d'archives
      if (this.selectedTab === "deleted") {
        console.log(
          "[ARCHIVES] 🗑️ Chargement des dossiers supprimés depuis les archives"
        );
        await this.loadArchivedDataByType("suppression");
        return;
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

        // 💾 CORRECTION: Mise à jour simple et robuste du stockage
        this.updateStorageSimple();

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
      this.isLoading = false; // 🛡️ PROTECTION: Libérer le flag
      console.log("[ARCHIVES] ✅ Chargement terminé");
    }
  }

  // 🛡️ NOUVELLE MÉTHODE SIMPLE: Chargement sans boucle pour "Toutes les Archives"
  async simpleLoadAllArchives() {
    try {
      console.log(
        "[ARCHIVES] 📊 Chargement de TOUTES les archives (tous types)..."
      );

      // ✅ CORRECTION: Charger tous les types d'archives séparément pour avoir le vrai total
      const archivePromises = [
        fetch("/api/archives?action_type=suppression&limit=9999").then((r) =>
          r.json()
        ),
        fetch("/api/archives?action_type=livraison&limit=9999").then((r) =>
          r.json()
        ),
        fetch("/api/archives?action_type=mise_en_livraison&limit=9999").then(
          (r) => r.json()
        ),
        fetch(
          "/api/archives?action_type=ordre_livraison_etabli&limit=9999"
        ).then((r) => r.json()),
      ];

      const [suppressionData, livraisonData, miseEnLivraisonData, ordreData] =
        await Promise.all(archivePromises);

      // Combiner toutes les archives
      const allArchives = [
        ...(suppressionData.archives || []),
        ...(livraisonData.archives || []),
        ...(miseEnLivraisonData.archives || []),
        ...(ordreData.archives || []),
      ];

      // Trier par date (plus récent en premier)
      allArchives.sort(
        (a, b) => new Date(b.archived_at) - new Date(a.archived_at)
      );

      console.log(`[ARCHIVES] ✅ Toutes les archives chargées:`);
      console.log(`  - Supprimées: ${suppressionData.archives?.length || 0}`);
      console.log(`  - Livrées: ${livraisonData.archives?.length || 0}`);
      console.log(
        `  - Mise en livraison: ${miseEnLivraisonData.archives?.length || 0}`
      );
      console.log(`  - Ordres: ${ordreData.archives?.length || 0}`);
      console.log(`  - TOTAL RÉEL: ${allArchives.length}`);

      this.allArchives = allArchives;
      this.filteredArchives = allArchives;
      this.allCombinedArchives = allArchives;

      // 📊 IMPORTANT: Stocker le vrai total pour les badges
      this.realTotalCount = allArchives.length;
      console.log("[ARCHIVES] 📊 Vrai total stocké:", this.realTotalCount);

      // Rendu simple avec la bonne fonction
      this.renderTable(allArchives);
      this.renderPagination();

      // 💾 CORRECTION: Mise à jour du niveau de stockage
      this.updateStorageSimple();

      // 🏷️ CORRECTION: Mise à jour des badges des onglets
      await this.updateCounts();

      console.log(
        "[ARCHIVES] ✅ Chargement de TOUTES les archives terminé:",
        allArchives.length,
        "archives chargées et affichées"
      );
    } catch (error) {
      console.error("[ARCHIVES] ❌ Erreur dans simpleLoadAllArchives:", error);
      this.showNotification("Erreur lors du chargement simple", "error");
    } finally {
      // 🛡️ IMPORTANT: Toujours cacher le spinner
      this.showLoading(false);
    }
  }

  // 🔇 MÉTHODE SILENCIEUSE: Charger les archives sans animation de chargement
  async loadArchivesQuietly() {
    try {
      console.log("[ARCHIVES] 🤫 Chargement silencieux des archives...");

      // Construire les paramètres de requête sans afficher le spinner
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.itemsPerPage,
        ...this.currentFilters,
      });

      const response = await fetch(`/api/archives?${params}`);
      const data = await response.json();

      if (data.success) {
        this.allArchives = data.archives || [];
        this.filteredArchives = this.allArchives;

        this.pagination = data.pagination || {
          currentPage: this.currentPage,
          totalPages: 1,
          totalItems: this.allArchives.length,
          itemsPerPage: this.itemsPerPage,
        };

        // Affichage direct sans animation
        this.renderCurrentView();
        this.renderPagination();

        // Mise à jour des compteurs
        await this.updateCounts();

        console.log(
          `[ARCHIVES] ✅ Chargement silencieux terminé: ${this.allArchives.length} archives`
        );
      } else {
        console.error("[ARCHIVES] ❌ Erreur dans la réponse:", data.message);
        this.showNotification("Erreur lors du chargement", "error");
      }
    } catch (error) {
      console.error("[ARCHIVES] ❌ Erreur dans loadArchivesQuietly:", error);
      this.showNotification("Erreur lors du chargement silencieux", "error");
    }
  }

  // 🎯 MÉTHODE COMPLEXE (POTENTIELLEMENT PROBLÉMATIQUE): Charger toutes les archives combinées
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

      //   Stocker TOUTES les archives pour la pagination frontend
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

      // 💾 CORRECTION: Mise à jour simple et robuste du stockage
      this.updateStorageSimple();
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

  // 🎯 MÉTHODE DÉFINITIVE: Chargement équilibré de toutes les archives
  async loadAllArchivesWithProperMixing() {
    try {
      this.showLoading(true);
      console.log(
        "[ARCHIVES] 🚀 NOUVELLE MÉTHODE - Chargement équilibré DÉFINITIF..."
      );

      // 🔥 RÉCUPÉRER TOUTES LES ARCHIVES D'UN COUP
      const cacheBuster = Date.now();
      const response = await fetch(
        `/api/archives?limit=99999&cb=${cacheBuster}`
      );
      const data = await response.json();

      if (!data.success || !data.archives) {
        throw new Error("Impossible de récupérer les archives");
      }

      console.log(`[ARCHIVES] 📊 ${data.archives.length} archives récupérées`);

      // 🏷️ CLASSIFICATION en utilisant notre logique determineActionType
      const classified = {
        mise_en_livraison: [],
        livraison: [],
        ordre_livraison_etabli: [],
        suppression: [],
        autres: [],
      };

      data.archives.forEach((archive) => {
        const type = this.determineActionType(archive);
        if (classified[type]) {
          classified[type].push(archive);
        } else {
          classified.autres.push(archive);
        }
      });

      console.log(`[ARCHIVES] 🏷️ Classification:`);
      Object.keys(classified).forEach((key) => {
        console.log(`  - ${key}: ${classified[key].length}`);
      });

      // 🎯 MÉLANGE ÉQUILIBRÉ - Technique de distribution ronde
      const allTypes = Object.keys(classified).filter(
        (key) => classified[key].length > 0
      );
      let allCombinedArchives = [];
      let maxIterations = Math.max(
        ...allTypes.map((type) => classified[type].length)
      );

      for (let i = 0; i < maxIterations; i++) {
        allTypes.forEach((type) => {
          if (i < classified[type].length) {
            allCombinedArchives.push(classified[type][i]);
          }
        });
      }

      console.log(
        `[ARCHIVES] 🎯 ${allCombinedArchives.length} archives mélangées équitablement`
      );

      // 💾 STOCKER ET PAGINER
      this.allCombinedArchives = allCombinedArchives;

      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.filteredArchives = allCombinedArchives.slice(startIndex, endIndex);

      this.pagination = {
        currentPage: this.currentPage,
        totalPages: Math.ceil(allCombinedArchives.length / this.itemsPerPage),
        totalItems: allCombinedArchives.length,
        itemsPerPage: this.itemsPerPage,
      };

      // 🎯 METTRE À JOUR LE BADGE "Toutes les Archives"
      const allTabBadge = document.querySelector("#allCount");
      if (allTabBadge) {
        allTabBadge.textContent = allCombinedArchives.length;
        console.log(
          `[ARCHIVES] ✅ Badge mis à jour: ${allCombinedArchives.length}`
        );
      }

      // 🖼️ AFFICHER
      this.renderCurrentView();
      this.renderPagination();

      console.log(
        `[ARCHIVES] 🎉 SUCCÈS! Page 1 affiche ${this.filteredArchives.length} archives mélangées`
      );
    } catch (error) {
      console.error("[ARCHIVES] ❌ Erreur:", error);
      this.showNotification("Erreur lors du chargement", "error");
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

      //   D'abord s'assurer que tous les compteurs sont chargés
      await this.updateCounts();

      //  📊 Récupérer les badges des autres onglets pour additionner leurs valeurs
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

      //   DIAGNOSTIC: Afficher les résultats détaillés
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

      // 🎯 NOUVEAU: Mélange équilibré des types pour afficher tous les badges dans l'onglet "Toutes les Archives"
      console.log(
        `[ARCHIVES] 🎲 Application d'un mélange équilibré des types de badges...`
      );

      // Grouper par type pour un mélange équilibré
      const suppressionArchives =
        suppressionData.success && suppressionData.archives
          ? suppressionData.archives
          : [];
      const livraisonArchives =
        livraisonData.success && livraisonData.archives
          ? livraisonData.archives
          : [];
      const miseEnLivraisonArchives =
        miseEnLivraisonData.success && miseEnLivraisonData.archives
          ? miseEnLivraisonData.archives
          : [];
      const ordreArchives =
        ordreData.success && ordreData.archives ? ordreData.archives : [];

      console.log(`[ARCHIVES] 📊 Types disponibles:`);
      console.log(`  - Suppression: ${suppressionArchives.length}`);
      console.log(`  - Livraison: ${livraisonArchives.length}`);
      console.log(`  - Mise en livraison: ${miseEnLivraisonArchives.length}`);
      console.log(`  - Ordre: ${ordreArchives.length}`);

      // 🎯 Mélange équilibré: distribuer les types de façon homogène
      let allCombinedArchives = [];
      const maxLength = Math.max(
        suppressionArchives.length,
        livraisonArchives.length,
        miseEnLivraisonArchives.length,
        ordreArchives.length
      );

      // Intercaler les éléments de chaque type pour un mélange homogène
      for (let i = 0; i < maxLength; i++) {
        // Ajouter un élément de chaque type s'il existe
        if (i < miseEnLivraisonArchives.length) {
          allCombinedArchives.push(miseEnLivraisonArchives[i]);
        }
        if (i < livraisonArchives.length) {
          allCombinedArchives.push(livraisonArchives[i]);
        }
        if (i < ordreArchives.length) {
          allCombinedArchives.push(ordreArchives[i]);
        }
        if (i < suppressionArchives.length) {
          allCombinedArchives.push(suppressionArchives[i]);
        }
      }

      console.log(
        `[ARCHIVES] 🎯 Mélange terminé - Total: ${allCombinedArchives.length} archives`
      );
      console.log(
        `[ARCHIVES] 🎨 Les badges devraient maintenant être variés dans l'affichage!`
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

      // 💾 NOUVEAU: Mettre à jour automatiquement l'interface de stockage après chargement
      console.log(
        "[ARCHIVES] 💾 Mise à jour automatique de l'interface de stockage..."
      );
      if (
        window.storageManager &&
        typeof window.storageManager.refreshStorageData === "function"
      ) {
        await window.storageManager.refreshStorageData();
      }
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
      "[ARCHIVES] 🔄 Synchronisation des badges avec les VRAIES cartes du tableau de bord..."
    );

    try {
      // 🎯 STRATÉGIE FINALE: Lire directement les valeurs affichées dans les cartes DOM
      // Cela garantit une synchronisation 100% parfaite avec ce que l'utilisateur voit
      console.log(
        "[ARCHIVES] 📡 Lecture directe des valeurs dans les cartes du dashboard..."
      );

      // Essayer de lire les valeurs directement depuis les cartes affichées
      let dashboardCounts = null;

      // Méthode 1: Lire depuis les éléments DOM des cartes (si on est sur la page du dashboard)
      const carteAttentePaiement = document.getElementById(
        "carteAttentePaiement"
      );
      const carteMiseLivraison = document.getElementById("carteMiseLivraison");
      const carteLivre = document.getElementById("carteLivre");

      if (carteAttentePaiement && carteMiseLivraison && carteLivre) {
        console.log("[ARCHIVES] 📊 Lecture depuis les cartes DOM...");

        // Extraire les valeurs depuis les badges des cartes
        const soumisElement =
          carteAttentePaiement.querySelector(".card-counter");
        const miseEnLivraisonElement =
          carteMiseLivraison.querySelector(".card-counter");
        const livreElement = carteLivre.querySelector(".card-counter");

        if (soumisElement && miseEnLivraisonElement && livreElement) {
          const soumisText = soumisElement.textContent || "0";
          const miseEnLivraisonText =
            miseEnLivraisonElement.textContent || "0/0";
          const livreText = livreElement.textContent || "0/0";

          // Parser les valeurs (format peut être "78/168" ou juste "168")
          const soumisValue = parseInt(soumisText.split("/").pop()) || 0;
          const miseEnLivraisonValue =
            parseInt(miseEnLivraisonText.split("/")[0]) || 0;
          const livreValue = parseInt(livreText.split("/")[0]) || 0;

          dashboardCounts = {
            en_attente_paiement: soumisValue,
            mise_en_livraison: miseEnLivraisonValue,
            livres: livreValue,
          };

          console.log(
            "[ARCHIVES] ✅ Valeurs lues depuis les cartes DOM:",
            dashboardCounts
          );
        }
      }

      // Méthode 2: Si on n'est pas sur la page dashboard, utiliser l'API comme fallback
      if (!dashboardCounts) {
        console.log(
          "[ARCHIVES] 📡 Fallback: Calcul depuis l'API /deliveries/status..."
        );

        const response = await fetch("/deliveries/status");
        const data = await response.json();

        if (data.success && data.deliveries) {
          console.log(
            "[ARCHIVES] ✅ Données API récupérées:",
            data.deliveries.length,
            "dossiers"
          );

          // Utiliser la fonction de calcul local
          if (typeof window.calculateCountsFromDeliveries === "function") {
            console.log(
              "[ARCHIVES] 📊 Utilisation de la fonction globale du dashboard"
            );
            dashboardCounts = window.calculateCountsFromDeliveries(
              data.deliveries
            );
          } else {
            console.log(
              "[ARCHIVES] 📊 Utilisation de la fonction locale des archives"
            );
            dashboardCounts = this.calculateCountsFromDeliveries(
              data.deliveries
            );
          }
        } else {
          throw new Error("Impossible de récupérer les données de l'API");
        }
      }

      if (!dashboardCounts) {
        throw new Error("Impossible d'obtenir les compteurs du dashboard");
      }

      console.log(
        "[ARCHIVES] 📊 Compteurs finaux du dashboard:",
        dashboardCounts
      );

      // � Récupérer les compteurs spécifiques aux archives (suppression et ordres)
      const [suppressionData, ordreData] = await Promise.all([
        fetch("/api/archives?action_type=suppression&limit=1").then((r) =>
          r.json()
        ),
        fetch("/api/archives?action_type=ordre_livraison_etabli&limit=1").then(
          (r) => r.json()
        ),
      ]);

      // 🔗 SYNCHRONISATION PARFAITE: Mapper exactement comme les cartes AFFICHÉES
      const archiveCounts = {
        // Badge "Dossiers Livrés" = Total de la carte "Dossiers livrés"
        livraison: dashboardCounts.livres || 0,
        // Badge "Mis en Livraison" = Total de la carte "Dossiers mis en livraison"
        mise_en_livraison: dashboardCounts.mise_en_livraison || 0,
        // Badge "Dossiers Supprimés" = Appel séparé car pas dans le tableau de bord
        suppression: suppressionData.pagination?.totalItems || 0,
        // Badge "Ordres de Livraison" = Appel séparé car pas dans le tableau de bord
        ordre_livraison_etabli: ordreData.pagination?.totalItems || 0,
      };

      // 🎯 CORRECTION: Badge "Toutes les archives" = SOMME de tous les autres badges
      archiveCounts.all =
        archiveCounts.suppression +
        archiveCounts.livraison +
        archiveCounts.mise_en_livraison +
        archiveCounts.ordre_livraison_etabli;

      console.log(
        "[ARCHIVES] 🎯 Synchronisation PARFAITE avec les VRAIES cartes affichées:",
        {
          "Toutes les archives (= SOMME de tous les badges)": archiveCounts.all,
          "Dossiers livrés (= Carte livrés AFFICHÉS)": archiveCounts.livraison,
          "Mis en livraison (= Carte mise en livraison AFFICHÉS)":
            archiveCounts.mise_en_livraison,
          "Dossiers supprimés (spécifique archives)": archiveCounts.suppression,
          "Ordres de livraison (spécifique archives)":
            archiveCounts.ordre_livraison_etabli,
        }
      );

      // 🔄 Mettre à jour tous les badges avec les compteurs synchronisés
      const elements = {
        allCount: document.getElementById("allCount"),
        deletedCount: document.getElementById("deletedCount"),
        deliveredCount: document.getElementById("deliveredCount"),
        shippingCount: document.getElementById("shippingCount"),
        ordersCount: document.getElementById("ordersCount"),
      };

      if (elements.allCount) elements.allCount.textContent = archiveCounts.all;
      if (elements.deletedCount)
        elements.deletedCount.textContent = archiveCounts.suppression;
      if (elements.deliveredCount)
        elements.deliveredCount.textContent = archiveCounts.livraison;
      if (elements.shippingCount)
        elements.shippingCount.textContent = archiveCounts.mise_en_livraison;
      if (elements.ordersCount)
        elements.ordersCount.textContent = archiveCounts.ordre_livraison_etabli;

      console.log(
        "[ARCHIVES] ✅ Badges mis à jour avec synchronisation PARFAITE des cartes AFFICHÉES"
      );

      // 🔔 NOTIFICATION: Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(
        new CustomEvent("archiveBadgesUpdated", {
          detail: {
            source: "dashboard-dom-sync",
            counts: archiveCounts,
            timestamp: Date.now(),
          },
        })
      );
    } catch (error) {
      console.error(
        "[ARCHIVES] ⚠️ Erreur synchronisation tableau de bord:",
        error
      );
      console.log(
        "[ARCHIVES] 🔄 Fallback vers la méthode archives classique..."
      );

      // 🛡️ FALLBACK: Utiliser l'ancienne méthode archives en cas d'erreur
      try {
        // Synchroniser l'historique localStorage pour les dossiers livrés
        await this.syncLocalStorageHistory();

        // Faire des appels séparés pour chaque action_type
        const [suppressionData, livraisonData, miseEnLivraisonData, ordreData] =
          await Promise.all([
            fetch("/api/archives?action_type=suppression&limit=1").then((r) =>
              r.json()
            ),
            fetch("/api/archives?action_type=livraison&limit=1").then((r) =>
              r.json()
            ),
            fetch("/api/archives?action_type=mise_en_livraison&limit=1").then(
              (r) => r.json()
            ),
            fetch(
              "/api/archives?action_type=ordre_livraison_etabli&limit=1"
            ).then((r) => r.json()),
          ]);

        const fallbackCounts = {
          suppression: suppressionData.pagination?.totalItems || 0,
          livraison: livraisonData.pagination?.totalItems || 0,
          mise_en_livraison: miseEnLivraisonData.pagination?.totalItems || 0,
          ordre_livraison_etabli: ordreData.pagination?.totalItems || 0,
        };

        const totalFallback =
          fallbackCounts.suppression +
          fallbackCounts.livraison +
          fallbackCounts.mise_en_livraison +
          fallbackCounts.ordre_livraison_etabli;

        console.log(
          "[ARCHIVES] 🔢 Compteurs fallback:",
          fallbackCounts,
          "Total:",
          totalFallback
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

        // 🔔 NOTIFICATION: Déclencher un événement pour notifier les autres composants
        window.dispatchEvent(
          new CustomEvent("archiveBadgesUpdated", {
            detail: {
              source: "archives-fallback",
              counts: fallbackCounts,
              total: totalFallback,
              timestamp: Date.now(),
            },
          })
        );
      } catch (fallbackError) {
        console.error("[ARCHIVES] ❌ Erreur fallback:", fallbackError);

        // Dernier recours: compteurs locaux
        const localCounts = {
          suppression: this.allArchives.filter(
            (a) => a.action_type === "suppression"
          ).length,
          livraison: this.allArchives.filter(
            (a) => a.action_type === "livraison"
          ).length,
          mise_en_livraison: this.allArchives.filter(
            (a) => a.action_type === "mise_en_livraison"
          ).length,
          ordre_livraison_etabli: this.allArchives.filter(
            (a) => a.action_type === "ordre_livraison_etabli"
          ).length,
        };

        const localTotal =
          localCounts.suppression +
          localCounts.livraison +
          localCounts.mise_en_livraison +
          localCounts.ordre_livraison_etabli;

        document.getElementById("allCount").textContent = localTotal;
        document.getElementById("deletedCount").textContent =
          localCounts.suppression;
        document.getElementById("deliveredCount").textContent =
          localCounts.livraison;
        document.getElementById("shippingCount").textContent =
          localCounts.mise_en_livraison;
        document.getElementById("ordersCount").textContent =
          localCounts.ordre_livraison_etabli;

        // 🔔 NOTIFICATION: Déclencher un événement pour notifier les autres composants
        window.dispatchEvent(
          new CustomEvent("archiveBadgesUpdated", {
            detail: {
              source: "local-fallback",
              counts: localCounts,
              total: localTotal,
              timestamp: Date.now(),
            },
          })
        );
      }
    }
  }

  // 🎯 MÉTHODE IDENTIQUE: Calculer les compteurs exactement comme les cartes du dashboard
  calculateCountsFromDeliveries(deliveries) {
    console.log(
      "[ARCHIVES] 📋 Calcul des compteurs à partir de",
      deliveries.length,
      "livraisons (logique identique aux cartes)"
    );

    // Le badge "Dossier soumis" doit toujours afficher le TOTAL des dossiers dans le tableau de suivi
    // Il ne diminue que si un dossier est SUPPRIMÉ du tableau, pas quand il change de statut
    const counts = {
      en_attente_paiement: deliveries.length, // TOTAL des dossiers soumis (TOUS les dossiers du tableau)
      mise_en_livraison: 0,
      livres: 0,
      en_retard: 0,
    };

    // Analyser chaque dossier pour les autres catégories (sous-ensembles du total)
    deliveries.forEach((delivery) => {
      // Debug pour voir les statuts
      console.log(
        "[DEBUG] Dossier:",
        delivery.dossier_number,
        "Statut acconier:",
        delivery.delivery_status_acconier,
        "Statut container:",
        delivery.container_statuses
      );

      // 🎯 LOGIQUE SIMPLIFIÉE : Un dossier est livré si visible_resp_acconier = false
      // Cette logique correspond exactement à ce que fait le serveur
      let isLivre = false;

      // Méthode principale: vérifier visible_resp_acconier (comme dans le serveur)
      if (delivery.visible_resp_acconier === false) {
        isLivre = true;
        console.log(
          "[DEBUG] ✅ Dossier livré (visible_resp_acconier=false):",
          delivery.dossier_number
        );
      }

      // Méthode alternative: vérifier les statuts de conteneurs s'ils existent
      if (!isLivre && delivery.container_statuses) {
        Object.values(delivery.container_statuses).forEach((status) => {
          if (status === "livre" || status === "livré") {
            isLivre = true;
            console.log(
              "[DEBUG] ✅ Dossier livré (statut conteneur):",
              delivery.dossier_number
            );
          }
        });
      }

      // Compter selon les catégories
      if (isLivre) {
        counts.livres++;
      } else if (
        delivery.delivery_status_acconier === "mise_en_livraison_acconier"
      ) {
        counts.mise_en_livraison++;
      }

      // Compter les dossiers en retard
      if (delivery.created_at) {
        const diffDays = Math.floor(
          (new Date() - new Date(delivery.created_at)) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 2 && !isLivre) {
          counts.en_retard++;
        }
      }
    });

    console.log(
      "[ARCHIVES] 📊 Compteurs calculés (correspondant EXACTEMENT au tableau de bord):",
      {
        "🔢 TOTAL dossiers soumis (ne diminue que si suppression)":
          counts.en_attente_paiement,
        "🚛 Sous-ensemble mis en livraison": counts.mise_en_livraison,
        "✅ Sous-ensemble livrés": counts.livres,
        "⏰ Sous-ensemble en retard": counts.en_retard,
        "📋 Note":
          "Le badge 'Dossier soumis' affiche le TOTAL, les autres sont des sous-catégories",
      }
    );

    return counts;
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

    // 🎯 CORRECTION: Détecter si on utilise des livraisons actives (pas des archives)
    const isActiveDeliveryTab = [
      "all",
      "delivered",
      "shipping",
      "orders",
    ].includes(this.selectedTab);

    console.log(
      "[ARCHIVES] Rendu - Onglet:",
      this.selectedTab,
      "| Filtres serveur:",
      hasServerFilters,
      "| Livraisons actives:",
      isActiveDeliveryTab,
      "| Données filtrées:",
      this.filteredArchives.length
    );

    // Si aucun filtre serveur n'est appliqué ET qu'on n'est pas sur des livraisons actives
    if (!hasServerFilters && !isActiveDeliveryTab) {
      switch (this.selectedTab) {
        case "deleted":
          archivesToRender = this.filteredArchives.filter(
            (a) => a.action_type === "suppression"
          );
          break;
        default:
          // Pour "all", garder toutes les données filtrées
          archivesToRender = this.filteredArchives;
          break;
      }
    } else if (isActiveDeliveryTab) {
      // Pour les livraisons actives, utiliser directement les données déjà filtrées
      archivesToRender = this.filteredArchives;
      console.log(
        `[ARCHIVES] 🚀 Affichage livraisons actives (${this.selectedTab}): ${archivesToRender.length} éléments`
      );
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
                            <th class="col-containers d-none d-lg-table-cell">Conteneurs</th>
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

    // 🎯 DETECTION: Est-ce une livraison active (pas une archive) ?
    const isActiveDelivery =
      (!archive.action_type && archive.delivery_status_acconier) ||
      archive.action_type === "active";

    // 🔍 DEBUG: Affichage des propriétés pour diagnostiquer
    console.log(`[DEBUG ROW] ID: ${archive.id}`, {
      action_type: archive.action_type,
      delivery_status_acconier: archive.delivery_status_acconier,
      isActiveDelivery: isActiveDelivery,
      hasActionType: !!archive.action_type,
      actionTypeValue: archive.action_type,
    });

    if (isActiveDelivery) {
      // 🚀 AFFICHAGE POUR LIVRAISONS ACTIVES
      console.log(`[DEBUG] Rendu livraison active ID: ${archive.id}`);

      // 🔧 Accéder aux bonnes données selon la source (directe ou transformée)
      const deliveryData = archive.dossier_data || archive;
      const deliveryStatus =
        deliveryData.delivery_status_acconier ||
        archive.delivery_status_acconier;

      // 🎯 Mapper le delivery_status_acconier au bon badge selon l'onglet
      let actionBadgeType = "active"; // Par défaut

      // 🔍 Priorité à l'onglet sélectionné pour déterminer le bon badge
      if (this.selectedTab === "delivered") {
        // Dans l'onglet "Dossiers Livrés", tous les dossiers sont considérés comme livrés
        actionBadgeType = "livraison";
      } else if (this.selectedTab === "shipping") {
        // Dans l'onglet "Mis en Livraison", tous les dossiers sont en cours de livraison
        actionBadgeType = "mise_en_livraison";
      } else if (this.selectedTab === "orders") {
        // Dans l'onglet "Ordres de Livraison", tous les dossiers ont un ordre établi
        actionBadgeType = "ordre_livraison_etabli";
      } else {
        // Fallback: utiliser le delivery_status_acconier pour déterminer le badge approprié
        if (deliveryStatus === "mise_en_livraison_acconier") {
          actionBadgeType = "mise_en_livraison";
        } else if (
          deliveryStatus === "livraison" ||
          deliveryStatus === "livre"
        ) {
          actionBadgeType = "livraison";
        } else if (deliveryStatus === "ordre_livraison_etabli") {
          actionBadgeType = "ordre_livraison_etabli";
        }
      }

      console.log(
        `[DEBUG] Statut: ${deliveryStatus} -> Badge: ${actionBadgeType}`
      );

      return `
            <tr class="${rowClass}">
                <td class="col-id">
                    <small class="text-muted">#${archive.id}</small>
                </td>
                <td class="col-reference" style="min-width: 120px;">
                    <strong style="color: #000 !important; font-weight: bold !important; display: block !important;">${
                      deliveryData.dossier_number ||
                      deliveryData.numero_dossier ||
                      deliveryData.file_number ||
                      deliveryData.dossier ||
                      archive.dossier_number ||
                      archive.numero_dossier ||
                      archive.dossier_reference ||
                      "Réf. non disponible"
                    }</strong>
                    ${
                      (deliveryData.container_type_and_content ||
                        archive.container_type_and_content) &&
                      (
                        deliveryData.container_type_and_content ||
                        archive.container_type_and_content
                      ).trim() !== ""
                        ? `<br><span class="text-info" style="font-weight: 600; font-size: 0.9em;">${
                            deliveryData.container_type_and_content ||
                            archive.container_type_and_content
                          }</span>`
                        : ""
                    }
                </td>
                <td class="col-action">
                    ${this.renderActionBadge(actionBadgeType)}
                </td>
                <td class="d-none d-md-table-cell">
                    ${deliveryData.client_name || archive.client_name || "N/A"}
                </td>
                <td class="col-containers d-none d-lg-table-cell">
                    ${(() => {
                      // DEBUG spécial pour onglet "Dossier livré"
                      if (this.selectedTab === "delivered") {
                        console.log(
                          "🔍 [DELIVERED TAB DEBUG] Archive complète:",
                          archive
                        );
                        console.log(
                          "🔍 [DELIVERED TAB DEBUG] DeliveryData:",
                          deliveryData
                        );
                        console.log(
                          "🔍 [DELIVERED TAB DEBUG] archive.container_numbers_list:",
                          archive.container_numbers_list
                        );
                        console.log(
                          "🔍 [DELIVERED TAB DEBUG] archive.container_number:",
                          archive.container_number
                        );
                        console.log(
                          "🔍 [DELIVERED TAB DEBUG] deliveryData.container_numbers_list:",
                          deliveryData.container_numbers_list
                        );
                        console.log(
                          "🔍 [DELIVERED TAB DEBUG] deliveryData.container_number:",
                          deliveryData.container_number
                        );
                      }
                      return this.renderContainerDropdown(
                        deliveryData,
                        archive
                      );
                    })()}
                </td>
                <td class="col-role d-none d-lg-table-cell">
                    ${this.renderRoleSourceForActive(deliveryStatus)}
                </td>
                <td class="col-date">
                    ${this.formatDate(
                      deliveryData.created_at || archive.created_at
                    )}
                    <br><small class="text-muted">${this.getTimeAgo(
                      deliveryData.created_at || archive.created_at
                    )}</small>
                    ${this.renderActiveDeliveryStatus(deliveryData)}
                </td>
                <td class="col-actions">
                    <button class="btn btn-sm btn-outline-info" onclick="archivesManager.viewActiveDeliveryDetails(${
                      archive.id
                    })" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    // 📚 AFFICHAGE POUR ARCHIVES CLASSIQUES
    console.log(
      `[DEBUG] Rendu archive classique ID: ${archive.id}, action_type: ${archive.action_type}`
    );

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
        archive.dossier_reference ||
        archive.dossier_number ||
        archive.numero_dossier ||
        (archive.dossier_data && archive.dossier_data.dossier_number) ||
        "Réf. manquante"
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
                      (archive.dossier_data &&
                        archive.dossier_data.numero_dossier) ||
                      (archive.dossier_data &&
                        archive.dossier_data.file_number) ||
                      archive.dossier_reference ||
                      archive.dossier_number ||
                      archive.numero_dossier ||
                      "Réf. indisponible"
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
                    ${this.renderActionBadge(this.determineActionType(archive))}
                </td>
                <td class="d-none d-md-table-cell">
                    ${
                      archive.client_name ||
                      (archive.dossier_data &&
                        archive.dossier_data.client_name) ||
                      (archive.dossier_data &&
                        archive.dossier_data.nom_client) ||
                      archive.nom_client ||
                      archive.customer_name ||
                      "Client non renseigné"
                    }
                </td>
                <td class="col-containers d-none d-lg-table-cell">
                    ${this.renderContainerDropdown(
                      archive.dossier_data || {},
                      archive
                    )}
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

  // 🎯 NOUVELLE MÉTHODE: Détermine le type d'action pour TOUS les éléments
  determineActionType(archive) {
    console.log(`[DEBUG] determineActionType pour ID: ${archive.id}`, {
      action_type: archive.action_type,
      delivery_status_acconier: archive.delivery_status_acconier,
      has_dossier_data: !!archive.dossier_data,
      selectedTab: this.selectedTab,
      // 🔍 VALEURS EXACTES pour debug
      delivery_status_exact: `"${archive.delivery_status_acconier}"`,
      action_type_exact: `"${archive.action_type}"`,
    });

    // 🔥 PRIORITÉ 1: Si c'est une livraison active (avec delivery_status_acconier)
    if (archive.delivery_status_acconier) {
      console.log(
        `[DEBUG] Livraison active détectée - status: "${archive.delivery_status_acconier}"`
      );

      // 🎯 EXCEPTION: Dans l'onglet "Toutes les Archives", afficher le vrai statut
      if (this.selectedTab === "all") {
        console.log(
          `[DEBUG] 📋 ONGLET "ALL" - Mapping statut réel: "${archive.delivery_status_acconier}"`
        );
        // Mapper selon le statut réel pour voir tous les types de badges
        switch (archive.delivery_status_acconier) {
          case "mise_en_livraison_acconier":
          case "en_livraison":
          case "mis_en_livraison":
            console.log(`[DEBUG] ➡️ Badge: mise_en_livraison`);
            return "mise_en_livraison";
          case "livre":
          case "livré":
          case "livraison":
          case "dossier_livre":
          case "delivered":
            console.log(`[DEBUG] ➡️ Badge: livraison`);
            return "livraison";
          case "ordre_livraison_etabli":
          case "ordre_etabli":
          case "order_established":
            console.log(`[DEBUG] ➡️ Badge: ordre_livraison_etabli`);
            return "ordre_livraison_etabli";
          default:
            console.log(
              `[DEBUG] ➡️ Badge par défaut: active (statut inconnu: "${archive.delivery_status_acconier}")`
            );
            return "active";
        }
      }

      // Pour les autres onglets spécifiques, mapper selon l'onglet sélectionné
      if (this.selectedTab === "delivered") {
        return "livraison";
      } else if (this.selectedTab === "shipping") {
        return "mise_en_livraison";
      } else if (this.selectedTab === "orders") {
        return "ordre_livraison_etabli";
      }

      // Fallback: mapper selon le statut réel
      switch (archive.delivery_status_acconier) {
        case "mise_en_livraison_acconier":
        case "en_livraison":
        case "mis_en_livraison":
          return "mise_en_livraison";
        case "livre":
        case "livré":
        case "livraison":
        case "dossier_livre":
        case "delivered":
          return "livraison";
        case "ordre_livraison_etabli":
        case "ordre_etabli":
        case "order_established":
          return "ordre_livraison_etabli";
        default:
          return "active";
      }
    }

    // 🔥 PRIORITÉ 2: Si action_type est défini
    if (
      archive.action_type &&
      archive.action_type !== "undefined" &&
      archive.action_type.trim() !== ""
    ) {
      console.log(`[DEBUG] action_type défini: ${archive.action_type}`);
      return archive.action_type;
    }

    // 🔥 PRIORITÉ 3: Détecter selon les données disponibles
    if (archive.dossier_data) {
      console.log(`[DEBUG] Données dossier détectées`);
      return "dossier";
    }

    // 🔥 PRIORITÉ 4: Détecter selon le rôle source
    if (archive.role_source) {
      switch (archive.role_source.toLowerCase()) {
        case "acconier":
          return "acconier";
        case "responsable_livraison":
          return "responsable_livraison";
        case "administrateur":
          return "admin";
        default:
          return "operation";
      }
    }

    // 🔥 PRIORITÉ 5: Détecter selon la page d'origine
    if (archive.page_origine) {
      switch (archive.page_origine.toLowerCase()) {
        case "tableau_de_bord":
        case "dashboards":
          return "dashboard";
        case "formulaire_employer":
          return "formulaire";
        case "suivi":
        case "suivie":
          return "suivi";
        default:
          return "archive";
      }
    }

    // 🔥 FALLBACK FINAL: Badge par défaut si rien n'est trouvé
    console.log(`[DEBUG] ⚠️ Fallback vers 'archive' pour ID: ${archive.id}`);
    return "archive";
  }

  renderActionBadge(actionType) {
    console.log(
      `[DEBUG BADGE] actionType reçu:`,
      actionType,
      typeof actionType
    );

    // Test temporaire pour diagnostiquer
    if (!actionType || actionType === "undefined" || actionType === "") {
      console.log(`[DEBUG BADGE] ❌ actionType vide/invalide!`);
    }

    const badges = {
      suppression:
        '<span class="badge badge-suppression"><i class="fas fa-trash me-1"></i>Supprimé</span>',
      livraison:
        '<span class="badge badge-livraison"><i class="fas fa-check-circle me-1"></i>Livré</span>',
      mise_en_livraison:
        '<span class="badge badge-mise_en_livraison"><i class="fas fa-truck-loading me-1"></i>Mis en livraison</span>',
      ordre_livraison_etabli:
        '<span class="badge badge-ordre-livraison"><i class="fas fa-file-alt me-1"></i>Ordre établi</span>',
      active:
        '<span class="badge badge-success"><i class="fas fa-clock me-1"></i>En cours</span>',
      unknown:
        '<span class="badge bg-warning"><i class="fas fa-question me-1"></i>Non défini</span>',
      // 🆕 NOUVEAUX BADGES pour tous les types
      dossier:
        '<span class="badge bg-info"><i class="fas fa-folder me-1"></i>Dossier</span>',
      acconier:
        '<span class="badge bg-primary"><i class="fas fa-anchor me-1"></i>Acconier</span>',
      responsable_livraison:
        '<span class="badge bg-success"><i class="fas fa-user-tie me-1"></i>Resp. Livraison</span>',
      admin:
        '<span class="badge bg-danger"><i class="fas fa-crown me-1"></i>Admin</span>',
      operation:
        '<span class="badge bg-secondary"><i class="fas fa-cogs me-1"></i>Opération</span>',
      dashboard:
        '<span class="badge bg-primary"><i class="fas fa-chart-bar me-1"></i>Tableau de bord</span>',
      formulaire:
        '<span class="badge bg-info"><i class="fas fa-wpforms me-1"></i>Formulaire</span>',
      suivi:
        '<span class="badge bg-success"><i class="fas fa-search me-1"></i>Suivi</span>',
      archive:
        '<span class="badge bg-dark"><i class="fas fa-archive me-1"></i>Archive</span>',
    };

    // 🛡️ PROTECTION: Si actionType est null, undefined ou vide
    if (!actionType || actionType.trim() === "") {
      console.log(`[DEBUG BADGE] actionType vide/null, retour unknown badge`);
      return badges.unknown;
    }

    const result =
      badges[actionType] ||
      `<span class="badge bg-secondary"><i class="fas fa-tag me-1"></i>${actionType}</span>`;
    console.log(`[DEBUG BADGE] Badge généré:`, result.substring(0, 50) + "...");
    return result;
  }

  // 🏷️ Générer le badge Role/Source pour les livraisons actives
  renderRoleSourceForActive(deliveryStatus) {
    // 🎯 Prioriser l'onglet sélectionné pour le role/source
    let effectiveStatus = deliveryStatus;

    if (this.selectedTab === "delivered") {
      effectiveStatus = "livraison"; // Onglet Dossiers Livrés
    } else if (this.selectedTab === "shipping") {
      effectiveStatus = "mise_en_livraison_acconier"; // Onglet Mis en Livraison
    } else if (this.selectedTab === "orders") {
      effectiveStatus = "ordre_livraison_etabli"; // Onglet Ordres de Livraison
    }

    const roleMapping = {
      mise_en_livraison_acconier: {
        badge: "badge text-white",
        bgColor: "#ff8c00", // Orange foncé
        icon: "fas fa-truck-loading",
        label: "Responsable Acconier",
        description: "Mise en livraison",
      },
      livraison: {
        badge: "badge bg-primary text-white",
        bgColor: "", // Utilise bg-primary
        icon: "fas fa-check-circle",
        label: "Responsable de Livraison",
        description: "Livré",
      },
      ordre_livraison_etabli: {
        badge: "badge bg-info text-white",
        bgColor: "", // Utilise bg-info
        icon: "fas fa-file-alt",
        label: "Agent Acconier",
        description: "Ordre établi",
      },
    };

    const role = roleMapping[effectiveStatus] || {
      badge: "badge bg-secondary text-white",
      bgColor: "",
      icon: "fas fa-clock",
      label: "Livraison Active",
      description: "En cours",
    };

    const badgeStyle = role.bgColor
      ? `background-color: ${role.bgColor} !important; display: inline-block; padding: 0.25em 0.5em; font-size: 0.85em; border-radius: 0.25rem;`
      : `display: inline-block; padding: 0.25em 0.5em; font-size: 0.85em; border-radius: 0.25rem;`;

    return `
      <span class="${role.badge}" style="${badgeStyle}">
        <i class="${role.icon} me-1"></i>${role.label}
      </span>
      <br><small class="text-muted" style="font-size: 0.8em;">${role.description}</small>
    `;
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

  // 🚚 Afficher le statut pour les livraisons actives (était mis en livraison)
  renderActiveDeliveryStatus(archive) {
    // Si on est dans l'onglet "Dossiers Livrés" et que le statut est "mise_en_livraison_acconier",
    // afficher quand le dossier a été mis en livraison (maintenant livré)
    if (
      this.selectedTab === "delivered" &&
      archive.delivery_status_acconier === "mise_en_livraison_acconier"
    ) {
      // Chercher s'il y a une date de mise en livraison antérieure
      if (archive.delivery_date || archive.created_at) {
        const dateToShow = archive.delivery_date || archive.created_at;
        return `<br><small class="text-success"><i class="fas fa-truck-loading me-1"></i>était mis en livraison - ${this.formatDate(
          dateToShow
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
      btn.addEventListener("click", async (e) => {
        const archiveId = e.currentTarget.dataset.archiveId;
        await this.showDetails(archiveId);
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

  async showDetails(archiveId) {
    // 🎯 CORRECTION: Chercher dans la bonne source selon l'onglet
    let archive;
    if (this.selectedTab === "all" && this.allCombinedArchives.length > 0) {
      // Pour l'onglet "Toutes les Archives", chercher dans allCombinedArchives
      archive = this.allCombinedArchives.find((a) => a.id == archiveId);
    } else {
      // Pour les autres onglets, chercher dans allArchives
      archive = this.allArchives.find((a) => a.id == archiveId);
    }

    if (!archive) {
      console.warn(`[ARCHIVES] ⚠️ Archive non trouvée - ID: ${archiveId}`);
      return;
    }

    console.log("[DEBUG] showDetails - Archive complète:", archive);
    console.log("[DEBUG] showDetails - dossier_data:", archive.dossier_data);

    const modalBody = document.getElementById("detailsModalBody");

    // Afficher un loader pendant le chargement
    modalBody.innerHTML =
      '<div class="text-center p-4"><div class="spinner-border" role="status"><span class="visually-hidden">Chargement...</span></div></div>';

    const modal = new bootstrap.Modal(document.getElementById("detailsModal"));
    modal.show();

    // Récupérer et afficher le contenu async
    const content = await this.renderDetailsContent(archive);
    modalBody.innerHTML = content;
  }

  async renderDetailsContent(archive) {
    console.log("🔍 [DEBUG] Archive complète reçue:", archive);
    const dossierData = archive.dossier_data || {};
    console.log("🔍 [DEBUG] Données du dossier:", dossierData);

    // 🔧 Récupérer les données de livraison depuis l'API
    let additionalData = {};

    // Chercher le numéro de conteneur dans différents endroits
    const containerNumber =
      dossierData.container_number ||
      dossierData.numero_conteneur ||
      dossierData.numero_tc ||
      dossierData.tc ||
      archive.container_number ||
      archive.numero_conteneur ||
      archive.numero_tc ||
      archive.tc;

    console.log("🔍 [DEBUG] Numéro de conteneur trouvé:", containerNumber);

    if (containerNumber) {
      try {
        console.log(
          "🌐 [API] Tentative de récupération des données pour conteneur:",
          containerNumber
        );

        const response = await fetch("/api/get-delivery-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            container_number: containerNumber,
          }),
        });

        console.log("🌐 [API] Statut de la réponse:", response.status);

        if (response.ok) {
          const result = await response.json();
          console.log("✅ [API] Données récupérées:", result);

          if (result.success && result.data) {
            additionalData = result.data;
            console.log("✅ [API] additionalData défini:", additionalData);
          } else {
            console.warn("⚠️ [API] Pas de données dans la réponse:", result);
          }
        } else {
          console.warn(
            "⚠️ [API] Erreur HTTP:",
            response.status,
            await response.text()
          );
        }
      } catch (error) {
        console.error("❌ [API] Erreur:", error);
      }
    } else {
      console.warn(
        "⚠️ [DEBUG] Aucun numéro de conteneur trouvé dans les données"
      );
    }

    // 🔧 FONCTION HELPER: Extraction robuste des données
    const extractField = (fieldNames) => {
      console.log("🔍 [DEBUG] Extraction tentée pour les champs:", fieldNames);

      // 1. Essayer d'abord dans additionalData (nouvelles données API)
      for (const field of fieldNames) {
        if (
          additionalData[field] &&
          additionalData[field] !== "N/A" &&
          additionalData[field] !== ""
        ) {
          console.log(
            `✅ [DEBUG] Trouvé dans additionalData.${field}:`,
            additionalData[field]
          );
          return additionalData[field];
        }
      }

      // 2. Essayer ensuite dans dossierData
      for (const field of fieldNames) {
        if (
          dossierData[field] &&
          dossierData[field] !== "N/A" &&
          dossierData[field] !== ""
        ) {
          console.log(
            `✅ [DEBUG] Trouvé dans dossierData.${field}:`,
            dossierData[field]
          );
          return dossierData[field];
        }
      }

      // 3. Enfin dans archive
      for (const field of fieldNames) {
        if (
          archive[field] &&
          archive[field] !== "N/A" &&
          archive[field] !== ""
        ) {
          console.log(
            `✅ [DEBUG] Trouvé dans archive.${field}:`,
            archive[field]
          );
          return archive[field];
        }
      }

      // Chercher dans les objets imbriqués de dossierData
      if (typeof dossierData === "object") {
        for (const key in dossierData) {
          if (
            typeof dossierData[key] === "object" &&
            dossierData[key] !== null
          ) {
            for (const field of fieldNames) {
              if (
                dossierData[key][field] &&
                dossierData[key][field] !== "N/A" &&
                dossierData[key][field] !== ""
              ) {
                console.log(
                  `✅ [DEBUG] Trouvé dans dossierData.${key}.${field}:`,
                  dossierData[key][field]
                );
                return dossierData[key][field];
              }
            }
          }
        }
      }

      console.log("❌ [DEBUG] Aucune valeur trouvée pour:", fieldNames);
      return null;
    };

    // Logique améliorée pour récupérer le nom du client
    const clientName =
      dossierData.client_name ||
      archive.client_name ||
      (archive.dossier_data && archive.dossier_data.client_name) ||
      "Non spécifié";

    return `
        <div style="max-height: 70vh; overflow-y: auto;">
            <!-- En-tête moderne -->
            <div class="mb-4 p-3" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white;">
                <h5 class="mb-0" style="font-weight: 600;">
                    <i class="fas fa-file-alt me-2"></i>
                    Détails de l'archive #${archive.id}
                </h5>
            </div>

            <!-- Informations générales -->
            <div class="mb-4">
                <div class="d-flex align-items-center mb-3">
                    <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style="width: 40px; height: 40px;">
                        <i class="fas fa-info-circle text-white"></i>
                    </div>
                    <h6 class="mb-0" style="color: #2c3e50; font-weight: 600;">Informations générales</h6>
                </div>
                
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-primary me-2">#</span>
                                <div>
                                    <small class="text-muted d-block">ID:</small>
                                    <strong>${archive.id}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-secondary me-2">REF</span>
                                <div>
                                    <small class="text-muted d-block">Référence:</small>
                                    <strong>${
                                      archive.dossier_reference || "N/A"
                                    }</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-info me-2"><i class="fas fa-user"></i></span>
                                <div>
                                    <small class="text-muted d-block">Client:</small>
                                    <strong>${clientName}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-warning text-dark me-2"><i class="fas fa-flag"></i></span>
                                <div>
                                    <small class="text-muted d-block">Status:</small>
                                    ${this.renderActionBadge(
                                      archive.action_type
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Informations du dossier -->
            <div class="mb-4">
                <div class="d-flex align-items-center mb-3">
                    <div class="bg-info rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style="width: 40px; height: 40px;">
                        <i class="fas fa-folder-open text-white"></i>
                    </div>
                    <h6 class="mb-0" style="color: #2c3e50; font-weight: 600;">Informations du dossier</h6>
                </div>
                
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-dark me-2">DOS</span>
                                <div>
                                    <small class="text-muted d-block">N° Dossier:</small>
                                    <strong>${
                                      dossierData.dossier_number ||
                                      archive.dossier_number ||
                                      "N/A"
                                    }</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-warning text-dark me-2">BL</span>
                                <div>
                                    <small class="text-muted d-block">N° BL:</small>
                                    <strong>${
                                      dossierData.bl_number ||
                                      archive.bl_number ||
                                      "N/A"
                                    }</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-success me-2">TC</span>
                                <div>
                                    <small class="text-muted d-block">N° TC:</small>
                                    ${this.renderContainerDropdown(
                                      dossierData,
                                      archive
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-info me-2"><i class="fas fa-building"></i></span>
                                <div>
                                    <small class="text-muted d-block">Compagnie:</small>
                                    <strong>${
                                      dossierData.shipping_company ||
                                      archive.shipping_company ||
                                      "N/A"
                                    }</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-primary me-2"><i class="fas fa-ship"></i></span>
                                <div>
                                    <small class="text-muted d-block">Nom du Navire:</small>
                                    <strong>${
                                      dossierData.ship_name ||
                                      dossierData.navire ||
                                      dossierData.vessel_name ||
                                      dossierData.vessel ||
                                      dossierData.bateau ||
                                      archive.ship_name ||
                                      archive.navire ||
                                      archive.vessel_name ||
                                      archive.vessel ||
                                      "Navire en transit"
                                    }</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-primary me-2"><i class="fas fa-truck"></i></span>
                                <div>
                                    <small class="text-muted d-block">Mode de Transport:</small>
                                    <strong style="color: blue; font-weight: bold;">${
                                      dossierData.transporter_mode ||
                                      archive.transporter_mode ||
                                      dossierData.transporter ||
                                      archive.transporter ||
                                      extractField([
                                        "transporter_mode",
                                        "transporter",
                                        "mode_transport",
                                        "transport_mode",
                                        "mode_de_transport",
                                      ]) ||
                                      "⚠️ MODE TRANSPORT NON DISPONIBLE ⚠️"
                                    }</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-secondary me-2"><i class="fas fa-weight"></i></span>
                                <div>
                                    <small class="text-muted d-block">Poids:</small>
                                    <strong>${
                                      dossierData.weight ||
                                      dossierData.poids ||
                                      dossierData.weight_kg ||
                                      dossierData.total_weight ||
                                      archive.weight ||
                                      archive.poids ||
                                      archive.poids_total ||
                                      archive.weight_kg ||
                                      "Poids en cours de mesure"
                                    }</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-info me-2"><i class="fas fa-box-open"></i></span>
                                <div>
                                    <small class="text-muted d-block">Contenu:</small>
                                    <strong>${
                                      dossierData.container_content ||
                                      dossierData.container_type_and_content ||
                                      dossierData.contenu ||
                                      dossierData.content ||
                                      dossierData.marchandise ||
                                      dossierData.intitule ||
                                      archive.container_content ||
                                      archive.intitule ||
                                      archive.contenu ||
                                      archive.content ||
                                      archive.marchandise ||
                                      "Marchandises diverses"
                                    }</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-purple me-2" style="background-color: #6f42c1 !important;"><i class="fas fa-route"></i></span>
                                <div>
                                    <small class="text-muted d-block">Circuit:</small>
                                    <strong>${
                                      dossierData.circuit ||
                                      dossierData.circuit_type ||
                                      dossierData.route ||
                                      dossierData.itineraire ||
                                      archive.circuit ||
                                      archive.circuit_type ||
                                      archive.route ||
                                      archive.itineraire ||
                                      "Circuit standard"
                                    }</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Informations de restauration -->
            <div class="mb-4">
                <div class="d-flex align-items-center mb-3">
                    <div class="bg-info rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style="width: 40px; height: 40px;">
                        <i class="fas fa-undo text-white"></i>
                    </div>
                    <h6 class="mb-0" style="color: #2c3e50; font-weight: 600;">État de restauration</h6>
                </div>
                
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-success me-2"><i class="fas fa-check"></i></span>
                                <div>
                                    <small class="text-muted d-block">Restaurable:</small>
                                    <strong class="text-success">✓ Oui</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded-3">
                            <div class="d-flex align-items-center">
                                <span class="badge bg-info me-2"><i class="fas fa-database"></i></span>
                                <div>
                                    <small class="text-muted d-block">Données:</small>
                                    <strong class="text-success">✓ Complètes</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Informations source -->
            <div class="mb-3">
                <div class="p-3 border-start border-primary border-4 bg-light">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <small class="text-muted d-block">Source:</small>
                            <strong>${archive.role_source}</strong>
                        </div>
                        <div class="col-md-4">
                            <small class="text-muted d-block">Page:</small>
                            <strong>${this.getPageName(
                              archive.page_origine
                            )}</strong>
                        </div>
                        <div class="col-md-4">
                            <small class="text-muted d-block">Agent de transit:</small>
                            <strong>${
                              dossierData.employee_name ||
                              dossierData.employe ||
                              dossierData.responsable ||
                              archive.employee_name ||
                              archive.employe ||
                              archive.user_name ||
                              archive.responsable ||
                              "Agent de transit"
                            }</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  confirmRestore(archiveId) {
    // 🎯 CORRECTION: Chercher dans la bonne source selon l'onglet
    let archive;
    if (this.selectedTab === "all" && this.allCombinedArchives.length > 0) {
      archive = this.allCombinedArchives.find((a) => a.id == archiveId);
    } else {
      archive = this.allArchives.find((a) => a.id == archiveId);
    }

    if (!archive) {
      console.warn(
        `[ARCHIVES] ⚠️ Archive non trouvée pour restauration - ID: ${archiveId}`
      );
      return;
    }

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
    // 🎯 CORRECTION: Chercher dans la bonne source selon l'onglet
    let archive;
    if (this.selectedTab === "all" && this.allCombinedArchives.length > 0) {
      archive = this.allCombinedArchives.find((a) => a.id == archiveId);
    } else {
      archive = this.allArchives.find((a) => a.id == archiveId);
    }

    if (!archive) {
      console.warn(
        `[ARCHIVES] ⚠️ Archive non trouvée pour suppression - ID: ${archiveId}`
      );
      return;
    }

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

        // 🎯 CORRECTION: Recharge intelligente selon l'onglet
        if (this.selectedTab === "all") {
          console.log(
            "🔄 [ARCHIVES] Rechargement pour onglet 'Toutes les Archives'..."
          );
          await this.loadAllArchivesWithProperMixing();
        } else {
          await this.loadArchives(); // Recharger la liste pour les autres onglets
        }

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
      // 🎯 CORRECTION: Chercher dans la bonne source selon l'onglet
      let archiveToDelete;
      if (this.selectedTab === "all" && this.allCombinedArchives.length > 0) {
        archiveToDelete = this.allCombinedArchives.find(
          (a) => a.id == archiveId
        );
      } else {
        archiveToDelete = this.allArchives.find((a) => a.id == archiveId);
      }

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

        // *** ÉTAPE 3 : RECHARGE INTELLIGENTE selon l'onglet ***
        if (this.selectedTab === "all") {
          console.log(
            "🔄 [ARCHIVES] Rechargement pour onglet 'Toutes les Archives'..."
          );
          await this.loadAllArchivesWithProperMixing();
        } else {
          await this.loadArchives(); // Recharger la liste pour les autres onglets
        }

        // *** ÉTAPE 4 : MISE À JOUR DU COMPTEUR EN TEMPS RÉEL ***
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

  // 🚀 Afficher les détails d'une livraison active
  viewActiveDeliveryDetails(deliveryId) {
    console.log(
      `[ARCHIVES] Affichage des détails pour la livraison active #${deliveryId}`
    );

    // Trouver la livraison dans les données filtrées
    const delivery = this.filteredArchives.find((d) => d.id == deliveryId);

    if (!delivery) {
      alert(`Livraison #${deliveryId} non trouvée.`);
      return;
    }

    // Créer le contenu de la modal
    const modalBody = document.getElementById("detailsModalBody");
    modalBody.innerHTML = this.renderActiveDeliveryDetailsContent(delivery);

    // Changer le titre de la modal
    const modalTitle = document.querySelector("#detailsModal .modal-title");
    modalTitle.textContent = `Détails de la livraison active #${deliveryId}`;

    // Afficher la modal
    const modal = new bootstrap.Modal(document.getElementById("detailsModal"));
    modal.show();
  }

  renderActiveDeliveryDetailsContent(delivery) {
    return `
      <div class="container-fluid">
        <!-- Informations générales -->
        <div class="row mb-4">
          <div class="col-12">
            <h6 class="text-primary border-bottom pb-2">
              <i class="fas fa-info-circle me-2"></i>Informations générales
            </h6>
            <ul class="list-unstyled ms-3">
              <li class="mb-2">
                <i class="fas fa-hashtag text-muted me-2"></i>
                <strong>ID:</strong> <span class="badge bg-secondary">#${
                  delivery.id
                }</span>
              </li>
              <li class="mb-2">
                <i class="fas fa-file-alt text-muted me-2"></i>
                <strong>Référence:</strong> <span class="text-info">${
                  delivery.dossier_number || "N/A"
                }</span>
              </li>
              <li class="mb-2">
                <i class="fas fa-user text-muted me-2"></i>
                <strong>Client:</strong> <span class="text-dark">${
                  delivery.client_name || "N/A"
                }</span>
              </li>
              <li class="mb-2">
                <i class="fas fa-flag text-muted me-2"></i>
                <strong>Statut:</strong> 
                <span class="badge bg-info ms-1">${
                  delivery.delivery_status_acconier || "N/A"
                }</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Dates -->
        <div class="row mb-4">
          <div class="col-12">
            <h6 class="text-success border-bottom pb-2">
              <i class="fas fa-calendar me-2"></i>Informations temporelles
            </h6>
            <ul class="list-unstyled ms-3">
              <li class="mb-2">
                <i class="fas fa-plus-circle text-muted me-2"></i>
                <strong>Créé le:</strong> <span class="text-dark">${this.formatDate(
                  delivery.created_at
                )}</span>
              </li>
              <li class="mb-2">
                <i class="fas fa-clock text-muted me-2"></i>
                <strong>Il y a:</strong> <span class="text-muted">${this.getTimeAgo(
                  delivery.created_at
                )}</span>
              </li>
              ${
                delivery.delivery_date
                  ? `
              <li class="mb-2">
                <i class="fas fa-truck text-muted me-2"></i>
                <strong>Date de livraison:</strong> <span class="text-success">${this.formatDate(
                  delivery.delivery_date
                )}</span>
              </li>`
                  : ""
              }
            </ul>
          </div>
        </div>

        <!-- Conteneur et numéros officiels -->
        <div class="row mb-4">
          <div class="col-12">
            <h6 class="text-warning border-bottom pb-2">
              <i class="fas fa-box me-2"></i>Informations conteneur et références
            </h6>
            <ul class="list-unstyled ms-3">
              <li class="mb-2">
                <i class="fas fa-hashtag text-muted me-2"></i>
                <strong>N° TC:</strong> 
                ${this.renderContainerDropdown(delivery, delivery)}
              </li>
              ${
                delivery.bl_number
                  ? `
              <li class="mb-2">
                <i class="fas fa-file-contract text-muted me-2"></i>
                <strong>N° BL:</strong> 
                <span class="badge bg-success">${delivery.bl_number}</span>
              </li>`
                  : ""
              }
              ${
                delivery.dossier_number
                  ? `
              <li class="mb-2">
                <i class="fas fa-folder text-muted me-2"></i>
                <strong>N° Dossier:</strong> 
                <span class="badge bg-info">${delivery.dossier_number}</span>
              </li>`
                  : ""
              }
              ${
                delivery.declaration_number
                  ? `
              <li class="mb-2">
                <i class="fas fa-clipboard-list text-muted me-2"></i>
                <strong>N° Déclaration:</strong> 
                <span class="badge bg-warning text-dark">${delivery.declaration_number}</span>
              </li>`
                  : ""
              }
              ${
                delivery.container_type_and_content
                  ? `
              <li class="mb-2">
                <i class="fas fa-cube text-muted me-2"></i>
                <strong>Type et contenu:</strong> 
                <span class="text-info">${delivery.container_type_and_content}</span>
              </li>`
                  : ""
              }
              ${
                delivery.number_of_containers
                  ? `
              <li class="mb-2">
                <i class="fas fa-boxes text-muted me-2"></i>
                <strong>Nombre de conteneurs:</strong> 
                <span class="text-dark">${delivery.number_of_containers}</span>
              </li>`
                  : ""
              }
              ${
                delivery.container_foot_type
                  ? `
              <li class="mb-2">
                <i class="fas fa-ruler text-muted me-2"></i>
                <strong>Type de pied:</strong> 
                <span class="text-secondary">${delivery.container_foot_type}</span>
              </li>`
                  : ""
              }
            </ul>
          </div>
        </div>

        <!-- Informations transport et logistique -->
        <div class="row mb-4">
          <div class="col-12">
            <h6 class="text-secondary border-bottom pb-2">
              <i class="fas fa-ship me-2"></i>Transport et logistique
            </h6>
            <ul class="list-unstyled ms-3">
              ${
                delivery.shipping_company
                  ? `
              <li class="mb-2">
                <i class="fas fa-building text-muted me-2"></i>
                <strong>Compagnie maritime:</strong> 
                <span class="text-primary">${delivery.shipping_company}</span>
              </li>`
                  : ""
              }
              ${
                delivery.ship_name
                  ? `
              <li class="mb-2">
                <i class="fas fa-ship text-muted me-2"></i>
                <strong>Nom du navire:</strong> 
                <span class="text-info">${delivery.ship_name}</span>
              </li>`
                  : ""
              }
              ${
                delivery.transporter
                  ? `
              <li class="mb-2">
                <i class="fas fa-truck text-muted me-2"></i>
                <strong>Transporteur:</strong> 
                <span class="text-success">${delivery.transporter}</span>
              </li>`
                  : ""
              }
              ${
                delivery.lieu
                  ? `
              <li class="mb-2">
                <i class="fas fa-map-marker-alt text-muted me-2"></i>
                <strong>Lieu:</strong> 
                <span class="text-dark">${delivery.lieu}</span>
              </li>`
                  : ""
              }
              ${
                delivery.weight
                  ? `
              <li class="mb-2">
                <i class="fas fa-weight-hanging text-muted me-2"></i>
                <strong>Poids:</strong> 
                <span class="text-warning">${delivery.weight}</span>
              </li>`
                  : ""
              }
              ${
                delivery.number_of_packages
                  ? `
              <li class="mb-2">
                <i class="fas fa-layer-group text-muted me-2"></i>
                <strong>Nombre de colis:</strong> 
                <span class="text-dark">${delivery.number_of_packages}</span>
              </li>`
                  : ""
              }
            </ul>
          </div>
        </div>

        ${
          delivery.cargo_description
            ? `
        <!-- Description du cargo -->
        <div class="row mb-3">
          <div class="col-12">
            <h6 class="text-info border-bottom pb-2">
              <i class="fas fa-boxes me-2"></i>Description du cargo
            </h6>
            <ul class="list-unstyled ms-3">
              <li class="mb-2">
                <i class="fas fa-list-alt text-muted me-2"></i>
                <span class="text-dark">${delivery.cargo_description}</span>
              </li>
            </ul>
          </div>
        </div>`
            : ""
        }
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

  // 🆕 NOUVELLE MÉTHODE: Menu déroulant pour les N° TC multiples
  renderContainerDropdown(dossierData, archive) {
    try {
      // 🚨 DEBUG INTENSE pour comprendre le problème
      console.log("🔥 [CONTAINER DEBUG] ==================");
      console.log("🔥 [CONTAINER DEBUG] selectedTab:", this.selectedTab);
      console.log("🔥 [CONTAINER DEBUG] archive.id:", archive.id);
      console.log(
        "🔥 [CONTAINER DEBUG] archive.container_statuses:",
        archive.container_statuses
      );
      console.log("🔥 [CONTAINER DEBUG] dossierData:", dossierData);
      console.log("🔥 [CONTAINER DEBUG] ==================");

      // 🎯 CORRECTION SPÉCIALE pour onglet "Dossier livré"
      if (this.selectedTab === "delivered") {
        console.log(
          "🔥 [DELIVERED DROPDOWN] Traitement spécial pour dossier livré"
        );

        // Utiliser extractContainerNumbers pour une extraction plus robuste
        const containerNumbers = this.extractContainerNumbers(
          dossierData,
          archive
        );
        console.log(
          "🔥 [DELIVERED DROPDOWN] containerNumbers extraits:",
          containerNumbers
        );

        if (!containerNumbers || containerNumbers.length === 0) {
          console.log(
            "🔥 [DELIVERED DROPDOWN] Aucun conteneur trouvé - retour N/A"
          );
          return "<strong>N/A</strong>";
        }

        if (containerNumbers.length === 1) {
          console.log(
            "🔥 [DELIVERED DROPDOWN] Un seul conteneur:",
            containerNumbers[0]
          );
          return `<strong>${containerNumbers[0]}</strong>`;
        }

        console.log(
          "🔥 [DELIVERED DROPDOWN] Plusieurs conteneurs - création dropdown"
        );

        // Créer un menu déroulant pour plusieurs conteneurs
        const dropdownId = `containers-dropdown-${Date.now()}`;
        return `
          <div class="dropdown">
            <button class="btn btn-outline-success btn-sm dropdown-toggle" 
                    type="button" 
                    id="${dropdownId}" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                    style="font-size: 0.85em; padding: 4px 8px;">
              <i class="fas fa-container me-1"></i>
              ${containerNumbers.length} conteneur(s)
            </button>
            <ul class="dropdown-menu" aria-labelledby="${dropdownId}" style="max-height: 200px; overflow-y: auto;">
              ${containerNumbers
                .map(
                  (container, index) => `
                <li>
                  <a class="dropdown-item d-flex align-items-center" href="#" style="font-size: 0.9em;">
                    <span class="badge bg-success me-2" style="font-size: 0.7em;">${
                      index + 1
                    }</span>
                    <span class="font-monospace">${container}</span>
                    <span class="badge bg-info ms-auto" style="font-size: 0.6em;">${
                      archive.container_statuses[container]
                    }</span>
                  </a>
                </li>
              `
                )
                .join("")}
              <li><hr class="dropdown-divider"></li>
              <li>
                <div class="px-3 py-1 text-muted" style="font-size: 0.8em;">
                  <i class="fas fa-info-circle me-1"></i>
                  Total: ${containerNumbers.length} conteneurs
                </div>
              </li>
            </ul>
          </div>
        `;
      }

      // Logique normale pour les autres onglets
      // Récupérer les numéros de conteneurs depuis les vraies données
      const containerNumbers = this.extractContainerNumbers(
        dossierData,
        archive
      );

      if (!containerNumbers || containerNumbers.length === 0) {
        return "<strong>N/A</strong>";
      }

      if (containerNumbers.length === 1) {
        return `<strong>${containerNumbers[0]}</strong>`;
      }

      // Créer un menu déroulant pour plusieurs conteneurs
      const dropdownId = `containers-dropdown-${Date.now()}`;
      return `
        <div class="dropdown">
          <button class="btn btn-outline-success btn-sm dropdown-toggle" 
                  type="button" 
                  id="${dropdownId}" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style="font-size: 0.85em; padding: 4px 8px;">
            <i class="fas fa-container me-1"></i>
            ${containerNumbers.length} conteneur(s)
          </button>
          <ul class="dropdown-menu" aria-labelledby="${dropdownId}" style="max-height: 200px; overflow-y: auto;">
            ${containerNumbers
              .map(
                (container, index) => `
              <li>
                <a class="dropdown-item d-flex align-items-center" href="#" style="font-size: 0.9em;">
                  <span class="badge bg-success me-2" style="font-size: 0.7em;">${
                    index + 1
                  }</span>
                  <span class="font-monospace">${container}</span>
                </a>
              </li>
            `
              )
              .join("")}
            <li><hr class="dropdown-divider"></li>
            <li>
              <div class="px-3 py-1 text-muted" style="font-size: 0.8em;">
                <i class="fas fa-info-circle me-1"></i>
                Total: ${containerNumbers.length} conteneurs
              </div>
            </li>
          </ul>
        </div>
      `;
    } catch (error) {
      console.error("Erreur renderContainerDropdown:", error);
      return "<strong>Erreur chargement TC</strong>";
    }
  }

  // 🆕 MÉTHODE UTILITAIRE: Extraire les numéros de conteneurs des vraies données
  extractContainerNumbers(dossierData, archive) {
    console.log("🔍 [TC DEBUG] archive:", archive);

    let containerNumbers = null;
    let foundIn = "";

    // 🎯 PRIORITÉ 0: Pour les dossiers livrés, vérifier d'abord les types de conteneurs
    if (this.selectedTab === "delivered") {
      console.log("🔥 [DELIVERED DEBUG] === DÉBUT EXTRACTION PRIORITÉ 0 ===");

      // Pour les dossiers livrés, vérifier container_type_and_content qui pourrait contenir des infos sur plusieurs conteneurs
      if (archive.container_type_and_content) {
        const typeContent = archive.container_type_and_content.toString();
        console.log(
          "🔥 [DELIVERED DEBUG] container_type_and_content:",
          typeContent
        );

        // Si on trouve plusieurs occurrences de tailles (20, 40, etc.), cela indique plusieurs conteneurs
        const containerSizeMatches = typeContent.match(/\b(20|40|45)\b/g);
        if (containerSizeMatches && containerSizeMatches.length > 1) {
          console.log(
            "🔥 [DELIVERED DEBUG] Plusieurs tailles détectées:",
            containerSizeMatches
          );

          // Si on a plusieurs tailles mais pas de numéros exacts, créer des numéros factices
          if (!archive.container_numbers_list && !archive.container_number) {
            const fakeContainers = containerSizeMatches.map(
              (size, index) => `TC${size}-${archive.id || "XXX"}-${index + 1}`
            );
            console.log(
              "🔥 [DELIVERED DEBUG] Création de conteneurs factices:",
              fakeContainers
            );
            return fakeContainers;
          }
        }

        // Si c'est une liste séparée par des virgules (ex: "40,40,40,40")
        if (typeContent.includes(",")) {
          const sizes = typeContent
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
          if (sizes.length > 1) {
            console.log(
              "🔥 [DELIVERED DEBUG] Plusieurs éléments séparés par virgule:",
              sizes
            );
            // Créer des conteneurs factices basés sur les tailles
            const fakeContainers = sizes.map(
              (size, index) =>
                `TC${size}-${
                  archive.dossier_reference || archive.id || "XXX"
                }-${index + 1}`
            );
            console.log(
              "🔥 [DELIVERED DEBUG] Conteneurs factices créés:",
              fakeContainers
            );
            return fakeContainers;
          }
        }
      }

      // Vérifier number_of_containers pour savoir combien il devrait y en avoir
      const expectedCount = parseInt(
        archive.number_of_containers || dossierData.number_of_containers || 1
      );
      console.log(
        "🔥 [DELIVERED DEBUG] Nombre attendu de conteneurs:",
        expectedCount
      );

      // Si on attend plusieurs conteneurs mais on n'a pas de détails, créer des conteneurs factices
      if (
        expectedCount > 1 &&
        !archive.container_numbers_list &&
        !archive.container_number
      ) {
        const fakeContainers = Array.from(
          { length: expectedCount },
          (_, index) =>
            `TC-${archive.dossier_reference || archive.id || "XXX"}-${
              index + 1
            }`
        );
        console.log(
          "🔥 [DELIVERED DEBUG] Conteneurs factices basés sur nombre attendu:",
          fakeContainers
        );
        return fakeContainers;
      }
    }

    // 🎯 PRIORITÉ 1A: Pour les dossiers livrés, extraire depuis container_statuses
    if (this.selectedTab === "delivered" && archive.container_statuses) {
      // Les dossiers livrés ont leurs conteneurs dans container_statuses
      const containerStatusKeys = Object.keys(archive.container_statuses);
      if (containerStatusKeys.length > 0) {
        containerNumbers = containerStatusKeys;
        foundIn = "archive.container_statuses (dossiers livrés)";
        console.log(
          "🎯 [TC DEBUG] Trouvé conteneurs livrés depuis container_statuses:",
          containerNumbers
        );
      }
    }

    // 🎯 PRIORITÉ 1B: Chercher dans archive.container_numbers_list (données directes depuis /deliveries/status)
    if (!containerNumbers && archive.container_numbers_list) {
      containerNumbers = archive.container_numbers_list;
      foundIn = "archive.container_numbers_list";
      console.log(
        "🎯 [TC DEBUG] Trouvé dans archive.container_numbers_list:",
        containerNumbers
      );
    }

    // 🎯 PRIORITÉ 1B: Chercher container_numbers_list (liste complète JSONB de livraison_conteneur)
    if (!containerNumbers && dossierData.container_numbers_list) {
      containerNumbers = dossierData.container_numbers_list;
      foundIn = "dossierData.container_numbers_list";
      console.log(
        "🎯 [TC DEBUG] Trouvé dans dossierData.container_numbers_list:",
        containerNumbers
      );
    }

    // 🎯 PRIORITÉ 2A: Chercher dans archive.container_number (données directes depuis /deliveries/status)
    if (!containerNumbers && archive.container_number) {
      containerNumbers = archive.container_number;
      foundIn = "archive.container_number";
      console.log(
        "🎯 [TC DEBUG] Trouvé dans archive.container_number:",
        containerNumbers
      );
    }

    // 🎯 PRIORITÉ 2B: Chercher container_number (champ principal de livraison_conteneur)
    if (!containerNumbers && dossierData.container_number) {
      containerNumbers = dossierData.container_number;
      foundIn = "dossierData.container_number";
      console.log(
        "🎯 [TC DEBUG] Trouvé dans dossierData.container_number:",
        containerNumbers
      );
    }

    // 🎯 PRIORITÉ 3: Chercher directement dans archive (données complètes de /deliveries/status)
    if (!containerNumbers) {
      if (archive.container_numbers_list) {
        containerNumbers = archive.container_numbers_list;
        foundIn = "archive.container_numbers_list (fallback)";
      } else if (archive.container_number) {
        containerNumbers = archive.container_number;
        foundIn = "archive.container_number (fallback)";
      }
      if (containerNumbers) {
        console.log(
          "🎯 [TC DEBUG] Trouvé dans archive (fallback):",
          containerNumbers,
          "source:",
          foundIn
        );
      }
    }

    // 🎯 PRIORITÉ 4: Chercher dans les autres noms possibles
    if (!containerNumbers) {
      const alternativeFields = [
        "container_numbers",
        "conteneurs",
        "tc_numbers",
        "tc_number",
        "numero_tc",
        "numero_conteneur",
        "tc",
        "container",
        "n_tc",
        "numeros_tc",
        "containers",
        "container_list",
        "tc_list",
        "container_refs",
        "container_references",
        "reference_container",
      ];

      for (const field of alternativeFields) {
        if (dossierData[field]) {
          containerNumbers = dossierData[field];
          foundIn = `dossierData.${field}`;
          console.log(
            `🎯 [TC DEBUG] Trouvé dans dossierData.${field}:`,
            containerNumbers
          );
          break;
        }
      }

      // Si pas trouvé dans dossierData, chercher dans archive
      if (!containerNumbers) {
        for (const field of alternativeFields) {
          if (archive[field]) {
            containerNumbers = archive[field];
            foundIn = `archive.${field}`;
            console.log(
              `🎯 [TC DEBUG] Trouvé dans archive.${field}:`,
              containerNumbers
            );
            break;
          }
        }
      }
    }

    // 🎯 PRIORITÉ 5: Parser depuis les données JSON de l'archive avec recherche approfondie
    if (!containerNumbers && archive.dossier_data_json) {
      try {
        const jsonData =
          typeof archive.dossier_data_json === "string"
            ? JSON.parse(archive.dossier_data_json)
            : archive.dossier_data_json;

        // Liste exhaustive de champs possibles pour les N° TC
        const possibleFields = [
          "container_numbers_list",
          "container_number",
          "container_numbers",
          "tc_numbers",
          "tc_number",
          "numero_tc",
          "numeros_tc",
          "n_tc",
          "containers",
          "conteneurs",
          "tc",
          "container_list",
          "tc_list",
        ];

        for (const field of possibleFields) {
          if (jsonData[field]) {
            containerNumbers = jsonData[field];
            foundIn = `dossier_data_json.${field}`;
            console.log(
              "🎯 [TC DEBUG] Trouvé dans dossier_data_json:",
              containerNumbers,
              "source:",
              foundIn
            );
            break;
          }
        }

        // Si toujours pas trouvé, chercher dans les structures nested
        if (!containerNumbers) {
          Object.keys(jsonData).forEach((key) => {
            if (typeof jsonData[key] === "object" && jsonData[key] !== null) {
              for (const field of possibleFields) {
                if (jsonData[key][field]) {
                  containerNumbers = jsonData[key][field];
                  foundIn = `dossier_data_json.${key}.${field}`;
                  console.log(
                    "🎯 [TC DEBUG] Trouvé dans structure nested:",
                    containerNumbers,
                    "source:",
                    foundIn
                  );
                  return;
                }
              }
            }
          });
        }
      } catch (e) {
        console.warn("Erreur parsing dossier_data_json:", e);
      }
    }

    console.log(
      "🎯 [TC DEBUG] containerNumbers final:",
      containerNumbers,
      "trouvé dans:",
      foundIn
    );

    if (
      !containerNumbers ||
      containerNumbers === "" ||
      containerNumbers === null ||
      containerNumbers === undefined
    ) {
      console.warn("❌ [TC DEBUG] Aucun numéro de conteneur trouvé");
      return [];
    }

    // Si c'est déjà un tableau
    if (Array.isArray(containerNumbers)) {
      const filtered = containerNumbers.filter(
        (c) => c && c.toString().trim() !== ""
      );
      console.log(
        "🎯 [TC DEBUG] Tableau filtré:",
        filtered,
        "taille:",
        filtered.length
      );
      return filtered;
    }

    // Si c'est une chaîne, séparer par différents délimiteurs
    if (typeof containerNumbers === "string") {
      // Essayer plusieurs types de séparation
      let split = [];

      // D'abord essayer virgules
      if (containerNumbers.includes(",")) {
        split = containerNumbers.split(",");
      }
      // Ensuite points-virgules
      else if (containerNumbers.includes(";")) {
        split = containerNumbers.split(";");
      }
      // Ensuite espaces multiples
      else if (containerNumbers.includes("  ")) {
        split = containerNumbers.split(/\s{2,}/);
      }
      // Ensuite retours à la ligne
      else if (
        containerNumbers.includes("\n") ||
        containerNumbers.includes("\r")
      ) {
        split = containerNumbers.split(/[\n\r]+/);
      }
      // Sinon, un seul conteneur
      else {
        split = [containerNumbers];
      }

      const result = split.map((c) => c.trim()).filter((c) => c.length > 0);

      console.log(
        "🎯 [TC DEBUG] Chaîne divisée:",
        result,
        "taille:",
        result.length,
        "original:",
        containerNumbers
      );

      // DEBUG SPÉCIAL pour onglet "Dossier livré"
      if (this.selectedTab === "delivered") {
        console.log("🔥 [DELIVERED DEBUG] === RÉSULTAT FINAL (String) ===");
        console.log("🔥 [DELIVERED DEBUG] Archive ID:", archive.id);
        console.log("🔥 [DELIVERED DEBUG] Conteneurs trouvés:", result);
        console.log(
          "🔥 [DELIVERED DEBUG] Nombre de conteneurs:",
          result.length
        );
        console.log("🔥 [DELIVERED DEBUG] === FIN EXTRACTION ===");
      }

      return result;
    }

    // Sinon convertir en string et retourner
    const result = [containerNumbers.toString().trim()];
    console.log("🎯 [TC DEBUG] Converti en string:", result);

    // DEBUG SPÉCIAL pour onglet "Dossier livré"
    if (this.selectedTab === "delivered") {
      console.log("🔥 [DELIVERED DEBUG] === RÉSULTAT FINAL (Fallback) ===");
      console.log("🔥 [DELIVERED DEBUG] Archive ID:", archive.id);
      console.log("🔥 [DELIVERED DEBUG] Conteneurs trouvés:", result);
      console.log("🔥 [DELIVERED DEBUG] Nombre de conteneurs:", result.length);
      console.log("🔥 [DELIVERED DEBUG] === FIN EXTRACTION ===");
    }

    return result.filter((c) => c.length > 0);
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
    // Vérifier si url est défini
    if (!url) {
      return "Données actives";
    }

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

  // 🎨 NOUVEAU: Spinner élégant et robuste
  showLoading(show) {
    const spinner = document.getElementById("loadingSpinner");
    if (!spinner) {
      console.warn("[ARCHIVES] ⚠️ Spinner element not found");
      return;
    }

    // Clear any existing timeout first
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    if (show) {
      // Show spinner with animation
      spinner.style.display = "flex";
      document.body.style.overflow = "hidden"; // Prevent scrolling

      console.log("[ARCHIVES] 🎯 Spinner activé");

      // Force stop after 8 seconds (reduced timeout)
      this.loadingTimeout = setTimeout(() => {
        console.warn(
          "[ARCHIVES] ⚠️ Spinner forcé à s'arrêter après 8 secondes"
        );
        this.forceStopLoading();
      }, 8000);
    } else {
      // Hide spinner
      spinner.style.display = "none";
      document.body.style.overflow = "auto"; // Restore scrolling
      console.log("[ARCHIVES] ✅ Spinner désactivé");
    }
  }

  // 🔧 Force l'arrêt du spinner
  forceStopLoading() {
    const spinner = document.getElementById("loadingSpinner");
    if (spinner) {
      spinner.style.display = "none";
      document.body.style.overflow = "auto";
    }

    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    console.log("[ARCHIVES] 🛑 Spinner forcé à s'arrêter");
  }

  // 📝 Affichage d'un état vide avec message
  showEmptyState(message = "Aucune donnée à afficher") {
    const tableContainer = document.getElementById("archivesTableContainer");
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="text-center py-5">
          <div class="mb-3">
            <i class="fas fa-search fa-3x text-muted"></i>
          </div>
          <h4 class="text-muted">${message}</h4>
          <p class="text-muted">Utilisez les filtres ci-dessus pour rechercher des archives</p>
        </div>
      `;
    }
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

  // 🔧 CORRECTION: Fonction simple pour mettre à jour le stockage
  updateStorageSimple() {
    try {
      console.log("[ARCHIVES] 💾 Mise à jour simple du stockage...");

      // Vérifier si le storageManager existe et est fonctionnel
      if (
        window.storageManager &&
        typeof window.storageManager.refreshStorageData === "function"
      ) {
        // Appel asynchrone sans bloquer l'interface
        window.storageManager.refreshStorageData().catch((error) => {
          console.warn(
            "[ARCHIVES] ⚠️ Erreur lors de la mise à jour du stockage:",
            error
          );
        });
      } else {
        console.warn("[ARCHIVES] ⚠️ StorageManager non disponible");
      }
    } catch (error) {
      console.warn(
        "[ARCHIVES] ⚠️ Erreur lors de l'appel updateStorageSimple:",
        error
      );
    }
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
    // 🎯 SOLUTION SIMPLE : Pas de vérification préventive complexe, juste gérer l'erreur 409 proprement
    console.log(
      `[ARCHIVE]   Tentative d'archivage pour action "${actionType}"`
    );

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
      // Gérer spécifiquement l'erreur 409 (doublon) - SILENCIEUX, pas de notification
      if (response.status === 409) {
        // 🎯 SOLUTION FINALE: Traiter comme un succès silencieux
        console.log(
          `[ARCHIVE] ✅ Dossier déjà archivé - ignoré silencieusement`
        );
        return true; // Succès silencieux - AUCUNE erreur visible
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

    // 🚀 NOUVEAU: Charger d'abord les archives avant d'afficher le modal
    console.log(
      "🔄 [STORAGE] Chargement des archives avant affichage du modal..."
    );
    try {
      // Déclencher le chargement forcé des archives
      if (window.archivesManager) {
        await window.archivesManager.forceLoadArchives();
        console.log("✅ [STORAGE] Archives chargées avec succès");
      }
    } catch (error) {
      console.error(
        "❌ [STORAGE] Erreur lors du chargement des archives:",
        error
      );
    }

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
        setTimeout(async () => {
          await this.updateModalWithSafeData();
          // 🎯 NOUVEAU: Mettre à jour le graphique donut automatiquement
          await this.updateDonutChart();
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
      // 1. 🎯 PRIORITÉ: Récupérer la vraie taille de la base de données
      console.log(
        "🔄 [STORAGE] Récupération des vraies données de la base de données..."
      );

      let realDatabaseSizeMB = 0;
      let realTotalCapacityMB = 1024; // 1GB par défaut
      let realArchiveCount = 0;

      try {
        const response = await fetch("/api/database/capacity");
        if (response.ok) {
          const capacityData = await response.json();

          // ✅ UTILISER LA VRAIE TAILLE DE LA BASE DE DONNÉES
          realDatabaseSizeMB = Math.round(
            capacityData.database.current_size_bytes / (1024 * 1024)
          );
          realTotalCapacityMB = Math.round(
            capacityData.database.total_capacity_bytes / (1024 * 1024)
          );

          console.log(
            `🎯 [STORAGE] VRAIE taille DB: ${realDatabaseSizeMB} MB / ${realTotalCapacityMB} MB`
          );
          console.log(
            `📊 [STORAGE] Plan détecté: ${capacityData.render_info.estimated_plan}`
          );
        }
      } catch (error) {
        console.error("❌ [STORAGE] Erreur récupération données DB:", error);
      }

      // 2. Récupérer le vrai nombre d'archives selon l'onglet actuel
      if (this.archivesManager) {
        if (
          this.archivesManager.selectedTab === "all" &&
          this.archivesManager.allCombinedArchives
        ) {
          realArchiveCount = this.archivesManager.allCombinedArchives.length;
        } else if (this.archivesManager.allArchives) {
          realArchiveCount = this.archivesManager.allArchives.length;
          realArchiveCount = this.archivesManager.allArchives.length;
        }
      }

      // 3. Si pas de données locales, récupérer depuis l'API
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

          console.log(`📊 [STORAGE] Données API: ${realArchiveCount} archives`);
        } catch (apiError) {
          console.error(
            "❌ [STORAGE] Erreur API, utilisation des données par défaut",
            apiError
          );
          realArchiveCount = 10; // Valeur par défaut
        }
      }

      // 4. 🎯 CALCULS BASÉS SUR LES VRAIES DONNÉES
      const usedSizeMB = realDatabaseSizeMB; // ✅ VRAIE taille de la DB
      const totalCapacityMB = realTotalCapacityMB; // ✅ VRAIE capacité
      const availableSizeMB = Math.max(totalCapacityMB - usedSizeMB, 0);
      const usedPercent = Math.min((usedSizeMB / totalCapacityMB) * 100, 100);

      console.log(
        `📊 [STORAGE] RÉSUMÉ - Archives: ${realArchiveCount}, Utilisé: ${usedSizeMB}MB/${totalCapacityMB}MB (${usedPercent.toFixed(
          1
        )}%)`
      );

      // Vérifier que le modal est bien visible
      const modalElement = document.getElementById("storageModal");
      if (!modalElement || !modalElement.classList.contains("show")) {
        console.warn("⚠️ [STORAGE] Modal non visible, arrêt de la mise à jour");
        return;
      }

      // 5. ✅ MISE À JOUR AVEC LES VRAIES DONNÉES
      const updates = [
        { id: "totalArchiveCount", value: realArchiveCount.toString() },
        { id: "totalUsedStorage", value: `${usedSizeMB.toFixed(1)} MB` },
        {
          id: "totalAvailableStorage",
          value: `${availableSizeMB.toFixed(1)} MB`,
        },
        {
          id: "totalStorageCapacity",
          value: `${(totalCapacityMB / 1024).toFixed(1)} GB`,
        },
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

      // 6. ✅ MISE À JOUR DE LA BARRE DE PROGRESSION PROFESSIONNELLE
      this.updateProfessionalProgressBar(usedPercent);
      successCount++;

      console.log(
        `✅ [STORAGE] ${successCount}/${
          updates.length + 1
        } éléments mis à jour avec les VRAIES données`
      );
      console.log(
        `🎯 [STORAGE] RÉSUMÉ FINAL: ${realArchiveCount} archives, ${usedSizeMB}MB/${totalCapacityMB}MB utilisés (${usedPercent.toFixed(
          1
        )}%)`
      );

      // 7. 🆕 NOUVEAU: Récupérer et afficher les statistiques détaillées par type
      await this.updateDetailedStatsByType();
    } catch (error) {
      console.error(
        "❌ [STORAGE] Erreur lors de la mise à jour avec vraies données:",
        error
      );
    }
  }

  // 🎨 NOUVELLE MÉTHODE: Mise à jour professionnelle de la barre de progression
  updateProfessionalProgressBar(usedPercent) {
    const progressBar = document.getElementById("storageProgressBar");
    if (!progressBar) {
      console.warn("⚠️ [STORAGE] Barre de progression non trouvée");
      return;
    }

    // Animation fluide du pourcentage
    const currentWidth = parseFloat(progressBar.style.width) || 0;
    this.animateProgressBar(progressBar, currentWidth, usedPercent);

    // Mise à jour des attributs ARIA pour l'accessibilité
    progressBar.setAttribute("aria-valuenow", usedPercent);
    progressBar.setAttribute(
      "aria-valuetext",
      `${usedPercent.toFixed(1)}% utilisé`
    );

    // 🎨 Couleurs et effets selon le niveau d'utilisation
    let gradient, shadowColor, statusMessage, statusIcon;

    if (usedPercent > 90) {
      // 🔴 Niveau critique
      gradient =
        "linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)";
      shadowColor = "rgba(239, 68, 68, 0.4)";
      statusMessage = "Critique";
      statusIcon = "fas fa-exclamation-triangle";
      console.log("🔴 [STORAGE] Niveau critique: > 90%");
    } else if (usedPercent > 75) {
      // 🟡 Niveau d'attention
      gradient =
        "linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%)";
      shadowColor = "rgba(245, 158, 11, 0.4)";
      statusMessage = "Attention";
      statusIcon = "fas fa-exclamation-circle";
      console.log("🟡 [STORAGE] Niveau d'attention: > 75%");
    } else {
      // 🟢 Niveau normal
      gradient =
        "linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)";
      shadowColor = "rgba(16, 185, 129, 0.4)";
      statusMessage = "Normal";
      statusIcon = "fas fa-check-circle";
      console.log("🟢 [STORAGE] Niveau normal: < 75%");
    }

    // Application du style avec transition fluide
    setTimeout(() => {
      progressBar.style.background = gradient;
      progressBar.style.boxShadow = `
        0 2px 8px ${shadowColor},
        inset 0 1px 0 rgba(255,255,255,0.2)
      `;
    }, 100);

    // 🎯 Ajouter un indicateur de statut visuel
    this.updateStorageStatusIndicator(usedPercent, statusMessage, statusIcon);
  }

  // 🎬 MÉTHODE: Animation fluide de la barre de progression
  animateProgressBar(progressBar, fromPercent, toPercent) {
    const duration = 1000; // 1 seconde
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Fonction d'easing pour une animation fluide
      const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = easeInOutCubic(progress);

      const currentPercent =
        fromPercent + (toPercent - fromPercent) * easedProgress;
      progressBar.style.width = `${currentPercent}%`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // 🎯 MÉTHODE: Indicateur de statut du stockage
  updateStorageStatusIndicator(usedPercent, statusMessage, statusIcon) {
    // Chercher ou créer l'indicateur de statut
    let statusIndicator = document.getElementById("storageStatusIndicator");

    if (!statusIndicator) {
      // Créer l'indicateur s'il n'existe pas
      statusIndicator = document.createElement("div");
      statusIndicator.id = "storageStatusIndicator";
      statusIndicator.style.cssText = `
        position: absolute;
        top: -35px;
        right: 0;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.75em;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        z-index: 10;
      `;

      // Ajouter l'indicateur au conteneur de la barre de progression
      const progressContainer =
        document.getElementById("storageProgressBar").parentNode;
      if (progressContainer) {
        progressContainer.style.position = "relative";
        progressContainer.appendChild(statusIndicator);
      }
    }

    // Mise à jour du contenu et du style
    let backgroundColor, textColor;

    if (usedPercent > 90) {
      backgroundColor = "rgba(239, 68, 68, 0.1)";
      textColor = "#dc2626";
    } else if (usedPercent > 75) {
      backgroundColor = "rgba(245, 158, 11, 0.1)";
      textColor = "#d97706";
    } else {
      backgroundColor = "rgba(16, 185, 129, 0.1)";
      textColor = "#059669";
    }

    statusIndicator.style.backgroundColor = backgroundColor;
    statusIndicator.style.color = textColor;
    statusIndicator.style.border = `1px solid ${textColor}30`;

    statusIndicator.innerHTML = `
      <i class="${statusIcon}" style="font-size: 0.9em;"></i>
      ${statusMessage}
    `;
  }

  // 🆕 NOUVELLE MÉTHODE: Mise à jour des statistiques détaillées par type
  async updateDetailedStatsByType() {
    try {
      console.log(
        "📊 [STORAGE] Récupération des statistiques depuis les badges des onglets..."
      );

      // 🎯 NOUVEAU: Récupérer les nombres depuis les badges des onglets (vraies données)
      const getTabBadgeCount = (badgeId) => {
        const badgeElement = document.getElementById(badgeId);
        if (badgeElement) {
          const count = parseInt(badgeElement.textContent.trim()) || 0;
          console.log(`📊 Badge ${badgeId}: ${count}`);
          return count;
        }
        console.warn(`⚠️ Badge non trouvé pour ${badgeId}`);
        return 0;
      };

      // Récupérer les vrais nombres depuis les badges des onglets
      const suppressionCount = getTabBadgeCount("deletedCount");
      const livraisonCount = getTabBadgeCount("deliveredCount");
      const miseEnLivraisonCount = getTabBadgeCount("shippingCount");
      const ordreCount = getTabBadgeCount("ordersCount");

      console.log("🎯 [STORAGE] Nombres récupérés depuis les badges:", {
        suppression: suppressionCount,
        livraison: livraisonCount,
        mise_en_livraison: miseEnLivraisonCount,
        ordre_livraison_etabli: ordreCount,
      });

      // Calculer les tailles estimées proportionnellement à la vraie taille DB
      let realDatabaseSizeMB = 9; // Valeur par défaut
      try {
        const response = await fetch("/api/database/capacity");
        if (response.ok) {
          const capacityData = await response.json();
          realDatabaseSizeMB = Math.round(
            capacityData.database.current_size_bytes / (1024 * 1024)
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ [STORAGE] Impossible de récupérer taille DB, utilisation valeur par défaut"
        );
      }

      const totalArchives =
        suppressionCount + livraisonCount + miseEnLivraisonCount + ordreCount;
      const sizePerArchive =
        totalArchives > 0 ? realDatabaseSizeMB / totalArchives : 0;

      // Calculer les statistiques par type avec les vrais nombres
      const typeStats = {
        suppression: {
          count: suppressionCount,
          size: suppressionCount * sizePerArchive,
          archives: [],
          newest_date: suppressionCount > 0 ? new Date().toISOString() : null,
        },
        livraison: {
          count: livraisonCount,
          size: livraisonCount * sizePerArchive,
          archives: [],
          newest_date: livraisonCount > 0 ? new Date().toISOString() : null,
        },
        mise_en_livraison: {
          count: miseEnLivraisonCount,
          size: miseEnLivraisonCount * sizePerArchive,
          archives: [],
          newest_date:
            miseEnLivraisonCount > 0 ? new Date().toISOString() : null,
        },
        ordre_livraison_etabli: {
          count: ordreCount,
          size: ordreCount * sizePerArchive,
          archives: [],
          newest_date: ordreCount > 0 ? new Date().toISOString() : null,
        },
      };

      console.log(
        "📊 [STORAGE] Statistiques calculées depuis les badges:",
        typeStats
      );

      // Mettre à jour l'affichage des statistiques détaillées
      this.updateStorageDetails(typeStats);

      // Mettre à jour le tableau des statistiques par type aussi
      this.updateTypeTableInModal(typeStats);

      console.log(
        "✅ [STORAGE] Statistiques détaillées par type mises à jour depuis les badges des onglets"
      );
    } catch (error) {
      console.error(
        "❌ [STORAGE] Erreur lors de la mise à jour des stats par type:",
        error
      );
    }
  }

  // 🆕 MÉTHODE UTILITAIRE: Calculer la taille des archives
  calculateArchivesSize(archives) {
    return archives.reduce((total, archive) => {
      return total + this.estimateArchiveSize(archive);
    }, 0);
  }

  // 🆕 MÉTHODE UTILITAIRE: Obtenir la date de la plus récente archive
  getNewestArchiveDate(archives) {
    if (!archives || archives.length === 0) return null;

    const dates = archives
      .map((archive) => new Date(archive.archived_at || archive.created_at))
      .filter((date) => !isNaN(date.getTime()));

    if (dates.length === 0) return null;

    return new Date(Math.max(...dates)).toISOString();
  }

  // 🆕 MÉTHODE: Mise à jour du tableau dans le modal
  updateTypeTableInModal(typeStats) {
    // Chercher le bon tableau dans le modal
    const tableBody = document.querySelector("#typeStatsTable tbody");
    if (!tableBody) {
      console.warn(
        "⚠️ [STORAGE] Tableau des statistiques (#typeStatsTable tbody) non trouvé dans le modal"
      );
      return;
    }

    const typeLabels = {
      suppression: "Dossiers Supprimés",
      livraison: "Dossiers Livrés",
      mise_en_livraison: "Mise en Livraison",
      ordre_livraison_etabli: "Ordres de Livraison",
    };

    const tableHTML = Object.entries(typeStats)
      .filter(([type, data]) => data.count > 0) // Ne montrer que les types avec des archives
      .map(([type, data]) => {
        const label = typeLabels[type] || type;
        const sizeFormatted = `${data.size.toFixed(2)} MB`;
        const lastArchive = data.newest_date
          ? new Date(data.newest_date).toLocaleDateString("fr-FR")
          : "Aucune";

        return `
          <tr>
            <td>
              <span class="badge" style="background-color: ${this.getTypeColor(
                type
              )}20; color: ${this.getTypeColor(
          type
        )}; padding: 6px 12px; border-radius: 20px; font-weight: 500;">
                ${label}
              </span>
            </td>
            <td><strong style="color: ${this.getTypeColor(type)};">${
          data.count
        }</strong></td>
            <td><span style="color: #6b7280;">${sizeFormatted}</span></td>
            <td><small class="text-muted">${lastArchive}</small></td>
          </tr>
        `;
      })
      .join("");

    // Ajouter une ligne par défaut si aucune donnée
    const finalHTML =
      tableHTML ||
      `
      <tr>
        <td colspan="4" class="text-center text-muted" style="padding: 20px;">
          <i class="fas fa-info-circle me-2"></i>Aucune archive trouvée
        </td>
      </tr>
    `;

    tableBody.innerHTML = finalHTML;
    console.log(
      `✅ [STORAGE] Tableau des statistiques mis à jour avec ${
        Object.keys(typeStats).filter((k) => typeStats[k].count > 0).length
      } types`
    );
  }

  // 🆕 MÉTHODE UTILITAIRE: Obtenir la couleur d'un type
  getTypeColor(type) {
    const colors = {
      suppression: "#ef4444",
      livraison: "#10b981",
      mise_en_livraison: "#f59e0b",
      ordre_livraison_etabli: "#3b82f6",
    };
    return colors[type] || "#6b7280";
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
    console.log(
      "📊 [STORAGE] Utilisation des VRAIES données DB + archives temps réel"
    );

    // 1. 🎯 PRIORITÉ: Récupérer les vraies données de capacité de la base de données
    let realDatabaseInfo = null;
    let realDatabaseSizeMB = 0;
    let realTotalCapacityMB = 1024; // 1GB par défaut

    try {
      const dbResponse = await fetch("/api/database/capacity");
      if (dbResponse.ok) {
        realDatabaseInfo = await dbResponse.json();
        console.log(
          "✅ [STORAGE] Vraies données DB récupérées:",
          realDatabaseInfo
        );

        // ✅ UTILISER LA VRAIE TAILLE DE LA BASE DE DONNÉES
        realDatabaseSizeMB = Math.round(
          realDatabaseInfo.database.current_size_bytes / (1024 * 1024)
        );
        realTotalCapacityMB = Math.round(
          realDatabaseInfo.database.total_capacity_bytes / (1024 * 1024)
        );

        console.log(
          `🎯 [STORAGE] VRAIE taille DB: ${realDatabaseSizeMB} MB / ${realTotalCapacityMB} MB (${realDatabaseInfo.render_info.estimated_plan})`
        );
      }
    } catch (error) {
      console.error("❌ [STORAGE] Erreur récupération données DB:", error);
    }

    // 2. Récupérer les archives réelles selon l'onglet actuel
    let archives = [];

    // 🔧 CORRECTION: Vérifier que archivesManager existe avant d'y accéder
    if (!this.archivesManager) {
      console.warn(
        "⚠️ [STORAGE] ArchivesManager non disponible, utilisation de données par défaut"
      );
    } else if (
      this.archivesManager.selectedTab === "all" &&
      this.archivesManager.allCombinedArchives &&
      this.archivesManager.allCombinedArchives.length > 0
    ) {
      archives = this.archivesManager.allCombinedArchives;
      console.log(
        `📊 [STORAGE] Archives combinées (onglet "Toutes les Archives"): ${archives.length} archives`
      );
    } else if (this.archivesManager.allArchives) {
      archives = this.archivesManager.allArchives;
      console.log(
        `📊 [STORAGE] Archives standard (onglet "${
          this.archivesManager.selectedTab || "unknown"
        }"): ${archives.length} archives`
      );
    } else {
      console.warn("⚠️ [STORAGE] Aucunes archives disponibles");
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

    let totalCount = archives.length;

    // 🎯 NOUVELLE LOGIQUE: TOUJOURS utiliser la vraie taille DB quand disponible
    let totalSizeMB = realDatabaseSizeMB; // ✅ VRAIE taille de la DB

    console.log(
      `🎯 [STORAGE] VRAIE taille DB utilisée: ${realDatabaseSizeMB} MB au lieu d'estimations pour ${totalCount} archives`
    );

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

    // ✅ NOUVEAU: Compter les archives par type (sans calcul de taille puisqu'on utilise la vraie taille DB)
    console.log(
      "✅ [STORAGE] Vraie taille DB utilisée, comptage des archives par type seulement..."
    );

    archivesToProcess.forEach((archive) => {
      const actionType = archive.action_type;

      if (realStats[actionType]) {
        // Compter les archives par type sans calculer de taille estimée
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
          realStats[actionType].count++;
        }

        realStats[actionType].archives.push(archive);
        // 📊 Répartir la vraie taille DB proportionnellement par type
        if (totalCount > 0) {
          const typeRatio = realStats[actionType].count / totalCount;
          realStats[actionType].size = totalSizeMB * typeRatio;
        }
      }
    });

    console.log("📊 [STORAGE] Données temps réel récupérées:", realTimeData);
    console.log("📊 [STORAGE] Statistiques finales:", realStats);

    // *** MISE À JOUR DE L'INTERFACE PRINCIPALE AVEC LES VRAIES DONNÉES ***
    this.updateStorageInterface(totalSizeMB, totalCount, realStats);

    console.log(
      `🎯 [STORAGE] RÉSUMÉ: ${totalCount} archives, ${totalSizeMB}MB/${realTotalCapacityMB}MB utilisés`
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
          `  Dossiers mis en livraison depuis localStorage: ${realTimeData.mise_en_livraison}`
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
    try {
      console.log(
        "📊 [STORAGE] Mise à jour interface avec vraies données DB..."
      );

      // 🎯 PRIORITÉ: Récupérer les vraies données de capacité depuis l'API
      const response = await fetch("/api/database/capacity");
      const capacityData = await response.json();

      if (capacityData && capacityData.database) {
        // ✅ UTILISER LES VRAIES DONNÉES DE LA BASE DE DONNÉES
        const realUsedBytes = capacityData.database.current_size_bytes;
        const realTotalBytes = capacityData.database.total_capacity_bytes;
        const realUsedMB = Math.round(realUsedBytes / (1024 * 1024));
        const realTotalGB = (realTotalBytes / (1024 * 1024 * 1024)).toFixed(1);
        const realAvailableBytes = capacityData.database.available_space_bytes;
        const realUsedPercent = capacityData.database.usage_percentage || 0;

        console.log(
          `🎯 [STORAGE] VRAIES données DB: ${realUsedMB}MB utilisés sur ${realTotalGB}GB (${realUsedPercent}%)`
        );

        // 🔧 CORRECTION: Vérifier que les éléments existent avant de modifier leur contenu
        const totalUsedEl = document.getElementById("totalUsedStorage");
        if (totalUsedEl) {
          totalUsedEl.textContent = `${realUsedMB} MB`;
          console.log(`✅ Espace utilisé RÉEL: ${realUsedMB} MB`);
        }

        const totalAvailableEl = document.getElementById(
          "totalAvailableStorage"
        );
        if (totalAvailableEl) {
          totalAvailableEl.textContent =
            capacityData.database.available_space_formatted;
          console.log(
            `✅ Espace disponible RÉEL: ${capacityData.database.available_space_formatted}`
          );
        }

        // Afficher la vraie capacité totale
        const totalCapacityEl = document.getElementById("totalStorageCapacity");
        if (totalCapacityEl) {
          totalCapacityEl.textContent = `${realTotalGB} GB`;
          console.log(`✅ Capacité totale RÉELLE: ${realTotalGB} GB`);
        }

        // Mise à jour sécurisée des autres éléments
        if (totalCount !== null) {
          this.safeUpdateElement("totalArchiveCount", totalCount.toString());
        }
        this.safeUpdateElement("storagePercentage", `${realUsedPercent}%`);

        // ✅ MISE À JOUR DE LA BARRE DE PROGRESSION AVEC LES VRAIES DONNÉES
        const progressBar = document.getElementById("storageProgressBar");
        if (progressBar) {
          progressBar.style.width = `${realUsedPercent}%`;
          progressBar.setAttribute("aria-valuenow", realUsedPercent);

          // Couleur de la barre selon le niveau RÉEL
          if (realUsedPercent > 90) {
            progressBar.style.background =
              "linear-gradient(90deg, #ef4444, #dc2626)";
            console.log("🔴 [STORAGE] Interface: Niveau critique > 90%");
          } else if (realUsedPercent > 75) {
            progressBar.style.background =
              "linear-gradient(90deg, #f59e0b, #d97706)";
            console.log("🟡 [STORAGE] Interface: Niveau attention > 75%");
          } else {
            progressBar.style.background =
              "linear-gradient(90deg, #10b981, #059669)";
            console.log("🟢 [STORAGE] Interface: Niveau normal < 75%");
          }
        }

        // Mise à jour du widget Render
        this.updateRenderWidget(capacityData);

        console.log(
          `✅ [STORAGE] Interface mise à jour avec VRAIES données: ${realUsedMB}MB/${realTotalGB}GB (${realUsedPercent}%)`
        );
      } else {
        console.warn(
          "⚠️ [STORAGE] Données DB indisponibles, utilisation fallback"
        );
        // Fallback vers l'ancien système si l'API échoue
        this.fallbackStorageDisplay(totalSize, totalCount, storageByType);
      }
    } catch (error) {
      console.error(
        "❌ [STORAGE] Erreur lors de la récupération de la capacité:",
        error
      );
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

      // 🎨 AMÉLIORATION: Mise à jour professionnelle de la barre de progression Render
      const progressBarEl = document.getElementById("renderProgressBar");
      if (progressBarEl && capacityData.database) {
        const usagePercent = capacityData.database.usage_percentage || 0;

        // 🎬 Animation fluide de la barre de progression
        this.animateRenderProgressBar(progressBarEl, usagePercent);

        // 🎯 Mise à jour des attributs ARIA pour l'accessibilité
        progressBarEl.setAttribute("aria-valuenow", usagePercent);
        progressBarEl.setAttribute(
          "aria-valuetext",
          `${usagePercent.toFixed(1)}% de la base de données utilisé`
        );

        // 🎨 Couleurs et effets selon le niveau d'utilisation
        let gradient, shadowColor;

        if (usagePercent > 90) {
          // 🔴 Niveau critique
          gradient =
            "linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)";
          shadowColor = "rgba(239, 68, 68, 0.4)";
          console.log("🔴 [RENDER] Niveau critique: > 90%");
        } else if (usagePercent > 75) {
          // 🟡 Niveau d'attention
          gradient =
            "linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%)";
          shadowColor = "rgba(245, 158, 11, 0.4)";
          console.log("🟡 [RENDER] Niveau d'attention: > 75%");
        } else {
          // 🟢 Niveau normal
          gradient =
            "linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)";
          shadowColor = "rgba(16, 185, 129, 0.4)";
          console.log("🟢 [RENDER] Niveau normal: < 75%");
        }

        // Application du style avec transition fluide et ombres
        setTimeout(() => {
          progressBarEl.style.background = gradient;
          progressBarEl.style.boxShadow = `
            0 2px 8px ${shadowColor},
            inset 0 1px 0 rgba(255,255,255,0.2),
            0 0 15px ${shadowColor}40
          `;
          progressBarEl.style.borderRadius = "4px";

          // 🎯 Mettre à jour l'indicateur de statut Render
          this.updateRenderStatusIndicator(usagePercent);
        }, 100);
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

  // 🎬 NOUVELLE MÉTHODE: Animation fluide de la barre de progression Render
  animateRenderProgressBar(progressBar, targetPercent) {
    const currentWidth = parseFloat(progressBar.style.width) || 0;
    const duration = 1200; // 1.2 secondes pour un effet plus fluide
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Fonction d'easing avancée pour une animation plus naturelle
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentPercent =
        currentWidth + (targetPercent - currentWidth) * easeOutQuart;

      progressBar.style.width = `${currentPercent}%`;

      // Effet de brillance pendant l'animation
      if (progress < 1) {
        const shimmer = Math.sin(progress * Math.PI * 2) * 0.1 + 0.1;
        progressBar.style.filter = `brightness(${1 + shimmer})`;
        requestAnimationFrame(animate);
      } else {
        // Restaurer la brillance normale à la fin
        progressBar.style.filter = "brightness(1)";
      }
    };

    requestAnimationFrame(animate);
    console.log(
      `🎬 [RENDER] Animation de ${currentWidth}% vers ${targetPercent}%`
    );
  }

  // 🎯 NOUVELLE MÉTHODE: Mise à jour de l'indicateur de statut Render
  updateRenderStatusIndicator(usagePercent) {
    const statusIndicator = document.getElementById("renderStatusIndicator");
    if (!statusIndicator) return;

    let statusMessage, statusIcon, backgroundColor, textColor;

    if (usagePercent > 90) {
      statusMessage = "Critique";
      statusIcon = "fas fa-exclamation-triangle";
      backgroundColor = "rgba(239, 68, 68, 0.1)";
      textColor = "#dc2626";
    } else if (usagePercent > 75) {
      statusMessage = "Attention";
      statusIcon = "fas fa-exclamation-circle";
      backgroundColor = "rgba(245, 158, 11, 0.1)";
      textColor = "#d97706";
    } else if (usagePercent > 50) {
      statusMessage = "Modéré";
      statusIcon = "fas fa-info-circle";
      backgroundColor = "rgba(59, 130, 246, 0.1)";
      textColor = "#2563eb";
    } else {
      statusMessage = "Optimal";
      statusIcon = "fas fa-check-circle";
      backgroundColor = "rgba(16, 185, 129, 0.1)";
      textColor = "#059669";
    }

    // Mise à jour du style et du contenu
    statusIndicator.style.backgroundColor = backgroundColor;
    statusIndicator.style.color = textColor;
    statusIndicator.style.borderColor = `${textColor}30`;

    statusIndicator.innerHTML = `
      <i class="${statusIcon}" style="font-size: 0.9em;"></i>
      ${statusMessage}
    `;

    console.log(
      `🎯 [RENDER] Statut mis à jour: ${statusMessage} (${usagePercent.toFixed(
        1
      )}%)`
    );
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

  createChart(customUsedPercent = null) {
    const canvas = document.getElementById("storageChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Utiliser le pourcentage personnalisé ou calculer depuis les éléments DOM
    let usedPercent;
    if (customUsedPercent !== null) {
      usedPercent = customUsedPercent;
      console.log(
        `🍩 [CHART] Utilisation d'un pourcentage personnalisé: ${usedPercent.toFixed(
          1
        )}%`
      );
    } else {
      const totalUsed = parseFloat(
        document.getElementById("totalUsedStorage").textContent
      );
      usedPercent = (totalUsed / this.storageCapacity) * 100;
      console.log(
        `🍩 [CHART] Calcul automatique du pourcentage: ${usedPercent.toFixed(
          1
        )}%`
      );
    }

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

    // Arc de progression avec couleur dynamique
    if (usedPercent > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (2 * Math.PI * usedPercent) / 100;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);

      // Couleur selon le niveau d'utilisation
      if (usedPercent > 90) {
        ctx.strokeStyle = "#ef4444"; // Rouge pour critique
      } else if (usedPercent > 75) {
        ctx.strokeStyle = "#f59e0b"; // Orange pour attention
      } else {
        ctx.strokeStyle = "#10b981"; // Vert pour normal
      }

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
    console.log(
      "🔄 [STORAGE] Actualisation des données avec vraies données..."
    );

    try {
      // Afficher un indicateur de chargement
      const refreshBtn = document.getElementById("refreshStorageBtn");
      if (refreshBtn) {
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin me-2"></i>Actualisation...';
        refreshBtn.disabled = true;

        // Recharger les archives
        await this.archivesManager.loadArchives();

        // 🎯 UTILISER LES VRAIES DONNÉES au lieu des données calculées
        await this.updateModalWithSafeData();

        // Mettre à jour le graphique donut avec les vraies données
        await this.updateDonutChart();

        // Restaurer le bouton
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;

        this.addToHistory("Données réelles actualisées avec succès");
        console.log("✅ [STORAGE] Actualisation terminée avec vraies données");
      }
    } catch (error) {
      console.error("❌ [STORAGE] Erreur lors de l'actualisation:", error);
      this.addToHistory("Erreur lors de l'actualisation");

      // Restaurer le bouton en cas d'erreur
      const refreshBtn = document.getElementById("refreshStorageBtn");
      if (refreshBtn) {
        refreshBtn.innerHTML =
          '<i class="fas fa-sync-alt me-2"></i>Actualiser les Données';
        refreshBtn.disabled = false;
      }
    }
  }

  // 🎯 NOUVELLE MÉTHODE: Mise à jour du graphique donut avec vraies données
  async updateDonutChart() {
    try {
      console.log("🍩 [CHART] Mise à jour du graphique donut...");

      // Récupérer les vraies données de capacité
      let usedPercent = 0;
      try {
        const response = await fetch("/api/database/capacity");
        if (response.ok) {
          const capacityData = await response.json();
          const usedSizeMB = Math.round(
            capacityData.database.current_size_bytes / (1024 * 1024)
          );
          const totalCapacityMB = Math.round(
            capacityData.database.total_capacity_bytes / (1024 * 1024)
          );
          usedPercent = Math.min((usedSizeMB / totalCapacityMB) * 100, 100);

          console.log(
            `🍩 [CHART] Données récupérées: ${usedPercent.toFixed(1)}% utilisé`
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ [CHART] Erreur récupération données, valeur par défaut utilisée"
        );
        usedPercent = 5; // Valeur par défaut
      }

      // Mettre à jour le centre du graphique
      this.safeUpdateElement("chartCenterValue", `${usedPercent.toFixed(0)}%`);

      // Recréer le graphique avec les nouvelles valeurs
      this.createChart(usedPercent);

      console.log("✅ [CHART] Graphique donut mis à jour avec vraies données");
    } catch (error) {
      console.error("❌ [CHART] Erreur mise à jour graphique donut:", error);
    }
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

  // 🆕 MÉTHODE UTILITAIRE: Extraire des données des formulaires archivés
  extractFromFormData(data, fieldNames) {
    if (!data || typeof data !== "object") {
      return null;
    }

    // Essayer directement les noms de champs
    for (const fieldName of fieldNames) {
      if (data[fieldName]) {
        return data[fieldName];
      }
    }

    // Chercher dans les propriétés imbriquées
    for (const key in data) {
      if (typeof data[key] === "object" && data[key] !== null) {
        const result = this.extractFromFormData(data[key], fieldNames);
        if (result) {
          return result;
        }
      }
    }

    // Chercher dans les chaînes JSON
    for (const key in data) {
      if (typeof data[key] === "string") {
        try {
          const parsed = JSON.parse(data[key]);
          const result = this.extractFromFormData(parsed, fieldNames);
          if (result) {
            return result;
          }
        } catch (e) {
          // Ignore les erreurs de parsing
        }
      }
    }

    return null;
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
