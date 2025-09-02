// Gestion de l'interface d'administration des accès
let currentRequestId = null;
let requests = [];

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
  loadRequests();
  updateStatistics();

  // Vérification des nouvelles demandes toutes les 30 secondes
  setInterval(checkForNewRequests, 30000);
});

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
}

// Sauvegarder les demandes
function saveRequests() {
  localStorage.setItem("accessRequests", JSON.stringify(requests));
}

// Afficher les demandes
function displayRequests() {
  const requestsList = document.getElementById("requestsList");
  const noRequests = document.getElementById("noRequests");

  const pendingRequests = requests.filter((req) => req.status === "pending");

  if (pendingRequests.length === 0) {
    requestsList.style.display = "none";
    noRequests.style.display = "block";
    return;
  }

  requestsList.style.display = "block";
  noRequests.style.display = "none";

  requestsList.innerHTML = pendingRequests
    .map(
      (request) => `
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
                        <p class="text-sm text-gray-600">${request.email}</p>
                        <p class="text-xs text-gray-500">Demandé le ${formatDate(
                          request.date
                        )}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="px-3 py-1 rounded-full text-xs font-medium status-pending text-white">
                        <i class="fas fa-clock mr-1"></i>En attente
                    </span>
                    <button onclick="openProcessModal(${request.id})" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium">
                        <i class="fas fa-cog mr-2"></i>Traiter
                    </button>
                </div>
            </div>
            <div class="mt-4 text-sm text-gray-600">
                <i class="fas fa-info-circle mr-2"></i>
                Un utilisateur "${request.name}" a fait une demande d'accès
            </div>
        </div>
    `
    )
    .join("");
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

// Formater la date
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
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

  // Générer un mot de passe automatiquement
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

  // Marquer comme approuvé
  request.status = "approved";
  request.approvedDate = new Date().toISOString();
  request.generatedPassword = password;

  // Envoyer à l'API pour créer le compte utilisateur
  fetch("/api/create-user-account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
  displayRequests();
  updateStatistics();
  closeModal();
}

// Rejeter une demande
function rejectRequest() {
  if (!currentRequestId) return;

  const request = requests.find((req) => req.id === currentRequestId);
  if (!request) return;

  request.status = "rejected";
  request.rejectedDate = new Date().toISOString();

  saveRequests();
  displayRequests();
  updateStatistics();
  closeModal();

  showNotification(`Demande de ${request.name} rejetée`, "warning");
}

// Afficher une notification
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");

  notificationText.textContent = message;

  // Changer la couleur selon le type
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
  // Cette fonction sera appelée par l'API pour récupérer les nouvelles demandes
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
              date: newRequest.date,
              status: "pending",
              timestamp: new Date().getTime(),
            });
          }
        });

        saveRequests();
        displayRequests();
        updateStatistics();
      }
    })
    .catch((error) => {
      console.log("Aucune nouvelle demande ou erreur de connexion");
    });
}

// Ajouter une nouvelle demande (appelée depuis l'API)
function addNewAccessRequest(requestData) {
  const newRequest = {
    id: Date.now() + Math.random(),
    name: requestData.name,
    email: requestData.email,
    date: requestData.date,
    status: "pending",
    timestamp: new Date().getTime(),
  };

  requests.push(newRequest);
  saveRequests();
  displayRequests();
  updateStatistics();

  showNotification(`Nouvelle demande d'accès de ${requestData.name}`, "info");
}

// Déconnexion
function logout() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    localStorage.removeItem("isAdminLoggedIn");
    window.location.href = "/html/index.html";
  }
}

// Exposer les fonctions globalement si nécessaire
window.openProcessModal = openProcessModal;
window.closeModal = closeModal;
window.generatePassword = generatePassword;
window.copyPassword = copyPassword;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.logout = logout;
window.addNewAccessRequest = addNewAccessRequest;
