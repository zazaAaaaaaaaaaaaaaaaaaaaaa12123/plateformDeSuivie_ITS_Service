// Fonction utilitaire pour normaliser la date à minuit
function normalizeDateToMidnight(date) {
  if (!(date instanceof Date)) date = new Date(date);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Fonction principale pour afficher les livraisons filtrées par date
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
      // Filtrer sur N° Dossier ou N° BL
      let deliveriesSource = window.allDeliveries || [];
      let filtered = deliveriesSource.filter((delivery) => {
        let dossier = String(delivery.dossier_number || "").toLowerCase();
        let bls = [];
        if (Array.isArray(delivery.bl_number)) {
          bls = delivery.bl_number.map((b) => String(b).toLowerCase());
        } else if (typeof delivery.bl_number === "string") {
          bls = delivery.bl_number.split(/[,;\s]+/).map((b) => b.toLowerCase());
        }
        return dossier.includes(query) || bls.some((b) => b.includes(query));
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
      // Suppression de toute logique BL (Bill of Lading)
      // On ne traite plus les messages de statut BL ici
      // Si besoin d'autres traitements, les ajouter ici
    };
    ws.onerror = function () {};
    ws.onclose = function () {
      setTimeout(setupWebSocket, 2000);
    };
  }
  setupWebSocket();

  async function loadAllDeliveries() {
    try {
      const response = await fetch("/deliveries/status");
      const data = await response.json();
      if (data.success && Array.isArray(data.deliveries)) {
        allDeliveries = data.deliveries.map((delivery) => {
          // On ne touche pas à delivery.bl_statuses : il vient du backend et doit être conservé
          // Initialisation des statuts conteneurs si absent
          let tcList = [];
          if (Array.isArray(delivery.container_number)) {
            tcList = delivery.container_number.filter(Boolean);
          } else if (typeof delivery.container_number === "string") {
            tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
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
        // Synchronisation avec la variable globale utilisée dans renderAgentTableFull
        window.allDeliveries = allDeliveries;
      } else {
        allDeliveries = [];
        window.allDeliveries = [];
      }
    } catch (e) {
      console.error("Erreur lors du chargement des livraisons :", e);
      allDeliveries = [];
      window.allDeliveries = [];
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
          let dDate = delivery.delivery_date || delivery.created_at;
          if (dDate) {
            let dateObj = new Date(dDate);
            if (!isNaN(dateObj.getTime())) {
              value = dateObj.toLocaleDateString("fr-FR");
            } else if (typeof dDate === "string") {
              value = dDate;
            }
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

  // Fonction principale pour charger et afficher selon la plage de dates
  function updateTableForDateRange(dateStartStr, dateEndStr) {
    let filtered = filterDeliveriesByDateRange(dateStartStr, dateEndStr);
    console.log(
      "[DEBUG] updateTableForDateRange - livraisons filtrées:",
      filtered
    );
    // Tri du plus ancien au plus récent (ordre croissant)
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
    dateStartInput.value = sevenDaysAgoStr;
    dateEndInput.value = todayStr;
    loadAllDeliveries().then(() => {
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);
    });
    dateStartInput.addEventListener("change", () => {
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);
    });
    dateEndInput.addEventListener("change", () => {
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);
    });
  }
});
// Colonnes pour le tableau du responsable de livraison
const AGENT_TABLE_COLUMNS = [
  { id: "row_number", label: "N°" },
  { id: "date_display", label: "Date" },
  { id: "employee_name", label: "Agent Acconier" },
  { id: "client_name", label: "Nom Client" },
  { id: "client_phone", label: "Client (Tel)" },
  { id: "container_number", label: "Numéro TC(s)" },
  { id: "location", label: "Lieu" },
  { id: "container_type", label: "Type de conteneurs" },
  { id: "content", label: "Contenu" },
  { id: "declaration_number", label: "Numéro Déclaration" },
  { id: "dossier_number", label: "Numéro Dossier" },
  { id: "container_count", label: "NBR Conteneurs" },
  { id: "shipping_company", label: "Compagnie Maritime" },
  { id: "circuit", label: "Circuit" },
  { id: "transport_mode", label: "Mode de transport" },
  { id: "transporter", label: "Transporteur" },
  { id: "inspector", label: "Inspecteur" },
  { id: "customs_agent", label: "Agent en Douanes" },
  { id: "driver_name", label: "Chauffeur" },
  { id: "driver_phone", label: "Tel Chauffeur" },
  // ...
  { id: "status", label: "Statut" },
  { id: "observation", label: "Observations" },
];

// Fonction pour générer les lignes du tableau Agent Acconier
function renderAgentTableRows(deliveries, tableBodyElement) {
  tableBodyElement.innerHTML = "";
  deliveries.forEach((delivery, idx) => {
    const tr = document.createElement("tr");
    AGENT_TABLE_COLUMNS.forEach((col) => {
      const td = document.createElement("td");
      let value = "-";
      if (col.id === "row_number") {
        value = idx + 1;
        td.textContent = value;
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
        td.textContent = value;
      } else if (col.id === "status") {
        // Statut unique pour le responsable de livraison
        let tcList = [];
        if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
        }
        let allLivred = tcList.every(
          (tc) =>
            delivery.container_statuses &&
            delivery.container_statuses[tc] === "livre"
        );
        td.textContent = allLivred ? "Livré" : "Mise en livraison";
      } else {
        value = delivery[col.id] !== undefined ? delivery[col.id] : "-";
        td.textContent = value;
      }
      tr.appendChild(td);
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

// Fonction pour générer le tableau Agent Acconier complet
function renderAgentTableFull(deliveries, tableBodyElement) {
  const table = tableBodyElement.closest("table");
  // ...
  // Filtrer les livraisons à afficher dans le tableau du responsable de livraison :
  // On ne montre que les livraisons où au moins un conteneur est en 'mise_en_livraison'
  const deliveriesToShow = deliveries.filter((delivery) => {
    let tcList = [];
    if (Array.isArray(delivery.container_number)) {
      tcList = delivery.container_number.filter(Boolean);
    } else if (typeof delivery.container_number === "string") {
      tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
    }
    let tcStatuses = tcList.map((tc) =>
      delivery.container_statuses && delivery.container_statuses[tc]
        ? delivery.container_statuses[tc]
        : "aucun"
    );
    // On affiche uniquement si au moins un conteneur est en 'mise_en_livraison'
    return tcStatuses.some((s) => s === "mise_en_livraison");
  });
  console.log(
    "[DEBUG] renderAgentTableFull - deliveriesToShow (Respo Livraison):",
    deliveriesToShow
  );
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
}
//originale
