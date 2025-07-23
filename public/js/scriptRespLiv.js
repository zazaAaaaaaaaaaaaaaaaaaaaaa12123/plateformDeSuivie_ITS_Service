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
  tableBodyElement.innerHTML = "";
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
    // Rien ici, on gère tout dans la colonne 'N°'
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
    function isAllRequiredFilled() {
      return requiredFields.every((field) => {
        const colIdx = AGENT_TABLE_COLUMNS.findIndex((c) => c.id === field);
        if (colIdx === -1) return false;
        const cell = tr.children[colIdx + 1]; // +1 à cause de l'avatar
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
    let lastAccessState = null;
    let confirmationShown = false;
    AGENT_TABLE_COLUMNS.forEach((col, idx) => {
      function getCellStorageKey(delivery, colId) {
        return `deliverycell_${
          delivery.id || delivery.dossier_number || i
        }_${colId}`;
      }
      const td = document.createElement("td");
      let value = "-";
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
      // Décale l'affichage d'une colonne à droite (l'avatar est déjà ajouté)
      if (col.id === "row_number") {
        // Avatar + badge dans la même cellule
        td.style.textAlign = "center";
        td.style.verticalAlign = "middle";
        td.style.padding = "8px 6px";
        td.style.background = "#fff";
        td.style.border = "none";
        // Initiales de l'agent ou client
        let initials = "";
        if (delivery.employee_name) {
          initials = delivery.employee_name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase();
        } else if (delivery.client_name) {
          initials = delivery.client_name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase();
        } else {
          initials = "?";
        }
        // Avatar rond
        const avatar = document.createElement("div");
        avatar.textContent = initials;
        avatar.style.width = "38px";
        avatar.style.height = "38px";
        avatar.style.background = "#2563eb";
        avatar.style.color = "#fff";
        avatar.style.borderRadius = "50%";
        avatar.style.display = "inline-flex";
        avatar.style.alignItems = "center";
        avatar.style.justifyContent = "center";
        avatar.style.fontWeight = "bold";
        avatar.style.fontSize = "1.15em";
        avatar.style.marginRight = "8px";
        avatar.style.boxShadow = "0 2px 8px rgba(30,41,59,0.10)";
        // Badge numéro
        const badge = document.createElement("span");
        badge.textContent = i + 1;
        badge.style.background = "#3b82f6";
        badge.style.color = "#fff";
        badge.style.borderRadius = "50%";
        badge.style.display = "inline-block";
        badge.style.width = "22px";
        badge.style.height = "22px";
        badge.style.lineHeight = "22px";
        badge.style.fontSize = "1em";
        badge.style.fontWeight = "600";
        badge.style.boxShadow = "0 1px 4px rgba(30,41,59,0.10)";
        badge.style.marginLeft = "2px";
        // Conteneur flex pour aligner avatar et badge
        const flexContainer = document.createElement("div");
        flexContainer.style.display = "flex";
        flexContainer.style.alignItems = "center";
        flexContainer.style.justifyContent = "center";
        flexContainer.appendChild(avatar);
        flexContainer.appendChild(badge);
        td.appendChild(flexContainer);
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
        // ...existing code for container_number...
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
              .map((tc) => `<span class=\"tc-tag\">${tc}</span>`)
              .join("") +
            (tcList.length > 2
              ? ` <span class=\"tc-tag tc-tag-more\">+${
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
                `<div class=\"tc-popup-item\" style='cursor:pointer;'>${tc}</div>`
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
            if (!isAllRequiredFilled()) {
              // Rien à faire, accès refusé
              return;
            }
            showContainerDetailPopup(delivery, tcList[0]);
          };
          td.appendChild(tag);
        } else {
          td.textContent = "-";
        }
      } else if (col.id === "delivery_date") {
        let dDate = delivery.delivery_date;
        if (dDate) {
          let dateObj = new Date(dDate);
          if (!isNaN(dateObj.getTime())) {
            value = dateObj.toLocaleDateString("fr-FR");
          } else if (typeof dDate === "string") {
            // Format inconnu, afficher tel quel
            value = dDate;
          }
        } else {
          value = "-";
        }
        if (editableCols.includes(col.id)) {
          td.classList.add("editable-cell");
          td.style.cursor = "pointer";
          let displayValue =
            savedValue !== null && savedValue !== ""
              ? new Date(savedValue).toLocaleDateString("fr-FR")
              : value;
          td.textContent = displayValue;
          td.onclick = function (e) {
            // Action d'édition à définir si besoin
          };
        } else {
          // Rien à faire
        }
        if (col.id === "observation") {
          // Rien à faire
        }
      } else if (editableCols.includes(col.id)) {
        // Cellule éditable, logique à ajouter si besoin
      } else {
        // Autres colonnes
      }
      tr.appendChild(td);
      function showContainerDetailPopup(delivery, containerNumber) {
        // Fonction popup détail conteneur
      }
    });
    tableBodyElement.appendChild(tr);
  });

  // On charge toutes les livraisons une seule fois au chargement
  let allDeliveries = [];

  async function loadAllDeliveries() {
    try {
      const response = await fetch("/deliveries/status");
      const data = await response.json();
      if (data.success && Array.isArray(data.deliveries)) {
        // Correction : resp_liv.html doit afficher uniquement les livraisons dont le statut est "Mise en livraison"
        allDeliveries = data.deliveries.filter((delivery) => {
          // On vérifie le statut général ou le statut des BL
          // Si tous les BL sont en "mise_en_livraison" OU le statut principal est "mise_en_livraison"
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
          // Critère : au moins un BL en "mise_en_livraison" ou statut principal
          const statutPrincipal = delivery.status || delivery.statut || "";
          return (
            blStatuses.some((s) => s === "mise_en_livraison") ||
            statutPrincipal === "mise_en_livraison"
          );
        });
      } else {
        allDeliveries = [];
      }
    } catch (e) {
      console.error("Erreur lors du chargement des livraisons :", e);
      allDeliveries = [];
    }
  }

  // Filtre les livraisons selon la plage de dates
  function filterDeliveriesByDateRange(dateStartStr, dateEndStr) {
    // ...existing code...
  }

  // Fonction principale pour charger et afficher selon la plage de dates
  function updateTableForDateRange(dateStartStr, dateEndStr) {
    // ...existing code...
  }

  // Initialisation : charge toutes les livraisons puis affiche la plage par défaut (depuis une date antérieure jusqu'à aujourd'hui)
  // ...existing code...
}
// Fonction robuste pour générer le tableau complet (en-tête + lignes)
function renderAgentTableFull(deliveries, tableBodyElement) {
  const table = tableBodyElement.closest("table");
  if (deliveries.length === 0) {
    // Masquer le tableau et afficher un message centré
    if (table) table.style.display = "none";
    // Chercher ou créer un message d'absence
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
    // Afficher le tableau et masquer le message
    if (table) table.style.display = "table";
    const noDataMsg = document.getElementById("noDeliveriesMsg");
    if (noDataMsg) noDataMsg.style.display = "none";
    // Génération de l'en-tête
    if (table) {
      let thead = table.querySelector("thead");
      if (!thead) {
        thead = document.createElement("thead");
        table.insertBefore(thead, tableBodyElement);
      }
      thead.innerHTML = "";
      const headerRow = document.createElement("tr");
      AGENT_TABLE_COLUMNS.forEach((col) => {
        const th = document.createElement("th");
        if (col.id === "statut") {
          // Calcul du nombre de conteneurs livrés et total pour toutes les livraisons affichées
          let total = 0;
          let delivered = 0;
          deliveries.forEach((delivery) => {
            let tcList = [];
            if (Array.isArray(delivery.container_number)) {
              tcList = delivery.container_number.filter(Boolean);
            } else if (typeof delivery.container_number === "string") {
              tcList = delivery.container_number
                .split(/[,;\s]+/)
                .filter(Boolean);
            }
            total += tcList.length;
            if (
              delivery.container_statuses &&
              typeof delivery.container_statuses === "object"
            ) {
              delivered += Object.values(delivery.container_statuses).filter(
                (s) => s === "livre" || s === "livré"
              ).length;
            }
          });
          th.innerHTML = `<span style="font-weight:bold;">${
            col.label
          }</span><br><button style="margin-top:6px;font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #eab308;background:#fffbe6;color:#b45309;">${delivered} sur ${total} livré${
            total > 1 ? "s" : ""
          }</button>`;
        } else {
          th.textContent = col.label;
        }
        th.setAttribute("data-col-id", col.id);
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
    }
    renderAgentTableRows(deliveries, tableBodyElement);
  }
}
const AGENT_TABLE_COLUMNS = [
  { id: "row_number", label: "N°" },
  { id: "date_display", label: "Date" },
  { id: "employee_name", label: "Agent Acconier" },
  { id: "client_name", label: "Nom Client" },
  { id: "client_phone", label: "Numéro Client" },
  { id: "container_number", label: "Numéro TC(s)" },
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
      // Génère une clé unique pour chaque cellule éditable (par livraison et colonne)
      function getCellStorageKey(delivery, colId) {
        return `deliverycell_${
          delivery.id || delivery.dossier_number || i
        }_${colId}`;
      }
      const td = document.createElement("td");
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
        // Recompte dynamique selon le filtrage
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
        // ...existing code for container_number...
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
        // Affichage du modèle "x sur y livré" dans chaque cellule de la colonne Statut
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
        td.innerHTML = `<button style="font-size:1em;font-weight:600;padding:2px 16px;border-radius:10px;border:1.5px solid #eab308;background:#fffbe6;color:#b45309;">${delivered} sur ${total} livré${
          total > 1 ? "s" : ""
        }</button>`;
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
        // Seul le statut 'livré' doit être proposé
        const statusOptions = [{ value: "livre", label: "Livré" }];
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
              overlay.remove();
              // Rafraîchir les données si besoin
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
