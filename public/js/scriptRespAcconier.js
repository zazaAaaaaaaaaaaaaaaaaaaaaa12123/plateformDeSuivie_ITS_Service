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
  const tbody = document.getElementById("deliveriesTableBody");
  if (!tbody) return;

  if (!deliveries || deliveries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center text-muted">
      <i class="fas fa-box-open me-1"></i> Aucune livraison enregistrée pour le moment.
    </td></tr>`;
    return;
  }

  let html = "";
  deliveries.forEach((delivery) => {
    html += "<tr>";
    html += `<td>${formatDateHeure(
      delivery.delivery_date,
      delivery.delivery_time
    )}</td>`;
    html += `<td>${delivery.employee_name || ""}</td>`;
    html += `<td>${delivery.client_name || ""}</td>`;
    html += `<td>${delivery.client_phone || ""}</td>`;
    html += `<td>${delivery.container_number || ""}</td>`;
    html += `<td>${delivery.lieu || ""}</td>`;
    html += `<td>${delivery.container_foot_type || ""}</td>`;
    html += `<td>${delivery.container_type_and_content || ""}</td>`;
    html += `<td>${delivery.declaration_number || ""}</td>`;
    html += `<td>${delivery.bl_number || ""}</td>`;
    html += `<td>${delivery.dossier_number || ""}</td>`;
    html += `<td>${delivery.number_of_containers || ""}</td>`;
    html += `<td>${delivery.shipping_company || ""}</td>`;
    html += `<td>${delivery.weight || ""}</td>`;
    html += `<td>${delivery.ship_name || ""}</td>`;
    html += `<td>${delivery.circuit || ""}</td>`;
    html += `<td>${delivery.transporter_mode || ""}</td>`;
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
    @media (max-width: 900px) {
      th, td { font-size: 12px; padding: 4px; }
    }
    .error { color: red; padding: 10px; }
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
