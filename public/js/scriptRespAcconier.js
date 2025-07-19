// scriptRespAcconier.js
// Gère le filtrage par date et la mise à jour automatique du champ date

document.addEventListener("DOMContentLoaded", function () {
  // Ajout d'un gestionnaire pour l'en-tête cliquable NUMÉRO TC(S)
  setTimeout(() => {
    const thTC = document.querySelector("th.tc-header");
    if (thTC) {
      thTC.style.cursor = "pointer";
      thTC.style.color = "#2563eb";
      thTC.title = "Cliquez pour une info sur le changement de statut";
      thTC.addEventListener("click", function () {
        document.getElementById("tcModalNum").textContent = "";
        document.getElementById("tcModalStatus").style.display = "none";
        document.querySelector(".tc-modal-title").textContent =
          "Sélectionnez un numéro TC dans le tableau pour changer son statut";
        document.getElementById("tcModal").style.display = "flex";
      });
    }
  }, 500);
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
  const dateDuJourElem = document.getElementById("dateDuJour");
  if (dateDuJourElem) {
    dateDuJourElem.textContent = date.toLocaleDateString("fr-FR", options);
  } else {
    console.warn("L'élément #dateDuJour est introuvable dans le DOM.");
  }

  // Fonction pour générer une ligne HTML à partir d'un objet livraison
  function createRow(delivery) {
    // Affichage de chaque TC comme badge individuel, menu déroulant uniquement sur '+N'
    let tcHtml = "";
    if (delivery.numero_tc) {
      const tcList = String(delivery.numero_tc)
        .split(",")
        .map((tc) => tc.trim())
        .filter(Boolean);
      if (tcList.length > 2) {
        // Affiche les deux premiers en badge, puis badge '+N' pour le reste
        tcHtml = tcList
          .slice(0, 2)
          .map(
            (tc) =>
              `<button class='tc-btn' data-tc='${tc}' data-delivery-id='${delivery.id}'>${tc}</button>`
          )
          .join("");
        tcHtml += `<button class='tc-dropdown-label tc-btn' data-delivery-id='${
          delivery.id
        }' data-tc-extra='${tcList
          .slice(2)
          .join(
            ","
          )}' style='background:#e0e7ff; color:#2563eb; border:1px solid #2563eb; margin-left:4px;'>+${
          tcList.length - 2
        }</button>`;
        tcHtml += `<div class='tc-dropdown-menu' style='display:none; position:absolute; background:#fff; border:1px solid #cbd5e1; border-radius:8px; box-shadow:0 4px 16px #2563eb22; z-index:1000; min-width:140px; top:32px; left:0;'>${tcList
          .slice(2)
          .map(
            (tc) =>
              `<div class='tc-dropdown-item' data-tc='${tc}' data-delivery-id='${delivery.id}' style='padding:8px 16px; cursor:pointer;'>${tc}</div>`
          )
          .join("")}</div>`;
      } else {
        tcHtml = tcList
          .map(
            (tc) =>
              `<button class='tc-btn' data-tc='${tc}' data-delivery-id='${delivery.id}'>${tc}</button>`
          )
          .join("");
      }
    }
    return `<tr>
      <td>${delivery.date || ""}</td>
      <td>${delivery.agent_acconier || ""}</td>
      <td>${delivery.nom_client || ""}</td>
      <td>${delivery.numero_client || ""}</td>
      <td class='tc-cell' style='position:relative;'>${tcHtml}</td>
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
  // Ajout de la modale dans le DOM (invisible au départ)
  const modalHtml = `
    <div id="tcModal" class="tc-modal-overlay" style="display:none;">
      <div class="tc-modal-content">
        <h3 class="tc-modal-title">Changer le statut du conteneur <span id="tcModalNum"></span></h3>
        <div class="tc-modal-select">
          <select id="tcModalStatus" class="tc-modal-select-input">
            <option value="Mise en livraison">Mise en livraison</option>
          </select>
        </div>
        <div class="tc-modal-actions">
          <button id="tcModalSave" class="tc-modal-btn-save">Valider</button>
          <button id="tcModalClose" class="tc-modal-btn-close">Annuler</button>
        </div>
      </div>
    </div>
    <style>
      .tc-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 9999;
      }
      .tc-modal-content {
        background: #fff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        padding: 32px 24px; min-width: 320px; max-width: 90vw; text-align: center;
        animation: tcModalFadeIn 0.3s;
      }
      @keyframes tcModalFadeIn { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }
      .tc-modal-title { font-size: 1.25em; margin-bottom: 18px; color: #1e293b; }
      .tc-modal-select-input { font-size: 1.08em; padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 18px; }
      .tc-modal-actions { display: flex; gap: 18px; justify-content: center; }
      .tc-modal-btn-save { background: #2563eb; color: #fff; border: none; border-radius: 8px; padding: 8px 22px; font-size: 1em; cursor: pointer; transition: background 0.2s; }
      .tc-modal-btn-save:hover { background: #1d4ed8; }
      .tc-modal-btn-close { background: #e5e7eb; color: #334155; border: none; border-radius: 8px; padding: 8px 22px; font-size: 1em; cursor: pointer; transition: background 0.2s; }
      .tc-modal-btn-close:hover { background: #cbd5e1; }
      .tc-btn {
        background: #f1f5f9; color: #2563eb; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px 10px; margin: 2px; font-size: 1em; cursor: pointer; transition: background 0.2s, color 0.2s;
      }
      .tc-btn:hover { background: #2563eb; color: #fff; }
    </style>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Gestion de la modale
  let currentTC = null;
  let currentDeliveryId = null;
  function openTcModal(tc, deliveryId) {
    currentTC = tc;
    currentDeliveryId = deliveryId;
    document.getElementById("tcModalNum").textContent = tc;
    document.getElementById("tcModalStatus").style.display = "inline-block";
    document.querySelector(".tc-modal-title").textContent =
      "Changer le statut du conteneur ";
    document.getElementById("tcModalStatus").value = "";
    document.getElementById("tcModal").style.display = "flex";
  }
  function closeTcModal() {
    document.getElementById("tcModal").style.display = "none";
    currentTC = null;
    currentDeliveryId = null;
  }
  document.getElementById("tcModalClose").onclick = closeTcModal;

  document.getElementById("tcModalSave").onclick = async function () {
    const status = document.getElementById("tcModalStatus").value;
    if (!status) {
      alert("Veuillez choisir un statut.");
      return;
    }
    // Envoi au backend
    try {
      const res = await fetch(
        `/deliveries/${currentDeliveryId}/container-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ containerNumber: currentTC, status }),
        }
      );
      if (!res.ok) throw new Error("Erreur serveur");
      closeTcModal();
      // Recharger les données après modification
      loadDeliveries(formatDate(new Date()));
    } catch (e) {
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  // Délégation d'événement pour les boutons TC
  // Gestion centralisée des interactions TC (badges, menu déroulant, popup)
  document.addEventListener("click", function (e) {
    // Ouvre le menu déroulant au clic sur le badge '+N'
    if (e.target.classList.contains("tc-dropdown-label")) {
      const cell = e.target.closest(".tc-cell");
      if (cell) {
        const menu = cell.querySelector(".tc-dropdown-menu");
        document.querySelectorAll(".tc-dropdown-menu").forEach((m) => {
          if (m !== menu) m.style.display = "none";
        });
        menu.style.display = menu.style.display === "block" ? "none" : "block";
        e.stopPropagation();
      }
    }
    // Clique sur un item du menu
    if (e.target.classList.contains("tc-dropdown-item")) {
      const tc = e.target.getAttribute("data-tc");
      const deliveryId = e.target.getAttribute("data-delivery-id");
      document
        .querySelectorAll(".tc-dropdown-menu")
        .forEach((m) => (m.style.display = "none"));
      openTcModal(tc, deliveryId);
      e.stopPropagation();
    }
    // Clique sur un badge TC unique
    if (e.target.classList.contains("tc-btn")) {
      const tc = e.target.getAttribute("data-tc");
      const deliveryId = e.target.getAttribute("data-delivery-id");
      openTcModal(tc, deliveryId);
      e.stopPropagation();
    }
    // Clique ailleurs : ferme tous les menus déroulants TC
    if (
      !e.target.classList.contains("tc-dropdown-label") &&
      !e.target.classList.contains("tc-dropdown-item")
    ) {
      document
        .querySelectorAll(".tc-dropdown-menu")
        .forEach((m) => (m.style.display = "none"));
    }
  });

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
