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
      let value = "-";
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
    });
  });
  document.head.appendChild(styleTC);
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
