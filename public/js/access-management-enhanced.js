// Variables globales
let currentRequests = [];
let currentRequestId = null;
let currentFilter = "all";
let autoRefreshInterval;
let isAutoRefreshEnabled = true;
let lastDataHash = null; // Pour éviter les rechargements inutiles

// =================== SYSTÈME DE THÈME ===================
let currentTheme = localStorage.getItem("theme") || "light";
let customThemeData = JSON.parse(localStorage.getItem("customTheme")) || {
  primary: "#3b82f6",
  secondary: "#1f2937",
  accent: "#f59e0b",
  background: "#ffffff",
  surface: "#f9fafb",
};

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

    // Démarrer l'actualisation automatique
    startAutoRefresh();

    // Initialiser les événements
    initializeEventListeners();

    // Débogage des boutons de thème après initialisation complète
    setTimeout(() => {
      debugThemeButtons();
    }, 500);

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

  localStorage.setItem("adminUser", JSON.stringify(testUserData));
  localStorage.setItem("isAdminLoggedIn", "true");

  console.log("🧪 Données de test simulées:", testUserData);
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
  // Appliquer le thème sauvegardé
  applyTheme(currentTheme);

  // Appliquer les couleurs personnalisées si nécessaire
  if (currentTheme === "custom") {
    applyCustomTheme(customThemeData);
  }

  // Mettre à jour l'icône du bouton de thème avec un délai pour s'assurer que le DOM est chargé
  setTimeout(() => {
    updateThemeIcon();
    // Appliquer le thème aux headers après que le DOM soit complètement chargé
    applyThemeToHeaders();
  }, 200);

  console.log(`🎨 Thème initialisé: ${currentTheme}`);
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
      break;

    case "custom":
      body.classList.add("theme-custom");
      applyCustomTheme(customThemeData);
      break;
  }

  currentTheme = theme;
  localStorage.setItem("theme", theme);

  // Appliquer immédiatement le thème aux éléments spécifiques
  applyThemeToHeaders();
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

  customThemeData = themeData;
  localStorage.setItem("customTheme", JSON.stringify(themeData));

  // Appliquer immédiatement aux headers
  applyThemeToHeaders();
  console.log("✅ Thème personnalisé appliqué");
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

// Basculer entre les thèmes
function toggleTheme() {
  console.log("🎨 toggleTheme appelé, thème actuel:", currentTheme);

  try {
    let newTheme;
    switch (currentTheme) {
      case "light":
        newTheme = "dark";
        break;
      case "dark":
        newTheme = "light";
        break;
      default:
        newTheme = "light";
    }

    console.log("🎨 Changement vers le thème:", newTheme);
    applyTheme(newTheme);
    updateThemeIcon();

    // Afficher une notification simple
    try {
      showNotification(
        `Thème changé vers: ${newTheme === "light" ? "Clair" : "Sombre"}`,
        "success"
      );
    } catch (error) {
      console.log("🎨 Thème changé vers:", newTheme);
    }
  } catch (error) {
    console.error("❌ Erreur dans toggleTheme:", error);
  }
}

// Mettre à jour l'icône du bouton de thème
function updateThemeIcon() {
  console.log(`🔄 Mise à jour de l'icône pour le thème: ${currentTheme}`);

  // Chercher le bouton de thème de plusieurs façons
  const themeButton = document.querySelector('[onclick="toggleTheme()"]');
  const themeIcon = themeButton ? themeButton.querySelector("i") : null;

  if (!themeIcon) {
    console.warn("⚠️ Bouton de thème non trouvé dans le DOM");
    return;
  }

  if (currentTheme === "dark") {
    themeIcon.className = "fas fa-sun text-yellow-400";
    console.log("🌞 Icône changée vers soleil (mode sombre actif)");
  } else {
    themeIcon.className = "fas fa-moon text-yellow-400";
    console.log("🌙 Icône changée vers lune (mode clair actif)");
  }
}

// =================== FONCTION DE TEST POUR LE THÈME ===================
function testThemeSystem() {
  console.log("🧪 Test du système de thème");
  console.log("Thème actuel:", currentTheme);

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

// Rendre la fonction accessible globalement pour les tests
window.testThemeSystem = testThemeSystem;

// =================== FONCTIONS GLOBALES POUR TESTS ===================
// Rendre les fonctions accessibles globalement pour le débogage
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
window.updateThemeIcon = updateThemeIcon;
window.openThemeCustomizer = openThemeCustomizer;
window.closeThemeCustomizer = closeThemeCustomizer;

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

    console.log("🎨 Éléments de couleur trouvés:", {
      primaryColor: !!primaryColor,
      secondaryColor: !!secondaryColor,
      accentColor: !!accentColor,
      backgroundColor: !!backgroundColor,
      surfaceColor: !!surfaceColor,
    });

    if (primaryColor) primaryColor.value = customThemeData.primary;
    if (secondaryColor) secondaryColor.value = customThemeData.secondary;
    if (accentColor) accentColor.value = customThemeData.accent;
    if (backgroundColor) backgroundColor.value = customThemeData.background;
    if (surfaceColor) surfaceColor.value = customThemeData.surface;

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
  };

  console.log("🎨 Nouvelles couleurs:", newTheme);

  // Forcer le changement vers le thème personnalisé
  currentTheme = "custom";
  customThemeData = newTheme;

  applyTheme("custom");
  applyCustomTheme(newTheme);

  // Forcer la mise à jour de l'interface
  setTimeout(() => {
    applyThemeToHeaders();
    updateThemeIcon();
  }, 100);

  closeThemeCustomizer();
  showNotification("Thème personnalisé appliqué avec succès!", "success");
}

// Réinitialiser les couleurs par défaut
function resetToDefaultColors() {
  const defaultTheme = {
    primary: "#3b82f6",
    secondary: "#1f2937",
    accent: "#f59e0b",
    background: "#ffffff",
    surface: "#f9fafb",
  };

  applyCustomTheme(defaultTheme);

  // Mettre à jour les champs du formulaire
  document.getElementById("primaryColor").value = defaultTheme.primary;
  document.getElementById("secondaryColor").value = defaultTheme.secondary;
  document.getElementById("accentColor").value = defaultTheme.accent;
  document.getElementById("backgroundColor").value = defaultTheme.background;
  document.getElementById("surfaceColor").value = defaultTheme.surface;

  showNotification("Couleurs réinitialisées!", "success");
}

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
                  request.status === "pending" ||
                  request.status === "forgot_code"
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
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR");
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
  if (!request) return;

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
