// --- Info-bulle personnalisée pour la colonne Statut (Numéro TC + statut avec icônes) ---
function createStatutTooltip() {
  let tooltip = document.getElementById("statutTableTooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "statutTableTooltip";
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = "100010";
    tooltip.style.background = "linear-gradient(90deg,#fffbe6 0%,#e6b800 100%)";
    tooltip.style.color = "#0e274e";
    tooltip.style.padding = "14px 22px 14px 18px";
    tooltip.style.borderRadius = "14px";
    tooltip.style.fontSize = "1.08em";
    tooltip.style.maxWidth = "440px";
    tooltip.style.boxShadow = "0 8px 32px #e6b80055, 0 2px 0 #fff inset";
    tooltip.style.display = "none";
    tooltip.style.pointerEvents = "none";
    tooltip.style.wordBreak = "break-word";
    tooltip.style.fontWeight = "500";
    tooltip.style.border = "2.5px solid #ffc107";
    tooltip.style.minWidth = "220px";
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function showStatutTooltip(delivery, x, y) {
  const tooltip = createStatutTooltip();
  // Génère le contenu : liste des TC + statut + icône
  let tcList = [];
  if (
    delivery.container_numbers_list &&
    Array.isArray(delivery.container_numbers_list)
  ) {
    tcList = delivery.container_numbers_list.filter(Boolean);
  } else if (Array.isArray(delivery.container_number)) {
    tcList = delivery.container_number.filter(Boolean);
  } else if (typeof delivery.container_number === "string") {
    tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
  }
  let statuses =
    delivery.container_statuses &&
    typeof delivery.container_statuses === "object"
      ? delivery.container_statuses
      : {};
  let html = `<div style='font-weight:700;font-size:1.13em;margin-bottom:7px;text-align:left;'>Détail des conteneurs :</div>`;
  if (tcList.length === 0) {
    html += `<div style='color:#b91c1c;'>Aucun conteneur</div>`;
  } else {
    html += tcList
      .map((tc) => {
        let status = statuses[tc] || "aucun";
        let icon =
          status === "livre" || status === "livré"
            ? `<svg style='vertical-align:middle;margin-right:7px;' width='22' height='22' viewBox='0 0 24 24' fill='none'><rect x='2' y='7' width='15' height='8' rx='2' fill='#22c55e'/><path d='M17 10h2.382a2 2 0 0 1 1.789 1.106l1.382 2.764A1 1 0 0 1 22 15h-2v-2a1 1 0 0 0-1-1h-2v-2z' fill='#22c55e'/><circle cx='7' cy='18' r='2' fill='#22c55e'/><circle cx='17' cy='18' r='2' fill='#22c55e'/></svg>`
            : `<svg style='vertical-align:middle;margin-right:7px;' width='22' height='22' viewBox='0 0 24 24' fill='none'><rect x='2' y='7' width='15' height='8' rx='2' fill='#64748b'/><circle cx='7' cy='18' r='2' fill='#64748b'/><circle cx='17' cy='18' r='2' fill='#64748b'/></svg>`;
        let statusLabel =
          status === "livre" || status === "livré" ? "Livré" : "Non livré";
        return `<div style='display:flex;align-items:center;gap:8px;margin-bottom:2px;'><span>${icon}</span><span style='font-weight:700;color:#0e274e;'>${tc}</span><span style='margin-left:12px;font-weight:600;color:${
          status === "livre" || status === "livré" ? "#22c55e" : "#64748b"
        };'>${statusLabel}</span></div>`;
      })
      .join("");
  }
  tooltip.innerHTML = html;
  tooltip.style.display = "block";
  // Positionnement intelligent (évite de sortir de l'écran)
  const padding = 16;
  let left = x + padding;
  let top = y + padding;
  if (left + tooltip.offsetWidth > window.innerWidth) {
    left = window.innerWidth - tooltip.offsetWidth - padding;
  }
  if (top + tooltip.offsetHeight > window.innerHeight) {
    top = y - tooltip.offsetHeight - padding;
  }
  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

function hideStatutTooltip() {
  const tooltip = document.getElementById("statutTableTooltip");
  if (tooltip) tooltip.style.display = "none";
}
// Gestion du survol sur la colonne Statut pour afficher l'info-bulle personnalisée
document.addEventListener("mouseover", function (e) {
  const td = e.target.closest(
    "#deliveriesTable tbody td[data-col-id='statut']"
  );
  if (td) {
    // Trouver la livraison associée à la ligne
    const tr = td.closest("tr[data-delivery-id]");
    if (tr) {
      const deliveryId = tr.getAttribute("data-delivery-id");
      // Chercher la livraison dans allDeliveries
      if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
        const delivery = window.allDeliveries.find(
          (d) => String(d.id) === String(deliveryId)
        );
        if (delivery) {
          showStatutTooltip(delivery, e.clientX, e.clientY);
        }
      }
    }
  }
});
document.addEventListener("mousemove", function (e) {
  const tooltip = document.getElementById("statutTableTooltip");
  if (tooltip && tooltip.style.display === "block") {
    // On cherche la cellule sous la souris
    const td = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("#deliveriesTable tbody td[data-col-id='statut']");
    if (td) {
      const tr = td.closest("tr[data-delivery-id]");
      if (tr) {
        const deliveryId = tr.getAttribute("data-delivery-id");
        if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
          const delivery = window.allDeliveries.find(
            (d) => String(d.id) === String(deliveryId)
          );
          if (delivery) {
            showStatutTooltip(delivery, e.clientX, e.clientY);
          }
        }
      }
    } else {
      hideStatutTooltip();
    }
  }
});
document.addEventListener("mouseout", function (e) {
  const td = e.target.closest(
    "#deliveriesTable tbody td[data-col-id='statut']"
  );
  if (td) hideStatutTooltip();
});
// Ajout d'une info-bulle personnalisée pour texte tronqué (toutes cellules hors .tc-multi-cell)
function createCustomTooltip() {
  let tooltip = document.getElementById("customTableTooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "customTableTooltip";
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = "99999";
    tooltip.style.background = "#222";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "8px 14px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.fontSize = "1em";
    tooltip.style.maxWidth = "420px";
    tooltip.style.boxShadow = "0 4px 24px rgba(30,41,59,0.18)";
    tooltip.style.display = "none";
    tooltip.style.pointerEvents = "none";
    tooltip.style.wordBreak = "break-word";
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function showTooltip(text, x, y) {
  const tooltip = createCustomTooltip();
  tooltip.textContent = text;
  tooltip.style.display = "block";
  // Positionnement intelligent (évite de sortir de l'écran)
  const padding = 12;
  let left = x + padding;
  let top = y + padding;
  if (left + tooltip.offsetWidth > window.innerWidth) {
    left = window.innerWidth - tooltip.offsetWidth - padding;
  }
  if (top + tooltip.offsetHeight > window.innerHeight) {
    top = y - tooltip.offsetHeight - padding;
  }
  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

function hideTooltip() {
  const tooltip = document.getElementById("customTableTooltip");
  if (tooltip) tooltip.style.display = "none";
}

// Appliquer le tooltip sur toutes les cellules du tableau (hors .tc-multi-cell)
document.addEventListener("mouseover", function (e) {
  const td = e.target.closest("#deliveriesTable tbody td:not(.tc-multi-cell)");
  if (td && td.offsetWidth < td.scrollWidth) {
    showTooltip(td.textContent, e.clientX, e.clientY);
  }
});
document.addEventListener("mousemove", function (e) {
  const tooltip = document.getElementById("customTableTooltip");
  if (tooltip && tooltip.style.display === "block") {
    showTooltip(tooltip.textContent, e.clientX, e.clientY);
  }
});
document.addEventListener("mouseout", function (e) {
  const td = e.target.closest("#deliveriesTable tbody td");
  if (td) hideTooltip();
});
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
  // 🆕 AJOUT : Vérification de l'historique professionnel au chargement
  // Création immédiate du bouton historique
  checkAndShowHistoryButton();

  // --- AJOUT : Connexion WebSocket pour maj temps réel BL ---
  let ws;
  function setupWebSocket() {
    // Utilise le même protocole que la page (ws ou wss)
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = proto + "://" + window.location.host;
    ws = new WebSocket(wsUrl);
    ws.onopen = function () {
      //console.log("WebSocket connecté pour BL status update (liv)");
    };
    ws.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        // Gestion BL existante : ajout/suppression instantanée des livraisons
        if (data.type === "bl_status_update" && data.delivery) {
          // Vérifie si TOUS les BL de la livraison sont en 'mise_en_livraison'
          let blList = Array.isArray(data.delivery.bl_number)
            ? data.delivery.bl_number
            : typeof data.delivery.bl_number === "string"
            ? data.delivery.bl_number.split(/[,;\s]+/).filter(Boolean)
            : [];
          let blStatuses = blList.map((bl) =>
            data.delivery.bl_statuses && data.delivery.bl_statuses[bl]
              ? data.delivery.bl_statuses[bl]
              : "aucun"
          );
          const allMiseEnLivraison =
            blStatuses.length > 0 &&
            blStatuses.every((s) => s === "mise_en_livraison");
          // Cherche si la livraison est déjà dans allDeliveries
          const idx = window.allDeliveries.findIndex(
            (d) => d.id === data.delivery.id
          );
          if (allMiseEnLivraison) {
            // Ajoute ou met à jour la livraison
            if (idx === -1) {
              window.allDeliveries.push(data.delivery);
              updateDeliveredForPdf();
            } else {
              window.allDeliveries[idx] = data.delivery;
              updateDeliveredForPdf();
            }
          } else {
            // Retire la livraison si elle n'est plus éligible
            if (idx !== -1) {
              window.allDeliveries.splice(idx, 1);
              updateDeliveredForPdf();
            }
          }
          // Rafraîchit le tableau
          const dateStartInput = document.getElementById(
            "mainTableDateStartFilter"
          );
          const dateEndInput = document.getElementById(
            "mainTableDateEndFilter"
          );
          if (dateStartInput && dateEndInput) {
            updateTableForDateRange(dateStartInput.value, dateEndInput.value);
          }
          // Affiche une alerte visible si message fourni
          if (data.message) {
            showDeliveryAlert(data.message);
          }
        }
        // Affiche une alerte toast en haut de la page
        function showDeliveryAlert(message) {
          let alertDiv = document.getElementById("delivery-bl-alert-toast");
          if (!alertDiv) {
            alertDiv = document.createElement("div");
            alertDiv.id = "delivery-bl-alert-toast";
            alertDiv.style.position = "fixed";
            alertDiv.style.top = "32px";
            alertDiv.style.left = "50%";
            alertDiv.style.transform = "translateX(-50%)";
            alertDiv.style.background = "#2563eb";
            alertDiv.style.color = "#fff";
            alertDiv.style.padding = "16px 32px";
            alertDiv.style.borderRadius = "12px";
            alertDiv.style.fontSize = "1.15em";
            alertDiv.style.fontWeight = "bold";
            alertDiv.style.boxShadow = "0 4px 24px #2563eb55";
            alertDiv.style.zIndex = "100020";
            alertDiv.style.opacity = "0";
            alertDiv.style.transition = "opacity 0.3s";
            document.body.appendChild(alertDiv);
          }
          alertDiv.textContent = message;
          alertDiv.style.opacity = "1";
          setTimeout(() => {
            alertDiv.style.opacity = "0";
          }, 3500);
        }
        // Ajout : mise à jour instantanée de l'entête Statut ET des cellules de la colonne Statut
        if (data.type === "container_status_update") {
          // Mise à jour de l'entête Statut globale : on affiche seulement le texte "Statut" sans le bouton x sur y livré
          if (
            typeof data.globalDeliveredCount === "number" &&
            typeof data.globalTotalCount === "number"
          ) {
            const thStatut = document.querySelector(
              "#deliveriesTable thead th[data-col-id='statut']"
            );
            if (thStatut) {
              thStatut.innerHTML = `<span style=\"font-weight:bold;\">Statut</span>`;
            }
          }
          // 🔧 CORRECTION : Mise à jour de la cellule Statut avec données JSON synchronisées
          if (
            typeof data.deliveryId !== "undefined" &&
            typeof data.deliveredCount === "number" &&
            typeof data.totalCount === "number"
          ) {
            const row = document.querySelector(
              `#deliveriesTable tbody tr[data-delivery-id='${data.deliveryId}']`
            );
            if (row) {
              const statutCell = row.querySelector("td[data-col-id='statut']");
              if (statutCell) {
                // S'assurer que la livraison a des données JSON synchronisées
                const delivery = window.allDeliveries.find(
                  (d) => d.id === data.deliveryId
                );

                let realTotal = data.totalCount;
                let realDelivered = data.deliveredCount;

                // Si on a les données JSON, les utiliser pour le calcul exact
                if (
                  delivery &&
                  delivery.container_numbers_list &&
                  Array.isArray(delivery.container_numbers_list)
                ) {
                  realTotal = delivery.container_numbers_list.length;
                  if (
                    delivery.container_statuses &&
                    typeof delivery.container_statuses === "object"
                  ) {
                    realDelivered = delivery.container_numbers_list.filter(
                      (tc) => {
                        const s = delivery.container_statuses[tc];
                        return s === "livre" || s === "livré";
                      }
                    ).length;
                  }
                  console.log(
                    `[WEBSOCKET UPDATE] Utilisation données JSON: ${realDelivered}/${realTotal} livrés`
                  );
                } else {
                  console.log(
                    `[WEBSOCKET UPDATE] Utilisation données WebSocket: ${realDelivered}/${realTotal} livrés`
                  );
                }

                if (realDelivered === realTotal && realTotal > 0) {
                  // Tous livrés : bouton vert + icône camion + texte Livré
                  statutCell.innerHTML = `<button style=\"display:flex;align-items:center;gap:8px;margin-top:6px;font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #22c55e;background:#e6fff5;color:#22c55e;\">
                    <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' style='vertical-align:middle;'><rect x='2' y='7' width='15' height='8' rx='2' fill='#22c55e'/><path d='M17 10h2.382a2 2 0 0 1 1.789 1.106l1.382 2.764A1 1 0 0 1 22 15h-2v-2a1 1 0 0 0-1-1h-2v-2z' fill='#22c55e'/><circle cx='7' cy='18' r='2' fill='#22c55e'/><circle cx='17' cy='18' r='2' fill='#22c55e'/></svg>
                    Livré
                  </button>`;
                } else if (realDelivered > 0) {
                  // Affichage classique : x sur y livré(s) avec le NOMBRE EXACT
                  statutCell.innerHTML = `<button style=\"margin-top:6px;font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #eab308;background:#fffbe6;color:#b45309;\">${realDelivered} sur ${realTotal} livré${
                    realTotal > 1 ? "s" : ""
                  }</button>`;
                } else {
                  statutCell.innerHTML = "";
                }

                console.log(
                  `[WEBSOCKET UPDATE] ✅ Cellule statut mise à jour: ${realDelivered}/${realTotal}`
                );
              }
            }
          }
        }
      } catch (e) {
        //console.error("Erreur WebSocket BL (liv):", e);
      }
    };
    ws.onerror = function () {
      //console.warn("WebSocket BL error (liv)");
    };
    ws.onclose = function () {
      // Reconnexion auto après 2s
      setTimeout(setupWebSocket, 2000);
    };
  }
  setupWebSocket();
  // Ajout du style CSS pour badges, tags, menu déroulant des conteneurs (Numéro TC(s)), et bouton suppression compact
  const styleTC = document.createElement("style");
  styleTC.textContent = `
    /* Bouton suppression compact à côté des filtres date */
    #deleteRowsBtn {
      margin-left: 18px !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      padding: 4px 12px !important;
      font-size: 0.97em !important;
      height: 32px !important;
      min-width: 0;
      border-radius: 7px !important;
      box-shadow: 0 1px 4px #ef444422;
      vertical-align: middle;
      display: none;
    }
    #returnToRespBtn {
      margin-left: 8px !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      padding: 4px 12px !important;
      font-size: 0.97em !important;
      height: 32px !important;
      border-radius: 7px !important;
      box-shadow: 0 1px 4px #2563eb22;
      vertical-align: middle;
      display: none;
    }
    #deliveriesTableBody .tc-tag {      
      display: inline-block;
      margin-right: 4px;
      padding: 2px 8px;
      background: #2563eb;
      color: #fff;
      border-radius: 6px;
      font-size: 0.95em;
      font-weight: 500;
      white-space: nowrap;
      vertical-align: middle;
    }
    #deliveriesTableBody .tc-tags-btn {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: #4c628dff;
      border: 1px solid #2563eb;
      border-radius: 8px;
      padding: 2px 10px;
      cursor: pointer;
      font-size: 0.95em;
      white-space: nowrap;
    }
    #deliveriesTableBody .tc-popup {
      position: absolute;
      background: #fff;
      border: 1px solid #2563eb;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(30,41,59,0.13);
      padding: 8px 0;
      min-width: 120px;
      z-index: 1002;
      left: 0;
      top: 100%;
      white-space: nowrap;
    }
    #deliveriesTableBody .tc-popup-item {
      padding: 6px 18px;
      cursor: pointer;
      font-size: 0.98em;
      color: #2563eb;
      border-bottom: 1px solid #f3f4f6;
    }
    #deliveriesTableBody .tc-popup-item:last-child {
      border-bottom: none;
    }
    /* Styles pour les entêtes et colonnes sauf Numéro TC(s) */
    #deliveriesTable thead th:not([data-col-id='container_number']) {
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      font-size: 1em;
      font-weight: bold;
      background: #0e274eff;
      color: #fff;
      border-bottom: 2px solid #2563eb;
      text-align: center;
      vertical-align: middle;
    }
    /* Toutes les cellules du tableau (hors container_number multi-cell) : une seule ligne, centré, ellipsis */
    #deliveriesTable tbody td:not(.tc-multi-cell):not([data-col-id='container_number']) {
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
      text-align: center;
      font-weight: normal;
      font-size: 1em;
      padding: 6px 8px;
    }
    /* Pour la colonne observation, même comportement, centré, une seule ligne */
    #deliveriesTable tbody td.observation-col {
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
      background: none;
      text-align: center;
      font-weight: normal;
      font-size: 1em;
      padding: 6px 8px;
    }
    @media (max-width: 900px) {
      #deliveriesTable thead th:not([data-col-id='container_number']),
      #deliveriesTable tbody td:not(:nth-child(5)) {
        max-width: 90px;
        font-size: 0.95em;
      }
      #deliveriesTable tbody td.observation-col {
        max-width: 120px;
      }
    }
    @media (max-width: 600px) {
      #deliveriesTable thead th:not([data-col-id='container_number']),
      #deliveriesTable tbody td:not(:nth-child(5)) {
        max-width: 60px;
        font-size: 0.92em;
      }
      #deliveriesTable tbody td.observation-col {
        max-width: 80px;
      }
    }
  `;
  document.head.appendChild(styleTC);
  const tableBody = document.getElementById("deliveriesTableBody");
  const dateStartInput = document.getElementById("mainTableDateStartFilter");
  const dateEndInput = document.getElementById("mainTableDateEndFilter");

  // On charge toutes les livraisons une seule fois au chargement
  // On rend allDeliveries accessible globalement pour le tooltip Statut
  window.allDeliveries = [];

  async function loadAllDeliveries() {
    try {
      const response = await fetch("/deliveries/status");
      const data = await response.json();
      if (data.success && Array.isArray(data.deliveries)) {
        // On ne garde que les livraisons dont le statut acconier est 'mise_en_livraison_acconier'
        window.allDeliveries = data.deliveries.filter((delivery) => {
          return (
            delivery.delivery_status_acconier === "mise_en_livraison_acconier"
          );
        });
      } else {
        window.allDeliveries = [];
      }
    } catch (e) {
      console.error("Erreur lors du chargement des livraisons :", e);
      window.allDeliveries = [];
    }
  }

  // Filtre les livraisons selon une plage de dates (delivery_date ou created_at)
  function filterDeliveriesByDateRange(startStr, endStr) {
    if (!startStr && !endStr) return allDeliveries;
    const startDate = startStr ? new Date(startStr) : null;
    const endDate = endStr ? new Date(endStr) : null;
    return window.allDeliveries.filter((delivery) => {
      let dDate =
        delivery["delivery_date"] ||
        delivery["created_at"] ||
        delivery["Date"] ||
        delivery["Date Livraison"];
      if (!dDate) return false;
      let normalized = "";
      if (typeof dDate === "string") {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dDate)) {
          const [j, m, a] = dDate.split("/");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dDate)) {
          normalized = dDate;
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(dDate)) {
          const [j, m, a] = dDate.split("-");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else {
          const dateObj = new Date(dDate);
          if (!isNaN(dateObj)) {
            normalized = dateObj.toISOString().split("T")[0];
          } else {
            normalized = dDate;
          }
        }
      } else if (dDate instanceof Date) {
        normalized = dDate.toISOString().split("T")[0];
      } else {
        normalized = String(dDate);
      }
      const currentDate = new Date(normalized);
      if (startDate && currentDate < startDate) return false;
      if (endDate && currentDate > endDate) return false;
      return true;
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
        let value = "-";
        if (col.id === "date_display") {
          let dDate = delivery.delivery_date || delivery.created_at;
          if (dDate) {
            let dateObj = new Date(dDate);
            if (!isNaN(dateObj.getTime())) {
              value = dateObj.toLocaleDateString("fr-FR");
            } else if (typeof dDate === "string") {
              value = dDate;
            }
          }
        } else {
          value = delivery[col.id] !== undefined ? delivery[col.id] : "-";
        }
        cell.textContent = value;
        // Style joli et gras pour toutes les cellules de texte (hors cellules spéciales)
        cell.style.fontWeight = "bold";
        cell.style.color = "#1e293b";
        cell.style.fontFamily = "'Segoe UI', 'Roboto', 'Arial', sans-serif";
        cell.style.letterSpacing = "0.5px";
        cell.style.background =
          "linear-gradient(90deg,#f3f4f6 0%,#e0e7ff 100%)";
        cell.style.borderRadius = "7px";
        cell.style.boxShadow = "0 1px 6px rgba(30,41,59,0.07)";
        // Si colonne éditable, fond jaune très transparent et police rouge foncé
        const editableColIds = [
          "visitor_agent_name",
          "transporter",
          "inspector",
          "customs_agent",
          "driver",
          "driver_phone",
          "delivery_date",
          "observation",
        ];
        if (editableColIds.includes(col.id)) {
          cell.style.background = "rgba(255, 230, 0, 0.08)";
          cell.style.color = "#b91c1c";
        }
        row.appendChild(cell);
      });
      tableBody.appendChild(row);
    });
  }

  // Fonction principale pour charger et afficher selon la plage de dates
  function updateTableForDateRange(startStr, endStr) {
    let filtered = filterDeliveriesByDateRange(startStr, endStr);
    // Tri du plus ancien au plus récent
    filtered = filtered.sort((a, b) => {
      let aDate =
        a.delivery_date || a.created_at || a.Date || a["Date Livraison"];
      let bDate =
        b.delivery_date || b.created_at || b.Date || b["Date Livraison"];
      aDate = new Date(aDate);
      bDate = new Date(bDate);
      return aDate - bDate;
    });
    const tableContainer = document.getElementById("deliveriesTableBody");
    if (tableContainer) {
      renderAgentTableFull(filtered, tableContainer);
    } else {
      console.error("L'élément #deliveriesTableBody n'existe pas dans le DOM.");
    }
  }

  // Initialisation : charge les livraisons puis affiche la plage de dates
  const today = new Date().toISOString().split("T")[0];
  if (dateStartInput && dateEndInput) {
    // Si une valeur existe déjà, on la garde, sinon on initialise le début à la première livraison et la fin à aujourd'hui
    loadAllDeliveries().then(() => {
      // Cherche la date la plus ancienne dans allDeliveries
      let minDate = null;
      if (allDeliveries.length > 0) {
        minDate = allDeliveries.reduce((min, d) => {
          let dDate =
            d.delivery_date || d.created_at || d.Date || d["Date Livraison"];
          let dateObj = new Date(dDate);
          return !min || dateObj < min ? dateObj : min;
        }, null);
      }
      if (!dateStartInput.value) {
        dateStartInput.value = minDate
          ? minDate.toISOString().split("T")[0]
          : today;
      }
      if (!dateEndInput.value) {
        dateEndInput.value = today;
      }
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);
    });
    dateStartInput.addEventListener("change", () => {
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);
    });
    dateEndInput.addEventListener("change", () => {
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);
    });
  }
});

/**
 * Fonction pour propager automatiquement le statut "livré" à tous les TC d'une livraison
 * Cette fonction détecte quand un statut est mis à jour et l'applique à tous les TC liés
 */
async function propagateStatusToAllTCs(deliveryId, newStatus) {
  console.log(
    `[STATUS PROPAGATION] 🔄 Propagation du statut "${newStatus}" pour la livraison ${deliveryId}`
  );

  try {
    // Trouve la livraison dans les données globales
    const delivery = window.allDeliveries.find((d) => d.id === deliveryId);
    if (!delivery) {
      console.warn(
        `[STATUS PROPAGATION] ⚠️ Livraison ${deliveryId} non trouvée`
      );
      return;
    }

    // Obtient la liste des numéros TC (avec priorité JSON)
    let tcNumbers = [];
    if (
      delivery.container_numbers_list &&
      Array.isArray(delivery.container_numbers_list)
    ) {
      tcNumbers = delivery.container_numbers_list;
      console.log(
        `[STATUS PROPAGATION] 📋 Utilisation JSON: ${tcNumbers.length} TC trouvés`
      );
    } else if (delivery.container_number) {
      // Parse le champ legacy en cas de données tronquées
      if (delivery.container_number.includes("+")) {
        // Données tronquées détectées - essayer de synchroniser d'abord
        console.log(
          `[STATUS PROPAGATION] 🔧 Données tronquées détectées: "${delivery.container_number}"`
        );
        console.log(`[STATUS PROPAGATION]   Tentative de synchronisation...`);

        // Lance la synchronisation pour cette livraison spécifique
        const syncResult = await forceSyncDelivery(delivery);
        if (syncResult && syncResult.tcNumbers) {
          tcNumbers = syncResult.tcNumbers;
          console.log(
            `[STATUS PROPAGATION] ✅ Synchronisation réussie: ${tcNumbers.length} TC récupérés`
          );
        } else {
          console.log(
            `[STATUS PROPAGATION] ⚠️ Impossible de synchroniser - propagation arrêtée`
          );
          return;
        }
      } else {
        tcNumbers = [delivery.container_number];
        console.log(`[STATUS PROPAGATION] 📋 Utilisation legacy: 1 TC trouvé`);
      }
    }

    if (tcNumbers.length === 0) {
      console.warn(
        `[STATUS PROPAGATION] ⚠️ Aucun numéro TC trouvé pour la livraison ${deliveryId}`
      );
      return;
    }

    // Permettre la propagation même pour un seul TC (pour l'action manuelle)
    console.log(
      `[STATUS PROPAGATION] 🎯 Propagation à ${tcNumbers.length} TC:`,
      tcNumbers
    );

    // Met à jour tous les TC via l'API backend
    let successCount = 0;
    let errorCount = 0;

    for (const tcNumber of tcNumbers) {
      try {
        const response = await fetch(
          `/deliveries/${deliveryId}/container-status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              containerNumber: tcNumber,
              status: newStatus,
            }),
          }
        );

        if (response.ok) {
          successCount++;
          console.log(
            `[STATUS PROPAGATION] ✅ TC ${tcNumber} mis à jour avec succès`
          );

          // Met à jour les données locales
          if (delivery && delivery.id) {
            const idx = window.allDeliveries.findIndex(
              (d) => d.id === delivery.id
            );
            if (idx !== -1) {
              if (
                !window.allDeliveries[idx].container_statuses ||
                typeof window.allDeliveries[idx].container_statuses !== "object"
              ) {
                window.allDeliveries[idx].container_statuses = {};
              }
              window.allDeliveries[idx].container_statuses[tcNumber] =
                newStatus;
            }
          }
        } else {
          errorCount++;
          console.error(
            `[STATUS PROPAGATION] ❌ Erreur lors de la mise à jour du TC ${tcNumber}:`,
            response.status
          );
        }
      } catch (error) {
        errorCount++;
        console.error(
          `[STATUS PROPAGATION] ❌ Erreur réseau pour TC ${tcNumber}:`,
          error
        );
      }
    }

    console.log(
      `[STATUS PROPAGATION] 📊 Résultat: ${successCount} succès, ${errorCount} échecs sur ${tcNumbers.length} TC`
    );

    // Met à jour l'affichage visuel uniquement si au moins une mise à jour a réussi
    if (successCount > 0) {
      // 🔧 CORRECTION : Mise à jour instantanée de la cellule statut SANS recharger tout le tableau
      const row = document.querySelector(
        `#deliveriesTableBody tr[data-delivery-id='${deliveryId}']`
      );
      if (row) {
        const statutCell = row.querySelector("td[data-col-id='statut']");
        if (statutCell) {
          // Recalcule le statut avec les données JSON mises à jour
          let delivered = 0;
          const total = tcNumbers.length;

          // Compte les TC livrés après la mise à jour
          if (delivery && delivery.container_statuses) {
            delivered = tcNumbers.filter((tc) => {
              const s = delivery.container_statuses[tc];
              return s === "livre" || s === "livré";
            }).length;
          }

          console.log(
            `[STATUS PROPAGATION] 📊 Mise à jour statut: ${delivered}/${total} livrés`
          );

          // Met à jour l'affichage du statut
          if (delivered === total && total > 0) {
            // 🆕 AJOUT : Enregistrer tous les conteneurs livrés dans l'historique
            if (newStatus === "livre" || newStatus === "livré") {
              tcNumbers.forEach((tcNumber) => {
                saveToDeliveryHistory(delivery, tcNumber);
              });
              // 🆕 AJOUT : Afficher le bouton historique s'il n'est pas déjà visible
              showHistoryButtonIfNeeded();
            }

            // Tous livrés : bouton vert + icône camion + texte Livré
            statutCell.innerHTML = `<button style="display:flex;align-items:center;gap:8px;font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #22c55e;background:#e6fff5;color:#22c55e;">
              <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' style='vertical-align:middle;'><rect x='2' y='7' width='15' height='8' rx='2' fill='#22c55e'/><path d='M17 10h2.382a2 2 0 0 1 1.789 1.106l1.382 2.764A1 1 0 0 1 22 15h-2v-2a1 1 0 0 0-1-1h-2v-2z' fill='#22c55e'/><circle cx='7' cy='18' r='2' fill='#22c55e'/><circle cx='17' cy='18' r='2' fill='#22c55e'/></svg>
              Livré
            </button>`;
          } else if (delivered > 0) {
            // Affichage classique : x sur y livré(s) avec le NOMBRE EXACT
            statutCell.innerHTML = `<button style="font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #eab308;background:#fffbe6;color:#b45309;">${delivered} sur ${total} livré${
              total > 1 ? "s" : ""
            }</button>`;
          } else {
            statutCell.innerHTML = "";
          }

          console.log(
            `[STATUS PROPAGATION] ✅ Cellule statut mise à jour instantanément`
          );
        }

        // Met à jour également l'affichage des TC pour utiliser les données JSON
        const tcCell = row.querySelector("td[data-col-id='container_number']");
        if (tcCell && tcNumbers.length > 1) {
          // Reconstruit l'affichage des TC avec le nombre exact
          const btn = tcCell.querySelector(".tc-tags-btn");
          if (btn) {
            const chevron = btn.querySelector(".tc-chevron");
            const chevronHTML = chevron
              ? ' <i class="fas fa-chevron-down tc-chevron"></i>'
              : "";

            btn.innerHTML =
              tcNumbers
                .slice(0, 2)
                .map(
                  (tc) =>
                    `<span class="tc-tag" style="display:inline-block;background:#e6b800;color:#0e274e;font-weight:700;font-size:1em;padding:3px 10px;border-radius:10px;margin:4px 1px 4px 1px;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(30,41,59,0.13),0 1px 0 #fff inset;cursor:pointer;transition:background 0.18s,box-shadow 0.18s;border:none;">${tc}</span>`
                )
                .join("") +
              (tcNumbers.length > 2
                ? ` <span class="tc-tag tc-tag-more" style="display:inline-block;background:#e6b800;color:#0e274e;font-weight:700;font-size:1em;padding:3px 10px;border-radius:10px;margin:4px 1px 4px 1px;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(30,41,59,0.13),0 1px 0 #fff inset;cursor:pointer;transition:background 0.18s,box-shadow 0.18s;border:none;">+${
                    tcNumbers.length - 2
                  }</span>`
                : "") +
              chevronHTML;

            // Met à jour le popup aussi
            const popup = tcCell.querySelector(".tc-popup");
            if (popup) {
              popup.innerHTML = tcNumbers
                .map(
                  (tc) =>
                    `<div class="tc-popup-item" style='cursor:pointer;color:#0e274e;font-weight:700;font-size:1.13em;text-align:center;'>${tc}</div>`
                )
                .join("");
            }
          }

          console.log(
            `[STATUS PROPAGATION] ✅ Affichage TC mis à jour avec ${tcNumbers.length} conteneurs`
          );
        }
      }

      // Affiche une notification de succès
      showStatusUpdateNotification(successCount, newStatus, errorCount);
    }
  } catch (error) {
    console.error(
      `[STATUS PROPAGATION] ❌ Erreur lors de la propagation:`,
      error
    );
  }
}

/**
 * Fonction pour synchroniser une livraison spécifique lors de données tronquées
 */
async function forceSyncDelivery(delivery) {
  try {
    if (
      !delivery.container_number ||
      !delivery.container_number.includes("+")
    ) {
      return null; // Pas de données tronquées
    }

    // Détecte et reconstruit les données tronquées
    const truncatedPart = delivery.container_number;
    const matches = truncatedPart.match(/^(.+?)\s*\+\s*(\d+)\s*autres?/i);

    if (matches) {
      const basePart = matches[1].trim();
      const additionalCount = parseInt(matches[2]);
      const totalExpected = additionalCount + 1; // +1 pour le conteneur de base

      console.log(
        `[SYNC SINGLE] 🔧 Reconstruction pour ${delivery.id}: base="${basePart}", +${additionalCount} autres`
      );

      // Reconstruction basique - génère des numéros séquentiels
      const tcNumbers = [basePart];
      const basePrefix = basePart.replace(/\d+$/, "");
      const baseNumber = parseInt(basePart.match(/\d+$/)?.[0] || "1");

      for (let i = 1; i <= additionalCount; i++) {
        tcNumbers.push(`${basePrefix}${baseNumber + i}`);
      }

      // Met à jour l'objet delivery localement
      delivery.container_numbers_list = tcNumbers;
      delivery.container_foot_types_map = {};
      tcNumbers.forEach((tc) => {
        delivery.container_foot_types_map[tc] = delivery.foot_type || "20";
      });

      console.log(
        `[SYNC SINGLE] ✅ Reconstruction réussie: ${tcNumbers.length} TC générés`
      );
      return { tcNumbers };
    }

    return null;
  } catch (error) {
    console.error(`[SYNC SINGLE] ❌ Erreur lors de la synchronisation:`, error);
    return null;
  }
}

/**
 * Fonction pour afficher une notification de mise à jour de statut
 */
function showStatusUpdateNotification(successCount, status, errorCount = 0) {
  // Crée une notification temporaire
  const notification = document.createElement("div");
  const bgColor = errorCount > 0 ? "#FF9800" : "#4CAF50"; // Orange si erreurs, vert sinon
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
  `;

  let message = `✅ ${successCount} numéro${
    successCount > 1 ? "s" : ""
  } TC mis à jour${successCount > 1 ? "s" : ""} au statut "${status}"`;
  if (errorCount > 0) {
    message += `\n⚠️ ${errorCount} erreur${errorCount > 1 ? "s" : ""}`;
  }

  notification.textContent = message;
  notification.style.whiteSpace = "pre-line";

  document.body.appendChild(notification);

  // Supprime la notification après 4 secondes (plus long si erreurs)
  const delay = errorCount > 0 ? 5000 : 3000;
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, delay);
}

// Fonction accessible globalement
window.propagateStatusToAllTCs = propagateStatusToAllTCs;

// Colonnes strictes pour Agent Acconier
// Fonction robuste pour générer le tableau complet (en-tête + lignes)
function renderAgentTableFull(deliveries, tableBodyElement) {
  // Création des boutons d'action (suppression + ramener au Resp. Acconier)
  let delBtn = document.getElementById("deleteRowsBtn");
  let respBtn = document.getElementById("returnToRespBtn");
  if (!delBtn) {
    delBtn = document.createElement("button");
    delBtn.id = "deleteRowsBtn";
    delBtn.textContent = "Supprimer la sélection";
    delBtn.type = "button";
    delBtn.style.background = "#ef4444";
    delBtn.style.color = "#fff";
    delBtn.style.fontWeight = "bold";
    delBtn.style.border = "none";
    delBtn.style.cursor = "pointer";
    delBtn.style.display = "none";
    delBtn.style.marginRight = "4px";
    delBtn.style.fontSize = "0.88em";
    delBtn.style.padding = "2px 8px";
    delBtn.style.height = "26px";
    delBtn.style.borderRadius = "6px";
    delBtn.onclick = function () {
      const checked = document.querySelectorAll(
        '#deliveriesTableBody input[type="checkbox"].row-select:checked'
      );
      if (checked.length === 0) {
        alert("Veuillez sélectionner au moins une ligne à supprimer.");
        return;
      }
      if (!confirm("Confirmer la suppression des lignes sélectionnées ?"))
        return;
      let idsToDelete = [];
      let trsToDelete = [];
      checked.forEach((cb) => {
        const tr = cb.closest("tr[data-delivery-id]");
        if (tr && tr.dataset.deliveryId) {
          idsToDelete.push(tr.dataset.deliveryId);
          trsToDelete.push(tr);
        }
      });
      Promise.all(
        idsToDelete.map((id) => {
          return fetch(`/deliveries/${id}`, {
            method: "DELETE",
          })
            .then((res) => res.json())
            .catch(() => ({ success: false }));
        })
      ).then((results) => {
        if (results.every((r) => r.success)) {
          trsToDelete.forEach((tr) => tr.remove());
          if (window.allDeliveries) {
            idsToDelete.forEach((id) => {
              window.allDeliveries = window.allDeliveries.filter(
                (d) => String(d.id) !== String(id)
              );
            });
          }
          const alertDiv = document.createElement("div");
          alertDiv.textContent = "Suppression effectuée";
          alertDiv.style.position = "fixed";
          alertDiv.style.top = "80px";
          alertDiv.style.left = "50%";
          alertDiv.style.transform = "translateX(-50%)";
          alertDiv.style.background =
            "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
          alertDiv.style.color = "#fff";
          alertDiv.style.fontWeight = "bold";
          alertDiv.style.fontSize = "1.12em";
          alertDiv.style.padding = "18px 38px";
          alertDiv.style.borderRadius = "16px";
          alertDiv.style.boxShadow = "0 6px 32px rgba(239,68,68,0.18)";
          alertDiv.style.zIndex = 99999;
          alertDiv.style.opacity = "0";
          alertDiv.style.transition = "opacity 0.3s";
          document.body.appendChild(alertDiv);
          setTimeout(() => {
            alertDiv.style.opacity = "1";
          }, 10);
          setTimeout(() => {
            alertDiv.style.opacity = "0";
            setTimeout(() => alertDiv.remove(), 400);
          }, 2000);
        } else {
          alert("Erreur lors de la suppression d'une ou plusieurs lignes.");
        }
        setTimeout(() => {
          const checkedNow = document.querySelectorAll(
            '#deliveriesTableBody input[type="checkbox"].row-select:checked'
          );
          if (checkedNow.length === 0) delBtn.style.display = "none";
          if (respBtn && checkedNow.length === 0)
            respBtn.style.display = "none";
        }, 100);
      });
    };
    // Création du bouton Ramener au Resp. Acconier
    respBtn = document.createElement("button");
    respBtn.id = "returnToRespBtn";
    respBtn.textContent = "Ramener au Resp. Acconier";
    respBtn.type = "button";
    respBtn.style.background = "#2563eb";
    respBtn.style.color = "#fff";
    respBtn.style.fontWeight = "bold";
    respBtn.style.border = "none";
    respBtn.style.cursor = "pointer";
    respBtn.style.display = "none";
    respBtn.style.borderRadius = "6px";
    respBtn.style.padding = "2px 8px";
    respBtn.style.marginRight = "4px";
    respBtn.style.fontSize = "0.88em";
    respBtn.style.height = "26px";
    respBtn.onclick = async function () {
      const checked = document.querySelectorAll(
        '#deliveriesTableBody input[type="checkbox"].row-select:checked'
      );
      if (checked.length === 0) {
        alert(
          "Veuillez sélectionner au moins une ligne à ramener au Resp. Acconier."
        );
        return;
      }
      if (
        !confirm(
          "Confirmer le retour des lignes sélectionnées au Resp. Acconier ?"
        )
      )
        return;
      let idsToReturn = [];
      let trsToRemove = [];
      checked.forEach((cb) => {
        const tr = cb.closest("tr[data-delivery-id]");
        if (tr && tr.dataset.deliveryId) {
          idsToReturn.push(tr.dataset.deliveryId);
          trsToRemove.push(tr);
        }
      });
      // Appel API pour chaque livraison à ramener
      const results = await Promise.all(
        idsToReturn.map((id) => {
          // PATCH pour retirer le statut "mise_en_livraison" (à adapter selon l'API backend)
          return fetch(`/deliveries/${id}/return-to-resp-acconier`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "return_to_resp_acconier" }),
          })
            .then((res) => res.json())
            .catch(() => ({ success: false }));
        })
      );
      if (results.every((r) => r.success)) {
        trsToRemove.forEach((tr) => tr.remove());
        if (window.allDeliveries) {
          idsToReturn.forEach((id) => {
            window.allDeliveries = window.allDeliveries.filter(
              (d) => String(d.id) !== String(id)
            );
            // Envoie un événement custom pour informer resp_acconier.html
            window.dispatchEvent(
              new CustomEvent("restoreToRespAcconier", {
                detail: { deliveryId: id },
              })
            );
            // Synchronisation inter-onglets via localStorage
            localStorage.setItem(
              "restoreToRespAcconierEvent",
              Date.now().toString()
            );
          });
        }
        const alertDiv = document.createElement("div");
        alertDiv.textContent = "Retour effectué vers Resp. Acconier";
        alertDiv.style.position = "fixed";
        alertDiv.style.top = "80px";
        alertDiv.style.left = "50%";
        alertDiv.style.transform = "translateX(-50%)";
        alertDiv.style.background =
          "linear-gradient(90deg,#2563eb 0%,#0e274e 100%)";
        alertDiv.style.color = "#fff";
        alertDiv.style.fontWeight = "bold";
        alertDiv.style.fontSize = "1.12em";
        alertDiv.style.padding = "18px 38px";
        alertDiv.style.borderRadius = "16px";
        alertDiv.style.boxShadow = "0 6px 32px rgba(37,99,235,0.18)";
        alertDiv.style.zIndex = 99999;
        alertDiv.style.opacity = "0";
        alertDiv.style.transition = "opacity 0.3s";
        document.body.appendChild(alertDiv);
        setTimeout(() => {
          alertDiv.style.opacity = "1";
        }, 10);
        setTimeout(() => {
          alertDiv.style.opacity = "0";
          setTimeout(() => alertDiv.remove(), 400);
        }, 2000);
      } else {
        alert("Erreur lors du retour d'une ou plusieurs lignes.");
      }
      setTimeout(() => {
        const checkedNow = document.querySelectorAll(
          '#deliveriesTableBody input[type="checkbox"].row-select:checked'
        );
        if (checkedNow.length === 0) delBtn.style.display = "none";
        if (respBtn && checkedNow.length === 0) respBtn.style.display = "none";
      }, 100);
    };
    // Ajout des deux boutons à côté des filtres de date
    const dateStartInput = document.getElementById("mainTableDateStartFilter");
    const dateEndInput = document.getElementById("mainTableDateEndFilter");
    if (dateEndInput && dateEndInput.parentNode) {
      let filterBar = dateEndInput.parentNode;
      if (getComputedStyle(filterBar).display !== "flex") {
        filterBar.style.display = "flex";
        filterBar.style.alignItems = "center";
        filterBar.style.gap = "8px";
      }
      // Ajoute les deux boutons après le filtre date de fin
      if (dateEndInput.nextSibling !== delBtn) {
        filterBar.insertBefore(delBtn, dateEndInput.nextSibling);
      }
      if (delBtn.nextSibling !== respBtn) {
        filterBar.insertBefore(respBtn, delBtn.nextSibling);
      }
    }
  }
  // Fonction pour afficher/masquer les boutons selon la sélection
  function updateDeleteBtnVisibility() {
    const checked = document.querySelectorAll(
      '#deliveriesTableBody input[type="checkbox"].row-select:checked'
    );
    delBtn.style.display = checked.length > 0 ? "inline-block" : "none";
    if (!respBtn) respBtn = document.getElementById("returnToRespBtn");
    if (respBtn)
      respBtn.style.display = checked.length > 0 ? "inline-block" : "none";
  }
  const table = tableBodyElement.closest("table");
  if (deliveries.length === 0) {
    if (table) table.style.display = "none";
    let noDataMsg = document.getElementById("noDeliveriesMsg");
    if (!noDataMsg) {
      noDataMsg = document.createElement("div");
      noDataMsg.id = "noDeliveriesMsg";
      noDataMsg.style.textAlign = "center";
      noDataMsg.style.padding = "48px 0 32px 0";
      noDataMsg.style.fontSize = "1.25em";
      noDataMsg.style.color = "#64748b";
      noDataMsg.style.fontWeight = "500";
      noDataMsg.textContent = "Aucune opération à cette date.";
      tableBodyElement.parentNode.insertBefore(noDataMsg, tableBodyElement);
    } else {
      noDataMsg.style.display = "block";
    }
    tableBodyElement.innerHTML = "";
  } else {
    if (table) table.style.display = "table";
    const noDataMsg = document.getElementById("noDeliveriesMsg");
    if (noDataMsg) noDataMsg.style.display = "none";
    // Génération du bandeau coloré
    if (table) {
      let thead = table.querySelector("thead");
      if (!thead) {
        thead = document.createElement("thead");
        table.insertBefore(thead, tableBodyElement);
      }
      thead.innerHTML = "";
      // Bandeau coloré principal
      const bannerRow = document.createElement("tr");
      const bannerTh = document.createElement("th");
      bannerTh.colSpan = AGENT_TABLE_COLUMNS.length;
      bannerTh.style.fontSize = "1.25em";
      bannerTh.style.fontWeight = "700";
      bannerTh.style.background =
        "linear-gradient(90deg,#0e274e 0%,#ffc107 60%,#e6b800 100%)";
      bannerTh.style.color = "#fff";
      bannerTh.style.borderRadius = "18px 18px 0 0";
      bannerTh.style.letterSpacing = "2px";
      bannerTh.style.boxShadow = "0 4px 24px #0e274e22";
      bannerTh.style.textShadow = "0 2px 8px #0e274e55";
      bannerTh.textContent = "Responsable de Livraison";
      bannerRow.appendChild(bannerTh);
      thead.appendChild(bannerRow);
      // En-tête stylisée
      const headerRow = document.createElement("tr");
      AGENT_TABLE_COLUMNS.forEach((col, idx) => {
        const th = document.createElement("th");
        th.setAttribute("data-col-id", col.id);
        th.textContent = col.label;
        // Si colonne éditable, couleur rouge foncé pour l'en-tête
        const editableHeaderIds = [
          "visitor_agent_name",
          "transporter",
          "inspector",
          "customs_agent",
          "driver",
          "driver_phone",
          "delivery_date",
          "observation",
        ];
        if (editableHeaderIds.includes(col.id)) {
          th.style.color = "#b91c1c"; // rouge foncé
        }
        // Alternance de couleurs pour chaque colonne
        if (idx % 3 === 0) {
          th.style.background = "#ffc107";
          th.style.color = "#0e274e";
          th.style.fontWeight = "700";
          th.style.borderRight = "2px solid #e6b800";
        } else if (idx % 3 === 1) {
          th.style.background = "#0e274e";
          th.style.color = "#ffc107";
          th.style.fontWeight = "700";
          th.style.borderRight = "2px solid #ffc107";
        } else {
          th.style.background = "#e6b800";
          th.style.color = "#fff";
          th.style.fontWeight = "700";
          th.style.borderRight = "2px solid #ffc107";
        }
        th.style.textAlign = "center";
        th.style.verticalAlign = "middle";
        th.style.fontSize = "1em";
        th.style.whiteSpace = "nowrap";
        th.style.overflow = "hidden";
        th.style.maxWidth = "180px";
        th.style.boxShadow = "0 2px 8px #0e274e11";

        // Style spécial pour les colonnes de dates
        if (
          col.id === "date_echange_bl" ||
          col.id === "date_do" ||
          col.id === "date_badt"
        ) {
          th.style.width = "140px";
          th.style.minWidth = "140px";
          th.style.maxWidth = "140px";
          th.style.background =
            "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)";
          th.style.color = "#ffffff";
          th.style.fontWeight = "bold";
        }

        if (col.id === "statut") {
          th.innerHTML = `<span style=\"font-weight:bold;\">${col.label}</span>`;
        }
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
    }
    renderAgentTableRows(deliveries, tableBodyElement);
  }
}
// Ajout colonne de sélection pour suppression
const AGENT_TABLE_COLUMNS = [
  { id: "select_row", label: "" },
  { id: "row_number", label: "N°" },
  { id: "date_display", label: "Date" },
  { id: "employee_name", label: "Agent Acconier" },
  { id: "client_name", label: "Nom Client" },
  { id: "client_phone", label: "Numéro Client" },
  { id: "lieu", label: "Lieu" },
  { id: "container_foot_type", label: "Type de Conteneur" },
  { id: "container_type_and_content", label: "Contenu" },
  { id: "declaration_number", label: "Numéro Déclaration" },
  { id: "bl_number", label: "Numéro BL" },
  { id: "dossier_number", label: "Numéro Dossier" },
  { id: "number_of_containers", label: "Nombre de Conteneurs" },
  { id: "shipping_company", label: "Compagnie Maritime" },
  { id: "weight", label: "Poids" },
  { id: "ship_name", label: "Nom du Navire" },
  { id: "circuit", label: "Circuit" },
  { id: "transporter_mode", label: "Mode de Transport" },
  { id: "date_do", label: "Date de DO" },
  { id: "date_badt", label: "Date de BADT" },
  { id: "visitor_agent_name", label: "NOM Agent visiteurs" },
  { id: "transporter", label: "TRANSPORTEUR" },
  { id: "inspector", label: "INSPECTEUR" },
  { id: "customs_agent", label: "AGENT EN DOUANES" },
  { id: "driver", label: "CHAUFFEUR" },
  { id: "driver_phone", label: "TEL CHAUFFEUR" },
  { id: "delivery_date", label: "DATE LIVRAISON" },
  // Déplacement de 'Numéro TC(s)' juste avant 'Statut'
  { id: "container_number", label: "Numéro TC(s)" },
  { id: "statut", label: "Statut" },
  { id: "observation", label: "Observations" },
];

// Fonction pour générer les lignes du tableau Agent Acconier
function renderAgentTableRows(deliveries, tableBodyElement) {
  tableBodyElement.innerHTML = "";

  // DEBUG: Affichage des données de livraison reçues
  console.log(
    `[DEBUG RENDER] Nombre de livraisons à afficher: ${deliveries.length}`
  );
  deliveries.forEach((delivery, idx) => {
    console.log(`[DEBUG RENDER ${idx}] Delivery:`, {
      id: delivery.id,
      dossier_number: delivery.dossier_number,
      container_number: delivery.container_number,
      container_numbers_list: delivery.container_numbers_list,
      container_statuses: delivery.container_statuses,
    });
  });

  // Colonnes éditables demandées
  const editableCols = [
    "visitor_agent_name",
    "transporter",
    "inspector",
    "customs_agent",
    "driver",
    "driver_phone",
    "delivery_date",
    "observation",
  ];
  // Message d'accès temporaire (vert ou rouge)
  function showAccessMessage(msg, color) {
    let msgDiv = document.getElementById("accessMsgTemp");
    if (!msgDiv) {
      msgDiv = document.createElement("div");
      msgDiv.id = "accessMsgTemp";
      msgDiv.style.position = "fixed";
      msgDiv.style.top = "18px";
      msgDiv.style.left = "50%";
      msgDiv.style.transform = "translateX(-50%)";
      msgDiv.style.zIndex = 99999;
      msgDiv.style.padding = "12px 32px";
      msgDiv.style.borderRadius = "10px";
      msgDiv.style.fontWeight = "bold";
      msgDiv.style.fontSize = "1.1em";
      document.body.appendChild(msgDiv);
    }
    msgDiv.textContent = msg;
    msgDiv.style.background = color === "green" ? "#22c55e" : "#ef4444";
    msgDiv.style.color = "#fff";
    msgDiv.style.boxShadow = "0 2px 12px rgba(30,41,59,0.13)";
    msgDiv.style.display = "block";
    clearTimeout(msgDiv._timeout);
    msgDiv._timeout = setTimeout(function () {
      msgDiv.style.display = "none";
    }, 2000);
  }
  deliveries.forEach((delivery, i) => {
    const tr = document.createElement("tr");
    if (delivery.id) {
      tr.setAttribute("data-delivery-id", delivery.id);
    }
    // Champs facultatifs pour ce delivery (plus d'obligation)
    const optionalFields = [
      "visitor_agent_name",
      "transporter",
      "inspector",
      "customs_agent",
      "driver",
      "driver_phone",
      "delivery_date",
    ];
    // Fonction pour vérifier si tous les champs sont remplis (maintenant facultatif - toujours autorisé)
    function isAllRequiredFilled() {
      // Les champs sont maintenant facultatifs, donc toujours autorisé
      return true;
    }
    // Gestion dynamique du message d'accès
    let lastAccessState = null;
    let confirmationShown = false;
    AGENT_TABLE_COLUMNS.forEach((col, idx) => {
      // Colonne sélection : case à cocher
      if (col.id === "select_row") {
        const td = document.createElement("td");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "row-select";
        cb.style.cursor = "pointer";
        cb.style.width = "18px";
        cb.style.height = "18px";
        td.style.textAlign = "center";
        td.appendChild(cb);
        // Afficher/masquer les deux boutons ensemble selon la sélection
        cb.addEventListener("change", function () {
          const delBtn = document.getElementById("deleteRowsBtn");
          const respBtn = document.getElementById("returnToRespBtn");
          const checked = document.querySelectorAll(
            '#deliveriesTableBody input[type="checkbox"].row-select:checked'
          );
          const show = checked.length > 0 ? "inline-block" : "none";
          if (delBtn) delBtn.style.display = show;
          if (respBtn) respBtn.style.display = show;
        });
        tr.appendChild(td);
        return;
      }
      // Génère une clé unique pour chaque cellule éditable (par livraison et colonne)
      function getCellStorageKey(delivery, colId) {
        return `deliverycell_${
          delivery.id || delivery.dossier_number || i
        }_${colId}`;
      }

      // === NOUVELLE FONCTION : Synchronisation vers scriptSuivie.js ===
      function syncDataToSuivie(delivery, fieldId, value) {
        // Correspondance des champs entre RespLiv et Suivie
        const fieldMapping = {
          visitor_agent_name: "nom_agent_visiteur",
          transporter: "transporter",
          inspector: "inspecteur",
          customs_agent: "agent_en_douanes",
          driver: "driver_name",
          driver_phone: "driver_phone",
          delivery_date: "delivery_date",
          observation: "delivery_notes",
        };

        const suivieFieldId = fieldMapping[fieldId];
        if (!suivieFieldId) return; // Pas de correspondance

        // 1. Stockage local pour synchronisation immédiate
        const syncKey = `sync_${
          delivery.id || delivery.dossier_number
        }_${suivieFieldId}`;
        const syncData = {
          value: value,
          timestamp: Date.now(),
          deliveryId: delivery.id || delivery.dossier_number,
          fieldId: suivieFieldId,
        };

        localStorage.setItem(syncKey, JSON.stringify(syncData));

        // 2. Synchronisation vers le backend
        fetch("/api/sync-resplivraison", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryId: delivery.id || delivery.dossier_number,
            fieldId: fieldId, // Champ original RespLiv
            value: value,
            timestamp: syncData.timestamp,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              console.log("Synchronisation backend réussie:", data);
            } else {
              console.warn("Erreur synchronisation backend:", data.message);
            }
          })
          .catch((error) => {
            console.error("Erreur réseau synchronisation:", error);
          });

        // 3. Déclencher un événement storage personnalisé pour la synchronisation immédiate
        window.dispatchEvent(
          new CustomEvent("respLivDataUpdate", {
            detail: syncData,
          })
        );
      }

      const td = document.createElement("td");
      // Ajout : identifiant data-col-id sur la cellule pour le filtrage
      td.setAttribute("data-col-id", col.id);
      let value = "-";
      // Récupère la valeur sauvegardée si elle existe (pour les colonnes éditables)
      let savedValue = null;
      if (
        [
          "visitor_agent_name",
          "transporter",
          "inspector",
          "customs_agent",
          "driver",
          "driver_phone",
          "delivery_date",
          "observation",
        ].includes(col.id)
      ) {
        const storageKey = getCellStorageKey(delivery, col.id);
        savedValue = localStorage.getItem(storageKey);
      }

      if (col.id === "row_number") {
        value = i + 1;
        td.textContent = value;
        td.classList.add("row-number-col");
      } else if (col.id === "date_display") {
        let dDate = delivery.delivery_date || delivery.created_at;
        if (dDate) {
          let dateObj = new Date(dDate);
          if (!isNaN(dateObj.getTime())) {
            value = dateObj.toLocaleDateString("fr-FR");
          } else if (typeof dDate === "string") {
            value = dDate;
          }
        }
        td.textContent = value;
        // Style joli et gras pour la cellule date livraison
        td.style.fontWeight = "bold";
        td.style.color = "#b91c1c"; // rouge foncé
        td.style.fontFamily = "'Segoe UI', 'Roboto', 'Arial', sans-serif";
        td.style.letterSpacing = "0.5px";
        td.style.background = "rgba(255, 230, 0, 0.08)"; // jaune très transparent
        td.style.borderRadius = "7px";
        td.style.boxShadow = "0 1px 6px rgba(30,41,59,0.07)";
      } else if (col.id === "container_number") {
        // Priorité JSON : utilise container_numbers_list si disponible, sinon container_number
        let tcList = [];
        if (
          delivery.container_numbers_list &&
          Array.isArray(delivery.container_numbers_list)
        ) {
          tcList = delivery.container_numbers_list.filter(Boolean);
          console.log(
            `[DEBUG TC DISPLAY] Utilisation container_numbers_list (${tcList.length}):`,
            tcList
          );
        } else if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
          console.log(
            `[DEBUG TC DISPLAY] Utilisation container_number array (${tcList.length}):`,
            tcList
          );
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
          console.log(
            `[DEBUG TC DISPLAY] Utilisation container_number string (${tcList.length}):`,
            tcList
          );
        }
        console.log(
          `[DEBUG TC DISPLAY] Delivery ID: ${
            delivery.id || delivery.dossier_number
          }, Total TC: ${tcList.length}`
        );
        td.style.textAlign = "center";
        if (tcList.length > 1) {
          td.classList.add("tc-multi-cell");
          const btn = document.createElement("button");
          btn.className = "tc-tags-btn";
          btn.type = "button";
          btn.style.display = "inline-flex";
          btn.style.justifyContent = "center";
          btn.style.alignItems = "center";
          btn.innerHTML =
            tcList
              .slice(0, 2)
              .map(
                (tc) =>
                  `<span class="tc-tag" style="display:inline-block;background:#e6b800;color:#0e274e;font-weight:700;font-size:1em;padding:3px 10px;border-radius:10px;margin:4px 1px 4px 1px;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(30,41,59,0.13),0 1px 0 #fff inset;cursor:pointer;transition:background 0.18s,box-shadow 0.18s;border:none;">${tc}</span>`
              )
              .join("") +
            (tcList.length > 2
              ? ` <span class="tc-tag tc-tag-more" style="display:inline-block;background:#e6b800;color:#0e274e;font-weight:700;font-size:1em;padding:3px 10px;border-radius:10px;margin:4px 1px 4px 1px;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(30,41,59,0.13),0 1px 0 #fff inset;cursor:pointer;transition:background 0.18s,box-shadow 0.18s;border:none;">+${
                  tcList.length - 2
                }</span>`
              : "") +
            ' <i class="fas fa-chevron-down tc-chevron"></i>';
          const popup = document.createElement("div");
          popup.className = "tc-popup";
          popup.style.display = "none";
          popup.innerHTML =
            tcList
              .map(
                (tc) =>
                  `<div class="tc-popup-item" style='cursor:pointer;color:#0e274e;font-weight:700;font-size:1.13em;text-align:center;'>${tc}</div>`
              )
              .join("") +
            `<div class="tc-popup-separator" style="height:1px;background:#e5e7eb;margin:4px 8px;"></div>
            <div class="tc-popup-item tc-popup-mark-all" style='cursor:pointer;color:#22c55e;font-weight:700;font-size:1.1em;text-align:center;background:#f0fdf4;border-radius:4px;margin:4px;'>📦 Marquer tous comme livrés</div>
            <div class="tc-popup-item tc-popup-unmark-all" style='cursor:pointer;color:#ef4444;font-weight:700;font-size:1.1em;text-align:center;background:#fef2f2;border-radius:4px;margin:4px;'>📭 Marquer tous comme non livrés</div>`;
          btn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll(".tc-popup").forEach((p) => {
              if (p !== popup) p.style.display = "none";
            });
            popup.style.display =
              popup.style.display === "block" ? "none" : "block";
          };
          popup
            .querySelectorAll(
              ".tc-popup-item:not(.tc-popup-mark-all):not(.tc-popup-unmark-all)"
            )
            .forEach((item) => {
              item.onclick = (ev) => {
                ev.stopPropagation();
                popup.style.display = "none";

                // 🔧 MODIFICATION AMÉLIORÉE : Permettre la modification une fois que la livraison a été "activée"
                let canModify = isAllRequiredFilled();

                // Vérifier si cette livraison a déjà été "activée" pour les modifications
                const deliveryKey = `delivery_activated_${
                  delivery.id || delivery.dossier_number
                }`;
                let isDeliveryActivated =
                  localStorage.getItem(deliveryKey) === "true";

                // Vérifier si des conteneurs ont déjà eu un statut défini (même "aucun" après avoir été "livré")
                let hasStatusHistory = false;
                if (
                  delivery.container_statuses &&
                  typeof delivery.container_statuses === "object"
                ) {
                  // Vérifier si au moins un conteneur a un statut défini (même "aucun")
                  hasStatusHistory =
                    Object.keys(delivery.container_statuses).length > 0;

                  // Si on trouve des statuts "livre"/"livré", marquer la livraison comme activée
                  const hasDeliveredContainers = Object.values(
                    delivery.container_statuses
                  ).some((status) => status === "livre" || status === "livré");

                  if (hasDeliveredContainers && !isDeliveryActivated) {
                    localStorage.setItem(deliveryKey, "true");
                    isDeliveryActivated = true;
                  }
                }

                // Permettre la modification maintenant que les champs sont facultatifs
                // Accès libre pour tous les utilisateurs
                showContainerDetailPopup(delivery, item.textContent);
              };
            });

          // Gestion du bouton "Marquer tous comme livrés"
          const markAllBtn = popup.querySelector(".tc-popup-mark-all");
          if (markAllBtn) {
            markAllBtn.onclick = async (ev) => {
              ev.stopPropagation();
              popup.style.display = "none";

              // Les champs sont maintenant facultatifs - plus de vérification

              if (
                !confirm(
                  `Êtes-vous sûr de vouloir marquer TOUS les ${tcList.length} conteneurs comme livrés ?`
                )
              ) {
                return;
              }

              console.log(
                `[MARK ALL] 🎯 Marquage de tous les conteneurs comme livrés pour la livraison ${delivery.id}`
              );

              try {
                // Utilise la fonction de propagation existante
                await window.propagateStatusToAllTCs(delivery.id, "livre");

                // Marquer la livraison comme activée pour les modifications futures
                const deliveryKey = `delivery_activated_${
                  delivery.id || delivery.dossier_number
                }`;
                localStorage.setItem(deliveryKey, "true");

                // Affiche un message de succès
                showAccessMessage(
                  `✅ Tous les ${tcList.length} conteneurs ont été marqués comme livrés !`,
                  "green"
                );
              } catch (error) {
                console.error(`[MARK ALL] ❌ Erreur lors du marquage:`, error);
                showAccessMessage(
                  "❌ Erreur lors du marquage des conteneurs",
                  "red"
                );
              }
            };
          }

          // Gestion du bouton "Marquer tous comme non livrés"
          const unmarkAllBtn = popup.querySelector(".tc-popup-unmark-all");
          if (unmarkAllBtn) {
            unmarkAllBtn.onclick = async (ev) => {
              ev.stopPropagation();
              popup.style.display = "none";

              if (
                !confirm(
                  `Êtes-vous sûr de vouloir marquer TOUS les ${tcList.length} conteneurs comme NON livrés ?`
                )
              ) {
                return;
              }

              console.log(
                `[UNMARK ALL] 🎯 Marquage de tous les conteneurs comme non livrés pour la livraison ${delivery.id}`
              );

              try {
                // Utilise la fonction de propagation existante avec le statut "aucun"
                await window.propagateStatusToAllTCs(delivery.id, "aucun");

                // Marquer la livraison comme activée pour les modifications futures
                // (même quand on démarque, on garde l'autorisation de modification)
                const deliveryKey = `delivery_activated_${
                  delivery.id || delivery.dossier_number
                }`;
                localStorage.setItem(deliveryKey, "true");

                // Affiche un message de succès
                showAccessMessage(
                  `✅ Tous les ${tcList.length} conteneurs ont été marqués comme non livrés !`,
                  "green"
                );
              } catch (error) {
                console.error(
                  `[UNMARK ALL] ❌ Erreur lors du démarquage:`,
                  error
                );
                showAccessMessage(
                  "❌ Erreur lors du démarquage des conteneurs",
                  "red"
                );
              }
            };
          }
          document.addEventListener("click", function hidePopup(e) {
            if (!td.contains(e.target)) popup.style.display = "none";
          });
          td.appendChild(btn);
          td.appendChild(popup);
        } else if (tcList.length === 1) {
          const tag = document.createElement("span");
          tag.className = "tc-tag";
          tag.textContent = tcList[0];
          tag.style.cssText = `
            display: inline-block;
            background: #e6b800;
            color: #0e274e;
            font-weight: 700;
            font-size: 1em;
            padding: 3px 10px;
            border-radius: 10px;
            margin: 4px 1px 4px 1px;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 8px rgba(30,41,59,0.13),0 1px 0 #fff inset;
            cursor: pointer;
            transition: background 0.18s, box-shadow 0.18s;
            border: none;
            text-align: center;
          `;
          tag.onmouseenter = function () {
            tag.style.background = "#ffd700";
            tag.style.boxShadow =
              "0 6px 24px rgba(30,41,59,0.32),0 1px 0 #fff inset";
          };
          tag.onmouseleave = function () {
            tag.style.background = "#e6b800";
            tag.style.boxShadow =
              "0 3px 12px rgba(30,41,59,0.22),0 1px 0 #fff inset";
          };
          tag.onclick = (e) => {
            e.stopPropagation();
            // 🔧 MODIFICATION AMÉLIORÉE : Permettre la modification une fois que la livraison a été "activée"
            let canModify = isAllRequiredFilled();

            // Vérifier si cette livraison a déjà été "activée" pour les modifications
            const deliveryKey = `delivery_activated_${
              delivery.id || delivery.dossier_number
            }`;
            let isDeliveryActivated =
              localStorage.getItem(deliveryKey) === "true";

            // Vérifier si le conteneur a déjà eu un statut défini (même "aucun" après avoir été "livré")
            let hasStatusHistory = false;
            if (
              delivery.container_statuses &&
              typeof delivery.container_statuses === "object"
            ) {
              // Vérifier si le conteneur a un statut défini (même "aucun")
              hasStatusHistory =
                delivery.container_statuses[tcList[0]] !== undefined;

              // Si le conteneur est livré, marquer la livraison comme activée
              const status = delivery.container_statuses[tcList[0]];
              if (
                (status === "livre" || status === "livré") &&
                !isDeliveryActivated
              ) {
                localStorage.setItem(deliveryKey, "true");
                isDeliveryActivated = true;
              }
            }

            // Permettre la modification si :
            // 1. Tous les champs obligatoires sont remplis OU
            // 2. La livraison a déjà été activée (même si conteneur remis à "aucun") OU
            // 3. Le conteneur a un historique de statut
            if (!canModify && !isDeliveryActivated && !hasStatusHistory) {
              showAccessMessage(
                "Veuillez d'abord renseigner tous les champs obligatoires : NOM Agent visiteurs, TRANSPORTEUR, INSPECTEUR, AGENT EN DOUANES, CHAUFFEUR, TEL CHAUFFEUR, DATE LIVRAISON.",
                "red"
              );
              return;
            }

            showContainerDetailPopup(delivery, tcList[0]);
          };
          td.appendChild(tag);
        } else {
          td.textContent = "-";
        }
      } else if (col.id === "delivery_date") {
        // Correction : n'affiche rien si la date n'est pas renseignée
        let dDate = delivery.delivery_date;
        if (dDate) {
          let dateObj = new Date(dDate);
          if (!isNaN(dateObj.getTime())) {
            value = dateObj.toLocaleDateString("fr-FR");
          } else if (typeof dDate === "string") {
            value = dDate;
          }
        } else {
          value = "-";
        }
        // Cellule éditable avec sauvegarde/restauration
        if (editableCols.includes(col.id)) {
          td.classList.add("editable-cell");
          td.style.cursor = "pointer";
          // Affiche la valeur sauvegardée si elle existe
          let displayValue =
            savedValue !== null && savedValue !== ""
              ? new Date(savedValue).toLocaleDateString("fr-FR")
              : value;
          td.textContent = displayValue;
          // Style joli et gras pour les cellules éditables
          td.style.fontWeight = "bold";
          td.style.color = "#b91c1c"; // rouge foncé
          td.style.fontFamily = "'Segoe UI', 'Roboto', 'Arial', sans-serif";
          td.style.letterSpacing = "0.5px";
          td.style.background = "rgba(255, 230, 0, 0.08)"; // jaune très transparent
          td.style.borderRadius = "7px";
          td.style.boxShadow = "0 1px 6px rgba(30,41,59,0.07)";
          td.onclick = function (e) {
            if (td.querySelector("input")) return;
            const input = document.createElement("input");
            input.type = "date";
            // Si une valeur sauvegardée existe, la pré-remplir
            input.value = savedValue
              ? savedValue
              : dDate
              ? new Date(dDate).toISOString().split("T")[0]
              : "";
            input.style.width = "100%";
            input.style.fontSize = "1em";
            input.style.padding = "2px 4px";
            input.onkeydown = function (ev) {
              if (ev.key === "Enter") {
                let newVal = input.value
                  ? new Date(input.value).toLocaleDateString("fr-FR")
                  : "-";
                td.textContent = newVal;
                td.title = input.value;
                td.dataset.edited = "true";
                // Sauvegarde dans localStorage
                localStorage.setItem(
                  getCellStorageKey(delivery, col.id),
                  input.value
                );
                // === SYNCHRONISATION VERS SUIVIE ===
                syncDataToSuivie(delivery, col.id, input.value);
              }
            };
            input.onblur = function () {
              let newVal = input.value
                ? new Date(input.value).toLocaleDateString("fr-FR")
                : "-";
              td.textContent = newVal;
              td.title = input.value;
              td.dataset.edited = "true";
              // Sauvegarde dans localStorage
              localStorage.setItem(
                getCellStorageKey(delivery, col.id),
                input.value
              );
              // === SYNCHRONISATION VERS SUIVIE ===
              syncDataToSuivie(delivery, col.id, input.value);
            };
            td.textContent = "";
            td.appendChild(input);
            input.focus();
          };
        } else {
          td.textContent = value;
        }
        if (col.id === "observation") {
          td.classList.add("observation-col");
        }
      } else if (editableCols.includes(col.id)) {
        // Cellule éditable texte avec sauvegarde/restauration
        td.classList.add("editable-cell");
        td.style.cursor = "pointer";
        value =
          delivery[col.id] !== undefined &&
          delivery[col.id] !== null &&
          delivery[col.id] !== ""
            ? delivery[col.id]
            : "-";
        // Affiche la valeur sauvegardée si elle existe
        let displayValue =
          savedValue !== null && savedValue !== "" ? savedValue : value;
        td.textContent = displayValue;
        // Style joli et gras pour les cellules éditables
        td.style.fontWeight = "bold";
        td.style.color = "#b91c1c"; // rouge foncé
        td.style.fontFamily = "'Segoe UI', 'Roboto', 'Arial', sans-serif";
        td.style.letterSpacing = "0.5px";
        td.style.background = "rgba(255, 230, 0, 0.08)"; // jaune très transparent
        td.style.borderRadius = "7px";
        td.style.boxShadow = "0 1px 6px rgba(30,41,59,0.07)";
        td.onclick = function (e) {
          if (td.querySelector("input") || td.querySelector("textarea")) return;
          // Blocage pour observation si champs obligatoires non remplis
          if (col.id === "observation" && !isAllRequiredFilled()) {
            showAccessMessage(
              "Veuillez d'abord renseigner tous les champs obligatoires : NOM Agent visiteurs, TRANSPORTEUR, INSPECTEUR, AGENT EN DOUANES, CHAUFFEUR, TEL CHAUFFEUR, DATE LIVRAISON.",
              "red"
            );
            return;
          }
          let isLong = col.id === "observation";
          let input = isLong
            ? document.createElement("textarea")
            : document.createElement("input");
          if (!isLong) input.type = "text";
          // Correction : toujours pré-remplir avec la valeur sauvegardée si elle existe
          let currentText =
            savedValue !== null && savedValue !== ""
              ? savedValue
              : td.textContent && td.textContent.trim() !== "-"
              ? td.textContent.trim()
              : "";
          input.value = currentText;
          input.style.width = "100%";
          input.style.fontSize = "1em";
          input.style.padding = "2px 4px";
          input.onkeydown = function (ev) {
            if (ev.key === "Enter" && !isLong) {
              td.textContent = input.value || "-";
              td.title = input.value;
              td.dataset.edited = "true";
              // Sauvegarde dans localStorage
              localStorage.setItem(
                getCellStorageKey(delivery, col.id),
                input.value
              );
              // === SYNCHRONISATION VERS SUIVIE ===
              syncDataToSuivie(delivery, col.id, input.value);
              // Plus de vérification des champs - accès libre
              showAccessMessage(
                "Modification enregistrée avec succès.",
                "green"
              );
            }
          };
          input.onblur = function () {
            td.textContent = input.value || "-";
            td.title = input.value;
            td.dataset.edited = "true";
            // Sauvegarde dans localStorage
            localStorage.setItem(
              getCellStorageKey(delivery, col.id),
              input.value
            );
            // === SYNCHRONISATION VERS SUIVIE ===
            syncDataToSuivie(delivery, col.id, input.value);
            setTimeout(() => {
              if (isAllRequiredFilled()) {
                showAccessMessage(
                  "Accès débloqué : vous pouvez modifier le statut du conteneur et l'observation.",
                  "green"
                );
              } else {
                showAccessMessage(
                  "Vous n'avez plus accès à l'observation et au statut du conteneur.",
                  "red"
                );
              }
            }, 10);
          };
          td.textContent = "";
          td.appendChild(input);
          input.focus();
          // Pour textarea, placer le curseur à la fin
          if (isLong) {
            input.selectionStart = input.selectionEnd = input.value.length;
          }
        };
        if (col.id === "observation") {
          td.classList.add("observation-col");
        }
      } else if (col.id === "statut") {
        // Affichage du modèle "x sur y livré" dans chaque cellule de la colonne Statut uniquement si au moins un conteneur est livré
        let tcList = [];
        if (
          delivery.container_numbers_list &&
          Array.isArray(delivery.container_numbers_list)
        ) {
          tcList = delivery.container_numbers_list.filter(Boolean);
          console.log(
            `[DEBUG STATUT] Utilisation container_numbers_list (${tcList.length}):`,
            tcList
          );
        } else if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
          console.log(
            `[DEBUG STATUT] Utilisation container_number array (${tcList.length}):`,
            tcList
          );
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
          console.log(
            `[DEBUG STATUT] Utilisation container_number string (${tcList.length}):`,
            tcList
          );
        }
        console.log(
          `[DEBUG STATUT] Delivery ID: ${
            delivery.id || delivery.dossier_number
          }, Total TC: ${tcList.length}`
        );
        let total = tcList.length;
        let delivered = 0;
        if (
          delivery.container_statuses &&
          typeof delivery.container_statuses === "object"
        ) {
          delivered = tcList.filter((tc) => {
            const s = delivery.container_statuses[tc];
            return s === "livre" || s === "livré";
          }).length;
        }
        td.setAttribute("data-col-id", "statut");
        if (delivered > 0) {
          if (delivered === total && total > 0) {
            // Tous les conteneurs sont livrés : bouton vert avec icône camion et texte "Livré"
            td.innerHTML = `<button style="display:flex;align-items:center;gap:8px;font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #22c55e;background:#e6fff5;color:#22c55e;">
              <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' style='vertical-align:middle;'><rect x='2' y='7' width='15' height='8' rx='2' fill='#22c55e'/><path d='M17 10h2.382a2 2 0 0 1 1.789 1.106l1.382 2.764A1 1 0 0 1 22 15h-2v-2a1 1 0 0 0-1-1h-2v-2z' fill='#22c55e'/><circle cx='7' cy='18' r='2' fill='#22c55e'/><circle cx='17' cy='18' r='2' fill='#22c55e'/></svg>
              Livré
            </button>`;
          } else {
            // Affichage classique : x sur y livré(s)
            td.innerHTML = `<button style="font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #eab308;background:#fffbe6;color:#b45309;">${delivered} sur ${total} livré${
              total > 1 ? "s" : ""
            }</button>`;
          }
        } else {
          td.innerHTML = "";
        }
      } else if (
        col.id === "date_echange_bl" ||
        col.id === "date_do" ||
        col.id === "date_badt"
      ) {
        // Traitement spécial pour les colonnes de dates
        let dateValue = delivery[col.id];
        if (dateValue) {
          let dateObj = new Date(dateValue);
          if (!isNaN(dateObj.getTime())) {
            value = dateObj.toLocaleDateString("fr-FR");
          } else if (typeof dateValue === "string") {
            value = dateValue;
          }
        } else {
          value = "-";
        }
        td.textContent = value;
        // Style spécial pour les colonnes de dates
        td.style.fontWeight = "bold";
        td.style.color = "#1e40af"; // bleu foncé
        td.style.fontFamily = "'Segoe UI', 'Roboto', 'Arial', sans-serif";
        td.style.letterSpacing = "0.5px";
        td.style.background = "rgba(59, 130, 246, 0.08)"; // bleu très transparent
        td.style.borderRadius = "7px";
        td.style.boxShadow = "0 1px 6px rgba(30,41,59,0.07)";
        td.style.width = "140px";
        td.style.minWidth = "140px";
        td.style.textAlign = "center";
      } else {
        // Pour toutes les autres colonnes, on affiche "-" si la donnée est absente, vide ou nulle
        value =
          delivery[col.id] !== undefined &&
          delivery[col.id] !== null &&
          delivery[col.id] !== ""
            ? delivery[col.id]
            : "-";
        td.textContent = value;
        if (col.id === "observation") {
          td.classList.add("observation-col");
        }
      }
      tr.appendChild(td);
      // ...existing code for showContainerDetailPopup...
      function showContainerDetailPopup(delivery, containerNumber) {
        // 🔧 MODIFICATION : Les champs sont maintenant facultatifs - accès libre

        // Message d'accès libre
        showAccessMessage(
          "Accès libre : vous pouvez modifier le statut du conteneur et l'observation.",
          "green"
        );
        const oldPopup = document.getElementById("containerDetailPopup");
        if (oldPopup) oldPopup.remove();
        const overlay = document.createElement("div");
        overlay.id = "containerDetailPopup";
        overlay.style.position = "fixed";
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(30,41,59,0.45)";
        overlay.style.zIndex = 9999;
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        const box = document.createElement("div");
        box.style.background = "#fff";
        box.style.borderRadius = "16px";
        box.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
        box.style.maxWidth = "420px";
        box.style.width = "96vw";
        box.style.maxHeight = "92vh";
        box.style.overflowY = "auto";
        box.style.padding = "0";
        box.style.position = "relative";
        const header = document.createElement("div");
        header.style.background = "#2563eb";
        header.style.color = "#fff";
        header.style.padding = "18px 28px 12px 28px";
        header.style.fontWeight = "bold";
        header.style.fontSize = "1.15rem";
        header.style.display = "flex";
        header.style.flexDirection = "column";
        header.style.borderTopLeftRadius = "16px";
        header.style.borderTopRightRadius = "16px";
        header.innerHTML = `
      <div style='margin-bottom:2px;'>
        <span style='font-size:1.08em;'>${delivery.employee_name || "-"}</span>
      </div>
      <div style='font-size:0.98em;font-weight:400;'>
        Client : <span style='color:#eab308;'>${
          delivery.client_name || "-"
        }</span><br>
        Dossier : <span style='color:#eab308;'>${
          delivery.dossier_number || "-"
        }</span>  
      </div>
    `;
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.background = "none";
        closeBtn.style.border = "none";
        closeBtn.style.color = "#fff";
        closeBtn.style.fontSize = "2.1rem";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "10px";
        closeBtn.style.right = "18px";
        closeBtn.setAttribute("aria-label", "Fermer");
        closeBtn.onclick = () => overlay.remove();
        header.appendChild(closeBtn);
        box.appendChild(header);
        const content = document.createElement("div");
        content.style.padding = "24px 24px 24px 24px";
        content.style.background = "#f8fafc";
        content.style.flex = "1 1 auto";
        content.style.overflowY = "auto";
        const tcNum = document.createElement("div");
        tcNum.style.fontSize = "1.25em";
        tcNum.style.fontWeight = "bold";
        tcNum.style.marginBottom = "18px";
        tcNum.style.textAlign = "center";
        tcNum.innerHTML = `Numéro du conteneur : <span style='color:#2563eb;'>${containerNumber}</span>`;
        content.appendChild(tcNum);
        const label = document.createElement("label");
        label.textContent = "Statut du conteneur :";
        label.style.display = "block";
        label.style.marginBottom = "8px";
        label.style.fontWeight = "500";
        content.appendChild(label);
        const select = document.createElement("select");
        select.style.width = "100%";
        select.style.padding = "10px 12px";
        select.style.border = "1.5px solid #2563eb";
        select.style.borderRadius = "7px";
        select.style.fontSize = "1.08em";
        select.style.marginBottom = "18px";
        select.style.background = "#fff";
        select.style.boxShadow = "0 1px 4px rgba(30,41,59,0.04)";
        // Statuts proposés : 'livré' et 'aucun'
        const statusOptions = [
          { value: "livre", label: "Livré" },
          { value: "aucun", label: "Aucun" },
        ];
        let currentStatus =
          delivery.container_statuses &&
          typeof delivery.container_statuses === "object" &&
          !Array.isArray(delivery.container_statuses) &&
          delivery.container_statuses[containerNumber]
            ? delivery.container_statuses[containerNumber]
            : "aucun";
        statusOptions.forEach((opt) => {
          const option = document.createElement("option");
          option.value = opt.value;
          option.textContent = opt.label;
          if (opt.value === currentStatus) option.selected = true;
          select.appendChild(option);
        });
        content.appendChild(select);
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Enregistrer le statut";
        saveBtn.className = "btn btn-primary w-full mt-2";
        saveBtn.style.background =
          "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
        saveBtn.style.color = "#fff";
        saveBtn.style.fontWeight = "bold";
        saveBtn.style.fontSize = "1em";
        saveBtn.style.border = "none";
        saveBtn.style.borderRadius = "8px";
        saveBtn.style.padding = "0.7em 1.7em";
        saveBtn.style.boxShadow = "0 2px 12px rgba(37,99,235,0.13)";
        saveBtn.onclick = async () => {
          try {
            // === APPEL API BACKEND UNIQUE POUR PERSISTER ET DÉCLENCHER WEBSOCKET ===
            const response = await fetch(
              `/deliveries/${delivery.id}/container-status`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  containerNumber: containerNumber,
                  status: select.value,
                }),
              }
            );

            if (response.ok) {
              const result = await response.json();
              console.log(
                `[RESP_LIV] Statut conteneur ${containerNumber} mis à jour:`,
                result
              );

              alert(
                `Statut du conteneur mis à jour : ${
                  select.options[select.selectedIndex].text
                }`
              );
              overlay.remove();

              // Marquer la livraison comme activée pour les modifications futures
              const deliveryKey = `delivery_activated_${
                delivery.id || delivery.dossier_number
              }`;
              localStorage.setItem(deliveryKey, "true");

              // Mise à jour instantanée du statut dans allDeliveries
              if (delivery && delivery.id) {
                const idx = window.allDeliveries.findIndex(
                  (d) => d.id === delivery.id
                );
                if (idx !== -1) {
                  if (
                    !window.allDeliveries[idx].container_statuses ||
                    typeof window.allDeliveries[idx].container_statuses !==
                      "object"
                  ) {
                    window.allDeliveries[idx].container_statuses = {};
                  }
                  window.allDeliveries[idx].container_statuses[
                    containerNumber
                  ] = select.value;

                  // 🔧 SYNCHRONISATION FORCÉE : S'assurer que les données JSON sont à jour
                  if (
                    !window.allDeliveries[idx].container_numbers_list ||
                    !Array.isArray(
                      window.allDeliveries[idx].container_numbers_list
                    )
                  ) {
                    console.log(
                      `[SYNC] Synchronisation forcée pour delivery ${delivery.id}`
                    );

                    // Reconstruction des données JSON si elles manquent
                    let tcList = [];
                    if (Array.isArray(delivery.container_number)) {
                      tcList = delivery.container_number.filter(Boolean);
                    } else if (typeof delivery.container_number === "string") {
                      if (delivery.container_number.includes("+")) {
                        // Données tronquées détectées
                        const parts =
                          delivery.container_number.split(/\s*\+\s*\d+\s*/);
                        if (parts.length > 0) {
                          tcList = parts[0].split(/[,;\s]+/).filter(Boolean);
                        }
                      } else {
                        tcList = delivery.container_number
                          .split(/[,;\s]+/)
                          .filter(Boolean);
                      }
                    }

                    if (tcList.length > 0) {
                      window.allDeliveries[idx].container_numbers_list = tcList;

                      if (!window.allDeliveries[idx].container_foot_types_map) {
                        window.allDeliveries[idx].container_foot_types_map = {};
                        tcList.forEach((tc) => {
                          window.allDeliveries[idx].container_foot_types_map[
                            tc
                          ] = delivery.container_foot_type || "20";
                        });
                      }

                      console.log(
                        `[SYNC] ✅ Données JSON synchronisées: ${tcList.length} TC`
                      );
                    }
                  }
                }
              }

              //   MISE À JOUR INSTANTANÉE POUR UN SEUL TC (pas de propagation automatique)
              console.log(
                `[SINGLE UPDATE] Mise à jour instantanée pour TC: ${containerNumber}`
              );

              const row = document.querySelector(
                `#deliveriesTableBody tr[data-delivery-id='${delivery.id}']`
              );
              if (row) {
                const statutCell = row.querySelector(
                  "td[data-col-id='statut']"
                );
                if (statutCell) {
                  // Recalcule le statut avec les données mises à jour
                  const updatedDelivery = window.allDeliveries.find(
                    (d) => d.id === delivery.id
                  );
                  let tcList = [];

                  if (
                    updatedDelivery &&
                    updatedDelivery.container_numbers_list &&
                    Array.isArray(updatedDelivery.container_numbers_list)
                  ) {
                    tcList = updatedDelivery.container_numbers_list;
                  } else if (Array.isArray(delivery.container_number)) {
                    tcList = delivery.container_number.filter(Boolean);
                  } else if (typeof delivery.container_number === "string") {
                    tcList = delivery.container_number
                      .split(/[,;\s]+/)
                      .filter(Boolean);
                  }

                  let delivered = 0;
                  if (updatedDelivery && updatedDelivery.container_statuses) {
                    delivered = tcList.filter((tc) => {
                      const s = updatedDelivery.container_statuses[tc];
                      return s === "livre" || s === "livré";
                    }).length;
                  }

                  const total = tcList.length;
                  console.log(
                    `[SINGLE UPDATE] Statut calculé: ${delivered}/${total} livrés`
                  );

                  // 🆕 AJOUT : Enregistrer le conteneur individuel dans l'historique s'il vient d'être livré
                  if (select.value === "livre" || select.value === "livré") {
                    saveToDeliveryHistory(
                      updatedDelivery || delivery,
                      containerNumber
                    );
                    showHistoryButtonIfNeeded();
                  }

                  // Met à jour l'affichage du statut
                  if (delivered === total && total > 0) {
                    // 🆕 AJOUT : Enregistrer dans l'historique professionnel quand livré
                    saveToDeliveryHistory(
                      updatedDelivery || delivery,
                      containerNumber
                    );
                    // 🆕 AJOUT : Afficher le bouton historique s'il n'est pas déjà visible
                    showHistoryButtonIfNeeded();
                    // Tous livrés : bouton vert + icône camion + texte Livré
                    statutCell.innerHTML = `<button style="display:flex;align-items:center;gap:8px;font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #22c55e;background:#e6fff5;color:#22c55e;">
                      <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' style='vertical-align:middle;'><rect x='2' y='7' width='15' height='8' rx='2' fill='#22c55e'/><path d='M17 10h2.382a2 2 0 0 1 1.789 1.106l1.382 2.764A1 1 0 0 1 22 15h-2v-2a1 1 0 0 0-1-1h-2v-2z' fill='#22c55e'/><circle cx='7' cy='18' r='2' fill='#22c55e'/><circle cx='17' cy='18' r='2' fill='#22c55e'/></svg>
                      Livré
                    </button>`;
                  } else if (delivered > 0) {
                    // Affichage classique : x sur y livré(s) avec le NOMBRE EXACT
                    statutCell.innerHTML = `<button style="font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #eab308;background:#fffbe6;color:#b45309;">${delivered} sur ${total} livré${
                      total > 1 ? "s" : ""
                    }</button>`;
                  } else {
                    statutCell.innerHTML = "";
                  }

                  console.log(
                    `[SINGLE UPDATE] ✅ Cellule statut mise à jour instantanément`
                  );
                }
              }

              // 🔧 CORRECTION : Plus de rechargement complet du tableau - mise à jour ciblée uniquement
              // Note: Le tableau ne sera plus rechargé complètement, évitant ainsi la perte des données JSON synchronisées

              // Stockage local pour synchronisation immédiate
              const containerSyncKey = `container_status_${
                delivery.id || delivery.dossier_number
              }_${containerNumber}`;
              const containerSyncData = {
                deliveryId: delivery.id || delivery.dossier_number,
                containerNumber: containerNumber,
                status: select.value,
                timestamp: Date.now(),
                type: "container_status_update",
                deliveredCount: result.deliveredCount || 0,
                totalCount: result.totalCount || 0,
              };

              localStorage.setItem(
                containerSyncKey,
                JSON.stringify(containerSyncData)
              );

              // Déclencher un événement storage personnalisé pour la synchronisation immédiate
              window.dispatchEvent(
                new CustomEvent("containerStatusUpdate", {
                  detail: containerSyncData,
                })
              );

              console.log(
                `[RESP_LIV] Synchronisation vers tableauDeBord.html réussie pour conteneur ${containerNumber}`
              );
            } else {
              const errorData = await response.json();
              console.error(
                `[RESP_LIV] Erreur mise à jour statut conteneur:`,
                errorData
              );
              alert(
                errorData.message ||
                  "Erreur lors de la mise à jour du statut du conteneur."
              );
            }
          } catch (error) {
            console.error(
              `[RESP_LIV] Erreur réseau lors de la mise à jour:`,
              error
            );
            alert(
              "Erreur réseau lors de la mise à jour du statut du conteneur."
            );
          }
        };
        content.appendChild(saveBtn);
        box.appendChild(content);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
      }
    });
    tableBodyElement.appendChild(tr);
  });
}
// Ajout d'adaptation responsive pour le tableau générésss
function adaptTableResponsive() {
  const table = document.getElementById("deliveriesTable");
  if (!table) return;
  // Pour les petits écrans, réduire la taille de police et le padding
  if (window.innerWidth <= 900) {
    table.style.fontSize = "0.98em";
    Array.from(table.querySelectorAll("th, td")).forEach((cell) => {
      cell.style.padding = "0.45rem";
      cell.style.fontSize = "0.98em";
      cell.style.minWidth = "80px";
    });
  }
  if (window.innerWidth <= 600) {
    table.style.fontSize = "0.93em";
    Array.from(table.querySelectorAll("th, td")).forEach((cell) => {
      cell.style.padding = "0.32rem 0.3rem";
      cell.style.fontSize = "0.93em";
      cell.style.minWidth = "60px";
    });
  }
}
window.addEventListener("resize", adaptTableResponsive);
adaptTableResponsive();

// ----------- AVATAR PROFIL EN HAUT À DROITE + DÉCONNEXION -----------
document.addEventListener("DOMContentLoaded", function () {
  // Crée le conteneur avatar
  const avatarContainer = document.createElement("div");
  avatarContainer.id = "profile-avatar-container";
  avatarContainer.style.position = "fixed";
  avatarContainer.style.top = "22px";
  avatarContainer.style.right = "32px";
  avatarContainer.style.zIndex = "100050";
  avatarContainer.style.display = "flex";
  avatarContainer.style.alignItems = "center";
  avatarContainer.style.cursor = "pointer";
  avatarContainer.style.background = "#fff";
  avatarContainer.style.borderRadius = "50px";
  avatarContainer.style.boxShadow = "0 4px 18px rgba(30,60,114,0.13)";
  avatarContainer.style.padding = "7px 18px 7px 7px";
  avatarContainer.style.transition = "box-shadow 0.2s";
  avatarContainer.onmouseenter = function () {
    avatarContainer.style.boxShadow = "0 8px 32px #ffc10755";
  };
  avatarContainer.onmouseleave = function () {
    avatarContainer.style.boxShadow = "0 4px 18px rgba(30,60,114,0.13)";
  };

  // Avatar image
  const avatarImg = document.createElement("img");
  avatarImg.src = "https://cdn-icons-png.flaticon.com/512/1048/1048953.png";
  avatarImg.alt = "Avatar profil";
  avatarImg.style.width = "38px";
  avatarImg.style.height = "38px";
  avatarImg.style.borderRadius = "50%";
  avatarImg.style.objectFit = "cover";
  avatarImg.style.marginRight = "12px";
  avatarImg.style.boxShadow = "0 2px 8px #ffc10733";
  avatarContainer.appendChild(avatarImg);

  // Infos utilisateur
  const infoDiv = document.createElement("div");
  infoDiv.style.display = "flex";
  infoDiv.style.flexDirection = "column";
  infoDiv.style.justifyContent = "center";
  infoDiv.style.alignItems = "flex-start";
  infoDiv.style.gap = "2px";
  infoDiv.style.fontFamily = "Montserrat, Arial, sans-serif";
  infoDiv.style.fontSize = "1.01em";
  infoDiv.style.color = "#1e3c72";
  infoDiv.style.fontWeight = "700";

  // Récupère nom et email depuis localStorage
  let userEmail = localStorage.getItem("user_email") || "-";
  let userName = localStorage.getItem("user_nom");
  if (!userName || userName === "Utilisateur") {
    // Si le nom n'est pas défini, utiliser la partie avant le @ de l'email
    if (userEmail && userEmail.includes("@")) {
      userName = userEmail.split("@")[0];
    } else {
      userName = "-";
    }
  }
  infoDiv.innerHTML = `<span style='font-weight:700;'>${userName}</span><span style='font-weight:400;font-size:0.97em;color:#2a5298;'>${userEmail}</span>`;
  avatarContainer.appendChild(infoDiv);

  // Ajoute le conteneur au body
  document.body.appendChild(avatarContainer);

  // Ajout de la boîte flottante profil
  let profilePopup = null;
  avatarContainer.onclick = function (e) {
    e.stopPropagation();
    // Si déjà ouverte, fermer
    if (profilePopup && profilePopup.style.display === "block") {
      profilePopup.style.display = "none";
      return;
    }
    // Crée la boîte si pas déjà créée
    if (!profilePopup) {
      profilePopup = document.createElement("div");
      profilePopup.id = "profile-popup-box";
      profilePopup.style.position = "fixed";
      profilePopup.style.top = "70px";
      profilePopup.style.right = "42px";
      profilePopup.style.zIndex = "100051";
      profilePopup.style.background = "#fff";
      profilePopup.style.borderRadius = "18px";
      profilePopup.style.boxShadow = "0 8px 32px #2563eb33";
      profilePopup.style.padding = "28px 32px 24px 32px";
      profilePopup.style.display = "block";
      profilePopup.style.minWidth = "260px";
      profilePopup.style.maxWidth = "96vw";
      profilePopup.style.textAlign = "center";
      profilePopup.style.fontFamily = "Montserrat, Arial, sans-serif";
      // Photo de profil avec croix pour suppression
      const photoWrapper = document.createElement("div");
      photoWrapper.style.position = "relative";
      photoWrapper.style.display = "inline-block";
      photoWrapper.style.marginBottom = "12px";
      const imgEdit = document.createElement("img");
      imgEdit.id = "profile-avatar-edit-img";
      imgEdit.src = localStorage.getItem("user_photo") || avatarImg.src;
      imgEdit.alt = "Photo de profil";
      imgEdit.style.width = "64px";
      imgEdit.style.height = "64px";
      imgEdit.style.borderRadius = "50%";
      imgEdit.style.objectFit = "cover";
      imgEdit.style.boxShadow = "0 2px 8px #e0e7ef33";
      photoWrapper.appendChild(imgEdit);
      // Croix pour suppression
      const removeBtn = document.createElement("button");
      removeBtn.innerHTML = "&times;";
      removeBtn.title = "Supprimer la photo";
      removeBtn.style.position = "absolute";
      removeBtn.style.top = "-8px";
      removeBtn.style.right = "-8px";
      removeBtn.style.width = "22px";
      removeBtn.style.height = "22px";
      removeBtn.style.border = "1px solid #d1d5db";
      removeBtn.style.background = "#fff";
      removeBtn.style.color = "#2563eb";
      removeBtn.style.borderRadius = "50%";
      removeBtn.style.fontSize = "1.2em";
      removeBtn.style.cursor = "pointer";
      removeBtn.style.display = "flex";
      removeBtn.style.alignItems = "center";
      removeBtn.style.justifyContent = "center";
      removeBtn.onclick = function () {
        localStorage.removeItem("user_photo");
        imgEdit.src = avatarImg.src =
          "https://cdn-icons-png.flaticon.com/512/1048/1048953.png";
      };
      photoWrapper.appendChild(removeBtn);
      profilePopup.appendChild(photoWrapper);
      // Bouton pour choisir une photo (style simple)
      const photoBtn = document.createElement("button");
      photoBtn.textContent = "Changer la photo";
      photoBtn.style.margin = "0 0 18px 0";
      photoBtn.style.padding = "7px 18px";
      photoBtn.style.borderRadius = "6px";
      photoBtn.style.border = "1px solid #d1d5db";
      photoBtn.style.background = "#fff";
      photoBtn.style.color = "#2563eb";
      photoBtn.style.fontWeight = "500";
      photoBtn.style.cursor = "pointer";
      photoBtn.style.fontSize = "1em";
      profilePopup.appendChild(photoBtn);
      // Input file caché
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";
      photoBtn.onclick = function () {
        fileInput.click();
      };
      fileInput.onchange = function (ev) {
        const file = ev.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            imgEdit.src = e.target.result;
            avatarImg.src = e.target.result;
            localStorage.setItem("user_photo", e.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      profilePopup.appendChild(fileInput);
      // Bouton déconnexion (style simple)
      const logoutBtn = document.createElement("button");
      logoutBtn.textContent = "Déconnexion";
      logoutBtn.style.margin = "12px 0 0 0";
      logoutBtn.style.padding = "9px 24px";
      logoutBtn.style.borderRadius = "6px";
      logoutBtn.style.border = "1px solid #d1d5db";
      logoutBtn.style.background = "#fff";
      logoutBtn.style.color = "#2563eb";
      logoutBtn.style.fontWeight = "500";
      logoutBtn.style.cursor = "pointer";
      logoutBtn.style.fontSize = "1.08em";
      logoutBtn.onclick = function () {
        localStorage.removeItem("user_nom");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_photo");
        window.location.href =
          "https://plateformdesuivie-its-service-1cjx.onrender.com/html/repoLivAuth.html";
      };
      profilePopup.appendChild(logoutBtn);
      document.body.appendChild(profilePopup);
    } else {
      profilePopup.style.display = "block";
    }
    // Met à jour la photo si elle existe
    const imgEdit = document.getElementById("profile-avatar-edit-img");
    if (imgEdit && localStorage.getItem("user_photo")) {
      imgEdit.src = localStorage.getItem("user_photo");
      avatarImg.src = localStorage.getItem("user_photo");
    }
    // Fermer la boîte si clic en dehors
    setTimeout(() => {
      document.addEventListener("click", function hideProfilePopup(ev) {
        if (
          profilePopup &&
          !profilePopup.contains(ev.target) &&
          ev.target !== avatarContainer
        ) {
          profilePopup.style.display = "none";
          document.removeEventListener("click", hideProfilePopup);
        }
      });
    }, 10);
  };
});
/***bn */

// --- POPUP HISTORIQUE DES DOSSIERS LIVRÉS ---
document.addEventListener("DOMContentLoaded", function () {
  const historyBtn = document.getElementById("historyIconBtn");
  if (!historyBtn) return;
  historyBtn.addEventListener("click", function (e) {
    e.preventDefault();
    // Récupérer tous les dossiers livrés
    const allDeliveries = window.allDeliveries || [];
    // Un dossier est livré si au moins un conteneur a le statut 'livre' ou 'Livré'
    const isDelivered = (delivery) => {
      if (
        !delivery.container_statuses ||
        typeof delivery.container_statuses !== "object"
      )
        return false;
      return Object.values(delivery.container_statuses).some(
        (s) =>
          String(s).toLowerCase() === "livre" ||
          String(s).toLowerCase() === "livré"
      );
    };
    const deliveredList = allDeliveries.filter(isDelivered);
    // Créer la popup
    let popup = document.getElementById("historyPopup");
    if (popup) popup.remove();
    popup = document.createElement("div");
    popup.id = "historyPopup";
    popup.style.position = "fixed";
    popup.style.top = "0";
    popup.style.left = "0";
    popup.style.width = "100vw";
    popup.style.height = "100vh";
    popup.style.background = "rgba(30,41,59,0.32)";
    popup.style.zIndex = "100100";
    popup.style.display = "flex";
    popup.style.alignItems = "center";
    popup.style.justifyContent = "center";
    // Contenu principal
    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.borderRadius = "18px";
    box.style.boxShadow = "0 8px 32px #0e274e33";
    box.style.maxWidth = "98vw";
    box.style.width = "900px";
    box.style.maxHeight = "90vh";
    box.style.overflowY = "auto";
    box.style.padding = "32px 28px 24px 28px";
    box.style.position = "relative";
    // Titre
    const title = document.createElement("h2");
    title.textContent = "Historique des dossiers livrés";
    title.style.fontWeight = "900";
    title.style.fontSize = "1.45em";
    title.style.color = "#0e274e";
    title.style.marginBottom = "18px";
    box.appendChild(title);
    // Bouton de fermeture
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.title = "Fermer";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "12px";
    closeBtn.style.right = "18px";
    closeBtn.style.width = "32px";
    closeBtn.style.height = "32px";
    closeBtn.style.border = "none";
    closeBtn.style.background = "#fff";
    closeBtn.style.color = "#0e274e";
    closeBtn.style.fontSize = "2em";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.borderRadius = "50%";
    closeBtn.style.boxShadow = "0 2px 8px #0e274e22";
    closeBtn.onclick = () => popup.remove();
    box.appendChild(closeBtn);
    // Si aucun dossier livré
    if (deliveredList.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "Aucun dossier livré pour le moment.";
      empty.style.textAlign = "center";
      empty.style.color = "#64748b";
      empty.style.fontSize = "1.15em";
      empty.style.margin = "32px 0";
      box.appendChild(empty);
    } else {
      // Affichage sous forme de cartes cliquables
      const cardsContainer = document.createElement("div");
      cardsContainer.style.display = "flex";
      cardsContainer.style.flexWrap = "wrap";
      cardsContainer.style.gap = "18px";
      cardsContainer.style.justifyContent = "center";
      deliveredList.forEach((delivery, idx) => {
        let tcList = [];
        if (
          delivery.container_numbers_list &&
          Array.isArray(delivery.container_numbers_list)
        ) {
          tcList = delivery.container_numbers_list.filter(Boolean);
        } else if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
        }
        let statuses = delivery.container_statuses || {};
        let allDelivered =
          tcList.length > 0 &&
          tcList.every((tc) => {
            let s = statuses[tc];
            return (
              s &&
              (String(s).toLowerCase() === "livre" ||
                String(s).toLowerCase() === "livré")
            );
          });
        let statut = allDelivered ? "Livré" : "Partiel";
        let dateLiv = delivery.delivery_date || delivery.created_at || "-";
        let dateLivAff = "-";
        if (dateLiv) {
          let d = new Date(dateLiv);
          if (!isNaN(d.getTime())) dateLivAff = d.toLocaleDateString("fr-FR");
        }
        let dateCre = delivery.created_at || delivery.delivery_date || "-";
        let dateCreAff = "-";
        if (dateCre) {
          let d = new Date(dateCre);
          if (!isNaN(d.getTime())) dateCreAff = d.toLocaleDateString("fr-FR");
        }
        let obs = delivery.observation || "-";
        let dossier = delivery.dossier_number || delivery.bl_number || "-";
        let tcStr = tcList.length ? tcList.join(", ") : "-";
        // Carte cliquable
        const card = document.createElement("div");
        card.className = "history-card";
        card.style.background =
          "linear-gradient(90deg,#f8fafc 0%,#e6b80011 100%)";
        card.style.border = "1.5px solid #ffc107";
        card.style.borderRadius = "16px";
        card.style.boxShadow = "0 2px 12px #0e274e11";
        card.style.padding = "18px 22px 14px 22px";
        card.style.minWidth = "260px";
        card.style.maxWidth = "340px";
        card.style.flex = "1 1 300px";
        card.style.cursor = "pointer";
        card.style.transition = "box-shadow 0.18s";
        card.onmouseenter = () =>
          (card.style.boxShadow = "0 8px 32px #ffc10733");
        card.onmouseleave = () =>
          (card.style.boxShadow = "0 2px 12px #0e274e11");
        card.innerHTML = `
          <div style='display:flex;align-items:center;gap:10px;margin-bottom:8px;'>
            <span style='font-size:1.25em;font-weight:900;color:#0e274e;'>#${
              idx + 1
            }</span>
            <span style='font-size:1em;font-weight:700;color:#2563eb;background:#e6b80022;padding:2px 10px;border-radius:8px;'>${statut}</span>
            <span style='font-size:0.98em;color:#64748b;margin-left:auto;'>${dateLivAff}</span>
          </div>
          <div style='font-size:1.08em;font-weight:700;color:#0e274e;margin-bottom:4px;'>${
            delivery.visitor_agent_name || "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Transporteur :</b> ${
            delivery.transporter || "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Inspecteur :</b> ${
            delivery.inspector || "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Agent en douanes :</b> ${
            delivery.customs_agent || "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Chauffeur :</b> ${
            delivery.driver || "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Tél chauffeur :</b> ${
            delivery.driver_phone || "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>N° TC :</b> ${tcStr}</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>N° Dossier :</b> ${dossier}</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Observations :</b> ${obs}</div>
          <div style='font-size:0.95em;color:#64748b;margin-top:6px;'><b>Date enregistrement :</b> ${dateCreAff}</div>
        `;
        // Affichage détaillé au clic (popup individuelle)
        card.onclick = function () {
          let detailPopup = document.getElementById("historyDetailPopup");
          if (detailPopup) detailPopup.remove();
          detailPopup = document.createElement("div");
          detailPopup.id = "historyDetailPopup";
          detailPopup.style.position = "fixed";
          detailPopup.style.top = "0";
          detailPopup.style.left = "0";
          detailPopup.style.width = "100vw";
          detailPopup.style.height = "100vh";
          detailPopup.style.background = "rgba(30,41,59,0.32)";
          detailPopup.style.zIndex = "100200";
          detailPopup.style.display = "flex";
          detailPopup.style.alignItems = "center";
          detailPopup.style.justifyContent = "center";
          const detailBox = document.createElement("div");
          detailBox.style.background = "#fff";
          detailBox.style.borderRadius = "18px";
          detailBox.style.boxShadow = "0 8px 32px #0e274e33";
          detailBox.style.maxWidth = "96vw";
          detailBox.style.width = "420px";
          detailBox.style.maxHeight = "90vh";
          detailBox.style.overflowY = "auto";
          detailBox.style.padding = "32px 28px 24px 28px";
          detailBox.style.position = "relative";
          // Titre
          const detailTitle = document.createElement("h3");
          detailTitle.textContent = `Dossier #${idx + 1} — ${statut}`;
          detailTitle.style.fontWeight = "900";
          detailTitle.style.fontSize = "1.18em";
          detailTitle.style.color = "#0e274e";
          detailTitle.style.marginBottom = "12px";
          detailBox.appendChild(detailTitle);
          // Bouton fermeture
          const closeDetailBtn = document.createElement("button");
          closeDetailBtn.innerHTML = "&times;";
          closeDetailBtn.title = "Fermer";
          closeDetailBtn.style.position = "absolute";
          closeDetailBtn.style.top = "12px";
          closeDetailBtn.style.right = "18px";
          closeDetailBtn.style.width = "32px";
          closeDetailBtn.style.height = "32px";
          closeDetailBtn.style.border = "none";
          closeDetailBtn.style.background = "#fff";
          closeDetailBtn.style.color = "#0e274e";
          closeDetailBtn.style.fontSize = "2em";
          closeDetailBtn.style.cursor = "pointer";
          closeDetailBtn.style.borderRadius = "50%";
          closeDetailBtn.style.boxShadow = "0 2px 8px #0e274e22";
          closeDetailBtn.onclick = () => detailPopup.remove();
          detailBox.appendChild(closeDetailBtn);
          // Contenu détaillé
          detailBox.innerHTML += `
            <div style='font-size:1.08em;font-weight:700;color:#0e274e;margin-bottom:8px;'>${
              delivery.visitor_agent_name || "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Transporteur :</b> ${
              delivery.transporter || "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Inspecteur :</b> ${
              delivery.inspector || "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Agent en douanes :</b> ${
              delivery.customs_agent || "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Chauffeur :</b> ${
              delivery.driver || "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Tél chauffeur :</b> ${
              delivery.driver_phone || "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>N° TC :</b> ${tcStr}</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>N° Dossier :</b> ${dossier}</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Observations :</b> ${obs}</div>
            <div style='font-size:0.95em;color:#64748b;margin-top:6px;'><b>Date livraison :</b> ${dateLivAff}</div>
            <div style='font-size:0.95em;color:#64748b;'><b>Date enregistrement :</b> ${dateCreAff}</div>
          `;
          detailPopup.appendChild(detailBox);
          document.body.appendChild(detailPopup);
          // Fermer la popup si clic hors de la box
          detailPopup.addEventListener("click", function (ev) {
            if (ev.target === detailPopup) detailPopup.remove();
          });
        };
        cardsContainer.appendChild(card);
      });
      box.appendChild(cardsContainer);
    }
    popup.appendChild(box);
    document.body.appendChild(popup);
    // Fermer la popup si clic hors de la boxejsbdh
    popup.addEventListener("click", function (ev) {
      if (ev.target === popup) popup.remove();
    });
  });
});

// --- AJOUT : Bouton Générer PDF et logique associée ---
// Création du bouton Générer PDF
const pdfBtn = document.createElement("button");
pdfBtn.id = "generatePdfBtn";
pdfBtn.textContent = "Générer PDF";
pdfBtn.style.background = "#2563eb";
pdfBtn.style.color = "#fff";
pdfBtn.style.fontWeight = "bold";
pdfBtn.style.border = "none";
pdfBtn.style.cursor = "pointer";
pdfBtn.style.borderRadius = "7px";
pdfBtn.style.padding = "4px 12px";
pdfBtn.style.fontSize = "0.97em";
pdfBtn.style.margin = "0 0 0 12px";
pdfBtn.style.height = "32px";
pdfBtn.style.minWidth = "0";
pdfBtn.style.boxShadow = "0 1px 4px #2563eb22";
pdfBtn.style.verticalAlign = "middle";

// Placement à côté du champ de recherche
document.addEventListener("DOMContentLoaded", function () {
  // Créer le bouton historique immédiatement
  checkAndShowHistoryButton();

  // Configurer le conteneur et ajouter le bouton PDF
  const searchInput = document.querySelector(
    "input[placeholder*='Rechercher par N° Dossier']"
  );
  if (searchInput && searchInput.parentNode) {
    const parentContainer = searchInput.parentNode;

    // Configuration du conteneur en flexbox
    parentContainer.style.display = "flex";
    parentContainer.style.alignItems = "center";
    parentContainer.style.gap = "8px";
    parentContainer.style.flexWrap = "wrap";

    // Réduction encore plus importante de la largeur du champ de recherche
    searchInput.style.width = "45%";
    searchInput.style.maxWidth = "280px";
    searchInput.style.flex = "0 1 auto";

    // Forcer l'agressivité des couleurs du bouton PDF pour le mode admin
    if (window.adminModeManager) {
      pdfBtn.style.setProperty("background", "#2563eb", "important");
      pdfBtn.style.setProperty("color", "#fff", "important");
      pdfBtn.style.setProperty("border", "none", "important");
      pdfBtn.style.setProperty("cursor", "pointer", "important");
      pdfBtn.style.setProperty("font-weight", "bold", "important");
    }

    // Ajouter le bouton PDF à la fin
    parentContainer.appendChild(pdfBtn);
  } else {
    // Fallback : au-dessus du tableau si champ non trouvé
    const mainTable = document.getElementById("deliveriesTable");
    if (mainTable && mainTable.parentNode) {
      mainTable.parentNode.insertBefore(pdfBtn, mainTable);
    }
  }

  // Activer le modal PDF pour l'admin si nécessaire
  if (window.adminModeManager && window.enablePdfModalForAdmin) {
    setTimeout(() => {
      window.enablePdfModalForAdmin();
    }, 1000);
  }
});

// Variable pour stocker les dossiers livrés
let deliveredForPdf = [];

// Fonction pour mettre à jour la liste des dossiers livrés à chaque changement
function updateDeliveredForPdf() {
  deliveredForPdf = (window.allDeliveries || []).filter((d) => {
    let tcList =
      d.container_numbers_list && Array.isArray(d.container_numbers_list)
        ? d.container_numbers_list.filter(Boolean)
        : Array.isArray(d.container_number)
        ? d.container_number.filter(Boolean)
        : typeof d.container_number === "string"
        ? d.container_number.split(/[,;\s]+/).filter(Boolean)
        : [];
    let allTcLivres =
      tcList.length > 0 &&
      tcList.every((tc) => {
        let s = d.container_statuses && d.container_statuses[tc];
        return s === "livre" || s === "livré";
      });
    let globalLivree =
      (d.status && (d.status === "livre" || d.status === "livré")) ||
      (d.delivery_status_acconier &&
        (d.delivery_status_acconier === "livre" ||
          d.delivery_status_acconier === "livré"));
    return allTcLivres || globalLivree;
  });
}

// Met à jour la liste à chaque chargement ou modification
if (window.allDeliveries) updateDeliveredForPdf();
window.addEventListener("allDeliveriesUpdated", updateDeliveredForPdf);

// --- Modale de filtre PDF ---
function showPdfFilterModal() {
  const oldModal = document.getElementById("pdfFilterModal");
  if (oldModal) oldModal.remove();
  const overlay = document.createElement("div");
  overlay.id = "pdfFilterModal";
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(30,41,59,0.45)";
  overlay.style.zIndex = 100000;
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.borderRadius = "16px";
  box.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
  box.style.maxWidth = "420px";
  box.style.width = "96vw";
  box.style.maxHeight = "92vh";
  box.style.overflowY = "auto";
  box.style.padding = "0";
  box.style.position = "relative";
  box.style.display = "flex";
  box.style.flexDirection = "column";
  const header = document.createElement("div");
  header.style.background = "#2563eb";
  header.style.color = "#fff";
  header.style.padding = "18px 28px 12px 28px";
  header.style.fontWeight = "bold";
  header.style.fontSize = "1.15rem";
  header.style.display = "flex";
  header.style.flexDirection = "column";
  header.style.borderTopLeftRadius = "16px";
  header.style.borderTopRightRadius = "16px";
  header.innerHTML = `<span style='font-size:1.08em;'>Génération PDF - État des sorties de conteneurs</span>`;
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.color = "#fff";
  closeBtn.style.fontSize = "2.1rem";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "18px";
  closeBtn.setAttribute("aria-label", "Fermer");
  closeBtn.onclick = () => overlay.remove();
  header.appendChild(closeBtn);
  box.appendChild(header);
  const content = document.createElement("div");
  content.style.padding = "24px 24px 24px 24px";
  content.style.background = "#f8fafc";
  content.style.flex = "1 1 auto";
  content.style.overflowY = "auto";
  content.innerHTML = `<div style='margin-bottom:18px;font-weight:600;'>Souhaitez-vous filtrer l'état des sorties de conteneurs par :</div>`;
  const radioSingle = document.createElement("input");
  radioSingle.type = "radio";
  radioSingle.name = "pdfDateFilter";
  radioSingle.id = "pdfFilterSingle";
  radioSingle.className = "pdfModalRadio"; // Classe pour l'admin
  radioSingle.checked = true;
  const labelSingle = document.createElement("label");
  labelSingle.textContent = "Une seule date";
  labelSingle.htmlFor = "pdfFilterSingle";
  labelSingle.style.marginRight = "18px";
  const radioRange = document.createElement("input");
  radioRange.type = "radio";
  radioRange.name = "pdfDateFilter";
  radioRange.id = "pdfFilterRange";
  radioRange.className = "pdfModalRadio"; // Classe pour l'admin
  const labelRange = document.createElement("label");
  labelRange.textContent = "Intervalle de dates";
  labelRange.htmlFor = "pdfFilterRange";
  content.appendChild(radioSingle);
  content.appendChild(labelSingle);
  content.appendChild(radioRange);
  content.appendChild(labelRange);
  const dateZone = document.createElement("div");
  dateZone.style.marginTop = "18px";
  content.appendChild(dateZone);
  function renderSingleDateInput() {
    dateZone.innerHTML = "";
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.id = "pdfSingleDateInput";
    dateInput.className = "pdfModalDateInput"; // Classe pour l'admin
    dateInput.style.padding = "8px 18px";
    dateInput.style.borderRadius = "8px";
    dateInput.style.border = "1.5px solid #2563eb";
    dateInput.style.fontSize = "1.08em";
    dateInput.style.marginRight = "12px";
    dateZone.appendChild(dateInput);
  }
  function renderRangeDateInputs() {
    dateZone.innerHTML = "";
    const dateStart = document.createElement("input");
    dateStart.type = "date";
    dateStart.id = "pdfRangeDateStart";
    dateStart.className = "pdfModalDateInput"; // Classe pour l'admin
    dateStart.style.padding = "8px 18px";
    dateStart.style.borderRadius = "8px";
    dateStart.style.border = "1.5px solid #2563eb";
    dateStart.style.fontSize = "1.08em";
    dateStart.style.marginRight = "12px";
    const dateEnd = document.createElement("input");
    dateEnd.type = "date";
    dateEnd.id = "pdfRangeDateEnd";
    dateEnd.className = "pdfModalDateInput"; // Classe pour l'admin
    dateEnd.style.padding = "8px 18px";
    dateEnd.style.borderRadius = "8px";
    dateEnd.style.border = "1.5px solid #2563eb";
    dateEnd.style.fontSize = "1.08em";
    dateZone.appendChild(dateStart);
    dateZone.appendChild(dateEnd);
  }
  renderSingleDateInput();
  radioSingle.onchange = renderSingleDateInput;
  radioRange.onchange = renderRangeDateInputs;
  const validateBtn = document.createElement("button");
  validateBtn.id = "pdfModalGenerateBtn"; // ID pour l'admin
  validateBtn.textContent = "Générer PDF";
  validateBtn.style.background = "#2563eb";
  validateBtn.style.color = "#fff";
  validateBtn.style.fontWeight = "bold";
  validateBtn.style.border = "none";
  validateBtn.style.cursor = "pointer";
  validateBtn.style.borderRadius = "8px";
  validateBtn.style.padding = "10px 28px";
  validateBtn.style.fontSize = "1.08em";
  validateBtn.style.marginTop = "24px";
  validateBtn.onclick = function () {
    let filterType = radioSingle.checked ? "single" : "range";
    let date1 = null,
      date2 = null;
    if (filterType === "single") {
      date1 = dateZone.querySelector("#pdfSingleDateInput")?.value;
    } else {
      date1 = dateZone.querySelector("#pdfRangeDateStart")?.value;
      date2 = dateZone.querySelector("#pdfRangeDateEnd")?.value;
    }
    let filtered = deliveredForPdf.filter((d) => {
      let dDate = d.delivery_date || d.created_at;
      if (!dDate) return false;
      let normalized = "";
      if (typeof dDate === "string") {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dDate)) {
          const [j, m, a] = dDate.split("/");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dDate)) {
          normalized = dDate;
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(dDate)) {
          const [j, m, a] = dDate.split("-");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else {
          const dateObj = new Date(dDate);
          if (!isNaN(dateObj)) {
            normalized = dateObj.toISOString().split("T")[0];
          } else {
            normalized = dDate;
          }
        }
      } else if (dDate instanceof Date) {
        normalized = dDate.toISOString().split("T")[0];
      } else {
        normalized = String(dDate);
      }
      if (filterType === "single") {
        return date1 && normalized === date1;
      } else {
        if (!date1 || !date2) return false;
        return normalized >= date1 && normalized <= date2;
      }
    });
    generateEtatSortiePdf(filtered, date1, date2);
    overlay.remove();
  };
  content.appendChild(validateBtn);
  box.appendChild(content);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

pdfBtn.onclick = function () {
  updateDeliveredForPdf();
  showPdfFilterModal();

  // Activer immédiatement les éléments du modal pour l'admin
  if (window.adminModeManager && window.enablePdfModalForAdmin) {
    setTimeout(() => {
      window.enablePdfModalForAdmin();
    }, 100);
  }
};

function generateEtatSortiePdf(rows, date1, date2) {
  if (!rows || rows.length === 0) {
    alert("Aucun dossier livré à exporter pour la période choisie.");
    return;
  }
  function loadJsPdfLibs(callback) {
    if (window.jspdf && window.jspdf.jsPDF && window.jspdf.autoTable) {
      callback();
      return;
    }
    if (!document.getElementById("jspdf-script")) {
      const script = document.createElement("script");
      script.id = "jspdf-script";
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = function () {
        loadAutoTable();
      };
      document.body.appendChild(script);
    } else {
      loadAutoTable();
    }
    function loadAutoTable() {
      if (!document.getElementById("jspdf-autotable-script")) {
        const script = document.createElement("script");
        script.id = "jspdf-autotable-script";
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.7.0/jspdf.plugin.autotable.min.js";
        script.onload = function () {
          callback();
        };
        document.body.appendChild(script);
      } else {
        callback();
      }
    }
  }
  loadJsPdfLibs(() => {
    const { jsPDF } = window.jspdf;
    // Création du PDF en mode paysage (landscape), format A4
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    // Centrer le titre sur la largeur de la page
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = "État des sorties de conteneurs";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 18);
    // Réduire la taille du texte des entêtes du tableau PDF
    doc.setFontSize(10); // taille plus petite pour les entêtes
    doc.setFont("helvetica", "normal");
    let dateText = "";
    if (date1 && !date2) dateText = `Date : ${date1}`;
    else if (date1 && date2) dateText = `Du ${date1} au ${date2}`;
    if (dateText) {
      const dateTextWidth = doc.getTextWidth(dateText);
      doc.text(dateText, (pageWidth - dateTextWidth) / 2, 26);
    }
    // Colonnes avec des largeurs personnalisées pour un tableau large mais lisible
    // Largeur totale disponible (A4 paysage, marges incluses)
    // On répartit pour que la colonne OBSERVATION ne déborde pas et que le tableau soit équilibré
    const columns = [
      { header: "CIRCUIT", dataKey: "circuit", width: 23 },
      { header: "NOM CLIENT", dataKey: "client_name", width: 38 },
      { header: "Numéro Dossier", dataKey: "dossier_number", width: 32 },
      { header: "Numéro TC(s)", dataKey: "container_number", width: 36 },
      {
        header: "NOM Agent Visiteur",
        dataKey: "nom_agent_visiteur",
        width: 32,
      },
      { header: "Compagnie Maritime", dataKey: "shipping_company", width: 32 },
      { header: "INSPECTEUR", dataKey: "inspecteur", width: 28 },
      { header: "AGENT EN DOUANE", dataKey: "agent_en_douanes", width: 32 },
      { header: "OBSERVATION", dataKey: "observation_acconier", width: 25 }, // large mais jamais collée
    ];
    // Correction : récupérer les valeurs éditées danshdgs le DOM si elles existent
    const dataRows = rows.map((d) => {
      // Utilitaire pour récupérer la valeur éditée dans le tableau si présente, avec gestion des alias
      function getEditedValue(delivery, fields) {
        if (!Array.isArray(fields)) fields = [fields];
        const tr = document.querySelector(
          `tr[data-delivery-id='${delivery.id}']`
        );
        if (tr) {
          for (const field of fields) {
            const td = tr.querySelector(`td[data-col-id='${field}']`);
            if (td) {
              const input = td.querySelector("input,textarea");
              if (input && input.value && input.value.trim() !== "") {
                return input.value.trim();
              }
              if (td.textContent && td.textContent.trim() !== "-") {
                return td.textContent.trim();
              }
            }
          }
        }
        // Sinon, valeur brute (prend le premier champ trouvé)
        for (const field of fields) {
          if (delivery[field] && String(delivery[field]).trim() !== "") {
            return delivery[field];
          }
        }
        return "-";
      }
      return {
        circuit: d.circuit || "-",
        client_name: d.client_name || "-",
        dossier_number: d.dossier_number || "-",
        container_number:
          d.container_numbers_list && Array.isArray(d.container_numbers_list)
            ? d.container_numbers_list.join(", ")
            : Array.isArray(d.container_number)
            ? d.container_number.join(", ")
            : d.container_number || "-",
        nom_agent_visiteur: getEditedValue(d, [
          "nom_agent_visiteur",
          "visitor_agent_name",
        ]),
        shipping_company: d.shipping_company || "-",
        inspecteur: getEditedValue(d, ["inspecteur", "inspector"]),
        agent_en_douanes: getEditedValue(d, [
          "agent_en_douanes",
          "customs_agent",
        ]),
        observation_acconier: getEditedValue(d, [
          "observation_acconier",
          "observation",
        ]),
        // Suppression du champ delivery_date pour le PDF
      };
    });
    doc.autoTable({
      startY: 32,
      head: [columns.map((c) => c.header)],
      body: dataRows.map((row) => columns.map((c) => row[c.dataKey])),
      styles: { font: "helvetica", fontSize: 10 },
      headStyles: {
        fillColor: [0, 0, 0], // noir
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7, // taille réduite pour les entêtes du tableau
      },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      // Marges égales à gauche et à droite pour un centrage parfaits
      margin: { left: 10, right: 10 },
      theme: "grid",
      columnStyles: columns.reduce((acc, col, idx) => {
        acc[idx] = { cellWidth: col.width };
        return acc;
      }, {}),
      tableWidth: "auto",
      horizontalAlign: "center", // Centrage horizontal du tableau
      didDrawPage: function (data) {
        // Rien à faire ici normalement
      },
    });
    doc.save("Etat_sorties_conteneurs.pdf");
  });
}

// ========================================================================
// === HISTORIQUE PROFESSIONNEL DES CONTENEURS LIVRÉS ===
// ========================================================================

/**
 * Clé pour le stockage local de l'historique professionnel
 */
const DELIVERY_HISTORY_KEY = "professional_delivery_history";

/**
 * Enregistre un conteneur livré dans l'historique professionnel
 * @param {Object} delivery - Livraison complète
 * @param {string} containerNumber - Numéro du conteneur livré
 */
function saveToDeliveryHistory(delivery, containerNumber) {
  try {
    // Récupère l'historique existant
    let history = JSON.parse(
      localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
    );

    // Crée un enregistrement unique pour ce conteneur
    const historyEntry = {
      id: Date.now() + Math.random(), // ID unique
      delivery_id: delivery.id,
      container_number: containerNumber,
      dossier_number: delivery.dossier_number,
      bl_number: delivery.bl_number,
      client_name: delivery.client_name,
      client_phone: delivery.client_phone,
      employee_name: delivery.employee_name,
      circuit: delivery.circuit,
      shipping_company: delivery.shipping_company,
      visitor_agent_name: delivery.visitor_agent_name,
      transporter: delivery.transporter,
      inspector: delivery.inspector,
      customs_agent: delivery.customs_agent,
      driver: delivery.driver,
      driver_phone: delivery.driver_phone,
      container_foot_type: delivery.container_foot_type,
      weight: delivery.weight,
      ship_name: delivery.ship_name,
      delivery_date: delivery.delivery_date,
      observation: delivery.observation,
      delivered_at: new Date().toISOString(), // Horodatage de livraison
      delivered_by: localStorage.getItem("user_nom") || "Inconnu",
    };

    // Vérifie si ce conteneur n'est pas déjà dans l'historique
    const exists = history.some(
      (entry) =>
        entry.delivery_id === delivery.id &&
        entry.container_number === containerNumber
    );

    if (!exists) {
      history.unshift(historyEntry); // Ajoute en tête

      // Limite l'historique à 1000 entrées max
      if (history.length > 1000) {
        history = history.slice(0, 1000);
      }

      // Sauvegarde
      localStorage.setItem(DELIVERY_HISTORY_KEY, JSON.stringify(history));

      console.log(
        `[HISTORIQUE] ✅ Conteneur ${containerNumber} enregistré dans l'historique professionnel`
      );
    } else {
      console.log(
        `[HISTORIQUE] ⚠️ Conteneur ${containerNumber} déjà présent dans l'historique`
      );
    }
  } catch (error) {
    console.error("[HISTORIQUE] ❌ Erreur lors de l'enregistrement:", error);
  }
}

/**
 * Vérifie s'il y a un historique et affiche le bouton par défaut
 */
function checkAndShowHistoryButton() {
  try {
    const history = JSON.parse(
      localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
    );

    // 🆕 MODIFICATION : Afficher le bouton par défaut, même sans historique
    console.log(
      `[HISTORIQUE] ℹ️ ${history.length} entrées trouvées dans l'historique - Affichage du bouton par défaut`
    );
    showHistoryButtonIfNeeded();
  } catch (error) {
    console.error("[HISTORIQUE] ❌ Erreur lors de la vérification:", error);
    // Même en cas d'erreur, on affiche le bouton
    showHistoryButtonIfNeeded();
  }
}

/**
 * Affiche le bouton historique par défaut (toujours visible)
 */
function showHistoryButtonIfNeeded() {
  let historyBtn = document.getElementById("professionalHistoryBtn");

  if (!historyBtn) {
    // Crée le bouton historique professionnel
    historyBtn = document.createElement("button");
    historyBtn.id = "professionalHistoryBtn";
    historyBtn.innerHTML = "📋 Historique";
    historyBtn.title =
      "Consulter l'historique professionnel des conteneurs livrés";
    historyBtn.style.background =
      "linear-gradient(90deg,#059669 0%,#047857 100%)";
    historyBtn.style.color = "#fff";
    historyBtn.style.fontWeight = "bold";
    historyBtn.style.border = "none";
    historyBtn.style.cursor = "pointer";
    historyBtn.style.borderRadius = "8px";
    historyBtn.style.padding = "8px 16px";
    historyBtn.style.fontSize = "0.95em";
    historyBtn.style.margin = "0 8px 0 0"; // Margin à droite seulement
    historyBtn.style.boxShadow = "0 2px 8px rgba(5,150,105,0.3)";
    historyBtn.style.transition = "all 0.2s ease";
    historyBtn.style.height = "32px"; // Même hauteur que les autres boutons
    historyBtn.style.verticalAlign = "middle";

    // Effet de survol
    historyBtn.onmouseenter = () => {
      historyBtn.style.transform = "translateY(-2px)";
      historyBtn.style.boxShadow = "0 4px 16px rgba(5,150,105,0.4)";
    };
    historyBtn.onmouseleave = () => {
      historyBtn.style.transform = "translateY(0)";
      historyBtn.style.boxShadow = "0 2px 8px rgba(5,150,105,0.3)";
    };

    // Événement de clic
    historyBtn.onclick = showProfessionalHistoryModal;

    // 🆕 MODIFICATION : Placer le bouton AVANT l'icône de recherche spécifiquement
    const searchIcon =
      document.querySelector(".fas.fa-search.search-icon") ||
      document.querySelector("i.search-icon") ||
      document.querySelector(".search-icon");

    if (searchIcon && searchIcon.parentNode) {
      // Insérer le bouton historique AVANT l'icône de recherche
      const parentContainer = searchIcon.parentNode;
      parentContainer.insertBefore(historyBtn, searchIcon);

      // Réduire encore plus la largeur du champ de recherche
      const searchInput =
        document.querySelector("input[placeholder*='Rechercher']") ||
        document.getElementById("searchInput");
      if (searchInput) {
        searchInput.style.width = "35%";
        searchInput.style.maxWidth = "250px";
      }

      // Configurer le conteneur parent en flexbox
      parentContainer.style.display = "flex";
      parentContainer.style.alignItems = "center";
      parentContainer.style.gap = "8px";
      parentContainer.style.flexWrap = "wrap";
    } else {
      // Fallback : rechercher le champ de recherche
      const searchInput = document.querySelector(
        "input[placeholder*='Rechercher par N° Dossier']"
      );
      if (searchInput && searchInput.parentNode) {
        // Insérer le bouton historique au TOUT DÉBUT du conteneur (avant l'icône de recherche)
        const parentContainer = searchInput.parentNode;
        parentContainer.insertBefore(historyBtn, parentContainer.firstChild);

        // Réduire encore plus la largeur du champ de recherche
        searchInput.style.width = "35%";
        searchInput.style.maxWidth = "250px";

        // Configurer le conteneur parent en flexbox
        parentContainer.style.display = "flex";
        parentContainer.style.alignItems = "center";
        parentContainer.style.gap = "8px";
        parentContainer.style.flexWrap = "wrap";
      } else {
        // Rechercher d'autres sélecteurs possibles pour le champ de recherche
        const altSearchInput =
          document.querySelector("input[type='text']") ||
          document.getElementById("search-bl") ||
          document.querySelector(".search-input");

        if (altSearchInput && altSearchInput.parentNode) {
          const parentContainer = altSearchInput.parentNode;
          parentContainer.insertBefore(historyBtn, altSearchInput);

          // Configuration du conteneur
          parentContainer.style.display = "flex";
          parentContainer.style.alignItems = "center";
          parentContainer.style.gap = "8px";

          // Ajuster la largeur du champ de recherche
          altSearchInput.style.width = "70%";
          altSearchInput.style.maxWidth = "400px";
        } else {
          // En dernier recours, chercher le conteneur de recherche et l'ajouter au début
          const searchContainer =
            document.querySelector(".row-search") ||
            document.querySelector(".search-container") ||
            document.querySelector("[class*='search']");

          if (searchContainer) {
            searchContainer.insertBefore(
              historyBtn,
              searchContainer.firstChild
            );
            searchContainer.style.display = "flex";
            searchContainer.style.alignItems = "center";
            searchContainer.style.gap = "8px";
          }
        }
      }
    }
  }

  // 🆕 MODIFICATION : Le bouton est maintenant toujours visible, pas de condition
  // S'assure que le bouton est visible
  historyBtn.style.display = "inline-block"; // Changed from "block" to "inline-block"
  historyBtn.style.opacity = "1";
  historyBtn.style.transform = "scale(1)";
}

/**
 * Affiche la modal de l'historique professionnel
 */
function showProfessionalHistoryModal() {
  // Récupère l'historique
  const history = JSON.parse(
    localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
  );

  // Supprime la modal existante si elle existe
  const existingModal = document.getElementById("professionalHistoryModal");
  if (existingModal) existingModal.remove();

  // Crée la modal
  const modal = document.createElement("div");
  modal.id = "professionalHistoryModal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.background = "rgba(0,0,0,0.6)";
  modal.style.zIndex = "100200";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.backdropFilter = "blur(4px)";

  // Conteneur principalfx
  const container = document.createElement("div");
  container.style.background = "#fff";
  container.style.borderRadius = "16px";
  container.style.boxShadow = "0 20px 60px rgba(0,0,0,0.3)";
  container.style.maxWidth = "95vw";
  container.style.width = "1100px";
  container.style.maxHeight = "90vh";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.overflow = "hidden";

  // En-tête
  const header = document.createElement("div");
  header.style.background = "linear-gradient(90deg,#059669 0%,#047857 100%)";
  header.style.color = "#fff";
  header.style.padding = "20px 30px";
  header.style.borderTopLeftRadius = "16px";
  header.style.borderTopRightRadius = "16px";
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";

  const title = document.createElement("h2");
  title.textContent = "📋 Historique des Conteneurs Livrés";
  title.style.margin = "0";
  title.style.fontSize = "1.4em";
  title.style.fontWeight = "bold";

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "✕";
  closeBtn.style.background = "rgba(255,255,255,0.2)";
  closeBtn.style.color = "#fff";
  closeBtn.style.border = "none";
  closeBtn.style.borderRadius = "50%";
  closeBtn.style.width = "35px";
  closeBtn.style.height = "35px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "1.2em";
  closeBtn.style.display = "flex";
  closeBtn.style.alignItems = "center";
  closeBtn.style.justifyContent = "center";
  closeBtn.onclick = () => modal.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);
  container.appendChild(header);

  // Statistiques
  const stats = document.createElement("div");
  stats.style.padding = "15px 30px";
  stats.style.background = "#f8fafc";
  stats.style.borderBottom = "1px solid #e5e7eb";
  stats.innerHTML = `
    <div style="display: flex; gap: 30px; flex-wrap: wrap;">
      <div style="color: #059669; font-weight: bold;">
        📦 Total conteneurs livrés: <span style="color: #047857;">${
          history.length
        }</span>
      </div>
      <div style="color: #059669; font-weight: bold;">
        📅 Dernière livraison: <span style="color: #047857;">${
          history.length > 0
            ? new Date(history[0].delivered_at).toLocaleDateString("fr-FR")
            : "Aucune"
        }</span>
      </div>
    </div>
  `;
  container.appendChild(stats);

  // Zone de contenu avec scroll
  const content = document.createElement("div");
  content.style.flex = "1";
  content.style.padding = "20px 30px";
  content.style.overflowY = "auto";
  content.style.background = "#fff";

  if (history.length === 0) {
    content.innerHTML = `
      <div style="text-align: center; padding: 50px 20px; color: #6b7280;">
        <div style="font-size: 3em; margin-bottom: 20px;">📋</div>
        <h3 style="color: #374151; margin-bottom: 10px;">Aucun historique pour le moment</h3>
        <p>Les conteneurs marqués comme "Livrés" apparaîtront ici automatiquement.</p>
      </div>
    `;
  } else {
    // Tableau de l'historique
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "0.9em";

    // En-tête du tableau
    table.innerHTML = `
      <thead>
        <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151;">Date/Heure</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151;">Conteneur</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151;">Dossier</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151;">Client</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151;">Agent</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151;">Transporteur</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: bold; color: #374151;">Livré par</th>
          <th style="padding: 12px 8px; text-align: center; font-weight: bold; color: #374151;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${history
          .map(
            (entry, index) => `
          <tr style="border-bottom: 1px solid #f3f4f6; ${
            index % 2 === 0 ? "background: #fafafa;" : ""
          }">
            <td style="padding: 10px 8px; color: #4b5563;">
              ${new Date(entry.delivered_at).toLocaleDateString("fr-FR")}<br>
              <small style="color: #9ca3af;">${new Date(
                entry.delivered_at
              ).toLocaleTimeString("fr-FR")}</small>
            </td>
            <td style="padding: 10px 8px; font-weight: bold; color: #059669;">${
              entry.container_number
            }</td>
            <td style="padding: 10px 8px; color: #4b5563;">${
              entry.dossier_number || "-"
            }</td>
            <td style="padding: 10px 8px; color: #4b5563;">${
              entry.client_name || "-"
            }</td>
            <td style="padding: 10px 8px; color: #4b5563;">${
              entry.visitor_agent_name || "-"
            }</td>
            <td style="padding: 10px 8px; color: #4b5563;">${
              entry.transporter || "-"
            }</td>
            <td style="padding: 10px 8px; color: #047857; font-weight: 500;">${
              entry.delivered_by
            }</td>
            <td style="padding: 10px 8px; text-align: center;">
              <button onclick="showHistoryEntryDetail('${entry.id}')" 
                style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                Détails
              </button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    `;

    content.appendChild(table);
  }

  container.appendChild(content);
  modal.appendChild(container);
  document.body.appendChild(modal);

  // Fermeture en cliquant à côté
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

/**
 * Affiche les détails d'une entrée de l'historique
 */
window.showHistoryEntryDetail = function (entryId) {
  const history = JSON.parse(
    localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
  );
  const entry = history.find((e) => e.id == entryId);

  if (!entry) {
    alert("Entrée non trouvée dans l'historique.");
    return;
  }

  // Supprime la modal de détail existante
  const existingDetail = document.getElementById("historyDetailModal");
  if (existingDetail) existingDetail.remove();

  // Crée la modal de détail
  const modal = document.createElement("div");
  modal.id = "historyDetailModal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.background = "rgba(0,0,0,0.5)";
  modal.style.zIndex = "100300";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";

  const container = document.createElement("div");
  container.style.background = "#fff";
  container.style.borderRadius = "12px";
  container.style.boxShadow = "0 15px 40px rgba(0,0,0,0.2)";
  container.style.maxWidth = "90vw";
  container.style.width = "500px";
  container.style.maxHeight = "80vh";
  container.style.overflowY = "auto";
  container.style.padding = "25px";

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
      <h3 style="margin: 0; color: #059669; font-size: 1.3em;">📦 Détails du Conteneur ${
        entry.container_number
      }</h3>
      <button onclick="document.getElementById('historyDetailModal').remove()" 
        style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
        Fermer
      </button>
    </div>
    <div style="display: grid; gap: 12px;">
      <div><strong>Conteneur:</strong> ${entry.container_number}</div>
      <div><strong>Dossier:</strong> ${entry.dossier_number || "-"}</div>
      <div><strong>BL:</strong> ${entry.bl_number || "-"}</div>
      <div><strong>Client:</strong> ${entry.client_name || "-"}</div>
      <div><strong>Téléphone client:</strong> ${entry.client_phone || "-"}</div>
      <div><strong>Circuit:</strong> ${entry.circuit || "-"}</div>
      <div><strong>Compagnie maritime:</strong> ${
        entry.shipping_company || "-"
      }</div>
      <div><strong>Agent visiteur:</strong> ${
        entry.visitor_agent_name || "-"
      }</div>
      <div><strong>Transporteur:</strong> ${entry.transporter || "-"}</div>
      <div><strong>Inspecteur:</strong> ${entry.inspector || "-"}</div>
      <div><strong>Agent en douanes:</strong> ${
        entry.customs_agent || "-"
      }</div>
      <div><strong>Chauffeur:</strong> ${entry.driver || "-"}</div>
      <div><strong>Tél. chauffeur:</strong> ${entry.driver_phone || "-"}</div>
      <div><strong>Type conteneur:</strong> ${
        entry.container_foot_type || "-"
      }</div>
      <div><strong>Poids:</strong> ${entry.weight || "-"}</div>
      <div><strong>Nom navire:</strong> ${entry.ship_name || "-"}</div>
      <div><strong>Date livraison:</strong> ${entry.delivery_date || "-"}</div>
      <div><strong>Observations:</strong> ${entry.observation || "-"}</div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px; background: #f9fafb; padding: 10px; border-radius: 6px;">
        <div><strong>Livré le:</strong> ${new Date(
          entry.delivered_at
        ).toLocaleString("fr-FR")}</div>
        <div><strong>Livré par:</strong> ${entry.delivered_by}</div>
      </div>
    </div>
  `;

  modal.appendChild(container);
  document.body.appendChild(modal);

  // Fermeture en cliquant à côté
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
};

// ========================================================================
// === FIN HISTORIQUE PROFESSIONNEL ===
// ========================================================================
