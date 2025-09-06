// Variables globales
let currentRequests = [];
let currentRequestId = null;
let currentFilter = "all";
let currentSection = "global"; // Section actuellement active
let autoRefreshInterval;
let isAutoRefreshEnabled = true;
let lastDataHash = null; // Pour éviter les rechargements inutiles

// Données spécifiques par acteur
let actorData = {
  "responsable-acconier": [],
  "responsable-livraison": [],
  "agent-transit": [],
};

// =================== SYSTÈME DE THÈME ===================
let currentTheme = localStorage.getItem("theme") || "light";
let customThemeData;

// Récupération sécurisée du thème personnalisé
try {
  const savedCustomTheme = localStorage.getItem("customTheme");
  if (savedCustomTheme) {
    customThemeData = JSON.parse(savedCustomTheme);
    console.log("🎨 Thème personnalisé récupéré:", customThemeData);
  } else {
    customThemeData = {
      primary: "#3b82f6",
      secondary: "#1f2937",
      accent: "#f59e0b",
      background: "#ffffff",
      surface: "#f9fafb",
      // Couleurs des cartes de statistiques
      cardTotal: "#f97316", // Orange pour "Total Demandes"
      cardPending: "#f59e0b", // Orange pour "En Attente"
      cardApproved: "#10b981", // Vert pour "Approuvées"
      cardRejected: "#ef4444", // Rouge pour "Rejetées"
    };
  }
} catch (error) {
  console.error("❌ Erreur lors de la récupération du thème:", error);
  customThemeData = {
    primary: "#3b82f6",
    secondary: "#1f2937",
    accent: "#f59e0b",
    background: "#ffffff",
    surface: "#f9fafb",
    // Couleurs des cartes de statistiques
    cardTotal: "#f97316", // Orange pour "Total Demandes"
    cardPending: "#f59e0b", // Orange pour "En Attente"
    cardApproved: "#10b981", // Vert pour "Approuvées"
    cardRejected: "#ef4444", // Rouge pour "Rejetées"
  };
}

console.log("🎨 Thème au démarrage:", currentTheme, customThemeData);

// =================== GESTION DES SECTIONS PAR ACTEUR ===================

/**
 * Fonction pour changer de section d'acteur
 */
function switchSection(sectionName) {
  console.log(`🔄 Changement vers la section: ${sectionName}`);

  // Mettre à jour la section courante
  currentSection = sectionName;

  // Gérer l'affichage des onglets
  const tabs = document.querySelectorAll(".section-tab");
  tabs.forEach((tab) => {
    const tabSection = tab.dataset.section;
    if (tabSection === sectionName) {
      tab.classList.add("active");
      tab.classList.remove("border-transparent", "text-gray-500");
      tab.classList.add("border-blue-500", "text-blue-600", "bg-blue-50");
    } else {
      tab.classList.remove("active");
      tab.classList.remove("border-blue-500", "text-blue-600", "bg-blue-50");
      tab.classList.add("border-transparent", "text-gray-500");
    }
  });

  // Gérer l'affichage des contenus de section
  const sections = document.querySelectorAll(".section-content");
  sections.forEach((section) => {
    const sectionId = section.id.replace("section-", "");
    if (sectionId === sectionName) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });

  // Charger les données spécifiques à la section
  loadSectionData(sectionName);
}

/**
 * Charger les données spécifiques à une section
 */
function loadSectionData(sectionName) {
  if (sectionName === "global") {
    // Recharger toutes les données pour la vue globale
    loadAccessRequests();
  } else {
    // Filtrer et afficher les données pour l'acteur spécifique
    filterRequestsByActor(sectionName);
    updateActorStatistics(sectionName);
  }
}

/**
 * Filtrer les demandes par type d'acteur
 */
function filterRequestsByActor(actorType) {
  console.log(`🔍 Filtrage des demandes pour: ${actorType}`);
  console.log("📋 Toutes les demandes:", currentRequests);

  const filteredRequests = currentRequests.filter((request) => {
    // Vérifier avec les nouveaux champs (actor_type, role) ET les anciens champs (request_type)
    if (actorType === "responsable-acconier") {
      return (
        request.actor_type === "responsable-acconier" ||
        request.role === "Responsable Acconier" ||
        request.request_type === "responsable-acconier" ||
        request.actorType === "responsable-acconier"
      );
    } else if (actorType === "responsable-livraison") {
      return (
        request.actor_type === "responsable-livraison" ||
        request.role === "Responsable de Livraison" ||
        request.role === "responsable_livraison" ||
        request.request_type === "responsable-livraison" ||
        request.request_type === "responsable_livraison" ||
        request.actorType === "responsable-livraison" ||
        (request.role && request.role.toLowerCase().includes("livraison")) ||
        (request.request_type &&
          request.request_type.toLowerCase().includes("livraison"))
      );
    } else if (actorType === "agent-transit") {
      return (
        request.actor_type === "agent-transit" ||
        request.role === "Agent Transit" ||
        request.request_type === "agent-transit" ||
        request.actorType === "agent-transit"
      );
    }
    return false;
  });

  console.log(`✅ Demandes filtrées pour ${actorType}:`, filteredRequests);

  // Mettre à jour l'affichage pour cet acteur
  displayActorRequests(actorType, filteredRequests);
}

/**
 * Afficher les demandes pour un acteur spécifique
 */
function displayActorRequests(actorType, requests) {
  const listContainerId = getActorListContainerId(actorType);
  const noRequestsId = getActorNoRequestsId(actorType);

  const listContainer = document.getElementById(listContainerId);
  const noRequestsDiv = document.getElementById(noRequestsId);

  if (!listContainer || !noRequestsDiv) {
    console.error(`Conteneurs non trouvés pour ${actorType}`);
    return;
  }

  if (requests.length === 0) {
    listContainer.innerHTML = "";
    noRequestsDiv.classList.remove("hidden");
  } else {
    noRequestsDiv.classList.add("hidden");
    listContainer.innerHTML = requests
      .map((request) => createActorRequestCard(request, actorType))
      .join("");
  }

  // Mettre à jour les statistiques/compteurs pour cet acteur
  updateActorStatistics(actorType);
}

/**
 * Créer une carte de demande pour un acteur spécifique
 */
function createActorRequestCard(request, actorType) {
  const statusColors = {
    pending: "bg-orange-100 text-orange-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const actorColors = {
    "responsable-acconier": "border-l-blue-500",
    "responsable-livraison": "border-l-green-500",
    "agent-transit": "border-l-purple-500",
  };

  return `
    <div class="actor-card ${actorType} bg-white rounded-lg shadow-md p-4 border-l-4 ${
    actorColors[actorType]
  }">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-2">
            <h4 class="font-semibold text-gray-800">${request.name}</h4>
            <span class="actor-badge ${actorType}">${getActorLabel(
    actorType
  )}</span>
          </div>
          <p class="text-sm text-gray-600 mb-1">Email: ${request.email}</p>
          <p class="text-xs text-gray-500">Demande le: ${formatDate(
            request.requestDate ||
              request.request_date ||
              request.created_at ||
              request.createdAt
          )}</p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[request.status]
          }">
            ${getStatusLabel(request.status)}
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Mettre à jour les statistiques pour un acteur
 */
function updateActorStatistics(actorType) {
  // Utiliser le même filtrage que filterRequestsByActor
  const actorRequests = currentRequests.filter((request) => {
    if (actorType === "responsable-acconier") {
      return (
        request.actor_type === "responsable-acconier" ||
        request.role === "Responsable Acconier" ||
        request.request_type === "responsable-acconier" ||
        request.actorType === "responsable-acconier"
      );
    } else if (actorType === "responsable-livraison") {
      return (
        request.actor_type === "responsable-livraison" ||
        request.role === "Responsable de Livraison" ||
        request.role === "responsable_livraison" ||
        request.request_type === "responsable-livraison" ||
        request.request_type === "responsable_livraison" ||
        request.actorType === "responsable-livraison" ||
        (request.role && request.role.toLowerCase().includes("livraison")) ||
        (request.request_type &&
          request.request_type.toLowerCase().includes("livraison"))
      );
    } else if (actorType === "agent-transit") {
      return (
        request.actor_type === "agent-transit" ||
        request.role === "Agent Transit" ||
        request.request_type === "agent-transit" ||
        request.actorType === "agent-transit"
      );
    }
    return false;
  });

  console.log(`📊 Statistiques pour ${actorType}:`, {
    total: actorRequests.length,
    pending: actorRequests.filter(
      (r) => r.status === "pending" || r.status === "forgot_code"
    ).length,
    approved: actorRequests.filter((r) => r.status === "approved").length,
  });

  const pending = actorRequests.filter(
    (r) => r.status === "pending" || r.status === "forgot_code"
  ).length;
  const approved = actorRequests.filter((r) => r.status === "approved").length;
  const total = actorRequests.length;

  // Mettre à jour les éléments du DOM
  const prefix = getActorPrefix(actorType);
  const totalElement = document.getElementById(`${prefix}Total`);
  const pendingElement = document.getElementById(`${prefix}Pending`);
  const approvedElement = document.getElementById(`${prefix}Approved`);

  if (totalElement) totalElement.textContent = total;
  if (pendingElement) pendingElement.textContent = pending;
  if (approvedElement) approvedElement.textContent = approved;
}

/**
 * Fonctions utilitaires pour les acteurs
 */
function getActorListContainerId(actorType) {
  const prefixes = {
    "responsable-acconier": "acconiersRequestsList",
    "responsable-livraison": "livraisonRequestsList",
    "agent-transit": "agentsRequestsList",
  };
  return prefixes[actorType];
}

function getActorNoRequestsId(actorType) {
  const prefixes = {
    "responsable-acconier": "noAcconiersRequests",
    "responsable-livraison": "noLivraisonRequests",
    "agent-transit": "noAgentsRequests",
  };
  return prefixes[actorType];
}

function getActorPrefix(actorType) {
  const prefixes = {
    "responsable-acconier": "acconiers",
    "responsable-livraison": "livraison",
    "agent-transit": "agents",
  };
  return prefixes[actorType];
}

function getActorLabel(actorType) {
  const labels = {
    "responsable-acconier": "Resp. Acconier",
    "responsable-livraison": "Resp. Livraison",
    "agent-transit": "Agent Transit",
  };
  return labels[actorType];
}

function getStatusLabel(status) {
  const labels = {
    pending: "En attente",
    approved: "Approuvée",
    rejected: "Rejetée",
  };
  return labels[status] || status;
}

/**
 * Mettre à jour toutes les sections d'acteurs
 */
function updateAllActorSections() {
  const actorTypes = [
    "responsable-acconier",
    "responsable-livraison",
    "agent-transit",
  ];

  actorTypes.forEach((actorType) => {
    updateActorStatistics(actorType);
    filterRequestsByActor(actorType);
  });
}

// Fonction de test de persistance
function testThemePersistence() {
  console.log("🧪 Test de persistance du thème:");
  console.log("   - currentTheme variable:", currentTheme);
  console.log("   - theme dans localStorage:", localStorage.getItem("theme"));
  console.log(
    "   - customTheme dans localStorage:",
    localStorage.getItem("customTheme")
  );
  console.log("   - customThemeData variable:", customThemeData);

  try {
    const parsedCustomTheme = JSON.parse(
      localStorage.getItem("customTheme") || "{}"
    );
    console.log("   - customTheme parsé:", parsedCustomTheme);
  } catch (e) {
    console.error("   - Erreur lors du parsing:", e);
  }
}

// Fonction pour forcer la sauvegarde du thème
function forceSaveTheme() {
  console.log("💾 Sauvegarde forcée du thème...");
  localStorage.setItem("theme", currentTheme);
  localStorage.setItem("customTheme", JSON.stringify(customThemeData));
  console.log("✅ Thème sauvegardé:", {
    theme: currentTheme,
    customTheme: customThemeData,
  });
}

// Rendre la fonction accessible globalement pour debugging
window.testThemePersistence = testThemePersistence;
window.forceSaveTheme = forceSaveTheme;

// =================== GESTION PHOTO DE PROFIL ===================
let userProfileImage =
  localStorage.getItem("userProfileImage") ||
  "https://cdn-icons-png.flaticon.com/512/1048/1048953.png";

// Charger les demandes au démarrage
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Initialisation de la gestion d'accès avancée...");

  // Vérifier si l'utilisateur est connecté
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn");
  if (isLoggedIn !== "true") {
    console.log("⚠️ Utilisateur non connecté, redirection vers login...");
    window.location.href = "/html/admin-login.html";
    return;
  }

  initializeAccessManagement();
});

// Fonction d'initialisation
async function initializeAccessManagement() {
  try {
    // 🧪 FONCTION DE TEST - Simuler des données de connexion
    // Décommentez cette ligne pour tester avec des données fictives
    // simulateLoginData();

    // Initialiser le système de thème
    initializeThemeSystem();

    // Charger les données du profil utilisateur
    loadUserProfileData();

    // Charger les demandes
    await loadAccessRequests();

    // Initialiser la section par défaut (vue globale)
    switchSection("global");

    // Démarrer l'actualisation automatique
    startAutoRefresh();

    // Initialiser les événements
    initializeEventListeners();

    // Débogage des boutons de thème après initialisation complète
    setTimeout(() => {
      debugThemeButtons();
    }, 500);

    // S'assurer que les couleurs par défaut des cartes sont appliquées après tout
    setTimeout(() => {
      console.log("🔄 Application finale des couleurs des cartes");

      // Vérifier s'il y a des couleurs personnalisées sauvegardées
      const savedCustomTheme = localStorage.getItem("customTheme");
      let hasCustomCardColors = false;

      if (savedCustomTheme) {
        try {
          const savedColors = JSON.parse(savedCustomTheme);
          hasCustomCardColors =
            savedColors.cardTotal ||
            savedColors.cardPending ||
            savedColors.cardApproved ||
            savedColors.cardRejected;
        } catch (error) {
          console.error(
            "❌ Erreur lors de la vérification initiale des couleurs:",
            error
          );
        }
      }

      // Appliquer les couleurs appropriées
      if (hasCustomCardColors) {
        console.log("🎨 Couleurs personnalisées détectées au démarrage");
        applyThemeToStatCards(); // Cela utilisera les couleurs personnalisées
        startColorPersistenceMonitor();
      } else {
        console.log("🎨 Application des couleurs par défaut");
        applyDefaultStatCardsColors();
      }

      // Forcer les icônes de suppression en rouge dès le démarrage
      forceDeleteIconsToRed();

      // Forcer les icônes spécifiques en blanc dès le démarrage
      forceSpecificIconsToWhite();
    }, 1000);

    // Application supplémentaire après 3 secondes pour être sûr
    setTimeout(() => {
      console.log(
        "🔄 Application de sécurité des couleurs par défaut des cartes"
      );
      if (currentTheme === "custom") {
        applyThemeToStatCards();
      } else {
        applyDefaultStatCardsColors();
      }

      // Re-forcer les icônes de suppression en rouge après l'application des thèmes
      forceDeleteIconsToRed();

      // Re-forcer les icônes spécifiques en blanc après l'application des thèmes
      forceSpecificIconsToWhite();
    }, 3000);

    // OBSERVATEUR DOM TEMPORAIREMENT DÉSACTIVÉ pour éviter la boucle infinie
    // const observer = new MutationObserver((mutations) => {
    //   mutations.forEach((mutation) => {
    //     if (mutation.type === "childList" || mutation.type === "attributes") {
    //       const statCards = document.querySelectorAll(".stat-card");
    //       if (statCards.length > 0) {
    //         console.log(
    //           "🔄 DOM modifié, réapplication des couleurs par défaut"
    //         );
    //         setTimeout(() => {
    //           applyDefaultStatCardsColors();
    //         }, 100);
    //       }
    //     }
    //   });
    // });

    // // Observer les changements dans le conteneur des cartes
    // const cardContainer = document.querySelector("main") || document.body;
    // if (cardContainer) {
    //   observer.observe(cardContainer, {
    //     childList: true,
    //     subtree: true,
    //     attributes: true,
    //     attributeFilter: ["class", "style"],
    //   });
    // }

    console.log("✅ Gestion d'accès initialisée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    showNotification("Erreur lors de l'initialisation", "error");
  }
}

// 🧪 Fonction de test pour simuler des données de connexion
function simulateLoginData() {
  const testUserData = {
    name: "Marie Martin",
    email: "marie.martin@itsservice.com",
    loginTime: new Date().toISOString(),
  };

  // Données de test pour différents acteurs
  const testRequests = [
    {
      id: "req_001",
      name: "Jean Kouadio",
      email: "j.kouadio@itsservice.ci",
      requestDate: new Date(Date.now() - 86400000).toISOString(), // Hier
      status: "pending",
      actorType: "responsable-acconier",
      role: "Responsable Acconier",
    },
    {
      id: "req_002",
      name: "Marie Yao",
      email: "m.yao@itsservice.ci",
      requestDate: new Date(Date.now() - 172800000).toISOString(), // Il y a 2 jours
      status: "approved",
      actorType: "responsable-acconier",
      role: "Responsable Acconier",
    },
    {
      id: "req_003",
      name: "Paul N'Guessan",
      email: "p.nguessan@itsservice.ci",
      requestDate: new Date(Date.now() - 259200000).toISOString(), // Il y a 3 jours
      status: "pending",
      actorType: "responsable-livraison",
      role: "Responsable de Livraison",
    },
    {
      id: "req_004",
      name: "Aisha Traoré",
      email: "a.traore@itsservice.ci",
      requestDate: new Date(Date.now() - 345600000).toISOString(), // Il y a 4 jours
      status: "approved",
      actorType: "responsable-livraison",
      role: "Responsable de Livraison",
    },
    {
      id: "req_005",
      name: "Koffi Diabaté",
      email: "k.diabate@itsservice.ci",
      requestDate: new Date(Date.now() - 432000000).toISOString(), // Il y a 5 jours
      status: "pending",
      actorType: "agent-transit",
      role: "Agent Transit",
    },
    {
      id: "req_006",
      name: "Fatou Sanogo",
      email: "f.sanogo@itsservice.ci",
      requestDate: new Date(Date.now() - 518400000).toISOString(), // Il y a 6 jours
      status: "rejected",
      actorType: "agent-transit",
      role: "Agent Transit",
    },
    {
      id: "req_007",
      name: "Mamadou Diouf",
      email: "m.diouf@itsservice.ci",
      requestDate: new Date().toISOString(),
      status: "pending",
      actorType: "responsable-acconier",
      role: "Responsable Acconier",
    },
    {
      id: "req_008",
      name: "Awa Koné",
      email: "a.kone@itsservice.ci",
      requestDate: new Date().toISOString(),
      status: "pending",
      actorType: "agent-transit",
      role: "Agent Transit",
    },
  ];

  localStorage.setItem("adminUser", JSON.stringify(testUserData));
  localStorage.setItem("isAdminLoggedIn", "true");
  localStorage.setItem("testRequests", JSON.stringify(testRequests));

  // Simuler la réponse des demandes pour les tests
  currentRequests = testRequests;

  console.log("🧪 Données de test simulées:", {
    user: testUserData,
    requests: testRequests.length + " demandes",
  });
}

// Fonction pour initialiser les événements
function initializeEventListeners() {
  // Filtre par date
  const dateFilter = document.getElementById("dateFilter");
  if (dateFilter) {
    dateFilter.addEventListener("change", function () {
      updateDailyHistory(this.value);
    });
  }

  // Bouton de basculement de thème
  const themeButton = document.querySelector('[onclick="toggleTheme()"]');
  if (themeButton) {
    // Supprimer l'attribut onclick et ajouter un event listener
    themeButton.removeAttribute("onclick");
    themeButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation(); // Empêcher la propagation
      console.log("🎨 Bouton de thème cliqué via addEventListener");
      toggleTheme();
    });
    console.log("✅ Event listener ajouté au bouton de thème");
  } else {
    console.warn("⚠️ Bouton de thème non trouvé lors de l'initialisation");
  }

  // Bouton de personnalisation de thème
  const customizeButton = document.querySelector(
    '[onclick="openThemeCustomizer()"]'
  );
  if (customizeButton) {
    customizeButton.removeAttribute("onclick");
    customizeButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation(); // Empêcher la propagation
      console.log("🎨 Bouton de personnalisation cliqué");
      openThemeCustomizer();
    });
  }

  // Raccourcis clavier
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
      closeThemeCustomizer();
      closeProfilePhotoModal();
    }
    if (event.ctrlKey && event.key === "r") {
      event.preventDefault();
      loadAccessRequests();
    }
    // Raccourci pour basculer le thème (Ctrl + Shift + T)
    if (event.ctrlKey && event.shiftKey && event.key === "T") {
      event.preventDefault();
      toggleTheme();
    }
  });

  // Fermeture des modaux en cliquant à l'extérieur
  document.addEventListener("click", function (event) {
    // Modal de personnalisation du thème
    const themeModal = document.getElementById("themeCustomizerModal");
    if (themeModal && !themeModal.classList.contains("hidden")) {
      const modalContent = themeModal.querySelector(".bg-white");
      // Fermer seulement si on clique sur l'overlay (pas sur le contenu)
      if (event.target === themeModal) {
        closeThemeCustomizer();
      }
    }

    // Modal de changement de photo
    const photoModal = document.getElementById("profilePhotoModal");
    if (photoModal && !photoModal.classList.contains("hidden")) {
      const modalContent = photoModal.querySelector(".bg-white");
      // Fermer seulement si on clique sur l'overlay
      if (event.target === photoModal) {
        closeProfilePhotoModal();
      }
    }

    // Fermeture du profil utilisateur
    const userAvatar = document.getElementById("adminAvatar");
    const userProfile = document.getElementById("userProfilePopup");
    if (userAvatar && userProfile && !userAvatar.contains(event.target)) {
      userProfile.classList.add("hidden");
    }
  });
}

// Fonction pour démarrer l'actualisation automatique
function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  if (isAutoRefreshEnabled) {
    // Actualisation toutes les 2 minutes au lieu de 30 secondes
    autoRefreshInterval = setInterval(loadAccessRequests, 120000);
    console.log("🔄 Actualisation automatique activée (2 min)");
  }
}

// Fonction pour charger les demandes d'accès
async function loadAccessRequests() {
  try {
    console.log("📥 Chargement des demandes d'accès...");

    // Afficher un indicateur de chargement
    showLoadingIndicator(true);
    const response = await fetch("/api/admin/access-requests", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📋 Données reçues du serveur:", data);
    console.log("🔍 Première demande pour analyse:", data[0]);

    if (data.success) {
      const newRequests = data.requests || [];

      // Créer un hash simple des données pour détecter les changements
      const newDataHash = JSON.stringify(
        newRequests.map((req) => ({
          id: req.id,
          status: req.status,
          processed_at: req.processed_at,
        }))
      );

      // Ne mettre à jour que si les données ont changé
      if (newDataHash !== lastDataHash) {
        currentRequests = newRequests;
        lastDataHash = newDataHash;

        console.log(
          `✅ ${currentRequests.length} demandes chargées (données mises à jour)`
        );

        // Mettre à jour l'interface
        updateStatistics();
        displayRequests();
        updateDailyHistory();
        updateRecentActivity();

        // Mettre à jour les sections d'acteurs
        updateAllActorSections();

        // Mettre à jour le timestamp de dernière actualisation
        updateLastRefreshTime();
      } else {
        console.log(
          `📋 ${newRequests.length} demandes - aucun changement détecté`
        );
      }
    } else {
      throw new Error(data.message || "Erreur inconnue");
    }
  } catch (error) {
    console.error("❌ Erreur lors du chargement:", error);
    showNotification(`Erreur: ${error.message}`, "error");
  } finally {
    showLoadingIndicator(false);
  }
}

// Fonction pour afficher/masquer l'indicateur de chargement
function showLoadingIndicator(show) {
  // Créer l'indicateur s'il n'existe pas
  let indicator = document.getElementById("loadingIndicator");
  if (!indicator && show) {
    indicator = document.createElement("div");
    indicator.id = "loadingIndicator";
    indicator.className =
      "fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-40";
    indicator.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Chargement...';
    document.body.appendChild(indicator);
  }

  if (indicator) {
    indicator.style.display = show ? "block" : "none";
  }
}

// Fonction pour mettre à jour le temps de dernière actualisation
function updateLastRefreshTime() {
  let lastRefreshElement = document.getElementById("lastRefreshTime");
  if (!lastRefreshElement) {
    // Créer l'élément s'il n'existe pas
    lastRefreshElement = document.createElement("div");
    lastRefreshElement.id = "lastRefreshTime";
    lastRefreshElement.className = "text-sm text-center mt-4 theme-transition";
    lastRefreshElement.style.color = "var(--text-secondary)";

    const requestsList = document.getElementById("requestsList");
    if (requestsList && requestsList.parentNode) {
      requestsList.parentNode.appendChild(lastRefreshElement);
    }
  }

  const now = new Date();
  lastRefreshElement.textContent = `Dernière actualisation: ${now.toLocaleTimeString(
    "fr-FR"
  )}`;
}

// =================== SYSTÈME DE THÈME ===================

// Initialiser le système de thème
function initializeThemeSystem() {
  console.log("🎨 Initialisation du système de thème...");
  console.log(
    "📱 Thème actuel depuis localStorage:",
    localStorage.getItem("theme")
  );
  console.log(
    "📱 Données personnalisées depuis localStorage:",
    localStorage.getItem("customTheme")
  );

  // Récupérer les données persistantes
  const savedTheme = localStorage.getItem("theme") || "light";
  currentTheme = savedTheme;

  // Récupérer les données du thème personnalisé
  try {
    const savedCustomTheme = localStorage.getItem("customTheme");
    if (savedCustomTheme) {
      customThemeData = JSON.parse(savedCustomTheme);
      console.log("✅ Thème personnalisé récupéré:", customThemeData);
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération du thème personnalisé:",
      error
    );
  }

  // Appliquer le thème sauvegardé
  applyTheme(currentTheme);

  // Si c'est un thème personnalisé, appliquer les couleurs personnalisées
  if (currentTheme === "custom" && customThemeData) {
    console.log("🎨 Application du thème personnalisé...");
    applyCustomTheme(customThemeData);
  }

  // Mettre à jour l'interface avec un délai pour s'assurer que le DOM est chargé
  setTimeout(() => {
    updateThemeIcon();
    applyThemeToHeaders();

    // TOUJOURS appliquer les couleurs par défaut des cartes au début
    // (elles ne seront écrasées que si on est en mode custom)
    applyDefaultStatCardsColors();

    // Si on est en mode custom, alors écraser avec les couleurs personnalisées
    if (currentTheme === "custom") {
      applyThemeToStatCards();
    }

    // Pré-remplir les champs du modal avec les couleurs actuelles
    if (currentTheme === "custom") {
      populateThemeInputs();
    }

    console.log("✅ Système de thème initialisé avec:", {
      theme: currentTheme,
      customData: customThemeData,
    });

    // Test de persistance
    testThemePersistence();

    // Ajouter un écouteur de raccourci clavier pour changer de thème (Ctrl+Shift+T)
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.shiftKey && e.key === "T") {
        e.preventDefault();
        toggleTheme();
        showThemeStatus();
      }
    });

    console.log(
      "⌨️ Raccourci clavier ajouté: Ctrl+Shift+T pour changer de thème"
    );

    // Tentatives supplémentaires de mise à jour de l'icône
    setTimeout(() => {
      console.log("🔄 Mise à jour de l'icône - tentative 2");
      updateThemeIcon();
    }, 500);

    setTimeout(() => {
      console.log("🔄 Mise à jour de l'icône - tentative 3");
      updateThemeIcon();
    }, 1000);
  }, 300);
}

// Pré-remplir les champs de couleur avec les valeurs actuelles
function populateThemeInputs() {
  console.log("🎨 Pré-remplissage des champs de couleur...");

  setTimeout(() => {
    const primaryColor = document.getElementById("primaryColor");
    const secondaryColor = document.getElementById("secondaryColor");
    const accentColor = document.getElementById("accentColor");
    const backgroundColor = document.getElementById("backgroundColor");
    const surfaceColor = document.getElementById("surfaceColor");

    // Champs des cartes de statistiques
    const cardTotalColor = document.getElementById("cardTotalColor");
    const cardPendingColor = document.getElementById("cardPendingColor");
    const cardApprovedColor = document.getElementById("cardApprovedColor");
    const cardRejectedColor = document.getElementById("cardRejectedColor");

    if (primaryColor) primaryColor.value = customThemeData.primary;
    if (secondaryColor) secondaryColor.value = customThemeData.secondary;
    if (accentColor) accentColor.value = customThemeData.accent;
    if (backgroundColor) backgroundColor.value = customThemeData.background;
    if (surfaceColor) surfaceColor.value = customThemeData.surface;

    // Pré-remplir les champs des cartes (avec valeurs par défaut si nécessaire)
    if (cardTotalColor)
      cardTotalColor.value = customThemeData.cardTotal || "#f97316";
    if (cardPendingColor)
      cardPendingColor.value = customThemeData.cardPending || "#f59e0b";
    if (cardApprovedColor)
      cardApprovedColor.value = customThemeData.cardApproved || "#10b981";
    if (cardRejectedColor)
      cardRejectedColor.value = customThemeData.cardRejected || "#ef4444";

    console.log("✅ Champs pré-remplis avec:", customThemeData);
  }, 100);
}

// Appliquer un thème
function applyTheme(theme) {
  console.log("🎨 Application du thème:", theme);
  const body = document.body;
  const root = document.documentElement;

  // Supprimer toutes les classes de thème
  body.classList.remove("theme-light", "theme-dark", "theme-custom");

  // Appliquer le nouveau thème
  switch (theme) {
    case "light":
      body.classList.add("theme-light");
      // Variables de base
      root.style.setProperty("--bg-primary", "#ffffff");
      root.style.setProperty("--bg-secondary", "#f9fafb");
      root.style.setProperty("--text-primary", "#1f2937");
      root.style.setProperty("--text-secondary", "#6b7280");
      root.style.setProperty("--border-color", "#e5e7eb");
      // Variables de couleur
      root.style.setProperty("--color-primary", "#3b82f6");
      root.style.setProperty("--color-secondary", "#1f2937");
      root.style.setProperty("--color-accent", "#f59e0b");
      // Headers spécifiques
      root.style.setProperty("--header-bg", "#1e3a8a");
      root.style.setProperty("--header-text", "#ffffff");
      root.style.setProperty("--section-header-bg", "#2563eb");
      root.style.setProperty("--section-header-text", "#ffffff");
      // Couleurs des cartes de statistiques par défaut
      root.style.setProperty("--card-total-bg", "#f97316");
      root.style.setProperty("--card-pending-bg", "#f59e0b");
      root.style.setProperty("--card-approved-bg", "#10b981");
      root.style.setProperty("--card-rejected-bg", "#ef4444");
      break;

    case "dark":
      body.classList.add("theme-dark");
      // Variables de base
      root.style.setProperty("--bg-primary", "#1f2937");
      root.style.setProperty("--bg-secondary", "#111827");
      root.style.setProperty("--text-primary", "#f9fafb");
      root.style.setProperty("--text-secondary", "#d1d5db");
      root.style.setProperty("--border-color", "#374151");
      // Variables de couleur
      root.style.setProperty("--color-primary", "#60a5fa");
      root.style.setProperty("--color-secondary", "#374151");
      root.style.setProperty("--color-accent", "#fbbf24");
      // Headers spécifiques
      root.style.setProperty("--header-bg", "#0f172a");
      root.style.setProperty("--header-text", "#f1f5f9");
      root.style.setProperty("--section-header-bg", "#1e293b");
      root.style.setProperty("--section-header-text", "#f1f5f9");
      // Couleurs des cartes de statistiques par défaut
      root.style.setProperty("--card-total-bg", "#f97316");
      root.style.setProperty("--card-pending-bg", "#f59e0b");
      root.style.setProperty("--card-approved-bg", "#10b981");
      root.style.setProperty("--card-rejected-bg", "#ef4444");
      break;

    case "custom":
      body.classList.add("theme-custom");
      applyCustomTheme(customThemeData);
      break;
  }

  currentTheme = theme;
  localStorage.setItem("theme", theme);

  // Gestion de la surveillance de persistance des couleurs
  // Vérifier s'il y a des couleurs personnalisées sauvegardées
  const savedCustomTheme = localStorage.getItem("customTheme");
  let hasCustomCardColors = false;

  if (savedCustomTheme) {
    try {
      const savedColors = JSON.parse(savedCustomTheme);
      hasCustomCardColors =
        savedColors.cardTotal ||
        savedColors.cardPending ||
        savedColors.cardApproved ||
        savedColors.cardRejected;
    } catch (error) {
      console.error("❌ Erreur lors de la vérification des couleurs:", error);
    }
  }

  // Démarrer la surveillance si des couleurs personnalisées existent (tous thèmes)
  if (hasCustomCardColors) {
    setTimeout(() => {
      console.log(
        "🔍 Couleurs personnalisées détectées, démarrage surveillance (thème:",
        theme,
        ")"
      );
      startColorPersistenceMonitor();
    }, 1000);
  } else {
    // Arrêter la surveillance s'il n'y a pas de couleurs personnalisées
    stopColorPersistenceMonitor();
  }

  // Appliquer immédiatement le thème aux éléments spécifiques
  applyThemeToHeaders();
  applyThemeToStatCards();

  // Forcer les icônes de suppression en rouge après l'application du thème
  setTimeout(() => {
    forceDeleteIconsToRed();
    forceSpecificIconsToWhite();
  }, 500);

  console.log("✅ Thème appliqué avec succès:", theme);
}

// Appliquer un thème personnalisé
function applyCustomTheme(themeData) {
  console.log("🎨 Application du thème personnalisé:", themeData);
  const root = document.documentElement;

  // Couleurs principales
  root.style.setProperty("--color-primary", themeData.primary);
  root.style.setProperty("--color-secondary", themeData.secondary);
  root.style.setProperty("--color-accent", themeData.accent);
  root.style.setProperty("--bg-primary", themeData.background);
  root.style.setProperty("--bg-secondary", themeData.surface);

  // Couleurs des cartes de statistiques
  root.style.setProperty("--card-total-bg", themeData.cardTotal || "#f97316");
  root.style.setProperty(
    "--card-pending-bg",
    themeData.cardPending || "#f59e0b"
  );
  root.style.setProperty(
    "--card-approved-bg",
    themeData.cardApproved || "#10b981"
  );
  root.style.setProperty(
    "--card-rejected-bg",
    themeData.cardRejected || "#ef4444"
  );

  // Appliquer les couleurs aux headers
  root.style.setProperty("--header-bg", themeData.primary);
  root.style.setProperty("--header-text", "#ffffff");
  root.style.setProperty("--section-header-bg", themeData.secondary);
  root.style.setProperty("--section-header-text", "#ffffff");

  // Couleurs de texte adaptées
  const isDarkBg = isColorDark(themeData.background);
  root.style.setProperty("--text-primary", isDarkBg ? "#f9fafb" : "#1f2937");
  root.style.setProperty("--text-secondary", isDarkBg ? "#d1d5db" : "#6b7280");
  root.style.setProperty("--border-color", isDarkBg ? "#374151" : "#e5e7eb");

  // Sauvegarder TOUJOURS les données personnalisées même si on n'est pas en mode custom
  customThemeData = themeData;
  localStorage.setItem("customTheme", JSON.stringify(themeData));
  console.log("💾 Données personnalisées sauvegardées:", themeData);

  // Appliquer immédiatement aux headers et cartes
  applyThemeToHeaders();
  applyThemeToStatCards();
  console.log("✅ Thème personnalisé appliqué");
}

// Fonction pour sauvegarder le thème personnalisé sans l'appliquer
function saveCustomTheme(themeData) {
  console.log("💾 Sauvegarde du thème personnalisé:", themeData);
  customThemeData = themeData;
  localStorage.setItem("customTheme", JSON.stringify(themeData));
}

// Fonction utilitaire pour déterminer si une couleur est sombre
function isColorDark(hexColor) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

// Appliquer le thème spécifiquement aux headers
function applyThemeToHeaders() {
  console.log("🎯 Application du thème aux headers");

  // Header principal "Gestion des Accès ITS"
  const mainHeader = document.querySelector("header");
  if (mainHeader) {
    mainHeader.style.background = `var(--header-bg)`;
    mainHeader.style.color = `var(--header-text)`;

    // Titre principal
    const title = mainHeader.querySelector("h1, .text-xl, .font-bold");
    if (title) {
      title.style.color = `var(--header-text)`;
    }
  }

  // Header section "Demandes d'Accès"
  const sectionHeaders = document.querySelectorAll(
    '.bg-blue-600, .bg-blue-500, [class*="bg-blue"]'
  );
  sectionHeaders.forEach((header) => {
    header.style.background = `var(--section-header-bg)`;
    header.style.color = `var(--section-header-text)`;

    // Texte dans le header
    const headerText = header.querySelectorAll(
      "h2, h3, .text-white, .font-semibold"
    );
    headerText.forEach((text) => {
      text.style.color = `var(--section-header-text)`;
    });
  });

  // Headers spécifiques par ID ou classe
  const demandesHeader = document.querySelector(
    '[class*="Demandes"], #demandesHeader, .section-header'
  );
  if (demandesHeader) {
    demandesHeader.style.background = `var(--section-header-bg)`;
    demandesHeader.style.color = `var(--section-header-text)`;
  }

  console.log("✅ Thème appliqué aux headers");
}

// Fonction utilitaire pour appliquer les couleurs aux éléments enfants avec gestion des icônes
function applyColorsToCardElements(cardElements, textColor, cardName) {
  cardElements.forEach((el) => {
    // Préserver les couleurs spécifiques des icônes selon le type de carte
    const isIcon =
      el.tagName === "I" ||
      el.classList.contains("fa") ||
      el.classList.contains("icon") ||
      el.tagName === "SVG";

    if (isIcon) {
      // Vérifier d'abord si c'est une icône de suppression/trash
      const isDeleteIcon =
        el.classList.contains("fa-trash") ||
        el.classList.contains("fa-trash-alt") ||
        el.classList.contains("fa-delete") ||
        el.classList.contains("fa-times") ||
        el.classList.contains("delete-icon") ||
        el.classList.contains("trash-icon") ||
        (el.getAttribute("title") &&
          el.getAttribute("title").toLowerCase().includes("supprimer")) ||
        (el.getAttribute("aria-label") &&
          el.getAttribute("aria-label").toLowerCase().includes("supprimer"));

      // Vérifier si c'est une icône qui doit être blanche (flèches, navigation, clés, utilisateurs, etc.)
      const isWhiteIcon =
        el.classList.contains("fa-arrow-right") ||
        el.classList.contains("fa-arrow-left") ||
        el.classList.contains("fa-arrow-up") ||
        el.classList.contains("fa-arrow-down") ||
        el.classList.contains("fa-chevron-right") ||
        el.classList.contains("fa-chevron-left") ||
        el.classList.contains("fa-chevron-up") ||
        el.classList.contains("fa-chevron-down") ||
        el.classList.contains("fa-angle-right") ||
        el.classList.contains("fa-angle-left") ||
        el.classList.contains("fa-caret-right") ||
        el.classList.contains("fa-caret-left") ||
        el.classList.contains("fa-key") ||
        el.classList.contains("fa-unlock") ||
        el.classList.contains("fa-lock") ||
        el.classList.contains("fa-unlock-alt") ||
        el.classList.contains("fa-user") ||
        el.classList.contains("fa-user-circle") ||
        el.classList.contains("fa-user-o") ||
        el.classList.contains("fa-users") ||
        el.classList.contains("fa-user-plus") ||
        el.classList.contains("fa-user-check") ||
        el.classList.contains("white-icon") ||
        el.classList.contains("arrow-icon") ||
        el.classList.contains("key-icon") ||
        el.classList.contains("user-icon") ||
        (el.getAttribute("title") &&
          el.getAttribute("title").toLowerCase().includes("flèche")) ||
        (el.getAttribute("aria-label") &&
          el.getAttribute("aria-label").toLowerCase().includes("flèche")) ||
        (el.getAttribute("title") &&
          el.getAttribute("title").toLowerCase().includes("clé")) ||
        (el.getAttribute("aria-label") &&
          el.getAttribute("aria-label").toLowerCase().includes("clé")) ||
        (el.getAttribute("title") &&
          el.getAttribute("title").toLowerCase().includes("key")) ||
        (el.getAttribute("aria-label") &&
          el.getAttribute("aria-label").toLowerCase().includes("key")) ||
        (el.getAttribute("title") &&
          el.getAttribute("title").toLowerCase().includes("utilisateur")) ||
        (el.getAttribute("aria-label") &&
          el
            .getAttribute("aria-label")
            .toLowerCase()
            .includes("utilisateur")) ||
        (el.getAttribute("title") &&
          el.getAttribute("title").toLowerCase().includes("user")) ||
        (el.getAttribute("aria-label") &&
          el.getAttribute("aria-label").toLowerCase().includes("user"));

      // Si c'est une icône de suppression, la forcer en rouge
      if (isDeleteIcon) {
        el.style.setProperty("color", "#ef4444", "important");
        el.style.setProperty("opacity", "1", "important");
        console.log("🗑️ Icône de suppression forcée en rouge:", el);
      } else if (isWhiteIcon) {
        // Si c'est une icône qui doit être blanche, la forcer en blanc
        el.style.setProperty("color", "#ffffff", "important");
        el.style.setProperty("opacity", "1", "important");
        console.log("⚪ Icône forcée en blanc:", el);
      } else {
        // Déterminer la couleur d'icône selon le type de carte pour les autres icônes
        let iconColor = textColor; // Par défaut, utiliser la couleur de texte

        // Pour les cartes spécifiques, appliquer les bonnes couleurs
        if (cardName === "Total") {
          iconColor = textColor; // Icône en couleur de texte
        } else if (cardName === "En Attente") {
          iconColor = textColor; // Icône horloge en couleur de texte
        } else if (cardName === "Approuvées") {
          iconColor = "#ffffff"; // Icône check en blanc sur fond vert
        } else if (cardName === "Rejetées") {
          iconColor = "#ffffff"; // Icône X en blanc sur fond rouge
        }

        el.style.setProperty("color", iconColor, "important");
      }
    } else {
      // Pour tous les autres éléments (texte), utiliser la couleur de texte calculée
      el.style.setProperty("color", textColor, "important");
    }

    el.style.setProperty("background", "transparent", "important");
  });
}

// Appliquer les couleurs par défaut des cartes de statistiques
// Cette fonction applique des couleurs fixes qui persistent même lors du changement de thème
function applyDefaultStatCardsColors() {
  console.log(
    "🎨 Application des couleurs par défaut des cartes de statistiques"
  );

  // Couleurs par défaut fixes pour chaque carte avec leurs couleurs de texte correspondantes
  const defaultCardColors = {
    total: { bg: "#f97316", text: "#ffffff" }, // Orange avec texte blanc
    pending: { bg: "#f59e0b", text: "#1f2937" }, // Orange/Jaune avec texte sombre
    approved: { bg: "#10b981", text: "#ffffff" }, // Vert avec texte blanc
    rejected: { bg: "#ef4444", text: "#ffffff" }, // Rouge avec texte blanc
  };

  // Sélectionner toutes les cartes de statistiques dans l'ordre
  const statCards = document.querySelectorAll(".stat-card");
  console.log(`🔍 ${statCards.length} cartes de statistiques trouvées`);

  if (statCards.length >= 4) {
    // Carte 1: Total Demandes
    const totalCard = statCards[0];
    const totalColor = defaultCardColors.total;

    totalCard.style.background = `linear-gradient(135deg, ${totalColor.bg}, ${totalColor.bg}cc)`;
    totalCard.style.borderLeftColor = totalColor.bg;
    totalCard.style.color = totalColor.text;

    // Styliser l'icône et les éléments internes avec couleur fixe
    const totalIcon = totalCard.querySelector("i");
    const totalElements = totalCard.querySelectorAll("*");
    if (totalIcon) totalIcon.style.color = totalColor.text;
    applyColorsToCardElements(totalElements, totalColor.text, "Total");

    console.log(
      `✅ Carte Total stylée: ${totalColor.bg} avec texte ${totalColor.text}`
    );

    // Carte 2: En Attente
    const pendingCard = statCards[1];
    const pendingColor = defaultCardColors.pending;

    pendingCard.style.background = `linear-gradient(135deg, ${pendingColor.bg}, ${pendingColor.bg}cc)`;
    pendingCard.style.borderLeftColor = pendingColor.bg;
    pendingCard.style.color = pendingColor.text;

    const pendingIcon = pendingCard.querySelector("i");
    const pendingElements = pendingCard.querySelectorAll("*");
    if (pendingIcon) pendingIcon.style.color = pendingColor.text;
    applyColorsToCardElements(pendingElements, pendingColor.text, "En Attente");

    console.log(
      `✅ Carte En Attente stylée: ${pendingColor.bg} avec texte ${pendingColor.text}`
    );

    // Carte 3: Approuvées
    const approvedCard = statCards[2];
    const approvedColor = defaultCardColors.approved;

    approvedCard.style.background = `linear-gradient(135deg, ${approvedColor.bg}, ${approvedColor.bg}cc)`;
    approvedCard.style.borderLeftColor = approvedColor.bg;
    approvedCard.style.color = approvedColor.text;

    const approvedIcon = approvedCard.querySelector("i");
    const approvedElements = approvedCard.querySelectorAll("*");
    if (approvedIcon) approvedIcon.style.color = "#ffffff"; // Forcer l'icône en blanc
    applyColorsToCardElements(
      approvedElements,
      approvedColor.text,
      "Approuvées"
    );

    console.log(
      `✅ Carte Approuvées stylée: ${approvedColor.bg} avec texte ${approvedColor.text}`
    );

    // Carte 4: Rejetées
    const rejectedCard = statCards[3];
    const rejectedColor = defaultCardColors.rejected;

    rejectedCard.style.background = `linear-gradient(135deg, ${rejectedColor.bg}, ${rejectedColor.bg}cc)`;
    rejectedCard.style.borderLeftColor = rejectedColor.bg;
    rejectedCard.style.color = rejectedColor.text;

    const rejectedIcon = rejectedCard.querySelector("i");
    const rejectedElements = rejectedCard.querySelectorAll("*");
    if (rejectedIcon) rejectedIcon.style.color = "#ffffff"; // Forcer l'icône en blanc
    applyColorsToCardElements(rejectedElements, rejectedColor.text, "Rejetées");

    console.log(
      `✅ Carte Rejetées stylée: ${rejectedColor.bg} avec texte ${rejectedColor.text}`
    );

    // Ajouter une classe pour marquer que les couleurs par défaut sont appliquées
    statCards.forEach((card) => {
      card.classList.add("default-colors-applied");
      card.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)";
      card.style.transition = "all 0.3s ease";
    });
  } else {
    console.warn("⚠️ Impossible de trouver toutes les cartes de statistiques");
  }

  console.log("✅ Couleurs par défaut appliquées aux cartes de statistiques");
}

// Appliquer le thème spécifiquement aux cartes de statistiques
function applyThemeToStatCards() {
  console.log("📊 Application du thème aux cartes de statistiques");

  // Toujours vérifier s'il y a des couleurs personnalisées sauvegardées
  const savedCustomTheme = localStorage.getItem("customTheme");
  let useCustomCardColors = false;
  let customColors = null;

  if (savedCustomTheme) {
    try {
      customColors = JSON.parse(savedCustomTheme);
      // Vérifier si des couleurs de cartes personnalisées existent
      if (
        customColors.cardTotal ||
        customColors.cardPending ||
        customColors.cardApproved ||
        customColors.cardRejected
      ) {
        useCustomCardColors = true;
        console.log(
          "🎨 Couleurs personnalisées détectées, application dans tous les thèmes"
        );
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la lecture des couleurs personnalisées:",
        error
      );
    }
  }

  // Si on a des couleurs personnalisées, les utiliser quel que soit le thème
  if (useCustomCardColors && customColors) {
    console.log("🎨 Application des couleurs personnalisées des cartes");
    applyCustomCardColorsToAllThemes(customColors);
    return;
  }

  // Sinon, appliquer les couleurs par défaut
  console.log("🎨 Application des couleurs par défaut des cartes");
  applyDefaultStatCardsColors();
}

// Nouvelle fonction pour appliquer les couleurs personnalisées dans tous les thèmes
function applyCustomCardColorsToAllThemes(customColors) {
  console.log(
    "🎨 Application des couleurs personnalisées aux cartes (tous thèmes)"
  );

  const statCards = document.querySelectorAll(".stat-card");
  console.log(`🔍 ${statCards.length} cartes de statistiques trouvées`);

  if (statCards.length >= 4) {
    // Fonction utilitaire pour déterminer la couleur de texte optimale
    function getOptimalTextColor(hexColor) {
      const hex = hexColor.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? "#1f2937" : "#ffffff";
    }

    // Configuration des cartes avec couleurs personnalisées ou par défaut
    const cardConfigs = [
      {
        card: statCards[0],
        bg: customColors.cardTotal || "#f97316",
        name: "Total",
      },
      {
        card: statCards[1],
        bg: customColors.cardPending || "#f59e0b",
        name: "En Attente",
      },
      {
        card: statCards[2],
        bg: customColors.cardApproved || "#10b981",
        name: "Approuvées",
      },
      {
        card: statCards[3],
        bg: customColors.cardRejected || "#ef4444",
        name: "Rejetées",
      },
    ];

    cardConfigs.forEach(({ card, bg, name }) => {
      const textColor = getOptimalTextColor(bg);

      // Nettoyer TOUS les styles existants
      card.style.cssText = "";

      // Appliquer les styles avec !important pour forcer l'affichage
      card.style.setProperty(
        "background",
        `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        "important"
      );
      card.style.setProperty("background-color", bg, "important");
      card.style.setProperty("border-left-color", bg, "important");
      card.style.setProperty("border-left-width", "4px", "important");
      card.style.setProperty("color", textColor, "important");
      card.style.setProperty("padding", "1.5rem", "important");
      card.style.setProperty("border-radius", "0.5rem", "important");
      card.style.setProperty(
        "box-shadow",
        "0 4px 15px rgba(0, 0, 0, 0.2)",
        "important"
      );
      card.style.setProperty("display", "block", "important");
      card.style.setProperty("visibility", "visible", "important");
      card.style.setProperty("opacity", "1", "important");
      card.style.setProperty("transition", "all 0.3s ease", "important");

      // Appliquer à TOUS les éléments enfants avec !important, sauf les icônes spécifiques
      const allElements = card.querySelectorAll("*");
      applyColorsToCardElements(allElements, textColor, name);

      console.log(
        `✅ Carte ${name} appliquée avec couleur personnalisée: ${bg} avec texte ${textColor}`
      );
    });

    console.log(
      "🎯 Application des couleurs personnalisées terminée avec succès !"
    );
  } else {
    console.warn("⚠️ Impossible de trouver toutes les cartes de statistiques");
  }

  console.log(
    "✅ Couleurs personnalisées appliquées aux cartes de statistiques"
  );

  // Forcer les icônes de suppression en rouge après l'application des couleurs
  setTimeout(() => {
    forceDeleteIconsToRed();
    forceSpecificIconsToWhite();
  }, 200);
}

// Basculer entre les thèmes (cycle complet: light → dark → custom → light)
// Si aucun thème personnalisé n'existe, cycle simple light ↔ dark
function toggleTheme() {
  console.log("🎨 toggleTheme appelé, thème actuel:", currentTheme);

  try {
    let newTheme;
    let themeDisplayName;

    // Vérifier si un thème personnalisé existe
    const hasCustomTheme =
      localStorage.getItem("customTheme") &&
      localStorage.getItem("customTheme") !== "null";

    console.log("🎨 Thème personnalisé disponible:", hasCustomTheme);

    // Cycle selon la disponibilité du thème personnalisé
    if (hasCustomTheme) {
      // Cycle complet: light → dark → custom → light
      switch (currentTheme) {
        case "light":
          newTheme = "dark";
          themeDisplayName = "Sombre";
          break;
        case "dark":
          newTheme = "custom";
          themeDisplayName = "Personnalisé";
          break;
        case "custom":
        default:
          newTheme = "light";
          themeDisplayName = "Clair";
          break;
      }
    } else {
      // Cycle simple: light ↔ dark
      switch (currentTheme) {
        case "light":
          newTheme = "dark";
          themeDisplayName = "Sombre";
          break;
        case "dark":
        case "custom":
        default:
          newTheme = "light";
          themeDisplayName = "Clair";
          break;
      }
    }

    console.log("🎨 Changement vers le thème:", newTheme);

    // Sauvegarder le nouveau thème (IMPORTANT: ne PAS effacer customTheme)
    currentTheme = newTheme;
    localStorage.setItem("theme", newTheme);
    console.log("💾 Thème sauvegardé:", localStorage.getItem("theme"));
    console.log(
      "💾 Thème personnalisé préservé:",
      localStorage.getItem("customTheme")
    );

    // Appliquer le thème
    applyTheme(newTheme);

    // Mettre à jour l'icône avec délai pour s'assurer que le DOM est à jour
    setTimeout(() => {
      updateThemeIcon();
      console.log("🔄 Icône mise à jour après délai");
    }, 100);

    // Seconde tentative au cas où
    setTimeout(() => {
      updateThemeIcon();
      console.log("🔄 Icône mise à jour - seconde tentative");
    }, 500);

    // Afficher une notification simple
    try {
      showNotification(`Thème changé vers: ${themeDisplayName}`, "success");
    } catch (error) {
      console.log("🎨 Thème changé vers:", themeDisplayName);
    }
  } catch (error) {
    console.error("❌ Erreur dans toggleTheme:", error);
  }
}

// Mettre à jour l'icône du bouton de thème
function updateThemeIcon() {
  console.log(`🔄 Mise à jour de l'icône pour le thème: ${currentTheme}`);

  // Chercher le bouton de thème de plusieurs façons
  const themeButton =
    document.querySelector('[onclick="toggleTheme()"]') ||
    document.querySelector('[title*="thème"]') ||
    document.querySelector('button[onclick*="toggleTheme"]');

  console.log("🔍 Bouton trouvé:", !!themeButton);

  if (!themeButton) {
    console.warn("⚠️ Bouton de thème non trouvé dans le DOM");
    // Retry après un délai
    setTimeout(() => {
      console.log("🔄 Nouvelle tentative de mise à jour de l'icône...");
      updateThemeIcon();
    }, 500);
    return;
  }

  const themeIcon = themeButton.querySelector("i");
  console.log("🔍 Icône trouvée:", !!themeIcon);

  if (!themeIcon) {
    console.warn("⚠️ Icône de thème non trouvée dans le bouton");
    return;
  }

  console.log("🔍 Classes actuelles de l'icône:", themeIcon.className);

  // Réinitialiser toutes les classes d'icône
  themeIcon.className = "";

  // Mettre à jour l'icône selon le thème actuel
  switch (currentTheme) {
    case "light":
      themeIcon.className = "fas fa-moon text-gray-400";
      themeButton.title = "Changer vers thème sombre";
      console.log("🌙 Icône changée vers lune (mode clair actif)");
      break;
    case "dark":
      themeIcon.className = "fas fa-palette text-purple-400";
      themeButton.title = "Changer vers thème personnalisé";
      console.log("  Icône changée vers palette (mode sombre actif)");
      break;
    case "custom":
      themeIcon.className = "fas fa-sun text-yellow-400";
      themeButton.title = "Changer vers thème clair";
      console.log("  Icône changée vers soleil (mode personnalisé actif)");
      break;
    default:
      themeIcon.className = "fas fa-moon text-gray-400";
      themeButton.title = "Changer de thème";
      console.log("🔄 Icône par défaut (lune)");
      break;
  }

  console.log("✅ Nouvelles classes de l'icône:", themeIcon.className);

  // Forcer le rendu
  themeIcon.offsetHeight; // Force reflow
}

// Fonction pour forcer la mise à jour de l'icône (debugging)
function forceUpdateThemeIcon() {
  console.log("🔧 Forçage de la mise à jour de l'icône...");
  console.log("🔧 Thème actuel:", currentTheme);

  // Attendre que le DOM soit prêt
  setTimeout(() => {
    updateThemeIcon();
  }, 100);
}

// Rendre accessible globalement pour debugging
window.forceUpdateThemeIcon = forceUpdateThemeIcon;

// Fonction de debug pour tester l'icône
function debugThemeIcon() {
  console.log("🧪 DEBUG de l'icône du thème:");
  console.log("- Thème actuel:", currentTheme);

  const button = document.querySelector('[onclick="toggleTheme()"]');
  console.log("- Bouton trouvé:", !!button);
  if (button) {
    console.log("- Bouton HTML:", button.outerHTML);
    const icon = button.querySelector("i");
    console.log("- Icône trouvée:", !!icon);
    if (icon) {
      console.log("- Classes actuelles:", icon.className);
      console.log("- Icône HTML:", icon.outerHTML);
    }
  }

  // Essayer de mettre à jour
  console.log("🔄 Tentative de mise à jour...");
  updateThemeIcon();
}

// Rendre accessible globalement
window.debugThemeIcon = debugThemeIcon;

// =================== FONCTION DE TEST POUR LE THÈME ===================
function testThemeSystem() {
  console.log("🧪 Test du système de thème");
  console.log("Thème actuel:", currentTheme);
  console.log("Données personnalisées:", customThemeData);
  console.log("localStorage theme:", localStorage.getItem("theme"));
  console.log("localStorage customTheme:", localStorage.getItem("customTheme"));

  const button = document.querySelector('[onclick="toggleTheme()"]');
  console.log("Bouton trouvé:", !!button);

  if (button) {
    const icon = button.querySelector("i");
    console.log("Icône trouvée:", !!icon);
    if (icon) {
      console.log("Classes de l'icône:", icon.className);
    }
  }

  // Test de basculement
  console.log("🧪 Test de basculement...");
  toggleTheme();
}

// Afficher le statut actuel du thème
function showThemeStatus() {
  const hasCustomTheme =
    localStorage.getItem("customTheme") &&
    localStorage.getItem("customTheme") !== "null";

  console.log("📊 Statut du système de thème:");
  console.log(`   - Thème actuel: ${currentTheme}`);
  console.log(
    `   - Thème personnalisé sauvegardé: ${hasCustomTheme ? "Oui" : "Non"}`
  );

  const cycleText = hasCustomTheme
    ? "light → dark → custom → light"
    : "light ↔ dark";
  console.log(`   - Cycle de thèmes: ${cycleText}`);

  const currentDisplayName =
    currentTheme === "light"
      ? "Clair"
      : currentTheme === "dark"
      ? "Sombre"
      : currentTheme === "custom"
      ? "Personnalisé"
      : "Inconnu";

  showNotification(
    `Thème actuel: ${currentDisplayName}${
      hasCustomTheme && currentTheme !== "custom"
        ? " (Personnalisé disponible)"
        : ""
    }`,
    "info"
  );
}

// Rendre les fonctions accessibles globalement pour les tests
window.testThemeSystem = testThemeSystem;
window.showThemeStatus = showThemeStatus;

// Fonction pour tester immédiatement les cartes de statistiques
function testStatCardsTheme() {
  console.log("🧪 Test des cartes de statistiques...");
  applyThemeToStatCards();

  setTimeout(() => {
    const cards = document.querySelectorAll(".stat-card");
    cards.forEach((card, index) => {
      const bg = window.getComputedStyle(card).background;
      const color = window.getComputedStyle(card).color;
      console.log(`Carte ${index + 1}:`, { background: bg, color: color });
    });
  }, 500);
}

// Fonction de test complète pour les couleurs par défaut
function testDefaultCardColors() {
  console.log("🧪 Test complet des couleurs par défaut des cartes...");

  // Forcer l'application des couleurs par défaut
  applyDefaultStatCardsColors();

  setTimeout(() => {
    const cards = document.querySelectorAll(".stat-card");
    const expectedColors = ["#f97316", "#f59e0b", "#10b981", "#ef4444"];
    const cardNames = [
      "Total Demandes",
      "En Attente",
      "Approuvées",
      "Rejetées",
    ];

    cards.forEach((card, index) => {
      const bg = window.getComputedStyle(card).backgroundColor;
      const color = window.getComputedStyle(card).color;
      const borderLeft = window.getComputedStyle(card).borderLeftColor;

      console.log(`📊 ${cardNames[index]}:`, {
        background: bg,
        textColor: color,
        borderLeft: borderLeft,
        expectedColor: expectedColors[index],
      });
    });

    console.log("✅ Test des couleurs par défaut terminé");
  }, 500);
} // Fonction pour activer directement le thème personnalisé
function activateCustomTheme() {
  console.log("🎨 Activation directe du thème personnalisé...");

  // Vérifier si un thème personnalisé existe
  const savedCustomTheme = localStorage.getItem("customTheme");
  if (!savedCustomTheme || savedCustomTheme === "null") {
    console.log("❌ Aucun thème personnalisé sauvegardé");
    showNotification("Aucun thème personnalisé configuré!", "warning");
    return;
  }

  try {
    // Charger et appliquer le thème personnalisé
    const customData = JSON.parse(savedCustomTheme);
    currentTheme = "custom";
    localStorage.setItem("theme", "custom");

    applyTheme("custom");

    setTimeout(() => {
      updateThemeIcon();
      applyThemeToHeaders();
    }, 100);

    showNotification("Thème personnalisé activé!", "success");
    console.log("✅ Thème personnalisé activé:", customData);
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'activation du thème personnalisé:",
      error
    );
    showNotification("Erreur lors de l'activation du thème!", "error");
  }
}

// =================== FONCTIONS GLOBALES POUR TESTS ===================
// Rendre les fonctions accessibles globalement pour le débogage
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
window.updateThemeIcon = updateThemeIcon;
window.openThemeCustomizer = openThemeCustomizer;
window.closeThemeCustomizer = closeThemeCustomizer;
window.activateCustomTheme = activateCustomTheme;
window.viewRequestDetails = viewRequestDetails;
window.closeDetailsModal = closeDetailsModal;
// Fonction de débogage rapide pour forcer les couleurs
window.fixCardColors = function () {
  console.log("🛠️ Correction forcée des couleurs des cartes...");

  const statCards = document.querySelectorAll(".stat-card");
  console.log(`🔍 ${statCards.length} cartes trouvées`);

  if (statCards.length >= 4) {
    // Couleurs fixes avec contraste approprié
    const colors = [
      { bg: "#f97316", text: "#ffffff" }, // Orange - Total (texte blanc)
      { bg: "#f59e0b", text: "#1f2937" }, // Jaune - En Attente (texte sombre)
      { bg: "#10b981", text: "#ffffff" }, // Vert - Approuvées (texte blanc)
      { bg: "#ef4444", text: "#ffffff" }, // Rouge - Rejetées (texte blanc)
    ];

    statCards.forEach((card, index) => {
      if (colors[index]) {
        const color = colors[index];

        // Nettoyer d'abord tous les styles pour éviter les conflits
        card.style.cssText = "";

        // Appliquer le nouveau style avec !important pour forcer l'affichage
        card.style.setProperty(
          "background",
          `linear-gradient(135deg, ${color.bg}, ${color.bg}cc)`,
          "important"
        );
        card.style.setProperty("background-color", color.bg, "important");
        card.style.setProperty("border-left-color", color.bg, "important");
        card.style.setProperty("border-left-width", "4px", "important");
        card.style.setProperty("color", color.text, "important");
        card.style.setProperty("padding", "1.5rem", "important");
        card.style.setProperty("border-radius", "0.5rem", "important");
        card.style.setProperty(
          "box-shadow",
          "0 4px 15px rgba(0, 0, 0, 0.2)",
          "important"
        );
        card.style.setProperty("display", "block", "important");
        card.style.setProperty("visibility", "visible", "important");
        card.style.setProperty("opacity", "1", "important");

        // Forcer la couleur sur tous les éléments enfants avec !important
        const allElements = card.querySelectorAll("*");
        allElements.forEach((el) => {
          el.style.setProperty("color", color.text, "important");
          el.style.setProperty("background", "transparent", "important");
        });

        console.log(
          `✅ Carte ${index + 1} corrigée AVEC FORCE: ${color.bg} avec texte ${
            color.text
          }`
        );
      }
    });

    console.log(
      "✅ Correction terminée - les cartes devraient maintenant être visibles !"
    );
  } else {
    console.warn("⚠️ Impossible de trouver 4 cartes de statistiques");
  }
};

// Fonction de test simple pour appliquer des couleurs de test
window.testCustomCardColors = function () {
  console.log("🧪 Test des couleurs personnalisées...");

  // Couleurs de test distinctes
  const testColors = {
    cardTotal: "#ff0000", // Rouge vif
    cardPending: "#00ff00", // Vert vif
    cardApproved: "#0000ff", // Bleu vif
    cardRejected: "#ff00ff", // Magenta vif
  };

  const statCards = document.querySelectorAll(".stat-card");

  if (statCards.length >= 4) {
    const configs = [
      { card: statCards[0], bg: testColors.cardTotal, name: "Total (Rouge)" },
      {
        card: statCards[1],
        bg: testColors.cardPending,
        name: "En Attente (Vert)",
      },
      {
        card: statCards[2],
        bg: testColors.cardApproved,
        name: "Approuvées (Bleu)",
      },
      {
        card: statCards[3],
        bg: testColors.cardRejected,
        name: "Rejetées (Magenta)",
      },
    ];

    configs.forEach(({ card, bg, name }) => {
      card.style.cssText = "";
      card.style.setProperty("background", bg, "important");
      card.style.setProperty("color", "#ffffff", "important");
      card.style.setProperty("padding", "1.5rem", "important");
      card.style.setProperty("border-radius", "0.5rem", "important");
      card.style.setProperty("border-left-color", bg, "important");
      card.style.setProperty("border-left-width", "4px", "important");
      card.style.setProperty("font-weight", "bold", "important");
      card.style.setProperty("display", "block", "important");
      card.style.setProperty("visibility", "visible", "important");
      card.style.setProperty("opacity", "1", "important");

      const allElements = card.querySelectorAll("*");
      allElements.forEach((el) => {
        el.style.setProperty("color", "#ffffff", "important");
        el.style.setProperty("background", "transparent", "important");
      });

      console.log(`✅ ${name} appliquée AVEC FORCE`);
    });

    console.log(
      "🎯 Si vous voyez les cartes en couleurs vives, le système fonctionne !"
    );
  }
};

window.testStatCardsTheme = testStatCardsTheme;
window.applyDefaultStatCardsColors = applyDefaultStatCardsColors;
window.testDefaultCardColors = testDefaultCardColors;

// Fonction de test pour déboguer les cartes
window.testStatCards = function () {
  console.log("🧪 Test des cartes de statistiques:");

  const statCards = document.querySelectorAll(".stat-card");
  console.log(`📊 ${statCards.length} cartes trouvées`);

  statCards.forEach((card, index) => {
    console.log(`Carte ${index + 1}:`, {
      classes: card.className,
      textContent: card.textContent.trim().substring(0, 50),
      currentBorderColor: card.style.borderLeftColor || "non défini",
      currentBackground: card.style.background || "non défini",
    });
  });

  console.log("Variables CSS actuelles:");
  const root = document.documentElement;
  console.log(
    "--card-total-bg:",
    getComputedStyle(root).getPropertyValue("--card-total-bg")
  );
  console.log(
    "--card-pending-bg:",
    getComputedStyle(root).getPropertyValue("--card-pending-bg")
  );
  console.log(
    "--card-approved-bg:",
    getComputedStyle(root).getPropertyValue("--card-approved-bg")
  );
  console.log(
    "--card-rejected-bg:",
    getComputedStyle(root).getPropertyValue("--card-rejected-bg")
  );

  // Appliquer manuellement
  applyThemeToStatCards();
};

// Fonction de test rapide
window.quickThemeTest = function () {
  console.log("🔥 Test rapide du système de thème");
  console.log("Thème actuel:", currentTheme);
  toggleTheme();
  console.log("Nouveau thème:", currentTheme);
};

// Fonction de débogage pour vérifier l'état des boutons
function debugThemeButtons() {
  console.log("🔍 Débogage des boutons de thème:");
  console.log("Theme actuel:", currentTheme);

  const themeButton = document.querySelector('[onclick="toggleTheme()"]');
  const themeIcon = themeButton ? themeButton.querySelector("i") : null;

  console.log("Bouton trouvé:", !!themeButton);
  console.log("Icône trouvée:", !!themeIcon);

  if (themeIcon) {
    console.log("Classes actuelles de l'icône:", themeIcon.className);
  }

  // Tester manuellement la fonction
  if (window.toggleTheme) {
    console.log("✅ Fonction toggleTheme disponible");
  } else {
    console.error("❌ Fonction toggleTheme non disponible");
  }
}

// Ouvrir le modal de personnalisation du thème
function openThemeCustomizer() {
  console.log("🎨 Ouverture du modal de personnalisation...");
  const modal = document.getElementById("themeCustomizerModal");
  console.log("🎨 Modal trouvé:", modal);

  if (modal) {
    console.log("🎨 Classes avant:", modal.className);
    modal.classList.remove("hidden");

    // Forcer l'affichage avec des styles en ligne
    modal.style.display = "flex";
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    modal.style.zIndex = "9999";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";

    console.log("🎨 Classes après:", modal.className);
    console.log("🎨 Style display:", modal.style.display);

    // Empêcher la fermeture quand on clique sur le contenu du modal
    const modalContent = modal.querySelector(".bg-white");
    if (modalContent) {
      modalContent.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }

    // Charger les valeurs actuelles
    const primaryColor = document.getElementById("primaryColor");
    const secondaryColor = document.getElementById("secondaryColor");
    const accentColor = document.getElementById("accentColor");
    const backgroundColor = document.getElementById("backgroundColor");
    const surfaceColor = document.getElementById("surfaceColor");

    // Charger les valeurs des cartes de statistiques
    const cardTotalColor = document.getElementById("cardTotalColor");
    const cardPendingColor = document.getElementById("cardPendingColor");
    const cardApprovedColor = document.getElementById("cardApprovedColor");
    const cardRejectedColor = document.getElementById("cardRejectedColor");

    console.log("🎨 Éléments de couleur trouvés:", {
      primaryColor: !!primaryColor,
      secondaryColor: !!secondaryColor,
      accentColor: !!accentColor,
      backgroundColor: !!backgroundColor,
      surfaceColor: !!surfaceColor,
      cardTotalColor: !!cardTotalColor,
      cardPendingColor: !!cardPendingColor,
      cardApprovedColor: !!cardApprovedColor,
      cardRejectedColor: !!cardRejectedColor,
    });

    if (primaryColor) primaryColor.value = customThemeData.primary;
    if (secondaryColor) secondaryColor.value = customThemeData.secondary;
    if (accentColor) accentColor.value = customThemeData.accent;
    if (backgroundColor) backgroundColor.value = customThemeData.background;
    if (surfaceColor) surfaceColor.value = customThemeData.surface;

    // Charger les valeurs des cartes
    if (cardTotalColor)
      cardTotalColor.value = customThemeData.cardTotal || "#f97316";
    if (cardPendingColor)
      cardPendingColor.value = customThemeData.cardPending || "#f59e0b";
    if (cardApprovedColor)
      cardApprovedColor.value = customThemeData.cardApproved || "#10b981";
    if (cardRejectedColor)
      cardRejectedColor.value = customThemeData.cardRejected || "#ef4444";

    // Ajouter des event listeners pour la prévisualisation en temps réel des cartes
    const previewCardColors = () => {
      console.log("🎨 Prévisualisation des couleurs des cartes...");

      // Mettre à jour temporairement les données du thème
      const tempThemeData = {
        ...customThemeData,
        cardTotal: cardTotalColor
          ? cardTotalColor.value
          : customThemeData.cardTotal,
        cardPending: cardPendingColor
          ? cardPendingColor.value
          : customThemeData.cardPending,
        cardApproved: cardApprovedColor
          ? cardApprovedColor.value
          : customThemeData.cardApproved,
        cardRejected: cardRejectedColor
          ? cardRejectedColor.value
          : customThemeData.cardRejected,
      };

      // Sauvegarder temporairement
      const originalThemeData = customThemeData;
      customThemeData = tempThemeData;

      // Appliquer aux cartes immédiatement
      const statCards = document.querySelectorAll(".stat-card");
      if (statCards.length >= 4) {
        // Fonction pour calculer la couleur de texte
        function getTextColor(hexColor) {
          const hex = hexColor.replace("#", "");
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance > 0.5 ? "#1f2937" : "#ffffff";
        }

        // Appliquer aux cartes
        const colors = [
          tempThemeData.cardTotal,
          tempThemeData.cardPending,
          tempThemeData.cardApproved,
          tempThemeData.cardRejected,
        ];

        statCards.forEach((card, index) => {
          if (colors[index]) {
            const bgColor = colors[index];
            const textColor = getTextColor(bgColor);

            card.style.background = `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`;
            card.style.borderLeftColor = bgColor;
            card.style.color = textColor;

            // Appliquer à tous les éléments enfants
            const allElements = card.querySelectorAll("*");
            allElements.forEach((el) => {
              el.style.setProperty("color", textColor, "important");
            });
          }
        });
      }

      // Restaurer les données originales (la vraie sauvegarde se fait avec applyCustomColors)
      customThemeData = originalThemeData;
    };

    // Attacher les event listeners aux inputs des cartes
    if (cardTotalColor) {
      cardTotalColor.addEventListener("input", previewCardColors);
      cardTotalColor.addEventListener("change", previewCardColors);
    }
    if (cardPendingColor) {
      cardPendingColor.addEventListener("input", previewCardColors);
      cardPendingColor.addEventListener("change", previewCardColors);
    }
    if (cardApprovedColor) {
      cardApprovedColor.addEventListener("input", previewCardColors);
      cardApprovedColor.addEventListener("change", previewCardColors);
    }
    if (cardRejectedColor) {
      cardRejectedColor.addEventListener("input", previewCardColors);
      cardRejectedColor.addEventListener("change", previewCardColors);
    }

    console.log("🎨 Modal ouvert avec succès!");
  } else {
    console.error("❌ Modal de personnalisation non trouvé!");
  }
}

// Fermer le modal de personnalisation du thème
function closeThemeCustomizer() {
  console.log("🎨 Fermeture du modal de personnalisation...");
  const modal = document.getElementById("themeCustomizerModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none"; // Force le masquage
    console.log("🎨 Modal fermé avec succès!");
  }
}

// Appliquer les couleurs personnalisées
function applyCustomColors() {
  console.log("🎨 Application des couleurs personnalisées...");

  const newTheme = {
    primary: document.getElementById("primaryColor").value,
    secondary: document.getElementById("secondaryColor").value,
    accent: document.getElementById("accentColor").value,
    background: document.getElementById("backgroundColor").value,
    surface: document.getElementById("surfaceColor").value,
    // Couleurs des cartes de statistiques
    cardTotal: document.getElementById("cardTotalColor").value,
    cardPending: document.getElementById("cardPendingColor").value,
    cardApproved: document.getElementById("cardApprovedColor").value,
    cardRejected: document.getElementById("cardRejectedColor").value,
  };

  console.log("🎨 Nouvelles couleurs:", newTheme);

  // ÉTAPE 1: Sauvegarder TOUJOURS les données personnalisées dans les variables globales
  customThemeData = newTheme;

  // ÉTAPE 2: Sauvegarder TOUJOURS dans localStorage (même si on n'active pas le thème custom)
  localStorage.setItem("customTheme", JSON.stringify(newTheme));

  // ÉTAPE 3: Basculer vers le thème custom ET l'appliquer
  currentTheme = "custom";
  localStorage.setItem("theme", "custom");

  console.log("💾 Données sauvegardées dans localStorage:");
  console.log("   - theme:", localStorage.getItem("theme"));
  console.log("   - customTheme:", localStorage.getItem("customTheme"));

  // ÉTAPE 4: Appliquer le thème
  applyTheme("custom");

  // ÉTAPE 5: Appliquer IMMÉDIATEMENT les couleurs des cartes avec les nouvelles données
  setTimeout(() => {
    console.log(
      "🎨 Application FORCÉE des couleurs personnalisées aux cartes..."
    );

    // Utiliser directement les nouvelles couleurs
    const statCards = document.querySelectorAll(".stat-card");
    console.log(
      `🔍 ${statCards.length} cartes trouvées pour application personnalisée`
    );

    if (statCards.length >= 4) {
      // Fonction pour calculer la couleur de texte optimale
      function getOptimalTextColor(hexColor) {
        const hex = hexColor.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? "#1f2937" : "#ffffff";
      }

      // Cartes avec leurs nouvelles couleurs
      const cardConfigs = [
        { card: statCards[0], bg: newTheme.cardTotal, name: "Total" },
        { card: statCards[1], bg: newTheme.cardPending, name: "En Attente" },
        { card: statCards[2], bg: newTheme.cardApproved, name: "Approuvées" },
        { card: statCards[3], bg: newTheme.cardRejected, name: "Rejetées" },
      ];

      cardConfigs.forEach(({ card, bg, name }) => {
        const textColor = getOptimalTextColor(bg);

        // Nettoyer TOUS les styles existants
        card.style.cssText = "";

        // Appliquer les styles avec !important pour forcer l'affichage
        card.style.setProperty(
          "background",
          `linear-gradient(135deg, ${bg}, ${bg}cc)`,
          "important"
        );
        card.style.setProperty("background-color", bg, "important");
        card.style.setProperty("border-left-color", bg, "important");
        card.style.setProperty("border-left-width", "4px", "important");
        card.style.setProperty("color", textColor, "important");
        card.style.setProperty("padding", "1.5rem", "important");
        card.style.setProperty("border-radius", "0.5rem", "important");
        card.style.setProperty(
          "box-shadow",
          "0 4px 15px rgba(0, 0, 0, 0.2)",
          "important"
        );
        card.style.setProperty("display", "block", "important");
        card.style.setProperty("visibility", "visible", "important");
        card.style.setProperty("opacity", "1", "important");
        card.style.setProperty("transition", "all 0.3s ease", "important");

        // Appliquer à TOUS les éléments enfants avec !important
        const allElements = card.querySelectorAll("*");
        allElements.forEach((el) => {
          el.style.setProperty("color", textColor, "important");
          el.style.setProperty("background", "transparent", "important");
        });

        console.log(
          `✅ Carte ${name} appliquée AVEC FORCE: ${bg} avec texte ${textColor}`
        );
      });

      console.log("🎯 Application DIRECTE terminée avec succès !");
    }
  }, 100);

  // ÉTAPE 6: Application de sécurité après 500ms
  setTimeout(() => {
    console.log("🔄 Application de sécurité des couleurs personnalisées...");
    applyThemeToStatCards();
  }, 500);

  // ÉTAPE 7: Surveillance continue pour maintenir les couleurs
  startColorPersistenceMonitor();

  // ÉTAPE 8: Forcer la mise à jour de l'interface
  setTimeout(() => {
    applyThemeToHeaders();
    updateThemeIcon();
  }, 300);

  closeThemeCustomizer();
  showNotification("Thème personnalisé appliqué avec succès!", "success");

  console.log("✅ Thème personnalisé appliqué et sauvegardé!");
}

// Réinitialiser les couleurs par défaut du modal
function resetToDefaultColors() {
  const defaultTheme = {
    primary: "#3b82f6",
    secondary: "#1f2937",
    accent: "#f59e0b",
    background: "#ffffff",
    surface: "#f9fafb",
    // Couleurs par défaut des cartes
    cardTotal: "#f97316",
    cardPending: "#f59e0b",
    cardApproved: "#10b981",
    cardRejected: "#ef4444",
  };

  // Mettre à jour les champs du formulaire uniquement
  document.getElementById("primaryColor").value = defaultTheme.primary;
  document.getElementById("secondaryColor").value = defaultTheme.secondary;
  document.getElementById("accentColor").value = defaultTheme.accent;
  document.getElementById("backgroundColor").value = defaultTheme.background;
  document.getElementById("surfaceColor").value = defaultTheme.surface;

  // Mettre à jour les champs des cartes de statistiques
  document.getElementById("cardTotalColor").value = defaultTheme.cardTotal;
  document.getElementById("cardPendingColor").value = defaultTheme.cardPending;
  document.getElementById("cardApprovedColor").value =
    defaultTheme.cardApproved;
  document.getElementById("cardRejectedColor").value =
    defaultTheme.cardRejected;

  showNotification("Couleurs du formulaire réinitialisées!", "success");
}

// Réinitialiser COMPLÈTEMENT tous les thèmes (retour à l'état initial)
function resetAllThemes() {
  console.log("🔄 Réinitialisation complète des thèmes...");

  // Supprimer toutes les données de thème du localStorage
  localStorage.removeItem("theme");
  localStorage.removeItem("customTheme");

  // Réinitialiser les variables globales
  currentTheme = "light";
  customThemeData = {
    primary: "#3b82f6",
    secondary: "#1f2937",
    accent: "#f59e0b",
    background: "#ffffff",
    surface: "#f9fafb",
  };

  // Appliquer le thème par défaut
  applyTheme("light");
  updateThemeIcon();

  // Mettre à jour les champs du modal si ils existent
  setTimeout(() => {
    const primaryColor = document.getElementById("primaryColor");
    const secondaryColor = document.getElementById("secondaryColor");
    const accentColor = document.getElementById("accentColor");
    const backgroundColor = document.getElementById("backgroundColor");
    const surfaceColor = document.getElementById("surfaceColor");

    if (primaryColor) primaryColor.value = customThemeData.primary;
    if (secondaryColor) secondaryColor.value = customThemeData.secondary;
    if (accentColor) accentColor.value = customThemeData.accent;
    if (backgroundColor) backgroundColor.value = customThemeData.background;
    if (surfaceColor) surfaceColor.value = customThemeData.surface;
  }, 100);

  showNotification("Tous les thèmes ont été réinitialisés!", "success");
  console.log("✅ Réinitialisation complète terminée");
}

// Rendre la fonction accessible globalement
window.resetAllThemes = resetAllThemes;

// =================== SURVEILLANCE DE PERSISTANCE DES COULEURS ===================

let colorPersistenceInterval = null;

// Fonction pour forcer la couleur rouge sur toutes les icônes de suppression
function forceDeleteIconsToRed() {
  // Sélectionner toutes les icônes de suppression possibles
  const deleteSelectors = [
    ".fa-trash",
    ".fa-trash-alt",
    ".fa-delete",
    ".fa-times",
    ".delete-icon",
    ".trash-icon",
    'i[title*="supprimer" i]',
    'i[aria-label*="supprimer" i]',
    ".fa-trash-o",
    ".fa-remove",
  ];

  deleteSelectors.forEach((selector) => {
    const icons = document.querySelectorAll(selector);
    icons.forEach((icon) => {
      icon.style.setProperty("color", "#ef4444", "important");
      icon.style.setProperty("opacity", "1", "important");
    });
  });

  // Rechercher aussi dans tous les éléments avec des classes FontAwesome
  const allIcons = document.querySelectorAll('i[class*="fa-"]');
  allIcons.forEach((icon) => {
    const classes = icon.className.toLowerCase();
    if (
      classes.includes("trash") ||
      classes.includes("delete") ||
      classes.includes("remove")
    ) {
      icon.style.setProperty("color", "#ef4444", "important");
      icon.style.setProperty("opacity", "1", "important");
    }
  });

  console.log("🗑️ Icônes de suppression forcées en rouge");
}

// Fonction pour forcer la couleur blanche sur certaines icônes spécifiques
function forceSpecificIconsToWhite() {
  // Sélectionner toutes les icônes qui doivent être blanches
  const whiteIconSelectors = [
    ".fa-arrow-right",
    ".fa-arrow-left",
    ".fa-arrow-up",
    ".fa-arrow-down",
    ".fa-chevron-right",
    ".fa-chevron-left",
    ".fa-chevron-up",
    ".fa-chevron-down",
    ".fa-angle-right",
    ".fa-angle-left",
    ".fa-caret-right",
    ".fa-caret-left",
    ".fa-key",
    ".fa-unlock",
    ".fa-lock",
    ".fa-unlock-alt",
    ".fa-user",
    ".fa-user-circle",
    ".fa-user-o",
    ".fa-users",
    ".fa-user-plus",
    ".fa-user-check",
    ".white-icon",
    ".arrow-icon",
    ".key-icon",
    ".user-icon",
    'i[title*="flèche" i]',
    'i[aria-label*="flèche" i]',
    'i[title*="clé" i]',
    'i[aria-label*="clé" i]',
    'i[title*="key" i]',
    'i[aria-label*="key" i]',
    'i[title*="utilisateur" i]',
    'i[aria-label*="utilisateur" i]',
    'i[title*="user" i]',
    'i[aria-label*="user" i]',
  ];

  whiteIconSelectors.forEach((selector) => {
    const icons = document.querySelectorAll(selector);
    icons.forEach((icon) => {
      icon.style.setProperty("color", "#ffffff", "important");
      icon.style.setProperty("opacity", "1", "important");
    });
  });

  // Rechercher aussi dans tous les éléments avec des classes FontAwesome pour les flèches, clés et utilisateurs
  const allIcons = document.querySelectorAll('i[class*="fa-"]');
  allIcons.forEach((icon) => {
    const classes = icon.className.toLowerCase();
    if (
      classes.includes("arrow") ||
      classes.includes("chevron") ||
      classes.includes("angle") ||
      classes.includes("caret") ||
      classes.includes("key") ||
      classes.includes("lock") ||
      classes.includes("unlock") ||
      classes.includes("user")
    ) {
      // Vérifier si l'icône est dans un contexte où elle doit être blanche
      const parentCard = icon.closest(".stat-card");
      const parentElement = icon.closest(
        '[class*="bg-"], [style*="background"]'
      );

      // Si l'icône est dans une carte ou un élément avec un fond sombre, la rendre blanche
      if (parentCard || parentElement) {
        icon.style.setProperty("color", "#ffffff", "important");
        icon.style.setProperty("opacity", "1", "important");
      }
    }
  });

  console.log("⚪ Icônes spécifiques forcées en blanc");
}

// Démarrer la surveillance de persistance des couleurs
function startColorPersistenceMonitor() {
  console.log("🔍 Démarrage de la surveillance de persistance des couleurs");

  // Arrêter toute surveillance précédente
  if (colorPersistenceInterval) {
    clearInterval(colorPersistenceInterval);
  }

  // Surveiller et réappliquer les couleurs toutes les 2 secondes
  colorPersistenceInterval = setInterval(() => {
    // Vérifier s'il y a des couleurs personnalisées sauvegardées
    const savedCustomTheme = localStorage.getItem("customTheme");
    if (savedCustomTheme) {
      try {
        const savedColors = JSON.parse(savedCustomTheme);
        // Si des couleurs de cartes sont définies, les maintenir quel que soit le thème
        if (
          savedColors.cardTotal ||
          savedColors.cardPending ||
          savedColors.cardApproved ||
          savedColors.cardRejected
        ) {
          console.log(
            "🔄 Vérification et maintien des couleurs personnalisées (tous thèmes)..."
          );
          forceApplyCustomCardColors();
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors de la vérification des couleurs sauvegardées:",
          error
        );
      }
    }

    // Toujours forcer les icônes de suppression en rouge
    forceDeleteIconsToRed();

    // Toujours forcer les icônes spécifiques en blanc
    forceSpecificIconsToWhite();
  }, 2000);
}

// Arrêter la surveillance de persistance des couleurs
function stopColorPersistenceMonitor() {
  if (colorPersistenceInterval) {
    clearInterval(colorPersistenceInterval);
    colorPersistenceInterval = null;
    console.log("⏹️ Surveillance de persistance des couleurs arrêtée");
  }
}

// Forcer l'application des couleurs personnalisées aux cartes
function forceApplyCustomCardColors() {
  const statCards = document.querySelectorAll(".stat-card");

  // Récupérer les couleurs personnalisées sauvegardées
  const savedCustomTheme = localStorage.getItem("customTheme");
  let savedColors = null;

  if (savedCustomTheme) {
    try {
      savedColors = JSON.parse(savedCustomTheme);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la lecture des couleurs sauvegardées:",
        error
      );
      return;
    }
  }

  if (statCards.length >= 4 && savedColors) {
    // Fonction pour calculer la couleur de texte optimale
    function getOptimalTextColor(hexColor) {
      const hex = hexColor.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? "#1f2937" : "#ffffff";
    }

    // Configuration des cartes avec couleurs personnalisées sauvegardées
    const cardConfigs = [
      {
        card: statCards[0],
        bg: savedColors.cardTotal || "#f97316",
        name: "Total",
      },
      {
        card: statCards[1],
        bg: savedColors.cardPending || "#f59e0b",
        name: "En Attente",
      },
      {
        card: statCards[2],
        bg: savedColors.cardApproved || "#10b981",
        name: "Approuvées",
      },
      {
        card: statCards[3],
        bg: savedColors.cardRejected || "#ef4444",
        name: "Rejetées",
      },
    ];

    let changesApplied = false;

    cardConfigs.forEach(({ card, bg, name }) => {
      // Vérifier si la couleur actuelle est différente de celle souhaitée
      const currentBg = card.style.getPropertyValue("background-color");
      const expectedBg = bg;

      if (!currentBg.includes(expectedBg.replace("#", ""))) {
        const textColor = getOptimalTextColor(bg);

        // Réappliquer avec force
        card.style.setProperty(
          "background",
          `linear-gradient(135deg, ${bg}, ${bg}cc)`,
          "important"
        );
        card.style.setProperty("background-color", bg, "important");
        card.style.setProperty("border-left-color", bg, "important");
        card.style.setProperty("border-left-width", "4px", "important");
        card.style.setProperty("color", textColor, "important");
        card.style.setProperty("padding", "1.5rem", "important");
        card.style.setProperty("border-radius", "0.5rem", "important");
        card.style.setProperty(
          "box-shadow",
          "0 4px 15px rgba(0, 0, 0, 0.2)",
          "important"
        );
        card.style.setProperty("display", "block", "important");
        card.style.setProperty("visibility", "visible", "important");
        card.style.setProperty("opacity", "1", "important");

        // Appliquer aux éléments enfants avec préservation des couleurs d'icônes
        const allElements = card.querySelectorAll("*");
        applyColorsToCardElements(allElements, textColor, name);

        changesApplied = true;
        console.log(
          `🔄 Carte ${name} restaurée: ${bg} avec texte ${textColor}`
        );
      }
    });

    if (changesApplied) {
      console.log("✅ Couleurs personnalisées restaurées avec succès");
    }
  }
}

// Rendre les fonctions accessibles globalement pour debugging
window.startColorPersistenceMonitor = startColorPersistenceMonitor;
window.stopColorPersistenceMonitor = stopColorPersistenceMonitor;
window.forceApplyCustomCardColors = forceApplyCustomCardColors;

// Fonction de test rapide pour vérifier la persistance
function testColorPersistence() {
  console.log("🧪 TEST DE PERSISTANCE DES COULEURS");
  console.log("   - Thème actuel:", currentTheme);
  console.log("   - Données custom:", customThemeData);
  console.log("   - Surveillance active:", colorPersistenceInterval !== null);

  // Vérifier les couleurs sauvegardées
  const savedCustomTheme = localStorage.getItem("customTheme");
  if (savedCustomTheme) {
    try {
      const savedColors = JSON.parse(savedCustomTheme);
      console.log("   - Couleurs sauvegardées:", savedColors);
      console.log("   - Couleurs cartes définies:", {
        cardTotal: !!savedColors.cardTotal,
        cardPending: !!savedColors.cardPending,
        cardApproved: !!savedColors.cardApproved,
        cardRejected: !!savedColors.cardRejected,
      });
    } catch (error) {
      console.error("   - Erreur lecture couleurs:", error);
    }
  } else {
    console.log("   - Aucune couleur sauvegardée");
  }

  console.log("🔄 Forçage des couleurs appropriées...");
  applyThemeToStatCards();

  // Vérifier si les cartes existent
  const statCards = document.querySelectorAll(".stat-card");
  console.log(`📊 ${statCards.length} cartes trouvées`);

  statCards.forEach((card, index) => {
    const currentBg = card.style.backgroundColor;
    const currentColor = card.style.color;
    console.log(`   Carte ${index + 1}: bg=${currentBg}, text=${currentColor}`);
  });
}

// Fonction pour tester le changement de thème avec persistance des couleurs
function testThemeChange() {
  console.log("🧪 TEST DE CHANGEMENT DE THÈME");
  const currentT = currentTheme;
  console.log("   - Thème actuel:", currentT);

  // Changer de thème
  const newTheme = currentT === "light" ? "dark" : "light";
  console.log("   - Changement vers:", newTheme);

  applyTheme(newTheme);

  setTimeout(() => {
    console.log("   - Nouveau thème appliqué:", currentTheme);
    testColorPersistence();
  }, 1000);
}

// Fonction pour tester spécifiquement les couleurs des icônes
function testIconColors() {
  console.log("🧪 TEST DES COULEURS D'ICÔNES");

  const statCards = document.querySelectorAll(".stat-card");
  console.log(`📊 ${statCards.length} cartes trouvées`);

  statCards.forEach((card, index) => {
    const cardName = ["Total", "En Attente", "Approuvées", "Rejetées"][index];
    const icons = card.querySelectorAll("i, .fa, svg");

    console.log(`   Carte ${cardName}:`);
    console.log(`     - Fond: ${card.style.backgroundColor}`);
    console.log(`     - Texte: ${card.style.color}`);

    icons.forEach((icon, iconIndex) => {
      const iconColor = window.getComputedStyle(icon).color;
      console.log(`     - Icône ${iconIndex + 1}: ${iconColor}`);
    });
  });

  console.log("✅ Test des couleurs d'icônes terminé");
}

// Fonction pour tester spécifiquement les icônes de suppression
function testDeleteIcons() {
  console.log("🗑️ TEST DES ICÔNES DE SUPPRESSION");

  // Rechercher toutes les icônes de suppression possibles
  const deleteSelectors = [
    ".fa-trash",
    ".fa-trash-alt",
    ".fa-delete",
    ".fa-times",
    ".delete-icon",
    ".trash-icon",
    'i[title*="supprimer" i]',
    'i[aria-label*="supprimer" i]',
    ".fa-trash-o",
    ".fa-remove",
  ];

  let totalDeleteIcons = 0;
  let redDeleteIcons = 0;

  deleteSelectors.forEach((selector) => {
    const icons = document.querySelectorAll(selector);
    icons.forEach((icon) => {
      totalDeleteIcons++;
      const iconColor = window.getComputedStyle(icon).color;
      const isRed =
        iconColor.includes("239, 68, 68") ||
        iconColor.includes("#ef4444") ||
        iconColor.includes("rgb(239, 68, 68)");

      console.log(
        `   🗑️ Icône ${selector}: ${iconColor} ${
          isRed ? "✅ ROUGE" : "❌ PAS ROUGE"
        }`
      );

      if (isRed) {
        redDeleteIcons++;
      }
    });
  });

  // Rechercher aussi dans tous les éléments avec des classes FontAwesome
  const allIcons = document.querySelectorAll('i[class*="fa-"]');
  allIcons.forEach((icon) => {
    const classes = icon.className.toLowerCase();
    if (
      classes.includes("trash") ||
      classes.includes("delete") ||
      classes.includes("remove")
    ) {
      totalDeleteIcons++;
      const iconColor = window.getComputedStyle(icon).color;
      const isRed =
        iconColor.includes("239, 68, 68") ||
        iconColor.includes("#ef4444") ||
        iconColor.includes("rgb(239, 68, 68)");

      console.log(
        `   🗑️ Icône FA-delete: ${iconColor} ${
          isRed ? "✅ ROUGE" : "❌ PAS ROUGE"
        }`
      );

      if (isRed) {
        redDeleteIcons++;
      }
    }
  });

  console.log(
    `📊 RÉSUMÉ: ${redDeleteIcons}/${totalDeleteIcons} icônes de suppression en rouge`
  );

  if (totalDeleteIcons === 0) {
    console.log("⚠️ Aucune icône de suppression trouvée dans le DOM");
  } else if (redDeleteIcons === totalDeleteIcons) {
    console.log(
      "✅ Toutes les icônes de suppression sont correctement en rouge"
    );
  } else {
    console.log("❌ Certaines icônes de suppression ne sont pas en rouge");
    // Forcer l'application
    forceDeleteIconsToRed();
    console.log("🔧 Application forcée des couleurs rouges");
  }
}

// Fonction pour tester spécifiquement les icônes blanches
function testWhiteIcons() {
  console.log("⚪ TEST DES ICÔNES BLANCHES");

  // Rechercher toutes les icônes qui doivent être blanches
  const whiteSelectors = [
    ".fa-arrow-right",
    ".fa-arrow-left",
    ".fa-arrow-up",
    ".fa-arrow-down",
    ".fa-chevron-right",
    ".fa-chevron-left",
    ".fa-chevron-up",
    ".fa-chevron-down",
    ".fa-angle-right",
    ".fa-angle-left",
    ".fa-caret-right",
    ".fa-caret-left",
    ".fa-key",
    ".fa-unlock",
    ".fa-lock",
    ".fa-unlock-alt",
    ".fa-user",
    ".fa-user-circle",
    ".fa-user-o",
    ".fa-users",
    ".fa-user-plus",
    ".fa-user-check",
    ".white-icon",
    ".arrow-icon",
    ".key-icon",
    ".user-icon",
    'i[title*="flèche" i]',
    'i[aria-label*="flèche" i]',
    'i[title*="clé" i]',
    'i[aria-label*="clé" i]',
    'i[title*="key" i]',
    'i[aria-label*="key" i]',
    'i[title*="utilisateur" i]',
    'i[aria-label*="utilisateur" i]',
    'i[title*="user" i]',
    'i[aria-label*="user" i]',
  ];

  let totalWhiteIcons = 0;
  let actualWhiteIcons = 0;

  whiteSelectors.forEach((selector) => {
    const icons = document.querySelectorAll(selector);
    icons.forEach((icon) => {
      totalWhiteIcons++;
      const iconColor = window.getComputedStyle(icon).color;
      const isWhite =
        iconColor.includes("255, 255, 255") ||
        iconColor.includes("#ffffff") ||
        iconColor.includes("rgb(255, 255, 255)") ||
        iconColor.includes("white");

      console.log(
        `   ⚪ Icône ${selector}: ${iconColor} ${
          isWhite ? "✅ BLANC" : "❌ PAS BLANC"
        }`
      );

      if (isWhite) {
        actualWhiteIcons++;
      }
    });
  });

  // Rechercher aussi dans tous les éléments avec des classes FontAwesome pour les flèches, clés et utilisateurs
  const allIcons = document.querySelectorAll('i[class*="fa-"]');
  allIcons.forEach((icon) => {
    const classes = icon.className.toLowerCase();
    if (
      classes.includes("arrow") ||
      classes.includes("chevron") ||
      classes.includes("angle") ||
      classes.includes("caret") ||
      classes.includes("key") ||
      classes.includes("lock") ||
      classes.includes("unlock") ||
      classes.includes("user")
    ) {
      totalWhiteIcons++;
      const iconColor = window.getComputedStyle(icon).color;
      const isWhite =
        iconColor.includes("255, 255, 255") ||
        iconColor.includes("#ffffff") ||
        iconColor.includes("rgb(255, 255, 255)") ||
        iconColor.includes("white");

      console.log(
        `   ⚪ Icône FA-white: ${iconColor} ${
          isWhite ? "✅ BLANC" : "❌ PAS BLANC"
        }`
      );

      if (isWhite) {
        actualWhiteIcons++;
      }
    }
  });

  console.log(
    `📊 RÉSUMÉ: ${actualWhiteIcons}/${totalWhiteIcons} icônes en blanc`
  );

  if (totalWhiteIcons === 0) {
    console.log("⚠️ Aucune icône blanche trouvée dans le DOM");
  } else if (actualWhiteIcons === totalWhiteIcons) {
    console.log("✅ Toutes les icônes spécifiées sont correctement en blanc");
  } else {
    console.log("❌ Certaines icônes ne sont pas en blanc");
    // Forcer l'application
    forceSpecificIconsToWhite();
    console.log("🔧 Application forcée des couleurs blanches");
  }
}

// Rendre accessibles globalement
window.testColorPersistence = testColorPersistence;
window.testThemeChange = testThemeChange;
window.testIconColors = testIconColors;
window.testDeleteIcons = testDeleteIcons;
window.testWhiteIcons = testWhiteIcons;

// =================== GESTION PHOTO DE PROFIL ===================

// Ouvrir le modal de changement de photo de profil
function openProfilePhotoModal() {
  const modal = document.getElementById("profilePhotoModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

// Fermer le modal de changement de photo de profil
function closeProfilePhotoModal() {
  const modal = document.getElementById("profilePhotoModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

// Gérer la sélection de fichier photo
function handlePhotoSelection(event) {
  const file = event.target.files[0];
  if (file) {
    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      showNotification(
        "Veuillez sélectionner un fichier image valide",
        "error"
      );
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification(
        "La taille de l'image ne doit pas dépasser 5MB",
        "error"
      );
      return;
    }

    // Lire le fichier et créer un aperçu
    const reader = new FileReader();
    reader.onload = function (e) {
      const imageUrl = e.target.result;

      // Afficher l'aperçu
      const preview = document.getElementById("photoPreview");
      if (preview) {
        preview.src = imageUrl;
        preview.classList.remove("hidden");
      }

      // Activer le bouton de sauvegarde
      const saveBtn = document.getElementById("savePhotoBtn");
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.dataset.imageUrl = imageUrl;
      }
    };
    reader.readAsDataURL(file);
  }
}

// Sauvegarder la nouvelle photo de profil
function saveProfilePhoto() {
  const saveBtn = document.getElementById("savePhotoBtn");
  const imageUrl = saveBtn?.dataset.imageUrl;

  if (imageUrl) {
    userProfileImage = imageUrl;
    localStorage.setItem("userProfileImage", imageUrl);

    // Mettre à jour toutes les images d'avatar
    updateProfileImages();

    closeProfilePhotoModal();
    showNotification("Photo de profil mise à jour!", "success");
  }
}

// Mettre à jour toutes les images de profil dans l'interface
function updateProfileImages() {
  const avatarImages = document.querySelectorAll(".profile-avatar");
  avatarImages.forEach((img) => {
    img.src = userProfileImage;
  });
}

// Supprimer la photo de profil (retour à l'image par défaut)
function removeProfilePhoto() {
  const defaultImage =
    "https://cdn-icons-png.flaticon.com/512/1048/1048953.png";
  userProfileImage = defaultImage;
  localStorage.setItem("userProfileImage", defaultImage);

  updateProfileImages();
  closeProfilePhotoModal();
  showNotification("Photo de profil supprimée", "success");
}

// Fonction pour mettre à jour les statistiques avancées
function updateStatistics() {
  const total = currentRequests.length;
  const pending = currentRequests.filter(
    (req) => req.status === "pending" || req.status === "forgot_code"
  ).length;
  const approved = currentRequests.filter(
    (req) => req.status === "approved"
  ).length;
  const rejected = currentRequests.filter(
    (req) => req.status === "rejected"
  ).length;

  // Statistiques de base
  document.getElementById("totalRequests").textContent = total;
  document.getElementById("pendingRequests").textContent = pending;
  document.getElementById("approvedRequests").textContent = approved;
  document.getElementById("rejectedRequests").textContent = rejected;

  // Calculs avancés
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  document.getElementById("approvalRate").textContent = approvalRate + "%";

  // Demandes d'aujourd'hui
  const today = new Date().toISOString().split("T")[0];
  const todayRequests = currentRequests.filter((req) => {
    const requestDate = new Date(req.created_at).toISOString().split("T")[0];
    return requestDate === today;
  }).length;
  document.getElementById("todayRequests").textContent = todayRequests;

  // Temps de traitement moyen (simulé pour l'instant)
  document.getElementById("avgProcessingTime").textContent = "2h";

  console.log(
    `📊 Statistiques: Total=${total}, En attente=${pending}, Approuvées=${approved}, Rejetées=${rejected}, Aujourd'hui=${todayRequests}`
  );
}

// Fonction pour mettre à jour l'historique journalier
function updateDailyHistory(period = "today") {
  const historyContainer = document.getElementById("dailyHistory");
  if (!historyContainer) return;

  let filteredRequests = [];
  const now = new Date();

  switch (period) {
    case "today":
      const today = now.toISOString().split("T")[0];
      filteredRequests = currentRequests.filter((req) => {
        const requestDate = new Date(req.created_at)
          .toISOString()
          .split("T")[0];
        return requestDate === today;
      });
      break;
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      filteredRequests = currentRequests.filter((req) => {
        const requestDate = new Date(req.created_at)
          .toISOString()
          .split("T")[0];
        return requestDate === yesterdayStr;
      });
      break;
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredRequests = currentRequests.filter((req) => {
        const requestDate = new Date(req.created_at);
        return requestDate >= weekAgo;
      });
      break;
    case "month":
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredRequests = currentRequests.filter((req) => {
        const requestDate = new Date(req.created_at);
        return requestDate >= monthAgo;
      });
      break;
  }

  if (filteredRequests.length === 0) {
    historyContainer.innerHTML =
      '<div class="text-center theme-transition py-4" style="color: var(--text-secondary);">Aucune activité pour cette période</div>';
    return;
  }

  historyContainer.innerHTML = filteredRequests
    .slice(0, 5)
    .map(
      (req) => `
        <div class="timeline-item">
            <div class="text-sm font-medium theme-transition" style="color: var(--text-primary);">${
              req.name
            }</div>
            <div class="text-xs theme-transition" style="color: var(--text-secondary);">${formatDateTime(
              req.created_at
            )}</div>
            <span class="text-xs px-2 py-1 rounded-full ${getStatusClass(
              req.status
            )}">${getStatusText(req.status)}</span>
        </div>
    `
    )
    .join("");
}

// Fonction pour mettre à jour l'activité récente
function updateRecentActivity() {
  const activityContainer = document.getElementById("recentActivity");
  if (!activityContainer) return;

  // Trier par date de création (plus récent en premier)
  const recentRequests = [...currentRequests]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (recentRequests.length === 0) {
    activityContainer.innerHTML =
      '<div class="text-center theme-transition py-4" style="color: var(--text-secondary);">Aucune activité récente</div>';
    return;
  }

  activityContainer.innerHTML = recentRequests
    .map(
      (req) => `
        <div class="timeline-item">
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium theme-transition" style="color: var(--text-primary);">${
                      req.name
                    }</div>
                    <div class="text-xs theme-transition" style="color: var(--text-secondary);">${
                      req.email
                    }</div>
                    <div class="text-xs theme-transition" style="color: var(--text-secondary);">${getRelativeTime(
                      req.created_at
                    )}</div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ${getStatusClass(
                  req.status
                )}">${getStatusText(req.status)}</span>
            </div>
        </div>
    `
    )
    .join("");
}

// Fonction pour obtenir le temps relatif
function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600)
    return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400)
    return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
  return `Il y a ${Math.floor(diffInSeconds / 86400)} jour(s)`;
}

// Fonction pour afficher les demandes avec pagination
function displayRequests() {
  const requestsList = document.getElementById("requestsList");
  const noRequestsDiv = document.getElementById("noRequests");
  const requestsCount = document.getElementById("requestsCount");

  // Réinitialiser la sélection lors du rechargement
  selectedRequests.clear();
  updateSelectionUI();
  updateSelectAllButtonState();

  // Filtrer les demandes selon le filtre actuel
  let filteredRequests = currentRequests;
  if (currentFilter !== "all") {
    filteredRequests = currentRequests.filter((req) => {
      if (currentFilter === "pending") {
        // Le filtre "pending" inclut aussi les demandes "forgot_code"
        return req.status === "pending" || req.status === "forgot_code";
      }
      return req.status === currentFilter;
    });
  }

  // Trier par date de création (plus récent en premier)
  filteredRequests.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

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
    const requestCard = createEnhancedRequestCard(request);
    requestsList.appendChild(requestCard);
  });
}

// Fonction pour créer une carte de demande améliorée
function createEnhancedRequestCard(request) {
  const div = document.createElement("div");
  div.className =
    "access-card bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300";

  const statusClass = getStatusClass(request.status);
  const statusText = getStatusText(request.status);
  const formattedDate = formatDate(request.request_date);
  const createdAt = formatDateTime(request.created_at);
  const relativeTime = getRelativeTime(request.created_at);

  // Déterminer le type de demande et l'icône correspondante
  const requestType = request.request_type || "new_access";
  const typeInfo = getRequestTypeInfo(requestType);

  div.innerHTML = `
        <div class="flex items-start justify-between">
            <!-- 🔲 CHECKBOX DE SÉLECTION -->
            <div class="flex items-center mr-4 mt-2">
                <input
                    type="checkbox"
                    class="request-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    data-request-id="${request.id}"
                    onchange="toggleRequestSelection(this)"
                />
            </div>
            
            <div class="flex-1">
                <div class="flex items-center space-x-3 mb-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas ${typeInfo.icon} text-blue-600"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${
                          request.name
                        }</h3>
                        <div class="flex items-center space-x-2 mt-1">
                            <span class="px-3 py-1 rounded-full text-sm font-medium ${statusClass}">
                                ${statusText}
                            </span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${
                              typeInfo.colorClass
                            }">
                                ${typeInfo.label}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-2 text-sm">
                    <p class="text-gray-600 flex items-center">
                        <i class="fas fa-envelope w-4 mr-3 text-gray-400"></i>
                        <span class="font-medium">${request.email}</span>
                    </p>
                    <p class="text-gray-600 flex items-center">
                        <i class="fas fa-calendar w-4 mr-3 text-gray-400"></i>
                        <span>Demande pour le: <strong>${formattedDate}</strong></span>
                    </p>
                    <p class="text-gray-500 flex items-center">
                        <i class="fas fa-clock w-4 mr-3 text-gray-400"></i>
                        <span>Créée ${relativeTime} (${createdAt})</span>
                    </p>
                    ${
                      request.processed_at
                        ? `
                        <p class="text-gray-500 flex items-center">
                            <i class="fas fa-check w-4 mr-3 text-gray-400"></i>
                            <span>Traitée le: ${formatDateTime(
                              request.processed_at
                            )}</span>
                        </p>`
                        : ""
                    }
                </div>
            </div>
            
            <div class="flex flex-col space-y-2 ml-4">
                ${
                  (request.status === "pending" ||
                    request.status === "forgot_code") &&
                  !(
                    request.actor_type === "responsable-acconier" ||
                    request.request_type === "responsable-acconier" ||
                    request.actorType === "responsable-acconier"
                  )
                    ? `
                    <button 
                        onclick="openProcessModal(${request.id})"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2 transform hover:scale-105"
                        title="Traiter cette demande"
                    >
                        <i class="fas fa-cog"></i>
                        <span>Traiter</span>
                    </button>
                `
                    : ""
                }
                <!-- Le bouton vert apparaît pour TOUTES les demandes (pending, forgot_code ET approved) -->
                ${
                  request.status === "pending" ||
                  request.status === "approved" ||
                  request.status === "forgot_code"
                    ? `
                    <button 
                        onclick="openSendAccessCodeModal(${request.id})"
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2 transform hover:scale-105"
                        title="${
                          request.status === "approved"
                            ? "Renvoyer code d'accès"
                            : "Envoyer code d'accès"
                        }"
                    >
                        <i class="fas fa-paper-plane"></i>
                        <span>${
                          request.status === "approved"
                            ? "Renvoyer Code"
                            : "Envoyer Code"
                        }</span>
                    </button>
                `
                    : ""
                }
                <!-- 🗑️ BOUTON SUPPRIMER INDIVIDUEL -->
                <button 
                    onclick="deleteIndividualRequest(${request.id})"
                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition transform hover:scale-105"
                    title="Supprimer cette demande"
                >
                    <i class="fas fa-trash"></i>
                </button>
                
                <button 
                    onclick="viewRequestDetails(${request.id})"
                    class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition transform hover:scale-105"
                    title="Voir les détails"
                >
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `;

  return div;
}

// Fonction pour renvoyer les identifiants
async function resendCredentials(requestId) {
  if (!confirm("Voulez-vous renvoyer les identifiants à cet utilisateur ?")) {
    return;
  }

  try {
    // Implémenter l'API de renvoi d'identifiants
    showNotification(
      "Fonctionnalité de renvoi en cours de développement",
      "info"
    );
  } catch (error) {
    console.error("❌ Erreur lors du renvoi:", error);
    showNotification("Erreur lors du renvoi des identifiants", "error");
  }
}

// Fonction pour obtenir les informations du type de demande
function getRequestTypeInfo(requestType) {
  const types = {
    new_access: {
      label: "Nouvel accès",
      icon: "fa-user-plus",
      colorClass: "bg-blue-100 text-blue-800",
    },
    forgot_password: {
      label: "Code oublié",
      icon: "fa-key",
      colorClass: "bg-orange-100 text-orange-800",
    },
    forgot_code: {
      label: "Code oublié",
      icon: "fa-key",
      colorClass: "bg-orange-100 text-orange-800",
    },
    access_request: {
      label: "Demande d'accès",
      icon: "fa-user-plus",
      colorClass: "bg-blue-100 text-blue-800",
    },
  };

  return types[requestType] || types.new_access;
}

// Fonction pour ouvrir le modal de traitement (version améliorée)
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

  // Générer un mot de passe sécurisé
  generateSecurePassword();

  // Afficher le modal avec animation
  const modal = document.getElementById("processModal");
  modal.classList.remove("hidden");

  // Ajouter une classe pour l'animation
  setTimeout(() => {
    modal.firstElementChild.style.transform = "scale(1)";
    modal.firstElementChild.style.opacity = "1";
  }, 10);
}

// Fonction pour générer un mot de passe sécurisé
function generateSecurePassword() {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  let password = "";

  // Assurer au moins un caractère de chaque type
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Compléter avec des caractères aléatoires
  const allChars = uppercase + numbers;
  for (let i = 2; i < 6; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Mélanger le mot de passe
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  document.getElementById("generatedPassword").value = password;
}

// Fonctions héritées avec améliorations
function getStatusClass(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "approved":
      return "bg-green-100 text-green-800 border border-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 border border-red-200";
    case "forgot_code":
      return "bg-orange-100 text-orange-800 border border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
}

function getStatusText(status) {
  switch (status) {
    case "pending":
      return "En attente";
    case "approved":
      return "Approuvée";
    case "rejected":
      return "Rejetée";
    case "forgot_code":
      return "Code oublié";
    default:
      return status;
  }
}

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

function formatDate(dateString) {
  if (!dateString) return "Non spécifiée";

  try {
    const date = new Date(dateString);

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn("⚠️ Date invalide:", dateString);
      return "Date invalide";
    }

    return date.toLocaleDateString("fr-FR");
  } catch (error) {
    console.error("❌ Erreur lors du formatage de la date:", error, dateString);
    return "Erreur de date";
  }
}

function formatDateTime(dateString) {
  if (!dateString) return "Non spécifiée";
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR");
}

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

function clearFilter() {
  filterRequests("all");
}

function closeModal() {
  const modal = document.getElementById("processModal");
  const modalContent = modal.firstElementChild;

  // Animation de fermeture
  modalContent.style.transform = "scale(0.9)";
  modalContent.style.opacity = "0";

  setTimeout(() => {
    modal.classList.add("hidden");
    modalContent.style.transform = "scale(1)";
    modalContent.style.opacity = "1";
  }, 200);

  currentRequestId = null;
}

function generatePassword() {
  generateSecurePassword();
}

function copyPassword() {
  const passwordField = document.getElementById("generatedPassword");
  passwordField.select();
  document.execCommand("copy");
  showNotification("Mot de passe copié dans le presse-papiers", "success");
}

async function approveRequest() {
  if (!currentRequestId) return;

  const request = currentRequests.find((req) => req.id === currentRequestId);
  const password = document.getElementById("generatedPassword").value;

  if (!password) {
    showNotification("Veuillez générer un mot de passe", "error");
    return;
  }

  // Désactiver le bouton pendant le traitement
  const approveBtn = document.querySelector(
    'button[onclick="approveRequest()"]'
  );
  const originalText = approveBtn.innerHTML;
  approveBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin mr-2"></i>Traitement...';
  approveBtn.disabled = true;

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
      // Maintenant mettre à jour le statut de la demande vers "approved"
      const updateResponse = await fetch("/api/admin/process-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: currentRequestId,
          action: "approve",
          adminEmail: "admin@its-service.com",
        }),
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        const isOutlookEmail = request.email.toLowerCase().includes("outlook");
        const message = isOutlookEmail
          ? `✅ Demande approuvée avec succès ! Email Outlook envoyé à ${request.email}`
          : "✅ Demande approuvée avec succès ! Email envoyé.";

        console.log(
          `🎉 Approbation réussie pour ${request.email} (Outlook: ${isOutlookEmail})`
        );
        showNotification(message, "success");

        // Pour les comptes Outlook, ajouter une confirmation supplémentaire
        if (isOutlookEmail) {
          setTimeout(() => {
            alert(
              `✅ CONFIRMÉ: Le compte Outlook ${request.email} a été créé avec succès!\n\nLe code d'accès a été envoyé par email.`
            );
          }, 1000);
        }

        closeModal();
        loadAccessRequests(); // Recharger la liste
      } else {
        console.warn(
          "⚠️ Compte créé mais statut non mis à jour:",
          updateData.message
        );
        showNotification(
          "✅ Compte créé mais statut non mis à jour",
          "warning"
        );
        closeModal();
        loadAccessRequests();
      }
    } else {
      showNotification(`❌ Erreur: ${data.message}`, "error");
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'approbation:", error);
    showNotification("❌ Erreur lors de l'approbation", "error");
  } finally {
    // Restaurer le bouton
    approveBtn.innerHTML = originalText;
    approveBtn.disabled = false;
  }
}

async function rejectRequest() {
  if (!currentRequestId) return;

  const reason = prompt("Raison du rejet (optionnel):");
  if (reason === null) return; // Utilisateur a annulé

  if (!confirm("Êtes-vous sûr de vouloir rejeter cette demande ?")) {
    return;
  }

  // Désactiver le bouton pendant le traitement
  const rejectBtn = document.querySelector('button[onclick="rejectRequest()"]');
  if (!rejectBtn) {
    console.error("❌ Bouton reject non trouvé");
    showNotification("❌ Erreur d'interface", "error");
    return;
  }

  const originalText = rejectBtn.innerHTML;
  rejectBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Rejet...';
  rejectBtn.disabled = true;

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
        adminEmail: "admin@its-service.com", // À remplacer par l'email de l'admin connecté
        reason: reason,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showNotification("✅ Demande rejetée avec succès", "success");
      closeModal();
      loadAccessRequests(); // Recharger la liste
    } else {
      showNotification(`❌ Erreur: ${data.message}`, "error");
    }
  } catch (error) {
    console.error("❌ Erreur lors du rejet:", error);
    showNotification("Erreur lors du rejet", "error");
  } finally {
    // Restaurer le bouton
    if (rejectBtn && originalText) {
      rejectBtn.innerHTML = originalText;
      rejectBtn.disabled = false;
    }
  }
}

function viewRequestDetails(requestId) {
  const request = currentRequests.find((req) => req.id === requestId);
  if (!request) {
    console.error("❌ Demande non trouvée:", requestId);
    return;
  }

  // Ouvrir le modal
  const modal = document.getElementById("detailsModal");
  if (!modal) {
    console.error("❌ Modal de détails non trouvé");
    // Fallback vers l'ancienne méthode
    const details = `
Détails de la demande:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 INFORMATIONS UTILISATEUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nom: ${request.name}
Email: ${request.email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 INFORMATIONS DEMANDE  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date de demande: ${formatDate(request.request_date)}
Statut: ${getStatusText(request.status)}
Créée le: ${formatDateTime(request.created_at)}
${
  request.processed_at
    ? `Traitée le: ${formatDateTime(request.processed_at)}`
    : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 IDENTIFIANT DEMANDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: ${request.id}
    `;
    alert(details);
    return;
  }

  // Remplir les informations de base
  document.getElementById("detailsUserName").textContent =
    request.name || "Non renseigné";
  document.getElementById("detailsUserEmail").textContent =
    request.email || "Non renseigné";
  document.getElementById("detailsRequestDate").textContent = formatDate(
    request.request_date
  );
  document.getElementById("detailsCreatedAt").textContent = formatDateTime(
    request.created_at
  );
  document.getElementById("detailsRequestId").textContent = request.id;

  // Gestion de la date de traitement
  const processedContainer = document.getElementById(
    "detailsProcessedAtContainer"
  );
  if (request.processed_at) {
    document.getElementById("detailsProcessedAt").textContent = formatDateTime(
      request.processed_at
    );
    processedContainer.classList.remove("hidden");
  } else {
    processedContainer.classList.add("hidden");
  }

  // Configuration du statut avec couleurs et icônes
  const statusBanner = document.getElementById("detailsStatusBanner");
  const statusIcon = document.getElementById("detailsStatusIcon");
  const statusText = document.getElementById("detailsStatusText");
  const statusSubtext = document.getElementById("detailsStatusSubtext");
  const statusBadge = document.getElementById("detailsStatusBadge");

  switch (request.status) {
    case "pending":
      statusBanner.className =
        "mb-6 p-4 rounded-lg border-l-4 border-l-yellow-500 bg-yellow-50";
      statusIcon.className = "fa fa-clock text-2xl text-yellow-600";
      statusText.textContent = "En Attente de Traitement";
      statusSubtext.textContent =
        "Cette demande est en cours d'analyse par l'équipe d'administration.";
      statusBadge.className =
        "px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800";
      statusBadge.textContent = "EN ATTENTE";
      break;
    case "approved":
      statusBanner.className =
        "mb-6 p-4 rounded-lg border-l-4 border-l-green-500 bg-green-50";
      statusIcon.className = "fa fa-check-circle text-2xl text-green-600";
      statusText.textContent = "Demande Approuvée";
      statusSubtext.textContent =
        "Cette demande a été approuvée et l'accès a été accordé.";
      statusBadge.className =
        "px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800";
      statusBadge.textContent = "APPROUVÉE";
      break;
    case "rejected":
      statusBanner.className =
        "mb-6 p-4 rounded-lg border-l-4 border-l-red-500 bg-red-50";
      statusIcon.className = "fa fa-times-circle text-2xl text-red-600";
      statusText.textContent = "Demande Rejetée";
      statusSubtext.textContent =
        "Cette demande a été rejetée par l'équipe d'administration.";
      statusBadge.className =
        "px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800";
      statusBadge.textContent = "REJETÉE";
      break;
    default:
      statusBanner.className =
        "mb-6 p-4 rounded-lg border-l-4 border-l-gray-500 bg-gray-50";
      statusIcon.className = "fa fa-question-circle text-2xl text-gray-600";
      statusText.textContent = "Statut Inconnu";
      statusSubtext.textContent =
        "Le statut de cette demande n'est pas défini.";
      statusBadge.className =
        "px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800";
      statusBadge.textContent = "INCONNU";
  }

  // Générer l'historique des actions
  generateActionHistory(request);

  // Afficher le modal
  modal.classList.remove("hidden");

  // Ajouter les gestionnaires d'événements pour fermer le modal
  modal.addEventListener("click", handleModalBackdropClick);
  document.addEventListener("keydown", handleModalKeydown);

  // Appliquer les couleurs des icônes après l'affichage
  setTimeout(() => {
    forceSpecificIconsToWhite();
  }, 100);

  console.log("📋 Détails affichés pour la demande:", request.id);
}

// Fonction pour générer l'historique des actions
function generateActionHistory(request) {
  const actionsList = document.getElementById("detailsActionsList");
  actionsList.innerHTML = "";

  const actions = [];

  // Action de création
  actions.push({
    icon: "fa fa-plus-circle text-blue-600",
    title: "Demande créée",
    description: `Demande d'accès soumise par ${request.name}`,
    date: request.created_at,
    type: "creation",
  });

  // Action de traitement si elle existe
  if (request.processed_at) {
    const actionType = request.status === "approved" ? "approval" : "rejection";
    actions.push({
      icon:
        request.status === "approved"
          ? "fa fa-check-circle text-green-600"
          : "fa fa-times-circle text-red-600",
      title:
        request.status === "approved" ? "Demande approuvée" : "Demande rejetée",
      description: `La demande a été ${
        request.status === "approved" ? "approuvée" : "rejetée"
      } par l'administration`,
      date: request.processed_at,
      type: actionType,
    });
  }

  // Trier les actions par date (plus récent en premier)
  actions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Créer les éléments HTML pour chaque action
  actions.forEach((action, index) => {
    const actionElement = document.createElement("div");
    actionElement.className =
      "flex items-start space-x-3 p-3 rounded-lg border bg-white";

    actionElement.innerHTML = `
      <div class="flex-shrink-0 mt-1">
        <i class="${action.icon}"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h5 class="font-medium text-gray-900">${action.title}</h5>
          <span class="text-xs text-gray-500">${formatDateTime(
            action.date
          )}</span>
        </div>
        <p class="text-sm text-gray-600 mt-1">${action.description}</p>
      </div>
    `;

    actionsList.appendChild(actionElement);
  });

  // Si aucune action de traitement, ajouter un message
  if (actions.length === 1) {
    const pendingElement = document.createElement("div");
    pendingElement.className =
      "flex items-start space-x-3 p-3 rounded-lg border border-dashed border-yellow-300 bg-yellow-50";

    pendingElement.innerHTML = `
      <div class="flex-shrink-0 mt-1">
        <i class="fa fa-hourglass-half text-yellow-600"></i>
      </div>
      <div class="flex-1 min-w-0">
        <h5 class="font-medium text-yellow-800">En attente de traitement</h5>
        <p class="text-sm text-yellow-700 mt-1">La demande est en cours d'analyse par l'équipe d'administration.</p>
      </div>
    `;

    actionsList.appendChild(pendingElement);
  }
}

// Fonction pour fermer le modal de détails
function closeDetailsModal() {
  const modal = document.getElementById("detailsModal");
  if (modal) {
    modal.classList.add("hidden");
    console.log("📋 Modal de détails fermé");

    // Nettoyer les gestionnaires d'événements
    modal.removeEventListener("click", handleModalBackdropClick);
    document.removeEventListener("keydown", handleModalKeydown);
  }
}

// Gestionnaire d'événements pour fermer le modal en cliquant à l'extérieur
function handleModalBackdropClick(event) {
  const modal = document.getElementById("detailsModal");
  const modalContent = modal.querySelector(".bg-white, .bg-gray-800");

  // Fermer seulement si on clique sur le backdrop, pas sur le contenu
  if (event.target === modal || !modalContent.contains(event.target)) {
    closeDetailsModal();
  }
}

// Gestionnaire d'événements pour fermer le modal avec la touche Escape
function handleModalKeydown(event) {
  if (event.key === "Escape") {
    closeDetailsModal();
  }
}

function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");

  // Vérification si les éléments existent
  if (!notification || !notificationText) {
    console.warn("⚠️ Éléments de notification non trouvés dans le DOM");
    alert(message); // Fallback avec alerte visible
    return;
  }

  console.log(`🔔 Affichage notification: [${type.toUpperCase()}] ${message}`);

  notificationText.textContent = message;

  // Changer la couleur et l'icône selon le type
  notification.className =
    "fixed top-4 right-4 z-50 transform transition-all duration-300";
  let bgClass = "";
  let icon = "";

  switch (type) {
    case "success":
      bgClass = "bg-green-500";
      icon = '<i class="fas fa-check-circle mr-2"></i>';
      break;
    case "error":
      bgClass = "bg-red-500";
      icon = '<i class="fas fa-exclamation-circle mr-2"></i>';
      break;
    case "info":
      bgClass = "bg-blue-500";
      icon = '<i class="fas fa-info-circle mr-2"></i>';
      break;
    case "warning":
      bgClass = "bg-yellow-500";
      icon = '<i class="fas fa-exclamation-triangle mr-2"></i>';
      break;
  }

  notification.innerHTML = `
        <div class="${bgClass} text-white px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 border-2 border-white" style="min-width: 300px; max-width: 500px;">
            ${icon}${message}
        </div>
    `;

  notification.classList.remove("hidden");
  notification.style.transform = "translateX(100%)";
  notification.style.zIndex = "9999"; // Z-index très élevé

  // Animation d'entrée
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 10);

  // Pour les comptes Outlook et les approbations importantes, garder plus longtemps
  const isOutlookOrApproval =
    message.includes("outlook") ||
    message.includes("Outlook") ||
    message.includes("approuvé") ||
    message.includes("Email envoyé");
  const displayTime = isOutlookOrApproval ? 8000 : 5000; // 8 secondes pour Outlook/approbations, 5 pour les autres

  console.log(`⏰ Notification affichée pour ${displayTime / 1000} secondes`);

  // Animation de sortie
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      notification.classList.add("hidden");
      console.log("🔔 Notification masquée");
    }, 300);
  }, displayTime);
}

function logout() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    window.location.href = "/html/admin-login.html";
  }
}

// Fonctions de contrôle de l'actualisation automatique
function stopAutoRefresh() {
  isAutoRefreshEnabled = false;
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  console.log("⏸️ Actualisation automatique désactivée");
  showNotification("Actualisation automatique désactivée", "info");
}

function resumeAutoRefresh() {
  isAutoRefreshEnabled = true;
  startAutoRefresh();
  console.log("▶️ Actualisation automatique réactivée");
  showNotification("Actualisation automatique réactivée", "success");
}

function forceRefresh() {
  lastDataHash = null; // Force la mise à jour
  loadAccessRequests();
  console.log("🔄 Actualisation forcée");
}

// Exposer les fonctions de contrôle dans la console pour debug
window.accessManagement = {
  stop: stopAutoRefresh,
  start: resumeAutoRefresh,
  refresh: forceRefresh,
  status: () =>
    console.log(
      `Auto-refresh: ${isAutoRefreshEnabled ? "ON" : "OFF"}, Requests: ${
        currentRequests.length
      }`
    ),
};

// Écouter les clics en dehors du modal pour le fermer
document.addEventListener("click", function (event) {
  const modal = document.getElementById("processModal");
  if (event.target === modal) {
    closeModal();
  }
});

// Fonction pour basculer l'actualisation automatique
function toggleAutoRefresh() {
  isAutoRefreshEnabled = !isAutoRefreshEnabled;
  if (isAutoRefreshEnabled) {
    startAutoRefresh();
    showNotification("Actualisation automatique activée", "info");
  } else {
    clearInterval(autoRefreshInterval);
    showNotification("Actualisation automatique désactivée", "warning");
  }
}

// === NOUVELLES FONCTIONS POUR L'ENVOI DE CODE D'ACCÈS ===

// Variable globale pour stocker l'ID de la demande en cours de traitement
let currentSendRequestId = null;

// Fonction pour ouvrir la modal d'envoi de code d'accès
function openSendAccessCodeModal(requestId) {
  currentSendRequestId = requestId;
  const request = currentRequests.find((req) => req.id === requestId);

  if (!request) {
    showNotification("Demande non trouvée", "error");
    return;
  }

  // Remplir les champs du modal
  document.getElementById("sendModalUserName").textContent = request.name;
  document.getElementById("sendModalUserEmail").textContent = request.email;
  document.getElementById("sendUserEmailInput").value = request.email;

  // Afficher le type de demande
  const typeInfo = getRequestTypeInfo(request.request_type || "new_access");
  const typeElement = document.getElementById("sendModalRequestType");
  typeElement.textContent = typeInfo.label;
  typeElement.className = `px-2 py-1 rounded-full text-xs font-medium ${typeInfo.colorClass}`;

  // Générer un nouveau code d'accès
  generateNewAccessCode();

  // Afficher le modal
  const modal = document.getElementById("sendAccessCodeModal");
  modal.classList.remove("hidden");
}

// Fonction pour fermer la modal d'envoi de code d'accès
function closeSendAccessCodeModal() {
  const modal = document.getElementById("sendAccessCodeModal");
  modal.classList.add("hidden");
  currentSendRequestId = null;

  // Réinitialiser le formulaire
  document.getElementById("newAccessCode").value = "";
  document.getElementById("sendAccessCodeText").classList.remove("hidden");
  document.getElementById("sendAccessCodeLoading").classList.add("hidden");
  document.getElementById("sendAccessCodeBtn").disabled = false;
}

// Fonction pour générer un nouveau code d'accès
function generateNewAccessCode() {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";

  let password = "";

  // Assurer au moins un caractère de chaque type
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Compléter avec des caractères aléatoires (8 caractères au total)
  const allChars = uppercase + numbers;
  for (let i = 2; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Mélanger le mot de passe
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  document.getElementById("newAccessCode").value = password;
}

// Fonction pour copier le nouveau code d'accès
function copyNewAccessCode() {
  const codeInput = document.getElementById("newAccessCode");
  codeInput.select();
  codeInput.setSelectionRange(0, 99999); // Pour mobile

  try {
    document.execCommand("copy");
    showNotification("Code d'accès copié dans le presse-papiers", "success");
  } catch (err) {
    console.error("Erreur lors de la copie:", err);
    showNotification("Erreur lors de la copie", "error");
  }
}

// Fonction pour envoyer le code d'accès par email
async function sendAccessCodeByEmail() {
  if (!currentSendRequestId) {
    showNotification("Aucune demande sélectionnée", "error");
    return;
  }

  const newPassword = document.getElementById("newAccessCode").value;
  if (!newPassword) {
    showNotification("Veuillez générer un code d'accès", "error");
    return;
  }

  // Afficher le chargement
  document.getElementById("sendAccessCodeText").classList.add("hidden");
  document.getElementById("sendAccessCodeLoading").classList.remove("hidden");
  document.getElementById("sendAccessCodeBtn").disabled = true;

  try {
    const response = await fetch("/api/admin/send-access-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: currentSendRequestId,
        newPassword: newPassword,
        adminEmail: "admin@itsservice.com", // Vous pouvez récupérer l'email admin du localStorage si nécessaire
      }),
    });

    const data = await response.json();

    if (data.success) {
      showNotification("Code d'accès envoyé avec succès !", "success");
      closeSendAccessCodeModal();

      // Recharger les demandes pour mettre à jour le statut
      await loadAccessRequests();
    } else {
      throw new Error(data.message || "Erreur lors de l'envoi");
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du code d'accès:", error);
    showNotification(`Erreur: ${error.message}`, "error");
  } finally {
    // Cacher le chargement
    document.getElementById("sendAccessCodeText").classList.remove("hidden");
    document.getElementById("sendAccessCodeLoading").classList.add("hidden");
    document.getElementById("sendAccessCodeBtn").disabled = false;
  }
}

// Ajouter les gestionnaires d'événements pour fermer les modales en cliquant à l'extérieur
document.addEventListener("click", function (event) {
  const sendModal = document.getElementById("sendAccessCodeModal");
  if (event.target === sendModal) {
    closeSendAccessCodeModal();
  }
});

// =================== FONCTIONNALITÉS DE SUPPRESSION ===================

let selectedRequests = new Set(); // Utiliser un Set pour éviter les doublons

// =================== FONCTIONNALITÉS AVATAR UTILISATEUR ===================

// Fonction pour basculer l'affichage du profil utilisateur
function toggleUserProfile() {
  const userProfile = document.getElementById("userProfilePopup");
  if (userProfile && userProfile.classList.contains("hidden")) {
    userProfile.classList.remove("hidden");
    // Charger les données utilisateur si nécessaire
    loadUserProfileData();
  } else if (userProfile) {
    userProfile.classList.add("hidden");
  }
}

// Fonction pour charger les données du profil utilisateur
function loadUserProfileData() {
  try {
    // Récupérer les informations de l'admin depuis le localStorage (données de connexion)
    const adminUserData = localStorage.getItem("adminUser");
    let adminData;

    if (adminUserData) {
      // Utiliser les données réelles de la connexion
      const userData = JSON.parse(adminUserData);
      adminData = {
        name: userData.name || "Administrateur ITS",
        email: userData.email || "admin@itsservice.com",
        role: "Administrateur",
        lastLogin: userData.loginTime
          ? formatDateTime(new Date(userData.loginTime))
          : formatDateTime(new Date()),
        accessLevel: "Complet",
      };
    } else {
      // Données par défaut si pas de connexion
      adminData = {
        name: "Administrateur ITS",
        email: "admin@itsservice.com",
        role: "Super Admin",
        lastLogin: formatDateTime(new Date()),
        accessLevel: "Complet",
      };
    }

    // Mettre à jour l'affichage avec les vrais IDs du HTML .
    const adminNameEl = document.getElementById("adminName");
    const adminRoleEl = document.getElementById("adminRole");
    const profileNameEl = document.getElementById("profileName");
    const profileEmailEl = document.getElementById("profileEmail");
    const lastLoginTimeEl = document.getElementById("lastLoginTime");

    if (adminNameEl) adminNameEl.textContent = adminData.name;
    if (adminRoleEl) adminRoleEl.textContent = adminData.role;
    if (profileNameEl) profileNameEl.textContent = adminData.name;
    if (profileEmailEl) profileEmailEl.textContent = adminData.email;
    if (lastLoginTimeEl) lastLoginTimeEl.textContent = adminData.lastLogin;

    // Mettre à jour les photos de profil
    updateProfileImages();

    // Mettre à jour l'icône du thème (au cas où elle ne se serait pas mise à jour)
    updateThemeIcon();

    console.log("✅ Profil utilisateur chargé:", adminData);
  } catch (error) {
    console.error("❌ Erreur lors du chargement du profil:", error);
  }
}

// Fonction de déconnexion
function logout() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    // Nettoyer les données de session
    localStorage.removeItem("adminSession");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("isAdminLoggedIn");
    sessionStorage.clear();

    console.log("🚪 Déconnexion effectuée, redirection vers login...");

    // Rediriger vers la page de connexion
    window.location.href = "/html/admin-login.html";
  }
}

// Fonction pour basculer la sélection de toutes les checkboxes
function toggleAllCheckboxes(masterCheckbox) {
  const checkboxes = document.querySelectorAll(".request-checkbox");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = masterCheckbox.checked;
    if (masterCheckbox.checked) {
      selectedRequests.add(checkbox.dataset.requestId);
    } else {
      selectedRequests.delete(checkbox.dataset.requestId);
    }
  });
  updateSelectionUI();
}

// Fonction pour gérer la sélection individuelle
function toggleRequestSelection(checkbox) {
  const requestId = checkbox.dataset.requestId;
  if (checkbox.checked) {
    selectedRequests.add(requestId);
  } else {
    selectedRequests.delete(requestId);
  }

  // Mettre à jour l'état du bouton "Tout Sélectionner" (pas besoin de masterCheckbox)
  updateSelectAllButtonState();
  updateSelectionUI();
}

// Fonction pour mettre à jour l'état du bouton "Tout Sélectionner"
function updateSelectAllButtonState() {
  const selectAllBtn = document.getElementById("selectAllBtn");
  const allCheckboxes = document.querySelectorAll(".request-checkbox");
  const checkedBoxes = document.querySelectorAll(".request-checkbox:checked");

  if (selectAllBtn) {
    if (
      checkedBoxes.length === allCheckboxes.length &&
      allCheckboxes.length > 0
    ) {
      selectAllBtn.innerHTML =
        '<i class="fas fa-square mr-2"></i>Tout Désélectionner';
    } else {
      selectAllBtn.innerHTML =
        '<i class="fas fa-check-square mr-2"></i>Tout Sélectionner';
    }
  }
}

// Fonction pour mettre à jour l'interface de sélection
function updateSelectionUI() {
  const selectedCount = selectedRequests.size;
  const selectedCountElement = document.getElementById("selectedCount");
  const deleteButton = document.getElementById("deleteSelectedBtn");

  if (selectedCount > 0) {
    selectedCountElement.textContent = `${selectedCount} sélectionnée(s)`;
    selectedCountElement.classList.remove("hidden");
    deleteButton.classList.remove("hidden");
  } else {
    selectedCountElement.classList.add("hidden");
    deleteButton.classList.add("hidden");
  }
}

// Fonction pour sélectionner/désélectionner tout
function toggleSelectAll() {
  const checkboxes = document.querySelectorAll(".request-checkbox");

  if (selectedRequests.size === checkboxes.length && checkboxes.length > 0) {
    // Tout désélectionner
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
      selectedRequests.delete(checkbox.dataset.requestId);
    });
  } else {
    // Tout sélectionner
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      selectedRequests.add(checkbox.dataset.requestId);
    });
  }

  updateSelectAllButtonState();
  updateSelectionUI();
}

// Fonction principale pour supprimer les demandes sélectionnées
async function deleteSelectedRequests() {
  if (selectedRequests.size === 0) {
    showNotification("Aucune demande sélectionnée", "warning");
    return;
  }

  // Confirmation de suppression
  const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedRequests.size} demande(s) sélectionnée(s) ?\n\nCette action est irréversible.`;

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    console.log("🗑️ Suppression de", selectedRequests.size, "demandes...");

    // Afficher un indicateur de chargement
    const deleteButton = document.getElementById("deleteSelectedBtn");
    const originalText = deleteButton.innerHTML;
    deleteButton.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Suppression...';
    deleteButton.disabled = true;

    // Envoyer la requête de suppression au serveur
    const response = await fetch("/api/admin/delete-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestIds: Array.from(selectedRequests),
      }),
    });

    const data = await response.json();

    if (data.success) {
      showNotification(
        `${selectedRequests.size} demande(s) supprimée(s) avec succès`,
        "success"
      );

      // Réinitialiser la sélection
      selectedRequests.clear();
      const masterCheckbox = document.getElementById("masterCheckbox");
      masterCheckbox.checked = false;
      masterCheckbox.indeterminate = false;

      // Recharger les demandes
      await loadAccessRequests();
    } else {
      throw new Error(data.message || "Erreur lors de la suppression");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error);
    showNotification(`Erreur: ${error.message}`, "error");
  } finally {
    // Restaurer le bouton
    const deleteButton = document.getElementById("deleteSelectedBtn");
    deleteButton.innerHTML = originalText;
    deleteButton.disabled = false;
    updateSelectionUI();
  }
}

// Fonction pour supprimer une demande individuelle
async function deleteIndividualRequest(requestId) {
  const confirmMessage =
    "Êtes-vous sûr de vouloir supprimer cette demande ?\n\nCette action est irréversible.";

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    console.log("🗑️ Suppression de la demande:", requestId);

    const response = await fetch("/api/admin/delete-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestIds: [requestId],
      }),
    });

    const data = await response.json();

    if (data.success) {
      showNotification("Demande supprimée avec succès", "success");

      // Retirer de la sélection si elle était sélectionnée
      selectedRequests.delete(requestId);
      updateSelectionUI();

      // Recharger les demandes
      await loadAccessRequests();
    } else {
      throw new Error(data.message || "Erreur lors de la suppression");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error);
    showNotification(`Erreur: ${error.message}`, "error");
  }
}

// =================== FONCTIONS DE TEST GLOBAL ===================
// Fonction de test que vous pouvez appeler depuis la console
window.testThemeModal = function () {
  console.log("🧪 Test du modal de thème...");
  const modal = document.getElementById("themeCustomizerModal");
  console.log("🧪 Modal element:", modal);

  if (modal) {
    console.log("🧪 Classes initiales:", modal.className);
    console.log("🧪 Style display initial:", modal.style.display);

    // Test d'ouverture
    modal.classList.remove("hidden");
    modal.style.display = "flex";

    console.log("🧪 Classes après ouverture:", modal.className);
    console.log("🧪 Style display après ouverture:", modal.style.display);

    // Test avec timeout pour fermer
    setTimeout(() => {
      modal.classList.add("hidden");
      modal.style.display = "none";
      console.log("🧪 Modal fermé automatiquement après 3 secondes");
    }, 3000);
  } else {
    console.error("🧪 ❌ Modal non trouvé!");
  }
};

// Test de toutes les fonctions de thème
window.testAllThemeFunctions = function () {
  console.log("🧪 Test de toutes les fonctions de thème...");
  console.log("🧪 currentTheme:", currentTheme);
  console.log("🧪 customThemeData:", customThemeData);
  console.log("🧪 userProfileImage:", userProfileImage);

  // Test toggle theme
  console.log("🧪 Test toggleTheme...");
  try {
    toggleTheme();
    console.log("🧪 ✅ toggleTheme fonctionne");
  } catch (e) {
    console.error("🧪 ❌ toggleTheme erreur:", e);
  }

  // Test open customizer
  console.log("🧪 Test openThemeCustomizer...");
  try {
    openThemeCustomizer();
    console.log("🧪 ✅ openThemeCustomizer fonctionne");
  } catch (e) {
    console.error("🧪 ❌ openThemeCustomizer erreur:", e);
  }
};
