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
  if (Array.isArray(delivery.container_number)) {
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
            } else {
              window.allDeliveries[idx] = data.delivery;
            }
          } else {
            // Retire la livraison si elle n'est plus éligible
            if (idx !== -1) {
              window.allDeliveries.splice(idx, 1);
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
          // Mise à jour de la cellule Statut de la ligne concernée uniquement
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
                if (
                  data.deliveredCount === data.totalCount &&
                  data.totalCount > 0
                ) {
                  // Tous livrés : bouton vert + icône camion + texte Livré
                  statutCell.innerHTML = `<button style=\"display:flex;align-items:center;gap:8px;margin-top:6px;font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #22c55e;background:#e6fff5;color:#22c55e;\">
                    <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' style='vertical-align:middle;'><rect x='2' y='7' width='15' height='8' rx='2' fill='#22c55e'/><path d='M17 10h2.382a2 2 0 0 1 1.789 1.106l1.382 2.764A1 1 0 0 1 22 15h-2v-2a1 1 0 0 0-1-1h-2v-2z' fill='#22c55e'/><circle cx='7' cy='18' r='2' fill='#22c55e'/><circle cx='17' cy='18' r='2' fill='#22c55e'/></svg>
                    Livré
                  </button>`;
                } else {
                  // Affichage classique : x sur y livré(s)
                  statutCell.innerHTML = `<button style=\"margin-top:6px;font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #eab308;background:#fffbe6;color:#b45309;\">${
                    data.deliveredCount
                  } sur ${data.totalCount} livré${
                    data.totalCount > 1 ? "s" : ""
                  }</button>`;
                }
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
  // Ajout du style CSS pour badges, tags et menu déroulant des conteneurs (Numéro TC(s))
  const styleTC = document.createElement("style");
  styleTC.textContent = `
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
        // On ne garde que les livraisons dont TOUS les BL sont en 'mise_en_livraison'
        window.allDeliveries = data.deliveries.filter((delivery) => {
          let blList = [];
          if (Array.isArray(delivery.bl_number)) {
            blList = delivery.bl_number.filter(Boolean);
          } else if (typeof delivery.bl_number === "string") {
            blList = delivery.bl_number.split(/[,;\s]+/).filter(Boolean);
          }
          let blStatuses = blList.map((bl) =>
            delivery.bl_statuses && delivery.bl_statuses[bl]
              ? delivery.bl_statuses[bl]
              : "aucun"
          );
          return (
            blStatuses.length > 0 &&
            blStatuses.every((s) => s === "mise_en_livraison")
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
// Colonnes strictes pour Agent Acconier
// Fonction robuste pour générer le tableau complet (en-tête + lignes)
function renderAgentTableFull(deliveries, tableBodyElement) {
  // Ajout du bouton de suppression si absent
  let delBtn = document.getElementById("deleteRowsBtn");
  if (!delBtn) {
    delBtn = document.createElement("button");
    delBtn.id = "deleteRowsBtn";
    delBtn.textContent = "Supprimer la sélection";
    delBtn.style.margin = "12px 0 8px 0";
    delBtn.style.background = "#ef4444";
    delBtn.style.color = "#fff";
    delBtn.style.fontWeight = "bold";
    delBtn.style.border = "none";
    delBtn.style.borderRadius = "8px";
    delBtn.style.padding = "8px 22px";
    delBtn.style.cursor = "pointer";
    delBtn.style.fontSize = "1em";
    delBtn.onclick = function () {
      // Récupère toutes les cases cochées
      const checked = document.querySelectorAll(
        '#deliveriesTableBody input[type="checkbox"].row-select:checked'
      );
      if (checked.length === 0) {
        alert("Veuillez sélectionner au moins une ligne à supprimer.");
        return;
      }
      if (!confirm("Confirmer la suppression des lignes sélectionnées ?"))
        return;
      checked.forEach((cb) => {
        const tr = cb.closest("tr[data-delivery-id]");
        if (tr) {
          const deliveryId = tr.getAttribute("data-delivery-id");
          // Supprime du tableau DOM
          tr.remove();
          // Supprime aussi de window.allDeliveries
          if (deliveryId && window.allDeliveries) {
            window.allDeliveries = window.allDeliveries.filter(
              (d) => String(d.id) !== String(deliveryId)
            );
          }
        }
      });
    };
    // Ajoute le bouton avant le tableau
    const table = tableBodyElement.closest("table");
    if (table && table.parentNode) {
      table.parentNode.insertBefore(delBtn, table);
    }
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
  { id: "select_row", label: "Sélection" },
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
    // Champs obligatoires pour ce delivery
    const requiredFields = [
      "visitor_agent_name",
      "transporter",
      "inspector",
      "customs_agent",
      "driver",
      "driver_phone",
      "delivery_date",
    ];
    // Fonction pour vérifier dynamiquement si tous les champs sont remplis (prend la valeur affichée dans la cellule)
    function isAllRequiredFilled() {
      // Toujours prendre la valeur affichée dans la cellule (input, textarea ou textContent)
      return requiredFields.every((field) => {
        const colIdx = AGENT_TABLE_COLUMNS.findIndex((c) => c.id === field);
        if (colIdx === -1) return false;
        const cell = tr.children[colIdx];
        let val = undefined;
        if (cell) {
          const input = cell.querySelector("input,textarea");
          if (input) {
            val = input.value;
          } else {
            val = cell.textContent;
          }
        }
        return (
          val !== undefined &&
          val !== null &&
          String(val).trim() !== "" &&
          val !== "-"
        );
      });
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
        tr.appendChild(td);
        return;
      }
      // Génère une clé unique pour chaque cellule éditable (par livraison et colonne)
      function getCellStorageKey(delivery, colId) {
        return `deliverycell_${
          delivery.id || delivery.dossier_number || i
        }_${colId}`;
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
        // ...existing code for container_number...
        let tcList = [];
        if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
        }
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
          popup.innerHTML = tcList
            .map(
              (tc) =>
                `<div class="tc-popup-item" style='cursor:pointer;color:#0e274e;font-weight:700;font-size:1.13em;text-align:center;'>${tc}</div>`
            )
            .join("");
          btn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll(".tc-popup").forEach((p) => {
              if (p !== popup) p.style.display = "none";
            });
            popup.style.display =
              popup.style.display === "block" ? "none" : "block";
          };
          popup.querySelectorAll(".tc-popup-item").forEach((item) => {
            item.onclick = (ev) => {
              ev.stopPropagation();
              popup.style.display = "none";
              showContainerDetailPopup(delivery, item.textContent);
            };
          });
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
            // Correction : vérifier les champs obligatoires AVANT d'ouvrir le popup
            if (!isAllRequiredFilled()) {
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
        // Ajout : surveiller les modifications sur les champs obligatoires pour afficher le message d'accès
        if (requiredFields.includes(col.id)) {
          td.addEventListener(
            "input",
            function () {
              if (isAllRequiredFilled()) {
                showAccessMessage(
                  "Accès débloqué : vous pouvez modifier le statut du conteneur et l'observation.",
                  "green"
                );
                if (!confirmationShown) {
                  confirmationShown = true;
                  showAccessMessage(
                    "✅ Les données obligatoires ont bien été insérées !",
                    "green"
                  );
                }
              } else {
                showAccessMessage(
                  "Vous n'avez plus accès à l'observation et au statut du conteneur.",
                  "red"
                );
                confirmationShown = false;
              }
            },
            true
          );
        }
        if (col.id === "observation") {
          td.classList.add("observation-col");
        }
      } else if (col.id === "statut") {
        // Affichage du modèle "x sur y livré" dans chaque cellule de la colonne Statut uniquement si au moins un conteneur est livré
        let tcList = [];
        if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
        }
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
        // Vérification dynamique des champs obligatoires (toujours valeur affichée)
        if (!isAllRequiredFilled()) {
          showAccessMessage(
            "Veuillez d'abord renseigner tous les champs obligatoires : NOM Agent visiteurs, TRANSPORTEUR, INSPECTEUR, AGENT EN DOUANES, CHAUFFEUR, TEL CHAUFFEUR, DATE LIVRAISON.",
            "red"
          );
          return;
        }
        showAccessMessage(
          "Accès débloqué : vous pouvez modifier le statut du conteneur et l'observation.",
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
            const data = await response.json();
            if (response.ok && data.success) {
              alert(
                `Statut du conteneur mis à jour : ${
                  select.options[select.selectedIndex].text
                }`
              );
              overlay.remove();
              // Mise à jour instantanée du statut dans allDeliveries
              if (delivery && delivery.id) {
                const idx = allDeliveries.findIndex(
                  (d) => d.id === delivery.id
                );
                if (idx !== -1) {
                  if (
                    !allDeliveries[idx].container_statuses ||
                    typeof allDeliveries[idx].container_statuses !== "object"
                  ) {
                    allDeliveries[idx].container_statuses = {};
                  }
                  allDeliveries[idx].container_statuses[containerNumber] =
                    select.value;
                }
              }
              // Rafraîchir le tableau pour mettre à jour l'entête Statut
              const dateStartInput = document.getElementById(
                "mainTableDateStartFilter"
              );
              const dateEndInput = document.getElementById(
                "mainTableDateEndFilter"
              );
              if (dateStartInput && dateEndInput) {
                updateTableForDateRange(
                  dateStartInput.value,
                  dateEndInput.value
                );
              }
              // Envoi d'une notification WebSocket pour informer tous les clients
              if (window.ws && window.ws.readyState === 1) {
                window.ws.send(
                  JSON.stringify({
                    type: "container_status_update",
                    deliveryId: delivery.id,
                    containerNumber: containerNumber,
                    status: select.value,
                  })
                );
              }
            } else {
              alert(
                data.message ||
                  "Erreur lors de la mise à jour du statut du conteneur."
              );
            }
          } catch (err) {
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
// Ajout d'adaptation responsive pour le tableau généré
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
