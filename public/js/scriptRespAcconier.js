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
    window.deliveries = data;
    renderDeliveriesTable(data);
  } catch (err) {
    console.error(err);
    document.getElementById("deliveries-table-container").innerHTML =
      '<div class="error">Impossible de charger les données</div>';
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
    html += `<td>${delivery.dateHeure || ""}</td>`;
    html += `<td>${delivery.agent || ""}</td>`;
    html += `<td>${delivery.clientNom || ""}</td>`;
    html += `<td>${delivery.clientTel || ""}</td>`;
    html += `<td>${delivery.numeroTC || ""}</td>`;
    html += `<td>${delivery.lieu || ""}</td>`;
    html += `<td>${delivery.typeConteneur || ""}</td>`;
    html += `<td>${delivery.contenu || ""}</td>`;
    html += `<td>${delivery.numeroDeclaration || ""}</td>`;
    html += `<td>${delivery.numeroBL || ""}</td>`;
    html += `<td>${delivery.numeroDossier || ""}</td>`;
    html += `<td>${delivery.nombreConteneurs || ""}</td>`;
    html += `<td>${delivery.compagnieMaritime || ""}</td>`;
    html += `<td>${delivery.poids || ""}</td>`;
    html += `<td>${delivery.nomNavire || ""}</td>`;
    html += `<td>${delivery.circuit || ""}</td>`;
    html += `<td>${delivery.modeTransport || ""}</td>`;
    html += `<td>${delivery.statutDossier || ""}</td>`;
    html += `<td>${delivery.observations || ""}</td>`;
    html += "</tr>";
  });
  tbody.innerHTML = html;
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
