// scriptRespAcconier.js
// Gère le filtrage par date et la mise à jour automatique du champ date

document.addEventListener("DOMContentLoaded", function () {
  // Ajout du champ date en haut du tableau
  const dateContainer = document.querySelector(".date-journalier");
  if (dateContainer) {
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.id = "filtreDateJour";
    dateInput.style =
      "margin-left:12px; padding:2px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:1em;";
    dateInput.valueAsDate = new Date();
    dateContainer.appendChild(dateInput);
  }

  // Fonction pour formater la date en yyyy-mm-dd
  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  // Met à jour la date du jour affichée
  const date = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  document.getElementById("dateDuJour").textContent = date.toLocaleDateString(
    "fr-FR",
    options
  );

  // Fonction pour générer une ligne HTML à partir d'un objet livraison
  function createRow(delivery) {
    return `<tr>
      <td>${delivery.date || ""}</td>
      <td>${delivery.agent_acconier || ""}</td>
      <td>${delivery.nom_client || ""}</td>
      <td>${delivery.numero_client || ""}</td>
      <td>${delivery.numero_tc || ""}</td>
      <td>${delivery.lieu || ""}</td>
      <td>${delivery.type_conteneur || ""}</td>
      <td>${delivery.contenu || ""}</td>
      <td>${delivery.numero_declaration || ""}</td>
      <td>${delivery.numero_bl || ""}</td>
      <td>${delivery.numero_dossier || ""}</td>
      <td>${delivery.nbr_conteneurs || ""}</td>
      <td>${delivery.compagnie_maritime || ""}</td>
      <td>${delivery.poids || ""}</td>
      <td>${delivery.nom_navire || ""}</td>
      <td>${delivery.circuit || ""}</td>
      <td>${delivery.mode_transport || ""}</td>
      <td>${delivery.statut_dossier || ""}</td>
      <td>${delivery.observations || ""}</td>
    </tr>`;
  }

  // Fonction pour charger et afficher les données
  async function loadDeliveries(dateFilter = null) {
    const tableBody = document.getElementById("respAcconierTableBody");
    tableBody.innerHTML = `<tr><td colspan="19" class="text-center text-muted"><i class="fas fa-spinner fa-spin me-2"></i> Chargement...</td></tr>`;
    try {
      const res = await fetch("/api/deliveries");
      if (!res.ok) throw new Error("Erreur serveur");
      let data = await res.json();
      if (dateFilter) {
        data = data.filter((d) => d.date && d.date.startsWith(dateFilter));
      }
      if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="19" class="text-center text-info">Aucune donnée pour cette date.</td></tr>`;
      } else {
        tableBody.innerHTML = data.map(createRow).join("");
      }
    } catch (e) {
      tableBody.innerHTML = `<tr><td colspan="19" class="text-center text-danger">Erreur de chargement des données</td></tr>`;
    }
  }

  // Initialisation : charger toutes les données du jour
  loadDeliveries(formatDate(new Date()));

  // Filtrage par date
  const dateInput = document.getElementById("filtreDateJour");
  if (dateInput) {
    dateInput.addEventListener("change", function () {
      loadDeliveries(dateInput.value);
    });
  }

  // Met à jour automatiquement le champ date à chaque chargement de page
  if (dateInput) {
    dateInput.value = formatDate(new Date());
  }
});
