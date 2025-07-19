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
  const tableBody = document.getElementById("deliveriesTableBody");
  const dateInput = document.getElementById("mainTableDateFilter");

  // On charge toutes les livraisons une seule fois au chargement
  let allDeliveries = [];

  async function loadAllDeliveries() {
    try {
      const response = await fetch("/statistiques/acteurs");
      const data = await response.json();
      if (
        data.success &&
        data.responsableAcconier &&
        Array.isArray(data.responsableAcconier.details)
      ) {
        allDeliveries = data.responsableAcconier.details;
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
      // Normalisation du format
      let normalized = "";
      if (dDate.includes("/")) {
        // Format JJ/MM/AAAA
        const [j, m, a] = dDate.split("/");
        normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
      } else if (dDate.includes("-")) {
        // Format YYYY-MM-DD
        normalized = dDate;
      } else {
        normalized = dDate;
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
        cell.textContent = delivery[col.label] || "-";
        row.appendChild(cell);
      });
      tableBody.appendChild(row);
    });
  }

  // Fonction principale pour charger et afficher selon la date
  function updateTableForDate(dateStr) {
    const filtered = filterDeliveriesByDate(dateStr);
    renderTable(filtered);
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
const AGENT_TABLE_COLUMNS = [
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
];

// Fonction pour générer les lignes du tableau Agent Acconier
function renderAgentTableRows(deliveries, tableBodyElement) {
  tableBodyElement.innerHTML = "";
  deliveries.forEach((delivery) => {
    const tr = document.createElement("tr");
    AGENT_TABLE_COLUMNS.forEach((col) => {
      const td = document.createElement("td");
      if (col.id === "date_display") {
        // Affiche la date au format JJ/MM/AAAA
        let dDate = delivery.created_at || delivery.delivery_date;
        td.textContent = dDate
          ? new Date(dDate).toLocaleDateString("fr-FR")
          : "-";
      } else {
        td.textContent = delivery[col.id] || "-";
      }
      tr.appendChild(td);
    });
    tableBodyElement.appendChild(tr);
  });
}
