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

  async function loadAllDeliveries() {
    try {
      const response = await fetch("/deliveries/status");
      const data = await response.json();
      if (data.success && Array.isArray(data.deliveries)) {
        // Ajout du statut par défaut 'en attente de paiement' pour chaque conteneur si absent
        allDeliveries = data.deliveries.map((delivery) => {
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
          return delivery;
        });
      } else {
        allDeliveries = [];
      }
    } catch (e) {
      console.error("Erreur lors du chargement des livraisons :", e);
      allDeliveries = [];
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

  // Fonction principale pour charger et afficher selon la date
  function updateTableForDate(dateStr) {
    const filtered = filterDeliveriesByDate(dateStr);
    renderAgentTableRows(filtered, tableBody);
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
  { id: "statut", label: "Statut" },
  { id: "container_status", label: "Statut conteneur" },
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
      } else if (col.id === "statut" || col.id === "acconier_status") {
        // Affichage du modèle "x sur y livré" + boîte flottante au survol
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
            return (
              s === "livre" ||
              s === "livré" ||
              s === "mise_en_livraison" ||
              s === "Mise en livraison"
            );
          }).length;
        }
        // Création du bouton et de la boîte flottante
        const btn = document.createElement("button");
        btn.className = "statut-btn";
        btn.textContent = `${delivered} sur ${total} livré${
          total > 1 ? "s" : ""
        }`;
        btn.style.position = "relative";
        // Boîte flottante style info, positionnée sous le bouton statut dossier
        const popup = document.createElement("div");
        popup.className = "tc-status-popup";
        popup.style.position = "absolute";
        popup.style.left = "50%";
        popup.style.top = "calc(100% + 8px)";
        popup.style.transform = "translateX(-50%)";
        popup.style.background = "#fff";
        popup.style.border = "2px solid #eab308";
        popup.style.borderRadius = "16px";
        popup.style.boxShadow = "0 8px 32px rgba(234,179,8,0.18)";
        popup.style.padding = "18px 24px";
        popup.style.minWidth = "260px";
        popup.style.zIndex = "9999";
        popup.style.display = "none";
        popup.style.fontSize = "1.08em";
        popup.innerHTML =
          `<div style='font-weight:bold;font-size:1.13em;color:#b45309;margin-bottom:12px;'>Détail des conteneurs</div>` +
          tcList
            .map((tc) => {
              let s =
                delivery.container_statuses && delivery.container_statuses[tc]
                  ? delivery.container_statuses[tc]
                  : "attente_paiement";
              let statut =
                s === "pending" || s === "attente_paiement"
                  ? "<span style='color:#b45309;font-weight:600;'>En attente de paiement</span>"
                  : s === "mise_en_livraison" || s === "Mise en livraison"
                  ? "<span style='color:#2563eb;font-weight:600;'><i class='fas fa-truck' style='font-size:1em;color:#2563eb;'></i> Mise en livraison</span>"
                  : s;
              return `<div style='display:flex;align-items:center;gap:10px;margin-bottom:7px;'><span style='font-weight:700;color:#0e274e;'>${tc}</span> <span style='color:#2563eb;'><i class='fas fa-info-circle' style='font-size:1em;'></i></span> ${statut}</div>`;
            })
            .join("");
        // Correction : gestion robuste du survol pour la boîte flottante
        let popupTimeout;
        btn.addEventListener("mouseenter", function () {
          clearTimeout(popupTimeout);
          popup.style.display = "block";
        });
        btn.addEventListener("mouseleave", function () {
          popupTimeout = setTimeout(() => {
            popup.style.display = "none";
          }, 350); // délai augmenté pour laisser le temps de passer sur le popup
        });
        popup.addEventListener("mouseenter", function () {
          clearTimeout(popupTimeout);
          popup.style.display = "block";
        });
        popup.addEventListener("mouseleave", function () {
          popupTimeout = setTimeout(() => {
            popup.style.display = "none";
          }, 350);
        });
        // Ajout : le popup est enfant du bouton pour garantir le stacking et le positionnement
        btn.style.zIndex = "10001";
        btn.style.position = "relative";
        popup.style.zIndex = "10002";
        btn.appendChild(popup);
        td.style.position = "relative";
        td.appendChild(btn);
      } else if (col.id === "container_status") {
        // Statut conteneur : si tous les conteneurs sont en 'mise en livraison', afficher ce statut, sinon 'en attente de paiement' ou mixte
        let tcList = [];
        if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
        }
        let statuses = tcList.map((tc) => {
          let s =
            delivery.container_statuses && delivery.container_statuses[tc]
              ? delivery.container_statuses[tc]
              : "attente_paiement";
          if (s === "pending" || s === "attente_paiement")
            return "En attente de paiement";
          if (s === "mise_en_livraison") return "Mise en livraison";
          return s;
        });
        let allMiseEnLivraison = statuses.every(
          (s) => s === "Mise en livraison"
        );
        let allAttentePaiement = statuses.every(
          (s) => s === "En attente de paiement"
        );
        if (allMiseEnLivraison) {
          td.innerHTML =
            '<span style="display:inline-flex;align-items:center;gap:6px;color:#2563eb;font-weight:600;"><i class="fas fa-truck" style="font-size:1.1em;color:#2563eb;"></i> Mise en livraison</span>';
        } else {
          td.textContent = "En attente de paiement";
        }
      } else {
        value = delivery[col.id] !== undefined ? delivery[col.id] : "-";
        if (col.id === "observation") {
          td.classList.add("observation-col");
          td.style.cursor = "pointer";
          td.textContent = value;
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
      // Fonction pour afficher le menu déroulant de statut conteneur (popup)
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
        const statusOptions = [
          { value: "mise_en_livraison", label: "Mise en livraison" },
        ];
        let currentStatus =
          delivery.container_statuses &&
          typeof delivery.container_statuses === "object" &&
          !Array.isArray(delivery.container_statuses) &&
          delivery.container_statuses[containerNumber]
            ? delivery.container_statuses[containerNumber]
            : delivery.status || "pending";
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
              // Met à jour le statut localement
              delivery.container_statuses[containerNumber] = select.value;
              overlay.remove();
              // Rafraîchir le tableau pour afficher le nouveau statut
              if (typeof renderAgentTableFull === "function") {
                // On utilise la date du filtre actuel
                const dateInput = document.getElementById(
                  "mainTableDateFilter"
                );
                if (dateInput) {
                  renderAgentTableFull(
                    filterDeliveriesByDate(dateInput.value),
                    document.getElementById("deliveriesTableBody")
                  );
                }
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

// Fonction pour générer les en-têtes du tableau Agent Acconier
function renderAgentTableHeaders(tableElement, deliveries) {
  const thead = tableElement.querySelector("thead");
  thead.innerHTML = "";
  const headerRow = document.createElement("tr");
  AGENT_TABLE_COLUMNS.forEach((col) => {
    const th = document.createElement("th");
    if (col.id === "statut" || col.id === "acconier_status") {
      // Calcul du nombre de conteneurs livrés et total pour toutes les livraisons de la plateforme (total général)
      let totalGeneral = 0;
      let deliveredGeneral = 0;
      if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
        window.allDeliveries.forEach((delivery) => {
          let tcList = [];
          if (Array.isArray(delivery.container_number)) {
            tcList = delivery.container_number.filter(Boolean);
          } else if (typeof delivery.container_number === "string") {
            tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
          }
          totalGeneral += tcList.length;
          if (
            delivery.container_statuses &&
            typeof delivery.container_statuses === "object"
          ) {
            deliveredGeneral += Object.values(
              delivery.container_statuses
            ).filter((s) => s === "livre" || s === "livré").length;
          }
        });
      }
      th.innerHTML = `<span style="font-weight:bold;">${
        col.label
      }</span><br><button class="statut-btn">${deliveredGeneral} sur ${totalGeneral} livré${
        totalGeneral > 1 ? "s" : ""
      }</button>`;
    } else {
      th.textContent = col.label;
    }
    th.setAttribute("data-col-id", col.id);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
}

// Fonction pour générer le tableau Agent Acconier complet
function renderAgentTableFull(deliveries, tableBodyElement) {
  const table = tableBodyElement.closest("table");
  // Calcul dynamique des statuts
  let miseEnLivraisonCount = 0;
  let attentePaiementCount = 0;
  if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
    window.allDeliveries.forEach((delivery) => {
      let tcList = [];
      if (Array.isArray(delivery.container_number)) {
        tcList = delivery.container_number.filter(Boolean);
      } else if (typeof delivery.container_number === "string") {
        tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
      }
      tcList.forEach((tc) => {
        let status = "attente_paiement";
        if (
          delivery.container_statuses &&
          typeof delivery.container_statuses === "object" &&
          delivery.container_statuses[tc]
        ) {
          status = delivery.container_statuses[tc];
        }
        if (status === "mise_en_livraison") {
          miseEnLivraisonCount++;
        } else {
          attentePaiementCount++;
        }
      });
    });
  }
  // Ajout ou mise à jour des boutons en haut du tableau
  let btnBar = document.getElementById("deliveriesBtnBar");
  if (!btnBar) {
    btnBar = document.createElement("div");
    btnBar.id = "deliveriesBtnBar";
    btnBar.style.display = "flex";
    btnBar.style.justifyContent = "center";
    btnBar.style.gap = "18px";
    btnBar.style.margin = "18px 0 8px 0";
    if (miseEnLivraisonCount > 0) {
      btnBar.innerHTML += `<button id="btnMiseLivraison" class="statut-btn" style="min-width:160px;background:#e0f2fe;color:#2563eb;border:2px solid #2563eb;box-shadow:0 2px 8px rgba(37,99,235,0.10);font-weight:700;">Mise en livraison <span style='font-weight:400;'>(${miseEnLivraisonCount})</span></button>`;
    }
    if (attentePaiementCount > 0) {
      btnBar.innerHTML += `<button id="btnAttentePaiement" class="statut-btn" style="min-width:160px;background:#fffbe6;color:#b45309;border:2px solid #eab308;box-shadow:0 2px 8px rgba(234,179,8,0.13);font-weight:700;">En attente de paiement <span style='font-weight:400;'>(${attentePaiementCount})</span></button>`;
    }
    // Ajout avant le tableau
    if (table && table.parentNode) {
      table.parentNode.insertBefore(btnBar, table);
    }
  } else {
    // Mise à jour dynamique si déjà présent
    btnBar.innerHTML = "";
    if (miseEnLivraisonCount > 0) {
      btnBar.innerHTML += `<button id=\"btnMiseLivraison\" class=\"statut-btn\" style=\"min-width:160px;background:#e0f2fe;color:#2563eb;border:2px solid #2563eb;box-shadow:0 2px 8px rgba(37,99,235,0.10);font-weight:700;\">Mise en livraison <span style='font-weight:400;'>(${miseEnLivraisonCount})</span></button>`;
    }
    if (attentePaiementCount > 0) {
      btnBar.innerHTML += `<button id=\"btnAttentePaiement\" class=\"statut-btn\" style=\"min-width:160px;background:#fffbe6;color:#b45309;border:2px solid #eab308;box-shadow:0 2px 8px rgba(234,179,8,0.13);font-weight:700;\">En attente de paiement <span style='font-weight:400;'>(${attentePaiementCount})</span></button>`;
    }
    btnBar.style.display =
      miseEnLivraisonCount > 0 || attentePaiementCount > 0 ? "flex" : "none";
  }
  // Filtrer les livraisons à afficher dans le tableau principal :
  // On ne montre que les livraisons où au moins un conteneur n'est pas en 'mise en livraison'
  const deliveriesToShow = deliveries.filter((delivery) => {
    let tcList = [];
    if (Array.isArray(delivery.container_number)) {
      tcList = delivery.container_number.filter(Boolean);
    } else if (typeof delivery.container_number === "string") {
      tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
    }
    let statuses = tcList.map((tc) =>
      delivery.container_statuses && delivery.container_statuses[tc]
        ? delivery.container_statuses[tc]
        : "attente_paiement"
    );
    // Si tous les conteneurs sont en 'mise en livraison', on ne l'affiche pas dans le tableau principal
    return !statuses.every((s) => s === "mise_en_livraison");
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
