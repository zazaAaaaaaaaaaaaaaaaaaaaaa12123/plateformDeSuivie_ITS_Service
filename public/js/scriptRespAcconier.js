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

  // Fonction pour charger les données réelles depuis le backend
  async function loadDeliveries() {
    try {
      const response = await fetch("/api/deliveries"); // Adapte l'URL selon ton backend
      if (!response.ok)
        throw new Error("Erreur lors du chargement des livraisons");
      const data = await response.json();
      window.deliveries = Array.isArray(data) ? data : [];
      refreshTable();
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan='${AGENT_TABLE_COLUMNS.length}' class='text-center text-danger'>Erreur de chargement des livraisons</td></tr>`;
      console.error(err);
    }
  }

  // Fonction pour rafraîchir l'affichage selon la date sélectionnée
  function refreshTable() {
    const selectedDate = dateInput.value
      ? new Date(dateInput.value)
      : new Date();
    showDeliveriesByDate(window.deliveries, selectedDate, tableBody);
  }

  if (dateInput) {
    dateInput.addEventListener("change", refreshTable);
    // Charge les données réelles à l'initialisation
    loadDeliveries();
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
