// Gestion de l'interface d'administration des accès - Version Améliorée
let currentRequestId = null;
let requests = [];
let currentFilter = "pending";
let activities = [];

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
  // Vérifier l'authentification admin
  checkAdminAuth();

  loadRequests();
  updateStatistics();
  updateDailyHistory();
  updateRecentActivity();
  updateAdvancedStats();

  // Gestionnaire pour le filtre de date
  document
    .getElementById("dateFilter")
    .addEventListener("change", updateDailyHistory);

  // Vérification des nouvelles demandes toutes les 30 secondes
  setInterval(checkForNewRequests, 30000);
});

// Vérifier l'authentification admin
function checkAdminAuth() {
  const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
  if (isAdminLoggedIn !== "true") {
    window.location.href = "/html/admin-login.html";
    return;
  }
}

// Charger les demandes
function loadRequests() {
  // Charger depuis l'API backend
  fetch("/api/access-requests")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        requests = data.requests || [];
      } else {
        requests = [];
      }
      displayRequests();
      updateStatistics();
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des demandes:", error);
      requests = [];
      displayRequests();
      updateStatistics();
    });

  // Charger les activités depuis localStorage
  const storedActivities = localStorage.getItem("adminActivities");
  if (storedActivities) {
    activities = JSON.parse(storedActivities);
  } else {
    activities = [];
  }

  displayRequests();
  updateStatistics();
}

// Sauvegarder les données
function saveRequests() {
  localStorage.setItem("accessRequests", JSON.stringify(requests));
}

function saveActivities() {
  localStorage.setItem("adminActivities", JSON.stringify(activities));
}

// Filtrer les demandes selon le statut
function filterRequests(status) {
  currentFilter = status;

  // Mettre à jour l'apparence des cartes
  document.querySelectorAll(".stat-card").forEach((card) => {
    card.classList.remove("active");
  });
  document.querySelector(`[data-filter="${status}"]`).classList.add("active");

  displayRequests();
  updateRequestsTitle();
}

// Effacer le filtre
function clearFilter() {
  currentFilter = "pending";
  document.querySelectorAll(".stat-card").forEach((card) => {
    card.classList.remove("active");
  });
  displayRequests();
  updateRequestsTitle();
}

// Mettre à jour le titre de la section des demandes
function updateRequestsTitle() {
  const titleElement = document.getElementById("requestsTitle");
  const clearBtn = document.getElementById("clearFilterBtn");
  const countElement = document.getElementById("requestsCount");

  let filteredRequests;
  let title;

  switch (currentFilter) {
    case "all":
      filteredRequests = requests;
      title = "Toutes les Demandes";
      clearBtn.classList.remove("hidden");
      break;
    case "pending":
      filteredRequests = requests.filter((req) => req.status === "pending");
      title = "Demandes en Attente";
      clearBtn.classList.add("hidden");
      break;
    case "approved":
      filteredRequests = requests.filter((req) => req.status === "approved");
      title = "Demandes Approuvées";
      clearBtn.classList.remove("hidden");
      break;
    case "rejected":
      filteredRequests = requests.filter((req) => req.status === "rejected");
      title = "Demandes Rejetées";
      clearBtn.classList.remove("hidden");
      break;
    default:
      filteredRequests = requests.filter((req) => req.status === "pending");
      title = "Demandes d'Accès";
  }

  titleElement.textContent = title;
  countElement.textContent = filteredRequests.length;
}

// Afficher les demandes selon le filtre actuel
function displayRequests() {
  const requestsList = document.getElementById("requestsList");
  const noRequests = document.getElementById("noRequests");
  const noRequestsMessage = document.getElementById("noRequestsMessage");

  let filteredRequests;
  let message;

  switch (currentFilter) {
    case "all":
      filteredRequests = requests;
      message = "Aucune demande d'accès";
      break;
    case "pending":
      filteredRequests = requests.filter((req) => req.status === "pending");
      message = "Aucune demande en attente";
      break;
    case "approved":
      filteredRequests = requests.filter((req) => req.status === "approved");
      message = "Aucune demande approuvée";
      break;
    case "rejected":
      filteredRequests = requests.filter((req) => req.status === "rejected");
      message = "Aucune demande rejetée";
      break;
    default:
      filteredRequests = requests.filter((req) => req.status === "pending");
      message = "Aucune demande en attente";
  }

  if (filteredRequests.length === 0) {
    requestsList.style.display = "none";
    noRequests.style.display = "block";
    noRequestsMessage.textContent = message;
    return;
  }

  requestsList.style.display = "block";
  noRequests.style.display = "none";

  requestsList.innerHTML = filteredRequests
    .map((request) => {
      const statusClass = getStatusClass(request.status);
      const statusText = getStatusText(request.status);
      const actionButton = getActionButton(request);

      return `
            <div class="access-card bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-blue-600 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-800">${
                              request.name
                            }</h3>
                            <p class="text-sm text-gray-600">${
                              request.email
                            }</p>
                            <p class="text-xs text-gray-500">Demandé le ${formatDate(
                              request.date
                            )}</p>
                            ${
                              request.processedAt
                                ? `<p class="text-xs text-gray-400">Traité le ${formatDateTime(
                                    request.processedAt
                                  )}</p>`
                                : ""
                            }
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusClass} text-white">
                            ${statusText}
                        </span>
                        ${actionButton}
                    </div>
                </div>
                <div class="mt-4 text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-2"></i>
                    ${getRequestDescription(request)}
                </div>
            </div>
        `;
    })
    .join("");

  updateRequestsTitle();
}

// Fonctions utilitaires pour l'affichage
function getStatusClass(status) {
  switch (status) {
    case "pending":
      return "status-pending";
    case "approved":
      return "status-approved";
    case "rejected":
      return "status-rejected";
    default:
      return "bg-gray-500";
  }
}

function getStatusText(status) {
  switch (status) {
    case "pending":
      return '<i class="fas fa-clock mr-1"></i>En attente';
    case "approved":
      return '<i class="fas fa-check mr-1"></i>Approuvée';
    case "rejected":
      return '<i class="fas fa-times mr-1"></i>Rejetée';
    default:
      return status;
  }
}

function getActionButton(request) {
  if (request.status === "pending") {
    return `<button onclick="openProcessModal(${request.id})" 
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium">
                <i class="fas fa-cog mr-2"></i>Traiter
            </button>`;
  } else {
    return `<span class="text-xs text-gray-500">Traité</span>`;
  }
}

function getRequestDescription(request) {
  if (request.status === "pending") {
    return `Un utilisateur "${request.name}" a fait une demande d'accès`;
  } else if (request.status === "approved") {
    return `Accès approuvé pour "${request.name}" - Compte créé`;
  } else {
    return `Demande de "${request.name}" rejetée`;
  }
}

// Mettre à jour les statistiques
function updateStatistics() {
  const total = requests.length;
  const pending = requests.filter((req) => req.status === "pending").length;
  const approved = requests.filter((req) => req.status === "approved").length;
  const rejected = requests.filter((req) => req.status === "rejected").length;

  document.getElementById("totalRequests").textContent = total;
  document.getElementById("pendingRequests").textContent = pending;
  document.getElementById("approvedRequests").textContent = approved;
  document.getElementById("rejectedRequests").textContent = rejected;
}

// Mettre à jour l'historique journalier
function updateDailyHistory() {
  const historyElement = document.getElementById("dailyHistory");
  const dateFilter = document.getElementById("dateFilter").value;

  const filteredHistory = getFilteredHistory(dateFilter);

  if (filteredHistory.length === 0) {
    historyElement.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-calendar-times text-2xl mb-2"></i>
                <p>Aucune activité pour cette période</p>
            </div>
        `;
    return;
  }

  historyElement.innerHTML = filteredHistory
    .map(
      (item) => `
        <div class="timeline-item">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-medium text-gray-800">${item.action}</p>
                    <p class="text-sm text-gray-600">${item.user}</p>
                    <p class="text-xs text-gray-500">${formatDateTime(
                      item.timestamp
                    )}</p>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 rounded text-xs ${
                      item.type === "approval"
                        ? "bg-green-100 text-green-800"
                        : item.type === "rejection"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }">
                        ${
                          item.type === "approval"
                            ? "Approuvé"
                            : item.type === "rejection"
                            ? "Rejeté"
                            : "Demande"
                        }
                    </span>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Obtenir l'historique filtré par date
function getFilteredHistory(filter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  let history = [];

  // Ajouter les demandes comme historique
  requests.forEach((request) => {
    const requestDate = new Date(request.createdAt || request.timestamp);

    let shouldInclude = false;
    switch (filter) {
      case "today":
        shouldInclude = requestDate >= today;
        break;
      case "yesterday":
        shouldInclude = requestDate >= yesterday && requestDate < today;
        break;
      case "week":
        shouldInclude = requestDate >= weekAgo;
        break;
      case "month":
        shouldInclude = requestDate >= monthAgo;
        break;
    }

    if (shouldInclude) {
      history.push({
        action: "Nouvelle demande d'accès",
        user: request.name,
        timestamp:
          request.createdAt || new Date(request.timestamp).toISOString(),
        type: "request",
      });

      if (request.processedAt) {
        const processedDate = new Date(request.processedAt);
        let processedShouldInclude = false;

        switch (filter) {
          case "today":
            processedShouldInclude = processedDate >= today;
            break;
          case "yesterday":
            processedShouldInclude =
              processedDate >= yesterday && processedDate < today;
            break;
          case "week":
            processedShouldInclude = processedDate >= weekAgo;
            break;
          case "month":
            processedShouldInclude = processedDate >= monthAgo;
            break;
        }

        if (processedShouldInclude) {
          history.push({
            action:
              request.status === "approved"
                ? "Demande approuvée"
                : "Demande rejetée",
            user: request.name,
            timestamp: request.processedAt,
            type: request.status === "approved" ? "approval" : "rejection",
          });
        }
      }
    }
  });

  return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Mettre à jour l'activité récente
function updateRecentActivity() {
  const activityElement = document.getElementById("recentActivity");

  const recentActivities = activities.slice(-5).reverse();

  if (recentActivities.length === 0) {
    activityElement.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-history text-2xl mb-2"></i>
                <p>Aucune activité récente</p>
            </div>
        `;
    return;
  }

  activityElement.innerHTML = recentActivities
    .map(
      (activity) => `
        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 rounded-full flex items-center justify-center ${
              activity.type === "approval" ? "bg-green-100" : "bg-red-100"
            }">
                <i class="fas ${
                  activity.type === "approval"
                    ? "fa-check text-green-600"
                    : "fa-times text-red-600"
                } text-sm"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-gray-800">${
                  activity.message
                }</p>
                <p class="text-xs text-gray-500">${formatDateTime(
                  activity.timestamp
                )}</p>
            </div>
        </div>
    `
    )
    .join("");
}

// Mettre à jour les statistiques avancées
function updateAdvancedStats() {
  const total = requests.length;
  const approved = requests.filter((req) => req.status === "approved").length;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  // Calculer le temps de traitement moyen
  const processedRequests = requests.filter(
    (req) => req.processedAt && req.createdAt
  );
  let avgProcessingTime = 0;

  if (processedRequests.length > 0) {
    const totalTime = processedRequests.reduce((sum, req) => {
      const created = new Date(req.createdAt);
      const processed = new Date(req.processedAt);
      return sum + (processed - created);
    }, 0);

    avgProcessingTime = Math.round(
      totalTime / processedRequests.length / (1000 * 60 * 60)
    ); // en heures
  }

  // Demandes aujourd'hui
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const todayRequests = requests.filter((req) => {
    const requestDate = new Date(req.createdAt || req.timestamp);
    return requestDate >= todayStart;
  }).length;

  document.getElementById("approvalRate").textContent = `${approvalRate}%`;
  document.getElementById(
    "avgProcessingTime"
  ).textContent = `${avgProcessingTime}h`;
  document.getElementById("todayRequests").textContent = todayRequests;
}

// Fonctions utilitaires pour les dates
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Ouvrir la modale de traitement
function openProcessModal(requestId) {
  const request = requests.find((req) => req.id === requestId);
  if (!request) return;

  currentRequestId = requestId;

  document.getElementById("modalUserName").textContent = request.name;
  document.getElementById("modalUserEmail").textContent = request.email;
  document.getElementById("modalRequestDate").textContent = formatDate(
    request.date
  );
  document.getElementById("userEmailInput").value = request.email;

  generatePassword();
  document.getElementById("processModal").classList.remove("hidden");
}

// Fermer la modale
function closeModal() {
  document.getElementById("processModal").classList.add("hidden");
  currentRequestId = null;
}

// Générer un mot de passe
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById("generatedPassword").value = password;
}

// Copier le mot de passe
function copyPassword() {
  const passwordField = document.getElementById("generatedPassword");
  passwordField.select();
  document.execCommand("copy");
  showNotification("Mot de passe copié dans le presse-papiers", "success");
}

// Approuver une demande
function approveRequest() {
  if (!currentRequestId) return;

  const request = requests.find((req) => req.id === currentRequestId);
  if (!request) return;

  const email = document.getElementById("userEmailInput").value;
  const password = document.getElementById("generatedPassword").value;

  if (!email || !password) {
    showNotification("Veuillez remplir tous les champs", "error");
    return;
  }

  request.status = "approved";
  request.processedAt = new Date().toISOString();
  request.processedBy = "admin";
  request.generatedPassword = password;

  // Ajouter à l'activité
  activities.push({
    id: Date.now(),
    type: "approval",
    message: `Demande de ${request.name} approuvée`,
    timestamp: new Date().toISOString(),
    user: request.name,
  });

  // Envoyer à l'API
  fetch("/api/create-user-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: request.name,
      email: email,
      password: password,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification(
          `Accès approuvé pour ${request.name}. Compte créé avec succès.`,
          "success"
        );
      } else {
        showNotification("Erreur lors de la création du compte", "error");
      }
    })
    .catch((error) => {
      console.error("Erreur:", error);
      showNotification(
        "Accès approuvé. Informations sauvegardées localement.",
        "success"
      );
    });

  saveRequests();
  saveActivities();
  displayRequests();
  updateStatistics();
  updateDailyHistory();
  updateRecentActivity();
  updateAdvancedStats();
  closeModal();
}

// Rejeter une demande
function rejectRequest() {
  if (!currentRequestId) return;

  const request = requests.find((req) => req.id === currentRequestId);
  if (!request) return;

  request.status = "rejected";
  request.processedAt = new Date().toISOString();
  request.processedBy = "admin";

  // Ajouter à l'activité
  activities.push({
    id: Date.now(),
    type: "rejection",
    message: `Demande de ${request.name} rejetée`,
    timestamp: new Date().toISOString(),
    user: request.name,
  });

  saveRequests();
  saveActivities();
  displayRequests();
  updateStatistics();
  updateDailyHistory();
  updateRecentActivity();
  updateAdvancedStats();
  closeModal();

  showNotification(`Demande de ${request.name} rejetée`, "warning");
}

// Afficher une notification
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");

  notificationText.textContent = message;

  notification.querySelector(
    "div"
  ).className = `px-6 py-3 rounded-lg shadow-lg ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : type === "warning"
      ? "bg-orange-500"
      : "bg-blue-500"
  } text-white`;

  notification.classList.remove("hidden");

  setTimeout(() => {
    notification.classList.add("hidden");
  }, 3000);
}

// Vérifier les nouvelles demandes
function checkForNewRequests() {
  fetch("/api/get-new-access-requests")
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.requests && data.requests.length > 0) {
        data.requests.forEach((newRequest) => {
          const exists = requests.find(
            (req) => req.email === newRequest.email && req.status === "pending"
          );
          if (!exists) {
            requests.push({
              id: Date.now() + Math.random(),
              name: newRequest.name,
              email: newRequest.email,
              date: newRequest.request_date || newRequest.date,
              status: "pending",
              timestamp: new Date().getTime(),
              createdAt: new Date().toISOString(),
            });
          }
        });

        saveRequests();
        displayRequests();
        updateStatistics();
        updateDailyHistory();
        updateAdvancedStats();
      }
    })
    .catch((error) => {
      console.log("Aucune nouvelle demande ou erreur de connexion");
    });
}

// Ajouter une nouvelle demande
function addNewAccessRequest(requestData) {
  const newRequest = {
    id: Date.now() + Math.random(),
    name: requestData.name,
    email: requestData.email,
    date: requestData.date,
    status: "pending",
    timestamp: new Date().getTime(),
    createdAt: new Date().toISOString(),
  };

  requests.push(newRequest);
  saveRequests();
  displayRequests();
  updateStatistics();
  updateDailyHistory();
  updateAdvancedStats();

  showNotification(`Nouvelle demande d'accès de ${requestData.name}`, "info");
}

// Déconnexion
function logout() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminUser");
    window.location.href = "/html/admin-login.html";
  }
}

// Exposer les fonctions globalement
window.openProcessModal = openProcessModal;
window.closeModal = closeModal;
window.generatePassword = generatePassword;
window.copyPassword = copyPassword;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.logout = logout;
window.addNewAccessRequest = addNewAccessRequest;
window.filterRequests = filterRequests;
window.clearFilter = clearFilter;
