// --- DÉCLARATION DES VARIABLES GLOBALES AVANT TOUTE FONCTION ---
// Variables globales pour la sidebar mobile
let selectedOrders = new Set();
let allOrders = [];

// --- Animation d'intro avant le formulaire ---
window.addEventListener("DOMContentLoaded", function () {
  const introElement = document.getElementById("introAnimation");
  const appContainer = document.getElementById("appContainer");
  const progressBar = document.getElementById("introProgressBar");
  if (introElement && appContainer && progressBar) {
    let interval = 50;
    let percent = 0;
    let phase = 0;
    let elapsed = 0;
    let timer = setInterval(function () {
      elapsed += interval;
      // Phase 0 : progression jusqu'à 50% sur 2s
      if (phase === 0) {
        percent = Math.min(50, Math.round((elapsed / 2000) * 50));
        if (percent >= 50) {
          percent = 50;
          phase = 1;
          elapsed = 0;
        }
      }
      // Phase 1 : pause 5s à 50%
      else if (phase === 1) {
        percent = 50;
        if (elapsed >= 5000) {
          phase = 2;
          elapsed = 0;
        }
      }
      // Phase 2 : progression rapide et brusque de 50% à 100% en 500ms
      else if (phase === 2) {
        percent = 50 + Math.min(50, Math.round((elapsed / 500) * 50));
        if (percent >= 100) {
          percent = 100;
          clearInterval(timer);
          setTimeout(function () {
            introElement.style.display = "none";
            appContainer.style.display = "";
          }, 300);
        }
      }
      progressBar.style.width = percent + "%";
    }, interval);
  }
});
/***PLATEFORME D'ORDRE DE LIVRAISON */
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

// --- NOUVELLE SIDEBAR HISTORIQUE MOBILE ---
/**
 * Crée et initialise la nouvelle sidebar d'historique optimisée pour mobile
 */
window.createMobileHistorySidebar = function () {
  // Fonction utilitaire pour formater les dates
  window.formatOrderDate = function (dateValue) {
    if (!dateValue) return "Non spécifiée";

    try {
      let date;

      // Si c'est déjà un objet Date
      if (dateValue instanceof Date) {
        date = dateValue;
      }
      // Si c'est un timestamp en millisecondes
      else if (typeof dateValue === "number") {
        date = new Date(dateValue);
      }
      // Si c'est une chaîne de caractères
      else if (typeof dateValue === "string") {
        // Essayer différents formats
        date = new Date(dateValue);

        // Si la date n'est pas valide, essayer d'autres formats
        if (isNaN(date.getTime())) {
          // Format DD/MM/YYYY HH:MM
          const parts = dateValue.match(
            /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{1,2})/
          );
          if (parts) {
            date = new Date(
              parts[3],
              parts[2] - 1,
              parts[1],
              parts[4],
              parts[5]
            );
          } else {
            // Essayer le format ISO
            date = new Date(
              dateValue.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")
            );
          }
        }
      }

      // Vérifier si la date est valide
      if (!date || isNaN(date.getTime())) {
        return "Date invalide";
      }

      // Formater la date en français
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.warn("Erreur formatage date:", dateValue, error);
      return "Date invalide";
    }
  };

  // Supprimer l'ancienne sidebar si elle existe
  const oldSidebar = document.getElementById("historySidebarFormulaire");
  if (oldSidebar) {
    oldSidebar.remove();
  }

  // Créer la nouvelle sidebar
  const sidebarHTML = `
    <div id="mobileHistorySidebar" style="
      position: fixed;
      top: 0;
      right: -100%;
      width: 100vw;
      max-width: 400px;
      height: 100vh;
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
      z-index: 9998;
      transition: right 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-left: 1px solid rgba(37, 99, 235, 0.1);
    ">
      <!-- Header professionnel -->
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 24px;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          pointer-events: none;
        "></div>
        <div style="position: relative; z-index: 2;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="
                background: rgba(255, 255, 255, 0.2);
                padding: 8px;
                border-radius: 12px;
                backdrop-filter: blur(10px);
              ">
                <i class="fas fa-history" style="font-size: 1.5em; color: white;"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.3em; font-weight: 800; letter-spacing: -0.5px;">Historique</h3>
                <p style="margin: 0; font-size: 0.9em; opacity: 0.85; font-weight: 500;">Ordres de livraison</p>
              </div>
            </div>
            <button id="closeMobileHistoryBtn" style="
              background: rgba(255, 255, 255, 0.15);
              border: 1px solid rgba(255, 255, 255, 0.2);
              color: white;
              width: 40px;
              height: 40px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              backdrop-filter: blur(10px);
            " onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              <i class="fas fa-times" style="font-size: 1.1em;"></i>
            </button>
          </div>
          
          <!-- Statistiques -->
          <div style="
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 8px;
          ">
            <div style="
              background: rgba(255, 255, 255, 0.15);
              padding: 8px 12px;
              border-radius: 20px;
              display: flex;
              align-items: center;
              gap: 6px;
              backdrop-filter: blur(10px);
            ">
              <i class="fas fa-chart-line" style="font-size: 0.9em;"></i>
              <span style="font-weight: 600; font-size: 0.9em;">Total: <span id="mobileHistoryCount">0</span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Barre de recherche et actions -->
      <div style="
        background: white;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      ">
        <div style="
          position: relative;
          margin-bottom: 12px;
        ">
          <input type="text" id="historySearchInput" placeholder="Rechercher par client, TC, lieu..." style="
            width: 100%;
            padding: 12px 16px 12px 44px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 0.95em;
            background: #f9fafb;
            transition: all 0.2s ease;
            box-sizing: border-box;
          " onfocus="this.style.borderColor='#667eea'; this.style.background='white'" onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'">
          <i class="fas fa-search" style="
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
            font-size: 1em;
          "></i>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button id="selectAllOrdersBtn" style="
            flex: 1;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.85em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
            <i class="fas fa-check-square" style="margin-right: 6px;"></i>Sélectionner
          </button>
          <button id="deleteSelectedOrdersBtn" style="
            flex: 1;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.85em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
            opacity: 0.6;
            pointer-events: none;
          " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
            <i class="fas fa-trash" style="margin-right: 6px;"></i>Supprimer
          </button>
        </div>
      </div>

      <!-- Zone de contenu avec scroll -->
      <div id="mobileHistoryContent" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
        background: #f8fafc;
      ">
        <div style="
          text-align: center;
          color: #64748b;
          font-size: 1em;
          padding: 40px 20px;
        ">
          <i class="fas fa-hourglass-half" style="font-size: 2em; margin-bottom: 16px; opacity: 0.5;"></i>
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    </div>

    <!-- Overlay pour fermer la sidebar -->
    <div id="mobileHistoryOverlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      z-index: 9997;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      backdrop-filter: blur(2px);
    "></div>

    <!-- Modal pour les détails d'un ordre -->
    <div id="orderDetailModal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    ">
      <div id="orderDetailContent" style="
        background: white;
        border-radius: 16px;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        transform: scale(0.8);
        transition: transform 0.3s ease;
      ">
        <!-- Le contenu sera injecté dynamiquement -->
      </div>
    </div>
  `;

  // Injecter la sidebar dans le body
  document.body.insertAdjacentHTML("beforeend", sidebarHTML);

  // Ajouter les événements
  const sidebar = document.getElementById("mobileHistorySidebar");
  const overlay = document.getElementById("mobileHistoryOverlay");
  const closeBtn = document.getElementById("closeMobileHistoryBtn");
  const searchInput = document.getElementById("historySearchInput");
  const selectAllBtn = document.getElementById("selectAllOrdersBtn");
  const deleteBtn = document.getElementById("deleteSelectedOrdersBtn");
  const orderModal = document.getElementById("orderDetailModal");

  // Fonction pour ouvrir la sidebar
  window.openMobileHistorySidebar = function () {
    sidebar.style.right = "0";
    overlay.style.opacity = "1";
    overlay.style.visibility = "visible";
    document.body.style.overflow = "hidden";

    // Charger l'historique
    loadMobileHistoryData();
  };

  // Fonction pour fermer la sidebar
  window.closeMobileHistorySidebar = function () {
    sidebar.style.right = "-100%";
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";
    document.body.style.overflow = "";
    selectedOrders.clear();
    updateSelectionUI();
  };

  // Fonction pour afficher les détails d'un ordre
  window.showOrderDetails = function (orderData, orderDate) {
    const modalContent = document.getElementById("orderDetailContent");
    const containerNumbers = Array.isArray(orderData.containerNumbers)
      ? orderData.containerNumbers
      : (orderData.containerNumbers || "")
          .split(",")
          .map((s) => s.trim())
          .filter((tc) => tc);

    // Formater la date correctement avec notre fonction utilitaire
    const formattedDate = window.formatOrderDate
      ? window.formatOrderDate(orderDate)
      : "Non spécifiée";

    // Créer le contenu pour les conteneurs (menu déroulant si plus d'un)
    let containersContent = "";
    if (containerNumbers.length === 0) {
      containersContent = `<p style="margin: 0; color: #64748b;">Aucun conteneur spécifié</p>`;
    } else if (containerNumbers.length === 1) {
      containersContent = `
        <span style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: 600;
          display: inline-block;
        ">${containerNumbers[0]}</span>
      `;
    } else {
      containersContent = `
        <div style="position: relative; display: inline-block;">
          <button onclick="toggleContainerDropdown()" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            ${
              containerNumbers.length
            } conteneurs <i class="fas fa-chevron-down"></i>
          </button>
          <div id="containerDropdown" style="
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            z-index: 1000;
            margin-top: 4px;
            max-height: 200px;
            overflow-y: auto;
            display: none;
          ">
            ${containerNumbers
              .map(
                (tc) => `
              <div style="
                padding: 8px 12px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 0.9em;
                color: #374151;
                background: #fafafa;
                font-weight: 600;
              ">${tc}</div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    modalContent.innerHTML = `
      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1e293b; font-size: 1.4em;">📋 Détails de l'ordre</h2>
          <button onclick="closeOrderDetails()" style="
            background: #f1f5f9;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <i class="fas fa-times" style="color: #64748b;"></i>
          </button>
        </div>
        
        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 1.1em;">Client</h3>
          <p style="margin: 0; font-size: 1.1em; font-weight: 600; color: #1e293b;">${
            orderData.clientName || "Non spécifié"
          }</p>
        </div>

        <!-- Date de création de l'ordre -->
        <div style="background: #ecfdf5; padding: 12px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #10b981;">
          <h4 style="margin: 0 0 4px 0; color: #065f46; font-size: 0.85em;">DATE DE CRÉATION</h4>
          <p style="margin: 0; font-weight: 600; color: #064e3b;">${formattedDate}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4 style="margin: 0 0 4px 0; color: #64748b; font-size: 0.85em;">TÉLÉPHONE</h4>
            <p style="margin: 0; font-weight: 600;">${
              orderData.clientPhone || "-"
            }</p>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4 style="margin: 0 0 4px 0; color: #64748b; font-size: 0.85em;">LIEU</h4>
            <p style="margin: 0; font-weight: 600;">${orderData.lieu || "-"}</p>
          </div>
        </div>

        <div style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
          <h4 style="margin: 0 0 12px 0; color: #667eea; font-size: 1em;">Conteneurs</h4>
          <div>${containersContent}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4 style="margin: 0 0 4px 0; color: #64748b; font-size: 0.85em;">N° BL</h4>
            <p style="margin: 0; font-weight: 600;">${
              orderData.blNumber || "-"
            }</p>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4 style="margin: 0 0 4px 0; color: #64748b; font-size: 0.85em;">DÉCLARATION</h4>
            <p style="margin: 0; font-weight: 600;">${
              orderData.declarationNumber || "-"
            }</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4 style="margin: 0 0 4px 0; color: #64748b; font-size: 0.85em;">NAVIRE</h4>
            <p style="margin: 0; font-weight: 600;">${
              orderData.shipName || "-"
            }</p>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h4 style="margin: 0 0 4px 0; color: #64748b; font-size: 0.85em;">MODE TRANSPORT</h4>
            <p style="margin: 0; font-weight: 600;">${
              orderData.transporterMode || "-"
            }</p>
          </div>
        </div>

        <div style="background: #f0f9ff; padding: 12px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 0.85em;">INFORMATIONS SUPPLÉMENTAIRES</h4>
          <p style="margin: 0; font-size: 0.9em; color: #0c4a6e;">
            Circuit: ${orderData.circuit || "-"} | 
            Compagnie: ${orderData.shippingCompany || "-"} | 
            Poids: ${orderData.weight || "-"}
          </p>
        </div>
      </div>
    `;

    orderModal.style.opacity = "1";
    orderModal.style.visibility = "visible";
    document.getElementById("orderDetailContent").style.transform = "scale(1)";
  };

  // Fonction pour basculer le menu déroulant des conteneurs
  window.toggleContainerDropdown = function () {
    const dropdown = document.getElementById("containerDropdown");
    if (dropdown) {
      dropdown.style.display =
        dropdown.style.display === "none" ? "block" : "none";
    }
  };

  // Fermer le dropdown si on clique ailleurs
  document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("containerDropdown");
    if (
      dropdown &&
      !event.target.closest('[onclick="toggleContainerDropdown()"]')
    ) {
      dropdown.style.display = "none";
    }
  });

  // Fonction pour fermer les détails
  window.closeOrderDetails = function () {
    orderModal.style.opacity = "0";
    orderModal.style.visibility = "hidden";
    document.getElementById("orderDetailContent").style.transform =
      "scale(0.8)";
  };

  // Fonction pour mettre à jour l'UI de sélection (globale)
  window.updateSelectionUI = function () {
    const deleteBtn = document.getElementById("deleteSelectedOrdersBtn");
    const selectAllBtn = document.getElementById("selectAllOrdersBtn");

    if (!deleteBtn || !selectAllBtn) return;

    const count = selectedOrders.size;
    if (count > 0) {
      deleteBtn.style.opacity = "1";
      deleteBtn.style.pointerEvents = "auto";
      selectAllBtn.innerHTML = `<i class="fas fa-times-circle" style="margin-right: 6px;"></i>Désélectionner`;
    } else {
      deleteBtn.style.opacity = "0.6";
      deleteBtn.style.pointerEvents = "none";
      selectAllBtn.innerHTML = `<i class="fas fa-check-square" style="margin-right: 6px;"></i>Sélectionner`;
    }
  };

  // Événements de fermeture
  closeBtn.addEventListener("click", window.closeMobileHistorySidebar);
  overlay.addEventListener("click", window.closeMobileHistorySidebar);
  orderModal.addEventListener("click", (e) => {
    if (e.target === orderModal) window.closeOrderDetails();
  });

  // Événement de recherche
  searchInput.addEventListener("input", function () {
    filterOrders(this.value.toLowerCase());
  });

  // Événement de sélection/désélection
  selectAllBtn.addEventListener("click", function () {
    if (selectedOrders.size > 0) {
      selectedOrders.clear();
    } else {
      allOrders.forEach((_, index) => selectedOrders.add(index));
    }
    updateSelectionUI();
    updateOrderCheckboxes();
  });

  // Événement de suppression
  deleteBtn.addEventListener("click", function () {
    if (selectedOrders.size === 0) return;

    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer ${selectedOrders.size} ordre(s) ?`
      )
    ) {
      deleteSelectedOrders();
    }
  });

  // Connecter le bouton historique existant
  const historyBtn = document.getElementById("historySidebarBtn");
  if (historyBtn) {
    historyBtn.addEventListener("click", window.openMobileHistorySidebar);
  }

  // Fonctions utilitaires
  function filterOrders(searchTerm) {
    const orderElements = document.querySelectorAll(".mobile-order-item");
    orderElements.forEach((element) => {
      const text = element.textContent.toLowerCase();
      element.style.display = text.includes(searchTerm) ? "block" : "none";
    });
  }

  function updateOrderCheckboxes() {
    document
      .querySelectorAll(".order-checkbox-mobile")
      .forEach((checkbox, index) => {
        checkbox.checked = selectedOrders.has(index);
      });
  }

  function deleteSelectedOrders() {
    const historyKey = "simulatedHistoryData";
    const historyData = JSON.parse(localStorage.getItem(historyKey)) || {};
    const agentHistory = historyData["Agent Acconier"] || [];

    // Supprimer les ordres sélectionnés (en ordre décroissant pour éviter les problèmes d'index)
    const sortedIndexes = Array.from(selectedOrders).sort((a, b) => b - a);
    sortedIndexes.forEach((index) => {
      if (agentHistory[index]) {
        agentHistory.splice(index, 1);
      }
    });

    // Sauvegarder
    historyData["Agent Acconier"] = agentHistory;
    localStorage.setItem(historyKey, JSON.stringify(historyData));

    // Réinitialiser et recharger
    selectedOrders.clear();
    updateSelectionUI();
    loadMobileHistoryData();
  }
};

/**
 * Charge et affiche les données d'historique dans la sidebar mobile
 */
/**
 * Charge et affiche les données d'historique dans la sidebar mobile avec fonctionnalités avancées
 */
window.loadMobileHistoryData = function () {
  const contentDiv = document.getElementById("mobileHistoryContent");
  const countSpan = document.getElementById("mobileHistoryCount");

  if (!contentDiv || !countSpan) return;

  const historyKey = "simulatedHistoryData";
  const historyData = JSON.parse(localStorage.getItem(historyKey)) || {};
  const agentHistory = historyData["Agent Acconier"] || [];

  // Filtrer les données valides
  const filteredHistory = agentHistory.filter((item) => {
    return item && item.data && typeof item.data === "object" && item.date;
  });

  // Mettre à jour le compteur et stocker les données globalement
  countSpan.textContent = filteredHistory.length;
  allOrders = filteredHistory;

  if (filteredHistory.length === 0) {
    contentDiv.innerHTML = `
      <div style="
        text-align: center;
        color: #64748b;
        font-size: 1em;
        padding: 40px 20px;
        background: white;
        border-radius: 12px;
        border: 2px dashed #e2e8f0;
        margin-top: 20px;
      ">
        <i class="fas fa-inbox" style="font-size: 2.5em; margin-bottom: 16px; opacity: 0.4;"></i>
        <p style="margin: 0; font-weight: 500;">Aucun ordre de livraison</p>
        <p style="margin: 8px 0 0 0; font-size: 0.9em; opacity: 0.7;">Les ordres validés apparaîtront ici</p>
      </div>
    `;
    return;
  }

  // Générer le HTML des ordres avec fonctionnalités cliquables
  let ordersHTML = "";
  filteredHistory.slice(0, 20).forEach((item, index) => {
    let containerNumbers = item.data.containerNumbers || [];
    if (typeof containerNumbers === "string") {
      containerNumbers = containerNumbers.split(",").map((s) => s.trim());
    }

    ordersHTML += `
      <div class="mobile-order-item" style="
        background: white;
        margin-bottom: 12px;
        border-radius: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #f1f5f9;
        overflow: hidden;
        transition: all 0.3s ease;
        position: relative;
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.12)'" 
         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'">
        
        <!-- Checkbox de sélection -->
        <div style="
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 5;
        ">
          <input type="checkbox" class="order-checkbox-mobile" data-order-index="${index}" style="
            width: 18px;
            height: 18px;
            accent-color: #667eea;
            cursor: pointer;
            border-radius: 4px;
            border: 2px solid #d1d5db;
          " onchange="toggleOrderSelection(${index}, this.checked)">
        </div>
        
        <!-- Contenu cliquable -->
        <div onclick="showOrderDetails(allOrders[${index}].data, allOrders[${index}].date)" style="
          padding: 20px;
          cursor: pointer;
          padding-right: 50px;
        ">
          <!-- Header avec client -->
          <div style="
            display: flex;
            justify-content: flex-start;
            align-items: center;
            margin-bottom: 12px;
          ">
            <div style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-weight: 700;
              font-size: 0.9em;
              letter-spacing: 0.3px;
            ">
              <i class="fas fa-user" style="margin-right: 6px; font-size: 0.8em;"></i>
              ${item.data.clientName || "Client inconnu"}
            </div>
          </div>

          <!-- Informations principales -->
          <div style="margin-bottom: 12px;">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
              padding: 8px 12px;
              background: #f8fafc;
              border-radius: 8px;
            ">
              <i class="fas fa-shipping-fast" style="color: #667eea; width: 16px;"></i>
              <span style="font-size: 0.9em; color: #475569;">
                <strong>TC:</strong> ${
                  containerNumbers.length > 0
                    ? containerNumbers.slice(0, 2).join(", ")
                    : "Non spécifié"
                }
                ${
                  containerNumbers.length > 2
                    ? `<span style="color: #64748b; font-size: 0.85em;"> +${
                        containerNumbers.length - 2
                      }</span>`
                    : ""
                }
              </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div style="
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.85em;
                color: #475569;
              ">
                <i class="fas fa-map-marker-alt" style="color: #64748b; width: 14px;"></i>
                ${item.data.lieu || "Non spécifié"}
              </div>
              <div style="
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.85em;
                color: #475569;
              ">
                <i class="fas fa-calendar" style="color: #64748b; width: 14px;"></i>
                ${formatOrderDate(item.date)}
              </div>
            </div>
          </div>

          <!-- Indicateur cliquable -->
          <div style="
            text-align: center;
            padding: 8px;
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border-radius: 8px;
            font-size: 0.8em;
            color: #667eea;
            font-weight: 600;
          ">
            <i class="fas fa-eye" style="margin-right: 6px;"></i>
            Cliquer pour voir les détails
          </div>
        </div>
      </div>
    `;
  });

  contentDiv.innerHTML = ordersHTML;

  // Réinitialiser les sélections
  selectedOrders.clear();
  if (window.updateSelectionUI) {
    window.updateSelectionUI();
  }

  console.log(
    "✅ Historique mobile affiché avec",
    filteredHistory.length,
    "éléments"
  );
};

// Fonction globale pour gérer la sélection des ordres
window.toggleOrderSelection = function (index, isChecked) {
  if (isChecked) {
    selectedOrders.add(index);
  } else {
    selectedOrders.delete(index);
  }
  if (window.updateSelectionUI) {
    window.updateSelectionUI();
  }
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
  if (
    acconier.nom &&
    typeof acconier.nom === "string" &&
    acconier.nom.trim().length > 0
  ) {
    const parts = acconier.nom.trim().split(/\s+/);
    initials = parts
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    if (!initials || initials === "") {
      initials = acconier.nom.trim()[0].toUpperCase();
    }
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
  if (!acconier) return;
  // Accepte nom, name, username
  let nom = "";
  if (
    acconier.nom &&
    typeof acconier.nom === "string" &&
    acconier.nom.trim().length > 0
  ) {
    nom = acconier.nom.trim();
  } else if (
    acconier.name &&
    typeof acconier.name === "string" &&
    acconier.name.trim().length > 0
  ) {
    nom = acconier.name.trim();
  } else if (
    acconier.username &&
    typeof acconier.username === "string" &&
    acconier.username.trim().length > 0
  ) {
    nom = acconier.username.trim();
  }
  if (!nom || !acconier.email) return;
  // On sauvegarde toujours sous la clé "nom"
  const acconierToSave = {
    nom: nom,
    email: acconier.email,
    avatar: acconier.avatar || "",
  };
  localStorage.setItem("acconier_user", JSON.stringify(acconierToSave));
  // Redirection directe vers l'ordre de livraison après connexion
  window.location.href =
    "https://plateformdesuivie-its-service-1cjx.onrender.com/html/interfaceFormulaireEmployer.html";
};

// Initialisation de l'affichage historique et avatar au chargement
document.addEventListener("DOMContentLoaded", () => {
  // Debug : vérifier les données d'historique au chargement
  const historyKey = "simulatedHistoryData";
  const currentHistory = JSON.parse(localStorage.getItem(historyKey)) || {};
  console.log("🔍 Vérification historique au chargement:", currentHistory);
  console.log(
    "📈 Nombre d'ordres pour Agent Acconier:",
    currentHistory["Agent Acconier"]
      ? currentHistory["Agent Acconier"].length
      : 0
  );

  // Créer la nouvelle sidebar mobile d'historique
  createMobileHistorySidebar();

  window.displayProfileAvatar && window.displayProfileAvatar();

  console.log("✅ Nouvelle sidebar d'historique mobile initialisée");

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

// Anciennes fonctions d'historique supprimées - remplacées par la nouvelle sidebar mobile

// Fonction de remplacement pour les anciens appels
function updateHistoryBtnVisibility() {
  // Cette fonction ne fait plus rien car remplacée par la nouvelle sidebar mobile
  return;
}

// --- Insertion dynamique du conteneur avatar à côté du formulaire ---
document.addEventListener("DOMContentLoaded", () => {
  // Cherche la section du formulaire de livraison
  const deliveryFormSection = document.getElementById("deliveryFormSection");
  const codeEntrySection = document.getElementById("codeEntrySection");

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

  // --- Fonction pour marquer les numéros TC en vert ---
  window.highlightTCNumbers = function (text) {
    if (!text) return text;
    // Pattern pour TC + 4 chiffres
    return text.replace(
      /\b(TC\s*\d{4})\b/gi,
      '<span class="tc-number">$1</span>'
    );
  };

  // --- Fonction pour marquer les messages de validation ---
  window.highlightValidationMessages = function (text) {
    if (!text) return text;
    // Marque les messages de validation en vert
    const validationKeywords = [
      "validé",
      "approuvé",
      "confirmé",
      "accepté",
      "vérifié",
    ];
    let result = text;
    validationKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword}[^\\s]*)\\b`, "gi");
      result = result.replace(
        regex,
        '<span class="validation-message">$1</span>'
      );
    });
    return result;
  };

  // --- Fonction pour marquer les messages de statut ---
  window.highlightStatusMessages = function (text) {
    if (!text) return text;
    // Marque les messages de statut en jaune
    const statusKeywords = [
      "en attente",
      "en cours",
      "traitement",
      "préparation",
      "planifié",
    ];
    let result = text;
    statusKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword}[^\\s]*)\\b`, "gi");
      result = result.replace(regex, '<span class="status-message">$1</span>');
    });
    return result;
  };

  // --- Mise à jour de la fonction showOrderDetails avec formatage des couleurs ---
  window.showOrderDetailPopup = function (order) {
    // Supprime l'ancien pop-up s'il existe
    let oldModal = document.getElementById("orderDetailModal");
    if (oldModal) oldModal.remove();
    // Crée le fond
    let modalBg = document.createElement("div");
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
    let modalBox = document.createElement("div");
    // Responsive styles
    let isMobile =
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
    let closeBtn = document.createElement("button");
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
    let title = document.createElement("div");
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
    let html = "";
    if (!order || !order.data) {
      html = `<div style='color:#dc2626;font-weight:bold;padding:18px 0;text-align:center;'>Aucune donnée détaillée à afficher pour cet ordre.<br>Vérifiez la sauvegarde de l'historique.</div>`;
    } else {
      let d = order.data;
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
            order.date
              ? window.highlightTCNumbers(formatOrderDate(order.date))
              : "-"
          }</span></div>
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:600;display:flex;align-items:center;gap:6px;'><i class='fas fa-user-tie' style='color:#3b82f6;'></i>Agent</span><br><span style='font-weight:700;' class='validation-message'>${
            d.employeeName || "-"
          }</span></div>
        </div>
        <!-- Informations client -->
        <div style="display:flex;flex-wrap:wrap;gap:${
          isMobile ? "8px" : "18px"
        };justify-content:space-between;align-items:center;background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);padding:${
        isMobile ? "12px 10px" : "14px 18px"
      };border-radius:12px;border-left:4px solid #10b981;">
          <div style="flex:1;min-width:120px;"><span style='color:#64748b;font-weight:600;display:flex;align-items:center;gap:6px;'><i class='fas fa-user-circle' style='color:#10b981;'></i>Client</span><br><span style='font-weight:700;' class='validation-message'>${
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
                     <span style='font-weight:700;' class='status-message'>${
                       containers.length
                     } conteneurs</span>
                     <i class='fas fa-chevron-down' style="color:#d97706;font-size:0.8em;transition:transform 0.3s ease;"></i>
                   </div>
                   <div class="container-list" style="display:none;margin-top:10px;border-top:1px solid #d97706;padding-top:8px;">
                     ${containers
                       .map(
                         (container) =>
                           `<div style="padding:4px 0;font-weight:600;font-size:0.9em;border-bottom:1px solid rgba(217,119,6,0.2);margin-bottom:4px;" class="tc-number">${window.highlightTCNumbers(
                             container
                           )}</div>`
                       )
                       .join("")}
                   </div>
                 </div>`
                  : `<span style='font-weight:700;' class='tc-number'>${window.highlightTCNumbers(
                      containers[0] || "-"
                    )}</span>`
              }
            </div>
            <div style="flex:1;min-width:120px;">
              <span style='color:#64748b;font-weight:600;display:flex;align-items:center;gap:6px;'><i class='fas fa-cogs' style='color:#f59e0b;'></i>Type(s) de pied</span><br>
              <span style='font-weight:700;' class='status-message'>${
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
        for (let i = 0; i < d.containerFootTypesData.length; i++) {
          let obj = d.containerFootTypesData[i];
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
    let contentDiv = document.createElement("div");
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

  // Affichage de l'historique au chargement de la page
  setTimeout(() => {
    if (window.displayAgentHistory) {
      window.displayAgentHistory("Agent Acconier");
    }
  }, 500);

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
        // Correction : toujours utiliser la clé 'Agent Acconier' pour l'historique
        const historyAgentKey = "Agent Acconier";
        if (!historyData[historyAgentKey]) historyData[historyAgentKey] = [];
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
          id: `form-op-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`, // ID plus unique
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

        // Ajouter au début de la liste (plus récent en premier)
        historyData[historyAgentKey].unshift(newOperation);

        // Limiter l'historique à 100 entrées maximum pour éviter un localStorage trop volumineux
        if (historyData[historyAgentKey].length > 100) {
          historyData[historyAgentKey] = historyData[historyAgentKey].slice(
            0,
            100
          );
        }

        // Sauvegarder dans localStorage
        localStorage.setItem(historyKey, JSON.stringify(historyData));

        // Log de confirmation
        console.log("✅ Nouvel ordre ajouté à l'historique:", newOperation);
        console.log(
          "📊 Total ordres dans l'historique:",
          historyData[historyAgentKey].length
        );
      } catch (e) {
        console.warn(
          "❌ Impossible d'ajouter à l'historique Agent Acconier :",
          e
        );
      }
      // --- FIN AJOUT HISTORIQUE ---
      // DEBUG : Affiche le contenu du localStorage juste après ajout
      console.log(
        "DEBUG localStorage.simulatedHistoryData =",
        localStorage.getItem("simulatedHistoryData")
      );
      // --- Mise à jour immédiate de l'affichage historique (nouvelle sidebar mobile) ---
      setTimeout(function () {
        // Mettre à jour la nouvelle sidebar mobile d'historique
        if (window.loadMobileHistoryData) {
          window.loadMobileHistoryData();
        }

        // Logs de debug pour vérifier
        console.log("✅ Historique mobile mis à jour après soumission");
        const historyKey = "simulatedHistoryData";
        const currentHistory =
          JSON.parse(localStorage.getItem(historyKey)) || {};
        console.log("📊 Données historique actuelles:", currentHistory);
      }, 200);
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

      // Affichage immédiat d'un message de confirmation simple avec animation
      setTimeout(() => {
        // Créer un popup de confirmation personnalisé avec animation
        const popup = document.createElement("div");
        popup.id = "validationPopup";
        popup.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 24px 32px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: Arial, sans-serif;
          animation: popupShow 0.6s ease-out forwards;
        `;

        popup.innerHTML = `
          <div style="font-size: 2em; animation: checkSpin 0.8s ease-out;">✅</div>
          <span style="font-size: 1.2em; font-weight: 600;">Ordre de livraison validé</span>
        `;

        // Ajouter les animations CSS
        const style = document.createElement("style");
        style.textContent = `
          @keyframes popupShow {
            0% { 
              transform: translate(-50%, -50%) scale(0) rotate(-180deg);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1) rotate(0deg);
              opacity: 1;
            }
            100% { 
              transform: translate(-50%, -50%) scale(1) rotate(0deg);
              opacity: 1;
            }
          }
          @keyframes checkSpin {
            0% { 
              transform: scale(0) rotate(0deg);
              opacity: 0;
            }
            50% {
              transform: scale(1.3) rotate(180deg);
              opacity: 1;
            }
            100% { 
              transform: scale(1) rotate(360deg);
              opacity: 1;
            }
          }
        `;

        if (!document.getElementById("validation-popup-style")) {
          style.id = "validation-popup-style";
          document.head.appendChild(style);
        }

        document.body.appendChild(popup);

        // Supprimer le popup après 3 secondes
        setTimeout(() => {
          popup.style.animation = "popupShow 0.3s ease-in reverse";
          setTimeout(() => {
            if (popup.parentNode) {
              popup.parentNode.removeChild(popup);
            }
          }, 300);
        }, 3000);
      }, 100);

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
/***djh1*/
