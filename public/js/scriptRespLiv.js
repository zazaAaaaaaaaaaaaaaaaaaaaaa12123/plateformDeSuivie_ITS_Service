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
  // Réduction de la largeur globale du tableau et centrage
  const styleTableGlobal = document.createElement("style");
  styleTableGlobal.textContent = `
    #deliveriesTable {
      max-width: 700px;
      width: 97vw;
      margin-left: auto;
      margin-right: auto;
      font-size: 0.88em;
    }
    @media (max-width: 800px) {
      #deliveriesTable {
        max-width: 99vw;
        font-size: 0.85em;
      }
    }
    @media (max-width: 600px) {
      #deliveriesTable {
        max-width: 100vw;
        font-size: 0.80em;
      }
    }
  `;
  document.head.appendChild(styleTableGlobal);
  // Ajout du style CSS pour badges, tags et menu déroulant des conteneurs (Numéro TC(s))
  const styleTC = document.createElement("style");
  styleTC.textContent = `
    #deliveriesTableBody .tc-tag {
      display: inline-block;
      margin-right: 4px;
      padding: 2px 8px;
      background: #2563eb;
      color: #fff;
      border-radius: 6px;
      font-size: 0.95em;
      font-weight: 500;
      white-space: nowrap;
      vertical-align: middle;
    }
    #deliveriesTableBody .tc-tags-btn {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: #4c628dff;
      border: 1px solid #2563eb;
      border-radius: 8px;
      padding: 2px 10px;
      cursor: pointer;
      font-size: 0.95em;
      white-space: nowrap;
    }
    #deliveriesTableBody .tc-popup {
      position: absolute;
      background: #fff;
      border: 1px solid #2563eb;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(30,41,59,0.13);
      padding: 8px 0;
      min-width: 120px;
      z-index: 1002;
      left: 0;
      top: 100%;
      white-space: nowrap;
    }
    #deliveriesTableBody .tc-popup-item {
      padding: 6px 18px;
      cursor: pointer;
      font-size: 0.98em;
      color: #2563eb;
      border-bottom: 1px solid #f3f4f6;
    }
    #deliveriesTableBody .tc-popup-item:last-child {
      border-bottom: none;
    }
    /* Largeur max réduite, retour à la ligne automatique, pas de text-overflow ni nowrap pour entêtes et cellules sauf Numéro TC(s) */
    #deliveriesTable thead th:not([data-col-id='container_number']) {
      max-width: 90px;
      min-width: 60px;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: break-word;
      font-size: 0.95em;
      font-weight: bold;
      background: #0e274eff;
      color: #fff;
      border-bottom: 2px solid #2563eb;
      text-align: center;
      vertical-align: middle;
      padding-left: 4px;
      padding-right: 4px;
    }
    #deliveriesTable tbody td:not(.tc-multi-cell):not([data-col-id='container_number']) {
      max-width: 90px;
      min-width: 60px;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: break-word;
      vertical-align: middle;
      padding-left: 4px;
      padding-right: 4px;
    }
    /* Styles spécifiques pour la colonne Numéro TC(s) pour ne jamais couper le contenu */
    #deliveriesTable thead th[data-col-id='container_number'] {
      max-width: none;
      min-width: 120px;
      white-space: nowrap;
      overflow: visible;
      font-size: 0.98em;
      font-weight: bold;
      background: #0e274eff;
      color: #fff;
      border-bottom: 2px solid #2563eb;
      text-align: center;
      vertical-align: middle;
      padding-left: 4px;
      padding-right: 4px;
    }
    #deliveriesTable tbody td.tc-multi-cell,
    #deliveriesTable tbody td[data-col-id='container_number'] {
      max-width: none;
      min-width: 120px;
      white-space: nowrap;
      overflow: visible;
      vertical-align: middle;
      padding-left: 4px;
      padding-right: 4px;
    }
    @media (max-width: 900px) {
      #deliveriesTable thead th:not([data-col-id='container_number']),
      #deliveriesTable tbody td:not(.tc-multi-cell):not([data-col-id='container_number']) {
        max-width: 60px;
        font-size: 0.92em;
      }
    }
    @media (max-width: 600px) {
      #deliveriesTable thead th:not([data-col-id='container_number']),
      #deliveriesTable tbody td:not(.tc-multi-cell):not([data-col-id='container_number']) {
        max-width: 40px;
        font-size: 0.90em;
      }
    }
  `;
  document.head.appendChild(styleTC);
  const tableBody = document.getElementById("deliveriesTableBody");
  const dateInput = document.getElementById("mainTableDateFilter");

  // On charge toutes les livraisons une seule fois au chargement
  let allDeliveries = [];

  async function loadAllDeliveries() {
    try {
      const response = await fetch("/deliveries/status");
      const data = await response.json();
      if (data.success && Array.isArray(data.deliveries)) {
        allDeliveries = data.deliveries;
      } else {
        allDeliveries = [];
      }
    } catch (e) {
      console.error("Erreur lors du chargement des livraisons :", e);
      allDeliveries = [];
    }
  }

  // Filtre les livraisons selon la date de livraison réelle (delivery_date)
  function filterDeliveriesByDate(dateStr) {
    return allDeliveries.filter((delivery) => {
      // On utilise delivery_date si disponible, sinon created_at
      let dDate =
        delivery["delivery_date"] ||
        delivery["created_at"] ||
        delivery["Date"] ||
        delivery["Date Livraison"];
      if (!dDate) return false;
      // Normalisation robuste du format
      let normalized = "";
      if (typeof dDate === "string") {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dDate)) {
          // Format JJ/MM/AAAA
          const [j, m, a] = dDate.split("/");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dDate)) {
          // Format YYYY-MM-DD
          normalized = dDate;
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(dDate)) {
          // Format JJ-MM-AAAA
          const [j, m, a] = dDate.split("-");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else {
          // Autre format, on tente une conversion
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
      return normalized === dateStr;
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

  // Fonction principale pour charger et afficher selon la date
  function updateTableForDate(dateStr) {
    const filtered = filterDeliveriesByDate(dateStr);
    // Utilisation du nouveau modèle dynamique
    const tableContainer = document.getElementById("deliveriesTableBody");
    if (tableContainer) {
      renderAgentTableFull(filtered, tableContainer);
    } else {
      console.error("L'élément #deliveriesTableBody n'existe pas dans le DOM.");
    }
  }

  // Initialisation : charge toutes les livraisons puis affiche la date du jour
  const today = new Date().toISOString().split("T")[0];
  if (dateInput) {
    dateInput.value = today;
    loadAllDeliveries().then(() => {
      updateTableForDate(today);
    });
    dateInput.addEventListener("change", (e) => {
      updateTableForDate(e.target.value);
    });
  }
});
// Colonnes strictes pour Agent Acconier
// Fonction robuste pour générer le tableau complet (en-tête + lignes)
function renderAgentTableFull(deliveries, tableBodyElement) {
  // Génération de l'en-tête
  const table = tableBodyElement.closest("table");
  if (table) {
    let thead = table.querySelector("thead");
    if (!thead) {
      thead = document.createElement("thead");
      table.insertBefore(thead, tableBodyElement);
    }
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
  // Génération des lignes
  if (deliveries.length === 0) {
    // Affiche une ligne structurée pour garder l'alignement des colonnes
    const tr = document.createElement("tr");
    AGENT_TABLE_COLUMNS.forEach((col, idx) => {
      const td = document.createElement("td");
      if (idx === 0) {
        td.textContent = "Aucune opération à cette date.";
        td.className = "text-center text-muted";
      } else {
        td.textContent = "-";
        td.className = "text-muted";
      }
      tr.appendChild(td);
    });
    tableBodyElement.innerHTML = "";
    tableBodyElement.appendChild(tr);
  } else {
    renderAgentTableRows(deliveries, tableBodyElement);
  }
}
const AGENT_TABLE_COLUMNS = [
  { id: "row_number", label: "N°" },
  { id: "date_display", label: "Date" },
  { id: "employee_name", label: "Agent Acconier" },
  { id: "client_name", label: "Nom Client" },
  { id: "client_phone", label: "Numéro Client" },
  { id: "container_number", label: "Numéro TC(s)" },
  { id: "lieu", label: "Lieu" },
  { id: "container_foot_type", label: "Type de Conteneur" },
  { id: "container_type_and_content", label: "Contenu" },
  { id: "declaration_number", label: "Numéro Déclaration" },
  { id: "bl_number", label: "Numéro BL" },
  { id: "dossier_number", label: "Numéro Dossier" },
  { id: "number_of_containers", label: "Nombre de Conteneurs" },
  { id: "shipping_company", label: "Compagnie Maritime" },
  { id: "weight", label: "Poids" },
  { id: "ship_name", label: "Nom du Navire" },
  { id: "circuit", label: "Circuit" },
  { id: "transporter_mode", label: "Mode de Transport" },
  { id: "visitor_agent_name", label: "NOM Agent visiteurs" },
  { id: "transporter", label: "TRANSPORTEUR" },
  { id: "inspector", label: "INSPECTEUR" },
  { id: "customs_agent", label: "AGENT EN DOUANES" },
  { id: "driver", label: "CHAUFFEUR" },
  { id: "driver_phone", label: "TEL CHAUFFEUR" },
  { id: "delivery_date", label: "DATE LIVRAISON" },
  { id: "acconier_status", label: "STATUT (du Respo.ACCONIER)" },
  { id: "statut", label: "Statut" },
  { id: "observation", label: "Observations" },
];

// Fonction pour générer les lignes du tableau Agent Acconier
// Fonction utilitaire pour créer une cellule de tableau propre avec gestion du wrapping et du contenu
function createAgentTableCell(col, value, delivery, i) {
  const td = document.createElement("td");
  td.setAttribute("data-col-id", col.id);
  // Gestion du wrapping et du style pour éviter la superposition
  td.style.whiteSpace = "normal";
  td.style.overflowWrap = "break-word";
  td.style.wordBreak = "break-word";
  td.style.verticalAlign = "middle";
  if (col.id === "row_number") {
    td.textContent = i + 1;
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
    td.textContent = value || "-";
  } else if (col.id === "container_number") {
    let tcList = [];
    if (Array.isArray(delivery.container_number)) {
      tcList = delivery.container_number.filter(Boolean);
    } else if (typeof delivery.container_number === "string") {
      tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
    }
    if (tcList.length > 1) {
      td.classList.add("tc-multi-cell");
      const btn = document.createElement("button");
      btn.className = "tc-tags-btn";
      btn.type = "button";
      btn.innerHTML =
        tcList
          .slice(0, 2)
          .map((tc) => `<span class=\"tc-tag\">${tc}</span>`)
          .join("") +
        (tcList.length > 2
          ? ` <span class=\"tc-tag tc-tag-more\">+${tcList.length - 2}</span>`
          : "") +
        ' <i class="fas fa-chevron-down tc-chevron"></i>';
      const popup = document.createElement("div");
      popup.className = "tc-popup";
      popup.style.display = "none";
      popup.innerHTML = tcList
        .map(
          (tc) =>
            `<div class=\"tc-popup-item\" style='cursor:pointer;'>${tc}</div>`
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
      });
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
      tag.onclick = (e) => {
        e.stopPropagation();
        showContainerDetailPopup(delivery, tcList[0]);
      };
      td.appendChild(tag);
    } else {
      td.textContent = "-";
    }
  } else if (col.id === "delivery_date") {
    let dDate = delivery.delivery_date;
    if (dDate) {
      let dateObj = new Date(dDate);
      if (!isNaN(dateObj.getTime())) {
        value = dateObj.toLocaleDateString("fr-FR");
      } else if (typeof dDate === "string") {
        value = dDate;
      }
    } else {
      value = "-";
    }
    td.textContent = value;
    if (col.id === "observation") {
      td.classList.add("observation-col");
    }
  } else {
    value =
      delivery[col.id] !== undefined &&
      delivery[col.id] !== null &&
      delivery[col.id] !== ""
        ? delivery[col.id]
        : "-";
    td.textContent = value;
    if (col.id === "observation") {
      td.classList.add("observation-col");
    }
  }
  return td;
}

function renderAgentTableRows(deliveries, tableBodyElement) {
  tableBodyElement.innerHTML = "";
  deliveries.forEach((delivery, i) => {
    const tr = document.createElement("tr");
    AGENT_TABLE_COLUMNS.forEach((col, idx) => {
      let value = "-";
      const td = createAgentTableCell(col, value, delivery, i);
      tr.appendChild(td);
    });
    tableBodyElement.appendChild(tr);
  });
}
