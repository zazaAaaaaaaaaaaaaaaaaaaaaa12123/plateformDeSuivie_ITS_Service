// scriptResAconnier.js

// Vérification stricte de session dès le chargement
document.addEventListener("DOMContentLoaded", function () {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("respacconierUser"));
  } catch (e) {
    user = null;
  }
  if (!user || user.nom === "Responsable" || !user.email) {
    // Redirige vers la page de login sur le même domaine
    window.location.href = "/html/respacconier_auth.html";
    return;
  }
});

(async () => {
  // --- AVATAR RESPONSABLE ACCONIER ---
  document.addEventListener("DOMContentLoaded", function () {
    const avatarContainer = document.getElementById(
      "avatarRespAconierContainer"
    );
    if (avatarContainer) {
      // SÉPARATION STRICTE : ce JS NE DOIT JAMAIS lire/écrire autre chose que respacconierUser
      let respacconierUser = null;
      try {
        respacconierUser = JSON.parse(localStorage.getItem("respacconierUser"));
      } catch (e) {
        respacconierUser = null;
      }
      if (
        !respacconierUser ||
        typeof respacconierUser !== "object" ||
        !respacconierUser.nom
      ) {
        respacconierUser = { nom: "Responsable", email: "" };
        localStorage.setItem(
          "respacconierUser",
          JSON.stringify(respacconierUser)
        );
      }
      const nom = respacconierUser.nom || "Responsable";
      const email = respacconierUser.email || "";

      function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = "#";
        for (let i = 0; i < 3; i++) {
          const value = (hash >> (i * 8)) & 0xff;
          color += ("00" + value.toString(16)).substr(-2);
        }
        return color;
      }

      function getInitials(name) {
        return name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2);
      }

      avatarContainer.innerHTML = `
        <div class="flex items-center cursor-pointer" id="avatarRespAconierClickable">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white mr-3" style="background:${stringToColor(
            nom
          )}">
            ${getInitials(nom)}
          </div>
          <div>
            <div class="font-semibold text-lg text-gray-800">${nom}</div>
            <div class="text-gray-500 text-sm">${email}</div>
          </div>
        </div>
        <div id="logoutBox" style="display:none;position:absolute;top:60px;left:0;z-index:1000;background:white;border:1px solid #eee;padding:12px 24px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <button id="logoutBtn" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Déconnexion</button>
        </div>
      `;

      // Gestion du clic sur l'avatar pour afficher la déconnexion
      const avatarClickable = document.getElementById(
        "avatarRespAconierClickable"
      );
      const logoutBox = document.getElementById("logoutBox");
      if (avatarClickable && logoutBox) {
        avatarClickable.addEventListener("click", (e) => {
          e.stopPropagation();
          logoutBox.style.display =
            logoutBox.style.display === "none" ? "block" : "none";
        });
        // Cacher la box si on clique ailleurs
        document.addEventListener("click", (e) => {
          if (!avatarContainer.contains(e.target)) {
            logoutBox.style.display = "none";
          }
        });
        // Déconnexion
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
          logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("respacconierUser");
            window.location.href =
              "http://localhost:3000/html/respacconier_auth.html";
          });
        }
      }
    }
  });
  // Global DOM elements
  const dashboardContainer = document.getElementById("dashboardContainer");
  const loadingOverlay = document.getElementById("loadingOverlay");
  // searchInput and statusFilterSelect removed from header as per user request
  const refreshBtn = document.getElementById("refreshBtn");

  // New Request Section elements
  const newRequestsSection = document.getElementById("newRequestsSection");
  const newRequestsSummaryBar = document.getElementById(
    "newRequestsSummaryBar"
  );
  const newRequestsCount = document.getElementById("newRequestsCount");
  const noNewRequestsMessage = document.getElementById("noNewRequestsMessage");

  // Main Dashboard View elements
  const singleDeliveryView = document.getElementById("singleDeliveryView");
  // expandedHistoryView is now permanently hidden as per user request (history is in modal)
  const expandedHistoryView = document.getElementById("expandedHistoryView");

  // History Sidebar elements (now a Modal/Floating Box)
  const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
  const toggleArchivesBtn = document.getElementById("toggleArchivesBtn"); // New Archives button
  const historySidebar = document.getElementById("historySidebar");
  const closeHistoryBtn = document.getElementById("closeHistoryBtn");
  const historyContent = document.getElementById("historyContent");
  const historyOverlay = document.getElementById("historyOverlay");
  const noHistoryMessage = document.getElementById("noHistoryMessage");
  const historyModalTitle = document.getElementById("historyModalTitle"); // Title for the modal
  const historySearchInput = document.createElement("input"); // New search input for the modal

  let allDeliveries = []; // Stores all raw deliveries fetched from backend
  let currentPendingDeliveries = []; // Deliveries for today with 'pending_acconier' status
  let recentHistoricalDeliveries = []; // Processed/rejected deliveries within the last 3 days
  let archivedDeliveries = []; // All deliveries older than 3 days
  let selectedDeliveryId = null; // ID of the delivery currently displayed in the main dashboard

  // Tracks what kind of content the modal is currently displaying: 'recent', 'archives', or 'agent_view'
  let activeModalContentSource = "recent"; // 'recent', 'archives' or 'agent_view'
  // Stores the name of the agent currently being filtered in the modal, null otherwise.
  let activeAgentFilterName = null;

  let socket; // WebSocket connection

  // Définir TOUS les statuts acconier possibles pour affichage dans le tableau de suivi, avec texte, icône et couleur
  // Inclut les nouveaux statuts métier (attente paiement, en cours paiement, etc.)
  const ALL_ACCONIER_STATUS_INFO = {
    awaiting_payment_acconier: {
      text: "En attente de paiement",
      icon: "fa-clock",
      color: "#6c757d",
    },
    in_progress_payment_acconier: {
      text: "En cours de paiement",
      icon: "fa-credit-card",
      color: "#007bff",
    },
    // L'ancien 'pending_acconier' reste pour l'affichage historique, mais n'est plus dans le menu déroulant
    pending_acconier: {
      text: "Mise en livraison (ancienne)",
      icon: "fa-hourglass-half",
      color: "#ffc107",
    },
    mise_en_livraison_acconier: {
      text: "Mise en livraison",
      icon: "fa-hourglass-half",
      color: "#ffc107",
    },
    payment_done_acconier: {
      text: "Paiement effectué",
      icon: "fa-check-circle",
      color: "#28a745",
    },
    processed_acconier: {
      text: "Traité Acconier",
      icon: "fa-check-circle",
      color: "#28a745",
    },
    rejected_acconier: {
      text: "Rejeté Acconier",
      icon: "fa-times-circle",
      color: "#dc3545",
    },
  };

  // Définir UNIQUEMENT les options sélectionnables pour le dropdown dans la carte de livraison
  // Par défaut : "En attente de paiement" (non désactivable), puis 3 options métier
  const ACCONIER_STATUS_OPTIONS = [
    {
      value: "in_progress_payment_acconier",
      text: "En cours de paiement",
      icon: "fa-credit-card",
      color: "#007bff",
    },
    {
      value: "mise_en_livraison_acconier",
      text: "Mise en livraison",
      icon: "fa-hourglass-half",
      color: "#ffc107",
    },
    {
      value: "payment_done_acconier",
      text: "Paiement effectué",
      icon: "fa-check-circle",
      color: "#28a745",
    },
  ];

  // --- Utility Functions ---

  /**
   * Displays a custom alert message.
   * @param {string} messageText - The message to display.
   * @param {'success'|'error'|'info'|'warning'} type - Type of alert for styling.
   * @param {number} duration - How long the alert should be visible in milliseconds.
   */
  function showCustomAlert(messageText, type = "info", duration = 5000) {
    const customAlert =
      document.getElementById("customAlert") || document.createElement("div");
    if (!customAlert.id) {
      // If it was just created, append it and set basic properties
      customAlert.id = "customAlert";
      customAlert.className = "custom-alert";
      customAlert.innerHTML = `
                <div class="custom-alert-content">
                    <h4 id="customAlertTitle"></h4>
                    <p id="customAlertMessage"></p>
                </div>
            `;
      document.body.appendChild(customAlert);
    }

    const titleMap = {
      success: "Succès !",
      error: "Erreur !",
      info: "Information :",
      warning: "Attention :",
    };
    const titleElement = customAlert.querySelector("#customAlertTitle");
    const messageElement = customAlert.querySelector("#customAlertMessage");

    if (customAlert && titleElement && messageElement) {
      customAlert.classList.remove(
        "success",
        "error",
        "info",
        "warning",
        "show"
      ); // Clear previous states
      customAlert.classList.remove(
        "text-green-500",
        "text-red-500",
        "text-blue-500",
        "text-yellow-500"
      );

      titleElement.textContent = titleMap[type] || titleMap.info;
      messageElement.textContent = messageText;

      customAlert.classList.add(type, "show"); // Add new type and 'show' class

      setTimeout(() => {
        customAlert.classList.remove("show"); // Hide after duration
      }, duration);
    } else {
      console.error("Alert elements not found or customAlert is null.");
      // Fallback to native alert if custom alert fails (should not happen in production)
      // alert(`${titleMap[type] || titleMap.info}: ${messageText}`);
    }
  }

  /**
   * Displays a custom confirmation modal.
   * @param {string} messageText - The message to display in the confirmation.
   * @param {function} onConfirmCallback - Callback function to execute if user confirms.
   */
  function showConfirmationModal(messageText, onConfirmCallback) {
    let modalOverlay = document.getElementById("confirmationModalOverlay");
    if (!modalOverlay) {
      modalOverlay = document.createElement("div");
      modalOverlay.id = "confirmationModalOverlay";
      modalOverlay.className =
        "fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-[2000] hidden";
      modalOverlay.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                    <h4 class="text-xl font-bold text-gray-800 mb-4">Confirmer l'action</h4>
                    <p id="confirmationModalMessage" class="mb-6 text-gray-700"></p>
                    <div class="flex justify-end space-x-3">
                        <button id="cancelConfirmBtn" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors">Annuler</button>
                        <button id="confirmActionBtn" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">Confirmer</button>
                    </div>
                </div>
            `;
      document.body.appendChild(modalOverlay);
    }

    const messageElement = modalOverlay.querySelector(
      "#confirmationModalMessage"
    );
    const confirmBtn = modalOverlay.querySelector("#confirmActionBtn");
    const cancelBtn = modalOverlay.querySelector("#cancelConfirmBtn");

    messageElement.textContent = messageText;

    // Remove existing event listeners to prevent multiple calls
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener("click", () => {
      onConfirmCallback();
      modalOverlay.classList.add("hidden");
    });

    newCancelBtn.addEventListener("click", () => {
      modalOverlay.classList.add("hidden");
    });

    modalOverlay.classList.remove("hidden");
  }

  /**
   * Gets French status text and icon/color classes for a given status.
   * @param {string} status - The status string (e.g., 'delivered', 'pending_acconier').
   * @returns {{text: string, iconClass: string, colorClass: string, badgeClass: string}}
   */
  function getStatusInfo(status) {
    const trimmedStatus = status.trim(); // Trim whitespace from the status
    console.log("getStatusInfo received status (trimmed):", trimmedStatus); // Added for debugging
    console.log("ALL_ACCONIER_STATUS_INFO content:", ALL_ACCONIER_STATUS_INFO); // Added for debugging

    // Vérifie d'abord les nouveaux statuts métier acconier pour affichage dans le tableau de suivi
    const acconierOption = ALL_ACCONIER_STATUS_INFO[trimmedStatus];
    if (acconierOption) {
      return {
        text: acconierOption.text,
        iconClass: acconierOption.icon,
        colorClass: `text-[${acconierOption.color}]`,
        badgeClass: trimmedStatus,
      };
    }

    // Fallback to general delivery statuses if not found in ALL_ACCONIER_STATUS_INFO
    // This handles statuses that might come from backend but are not acconier-specific
    let text = "";
    let iconClass = "";
    let colorClass = "";
    let badgeClass = "";

    switch (
      trimmedStatus // Use trimmed status in switch statement
    ) {
      case "delivered":
        text = "Livré";
        iconClass = "fa-check-circle";
        colorClass = "text-green-600";
        badgeClass = "delivered";
        break;
      case "rejected":
      case "rejected_by_employee":
        text = "Rejeté";
        iconClass = "fa-times-circle";
        colorClass = "text-red-600";
        badgeClass = "rejected";
        break;
      case "pending": // General pending
        text = "En attente";
        iconClass = "fa-hourglass-half";
        colorClass = "text-yellow-600";
        badgeClass = "pending";
        break;
      case "in_progress": // General in progress
        text = "En cours";
        iconClass = "fa-truck-moving";
        colorClass = "text-blue-600";
        badgeClass = "in_progress";
        break;
      default:
        text = "Inconnu";
        iconClass = "fa-question-circle";
        colorClass = "text-gray-600";
        badgeClass = "unknown";
        break;
    }
    return { text, iconClass, colorClass, badgeClass };
  }

  /**
   * Formats a Date object into ISO-MM-DD format.
   * @param {Date} date - The date object to format.
   * @returns {string} The date in ISO-MM-DD format.
   */
  function formatDateToISO(date) {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Normalizes a Date object to midnight UTC for consistent daily comparisons.
   * @param {Date} date - The date object to normalize.
   * @returns {Date} A new Date object set to midnight UTC.
   */
  function normalizeDateToMidnightUTC(date) {
    const d = new Date(date);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  /**
   * Generates a formatted date range string for history/archives buttons.
   * @param {Array<Object>} deliveries - The array of delivery objects.
   * @param {'recent'|'archives'} type - The type of history ('recent' or 'archives').
   * @returns {string} Formatted string like "Historique (25 juin - 27 juin)" or "Archives (Anciennes)".
   */
  function getFormattedDateRange(deliveries, type) {
    if (deliveries.length === 0) {
      return type === "recent" ? "Historique (Récent)" : "Archives (Anciennes)";
    }

    // Sort by created_at to easily find min and max dates
    const sortedDeliveries = [...deliveries].sort(
      (a, b) => a.created_at.getTime() - b.created_at.getTime()
    );

    const oldestDate = sortedDeliveries[0].created_at;
    const newestDate = sortedDeliveries[sortedDeliveries.length - 1].created_at;

    const options = { day: "numeric", month: "short", year: "numeric" };
    const oldestFormatted = oldestDate.toLocaleDateString("fr-FR", options);
    const newestFormatted = newestDate.toLocaleDateString("fr-FR", options);

    if (oldestFormatted === newestFormatted) {
      return `${
        type === "recent" ? "Historique" : "Archives"
      } (${oldestFormatted})`;
    } else {
      return `${
        type === "recent" ? "Historique" : "Archives"
      } (${oldestFormatted} - ${newestFormatted})`;
    }
  }

  // --- Data Loading and Filtering ---

  /**
   * Fetches all deliveries from the backend and filters them for current pending and history.
   */
  async function loadDeliveries() {
    if (loadingOverlay) loadingOverlay.style.display = "flex";
    try {
      const response = await fetch(
        "https://plateformdesuivie-its-service.onrender.com/deliveries/status"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        allDeliveries = data.deliveries.map((d) => {
          if (d.created_at) d.created_at = new Date(d.created_at);
          if (d.delivery_date) d.delivery_date = new Date(d.delivery_date);
          return d;
        });

        filterDeliveriesIntoCategories();
        renderNewRequestsSummary();

        // Removed dynamic date ranges from buttons as per user request.
        // The buttons will now just display their static text and icon.
        if (toggleHistoryBtn) {
          toggleHistoryBtn.innerHTML = `<i class="fas fa-history mr-2"></i> Historique`;
        }
        if (toggleArchivesBtn) {
          toggleArchivesBtn.innerHTML = `<i class="fas fa-archive mr-2"></i> Archives`;
        }

        // If history modal is open, ensure it refreshes with current view type and current search term
        if (historySidebar.classList.contains("open")) {
          // When reloading, we want to go back to the agent list if we were in agent view
          // unless we specifically apply an agent filter again.
          renderHistoryDeliveries(
            activeModalContentSource,
            activeAgentFilterName,
            historySearchInput.value
          );
        }

        // Ensure the expanded history view inline is always hidden
        expandedHistoryView.classList.add("hidden");

        // Default view: single delivery or 'click to view' message
        singleDeliveryView.classList.remove("hidden");
        if (selectedDeliveryId) {
          const selected = currentPendingDeliveries.find(
            (d) => d.id === selectedDeliveryId
          );
          if (selected) {
            displaySelectedDeliveryCard(selected);
          } else {
            // If previously selected pending item is no longer pending (e.g., processed)
            // Or if selected a history item, clear main view and reset selectedId for future pending selection
            singleDeliveryView.innerHTML = `
                            <i class="fas fa-hand-pointer text-5xl mb-4 text-gray-300"></i>
                            <p>Cliquez sur une demande ci-dessus pour la consulter en détail.</p>
                        `;
            singleDeliveryView.classList.add(
              "flex",
              "items-center",
              "justify-content-center",
              "flex-col"
            );
            selectedDeliveryId = null;
          }
        } else {
          singleDeliveryView.innerHTML = `
                            <i class="fas fa-hand-pointer text-5xl mb-4 text-gray-300"></i>
                            <p>Cliquez sur une demande ci-dessus pour la consulter en détail.</p>
                        `;
          singleDeliveryView.classList.add(
            "flex",
            "items-center",
            "justify-content-center",
            "flex-col"
          );
        }
      } else {
        showCustomAlert(
          `Erreur lors du chargement des livraisons: ${data.message}`,
          "error"
        );
        console.error("Failed to load deliveries:", data.message);
      }
    } catch (error) {
      showCustomAlert(
        `Erreur réseau ou serveur lors du chargement: ${error.message}`,
        "error"
      );
      console.error("Error loading deliveries:", error);
    } finally {
      if (loadingOverlay) loadingOverlay.style.display = "none";
    }
  }

  /**
   * Filters allDeliveries into currentPendingDeliveries, recentHistoricalDeliveries, and archivedDeliveries.
   * Applies daily filter for pending and a 3-day threshold for historical/archived.
   * Note: Main dashboard search/status filters removed from header, so this function
   * no longer applies those to currentPendingDeliveries.
   */
  function filterDeliveriesIntoCategories() {
    currentPendingDeliveries = [];
    recentHistoricalDeliveries = [];
    archivedDeliveries = [];

    const todayUTC = normalizeDateToMidnightUTC(new Date());
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Set threshold for 3 days
    threeDaysAgo.setHours(0, 0, 0, 0); // Normalize to start of the day for consistent comparison

    allDeliveries.forEach((delivery) => {
      // Forcer le statut par défaut si non défini ou obsolète
      if (
        !delivery.delivery_status_acconier ||
        ![
          "awaiting_payment_acconier",
          "in_progress_payment_acconier",
          "pending_acconier",
          "payment_done_acconier",
          "processed_acconier",
          "rejected_acconier",
        ].includes(delivery.delivery_status_acconier)
      ) {
        delivery.delivery_status_acconier = "awaiting_payment_acconier";
      }

      const createdAtUTC = normalizeDateToMidnightUTC(delivery.created_at);

      // Seules les livraisons au statut 'pending_acconier' restent dans le dashboard
      if (delivery.delivery_status_acconier === "pending_acconier") {
        currentPendingDeliveries.push(delivery);
        // On veut aussi qu'elles apparaissent dans l'historique récent ou archives selon la date
        if (
          delivery.created_at &&
          delivery.created_at.getTime() >= threeDaysAgo.getTime()
        ) {
          recentHistoricalDeliveries.push(delivery);
        } else {
          archivedDeliveries.push(delivery);
        }
        return; // On ne les classe pas deux fois
      }

      // Les autres statuts : classement classique
      if (
        delivery.created_at &&
        delivery.created_at.getTime() >= threeDaysAgo.getTime()
      ) {
        recentHistoricalDeliveries.push(delivery);
      } else {
        archivedDeliveries.push(delivery);
      }
    });

    // Sort pending by creation time (oldest first, to process them in order of arrival)
    currentPendingDeliveries.sort(
      (a, b) => a.created_at.getTime() - b.created_at.getTime()
    );
    // Sort history and archives by creation time (most recent first)
    recentHistoricalDeliveries.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    );
    archivedDeliveries.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    );
  }

  /**
   * Renders the summary of new pending requests for the current day.
   */
  function renderNewRequestsSummary() {
    newRequestsSummaryBar.innerHTML = "";
    // Récupérer les IDs supprimés du localStorage
    let hiddenNewRequests = [];
    try {
      hiddenNewRequests =
        JSON.parse(localStorage.getItem("hiddenNewRequests")) || [];
    } catch (e) {
      hiddenNewRequests = [];
    }
    // Filtrer les demandes à afficher
    const visibleDeliveries = currentPendingDeliveries.filter(
      (delivery) => !hiddenNewRequests.includes(delivery.id)
    );
    if (visibleDeliveries.length === 0) {
      noNewRequestsMessage.style.display = "block";
      newRequestsCount.textContent = "0";
    } else {
      noNewRequestsMessage.style.display = "none";
      newRequestsCount.textContent = visibleDeliveries.length;
      visibleDeliveries.forEach((delivery) => {
        const item = document.createElement("span");
        item.className = "new-request-item flex items-center";
        item.dataset.deliveryId = delivery.id;
        // Contenu principal : Nom client - N° dossier
        const label = document.createElement("span");
        label.textContent = `${delivery.client_name || "-"} - ${
          delivery.dossier_number || "N/A"
        }`;
        label.style.flex = "1 1 auto";
        label.style.overflow = "hidden";
        label.style.textOverflow = "ellipsis";
        label.style.whiteSpace = "nowrap";

        // Bouton suppression (icône poubelle)
        const deleteBtn = document.createElement("button");
        deleteBtn.className =
          "delete-new-request-btn ml-2 text-red-600 hover:text-red-800 focus:outline-none";
        deleteBtn.title = "Supprimer cette demande";
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          // Persistance locale : mémoriser l'ID supprimé
          let hiddenNewRequests = [];
          try {
            hiddenNewRequests =
              JSON.parse(localStorage.getItem("hiddenNewRequests")) || [];
          } catch (e) {
            hiddenNewRequests = [];
          }
          if (!hiddenNewRequests.includes(delivery.id)) {
            hiddenNewRequests.push(delivery.id);
            localStorage.setItem(
              "hiddenNewRequests",
              JSON.stringify(hiddenNewRequests)
            );
          }
          // Suppression visuelle immédiate
          item.remove();
          // Si plus aucune carte, afficher le message vide
          if (
            newRequestsSummaryBar.querySelectorAll(".new-request-item")
              .length === 0
          ) {
            noNewRequestsMessage.style.display = "block";
            newRequestsCount.textContent = "0";
          } else {
            newRequestsCount.textContent =
              newRequestsSummaryBar.querySelectorAll(
                ".new-request-item"
              ).length;
          }
        });

        if (delivery.id === selectedDeliveryId) {
          item.classList.add("selected");
        }
        item.addEventListener("click", () => {
          // Remove 'selected' from previously selected item in the new requests summary bar
          const currentSelected = newRequestsSummaryBar.querySelector(
            ".new-request-item.selected"
          );
          if (currentSelected) {
            currentSelected.classList.remove("selected");
          }
          // Deselect any previously selected history card in the modal
          const currentSelectedHistoryCard = historyContent.querySelector(
            ".history-card.selected"
          );
          if (currentSelectedHistoryCard) {
            currentSelectedHistoryCard.classList.remove("selected");
          }

          item.classList.add("selected"); // Add 'selected' to clicked item
          selectedDeliveryId = delivery.id; // Update selected ID to the clicked delivery

          // Always show the single delivery view when an item is clicked
          displaySelectedDeliveryCard(delivery);

          // Ensure the main history view (expandedHistoryView) is hidden
          expandedHistoryView.classList.add("hidden");
          singleDeliveryView.classList.remove("hidden");
          newRequestsSection.classList.remove("hidden");
        });
        item.appendChild(label);
        item.appendChild(deleteBtn);
        newRequestsSummaryBar.appendChild(item);
      });
    }
  }

  /**
   * Displays the detailed card for a selected delivery in the main dashboard area.
   * @param {object} delivery - The delivery object to display.
   */
  function displaySelectedDeliveryCard(delivery) {
    singleDeliveryView.innerHTML = ""; // Clear previous content
    singleDeliveryView.classList.remove(
      "flex",
      "items-center",
      "justify-content-center",
      "flex-col"
    );
    singleDeliveryView.classList.add("p-6");

    const card = document.createElement("div");
    card.className = "delivery-card overflow-x-auto max-w-full";
    card.dataset.deliveryId = delivery.id;

    const agentAcconierNameForHeader =
      delivery.employee_name || "Agent Acconier";

    // Correction : le statut affiché doit TOUJOURS refléter la valeur enregistrée (pas réinitialisé)
    // On utilise la valeur brute de delivery.delivery_status_acconier pour le select
    const currentStatus =
      delivery.delivery_status_acconier || "awaiting_payment_acconier";

    // Utilisation de styles CSS pour empêcher le débordement
    const infoStyle =
      'style="max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; word-break: break-all;"';

    card.innerHTML = `
      <div class="delivery-card-header">
        <h2 ${infoStyle}>${agentAcconierNameForHeader}</h2>
      </div>
      <div class="delivery-card-body">
        <div class="delivery-info-group"><strong>Agent Acconier:</strong> <span ${infoStyle}>${
      delivery.employee_name || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Client:</strong> <span ${infoStyle}>${
      delivery.client_name || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Téléphone Client:</strong> <span ${infoStyle}>${
      delivery.client_phone || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Numéro TC(s):</strong> <span style="max-width:100%;white-space:normal;word-break:break-all;overflow-wrap:anywhere;display:inline-block;">${
          delivery.container_number || "-"
        }</span></div>
        <div class="delivery-info-group"><strong>N° BL:</strong> <span ${infoStyle}>${
      delivery.bl_number || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Compagnie Maritime:</strong> <span ${infoStyle}>${
      delivery.shipping_company || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Nom du Navire:</strong> <span ${infoStyle}>${
      delivery.ship_name || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Type Conteneur (pieds):</strong> <span ${infoStyle}>${
      delivery.container_foot_type || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Contenu:</strong> <span ${infoStyle}>${
      delivery.container_type_and_content || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Poids (kg):</strong> <span ${infoStyle}>${
      delivery.weight || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Mode de Transport:</strong> <span ${infoStyle}>${
      delivery.transporter_mode || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Nombre de Conteneurs:</strong> <span ${infoStyle}>${
      delivery.number_of_containers || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Lieu de Livraison:</strong> <span ${infoStyle}>${
      delivery.lieu || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>N° Déclaration:</strong> <span ${infoStyle}>${
      delivery.declaration_number || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Numéro de Dossier:</strong> <span ${infoStyle}>${
      delivery.dossier_number || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Circuit:</strong> <span ${infoStyle}>${
      delivery.circuit || "-"
    }</span></div>
        <div class="delivery-info-group"><strong>Date de soumission:</strong> <span ${infoStyle}>${
      delivery.created_at ? delivery.created_at.toLocaleString("fr-FR") : "-"
    }</span></div>
      </div>
      <div class="delivery-card-actions">
        <div class="delivery-info-group">
          <strong>Observations (Acconier):</strong>
          <textarea class="observation-textarea" placeholder="Ajouter une observation..." data-original-observation="${
            delivery.observation_acconier || ""
          }">${delivery.observation_acconier || ""}</textarea>
        </div>
        <div class="delivery-info-group">
          <strong>Statut (Acconier):</strong>
          <select class="status-select" data-original-status="${currentStatus}">
            <option value="awaiting_payment_acconier" disabled ${
              currentStatus === "awaiting_payment_acconier" ? "selected" : ""
            }>En attente de paiement</option>
            ${ACCONIER_STATUS_OPTIONS.map(
              (opt) =>
                `<option value="${opt.value}" ${
                  currentStatus === opt.value ? "selected" : ""
                }>${opt.text}</option>`
            ).join("")}
          </select>
        </div>
        <button class="action-button send-btn"><i class="fas fa-paper-plane mr-2"></i> Valider</button>
        <button class="action-button reject-btn mt-3"><i class="fas fa-times-circle mr-2"></i> Refuser</button>
      </div>
    `;
    singleDeliveryView.appendChild(card);

    // Add event listeners for the Validate and Reject buttons
    const validateButton = card.querySelector(".send-btn");
    const rejectButton = card.querySelector(".reject-btn");
    const observationTextarea = card.querySelector(".observation-textarea");
    const statusSelect = card.querySelector(".status-select");

    // Only add event listeners if the card is not read-only
    // Les boutons et champs sont toujours actifs
    validateButton.addEventListener("click", async (e) => {
      const newObservation = observationTextarea.value.trim();
      const newStatus = statusSelect.value;
      if (!newObservation) {
        showCustomAlert(
          "Le champ 'Observations (Acconier)' est obligatoire pour soumettre cette livraison.",
          "error",
          5000
        );
        return;
      }
      if (newStatus === "awaiting_payment_acconier") {
        showCustomAlert(
          "Ce statut est déjà inclus par défaut dans le tableau de suivi. Veuillez choisir une autre option pour valider.",
          "info",
          6000
        );
        return;
      }

      // --- MISE À JOUR OPTIMISTE ---
      // 1. Mettre à jour localement l'objet dans allDeliveries
      const idx = allDeliveries.findIndex((d) => d.id === delivery.id);
      if (idx !== -1) {
        allDeliveries[idx].observation_acconier = newObservation;
        allDeliveries[idx].delivery_status_acconier = newStatus;
      }
      // 2. Mettre à jour dans les tableaux filtrés si présent
      [
        currentPendingDeliveries,
        recentHistoricalDeliveries,
        archivedDeliveries,
      ].forEach((arr) => {
        const i = arr.findIndex((d) => d.id === delivery.id);
        if (i !== -1) {
          arr[i].observation_acconier = newObservation;
          arr[i].delivery_status_acconier = newStatus;
        }
      });
      // 3. Rafraîchir l'affichage du tableau de suivi (résumé + carte)
      renderNewRequestsSummary();
      // Si la carte affichée correspond à la livraison modifiée, la re-rendre
      if (selectedDeliveryId === delivery.id) {
        displaySelectedDeliveryCard(allDeliveries[idx]);
      }

      // 4. Mettre à jour immédiatement dans le tableau de suivi (DOM)
      // Chercher la ligne correspondante dans le tableau de suivi (si présent)
      const suiviTable = document.getElementById("suiviTable");
      if (suiviTable) {
        const row = suiviTable.querySelector(
          `tr[data-delivery-id='${delivery.id}']`
        );
        if (row) {
          // Met à jour la cellule Statut de livraison (Resp. Aconiés)
          const statutCell = row.querySelector(".statut-acconier-cell");
          if (statutCell) {
            statutCell.textContent = window.getStatusInfo
              ? window.getStatusInfo(newStatus).text
              : newStatus;
          }
          // Met à jour la cellule Observations (Resp. Aconiés)
          const obsCell = row.querySelector(".observation-acconier-cell");
          if (obsCell) {
            obsCell.textContent = newObservation;
          }
        }
      }

      // 5. Lancer la requête réseau (MAJ DOM/JS immédiate, MAJ serveur en asynchrone)
      updateAcconierDelivery(
        delivery.id,
        newObservation,
        newStatus,
        (removedFromList) => {
          // Callback appelé APRÈS la réponse serveur
          // Si la livraison n'est plus dans la liste (statut changé), on retire la ligne du DOM
          const suiviTable = document.getElementById("suiviTable");
          if (removedFromList && suiviTable) {
            const row = suiviTable.querySelector(
              `tr[data-delivery-id='${delivery.id}']`
            );
            if (row) row.remove();
            // Si la carte affichée correspond à la livraison supprimée, on affiche le message par défaut
            if (selectedDeliveryId === delivery.id) {
              singleDeliveryView.innerHTML = `
              <i class="fas fa-hand-pointer text-5xl mb-4 text-gray-300"></i>
              <p>Cliquez sur une demande ci-dessus pour la consulter en détail.</p>
            `;
              singleDeliveryView.classList.add(
                "flex",
                "items-center",
                "justify-content-center",
                "flex-col"
              );
              selectedDeliveryId = null;
            }
          }
          // Sinon, rien à faire (ligne déjà à jour)
        }
      );
    });

    rejectButton.addEventListener("click", async (e) => {
      const newObservation = observationTextarea.value.trim();
      const newStatus = "rejected_acconier"; // Force status to rejected_acconier pour ce bouton
      if (!newObservation) {
        showCustomAlert(
          "Le champ 'Observations (Acconier)' est obligatoire pour refuser cette livraison.",
          "error",
          5000
        );
        // Empêche tout appel réseau ou rechargement
        return;
      }
      // --- MISE À JOUR OPTIMISTE ---
      const idx = allDeliveries.findIndex((d) => d.id === delivery.id);
      if (idx !== -1) {
        allDeliveries[idx].observation_acconier = newObservation;
        allDeliveries[idx].delivery_status_acconier = newStatus;
      }
      [
        currentPendingDeliveries,
        recentHistoricalDeliveries,
        archivedDeliveries,
      ].forEach((arr) => {
        const i = arr.findIndex((d) => d.id === delivery.id);
        if (i !== -1) {
          arr[i].observation_acconier = newObservation;
          arr[i].delivery_status_acconier = newStatus;
        }
      });
      renderNewRequestsSummary();
      if (selectedDeliveryId === delivery.id) {
        displaySelectedDeliveryCard(allDeliveries[idx]);
      }
      // MAJ DOM immédiate dans le tableau de suivi
      const suiviTable = document.getElementById("suiviTable");
      if (suiviTable) {
        const row = suiviTable.querySelector(
          `tr[data-delivery-id='${delivery.id}']`
        );
        if (row) {
          const statutCell = row.querySelector(".statut-acconier-cell");
          if (statutCell) {
            statutCell.textContent = window.getStatusInfo
              ? window.getStatusInfo(newStatus).text
              : newStatus;
          }
          const obsCell = row.querySelector(".observation-acconier-cell");
          if (obsCell) {
            obsCell.textContent = newObservation;
          }
        }
      }
      updateAcconierDelivery(
        delivery.id,
        newObservation,
        newStatus,
        (removedFromList) => {
          // Même logique que pour la validation
          const suiviTable = document.getElementById("suiviTable");
          if (removedFromList && suiviTable) {
            const row = suiviTable.querySelector(
              `tr[data-delivery-id='${delivery.id}']`
            );
            if (row) row.remove();
            if (selectedDeliveryId === delivery.id) {
              singleDeliveryView.innerHTML = `
              <i class="fas fa-hand-pointer text-5xl mb-4 text-gray-300"></i>
              <p>Cliquez sur une demande ci-dessus pour la consulter en détail.</p>
            `;
              singleDeliveryView.classList.add(
                "flex",
                "items-center",
                "justify-content-center",
                "flex-col"
              );
              selectedDeliveryId = null;
            }
          }
        }
      );
    });
  }

  /**
   * Deletes a delivery from the backend after user confirmation.
   * @param {string} deliveryId - The ID of the delivery to delete.
   */
  async function deleteDelivery(deliveryId) {
    showConfirmationModal(
      "Êtes-vous sûr de vouloir supprimer cette livraison de l'historique ? Elle restera visible dans le tableau de suivi.",
      () => {
        // Persistance locale : on mémorise l'ID supprimé dans localStorage
        let hiddenHistoryDeliveries = [];
        try {
          hiddenHistoryDeliveries =
            JSON.parse(localStorage.getItem("hiddenHistoryDeliveries")) || [];
        } catch (e) {
          hiddenHistoryDeliveries = [];
        }
        if (!hiddenHistoryDeliveries.includes(deliveryId)) {
          hiddenHistoryDeliveries.push(deliveryId);
          localStorage.setItem(
            "hiddenHistoryDeliveries",
            JSON.stringify(hiddenHistoryDeliveries)
          );
        }
        // On retire la carte du DOM
        const card = historyContent.querySelector(
          `[data-delivery-id='${deliveryId}']`
        );
        if (card) {
          card.remove();
        }
        showCustomAlert(
          `Livraison retirée de l'historique (affichage uniquement).`,
          "success"
        );
        if (historyContent.querySelectorAll(".history-card").length === 0) {
          noHistoryMessage.style.display = "block";
        }
      }
    );
  }

  /**
   * Renders deliveries in the history sidebar (modal).
   * @param {'recent'|'archives'|'agent_view'} viewType - The primary view type for the modal.
   * @param {string|null} [agentFilterName=null] - Optional: Filter by this agent name.
   * @param {string} [modalSearchTerm=''] - Search term for filtering within the modal.
   */
  function renderHistoryDeliveries(
    viewType,
    agentFilterName = null,
    modalSearchTerm = ""
  ) {
    historyContent.innerHTML = ""; // Clear previous content
    let deliveriesSource = [];
    let emptyMessage = "";

    // Determine the base set of deliveries based on viewType (recent/archives)
    if (viewType === "recent") {
      deliveriesSource = [...recentHistoricalDeliveries];
      historyModalTitle.textContent = "Historique des Livraisons Récentes"; // Default title for recent
      emptyMessage = "Aucune livraison récente traitée pour le moment.";
    } else if (viewType === "archives") {
      deliveriesSource = [...archivedDeliveries];
      historyModalTitle.textContent =
        "Archives des Livraisons (plus de 3 jours)"; // Default title for archives
      emptyMessage = "Aucune livraison archivée pour le moment.";
    } else if (viewType === "agent_view") {
      // If we're coming from an agent click, the source is allDeliveries
      deliveriesSource = [...allDeliveries];
      historyModalTitle.textContent = `Opérations de l'Agent : ${agentFilterName}`; // Title set based on agent
      emptyMessage = `Aucune opération trouvée pour l'agent "${agentFilterName}".`;
    }

    let deliveriesToRender = [...deliveriesSource];

    // Filtrer les livraisons supprimées de l'historique (persistance locale)
    let hiddenHistoryDeliveries = [];
    try {
      hiddenHistoryDeliveries =
        JSON.parse(localStorage.getItem("hiddenHistoryDeliveries")) || [];
    } catch (e) {
      hiddenHistoryDeliveries = [];
    }
    deliveriesToRender = deliveriesToRender.filter(
      (d) => !hiddenHistoryDeliveries.includes(d.id)
    );

    // Apply specific agent filter if provided (this happens when an agent name is clicked)
    if (agentFilterName) {
      deliveriesToRender = deliveriesToRender.filter(
        (d) => d.employee_name === agentFilterName
      );
      // Ensure agent specific title is set, overriding the general history/archives one
      historyModalTitle.textContent = `Opérations de l'Agent : ${agentFilterName}`;
      emptyMessage = `Aucune opération trouvée pour l'agent "${agentFilterName}".`;

      // Add a "Retour aux agents" button only when viewing agent-specific deliveries
      const backToAgentsBtn = document.createElement("button");
      backToAgentsBtn.className =
        "bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow transition duration-200 mb-4";
      backToAgentsBtn.innerHTML =
        '<i class="fas fa-arrow-left mr-2"></i> Retour aux agents';
      backToAgentsBtn.addEventListener("click", () => {
        // Return to the list of agents for the *original* source (recent/archives)
        manageHistoryModal("open", activeModalContentSource, null);
      });
      historyContent.appendChild(backToAgentsBtn);
    }

    // Apply modal-specific search filter on top of the base set (if any)
    if (modalSearchTerm) {
      const lowerCaseSearchTerm = modalSearchTerm.toLowerCase();
      deliveriesToRender = deliveriesToRender.filter((delivery) => {
        return (
          (delivery.declaration_number &&
            String(delivery.declaration_number)
              .toLowerCase()
              .includes(lowerCaseSearchTerm)) ||
          (delivery.bl_number &&
            String(delivery.bl_number)
              .toLowerCase()
              .includes(lowerCaseSearchTerm)) ||
          (delivery.container_number &&
            String(delivery.container_number)
              .toLowerCase()
              .includes(lowerCaseSearchTerm)) ||
          (delivery.client_name &&
            String(delivery.client_name)
              .toLowerCase()
              .includes(lowerCaseSearchTerm)) ||
          (delivery.employee_name && // Include employee name in search for agent view
            String(delivery.employee_name)
              .toLowerCase()
              .includes(lowerCaseSearchTerm))
        );
      });
    }

    // Sort the final list to be rendered by created_at (most recent first)
    deliveriesToRender.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    );

    if (deliveriesToRender.length === 0) {
      noHistoryMessage.textContent = emptyMessage;
      noHistoryMessage.style.display = "block";
      return;
    } else {
      noHistoryMessage.style.display = "none";
    }

    // New logic: Group by date first, then list agents/deliveries
    const dateGroupedContent = {};
    deliveriesToRender.forEach((delivery) => {
      const deliveryDateISO = formatDateToISO(delivery.created_at);
      if (!dateGroupedContent[deliveryDateISO]) {
        dateGroupedContent[deliveryDateISO] = {
          agents: {}, // For agent view: { "Agent Name": count }
          deliveries: [], // For agent-specific view: list of deliveries
        };
      }

      if (agentFilterName) {
        // If we are in agent-specific view, just add delivery to the list for that date
        dateGroupedContent[deliveryDateISO].deliveries.push(delivery);
      } else {
        // If we are in general history/archives view (listing agents by date)
        if (delivery.employee_name) {
          if (
            !dateGroupedContent[deliveryDateISO].agents[delivery.employee_name]
          ) {
            dateGroupedContent[deliveryDateISO].agents[
              delivery.employee_name
            ] = 0;
          }
          dateGroupedContent[deliveryDateISO].agents[delivery.employee_name]++;
        }
      }
    });

    const sortedDates = Object.keys(dateGroupedContent).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    const todayISO = formatDateToISO(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = formatDateToISO(yesterday);

    sortedDates.forEach((dateISO) => {
      const dateHeader = document.createElement("h4");
      dateHeader.className = "text-lg font-bold text-gray-700 mt-4 mb-2";
      if (dateISO === todayISO) {
        dateHeader.textContent = "Aujourd'hui";
      } else if (dateISO === yesterdayISO) {
        dateHeader.textContent = "Hier";
      } else {
        dateHeader.textContent = new Date(dateISO).toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      historyContent.appendChild(dateHeader);

      if (agentFilterName) {
        // Render individual delivery cards for the specific agent
        dateGroupedContent[dateISO].deliveries.forEach((delivery) => {
          const card = document.createElement("div");
          card.className = "history-card relative"; // Added relative for absolute positioning of delete button
          card.dataset.deliveryId = delivery.id;

          card.innerHTML = `
                            <div class="history-info-group">
                                <strong>Client:</strong> <span>${
                                  delivery.client_name || "-"
                                }</span>
                            </div>
                            <div class="history-info-group">
                                <strong>TC:</strong> <span>${
                                  delivery.container_number || "-"
                                }</span>
                            </div>
                            <div class="history-info-group">
                                <strong>BL:</strong> <span>${
                                  delivery.bl_number || "-"
                                }</span>
                            </div>
                            <div class="history-info-group">
                                <strong>Date:</strong> <span>${
                                  delivery.created_at
                                    ? delivery.created_at.toLocaleDateString(
                                        "fr-FR"
                                      )
                                    : "-"
                                }</span>
                            </div>
                            <div class="history-info-group">
                                <strong>Obs:</strong> <span>${(
                                  delivery.observation_acconier || "-"
                                ).substring(0, 50)}...</span>
                            </div>
                            <div class="history-info-group">
                                <strong>Statut Acconier:</strong> <span class="badge ${
                                  getStatusInfo(
                                    delivery.delivery_status_acconier
                                  ).badgeClass
                                }">${
            getStatusInfo(delivery.delivery_status_acconier).text
          }</span>
                            </div>
                            <button class="delete-history-item-btn absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                                <i class="fas fa-trash-alt text-sm"></i>
                            </button>
                        `;
          historyContent.appendChild(card);

          // Event listener for the delete button
          const deleteBtn = card.querySelector(".delete-history-item-btn");
          if (deleteBtn) {
            deleteBtn.addEventListener("click", (e) => {
              e.stopPropagation(); // Prevent card click event from firing
              deleteDelivery(delivery.id);
            });
          }

          card.addEventListener("click", () => {
            const currentSelectedNewRequest =
              newRequestsSummaryBar.querySelector(".new-request-item.selected");
            if (currentSelectedNewRequest) {
              currentSelectedNewRequest.classList.remove("selected");
            }
            const currentSelectedHistoryCardSidebar =
              historyContent.querySelector(".history-card.selected");
            if (currentSelectedHistoryCardSidebar) {
              currentSelectedHistoryCardSidebar.classList.remove("selected");
            }
            card.classList.add("selected");
            selectedDeliveryId = delivery.id;
            displaySelectedDeliveryCard(delivery);
            manageHistoryModal("close");
            expandedHistoryView.classList.add("hidden");
            singleDeliveryView.classList.remove("hidden");
            newRequestsSection.classList.remove("hidden");
          });
        });
      } else {
        // Render agent items under the date header
        const agentsForThisDate = dateGroupedContent[dateISO].agents;
        const sortedAgentsForThisDate = Object.keys(agentsForThisDate).sort();

        sortedAgentsForThisDate.forEach((agentName) => {
          const agentItem = document.createElement("div");
          agentItem.className =
            "history-agent-item p-4 mb-2 bg-blue-100 rounded-lg shadow-sm cursor-pointer hover:bg-blue-200 transition-colors duration-200";
          agentItem.innerHTML = `
                            <p class="font-bold text-lg text-blue-800">${agentName}</p>
                            <span class="text-sm text-blue-600">${agentsForThisDate[agentName]} opération(s)</span>
                        `;
          agentItem.addEventListener("click", () => {
            manageHistoryModal("open", viewType, agentName); // Pass original viewType
          });
          historyContent.appendChild(agentItem);
        });
      }
    });
  }

  /**
   * This function is no longer actively used to display content,
   * as the "Étaler Historique" button has been removed and history is in the modal.
   * It's kept as a placeholder in case future requirements change.
   */
  function renderExpandedHistoryInMainView() {
    expandedHistoryView.innerHTML = `
                <div class="empty-state text-center p-8 col-span-full">
                    <i class="fas fa-info-circle text-6xl text-gray-400 mb-4"></i>
                    <p class="text-xl text-gray-600">L'historique complet est désormais disponible dans la boîte flottante "Historique".</p>
                    <p class="text-gray-500 mt-2">Cliquez sur le bouton "Historique" en haut à droite.</p>
                </div>
            `;
    // Ensure this view remains hidden as the modal is the primary history display
    expandedHistoryView.classList.add("hidden");
  }

  /**
   * Updates the acconier's observation and status for a specific delivery.
   * This function now triggers re-rendering of both pending and history sections.
   * @param {string} deliveryId - The ID of the delivery to update.
   * @param {string} observation - The new observation text.
   * @param {string} status - The new acconier status.
   */
  // Ajout d'un callback optionnel pour exécuter du code APRÈS le rechargement effectif
  async function updateAcconierDelivery(
    deliveryId,
    observation,
    status,
    afterReloadCallback
  ) {
    if (loadingOverlay) loadingOverlay.style.display = "flex";
    try {
      const currentDelivery = allDeliveries.find((d) => d.id === deliveryId);
      if (!currentDelivery.observation_acconier && observation === "") {
        showCustomAlert(
          "Le champ 'Observations (Acconier)' est obligatoire pour soumettre cette livraison. Il restera modifiable tant qu'une observation ne sera pas saisie.",
          "error",
          7000
        );
        if (typeof afterReloadCallback === "function")
          afterReloadCallback(false);
        return;
      }
      // On lance la requête réseau en asynchrone, mais on ne recharge pas tout le tableau
      fetch(`http://localhost:3000/deliveries/${deliveryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          observation_acconier: observation,
          delivery_status_acconier: status,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Failed to update delivery status: ${
                errorData.message || response.statusText
              }`
            );
          }
          const result = await response.json();
          showCustomAlert(
            `Livraison ${result.delivery.id} mise à jour par l'acconier.`,
            "success"
          );
          // Rafraîchir les catégories et le DOM instantanément
          filterDeliveriesIntoCategories();
          renderNewRequestsSummary();
          // Si la modal historique est ouverte sur un agent, on recharge les données pour afficher les infos à jour
          if (
            historySidebar.classList.contains("open") &&
            activeModalContentSource === "agent_view" &&
            activeAgentFilterName
          ) {
            await loadDeliveries();
            renderHistoryDeliveries(
              activeModalContentSource,
              activeAgentFilterName,
              historySearchInput.value
            );
          } else if (historySidebar.classList.contains("open")) {
            renderHistoryDeliveries(
              activeModalContentSource,
              activeAgentFilterName,
              historySearchInput.value
            );
          }
          // Si la livraison n'est plus dans la liste des pending, on le signale au callback
          let removedFromList = false;
          if (status !== "pending_acconier") {
            removedFromList = true;
          }
          if (typeof afterReloadCallback === "function") {
            afterReloadCallback(removedFromList);
          }
        })
        .catch((error) => {
          showCustomAlert(
            `Erreur lors de la mise à jour: ${error.message}`,
            "error",
            7000
          );
          console.error(
            "Error updating delivery from acconier dashboard:",
            error
          );
          if (typeof afterReloadCallback === "function")
            afterReloadCallback(false);
        })
        .finally(() => {
          if (loadingOverlay) loadingOverlay.style.display = "none";
        });
    } catch (error) {
      showCustomAlert(
        `Erreur lors de la mise à jour: ${error.message}`,
        "error",
        7000
      );
      console.error("Error updating delivery from acconier dashboard:", error);
      if (loadingOverlay) loadingOverlay.style.display = "none";
      if (typeof afterReloadCallback === "function") afterReloadCallback(false);
    }
  }

  // --- History Sidebar Toggle (Modal Management) ---
  /**
   * Manages the visibility and content of the history/archives modal.
   * @param {'open'|'close'} action - The action to perform ('open' or 'close').
   * @param {'recent'|'archives'|'agent_view'} [type=null] - The type of history to display if action is 'open'.
   * @param {string|null} [agentName=null] - The agent name to filter by if action is 'open' and type is 'agent_âview'.
   */
  function manageHistoryModal(action, type = null, agentName = null) {
    const isCurrentlyOpen = historySidebar.classList.contains("open");

    if (action === "close") {
      if (isCurrentlyOpen) {
        historySidebar.classList.remove("open");
        historyOverlay.classList.remove("open");
        document.body.style.overflow = "";
        // Clear the modal's search input and reset filters when closing
        historySearchInput.value = "";
        activeAgentFilterName = null;
        activeModalContentSource = "recent"; // Reset to default view type for next open
      }
      return;
    }

    // Action is 'open'
    let targetType = type;
    let targetAgentName = agentName;

    // If 'type' is not explicitly passed (e.g., if re-opening from a card click or refresh)
    // and we are not starting an agent filter, default to the last known source.
    if (targetType === null && agentName === null) {
      targetType = activeModalContentSource;
    }

    if (isCurrentlyOpen) {
      // Determine if we are just toggling close, or switching view type/agent filter
      const isClosingSameView =
        targetType === activeModalContentSource &&
        targetAgentName === activeAgentFilterName;

      if (isClosingSameView) {
        // Clicking the same button again (or same agent), so close it.
        historySidebar.classList.remove("open");
        historyOverlay.classList.remove("open");
        document.body.style.overflow = "";
        historySearchInput.value = ""; // Clear input on close
        activeAgentFilterName = null;
        activeModalContentSource = "recent"; // Reset to default view type for next open
        return;
      } else {
        // Switching between History/Archives/Agent view while modal is open
        // Ensure search input is cleared when switching type/agent
        historySearchInput.value = "";
        renderHistoryDeliveries(targetType, targetAgentName, ""); // Render with empty search term initially
      }
    } else {
      // Modal is closed, open it
      historySearchInput.value = ""; // Clear input before opening
      renderHistoryDeliveries(targetType, targetAgentName, ""); // Render with empty search term initially
      historySidebar.classList.add("open");
      historyOverlay.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    // Update global state variables after rendering
    activeModalContentSource = targetType;
    activeAgentFilterName = targetAgentName;
  }

  // --- WebSocket Client Initialization ---
  function initializeWebSocket() {
    socket = new WebSocket("ws://localhost:3000");

    socket.onopen = (event) => {
      console.log("Connecté au serveur WebSocket (Tableau de Bord Acconier)!");
    };

    socket.onmessage = async (event) => {
      console.log(
        "Message WebSocket reçu (Tableau de Bord Acconier):",
        event.data
      );
      try {
        const payload = JSON.parse(event.data);

        if (
          payload.type === "new_delivery_alert" ||
          payload.type === "delivery_update_alert" ||
          payload.type === "new_delivery_notification" // Added this line
        ) {
          showCustomAlert(payload.message, payload.alertType || "info");
          // A full reload and re-filter is the safest way to handle status changes and new entries
          await loadDeliveries();
          // If history modal is open, ensure it refreshes with current view type and current search term
          if (historySidebar.classList.contains("open")) {
            renderHistoryDeliveries(
              activeModalContentSource,
              activeAgentFilterName,
              historySearchInput.value
            );
          }
        }
        // Handle deletion if needed: If a delivery is deleted from admin panel, remove it here
        if (payload.type === "delivery_deletion_alert") {
          showCustomAlert(payload.message, payload.alertType || "info");
          await loadDeliveries(); // Reload to remove deleted items
          if (historySidebar.classList.contains("open")) {
            renderHistoryDeliveries(
              activeModalContentSource,
              activeAgentFilterName,
              historySearchInput.value
            );
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du traitement du message WebSocket (Tableau de Bord Acconier):",
          error
        );
      }
    };

    socket.onclose = (event) => {
      console.warn(
        "Déconnecté du serveur WebSocket (Tableau de Bord Acconier). Tentative de reconnexion...",
        event.code,
        event.reason
      );
      setTimeout(initializeWebSocket, 5000); // Try to reconnect every 5 seconds
    };

    socket.onerror = (error) => {
      console.error("Erreur WebSocket (Tableau de Bord Acconier):", error);
      socket.close(); // Force close to trigger onclose and subsequent reconnect
    };
  }

  // --- Initialization ---
  document.addEventListener("DOMContentLoaded", () => {
    // Setup history search input attributes and append to header
    historySearchInput.id = "historySearchInput";
    historySearchInput.type = "text";
    historySearchInput.placeholder =
      "Rechercher (N° Décl, BL, Conteneur, Client)";
    historySearchInput.className =
      "px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-4";

    // Find the history header and append the search input
    const historyHeader = historySidebar.querySelector(".history-header");
    if (historyHeader) {
      historyHeader.insertBefore(historySearchInput, historyHeader.children[1]); // Insert before close button
    }

    // Populate the status filter dropdown (this dropdown is no longer in the main header,
    // but the ACCONIER_STATUS_OPTIONS constant is still used for the delivery card status select)
    // Removed population logic as the select element is no longer in the main header.
    // The select for status update on the delivery card is still functional.

    // Event listeners
    if (refreshBtn) refreshBtn.addEventListener("click", loadDeliveries);

    // Removed searchInput and statusFilterSelect event listeners as they are no longer in the header.

    // Event listener for the new history search input (this remains functional for the modal)
    if (historySearchInput) {
      historySearchInput.addEventListener("input", () => {
        // Re-render the currently active modal view with the new search term
        renderHistoryDeliveries(
          activeModalContentSource,
          activeAgentFilterName,
          historySearchInput.value
        );
      });
    }

    // History modal toggle via the "Historique" button
    if (toggleHistoryBtn)
      toggleHistoryBtn.addEventListener("click", () => {
        // Unselect any previously selected new request item
        const currentSelectedNewRequest = newRequestsSummaryBar.querySelector(
          ".new-request-item.selected"
        );
        if (currentSelectedNewRequest) {
          currentSelectedNewRequest.classList.remove("selected");
        }
        // Unselect any previously selected history card in the modal
        const currentSelectedHistoryCard = historyContent.querySelector(
          ".history-card.selected"
        );
        if (currentSelectedHistoryCard) {
          currentSelectedHistoryCard.classList.remove("selected");
        }
        selectedDeliveryId = null; // Clear selected ID when opening full history

        manageHistoryModal("open", "recent", null); // Open the history modal with recent data

        // Ensure main view shows default message when history modal is opened via this button
        singleDeliveryView.innerHTML = `
                            <i class="fas fa-hand-pointer text-5xl mb-4 text-gray-300"></i>
                            <p>Cliquez sur une demande ci-dessus pour la consulter en détail.</p>
                        `;
        singleDeliveryView.classList.add(
          "flex",
          "items-center",
          "justify-content-center",
          "flex-col"
        );
        expandedHistoryView.classList.add("hidden");
        newRequestsSection.classList.remove("hidden");
      });

    // Archives modal toggle via the new "Archives" button
    if (toggleArchivesBtn)
      toggleArchivesBtn.addEventListener("click", () => {
        // Unselect any previously selected new request item
        const currentSelectedNewRequest = newRequestsSummaryBar.querySelector(
          ".new-request-item.selected"
        );
        if (currentSelectedNewRequest) {
          currentSelectedNewRequest.classList.remove("selected");
        }
        // Unselect any previously selected history card in the modal
        const currentSelectedHistoryCard = historyContent.querySelector(
          ".history-card.selected"
        );
        if (currentSelectedHistoryCard) {
          currentSelectedHistoryCard.classList.remove("selected");
        }
        selectedDeliveryId = null; // Clear selected ID when opening full history

        manageHistoryModal("open", "archives", null); // Open the history modal with archived data

        // Ensure main view shows default message when history modal is opened via this button
        singleDeliveryView.innerHTML = `
                            <i class="fas fa-hand-pointer text-5xl mb-4 text-gray-300"></i>
                            <p>Cliquez sur une demande ci-dessus pour la consulter en détail.</p>
                        `;
        singleDeliveryView.classList.add(
          "flex",
          "items-center",
          "justify-content-center",
          "flex-col"
        );
        expandedHistoryView.classList.add("hidden");
        newRequestsSection.classList.remove("hidden");
      });

    if (closeHistoryBtn)
      closeHistoryBtn.addEventListener("click", () =>
        manageHistoryModal("close")
      ); // Directly close
    if (historyOverlay)
      historyOverlay.addEventListener("click", () =>
        manageHistoryModal("close")
      ); // Directly close

    // Initial data load and WebSocket connection
    loadDeliveries();
    initializeWebSocket();
  });
})();
/***** JESUS TU ES DIEU */
