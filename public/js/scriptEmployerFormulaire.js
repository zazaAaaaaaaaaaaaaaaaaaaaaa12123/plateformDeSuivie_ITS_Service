// --- DÉCLARATION DES VARIABLES GLOBALES AVANT TOUTE FONCTION ---
// --- Animation d'intro avant le formulaire ---
window.addEventListener("DOMContentLoaded", function () {
  var intro = document.getElementById("introAnimation");
  var app = document.getElementById("appContainer");
  var progress = document.getElementById("introProgressBar");
  if (intro && app && progress) {
    let duration = 5000; // 5 secondes
    let interval = 50;
    let elapsed = 0;
    let timer = setInterval(function () {
      elapsed += interval;
      let percent = Math.min(100, Math.round((elapsed / duration) * 100));
      progress.style.width = percent + "%";
      if (elapsed >= duration) {
        clearInterval(timer);
        intro.style.display = "none";
        app.style.display = "";
      }
    }, interval);
  }
});
// Toutes les variables liées au code d'entreprise ont été supprimées
const deliveryFormSection = document.getElementById("deliveryFormSection");
const deliveryForm = document.getElementById("deliveryForm");
const employeeNameInput = document.getElementById("employeeName");
const clientNameInput = document.getElementById("clientName");
const clientPhoneInput = document.getElementById("clientPhone");
const containerTypeAndContentInput = document.getElementById(
  "containerTypeAndContent"
);
const lieuInput = document.getElementById("lieu");
const containerNumberInput = document.getElementById("containerNumber");
let containerTags = [];
let containerTagsContainer = null;
let containerTagsInput = null;
const containerFootTypeSelect = document.getElementById("containerFootType");
let containerFootTypes = [];
let containerFootTypesContainer = null;
let containerWeights = []; // Tableau des poids par TC
const blNumberInput = document.getElementById("blNumber");
const dossierNumberInput = document.getElementById("dossierNumber");
const shippingCompanyInput = document.getElementById("shippingCompany");
const declarationNumberInput = document.getElementById("declarationNumber");
const numberOfContainersInput = document.getElementById("numberOfContainers");
const weightInput = document.getElementById("weight");
const shipNameInput = document.getElementById("shipName");
const circuitInput = document.getElementById("circuit");
const transporterModeSelect = document.getElementById("transporterMode");

const formErrorDisplay = document.getElementById("formError");
const formSuccessDisplay = document.getElementById("formSuccess");
const cancelSubmitBtn = document.getElementById("cancelSubmitBtn");
let countdownInterval;
let countdownTime = 3; // secondes

// --- GESTION DES NUMÉROS BL UTILISÉS 11---
// Stockage des numéros BL déjà utilisés pour éviter les doublons
let usedBLNumbers = [];

// Fonction pour charger les numéros BL existants depuis localStorage au démarrage
function loadUsedBLNumbers() {
  try {
    const savedBLNumbers = localStorage.getItem("used_bl_numbers");
    if (savedBLNumbers) {
      usedBLNumbers = JSON.parse(savedBLNumbers);
    }
  } catch (error) {
    console.warn("Erreur lors du chargement des numéros BL:", error);
    usedBLNumbers = [];
  }
}

// Fonction pour sauvegarder un nouveau numéro BL
function saveBLNumber(blNumber) {
  if (blNumber && blNumber.trim() && !usedBLNumbers.includes(blNumber.trim())) {
    usedBLNumbers.push(blNumber.trim());
    try {
      localStorage.setItem("used_bl_numbers", JSON.stringify(usedBLNumbers));
    } catch (error) {
      console.warn("Erreur lors de la sauvegarde du numéro BL:", error);
    }
  }
}

// Fonction pour vérifier si un numéro BL est déjà utilisé
function isBLNumberUsed(blNumber) {
  return blNumber && blNumber.trim() && usedBLNumbers.includes(blNumber.trim());
}

// Fonction pour réinitialiser la liste des numéros BL (utilitaire pour le développement/test)
function resetUsedBLNumbers() {
  usedBLNumbers = [];
  try {
    localStorage.removeItem("used_bl_numbers");
    console.log("Liste des numéros BL réinitialisée avec succès.");
  } catch (error) {
    console.warn("Erreur lors de la réinitialisation des numéros BL:", error);
  }
}

// Ce script gère le formulaire de validation de livraison pour l'employé.
// Il gère la saisie du code d'entreprise et la soumission des données de livraison.

// --- AFFICHAGE HISTORIQUE & AVATAR ---
/**
 * Affiche l'historique des ordres de livraison pour l'agent acconier.
 * @param {string} agentKey - Le nom de l'agent (ex: "Agent Acconier")
 */
window.displayAgentHistory = function (agentKey = "Agent Acconier") {
  const historyContainer = document.getElementById("agentHistoryContainer");
  if (!historyContainer) return;
  const historyKey = "simulatedHistoryData";
  let historyData = JSON.parse(localStorage.getItem(historyKey)) || {};
  let agentHistory = historyData[agentKey] || [];
  if (agentHistory.length === 0) {
    historyContainer.innerHTML =
      '<div class="text-gray-500" style="padding:12px;">Aucun ordre de livraison enregistré pour le moment.</div>';
    return;
  }
  let html = '<ul style="list-style:none;padding:0;margin:0;">';
  agentHistory.forEach((item) => {
    html += `<li style="background:#f1f5f9;margin-bottom:10px;padding:10px 14px;border-radius:8px;box-shadow:0 1px 4px #2563eb11;display:flex;align-items:center;gap:10px;">
      <span style="background:#2563eb;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1em;">${item.date.slice(
        5,
        10
      )}</span>
      <span style="flex:1;">${item.details}</span>
    </li>`;
  });
  html += "</ul>";
  historyContainer.innerHTML = html;
};

/**
 * Affiche l'avatar de profil de l'utilisateur (initiales ou image par défaut).
 */
// Affiche l'avatar de l'acconier connecté (nom/email depuis la connexion acconier)
window.displayProfileAvatar = function () {
  const avatarContainer = document.getElementById("profileAvatarContainer");
  if (!avatarContainer) return;
  let acconier = JSON.parse(localStorage.getItem("acconier_user")) || {};
  let initials = "?";
  if (acconier.nom) {
    initials = acconier.nom
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  // Responsive
  const isMobile =
    window.matchMedia && window.matchMedia("(max-width: 600px)").matches;
  let avatarHtml = "";
  if (acconier.avatar) {
    avatarHtml = `<img src="${acconier.avatar}" alt="Avatar" style="width:${
      isMobile ? "38px" : "54px"
    };height:${
      isMobile ? "38px" : "54px"
    };border-radius:50%;object-fit:cover;border:2px solid #2563eb;box-shadow:0 2px 8px #2563eb22;">`;
  } else {
    avatarHtml = `<div style=\"width:${isMobile ? "38px" : "54px"};height:${
      isMobile ? "38px" : "54px"
    };border-radius:50%;background:linear-gradient(135deg,#2563eb 60%,#06b6d4 100%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:${
      isMobile ? "1.15em" : "1.7em"
    };font-weight:bold;box-shadow:0 2px 8px #2563eb22;border:2px solid #2563eb;cursor:pointer;transition:filter .18s;\">${initials}</div>`;
  }
  let infoHtml = "";
  if (acconier.nom) {
    infoHtml += `<div class='profile-avatar-name' style='font-weight:600;font-size:${
      isMobile ? "0.98em" : "1.05em"
    };color:#2563eb;text-align:center;margin-top:${
      isMobile ? "3px" : "7px"
    };line-height:1.1;cursor:pointer;'>${acconier.nom}</div>`;
  }
  if (acconier.email) {
    infoHtml += `<div class='profile-avatar-email' style='font-size:${
      isMobile ? "0.91em" : "0.97em"
    };color:#334155;text-align:center;opacity:0.85;cursor:pointer;'>${
      acconier.email
    }</div>`;
  }
  // Menu profil caché par défaut
  let profileMenuHtml = `
    <div id='profileMenuDropdown' style='display:none;position:absolute;top:${
      isMobile ? "50px" : "70px"
    };left:50%;transform:translateX(-50%);background:#fff;border-radius:12px;box-shadow:0 4px 24px #2563eb22;padding:18px 22px 14px 22px;z-index:1001;min-width:180px;max-width:90vw;text-align:center;'>
      <div style='font-weight:600;font-size:1.08em;color:#2563eb;margin-bottom:7px;'>${
        acconier.nom || "-"
      }</div>
      <div style='font-size:0.97em;color:#334155;opacity:0.85;margin-bottom:13px;'>${
        acconier.email || "-"
      }</div>
      <button id='logoutAcconierBtn' style='padding:8px 0;width:100%;background:linear-gradient(90deg,#2563eb 0%,#06b6d4 100%);color:#fff;border:none;border-radius:8px;font-size:1em;font-weight:600;box-shadow:0 2px 8px #2563eb22;cursor:pointer;transition:filter .18s;'>Se déconnecter</button>
    </div>
  `;
  // Conteneur principal avec position relative pour le menu
  avatarContainer.innerHTML = `<div style='display:flex;flex-direction:column;align-items:center;position:relative;${
    isMobile ? "margin-bottom:8px;" : ""
  }'>
    <div id='profileAvatarClickable' style='display:flex;flex-direction:column;align-items:center;cursor:pointer;'>${avatarHtml}${infoHtml}</div>
    ${profileMenuHtml}
  </div>`;
  // Gestion de l'ouverture/fermeture du menu profil
  const clickable = avatarContainer.querySelector("#profileAvatarClickable");
  const profileMenu = avatarContainer.querySelector("#profileMenuDropdown");
  if (clickable && profileMenu) {
    clickable.onclick = function (e) {
      e.stopPropagation();
      profileMenu.style.display =
        profileMenu.style.display === "none" ? "block" : "none";
    };
    // Ferme le menu si on clique ailleurs
    document.addEventListener("click", function hideMenu(e) {
      if (!avatarContainer.contains(e.target)) {
        profileMenu.style.display = "none";
      }
    });
  }
  // Ajoute l'écouteur sur le bouton de déconnexion (et le réactive à chaque affichage du menu)
  function bindLogoutBtn() {
    const logoutBtn = avatarContainer.querySelector("#logoutAcconierBtn");
    if (logoutBtn) {
      logoutBtn.onclick = function () {
        localStorage.removeItem("acconier_user");
        window.location.href =
          "https://plateformdesuivie-its-service-1cjx.onrender.com/html/acconier_auth.html";
      };
    }
  }
  bindLogoutBtn();
  if (profileMenu) {
    profileMenu.addEventListener("transitionend", bindLogoutBtn);
    profileMenu.addEventListener("click", bindLogoutBtn);
  }
};

// --- SAUVEGARDE DES INFOS ACCONIER À LA CONNEXION (à placer sur acconier_auth.html) ---
// Exemple d'appel à placer après validation du login sur acconier_auth.html :
//   saveAcconierUserToLocalStorage({ nom: 'Nom Prénom', email: 'email@exemple.com', avatar: 'url_ou_base64' });
window.saveAcconierUserToLocalStorage = function (acconier) {
  if (!acconier || !acconier.nom || !acconier.email) return;
  localStorage.setItem("acconier_user", JSON.stringify(acconier));
  // Redirection directe vers l'ordre de livraison après connexion
  window.location.href =
    "https://plateformdesuivie-its-service-1cjx.onrender.com/html/interfaceFormulaireEmployer.html";
};

// Initialisation de l'affichage historique et avatar au chargement
document.addEventListener("DOMContentLoaded", () => {
  window.displayAgentHistory && window.displayAgentHistory("Agent Acconier");
  window.displayProfileAvatar && window.displayProfileAvatar();
  // Affiche directement le formulaire d'ordre de livraison
  const deliveryFormSection = document.getElementById("deliveryFormSection");
  if (deliveryFormSection) {
    deliveryFormSection.classList.remove("hidden");
  }
  // Masque la section code d'entreprise si elle existe
  const codeEntrySection = document.getElementById("codeEntrySection");
  if (codeEntrySection) {
    codeEntrySection.classList.add("hidden");
  }

  // Remplir automatiquement le champ Nom de l'agent Acconier avec uniquement le nom
  const employeeNameInput = document.getElementById("employeeName");
  let acconier = JSON.parse(localStorage.getItem("acconier_user")) || {};
  if (employeeNameInput && acconier.nom) {
    employeeNameInput.value = acconier.nom;
    employeeNameInput.readOnly = true;
    employeeNameInput.style.background = "#f1f5f9";
    employeeNameInput.style.cursor = "not-allowed";
  }
});

// --- Insertion dynamique du conteneur avatar à côté du formulaire ---
document.addEventListener("DOMContentLoaded", () => {
  // Cherche la section du formulaire de livraison
  const deliveryFormSection = document.getElementById("deliveryFormSection");
  const codeEntrySection = document.getElementById("codeEntrySection");
  // Fonction pour afficher/masquer l'icône historique selon la visibilité du formulaire
  function updateHistoryBtnVisibility() {
    let historyBtn = document.getElementById("historySidebarBtn");
    let sidebar = document.getElementById("historySidebarFormulaire");
    // Détection mobile
    const isMobile =
      window.matchMedia && window.matchMedia("(max-width: 600px)").matches;
    if (
      deliveryFormSection &&
      !deliveryFormSection.classList.contains("hidden")
    ) {
      if (!historyBtn) {
        historyBtn = document.createElement("button");
        historyBtn.id = "historySidebarBtn";
        historyBtn.innerHTML = `<i class=\"fas fa-history\"></i>`;
        historyBtn.title = "Voir l'historique des ordres de livraison";
        document.body.appendChild(historyBtn);
      }
      // Styles responsive
      if (isMobile) {
        historyBtn.style.position = "fixed";
        historyBtn.style.top = "12px";
        historyBtn.style.left = "12px";
        historyBtn.style.zIndex = "3000";
        historyBtn.style.background = "#fff";
        historyBtn.style.border = "none";
        historyBtn.style.borderRadius = "50%";
        historyBtn.style.width = "38px";
        historyBtn.style.height = "38px";
        historyBtn.style.boxShadow = "0 2px 8px #2563eb22";
        historyBtn.style.display = "flex";
        historyBtn.style.alignItems = "center";
        historyBtn.style.justifyContent = "center";
        historyBtn.style.fontSize = "1.15em";
        historyBtn.style.color = "#2563eb";
        historyBtn.style.cursor = "pointer";
        historyBtn.style.transition = "filter .18s";
        historyBtn.style.outline = "none";
        historyBtn.style.touchAction = "manipulation";
      } else {
        historyBtn.style.position = "fixed";
        historyBtn.style.top = "28px";
        historyBtn.style.left = "38px";
        historyBtn.style.zIndex = "3000";
        historyBtn.style.background = "#fff";
        historyBtn.style.border = "none";
        historyBtn.style.borderRadius = "50%";
        historyBtn.style.width = "48px";
        historyBtn.style.height = "48px";
        historyBtn.style.boxShadow = "0 2px 12px #2563eb22";
        historyBtn.style.display = "flex";
        historyBtn.style.alignItems = "center";
        historyBtn.style.justifyContent = "center";
        historyBtn.style.fontSize = "1.55em";
        historyBtn.style.color = "#2563eb";
        historyBtn.style.cursor = "pointer";
        historyBtn.style.transition = "filter .18s";
        historyBtn.style.outline = "none";
      }
      historyBtn.style.display = "flex";
      // Toujours attacher l'événement onclick (même si le bouton vient d'être créé)
      if (historyBtn && sidebar) {
        historyBtn.onclick = function () {
          sidebar.style.right = "0";
          if (typeof renderHistorySidebarList === "function")
            renderHistorySidebarList();
        };
      }
    } else {
      if (historyBtn) historyBtn.style.display = "none";
    }
  }

  // Ajout du conteneur avatar uniquement si on est sur le formulaire
  if (deliveryFormSection) {
    // Vérifie si le conteneur avatar existe déjà
    let avatarContainer = document.getElementById("profileAvatarContainer");
    if (!avatarContainer) {
      // Crée le conteneur avatar
      avatarContainer = document.createElement("div");
      avatarContainer.id = "profileAvatarContainer";
      avatarContainer.style.marginBottom = "18px";
      avatarContainer.style.display = "flex";
      avatarContainer.style.justifyContent = "center";
      // Insère l'avatar AVANT le formulaire (ou adapte selon besoin)
      deliveryFormSection.insertBefore(
        avatarContainer,
        deliveryFormSection.firstChild
      );
    }
    // Affiche l'avatar
    if (window.displayProfileAvatar) {
      window.displayProfileAvatar();
    }
  }

  // --- Ajout de la sidebar historique cachée (toujours dans le DOM, mais cachée) + overlay ---
  let sidebar = document.getElementById("historySidebarFormulaire");
  let sidebarOverlay = document.getElementById("historySidebarOverlay");
  if (!sidebarOverlay) {
    sidebarOverlay = document.createElement("div");
    sidebarOverlay.id = "historySidebarOverlay";
    sidebarOverlay.style.position = "fixed";
    sidebarOverlay.style.top = "0";
    sidebarOverlay.style.left = "0";
    sidebarOverlay.style.width = "100vw";
    sidebarOverlay.style.height = "100vh";
    sidebarOverlay.style.background = "rgba(30,41,59,0.18)";
    sidebarOverlay.style.zIndex = "1999";
    sidebarOverlay.style.display = "none";
    sidebarOverlay.style.pointerEvents = "auto";
    document.body.appendChild(sidebarOverlay);
  }
  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.id = "historySidebarFormulaire";
    sidebar.style.position = "fixed";
    sidebar.style.top = "0";
    sidebar.style.right = "-420px";
    sidebar.style.width = "370px";
    sidebar.style.height = "100vh";
    sidebar.style.background = "#fff";
    sidebar.style.boxShadow = "-4px 0 24px #2563eb22";
    sidebar.style.zIndex = "2000";
    sidebar.style.transition = "right 0.32s cubic-bezier(.4,1.3,.5,1)";
    sidebar.style.display = "flex";
    sidebar.style.flexDirection = "column";
    sidebar.style.padding = "0";
    sidebar.innerHTML = `
      <!-- En-tête avec titre et bouton fermer -->
      <div style='display:flex;align-items:center;justify-content:space-between;padding:16px 18px 12px 18px;border-bottom:1px solid #e2e8f0;background:linear-gradient(135deg, #1e293b 0%, #334155 100%);'>
        <h3 style='margin:0;font-weight:700;font-size:1em;color:#ffffff;letter-spacing:-0.3px;'>📋 Historique ordres de livraison</h3>
        <button id='closeHistorySidebarBtn' style='background:rgba(212, 144, 6, 0.1);border:1px solid rgba(255,255,255,0.2);color:#e2e8f0;cursor:pointer;padding:6px;border-radius:4px;width:28px;height:28px;transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;' title="Fermer">
          <i class='fas fa-times'></i>
        </button>
      </div>  
      
      <!-- Champ de recherche compact -->
      <div style='padding:12px 16px 8px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;'>
        <div style='position:relative;'>
          <i class='fas fa-search' style='position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:0.8em;z-index:1;'></i>
          <input type='text' id='historySearchInput' placeholder='Rechercher...' style='width:100%;padding:8px 12px 8px 32px;border:1px solid #d1d5db;border-radius:6px;font-size:0.85em;background:#ffffff;outline:none;transition:border-color 0.2s ease;box-sizing:border-box;'>
        </div>
      </div>
      
      <!-- Contrôles de sélection -->
      <div style='padding:8px 16px;background:#ffffff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:8px;'>
        <div style='display:flex;align-items:center;gap:8px;'>
          <label style='display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85em;color:#374151;'>
            <input type='checkbox' id='selectAllOrders' style='accent-color:#3b82f6;'>
            <span>Sélectionner tout</span>
          </label>
          <span id='selectedCount' style='font-size:0.75em;color:#6b7280;font-weight:500;'>(0 sélectionné)</span>
        </div>
        <button id='deleteSelectedBtn' style='background:#ef4444;color:#ffffff;border:none;padding:6px 12px;border-radius:5px;font-size:0.75em;font-weight:600;cursor:pointer;transition:background 0.2s ease;display:none;' title='Supprimer la sélection'>
          <i class='fas fa-trash' style='margin-right:4px;'></i>Supprimer
        </button>
      </div>
      
      <!-- Liste des ordres -->
      <div id='historySidebarList' style='flex:1;overflow-y:auto;padding:12px 16px;background:#ffffff;'></div>
    `;
    document.body.appendChild(sidebar);
  }

  // --- Gestion de l'affichage/masquage du bouton historique ---
  updateHistoryBtnVisibility();

  // --- Affichage de la sidebar au clic sur l'icône ---
  let historyBtn = document.getElementById("historySidebarBtn");
  function openSidebarHistory() {
    // Place l'overlay juste avant la sidebar dans le DOM pour garantir l'empilement
    if (sidebarOverlay && sidebar) {
      if (sidebarOverlay.nextSibling !== sidebar) {
        document.body.insertBefore(sidebarOverlay, sidebar);
      }
      sidebarOverlay.style.display = "block";
      sidebarOverlay.style.pointerEvents = "auto";
      sidebarOverlay.style.zIndex = "1999";
      sidebar.style.zIndex = "2000";
      // Ajoute pointer-events:auto à l'overlay et pointer-events:auto à la sidebar
      sidebarOverlay.style.pointerEvents = "auto";
      sidebar.style.pointerEvents = "auto";
    }
    sidebar.style.right = "0";
    renderHistorySidebarList();

    // Initialise la recherche et la sélection multiple après le rendu
    setTimeout(() => {
      setupHistorySearch();
      setupMultiSelectControls();
    }, 100);
  }
  function closeSidebarHistory() {
    sidebar.style.right = "-420px";
    if (sidebarOverlay) {
      sidebarOverlay.style.display = "none";
      sidebarOverlay.style.pointerEvents = "none";
    }
  }
  if (historyBtn) {
    historyBtn.onclick = openSidebarHistory;
  }
  // --- Fermeture de la sidebar ---
  const closeBtn = sidebar.querySelector("#closeHistorySidebarBtn");
  if (closeBtn) {
    closeBtn.onclick = closeSidebarHistory;
  }
  // Ferme la sidebar si on clique sur l'overlay
  if (sidebarOverlay) {
    // On utilise click au lieu de mousedown pour éviter les conflits focus
    sidebarOverlay.addEventListener("click", function (e) {
      // Si le clic est sur l'overlay (et pas sur la sidebar)
      // On vérifie que le clic n'est pas sur la sidebar (qui est au-dessus)
      // Si le clic est sur la partie visible de la sidebar, ne rien faire
      // Si le clic est sur l'overlay (hors sidebar), fermer
      var sidebarRect = sidebar.getBoundingClientRect();
      var x = e.clientX;
      var y = e.clientY;
      var inSidebar =
        x >= sidebarRect.left &&
        x <= sidebarRect.right &&
        y >= sidebarRect.top &&
        y <= sidebarRect.bottom;
      if (sidebar.style.right === "0" && !inSidebar) {
        closeSidebarHistory();
      }
    });
  }
  // Ferme la sidebar si on clique en dehors (fallback pour compatibilité)
  // Supprime le fallback global qui interfère avec l'overlay
  // (plus besoin car l'overlay gère tout)
  // Fonction pour afficher la liste historique
  window.renderHistorySidebarList = function () {
    const listDiv = document.getElementById("historySidebarList");
    if (!listDiv) return;
    // Récupère l'historique local
    const historyKey = "simulatedHistoryData";
    let historyData = JSON.parse(localStorage.getItem(historyKey)) || {};
    let agentHistory = historyData["Agent Acconier"] || [];
    if (agentHistory.length === 0) {
      listDiv.innerHTML = `<div style='color:#64748b;text-align:center;margin-top:30px;'>Aucun ordre de livraison enregistré.</div>`;
      return;
    }
    // Filtrer pour ne garder que les ordres avec un champ 'data' valide (vraies données)
    let now = new Date();
    let filteredHistory = agentHistory.filter((item) => {
      if (!item || !item.data || typeof item.data !== "object" || !item.date)
        return false;
      // Garde uniquement les ordres de moins de 7 jours
      let orderDate = new Date(item.date);
      let diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });
    // Supprimer les doublons par id ET par contenu principal (clientName, containerNumbers, date, etc.)
    const seenKeys = new Set();
    filteredHistory = filteredHistory.filter((item) => {
      // On construit une clé unique sur les infos principales (clientName, containerNumbers, containerFootType, date, etc.)
      const key = [
        item.id || "",
        item.data ? item.data.clientName : "",
        item.data
          ? Array.isArray(item.data.containerNumbers)
            ? item.data.containerNumbers.join(",")
            : item.data.containerNumbers
          : "",
        item.data ? item.data.containerFootType : "",
        item.data ? item.data.declarationNumber : "",
        item.data ? item.data.numberOfContainers : "",
        item.data ? item.data.weight : "",
        item.data ? item.data.shipName : "",
        item.data ? item.data.circuit : "",
        item.data ? item.data.shippingCompany : "",
        item.data ? item.data.transporterMode : "",
        item.data ? item.data.status : "",
        item.date || "",
      ].join("|");
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
    if (filteredHistory.length === 0) {
      listDiv.innerHTML = `<div style='color:#64748b;text-align:center;margin-top:30px;'>Aucun ordre de livraison enregistré.</div>`;
      return;
    }
    // Regrouper les ordres par date (format YYYY-MM-DD)
    const ordersByDate = {};
    filteredHistory.forEach((item) => {
      const dateKey = item.date ? item.date.slice(0, 10) : "?";
      if (!ordersByDate[dateKey]) ordersByDate[dateKey] = [];
      ordersByDate[dateKey].push(item);
    });
    // Trier les dates décroissantes
    const sortedDates = Object.keys(ordersByDate).sort((a, b) =>
      b.localeCompare(a)
    );
    let html = '<div style="padding-bottom:10px;">';
    let globalIdx = 0;
    sortedDates.forEach((dateKey) => {
      // Titre de date (sécurité sur le format)
      let yyyy = "",
        mm = "",
        dd = "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        [yyyy, mm, dd] = dateKey.split("-");
      }
      let dateAffichee =
        dd && mm && yyyy
          ? `${dd}/${mm}/${yyyy}`
          : dateKey !== "?"
          ? dateKey
          : "Date inconnue";
      // Récupère le nom du client du premier ordre de la date
      let clientName = "Client inconnu";
      if (
        ordersByDate[dateKey][0] &&
        ordersByDate[dateKey][0].data &&
        ordersByDate[dateKey][0].data.clientName
      ) {
        clientName = ordersByDate[dateKey][0].data.clientName;
      }
      // Suppression de la carte "Serge JJ/MM/AAAA" en haut de chaque date
      html += '<ul style="list-style:none;padding:0;margin:0;">';
      ordersByDate[dateKey].forEach((item, idx) => {
        // Génère la carte de l'ordre avec case à cocher
        let liHtml = `<li class="history-order-item" data-history-idx="${globalIdx}" style="background:linear-gradient(90deg,#f1f5f9 80%,#e0e7ff 100%);margin-bottom:7px;padding:18px 18px 16px 18px;border-radius:14px;box-shadow:0 2px 10px #2563eb13;display:flex;flex-direction:column;gap:7px;cursor:pointer;transition:all 0.18s;position:relative;">
          <!-- Case à cocher en haut à droite -->
          <input type="checkbox" class="order-checkbox" data-order-idx="${globalIdx}" style="position:absolute;top:12px;right:12px;width:16px;height:16px;accent-color:#3b82f6;cursor:pointer;z-index:10;" onclick="event.stopPropagation();">
          
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:2px;margin-right:25px;">
            <span style="background:#2563eb;color:#fff;border-radius:8px 18px 18px 8px;width:auto;min-width:70px;padding:4px 14px 4px 10px;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:1em;box-shadow:0 1px 4px #2563eb11;letter-spacing:0.5px;">${
              item.date
                ? item.date.slice(0, 10).split("-").reverse().join("/")
                : "--/--/----"
            }</span>
            <span style="color:#64748b;font-size:0.98em;font-weight:500;">${
              item.data && item.data.clientName
                ? item.data.clientName
                : "Client inconnu"
            }</span>
          </div>
          <div style="color:#1e293b;font-size:1.04em;font-weight:500;margin-right:25px;">${
            item.details
          }</div>
        </li>`;
        html += liHtml;
        globalIdx++;
      });
      html += "</ul>";
    });
    html += "</div>";
    listDiv.innerHTML = html;

    // Ajoute l'écouteur sur chaque item pour afficher le détail en pop-up
    var items = listDiv.querySelectorAll(".history-order-item");
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener("click", function (e) {
        // Ne pas ouvrir le détail si clic sur la case à cocher
        if (e.target.classList.contains("order-checkbox")) return;
        var idx = parseInt(this.getAttribute("data-history-idx"));
        var order = filteredHistory[idx];
        window.showOrderDetailPopup(order);
      });
    }

    // Ajouter les événements sur les cases à cocher
    var checkboxes = listDiv.querySelectorAll(".order-checkbox");
    for (var k = 0; k < checkboxes.length; k++) {
      checkboxes[k].addEventListener("change", function () {
        updateSelectionUI();
      });
    }

    // Ajout : synchronise les contrôles multi-sélection et le bouton suppression
    if (typeof window.setupMultiSelectControls === "function") {
      window.setupMultiSelectControls();
    }
    if (typeof window.updateSelectionUI === "function") {
      window.updateSelectionUI();
    }
  };

  // Fonction pour gérer la sélection multiple
  window.setupMultiSelectControls = function () {
    const selectAllCheckbox = document.getElementById("selectAllOrders");
    const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
    const selectedCountSpan = document.getElementById("selectedCount");

    if (!selectAllCheckbox || !deleteSelectedBtn || !selectedCountSpan) return;

    // Fonction globale pour mettre à jour le compteur et le bouton
    window.updateSelectionUI = function () {
      const checkboxes = document.querySelectorAll(".order-checkbox");
      const checkedBoxes = document.querySelectorAll(".order-checkbox:checked");
      const count = checkedBoxes.length;

      selectedCountSpan.textContent = `(${count} sélectionné${
        count > 1 ? "s" : ""
      })`;

      if (count > 0) {
        deleteSelectedBtn.style.display = "block";
        deleteSelectedBtn.innerHTML = `<i class='fas fa-trash' style='margin-right:4px;'></i>Supprimer (${count})`;
      } else {
        deleteSelectedBtn.style.display = "none";
      }

      // Mettre à jour l'état du "Sélectionner tout"
      if (count === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
      } else if (count === checkboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
      } else {
        selectAllCheckbox.indeterminate = true;
      }
    };

    // Gestionnaire pour "Sélectionner tout"
    selectAllCheckbox.addEventListener("change", function () {
      const checkboxes = document.querySelectorAll(".order-checkbox");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
      });
      window.updateSelectionUI();
    });

    // Gestionnaire pour les cases individuelles
    document.addEventListener("change", function (e) {
      if (e.target.classList.contains("order-checkbox")) {
        window.updateSelectionUI();
      }
    });

    // Gestionnaire pour le bouton supprimer
    deleteSelectedBtn.addEventListener("click", function () {
      const checkedBoxes = document.querySelectorAll(".order-checkbox:checked");
      if (checkedBoxes.length === 0) return;

      // Créer popup de confirmation
      const confirmModal = document.createElement("div");
      confirmModal.style.position = "fixed";
      confirmModal.style.top = "0";
      confirmModal.style.left = "0";
      confirmModal.style.width = "100vw";
      confirmModal.style.height = "100vh";
      confirmModal.style.background = "rgba(30,41,59,0.4)";
      confirmModal.style.zIndex = "6000";
      confirmModal.style.display = "flex";
      confirmModal.style.alignItems = "center";
      confirmModal.style.justifyContent = "center";

      const confirmBox = document.createElement("div");
      confirmBox.style.background = "#fff";
      confirmBox.style.borderRadius = "12px";
      confirmBox.style.padding = "24px";
      confirmBox.style.maxWidth = "400px";
      confirmBox.style.margin = "0 20px";
      confirmBox.style.textAlign = "center";
      confirmBox.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";

      confirmBox.innerHTML =
        '<div style="color:#dc2626;font-size:2em;margin-bottom:12px;">' +
        '<i class="fas fa-exclamation-triangle"></i>' +
        "</div>" +
        '<h3 style="margin:0 0 12px 0;color:#1f2937;">Supprimer ' +
        checkedBoxes.length +
        " ordre" +
        (checkedBoxes.length > 1 ? "s" : "") +
        " ?</h3>" +
        '<p style="margin:0 0 20px 0;color:#6b7280;">Cette action est irréversible.</p>' +
        '<div style="display:flex;gap:12px;justify-content:center;">' +
        '<button id="confirmMultiDelete" style="background:#dc2626;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:600;cursor:pointer;">' +
        "Supprimer" +
        "</button>" +
        '<button id="cancelMultiDelete" style="background:#f3f4f6;color:#374151;border:none;padding:10px 20px;border-radius:6px;font-weight:600;cursor:pointer;">' +
        "Annuler" +
        "</button>" +
        "</div>";

      confirmModal.appendChild(confirmBox);
      document.body.appendChild(confirmModal);

      // Gestionnaires de la popup
      document.getElementById("cancelMultiDelete").onclick = () =>
        confirmModal.remove();
      confirmModal.onclick = (e) => {
        if (e.target === confirmModal) confirmModal.remove();
      };

      document.getElementById("confirmMultiDelete").onclick = function () {
        // Récupérer les indices des ordres sélectionnés
        const indicesToDelete = Array.from(checkedBoxes).map((cb) =>
          parseInt(cb.dataset.orderIdx)
        );

        // Supprimer de localStorage
        const historyKey = "simulatedHistoryData";
        let historyData = JSON.parse(localStorage.getItem(historyKey)) || {};
        let agentHistory = historyData["Agent Acconier"] || [];

        // Filtrer pour ne garder que les ordres non sélectionnés
        let filteredHistory = agentHistory.filter(
          (item) => item && item.data && typeof item.data === "object"
        );

        // Supprimer les doublons et construire la liste finale
        const seenKeys = new Set();
        filteredHistory = filteredHistory.filter((item, index) => {
          if (indicesToDelete.includes(index)) return false;

          const key = [
            item.id || "",
            item.data ? item.data.clientName : "",
            item.data
              ? Array.isArray(item.data.containerNumbers)
                ? item.data.containerNumbers.join(",")
                : item.data.containerNumbers
              : "",
            item.data ? item.data.containerFootType : "",
            item.data ? item.data.declarationNumber : "",
            item.data ? item.data.numberOfContainers : "",
            item.data ? item.data.weight : "",
            item.data ? item.data.shipName : "",
            item.data ? item.data.circuit : "",
            item.data ? item.data.shippingCompany : "",
            item.data ? item.data.transporterMode : "",
            item.data ? item.data.status : "",
            item.date || "",
          ].join("|");

          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        });

        historyData["Agent Acconier"] = filteredHistory;
        localStorage.setItem(historyKey, JSON.stringify(historyData));

        confirmModal.remove();
        window.renderHistorySidebarList();
      };
    });

    // Initialiser l'UI
    window.updateSelectionUI();
  };

  // Fonction de recherche pour la sidebar
  window.setupHistorySearch = function () {
    const searchInput = document.getElementById("historySearchInput");

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase().trim();
        const listDiv = document.getElementById("historySidebarList");
        const items = listDiv.querySelectorAll(".history-order-item");

        items.forEach((item) => {
          const text = item.textContent.toLowerCase();
          if (text.includes(searchTerm)) {
            item.style.display = "block";
          } else {
            item.style.display = "none";
          }
        });
      });
    }
  };

  // Fonction pour afficher le pop-up détaillé d'un ordre de livraison
  window.showOrderDetailPopup = function (order) {
    // Supprime l'ancien pop-up s'il existe
    var oldModal = document.getElementById("orderDetailModal");
    if (oldModal) oldModal.remove();
    // Crée le fond
    var modalBg = document.createElement("div");
    modalBg.id = "orderDetailModal";
    modalBg.style.position = "fixed";
    modalBg.style.top = "0";
    modalBg.style.left = "0";
    modalBg.style.width = "100vw";
    modalBg.style.height = "100vh";
    modalBg.style.background = "rgba(30,41,59,0.32)";
    modalBg.style.zIndex = "5000";
    modalBg.style.display = "flex";
    modalBg.style.alignItems = "center";
    modalBg.style.justifyContent = "center";
    // Désactive le scroll de la page derrière la popup
    document.body.classList.add("overflow-hidden");
    // Crée la boîte
    var modalBox = document.createElement("div");
    // Responsive styles
    var isMobile =
      window.matchMedia && window.matchMedia("(max-width: 600px)").matches;
    modalBox.style.background = "#fff";
    modalBox.style.borderRadius = isMobile ? "13px" : "18px";
    modalBox.style.boxShadow = isMobile
      ? "0 2px 16px #2563eb22"
      : "0 8px 32px #2563eb33";
    modalBox.style.padding = isMobile
      ? "18px 7vw 14px 7vw"
      : "28px 22px 18px 22px";
    modalBox.style.maxWidth = isMobile ? "98vw" : "98vw";
    modalBox.style.width = isMobile ? "98vw" : "410px";
    modalBox.style.maxHeight = isMobile ? "95vh" : "90vh";
    modalBox.style.overflowY = "auto";
    modalBox.style.position = "relative";
    // Bouton fermer responsive
    var closeBtn = document.createElement("button");
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.setAttribute("aria-label", "Fermer");
    closeBtn.style.position = "absolute";
    if (isMobile) {
      closeBtn.style.top = "-14px";
      closeBtn.style.right = "-10px";
      closeBtn.style.width = "38px";
      closeBtn.style.height = "38px";
      closeBtn.style.fontSize = "1.25em";
      closeBtn.style.background = "#f1f5f9";
      closeBtn.style.borderRadius = "50%";
      closeBtn.style.display = "flex";
      closeBtn.style.alignItems = "center";
      closeBtn.style.justifyContent = "center";
      closeBtn.style.boxShadow = "0 1px 6px #2563eb11";
      closeBtn.style.border = "none";
      closeBtn.style.zIndex = "10";
      closeBtn.style.padding = "0";
      closeBtn.style.color = "#2563eb";
      closeBtn.style.cursor = "pointer";
      closeBtn.onmouseover = function () {
        closeBtn.style.background = "#e0e7ff";
      };
      closeBtn.onmouseout = function () {
        closeBtn.style.background = "#f1f5f9";
      };
    } else {
      closeBtn.style.top = "18px";
      closeBtn.style.right = "22px";
      closeBtn.style.width = "44px";
      closeBtn.style.height = "44px";
      closeBtn.style.fontSize = "1.5em";
      closeBtn.style.background = "none";
      closeBtn.style.border = "none";
      closeBtn.style.color = "#2563eb";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.padding = "0";
    }
    closeBtn.onclick = function () {
      modalBg.remove();
      document.body.classList.remove("overflow-hidden");
    };
    modalBox.appendChild(closeBtn);
    // Titre principal avec amélioration légère
    var title = document.createElement("div");
    title.innerHTML = `<i class='fas fa-clipboard-list' style='color:#3b82f6;margin-right:8px;'></i>Détail de l'ordre de livraison`;
    title.style.color = "#1e293b";
    title.style.fontWeight = "bold";
    title.style.fontSize = isMobile ? "1.1em" : "1.2em";
    title.style.marginBottom = isMobile ? "20px" : "18px";
    title.style.marginTop = isMobile ? "20px" : "0";
    title.style.textAlign = "center";
    title.style.borderBottom = "2px solid #e2e8f0";
    title.style.paddingBottom = "12px";
    modalBox.appendChild(title);

    // Contenu détaillé ou message d'erreur si data absent
    var html = "";
    if (!order || !order.data) {
      html = `<div style='color:#dc2626;font-weight:bold;padding:18px 0;text-align:center;'>Aucune donnée détaillée à afficher pour cet ordre.<br>Vérifiez la sauvegarde de l'historique.</div>`;
    } else {
      var d = order.data;
      html = `<div class="order-detail-main" style="display:flex;flex-direction:column;gap:${
        isMobile ? "12px" : "18px"
      };font-size:${isMobile ? "0.99em" : "1.07em"};line-height:1.6;">
        <!-- Informations principales avec icônes -->
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "8px" : "18px"
        };justify-content:space-between;align-items:center;background:linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);padding:${
        isMobile ? "12px 10px" : "14px 18px"
      };border-radius:12px;border-left:4px solid #3b82f6;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:600;display:flex;align-items:center;gap:6px;'><i class='fas fa-calendar-alt' style='color:#3b82f6;'></i>Date</span><br><span style='font-weight:700;color:#2563eb;'>${
            order.date || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:600;display:flex;align-items:center;gap:6px;'><i class='fas fa-user-tie' style='color:#3b82f6;'></i>Agent</span><br><span style='font-weight:700;'>${
            d.employeeName || "-"
          }</span></div>
        </div>
        <!-- Informations client -->
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "8px" : "18px"
        };justify-content:space-between;align-items:center;background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);padding:${
        isMobile ? "12px 10px" : "14px 18px"
      };border-radius:12px;border-left:4px solid #10b981;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:600;display:flex;align-items:center;gap:6px;'><i class='fas fa-user-circle' style='color:#10b981;'></i>Client</span><br><span style='font-weight:700;'>${
            d.clientName || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:600;display:flex;align-items:center;gap:6px;'><i class='fas fa-phone' style='color:#10b981;'></i>Téléphone</span><br><span style='font-weight:700;'>${
            d.clientPhone || "-"
          }</span></div>
        </div>
        <!-- Informations conteneurs avec logique améliorée -->
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "8px" : "18px"
        };justify-content:space-between;align-items:stretch;background:linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);padding:${
        isMobile ? "12px 10px" : "14px 18px"
      };border-radius:12px;border-left:4px solid #f59e0b;">
          ${(() => {
            const containers = Array.isArray(d.containerNumbers)
              ? d.containerNumbers
              : d.containerNumbers
              ? [d.containerNumbers]
              : [];
            const isMultiple = containers.length > 1;

            return `<div style="flex:1;min-width:120px;">
              <span style='color:#64748b;font-weight:600;display:flex;align-items:center;gap:6px;'><i class='fas fa-shipping-fast' style='color:#f59e0b;'></i>Conteneur(s)</span><br>
              ${
                isMultiple
                  ? `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px;margin-top:6px;cursor:pointer;transition:all 0.2s ease;" 
                     onclick="toggleContainerList(this)" 
                     data-containers='${JSON.stringify(containers)}'
                     onmouseover="this.style.backgroundColor='#fde68a'"
                     onmouseout="this.style.backgroundColor='#fef3c7'">
                   <div style="display:flex;align-items:center;justify-content:space-between;">
                     <span style='font-weight:700;color:#d97706;'>${
                       containers.length
                     } conteneurs</span>
                     <i class='fas fa-chevron-down' style="color:#d97706;font-size:0.8em;transition:transform 0.3s ease;"></i>
                   </div>
                   <div class="container-list" style="display:none;margin-top:10px;border-top:1px solid #d97706;padding-top:8px;">
                     ${containers
                       .map(
                         (container) =>
                           `<div style="padding:4px 0;color:#92400e;font-weight:600;font-size:0.9em;border-bottom:1px solid rgba(217,119,6,0.2);margin-bottom:4px;">${container}</div>`
                       )
                       .join("")}
                   </div>
                 </div>`
                  : `<span style='font-weight:700;color:#d97706;'>${
                      containers[0] || "-"
                    }</span>`
              }
            </div>
            <div style="flex:1;min-width:120px;">
              <span style='color:#64748b;font-weight:600;display:flex;align-items:center;gap:6px;'><i class='fas fa-cogs' style='color:#f59e0b;'></i>Type(s) de pied</span><br>
              <span style='font-weight:700;color:#d97706;'>${
                isMultiple ? "Multiples types" : d.containerFootType || "-"
              }</span>
            </div>`;
          })()}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "7px" : "18px"
        };justify-content:space-between;align-items:center;background:#f8fafc;padding:${
        isMobile ? "10px 8px" : "12px 18px"
      };border-radius:12px;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Poids</span><br><span style='font-weight:700;'>${
            d.weight || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Contenu</span><br><span style='font-weight:700;'>${
            d.containerTypeAndContent || "-"
          }</span></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "7px" : "18px"
        };justify-content:space-between;align-items:center;background:#f1f5f9;padding:${
        isMobile ? "10px 8px" : "12px 18px"
      };border-radius:12px;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Lieu</span><br><span style='font-weight:700;'>${
            d.lieu || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Déclaration</span><br><span style='font-weight:700;'>${
            d.declarationNumber || "-"
          }</span></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "7px" : "18px"
        };justify-content:space-between;align-items:center;background:#f8fafc;padding:${
        isMobile ? "10px 8px" : "12px 18px"
      };border-radius:12px;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Nombre de conteneurs</span><br><span style='font-weight:700;'>${
            d.numberOfContainers || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>BL</span><br><span style='font-weight:700;'>${
            d.blNumber || "-"
          }</span></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "7px" : "18px"
        };justify-content:space-between;align-items:center;background:#f1f5f9;padding:${
        isMobile ? "10px 8px" : "12px 18px"
      };border-radius:12px;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Dossier</span><br><span style='font-weight:700;'>${
            d.dossierNumber || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Compagnie maritime</span><br><span style='font-weight:700;'>${
            d.shippingCompany || "-"
          }</span></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "7px" : "18px"
        };justify-content:space-between;align-items:center;background:#f8fafc;padding:${
        isMobile ? "10px 8px" : "12px 18px"
      };border-radius:12px;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Navire</span><br><span style='font-weight:700;'>${
            d.shipName || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Circuit</span><br><span style='font-weight:700;'>${
            d.circuit || "-"
          }</span></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "7px" : "18px"
        };justify-content:space-between;align-items:center;background:#f1f5f9;padding:${
        isMobile ? "10px 8px" : "12px 18px"
      };border-radius:12px;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Mode de transport</span><br><span style='font-weight:700;'>${
            d.transporterMode || "-"
          }</span></div>
        </div>
      </div>`;
      // Si mapping TC/type de pied détaillé
      if (
        Array.isArray(d.containerFootTypesData) &&
        d.containerFootTypesData.length > 0
      ) {
        html += `<div style='margin-top:${
          isMobile ? "12px" : "18px"
        };background:#f8fafc;padding:${
          isMobile ? "10px 8px" : "12px 18px"
        };border-radius:12px;'>
          <div style='font-weight:700;color:#2563eb;margin-bottom:7px;'>Détail TC / Type de pied / Poids</div>
          <ul style='padding-left:0;margin:0;list-style:none;'>`;
        for (var i = 0; i < d.containerFootTypesData.length; i++) {
          var obj = d.containerFootTypesData[i];
          html += `<li style='margin-bottom:4px;'><span style='font-weight:bold;color:#1e293b;'>${
            obj.tc
          }</span> : <span style='color:#2563eb;'>${
            obj.pied || "-"
          }</span> / <span style='color:#334155;'>${
            obj.poids || "-"
          }</span> kg</li>`;
        }
        html += "</ul></div>";
      }
    }
    var contentDiv = document.createElement("div");
    contentDiv.innerHTML = html;
    modalBox.appendChild(contentDiv);
    modalBg.appendChild(modalBox);
    document.body.appendChild(modalBg);
    // Fermer au clic sur le fond (overlay)
    modalBg.addEventListener("click", function (e) {
      if (e.target === modalBg) {
        modalBg.remove();
        document.body.classList.remove("overflow-hidden");
      }
    });
  };

  // Fonction pour gérer le menu déroulant des conteneurs
  window.toggleContainerList = function (element) {
    const containerList = element.querySelector(".container-list");
    const chevron = element.querySelector(".fas");

    if (containerList.style.display === "none") {
      containerList.style.display = "block";
      chevron.style.transform = "rotate(180deg)";
    } else {
      containerList.style.display = "none";
      chevron.style.transform = "rotate(0deg)";
    }
  };

  // --- Observer la visibilité du formulaire pour afficher/masquer l'icône ---
  const observer = new MutationObserver(updateHistoryBtnVisibility);
  if (deliveryFormSection) {
    observer.observe(deliveryFormSection, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
  if (codeEntrySection) {
    observer.observe(codeEntrySection, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
  // Appel initial
  updateHistoryBtnVisibility();
});

document.addEventListener("DOMContentLoaded", () => {
  // Charger les numéros BL existants au démarrage
  loadUsedBLNumbers();
  init();
  // Suppression de toute logique liée au code entreprise
});

// Fonction utilitaire pour afficher un message dans un élément DOM.
// Ajoute des classes de style pour les messages de succès et d'erreur.
function displayMessage(element, messageText, type) {
  if (!element) {
    console.error("L'élément d'affichage du message est manquant:", element);
    return;
  }
  element.textContent = messageText;
  element.classList.remove("hidden");
  if (type === "success") {
    element.classList.add("text-green-500");
    element.classList.remove("text-red-500");
  } else if (type === "error") {
    element.classList.add("text-red-500");
    element.classList.remove("text-green-500");
  }
}

// Fonction utilitaire pour effacer les messages d'un élément DOM.
function clearMessages(element) {
  if (!element) return;
  element.textContent = "";
  element.classList.add("hidden");
}

if (containerNumberInput) {
  // On cache l'input d'origine (textarea ou input)
  containerNumberInput.style.display = "none";

  // Création du conteneur de tags dynamiques
  containerTagsContainer = document.createElement("div");
  containerTagsContainer.className = "tags-input-container";
  containerTagsContainer.style.display = "flex";
  containerTagsContainer.style.flexWrap = "wrap";
  containerTagsContainer.style.gap = "6px";
  containerTagsContainer.style.background = "#fff";
  containerTagsContainer.style.border = "1.5px solid #2563eb";
  containerTagsContainer.style.borderRadius = "7px";
  containerTagsContainer.style.padding = "6px 8px";
  containerTagsContainer.style.minHeight = "44px";
  containerTagsContainer.style.marginBottom = "6px";

  // Input pour saisir les numéros TC
  containerTagsInput = document.createElement("input");
  containerTagsInput.type = "text";
  containerTagsInput.placeholder =
    "Ajouter un numéro TC et appuyer sur Entrée, virgule ou point-virgule";
  containerTagsInput.style.flex = "1";
  containerTagsInput.style.border = "none";
  containerTagsInput.style.outline = "none";
  containerTagsInput.style.fontSize = "1em";
  containerTagsInput.style.minWidth = "120px";
  containerTagsInput.style.background = "transparent";

  // Création de l'icône Entrée verte
  const enterIcon = document.createElement("button");
  enterIcon.type = "button";
  enterIcon.title = "Ajouter ce TC";
  enterIcon.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="13" r="13" fill="#22c55e"/><path d="M8 13h7.5m0 0l-3-3m3 3l-3 3" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  enterIcon.style.display = "none";
  enterIcon.style.background = "none";
  enterIcon.style.border = "none";
  enterIcon.style.cursor = "pointer";
  enterIcon.style.marginLeft = "4px";
  enterIcon.style.padding = "0";
  enterIcon.style.alignSelf = "center";

  // Ajout input + icône dans le conteneur
  containerTagsContainer.appendChild(containerTagsInput);
  containerTagsContainer.appendChild(enterIcon);
  // On insère le conteneur juste avant l'input caché
  containerNumberInput.parentNode.insertBefore(
    containerTagsContainer,
    containerNumberInput
  );

  // Fonction d'affichage des tags
  function renderContainerTags() {
    // Supprime tous les tags sauf l'input et l'icône
    while (
      containerTagsContainer.firstChild &&
      containerTagsContainer.firstChild !== containerTagsInput &&
      containerTagsContainer.firstChild !== enterIcon
    ) {
      containerTagsContainer.removeChild(containerTagsContainer.firstChild);
    }
    // Ajoute chaque tag
    containerTags.forEach((tag, idx) => {
      const tagEl = document.createElement("span");
      tagEl.className = "tag-item";
      tagEl.textContent = tag;
      tagEl.style.background = "#2563eb";
      tagEl.style.color = "#fff";
      tagEl.style.padding = "3px 10px";
      tagEl.style.borderRadius = "16px";
      tagEl.style.display = "flex";
      tagEl.style.alignItems = "center";
      tagEl.style.fontSize = "0.98em";
      tagEl.style.gap = "6px";
      tagEl.style.marginRight = "2px";
      // Bouton croix
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.innerHTML = "&times;";
      removeBtn.style.background = "none";
      removeBtn.style.border = "none";
      removeBtn.style.color = "#fff";
      removeBtn.style.fontWeight = "bold";
      removeBtn.style.cursor = "pointer";
      removeBtn.style.fontSize = "1.1em";
      removeBtn.onclick = () => {
        containerTags.splice(idx, 1);
        // Supprimer également les données associées
        containerFootTypes.splice(idx, 1);
        containerWeights.splice(idx, 1);
        renderContainerTags();
        renderContainerFootTypes(); // Appel direct au lieu de syncFootTypesWithTags pour éviter la boucle
      };
      tagEl.appendChild(removeBtn);
      containerTagsContainer.insertBefore(tagEl, containerTagsInput);
    });
    // Affiche ou masque l'icône Entrée selon la saisie
    if (containerTagsInput.value.trim()) {
      enterIcon.style.display = "inline-block";
    } else {
      enterIcon.style.display = "none";
    }
  }

  // Ajout d'un spinner et validation stricte TC (4 lettres + 7 chiffres)
  let tcSpinnerTimeout = null;
  let tcSpinner = null;
  let tcErrorMsg = null;
  function showTCSpinner() {
    if (!tcSpinner) {
      tcSpinner = document.createElement("span");
      tcSpinner.className = "tc-spinner";
      tcSpinner.style.display = "inline-block";
      tcSpinner.style.marginLeft = "8px";
      tcSpinner.innerHTML = `<svg width="22" height="22" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#2563eb" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.415, 31.415" transform="rotate(0 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/></circle></svg>`;
      containerTagsInput.parentNode.insertBefore(
        tcSpinner,
        containerTagsInput.nextSibling
      );
    }
    tcSpinner.style.display = "inline-block";
  }
  function hideTCSpinner() {
    if (tcSpinner) tcSpinner.style.display = "none";
  }
  function showTCError(msg) {
    if (!tcErrorMsg) {
      tcErrorMsg = document.createElement("div");
      tcErrorMsg.className = "tc-error-msg";
      // Style boîte flottante réduite
      tcErrorMsg.style.position = "absolute";
      tcErrorMsg.style.left = "0";
      tcErrorMsg.style.top = "100%";
      tcErrorMsg.style.zIndex = "10";
      tcErrorMsg.style.background = "#fff";
      tcErrorMsg.style.border = "1.5px solid #dc2626";
      tcErrorMsg.style.color = "#dc2626";
      tcErrorMsg.style.fontWeight = "500";
      tcErrorMsg.style.fontSize = "0.93em";
      tcErrorMsg.style.padding = "5px 12px 5px 10px";
      tcErrorMsg.style.borderRadius = "7px";
      tcErrorMsg.style.boxShadow = "0 2px 8px #dc262622";
      tcErrorMsg.style.marginTop = "2px";
      tcErrorMsg.style.marginBottom = "0";
      tcErrorMsg.style.minWidth = "180px";
      tcErrorMsg.style.maxWidth = "320px";
      tcErrorMsg.style.pointerEvents = "none";
      // Positionner le parent en relative si ce n'est pas déjà fait
      if (containerTagsContainer.parentNode.style.position !== "relative") {
        containerTagsContainer.parentNode.style.position = "relative";
      }
      containerTagsContainer.parentNode.appendChild(tcErrorMsg);
    }
    tcErrorMsg.textContent = msg;
    tcErrorMsg.style.display = "block";
  }
  function hideTCError() {
    if (tcErrorMsg) tcErrorMsg.style.display = "none";
  }
  function validateTCFormat(tc) {
    return /^[A-Za-z]{4}[0-9]{7}$/.test(tc);
  }
  // Validation stricte à chaque saisie (input)
  containerTagsInput.addEventListener("input", () => {
    const value = containerTagsInput.value.trim();
    if (value.length === 0) {
      hideTCSpinner();
      hideTCError();
      if (tcSpinnerTimeout) clearTimeout(tcSpinnerTimeout);
      return;
    }
    showTCSpinner();
    hideTCError();
    if (tcSpinnerTimeout) clearTimeout(tcSpinnerTimeout);
    tcSpinnerTimeout = setTimeout(() => {
      hideTCSpinner();
      if (value.length !== 11) {
        showTCError("Le numéro TC doit comporter exactement 11 caractères.");
      } else if (!/^[A-Za-z]{4}[0-9]{7}$/.test(value)) {
        showTCError("Format invalide : 4 lettres suivies de 7 chiffres.");
      } else {
        hideTCError();
      }
    }, 600); // délai court pour laisser le temps de saisir
  });

  // Ajout par touche Entrée, virgule, point-virgule
  containerTagsInput.addEventListener("keydown", (e) => {
    if (
      ["Enter", ",", ";"].includes(e.key) ||
      e.keyCode === 188 ||
      e.keyCode === 186
    ) {
      e.preventDefault();
      const value = containerTagsInput.value.trim();
      if (!value || containerTags.includes(value)) {
        containerTagsInput.value = "";
        renderContainerTags();
        return;
      }
      // Validation stricte immédiate
      if (value.length !== 11) {
        showTCError("Le numéro TC doit comporter exactement 11 caractères.");
        return;
      }
      if (!/^[A-Za-z]{4}[0-9]{7}$/.test(value)) {
        showTCError("Format invalide : 4 lettres suivies de 7 chiffres.");
        return;
      }
      containerTags.push(value);
      syncFootTypesWithTags(); // Synchronise immédiatement
      renderContainerTags();
      hideTCError();
      containerTagsInput.value = "";
      containerTagsInput.focus();
    }
  });
  // Affiche le spinner dès qu'on commence à saisir (input)
  containerTagsInput.addEventListener("input", () => {
    if (containerTagsInput.value.trim().length > 0) {
      showTCSpinner();
      hideTCError();
      if (tcSpinnerTimeout) clearTimeout(tcSpinnerTimeout);
      tcSpinnerTimeout = setTimeout(() => {
        hideTCSpinner();
        // Ne valide pas ici, juste spinner visuel
      }, 3000);
    } else {
      hideTCSpinner();
      hideTCError();
      if (tcSpinnerTimeout) clearTimeout(tcSpinnerTimeout);
    }
  });
  // Ajout par collage de plusieurs numéros séparés
  containerTagsInput.addEventListener("paste", (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    if (pasted) {
      e.preventDefault();
      const newTCs = [];
      pasted.split(/[\n,;]+/).forEach((val) => {
        const v = val.trim();
        if (v && !containerTags.includes(v)) {
          newTCs.push(v);
        }
      });

      // Ajouter tous les nouveaux TC d'un coup
      containerTags.push(...newTCs);
      syncFootTypesWithTags(); // Synchronise une seule fois
      renderContainerTags();
      containerTagsInput.value = "";
    }
  });
  // Clic sur l'icône Entrée verte
  enterIcon.addEventListener("click", function () {
    const value = containerTagsInput.value.trim();
    if (!value || containerTags.includes(value)) {
      containerTagsInput.value = "";
      renderContainerTags();
      return;
    }
    // Validation stricte immédiate (même logique que keydown)
    if (value.length !== 11) {
      showTCError("Le numéro TC doit comporter exactement 11 caractères.");
      return;
    }
    if (!/^[A-Za-z]{4}[0-9]{7}$/.test(value)) {
      showTCError("Format invalide : 4 lettres suivies de 7 chiffres.");
      return;
    }
    containerTags.push(value);
    syncFootTypesWithTags(); // Synchronise immédiatement
    renderContainerTags();
    hideTCError();
    containerTagsInput.value = "";
    containerTagsInput.focus();
  });
  // Affiche l'icône dès qu'on tape
  containerTagsInput.addEventListener("input", renderContainerTags);

  // Synchronise la valeur cachée pour compatibilité backend
  function syncHiddenInput() {
    containerNumberInput.value = containerTags.join(", ");
  }
  // À chaque modif de tags, on synchronise
  const observer = new MutationObserver(syncHiddenInput);
  observer.observe(containerTagsContainer, { childList: true, subtree: true });
  // Synchronise aussi à chaque ajout/suppression
  containerTagsInput.addEventListener("blur", syncHiddenInput);
  containerTagsInput.addEventListener("input", syncHiddenInput);
  // Initial
  renderContainerTags();
  syncHiddenInput();
  // Affiche la zone dynamique au chargement si TC déjà présents
  syncFootTypesWithTags();
}

// Fonction pour générer dynamiquement la zone de saisie des types de pied par TC
function renderContainerFootTypes() {
  // Utiliser le conteneur dynamique du HTML
  const dynamicContainer = document.getElementById("containerFootTypesDynamic");
  if (!dynamicContainer) return;
  dynamicContainer.innerHTML = "";
  dynamicContainer.style.display = "flex";
  dynamicContainer.style.flexDirection = "column";
  dynamicContainer.style.gap = "8px";
  dynamicContainer.style.marginBottom = "10px";

  // Pour chaque TC, créer une ligne avec badge + select (ou input) pour le type de pied
  const piedOptions = ["10", "20", "40", "45"];

  containerTags.forEach((tc, idx) => {
    let row = document.createElement("div");
    const isMobile =
      window.matchMedia && window.matchMedia("(max-width: 600px)").matches;
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = isMobile ? "6px" : "10px";
    row.style.marginBottom = isMobile ? "8px" : "0";

    // Badge TC
    let tcLabel = document.createElement("span");
    tcLabel.textContent = tc;
    tcLabel.className = "tc-foot-label";
    tcLabel.style.background = "#e0e7ff";
    tcLabel.style.color = "#1e40af";
    tcLabel.style.padding = isMobile ? "6px 10px" : "3px 12px";
    tcLabel.style.borderRadius = "14px";
    tcLabel.style.fontWeight = "bold";
    tcLabel.style.fontSize = isMobile ? "1em" : "1em";
    tcLabel.style.display = "inline-block";
    tcLabel.style.marginBottom = "0";

    // Select pour le type de pied
    let piedSelect = document.createElement("select");
    piedSelect.className = "tc-foot-select";
    piedSelect.style.width = isMobile ? "80px" : "auto";
    piedSelect.style.padding = isMobile ? "6px 6px" : "5px 10px";
    piedSelect.style.border = isMobile
      ? "2px solid #2563eb"
      : "1px solid #b6c6e6";
    piedSelect.style.borderRadius = "8px";
    piedSelect.style.fontSize = isMobile ? "1em" : "1em";
    piedSelect.style.background = isMobile ? "#f1f5f9" : "#fff";
    piedSelect.style.color = "#1e293b";
    piedSelect.style.marginBottom = "0";
    piedSelect.style.boxShadow = "none";

    piedOptions.forEach((opt) => {
      let option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      piedSelect.appendChild(option);
    });

    // Option personnalisée (input texte si "Autre...")
    let piedInput = document.createElement("input");
    piedInput.type = "text";
    piedInput.placeholder = "Type personnalisé";
    piedInput.className = "tc-foot-input";
    piedInput.style.flex = "1";
    piedInput.style.padding = isMobile ? "6px 6px" : "5px 10px";
    piedInput.style.border = isMobile
      ? "2px solid #2563eb"
      : "1px solid #b6c6e6";
    piedInput.style.borderRadius = "8px";
    piedInput.style.fontSize = isMobile ? "1em" : "1em";
    piedInput.style.background = isMobile ? "#f1f5f9" : "#fff";
    piedInput.style.color = "#1e293b";
    piedInput.style.display = "none";
    piedInput.style.marginBottom = "0";
    piedInput.style.boxShadow = "none";
    piedInput.style.width = isMobile ? "80px" : "auto";

    // Input pour le poids
    let poidsInput = document.createElement("input");
    poidsInput.type = "number";
    poidsInput.placeholder = "Poids (kg)";
    poidsInput.className = "tc-weight-input";
    poidsInput.style.flex = "unset";
    poidsInput.style.width = isMobile ? "80px" : "98px";
    poidsInput.style.padding = isMobile ? "6px 6px" : "4px 6px";
    poidsInput.style.border = isMobile
      ? "2px solid #2563eb"
      : "2px solid #2563eb";
    poidsInput.style.borderRadius = "8px";
    poidsInput.style.fontSize = isMobile ? "1em" : "1em";
    poidsInput.style.background = isMobile ? "#f1f5f9" : "#fff";
    poidsInput.style.color = "#1e293b";
    poidsInput.style.fontWeight = "bold";
    poidsInput.style.boxShadow = "none";
    poidsInput.min = "0";
    poidsInput.step = "any";
    poidsInput.disabled = false;
    poidsInput.tabIndex = 0;
    poidsInput.style.cursor = "pointer";
    poidsInput.style.marginBottom = "0";
    poidsInput.addEventListener("focus", function () {
      poidsInput.style.border = isMobile
        ? "2.5px solid #eab308"
        : "2.5px solid #eab308";
      poidsInput.style.background = "#fef9c3";
    });
    poidsInput.addEventListener("blur", function () {
      poidsInput.style.border = isMobile
        ? "2px solid #2563eb"
        : "2px solid #2563eb";
      poidsInput.style.background = isMobile ? "#f1f5f9" : "#fff";
    });

    // Initial value pied
    let currentValue = containerFootTypes[idx]
      ? containerFootTypes[idx].pied
      : "";
    if (piedOptions.includes(currentValue)) {
      piedSelect.value = currentValue;
      piedInput.value = "";
      piedInput.style.display = "none";
    } else if (currentValue) {
      piedSelect.value = "Autre...";
      piedInput.value = currentValue;
      piedInput.style.display = "inline-block";
    }

    // Initial value poids
    poidsInput.value =
      containerWeights[idx] !== undefined ? containerWeights[idx] : "";

    piedSelect.addEventListener("change", () => {
      if (piedSelect.value === "Autre...") {
        piedInput.style.display = "inline-block";
        piedInput.focus();
        containerFootTypes[idx] = { tc, pied: piedInput.value };
      } else {
        piedInput.style.display = "none";
        containerFootTypes[idx] = { tc, pied: piedSelect.value };
      }
    });
    piedInput.addEventListener("input", () => {
      containerFootTypes[idx] = { tc, pied: piedInput.value };
    });
    poidsInput.addEventListener("input", () => {
      containerWeights[idx] = poidsInput.value;
    });

    // Init valeur
    if (!containerFootTypes[idx])
      containerFootTypes[idx] = { tc, pied: piedSelect.value };
    if (containerWeights[idx] === undefined) containerWeights[idx] = "";

    // Ajout des éléments dans la ligne (alignés sur mobile)
    row.appendChild(tcLabel);
    row.appendChild(piedSelect);
    row.appendChild(piedInput);
    row.appendChild(poidsInput);
    dynamicContainer.appendChild(row);
  });

  // Masquer le select d'origine
  if (containerFootTypeSelect) {
    containerFootTypeSelect.style.display = "none";
  }
}

// Rafraîchir la zone à chaque modif des tags TC
function syncFootTypesWithTags() {
  // Synchronise la longueur du tableau avec une meilleure gestion
  const newContainerFootTypes = [];
  const newContainerWeights = [];

  containerTags.forEach((tc, idx) => {
    // Cherche si ce TC existait déjà dans l'ancien tableau
    const existingIndex = containerFootTypes.findIndex(
      (item) => item && item.tc === tc
    );

    if (existingIndex !== -1) {
      // Garde les données existantes
      newContainerFootTypes[idx] = containerFootTypes[existingIndex];
      newContainerWeights[idx] = containerWeights[existingIndex] || "";
    } else {
      // Nouveau TC, valeurs par défaut
      newContainerFootTypes[idx] = { tc, pied: "40" };
      newContainerWeights[idx] = "";
    }
  });

  containerFootTypes = newContainerFootTypes;
  containerWeights = newContainerWeights;
  renderContainerFootTypes();
}

/**
 * Initialise les écouteurs d'événements au chargement de la page.
 */
function init() {
  if (deliveryForm) {
    // Attache les écouteurs d'événements aux boutons de soumission du formulaire
    deliveryForm.querySelectorAll('button[type="submit"]').forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault(); // Empêche la soumission par défaut du formulaire
        const status = button.dataset.status;

        clearMessages(formErrorDisplay);
        clearMessages(formSuccessDisplay);

        // --- Validation des champs obligatoires ---
        const requiredInputs = [
          employeeNameInput,
          clientNameInput,
          // containerTypeAndContentInput, // Champ Contenu rendu facultatif
          lieuInput,
          containerNumberInput,
          // containerFootTypeSelect, // SUPPRIMÉ : ce champ n'existe plus, remplacé par la zone dynamique
          declarationNumberInput,
          numberOfContainersInput,
          dossierNumberInput, // Ajout du champ N° dossier comme obligatoire
        ].filter((input) => input !== null); // Filtrer les inputs non trouvés

        let allRequiredFilled = true;
        let firstEmptyInput = null;

        requiredInputs.forEach((input) => {
          input.classList.remove("border-red-500", "border-2");
        });

        for (const input of requiredInputs) {
          if (input.type === "file") {
            if (!input.files || input.files.length === 0) {
              allRequiredFilled = false;
              if (!firstEmptyInput) firstEmptyInput = input;
              input.classList.add("border-red-500", "border-2");
            }
          } else if (!input.value.trim()) {
            allRequiredFilled = false;
            if (!firstEmptyInput) firstEmptyInput = input;
            input.classList.add("border-red-500", "border-2");
          }
        }

        if (!allRequiredFilled) {
          displayMessage(
            formErrorDisplay,
            "⚠️ Veuillez remplir tous les champs obligatoires (marqués avec *).",
            "error"
          );
          if (firstEmptyInput) {
            firstEmptyInput.focus();
          }
          return;
        }

        // --- VALIDATION NUMÉRO BL UNIQUE ---
        const currentBLNumber = blNumberInput ? blNumberInput.value.trim() : "";
        if (currentBLNumber && isBLNumberUsed(currentBLNumber)) {
          // Retirer les bordures rouges des autres champs
          requiredInputs.forEach((input) => {
            input.classList.remove("border-red-500", "border-2");
          });
          // Ajouter bordure rouge au champ BL
          if (blNumberInput) {
            blNumberInput.classList.add("border-red-500", "border-2");
            blNumberInput.focus();
          }
          displayMessage(
            formErrorDisplay,
            `❌ Le numéro BL "${currentBLNumber}" a déjà été utilisé. Veuillez saisir un numéro BL différent.`,
            "error"
          );
          return;
        }

        // Le numéro de téléphone client est totalement facultatif : aucune validation, aucune contrainte, aucune bordure rouge. precis
        if (clientPhoneInput) {
          clientPhoneInput.classList.remove("border-red-500", "border-2");
        }

        startCountdown(status);
      });
    });
  } else {
    console.warn("Élément #deliveryForm non trouvé.");
  }

  if (cancelSubmitBtn) {
    cancelSubmitBtn.addEventListener("click", () => {
      clearMessages(formErrorDisplay);
      clearMessages(formSuccessDisplay);
      deliveryForm.reset();

      stopCountdown();

      document.body.classList.remove("no-scroll");

      displayMessage(formSuccessDisplay, "❌ Validation annulée.", "success");
    });
  } else {
    console.warn("Élément #cancelSubmitBtn non trouvé.");
  }

  // Met à jour dynamiquement les options du champ Mode de transport
  if (transporterModeSelect) {
    transporterModeSelect.innerHTML = "";
    const options = [
      { value: "", label: "Sélectionner le mode de transport" },
      { value: "REMORQUE", label: "REMORQUE" },
      { value: "AUTO-CHARGEUSE", label: "AUTO-CHARGEUSE" },
    ];
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      transporterModeSelect.appendChild(option);
    });
  }

  // Met à jour dynamiquement les options du champ Circuit
  if (circuitInput && circuitInput.tagName === "SELECT") {
    circuitInput.innerHTML = "";
    const circuitOptions = [
      { value: "", label: "Sélectionnez un circuit" },
      { value: "VAD", label: "VAD" },
      { value: "VAQ", label: "VAQ" },
      { value: "BAE", label: "BAE" },
      { value: "SCANNER", label: "SCANNER" },
    ];
    circuitOptions.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      circuitInput.appendChild(option);
    });
  }

  // --- VALIDATION EN TEMPS RÉEL DU NUMÉRO BL ---
  if (blNumberInput) {
    // Supprimer les bordures d'erreur quand l'utilisateur modifie le champ
    blNumberInput.addEventListener("input", function () {
      blNumberInput.classList.remove("border-red-500", "border-2");
      clearMessages(formErrorDisplay);
    });

    // Validation quand l'utilisateur quitte le champ (onblur)
    blNumberInput.addEventListener("blur", function () {
      const blValue = blNumberInput.value.trim();
      if (blValue && isBLNumberUsed(blValue)) {
        blNumberInput.classList.add("border-red-500", "border-2");
        displayMessage(
          formErrorDisplay,
          `❌ Le numéro BL "${blValue}" a déjà été utilisé. Veuillez saisir un numéro BL différent.`,
          "error"
        );
      }
    });
  }

  // Suppression de la gestion du bouton "Code entreprise oublié ?" et du formulaire associé
}

// Suppression de tout appel inutile à une API de validation côté serveur pour le code entreprise.
// La validation se fait uniquement côté client avec COMPANY_CODE.

// Suppression complète de la fonction validateCompanyCode et de toute la logique liée au code d'entreprise (WebSocket, DOM, API)

/**
 * Démarre le décompte avant la soumission du formulaire.
 * @param {string} status - Le statut de la livraison.
 */
function startCountdown(status) {
  countdownTime = 3;
  displayMessage(
    formSuccessDisplay,
    `Soumission dans ${countdownTime} secondes... Cliquez sur 'Annuler l'Envoi' pour annuler.`,
    "success"
  );

  if (deliveryForm) {
    deliveryForm
      .querySelectorAll('button[type="submit"]')
      .forEach((btn) => (btn.disabled = true));
  }
  if (cancelSubmitBtn) {
    cancelSubmitBtn.disabled = false;
  }

  countdownInterval = setInterval(() => {
    countdownTime--;
    if (countdownTime > 0) {
      displayMessage(
        formSuccessDisplay,
        `Soumission dans ${countdownTime} secondes... Cliquez sur 'Annuler l'Envoi' pour annuler.`,
        "success"
      );
    } else {
      clearInterval(countdownInterval);
      submitDeliveryForm(status);
      if (deliveryForm) {
        deliveryForm
          .querySelectorAll('button[type="submit"]')
          .forEach((btn) => (btn.disabled = false));
      }
    }
  }, 1000);
}

/**
 * Arrête le décompte s'il est en cours.
 */
function stopCountdown() {
  clearInterval(countdownInterval);
  if (deliveryForm) {
    deliveryForm
      .querySelectorAll('button[type="submit"]')
      .forEach((btn) => (btn.disabled = false));
  }
}

/**
 * Soumet les données de livraison au backend via une requête Fetch (POST).
 * Utilise FormData pour gérer les fichiers.
 * @param {string} status - Le statut de la livraison ('pending_acconier' ou 'rejected').
 */
async function submitDeliveryForm(status) {
  clearMessages(formErrorDisplay);
  clearMessages(formSuccessDisplay);

  if (
    !employeeNameInput ||
    !clientNameInput ||
    !lieuInput ||
    !containerNumberInput ||
    // !containerFootTypeSelect || // SUPPRIMÉ : ce champ n'existe plus, remplacé par la zone dynamique
    !declarationNumberInput ||
    !numberOfContainersInput ||
    !formErrorDisplay
  ) {
    console.error(
      "Un ou plusieurs champs obligatoires ou éléments d'affichage sont manquants."
    );
    displayMessage(
      formErrorDisplay,
      "Erreur interne du formulaire : éléments manquants.",
      "error"
    );
    return;
  }

  const employeeName = employeeNameInput.value.trim();
  const clientName = clientNameInput.value.trim();
  const clientPhone = clientPhoneInput.value.trim().replace(/\s/g, "");
  const containerTypeAndContent = containerTypeAndContentInput.value.trim();
  const lieu = lieuInput.value.trim();
  // Récupère les numéros TC depuis le champ à tags dynamiques (ou fallback textarea/input)
  let containerNumbers = [];
  if (containerTags && containerTags.length > 0) {
    containerNumbers = [...containerTags];
  } else if (containerNumberInput) {
    containerNumbers = containerNumberInput.value
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  let containerFootType = "";
  let containerFootTypesData = [];
  let weight = "";
  if (containerFootTypes && containerFootTypes.length > 0) {
    // Ajoute le poids par TC dans le mapping
    containerFootTypesData = containerFootTypes.map((obj, idx) => ({
      tc: obj.tc,
      pied: obj.pied.trim(),
      poids:
        containerWeights[idx] !== undefined
          ? String(containerWeights[idx]).trim()
          : "",
    }));
    // Pour compatibilité backend actuel, on peut concaténer tous les types de pied (ex: "20',40'HC")
    containerFootType = containerFootTypesData.map((obj) => obj.pied).join(",");
    // Pour compatibilité backend actuel, on concatène tous les poids (ex: "1000,1200")
    weight = containerFootTypesData.map((obj) => obj.poids).join(",");
  } else if (containerFootTypeSelect) {
    containerFootType = containerFootTypeSelect.value.trim();
    weight = weightInput ? weightInput.value.trim() : "";
  }
  const declarationNumber = declarationNumberInput.value.trim();
  const numberOfContainers = numberOfContainersInput.value.trim();
  // Le champ weight est maintenant géré plus haut pour le mapping dynamique
  const shipName = shipNameInput ? shipNameInput.value.trim() : "";
  const circuit = circuitInput ? circuitInput.value.trim() : "";
  const shippingCompany = shippingCompanyInput
    ? shippingCompanyInput.value.trim()
    : "";
  const transporterMode = transporterModeSelect
    ? transporterModeSelect.value.trim()
    : "";

  // *** IMPORTANT: Logs de débogage pour vérifier les valeurs avant FormData ***
  console.log("Debug: Values before FormData append:");
  console.log(
    "  blNumber value:",
    blNumberInput
      ? blNumberInput.value.trim()
      : "N/A (element not found or empty)"
  );
  console.log(
    "  dossierNumber value:",
    dossierNumberInput
      ? dossierNumberInput.value.trim()
      : "N/A (element not found or empty)"
  );
  console.log(
    "  shippingCompany value:",
    shippingCompanyInput
      ? shippingCompanyInput.value.trim()
      : "N/A (element not found or empty)"
  );
  // *** FIN des logs de débogage ***

  const requiredInputs = [
    employeeName,
    clientName,
    // containerTypeAndContent, // Champ Contenu rendu facultatif
    lieu,
    containerNumbers.length > 0 ? containerNumbers.join(",") : "",
    containerFootType,
    declarationNumber,
    numberOfContainers,
  ];

  if (requiredInputs.some((input) => !input)) {
    displayMessage(
      formErrorDisplay,
      "Veuillez remplir tous les champs obligatoires.",
      "error"
    );
    return;
  }

  // Le numéro de téléphone client est totalement facultatif : aucune validation, aucune contrainte, aucune bordure rouge.
  if (clientPhoneInput) {
    clientPhoneInput.classList.remove("border-red-500", "border-2");
  }

  const formData = new FormData();
  formData.append("employee_name", employeeName);
  formData.append("client_name", clientName);
  formData.append("client_phone", clientPhone);
  formData.append("container_type_and_content", containerTypeAndContent);
  formData.append("status", status); // Le statuts est maintenant 'pending_acconier' pour le bouton Valider
  formData.append("lieu", lieu);
  // On envoie une version tronquée pour le champ container_number (limité à 100 caractères)
  let containerNumberForDB = "";
  if (containerNumbers.length === 1) {
    containerNumberForDB = containerNumbers[0];
  } else if (containerNumbers.length > 1) {
    // Format: "Premier TC + X autres" pour respecter la limite de 100 caractères
    const firstTC = containerNumbers[0];
    const remainingCount = containerNumbers.length - 1;
    containerNumberForDB = `${firstTC} + ${remainingCount} autres`;
  }
  formData.append("container_number", containerNumberForDB);
  formData.append("container_foot_type", containerFootType);
  formData.append("declaration_number", declarationNumber);
  formData.append("number_of_containers", numberOfContainers);
  formData.append("weight", weight);
  formData.append("ship_name", shipName);
  formData.append("circuit", circuit);
  formData.append("transporter_mode", transporterMode);

  // Ajout du champ technique pour le backend (affichage correct du statut)
  // Désormais, le statut par défaut est 'awaiting_payment_acconier' (En attente de paiement)
  let deliveryStatusAcconier = "awaiting_payment_acconier";
  if (status === "rejected_by_employee" || status === "rejected_acconier") {
    deliveryStatusAcconier = status;
  } else if (status === "delivered" || status === "livre") {
    deliveryStatusAcconier = "delivered";
  }
  formData.append("delivery_status_acconier", deliveryStatusAcconier);

  // Assurez-vous d'appeler .value.trim() directement ici aussi pour les variables utilisées dans les append conditionnels

  const finalBlNumber = blNumberInput ? blNumberInput.value.trim() : "";
  const finalDossierNumber = dossierNumberInput
    ? dossierNumberInput.value.trim()
    : "";
  const finalShippingCompany = shippingCompanyInput
    ? shippingCompanyInput.value.trim()
    : "";

  // Toujours envoyer dossier_number, même vide, pour éviter l'erreur backend
  formData.append("dossier_number", finalDossierNumber);
  if (finalBlNumber) formData.append("bl_number", finalBlNumber);
  if (finalShippingCompany)
    formData.append("shipping_company", finalShippingCompany);

  // Pour évolution backend, possibilité d'envoyer aussi le mapping complet :
  formData.append(
    "container_foot_types_map",
    JSON.stringify(containerFootTypesData)
  );

  // Envoie aussi la liste complète des TC séparément
  formData.append("container_numbers_list", JSON.stringify(containerNumbers));

  try {
    // Choix dynamique de l'URL backend
    let apiUrl = "";
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      apiUrl = "http://localhost:3000/deliveries/validate";
    } else {
      // Remplace ci-dessous par TON vrai sous-domaine Render !
      apiUrl =
        "https://plateformdesuivie-its-service-1cjx.onrender.com/deliveries/validate";
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      data = { message: "Réponse serveur invalide ou vide." };
    }

    if (response.ok) {
      const operationType =
        status === "pending_acconier"
          ? "une nouvelle demande de livraison"
          : "un rejet de livraison"; // Texte mis à jour
      displayMessage(
        formSuccessDisplay,
        data.message ||
          `Opération (${operationType}) enregistrée avec succès !`,
        "success"
      );

      // --- SAUVEGARDE DU NUMÉRO BL POUR ÉVITER LES DOUBLONS ---
      const finalBlNumber = blNumberInput ? blNumberInput.value.trim() : "";
      if (finalBlNumber) {
        saveBLNumber(finalBlNumber);
      }

      // --- AJOUT HISTORIQUE AGENT ACCONIER ---
      try {
        const historyKey = "simulatedHistoryData";
        let historyData = JSON.parse(localStorage.getItem(historyKey)) || {};
        if (!historyData["Agent Acconier"]) historyData["Agent Acconier"] = [];
        const now = new Date();
        const dateStr =
          now.toLocaleDateString("fr-FR") +
          " " +
          now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          });
        const details = `${clientName} - ${containerNumbers.join(
          ", "
        )} (${containerFootType})`;
        const newOperation = {
          id: `form-op-${Date.now()}`,
          date: dateStr,
          details: details,
          data: {
            employeeName,
            clientName,
            clientPhone,
            containerTypeAndContent,
            lieu,
            containerNumbers,
            containerFootType,
            containerFootTypesData,
            declarationNumber,
            numberOfContainers,
            weight,
            shipName,
            circuit,
            shippingCompany,
            transporterMode,
            status,
            deliveryStatusAcconier,
            blNumber: finalBlNumber,
            dossierNumber: finalDossierNumber,
          },
        };
        historyData["Agent Acconier"].unshift(newOperation);
        localStorage.setItem(historyKey, JSON.stringify(historyData));
      } catch (e) {
        console.warn("Impossible d'ajouter à l'historique Agent Acconier :", e);
      }
      // --- FIN AJOUT HISTORIQUE ---
      // --- Mise à jour immédiate de l'affichage historique (sidebar et liste) ---
      if (typeof window.renderHistorySidebarList === "function") {
        window.renderHistorySidebarList();
      }
      if (window.displayAgentHistory) {
        window.displayAgentHistory("Agent Acconier");
      }
      // --- FIN MISE À JOUR ---
      deliveryForm.reset();
      // Après le reset, remettre le nom de l'agent connecté dans le champ même s'il est disabled
      let acconier = JSON.parse(localStorage.getItem("acconier_user")) || {};
      if (employeeNameInput && acconier.nom) {
        // On active temporairement le champ si désactivé
        const wasDisabled = employeeNameInput.disabled;
        if (wasDisabled) employeeNameInput.disabled = false;
        employeeNameInput.value = acconier.nom;
        if (wasDisabled) employeeNameInput.disabled = true;
      }
      // Rafraîchit la liste des agents côtés suivi après succès serveur
      if (window.loadDeliveries) {
        window.loadDeliveries();
      }

      // --- NOTIFICATION TEMPS RÉEL TABLEAU DE SUIVI ---
      try {
        let wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
        let wsHost = window.location.hostname;
        let wsPort = window.location.port || "3000";
        if (wsHost === "localhost" || wsHost === "127.0.0.1") {
          wsPort = "3000";
        }
        let wsUrl = `${wsProtocol}://${wsHost}:${wsPort}`;
        const ws = new WebSocket(wsUrl);
        ws.onopen = function () {
          ws.send(JSON.stringify({ type: "new_delivery_notification" }));
          ws.close();
        };
      } catch (e) {
        console.warn(
          "[SYNC TEMPS RÉEL] Impossible d'envoyer la notification WebSocket :",
          e
        );
      }
    } else {
      displayMessage(
        formErrorDisplay,
        data.message ||
          `Erreur lors de l'enregistrement de l'opération (code ${response.status}).`,
        "error"
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi des données de livraison :", error);
    let msg = "Erreur réseau ou serveur. Veuillez réessayer.";
    if (error && error.message) {
      msg += `\nDétail : ${error.message}`;
    }
    displayMessage(formErrorDisplay, msg, "error");
  } finally {
    if (deliveryForm) {
      deliveryForm
        .querySelectorAll('button[type="submit"]')
        .forEach((btn) => (btn.disabled = false));
    }
  }
}

// Les fonctions liées à la gestion des employés et au suivi (toggleEmployeeListBtn,
// fetchEmployeeNames, populateEmployeeList, filterEmployeeList, hideEmployeePopup,
// employeeTrackingBtn, window.loadDeliveries, window.showAgentActivity, etc.)
// ont été retirées de ce script car elles ne sont pas liées directement
// au formulaire de validation de livraison et sont supposées être gérées
// par d'autres scripts (par exemple, un script pour le panneau d'administration).
// Ce script se consnjsdbjsydgjshdtre dxhjbsésormaidhjs uniquement sur le formulaire employé.
/***djh*/
