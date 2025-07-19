// Colonnes à afficher dans le tableau
const columns = [
  "Date & Heure",
  "Responsable Acconier",
  "Client (Nom)",
  "Client (Tél)",
  "Numéro TC(s)",
  "Lieu",
  "Type Conteneur(pied)",
  "Contenu",
  "N° Déclaration",
  "N° BL",
  "N° Dossier",
  "Nombre de conteneurs",
  "Compagnie Maritime",
  "Poids",
  "Nom du navire",
  "Circuit",
  "Mode de Transport",
  "Statut dossier",
  "Observations",
];

// Fonction pour récupérer les données depuis le backend
async function fetchDeliveries() {
  try {
    const response = await fetch("/deliveries/status");
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des données");
    const data = await response.json();
    // Si la réponse est un objet avec deliveries, prendre le tableau
    const deliveries = Array.isArray(data) ? data : data.deliveries || [];
    window.deliveries = deliveries;
    renderDeliveriesTable(deliveries);
  } catch (err) {
    console.error(err);
    const tbody = document.getElementById("deliveriesTableBody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center text-danger">
        <i class='fas fa-exclamation-triangle me-1'></i> Impossible de charger les données
      </td></tr>`;
    }
  }
}

// Fonction pour générer le tableau HTML
function renderDeliveriesTable(deliveries) {
  const table = document.getElementById("deliveriesTable");
  const tbody = document.getElementById("deliveriesTableBody");
  if (!table || !tbody) return;

  // Génération dynamique du thead avec bandeaux colorés et sticky
  table.tHead.innerHTML = `
    <tr>
      <th colspan="20" id="agentAcconierHeader" class="header-agent-acconier" style="background:#007bff;color:#fff;text-transform:uppercase;">Agent Acconier</th>
    </tr>
    <tr id="deliveriesTableHead">
      <th class="sticky-col sticky-col-index">N°</th>
      <th>Date & Heure</th>
      <th class="sticky-col sticky-col-agent">Agent</th>
      <th>Client (Nom)</th>
      <th>Client (Tél)</th>
      <th>Numéro TC(s)</th>
      <th>Lieu</th>
      <th>Type Conteneur(pied)</th>
      <th>Contenu</th>
      <th>N° Déclaration</th>
      <th>N° BL</th>
      <th>N° Dossier</th>
      <th>Nombre de conteneurs</th>
      <th>Compagnie Maritime</th>
      <th>Poids</th>
      <th>Nom du navire</th>
      <th>Circuit</th>
      <th>Mode de Transport</th>
      <th>Statut dossier</th>
      <th>Observations</th>
    </tr>
  `;

  if (!deliveries || deliveries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="20" class="text-center text-muted">
      <i class="fas fa-box-open me-1"></i> Aucune livraison enregistrée pour le moment.
    </td></tr>`;
    return;
  }

  let html = "";
  deliveries.forEach((delivery, idx) => {
    html += "<tr>";
    // Colonnes à styler
    const cellStyles =
      "padding:10px 12px;border-radius:7px;font-size:1.08em;background:#fff;box-shadow:0 1px 4px rgba(30,41,59,0.04);";
    html += `<td class="sticky-col sticky-col-index" style="${cellStyles}">${
      idx + 1
    }</td>`;
    html += `<td style="${cellStyles}">${formatDateHeure(
      delivery.delivery_date,
      delivery.delivery_time
    )}</td>`;
    html += `<td class="sticky-col sticky-col-agent" style="${cellStyles}">${
      delivery.employee_name || ""
    }</td>`;
    html += `<td style="${cellStyles}">${delivery.client_name || ""}</td>`;
    html += `<td style="${cellStyles}">${delivery.client_phone || ""}</td>`;
    html += `<td style="${cellStyles}">${delivery.container_number || ""}</td>`;
    html += `<td style="${cellStyles}">${delivery.lieu || ""}</td>`;
    html += `<td style="${cellStyles}">${
      delivery.container_foot_type || ""
    }</td>`;
    html += `<td style="${cellStyles}">${
      delivery.container_type_and_content || ""
    }</td>`;
    html += `<td style="${cellStyles}">${
      delivery.declaration_number || ""
    }</td>`;
    html += `<td style="${cellStyles}">${delivery.bl_number || ""}</td>`;
    html += `<td style="${cellStyles}">${delivery.dossier_number || ""}</td>`;
    html += `<td style="${cellStyles}">${
      delivery.number_of_containers || ""
    }</td>`;
    html += `<td style="${cellStyles}">${delivery.shipping_company || ""}</td>`;
    html += `<td style="${cellStyles}">${delivery.weight || ""}</td>`;
    html += `<td style="${cellStyles}">${delivery.ship_name || ""}</td>`;
    html += `<td style="${cellStyles}">${delivery.circuit || ""}</td>`;
    html += `<td style="${cellStyles}">${delivery.transporter_mode || ""}</td>`;
    // Colonnes non stylées
    html += `<td>${delivery.delivery_status_acconier || ""}</td>`;
    html += `<td>${delivery.observation_acconier || ""}</td>`;
    html += "</tr>";
  });
  tbody.innerHTML = html;
}

// Fonction utilitaire pour afficher date + heure
function formatDateHeure(date, heure) {
  if (!date && !heure) return "";
  if (date && heure) return `${date} ${heure}`;
  return date || heure || "";
}

// Style responsive si besoin
function injectResponsiveStyle() {
  if (document.getElementById("resp-table-style")) return;
  const style = document.createElement("style");
  style.id = "resp-table-style";
  style.innerHTML = `
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; }
    .sticky-col { position: sticky; background: #f8f9fa; z-index: 2; }
    .sticky-col-index { left: 0; min-width: 50px; max-width: 70px; }
    .sticky-col-agent { left: 70px; min-width: 120px; max-width: 180px; }
    @media (max-width: 900px) {
      th, td { font-size: 12px; padding: 4px; }
    }
    .header-agent-acconier { background: #007bff !important; color: #fff !important; }
   
    .error { color: red; padding: 10px; }
    tr:hover td { background: #e3f2fd; }
  `;
  document.head.appendChild(style);
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  injectResponsiveStyle();
  fetchDeliveries();
  // Optionnel : rafraîchir toutes les X secondes
  // setInterval(fetchDeliveries, 60000);
});
