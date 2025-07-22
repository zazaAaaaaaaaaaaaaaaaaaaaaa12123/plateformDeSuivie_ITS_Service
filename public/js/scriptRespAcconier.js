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
  const dateInput = document.getElementById("mainTableDateFilter");

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
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === "bl_status_update" &&
          data.status === "mise_en_livraison"
        ) {
          console.log("[WebSocket] bl_status_update reçu:", data);
          // On cherche la livraison concernée dans window.allDeliveries
          const delivery = (window.allDeliveries || []).find(
            (d) => String(d.id) === String(data.deliveryId)
          );
          if (!delivery) return;
          // Mettre à jour le statut local du BL concerné
          if (!delivery.bl_statuses) delivery.bl_statuses = {};
          delivery.bl_statuses[data.blNumber] = data.status;
          // Vérifier si la livraison est affichée (date du filtre)
          const dateInput = document.getElementById("mainTableDateFilter");
          let dDate =
            delivery["delivery_date"] ||
            delivery["created_at"] ||
            delivery["Date"] ||
            delivery["Date Livraison"];
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
          const currentFilterDate = dateInput ? dateInput.value : null;
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
            blStatuses.every((s) => s === "mise_en_livraison") &&
            normalized === currentFilterDate
          ) {
            // Supprimer la ligne du DOM ET forcer le re-rendu du tableau
            window.allDeliveries = window.allDeliveries.filter(
              (d) => String(d.id) !== String(delivery.id)
            );
            // On relance le rendu du tableau pour la date courante
            if (typeof updateTableForDate === "function") {
              updateTableForDate(currentFilterDate);
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
          } else if (normalized === currentFilterDate) {
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

  // Filtre les livraisons selon la date de livraison réelle (delivery_date)
  function filterDeliveriesByDate(dateStr) {
    return allDeliveries.filter((delivery) => {
      // On utilise delivery_date si disponible, sinon created_at
      let dDate =
        delivery["delivery_date"] ||
        delivery["created_at"] ||
        delivery["Date"] ||
        delivery["Date Livraison"];
      if (!dDate) return false;
      // Normalisation robuste du format
      let normalized = "";
      if (typeof dDate === "string") {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dDate)) {
          // Format JJ/MM/AAAA
          const [j, m, a] = dDate.split("/");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dDate)) {
          // Format YYYY-MM-DD
          normalized = dDate;
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(dDate)) {
          // Format JJ-MM-AAAA
          const [j, m, a] = dDate.split("-");
          normalized = `${a}-${m.padStart(2, "0")}-${j.padStart(2, "0")}`;
        } else {
          // Autre format, on tente une conversion
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
      return normalized === dateStr;
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

  // Fonction principale pour charger et afficher selon la dates
  function updateTableForDate(dateStr) {
    const filtered = filterDeliveriesByDate(dateStr);
    renderAgentTableFull(filtered, tableBody);
  }

  // Initialisation : charge toutes les livraisons puis affiche la date du jour
  const today = new Date().toISOString().split("T")[0];
  if (dateInput) {
    dateInput.value = today;
    loadAllDeliveries().then(() => {
      updateTableForDate(today);
    });
    dateInput.addEventListener("change", (e) => {
      updateTableForDate(e.target.value);
    });
  }
});
// Colonnes strictes pour Agent Acconier
const AGENT_TABLE_COLUMNS = [
  { id: "row_number", label: "N°" },
  { id: "date_display", label: "Date" },
  { id: "employee_name", label: "Agent" },
  { id: "client_name", label: "Client (Nom)" },
  { id: "client_phone", label: "Client (Tél)" },
  { id: "container_number", label: "Numéro TC(s)" },
  { id: "lieu", label: "Lieu" },
  { id: "container_foot_type", label: "Type Conteneur (pied)" },
  { id: "container_type_and_content", label: "Contenu" },
  { id: "declaration_number", label: "N° Déclaration" },
  { id: "bl_number", label: "N° BL" },
  { id: "dossier_number", label: "N° Dossier" },
  { id: "number_of_containers", label: "Nombre de conteneurs" },
  { id: "shipping_company", label: "Compagnie Maritime" },
  { id: "weight", label: "Poids" },
  { id: "ship_name", label: "Nom du navire" },
  { id: "circuit", label: "Circuit" },
  { id: "transporter_mode", label: "Mode de Transport" },
  { id: "container_status", label: "Statut Dossier " },
  { id: "observation", label: "Observation" },
];

// Fonction pour générer les lignes du tableau Agent Acconier
function renderAgentTableRows(deliveries, tableBodyElement) {
  tableBodyElement.innerHTML = "";
  deliveries.forEach((delivery, i) => {
    const tr = document.createElement("tr");
    AGENT_TABLE_COLUMNS.forEach((col, idx) => {
      const td = document.createElement("td");
      let value = "-";
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
      } else if (col.id === "container_number") {
        // Rendu avancé pour Numéro TC(s) avec badge/tag et menu déroulant statut
        let tcList = [];
        if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
        }
        if (tcList.length > 1) {
          td.classList.add("tc-multi-cell");
          const btn = document.createElement("button");
          btn.className = "tc-tags-btn";
          btn.type = "button";
          btn.innerHTML =
            tcList
              .slice(0, 2)
              .map((tc) => `<span class="tc-tag">${tc}</span>`)
              .join("") +
            (tcList.length > 2
              ? ` <span class="tc-tag tc-tag-more">+${tcList.length - 2}</span>`
              : "") +
            ' <i class="fas fa-chevron-down tc-chevron"></i>';
          const popup = document.createElement("div");
          popup.className = "tc-popup";
          popup.style.display = "none";
          popup.innerHTML = tcList
            .map(
              (tc) =>
                `<div class="tc-popup-item" style='cursor:pointer;'>${tc}</div>`
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
          tag.style.cursor = "pointer";
          tag.onclick = (e) => {
            e.stopPropagation();
            showContainerDetailPopup(delivery, tcList[0]);
          };
          td.appendChild(tag);
        } else {
          td.textContent = "-";
        }
      } else if (col.id === "bl_number") {
        // Rendu avancé pour N° BL : badge/tag  et menu déroulant popup
        let blList = [];
        if (Array.isArray(delivery.bl_number)) {
          blList = delivery.bl_number.filter(Boolean);
        } else if (typeof delivery.bl_number === "string") {
          blList = delivery.bl_number.split(/[,;\s]+/).filter(Boolean);
        }
        if (blList.length > 1) {
          td.classList.add("tc-multi-cell");
          const btn = document.createElement("button");
          btn.className = "tc-tags-btn";
          btn.type = "button";
          btn.innerHTML =
            blList
              .slice(0, 2)
              .map((bl) => `<span class=\"tc-tag\">${bl}</span>`)
              .join("") +
            (blList.length > 2
              ? ` <span class=\"tc-tag tc-tag-more\">+${
                  blList.length - 2
                }</span>`
              : "") +
            ' <i class="fas fa-chevron-down tc-chevron"></i>';
          const popup = document.createElement("div");
          popup.className = "tc-popup";
          popup.style.display = "none";
          popup.innerHTML = blList
            .map(
              (bl) =>
                `<div class=\"tc-popup-item\" style='cursor:pointer;'>${bl}</div>`
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
              showBLDetailPopup(delivery, item.textContent);
            };
          });
          document.addEventListener("click", function hidePopup(e) {
            if (!td.contains(e.target)) popup.style.display = "none";
          });
          td.appendChild(btn);
          td.appendChild(popup);
        } else if (blList.length === 1) {
          const tag = document.createElement("span");
          tag.className = "tc-tag";
          tag.textContent = blList[0];
          tag.style.cursor = "pointer";
          tag.onclick = (e) => {
            e.stopPropagation();
            showBLDetailPopup(delivery, blList[0]);
          };
          td.appendChild(tag);
        } else {
          td.textContent = "-";
        }
        // Fonction pour afficher le menu déroulant de BL (popup) avec statut
        function showBLDetailPopup(delivery, blNumber) {
          const oldPopup = document.getElementById("blDetailPopup");
          if (oldPopup) oldPopup.remove();
          const overlay = document.createElement("div");
          overlay.id = "blDetailPopup";
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
              <span style='font-size:1.08em;'>${
                delivery.employee_name || "-"
              }</span>
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
          const blNum = document.createElement("div");
          blNum.style.fontSize = "1.25em";
          blNum.style.fontWeight = "bold";
          blNum.style.marginBottom = "18px";
          blNum.style.textAlign = "center";
          blNum.innerHTML = `N° BL : <span style='color:#2563eb;'>${blNumber}</span>`;
          content.appendChild(blNum);
          // Ajout du sélecteur de statut pour le BL
          const label = document.createElement("label");
          label.textContent = "Statut du BL :";
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
          const statusOptions = [
            { value: "mise_en_livraison", label: "Mise en livraison" },
            { value: "aucun", label: "Aucun" },
          ];
          // On stocke le statut BL dans delivery.bl_statuses (objet clé BL)
          if (
            !delivery.bl_statuses ||
            typeof delivery.bl_statuses !== "object"
          ) {
            delivery.bl_statuses = {};
          }
          let currentStatus = delivery.bl_statuses[blNumber] || "aucun";
          if (currentStatus !== "mise_en_livraison") {
            currentStatus = "aucun";
          }
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
            let statutToSend =
              select.value === "aucun" ? "aucun" : select.value;
            // 1. MAJ locale immédiate du statut BL
            delivery.bl_statuses[blNumber] = statutToSend;
            // 2. MAJ instantanée de la colonne Statut Dossier dans la ligne du tableau
            // On retrouve la ligne du tableau correspondante
            const tableBody = document.getElementById("deliveriesTableBody");
            if (tableBody) {
              // On cherche la ligne correspondant à ce delivery
              for (let row of tableBody.rows) {
                // On suppose que la colonne N° Dossier (dossier_number) est unique et sert d'identifiant visuel
                let dossierCellIdx = AGENT_TABLE_COLUMNS.findIndex(
                  (c) => c.id === "dossier_number"
                );
                if (
                  dossierCellIdx !== -1 &&
                  row.cells[dossierCellIdx] &&
                  row.cells[dossierCellIdx].textContent ===
                    String(delivery.dossier_number)
                ) {
                  // On a trouvé la bonne ligne
                  let colIdx = AGENT_TABLE_COLUMNS.findIndex(
                    (c) => c.id === "container_status"
                  );
                  if (colIdx !== -1 && row.cells[colIdx]) {
                    // Recalcule le statut dossier
                    let blList = [];
                    if (Array.isArray(delivery.bl_number)) {
                      blList = delivery.bl_number.filter(Boolean);
                    } else if (typeof delivery.bl_number === "string") {
                      blList = delivery.bl_number
                        .split(/[,;\s]+/)
                        .filter(Boolean);
                    }
                    let blStatuses = blList.map((bl) =>
                      delivery.bl_statuses && delivery.bl_statuses[bl]
                        ? delivery.bl_statuses[bl]
                        : "aucun"
                    );
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
            // 3. Envoi serveur (asynchrone, mais pas bloquant pour l'UI)
            try {
              const res = await fetch(`/deliveries/${delivery.id}/bl-status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blNumber, status: statutToSend }),
              });
              if (!res.ok) {
                let msg = "Erreur lors de la mise à jour du statut du BL.";
                try {
                  const errData = await res.json();
                  if (errData && errData.error) msg += "\n" + errData.error;
                } catch {}
                alert(msg);
                return;
              }
              overlay.remove();
              // Plus besoin de recharger toute la table ici
            } catch (err) {
              alert(
                "Erreur lors de la mise à jour du statut du BL.\n" +
                  (err && err.message ? err.message : "")
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
        // ...existing code...
      } else if (col.id === "container_status") {
        // Nouveau comportement : le statut dépend uniquement du statut des BL (bl_statuses), le numéro TC n'a plus d'effet
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
        let allMiseEnLivraison =
          blStatuses.length > 0 &&
          blStatuses.every((s) => s === "mise_en_livraison");
        if (allMiseEnLivraison) {
          td.innerHTML =
            '<span style="display:inline-flex;align-items:center;gap:6px;color:#2563eb;font-weight:600;"><i class="fas fa-truck" style="font-size:1.1em;color:#2563eb;"></i> Mise en livraison</span>';
        } else {
          td.innerHTML =
            '<span style="display:inline-flex;align-items:center;gap:6px;color:#b45309;font-weight:600;"><i class="fas fa-clock" style="font-size:1.1em;color:#b45309;"></i> En attente de paiement</span>';
        }
      } else {
        value = delivery[col.id] !== undefined ? delivery[col.id] : "-";
        if (col.id === "observation") {
          td.classList.add("observation-col");
          td.style.cursor = "pointer";
          // Récupération de la valeur locale si le serveur n'a pas encore la donnée
          let localKey = `obs_${delivery.id}`;
          let localObs = localStorage.getItem(localKey);
          if (value === "-" && localObs) {
            td.textContent = localObs;
            td.title = localObs;
          } else {
            td.textContent = value;
            td.title = value;
            if (localObs && value && value !== "-" && value !== localObs) {
              // Si le serveur a la vraie valeur, on supprime la locale
              localStorage.removeItem(localKey);
            }
          }
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
            // Fonction de sauvegarde
            async function saveObservation(val) {
              td.textContent = val || "-";
              td.title = val;
              td.dataset.edited = "true";
              // Sauvegarde locale immédiate
              if (val && val.trim() !== "") {
                localStorage.setItem(localKey, val.trim());
              } else {
                localStorage.removeItem(localKey);
              }
              // Sauvegarde côté serveur
              try {
                await fetch(`/deliveries/${delivery.id}/observation`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ observation: val }),
                });
              } catch (err) {
                // Optionnel : afficher une erreur ou un toast
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
          td.textContent = value;
        }
      }
      tr.appendChild(td);
      // Fonction pour afficher le menu déroulant TC (popup) : uniquement infos TC
      function showContainerDetailPopup(delivery, containerNumber) {
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
            <span style='font-size:1.08em;'>${
              delivery.employee_name || "-"
            }</span>
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
  // Calcul dynamique des statuts
  // On ne compte plus que les dossiers "En attente de paiement"
  let attentePaiementCount = 0;
  if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
    window.allDeliveries.forEach((delivery) => {
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
      if (!blStatuses.every((s) => s === "mise_en_livraison")) {
        attentePaiementCount++;
      }
    });
  }
  // Ajout ou mise à jour des boutons en haut du tableau (sans champ de recherche)
  let btnBar = document.getElementById("deliveriesBtnBar");
  if (!btnBar) {
    btnBar = document.createElement("div");
    btnBar.id = "deliveriesBtnBar";
    btnBar.style.display = "flex";
    btnBar.style.justifyContent = "center";
    btnBar.style.gap = "18px";
    btnBar.style.margin = "18px 0 8px 0";
    if (attentePaiementCount > 0) {
      btnBar.innerHTML += `<button id="btnAttentePaiement" class="statut-btn" style="min-width:160px;background:#fffbe6;color:#b45309;border:2px solid #eab308;box-shadow:0 2px 8px rgba(234,179,8,0.13);font-weight:700;">En attente de paiement <span style='font-weight:400;'>(${attentePaiementCount})</span></button>`;
    }
    if (table && table.parentNode) {
      table.parentNode.insertBefore(btnBar, table);
    }
  } else {
    btnBar.innerHTML = "";
    if (attentePaiementCount > 0) {
      btnBar.innerHTML += `<button id=\"btnAttentePaiement\" class=\"statut-btn\" style=\"min-width:160px;background:#fffbe6;color:#b45309;border:2px solid #eab308;box-shadow:0 2px 8px rgba(234,179,8,0.13);font-weight:700;\">En attente de paiement <span style='font-weight:400;'>(${attentePaiementCount})</span></button>`;
    }
    btnBar.style.display = attentePaiementCount > 0 ? "flex" : "none";
  }

  // (Champ de recherche N° dossier supprimé de la barre principale)

  // Ajout du handler pour le bouton "En attente de paiement"
  setTimeout(() => {
    const btn = document.getElementById("btnAttentePaiement");
    if (btn) {
      btn.onclick = function () {
        // Récupérer tous les dossiers en attente de paiement
        const dossiers = (window.allDeliveries || []).filter((delivery) => {
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
          return blStatuses.some((s) => s !== "mise_en_livraison");
        });
        if (dossiers.length === 0) return;
        // Afficher une popup avec la liste des dossiers et leurs infos
        showAttentePaiementPopup(dossiers);
      };
    }
  }, 0);

  // Fonction pour afficher la popup détaillée des dossiers en attente de paiement
  function showAttentePaiementPopup(dossiers) {
    // Supprimer toute popup existante
    const oldPopup = document.getElementById("attentePaiementPopup");
    if (oldPopup) oldPopup.remove();
    const overlay = document.createElement("div");
    overlay.id = "attentePaiementPopup";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(30,41,59,0.45)";
    overlay.style.zIndex = 99999;
    overlay.style.display = "flex";
    overlay.style.alignItems = "flex-start";
    overlay.style.justifyContent = "center";
    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.borderRadius = "18px";
    box.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
    box.style.maxWidth = "700px";
    box.style.width = "96vw";
    box.style.marginTop = "60px";
    box.style.maxHeight = "80vh";
    box.style.overflowY = "auto";
    box.style.padding = "0";
    box.style.position = "relative";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    const header = document.createElement("div");
    header.style.background = "#eab308";
    header.style.color = "#0e274e";
    header.style.padding = "18px 28px 12px 28px";
    header.style.fontWeight = "bold";
    header.style.fontSize = "1.18rem";
    header.style.display = "flex";
    header.style.flexDirection = "row";
    header.style.alignItems = "center";
    header.innerHTML = `<span style='font-size:1.15em;'><i class='fas fa-clock' style='margin-right:10px;'></i>Dossiers en attente de paiement</span>`;
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.background = "none";
    closeBtn.style.border = "none";
    closeBtn.style.color = "#0e274e";
    closeBtn.style.fontSize = "2.1rem";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "10px";
    closeBtn.style.right = "18px";
    closeBtn.setAttribute("aria-label", "Fermer");
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    box.appendChild(header);
    // Ajout champ de recherche dans la popup
    const searchDiv = document.createElement("div");
    searchDiv.style.display = "flex";
    searchDiv.style.justifyContent = "center";
    searchDiv.style.alignItems = "center";
    searchDiv.style.gap = "8px";
    searchDiv.style.margin = "18px 0 10px 0";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Rechercher N° dossier...";
    searchInput.style.padding = "7px 14px";
    searchInput.style.border = "2px solid #2563eb";
    searchInput.style.borderRadius = "12px";
    searchInput.style.fontSize = "1em";
    searchInput.style.minWidth = "180px";
    searchInput.style.background = "#fff";
    searchInput.style.outline = "none";
    searchInput.style.boxShadow = "0 2px 8px rgba(37,99,235,0.08)";
    searchInput.style.transition = "border 0.2s";
    searchInput.addEventListener("focus", function () {
      this.style.border = "2px solid #eab308";
    });
    searchInput.addEventListener("blur", function () {
      this.style.border = "2px solid #2563eb";
    });
    searchDiv.appendChild(searchInput);

    const content = document.createElement("div");
    content.style.padding = "24px 24px 24px 24px";
    content.style.background = "#f8fafc";
    content.style.flex = "1 1 auto";
    content.style.overflowY = "auto";

    // Fonction pour afficher la liste filtrée sous forme de cartes simples
    function renderDossierCards(list) {
      content.innerHTML = "";
      if (list.length === 0) {
        content.innerHTML = `<div style='text-align:center;color:#64748b;font-size:1.1em;'>Aucun dossier en attente de paiement.</div>`;
        return;
      }
      list.forEach((delivery) => {
        const card = document.createElement("div");
        card.style.marginBottom = "18px";
        card.style.padding = "16px 22px";
        card.style.background = "#fff";
        card.style.borderRadius = "12px";
        card.style.boxShadow = "0 2px 8px rgba(234,179,8,0.08)";
        card.style.border = "1.5px solid #eab308";
        card.style.cursor = "pointer";
        card.style.transition = "box-shadow 0.18s, border 0.18s";
        card.onmouseover = () => {
          card.style.boxShadow = "0 4px 16px rgba(37,99,235,0.13)";
          card.style.border = "2px solid #2563eb";
        };
        card.onmouseout = () => {
          card.style.boxShadow = "0 2px 8px rgba(234,179,8,0.08)";
          card.style.border = "1.5px solid #eab308";
        };
        card.innerHTML = `
          <div style='font-size:1.13em;font-weight:700;margin-bottom:4px;'>N° Dossier : <span style='color:#2563eb;'>${
            delivery.dossier_number || "-"
          }</span></div>
          <div style='font-size:1em;'>Agent : <b style='color:#0e274e;'>${
            delivery.employee_name || "-"
          }</b></div>
        `;
        card.onclick = function (e) {
          e.stopPropagation();
          showDossierDetailPopup(delivery);
        };
        content.appendChild(card);
      });
    }

    // Affichage initial
    renderDossierCards(dossiers);

    // Handler recherche
    searchInput.oninput = function () {
      const value = this.value.trim().toLowerCase();
      let filtered = dossiers;
      if (value.length > 0) {
        filtered = dossiers.filter((delivery) =>
          String(delivery.dossier_number || "")
            .toLowerCase()
            .includes(value)
        );
      }
      renderDossierCards(filtered);
    };

    // Affichage des détails au clic sur une carte
    function showDossierDetailPopup(delivery) {
      // Supprimer tout popup détail existant
      const oldDetail = document.getElementById("dossierDetailPopup");
      if (oldDetail) oldDetail.remove();
      const overlay = document.createElement("div");
      overlay.id = "dossierDetailPopup";
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
      box.style.borderRadius = "18px";
      box.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
      box.style.maxWidth = "520px";
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
      header.style.borderTopLeftRadius = "18px";
      header.style.borderTopRightRadius = "18px";
      header.innerHTML = `
        <div style='margin-bottom:2px;'>N° Dossier : <span style='color:#eab308;'>${
          delivery.dossier_number || "-"
        }</span></div>
        <div style='font-size:0.98em;font-weight:400;'>Agent : <span style='color:#fff;'>${
          delivery.employee_name || "-"
        }</span></div>
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
      content.innerHTML = `
        <div style='margin-bottom:8px;'>Client : <b>${
          delivery.client_name || "-"
        }</b> | Tél : <b>${delivery.client_phone || "-"}</b></div>
        <div style='margin-bottom:8px;'>Numéro BL : <b>${
          delivery.bl_number || "-"
        }</b></div>
        <div style='margin-bottom:8px;'>Lieu : <b>${
          delivery.lieu || "-"
        }</b></div>
        <div style='margin-bottom:8px;'>Date livraison : <b>${
          delivery.delivery_date
            ? new Date(delivery.delivery_date).toLocaleDateString("fr-FR")
            : "-"
        }</b></div>
        <div style='margin-bottom:8px;'>Conteneur(s) : <b>${
          delivery.container_number || "-"
        }</b> | Type : <b>${delivery.container_foot_type || "-"}</b></div>
        <div style='margin-bottom:8px;'>Compagnie maritime : <b>${
          delivery.shipping_company || "-"
        }</b></div>
        <div style='margin-bottom:8px;'>Observation : <b>${
          delivery.observation_acconier || "-"
        }</b></div>
      `;
      box.appendChild(content);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };
    }

    box.appendChild(searchDiv);
    box.appendChild(content);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };
  }
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
