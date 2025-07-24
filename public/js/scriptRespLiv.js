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
  // Ajout du style CSS pour badges, tags et menu déroulant des conteneurs (Numéro TC(s))
  const styleTC = document.createElement("style");
  const newLocal = (styleTC.textContent = `
    #deliveriesTableBody .tc-tag {
      display: inline-block;
      margin-right: 4px;
      padding: 2px 8px;
      background: #2563eb;
      color: #fff;
      border-radius: 12px;
      font-size: 1em;
      font-weight: 600;
      white-space: nowrap;
      vertical-align: middle;
      box-shadow: 0 2px 8px rgba(37,99,235,0.10);
      border: none;
    }
    #deliveriesTableBody .tc-tags-btn {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: #0e274e;
      border: 2px solid #2563eb;
      border-radius: 14px;
      padding: 2px 14px;
      cursor: pointer;
      font-size: 1em;
      font-weight: 600;
      color: #fff;
      box-shadow: 0 2px 8px rgba(37,99,235,0.10);
      white-space: nowrap;
    }
    #deliveriesTableBody .tc-popup {
      position: absolute;
      background: #fff;
      border: 2px solid #2563eb;
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(30,41,59,0.13);
      padding: 8px 0;
      min-width: 120px;
      z-index: 1002;
      left: 0;
      top: 100%;
      white-space: nowrap;
    }
    #deliveriesTableBody .tc-popup-item {
      padding: 8px 22px;
      cursor: pointer;
      font-size: 1.05em;
      color: #2563eb;
      border-bottom: 1px solid #f3f4f6;
      font-weight: 600;
    }
    #deliveriesTableBody .tc-popup-item:last-child {
      border-bottom: none;
    }
    /* Styles pour les entêtes et colonnes sauf Numéro TC(s) */
    #deliveriesTable thead th:not([data-col-id='container_number']) {
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 1em;
      font-weight: bold;
      background: #0e274e;
      color: #fff;
      border-bottom: 2px solid #2563eb;
      text-align: center;
      vertical-align: middle;
    }
    #deliveriesTable tbody td:not(.tc-multi-cell):not([data-col-id='container_number']) {
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }
    /* Bouton Statut (en-tête et ligne) */
    .statut-btn {
      font-size: 1.08em !important;
      font-weight: 700 !important;
      padding: 2px 18px !important;
      border-radius: 16px !important;
      border: 2px solid #eab308 !important;
      background: #fffbe6 !important;
      color: #b45309 !important;
      box-shadow: 0 2px 8px rgba(234,179,8,0.13) !important;
      outline: none !important;
      margin-top: 6px;
      transition: box-shadow 0.2s;
    }
    .statut-btn:active {
      box-shadow: 0 1px 4px rgba(234,179,8,0.18) !important;
    }
    @media (max-width: 900px) {
      #deliveriesTable thead th:not([data-col-id='container_number']),
      #deliveriesTable tbody td:not(:nth-child(5)) {
        max-width: 90px;
        font-size: 0.95em;
      }
      .statut-btn {
        font-size: 0.98em !important;
        padding: 2px 10px !important;
      }
    }
    @media (max-width: 600px) {
      #deliveriesTable thead th:not([data-col-id='container_number']),
      #deliveriesTable tbody td:not(:nth-child(5)) {
        max-width: 60px;
        font-size: 0.92em;
      }
      .statut-btn {
        font-size: 0.92em !important;
        padding: 2px 6px !important;
      }
    }
  `);
  document.head.appendChild(styleTC);
  const tableBody = document.getElementById("deliveriesTableBody");
  // Ajout des deux champs de date (début et fin)
  let dateStartInput = document.getElementById("mainTableDateStartFilter");
  let dateEndInput = document.getElementById("mainTableDateEndFilter");
  // Ajout du filtre de recherche N° Dossier / N° BL
  let searchInput = document.getElementById("searchInput");
  let searchBtn = document.getElementById("searchButton");
  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", function () {
      let query = searchInput.value.trim().toLowerCase();
      if (!query) {
        // Si vide, on réaffiche selon la plage de dates
        updateTableForDateRange(dateStartInput.value, dateEndInput.value);
        return;
      }
      // Filtrer sur N° Dossier ou N° BL
      let deliveriesSource = window.allDeliveries || [];
      let filtered = deliveriesSource.filter((delivery) => {
        let dossier = String(delivery.dossier_number || "").toLowerCase();
        let bls = [];
        if (Array.isArray(delivery.bl_number)) {
          bls = delivery.bl_number.map((b) => String(b).toLowerCase());
        } else if (typeof delivery.bl_number === "string") {
          bls = delivery.bl_number.split(/[,;\s]+/).map((b) => b.toLowerCase());
        }
        return dossier.includes(query) || bls.some((b) => b.includes(query));
      });
      // Tri du plus ancien au plus récent
      filtered.sort((a, b) => {
        let dateA = new Date(
          a.delivery_date || a.created_at || a.Date || a["Date Livraison"]
        );
        let dateB = new Date(
          b.delivery_date || b.created_at || b.Date || b["Date Livraison"]
        );
        return dateA - dateB;
      });
      renderAgentTableFull(
        filtered,
        document.getElementById("deliveriesTableBody")
      );
    });
    // Permet la recherche au clavier (Enter)
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") searchBtn.click();
    });
  }
  // Si les champs n'existent pas, on les crée dynamiquement à côté de l'ancien champ (pour compatibilité)
  const oldDateInput = document.getElementById("mainTableDateFilter");
  if (!dateStartInput || !dateEndInput) {
    // Création des deux inputs si besoin
    const parent = oldDateInput ? oldDateInput.parentNode : document.body;
    // Création du conteneur
    const rangeDiv = document.createElement("div");
    rangeDiv.style.display = "flex";
    rangeDiv.style.gap = "12px";
    rangeDiv.style.alignItems = "center";
    rangeDiv.style.marginBottom = "12px";
    // Date début
    dateStartInput = document.createElement("input");
    dateStartInput.type = "date";
    dateStartInput.id = "mainTableDateStartFilter";
    dateStartInput.style.padding = "6px 10px";
    dateStartInput.style.borderRadius = "8px";
    dateStartInput.style.border = "1.5px solid #2563eb";
    // Date fin
    dateEndInput = document.createElement("input");
    dateEndInput.type = "date";
    dateEndInput.id = "mainTableDateEndFilter";
    dateEndInput.style.padding = "6px 10px";
    dateEndInput.style.borderRadius = "8px";
    dateEndInput.style.border = "1.5px solid #2563eb";
    // Label
    const label = document.createElement("span");
    label.textContent = "Filtrer du ";
    const label2 = document.createElement("span");
    label2.textContent = " au ";
    rangeDiv.appendChild(label);
    rangeDiv.appendChild(dateStartInput);
    rangeDiv.appendChild(label2);
    rangeDiv.appendChild(dateEndInput);
    // Ajout dans le DOM
    if (oldDateInput) {
      oldDateInput.style.display = "none";
      parent.insertBefore(rangeDiv, oldDateInput);
    } else {
      document.body.insertBefore(rangeDiv, document.body.firstChild);
    }
  }

  // On charge toutes les livraisons une seule fois au chargement
  let allDeliveries = [];

  // --- Connexion WebSocket pour maj temps réel BL et suppression instantanée ---
  let ws;
  function setupWebSocket() {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = proto + "://" + window.location.host;
    ws = new WebSocket(wsUrl);
    ws.onopen = function () {};
    ws.onmessage = function (event) {
      console.log("[DEBUG] ws.onmessage triggered", event.data);

      try {
        const data = JSON.parse(event.data);
        console.log(
          "[DEBUG] data.type:",
          data.type,
          "data.status:",
          data.status
        );

        if (
          data.type === "bl_status_update" &&
          data.status === "mise_en_livraison"
        ) {
          console.log("[WebSocket] bl_status_update reçu:", data);
          // On cherche la livraison concernée dans window.allDeliveries
          console.log(
            "[DEBUG] window.allDeliveries:",
            window.allDeliveries,
            "data.deliveryId:",
            data.deliveryId
          );
          const delivery = (window.allDeliveries || []).find(
            (d) => String(d.id) === String(data.deliveryId)
          );
          if (!delivery) {
            console.error(
              "[ERREUR] Livraison non trouvée dans window.allDeliveries pour deliveryId:",
              data.deliveryId
            );
            console.error(
              "[ERREUR] Liste des ids dans allDeliveries:",
              (window.allDeliveries || []).map((d) => d.id)
            );
            return;
          }
          console.log("[DEBUG] delivery trouvé:", delivery);
          // Mettre à jour le statut local du BL concerné
          if (!delivery.bl_statuses) delivery.bl_statuses = {};
          delivery.bl_statuses[data.blNumber] = data.status;
          // Vérifier si tous les BL sont en 'mise_en_livraison'
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
          if (
            blList.length > 0 &&
            blStatuses.every((s) => s === "mise_en_livraison")
          ) {
            // Supprimer la ligne du DOM ET forcer le re-rendu du tableau avec la plage de dates courante
            // Toujours utiliser window.allDeliveries comme source unique
            console.log(
              "[DEBUG] Avant suppression, window.allDeliveries:",
              window.allDeliveries
            );
            window.allDeliveries = (window.allDeliveries || []).filter(
              (d) => String(d.id) !== String(delivery.id)
            );
            // Toujours resynchroniser la variable globale
            allDeliveries = window.allDeliveries;
            console.log(
              "[DEBUG] Après suppression, window.allDeliveries:",
              window.allDeliveries
            );
            // Récupérer les valeurs actuelles des inputs de plage de dates
            const dateStartInput = document.getElementById(
              "mainTableDateStartFilter"
            );
            const dateEndInput = document.getElementById(
              "mainTableDateEndFilter"
            );
            // Toujours forcer le re-rendu du tableau principal après suppression
            if (typeof updateTableForDateRange === "function") {
              const startVal = dateStartInput ? dateStartInput.value : "";
              const endVal = dateEndInput ? dateEndInput.value : "";
              console.log(
                "[DEBUG] Appel updateTableForDateRange avec",
                startVal,
                endVal
              );
              updateTableForDateRange(startVal, endVal);
            }
            // Afficher un toast de confirmation élégant
            showSuccessToast(
              "Requête effectuée et envoyée au responsable de livraison."
            );

            // Toast notification (vert, pro, en haut)
            function showSuccessToast(message) {
              // Supprimer tout toast existant
              const oldToast = document.getElementById("custom-success-toast");
              if (oldToast) oldToast.remove();
              const toast = document.createElement("div");
              toast.id = "custom-success-toast";
              toast.textContent = message;
              toast.style.position = "fixed";
              toast.style.top = "32px";
              toast.style.left = "50%";
              toast.style.transform = "translateX(-50%)";
              toast.style.background =
                "linear-gradient(90deg,#22c55e 0%,#16a34a 100%)";
              toast.style.color = "#fff";
              toast.style.fontWeight = "bold";
              toast.style.fontSize = "1.12em";
              toast.style.padding = "18px 38px";
              toast.style.borderRadius = "16px";
              toast.style.boxShadow = "0 6px 32px rgba(34,197,94,0.18)";
              toast.style.zIndex = 99999;
              toast.style.opacity = "0";
              toast.style.transition = "opacity 0.3s";
              document.body.appendChild(toast);
              setTimeout(() => {
                toast.style.opacity = "1";
              }, 10);
              setTimeout(() => {
                toast.style.opacity = "0";
                setTimeout(() => toast.remove(), 400);
              }, 2600);
            }
          } else {
            // Sinon, mettre à jour le statut dossier dans la colonne sans reload
            const tableBody = document.getElementById("deliveriesTableBody");
            if (!tableBody) return;
            for (let row of tableBody.rows) {
              let dossierCellIdx = window.AGENT_TABLE_COLUMNS.findIndex(
                (c) => c.id === "dossier_number"
              );
              if (
                dossierCellIdx !== -1 &&
                row.cells[dossierCellIdx] &&
                row.cells[dossierCellIdx].textContent ===
                  String(delivery.dossier_number)
              ) {
                let colIdx = window.AGENT_TABLE_COLUMNS.findIndex(
                  (c) => c.id === "container_status"
                );
                if (colIdx !== -1 && row.cells[colIdx]) {
                  let allMiseEnLivraison =
                    blStatuses.length > 0 &&
                    blStatuses.every((s) => s === "mise_en_livraison");
                  if (allMiseEnLivraison) {
                    row.cells[colIdx].innerHTML =
                      '<span style="display:inline-flex;align-items:center;gap:6px;color:#2563eb;font-weight:600;"><i class="fas fa-truck" style="font-size:1.1em;color:#2563eb;"></i> Mise en livraison</span>';
                  } else {
                    row.cells[colIdx].innerHTML =
                      '<span style="display:inline-flex;align-items:center;gap:6px;color:#b45309;font-weight:600;"><i class="fas fa-clock" style="font-size:1.1em;color:#b45309;"></i> En attente de paiement</span>';
                  }
                }
                break;
              }
            }
          }
        }
        // Ajout : réception automatique d'un nouvel ordre de livraison
        if (data.type === "new_delivery_created" && data.delivery) {
          // Normalise la livraison reçue comme dans loadAllDeliveries
          function normalizeDelivery(delivery) {
            let tcList = [];
            if (Array.isArray(delivery.container_number)) {
              tcList = delivery.container_number.filter(Boolean);
            } else if (typeof delivery.container_number === "string") {
              tcList = delivery.container_number
                .split(/[,;\s]+/)
                .filter(Boolean);
            }
            if (
              !delivery.container_statuses ||
              typeof delivery.container_statuses !== "object"
            ) {
              delivery.container_statuses = {};
            }
            tcList.forEach((tc) => {
              if (!delivery.container_statuses[tc]) {
                delivery.container_statuses[tc] = "attente_paiement";
              }
            });
            if (
              delivery.bl_statuses &&
              typeof delivery.bl_statuses === "string"
            ) {
              try {
                delivery.bl_statuses = JSON.parse(delivery.bl_statuses);
              } catch {
                delivery.bl_statuses = {};
              }
            }
            if (
              !delivery.bl_statuses ||
              typeof delivery.bl_statuses !== "object"
            ) {
              delivery.bl_statuses = {};
            }
            return delivery;
          }
          const normalizedDelivery = normalizeDelivery(data.delivery);
          if (!window.allDeliveries) window.allDeliveries = [];
          window.allDeliveries.unshift(normalizedDelivery);
          // Met à jour le tableau si la livraison correspond à la plage de dates courante
          const dateStartInput = document.getElementById(
            "mainTableDateStartFilter"
          );
          const dateEndInput = document.getElementById(
            "mainTableDateEndFilter"
          );
          const startVal = dateStartInput ? dateStartInput.value : "";
          const endVal = dateEndInput ? dateEndInput.value : "";
          // Vérifie si la nouvelle livraison est dans la plage de dates
          let dDate =
            normalizedDelivery.delivery_date || normalizedDelivery.created_at;
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
          // Si la date de la livraison est dans la plage, on met à jour le tableau
          let isInRange = true;
          if (startVal) {
            isInRange = normalized >= startVal;
          }
          if (endVal && isInRange) {
            isInRange = normalized <= endVal;
          }
          if (isInRange && typeof updateTableForDateRange === "function") {
            updateTableForDateRange(startVal, endVal);
          }
          // Affiche une alerte avec le nom de l'agent
          const agentName = normalizedDelivery.employee_name || "-";
          showNewDeliveryAlert(agentName);
        }
      } catch (e) {
        console.error("WebSocket BL error:", e);
      }
    };
    ws.onerror = function () {};
    ws.onclose = function () {
      setTimeout(setupWebSocket, 2000);
    };
  }
  setupWebSocket();

  // Fonction d'alerte pour nouvel ordre de livraison
  function showNewDeliveryAlert(agentName) {
    // Supprimer toute alerte existante
    const oldAlert = document.getElementById("custom-new-delivery-alert");
    if (oldAlert) oldAlert.remove();
    const alert = document.createElement("div");
    alert.id = "custom-new-delivery-alert";
    alert.textContent = `L'Agent "${agentName}" a établi un ordre de livraison.`;
    alert.style.position = "fixed";
    alert.style.top = "80px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.background = "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
    alert.style.color = "#fff";
    alert.style.fontWeight = "bold";
    alert.style.fontSize = "1.12em";
    alert.style.padding = "18px 38px";
    alert.style.borderRadius = "16px";
    alert.style.boxShadow = "0 6px 32px rgba(37,99,235,0.18)";
    alert.style.zIndex = 99999;
    alert.style.opacity = "0";
    alert.style.transition = "opacity 0.3s";
    document.body.appendChild(alert);
    setTimeout(() => {
      alert.style.opacity = "1";
    }, 10);
    setTimeout(() => {
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 400);
    }, 2600);
  }

  async function loadAllDeliveries() {
    try {
      const response = await fetch("/deliveries/status");
      const data = await response.json();
      if (data.success && Array.isArray(data.deliveries)) {
        allDeliveries = data.deliveries.map((delivery) => {
          // On ne touche pas à delivery.bl_statuses : il vient du backend et doit être conservé
          // Initialisation des statuts conteneurs si absent
          let tcList = [];
          if (Array.isArray(delivery.container_number)) {
            tcList = delivery.container_number.filter(Boolean);
          } else if (typeof delivery.container_number === "string") {
            tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
          }
          if (
            !delivery.container_statuses ||
            typeof delivery.container_statuses !== "object"
          ) {
            delivery.container_statuses = {};
          }
          tcList.forEach((tc) => {
            if (!delivery.container_statuses[tc]) {
              delivery.container_statuses[tc] = "attente_paiement";
            }
          });
          // S'assurer que bl_statuses est bien un objet (si string JSON, parser)
          if (
            delivery.bl_statuses &&
            typeof delivery.bl_statuses === "string"
          ) {
            try {
              delivery.bl_statuses = JSON.parse(delivery.bl_statuses);
            } catch {
              delivery.bl_statuses = {};
            }
          }
          if (
            !delivery.bl_statuses ||
            typeof delivery.bl_statuses !== "object"
          ) {
            delivery.bl_statuses = {};
          }
          return delivery;
        });
        // Synchronisation avec la variable globale utilisée dans renderAgentTableFull
        window.allDeliveries = allDeliveries;
      } else {
        allDeliveries = [];
        window.allDeliveries = [];
      }
    } catch (e) {
      console.error("Erreur lors du chargement des livraisons :", e);
      allDeliveries = [];
      window.allDeliveries = [];
    }
  }

  // Filtre les livraisons selon une plage de dates (inclusif)
  function filterDeliveriesByDateRange(dateStartStr, dateEndStr) {
    // Toujours utiliser window.allDeliveries comme source unique
    const deliveriesSource = window.allDeliveries || [];
    console.log(
      "[DEBUG] filterDeliveriesByDateRange source:",
      deliveriesSource
    );
    if (!dateStartStr && !dateEndStr) {
      console.log(
        "[DEBUG] Pas de filtre date, retourne toutes les livraisons:",
        deliveriesSource
      );
      return deliveriesSource;
    }
    // Conversion en Date objets à minuit
    let start = dateStartStr ? new Date(dateStartStr) : null;
    let end = dateEndStr ? new Date(dateEndStr) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    return deliveriesSource.filter((delivery) => {
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
      // Comparaison dans la plage
      let dateObj = new Date(normalized);
      if (isNaN(dateObj)) return false;
      if (start && dateObj < start) return false;
      if (end && dateObj > end) return false;
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
        row.appendChild(cell);
      });
      tableBody.appendChild(row);
    });
  }

  // Fonction principale pour charger et afficher selon la plage de dates
  function updateTableForDateRange(dateStartStr, dateEndStr) {
    let filtered = filterDeliveriesByDateRange(dateStartStr, dateEndStr);
    console.log(
      "[DEBUG] updateTableForDateRange - livraisons filtrées:",
      filtered
    );
    // Tri du plus ancien au plus récent (ordre croissant)
    filtered.sort((a, b) => {
      let dateA = new Date(
        a.delivery_date || a.created_at || a.Date || a["Date Livraison"]
      );
      let dateB = new Date(
        b.delivery_date || b.created_at || b.Date || b["Date Livraison"]
      );
      return dateA - dateB;
    });
    renderAgentTableFull(filtered, tableBody);
  }

  // Initialisation : charge toutes les livraisons puis affiche la plage de dates (par défaut : 7 jours avant aujourd'hui jusqu'à aujourd'hui)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  if (dateStartInput && dateEndInput) {
    dateStartInput.value = sevenDaysAgoStr;
    dateEndInput.value = todayStr;
    loadAllDeliveries().then(() => {
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
// Colonnes personnalisées pour la nouvelle demande
const AGENT_TABLE_COLUMNS = [
  { id: "row_number", label: "N°" },
  { id: "date_display", label: "Date" },
  { id: "employee_name", label: "NOM Agent visiteurs" },
  { id: "transporter", label: "TRANSPORTEUR" },
  { id: "inspector", label: "INSPECTEUR" },
  { id: "customs_agent", label: "AGENT EN DOUANES" },
  { id: "driver_name", label: "chauffeur" },
  { id: "driver_phone", label: "Tel chauffeur" },
  { id: "delivery_status_date", label: "date livraison statut" },
  { id: "observation", label: "OBSERVATIONS" },
];

// Fonction pour générer les lignes du tableau Agent Acconier
function renderAgentTableRows(deliveries, tableBodyElement) {
  tableBodyElement.innerHTML = "";
  deliveries.forEach((delivery, i) => {
    const tr = document.createElement("tr");
    // Détermination de la couleur de la bande selon l'ancienneté
    let dDate = delivery.delivery_date || delivery.created_at;
    let dateObj = dDate ? new Date(dDate) : null;
    let now = new Date();
    AGENT_TABLE_COLUMNS.forEach((col, idx) => {
      const td = document.createElement("td");
      let value = "-";
      if (col.id === "row_number") {
        value = i + 1;
        // Avatar stylisé moderne avec initiales
        const avatar = document.createElement("div");
        avatar.style.display = "flex";
        avatar.style.alignItems = "center";
        avatar.style.justifyContent = "center";
        avatar.style.width = window.innerWidth <= 600 ? "32px" : "44px";
        avatar.style.height = window.innerWidth <= 600 ? "32px" : "44px";
        avatar.style.borderRadius = "50%";
        avatar.style.background =
          "linear-gradient(135deg, #2563eb 60%, #1e293b 100%)";
        avatar.style.boxShadow =
          "0 2px 12px rgba(37,99,235,0.13), 0 1.5px 8px rgba(30,41,59,0.10)";
        avatar.style.position = "relative";
        avatar.style.margin = "0 auto";
        // Initiales de l'agent ou numéro
        let initials = "-";
        if (
          delivery.employee_name &&
          typeof delivery.employee_name === "string"
        ) {
          const parts = delivery.employee_name.trim().split(/\s+/);
          if (parts.length === 1) {
            initials = parts[0].charAt(0).toUpperCase();
          } else if (parts.length > 1) {
            initials =
              parts[0].charAt(0).toUpperCase() +
              parts[1].charAt(0).toUpperCase();
          }
        } else {
          initials = value;
        }
        const initialsSpan = document.createElement("span");
        initialsSpan.textContent = initials;
        initialsSpan.style.color = "#fff";
        initialsSpan.style.fontWeight = "bold";
        initialsSpan.style.fontSize =
          window.innerWidth <= 600 ? "1.1em" : "1.25em";
        initialsSpan.style.letterSpacing = "0.5px";
        avatar.appendChild(initialsSpan);
        // Effet de halo
        avatar.style.boxShadow += ", 0 0 0 6px #e0e7ef33";
        // Badge numéro (optionnel, petit rond blanc en bas à droite)
        const badge = document.createElement("span");
        badge.textContent = value;
        badge.style.position = "absolute";
        badge.style.bottom = "-6px";
        badge.style.right = "-6px";
        badge.style.background = "#fff";
        badge.style.color = "#2563eb";
        badge.style.fontWeight = "bold";
        badge.style.fontSize = window.innerWidth <= 600 ? "0.85em" : "1em";
        badge.style.borderRadius = "50%";
        badge.style.padding = window.innerWidth <= 600 ? "2px 6px" : "3px 8px";
        badge.style.boxShadow = "0 1px 4px rgba(30,41,59,0.13)";
        badge.style.border = "2px solid #f1f5f9";
        avatar.appendChild(badge);
        td.appendChild(avatar);
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
      } else if (col.id === "delivery_status_date") {
        // date livraison statut : fusionne date + statut BL
        let dDate = delivery.delivery_date || delivery.created_at;
        let status =
          delivery.bl_statuses && typeof delivery.bl_statuses === "object"
            ? Object.values(delivery.bl_statuses).find(
                (s) => s === "mise_en_livraison"
              )
              ? "Mise en livraison"
              : "En attente"
            : "-";
        let dateStr = "-";
        if (dDate) {
          let dateObj = new Date(dDate);
          if (!isNaN(dateObj.getTime())) {
            dateStr = dateObj.toLocaleDateString("fr-FR");
          } else if (typeof dDate === "string") {
            dateStr = dDate;
          }
        }
        td.textContent = dateStr + " / " + status;
      } else if (col.id === "observation") {
        value = delivery[col.id] !== undefined ? delivery[col.id] : "-";
        td.classList.add("observation-col");
        td.style.cursor = "pointer";
        let localKey = `obs_${delivery.id}`;
        let localObs = localStorage.getItem(localKey);
        let displayValue = value;
        if (value === "-" && localObs) {
          displayValue = localObs;
        }
        td.textContent = displayValue;
        if (localObs && value && value !== "-" && value !== localObs) {
          localStorage.removeItem(localKey);
        }
        td.addEventListener("mouseenter", function (e) {
          setTimeout(() => {
            if (
              td.offsetWidth < td.scrollWidth &&
              td.textContent.trim() !== "-" &&
              td.textContent.length > 0
            ) {
              let tooltip = document.createElement("div");
              tooltip.className = "custom-tooltip-floating";
              tooltip.textContent = td.textContent;
              document.body.appendChild(tooltip);
              const rect = td.getBoundingClientRect();
              tooltip.style.position = "fixed";
              tooltip.style.left = rect.left + window.scrollX + 10 + "px";
              tooltip.style.top = rect.top + window.scrollY - 8 + "px";
              tooltip.style.background = "#fff";
              tooltip.style.color = "#1e293b";
              tooltip.style.padding = "8px 16px";
              tooltip.style.borderRadius = "10px";
              tooltip.style.boxShadow = "0 4px 18px rgba(30,41,59,0.13)";
              tooltip.style.fontSize = "1em";
              tooltip.style.fontWeight = "500";
              tooltip.style.zIndex = 99999;
              tooltip.style.maxWidth = "420px";
              tooltip.style.wordBreak = "break-word";
              tooltip.style.pointerEvents = "none";
              tooltip.style.opacity = "0";
              tooltip.style.transition = "opacity 0.18s";
              setTimeout(() => {
                tooltip.style.opacity = "1";
              }, 10);
              td._customTooltip = tooltip;
            }
          }, 0);
        });
        td.addEventListener("mouseleave", function () {
          if (td._customTooltip) {
            td._customTooltip.style.opacity = "0";
            setTimeout(() => {
              if (td._customTooltip && td._customTooltip.parentNode) {
                td._customTooltip.parentNode.removeChild(td._customTooltip);
                td._customTooltip = null;
              }
            }, 120);
          }
        });
        td.onclick = function (e) {
          if (td.querySelector("textarea")) return;
          let currentText =
            td.textContent && td.textContent.trim() !== "-"
              ? td.textContent.trim()
              : "";
          const textarea = document.createElement("textarea");
          textarea.value = currentText;
          textarea.style.width = "100%";
          textarea.style.fontSize = "1em";
          textarea.style.padding = "2px 4px";
          async function saveObservation(val) {
            td.textContent = val || "-";
            td.dataset.edited = "true";
            if (val && val.trim() !== "") {
              localStorage.setItem(localKey, val.trim());
            } else {
              localStorage.removeItem(localKey);
            }
            try {
              await fetch(`/deliveries/${delivery.id}/observation`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ observation: val }),
              });
            } catch (err) {
              console.error("Erreur sauvegarde observation", err);
            }
          }
          textarea.onkeydown = function (ev) {
            if (ev.key === "Enter") {
              saveObservation(textarea.value);
            }
          };
          textarea.onblur = function () {
            saveObservation(textarea.value);
          };
          td.textContent = "";
          td.appendChild(textarea);
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd =
            textarea.value.length;
        };
      } else {
        // Pour les autres colonnes, affichage direct
        value = delivery[col.id] !== undefined ? delivery[col.id] : "-";
        td.textContent = value;
      }
      tr.appendChild(td);
    });
    tableBodyElement.appendChild(tr);
  });
}

// Fonction pour générer les en-têtes du tableau Agent Acconier
function renderAgentTableHeaders(tableElement, deliveries) {
  const thead = tableElement.querySelector("thead");
  thead.innerHTML = "";
  const headerRow = document.createElement("tr");
  AGENT_TABLE_COLUMNS.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label;
    th.setAttribute("data-col-id", col.id);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
}

// Fonction pour générer le tableau Agent Acconier complet
function renderAgentTableFull(deliveries, tableBodyElement) {
  const table = tableBodyElement.closest("table");
  // ...
  // Filtrer les livraisons à afficher dans le tableau principal :
  // On ne montre que les livraisons où au moins un BL n'est pas en 'mise_en_livraison'
  const deliveriesToShow = deliveries.filter((delivery) => {
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
    // Si tous les BL sont en 'mise_en_livraison', on ne l'affiche pas dans le tableau principal
    return !blStatuses.every((s) => s === "mise_en_livraison");
  });
  console.log(
    "[DEBUG] renderAgentTableFull - deliveriesToShow:",
    deliveriesToShow
  );
  if (deliveriesToShow.length === 0) {
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
    // Utiliser la nouvelle fonction d'en-tête
    if (table) {
      renderAgentTableHeaders(table, deliveriesToShow);
    }
    renderAgentTableRows(deliveriesToShow, tableBodyElement);
  }
}
//originale
