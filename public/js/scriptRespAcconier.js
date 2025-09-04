// Fonction pour gérer l'affichage des listes de conteneurs
function toggleContainerList(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  const allDropdowns = document.querySelectorAll('[id^="dropdown-"]');

  // Fermer tous les autres dropdowns
  allDropdowns.forEach((d) => {
    if (d.id !== dropdownId) {
      d.classList.add("d-none");
    }
  });

  // Basculer le dropdown actuel
  dropdown.classList.toggle("d-none");

  // Gestionnaire de clic en dehors pour fermer
  const closeDropdown = (e) => {
    if (
      !dropdown.contains(e.target) &&
      !e.target.closest(`button[onclick*="${dropdownId}"]`)
    ) {
      dropdown.classList.add("d-none");
      document.removeEventListener("click", closeDropdown);
    }
  };

  if (!dropdown.classList.contains("d-none")) {
    setTimeout(() => {
      document.addEventListener("click", closeDropdown);
    }, 0);
  }
}

// Stockage local pour les dossiers mis en livraison
const STORAGE_KEY = "dossiersMisEnLiv";

// 🔒 FONCTION POUR DÉSACTIVER L'ÉDITION DES OBSERVATIONS EN MODE ADMIN OU DEPUIS LE SIDEBAR
function disableObservationEditingInAdminMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminMode = urlParams.get("mode") === "admin";
  const fromDashboard = urlParams.get("fromDashboard") === "true";
  const fromSidebar = urlParams.get("from") === "sidebar";

  // Désactiver l'édition si c'est le mode admin avec fromDashboard OU si on vient du sidebar OU si on vient du dashboard (même sans mode admin)
  if ((isAdminMode && fromDashboard) || fromSidebar || fromDashboard) {
    let reasonText =
      "🔒 [MODE ADMIN] Désactivation de l'édition des observations";

    if (fromSidebar) {
      reasonText =
        "🔒 [FROM SIDEBAR] Désactivation de l'édition des observations (accès depuis le sidebar)";
    } else if (fromDashboard && !isAdminMode) {
      reasonText =
        "🔒 [FROM DASHBOARD] Désactivation de l'édition des observations (accès depuis le dashboard)";
    }

    console.log(reasonText);

    // Ajouter du CSS pour désactiver l'édition des cellules d'observation
    const style = document.createElement("style");
    style.innerHTML = `
      /* Désactiver l'édition des observations en mode admin/sidebar/dashboard (21ème colonne) */
      #deliveriesTable tbody td:nth-child(21) {
        background-color: #f3f4f6 !important;
        color: #6b7280 !important;
        cursor: not-allowed !important;
        user-select: none !important;
        /* Permettre les événements de survol pour les tooltips */
        pointer-events: auto !important;
      }
      
      /* Désactiver spécifiquement les clics et la sélection */
      #deliveriesTable tbody td:nth-child(21) * {
        pointer-events: none !important;
      }
      
      /* Ajouter une icône de cadenas pour indiquer que c'est non-éditable */
      #deliveriesTable tbody td:nth-child(21)::before {
        content: "🔒 ";
        margin-right: 5px;
      }
      
      /* Style sombre pour le mode admin/sidebar/dashboard */
      [data-theme="dark"] #deliveriesTable tbody td:nth-child(21) {
        background-color: #374151 !important;
        color: #9ca3af !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// 🏠 FONCTION POUR GÉRER L'AFFICHAGE DE L'ICÔNE D'ACCUEIL
function manageHomeButtonVisibility() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromDashboard = urlParams.get("fromDashboard") === "true";
  const fromSidebar = urlParams.get("from") === "sidebar";
  const targetUser = urlParams.get("targetUser");

  console.log("🏠 [HOME BUTTON] ANALYSE COMPLÈTE:", {
    fromDashboard: fromDashboard,
    fromSidebar: fromSidebar,
    targetUser: targetUser,
    fullURL: window.location.href,
    allParams: Object.fromEntries(urlParams),
  });

  const homeButton = document.getElementById("homeButton");
  if (!homeButton) {
    console.warn("🏠 [HOME BUTTON] Élément homeButton non trouvé");
    return;
  }

  // LOGIQUE CORRIGÉE POUR DE BON :
  // - Si fromDashboard=true ET pas de targetUser → CONNEXION AUTH.HTML → CACHER l'icône
  // - Si targetUser existe (peu importe fromDashboard) → VIENT DU SIDEBAR → MONTRER l'icône
  // - Sinon → ACCÈS DIRECT → MONTRER l'icône

  if (fromDashboard === true && !targetUser) {
    // Connexion depuis auth.html (fromDashboard=true sans targetUser) → CACHER l'icône
    console.log(
      "🏠 [HOME BUTTON] ❌ MASQUAGE de l'icône (connexion depuis auth.html)"
    );
    homeButton.style.display = "none";
  } else if (targetUser) {
    // A un targetUser (vient du sidebar) → MONTRER l'icône
    console.log(
      "🏠 [HOME BUTTON] ✅ AFFICHAGE de l'icône (accès depuis le sidebar)"
    );
    homeButton.style.display = "flex";
  } else {
    // Cas par défaut (accès direct) → MONTRER l'icône
    console.log(
      "🏠 [HOME BUTTON] ℹ️ AFFICHAGE par défaut de l'icône (accès direct)"
    );
    homeButton.style.display = "flex";
  }
}

// 💬 FONCTION POUR AJOUTER DES TOOLTIPS SUR LES CELLULES D'OBSERVATION
function addObservationTooltips() {
  // Créer le style CSS pour les tooltips
  const tooltipStyle = document.createElement("style");
  tooltipStyle.innerHTML = `
    /* Style pour les tooltips d'observation */
    .observation-tooltip {
      position: absolute;
      background: #1f2937;
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      opacity: 0;
      transform: translateY(-5px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      border: 1px solid #374151;
    }
    
    .observation-tooltip.show {
      opacity: 1;
      transform: translateY(0);
    }
    
    .observation-tooltip::before {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: #1f2937 transparent transparent transparent;
    }
    
    /* Style sombre pour les tooltips */
    [data-theme="dark"] .observation-tooltip {
      background: #0f172a;
      border-color: #1e293b;
    }
    
    [data-theme="dark"] .observation-tooltip::before {
      border-top-color: #0f172a;
    }
    
    /* Style clair pour les tooltips */
    [data-theme="light"] .observation-tooltip {
      background: #ffffff;
      color: #1f2937;
      border-color: #e5e7eb;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    
    [data-theme="light"] .observation-tooltip::before {
      border-top-color: #ffffff;
    }
  `;
  document.head.appendChild(tooltipStyle);

  // Fonction pour créer et afficher le tooltip
  function showTooltip(event, content) {
    // Supprimer tout tooltip existant
    const existingTooltip = document.querySelector(".observation-tooltip");
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Ne pas afficher de tooltip si le contenu est vide
    if (!content || content.trim() === "" || content === "-") {
      return;
    }

    // Créer le tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "observation-tooltip";
    tooltip.textContent = content;
    document.body.appendChild(tooltip);

    // Positionner le tooltip
    const rect = event.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 10;

    // Ajuster si le tooltip dépasse à gauche
    if (left < 10) {
      left = 10;
    }
    // Ajuster si le tooltip dépasse à droite
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    // Ajuster si le tooltip dépasse en haut
    if (top < 10) {
      top = rect.bottom + 10;
    }

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";

    // Afficher le tooltip avec animation
    setTimeout(() => {
      tooltip.classList.add("show");
    }, 10);
  }

  // Fonction pour masquer le tooltip
  function hideTooltip() {
    const tooltip = document.querySelector(".observation-tooltip");
    if (tooltip) {
      tooltip.classList.remove("show");
      setTimeout(() => {
        tooltip.remove();
      }, 200);
    }
  }

  // Ajouter les event listeners sur les cellules d'observation
  function attachTooltipListeners() {
    const observationCells = document.querySelectorAll(
      "#deliveriesTable tbody td:nth-child(21)"
    );

    observationCells.forEach((cell) => {
      // Supprimer les anciens listeners s'ils existent
      cell.removeEventListener("mouseenter", cell._tooltipMouseEnter);
      cell.removeEventListener("mouseleave", cell._tooltipMouseLeave);

      // Ajouter les nouveaux listeners
      cell._tooltipMouseEnter = (e) => showTooltip(e, cell.textContent);
      cell._tooltipMouseLeave = hideTooltip;

      cell.addEventListener("mouseenter", cell._tooltipMouseEnter);
      cell.addEventListener("mouseleave", cell._tooltipMouseLeave);
    });
  }

  // Attacher les listeners immédiatement et lors des mises à jour du tableau
  attachTooltipListeners();

  // Observer les changements dans le tableau pour réattacher les listeners
  const tableBody = document.getElementById("deliveriesTableBody");
  if (tableBody) {
    const observer = new MutationObserver(() => {
      setTimeout(attachTooltipListeners, 100);
    });

    observer.observe(tableBody, {
      childList: true,
      subtree: true,
    });
  }
}

// Fonction pour récupérer les dossiers mis en livraison
function getDossiersMisEnLiv() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

// Fonction pour sauvegarder les dossiers mis en livraison
function saveDossiersMisEnLiv(dossiers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dossiers));
}

// Fonction pour supprimer les dossiers sélectionnés
function supprimerDossiersSelectionnes() {
  const dossiers = getDossiersMisEnLiv();
  // Vérifier s'il y a des dossiers sélectionnés
  const dossiersSelectionnes = dossiers.filter((_, index) => {
    const checkbox = document.getElementById(`dossier-checkbox-${index}`);
    return checkbox && checkbox.checked;
  });

  if (dossiersSelectionnes.length === 0) {
    alert("Veuillez sélectionner au moins un dossier à supprimer.");
    return;
  }

  // Demander confirmation
  if (
    !confirm(
      `Êtes-vous sûr de vouloir supprimer ${dossiersSelectionnes.length} dossier(s) ?`
    )
  ) {
    return;
  }

  const nouveauxDossiers = dossiers.filter((_, index) => {
    const checkbox = document.getElementById(`dossier-checkbox-${index}`);
    return !checkbox || !checkbox.checked;
  });
  saveDossiersMisEnLiv(nouveauxDossiers);
  refreshMiseEnLivList();
}

// Fonction pour afficher un dossier dans la modal
function afficherDetailsDossier(dossier) {
  // Mapping des clés en anglais vers le français
  const keyTranslations = {
    container_number: "Numéro TC",
    client_name: "Nom du client",
    client: "Client",
    status: "Statut",
    date_mise_en_liv: "Date de mise en livraison",
    dossier_number: "Numéro de dossier",
    bl_number: "Numéro de BL",
    bl_numbers: "Numéros de BL",
    paiement_acconage: "Paiement Acconage",
    date_echange_bl: "Date d'Échange BL",
    date_do: "Date DO",
    date_badt: "Date BADT",
    date_paiement_acconage: "Date Paiement Acconage",
    container_numbers_list: "Liste des numéros de conteneurs",
    "Container Numbers List": "Liste des numéros de conteneurs",
    shipping_company: "Compagnie maritime",
    declaration_number: "Numéro de déclaration",
    circuit: "Circuit",
    employee_name: "Nom de l'employé",
    observation_acconier: "Observation",
    delivery_date: "Date de livraison",
    driver_name: "Nom du chauffeur",
    driver_phone: "Téléphone du chauffeur",
    transporter: "Transporteur",
    weight: "Poids",
    delivery_status_acconier: "Statut de livraison",
    ship_name: "Nom du navire",
    number_of_containers: "Nombre de conteneurs",
    container_foot_type: "Type de conteneur (pieds)",
    container_type_and_content: "Type et contenu du conteneur",
    lieu: "Lieu",
    created_at: "Date de création",
    transporter_mode: "Mode de transport",
    container_type_and_content: "Type et contenu du conteneur",
  };

  // Fonction pour formater les dates
  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
      return "-";
    }
  };

  // Liste des champs à exclure explicitement
  const excludedFields = [
    "date_mise_en_liv",
    "container_statuses",
    "bl_statuses",
    "container_foot_types_map",
    "container_type_and_content",
    "Types de conteneurs",
    "Statuts BL",
    "Statuts des conteneurs",
    "delivery_status_acconier",
    "Statut de livraison",
    "status",
    "container_statuses_map",
    "bl_statuses_map",
    "container_foot_types",
    "[object Object]",
  ];

  // Fonction pour vérifier si une valeur doit être exclue
  const shouldExcludeValue = (value, key) => {
    if (!value) return true;
    if (typeof value === "object") return true;
    if (String(value) === "[object Object]") return true;
    if (excludedFields.includes(key)) return true;
    if (excludedFields.includes(String(value))) return true;
    return false;
  };

  // Filtrer et ordonner les champs que nous voulons afficher
  const fieldsToShow = [
    "dossier_number",
    "client_name",
    "date_echange_bl",
    "date_do",
    "date_badt",
    "date_paiement_acconage",
    "bl_number",
    "container_number",
    "container_type_and_content",
    "container_foot_type",
    "shipping_company",
    "ship_name",
    "declaration_number",
    "lieu",
    "transporter_mode",
    "observation_acconier",
  ];

  const html = `
    <div class="modal-body">
      <dl class="row">
        ${fieldsToShow
          .filter(
            (key) =>
              dossier.hasOwnProperty(key) &&
              dossier[key] !== null &&
              dossier[key] !== undefined &&
              dossier[key] !== "[object Object]" &&
              !excludedFields.includes(key) &&
              !excludedFields.includes(keyTranslations[key])
          )
          .map((key) => {
            const translatedKey = keyTranslations[key] || key;
            const isDateField = key.toLowerCase().includes("date");
            const displayValue = isDateField
              ? formatDate(dossier[key])
              : dossier[key] !== undefined &&
                dossier[key] !== null &&
                dossier[key] !== ""
              ? dossier[key]
              : "-";

            return `
              <dt class="col-sm-4">${keyTranslations[key] || key}</dt>
              <dd class="col-sm-8">${displayValue}</dd>
            `;
          })
          .join("")}
      </dl>
    </div>
  `;

  // Créer une nouvelle modal pour les détails
  const detailsModal = document.createElement("div");
  detailsModal.className = "modal fade";
  detailsModal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Détails du dossier</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        ${html}
      </div>
    </div>
  `;

  document.body.appendChild(detailsModal);
  const modal = new bootstrap.Modal(detailsModal);
  modal.show();

  detailsModal.addEventListener("hidden.bs.modal", () => {
    document.body.removeChild(detailsModal);
  });
}

// Fonction pour rafraîchir la liste des dossiers mis en livraison
function refreshMiseEnLivList() {
  const miseEnLivList = document.getElementById("miseEnLivList");
  const dossiers = getDossiersMisEnLiv();
  const searchTerm =
    document.getElementById("searchMiseEnLiv")?.value?.toLowerCase() || "";

  const filteredDossiers = searchTerm
    ? dossiers.filter((dossier) => {
        // Recherche prioritaire dans les champs principaux
        const clientName = (
          dossier.client_name ||
          dossier.client ||
          ""
        ).toLowerCase();
        const containerNumber = (
          dossier.container_number ||
          dossier.ref_conteneur ||
          ""
        ).toLowerCase();
        const dossierNumber = (dossier.dossier_number || "").toLowerCase();
        const blNumber = (dossier.bl_number || "").toLowerCase();

        // Vérifier d'abord les champs principaux (nom client, conteneur, etc.)
        if (
          clientName.includes(searchTerm) ||
          containerNumber.includes(searchTerm) ||
          dossierNumber.includes(searchTerm) ||
          blNumber.includes(searchTerm)
        ) {
          return true;
        }

        // Ensuite rechercher dans toutes les autres valeurs
        return Object.values(dossier).some((value) =>
          String(value).toLowerCase().includes(searchTerm)
        );
      })
    : dossiers;

  miseEnLivList.innerHTML =
    filteredDossiers.length === 0
      ? '<div class="list-group-item text-center text-muted">Aucun dossier trouvé</div>'
      : filteredDossiers
          .map((dossier) => {
            // Fonction locale pour formater les dates de façon robuste
            const formatDateLocal = (dateStr) => {
              try {
                if (!dateStr || dateStr === "null" || dateStr === "undefined")
                  return null;
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return null;
                return date.toLocaleDateString("fr-FR");
              } catch (e) {
                console.error("Erreur de formatage de date:", e);
                return null;
              }
            };

            return `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="mb-1">${
            dossier.container_number || dossier.ref_conteneur || "N/A"
          }</h6>
          <div>
            ${
              dossier.date_mise_en_liv
                ? `<small class="text-muted">Date mise en livraison: ${
                    formatDateLocal(dossier.date_mise_en_liv) ||
                    "Non disponible"
                  }</small>`
                : ""
            }
            ${extractAndDisplayDate(dossier, "do", "Date DO")}
            ${
              dossier.date_paiement_acconage &&
              formatDateLocal(dossier.date_paiement_acconage)
                ? `<br><small class="text-muted">Date Paiement Acconage: ${formatDateLocal(
                    dossier.date_paiement_acconage
                  )}</small>`
                : ""
            }
            ${extractAndDisplayDate(dossier, "badt", "Date BADT")}
          </div>
        </div>
        <p class="mb-1">Client: ${
          dossier.client_name || dossier.client || "N/A"
        }</p>
        <small>Status: ${dossier.status || "Mis en livraison"}</small>
        <button onclick="voirDetailsDossier(${JSON.stringify(dossier).replace(
          /"/g,
          "&quot;"
        )})" 
                class="btn btn-sm btn-info mt-2">
          Voir détails
        </button>
      </div>
    `;
          })
          .join("");
}

// Stockage local pour les dossiers mis en livraison
const STORAGE_KEY_LIVRAISON = "dossiersMisEnLiv";
// const STORAGE_KEY_LAST_ARCHIVE = "lastArchiveMiseEnLiv"; // 🚫 Plus utilisé - archivage basé sur les dates des dossiers

// Fonction pour récupérer les dossiers mis en livraison
function getDossiersMisEnLiv() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_LIVRAISON) || "[]");
}

// 🆕 FONCTION AVANCÉE POUR EXTRAIRE ET AFFICHER LES DATES DO/BADT
function extractAndDisplayDate(dossier, dateType, displayLabel) {
  let dateValue = null;

  // 1. Vérifier d'abord les champs standards
  if (dateType === "do") {
    dateValue = dossier.date_do;
  } else if (dateType === "badt") {
    dateValue = dossier.date_badt;
  }

  // 2. Si pas trouvé, chercher dans d'autres propriétés possibles
  if (!dateValue || dateValue === "N/A" || dateValue === "") {
    const searchFields = [];

    if (dateType === "do") {
      searchFields.push(
        "date_do",
        "dateDO",
        "date_livraison_do",
        "do_date",
        "date_demande_origine",
        "date_origine",
        "delivery_order_date"
      );
    } else if (dateType === "badt") {
      searchFields.push(
        "date_badt",
        "dateBADT",
        "date_badp",
        "badt_date",
        "date_livraison_badt",
        "bon_a_delivrer_date"
      );
    }

    // Chercher dans toutes les propriétés possibles
    for (const field of searchFields) {
      if (dossier[field] && dossier[field] !== "N/A" && dossier[field] !== "") {
        dateValue = dossier[field];
        break;
      }
    }
  }

  // 3. Si toujours pas trouvé, chercher dans les textes (delivery_notes, observation, etc.)
  if (!dateValue || dateValue === "N/A" || dateValue === "") {
    const textFields = [
      "delivery_notes",
      "observation_acconier",
      "observation",
      "notes",
      "remarques",
      "details_livraison",
      "commentaire",
    ];

    for (const field of textFields) {
      if (dossier[field]) {
        const extractedDate = extractDateFromText(dossier[field], dateType);
        if (extractedDate) {
          dateValue = extractedDate;
          break;
        }
      }
    }
  }

  // 4. Afficher la date si trouvée
  if (dateValue && dateValue !== "N/A" && dateValue !== "") {
    const formattedDate = formatDateLocal(dateValue);
    if (formattedDate && formattedDate !== "Date invalide") {
      return `<br><small class="text-muted">${displayLabel}: ${formattedDate}</small>`;
    }
  }

  return "";
}

// 🆕 FONCTION POUR EXTRAIRE DES DATES DEPUIS LE TEXTE
function extractDateFromText(text, dateType) {
  if (!text || typeof text !== "string") return null;

  const normalizedText = text.toLowerCase();

  // Patterns de recherche pour DO
  if (dateType === "do") {
    const doPatterns = [
      /(?:date?\s*)?(?:do|delivery\s*order|demande\s*origine)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(?:do\s*du?\s*|do\s*:?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /delivery\s*order\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    ];

    for (const pattern of doPatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  // Patterns de recherche pour BADT
  if (dateType === "badt") {
    const badtPatterns = [
      /(?:date?\s*)?(?:badt|bon\s*a\s*delivrer|badp)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(?:badt\s*du?\s*|badt\s*:?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /bon\s*a\s*delivrer\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    ];

    for (const pattern of badtPatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return null;
}

// 🆕 FONCTION AUXILIAIRE POUR EXTRAIRE DES DATES DEPUIS LES CHAMPS TEXTUELS
function extractDateFromTextFields(dossier, dateType) {
  // Chercher dans tous les champs textuels possibles
  const textFields = [
    "delivery_notes",
    "observation_acconier",
    "observation",
    "notes",
    "remarques",
    "details_livraison",
    "commentaire",
    "description",
    "details",
    "infos_livraison",
  ];

  for (const field of textFields) {
    if (dossier[field]) {
      const extractedDate = extractDateFromText(dossier[field], dateType);
      if (extractedDate) {
        try {
          // Valider que la date est correcte
          const testDate = new Date(extractedDate);
          if (!isNaN(testDate.getTime())) {
            return testDate.toISOString();
          }
        } catch (e) {
          console.warn(
            `Date extraite invalide pour ${dateType}:`,
            extractedDate
          );
        }
      }
    }
  }

  return null;
}

// 🆕 FONCTION POUR METTRE À JOUR LES DOSSIERS EXISTANTS AVEC LES DATES MANQUANTES
let dateExtractionSessionProcessed = false; // Flag pour éviter les boucles infinies par session
function updateExistingDossiersWithMissingDates() {
  const dossiers = getDossiersMisEnLiv();
  let updated = false;

  console.log(
    "PRODUCTION-READY: Verification des dossiers existants pour les dates manquantes...",
    {
      totalDossiers: dossiers.length,
      sessionProcessed: dateExtractionSessionProcessed,
      environment: window.location.hostname.includes('render') ? 'PRODUCTION' : 'LOCAL'
    }
  );

  dossiers.forEach((dossier, index) => {
    const originalDO = dossier.date_do;
    const originalBADT = dossier.date_badt;

    console.log(`📋 [${index + 1}/${dossiers.length}] Analyse dossier:`, {
      container: dossier.container_number || dossier.ref_conteneur || 'N/A',
      date_do: originalDO,
      date_badt: originalBADT,
      allFields: Object.keys(dossier)
    });

    // Essayer d'extraire la date DO si manquante
    if (
      !dossier.date_do ||
      dossier.date_do === "N/A" ||
      dossier.date_do === ""
    ) {
      const extractedDateDO = extractDateFromTextFields(dossier, "do");
      if (extractedDateDO) {
        dossier.date_do = extractedDateDO;
        updated = true;
        console.log(
          `Date DO extraite pour ${
            dossier.container_number || dossier.dossier_number
          }:`,
          extractedDateDO
        );
      }
    }

    // Essayer d'extraire la date BADT si manquante
    if (
      !dossier.date_badt ||
      dossier.date_badt === "N/A" ||
      dossier.date_badt === ""
    ) {
      const extractedDateBADT = extractDateFromTextFields(dossier, "badt");
      if (extractedDateBADT) {
        dossier.date_badt = extractedDateBADT;
        updated = true;
        console.log(
          `Date BADT extraite pour ${
            dossier.container_number || dossier.dossier_number
          }:`,
          extractedDateBADT
        );
      }
    } else {
      console.log(`Date BADT deja presente:`, dossier.date_badt);
    }
  });

  if (updated) {
    saveDossiersMisEnLiv(dossiers);
    console.log("PRODUCTION: Dossiers mis a jour avec les dates extraites");
    
    // Forcer le rafraîchissement uniquement si on a fait des mises à jour
    setTimeout(() => {
      refreshMiseEnLivList();
    }, 100);
  } else {
    console.log("ℹ️ [PRODUCTION] Aucune date manquante trouvée à extraire");
  }

  dateExtractionSessionProcessed = true; // Marquer comme traité pour cette session
}

// FONCTION DE FORCAGE POUR PRODUCTION - peut etre appelee depuis la console
window.forceExtractMissingDates = function() {
  console.log('PRODUCTION: Forcage de extraction des dates manquantes...');
  dateExtractionSessionProcessed = false;
  updateExistingDossiersWithMissingDates();
  refreshMiseEnLivList();
  console.log('PRODUCTION: Extraction forcee terminee');
};

// FONCTION DEBUG POUR PRODUCTION
window.debugMiseEnLivData = function() {
  const dossiers = getDossiersMisEnLiv();
  console.log('DEBUG PRODUCTION: Donnees actuelles:', {
    totalDossiers: dossiers.length,
    dossiers: dossiers.map(d => ({
      container: d.container_number || d.ref_conteneur,
      date_do: d.date_do,
      date_badt: d.date_badt,
      fields: Object.keys(d)
    }))
  });
  return dossiers;
};

// Fonction pour sauvegarder les dossiers mis en livraison
function saveDossiersMisEnLiv(dossiers) {
  localStorage.setItem(STORAGE_KEY_LIVRAISON, JSON.stringify(dossiers));
}

// 🆕 FONCTION D'ARCHIVAGE AUTOMATIQUE BASÉE SUR LA DATE DES DOSSIERS
function checkAndArchiveOldDossiers() {
  console.log("🗂️ [ARCHIVAGE] Vérification des dossiers à archiver...");

  const now = new Date();
  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // 1 semaine en millisecondes
  const dossiers = getDossiersMisEnLiv();

  if (dossiers.length === 0) {
    console.log("🗂️ [ARCHIVAGE] Aucun dossier à vérifier");
    return;
  }

  // Séparer les dossiers anciens (> 2 semaines) des récents
  const dossiersAnciens = [];
  const dossiersRecents = [];

  dossiers.forEach((dossier) => {
    // Récupérer la date de mise en livraison du dossier (priorité absolue)
    const dateDossier =
      dossier.date_mise_en_liv || // 🎯 DATE PRIORITAIRE : Date de mise en livraison
      dossier.date_echange_bl || // Fallback 1 : Date d'échange BL
      dossier.date_creation || // Fallback 2 : Date de création
      dossier.created_at || // Fallback 3 : Date de création système
      dossier.date; // Fallback 4 : Date générique

    if (dateDossier) {
      const dossierDate = new Date(dateDossier);
      const ageDossier = now - dossierDate;

      console.log(
        `🗂️ [ARCHIVAGE] Dossier ${
          dossier.container_number || dossier.dossier_number
        }:`
      );
      console.log(
        `  📅 Date de mise en livraison: ${dossierDate.toLocaleDateString(
          "fr-FR"
        )}`
      );
      console.log(
        `  ⏰ Âge depuis mise en livraison: ${Math.floor(
          ageDossier / (24 * 60 * 60 * 1000)
        )} jours`
      );

      if (ageDossier >= oneWeekInMs) {
        dossiersAnciens.push(dossier);
        console.log(`  🗂️ ANCIEN (≥ 7 jours) - À archiver automatiquement`);
      } else {
        dossiersRecents.push(dossier);
        console.log(`  ✅ RÉCENT (< 7 jours) - À conserver dans "Mise en Liv"`);
      }
    } else {
      // Si pas de date, considérer comme récent par sécurité
      dossiersRecents.push(dossier);
      console.log(
        `🗂️ [ARCHIVAGE] Dossier ${
          dossier.container_number || dossier.dossier_number
        }: Pas de date - conservé`
      );
    }
  });

  // Archiver TOUS les dossiers anciens (plus de limitation à 5)
  if (dossiersAnciens.length > 0) {
    // Trier les dossiers anciens par date (plus anciens en premier)
    dossiersAnciens.sort((a, b) => {
      const dateA = new Date(
        a.date_mise_en_liv ||
          a.date_echange_bl ||
          a.date_creation ||
          a.created_at ||
          a.date ||
          0
      );
      const dateB = new Date(
        b.date_mise_en_liv ||
          b.date_echange_bl ||
          b.date_creation ||
          b.created_at ||
          b.date ||
          0
      );
      return dateA - dateB;
    });

    // Archiver TOUS les dossiers anciens (plus de 1 semaine)
    const dossiersToArchive = dossiersAnciens; // Tous les dossiers anciens
    const dossiersToKeep = dossiersRecents; // Garder seulement les récents

    console.log(
      `🗂️ [ARCHIVAGE] Archivage automatique de TOUS les ${dossiersToArchive.length} dossier(s) ancien(s) (> 1 semaine)`
    );

    // Sauvegarder seulement les dossiers récents
    saveDossiersMisEnLiv(dossiersToKeep);

    // Afficher une notification
    if (dossiersToArchive.length > 0) {
      console.log(
        "🗂️ [ARCHIVAGE] TOUS les dossiers anciens archivés automatiquement:",
        dossiersToArchive.map(
          (d) =>
            `${d.container_number || d.dossier_number} (${new Date(
              d.date_mise_en_liv ||
                d.date_echange_bl ||
                d.date_creation ||
                d.created_at ||
                d.date
            ).toLocaleDateString("fr-FR")})`
        )
      );

      // Optionnel : Afficher une notification visuelle
      if (typeof showNotification === "function") {
        showNotification(
          `${dossiersToArchive.length} dossier(s) de plus de 1 semaine ont été automatiquement archivés de la liste "Mis en livraison"`,
          "info"
        );
      }

      // Rafraîchir la liste si elle est ouverte
      refreshMiseEnLivList();
    }
  } else {
    console.log("🗂️ [ARCHIVAGE] Aucun dossier ancien à archiver");
  }
}

// 🆕 FONCTION POUR TRIER LES DOSSIERS PAR DATE (NOUVELLES DATES EN HAUT)
function sortDossiersByDate(dossiers) {
  return dossiers.sort((a, b) => {
    // Utiliser la date de mise en livraison comme critère principal
    const dateA = new Date(a.date_mise_en_liv || 0);
    const dateB = new Date(b.date_mise_en_liv || 0);

    // Tri décroissant : les plus récentes en haut
    return dateB - dateA;
  });
}

// Fonction pour ajouter un dossier à la liste des mises en livraison
function ajouterDossierMiseEnLiv(dossier) {
  const dossiers = getDossiersMisEnLiv();

  // Fonction utilitaire pour récupérer et convertir une date
  function getDateValue(selector) {
    const input = document.querySelector(selector);
    if (input && input.value) {
      try {
        return new Date(input.value).toISOString();
      } catch (e) {
        console.error("Erreur de conversion de date:", e);
        return null;
      }
    }
    return null;
  }

  // Fonction pour convertir une date existante en ISO si elle n'est pas déjà formatée
  function formatExistingDate(dateValue) {
    if (!dateValue) return null;
    try {
      // Si c'est déjà un string ISO, le retourner tel quel
      if (typeof dateValue === "string" && dateValue.includes("T")) {
        return dateValue;
      }
      // Sinon, convertir en ISO
      return new Date(dateValue).toISOString();
    } catch (e) {
      console.error("Erreur de formatage de date existante:", e);
      return null;
    }
  }

  // Sauvegarder toutes les dates importantes
  dossier.date_mise_en_liv = new Date().toISOString();

  // Récupérer les dates depuis le formulaire avec les vrais IDs
  const dateEchangeBL = getDateValue("#dateEchangeBL");
  const dateDO = getDateValue("#dateDO");
  const datePaiementAcconage = getDateValue("#paiementAcconage");
  const dateBADT = getDateValue("#dateBADT");

  // Assigner les dates au dossier en priorité depuis le formulaire, sinon garder les existantes
  dossier.date_echange_bl =
    dateEchangeBL ||
    formatExistingDate(dossier.date_echange_bl) ||
    dossier.date_echange_bl;
  dossier.date_do =
    dateDO || formatExistingDate(dossier.date_do) || dossier.date_do;
  dossier.date_paiement_acconage =
    datePaiementAcconage ||
    formatExistingDate(dossier.date_paiement_acconage) ||
    dossier.date_paiement_acconage;
  dossier.date_badt =
    dateBADT || formatExistingDate(dossier.date_badt) || dossier.date_badt;

  // 🆕 AMÉLIORATION : Si les dates DO ou BADT sont toujours manquantes, essayer de les extraire
  if (!dossier.date_do || dossier.date_do === "N/A" || dossier.date_do === "") {
    const extractedDateDO = extractDateFromTextFields(dossier, "do");
    if (extractedDateDO) {
      dossier.date_do = extractedDateDO;
      console.log(
        `✅ Date DO extraite pour ${
          dossier.container_number || dossier.dossier_number
        }:`,
        extractedDateDO
      );
    }
  }

  if (
    !dossier.date_badt ||
    dossier.date_badt === "N/A" ||
    dossier.date_badt === ""
  ) {
    const extractedDateBADT = extractDateFromTextFields(dossier, "badt");
    if (extractedDateBADT) {
      dossier.date_badt = extractedDateBADT;
      console.log(
        `✅ Date BADT extraite pour ${
          dossier.container_number || dossier.dossier_number
        }:`,
        extractedDateBADT
      );
    }
  }

  console.log("Dossier avec dates formatées:", {
    date_do: dossier.date_do,
    date_badt: dossier.date_badt,
    date_echange_bl: dossier.date_echange_bl,
    date_paiement_acconage: dossier.date_paiement_acconage,
  });

  // Vérifier si le dossier n'existe pas déjà
  const existe = dossiers.some(
    (d) =>
      d.container_number === dossier.container_number || d.id === dossier.id
  );

  if (!existe) {
    dossiers.push(dossier);
    saveDossiersMisEnLiv(dossiers);
    refreshMiseEnLivList(); // Rafraîchir la liste après l'ajout
  }
}

// Fonction pour rafraîchir la liste des dossiers dans la modal
function refreshMiseEnLivList() {
  const miseEnLivList = document.getElementById("miseEnLivList");
  if (!miseEnLivList) return;

  // 🆕 VÉRIFICATION ARCHIVAGE AUTOMATIQUE à chaque rafraîchissement
  checkAndArchiveOldDossiers();

  const dossiers = getDossiersMisEnLiv();
  console.log("Dossiers chargés:", dossiers); // Debug

  const searchTerm =
    document.getElementById("searchMiseEnLiv")?.value?.toLowerCase() || "";

  let filteredDossiers = searchTerm
    ? dossiers.filter((dossier) => {
        // Recherche prioritaire dans les champs principaux
        const clientName = (
          dossier.client_name ||
          dossier.client ||
          ""
        ).toLowerCase();
        const containerNumber = (
          dossier.container_number ||
          dossier.ref_conteneur ||
          ""
        ).toLowerCase();
        const dossierNumber = (dossier.dossier_number || "").toLowerCase();
        const blNumber = (dossier.bl_number || "").toLowerCase();

        // Vérifier d'abord les champs principaux (nom client, conteneur, etc.)
        if (
          clientName.includes(searchTerm) ||
          containerNumber.includes(searchTerm) ||
          dossierNumber.includes(searchTerm) ||
          blNumber.includes(searchTerm)
        ) {
          return true;
        }

        // Ensuite rechercher dans toutes les autres valeurs
        return Object.values(dossier).some((value) =>
          String(value).toLowerCase().includes(searchTerm)
        );
      })
    : dossiers;

  // Vérifier et archiver les anciens dossiers automatiquement
  checkAndArchiveOldDossiers();

  // Trier les dossiers par date (plus récents en premier) après filtrage
  filteredDossiers = sortDossiersByDate(filteredDossiers);

  // Fonction utilitaire pour formater les dates de manière robuste
  const formatDate = (dateStr) => {
    try {
      if (!dateStr || dateStr === "null" || dateStr === "undefined")
        return null;
      // Vérifier si c'est une date valide
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString("fr-FR");
    } catch (e) {
      console.error(
        "Erreur de formatage de date:",
        e,
        "pour la valeur:",
        dateStr
      );
      return null;
    }
  };

  miseEnLivList.innerHTML =
    filteredDossiers.length === 0
      ? '<div class="list-group-item py-4 text-center text-muted">Aucun dossier trouvé</div>'
      : filteredDossiers
          .map(
            (dossier, index) => `
      <div class="list-group-item py-3 border-start-0 border-end-0 hover-bg-light">
        <div class="d-flex justify-content-between align-items-start">
          <div class="me-3">
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="dossier-checkbox-${index}">
              </div>
              <div class="d-flex align-items-center justify-content-center" 
                   style="width: 32px; height: 32px; background: var(--bg-accent); border-radius: 50%;">
                <i class="fas fa-truck text-primary"></i>
              </div>
              ${(() => {
                const containerNumbers = (
                  dossier.container_number ||
                  dossier.ref_conteneur ||
                  ""
                )
                  .toString()
                  .split(",");
                if (containerNumbers.length <= 1) {
                  return `<h6 class="mb-0" style="font-size: 0.95rem; font-weight: 600;">
                    ${
                      dossier.container_number || dossier.ref_conteneur || "N/A"
                    }
                  </h6>`;
                } else {
                  const displayCount = containerNumbers.length;
                  const dropdownId = `dropdown-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;
                  return `
                    <div class="position-relative d-inline-block">
                      <button onclick="toggleContainerList('${dropdownId}')"
                              class="btn d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill" 
                              type="button" 
                              style="font-size: 0.95rem; font-weight: 600; background: var(--bg-accent); color: var(--text-primary); border: none;">
                        <i class="fas fa-boxes text-primary"></i>
                        <span>${displayCount} Conteneurs</span>
                        <i class="fas fa-chevron-down ms-1" style="font-size: 0.8rem;"></i>
                      </button>
                      <div id="${dropdownId}" 
                           class="position-absolute start-0 mt-2 shadow-lg bg-white rounded-3 d-none"
                           style="z-index: 1000; max-height: 300px; overflow-y: auto; min-width: 300px; border: 1px solid var(--border-subtle);">
                        <div class="p-3 border-bottom bg-light">
                          <div class="d-flex align-items-center gap-2">
                            <i class="fas fa-list-ul text-primary"></i>
                            <span class="fw-semibold" style="color: var(--text-primary);">Liste des conteneurs</span>
                          </div>
                          <div class="mt-1 small text-muted">Total: ${displayCount} conteneurs</div>
                        </div>
                        <div class="p-2">
                          ${containerNumbers
                            .map(
                              (num, i) => `
                            <div class="d-flex align-items-center p-2 rounded-3 hover-bg-light border-subtle mb-1" 
                                 style="transition: all 0.2s ease;">
                              <div class="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10"
                                   style="width: 32px; height: 32px;">
                                <i class="fas fa-box text-primary"></i>
                              </div>
                              <div class="ms-3">
                                <div class="fw-medium" style="color: var(--text-primary);">${num.trim()}</div>
                                <div class="small text-muted">Conteneur ${
                                  i + 1
                                }/${displayCount}</div>
                              </div>
                            </div>
                          `
                            )
                            .join("")}
                        </div>
                      </div>
                    </div>`;
                }
              })()}
            </div>
            <p class="mb-1" style="font-size: 0.85rem; color: var(--text-secondary);">
              <i class="fas fa-user me-2 text-secondary"></i>
              ${dossier.client_name || dossier.client || "N/A"}
            </p>
            <div class="d-flex flex-column">
              <div class="d-flex align-items-center mb-1">
                <span class="badge bg-success-subtle text-success rounded-pill">
                  <i class="fas fa-check-circle me-1"></i>
                  Mis en livraison
                </span>
                ${
                  dossier.date_echange_bl
                    ? `
                <small class="text-muted ms-2" style="font-size: 0.8rem;">
                  <i class="far fa-calendar-alt me-1"></i>
                  ${
                    formatDate(dossier.date_echange_bl) || "Date non disponible"
                  }
                </small>`
                    : ""
                }
              </div>
              ${
                dossier.date_do && formatDate(dossier.date_do)
                  ? `
              <small class="text-muted" style="font-size: 0.8rem;">
                <i class="far fa-calendar-check me-1"></i>
                DO: ${formatDate(dossier.date_do)}
              </small>`
                  : ""
              }
              ${
                dossier.date_paiement_acconage &&
                formatDate(dossier.date_paiement_acconage)
                  ? `
              <small class="text-muted" style="font-size: 0.8rem;">
                <i class="far fa-money-bill-alt me-1"></i>
                Paiement Acconage: ${formatDate(dossier.date_paiement_acconage)}
              </small>`
                  : ""
              }
              ${
                dossier.date_badt && formatDate(dossier.date_badt)
                  ? `
              <small class="text-muted" style="font-size: 0.8rem;">
                <i class="far fa-file-alt me-1"></i>
                BADT: ${formatDate(dossier.date_badt)}
              </small>`
                  : ""
              }
            </div>
          </div>
          <div>
            <button 
              class="btn btn-sm btn-outline-primary" 
              style="font-size: 0.8rem; box-shadow: 0 2px 4px rgba(37,99,235,0.1);" 
              onclick="voirDetailsDossier(${JSON.stringify(dossier).replace(
                /"/g,
                "&quot;"
              )})">
              <i class="fas fa-info-circle me-1"></i>
              Détails
            </button>
          </div>
        </div>
      </div>
    `
          )
          .join("");
}

// Fonction pour afficher les détails d'un dossier111100000
function voirDetailsDossier(dossier) {
  // Mapping des noms de propriétés pour un affichage plus lisible
  const propertyLabels = {
    // Informations principales
    dossier_number: "N° Dossier",
    employee_name: "Agent",
    client_name: "Nom du client",
    client: "Client",
    client_phone: "Téléphone client",
    statut: "État actuel",
    delivery_status_acconier: "Statut de livraison",

    // Informations conteneur
    container_number: "N° TC",
    container_type_and_content: "Type et contenu",
    container_foot_type: "Type de conteneur",
    lieu: "Lieu",
    number_of_containers: "Nombre de conteneurs",

    // Dates et paiements
    paiement_acconage: "Paiement Acconage",
    date_echange_bl: "Date d'échange BL",
    date_do: "Date DO",
    date_badt: "Date BADT",
    delivery_date: "Date de livraison",
    created_at: "Date de création",

    // Documents et références
    bl_number: "N° BL",
    declaration_number: "N° Déclaration",

    // Transport et logistique
    shipping_company: "Compagnie maritime",
    weight: "Poids",
    ship_name: "Nom du navire",
    circuit: "Circuit",
    transporter_mode: "Mode de transport",

    // Observations
    observation_acconier: "Observation",
    delivery_notes: "Notes de livraison",

    // Statuts détaillésfc
    container_statuses: "Statuts des conteneurs",
    bl_statuses: "Statuts BL",
    container_foot_types_map: "Types de conteneurs",
  };

  // Liste des propriétés à exclure
  const excludedProperties = [
    // Propriétés système à masquer
    "id",
    "_id",
    "updatedAt",
    "createdAt",
    "datemiseenliv",

    // Versions anglaises des propriétés (pour éviter les doublons)
    "Status",
    "Delivery Status",
    "Delivery Status Acconier",
    "Container Statuses",
    "Container Numbers",
    "Container Numbers List",
    "Container Foot Types Map",
    "Container Foot Type",
    "Container Type And Content",
    "Bl Statuses",
    "Bl Numbers",
    "Transporter Mode",
    "Created At",
    "Location",
    "Declaration Number",

    // Versions avec underscores
    "container_statuses",
    "bl_statuses",
    "container_foot_types_map",
    "delivery_status_acconier",
    "container_number",
    "created_at",
    "updated_at",
    "employee_name",
    "client_name",
  ];

  // Filtrer et trier les propriétés à afficher dans un ordre logique
  const priorityOrder = [
    "dossier_number", // Numéro de dossier
    "employee_name", // Agent
    "client_name", // Client
    "statut", // Statut
    "delivery_status_acconier", // Statut de livraison
    "container_number", // Numéro TC
    "container_type_and_content", // Type et contenu
    "container_foot_type", // Type de conteneur
    "lieu", // Lieu
    "paiement_acconage", // Paiement Acconage
    "date_echange_bl", // Date d'échange BL
    "date_do", // Date DO
    "date_badt", // Date BADT
    "bl_number", // Numéro BL
    "declaration_number", // Numéro déclaration
    "weight", // Poids
    "shipping_company", // Compagnie maritime
    "ship_name", // Nom du navire
    "circuit", // Circuit
    "transporter_mode", // Mode de transport
    "observation_acconier", // Observation
    "created_at", // Date de création
  ];

  const sortedEntries = Object.entries(dossier).sort(([keyA], [keyB]) => {
    const indexA = priorityOrder.indexOf(keyA);
    const indexB = priorityOrder.indexOf(keyB);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Fonction pour traduire les propriétés de l'anglais vers le français
  function traduireProprieteDossier(key) {
    const traductions = {
      // Conteneurs
      "Container Type And Content": "Type et Contenu du Conteneur",
      "Container Foot Type": "Type de Conteneur (pieds)",
      "Number Of Containers": "Nombre de Conteneurs",
      "Container Numbers List": "Liste des numéros de conteneurs",
      "Container Number": "Numéro de Conteneur",
      "Container Numbers": "Numéros de Conteneurs",
      "N° Conteneur": "Numéro de Conteneur",
      container_number: "Numéro de Conteneur",
      container_numbers: "Numéros de Conteneurs",
      container_type_and_content: "Type et Contenu du Conteneur",
      container_foot_type: "Type de Conteneur (pieds)",
      number_of_containers: "Nombre de Conteneurs",

      // BL et Documents
      "Bl Number": "Numéro de BL",
      "Declaration Number": "Numéro de Déclaration",
      "Bl Numbers": "Numéros de BL",
      "Date Echange Bl": "Date d'Échange BL",
      "Date Do": "Date DO",
      "Date Badt": "Date BADT",
      "Date Paiement Acconage": "Date Paiement Acconage",
      bl_number: "Numéro de BL",
      bl_numbers: "Numéros de BL",
      date_echange_bl: "Date d'Échange BL",
      date_do: "Date DO",
      date_badt: "Date BADT",
      date_paiement_acconage: "Date Paiement Acconage",
      declaration_number: "Numéro de Déclaration",

      // Transport
      "Shipping Company": "Compagnie Maritime",
      "Ship Name": "Nom du Navire",
      "Transporter Mode": "Mode de Transport",
      "Dossier Number": "Numéro de Dossier",
      shipping_company: "Compagnie Maritime",
      ship_name: "Nom du Navire",
      transporter_mode: "Mode de Transport",

      // Autres
      Id: "ID",
      "Agent responsable": "Agent Responsable",
      employee_name: "Agent Responsable",
      "Nom du client": "Nom du Client",
      client_name: "Nom du Client",
      Lieu: "Lieu",
      Location: "Lieu",
      Status: "Statut",
      "Delivery Status": "Statut de Livraison",
      "Delivery Status Acconier": "Statut de Livraison",
      "Delivery Date": "Date de Livraison",
      Observation: "Observation",
      "Observation Acconier": "Observation de l'Acconier",
      "Created At": "Date de Création",
      "Créé le": "Date de Création",
      created_at: "Date de Création",
      List: "Liste",
      delivery_status_acconier: "Statut de Livraison",
      delivery_date: "Date de Livraison",
      observation: "Observation",
      status: "Statut",
      id: "ID",
    };

    return traductions[key] || key;
  }

  // Filtrer les entrées avant de générer le HTML
  const filteredEntries = sortedEntries.filter(([key, value]) => {
    // Exclure les entrées null ou undefined
    if (!value || value === "null" || value === "undefined") return false;

    // Exclure les entrées spécifiques
    const excludeKeys = [
      "container_statuses",
      "bl_statuses",
      "container_foot_types_map",
      "Statuts des conteneurs",
      "Statuts BL",
      "Types de conteneurs",
    ];
    if (excludeKeys.includes(key)) return false;

    // Exclure les objets et [object Object]
    if (typeof value === "object" || String(value) === "[object Object]")
      return false;

    return true;
  });

  const detailsHTML = filteredEntries
    .map(([key, value]) => {
      // Traduire la clé en français
      const keyFr = traduireProprieteDossier(key);

      // Transformer la clé pour un affichage propre
      const formattedKey = keyFr
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const label = propertyLabels[keyFr] || formattedKey;
      let displayValue = value;

      // 🆕 GESTION SPÉCIALE POUR LES CONTENEURS MULTIPLES
      if (
        key === "container_number" ||
        key === "ref_conteneur" ||
        keyFr === "Numéro de Conteneur"
      ) {
        if (value && typeof value === "string" && value.includes(",")) {
          // Diviser les conteneurs et créer un menu déroulant
          const containers = value
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c && c !== "");
          const dropdownId = `containers-dropdown-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          displayValue = `
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-primary dropdown-toggle w-100 text-start position-relative" 
                      type="button" 
                      id="${dropdownId}"
                      data-bs-toggle="dropdown" 
                      data-bs-auto-close="outside"
                      aria-expanded="false"
                      style="font-size: 0.85rem; min-height: 38px;">
                <i class="fas fa-cube me-2 text-primary"></i>
                <strong>${containers.length} conteneur${
            containers.length > 1 ? "s" : ""
          }</strong>
                <br><small class="text-muted">${containers[0]}${
            containers.length > 1 ? "..." : ""
          }</small>
              </button>
              <ul class="dropdown-menu shadow-lg border-0 w-100" 
                  aria-labelledby="${dropdownId}" 
                  style="max-height: 250px; overflow-y: auto; min-width: 300px; z-index: 9999;">
                <li class="dropdown-header bg-light">
                  <i class="fas fa-list me-2"></i>Liste des ${
                    containers.length
                  } conteneurs
                </li>
                ${containers
                  .map(
                    (container, index) => `
                  <li>
                    <a class="dropdown-item d-flex align-items-center py-2 container-item" 
                       href="#" 
                       onclick="event.preventDefault(); copyToClipboard('${container}'); return false;"
                       data-container="${container}"
                       style="transition: all 0.2s;">
                      <span class="badge bg-primary me-3" style="font-size: 0.7rem; min-width: 25px;">${
                        index + 1
                      }</span>
                      <span class="font-monospace flex-grow-1" style="font-size: 0.9rem; color: #2c3e50;">${container}</span>
                      <i class="fas fa-copy text-muted" style="font-size: 0.8rem;" title="Cliquer pour copier"></i>
                    </a>
                  </li>
                `
                  )
                  .join("")}
                <li><hr class="dropdown-divider"></li>
                <li class="dropdown-header text-muted" style="font-size: 0.75rem;">
                  <i class="fas fa-info-circle me-1"></i>Cliquez sur un conteneur pour le copier
                </li>
              </ul>
            </div>
          `;
        } else {
          // Un seul conteneur, affichage normal avec icône
          displayValue = `<span class="font-monospace"><i class="fas fa-cube me-2 text-primary"></i>${value}</span>`;
        }
      }
      // Formater les dates si la valeur ressemble à une date
      else if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          displayValue = new Date(value).toLocaleDateString("fr-FR");
        } catch (e) {
          displayValue = value;
        }
      }

      // Valeur par défaut si vide
      if (
        !displayValue ||
        displayValue === "undefined" ||
        displayValue === "null"
      ) {
        displayValue = "-";
      }

      return `
      <div class="row py-2 border-bottom" style="margin: 0 -8px;">
        <div class="col-5 text-secondary" style="font-size: 0.9rem;">${label}</div>
        <div class="col-7 fw-medium text-dark">${displayValue}</div>
      </div>`;
    })
    .filter((html) => html !== "")
    .join("");

  const detailsModal = document.createElement("div");
  detailsModal.className = "modal fade";
  detailsModal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 460px;">
      <div class="modal-content border-0 shadow-sm">
        <div class="modal-header py-2 bg-primary bg-opacity-10 border-bottom-0">
          <div>
            <h6 class="modal-title mb-1 fw-bold" style="color: var(--bs-primary);">
              <i class="fas fa-folder-open me-2"></i>
              Dossier N° ${dossier.dossier_number || "N/A"}
            </h6>
            <small class="text-secondary">
              <i class="far fa-calendar-alt me-1"></i>
              ${
                dossier.date_echange_bl
                  ? new Date(dossier.date_echange_bl).toLocaleDateString(
                      "fr-FR"
                    )
                  : "N/A"
              }
            </small>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-0" style="max-height: 80vh; overflow-y: auto;">
          <div class="p-3">
            ${detailsHTML}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(detailsModal);
  const modal = new bootstrap.Modal(detailsModal);
  modal.show();

  // 🆕 INITIALISER LES DROPDOWNS APRÈS CRÉATION DE LA MODAL
  initializeContainerDropdowns(detailsModal);

  detailsModal.addEventListener("hidden.bs.modal", () => {
    document.body.removeChild(detailsModal);
  });
}

// 🆕 FONCTION POUR INITIALISER LES DROPDOWNS DE CONTENEURS
function initializeContainerDropdowns(modalElement) {
  setTimeout(() => {
    console.log("🎯 Initialisation des dropdowns conteneurs...");

    // Forcer l'initialisation des dropdowns Bootstrap
    const dropdowns = modalElement.querySelectorAll(
      '[data-bs-toggle="dropdown"]'
    );
    dropdowns.forEach((dropdown) => {
      try {
        if (!bootstrap.Dropdown.getInstance(dropdown)) {
          new bootstrap.Dropdown(dropdown);
          console.log("✅ Dropdown initialisé pour:", dropdown.id);
        }
      } catch (e) {
        console.warn(
          "Erreur initialisation dropdown Bootstrap, utilisation du fallback:",
          e
        );
        // Fallback : créer un dropdown manuel
        createFallbackDropdown(dropdown);
      }
    });

    // Ajouter des styles CSS pour améliorer l'interaction
    if (!document.querySelector("#containerDropdownStyles")) {
      const style = document.createElement("style");
      style.id = "containerDropdownStyles";
      style.textContent = `
        .container-item:hover {
          background-color: #f8f9fa !important;
          transform: translateX(5px);
          transition: all 0.2s ease;
        }
        .dropdown-menu {
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
          border: 1px solid #e9ecef !important;
        }
        .dropdown-toggle::after {
          transition: transform 0.2s ease;
        }
        .dropdown-toggle[aria-expanded="true"]::after {
          transform: rotate(180deg);
        }
        .badge {
          transition: all 0.2s ease;
        }
        .container-item:hover .badge {
          transform: scale(1.1);
        }
        .dropdown-menu.show {
          display: block !important;
        }
        .dropdown-manual {
          position: relative;
        }
      `;
      document.head.appendChild(style);
    }
  }, 500);
}

// 🆕 FONCTION FALLBACK POUR CRÉER UN DROPDOWN MANUEL
function createFallbackDropdown(button) {
  const dropdownMenu = button.nextElementSibling;
  if (!dropdownMenu || !dropdownMenu.classList.contains("dropdown-menu"))
    return;

  button.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Fermer tous les autres dropdowns
    document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
      if (menu !== dropdownMenu) {
        menu.classList.remove("show");
        menu.previousElementSibling.setAttribute("aria-expanded", "false");
      }
    });

    // Toggle ce dropdown
    const isOpen = dropdownMenu.classList.contains("show");
    if (isOpen) {
      dropdownMenu.classList.remove("show");
      button.setAttribute("aria-expanded", "false");
    } else {
      dropdownMenu.classList.add("show");
      button.setAttribute("aria-expanded", "true");
    }
  });

  // Fermer le dropdown en cliquant ailleurs
  document.addEventListener("click", function (e) {
    if (!button.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove("show");
      button.setAttribute("aria-expanded", "false");
    }
  });

  console.log("✅ Dropdown fallback créé pour:", button.id);
}

// Fonction utilitaire pour récupérer les paramètres URL
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// 🚀 Fonction pour faire clignoter un dossier spécifique en cas de redirection depuis le tableau de bord
function flashTargetDelivery() {
  const targetDossier = getUrlParameter("dossier");

  if (!targetDossier) {
    console.log(`❌ [FLASH ACCONIER] Pas de dossier à flash`);
    return;
  }

  console.log(
    `✨ [FLASH ACCONIER] Recherche du dossier à faire clignoter: ${targetDossier}`
  );

  // Fonction pour chercher le dossier
  function searchAndFlash() {
    const tableBody = document.getElementById("deliveriesTableBody");
    if (!tableBody) {
      console.log(
        `❌ [FLASH ACCONIER] Element #deliveriesTableBody non trouvé`
      );
      return false;
    }

    // Chercher la ligne qui contient ce dossier
    const rows = tableBody.querySelectorAll("tr");
    let targetRow = null;

    console.log(`🔍 [FLASH ACCONIER] Recherche dans ${rows.length} lignes...`);

    rows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      let rowText = "";
      cells.forEach((cell) => {
        rowText += cell.textContent + " ";
      });

      // Recherche plus flexible - par ID, numéro de dossier, ou contenu
      if (
        rowText.includes(targetDossier) ||
        rowText.includes(targetDossier.toString()) ||
        row.dataset.dossierId === targetDossier
      ) {
        targetRow = row;
        console.log(
          `✅ [FLASH ACCONIER] Dossier trouvé dans la ligne ${index}: ${rowText.trim()}`
        );
      }
    });

    if (targetRow) {
      console.log(
        `✨ [FLASH ACCONIER] Dossier trouvé, démarrage du clignotement de 10 secondes`
      );

      // Styles d'origine
      const originalStyle = {
        background: targetRow.style.background || "",
        transform: targetRow.style.transform || "",
        boxShadow: targetRow.style.boxShadow || "",
        border: targetRow.style.border || "",
      };

      // Animation de flash pendant 10 secondes
      let flashCount = 0;
      const maxFlashes = 20; // 10 secondes à 500ms par flash

      const flashInterval = setInterval(() => {
        if (flashCount >= maxFlashes) {
          // Remettre le style original
          Object.keys(originalStyle).forEach((key) => {
            targetRow.style[key] = originalStyle[key];
          });
          clearInterval(flashInterval);

          // Supprimer les paramètres de l'URL pour éviter de re-flasher
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete("dossier");
          window.history.replaceState({}, "", newUrl);

          console.log(`✨ [FLASH ACCONIER] Animation terminée`);
          return;
        }

        // Alterner entre surbrillance et normal
        if (flashCount % 2 === 0) {
          targetRow.style.background =
            "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)";
          targetRow.style.transform = "scale(1.02)";
          targetRow.style.boxShadow = "0 8px 25px rgba(245, 158, 11, 0.4)";
          targetRow.style.border = "2px solid #f59e0b";
        } else {
          targetRow.style.background = originalStyle.background;
          targetRow.style.transform = originalStyle.transform;
          targetRow.style.boxShadow = originalStyle.boxShadow;
          targetRow.style.border = originalStyle.border;
        }

        flashCount++;
      }, 500);

      // Scroll vers la ligne si elle n'est pas visible
      targetRow.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return true;
    } else {
      console.log(
        `⚠️ [FLASH ACCONIER] Dossier ${targetDossier} non trouvé dans le tableau`
      );
      return false;
    }
  }

  // Essayer plusieurs fois avec des délais différents
  setTimeout(() => {
    if (!searchAndFlash()) {
      setTimeout(() => {
        if (!searchAndFlash()) {
          setTimeout(searchAndFlash, 2000); // Dernier essai après 2 secondes
        }
      }, 1000);
    }
  }, 500);
}

// Fonction utilitaire pour normaliser la date à minuit
function normalizeDateToMidnight(date) {
  if (!(date instanceof Date)) date = new Date(date);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Fonction principale pour ,  afficher les livraisons filtrées par date
function showDeliveriesByDate(deliveries, selectedDate, tableBodyElement) {
  const dateToCompare = normalizeDateToMidnight(selectedDate);
  // Filtre les livraisons par date (champ created_at ou delivery_date)
  const filtered = deliveries.filter((d) => {
    let dDate = d.created_at || d.delivery_date;
    if (!dDate) return false;
    dDate = normalizeDateToMidnight(new Date(dDate));
    return dDate.getTime() === dateToCompare.getTime();
  });
  if (filtered.length === 0) {
    tableBodyElement.innerHTML = `<tr><td colspan="${AGENT_TABLE_COLUMNS.length}" class="text-center text-muted">Aucune opération à cette date.</td></tr>`;
    return;
  }
  renderAgentTableRows(filtered, tableBodyElement);
}

// Initialisation et gestion du filtre date
document.addEventListener("DOMContentLoaded", function () {
  // 🔒 Désactiver l'édition des observations en mode admin
  disableObservationEditingInAdminMode();

  // 🏠 Gérer l'affichage de l'icône d'accueil selon la source d'accès
  manageHomeButtonVisibility();

  // 💬 Ajouter les tooltips sur les cellules d'observation
  setTimeout(() => {
    addObservationTooltips();
  }, 1000); // Attendre que le tableau soit chargé

  // ✨ FLASH : Déclencher le flash pour les dossiers ciblés depuis le tableau de bord
  setTimeout(() => {
    flashTargetDelivery();
  }, 2000); // Attendre 2 secondes pour que tout soit chargé

  // Initialisation de la recherche dans la modal Mise en Liv
  const searchMiseEnLiv = document.getElementById("searchMiseEnLiv");
  if (searchMiseEnLiv) {
    searchMiseEnLiv.addEventListener("input", () => {
      refreshMiseEnLivList();
    });
  }

  // Initialisation de la modal Mise en Liv
  const modalMiseEnLiv = document.getElementById("modalMiseEnLiv");
  if (modalMiseEnLiv) {
    modalMiseEnLiv.addEventListener("show.bs.modal", () => {
      refreshMiseEnLivList();
    });
  }

  // Variable globale pour stocker le dernier état des dossiers en retard
  let lastLateDeliveriesCount = 0;

  // --- Toast dossiers en retard (>2 jours) ---
  function showLateDeliveriesToast(lateDeliveries) {
    const existingToast = document.getElementById("late-deliveries-toast");
    const currentCount = lateDeliveries ? lateDeliveries.length : 0;

    console.log(
      "[LATE ALERT DEBUG] Nombre de dossiers en retard:",
      currentCount
    );
    console.log(
      "[LATE ALERT DEBUG] Dernier nombre enregistré:",
      lastLateDeliveriesCount
    );

    // Seulement supprimer l'alerte si on confirme qu'il n'y a vraiment plus de dossiers en retard
    // ET que ce n'est pas juste un problème temporaire de données
    if (currentCount === 0 && lastLateDeliveriesCount > 0) {
      // Attendre un peu avant de supprimer pour éviter les suppressions temporaires
      setTimeout(() => {
        const recheckDeliveries = getLateDeliveries();
        if (recheckDeliveries.length === 0) {
          const toastToRemove = document.getElementById(
            "late-deliveries-toast"
          );
          if (toastToRemove) {
            console.log(
              "[LATE ALERT DEBUG] Suppression confirmée de l'alerte - aucun dossier en retard"
            );
            toastToRemove.remove();
            lastLateDeliveriesCount = 0;
          }
        }
      }, 2000); // Attendre 2 secondes avant confirmation
      return;
    }

    // Mettre à jour le compteur
    if (currentCount > 0) {
      lastLateDeliveriesCount = currentCount;
    }

    // Si pas de dossiers en retard et pas d'alerte existante, ne rien faire
    if (currentCount === 0 && !existingToast) {
      return;
    }

    // Si l'alerte existe déjà et qu'il y a encore des dossiers en retard, juste mettre à jour le contenu
    if (existingToast && currentCount > 0) {
      console.log("[LATE ALERT DEBUG] Mise à jour de l'alerte existante");
      existingToast.textContent = `⚠️ ${currentCount} dossier(s) en retard`;
      // S'assurer que l'alerte reste visible
      existingToast.style.opacity = "1";
      existingToast.style.display = "block";
      return; // Ne pas recréer l'alerte, juste la mettre à jour
    }

    // Créer une nouvelle alerte seulement si elle n'existe pas ET qu'il y a des dossiers en retard
    if (!existingToast && currentCount > 0) {
      console.log("[LATE ALERT DEBUG] Création d'une nouvelle alerte");
      // Créer une nouvelle alerte seulement si elle n'existe pas
      const toast = document.createElement("div");
      toast.id = "late-deliveries-toast";
      toast.style.position = "fixed";
      toast.style.top = "20px"; // Position en haut
      toast.style.right = "280px"; // À gauche de l'avatar, entre la recherche et l'avatar
      toast.style.background = "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
      toast.style.color = "#fff";
      toast.style.fontWeight = "bold";
      toast.style.fontSize = "1.08em";
      toast.style.padding = "10px 28px";
      toast.style.borderRadius = "16px";
      toast.style.boxShadow = "0 6px 32px rgba(239,68,68,0.18)";
      toast.style.zIndex = 99999;
      toast.style.cursor = "pointer";
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s";
      toast.style.animation = "pulse 2s infinite"; // Animation de pulsation pour attirer l'attention
      toast.textContent = `⚠️ ${currentCount} dossier(s) en retard`;
      document.body.appendChild(toast);

      // Ajouter les styles CSS pour l'animation de pulsation si pas déjà présent
      if (!document.getElementById("late-toast-animation-style")) {
        const style = document.createElement("style");
        style.id = "late-toast-animation-style";
        style.innerHTML = `
        @keyframes pulse {
          0% { 
            transform: scale(1);
            box-shadow: 0 6px 32px rgba(239,68,68,0.18);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 8px 40px rgba(239,68,68,0.35);
          }
          100% { 
            transform: scale(1);
            box-shadow: 0 6px 32px rgba(239,68,68,0.18);
          }
        }
      `;
        document.head.appendChild(style);
      }

      setTimeout(() => {
        toast.style.opacity = "1";
      }, 10);
      // Clic : affiche la liste détaillée
      toast.onclick = function () {
        // Supprimer popup existant
        const oldPopup = document.getElementById("late-deliveries-popup");
        if (oldPopup) oldPopup.remove();
        const overlay = document.createElement("div");
        overlay.id = "late-deliveries-popup";
        overlay.style.position = "fixed";
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(30,41,59,0.45)";
        overlay.style.zIndex = 100000;
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.padding = "2vh";
        const box = document.createElement("div");
        box.style.background = "#fff";
        box.style.borderRadius = "16px";
        box.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
        box.style.maxWidth = "95vw";
        box.style.width = "95vw";
        box.style.maxHeight = "90vh";
        box.style.height = "90vh";
        box.style.padding = "0";
        box.style.position = "relative";
        box.style.display = "flex";
        box.style.flexDirection = "column";
        const header = document.createElement("div");
        header.style.background = "#ef4444";
        header.style.color = "#fff";
        header.style.padding = "18px 28px 12px 28px";
        header.style.fontWeight = "bold";
        header.style.fontSize = "1.15rem";
        header.style.display = "flex";
        header.style.flexDirection = "column";
        header.style.borderTopLeftRadius = "16px";
        header.style.borderTopRightRadius = "16px";
        header.innerHTML = `<span style='font-size:1.08em;'>Dossiers en retard</span>`;
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.background = "none";
        closeBtn.style.border = "none";
        closeBtn.style.color = "#fff";
        closeBtn.style.fontSize = "2.1rem";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "10px";
        closeBtn.style.right = "18px";
        closeBtn.setAttribute("aria-label", "Fermer");
        closeBtn.onclick = () => overlay.remove();
        header.appendChild(closeBtn);
        box.appendChild(header);
        const content = document.createElement("div");
        content.style.padding = "20px";
        content.style.background =
          "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)";
        content.style.flex = "1 1 auto";
        content.style.overflowY = "auto";
        content.style.overflowX = "auto";
        content.style.display = "flex";
        content.style.flexDirection = "column";
        content.style.alignItems = "center";
        content.style.justifyContent = "flex-start";
        content.style.minHeight = "0";
        content.style.maxHeight = "100%";

        if (lateDeliveries.length === 0) {
          content.innerHTML =
            "<div style='text-align:center;padding:24px;color:#64748b;font-size:1.1rem;font-weight:600;'>AUCUN DOSSIER EN RETARD.</div>";
        } else {
          // Conteneur pour le tableau centré
          const tableContainer = document.createElement("div");
          tableContainer.style.width = "100%";
          tableContainer.style.maxWidth = "95%";
          tableContainer.style.margin = "auto";
          tableContainer.style.backgroundColor = "#fff";
          tableContainer.style.borderRadius = "12px";
          tableContainer.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
          tableContainer.style.overflow = "auto";
          tableContainer.style.border = "2px solid #e2e8f0";
          tableContainer.style.maxHeight = "70vh";
          tableContainer.style.minHeight = "400px";

          // Créer le tableau avec toutes les colonnes demandées
          const table = document.createElement("table");
          table.style.width = "100%";
          table.style.borderCollapse = "collapse";
          table.style.fontSize = "0.9rem";
          table.style.backgroundColor = "#fff";
          table.style.fontFamily =
            "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

          // En-tête du tableau
          const thead = document.createElement("thead");
          thead.innerHTML = `
            <tr style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); color: #ffffff; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 50px; color: #ffffff !important; font-weight: bold;">N°</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 100px; color: #ffffff !important; font-weight: bold;">DATE</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 120px; color: #ffffff !important; font-weight: bold;">AGENT</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 150px; color: #ffffff !important; font-weight: bold;">CLIENT (NOM)</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 120px; color: #ffffff !important; font-weight: bold;">CLIENT (TÉL)</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 130px; color: #ffffff !important; font-weight: bold;">NUMÉRO TC(S)</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 120px; color: #ffffff !important; font-weight: bold;">LIEU</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 140px; color: #ffffff !important; font-weight: bold;">TYPE CONTENEUR</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 120px; color: #ffffff !important; font-weight: bold;">CONTENU</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 130px; color: #ffffff !important; font-weight: bold;">N° DÉCLARATION</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 100px; color: #ffffff !important; font-weight: bold;">N° BL</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 120px; color: #ffffff !important; font-weight: bold;">N° DOSSIER</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 140px; color: #ffffff !important; font-weight: bold;">NB CONTENEURS</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 150px; color: #ffffff !important; font-weight: bold;">COMPAGNIE</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 100px; color: #ffffff !important; font-weight: bold;">POIDS</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 140px; color: #ffffff !important; font-weight: bold;">NOM NAVIRE</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 100px; color: #ffffff !important; font-weight: bold;">CIRCUIT</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 130px; color: #ffffff !important; font-weight: bold;">MODE TRANSPORT</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 140px; color: #ffffff !important; font-weight: bold;">STATUT DOSSIER</th>
              <th style="padding: 16px 12px; border: 1px solid #dc2626; text-align: center; position: sticky; top: 0; z-index: 10; font-size: 0.85rem; letter-spacing: 0.5px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); min-width: 150px; color: #ffffff !important; font-weight: bold;">OBSERVATION</th>
            </tr>
          `;
          table.appendChild(thead);

          // Corps du tableau
          const tbody = document.createElement("tbody");

          lateDeliveries.forEach((d, idx) => {
            const tr = document.createElement("tr");
            tr.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#f9fafb";
            tr.style.cursor = "pointer";
            tr.style.transition = "all 0.3s ease";
            tr.style.borderBottom = "1px solid #e2e8f0";

            // Fonction pour formater les dates
            function formatDate(dateStr) {
              if (!dateStr) return "-";
              try {
                const date = new Date(dateStr);
                return date.toLocaleDateString("fr-FR");
              } catch {
                return dateStr;
              }
            }

            // Fonction pour créer un menu déroulant pour les TC multiples
            function createTCDropdown(tcNumbers) {
              if (!tcNumbers) return "-";

              let tcList = [];
              if (Array.isArray(tcNumbers)) {
                tcList = tcNumbers.filter(Boolean);
              } else if (typeof tcNumbers === "string") {
                tcList = tcNumbers.split(/[,;\s]+/).filter(Boolean);
              }

              if (tcList.length === 0) return "-";
              if (tcList.length === 1) return tcList[0].toUpperCase();

              const select = document.createElement("select");
              select.style.border = "1px solid #ccc";
              select.style.borderRadius = "4px";
              select.style.padding = "4px";
              select.style.backgroundColor = "#fff";
              select.style.fontSize = "0.8rem";
              select.style.maxWidth = "120px";

              const defaultOption = document.createElement("option");
              defaultOption.value = "";
              defaultOption.textContent = `${tcList.length} TC(S)`;
              defaultOption.style.fontWeight = "bold";
              select.appendChild(defaultOption);

              tcList.forEach((tc) => {
                const option = document.createElement("option");
                option.value = tc;
                option.textContent = tc.toUpperCase();
                select.appendChild(option);
              });

              return select.outerHTML;
            }

            // Fonction pour mettre en majuscules et gérer les valeurs nulles
            function formatValue(value, isUpperCase = true) {
              if (!value || value === null || value === undefined) return "-";
              const str = String(value);
              return isUpperCase ? str.toUpperCase() : str;
            }

            // Fonction pour traduire le statut en français
            function translateStatus(status) {
              if (!status) return "EN ATTENTE";
              const statusStr = status.toString().toLowerCase();

              // Traductions des statuts courants
              const translations = {
                pending: "EN ATTENTE",
                pending_acconier: "EN ATTENTE DE PAIEMENT",
                awaiting_payment_acconier: "EN ATTENTE DE PAIEMENT",
                en_attente_paiement: "EN ATTENTE DE PAIEMENT",
                mise_en_livraison_acconier: "MIS EN LIVRAISON",
                in_progress: "EN COURS",
                delivered: "LIVRÉ",
                livré: "LIVRÉ",
                livre: "LIVRÉ",
                cancelled: "ANNULÉ",
                annule: "ANNULÉ",
                delayed: "EN RETARD",
                en_retard: "EN RETARD",
                completed: "TERMINÉ",
                complete: "TERMINÉ",
                termine: "TERMINÉ",
                processing: "EN TRAITEMENT",
                shipped: "EXPÉDIÉ",
                expedie: "EXPÉDIÉ",
                received: "REÇU",
                recu: "REÇU",
                confirmed: "CONFIRMÉ",
                confirme: "CONFIRMÉ",
                rejected: "REJETÉ",
                rejete: "REJETÉ",
              };

              return translations[statusStr] || status.toString().toUpperCase();
            }

            tr.innerHTML = `
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #dc2626; background-color: #fef2f2;">${
                idx + 1
              }</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500;">${formatDate(
                d.delivery_date || d.created_at
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #1e40af;">${formatValue(
                d.employee_name
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500;">${formatValue(
                d.client_name || d.client
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500; font-family: monospace;">${formatValue(
                d.client_phone
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center;">${createTCDropdown(
                d.container_number
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500;">${formatValue(
                d.lieu
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500;">${formatValue(
                d.container_foot_type
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500;">${formatValue(
                d.container_type_and_content
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500; font-family: monospace;">${formatValue(
                d.declaration_number
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500; font-family: monospace;">${formatValue(
                d.bl_number
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #dc2626; background-color: #fef2f2;">${formatValue(
                d.dossier_number
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #059669;">${formatValue(
                d.number_of_containers
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500;">${formatValue(
                d.shipping_company
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500; font-family: monospace;">${formatValue(
                d.weight
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500;">${formatValue(
                d.ship_name
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500;">${formatValue(
                d.circuit
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500;">${formatValue(
                d.transporter_mode
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #dc2626; background-color: #fef2f2;">${translateStatus(
                d.delivery_status_acconier || d.status
              )}</td>
              <td style="padding: 12px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 500; font-style: italic;">${formatValue(
                d.observation_acconier || d.observation || d.notes,
                false
              )}</td>
            `;

            // Ajouter l'effet hover amélioré
            tr.onmouseenter = function () {
              tr.style.backgroundColor = "#f3f4f6";
              tr.style.transform = "scale(1.005)";
              tr.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              tr.style.borderLeft = "4px solid #dc2626";
            };

            tr.onmouseleave = function () {
              tr.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#f9fafb";
              tr.style.transform = "scale(1)";
              tr.style.boxShadow = "none";
              tr.style.borderLeft = "none";
            };

            // Au clic, aller à la ligne correspondante dans le tableau principal
            tr.onclick = function (e) {
              e.stopPropagation();
              overlay.remove(); // ferme la popup

              // Cherche la ligne du tableau avec le bon N° Dossier
              const tableBody = document.getElementById("deliveriesTableBody");
              if (tableBody) {
                const rows = tableBody.querySelectorAll("tr");
                let foundRow = null;
                rows.forEach((row) => {
                  const cells = row.querySelectorAll("td");
                  for (let i = 0; i < cells.length; i++) {
                    if (
                      cells[i].textContent &&
                      String(cells[i].textContent).trim() ===
                        String(d.dossier_number).trim()
                    ) {
                      foundRow = row;
                    }
                  }
                });
                if (foundRow) {
                  foundRow.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  // Clignotement 3 fois sur 3 secondes
                  const tds = foundRow.querySelectorAll("td");
                  let flashCount = 0;
                  const maxFlashes = 3;
                  function doFlash() {
                    tds.forEach((td) => {
                      td.classList.remove("flash-red-cell");
                      void td.offsetWidth;
                      td.classList.add("flash-red-cell");
                    });
                    setTimeout(() => {
                      tds.forEach((td) =>
                        td.classList.remove("flash-red-cell")
                      );
                      flashCount++;
                      if (flashCount < maxFlashes) {
                        setTimeout(doFlash, 1000);
                      }
                    }, 1000);
                  }
                  doFlash();
                }
              }
            };

            tbody.appendChild(tr);
          });

          table.appendChild(tbody);
          tableContainer.appendChild(table);
          content.appendChild(tableContainer);
        }
        box.appendChild(content);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
        // Ajout du style pour le flash rouge sur la ligne du tableau si pas déjà présent
        if (!document.getElementById("flash-red-row-style")) {
          const style = document.createElement("style");
          style.id = "flash-red-row-style";
          style.innerHTML = `
        .flash-red-cell {
          animation: flashRedCellAnim 1s cubic-bezier(0.4,0,0.2,1);
          background: #d49494ff !important;
          transition: background 0.3s;
        }
        @keyframes flashRedCellAnim {
          0% { background: #fee2e2; }
          30% { background: #f87171; }
          70% { background: #fecaca; }
          100% { background: transparent; }
        }
        /* Styles pour les barres de défilement */
        *::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        *::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
        }
        *::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          border-radius: 6px;
          border: 2px solid #f1f5f9;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #b91c1c, #991b1b);
        }
        *::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
        `;
          document.head.appendChild(style);
        }
      };
      // L'alerte reste maintenant permanente - pas de disparition automatique
    }
  }
  // Ajout dynamique du bouton de suppression compact à côté des dates
  let deleteBtn = null;
  let rangeDiv = null;
  function showDeleteBtn() {
    if (!deleteBtn) {
      deleteBtn = document.createElement("button");
      deleteBtn.id = "deleteRowsBtn";
      deleteBtn.textContent = "🗑️ Supprimer";
      deleteBtn.style.background =
        "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
      deleteBtn.style.color = "#fff";
      deleteBtn.style.fontWeight = "bold";
      deleteBtn.style.fontSize = "0.98em";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "50px";
      deleteBtn.style.padding = "0.45em 1.1em";
      deleteBtn.style.marginLeft = "12px";
      deleteBtn.style.boxShadow = "0 2px 8px rgba(239,68,68,0.13)";
      deleteBtn.style.display = "none";
      deleteBtn.onclick = async function () {
        const checked = document.querySelectorAll(
          ".select-row-checkbox:checked"
        );
        if (checked.length === 0) return;

        // Message de confirmation personnalisé
        const confirmOverlay = document.createElement("div");
        confirmOverlay.style.position = "fixed";
        confirmOverlay.style.top = 0;
        confirmOverlay.style.left = 0;
        confirmOverlay.style.width = "100vw";
        confirmOverlay.style.height = "100vh";
        confirmOverlay.style.background = "rgba(30,41,59,0.45)";
        confirmOverlay.style.zIndex = 99999;
        confirmOverlay.style.display = "flex";
        confirmOverlay.style.alignItems = "center";
        confirmOverlay.style.justifyContent = "center";

        const confirmBox = document.createElement("div");
        confirmBox.style.background = "#fff";
        confirmBox.style.borderRadius = "18px";
        confirmBox.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
        confirmBox.style.maxWidth = "420px";
        confirmBox.style.width = "96vw";
        confirmBox.style.padding = "0";
        confirmBox.style.position = "relative";
        confirmBox.style.display = "flex";
        confirmBox.style.flexDirection = "column";

        // Header
        const confirmHeader = document.createElement("div");
        confirmHeader.style.background =
          "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
        confirmHeader.style.color = "#fff";
        confirmHeader.style.padding = "22px 32px 12px 32px";
        confirmHeader.style.fontWeight = "bold";
        confirmHeader.style.fontSize = "1.18rem";
        confirmHeader.style.borderTopLeftRadius = "18px";
        confirmHeader.style.borderTopRightRadius = "18px";
        confirmHeader.innerHTML = `<span style='font-size:1.25em;'>🗑️ Confirmation de suppression</span>`;
        confirmBox.appendChild(confirmHeader);

        // Message
        const confirmMsgDiv = document.createElement("div");
        confirmMsgDiv.style.padding = "24px 24px 18px 24px";
        confirmMsgDiv.style.background = "#f8fafc";
        confirmMsgDiv.style.fontSize = "1.08em";
        confirmMsgDiv.style.color = "#1e293b";
        confirmMsgDiv.style.textAlign = "center";
        confirmMsgDiv.innerHTML =
          "<b>Vous êtes sur le point de supprimer définitivement la sélection.</b><br><br>Cette opération est <span style='color:#ef4444;font-weight:600;'>irréversible</span>.<br><br>Voulez-vous vraiment continuer ?";
        confirmBox.appendChild(confirmMsgDiv);

        // Boutons
        const btnsDiv = document.createElement("div");
        btnsDiv.style.display = "flex";
        btnsDiv.style.justifyContent = "center";
        btnsDiv.style.gap = "18px";
        btnsDiv.style.padding = "0 0 22px 0";

        // Bouton Annuler
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Annuler";
        cancelBtn.style.background = "#fff";
        cancelBtn.style.color = "#ef4444";
        cancelBtn.style.fontWeight = "bold";
        cancelBtn.style.fontSize = "1em";
        cancelBtn.style.border = "2px solid #ef4444";
        cancelBtn.style.borderRadius = "8px";
        cancelBtn.style.padding = "0.7em 1.7em";
        cancelBtn.style.cursor = "pointer";
        cancelBtn.onclick = () => confirmOverlay.remove();

        // Bouton Confirmer
        const okBtn = document.createElement("button");
        okBtn.textContent = "Supprimer";
        okBtn.style.background =
          "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
        okBtn.style.color = "#fff";
        okBtn.style.fontWeight = "bold";
        okBtn.style.fontSize = "1em";
        okBtn.style.border = "none";
        okBtn.style.borderRadius = "8px";
        okBtn.style.padding = "0.7em 1.7em";
        okBtn.style.cursor = "pointer";
        okBtn.onclick = async () => {
          confirmOverlay.remove();
          const idsToDelete = Array.from(checked).map((cb) =>
            cb.getAttribute("data-id")
          );
          // Appel API backend pour suppression définitive
          try {
            const response = await fetch("/deliveries/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ids: idsToDelete }),
            });
            const result = await response.json();
            if (result.success) {
              // Suppression locale hfgvj seulement si succès côté serveur
              if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
                window.allDeliveries = window.allDeliveries.filter(
                  (d) => !idsToDelete.includes(String(d.id))
                );
              }
              const dateStartInput = document.getElementById(
                "mainTableDateStartFilter"
              );
              const dateEndInput = document.getElementById(
                "mainTableDateEndFilter"
              );
              if (typeof updateTableForDateRange === "function") {
                updateTableForDateRange(
                  dateStartInput ? dateStartInput.value : "",
                  dateEndInput ? dateEndInput.value : ""
                );
              }
              hideDeleteBtn();

              // Afficher une alerte visuelle "suppression effectuée"
              const alertDiv = document.createElement("div");
              alertDiv.textContent = "Suppression effectuée";
              alertDiv.style.position = "fixed";
              alertDiv.style.top = "80px";
              alertDiv.style.left = "50%";
              alertDiv.style.transform = "translateX(-50%)";
              alertDiv.style.background =
                "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
              alertDiv.style.color = "#fff";
              alertDiv.style.fontWeight = "bold";
              alertDiv.style.fontSize = "1.12em";
              alertDiv.style.padding = "18px 38px";
              alertDiv.style.borderRadius = "16px";
              alertDiv.style.boxShadow = "0 6px 32px rgba(239,68,68,0.18)";
              alertDiv.style.zIndex = 99999;
              alertDiv.style.opacity = "0";
              alertDiv.style.transition = "opacity 0.3s";
              document.body.appendChild(alertDiv);
              setTimeout(() => {
                alertDiv.style.opacity = "1";
              }, 10);
              setTimeout(() => {
                alertDiv.style.opacity = "0";
                setTimeout(() => alertDiv.remove(), 400);
              }, 2000);
            } else {
              alert(
                "Erreur lors de la suppression côté serveur. Veuillez réessayer."
              );
            }
          } catch (e) {
            alert("Erreur réseau lors de la suppression. Veuillez réessayer.");
          }
        };

        btnsDiv.appendChild(cancelBtn);
        btnsDiv.appendChild(okBtn);
        confirmBox.appendChild(btnsDiv);
        confirmOverlay.appendChild(confirmBox);
        document.body.appendChild(confirmOverlay);
        // Fermer la popup si clic en dehors de la boîte
        confirmOverlay.onclick = (e) => {
          if (e.target === confirmOverlay) confirmOverlay.remove();
        };
      };
      // Trouver le rangeDiv (le conteneur des dates)
      rangeDiv = document.getElementById(
        "mainTableDateStartFilter"
      )?.parentNode;
      if (rangeDiv && rangeDiv.nodeName === "DIV") {
        rangeDiv.appendChild(deleteBtn);
      } else {
        // fallback : insérer après le champ date début
        const dateStartInput = document.getElementById(
          "mainTableDateStartFilter"
        );
        if (dateStartInput && dateStartInput.parentNode) {
          dateStartInput.parentNode.insertBefore(
            deleteBtn,
            dateStartInput.nextSibling
          );
        } else {
          document.body.appendChild(deleteBtn);
        }
      }
    }
    deleteBtn.style.display = "inline-block";
  }
  function hideDeleteBtn() {
    if (deleteBtn) deleteBtn.style.display = "none";
  }
  // Gestion de l'affichage du bouton selonv vhvcb la sélection
  document.addEventListener("change", function (e) {
    if (
      e.target.classList &&
      e.target.classList.contains("select-row-checkbox")
    ) {
      const checked = document.querySelectorAll(".select-row-checkbox:checked");
      if (checked.length > 0) {
        showDeleteBtn();
      } else {
        hideDeleteBtn();
      }
    }
  });
  // Ajout du style CSS pour badges, tags et menu déroulant des conteneurs (Numéro TC(s))
  const styleTC = document.createElement("style");
  const newLocal = (styleTC.textContent = `
    #deliveriesTableBody .tc-tag {
      display: inline-block;
      margin-right: 4px;
      padding: 2px 8px;
      background: #2563eb;
      color: #fff;
      border-radius: 12px;
      font-size: 1em;
      font-weight: 600;
      white-space: nowrap;
      vertical-align: middle;
      box-shadow: 0 2px 8px rgba(37,99,235,0.10);
      border: none;
    }
    #deliveriesTableBody .tc-tags-btn {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: #0e274e;
      border: 2px solid #2563eb;
      border-radius: 14px;
      padding: 2px 14px;
      cursor: pointer;
      font-size: 1em;
      font-weight: 600;
      color: #fff;
      box-shadow: 0 2px 8px rgba(37,99,235,0.10);
      white-space: nowrap;
    }
    #deliveriesTableBody .tc-popup {
      position: absolute;
      background: #fff;
      border: 2px solid #2563eb;
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(30,41,59,0.13);
      padding: 8px 0;
      min-width: 120px;
      z-index: 1002;
      left: 0;
      top: 100%;
      white-space: nowrap;
    }
    #deliveriesTableBody .tc-popup-item {
      padding: 8px 22px;
      cursor: pointer;
      font-size: 1.05em;
      color: #2563eb;
      border-bottom: 1px solid #f3f4f6;
      font-weight: 600;
    }
    #deliveriesTableBody .tc-popup-item:last-child {
      border-bottom: none;
    }
    /* Styles pour les entêtes et colonnes sauf Numéro TC(s) */
    #deliveriesTable thead th:not([data-col-id='container_number']) {
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 1em;
      font-weight: bold;
      background: #0e274e;
      color: #fff;
      border-bottom: 2px solid #2563eb;
      text-align: center;
      vertical-align: middle;
    }
    #deliveriesTable tbody td:not(.tc-multi-cell):not([data-col-id='container_number']) {
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }
    /* Bouton Statut (en-tête et ligne) */
    .statut-btn {
      font-size: 1.08em !important;
      font-weight: 700 !important;
      padding: 2px 18px !important;
      border-radius: 16px !important;
      border: 2px solid #eab308 !important;
      background: #fffbe6 !important;
      color: #b45309 !important;
      box-shadow: 0 2px 8px rgba(234,179,8,0.13) !important;
      outline: none !important;
      margin-top: 6px;
      transition: box-shadow 0.2s;
    }
    .statut-btn:active {
      box-shadow: 0 1px 4px rgba(234,179,8,0.18) !important;
    }
    @media (max-width: 900px) {
      #deliveriesTable thead th:not([data-col-id='container_number']),
      #deliveriesTable tbody td:not(:nth-child(5)) {
        max-width: 90px;
        font-size: 0.95em;
      }
      .statut-btn {
        font-size: 0.98em !important;
        padding: 2px 10px !important;
      }
    }
    @media (max-width: 600px) {
      #deliveriesTable thead th:not([data-col-id='container_number']),
      #deliveriesTable tbody td:not(:nth-child(5)) {
        max-width: 60px;
        font-size: 0.92em;
      }
      .statut-btn {
        font-size: 0.92em !important;
        padding: 2px 6px !important;
      }
    }
  `);
  document.head.appendChild(styleTC);
  const tableBody = document.getElementById("deliveriesTableBody");
  // Ajout des deux champs de date (début et fin)
  let dateStartInput = document.getElementById("mainTableDateStartFilter");
  let dateEndInput = document.getElementById("mainTableDateEndFilter");
  // Ajout du filtre de recherche N° Dossier / N° BL
  let searchInput = document.getElementById("searchInput");
  let searchBtn = document.getElementById("searchButton");
  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", function () {
      let query = searchInput.value.trim().toLowerCase();
      if (!query) {
        // Si vide, on réaffiche selon la plage de dates
        updateTableForDateRange(dateStartInput.value, dateEndInput.value);
        return;
      }
      // Filtrer sur N° Dossier, N° BL ou Nom du navire
      let deliveriesSource = window.allDeliveries || [];
      let filtered = deliveriesSource.filter((delivery) => {
        let dossier = String(delivery.dossier_number || "").toLowerCase();
        let shipName = String(delivery.ship_name || "").toLowerCase();
        let bls = [];
        if (Array.isArray(delivery.bl_number)) {
          bls = delivery.bl_number.map((b) => String(b).toLowerCase());
        } else if (typeof delivery.bl_number === "string") {
          bls = delivery.bl_number.split(/[,;\s]+/).map((b) => b.toLowerCase());
        }
        return (
          dossier.includes(query) ||
          bls.some((b) => b.includes(query)) ||
          shipName.includes(query)
        );
      });
      // Tri du plus ancien au plus récent
      filtered.sort((a, b) => {
        let dateA = new Date(
          a.delivery_date || a.created_at || a.Date || a["Date Livraison"]
        );
        let dateB = new Date(
          b.delivery_date || b.created_at || b.Date || b["Date Livraison"]
        );
        return dateA - dateB;
      });
      renderAgentTableFull(
        filtered,
        document.getElementById("deliveriesTableBody")
      );
    });
    // Permet la recherche au clavier (Enter)
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") searchBtn.click();
    });
  }
  // Si les champs n'existent pas, on les crée dynamiquement à côté de l'ancien champ (pour compatibilité)
  const oldDateInput = document.getElementById("mainTableDateFilter");
  if (!dateStartInput || !dateEndInput) {
    // Création des deux inputs si besoin
    const parent = oldDateInput ? oldDateInput.parentNode : document.body;
    // Création du conteneur
    const rangeDiv = document.createElement("div");
    rangeDiv.style.display = "flex";
    rangeDiv.style.gap = "12px";
    rangeDiv.style.alignItems = "center";
    rangeDiv.style.marginBottom = "12px";
    // Date début
    dateStartInput = document.createElement("input");
    dateStartInput.type = "date";
    dateStartInput.id = "mainTableDateStartFilter";
    dateStartInput.style.padding = "6px 10px";
    dateStartInput.style.borderRadius = "8px";
    dateStartInput.style.border = "1.5px solid #2563eb";
    // Date fin
    dateEndInput = document.createElement("input");
    dateEndInput.type = "date";
    dateEndInput.id = "mainTableDateEndFilter";
    dateEndInput.style.padding = "6px 10px";
    dateEndInput.style.borderRadius = "8px";
    dateEndInput.style.border = "1.5px solid #2563eb";
    // Label
    const label = document.createElement("span");
    label.textContent = "Filtrer du ";
    const label2 = document.createElement("span");
    label2.textContent = " au ";
    rangeDiv.appendChild(label);
    rangeDiv.appendChild(dateStartInput);
    rangeDiv.appendChild(label2);
    rangeDiv.appendChild(dateEndInput);
    // Ajout dans le DOM
    if (oldDateInput) {
      oldDateInput.style.display = "none";
      parent.insertBefore(rangeDiv, oldDateInput);
    } else {
      document.body.insertBefore(rangeDiv, document.body.firstChild);
    }
  }

  // On charge toutes les livraisons une seule fois au chargement
  let allDeliveries = [];

  // --- Connexion WebSocket pour maj temps réel BL et suppression instantanée ---
  let ws;
  function setupWebSocket() {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = proto + "://" + window.location.host;
    ws = new WebSocket(wsUrl);
    ws.onopen = function () {};
    ws.onmessage = function (event) {
      console.log("[DEBUG] ws.onmessage triggered", event.data);

      try {
        const data = JSON.parse(event.data);
        console.log(
          "[DEBUG] data.type:",
          data.type,
          "data.status:",
          data.status
        );

        if (
          data.type === "bl_status_update" &&
          data.delivery &&
          data.delivery.bl_statuses
        ) {
          // Toujours normaliser la livraison reçue comme dans loadAllDeliveries
          function normalizeDelivery(delivery) {
            let tcList = [];

            // PRIORITÉ 1 : Utiliser les données JSON complètes si disponibles
            if (delivery.container_numbers_list) {
              try {
                if (typeof delivery.container_numbers_list === "string") {
                  tcList = JSON.parse(delivery.container_numbers_list);
                } else if (Array.isArray(delivery.container_numbers_list)) {
                  tcList = delivery.container_numbers_list;
                }
                tcList = tcList.filter(Boolean); // Supprimer les valeurs vides
              } catch (e) {
                console.warn("Erreur parsing container_numbers_list:", e);
                tcList = [];
              }
            }

            // PRIORITÉ 2 : Si pas de données JSON, utiliser le champ classique
            if (tcList.length === 0) {
              if (Array.isArray(delivery.container_number)) {
                tcList = delivery.container_number.filter(Boolean);
              } else if (typeof delivery.container_number === "string") {
                tcList = delivery.container_number
                  .split(/[,;\s]+/)
                  .filter(Boolean);
              }
            }
            if (
              !delivery.container_statuses ||
              typeof delivery.container_statuses !== "object"
            ) {
              delivery.container_statuses = {};
            }
            tcList.forEach((tc) => {
              if (!delivery.container_statuses[tc]) {
                delivery.container_statuses[tc] = "attente_paiement";
              }
            });
            if (
              delivery.bl_statuses &&
              typeof delivery.bl_statuses === "string"
            ) {
              try {
                delivery.bl_statuses = JSON.parse(delivery.bl_statuses);
              } catch {
                delivery.bl_statuses = {};
              }
            }
            if (
              !delivery.bl_statuses ||
              typeof delivery.bl_statuses !== "object"
            ) {
              delivery.bl_statuses = {};
            }
            return delivery;
          }
          const normalizedDelivery = normalizeDelivery(data.delivery);
          if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
            const idx = window.allDeliveries.findIndex(
              (d) => d.id === normalizedDelivery.id
            );
            if (idx !== -1) {
              window.allDeliveries[idx] = normalizedDelivery;
            }
          }
          // Rafraîchir le tableau si la livraison est dans la plage de dates courante
          const dateStartInput = document.getElementById(
            "mainTableDateStartFilter"
          );
          const dateEndInput = document.getElementById(
            "mainTableDateEndFilter"
          );
          if (typeof updateTableForDateRange === "function") {
            updateTableForDateRange(
              dateStartInput ? dateStartInput.value : "",
              dateEndInput ? dateEndInput.value : ""
            );
          }
        }
        // Ajout : réception automatique d'un nouvel ordre de livraison
        if (data.type === "new_delivery_created" && data.delivery) {
          // Normalise la livraison reçue comme dans loadAllDeliveries
          function normalizeDelivery(delivery) {
            let tcList = [];

            // PRIORITÉ 1 : Utiliser les données JSON complètes si disponibles
            if (delivery.container_numbers_list) {
              try {
                if (typeof delivery.container_numbers_list === "string") {
                  tcList = JSON.parse(delivery.container_numbers_list);
                } else if (Array.isArray(delivery.container_numbers_list)) {
                  tcList = delivery.container_numbers_list;
                }
                tcList = tcList.filter(Boolean); // Supprimer les valeurs vides
              } catch (e) {
                console.warn("Erreur parsing container_numbers_list:", e);
                tcList = [];
              }
            }

            // PRIORITÉ 2 : Si pas de données JSON, utiliser le champ classique
            if (tcList.length === 0) {
              if (Array.isArray(delivery.container_number)) {
                tcList = delivery.container_number.filter(Boolean);
              } else if (typeof delivery.container_number === "string") {
                tcList = delivery.container_number
                  .split(/[,;\s]+/)
                  .filter(Boolean);
              }
            }
            if (
              !delivery.container_statuses ||
              typeof delivery.container_statuses !== "object"
            ) {
              delivery.container_statuses = {};
            }
            tcList.forEach((tc) => {
              if (!delivery.container_statuses[tc]) {
                delivery.container_statuses[tc] = "attente_paiement";
              }
            });
            if (
              delivery.bl_statuses &&
              typeof delivery.bl_statuses === "string"
            ) {
              try {
                delivery.bl_statuses = JSON.parse(delivery.bl_statuses);
              } catch {
                delivery.bl_statuses = {};
              }
            }
            if (
              !delivery.bl_statuses ||
              typeof delivery.bl_statuses !== "object"
            ) {
              delivery.bl_statuses = {};
            }
            return delivery;
          }
          const normalizedDelivery = normalizeDelivery(data.delivery);
          if (!window.allDeliveries) window.allDeliveries = [];
          window.allDeliveries.unshift(normalizedDelivery);
          // Met à jour le tableau si la livraison correspond à la plage de dates courante
          const dateStartInput = document.getElementById(
            "mainTableDateStartFilter"
          );
          const dateEndInput = document.getElementById(
            "mainTableDateEndFilter"
          );
          const startVal = dateStartInput ? dateStartInput.value : "";
          const endVal = dateEndInput ? dateEndInput.value : "";
          // Vérifie si la nouvelle livraison est dans la plage de dates
          let dDate =
            normalizedDelivery.delivery_date || normalizedDelivery.created_at;
          let normalized = "";
          if (typeof dDate === "string") {
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dDate)) {
              const [j, m, a] = dDate.split("/");
              normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(dDate)) {
              normalized = dDate;
            } else if (/^\d{2}-\d{2}-\d{4}$/.test(dDate)) {
              const [j, m, a] = dDate.split("-");
              normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
            } else {
              const dateObj = new Date(dDate);
              if (!isNaN(dateObj)) {
                normalized = dateObj.toISOString().split("T")[0];
              } else {
                normalized = dDate;
              }
            }
          } else if (dDate instanceof Date) {
            normalized = dDate.toISOString().split("T")[0];
          } else {
            normalized = String(dDate);
          }
          // Si la date de la livraison est dans la plage, on met à jour le tableau
          let isInRange = true;
          if (startVal) {
            isInRange = normalized >= startVal;
          }
          if (endVal && isInRange) {
            isInRange = normalized <= endVal;
          }
          if (isInRange && typeof updateTableForDateRange === "function") {
            updateTableForDateRange(startVal, endVal);
          }
          // Affiche une alerte avec le nom de l'agent
          const agentName = normalizedDelivery.employee_name || "-";
          showNewDeliveryAlert(agentName);
        }
        // Ajout : gestion du retour instantané d'un dossier au Resp. Acconier
        if (data.type === "delivery_returned_acconier") {
          // Recharge toutes les livraisons et rafraîchit le tableau
          const dateStartInput = document.getElementById(
            "mainTableDateStartFilter"
          );
          const dateEndInput = document.getElementById(
            "mainTableDateEndFilter"
          );
          const startVal = dateStartInput ? dateStartInput.value : "";
          const endVal = dateEndInput ? dateEndInput.value : "";
          loadAllDeliveries().then(() => {
            if (typeof updateTableForDateRange === "function") {
              updateTableForDateRange(startVal, endVal);
            }
          });
          // Affiche l'alerte reçue
          if (data.message) {
            const oldAlert = document.getElementById("restore-dossier-alert");
            if (oldAlert) oldAlert.remove();
            const alert = document.createElement("div");
            alert.id = "restore-dossier-alert";
            alert.textContent = data.message;
            alert.style.position = "fixed";
            alert.style.top = "80px";
            alert.style.left = "50%";
            alert.style.transform = "translateX(-50%)";
            alert.style.background =
              "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
            alert.style.color = "#fff";
            alert.style.fontWeight = "bold";
            alert.style.fontSize = "1.12em";
            alert.style.padding = "18px 38px";
            alert.style.borderRadius = "16px";
            alert.style.boxShadow = "0 6px 32px rgba(37,99,235,0.18)";
            alert.style.zIndex = 99999;
            alert.style.opacity = "0";
            alert.style.transition = "opacity 0.3s";
            document.body.appendChild(alert);
            setTimeout(() => {
              alert.style.opacity = "1";
            }, 10);
            setTimeout(() => {
              alert.style.opacity = "0";
              setTimeout(() => alert.remove(), 400);
            }, 2600);
          }
        }

        // ===== NOUVEAU : Traitement des mises à jour d'observations =====
        if (
          data.type === "observation_update" &&
          data.deliveryId &&
          data.hasOwnProperty("observation")
        ) {
          console.log(
            `🔄 [WebSocket] Mise à jour observation reçue pour livraison ${data.deliveryId}:`,
            data.observation
          );

          // Mettre à jour la livraison dans les données globales
          if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
            const deliveryIndex = window.allDeliveries.findIndex(
              (d) => d.id === data.deliveryId
            );
            if (deliveryIndex !== -1) {
              window.allDeliveries[deliveryIndex].observation =
                data.observation;
              console.log(
                `✅ [WebSocket] Observation mise à jour dans les données globales`
              );
            }
          }

          // Mettre à jour l'affichage si la cellule est visible ET qu'elle n'est pas en cours d'édition
          const observationCell = document.querySelector(
            `[data-delivery-id="${data.deliveryId}"][data-field="observation"]`
          );
          if (
            observationCell &&
            !observationCell.querySelector("textarea") &&
            !observationCell.hasAttribute("data-saving")
          ) {
            // Ne mettre à jour que si la cellule n'est pas en cours d'édition ou de sauvegarde
            observationCell.textContent = data.observation || "-";
            observationCell.dataset.edited = "true";
            console.log(
              `✅ [WebSocket] Cellule observation mise à jour dans le DOM`
            );
          } else if (
            observationCell &&
            (observationCell.querySelector("textarea") ||
              observationCell.hasAttribute("data-saving"))
          ) {
            console.log(
              `⚠️ [WebSocket] Cellule observation en cours d'édition/sauvegarde - mise à jour ignorée pour éviter la perte de données`
            );
          }

          // SUPPRIMÉ: Le rafraîchissement automatique du tableau qui causait la perte des données
          // On laisse l'utilisateur terminer sa saisie avant de rafraîchir
          console.log(
            `✅ [WebSocket] Observation mise à jour sans rafraîchissement du tableau (préservation des données en cours de saisie)`
          );
        }
      } catch (e) {
        console.error("WebSocket BL error:", e);
      }
    };
    ws.onerror = function () {};
    ws.onclose = function () {
      setTimeout(setupWebSocket, 2000);
    };
  }
  setupWebSocket();

  // Fonction d'alerte pour nouvel ordre de livraison
  function showNewDeliveryAlert(agentName) {
    // Supprimer toute alerte existante
    const oldAlert = document.getElementById("custom-new-delivery-alert");
    if (oldAlert) oldAlert.remove();
    const alert = document.createElement("div");
    alert.id = "custom-new-delivery-alert";
    alert.textContent = `L'Agent "${agentName}" a établi un ordre de livraison.`;
    alert.style.position = "fixed";
    alert.style.top = "80px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.background = "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
    alert.style.color = "#fff";
    alert.style.fontWeight = "bold";
    alert.style.fontSize = "1.12em";
    alert.style.padding = "18px 38px";
    alert.style.borderRadius = "16px";
    alert.style.boxShadow = "0 6px 32px rgba(37,99,235,0.18)";
    alert.style.zIndex = 99999;
    alert.style.opacity = "0";
    alert.style.transition = "opacity 0.3s";
    document.body.appendChild(alert);
    setTimeout(() => {
      alert.style.opacity = "1";
    }, 10);
    setTimeout(() => {
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 400);
    }, 2600);
  }

  async function loadAllDeliveries() {
    try {
      console.log("🔄 [DEBUG] Début du chargement des livraisons...");
      const response = await fetch("/deliveries/status");
      console.log(
        "🔄 [DEBUG] Réponse reçue:",
        response.status,
        response.statusText
      );
      const data = await response.json();
      console.log(
        "🔄 [DEBUG] Données reçues:",
        data.success,
        "Nombre de livraisons:",
        data.deliveries?.length
      );

      if (data.success && Array.isArray(data.deliveries)) {
        // Récupération des paramètres pour le mode admin
        const isAdminMode = getUrlParameter("mode") === "admin";
        const targetUser =
          getUrlParameter("targetUser") || getUrlParameter("user");
        const targetUserId = getUrlParameter("userId"); // Récupérer aussi l'userId

        console.log(
          "🔄 [DEBUG] Mode admin:",
          isAdminMode,
          "Target user:",
          targetUser,
          "Target userId:",
          targetUserId
        );

        let processedDeliveries = data.deliveries.map((delivery) => {
          // On ne touche pas à delivery.bl_statuses : il vient du backend et doit être conservé
          // Initialisation des statuts conteneurs si absent
          let tcList = [];

          // PRIORITÉ 1 : Utiliser les données JSON complètes si disponibles
          if (delivery.container_numbers_list) {
            try {
              if (typeof delivery.container_numbers_list === "string") {
                tcList = JSON.parse(delivery.container_numbers_list);
              } else if (Array.isArray(delivery.container_numbers_list)) {
                tcList = delivery.container_numbers_list;
              }
              tcList = tcList.filter(Boolean); // Supprimer les valeurs vides
            } catch (e) {
              console.warn("Erreur parsing container_numbers_list:", e);
              tcList = [];
            }
          }

          // PRIORITÉ 2 : Si pas de données JSON, utiliser le champ classique
          if (tcList.length === 0) {
            if (Array.isArray(delivery.container_number)) {
              tcList = delivery.container_number.filter(Boolean);
            } else if (typeof delivery.container_number === "string") {
              tcList = delivery.container_number
                .split(/[,;\s]+/)
                .filter(Boolean);
            }
          }
          if (
            !delivery.container_statuses ||
            typeof delivery.container_statuses !== "object"
          ) {
            delivery.container_statuses = {};
          }
          tcList.forEach((tc) => {
            if (!delivery.container_statuses[tc]) {
              delivery.container_statuses[tc] = "attente_paiement";
            }
          });
          // S'assurer que bl_statuses est bien un objet (si string JSON, parser)
          if (
            delivery.bl_statuses &&
            typeof delivery.bl_statuses === "string"
          ) {
            try {
              delivery.bl_statuses = JSON.parse(delivery.bl_statuses);
            } catch {
              delivery.bl_statuses = {};
            }
          }
          if (
            !delivery.bl_statuses ||
            typeof delivery.bl_statuses !== "object"
          ) {
            delivery.bl_statuses = {};
          }
          return delivery;
        });

        // Filtrage pour le mode admin : ne montrer que les livraisons de l'utilisateur ciblé
        if (isAdminMode && targetUser) {
          console.log(
            `🔍 [DEBUG FILTRAGE] Recherche pour l'utilisateur "${targetUser}"`
          );
          console.log(
            `🔍 [DEBUG] Nombre total de livraisons avant filtrage: ${processedDeliveries.length}`
          );

          // Charger les observations de l'utilisateur ciblé
          await loadUserObservations(targetUser, targetUserId);

          // Afficher quelques exemples de données pour comprendre la structure
          if (processedDeliveries.length > 0) {
            console.log(`🔍 [DEBUG] Exemple de livraison:`, {
              responsible_acconier: processedDeliveries[0].responsible_acconier,
              resp_acconier: processedDeliveries[0].resp_acconier,
              responsible_livreur: processedDeliveries[0].responsible_livreur,
              resp_livreur: processedDeliveries[0].resp_livreur,
              assigned_to: processedDeliveries[0].assigned_to,
              created_by: processedDeliveries[0].created_by,
              updated_by: processedDeliveries[0].updated_by,
              nom_agent_visiteur: processedDeliveries[0].nom_agent_visiteur,
              employee_name: processedDeliveries[0].employee_name,
              driver_name: processedDeliveries[0].driver_name,
            });
          }

          // 🔧 MODIFICATION ADMIN : En mode admin, afficher TOUS les dossiers sans exception
          // Supprimer le filtrage restrictif et laisser tous les dossiers visibles
          processedDeliveries.forEach((delivery) => {
            // Vérifier les différents champs où peut apparaître le nom de l'utilisateur
            const userFields = [
              delivery.responsible_acconier,
              delivery.resp_acconier,
              delivery.responsible_livreur,
              delivery.resp_livreur,
              delivery.assigned_to,
              delivery.created_by,
              delivery.updated_by,
              // Ajouter plus de champs possibles
              delivery.nom_agent_visiteur,
              delivery.employee_name,
              delivery.driver_name,
              delivery.transporteur,
              delivery.inspecteur,
              delivery.agent_douanes,
              delivery.chauffeur,
              // Champs supplémentaires pour les observations et activités
              delivery.agent_email,
              delivery.user_email,
              delivery.created_by_email,
              delivery.observation_acconier_author,
              delivery.observation_author,
              delivery.modified_by,
              delivery.last_modified_by,
            ];

            // Recherche spéciale dans les observations stockées localement pour chaque dossier
            try {
              // Vérifier les observations stockées dans localStorage avec différentes clés possibles
              const observationKeys = [
                `observation_${delivery.id}`,
                `obs_${delivery.id}`,
                `observationAcconier_${delivery.id}`,
                `observation_acconier_${delivery.id}`,
              ];

              for (const key of observationKeys) {
                const storedObservation = localStorage.getItem(key);
                if (storedObservation && storedObservation.trim() !== "") {
                  console.log(
                    `📝 [DEBUG] Observation trouvée avec clé ${key} pour livraison ${delivery.id}:`,
                    storedObservation
                  );

                  // Mettre à jour la livraison avec l'observation trouvée
                  if (
                    !delivery.observation_acconier ||
                    delivery.observation_acconier.trim() === ""
                  ) {
                    delivery.observation_acconier = storedObservation;
                  }
                  break;
                }
              }

              // 🔧 CORRECTION CRITIQUE : Stocker l'observation dans localStorage si elle existe
              if (
                delivery.observation_acconier &&
                delivery.observation_acconier.trim() !== "" &&
                delivery.observation_acconier !== "-"
              ) {
                const localKey = `obs_${delivery.id}`;
                localStorage.setItem(localKey, delivery.observation_acconier);
                console.log(
                  `💾 [STOCK OBSERVATION] Livraison ${delivery.id}: "${delivery.observation_acconier}" stockée dans localStorage`
                );
              }
            } catch (e) {
              // Ignorer les erreurs de parsing
            }
          });

          // En mode admin, on garde TOUS les dossiers - pas de filtrage restrictif
          console.log(
            `[MODE ADMIN] Affichage de TOUS les dossiers: ${processedDeliveries.length} livraisons`
          );

          console.log(
            `[MODE ADMIN] Filtrage pour l'utilisateur "${targetUser}": ${processedDeliveries.length} livraisons trouvées`
          );

          // Si aucune livraison trouvée, essayer une recherche plus large
          if (processedDeliveries.length === 0) {
            console.log(
              `⚠️ [DEBUG] Aucune livraison trouvée pour "${targetUser}". Tentative de recherche élargie...`
            );

            // Recherche élargie : toutes les livraisons avec des observations ou modifications récentes
            processedDeliveries = data.deliveries.filter((delivery) => {
              // Appliquer la même normalisation que précédemment
              let tcList = [];
              if (delivery.container_numbers_list) {
                try {
                  if (typeof delivery.container_numbers_list === "string") {
                    tcList = JSON.parse(delivery.container_numbers_list);
                  } else if (Array.isArray(delivery.container_numbers_list)) {
                    tcList = delivery.container_numbers_list;
                  }
                  tcList = tcList.filter(Boolean);
                } catch (e) {
                  console.warn("Erreur parsing container_numbers_list:", e);
                  tcList = [];
                }
              }
              if (tcList.length === 0) {
                if (Array.isArray(delivery.container_number)) {
                  tcList = delivery.container_number.filter(Boolean);
                } else if (typeof delivery.container_number === "string") {
                  tcList = delivery.container_number
                    .split(/[,;\s]+/)
                    .filter(Boolean);
                }
              }
              if (
                !delivery.container_statuses ||
                typeof delivery.container_statuses !== "object"
              ) {
                delivery.container_statuses = {};
              }
              tcList.forEach((tc) => {
                if (!delivery.container_statuses[tc]) {
                  delivery.container_statuses[tc] = "attente_paiement";
                }
              });
              if (
                delivery.bl_statuses &&
                typeof delivery.bl_statuses === "string"
              ) {
                try {
                  delivery.bl_statuses = JSON.parse(delivery.bl_statuses);
                } catch {
                  delivery.bl_statuses = {};
                }
              }
              if (
                !delivery.bl_statuses ||
                typeof delivery.bl_statuses !== "object"
              ) {
                delivery.bl_statuses = {};
              }

              // Recherche élargie : livraisons avec observations ou activité récente
              let hasUserActivity = false;

              // 1. Vérifier les observations stockées localement
              try {
                const observationKey = `observation_${delivery.id}`;
                const storedObservation = localStorage.getItem(observationKey);
                if (storedObservation && storedObservation.trim() !== "") {
                  hasUserActivity = true;
                  console.log(
                    `📝 [RECHERCHE ÉLARGIE] Observation locale trouvée pour ${delivery.id}:`,
                    storedObservation
                  );
                }
              } catch (e) {}

              // 2. Vérifier les observations en base de données
              if (
                delivery.observation_acconier &&
                delivery.observation_acconier.trim() !== ""
              ) {
                hasUserActivity = true;
                console.log(
                  `📝 [RECHERCHE ÉLARGIE] Observation BD trouvée pour ${delivery.id}:`,
                  delivery.observation_acconier
                );
              }

              // 3. Vérifier l'activité récente (livraisons modifiées dans les 7 derniers jours)
              if (delivery.updated_at) {
                const updatedDate = new Date(delivery.updated_at);
                const now = new Date();
                const daysDiff = (now - updatedDate) / (1000 * 60 * 60 * 24);
                if (daysDiff <= 7) {
                  hasUserActivity = true;
                  console.log(
                    `⏰ [RECHERCHE ÉLARGIE] Activité récente pour ${
                      delivery.id
                    } (${daysDiff.toFixed(1)} jours)`
                  );
                }
              }

              // 4. Recherche dans tous les champs texte pour des traces d'activité
              const allTextFields = [
                delivery.employee_name,
                delivery.client_name,
                delivery.delivery_notes,
                delivery.observation_acconier,
                delivery.status,
                delivery.container_status,
                delivery.transporter,
                delivery.driver_name,
              ].filter(Boolean);

              const hasTextActivity = allTextFields.some((field) => {
                const fieldStr = field.toString().toLowerCase();
                return (
                  fieldStr.includes(targetUser.toLowerCase()) ||
                  fieldStr.includes("observation") ||
                  fieldStr.includes("modifié") ||
                  fieldStr.includes("mis à jour")
                );
              });

              if (hasTextActivity) {
                hasUserActivity = true;
                console.log(
                  `📝 [RECHERCHE ÉLARGIE] Activité textuelle trouvée pour ${delivery.id}`
                );
              }

              return hasUserActivity;
            });

            console.log(
              `📊 [RECHERCHE ÉLARGIE] ${processedDeliveries.length} livraisons trouvées avec activité ou observations`
            );

            // Si toujours aucune livraison, afficher les plus récentes pour debug
            if (processedDeliveries.length === 0) {
              console.log(
                `🔍 [DEBUG FINAL] Affichage des 10 livraisons les plus récentes pour debug`
              );
              processedDeliveries = data.deliveries
                .sort(
                  (a, b) =>
                    new Date(b.created_at || b.delivery_date) -
                    new Date(a.created_at || a.delivery_date)
                )
                .slice(0, 10)
                .map((delivery) => {
                  // Normaliser pour l'affichage
                  let tcList = [];
                  if (delivery.container_numbers_list) {
                    try {
                      if (typeof delivery.container_numbers_list === "string") {
                        tcList = JSON.parse(delivery.container_numbers_list);
                      } else if (
                        Array.isArray(delivery.container_numbers_list)
                      ) {
                        tcList = delivery.container_numbers_list;
                      }
                      tcList = tcList.filter(Boolean);
                    } catch (e) {
                      tcList = [];
                    }
                  }
                  if (tcList.length === 0) {
                    if (Array.isArray(delivery.container_number)) {
                      tcList = delivery.container_number.filter(Boolean);
                    } else if (typeof delivery.container_number === "string") {
                      tcList = delivery.container_number
                        .split(/[,;\s]+/)
                        .filter(Boolean);
                    }
                  }
                  if (
                    !delivery.container_statuses ||
                    typeof delivery.container_statuses !== "object"
                  ) {
                    delivery.container_statuses = {};
                  }
                  tcList.forEach((tc) => {
                    if (!delivery.container_statuses[tc]) {
                      delivery.container_statuses[tc] = "attente_paiement";
                    }
                  });
                  if (
                    delivery.bl_statuses &&
                    typeof delivery.bl_statuses === "string"
                  ) {
                    try {
                      delivery.bl_statuses = JSON.parse(delivery.bl_statuses);
                    } catch {
                      delivery.bl_statuses = {};
                    }
                  }
                  if (
                    !delivery.bl_statuses ||
                    typeof delivery.bl_statuses !== "object"
                  ) {
                    delivery.bl_statuses = {};
                  }
                  return delivery;
                });
            }
          }
        }

        allDeliveries = processedDeliveries;
        // Synchronisation avec la variable globale utilisée dans renderAgentTableFull
        window.allDeliveries = allDeliveries;
      } else {
        // En cas de données vides, ne vider que si c'est le premier chargement
        if (!window.allDeliveries || window.allDeliveries.length === 0) {
          allDeliveries = [];
          window.allDeliveries = [];
        }
      }
    } catch (e) {
      console.error("Erreur lors du chargement des livraisons :", e);
      // Ne pas vider les données existantes en cas d'erreur de réseau temporaire
      if (!window.allDeliveries || window.allDeliveries.length === 0) {
        allDeliveries = [];
        window.allDeliveries = [];
      } else {
        console.log(
          "⚠️ Conservation des données existantes après erreur de chargement"
        );
      }
    }
  }

  // Filtre les livraisons selon une plage de dates (inclusif)
  function filterDeliveriesByDateRange(dateStartStr, dateEndStr) {
    // Toujours utiliser window.allDeliveries comme source unique
    const deliveriesSource = window.allDeliveries || [];
    console.log(
      "[DEBUG] filterDeliveriesByDateRange source:",
      deliveriesSource
    );
    if (!dateStartStr && !dateEndStr) {
      console.log(
        "[DEBUG] Pas de filtre date, retourne toutes les livraisons:",
        deliveriesSource
      );
      return deliveriesSource;
    }
    // Conversion en Date objets à minuit
    let start = dateStartStr ? new Date(dateStartStr) : null;
    let end = dateEndStr ? new Date(dateEndStr) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    return deliveriesSource.filter((delivery) => {
      let dDate =
        delivery["delivery_date"] ||
        delivery["created_at"] ||
        delivery["Date"] ||
        delivery["Date Livraison"];
      if (!dDate) return false;
      let normalized = "";
      if (typeof dDate === "string") {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dDate)) {
          const [j, m, a] = dDate.split("/");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dDate)) {
          normalized = dDate;
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(dDate)) {
          const [j, m, a] = dDate.split("-");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else {
          const dateObj = new Date(dDate);
          if (!isNaN(dateObj)) {
            normalized = dateObj.toISOString().split("T")[0];
          } else {
            normalized = dDate;
          }
        }
      } else if (dDate instanceof Date) {
        normalized = dDate.toISOString().split("T")[0];
      } else {
        normalized = String(dDate);
      }
      // Comparaison dans la plage
      let dateObj = new Date(normalized);
      if (isNaN(dateObj)) return false;
      if (start && dateObj < start) return false;
      if (end && dateObj > end) return false;
      return true;
    });
  }

  // Affiche les livraisons filtrées dans le tableau
  function renderTable(deliveries) {
    tableBody.innerHTML = "";
    if (deliveries.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = AGENT_TABLE_COLUMNS.length;
      cell.textContent = "Aucune opération à cette date";
      cell.className = "text-center text-muted";
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }
    deliveries.forEach((delivery) => {
      const row = document.createElement("tr");
      AGENT_TABLE_COLUMNS.forEach((col) => {
        const cell = document.createElement("td");
        let value = "-";
        if (col.id === "date_display") {
          // Correction : Toujours afficher la date d'échange BL si elle existe, sinon prendre la date de la colonne 'Date'
          let dDate =
            delivery.date_echange_bl ||
            delivery.delivery_date ||
            delivery.created_at;
          if (!dDate && delivery.date) {
            dDate = delivery.date;
          }
          if (dDate) {
            if (
              typeof dDate === "string" &&
              /^\d{2}\/\d{2}\/\d{4}$/.test(dDate)
            ) {
              value = dDate;
            } else {
              let dateObj = new Date(dDate);
              if (!isNaN(dateObj.getTime())) {
                value = dateObj.toLocaleDateString("fr-FR");
              } else if (typeof dDate === "string") {
                value = dDate;
              }
            }
          } else {
            value = "";
          }
        } else {
          value = delivery[col.id] !== undefined ? delivery[col.id] : "-";
        }
        cell.textContent = value;
        row.appendChild(cell);
      });
      tableBody.appendChild(row);
    });
  }

  // Fonction pour charger les observations d'un utilisateur en mode admin
  async function loadUserObservations(targetUser, targetUserId) {
    if (!targetUser) return;

    try {
      console.log(
        `📝 [OBSERVATIONS] Chargement des observations pour l'utilisateur: ${targetUser}`
      );

      // Appel API pour récupérer les observations de l'utilisateur
      const response = await fetch(
        `/api/user-observations?user=${encodeURIComponent(
          targetUser
        )}&userId=${encodeURIComponent(targetUserId || "")}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.observations) {
          console.log(
            `📝 [OBSERVATIONS] ${data.observations.length} observations trouvées pour ${targetUser}`
          );

          // Mettre à jour le localStorage avec les observations de l'utilisateur
          data.observations.forEach((obs) => {
            if (
              obs.delivery_id &&
              obs.observation &&
              obs.observation.trim() !== ""
            ) {
              const keys = [
                `obs_${obs.delivery_id}`,
                `observation_${obs.delivery_id}`,
                `observationAcconier_${obs.delivery_id}`,
              ];

              // Utiliser la clé standard
              const mainKey = `obs_${obs.delivery_id}`;
              localStorage.setItem(mainKey, obs.observation);

              console.log(
                `📝 [OBSERVATIONS] Observation chargée pour livraison ${obs.delivery_id}:`,
                obs.observation
              );
            }
          });

          // 🔧 Forcer le re-rendu du tableau en mode admin après chargement des observations
          setTimeout(() => refreshTableInAdminMode(), 100);

          return data.observations;
        }
      } else if (response.status === 404) {
        console.log(`📝 [OBSERVATIONS] API non disponible pour le moment`);
      } else {
        console.warn(`⚠️ [OBSERVATIONS] Erreur API: ${response.status}`);
      }
    } catch (error) {
      // En cas d'erreur réseau ou API non disponible, essayer une approche locale
      console.warn(
        `⚠️ [OBSERVATIONS] API non disponible, recherche locale:`,
        error.message
      );

      // Recherche dans le localStorage pour toutes les observations existantes
      try {
        let localObservations = [];
        const targetUserLower = targetUser.toLowerCase();

        // Parcourir toutes les clés du localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith("obs_") || key.startsWith("observation_"))
          ) {
            const value = localStorage.getItem(key);
            if (value && value.trim() !== "") {
              localObservations.push({
                key: key,
                value: value,
                deliveryId: key.replace(/^(obs_|observation_)/, ""),
              });
            }
          }
        }

        console.log(
          `📝 [OBSERVATIONS LOCAL] ${localObservations.length} observations trouvées dans le localStorage`
        );

        // 🔧 Forcer le re-rendu du tableau en mode admin après chargement des observations
        setTimeout(() => refreshTableInAdminMode(), 100);

        return localObservations;
      } catch (localError) {
        console.warn(`⚠️ [OBSERVATIONS] Erreur recherche locale:`, localError);
      }
    }

    return [];
  }

  // 🔧 Fonction utilitaire pour forcer le re-rendu du tableau en mode admin
  function refreshTableInAdminMode() {
    const isAdminMode =
      new URLSearchParams(window.location.search).get("mode") === "admin";
    if (
      isAdminMode &&
      window.allDeliveries &&
      window.allDeliveries.length > 0
    ) {
      const tableBody = document.getElementById("deliveriesTableBody");
      if (tableBody) {
        console.log(
          `📝 [ADMIN MODE] Re-rendu du tableau avec ${window.allDeliveries.length} livraisons`
        );
        renderAgentTableFull(window.allDeliveries, tableBody);
      }
    }
  }

  // Fonction principale pour charger et afficher selon la plage de dates
  function updateTableForDateRange(dateStartStr, dateEndStr) {
    // Vérification automatique : si la date de début est après la date de fin, on corrige
    if (dateStartStr && dateEndStr && dateStartStr > dateEndStr) {
      // On inverse les dates
      const tmp = dateStartStr;
      dateStartStr = dateEndStr;
      dateEndStr = tmp;
      // On met à jour les champs dans l'UI
      const dateStartInput = document.getElementById(
        "mainTableDateStartFilter"
      );
      const dateEndInput = document.getElementById("mainTableDateEndFilter");
      if (dateStartInput) dateStartInput.value = dateStartStr;
      if (dateEndInput) dateEndInput.value = dateEndStr;
    }
    let filtered = filterDeliveriesByDateRange(dateStartStr, dateEndStr);
    console.log(
      "[DEBUG] updateTableForDateRange - livraisons filtrées:",
      filtered
    );
    // Tri du plus ancien au plus récent (ordre croissant)--
    filtered.sort((a, b) => {
      let dateA = new Date(
        a.delivery_date || a.created_at || a.Date || a["Date Livraison"]
      );
      let dateB = new Date(
        b.delivery_date || b.created_at || b.Date || b["Date Livraison"]
      );
      return dateA - dateB;
    });
    renderAgentTableFull(filtered, tableBody);
  }

  // Initialisation : charge toutes les livraisons puis affiche la plage de dates (par défaut : 7 jours avant aujourd'hui jusqu'à aujourd'hui)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  if (dateStartInput && dateEndInput) {
    // On charge toutes les livraisons puis on détermine la date la plus ancienne
    loadAllDeliveries().then(() => {
      // Chercher la date la plus ancienne dans toutes les livraisons
      let minDate = null;
      (window.allDeliveries || []).forEach((d) => {
        let dDate = d.delivery_date || d.created_at;
        if (dDate) {
          let dateObj = new Date(dDate);
          if (!isNaN(dateObj.getTime())) {
            if (!minDate || dateObj < minDate) minDate = dateObj;
          }
        }
      });
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      let minDateStr = minDate ? minDate.toISOString().split("T")[0] : todayStr;
      dateStartInput.value = minDateStr;
      dateEndInput.value = todayStr;
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);

      // ===== RAFRAÎCHISSEMENT AUTOMATIQUE EN MODE ADMIN =====
      const isAdminMode = getUrlParameter("mode") === "admin";
      const targetUser = getUrlParameter("targetUser");

      if (isAdminMode && targetUser) {
        console.log(
          `🔄 [MODE ADMIN] Rafraîchissement automatique activé pour l'utilisateur: ${decodeURIComponent(
            targetUser
          )}`
        );

        // Rafraîchir les données toutes les 5 secondes en mode admin
        setInterval(async () => {
          try {
            console.log(
              `🔄 [AUTO-REFRESH] Rechargement des données pour ${decodeURIComponent(
                targetUser
              )}`
            );

            // Sauvegarder l'état actuel du tableau pour éviter qu'il disparaisse
            const currentData = window.allDeliveries
              ? [...window.allDeliveries]
              : [];

            await loadAllDeliveries();

            // Ne mettre à jour le tableau que si nous avons effectivement des données
            if (window.allDeliveries && window.allDeliveries.length > 0) {
              updateTableForDateRange(dateStartInput.value, dateEndInput.value);
            } else if (currentData.length > 0) {
              // Si le chargement échoue, restaurer les données précédentes
              window.allDeliveries = currentData;
              console.log(
                `⚠️ [AUTO-REFRESH] Données restaurées après échec du chargement`
              );
            }

            // Afficher une petite notification discrète
            const refreshIndicator =
              document.getElementById("refresh-indicator");
            if (refreshIndicator) {
              refreshIndicator.style.opacity = "1";
              setTimeout(() => {
                refreshIndicator.style.opacity = "0";
              }, 1000);
            }
          } catch (error) {
            console.error(
              "Erreur lors du rafraîchissement automatique:",
              error
            );
          }
        }, 10000); // 10 secondes pour éviter la surcharge

        // Créer un indicateur de rafraîchissement
        const refreshIndicator = document.createElement("div");
        refreshIndicator.id = "refresh-indicator";
        refreshIndicator.innerHTML = "🔄 Synchronisation en cours...";
        refreshIndicator.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          z-index: 10000;
          opacity: 0;
          transition: opacity 0.3s ease;
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        `;
        document.body.appendChild(refreshIndicator);
      }

      // Après chargement, détecter les dossiers en retard (>2 jours) mais uniquement ceux qui ne sont PAS en livraison
      function getLateDeliveries() {
        const now = new Date();
        const allDeliveries = window.allDeliveries || [];

        console.log(
          "[LATE DELIVERIES DEBUG] Nombre total de livraisons:",
          allDeliveries.length
        );

        // Appliquer le même filtrage que le tableau principal
        const lateDeliveries = allDeliveries.filter((d) => {
          let dDate = d.delivery_date || d.created_at;
          if (!dDate) return false;
          let dateObj = new Date(dDate);
          if (isNaN(dateObj.getTime())) return false;
          const diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
          if (diffDays <= 2) return false;
          // Même logique que renderAgentTableFull :
          // Affiche TOUS les dossiers dont le statut shjacconier est 'en attente de paiement'
          if (d.delivery_status_acconier === "en attente de paiement") {
            return true;
          }
          // Sinon, on garde l'ancien filtrage BL
          let blList = [];
          if (Array.isArray(d.bl_number)) {
            blList = d.bl_number.filter(Boolean);
          } else if (typeof d.bl_number === "string") {
            blList = d.bl_number.split(/[,;\s]+/).filter(Boolean);
          }
          let blStatuses = blList.map((bl) =>
            d.bl_statuses && d.bl_statuses[bl] ? d.bl_statuses[bl] : "aucun"
          );
          // Si tous les BL sont en 'mise_en_livraison', on ne l'affiche pas
          if (
            blStatuses.length > 0 &&
            blStatuses.every((s) => s === "mise_en_livraison")
          ) {
            return false;
          }
          // Exclure aussi si statut acconier est 'mise_en_livraison_acconier'
          if (d.delivery_status_acconier === "mise_en_livraison_acconier") {
            return false;
          }
          return true;
        });

        console.log(
          "[LATE DELIVERIES DEBUG] Dossiers en retard trouvés:",
          lateDeliveries.length
        );
        return lateDeliveries;
      }
      showLateDeliveriesToast(getLateDeliveries());
      // Vérification plus fréquente toutes les 10 secondes pour mise à jour en temps réel
      setInterval(() => {
        showLateDeliveriesToast(getLateDeliveries());
      }, 10000);

      // Met à jour la liste des dossiers en retard à chaque changement de statut livraison
      document.addEventListener("bl_status_update", function () {
        showLateDeliveriesToast(getLateDeliveries());
      });
    });
    dateStartInput.addEventListener("change", () => {
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);
    });
    dateEndInput.addEventListener("change", () => {
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);
    });
  }
});
// Colonnes strictes pour Agent Acconiershv
const AGENT_TABLE_COLUMNS = [
  { id: "select_row", label: "" }, // Colonne pour la sélection
  { id: "row_number", label: "N°" },
  { id: "date_display", label: "Date" },
  { id: "employee_name", label: "Agent" },
  { id: "client_name", label: "Client (Nom)" },
  { id: "client_phone", label: "Client (Tél)" },
  { id: "container_number", label: "Numéro TC(s)" },
  { id: "lieu", label: "Lieu" },
  { id: "container_foot_type", label: "Type Conteneur (pied)" },
  { id: "container_type_and_content", label: "Contenu" },
  { id: "declaration_number", label: "N° Déclaration" },
  { id: "bl_number", label: "N° BL" },
  { id: "dossier_number", label: "N° Dossier" },
  { id: "number_of_containers", label: "Nombre de conteneurs" },
  { id: "shipping_company", label: "Compagnie Maritime" },
  { id: "weight", label: "Poids" },
  { id: "ship_name", label: "Nom du navire" },
  { id: "circuit", label: "Circuit" },
  { id: "transporter_mode", label: "Mode de Transport" },
  { id: "container_status", label: "Statut Dossier " },
  { id: "observation", label: "Observation" },
];

// 🎨 FONCTION POUR METTRE À JOUR LES STYLES DES OBSERVATIONS SELON LE THÈME
function updateObservationCellsTheme() {
  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";
  const observationCells = document.querySelectorAll(".observation-col");

  observationCells.forEach((cell) => {
    if (isDarkMode) {
      cell.style.backgroundColor = "#fbbf24"; // Jaune pour mode sombre
      cell.style.color = "#1e293b"; // Texte sombre pour contraste
    } else {
      cell.style.backgroundColor = ""; // Retour au style par défaut
      cell.style.color = "";
    }
  });
}

// 🎨 ÉCOUTER LES CHANGEMENTS DE THÈME
const themeObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (
      mutation.type === "attributes" &&
      mutation.attributeName === "data-theme"
    ) {
      updateObservationCellsTheme();
    }
  });
});

// Observer les changements sur l'élément html
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

// --- SYSTÈME D'ÉDITION DU TABLEAU ---
let isTableEditMode = false; // État global du mode édition
let editedCellsData = {}; // Stockage des données modifiées {deliveryId: {columnId: value}}

// Colonnes modifiables selon la demande de l'utilisateur
const EDITABLE_COLUMNS = [
  "date_display",
  "employee_name",
  "client_name",
  "client_phone",
  "lieu",
  "container_number",
  "container_foot_type",
  "container_type_and_content",
  "declaration_number",
  "bl_number",
  "dossier_number",
  "number_of_containers",
  "shipping_company",
  "weight",
  "ship_name",
  "circuit",
  "transporter_mode",
];

// Fonction pour charger les données modifiées depuis localStorage
function loadEditedData() {
  try {
    const saved = localStorage.getItem("table_edited_data_resp_acconier");
    if (saved) {
      editedCellsData = JSON.parse(saved);
    }
  } catch (error) {
    console.warn("Erreur lors du chargement des données éditées:", error);
    editedCellsData = {};
  }
}

// Fonction pour sauvegarder les données modifiées dans localStorage
function saveEditedData() {
  try {
    localStorage.setItem(
      "table_edited_data_resp_acconier",
      JSON.stringify(editedCellsData)
    );
  } catch (error) {
    console.warn("Erreur lors de la sauvegarde des données éditées:", error);
  }
}

// Fonction pour obtenir la valeur d'une cellule (priorité aux données éditées)
function getCellValue(delivery, columnId) {
  if (
    editedCellsData[delivery.id] &&
    editedCellsData[delivery.id][columnId] !== undefined
  ) {
    return editedCellsData[delivery.id][columnId];
  }
  return delivery[columnId] !== undefined ? delivery[columnId] : "-";
}

// Fonction pour sauvegarder une valeur de cellule modifiée
function saveCellValue(deliveryId, columnId, value) {
  if (!editedCellsData[deliveryId]) {
    editedCellsData[deliveryId] = {};
  }
  editedCellsData[deliveryId][columnId] = value;
  saveEditedData();

  // Envoyer au serveur pour synchronisation
  syncCellToServer(deliveryId, columnId, value);
}

// Fonction pour synchroniser avec le serveur
async function syncCellToServer(deliveryId, columnId, value) {
  try {
    if (columnId === "employee_name") {
      await fetch(`/deliveries/${deliveryId}/agent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_name: value }),
      });
    } else {
      await fetch(`/deliveries/${deliveryId}/cell-update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [columnId]: value }),
      });
    }
  } catch (error) {
    console.warn(`Erreur lors de la synchronisation de $  {columnId}:`, error);
  }
}

// Fonction pour créer et afficher le bouton Modifier
function createEditModeButton() {
  // Vérifier si le bouton existe déjà
  let existingBtn = document.getElementById("tableEditModeBtn");
  if (existingBtn) return;

  // Chercher la zone de recherche ou le conteneur des champs de date
  const searchInput = document.getElementById("searchInput");
  const dateStartInput = document.getElementById("mainTableDateStartFilter");

  // Déterminer le point d'insertion
  let insertionPoint = null;
  let parentContainer = null;

  if (searchInput) {
    // Si la zone de recherche existe, insérer avant
    insertionPoint = searchInput.parentNode;
    parentContainer = insertionPoint.parentNode;
  } else if (dateStartInput) {
    // Sinon, insérer après le conteneur des dates
    insertionPoint = dateStartInput.parentNode.nextSibling;
    parentContainer = dateStartInput.parentNode.parentNode;
  } else {
    // Fallback : chercher le tableau
    const table = document.getElementById("deliveriesTable");
    if (!table) return;
    insertionPoint = table;
    parentContainer = table.parentNode;
  }

  // Créer le conteneur pour le bouton
  const buttonContainer = document.createElement("div");
  buttonContainer.style.marginBottom = "10px";
  buttonContainer.style.marginTop = "8px";
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "flex-end";
  buttonContainer.style.alignItems = "center";
  buttonContainer.style.gap = "8px";

  // Créer le bouton1
  const editBtn = document.createElement("button");
  editBtn.id = "tableEditModeBtn";
  editBtn.innerHTML = '<i class="fas fa-edit"></i> Modifier';
  editBtn.style.background = "linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)"; // rouge vif à foncé
  editBtn.style.color = "#fff";
  editBtn.style.border = "none";
  editBtn.style.borderRadius = "6px";
  editBtn.style.padding = "6px 12px";
  editBtn.style.fontSize = "0.85rem";
  editBtn.style.fontWeight = "600";
  editBtn.style.cursor = "pointer";
  editBtn.style.boxShadow = "0 1px 4px rgba(37,99,235,0.15)";
  editBtn.style.transition = "all 0.3s ease";

  // Indicateur de mode
  const modeIndicator = document.createElement("span");
  modeIndicator.id = "editModeIndicator";
  modeIndicator.style.fontSize = "0.8rem";
  modeIndicator.style.fontWeight = "500";
  modeIndicator.style.color = "#64748b";
  updateModeIndicator(modeIndicator);

  // Gestionnaire d'événement
  editBtn.onclick = function () {
    toggleEditMode(editBtn, modeIndicator);
  };

  buttonContainer.appendChild(modeIndicator);
  buttonContainer.appendChild(editBtn);

  // Insérer le bouton au bon endroit
  if (insertionPoint && parentContainer) {
    parentContainer.insertBefore(buttonContainer, insertionPoint);
  }
}

// Fonction pour mettre à jour l'indicateur de mode
function updateModeIndicator(indicator) {
  if (isTableEditMode) {
    indicator.textContent =
      "✏️ Mode édition activé - Cliquez sur les cellules pour les modifier";
    indicator.style.color = "#16a34a";
  } else {
    indicator.textContent = "🔒 Mode lecture seule";
    indicator.style.color = "#64748b";
  }
}

// Fonction pour basculer le mode d'édition
function toggleEditMode(button, indicator) {
  isTableEditMode = !isTableEditMode;

  if (isTableEditMode) {
    button.innerHTML = '<i class="fas fa-lock"></i> Verrouiller';
    button.style.background =
      "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)";
  } else {
    button.innerHTML = '<i class="fas fa-edit"></i> Modifier';
    button.style.background =
      "linear-gradient(90deg, #2563eb 0%, #1e293b 100%)";
  }

  updateModeIndicator(indicator);
  updateTableEditMode();
}

// Fonction pour mettre à jour l'état d'édition de toutes les cellules
function updateTableEditMode() {
  const table = document.getElementById("deliveriesTable");
  if (!table) return;

  const cells = table.querySelectorAll("td[data-editable]");
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  cells.forEach((cell) => {
    if (isTableEditMode) {
      cell.style.cursor = "pointer";
      cell.style.backgroundColor = isDark ? "#232f43" : "#f8fafc";
      cell.style.color = isDark ? "#fff" : "";
      cell.title = "Cliquez pour modifier";
      cell.classList.add("editable-cell");
    } else {
      cell.style.cursor = "default";
      cell.style.backgroundColor = "";
      cell.style.color = "";
      cell.title = "";
      cell.classList.remove("editable-cell");
    }
  });
}

// Fonction pour créer un input d'édition selon le type de colonne
function createEditInput(columnId, currentValue) {
  let input;

  if (columnId === "container_type_and_content" || columnId === "observation") {
    input = document.createElement("textarea");
    input.style.minHeight = "60px";
    input.style.resize = "vertical";
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    input.style.backgroundColor = isDark ? "#0e274e" : "#fff";
    // Couleur du texte : noir pendantzsudh la saidbhjsie, blanc après en mode sombre
    if (isDark) {
      input.style.color = "#fff";
      input.style.backgroundColor = "#0e274e";
      input.addEventListener("focus", function () {
        this.style.color = "#fff";
        this.style.backgroundColor = "#0e274e";
      });
      input.addEventListener("input", function () {
        if (document.activeElement === this) {
          this.style.color = "#fff";
          this.style.backgroundColor = "#0e274e";
        }
      });
      input.addEventListener("blur", function () {
        this.style.color = "#fff";
        this.style.backgroundColor = "#0e274e";
      });
    } else {
      input.style.color = "#111";
    }
  } else if (columnId === "circuit") {
    input = document.createElement("select");
    const options = ["", "VAD", "VAQ", "BAE", "SCANNER"];
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt || "Sélectionner...";
      if (opt === currentValue) option.selected = true;
      input.appendChild(option);
    });
  } else if (columnId === "transporter_mode") {
    input = document.createElement("select");
    const options = ["", "REMORQUE", "AUTO-CHARGEUSE"];
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt || "Sélectionner...";
      if (opt === currentValue) option.selected = true;
      // Synchronisation du nom d'agent avec le backend
      if (col.id === "employee_name" && window.allDeliveries) {
        const idx = window.allDeliveries.findIndex((d) => d.id === delivery.id);
        if (idx !== -1) {
          window.allDeliveries[idx].employee_name = newValue;
          // Envoi au backend
          fetch(`/deliveries/${delivery.id}/agent`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ employee_name: newValue }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                // Optionnel : feedback visuel ou console
                // On peut aussi recharger la ligne depuis le backend si besoin
              } else {
                alert(
                  "Erreur lors de la sauvegarde du nom d'agent côté serveur : " +
                    (data.message || "")
                );
              }
            })
            .catch((err) => {
              alert("Erreur réseau lors de la sauvegarde du nom d'agent");
            });
        }
      }
      input.appendChild(option);
    });
  } else if (columnId === "client_phone") {
    input = document.createElement("input");
    input.type = "tel";
  } else if (columnId === "weight" || columnId === "number_of_containers") {
    input = document.createElement("input");
    input.type = "number";
    input.min = "0";
  } else if (columnId === "date_display") {
    input = document.createElement("input");
    input.type = "date";
  } else {
    input = document.createElement("input");
    input.type = "text";
  }

  // Configuration commune de l'input
  if (input.tagName !== "SELECT") {
    input.value = currentValue;
  }
  input.style.width = "100%";
  input.style.border = "2px solid #2563eb";
  input.style.borderRadius = "4px";
  input.style.padding = "6px 8px";
  input.style.fontSize = "0.9rem";
  input.style.fontFamily = "inherit";
  // Pour tous les inputs sauf textarea déjà stylé ci-dessus
  if (
    !(columnId === "container_type_and_content" || columnId === "observation")
  ) {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    input.style.backgroundColor = isDark ? "#232f43" : "#fff";
    input.style.color = isDark ? "#fff" : "#222";
  }

  return input;
}

// Fonction pour générer les lignes du tableau Agent Acconier
function renderAgentTableRows(deliveries, tableBodyElement) {
  // Tri des livraisons par date (ancienne en haut, récente en bas)
  deliveries.sort((a, b) => {
    let dateA = a.delivery_date || a.created_at;
    let dateB = b.delivery_date || b.created_at;
    // Si la date est au format JJ/MM/AAAA, la convertir en Date
    if (dateA && /^\d{2}\/\d{2}\/\d{4}$/.test(dateA)) {
      const [d, m, y] = dateA.split("/");
      dateA = `${y}-${m}-${d}`;
    }
    if (dateB && /^\d{2}\/\d{2}\/\d{4}$/.test(dateB)) {
      const [d, m, y] = dateB.split("/");
      dateB = `${y}-${m}-${d}`;
    }
    return new Date(dateA) - new Date(dateB);
  });
  tableBodyElement.innerHTML = "";
  deliveries.forEach((delivery, i) => {
    const tr = document.createElement("tr");
    // Détermination de la couleur de l'avatar selon l'ancienneté
    let dDate = delivery.delivery_date || delivery.created_at;
    let dateObj = dDate ? new Date(dDate) : null;
    let now = new Date();
    let avatarColor = "#2563eb"; // bleu par défaut (récent)
    let avatarBg = "linear-gradient(135deg, #2563eb 60%, #1e293b 100%)";
    let badgeColor = "#2563eb";
    if (dateObj && !isNaN(dateObj.getTime())) {
      let diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
      if (diffDays >= 30) {
        avatarColor = "#a3a3a3"; // gris
        avatarBg = "linear-gradient(135deg, #a3a3a3 60%, #6b7280 100%)";
        badgeColor = "#a3a3a3";
      } else if (diffDays >= 7) {
        avatarColor = "#eab308"; // jaune
        avatarBg = "linear-gradient(135deg, #eab308 60%, #facc15 100%)";
        badgeColor = "#eab308";
      } else if (diffDays >= 0) {
        avatarColor = "#2563eb"; // bleu
        avatarBg = "linear-gradient(135deg, #2563eb 60%, #1e293b 100%)";
        badgeColor = "#2563eb";
      }
    }
    AGENT_TABLE_COLUMNS.forEach((col, idx) => {
      const td = document.createElement("td");
      let value = "-";
      if (col.id === "select_row") {
        // Ajout d'une case à cocher pour la sélection
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "select-row-checkbox";
        checkbox.setAttribute("data-id", delivery.id);
        td.appendChild(checkbox);
        td.style.textAlign = "center";
      } else if (col.id === "row_number") {
        value = i + 1;
        // Avatar stylisé moderne avec initiales et couleur dynamique
        const avatar = document.createElement("div");
        avatar.style.display = "flex";
        avatar.style.alignItems = "center";
        avatar.style.justifyContent = "center";
        avatar.style.width = window.innerWidth <= 600 ? "28px" : "38px";
        avatar.style.height = window.innerWidth <= 600 ? "28px" : "38px";
        avatar.style.borderRadius = "50%";
        avatar.style.background = avatarBg;
        avatar.style.boxShadow =
          "0 2px 12px rgba(37,99,235,0.13), 0 1.5px 8px rgba(30,41,59,0.10)";
        avatar.style.position = "relative";
        avatar.style.margin = "0 auto";
        // Initiales de l'agent ou numéro
        let initials = "-";
        if (
          delivery.employee_name &&
          typeof delivery.employee_name === "string"
        ) {
          const parts = delivery.employee_name.trim().split(/\s+/);
          if (parts.length === 1) {
            initials = parts[0].charAt(0).toUpperCase();
          } else if (parts.length > 1) {
            initials =
              parts[0].charAt(0).toUpperCase() +
              parts[1].charAt(0).toUpperCase();
          }
        } else {
          initials = value;
        }
        const initialsSpan = document.createElement("span");
        initialsSpan.textContent = initials;
        initialsSpan.style.color = "#fff";
        initialsSpan.style.fontWeight = "bold";
        initialsSpan.style.fontSize =
          window.innerWidth <= 600 ? "1em" : "1.15em";
        initialsSpan.style.letterSpacing = "0.5px";
        avatar.appendChild(initialsSpan);
        // Effet de halo
        avatar.style.boxShadow += ", 0 0 0 6px #e0e7ef33";
        // Badge numéro (optionnel, petit rond blanc en bas à droite)
        const badge = document.createElement("span");
        badge.textContent = value;
        badge.style.position = "absolute";
        badge.style.bottom = "-5px";
        badge.style.right = "-5px";
        badge.style.background = "#fff";
        badge.style.color = badgeColor;
        badge.style.fontWeight = "bold";
        badge.style.fontSize = window.innerWidth <= 600 ? "0.8em" : "0.95em";
        badge.style.borderRadius = "50%";
        badge.style.padding = window.innerWidth <= 600 ? "1px 5px" : "2px 7px";
        badge.style.boxShadow = "0 1px 4px rgba(30,41,59,0.13)";
        badge.style.border = "2px solid #f1f5f9";
        avatar.appendChild(badge);
        td.appendChild(avatar);
        td.classList.add("row-number-col");
      } else if (col.id === "date_display") {
        let dDate = delivery.delivery_date || delivery.created_at;
        if (dDate) {
          let dateObj = new Date(dDate);
          if (!isNaN(dateObj.getTime())) {
            value = dateObj.toLocaleDateString("fr-FR");
          } else if (typeof dDate === "string") {
            value = dDate;
          }
        }

        // Utiliser la valeur éditée si disponible
        let cellValue = getCellValue(delivery, col.id);
        if (col.id === "date_display" && cellValue !== "-") {
          // Si la valeur est au format AAAA-MM-JJ, on la reformate en JJ/MM/AAAA
          if (/^\d{4}-\d{2}-\d{2}$/.test(cellValue)) {
            const [y, m, d] = cellValue.split("-");
            value = `${d}/${m}/${y}`;
          } else {
            value = cellValue;
          }
        } else if (cellValue !== "-") {
          value = cellValue;
        }

        // Liste des colonnes à convertir en MAJUSCULES
        const upperCaseColumns = [
          "employee_name",
          "client_name",
          "client_phone",
          "container_number",
          "lieu",
          "container_foot_type",
          "container_type_and_content",
          "declaration_number",
          "bl_number",
          "dossier_number",
          "number_of_containers",
          "shipping_company",
          "weight",
          "ship_name",
          "circuit",
          "transporter_mode",
          "container_status",
          "observation",
        ];

        // Appliquer la transformation en majuscules si la colonne est dans la liste
        if (
          upperCaseColumns.includes(col.id) &&
          value &&
          value !== "-" &&
          typeof value === "string"
        ) {
          td.textContent = value.toUpperCase();
        } else {
          td.textContent = value;
        }

        // Système d'édition pour les colonnes modifiables
        if (EDITABLE_COLUMNS.includes(col.id)) {
          td.setAttribute("data-editable", "true");
          td.setAttribute("data-delivery-id", delivery.id);
          td.setAttribute("data-column-id", col.id);

          // Appliquer le style selon le mode d'édition
          if (isTableEditMode) {
            td.style.cursor = "pointer";
            td.style.backgroundColor = "#f8fafc";
            td.title = "Cliquez pour modifier";
            td.classList.add("editable-cell");
          }

          // Ajouter l'événement de clic pour l'édition
          td.onclick = function (e) {
            if (!isTableEditMode) return;
            if (td.querySelector("input, textarea, select")) return;

            const currentValue =
              td.textContent.trim() === "-" ? "" : td.textContent.trim();
            const input = createEditInput(col.id, currentValue);

            // Fonction de sauvegarde
            function saveValue() {
              const newValue = input.value.trim();
              saveCellValue(delivery.id, col.id, newValue);
              td.textContent = newValue || "-";
              // Correction : mettre à jour la date dans window.allDeliveries
              if (col.id === "date_display" && window.allDeliveries) {
                const idx = window.allDeliveries.findIndex(
                  (d) => d.id === delivery.id
                );
                if (idx !== -1) {
                  // On met à jour la date dans l'objet global
                  window.allDeliveries[idx].delivery_date = newValue;
                  // Envoi au backend
                  fetch(`/deliveries/${delivery.id}/date`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ date: newValue }),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.success) {
                        // Optionnel : feedback visuel ou console
                        // On peut aussi recharger la ligne depuis le backend si besoin
                      } else {
                        alert(
                          "Erreur lors de la sauvegarde de la date côté serveur : " +
                            (data.message || "")
                        );
                      }
                    })
                    .catch((err) => {
                      alert("Erreur réseau lors de la sauvegarde de la date");
                    });
                }
              }

              // Feedback visuel
              td.style.backgroundColor = "#dcfce7";
              td.style.border = "1px solid #16a34a";
              setTimeout(() => {
                if (isTableEditMode) {
                  td.style.backgroundColor = "#f8fafc";
                } else {
                  td.style.backgroundColor = "";
                }
                td.style.border = "";
              }, 2000);

              // Rafraîchir le tableau pour appliquer le tri sur toutes les données après modification de la date
              if (
                col.id === "date_display" &&
                window.allDeliveries &&
                Array.isArray(window.allDeliveries)
              ) {
                const tableBody = document.getElementById(
                  "deliveriesTableBody"
                );
                // On force le tri sur toutes les données, pas seulement le filtre courant
                renderAgentTableRows([...window.allDeliveries], tableBody);
              }
            }

            // Gestionnaires d'événements
            input.onkeydown = function (ev) {
              if (ev.key === "Enter") {
                ev.preventDefault();
                saveValue();
              } else if (ev.key === "Escape") {
                td.textContent = currentValue || "-";
              }
            };

            input.onblur = function () {
              saveValue();
            };

            // Amélioration : tri et réaffichage dès modification de la date en mode édition
            if (col.id === "date_display") {
              input.addEventListener("change", function () {
                saveValue();
                // Après modification, on trie et on réaffiche le tableau pour replacer la ligne
                setTimeout(() => {
                  if (window.allDeliveries && tableBody) {
                    renderAgentTableRows([...window.allDeliveries], tableBody);
                  }
                }, 100); // petit délai pour laisser le temps à saveValue de finir
              });
            }

            // Remplacer le contenu de la cellule par l'input
            td.textContent = "";
            td.appendChild(input);
            input.focus();

            if (input.setSelectionRange) {
              input.setSelectionRange(0, input.value.length);
            }
          };
        }
      } else if (col.id === "container_number") {
        // TOUJOURS ajouter le gestionnaire onclick pour permettre l'édition
        td.onclick = () => {
          // Vérifier si on est en mode édition ET que la colonne est éditable
          if (!isTableEditMode || !EDITABLE_COLUMNS.includes(col.id)) return;

          // Récupérer la valeur actuelle depuis les données sauvegardées ou originales
          let currentValue = getCellValue(delivery, col.id);

          // Si getCellValue retourne "-", utiliser une chaîne vide pour l'édition
          if (currentValue === "-") {
            currentValue = "";
          }

          // Si c'est un array, le convertir en chaîne avec virgules
          if (Array.isArray(currentValue)) {
            currentValue = currentValue.filter(Boolean).join(", ");
          }

          const input = document.createElement("input");
          input.type = "text";
          input.value = currentValue;
          input.style.width = "100%";
          input.style.border = "2px solid #2563eb";
          input.style.borderRadius = "4px";
          input.style.padding = "6px 8px";
          input.style.fontSize = "0.9rem";
          input.style.fontFamily = "inherit";

          const isDark =
            document.documentElement.getAttribute("data-theme") === "dark";
          input.style.backgroundColor = isDark ? "#232f43" : "#fff";
          input.style.color = isDark ? "#fff" : "#222";

          td.textContent = "";
          td.appendChild(input);

          const saveEdit = () => {
            const newValue = input.value.trim();

            // Sauvegarder la modification avec synchronisation serveur
            saveCellValue(delivery.id, col.id, newValue);

            // Mettre à jour les données de livraison avec la nouvelle valeur
            if (newValue) {
              // Convertir la chaîne en array si elle contient des virgules
              const newTcList = newValue.split(/[,;\s]+/).filter(Boolean);
              delivery.container_number = newTcList;
              delivery.container_numbers_list = newTcList;
            } else {
              delivery.container_number = [];
              delivery.container_numbers_list = [];
            }

            // Vider la cellule et re-rendre avec l'affichage normal (badges/cartes)
            td.innerHTML = "";
            td.classList.remove("tc-multi-cell");

            // Re-exécuter la logique de rendu normal
            let tcList = [];
            if (delivery.container_numbers_list) {
              try {
                if (typeof delivery.container_numbers_list === "string") {
                  tcList = JSON.parse(delivery.container_numbers_list);
                } else if (Array.isArray(delivery.container_numbers_list)) {
                  tcList = delivery.container_numbers_list;
                }
                tcList = tcList.filter(Boolean);
              } catch (e) {
                tcList = [];
              }
            }
            if (
              tcList.length === 0 &&
              Array.isArray(delivery.container_number)
            ) {
              tcList = delivery.container_number.filter(Boolean);
            } else if (
              tcList.length === 0 &&
              typeof delivery.container_number === "string"
            ) {
              tcList = delivery.container_number
                .split(/[,;\s]+/)
                .filter(Boolean);
            }

            // Rendu des badges/cartes
            if (tcList.length > 1) {
              td.classList.add("tc-multi-cell");
              const btn = document.createElement("button");
              btn.className = "tc-tags-btn";
              btn.type = "button";
              btn.setAttribute("data-allow-admin", "true");
              btn.classList.add("admin-allowed-tc");
              btn.innerHTML =
                tcList
                  .slice(0, 2)
                  .map((tc) => `<span class="tc-tag">${tc}</span>`)
                  .join("") +
                (tcList.length > 2
                  ? ` <span class="tc-tag tc-tag-more">+${
                      tcList.length - 2
                    }</span>`
                  : "") +
                ' <i class="fas fa-chevron-down tc-chevron"></i>';
              td.appendChild(btn);
            } else if (tcList.length === 1) {
              const tag = document.createElement("span");
              tag.className = "tc-tag";
              tag.textContent = tcList[0];
              td.appendChild(tag);
            } else {
              td.textContent = "-";
            }
          };

          input.addEventListener("blur", saveEdit);
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              saveEdit();
            } else if (e.key === "Escape") {
              td.textContent = currentValue || "-";
            }
          });

          input.focus();
          if (input.setSelectionRange) {
            input.setSelectionRange(0, input.value.length);
          }
        };

        // Rendu normal : logique existante avec badge/tag et menu déroulant statut
        let tcList = [];

        // Récupérer la valeur éditée s'il y en a une
        const editedValue = getCellValue(delivery, col.id);

        if (editedValue && editedValue !== "-") {
          // Utiliser la valeur éditée
          if (typeof editedValue === "string") {
            tcList = editedValue.split(/[,;\s]+/).filter(Boolean);
          } else if (Array.isArray(editedValue)) {
            tcList = editedValue.filter(Boolean);
          }
        } else {
          // PRIORITÉ 1 : Utiliser les données JSON complètes si disponibles
          if (delivery.container_numbers_list) {
            try {
              if (typeof delivery.container_numbers_list === "string") {
                tcList = JSON.parse(delivery.container_numbers_list);
              } else if (Array.isArray(delivery.container_numbers_list)) {
                tcList = delivery.container_numbers_list;
              }
              tcList = tcList.filter(Boolean); // Supprimer les valeurs vides
            } catch (e) {
              console.warn("Erreur parsing container_numbers_list:", e);
              tcList = [];
            }
          }

          // PRIORITÉ 2 : Si pas de données JSON, utiliser le champ classique
          if (tcList.length === 0) {
            if (Array.isArray(delivery.container_number)) {
              tcList = delivery.container_number.filter(Boolean);
            } else if (typeof delivery.container_number === "string") {
              tcList = delivery.container_number
                .split(/[,;\s]+/)
                .filter(Boolean);
            }
          }
        }
        if (tcList.length > 1) {
          td.classList.add("tc-multi-cell");
          const btn = document.createElement("button");
          btn.className = "tc-tags-btn";
          btn.type = "button";
          btn.setAttribute("data-allow-admin", "true");
          btn.classList.add("admin-allowed-tc");
          btn.innerHTML =
            tcList
              .slice(0, 2)
              .map((tc) => `<span class=\"tc-tag\">${tc}</span>`)
              .join("") +
            (tcList.length > 2
              ? ` <span class=\"tc-tag tc-tag-more\">+${
                  tcList.length - 2
                }</span>`
              : "") +
            ' <i class="fas fa-chevron-down tc-chevron"></i>';
          const popup = document.createElement("div");
          popup.className = "tc-popup";
          popup.style.display = "none";
          popup.setAttribute("data-allow-admin", "true");
          // Responsive popup width
          popup.style.minWidth = window.innerWidth <= 600 ? "90px" : "120px";
          popup.style.fontSize = window.innerWidth <= 600 ? "0.97em" : "1.05em";
          popup.innerHTML = tcList
            .map(
              (tc) =>
                `<div class="tc-popup-item admin-allowed-tc" data-allow-admin="true" style='cursor:pointer;'>${tc}</div>`
            )
            .join("");
          btn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll(".tc-popup").forEach((p) => {
              if (p !== popup) p.style.display = "none";
            });
            popup.style.display =
              popup.style.display === "block" ? "none" : "block";
          };
          popup.querySelectorAll(".tc-popup-item").forEach((item) => {
            item.onclick = (ev) => {
              ev.stopPropagation();
              popup.style.display = "none";
              showContainerDetailPopup(delivery, item.textContent);
            };
            item.setAttribute("data-allow-admin", "true");
            item.classList.add("admin-allowed-tc");
          });
          // Fermer le popup au toucher/clic hors du bouton sur mobile
          document.addEventListener("click", function hidePopup(e) {
            if (!td.contains(e.target)) popup.style.display = "none";
          });
          td.appendChild(btn);
          td.appendChild(popup);
        } else if (tcList.length === 1) {
          const tag = document.createElement("span");
          tag.className = "tc-tag";
          tag.textContent = tcList[0];
          tag.style.cursor = "pointer";
          tag.setAttribute("data-allow-admin", "true");
          tag.classList.add("admin-allowed-tc");
          tag.onclick = (e) => {
            e.stopPropagation();
            showContainerDetailPopup(delivery, tcList[0]);
          };
          td.appendChild(tag);
        } else {
          td.textContent = "-";
        }
      } else if (col.id === "bl_number") {
        // TOUJOURS ajouter le gestionnaire onclick pour permettre l'édition
        td.onclick = () => {
          // Vérifier si on est en mode édition ET que la colonne est éditable
          if (!isTableEditMode || !EDITABLE_COLUMNS.includes(col.id)) return;

          // Récupérer la valeur actuelle depuis les données sauvegardées ou originales
          let currentValue = getCellValue(delivery, col.id);

          // Si getCellValue retourne "-", utiliser une chaîne vide pour l'édition
          if (currentValue === "-") {
            currentValue = "";
          }

          // Si c'est un array, le convertir en chaîne avec virgules
          if (Array.isArray(currentValue)) {
            currentValue = currentValue.filter(Boolean).join(", ");
          }

          const input = document.createElement("input");
          input.type = "text";
          input.value = currentValue;
          input.style.width = "100%";
          input.style.border = "2px solid #2563eb";
          input.style.borderRadius = "4px";
          input.style.padding = "6px 8px";
          input.style.fontSize = "0.9rem";
          input.style.fontFamily = "inherit";

          const isDark =
            document.documentElement.getAttribute("data-theme") === "dark";
          input.style.backgroundColor = isDark ? "#232f43" : "#fff";
          input.style.color = isDark ? "#fff" : "#222";

          td.textContent = "";
          td.appendChild(input);

          const saveEdit = () => {
            const newValue = input.value.trim();

            // Sauvegarder la modification avec synchronisation serveur
            saveCellValue(delivery.id, col.id, newValue);

            // Mettre à jour les données de livraison avec la nouvelle valeur
            if (newValue) {
              // Convertir la chaîne en array si elle contient des virgules
              const newBlList = newValue.split(/[,;\s]+/).filter(Boolean);
              delivery.bl_number = newBlList;
            } else {
              delivery.bl_number = [];
            }

            // Vider la cellule et re-rendre avec l'affichage normal (badges/cartes)
            td.innerHTML = "";
            td.classList.remove("tc-multi-cell");

            // Re-exécuter la logique de rendu normal pour bl_number
            let blList = [];
            if (Array.isArray(delivery.bl_number)) {
              blList = delivery.bl_number.filter(Boolean);
            } else if (typeof delivery.bl_number === "string") {
              blList = delivery.bl_number.split(/[,;\s]+/).filter(Boolean);
            }

            // Rendu des badges/cartes pour BL
            if (blList.length > 1) {
              td.classList.add("tc-multi-cell");
              const btn = document.createElement("button");
              btn.className = "tc-tags-btn";
              btn.type = "button";
              btn.setAttribute("data-allow-admin", "true");
              btn.classList.add("admin-allowed-bl-link");
              btn.innerHTML =
                blList
                  .slice(0, 2)
                  .map((bl) => `<span class="tc-tag">${bl}</span>`)
                  .join("") +
                (blList.length > 2
                  ? ` <span class="tc-tag tc-tag-more">+${
                      blList.length - 2
                    }</span>`
                  : "") +
                ' <i class="fas fa-chevron-down tc-chevron"></i>';
              td.appendChild(btn);
            } else if (blList.length === 1) {
              const tag = document.createElement("span");
              tag.className = "tc-tag";
              tag.textContent = blList[0];
              td.appendChild(tag);
            } else {
              td.textContent = "-";
            }
          };

          input.addEventListener("blur", saveEdit);
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              saveEdit();
            } else if (e.key === "Escape") {
              td.textContent = currentValue || "-";
            }
          });

          input.focus();
          if (input.setSelectionRange) {
            input.setSelectionRange(0, input.value.length);
          }
        };

        // Rendu normal (non-édition) : logique existante avec badge/tag et menu déroulant popup
        let blList = [];

        // Récupérer la valeur éditée s'il y en a une
        const editedValue = getCellValue(delivery, col.id);

        if (editedValue && editedValue !== "-") {
          // Utiliser la valeur éditée
          if (typeof editedValue === "string") {
            blList = editedValue.split(/[,;\s]+/).filter(Boolean);
          } else if (Array.isArray(editedValue)) {
            blList = editedValue.filter(Boolean);
          }
        } else {
          // Utiliser les données originales
          if (Array.isArray(delivery.bl_number)) {
            blList = delivery.bl_number.filter(Boolean);
          } else if (typeof delivery.bl_number === "string") {
            blList = delivery.bl_number.split(/[,;\s]+/).filter(Boolean);
          }
        }
        if (blList.length > 1) {
          td.classList.add("tc-multi-cell");
          const btn = document.createElement("button");
          btn.className = "tc-tags-btn";
          btn.type = "button";
          btn.setAttribute("data-allow-admin", "true");
          btn.classList.add("admin-allowed-bl-link");
          btn.innerHTML =
            blList
              .slice(0, 2)
              .map((bl) => `<span class=\"tc-tag\">${bl}</span>`)
              .join("") +
            (blList.length > 2
              ? ` <span class=\"tc-tag tc-tag-more\">+${
                  blList.length - 2
                }</span>`
              : "") +
            ' <i class="fas fa-chevron-down tc-chevron"></i>';
          const popup = document.createElement("div");
          popup.className = "tc-popup";
          popup.style.display = "none";
          popup.setAttribute("data-allow-admin", "true");
          popup.innerHTML = blList
            .map(
              (bl) =>
                `<div class="tc-popup-item admin-allowed-tc" data-allow-admin="true" style='cursor:pointer;'>${bl}</div>`
            )
            .join("");
          btn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll(".tc-popup").forEach((p) => {
              if (p !== popup) p.style.display = "none";
            });
            popup.style.display =
              popup.style.display === "block" ? "none" : "block";
          };
          popup.querySelectorAll(".tc-popup-item").forEach((item) => {
            item.onclick = (ev) => {
              ev.stopPropagation();
              popup.style.display = "none";
              showBLDetailPopup(delivery, item.textContent);
            };
          });
          document.addEventListener("click", function hidePopup(e) {
            if (!td.contains(e.target)) popup.style.display = "none";
          });
          td.appendChild(btn);
          td.appendChild(popup);
        } else if (blList.length === 1) {
          const tag = document.createElement("span");
          tag.className = "tc-tag";
          tag.textContent = blList[0];
          tag.style.cursor = "pointer";
          tag.setAttribute("data-allow-admin", "true");
          tag.classList.add("admin-allowed-bl-link");
          tag.onclick = (e) => {
            e.stopPropagation();
            showBLDetailPopup(delivery, blList[0]);
          };
          td.appendChild(tag);
          tag.onclick = (e) => {
            e.stopPropagation();
            showBLDetailPopup(delivery, blList[0]);
          };
          td.appendChild(tag);
        } else {
          td.textContent = "-";
        }
        // Fonction pour afficher le menu déroulant de BL (popup) avec statut - VERSION ULTRA COMPACTE 2024
        function showBLDetailPopup(delivery, blNumber) {
          console.log("🚀 POPUP ULTRA COMPACT - Version tablette optimisée");
          const oldPopup = document.getElementById("blDetailPopup");
          if (oldPopup) oldPopup.remove();
          const overlay = document.createElement("div");
          overlay.id = "blDetailPopup";
          overlay.style.position = "fixed";
          overlay.style.top = 0;
          overlay.style.left = 0;
          overlay.style.width = "100vw";
          overlay.style.height = "100vh";
          // Mode sombre : overlay plus foncé
          const isDark =
            document.documentElement.getAttribute("data-theme") === "dark";
          overlay.style.background = isDark
            ? "rgba(15,23,42,0.75)"
            : "rgba(30,41,59,0.45)";
          overlay.style.zIndex = 9999;
          overlay.style.display = "block";
          overlay.style.pointerEvents = "none";
          // Positionnement initial pour popup déplaçable
          const box = document.createElement("div");
          // Mode sombre : fond, bordure, ombre
          box.style.background = isDark ? "#1e293b" : "#fff";
          box.style.borderRadius = window.innerWidth <= 768 ? "12px" : "16px";
          box.style.boxShadow = isDark
            ? "0 12px 40px rgba(59,130,246,0.13)"
            : "0 12px 40px rgba(30,41,59,0.22)";
          box.style.position = "fixed";
          box.style.pointerEvents = "auto";
          // Adaptation responsive : popup réduite pour meilleur centrage sur tablette
          if (window.innerWidth <= 480) {
            // Mobile - format compact horizontal
            box.style.maxWidth = "92vw";
            box.style.width = "92vw";
            box.style.maxHeight = "70vh";
          } else if (window.innerWidth <= 768) {
            // Tablette - format réduit pour meilleur centrage
            box.style.maxWidth = "82vw";
            box.style.width = "82vw";
            box.style.maxHeight = "65vh";
          } else if (window.innerWidth <= 1024) {
            // Petits écrans desktop
            box.style.maxWidth = "75vw";
            box.style.width = "75vw";
            box.style.maxHeight = "65vh";
          } else {
            // Desktop large
            box.style.maxWidth = "520px";
            box.style.width = "96vw";
            box.style.maxHeight = "90vh";
          }
          box.style.overflowY = "auto";
          box.style.padding = "0";
          box.style.display = "flex";
          box.style.flexDirection = "column";
          // Rendre la popup déplaçable - positionnement initial centré
          box.style.cursor = "move";
          box.style.zIndex = 10000;

          // Positionner la popup au centre initialement
          const boxWidth =
            window.innerWidth <= 480
              ? window.innerWidth * 0.92
              : window.innerWidth <= 768
              ? window.innerWidth * 0.82
              : window.innerWidth <= 1024
              ? window.innerWidth * 0.75
              : 520;
          const boxHeight =
            window.innerWidth <= 768
              ? window.innerHeight * 0.65
              : window.innerHeight * 0.7;

          box.style.left = (window.innerWidth - boxWidth) / 2 + "px";
          box.style.top =
            window.innerWidth <= 768
              ? "8vh"
              : (window.innerHeight - boxHeight) / 2 + "px";

          const header = document.createElement("div");
          // Mode sombre : header jaune vif, texte foncé
          header.style.background = isDark ? "#ffd600" : "#2563eb";
          header.style.color = isDark ? "#1e293b" : "#fff";
          header.style.cursor = "move";
          // Adaptation responsive du header - très compact
          if (window.innerWidth <= 768) {
            header.style.padding = "8px 12px 6px 12px";
            header.style.fontSize = "0.95rem";
          } else {
            header.style.padding = "18px 28px 12px 28px";
            header.style.fontSize = "1.15rem";
          }
          header.style.fontWeight = "bold";
          header.style.display = "flex";
          header.style.flexDirection = "column";

          // Fonctionnalité de glisser-déposer pour rendre la popup déplaçable
          let isDragging = false;
          let currentX;
          let currentY;
          let initialX;
          let initialY;
          let xOffset = 0;
          let yOffset = 0;

          // Position initiale centrée
          const rect = box.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          setTimeout(() => {
            const boxRect = box.getBoundingClientRect();
            xOffset = (viewportWidth - boxRect.width) / 2;
            yOffset =
              window.innerWidth <= 768
                ? window.innerWidth <= 480
                  ? window.innerHeight * 0.08
                  : window.innerHeight * 0.06
                : (viewportHeight - boxRect.height) / 2;

            box.style.left = xOffset + "px";
            box.style.top = yOffset + "px";
            box.style.transform = "none";
          }, 10);

          function dragStart(e) {
            if (e.type === "touchstart") {
              initialX = e.touches[0].clientX - xOffset;
              initialY = e.touches[0].clientY - yOffset;
            } else {
              initialX = e.clientX - xOffset;
              initialY = e.clientY - yOffset;
            }

            if (e.target === header || header.contains(e.target)) {
              isDragging = true;
              box.style.cursor = "grabbing";
              header.style.cursor = "grabbing";
            }
          }

          function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            box.style.cursor = "move";
            header.style.cursor = "move";
          }

          function drag(e) {
            if (isDragging) {
              e.preventDefault();

              if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
              } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
              }

              xOffset = currentX;
              yOffset = currentY;

              // Contraintes pour garder la popup dans les limites de l'écran
              const boxRect = box.getBoundingClientRect();
              const minX = 0;
              const minY = 0;
              const maxX = viewportWidth - boxRect.width;
              const maxY = viewportHeight - boxRect.height;

              xOffset = Math.max(minX, Math.min(maxX, xOffset));
              yOffset = Math.max(minY, Math.min(maxY, yOffset));

              box.style.left = xOffset + "px";
              box.style.top = yOffset + "px";
            }
          }

          // Event listeners pour desktop
          header.addEventListener("mousedown", dragStart, false);
          document.addEventListener("mouseup", dragEnd, false);
          document.addEventListener("mousemove", drag, false);

          // Event listeners pour mobile/tablette
          header.addEventListener("touchstart", dragStart, false);
          document.addEventListener("touchend", dragEnd, false);
          document.addEventListener("touchmove", drag, false);
          header.style.borderTopLeftRadius =
            window.innerWidth <= 768 ? "12px" : "16px";
          header.style.borderTopRightRadius =
            window.innerWidth <= 768 ? "12px" : "16px";
          header.innerHTML = `
            <div style='margin-bottom:2px;'>
              <span style='font-size:1.08em;'>${
                delivery.employee_name || "-"
              }</span>
            </div>
            <div style='font-size:0.98em;font-weight:400;'>
              Client : <span style='color:#111;font-weight:700;'>${
                delivery.client_name || "-"
              }</span><br>
              Dossier : <span style='color:#111;font-weight:700;'>${
                delivery.dossier_number || "-"
              }</span>  
            </div>
          `;
          const closeBtn = document.createElement("button");
          closeBtn.innerHTML = "&times;";
          closeBtn.style.background = "#dc3545";
          closeBtn.style.border = "none";
          closeBtn.style.color = "#fff";
          closeBtn.style.borderRadius = "50%";
          closeBtn.style.width = "35px";
          closeBtn.style.height = "35px";
          closeBtn.style.display = "flex";
          closeBtn.style.alignItems = "center";
          closeBtn.style.justifyContent = "center";
          closeBtn.style.transition = "all 0.2s ease";
          // Adaptation responsive du bouton fermer - plus compact
          if (window.innerWidth <= 768) {
            closeBtn.style.fontSize = "1.5rem";
            closeBtn.style.top = "2px";
            closeBtn.style.right = "8px";
          } else {
            closeBtn.style.fontSize = "2.1rem";
            closeBtn.style.top = "10px";
            closeBtn.style.right = "18px";
          }
          closeBtn.style.cursor = "pointer";
          closeBtn.style.position = "absolute";
          closeBtn.style.zIndex = "10001";
          closeBtn.setAttribute("aria-label", "Fermer");
          closeBtn.setAttribute("data-allow-admin", "true");
          closeBtn.classList.add("admin-allowed-button");

          // Effet hover
          closeBtn.addEventListener("mouseenter", () => {
            closeBtn.style.background = "#c82333";
            closeBtn.style.transform = "scale(1.1)";
          });
          closeBtn.addEventListener("mouseleave", () => {
            closeBtn.style.background = "#dc3545";
            closeBtn.style.transform = "scale(1)";
          });

          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            overlay.remove();
          };
          header.appendChild(closeBtn);
          box.appendChild(header);
          const content = document.createElement("div");
          // Adaptation responsive du contenu - optimisé pour layout horizontal
          if (window.innerWidth <= 480) {
            // Mobile - padding compact mais suffisant
            content.style.padding = "6px 8px 10px 8px";
          } else if (window.innerWidth <= 768) {
            // Tablette - padding réduit pour maximiser l'espace horizontal
            content.style.padding = "8px 10px 12px 10px";
          } else {
            content.style.padding = "20px 20px 20px 20px";
          }
          content.style.background = "#f8fafc";
          content.style.flex = "1 1 auto";
          content.style.overflowY = "auto";
          // Assurer que le contenu peut défiler pour voir le bouton
          content.style.minHeight = "0";
          // Bloc Numéro du conteneur (TC)
          // (Bloc Numéro du conteneur supprimé de la pop-up BL)

          // Bloc Numéro BL (déjà existant)
          const blNum = document.createElement("div");
          if (window.innerWidth <= 768) {
            blNum.style.fontSize = "0.9em";
            blNum.style.marginBottom = "4px";
          } else {
            blNum.style.fontSize = "1.2em";
            blNum.style.marginBottom = "12px";
          }
          blNum.style.fontWeight = "bold";
          blNum.style.textAlign = "center";
          blNum.innerHTML = `<span style='color:#111;font-weight:700;'>N° BL :</span> <span style='color:${
            isDark ? "#ffd600" : "#2563eb"
          };'>${blNumber}</span>`;
          content.appendChild(blNum);

          // Ajout du sélecteur de statut pour le BL
          const label = document.createElement("label");
          label.textContent = "Statut du BL :";
          label.style.display = "block";
          label.style.marginBottom = "3px";
          label.style.fontWeight = "500";
          label.style.fontSize = window.innerWidth <= 768 ? "0.8em" : "0.95em";
          if (isDark) label.style.color = "#111";
          content.appendChild(label);

          const select = document.createElement("select");
          select.style.width = "100%";
          // Adaptation responsive des inputs - compact horizontal
          if (window.innerWidth <= 768) {
            select.style.padding = "3px 5px";
            select.style.fontSize = "0.85em";
            select.style.marginBottom = "4px";
          } else {
            select.style.padding = "8px 10px";
            select.style.fontSize = "1em";
            select.style.marginBottom = "12px";
          }
          select.style.border = isDark
            ? "1.5px solid #ffd600"
            : "1.5px solid #2563eb";
          select.style.borderRadius = "7px";
          select.style.background = isDark ? "#1e293b" : "#fff";
          select.style.color = isDark ? "#fff" : "#222";
          select.style.boxShadow = isDark
            ? "0 1px 4px rgba(255,214,0,0.08)"
            : "0 1px 4px rgba(30,41,59,0.04)";
          const statusOptions = [
            { value: "mise_en_livraison", label: "Mise en livraison" },
            { value: "aucun", label: "Aucun" },
          ];
          // On stocke le statut BL dans delivery.bl_statuses (objet clé BL)
          if (
            !delivery.bl_statuses ||
            typeof delivery.bl_statuses !== "object"
          ) {
            delivery.bl_statuses = {};
          }
          let currentStatus = delivery.bl_statuses[blNumber] || "aucun";
          if (currentStatus !== "mise_en_livraison") {
            currentStatus = "aucun";
          }
          statusOptions.forEach((opt) => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === currentStatus) option.selected = true;
            select.appendChild(option);
          });
          content.appendChild(select);

          // --- NOUVEAUX CHAMPS D'ÉCHANGE POUR LE SYSTÈME PHP ---

          // Séparateur visuel
          const separator = document.createElement("div");
          separator.style.borderTop = "1px solid #e5e7eb";
          if (isDark) separator.style.borderTop = "1px solid #ffd600";
          // Réduction de la marge pour layout horizontal
          if (window.innerWidth <= 768) {
            separator.style.margin = "6px 0 4px 0";
          } else {
            separator.style.margin = "16px 0 12px 0";
          }
          content.appendChild(separator);

          // Titre section
          const sectionTitle = document.createElement("div");
          const titleFontSize = window.innerWidth <= 768 ? "0.85em" : "1.05em";
          sectionTitle.innerHTML = `<h4 style="color:#2563eb;font-weight:600;margin-bottom:4px;font-size:${titleFontSize};">📊 Données d'échange</h4>`;
          // Mode sombre : titre section jaune
          sectionTitle.innerHTML = `<h4 style="color:${
            isDark ? "#ffd600" : "#2563eb"
          };font-weight:600;margin-bottom:4px;font-size:${titleFontSize};">📊 Données d'échange</h4>`;
          content.appendChild(sectionTitle);

          // Container pour layout horizontal optimisé - tablette et mobile
          const fieldsContainer = document.createElement("div");
          if (window.innerWidth <= 768) {
            // Layout horizontal sur tablette et mobile pour optimiser l'espace
            fieldsContainer.style.display = "grid";
            if (window.innerWidth <= 480) {
              // Mobile : 2 colonnes compactes sur 2 lignes (4 champs au total)
              fieldsContainer.style.gridTemplateColumns = "1fr 1fr";
              fieldsContainer.style.gap = "4px 8px";
            } else {
              // Tablette : 2 colonnes sur 2 lignes pour bien voir tous les champs
              fieldsContainer.style.gridTemplateColumns = "1fr 1fr";
              fieldsContainer.style.gap = "8px 12px";
            }
            fieldsContainer.style.marginBottom = "8px";
          } else {
            // Desktop : layout en 2 colonnes sur 2 lignes pour les 4 champs
            fieldsContainer.style.display = "grid";
            fieldsContainer.style.gridTemplateColumns = "1fr 1fr";
            fieldsContainer.style.gap = "12px 16px";
            fieldsContainer.style.marginBottom = "12px";
          }
          content.appendChild(fieldsContainer);

          // 1. Paiement Acconage
          const paiementGroup = document.createElement("div");
          // Toujours prendre une seule cellule pour s'asygdsjjapter au grid

          const paiementLabel = document.createElement("label");
          paiementLabel.textContent = "📅 Date Paiement Acconage :";
          paiementLabel.style.display = "block";
          paiementLabel.style.marginBottom = "2px";
          paiementLabel.style.fontWeight = "500";
          paiementLabel.style.fontSize =
            window.innerWidth <= 768 ? "0.78em" : "0.92em";
          if (isDark) paiementLabel.style.color = "#111";
          paiementGroup.appendChild(paiementLabel);

          const paiementInput = document.createElement("input");
          paiementInput.type = "date";
          paiementInput.id = "paiementAcconage";
          paiementInput.style.width = "100%";
          paiementInput.style.padding =
            window.innerWidth <= 768 ? "2px 4px" : "6px 8px";
          paiementInput.style.border = isDark
            ? "1.5px solid #ffd600"
            : "1.5px solid #d1d5db";
          paiementInput.style.borderRadius = "4px";
          paiementInput.style.fontSize =
            window.innerWidth <= 768 ? "0.8em" : "0.95em";
          paiementInput.style.marginBottom = "0";
          paiementInput.style.background = isDark ? "#1e293b" : "#fff";
          paiementInput.style.color = isDark ? "#fff" : "#222";

          // Récupérer la valeur de date depuis la base de données et la convertir au format YYYY-MM-DD
          const tempKeyPaiement = `temp_paiement_acconage_${delivery.id}`;
          const tempValuePaiement = localStorage.getItem(tempKeyPaiement);

          if (tempValuePaiement) {
            paiementInput.value = tempValuePaiement;
          } else {
            paiementInput.value = delivery.paiement_acconage
              ? new Date(delivery.paiement_acconage).toISOString().split("T")[0]
              : "";
          }

          // Sauvegarde automatique lors de la modification
          paiementInput.addEventListener("change", function () {
            localStorage.setItem(tempKeyPaiement, this.value);
            // Synchronisation automatique vers le tableau de suivi
            syncToTableauSuivie(delivery.id, "paiement_acconage", this.value);
            // Synchronisation compatible avec scriptSuivie.js
            const syncKey = `sync_${delivery.id}_paiement_acconage`;
            localStorage.setItem(
              syncKey,
              JSON.stringify({ value: this.value, timestamp: Date.now() })
            );
          });
          paiementGroup.appendChild(paiementInput);
          fieldsContainer.appendChild(paiementGroup);

          // 2. Date de DO
          const dateDOGroup = document.createElement("div");

          const dateDOLabel = document.createElement("label");
          dateDOLabel.textContent = "📅 Date DO :";
          dateDOLabel.style.display = "block";
          dateDOLabel.style.marginBottom = "2px";
          dateDOLabel.style.fontWeight = "500";
          dateDOLabel.style.fontSize =
            window.innerWidth <= 768 ? "0.78em" : "0.92em";
          if (isDark) dateDOLabel.style.color = "#111";
          dateDOGroup.appendChild(dateDOLabel);

          const dateDOInput = document.createElement("input");
          dateDOInput.type = "date";
          dateDOInput.id = "dateDO";
          dateDOInput.style.width = "100%";
          dateDOInput.style.padding =
            window.innerWidth <= 768 ? "2px 4px" : "6px 8px";
          dateDOInput.style.border = isDark
            ? "1.5px solid #ffd600"
            : "1.5px solid #d1d5db";
          dateDOInput.style.borderRadius = "4px";
          dateDOInput.style.fontSize =
            window.innerWidth <= 768 ? "0.8em" : "0.95em";
          dateDOInput.style.marginBottom = "0";
          dateDOInput.style.background = isDark ? "#1e293b" : "#fff";
          dateDOInput.style.color = isDark ? "#fff" : "#222";

          // Récupérer la valeur sauvée temporairement ou depuis la BDD
          const tempKeyDO = `temp_date_do_${delivery.id}`;
          const tempValueDO = localStorage.getItem(tempKeyDO);
          dateDOInput.value = tempValueDO || delivery.date_do || "";

          // Sauvegarde automatique lors de la modification
          dateDOInput.addEventListener("change", function () {
            localStorage.setItem(tempKeyDO, this.value);
            // Synchronisation automatique vers le tableau de suivi
            syncToTableauSuivie(delivery.id, "date_do", this.value);
          });

          dateDOGroup.appendChild(dateDOInput);
          fieldsContainer.appendChild(dateDOGroup);

          // 3. Date de BADT
          const dateBADTGroup = document.createElement("div");

          const dateBADTLabel = document.createElement("label");
          dateBADTLabel.textContent = "📅 Date BADT :";
          dateBADTLabel.style.display = "block";
          dateBADTLabel.style.marginBottom = "2px";
          dateBADTLabel.style.fontWeight = "500";
          dateBADTLabel.style.fontSize =
            window.innerWidth <= 768 ? "0.78em" : "0.92em";
          if (isDark) dateBADTLabel.style.color = "#111";
          dateBADTGroup.appendChild(dateBADTLabel);

          const dateBADTInput = document.createElement("input");
          dateBADTInput.type = "date";
          dateBADTInput.id = "dateBADT";
          dateBADTInput.style.width = "100%";
          dateBADTInput.style.padding =
            window.innerWidth <= 768 ? "2px 4px" : "6px 8px";
          dateBADTInput.style.border = isDark
            ? "1.5px solid #ffd600"
            : "1.5px solid #d1d5db";
          dateBADTInput.style.borderRadius = "4px";
          dateBADTInput.style.fontSize =
            window.innerWidth <= 768 ? "0.8em" : "0.95em";
          dateBADTInput.style.marginBottom = "0";
          dateBADTInput.style.background = isDark ? "#1e293b" : "#fff";
          dateBADTInput.style.color = isDark ? "#fff" : "#222";

          // Récupérer la valeur sauvée temporairement ou depuis la BDD
          const tempKeyBADT = `temp_date_badt_${delivery.id}`;
          const tempValueBADT = localStorage.getItem(tempKeyBADT);
          dateBADTInput.value = tempValueBADT || delivery.date_badt || "";

          // Sauvegarde automatique lors de la modification
          dateBADTInput.addEventListener("change", function () {
            localStorage.setItem(tempKeyBADT, this.value);
            // Synchronisation automatique vers le tableau de suivi
            syncToTableauSuivie(delivery.id, "date_badt", this.value);
          });

          dateBADTGroup.appendChild(dateBADTInput);
          fieldsContainer.appendChild(dateBADTGroup);

          // 4. Date d'échange BL (lecture seule - générée automatiquement lors de l'enregistrement)
          const dateEchangeBLGroup = document.createElement("div");

          const dateEchangeBLLabel = document.createElement("label");
          dateEchangeBLLabel.textContent = "📅 Date d'échange BL :";
          dateEchangeBLLabel.style.display = "block";
          dateEchangeBLLabel.style.marginBottom = "2px";
          dateEchangeBLLabel.style.fontWeight = "500";
          dateEchangeBLLabel.style.fontSize =
            window.innerWidth <= 768 ? "0.78em" : "0.92em";
          if (isDark) dateEchangeBLLabel.style.color = "#111";
          dateEchangeBLGroup.appendChild(dateEchangeBLLabel);

          const dateEchangeBLInput = document.createElement("input");
          dateEchangeBLInput.type = "date";
          dateEchangeBLInput.id = "dateEchangeBL";
          dateEchangeBLInput.style.width = "100%";
          dateEchangeBLInput.style.padding =
            window.innerWidth <= 768 ? "2px 4px" : "6px 8px";
          dateEchangeBLInput.style.border = isDark
            ? "1.5px solid #ffd600"
            : "1.5px solid #d1d5db";
          dateEchangeBLInput.style.borderRadius = "4px";
          dateEchangeBLInput.style.fontSize =
            window.innerWidth <= 768 ? "0.8em" : "0.95em";
          dateEchangeBLInput.style.marginBottom = "0";
          dateEchangeBLInput.style.background = isDark ? "#232f43" : "#f3f4f6";
          dateEchangeBLInput.style.color = isDark ? "#ffd600" : "#6b7280";
          dateEchangeBLInput.readOnly = false;
          dateEchangeBLInput.style.cursor = "text";

          // Rendre le champ modifiable et prérempli si une date existe
          const tempKeyEchangeBL = `temp_date_echange_bl_${delivery.id}`;
          const tempValueEchangeBL = localStorage.getItem(tempKeyEchangeBL);
          dateEchangeBLInput.value =
            tempValueEchangeBL ||
            (delivery.date_echange_bl
              ? new Date(delivery.date_echange_bl).toISOString().split("T")[0]
              : "");

          dateEchangeBLInput.title =
            "Saisissez ou modifiez la date d'échange BL manuellement";

          // Sauvegarde automatique lors de la modification
          dateEchangeBLInput.addEventListener("change", function () {
            localStorage.setItem(tempKeyEchangeBL, this.value);
            // Synchronisation automatique vers le backend
            fetch(`/api/exchange/update/${delivery.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ date_echange_bl: this.value }),
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  // Optionnel : afficher une notification de succès
                  this.style.borderColor = "#22c55e";
                  setTimeout(() => {
                    this.style.borderColor = isDark ? "#ffd600" : "#d1d5db";
                  }, 1200);
                } else {
                  this.style.borderColor = "#ef4444";
                }
              })
              .catch(() => {
                this.style.borderColor = "#ef4444";
              });
          });

          dateEchangeBLInput.title =
            "Saisissez ou modifiez la date d'échange BL manuellement";

          dateEchangeBLGroup.appendChild(dateEchangeBLInput);
          fieldsContainer.appendChild(dateEchangeBLGroup);

          // Espacement avant le bouton - optimisé pour layout horizontal
          const buttonSpacer = document.createElement("div");
          if (window.innerWidth <= 768) {
            buttonSpacer.style.marginTop = "6px";
          } else {
            buttonSpacer.style.marginTop = "12px";
          }
          content.appendChild(buttonSpacer);

          const saveBtn = document.createElement("button");
          saveBtn.textContent = "Enregistrer toutes les données";
          saveBtn.className = "btn btn-primary w-full mt-2";
          saveBtn.style.background =
            "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
          saveBtn.style.color = "#fff";
          saveBtn.style.fontWeight = "bold";
          // Adaptation responsive du bouton - ultra compact pour tablette/mobile
          if (window.innerWidth <= 480) {
            // Mobile - bouton compact
            saveBtn.style.fontSize = "0.85em";
            saveBtn.style.padding = "0.6em 1em";
            saveBtn.style.marginTop = "4px";
          } else if (window.innerWidth <= 768) {
            // Tablette - bouton visible mais compact
            saveBtn.style.fontSize = "0.9em";
            saveBtn.style.padding = "0.65em 1.2em";
            saveBtn.style.marginTop = "6px";
            saveBtn.style.width = "100%";
          } else {
            // Desktop
            saveBtn.style.fontSize = "1em";
            saveBtn.style.padding = "0.7em 1.7em";
            saveBtn.style.marginTop = "0";
          }
          saveBtn.style.border = "none";
          saveBtn.style.borderRadius = "8px";
          saveBtn.style.boxShadow = "0 2px 12px rgba(37,99,235,0.13)";
          // Bouton collant en bas pour assurer la visibilité
          saveBtn.style.position = "sticky";
          saveBtn.style.bottom = "0";
          saveBtn.style.zIndex = "10";
          saveBtn.style.backgroundColor = "#f8fafc"; // Fond pour le sticky
          saveBtn.onclick = async () => {
            let statutToSend =
              select.value === "aucun" ? "aucun" : select.value;
            // Si on veut mettre le statut à 'mise_en_livraison', demander confirmation
            if (statutToSend === "mise_en_livraison") {
              // Récupérer les dates depuis les champs du formulaire
              const dateEchangeBLField =
                document.getElementById("dateEchangeBL");
              const dateDOField = document.getElementById("dateDO");
              const datePaiementAcconageField =
                document.getElementById("paiementAcconage");
              const dateBADTField = document.getElementById("dateBADT");

              // Ajouter le dossier à la liste des mises en livraison avec les dates du formulaire
              const dossierToSave = {
                ...delivery,
                container_number: delivery.container_number || "",
                client_name: delivery.client_name || delivery.client || "",
                status: "Mis en livraison",
                date_mise_en_liv: new Date().toISOString(),
                // Inclure les dates depuis les champs du formulaire
                date_echange_bl: dateEchangeBLField?.value
                  ? new Date(dateEchangeBLField.value).toISOString()
                  : delivery.date_echange_bl,
                date_do: dateDOField?.value
                  ? new Date(dateDOField.value).toISOString()
                  : delivery.date_do,
                date_paiement_acconage: datePaiementAcconageField?.value
                  ? new Date(datePaiementAcconageField.value).toISOString()
                  : delivery.date_paiement_acconage,
                date_badt: dateBADTField?.value
                  ? new Date(dateBADTField.value).toISOString()
                  : delivery.date_badt,
              };

              console.log("Dossier à sauvegarder avec dates:", dossierToSave); // Debug
              ajouterDossierMiseEnLiv(dossierToSave);

              // Popup de confirmation personnalisée
              const confirmOverlay = document.createElement("div");
              confirmOverlay.style.position = "fixed";
              confirmOverlay.style.top = 0;
              confirmOverlay.style.left = 0;
              confirmOverlay.style.width = "100vw";
              confirmOverlay.style.height = "100vh";
              confirmOverlay.style.background = "rgba(30,41,59,0.45)";
              confirmOverlay.style.zIndex = 99999;
              confirmOverlay.style.display = "flex";
              confirmOverlay.style.alignItems = "center";
              confirmOverlay.style.justifyContent = "center";
              const confirmBox = document.createElement("div");
              confirmBox.style.background = "#fff";
              confirmBox.style.borderRadius =
                window.innerWidth <= 768 ? "14px" : "18px";
              confirmBox.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
              // Adaptation responsive de la popup de confirmation&&
              if (window.innerWidth <= 480) {
                confirmBox.style.maxWidth = "95vw";
                confirmBox.style.width = "95vw";
              } else if (window.innerWidth <= 768) {
                confirmBox.style.maxWidth = "85vw";
                confirmBox.style.width = "85vw";
              } else {
                confirmBox.style.maxWidth = "420px";
                confirmBox.style.width = "96vw";
              }
              confirmBox.style.padding = "0";
              confirmBox.style.position = "relative";
              confirmBox.style.display = "flex";
              confirmBox.style.flexDirection = "column";
              // Header
              const confirmHeader = document.createElement("div");
              confirmHeader.style.background =
                "linear-gradient(90deg,#eab308 0%,#2563eb 100%)";
              confirmHeader.style.color = "#fff";
              // Adaptation responsive du header de confirmation
              if (window.innerWidth <= 768) {
                confirmHeader.style.padding = "16px 20px 10px 20px";
                confirmHeader.style.fontSize = "1.1rem";
              } else {
                confirmHeader.style.padding = "22px 32px 12px 32px";
                confirmHeader.style.fontSize = "1.18rem";
              }
              confirmHeader.style.fontWeight = "bold";
              confirmHeader.style.borderTopLeftRadius =
                window.innerWidth <= 768 ? "14px" : "18px";
              confirmHeader.style.borderTopRightRadius =
                window.innerWidth <= 768 ? "14px" : "18px";
              confirmHeader.innerHTML = `<span style='font-size:1.25em;'>⚠️ Confirmation requise</span>`;
              confirmBox.appendChild(confirmHeader);
              // Message
              const confirmMsgDiv = document.createElement("div");
              confirmMsgDiv.style.padding = "24px 24px 18px 24px";
              confirmMsgDiv.style.background = "#f8fafc";
              confirmMsgDiv.style.fontSize = "1.08em";
              confirmMsgDiv.style.color = "#1e293b";
              confirmMsgDiv.style.textAlign = "center";
              confirmMsgDiv.innerHTML =
                "<b>Vous êtes sur le point de valider la mise en livraison pour ce BL.</b><br><br>Cette opération est <span style='color:#eab308;font-weight:600;'>définitive</span> et ne pourra pas être annulée.<br><br>Voulez-vous vraiment continuer ?";
              confirmBox.appendChild(confirmMsgDiv);
              // Boutons
              const btnsDiv = document.createElement("div");
              btnsDiv.style.display = "flex";
              btnsDiv.style.justifyContent = "center";
              btnsDiv.style.gap = "18px";
              btnsDiv.style.padding = "0 0 22px 0";
              // Bouton Annuler
              const cancelBtn = document.createElement("button");
              cancelBtn.textContent = "Annuler";
              cancelBtn.style.background = "#fff";
              cancelBtn.style.color = "#2563eb";
              cancelBtn.style.fontWeight = "bold";
              cancelBtn.style.fontSize = "1em";
              cancelBtn.style.border = "2px solid #2563eb";
              cancelBtn.style.borderRadius = "8px";
              cancelBtn.style.padding = "0.7em 1.7em";
              cancelBtn.style.cursor = "pointer";
              cancelBtn.onclick = () => confirmOverlay.remove();
              // Bouton Confirmer
              const okBtn = document.createElement("button");
              okBtn.textContent = "Confirmer";
              okBtn.style.background =
                "linear-gradient(90deg,#2563eb 0%,#eab308 100%)";
              okBtn.style.color = "#fff";
              okBtn.style.fontWeight = "bold";
              okBtn.style.fontSize = "1em";
              okBtn.style.border = "none";
              okBtn.style.borderRadius = "8px";
              okBtn.style.padding = "0.7em 1.7em";
              okBtn.style.cursor = "pointer";
              okBtn.onclick = () => {
                confirmOverlay.remove();
                // On continue la procédure
                finishBLStatusChange();
              };
              btnsDiv.appendChild(cancelBtn);
              btnsDiv.appendChild(okBtn);
              confirmBox.appendChild(btnsDiv);
              confirmOverlay.appendChild(confirmBox);
              document.body.appendChild(confirmOverlay);
              confirmOverlay.onclick = (e) => {
                if (e.target === confirmOverlay) confirmOverlay.remove();
              };
              // On stoppe ici, finishBLStatusChange sera appelé si l'utilisateur confirme
              return;
              // Fonction pour continuer la procédure après confirmation
              function finishBLStatusChange() {
                // 1. MAJ locale immédiate du statut BL
                delivery.bl_statuses[blNumber] = statutToSend;

                // Si le statut est mise_en_livraison, ajouter à la liste des dossiers mis en livraison
                if (statutToSend === "mise_en_livraison") {
                  // Récupérer les dates depuis les champs du formulaire si disponibles
                  const dateEchangeBLField =
                    document.getElementById("dateEchangeBL");
                  const dateDOField = document.getElementById("dateDO");
                  const datePaiementAcconageField =
                    document.getElementById("paiementAcconage");
                  const dateBADTField = document.getElementById("dateBADT");

                  const dossierToSave = {
                    ...delivery,
                    container_number: delivery.container_number || "",
                    client_name: delivery.client_name || delivery.client || "",
                    status: "Mis en livraison",
                    bl_number: blNumber,
                    date_mise_en_liv: new Date().toISOString(),
                    // Récupérer les dates depuis les champs ou utiliser les valeurs existantes
                    date_echange_bl: dateEchangeBLField?.value
                      ? new Date(dateEchangeBLField.value).toISOString()
                      : delivery.date_echange_bl,
                    date_do: dateDOField?.value
                      ? new Date(dateDOField.value).toISOString()
                      : delivery.date_do,
                    date_paiement_acconage: datePaiementAcconageField?.value
                      ? new Date(datePaiementAcconageField.value).toISOString()
                      : delivery.date_paiement_acconage,
                    date_badt: dateBADTField?.value
                      ? new Date(dateBADTField.value).toISOString()
                      : delivery.date_badt,
                  };
                  console.log(
                    "Dossier à sauvegarder (finishBLStatusChange):",
                    dossierToSave
                  ); // Debug
                  ajouterDossierMiseEnLiv(dossierToSave);
                }
                // 2. MAJ instantanée de la colonne Statut Dossier dans la ligne du tableau
                const tableBody = document.getElementById(
                  "deliveriesTableBody"
                );
                if (tableBody) {
                  for (let row of tableBody.rows) {
                    let dossierCellIdx = AGENT_TABLE_COLUMNS.findIndex(
                      (c) => c.id === "dossier_number"
                    );
                    if (
                      dossierCellIdx !== -1 &&
                      row.cells[dossierCellIdx] &&
                      row.cells[dossierCellIdx].textContent ===
                        String(delivery.dossier_number)
                    ) {
                      let colIdx = AGENT_TABLE_COLUMNS.findIndex(
                        (c) => c.id === "container_status"
                      );
                      if (colIdx !== -1 && row.cells[colIdx]) {
                        let blList = [];
                        if (Array.isArray(delivery.bl_number)) {
                          blList = delivery.bl_number.filter(Boolean);
                        } else if (typeof delivery.bl_number === "string") {
                          blList = delivery.bl_number
                            .split(/[,;\s]+/)
                            .filter(Boolean);
                        }
                        let blStatuses = blList.map((bl) =>
                          delivery.bl_statuses && delivery.bl_statuses[bl]
                            ? delivery.bl_statuses[bl]
                            : "aucun"
                        );
                        let allMiseEnLivraison =
                          blStatuses.length > 0 &&
                          blStatuses.every((s) => s === "mise_en_livraison");
                        if (allMiseEnLivraison) {
                          row.cells[colIdx].innerHTML =
                            '<span style="display:inline-flex;align-items:center;gap:6px;color:#2563eb;font-weight:600;"><i class="fas fa-truck" style="font-size:1.1em;color:#2563eb;"></i> Mise en livraison</span>';

                          // Archiver automatiquement le dossier mis en livraison
                          if (typeof window.archiveDossier === "function") {
                            window
                              .archiveDossier(
                                delivery,
                                "mise_en_livraison",
                                "Responsable Acconier",
                                window.location.href
                              )
                              .then((success) => {
                                if (success) {
                                  console.log(
                                    `[ARCHIVE] Dossier mis en livraison archivé: ${
                                      delivery.dossier_number || delivery.id
                                    }`
                                  );
                                }
                              })
                              .catch((error) => {
                                // Ne plus afficher d'erreur pour les doublons (409) car c'est géré dans archiveDossier
                                console.warn(
                                  "[ARCHIVE] Archivage non effectué (probablement déjà archivé):",
                                  delivery.dossier_number || delivery.id
                                );
                              });
                          }
                        } else {
                          row.cells[colIdx].innerHTML =
                            '<span style="display:inline-flex;align-items:center;gap:6px;color:#b45309;font-weight:600;"><i class="fas fa-clock" style="font-size:1.1em;color:#b45309;"></i> En attente de paiement</span>';
                        }
                      }
                      break;
                    }
                  }
                }
                // 3. Envoi serveur (asynchrone, mais pas bloquant pour l'UI)
                try {
                  // Récupération des valeurs des nouveaux champs
                  const paiementAcconage = paiementInput.value.trim();
                  const dateDO = dateDOInput.value.trim();
                  const dateBADT = dateBADTInput.value.trim();

                  // 1. Mise à jour du statut BL
                  fetch(`/deliveries/${delivery.id}/bl-status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ blNumber, status: statutToSend }),
                  }).then(async (res) => {
                    if (!res.ok) {
                      let msg =
                        "Erreur lors de la mise à jour du statut du BL.";
                      try {
                        const errData = await res.json();
                        if (errData && errData.error)
                          msg += "\n" + errData.error;
                      } catch {}
                      alert(msg);
                      return;
                    }

                    // 2. Mise à jour des données d'échange si présentes
                    const exchangeData = {};
                    if (paiementAcconage)
                      exchangeData.paiement_acconage = paiementAcconage;
                    if (dateDO) exchangeData.date_do = dateDO;
                    if (dateBADT) exchangeData.date_badt = dateBADT;

                    if (Object.keys(exchangeData).length > 0) {
                      fetch(`/api/exchange/update/${delivery.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(exchangeData),
                      })
                        .then(() => {
                          // Synchronisation finale vers scriptSuivie.js après sauvegarde réussie
                          if (paiementAcconage) {
                            const syncKey = `sync_${delivery.id}_paiement_acconage`;
                            localStorage.setItem(
                              syncKey,
                              JSON.stringify({
                                value: paiementAcconage,
                                timestamp: Date.now(),
                              })
                            );
                          }
                          if (dateDO) {
                            const syncKeyDO = `sync_${delivery.id}_date_do`;
                            localStorage.setItem(
                              syncKeyDO,
                              JSON.stringify({
                                value: dateDO,
                                timestamp: Date.now(),
                              })
                            );
                          }
                          if (dateBADT) {
                            const syncKeyBADT = `sync_${delivery.id}_date_badt`;
                            localStorage.setItem(
                              syncKeyBADT,
                              JSON.stringify({
                                value: dateBADT,
                                timestamp: Date.now(),
                              })
                            );
                          }
                          // Nettoyer le localStorage temporaire après sauvegarde réussie
                          clearTempDatesFromStorage(delivery.id);
                        })
                        .catch((err) => {
                          console.warn(
                            "Erreur lors de la mise à jour des données d'échange:",
                            err
                          );
                        });
                    } else {
                      // Nettoyer le localStorage même s'il n'y a pas de données d'échange à sauvegarder
                      clearTempDatesFromStorage(delivery.id);
                    }

                    overlay.remove();
                    // Afficher l'alerte verte de confirmation
                    showMiseEnLivraisonSuccessAlert();
                  });
                } catch (err) {
                  alert(
                    "Erreur lors de la mise à jour du statut du BL.\n" +
                      (err && err.message ? err.message : "")
                  );
                }
              }

              // Fonction d'alerte verte de confirmation
              function showMiseEnLivraisonSuccessAlert() {
                // Supprimer toute alerte existante
                const oldAlert = document.getElementById(
                  "mise-en-livraison-success-alert"
                );
                if (oldAlert) oldAlert.remove();

                // Créer la nouvelle alerte
                const alert = document.createElement("div");
                alert.id = "mise-en-livraison-success-alert";
                alert.style.position = "fixed";
                alert.style.top = "20px";
                alert.style.left = "50%";
                alert.style.transform = "translateX(-50%)";
                alert.style.background =
                  "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)";
                alert.style.color = "#fff";
                alert.style.fontWeight = "bold";
                alert.style.fontSize = "1.1em";
                alert.style.padding = "15px 30px";
                alert.style.borderRadius = "12px";
                alert.style.boxShadow = "0 6px 32px rgba(34,197,94,0.18)";
                alert.style.zIndex = 99999;
                alert.style.opacity = "0";
                alert.style.transition = "opacity 0.3s";
                alert.style.display = "flex";
                alert.style.alignItems = "center";
                alert.style.gap = "10px";
                alert.innerHTML =
                  '<i class="fas fa-check-circle" style="font-size:1.2em;"></i> Mise en livraison effectuée';

                document.body.appendChild(alert);
                setTimeout(() => {
                  alert.style.opacity = "1";
                }, 10);
                setTimeout(() => {
                  alert.style.opacity = "0";
                  setTimeout(() => alert.remove(), 400);
                }, 3000);
              }
            }
            // 1. MAJ locale immédiate du statut BL
            delivery.bl_statuses[blNumber] = statutToSend;
            // 2. MAJ instantanée de la colonne Statut Dossier dans la ligne du tableau
            const tableBody = document.getElementById("deliveriesTableBody");
            if (tableBody) {
              for (let row of tableBody.rows) {
                let dossierCellIdx = AGENT_TABLE_COLUMNS.findIndex(
                  (c) => c.id === "dossier_number"
                );
                if (
                  dossierCellIdx !== -1 &&
                  row.cells[dossierCellIdx] &&
                  row.cells[dossierCellIdx].textContent ===
                    String(delivery.dossier_number)
                ) {
                  let colIdx = AGENT_TABLE_COLUMNS.findIndex(
                    (c) => c.id === "container_status"
                  );
                  if (colIdx !== -1 && row.cells[colIdx]) {
                    let blList = [];
                    if (Array.isArray(delivery.bl_number)) {
                      blList = delivery.bl_number.filter(Boolean);
                    } else if (typeof delivery.bl_number === "string") {
                      blList = delivery.bl_number
                        .split(/[,;\s]+/)
                        .filter(Boolean);
                    }
                    let blStatuses = blList.map((bl) =>
                      delivery.bl_statuses && delivery.bl_statuses[bl]
                        ? delivery.bl_statuses[bl]
                        : "aucun"
                    );
                    let allMiseEnLivraison =
                      blStatuses.length > 0 &&
                      blStatuses.every((s) => s === "mise_en_livraison");
                    if (allMiseEnLivraison) {
                      row.cells[colIdx].innerHTML =
                        '<span style="display:inline-flex;align-items:center;gap:6px;color:#2563eb;font-weight:600;"><i class="fas fa-truck" style="font-size:1.1em;color:#2563eb;"></i> Mise en livraison</span>';
                    } else {
                      row.cells[colIdx].innerHTML =
                        '<span style="display:inline-flex;align-items:center;gap:6px;color:#b45309;font-weight:600;"><i class="fas fa-clock" style="font-size:1.1em;color:#b45309;"></i> En attente de paiement</span>';
                    }
                  }
                  break;
                }
              }
            }
            // 3. Envoi serveur (asynchrone, mais pas bloquant pour l'UI)
            try {
              // Récupération des valeurs des nouveaux champs
              const paiementAcconage = paiementInput.value.trim();
              const dateDO = dateDOInput.value.trim();
              const dateBADT = dateBADTInput.value.trim();

              // 1. Mise à jour du statut BL
              const blStatusRes = await fetch(
                `/deliveries/${delivery.id}/bl-status`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ blNumber, status: statutToSend }),
                }
              );

              if (!blStatusRes.ok) {
                let msg = "Erreur lors de la mise à jour du statut du BL.";
                try {
                  const errData = await blStatusRes.json();
                  if (errData && errData.error) msg += "\n" + errData.error;
                } catch {}
                alert(msg);
                return;
              }

              // 2. Mise à jour des données d'échange via la nouvelle API
              const exchangeData = {};
              if (paiementAcconage)
                exchangeData.paiement_acconage = paiementAcconage;
              if (dateDO) exchangeData.date_do = dateDO;
              if (dateBADT) exchangeData.date_badt = dateBADT;

              // Si des données d'échange sont présentes, les envoyer
              if (Object.keys(exchangeData).length > 0) {
                const exchangeRes = await fetch(
                  `/api/exchange/update/${delivery.id}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(exchangeData),
                  }
                );

                if (!exchangeRes.ok) {
                  const errData = await exchangeRes.json();
                  console.warn(
                    "Erreur lors de la mise à jour des données d'échange:",
                    errData.message
                  );
                  // Ne pas arrêter le processus si seules les données d'échange échouent
                } else {
                  // Rafraîchir la liste des dossiers mis en livraison
                  refreshMiseEnLivList();
                  // Synchronisation vers scriptSuivie.js après sauvegarde réussie
                  if (paiementAcconage) {
                    const syncKey = `sync_${delivery.id}_paiement_acconage`;
                    localStorage.setItem(
                      syncKey,
                      JSON.stringify({
                        value: paiementAcconage,
                        timestamp: Date.now(),
                      })
                    );
                  }
                  if (dateDO) {
                    const syncKeyDO = `sync_${delivery.id}_date_do`;
                    localStorage.setItem(
                      syncKeyDO,
                      JSON.stringify({ value: dateDO, timestamp: Date.now() })
                    );
                  }
                  if (dateBADT) {
                    const syncKeyBADT = `sync_${delivery.id}_date_badt`;
                    localStorage.setItem(
                      syncKeyBADT,
                      JSON.stringify({ value: dateBADT, timestamp: Date.now() })
                    );
                  }
                }
              }
              overlay.remove();
            } catch (err) {
              alert(
                "Erreur lors de la mise à jour des données.\n" +
                  (err && err.message ? err.message : "")
              );
            }
          };
          content.appendChild(saveBtn);
          box.appendChild(content);
          overlay.appendChild(box);
          document.body.appendChild(overlay);
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
        }
        // Gestion stricte de la session responsable acconier :
        // On utilise UNIQUEMENT respAcconierUser, jamais user !
        let respAcconierUserRaw = null;
        let respAcconierUser = null;
        // Utilise sessionStorage pour éviter la boucle infinie
        let alreadyRedirected = sessionStorage.getItem(
          "__alreadyRedirectedRespAcconier"
        );
        function isLocalStorageAccessible() {
          try {
            const testKey = "__test_ls__";
            localStorage.setItem(testKey, "1");
            localStorage.removeItem(testKey);
            return true;
          } catch (e) {
            return false;
          }
        }
        if (isLocalStorageAccessible()) {
          respAcconierUserRaw = localStorage.getItem("respAcconierUser");
        }
        // Vérifie si on est déjà sur la page de login pour éviter la boucle (même avec paramètres ou hash)
        const isOnLoginPage = /resp_acconier\.html($|[?#])/i.test(
          window.location.pathname +
            window.location.search +
            window.location.hash
        );
        if (
          (!isLocalStorageAccessible() || !respAcconierUserRaw) &&
          !isOnLoginPage
        ) {
          if (!alreadyRedirected) {
            sessionStorage.setItem("__alreadyRedirectedRespAcconier", "1");
            // Redirige immédiatement, sans setTimeout (évite la boucle sur mobile)
            window.location.replace("resp_acconier.html");
          }
          return;
        }
        try {
          respAcconierUser = JSON.parse(respAcconierUserRaw);
          // Si on arrive à parser l'utilisateur, on supprime le flag pour permettre une reconnexion future
          sessionStorage.removeItem("__alreadyRedirectedRespAcconier");
        } catch (e) {
          if (!alreadyRedirected && !isOnLoginPage) {
            sessionStorage.setItem("__alreadyRedirectedRespAcconier", "1");
            window.location.replace("resp_acconier.html");
          }
          return;
        }
        // ...existing code...
      } else if (col.id === "container_status") {
        // Correction : si le statut acconier est 'en attente de paiement', on affiche toujours 'En attente de paiement'
        if (delivery.delivery_status_acconier === "en attente de paiement") {
          td.innerHTML =
            '<span style="display:inline-flex;align-items:center;gap:6px;color:#e53935;font-weight:600;"><i class="fas fa-clock" style="font-size:1.1em;color:#e53935;"></i> En attente de paiement</span>';
        } else {
          let blList = [];
          if (Array.isArray(delivery.bl_number)) {
            blList = delivery.bl_number.filter(Boolean);
          } else if (typeof delivery.bl_number === "string") {
            blList = delivery.bl_number.split(/[,;\s]+/).filter(Boolean);
          }
          let blStatuses = blList.map((bl) =>
            delivery.bl_statuses && delivery.bl_statuses[bl]
              ? delivery.bl_statuses[bl]
              : "aucun"
          );
          let allMiseEnLivraison =
            blStatuses.length > 0 &&
            blStatuses.every((s) => s === "mise_en_livraison");
          if (allMiseEnLivraison) {
            td.innerHTML =
              '<span style="display:inline-flex;align-items:center;gap:6px;color:#2563eb;font-weight:600;"><i class="fas fa-truck" style="font-size:1.1em;color:#2563eb;"></i> Mise en livraison</span>';
          } else {
            td.innerHTML =
              '<span style="display:inline-flex;align-items:center;gap:6px;color:#e53935;font-weight:600;"><i class="fas fa-clock" style="font-size:1.1em;color:#e53935;"></i> En attente de paiement</span>';
          }
        }
      } else {
        // Traitement pour toutes les autres colonnes
        value = delivery[col.id] !== undefined ? delivery[col.id] : "-";

        // Utiliser la valeur éditée si disponible
        value =
          getCellValue(delivery, col.id) !== "-"
            ? getCellValue(delivery, col.id)
            : value;

        // Traitement spécial pour les colonnes éditables
        if (EDITABLE_COLUMNS.includes(col.id)) {
          td.setAttribute("data-editable", "true");
          td.setAttribute("data-delivery-id", delivery.id);
          td.setAttribute("data-column-id", col.id);

          // Appliquer le style selon le mode d'édition
          if (isTableEditMode) {
            td.style.cursor = "pointer";
            td.style.backgroundColor = "#f8fafc";
            td.title = "Cliquez pour modifier";
            td.classList.add("editable-cell");
          }

          // Ajouter l'événement de clic pour l'édition
          td.onclick = function (e) {
            if (!isTableEditMode) return;
            if (td.querySelector("input, textarea, select")) return;

            // Pour la colonne observation, utiliser textarea si nécessaire
            if (col.id === "observation") {
              handleObservationEdit(td, delivery, value);
              return;
            }

            const currentValue =
              td.textContent.trim() === "-" ? "" : td.textContent.trim();
            const input = createEditInput(col.id, currentValue);

            // Fonction de sauvegarde
            function saveValue() {
              const newValue = input.value.trim();
              saveCellValue(delivery.id, col.id, newValue);
              td.textContent = newValue || "-";

              // Feedback visuel
              td.style.backgroundColor = "#dcfce7";
              td.style.border = "1px solid #16a34a";
              setTimeout(() => {
                if (isTableEditMode) {
                  td.style.backgroundColor = "#f8fafc";
                } else {
                  td.style.backgroundColor = "";
                }
                td.style.border = "";
              }, 2000);
            }

            // Gestionnaires d'événements
            input.onkeydown = function (ev) {
              if (ev.key === "Enter") {
                ev.preventDefault();
                saveValue();
              } else if (ev.key === "Escape") {
                td.textContent = currentValue || "-";
              }
            };

            input.onblur = function () {
              saveValue();
            };

            // Remplacer le contenu de la cellule par l'input
            td.textContent = "";
            td.appendChild(input);
            input.focus();

            if (input.setSelectionRange) {
              input.setSelectionRange(0, input.value.length);
            }
          };
        }

        // Ajout du tooltip custom si texte tronqué pour la colonne observation
        if (col.id === "observation") {
          td.classList.add("observation-col");
          td.style.cursor = "pointer";

          // 🎨 STYLE MODE SOMBRE : Appliquer la couleur jaune pour les observations en mode sombre
          const isDarkMode =
            document.documentElement.getAttribute("data-theme") === "dark";
          if (isDarkMode) {
            td.style.backgroundColor = "#fbbf24"; // Jaune pour mode sombre
            td.style.color = "#1e293b"; // Texte sombre pour contraste
          }

          // Ajouter les attributs pour la synchronisation WebSocket
          td.setAttribute("data-delivery-id", delivery.id);
          td.setAttribute("data-field", "observation");

          let localKey = `obs_${delivery.id}`;
          let localObs = localStorage.getItem(localKey);
          let displayValue = value;

          // 🔧 DEBUG INTENSIF : Vérifier exactement ce qui se passe
          console.log(`🔍 [DEBUG OBSERVATION] Livraison ${delivery.id}:`, {
            localKey,
            localObs,
            value,
            hasLocalObs: !!localObs,
            localObsLength: localObs ? localObs.length : 0,
          });

          // 🔧 CORRECTION MODE ADMIN : Priorité aux observations de l'utilisateur ciblé
          const urlParams = new URLSearchParams(window.location.search);
          const isAdminMode = urlParams.get("mode") === "admin";
          const targetUser = urlParams.get("targetUser");

          // 🔧 DÉTECTION ALTERNATIVE DU MODE ADMIN
          const isAdminContext =
            isAdminMode ||
            window.location.href.includes("mode=admin") ||
            window.location.href.includes("targetUser=");

          console.log(`🔍 [DEBUG MODE] Pour livraison ${delivery.id}:`, {
            currentUrl: window.location.href,
            isAdminMode,
            isAdminContext,
            targetUser,
            hasLocalObs: !!localObs,
            localObsTrimmed: localObs ? localObs.trim() : null,
            willUseLocalObs:
              (isAdminMode || isAdminContext) &&
              localObs &&
              localObs.trim() !== "" &&
              localObs !== "-",
          });

          if (
            (isAdminMode || isAdminContext) &&
            localObs &&
            localObs.trim() !== "" &&
            localObs !== "-"
          ) {
            // En mode admin, prioriser les observations de l'utilisateur ciblé
            displayValue = localObs;
            console.log(
              `📝 [ADMIN MODE] ✅ Observation affichée pour livraison ${delivery.id}: "${displayValue}"`
            );
          } else if (value === "-" && localObs) {
            // Mode normal : afficher localObs seulement si value est "-"
            displayValue = localObs;
            console.log(
              `📝 [MODE NORMAL] Observation affichée pour livraison ${delivery.id}: "${displayValue}"`
            );
          } else {
            console.log(
              `📝 [PAS D'OBSERVATION] Livraison ${delivery.id}: Aucune observation à afficher (value: "${value}", localObs: "${localObs}")`
            );
          }

          // Appliquer la transformation en majuscules pour les observations
          if (
            displayValue &&
            displayValue !== "-" &&
            typeof displayValue === "string"
          ) {
            td.textContent = displayValue.toUpperCase();
          } else {
            td.textContent = displayValue;
          }
          if (localObs && value && value !== "-" && value !== localObs) {
            // En mode admin, ne pas supprimer les observations de l'utilisateur ciblé
            if (!(isAdminMode || isAdminContext)) {
              localStorage.removeItem(localKey);
            }
          }
          // Tooltip custom au survol si texte tronqué
          td.addEventListener("mouseenter", function (e) {
            setTimeout(() => {
              if (
                td.offsetWidth < td.scrollWidth &&
                td.textContent.trim() !== "-" &&
                td.textContent.length > 0
              ) {
                let tooltip = document.createElement("div");
                tooltip.className = "custom-tooltip-floating";
                tooltip.textContent = td.textContent;
                document.body.appendChild(tooltip);
                // Positionnement près de la cellule
                const rect = td.getBoundingClientRect();
                tooltip.style.position = "fixed";
                tooltip.style.left = rect.left + window.scrollX + 10 + "px";
                tooltip.style.top = rect.top + window.scrollY - 8 + "px";
                tooltip.style.background = "#fff";
                tooltip.style.color = "#1e293b";
                tooltip.style.padding = "8px 16px";
                tooltip.style.borderRadius = "10px";
                tooltip.style.boxShadow = "0 4px 18px rgba(30,41,59,0.13)";
                tooltip.style.fontSize = "1em";
                tooltip.style.fontWeight = "500";
                tooltip.style.zIndex = 99999;
                tooltip.style.maxWidth = "420px";
                tooltip.style.wordBreak = "break-word";
                tooltip.style.pointerEvents = "none";
                tooltip.style.opacity = "0";
                tooltip.style.transition = "opacity 0.18s";
                setTimeout(() => {
                  tooltip.style.opacity = "1";
                }, 10);
                td._customTooltip = tooltip;
              }
            }, 0);
          });
          td.addEventListener("mouseleave", function () {
            if (td._customTooltip) {
              td._customTooltip.style.opacity = "0";
              setTimeout(() => {
                if (td._customTooltip && td._customTooltip.parentNode) {
                  td._customTooltip.parentNode.removeChild(td._customTooltip);
                  td._customTooltip = null;
                }
              }, 120);
            }
          });
          td.onclick = function (e) {
            if (td.querySelector("textarea")) return;
            let currentText =
              td.textContent && td.textContent.trim() !== "-"
                ? td.textContent.trim()
                : "";
            const textarea = document.createElement("textarea");
            textarea.value = currentText;
            textarea.style.width = "100%";
            textarea.style.fontSize = "1em";
            textarea.style.padding = "2px 4px";

            // 🎨 STYLE MODE SOMBRE : Appliquer les styles appropriés pour l'édition
            const isDarkMode =
              document.documentElement.getAttribute("data-theme") === "dark";
            if (isDarkMode) {
              textarea.style.backgroundColor = "#fbbf24"; // Jaune pour mode sombre
              textarea.style.color = "#000000"; // Texte noir pour la saisie
              textarea.style.border = "2px solid #f59e0b";
            }

            async function saveObservation(val) {
              // Marquer temporairement la cellule comme en cours de sauvegarde
              td.setAttribute("data-saving", "true");

              td.textContent = val || "-";
              td.dataset.edited = "true";

              // 🎨 RESTAURER LE STYLE MODE SOMBRE après sauvegarde
              if (isDarkMode) {
                td.style.backgroundColor = "#fbbf24"; // Retour au jaune
                td.style.color = "#1e293b"; // Retour au texte sombre
              }

              if (val && val.trim() !== "") {
                localStorage.setItem(localKey, val.trim());
              } else {
                localStorage.removeItem(localKey);
              }
              try {
                await fetch(`/deliveries/${delivery.id}/observation`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ observation: val }),
                });
                // Émettre l'événement WebSocket après la sauvegarde réussie
                if (ws && ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: "observation_update",
                      deliveryId: delivery.id,
                      observation: val,
                    })
                  );
                }
              } catch (err) {
                console.error("Erreur sauvegarde observation", err);
              } finally {
                // Retirer le marqueur de sauvegarde
                td.removeAttribute("data-saving");
              }
            }
            textarea.onkeydown = function (ev) {
              if (ev.key === "Enter") {
                saveObservation(textarea.value);
              }
            };
            textarea.onblur = function () {
              saveObservation(textarea.value);
            };
            td.textContent = "";
            td.appendChild(textarea);
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd =
              textarea.value.length;
          };
        } else {
          // Liste des colonnes à convertir en MAJUSCULES
          const upperCaseColumns = [
            "employee_name",
            "client_name",
            "client_phone",
            "container_number",
            "lieu",
            "container_foot_type",
            "container_type_and_content",
            "declaration_number",
            "bl_number",
            "dossier_number",
            "number_of_containers",
            "shipping_company",
            "weight",
            "ship_name",
            "circuit",
            "transporter_mode",
            "container_status",
            "observation",
          ];

          // Appliquer la transformation en majuscules si la colonne est dans la liste
          if (
            upperCaseColumns.includes(col.id) &&
            value &&
            value !== "-" &&
            typeof value === "string"
          ) {
            td.textContent = value.toUpperCase();
          } else {
            td.textContent = value;
          }
          // Tooltip custom au survol si texte tronqué
          td.addEventListener("mouseenter", function (e) {
            setTimeout(() => {
              if (
                td.offsetWidth < td.scrollWidth &&
                td.textContent.trim() !== "-" &&
                td.textContent.length > 0
              ) {
                let tooltip = document.createElement("div");
                tooltip.className = "custom-tooltip-floating";
                tooltip.textContent = td.textContent;
                document.body.appendChild(tooltip);
                const rect = td.getBoundingClientRect();
                tooltip.style.position = "fixed";
                tooltip.style.left = rect.left + window.scrollX + 10 + "px";
                tooltip.style.top = rect.top + window.scrollY - 8 + "px";
                tooltip.style.background = "#fff";
                tooltip.style.color = "#1e293b";
                tooltip.style.padding = "8px 16px";
                tooltip.style.borderRadius = "10px";
                tooltip.style.boxShadow = "0 4px 18px rgba(30,41,59,0.13)";
                tooltip.style.fontSize = "1em";
                tooltip.style.fontWeight = "500";
                tooltip.style.zIndex = 99999;
                tooltip.style.maxWidth = "420px";
                tooltip.style.wordBreak = "break-word";
                tooltip.style.pointerEvents = "none";
                tooltip.style.opacity = "0";
                tooltip.style.transition = "opacity 0.18s";
                setTimeout(() => {
                  tooltip.style.opacity = "1";
                }, 10);
                td._customTooltip = tooltip;
              }
            }, 0);
          });
          td.addEventListener("mouseleave", function () {
            if (td._customTooltip) {
              td._customTooltip.style.opacity = "0";
              setTimeout(() => {
                if (td._customTooltip && td._customTooltip.parentNode) {
                  td._customTooltip.parentNode.removeChild(td._customTooltip);
                  td._customTooltip = null;
                }
              }, 120);
            }
          });
        }
      }
      tr.appendChild(td);
      // Fonction pour afficher le menu déroulant TC (popup) : uniquement infos TC, responsive
      function showContainerDetailPopup(delivery, containerNumber) {
        const oldPopup = document.getElementById("containerDetailPopup");
        if (oldPopup) oldPopup.remove();
        const overlay = document.createElement("div");
        overlay.id = "containerDetailPopup";
        overlay.style.position = "fixed";
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(30,41,59,0.45)";
        // Mode sombre : overlay plus foncé
        const isDark =
          document.documentElement.getAttribute("data-theme") === "dark";
        overlay.style.background = isDark
          ? "rgba(15,23,42,0.75)"
          : "rgba(30,41,59,0.45)";
        overlay.style.zIndex = 9999;
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        const box = document.createElement("div");
        box.style.background = isDark ? "#1e293b" : "#fff";
        box.style.borderRadius = window.innerWidth <= 600 ? "10px" : "16px";
        box.style.boxShadow = isDark
          ? "0 12px 40px rgba(59,130,246,0.13)"
          : "0 12px 40px rgba(30,41,59,0.22)";
        box.style.maxWidth = window.innerWidth <= 600 ? "98vw" : "420px";
        box.style.width = window.innerWidth <= 600 ? "98vw" : "96vw";
        box.style.maxHeight = window.innerWidth <= 600 ? "96vh" : "92vh";
        box.style.overflowY = "auto";
        box.style.padding = "0";
        box.style.position = "relative";
        box.style.display = "flex";
        box.style.flexDirection = "column";
        const header = document.createElement("div");
        header.style.background = isDark ? "#ffd600" : "#2563eb";
        header.style.color = isDark ? "#1e293b" : "#fff";
        header.style.padding =
          window.innerWidth <= 600
            ? "12px 12px 8px 12px"
            : "18px 28px 12px 28px";
        header.style.fontWeight = "bold";
        header.style.fontSize =
          window.innerWidth <= 600 ? "1.01rem" : "1.15rem";
        header.style.display = "flex";
        header.style.flexDirection = "column";
        header.style.borderTopLeftRadius =
          window.innerWidth <= 600 ? "10px" : "16px";
        header.style.borderTopRightRadius =
          window.innerWidth <= 600 ? "10px" : "16px";
        header.innerHTML = `
          <div style='margin-bottom:2px;'>
            <span style='font-size:1.08em;'>${
              delivery.employee_name || "-"
            }</span>
          </div>
          <div style='font-size:0.98em;font-weight:400;'>
            Client : <span style='color:#111;font-weight:600;'>${
              delivery.client_name || "-"
            }</span><br>
            Dossier : <span style='color:#111;font-weight:600;'>${
              delivery.dossier_number || "-"
            }</span>  
          </div>
        `;
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.background = "#dc3545";
        closeBtn.style.border = "none";
        closeBtn.style.color = "#fff";
        closeBtn.style.borderRadius = "50%";
        closeBtn.style.width = "35px";
        closeBtn.style.height = "35px";
        closeBtn.style.display = "flex";
        closeBtn.style.alignItems = "center";
        closeBtn.style.justifyContent = "center";
        closeBtn.style.transition = "all 0.2s ease";
        closeBtn.style.fontSize =
          window.innerWidth <= 600 ? "1.5rem" : "2.1rem";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = window.innerWidth <= 600 ? "4px" : "10px";
        closeBtn.style.right = window.innerWidth <= 600 ? "8px" : "18px";
        closeBtn.style.zIndex = "10001";
        closeBtn.setAttribute("aria-label", "Fermer");
        closeBtn.setAttribute("data-allow-admin", "true");
        closeBtn.classList.add("admin-allowed-button");

        // Effet hover
        closeBtn.addEventListener("mouseenter", () => {
          closeBtn.style.background = "#c82333";
          closeBtn.style.transform = "scale(1.1)";
        });
        closeBtn.addEventListener("mouseleave", () => {
          closeBtn.style.background = "#dc3545";
          closeBtn.style.transform = "scale(1)";
        });

        closeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          overlay.remove();
        };
        header.appendChild(closeBtn);
        box.appendChild(header);
        const content = document.createElement("div");
        content.style.padding =
          window.innerWidth <= 600
            ? "14px 10px 14px 10px"
            : "24px 24px 24px 24px";
        content.style.background = isDark ? "#232f43" : "#f8fafc";
        content.style.flex = "1 1 auto";
        content.style.overflowY = "auto";
        const tcNum = document.createElement("div");
        tcNum.style.fontSize = window.innerWidth <= 600 ? "1.08em" : "1.25em";
        tcNum.style.fontWeight = "bold";
        tcNum.style.marginBottom = window.innerWidth <= 600 ? "10px" : "18px";
        tcNum.style.textAlign = "center";
        tcNum.innerHTML = `Numéro du conteneur : <span style='color:${
          isDark ? "#ffd600" : "#2563eb"
        };'>${containerNumber}</span>`;
        content.appendChild(tcNum);
        box.appendChild(content);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
        // Scroll popup sur mobile si besoin
        if (window.innerWidth <= 600) {
          box.style.overflowY = "auto";
          content.style.maxHeight = "60vh";
        }
      }
    });
    tableBodyElement.appendChild(tr);
  });
}

// Fonction pour générer les en-têtes du tableau Agent Acconier
function renderAgentTableHeaders(tableElement, deliveries) {
  const thead = tableElement.querySelector("thead");
  thead.innerHTML = "";
  const headerRow = document.createElement("tr");
  AGENT_TABLE_COLUMNS.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label;
    th.setAttribute("data-col-id", col.id);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
}

// Fonction pour générersgv le tableau Agent Acconier complet
function renderAgentTableFull(deliveries, tableBodyElement) {
  const table = tableBodyElement.closest("table");
  // Filtrer les livraisons à afficher dans le tableau principal :
  // On ne montre que les livraisons où au moins un BL n'est pas en 'mise_en_livraison'
  const deliveriesToShow = deliveries.filter((delivery) => {
    // Affiche TOUS les dossiers dont le statut acconier est 'en attente de paiement'
    if (delivery.delivery_status_acconier === "en attente de paiement") {
      return true;
    }
    // Sinon, on garde l'ancien filtrage BL
    let blList = [];
    if (Array.isArray(delivery.bl_number)) {
      blList = delivery.bl_number.filter(Boolean);
    } else if (typeof delivery.bl_number === "string") {
      blList = delivery.bl_number.split(/[,;\s]+/).filter(Boolean);
    }
    let blStatuses = blList.map((bl) =>
      delivery.bl_statuses && delivery.bl_statuses[bl]
        ? delivery.bl_statuses[bl]
        : "aucun"
    );
    // Si tous les BL sont en 'mise_en_livraison'
    const tousEnLivraison = blStatuses.every((s) => s === "mise_en_livraison");

    // Si le dossier disparaît du tableau (tous les BL en livraison), on l'ajoute à la liste des mises en livraison
    if (tousEnLivraison) {
      const dossierToSave = {
        ...delivery,
        container_number: delivery.container_number || "",
        client_name: delivery.client_name || delivery.client || "",
        status: "Mis en livraison",
        bl_numbers: blList.join(", "),
        date_mise_en_liv: new Date().toISOString(),
        date_do: delivery.date_do || null,
        date_badt: delivery.date_badt || null,
        date_paiement_acconage: delivery.date_paiement_acconage || null,
        date_echange_bl: delivery.date_echange_bl || null,
      };
      ajouterDossierMiseEnLiv(dossierToSave);
    }

    // Ne pas afficher dans le tableau principal si tous les BL sont en livraison
    return !tousEnLivraison;
  });
  // Rafraîchissement du tableau :
  if (deliveriesToShow.length === 0) {
    if (table) table.style.display = "none";
    let noDataMsg = document.getElementById("noDeliveriesMsg");
    if (!noDataMsg) {
      noDataMsg = document.createElement("div");
      noDataMsg.id = "noDeliveriesMsg";
      noDataMsg.style.textAlign = "center";
      noDataMsg.style.padding = "48px 0 32px 0";
      noDataMsg.style.fontSize = "1.25em";
      noDataMsg.style.color = "#64748b";
      noDataMsg.style.fontWeight = "500";
      noDataMsg.textContent = "Aucune opération à cette date.";
      tableBodyElement.parentNode.insertBefore(noDataMsg, tableBodyElement);
    } else {
      noDataMsg.style.display = "block";
    }
    tableBodyElement.innerHTML = "";
  } else {
    if (table) table.style.display = "table";
    const noDataMsg = document.getElementById("noDeliveriesMsg");
    if (noDataMsg) noDataMsg.style.display = "none";
    // Utiliser la nouvelle fonction d'en-tête
    if (table) {
      renderAgentTableHeaders(table, deliveriesToShow);
    }
    renderAgentTableRows(deliveriesToShow, tableBodyElement);
  }
  // Fin de renderAgentTableFull

  // --- Ajout : écouteur pour restaurer une ligne ramenée au Resp. Acconier ---
  if (typeof window.respAcconierRestoreListener === "undefined") {
    window.respAcconierRestoreListener = true;
    window.addEventListener("restoreToRespAcconier", async function (e) {
      // Recharge toutes les livraisons et met à jour le tableau instantanément
      if (
        typeof loadAllDeliveries === "function" &&
        typeof updateTableForDateRange === "function"
      ) {
        await loadAllDeliveries();
        // Utilise la plage de dates actuelle
        const dateStartInput = document.getElementById(
          "mainTableDateStartFilter"
        );
        const dateEndInput = document.getElementById("mainTableDateEndFilter");
        const dateStart = dateStartInput ? dateStartInput.value : null;
        const dateEnd = dateEndInput ? dateEndInput.value : null;
        updateTableForDateRange(dateStart, dateEnd);
      }
      // Affiche une alerte visuelle pour informer le responsable acconier
      const oldAlert = document.getElementById("restore-dossier-alert");
      if (oldAlert) oldAlert.remove();
      const alert = document.createElement("div");
      alert.id = "restore-dossier-alert";
      alert.textContent =
        "Le responsable de livraison a ramené un dossier dans votre tableau.";
      alert.style.position = "fixed";
      alert.style.top = "80px";
      alert.style.left = "50%";
      alert.style.transform = "translateX(-50%)";
      alert.style.background = "linear-gradient(90deg,#eab308 0%,#2563eb 100%)";
      alert.style.color = "#fff";
      alert.style.fontWeight = "bold";
      alert.style.fontSize = "1.12em";
      alert.style.padding = "18px 38px";
      alert.style.borderRadius = "16px";
      alert.style.boxShadow = "0 6px 32px rgba(37,99,235,0.18)";
      alert.style.zIndex = 99999;
      alert.style.opacity = "0";
      alert.style.transition = "opacity 0.3s";
      document.body.appendChild(alert);
      setTimeout(() => {
        alert.style.opacity = "1";
      }, 10);
      setTimeout(() => {
        alert.style.opacity = "0";
        setTimeout(() => alert.remove(), 400);
      }, 2600);
    });
    // Synchronisation inter-onglets via localStorage
    window.addEventListener("storage", function (event) {
      if (event.key === "restoreToRespAcconierEvent" && event.newValue) {
        // Recharge et met à jour le tableau instantanément
        if (
          typeof loadAllDeliveries === "function" &&
          typeof updateTableForDateRange === "function"
        ) {
          loadAllDeliveries().then(() => {
            const dateStartInput = document.getElementById(
              "mainTableDateStartFilter"
            );
            const dateEndInput = document.getElementById(
              "mainTableDateEndFilter"
            );
            const dateStart = dateStartInput ? dateStartInput.value : null;
            const dateEnd = dateEndInput ? dateEndInput.value : null;
            updateTableForDateRange(dateStart, dateEnd);
          });
        }
        // Affiche l'alerte visuelle
        const oldAlert = document.getElementById("restore-dossier-alert");
        if (oldAlert) oldAlert.remove();
        const alert = document.createElement("div");
        alert.id = "restore-dossier-alert";
        alert.textContent =
          "Le responsable de livraison a ramené un dossier dans votre tableau.";
        alert.style.position = "fixed";
        alert.style.top = "80px";
        alert.style.left = "50%";
        alert.style.transform = "translateX(-50%)";
        alert.style.background =
          "linear-gradient(90deg,#eab308 0%,#2563eb 100%)";
        alert.style.color = "#fff";
        alert.style.fontWeight = "bold";
        alert.style.fontSize = "1.12em";
        alert.style.padding = "18px 38px";
        alert.style.borderRadius = "16px";
        alert.style.boxShadow = "0 6px 32px rgba(37,99,235,0.18)";
        alert.style.zIndex = 99999;
        alert.style.opacity = "0";
        alert.style.transition = "opacity 0.3s";
        document.body.appendChild(alert);
        setTimeout(() => {
          alert.style.opacity = "1";
        }, 10);
        setTimeout(() => {
          alert.style.opacity = "0";
          setTimeout(() => alert.remove(), 400);
        }, 2600);
      }
    });
  }

  // --- Correction : Rafraîchir le tableau après mise en livraison d'un BL ---
  // On patch la fonction showBLDetailPopup pour déclencher updateTableForDateRange après modification
  // (On ne touche pas à la déclaration d'origine, on monkey-patch si déjà défini)
  if (typeof window.showBLDetailPopupPatched === "undefined") {
    window.showBLDetailPopupPatched = true;
    const oldRenderAgentTableRows = renderAgentTableRows;
    renderAgentTableRows = function (deliveries, tableBodyElement) {
      oldRenderAgentTableRows(deliveries, tableBodyElement);
      // Patcher tous les boutons "Enregistrer le statut" dans les popups BL pour rafraîchir le tableau après MAJ
      setTimeout(() => {
        document.querySelectorAll("#blDetailPopup button").forEach((btn) => {
          if (btn._patched) return;
          if (
            btn.textContent &&
            btn.textContent.includes("Enregistrer le statut")
          ) {
            btn._patched = true;
            const oldOnClick = btn.onclick;
            btn.onclick = async function (e) {
              if (oldOnClick) await oldOnClick.call(this, e);
              // Après la MAJ, on rafraîchit le tableau (date courante)
              const dateStartInput = document.getElementById(
                "mainTableDateStartFilter"
              );
              const dateEndInput = document.getElementById(
                "mainTableDateEndFilter"
              );
              if (typeof updateTableForDateRange === "function") {
                updateTableForDateRange(
                  dateStartInput ? dateStartInput.value : "",
                  dateEndInput ? dateEndInput.value : ""
                );
              }
            };
          }
        });
      }, 100);
    };
  }
}

// Fonction de synchronisation vers le tableau de suivi
function syncToTableauSuivie(deliveryId, dateField, dateValue) {
  try {
    // Vérifier si on est dans la page de tableau de suivi
    if (typeof window.parent !== "undefined" && window.parent !== window) {
      // Communication avec la fenêtre parent si on est dans un iframe
      window.parent.postMessage(
        {
          type: "updateDateField",
          deliveryId: deliveryId,
          field: dateField,
          value: dateValue,
        },
        "*"
      );
    } else {
      // Si on est dans la même page, chercher le tableau
      const tableBody = document.querySelector("#deliveryTable tbody");
      if (tableBody) {
        const rows = tableBody.querySelectorAll("tr");
        rows.forEach((row) => {
          const idCell = row.querySelector('td[data-field="id"]');
          if (idCell && idCell.textContent.trim() === deliveryId.toString()) {
            // Trouver la colonne correspondante et mettre à jour
            let columnIndex;
            switch (dateField) {
              case "date_do":
                columnIndex = 32; // Index de la colonne Date de DO
                break;
              case "date_badt":
                columnIndex = 33; // Index de la colonne Date de BADT
                break;
            }

            if (columnIndex !== undefined) {
              const cells = row.querySelectorAll("td");
              if (cells[columnIndex]) {
                // Formater la date au format français pour l'affichage
                const formattedDate = dateValue
                  ? new Date(dateValue).toLocaleDateString("fr-FR")
                  : "";
                cells[columnIndex].textContent = formattedDate;
              }
            }
          }
        });
      }
    }
  } catch (error) {
    console.log("Synchronisation non critique:", error);
  }
}

// Fonction pour nettoyer le localStorage temporaire après sauvegarde réussie
function clearTempDatesFromStorage(deliveryId) {
  try {
    localStorage.removeItem(`temp_date_do_${deliveryId}`);
    localStorage.removeItem(`temp_date_badt_${deliveryId}`);
    localStorage.removeItem(`temp_paiement_acconage_${deliveryId}`);
    console.log(
      `Nettoyage localStorage temporaire pour livraison ${deliveryId}`
    );
  } catch (error) {
    console.log("Erreur lors du nettoyage localStorage:", error);
  }
}

//originale12345678910

// Initialisation du système d'édition
document.addEventListener("DOMContentLoaded", function () {
  // Charger les données éditées depuis localStorage
  loadEditedData();

  // Créer le bouton modifier
  setTimeout(() => {
    createEditModeButton();
  }, 500);
});

// Observer les changements dans le tableau pour recréer le bouton si nécessaire
const tableObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === "childList") {
      const table = document.getElementById("deliveriesTable");
      const button = document.getElementById("tableEditModeBtn");
      if (table && !button) {
        createEditModeButton();
      }
    }
  });
});

// Observer le body pour détecter les 12344 changements 1de SUI1coghchntenusdhsj1
const bodyElement = document.body;
if (bodyElement) {
  tableObserver.observe(bodyElement, {
    childList: true,
    subtree: true,
  });
}

// 🆕 INITIALISATION POUR L'EXTRACTION DES DATES MANQUANTES
document.addEventListener("DOMContentLoaded", function () {
  // Écouter l'ouverture de la modal "Mise en Livraison"
  const modalMiseEnLiv = document.getElementById("modalMiseEnLiv");
  if (modalMiseEnLiv) {
    modalMiseEnLiv.addEventListener("shown.bs.modal", function () {
      console.log(
        "📅 [PRODUCTION-READY] Modal Mise en Livraison ouverte - Extraction des dates manquantes...",
        {
          environment: window.location.hostname.includes('render') ? 'PRODUCTION (Render)' : 'LOCAL',
          hostname: window.location.hostname,
          currentFlag: dateExtractionSessionProcessed
        }
      );
      dateExtractionSessionProcessed = false; // Réinitialiser le flag pour cette ouverture
      updateExistingDossiersWithMissingDates();
      refreshMiseEnLivList();
    });
  }
});

// 🆕 FONCTION POUR COPIER LES NUMÉROS DE CONTENEUR
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    // Méthode moderne pour HTTPS
    navigator.clipboard
      .writeText(text)
      .then(() => {
        displayCopyNotification(`Conteneur ${text} copié !`);
      })
      .catch((err) => {
        console.error("Erreur de copie:", err);
        fallbackCopyTextToClipboard(text);
      });
  } else {
    // Méthode de fallback pour HTTP
    fallbackCopyTextToClipboard(text);
  }
}

// Fonction de fallback pour la copie
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    if (successful) {
      displayCopyNotification(`Conteneur ${text} copié !`);
    } else {
      console.error("Copie échouée");
    }
  } catch (err) {
    console.error("Erreur de copie:", err);
  } finally {
    document.body.removeChild(textArea);
  }
}

// Fonction pour afficher la notification de copie
function displayCopyNotification(message) {
  // Essayer d'utiliser showNotification si elle existe
  if (typeof showNotification === "function") {
    showNotification(message, "success");
    return;
  }

  // Sinon créer une notification simple
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 9999;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
  `;
  notification.innerHTML = `<i class="fas fa-check me-2"></i>${message}`;

  // Ajouter les styles d'animation
  if (!document.querySelector("#copyNotificationStyles")) {
    const style = document.createElement("style");
    style.id = "copyNotificationStyles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Supprimer après 3 secondes
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

/***MON JESUS EST LE SEUL DIEU */
