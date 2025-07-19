// scriptRespLiv.js
// Gère le filtrage par date et la mise à jour automatique du champ date pour le tableau Livraison

document.addEventListener("DOMContentLoaded", function () {
  // Ajout du champ date en haut du tableau
  const dateContainer = document.querySelector(".date-journalier");
  if (dateContainer) {
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.id = "filtreDateJourLiv";
    dateInput.style =
      "margin-left:12px; padding:2px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:1em;";
    dateInput.valueAsDate = new Date();
    dateContainer.appendChild(dateInput);
  }

  // Fonction pour formater la date en yyyy-mm-dd
  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  // Logique de filtrage (exemple, à adapter selon vos données dynamiques)
  const tableBody = document.getElementById("respLivTableBody");
  const dateInput = document.getElementById("filtreDateJourLiv");

  if (dateInput && tableBody) {
    dateInput.addEventListener("change", function () {
      const selectedDate = dateInput.value;
      // Ici, vous devrez filtrer les lignes du tableau selon la date sélectionnée
      // Exemple de logique :
      // for (let row of tableBody.rows) {
      //   const dateCell = row.cells[0];
      //   if (dateCell && dateCell.textContent.startsWith(selectedDate)) {
      //     row.style.display = '';
      //   } else {
      //     row.style.display = 'none';
      //   }
      // }
      // Pour l'instant, on affiche un message de démo :
      tableBody.innerHTML = `<tr><td colspan="24" class="text-center text-info">Filtrage pour la date : <b>${selectedDate}</b> (à connecter à vos données réelles)</td></tr>`;
    });
  }

  // Met à jour automatiquement le champ date à chaque chargement de page
  if (dateInput) {
    dateInput.value = formatDate(new Date());
  }
});
