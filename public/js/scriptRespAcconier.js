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
    // Rendu TC(s) identique à scriptSuivie.js : badges horizontaux, bouton +N, menu déroulant, pop-up info TC
    let tcHtml = "";
    let tcList = [];
    if (delivery.numero_tc) {
      if (Array.isArray(delivery.numero_tc)) {
        tcList = delivery.numero_tc.filter(Boolean);
      } else if (typeof delivery.numero_tc === "string") {
        tcList = delivery.numero_tc.split(/[,;\s]+/).filter(Boolean);
      }
    }
    if (tcList.length > 1) {
      tcHtml =
        `<button type='button' class='tc-tags-btn' style='background:none;border:none;padding:0;cursor:pointer;'>` +
        tcList
          .slice(0, 2)
          .map(
            (tc) =>
              `<span class='tc-tag' style='background:#2563eb;color:#fff;border-radius:6px;padding:2px 8px;margin-right:4px;font-weight:600;'>${tc}</span>`
          )
          .join("") +
        (tcList.length > 2
          ? `<span class='tc-tag tc-tag-more' style='background:#eab308;color:#78350f;border-radius:6px;padding:2px 8px;font-weight:600;'>+${
              tcList.length - 2
            }</span>`
          : "") +
        ` <i class='fas fa-chevron-down tc-chevron' style='color:#2563eb;'></i></button>`;
    } else if (tcList.length === 1) {
      tcHtml = `<span class='tc-tag' style='background:#2563eb;color:#fff;border-radius:6px;padding:2px 8px;font-weight:600;cursor:pointer;'>${tcList[0]}</span>`;
    } else {
      tcHtml = "-";
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
  // Gestion des interactions TC (badges, bouton +N, popup info)
  document.addEventListener("click", function (e) {
    // Multi-TC : bouton popup liste
    if (
      e.target.classList.contains("tc-tags-btn") ||
      (e.target.parentNode &&
        e.target.parentNode.classList &&
        e.target.parentNode.classList.contains("tc-tags-btn"))
    ) {
      const btn = e.target.classList.contains("tc-tags-btn")
        ? e.target
        : e.target.parentNode;
      const tr = btn.closest("tr");
      if (!tr) return;
      const idx = tr.rowIndex - 1; // -1 si header
      const delivery = window.lastDeliveries && window.lastDeliveries[idx];
      if (!delivery) return;
      let tcList = [];
      if (Array.isArray(delivery.numero_tc)) {
        tcList = delivery.numero_tc.filter(Boolean);
      } else if (typeof delivery.numero_tc === "string") {
        tcList = delivery.numero_tc.split(/[,;\s]+/).filter(Boolean);
      }
      // Crée le popup liste TC
      const popup = document.createElement("div");
      popup.className = "tc-popup";
      popup.style.position = "fixed";
      popup.style.background = "#fff";
      popup.style.border = "1.5px solid #2563eb";
      popup.style.borderRadius = "10px";
      popup.style.boxShadow = "0 6px 32px #2563eb22, 0 2px 8px #0001";
      popup.style.padding = "14px 18px 12px 18px";
      popup.style.fontSize = "1em";
      popup.style.color = "#222e3a";
      popup.style.minWidth = "180px";
      popup.style.zIndex = 99999;
      popup.innerHTML = tcList
        .map(
          (tc) =>
            `<div class='tc-popup-item' style='cursor:pointer;padding:6px 0;'>${tc}</div>`
        )
        .join("");
      document.body.appendChild(popup);
      // Positionne le popup sous le bouton
      const rect = btn.getBoundingClientRect();
      popup.style.left = rect.left + "px";
      popup.style.top = rect.bottom + 8 + "px";
      // Clic sur un TC : ouvre le détail
      popup.querySelectorAll(".tc-popup-item").forEach((item) => {
        item.onclick = function (ev) {
          ev.stopPropagation();
          popup.remove();
          showContainerDetailPopup(delivery, item.textContent);
        };
      });
      // Ferme si clic ailleurs
      setTimeout(() => {
        document.addEventListener("click", function hidePopup(ev) {
          if (!popup.contains(ev.target)) {
            popup.remove();
            document.removeEventListener("click", hidePopup);
          }
        });
      }, 10);
    }
    // Tag TC simple : ouvre le détail
    if (
      e.target.classList.contains("tc-tag") &&
      !e.target.classList.contains("tc-tag-more")
    ) {
      const tr = e.target.closest("tr");
      if (!tr) return;
      const idx = tr.rowIndex - 1;
      const delivery = window.lastDeliveries && window.lastDeliveries[idx];
      if (!delivery) return;
      showContainerDetailPopup(delivery, e.target.textContent);
    }
  });

  // Ajout de la fonction pour afficher la pop-up d'information détaillée sur le TC
  function showContainerDetailPopup(delivery, tc) {
    // Crée la pop-up (ou modale) d'information
    let popup = document.getElementById("tcInfoPopup");
    if (!popup) {
      popup = document.createElement("div");
      popup.id = "tcInfoPopup";
      popup.style.position = "fixed";
      popup.style.top = "50%";
      popup.style.left = "50%";
      popup.style.transform = "translate(-50%, -50%)";
      popup.style.background = "#fff";
      popup.style.border = "2px solid #2563eb";
      popup.style.borderRadius = "16px";
      popup.style.boxShadow = "0 8px 32px rgba(0,0,0,0.18)";
      popup.style.zIndex = "10001";
      popup.style.minWidth = "320px";
      popup.style.maxWidth = "90vw";
      popup.style.padding = "32px 24px";
      popup.innerHTML = "";
      document.body.appendChild(popup);
    }
    // Remplir le contenu de la pop-up
    popup.innerHTML = `
      <h3 style='color:#2563eb; margin-bottom:18px;'>Détail du conteneur</h3>
      <div style='font-size:1.1em; margin-bottom:12px;'>
        <strong>Numéro TC :</strong> <span style='color:#2563eb;'>${tc}</span><br>
        <strong>Statut :</strong> <span style='color:#334155;'>${
          delivery.statut_dossier || "-"
        }</span><br>
        <strong>Client :</strong> ${delivery.nom_client || "-"}<br>
        <strong>Type :</strong> ${delivery.type_conteneur || "-"}<br>
        <strong>Lieu :</strong> ${delivery.lieu || "-"}<br>
        <strong>Date :</strong> ${delivery.date || "-"}<br>
        <strong>Compagnie maritime :</strong> ${
          delivery.compagnie_maritime || "-"
        }<br>
        <strong>Poids :</strong> ${delivery.poids || "-"}<br>
        <strong>Observations :</strong> ${delivery.observations || "-"}
      </div>
      <div style='text-align:center; margin-top:18px;'>
        <button id='tcInfoCloseBtn' style='background:#2563eb; color:#fff; border:none; border-radius:8px; padding:8px 22px; font-size:1em; cursor:pointer;'>Fermer</button>
      </div>
    `;
    popup.style.display = "block";
    document.getElementById("tcInfoCloseBtn").onclick = function () {
      popup.style.display = "none";
    };
    // Fermer la pop-up si clic en dehors
    setTimeout(() => {
      document.addEventListener("mousedown", function handler(e) {
        if (!popup.contains(e.target)) {
          popup.style.display = "none";
          document.removeEventListener("mousedown", handler);
        }
      });
    }, 100);
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
        // Correction : suppression de la ligne 'y;'
        data = data.filter((d) => d.date && d.date.startsWith(dateFilter));
      }
      window.lastDeliveries = data;
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
