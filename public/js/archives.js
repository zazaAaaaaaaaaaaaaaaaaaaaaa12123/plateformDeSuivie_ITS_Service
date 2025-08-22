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

    this.init();
  }

  init() {
    this.bindEvents();

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
          };

          if (tabToActionMap[this.selectedTab]) {
            actionFilter.value = tabToActionMap[this.selectedTab];
            this.performSearch(); // Recharger avec le nouveau filtre
          } else {
            this.renderCurrentView();
          }
        } else if (actionFilter && this.selectedTab === "all") {
          // Si on revient à "all", vider le filtre action_type
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

  async loadArchives() {
    try {
      this.showLoading(true);

      // Charger d'abord toutes les données pour les compteurs (si pas déjà en cache)
      if (!this.allArchivesData) {
        const allDataResponse = await fetch("/api/archives?limit=1000"); // Récupérer toutes les données
        const allData = await allDataResponse.json();
        if (allData.success) {
          this.allArchivesData = allData.archives;
        }
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
    };

    document.getElementById("allCount").textContent = counts.all;
    document.getElementById("deletedCount").textContent = counts.suppression;
    document.getElementById("deliveredCount").textContent = counts.livraison;
    document.getElementById("shippingCount").textContent =
      counts.mise_en_livraison;
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

    if (archives.length === 0) {
      container.innerHTML = this.renderEmptyState();
      return;
    }

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
                            <th class="d-none d-md-table-cell">Archivé par</th>
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
                    ${archive.client_name || "N/A"}
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
                </td>
                <td class="d-none d-md-table-cell">
                    ${archive.archived_by || "Système"}
                    ${
                      archive.archived_by_email
                        ? `<br><small class="text-muted">${archive.archived_by_email}</small>`
                        : ""
                    }
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
    };
    return (
      badges[actionType] ||
      `<span class="badge bg-secondary">${actionType}</span>`
    );
  }

  renderActionButtons(archive) {
    const canRestore = archive.is_restorable && archive.dossier_data;

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
                        data-archive-id="${
                          archive.id
                        }" title="Restaurer le dossier"
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

    const modalBody = document.getElementById("detailsModalBody");
    modalBody.innerHTML = this.renderDetailsContent(archive);

    const modal = new bootstrap.Modal(document.getElementById("detailsModal"));
    modal.show();
  }

  renderDetailsContent(archive) {
    const dossierData = archive.dossier_data || {};

    return `
            <div class="detail-section">
                <h6><i class="fas fa-info-circle me-2"></i>Informations générales</h6>
                <div class="detail-row">
                    <div class="detail-label">ID Archive:</div>
                    <div class="detail-value">#${archive.id}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Référence dossier:</div>
                    <div class="detail-value">${
                      archive.dossier_reference || "N/A"
                    }</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Type d'action:</div>
                    <div class="detail-value">${this.renderActionBadge(
                      archive.action_type
                    )}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Client:</div>
                    <div class="detail-value">${
                      archive.client_name || "N/A"
                    }</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Intitulé:</div>
                    <div class="detail-value">${archive.intitule || "N/A"}</div>
                </div>
            </div>

            <div class="detail-section">
                <h6><i class="fas fa-user me-2"></i>Source et responsabilité</h6>
                <div class="detail-row">
                    <div class="detail-label">Rôle/Source:</div>
                    <div class="detail-value">${archive.role_source}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Page d'origine:</div>
                    <div class="detail-value">${this.getPageName(
                      archive.page_origine
                    )}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Archivé par:</div>
                    <div class="detail-value">${
                      archive.archived_by || "Système"
                    }</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">${
                      archive.archived_by_email || "N/A"
                    }</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Date d'archivage:</div>
                    <div class="detail-value">${this.formatDate(
                      archive.archived_at
                    )} (${this.getTimeAgo(archive.archived_at)})</div>
                </div>
            </div>

            <div class="detail-section">
                <h6><i class="fas fa-cogs me-2"></i>État de restauration</h6>
                <div class="detail-row">
                    <div class="detail-label">Restaurable:</div>
                    <div class="detail-value">
                        ${
                          archive.is_restorable
                            ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Oui</span>'
                            : '<span class="badge bg-danger"><i class="fas fa-times me-1"></i>Non</span>'
                        }
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Données disponibles:</div>
                    <div class="detail-value">
                        ${
                          archive.dossier_data
                            ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Complètes</span>'
                            : '<span class="badge bg-warning"><i class="fas fa-exclamation-triangle me-1"></i>Partielles</span>'
                        }
                    </div>
                </div>
            </div>

            ${
              archive.dossier_data
                ? `
                <div class="detail-section">
                    <h6><i class="fas fa-database me-2"></i>Aperçu des données du dossier</h6>
                    <div class="detail-row">
                        <div class="detail-label">Employé:</div>
                        <div class="detail-value">${
                          dossierData.employee_name || "N/A"
                        }</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Numéro conteneur:</div>
                        <div class="detail-value">${
                          dossierData.container_number || "N/A"
                        }</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Transporteur:</div>
                        <div class="detail-value">${
                          dossierData.transporter || "N/A"
                        }</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Statut:</div>
                        <div class="detail-value">${
                          dossierData.status ||
                          dossierData.delivery_status_acconier ||
                          "N/A"
                        }</div>
                    </div>
                </div>
            `
                : ""
            }
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
      this.showLoading(true);

      const response = await fetch(`/api/archives/${archiveId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restored_by: this.getCurrentUser(),
          restored_by_email: this.getCurrentUserEmail(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification("Dossier restauré avec succès", "success");
        await this.loadArchives(); // Recharger la liste
      } else {
        this.showNotification(
          data.message || "Erreur lors de la restauration",
          "error"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      this.showNotification("Erreur de connexion", "error");
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
    };
    return mapping[this.selectedTab] || "allArchivesTable";
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
    return "Interface inconnue";
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
    // Récupérer l'utilisateur connecté (à adapter selon votre système d'auth)
    return localStorage.getItem("currentUser") || "Utilisateur";
  }

  getCurrentUserEmail() {
    // Récupérer l'email de l'utilisateur connecté (à adapter selon votre système d'auth)
    return localStorage.getItem("currentUserEmail") || "";
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
    const archiveData = {
      dossier_id: dossierData.id,
      dossier_reference:
        dossierData.dossier_number || dossierData.container_number,
      intitule: dossierData.container_type_and_content || "",
      client_name: dossierData.client_name,
      role_source: roleSource,
      page_origine: pageOrigine,
      action_type: actionType,
      archived_by: localStorage.getItem("currentUser") || "Système",
      archived_by_email: localStorage.getItem("currentUserEmail") || "",
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
        typeof window.archivesManager.refreshAllData === "function"
      ) {
        await window.archivesManager.refreshAllData();
        window.archivesManager.updateCounts();
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
