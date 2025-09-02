// Variables globales
let currentRequests = [];
let currentRequestId = null;
let currentFilter = "all";

// Charger les demandes au démarrage
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Initialisation de la gestion d'accès...");
  loadAccessRequests();

  // Actualiser toutes les 30 secondes
  setInterval(loadAccessRequests, 30000);
});

// Fonction pour charger les demandes d'accès
async function loadAccessRequests() {
  try {
    console.log("📥 Chargement des demandes d'accès...");

    const response = await fetch("/api/get-new-access-requests");
    const data = await response.json();

    if (data.success) {
      currentRequests = data.requests || [];
      console.log(`✅ ${currentRequests.length} demandes chargées`);
      updateStatistics();
      displayRequests();
    } else {
      console.error("❌ Erreur lors du chargement:", data.message);
      showNotification("Erreur lors du chargement des demandes", "error");
    }
  } catch (error) {
    console.error("❌ Erreur réseau:", error);
    showNotification("Erreur de connexion au serveur", "error");
  }
}

// Fonction pour mettre à jour les statistiques
function updateStatistics() {
  const total = currentRequests.length;
  const pending = currentRequests.filter(
    (req) => req.status === "pending"
  ).length;
  const approved = currentRequests.filter(
    (req) => req.status === "approved"
  ).length;
  const rejected = currentRequests.filter(
    (req) => req.status === "rejected"
  ).length;

  document.getElementById("totalRequests").textContent = total;
  document.getElementById("pendingRequests").textContent = pending;
  document.getElementById("approvedRequests").textContent = approved;
  document.getElementById("rejectedRequests").textContent = rejected;

  // Calcul du taux d'approbation
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  document.getElementById("approvalRate").textContent = approvalRate + "%";

  console.log(
    `📊 Statistiques: Total=${total}, En attente=${pending}, Approuvées=${approved}, Rejetées=${rejected}`
  );
}

// Fonction pour afficher les demandes
function displayRequests() {
  const requestsList = document.getElementById("requestsList");
  const noRequestsDiv = document.getElementById("noRequests");
  const requestsCount = document.getElementById("requestsCount");

  // Filtrer les demandes selon le filtre actuel
  let filteredRequests = currentRequests;
  if (currentFilter !== "all") {
    filteredRequests = currentRequests.filter(
      (req) => req.status === currentFilter
    );
  }

  requestsCount.textContent = filteredRequests.length;

  if (filteredRequests.length === 0) {
    requestsList.style.display = "none";
    noRequestsDiv.style.display = "block";

    const message = document.getElementById("noRequestsMessage");
    if (currentFilter === "all") {
      message.textContent = "Aucune demande d'accès trouvée";
    } else {
      message.textContent = `Aucune demande ${getFilterLabel(
        currentFilter
      )} trouvée`;
    }
    return;
  }

  requestsList.style.display = "block";
  noRequestsDiv.style.display = "none";

  requestsList.innerHTML = "";

  filteredRequests.forEach((request) => {
    const requestCard = createRequestCard(request);
    requestsList.appendChild(requestCard);
  });
}

// Fonction pour créer une carte de demande
function createRequestCard(request) {
  const div = document.createElement("div");
  div.className =
    "access-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all";

  const statusClass = getStatusClass(request.status);
  const statusText = getStatusText(request.status);
  const formattedDate = formatDate(request.request_date);
  const createdAt = formatDateTime(request.created_at);

  div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                    <h3 class="text-lg font-semibold text-gray-800">${
                      request.name
                    }</h3>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${statusClass}">
                        ${statusText}
                    </span>
                </div>
                <p class="text-gray-600 mb-1">
                    <i class="fas fa-envelope mr-2"></i>${request.email}
                </p>
                <p class="text-gray-500 text-sm mb-1">
                    <i class="fas fa-calendar mr-2"></i>Demande pour le: ${formattedDate}
                </p>
                <p class="text-gray-500 text-sm">
                    <i class="fas fa-clock mr-2"></i>Créée le: ${createdAt}
                </p>
            </div>
            <div class="flex items-center space-x-2">
                ${
                  request.status === "pending"
                    ? `
                    <button 
                        onclick="openProcessModal(${request.id})"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
                        title="Traiter cette demande"
                    >
                        <i class="fas fa-cog"></i>
                        <span>Traiter</span>
                    </button>
                `
                    : ""
                }
                <button 
                    onclick="viewRequestDetails(${request.id})"
                    class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition"
                    title="Voir les détails"
                >
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `;

  return div;
}

// Fonction pour obtenir la classe CSS du statut
function getStatusClass(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Fonction pour obtenir le texte du statut
function getStatusText(status) {
  switch (status) {
    case "pending":
      return "En attente";
    case "approved":
      return "Approuvée";
    case "rejected":
      return "Rejetée";
    default:
      return status;
  }
}

// Fonction pour obtenir le label du filtre
function getFilterLabel(filter) {
  switch (filter) {
    case "pending":
      return "en attente";
    case "approved":
      return "approuvées";
    case "rejected":
      return "rejetées";
    default:
      return "";
  }
}

// Fonction pour formater une date
function formatDate(dateString) {
  if (!dateString) return "Non spécifiée";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR");
}

// Fonction pour formater une date avec l'heure
function formatDateTime(dateString) {
  if (!dateString) return "Non spécifiée";
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR");
}

// Fonction pour filtrer les demandes
function filterRequests(filter) {
  currentFilter = filter;

  // Mettre à jour l'apparence des boutons de filtre
  document.querySelectorAll(".stat-card").forEach((card) => {
    card.classList.remove("active");
  });

  const activeCard = document.querySelector(`[data-filter="${filter}"]`);
  if (activeCard) {
    activeCard.classList.add("active");
  }

  // Mettre à jour le titre
  const requestsTitle = document.getElementById("requestsTitle");
  if (filter === "all") {
    requestsTitle.textContent = "Toutes les Demandes d'Accès";
    document.getElementById("clearFilterBtn").classList.add("hidden");
  } else {
    requestsTitle.textContent = `Demandes ${getFilterLabel(filter)}`;
    document.getElementById("clearFilterBtn").classList.remove("hidden");
  }

  displayRequests();
}

// Fonction pour effacer le filtre
function clearFilter() {
  filterRequests("all");
}

// Fonction pour ouvrir le modal de traitement
function openProcessModal(requestId) {
  currentRequestId = requestId;
  const request = currentRequests.find((req) => req.id === requestId);

  if (!request) {
    showNotification("Demande non trouvée", "error");
    return;
  }

  // Remplir les champs du modal
  document.getElementById("modalUserName").textContent = request.name;
  document.getElementById("modalUserEmail").textContent = request.email;
  document.getElementById("modalRequestDate").textContent = formatDate(
    request.request_date
  );
  document.getElementById("userEmailInput").value = request.email;

  // Générer un mot de passe
  generatePassword();

  // Afficher le modal
  document.getElementById("processModal").classList.remove("hidden");
}

// Fonction pour fermer le modal
function closeModal() {
  document.getElementById("processModal").classList.add("hidden");
  currentRequestId = null;
}

// Fonction pour générer un mot de passe
function generatePassword() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < 6; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  document.getElementById("generatedPassword").value = password;
}

// Fonction pour copier le mot de passe
function copyPassword() {
  const passwordField = document.getElementById("generatedPassword");
  passwordField.select();
  document.execCommand("copy");
  showNotification("Mot de passe copié dans le presse-papiers", "success");
}

// Fonction pour approuver une demande
async function approveRequest() {
  if (!currentRequestId) return;

  const request = currentRequests.find((req) => req.id === currentRequestId);
  const password = document.getElementById("generatedPassword").value;

  if (!password) {
    showNotification("Veuillez générer un mot de passe", "error");
    return;
  }

  try {
    console.log(`✅ Approbation de la demande ${currentRequestId}...`);

    const response = await fetch("/api/create-user-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: request.name,
        email: request.email,
        password: password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showNotification(
        "Demande approuvée avec succès ! Email envoyé.",
        "success"
      );
      closeModal();
      loadAccessRequests(); // Recharger la liste
    } else {
      showNotification(`Erreur: ${data.message}`, "error");
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'approbation:", error);
    showNotification("Erreur lors de l'approbation", "error");
  }
}

// Fonction pour rejeter une demande
async function rejectRequest() {
  if (!currentRequestId) return;

  const reason = prompt("Raison du rejet (optionnel):");
  if (reason === null) return; // Utilisateur a annulé

  if (!confirm("Êtes-vous sûr de vouloir rejeter cette demande ?")) {
    return;
  }

  try {
    console.log(`❌ Rejet de la demande ${currentRequestId}...`);

    const response = await fetch("/api/admin/process-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: currentRequestId,
        action: "reject",
        adminEmail: "admin@its-service.com",
        reason: reason,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showNotification("Demande rejetée avec succès", "success");
      closeModal();
      loadAccessRequests();
    } else {
      showNotification(`Erreur: ${data.message}`, "error");
    }
  } catch (error) {
    console.error("❌ Erreur lors du rejet:", error);
    showNotification("Erreur lors du rejet", "error");
  }
}

// Fonction pour voir les détails d'une demande
function viewRequestDetails(requestId) {
  const request = currentRequests.find((req) => req.id === requestId);
  if (!request) return;

  alert(
    `Détails de la demande:\n\nNom: ${request.name}\nEmail: ${
      request.email
    }\nDate: ${formatDate(request.request_date)}\nStatut: ${getStatusText(
      request.status
    )}\nCréée le: ${formatDateTime(request.created_at)}`
  );
}

// Fonction pour afficher une notification
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");

  notificationText.textContent = message;

  // Changer la couleur selon le type
  notification.className = "fixed top-4 right-4 z-50";
  switch (type) {
    case "success":
      notification.firstElementChild.className =
        "bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg";
      break;
    case "error":
      notification.firstElementChild.className =
        "bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg";
      break;
    case "info":
      notification.firstElementChild.className =
        "bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg";
      break;
  }

  notification.classList.remove("hidden");

  setTimeout(() => {
    notification.classList.add("hidden");
  }, 3000);
}

// Fonction de déconnexion
function logout() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    window.location.href = "/html/admin-login.html";
  }
}

// Écouter les clics en dehors du modal pour le fermer
document.addEventListener("click", function (event) {
  const modal = document.getElementById("processModal");
  if (event.target === modal) {
    closeModal();
  }
});

// Écouter la touche Échap pour fermer le modal
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
});
