function normalizeDateToMidnight(date) {
  if (!(date instanceof Date)) date = new Date(date);
  date.setHours(0, 0, 0, 0);
  return date;
}

function filterDeliveriesByDate(deliveries, selectedDate) {
  const dateToCompare = normalizeDateToMidnight(selectedDate);
  return deliveries.filter((d) => {
    let dDate = d.created_at || d.delivery_date;
    if (!dDate) return false;
    dDate = normalizeDateToMidnight(new Date(dDate));
    return dDate.getTime() === dateToCompare.getTime();
  });
}
function injectLivTableCSS() {
  const styleTC = document.createElement("style");
  styleTC.textContent = `
#respLivTable thead th:not([data-col-id='container_number']) {
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1em;
  font-weight: bold;
  background: #0e274eff;
  color: #fff;
  border-bottom: 2px solid #2563eb;
  text-align: center;
  vertical-align: middle;
}
#respLivTable tbody td:not(.tc-multi-cell):not([data-col-id='container_number']) {
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
#respLivTableBody .tc-tag {
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
#respLivTableBody .tc-tags-btn {
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
#respLivTableBody .tc-popup {
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
#respLivTableBody .tc-popup-item {
  padding: 6px 18px;
  cursor: pointer;
  font-size: 0.98em;
  color: #2563eb;
  border-bottom: 1px solid #f3f4f6;
}
#respLivTableBody .tc-popup-item:last-child {
  border-bottom: none;
}
@media (max-width: 900px) {
  #respLivTable thead th:not([data-col-id='container_number']),
  #respLivTable tbody td:not(:nth-child(6)) {
    max-width: 90px;
    font-size: 0.95em;
  }
}
@media (max-width: 600px) {
  #respLivTable thead th:not([data-col-id='container_number']),
  #respLivTable tbody td:not(:nth-child(6)) {
    max-width: 60px;
    font-size: 0.92em;
  }
}
`;
  document.head.appendChild(styleTC);
}
// scriptRespLiv.js
// Gère le filtrage par date, l'affichage dynamique et toutes les fonctionnalités avancées du tableau Livraison

const LIV_TABLE_COLUMNS = [
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
  { id: "statut", label: "Statut" },
  { id: "observation", label: "Observation" },
];
function renderLivTableRows(deliveries, tableBodyElement) {
  if (deliveries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = LIV_TABLE_COLUMNS.length;
    cell.textContent = "Aucune opération à cette date.";
    cell.className = "text-center text-muted";
    row.appendChild(cell);
    tableBodyElement.appendChild(row);
    return;
  }
  deliveries.forEach((delivery, i) => {
    const tr = document.createElement("tr");
    LIV_TABLE_COLUMNS.forEach((col, idx) => {
      const td = document.createElement("td");
      const editableCols = [
        "employee_name",
        "transporter",
        "inspector",
        "customs_agent",
        "driver",
        "driver_phone",
        "delivery_date",
        "statut",
        "observation",
      ];
      if (col.id === "row_number") {
        td.textContent = i + 1;
      } else if (editableCols.includes(col.id)) {
        td.innerHTML = `<input type="text" class="form-control" name="${col.id}" value="" placeholder="Saisir...">`;
      } else if (col.id === "date_display") {
        // Affiche la date réelle si disponible
        let dateValue = delivery.created_at || delivery.delivery_date || "";
        td.textContent = dateValue
          ? new Date(dateValue).toLocaleDateString()
          : "-";
      } else if (col.id === "container_number") {
        // Affiche le(s) numéro(s) TC(s)
        let tcList = [];
        if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
        }
        td.textContent = tcList.length ? tcList.join(", ") : "-";
      } else {
        td.textContent =
          delivery[col.id] !== undefined &&
          delivery[col.id] !== null &&
          delivery[col.id] !== ""
            ? delivery[col.id]
            : "-";
      }
      tr.appendChild(td);
    });
    tableBodyElement.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  injectLivTableCSS();
  const dateContainer = document.querySelector(".date-journalier");
  if (dateContainer) {
    let dateInput = document.getElementById("filtreDateJourLiv");
    if (!dateInput) {
      dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.id = "filtreDateJourLiv";
      dateInput.style =
        "margin-left:12px; padding:2px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:1em;";
      dateInput.valueAsDate = new Date();
      dateContainer.appendChild(dateInput);
    }
  }
  const tableBody = document.getElementById("respLivTableBody");
  const dateInput = document.getElementById("filtreDateJourLiv");

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

  function updateTableForDate(dateStr) {
    const filtered = filterDeliveriesByDate(allDeliveries, dateStr);
    renderLivTableRows(filtered, tableBody);
  }

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

// Fin du script
