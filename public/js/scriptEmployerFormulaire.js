// --- DÉCLARATION DES VARIABLES GLOBALES AVANT TOUTE FONCTION ---
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
          "https://plateformdesuivie-its-service.onrender.com/html/acconier_auth.html";
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
    "https://plateformdesuivie-its-service.onrender.com/html/interfaceFormulaireEmployer.html";
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
      <div style='display:flex;align-items:center;justify-content:space-between;padding:18px 22px 10px 22px;border-bottom:1.5px solid #e0e7ff;'>
        <span style='font-weight:700;font-size:1.13em;color:#2563eb;letter-spacing:0.5px;'>Historique des ordres de livraison</span>
        <button id='closeHistorySidebarBtn' style='background:none;border:none;font-size:1.5em;color:#2563eb;cursor:pointer;'><i class='fas fa-times'></i></button>
      </div>
      <div id='historySidebarList' style='flex:1;overflow-y:auto;padding:18px 22px 18px 22px;'></div>
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
    let filteredHistory = agentHistory.filter(
      (item) => item && item.data && typeof item.data === "object"
    );
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
      // Ajout du nom de l'utilisateur (Serge) à côté de la date, responsive
      html += `<div class="history-date-user">
        <span class="history-date">${dateAffichee}</span>
        <span class="history-user">Serge</span>
      </div>`;
      html += '<ul style="list-style:none;padding:0;margin:0;">';
      ordersByDate[dateKey].forEach((item, idx) => {
        // Génère la carte de l'ordre
        let liHtml = `<li class="history-order-item" data-history-idx="${globalIdx}" style="background:linear-gradient(90deg,#f1f5f9 80%,#e0e7ff 100%);margin-bottom:7px;padding:18px 18px 16px 18px;border-radius:14px;box-shadow:0 2px 10px #2563eb13;display:flex;flex-direction:column;gap:7px;cursor:pointer;transition:box-shadow 0.18s;position:relative;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:2px;">
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
          <div style="color:#1e293b;font-size:1.04em;font-weight:500;">${
            item.details
          }</div>
          <button class="delete-history-btn desktop-in mobile-out" data-history-idx="${globalIdx}" title="Supprimer cet ordre"><i class='fas fa-trash'></i></button>
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
        // Ne pas ouvrir le détail si clic sur le bouton suppression
        if (e.target.closest(".delete-history-btn")) return;
        var idx = parseInt(this.getAttribute("data-history-idx"));
        var order = filteredHistory[idx];
        window.showOrderDetailPopup(order);
      });
    }

    // Ajoute l'écouteur sur chaque bouton de suppression
    var deleteBtns = listDiv.querySelectorAll(".delete-history-btn");
    for (var j = 0; j < deleteBtns.length; j++) {
      deleteBtns[j].addEventListener("click", function (e) {
        e.stopPropagation();
        var idx = parseInt(this.getAttribute("data-history-idx"));
        var orderToDelete = filteredHistory[idx];
        // Pop-up de confirmation personnalisée
        if (document.getElementById("confirmDeletePopup")) return; // évite doublon
        var popupBg = document.createElement("div");
        popupBg.id = "confirmDeletePopup";
        popupBg.style.position = "fixed";
        popupBg.style.top = "0";
        popupBg.style.left = "0";
        popupBg.style.width = "100vw";
        popupBg.style.height = "100vh";
        popupBg.style.background = "rgba(30,41,59,0.32)";
        popupBg.style.zIndex = "6000";
        popupBg.style.display = "flex";
        popupBg.style.alignItems = "center";
        popupBg.style.justifyContent = "center";
        // Boîte
        var popupBox = document.createElement("div");
        // Responsive styles for popupBox
        var isMobile =
          window.matchMedia && window.matchMedia("(max-width: 600px)").matches;
        popupBox.style.background = "#fff";
        popupBox.style.borderRadius = isMobile ? "13px" : "16px";
        popupBox.style.boxShadow = isMobile
          ? "0 2px 16px #2563eb22"
          : "0 4px 24px #2563eb22";
        popupBox.style.padding = isMobile
          ? "18px 7vw 14px 7vw"
          : "28px 22px 18px 22px";
        popupBox.style.maxWidth = isMobile ? "98vw" : "95vw";
        popupBox.style.width = isMobile ? "98vw" : "340px";
        popupBox.style.textAlign = "center";
        popupBox.style.position = "relative";
        popupBox.style.margin = isMobile ? "0 1vw" : "";
        // Message
        var msg = document.createElement("div");
        msg.textContent =
          "Voulez-vous vraiment supprimer cet ordre de livraison ?";
        msg.style.fontWeight = "600";
        msg.style.fontSize = isMobile ? "1em" : "1.08em";
        msg.style.color = "#1e293b";
        msg.style.marginBottom = isMobile ? "13px" : "18px";
        msg.style.lineHeight = isMobile ? "1.35" : "1.2";
        popupBox.appendChild(msg);
        // Boutons
        var btns = document.createElement("div");
        btns.style.display = "flex";
        btns.style.justifyContent = "center";
        btns.style.gap = isMobile ? "10px" : "18px";
        btns.style.flexDirection = isMobile ? "column" : "row";
        btns.style.alignItems = "center";
        // Confirmer
        var confirmBtn = document.createElement("button");
        confirmBtn.textContent = "Supprimer";
        confirmBtn.style.background = "#dc2626";
        confirmBtn.style.color = "#fff";
        confirmBtn.style.border = "none";
        confirmBtn.style.borderRadius = isMobile ? "7px" : "8px";
        confirmBtn.style.padding = isMobile ? "10px 0" : "8px 22px";
        confirmBtn.style.fontWeight = "700";
        confirmBtn.style.fontSize = isMobile ? "1.04em" : "1em";
        confirmBtn.style.cursor = "pointer";
        confirmBtn.style.width = isMobile ? "100%" : "auto";
        // Annuler
        var cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Annuler";
        cancelBtn.style.background = "#f1f5f9";
        cancelBtn.style.color = "#2563eb";
        cancelBtn.style.border = "none";
        cancelBtn.style.borderRadius = isMobile ? "7px" : "8px";
        cancelBtn.style.padding = isMobile ? "10px 0" : "8px 22px";
        cancelBtn.style.fontWeight = "700";
        cancelBtn.style.fontSize = isMobile ? "1.04em" : "1em";
        cancelBtn.style.cursor = "pointer";
        cancelBtn.style.width = isMobile ? "100%" : "auto";
        cancelBtn.style.marginTop = isMobile ? "7px" : "0";
        btns.appendChild(confirmBtn);
        btns.appendChild(cancelBtn);
        popupBox.appendChild(btns);
        // Fermer au clic sur Annuler ou fond
        cancelBtn.onclick = function () {
          popupBg.remove();
        };
        popupBg.onclick = function (e) {
          if (e.target === popupBg) popupBg.remove();
        };
        // Action suppression réelle
        confirmBtn.onclick = function () {
          popupBg.remove();
          const historyKey = "simulatedHistoryData";
          let historyData = JSON.parse(localStorage.getItem(historyKey)) || {};
          let agentHistory = historyData["Agent Acconier"] || [];
          historyData["Agent Acconier"] = agentHistory.filter((item) => {
            if (orderToDelete.id && item.id && item.id === orderToDelete.id)
              return false;
            if (!orderToDelete.id) {
              return (
                JSON.stringify(item.data) !== JSON.stringify(orderToDelete.data)
              );
            }
            return true;
          });
          localStorage.setItem(historyKey, JSON.stringify(historyData));
          window.renderHistorySidebarList();
        };
        popupBg.appendChild(popupBox);
        document.body.appendChild(popupBg);
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
    // Titre principal
    var title = document.createElement("div");
    title.textContent = "Détail de l'ordre de livraison";
    title.style.color = "#2563eb";
    title.style.fontWeight = "bold";
    title.style.fontSize = isMobile ? "1.08em" : "1.18em";
    title.style.marginBottom = isMobile ? "18px" : "16px";
    title.style.marginTop = isMobile ? "18px" : "0";
    title.style.textAlign = "center";
    modalBox.appendChild(title);

    // Contenu détaillé ou message d'erreur si data absent
    var html = "";
    if (!order || !order.data) {
      html = `<div style='color:#dc2626;font-weight:bold;padding:18px 0;text-align:center;'>Aucune donnée détaillée à afficher pour cet ordre.<br>Vérifiez la sauvegarde de l'historique.</div>`;
    } else {
      var d = order.data;
      html = `<div class="order-detail-main" style="display:flex;flex-direction:column;gap:${
        isMobile ? "10px" : "16px"
      };font-size:${isMobile ? "0.99em" : "1.07em"};line-height:1.7;">
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "7px" : "18px"
        };justify-content:space-between;align-items:center;background:#f1f5f9;padding:${
        isMobile ? "10px 8px" : "12px 18px"
      };border-radius:12px;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Date</span><br><span style='font-weight:700;color:#2563eb;'>${
            order.date || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Agent</span><br><span style='font-weight:700;'>${
            d.employeeName || "-"
          }</span></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "7px" : "18px"
        };justify-content:space-between;align-items:center;background:#f8fafc;padding:${
        isMobile ? "10px 8px" : "12px 18px"
      };border-radius:12px;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Client</span><br><span style='font-weight:700;'>${
            d.clientName || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Téléphone</span><br><span style='font-weight:700;'>${
            d.clientPhone || "-"
          }</span></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "7px" : "18px"
        };justify-content:space-between;align-items:center;background:#f1f5f9;padding:${
        isMobile ? "10px 8px" : "12px 18px"
      };border-radius:12px;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Conteneur(s)</span><br><span style='font-weight:700;'>${
            Array.isArray(d.containerNumbers)
              ? d.containerNumbers.join(", ")
              : d.containerNumbers || "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:500;'>Type(s) de pied</span><br><span style='font-weight:700;'>${
            d.containerFootType || "-"
          }</span></div>
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
        renderContainerTags();
        renderContainerFootTypes();
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
    // Rafraîchir la zone dynamique des types de pied à chaque modif de tags
    renderContainerFootTypes();
  }

  // Ajout d'un tag à la validation (entrée, virgule, point-virgule)
  containerTagsInput.addEventListener("keydown", (e) => {
    if (
      ["Enter", ",", ";"].includes(e.key) ||
      e.keyCode === 188 ||
      e.keyCode === 186
    ) {
      e.preventDefault();
      const value = containerTagsInput.value.trim();
      if (value && !containerTags.includes(value)) {
        containerTags.push(value);
        renderContainerTags();
      }
      containerTagsInput.value = "";
      renderContainerTags();
    }
  });
  // Ajout par collage de plusieurs numéros séparés
  containerTagsInput.addEventListener("paste", (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    if (pasted) {
      e.preventDefault();
      pasted.split(/[\n,;]+/).forEach((val) => {
        const v = val.trim();
        if (v && !containerTags.includes(v)) {
          containerTags.push(v);
        }
      });
      renderContainerTags();
      containerTagsInput.value = "";
      renderContainerTags();
    }
  });
  // Clic sur l'icône Entrée verte
  enterIcon.addEventListener("click", function () {
    const value = containerTagsInput.value.trim();
    if (value && !containerTags.includes(value)) {
      containerTags.push(value);
      renderContainerTags();
    }
    containerTagsInput.value = "";
    renderContainerTags();
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
  renderContainerFootTypes();
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
  // Synchronise la longueur du tableau
  containerFootTypes = containerTags.map((tc, idx) => ({
    tc,
    pied: containerFootTypes[idx] ? containerFootTypes[idx].pied : "",
  }));
  containerWeights = containerTags.map((tc, idx) =>
    containerWeights[idx] !== undefined ? containerWeights[idx] : ""
  );
  renderContainerFootTypes();
}

// Ajout dans renderContainerTags pour déclencher la synchro
const originalRenderContainerTags = renderContainerTags;
renderContainerTags = function () {
  originalRenderContainerTags();
  syncFootTypesWithTags();
};
// Appel initial si tags déjà présents
syncFootTypesWithTags();

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
          containerTypeAndContentInput,
          lieuInput,
          containerNumberInput,
          // containerFootTypeSelect, // SUPPRIMÉ : ce champ n'existe plus, remplacé par la zone dynamique
          declarationNumberInput,
          numberOfContainersInput,
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

        // Le numéro de téléphone client est totalement facultatif : aucune validation, aucune contrainte, aucune bordure rouge.
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
    !containerTypeAndContentInput ||
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
    containerTypeAndContent,
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
  formData.append("status", status); // Le statut est maintenant 'pending_acconier' pour le bouton Valider
  formData.append("lieu", lieu);
  // On envoie la liste des numéros TC sous forme de chaîne séparée par des virgules (ou tableau si backend accepte)
  formData.append("container_number", containerNumbers.join(", "));
  formData.append("container_foot_type", containerFootType);
  formData.append("declaration_number", declarationNumber);
  formData.append("number_of_containers", numberOfContainers);
  formData.append("weight", weight);
  formData.append("ship_name", shipName);
  formData.append("circuit", circuit);
  formData.append("transporter_mode", transporterMode);

  // Ajout du champ technique pour le backend (affichage correct du statut)
  let deliveryStatusAcconier = "pending_acconier";
  if (status === "pending_acconier") {
    deliveryStatusAcconier = "pending_acconier";
  } else if (
    status === "rejected_by_employee" ||
    status === "rejected_acconier"
  ) {
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

  if (finalBlNumber) formData.append("bl_number", finalBlNumber);
  if (finalDossierNumber) formData.append("dossier_number", finalDossierNumber);
  if (finalShippingCompany)
    formData.append("shipping_company", finalShippingCompany);

  // Pour évolution backend, possibilité d'envoyer aussi le mapping complet :
  formData.append(
    "container_foot_types_map",
    JSON.stringify(containerFootTypesData)
  );

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
        "https://plateformdesuivie-its-service.onrender.com/deliveries/validate";
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
      // Rafraîchit la liste des agents côté suivi après succès serveur
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
// Ce script se concentre désormais uniquement sur le formulaire employé.
