// Fonction utilitaire pour normaliser la date à minuit
function normalizeDateToMidnight(date) {
  if (!(date instanceof Date)) date = new Date(date);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Fonction principale pour ,  afficher les livraisons filtrées par date
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
  // --- Toast dossiers en retard (>2 jours) ---
  function showLateDeliveriesToast(lateDeliveries) {
    // Supprimer tout toast existant
    const oldToast = document.getElementById("late-deliveries-toast");
    if (oldToast) oldToast.remove();
    if (!lateDeliveries || lateDeliveries.length === 0) return;
    const toast = document.createElement("div");
    toast.id = "late-deliveries-toast";
    toast.style.position = "fixed";
    toast.style.top = "32px";
    toast.style.right = "32px";
    toast.style.background = "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
    toast.style.color = "#fff";
    toast.style.fontWeight = "bold";
    toast.style.fontSize = "1.08em";
    toast.style.padding = "10px 28px";
    toast.style.borderRadius = "16px";
    toast.style.boxShadow = "0 6px 32px rgba(239,68,68,0.18)";
    toast.style.zIndex = 99999;
    toast.style.cursor = "pointer";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    toast.textContent = `⚠️ ${lateDeliveries.length} dossier(s) en retard`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "1";
    }, 10);
    // Clic : affiche la liste détaillées
    toast.onclick = function () {
      // Supprimer popup existant
      const oldPopup = document.getElementById("late-deliveries-popup");
      if (oldPopup) oldPopup.remove();
      const overlay = document.createElement("div");
      overlay.id = "late-deliveries-popup";
      overlay.style.position = "fixed";
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.background = "rgba(30,41,59,0.45)";
      overlay.style.zIndex = 100000;
      overlay.style.display = "flex";
      overlay.style.alignItems = "flex-start";
      overlay.style.justifyContent = "center";
      overlay.style.paddingTop = "8vh";
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
      header.style.background = "#ef4444";
      header.style.color = "#fff";
      header.style.padding = "18px 28px 12px 28px";
      header.style.fontWeight = "bold";
      header.style.fontSize = "1.15rem";
      header.style.display = "flex";
      header.style.flexDirection = "column";
      header.style.borderTopLeftRadius = "16px";
      header.style.borderTopRightRadius = "16px";
      header.innerHTML = `<span style='font-size:1.08em;'>Dossiers en retard</span>`;
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
      if (lateDeliveries.length === 0) {
        content.innerHTML =
          "<div style='text-align:center;'>Aucun dossier en retard.</div>";
      } else {
        const ul = document.createElement("ul");
        ul.className = "late-deliveries-list";
        ul.style.listStyle = "none";
        ul.style.padding = 0;
        ul.style.margin = 0;
        lateDeliveries.forEach((d, idx) => {
          const li = document.createElement("li");
          li.className = "late-delivery-item";
          li.style.marginBottom = "18px";
          li.style.cursor = "pointer";
          li.style.borderRadius = "14px";
          li.style.padding = "18px 18px 14px 18px";
          li.style.background = "#fff";
          li.style.boxShadow = "0 2px 12px rgba(239,68,68,0.10)";
          li.style.border = "2px solid #fee2e2";
          li.style.transition =
            "background 0.18s, box-shadow 0.18s, border 0.18s, transform 0.18s";
          li.innerHTML = `
            <div style='display:flex;align-items:center;gap:10px;margin-bottom:6px;'>
              <span style='display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:linear-gradient(135deg,#ef4444 60%,#fca5a5 100%);color:#fff;font-weight:bold;font-size:1.1em;border-radius:50%;box-shadow:0 2px 8px #ef444433;'>${
                idx + 1
              }</span>
              <span style='color:#ef4444;font-weight:bold;font-size:1.08em;'><i class="fas fa-folder-open" style="margin-right:6px;color:#ef4444;"></i>N° Dossier :</span>
              <span style='color:#b91c1c;font-weight:700;font-size:1.13em;'>${
                d.dossier_number || "-"
              }</span>
            </div>
            <div style='font-size:1em;margin-left:42px;'>
              <span style='color:#2563eb;font-weight:600;'>Agent :</span>
              <span style='color:#0e274e;font-weight:600;'>${
                d.employee_name || "-"
              }</span>
            </div>
          `;
          li.onmouseenter = function () {
            li.style.background = "#fef2f2";
            li.style.borderColor = "#fca5a5";
            li.style.boxShadow = "0 6px 24px #ef444433";
            li.style.transform = "translateY(-2px) scale(1.015)";
          };
          li.onmouseleave = function () {
            li.style.background = "#fff";
            li.style.borderColor = "#fee2e2";
            li.style.boxShadow = "0 2px 12px rgba(239,68,68,0.10)";
            li.style.transform = "none";
          };
          // Ajout : au clic, scroll sur la ligne du tableau et flash
          li.onclick = function (e) {
            e.stopPropagation();
            overlay.remove(); // ferme la popup
            // Cherche la ligne du tableau avec le bon N° Dossier
            const tableBody = document.getElementById("deliveriesTableBody");
            if (tableBody) {
              // On cherche la cellule qui contient le N° Dossier
              const rows = tableBody.querySelectorAll("tr");
              let foundRow = null;
              rows.forEach((row) => {
                const cells = row.querySelectorAll("td");
                for (let i = 0; i < cells.length; i++) {
                  if (
                    cells[i].textContent &&
                    String(cells[i].textContent).trim() ===
                      String(d.dossier_number).trim()
                  ) {
                    foundRow = row;
                  }
                }
              });
              if (foundRow) {
                foundRow.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                // Clignotement 3 fois sur 3 secondes
                const tds = foundRow.querySelectorAll("td");
                let flashCount = 0;
                const maxFlashes = 3;
                function doFlash() {
                  tds.forEach((td) => {
                    td.classList.remove("flash-red-cell");
                    void td.offsetWidth;
                    td.classList.add("flash-red-cell");
                  });
                  setTimeout(() => {
                    tds.forEach((td) => td.classList.remove("flash-red-cell"));
                    flashCount++;
                    if (flashCount < maxFlashes) {
                      setTimeout(doFlash, 1000);
                    }
                  }, 1000);
                }
                doFlash();
              }
            }
          };
          ul.appendChild(li);
        });
        content.appendChild(ul);
      }
      box.appendChild(content);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };
      // Ajout du style pour le flash rouge sur la ligne du tableau si pas déjà présent
      if (!document.getElementById("flash-red-row-style")) {
        const style = document.createElement("style");
        style.id = "flash-red-row-style";
        style.innerHTML = `
        .flash-red-cell {
          animation: flashRedCellAnim 1s cubic-bezier(0.4,0,0.2,1);
          background: #d49494ff !important;
          transition: background 0.3s;
        }
        @keyframes flashRedCellAnim {
          0% { background: #fee2e2; }
          30% { background: #f87171; }
          70% { background: #fecaca; }
          100% { background: transparent; }
        }
        `;
        document.head.appendChild(style);
      }
    };
    // Disparition auto après 8s
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 400);
    }, 8000);
  }
  // Ajout dynamique du bouton de suppression compact à côté des dates
  let deleteBtn = null;
  let rangeDiv = null;
  function showDeleteBtn() {
    if (!deleteBtn) {
      deleteBtn = document.createElement("button");
      deleteBtn.id = "deleteRowsBtn";
      deleteBtn.textContent = "🗑️ Supprimer";
      deleteBtn.style.background =
        "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
      deleteBtn.style.color = "#fff";
      deleteBtn.style.fontWeight = "bold";
      deleteBtn.style.fontSize = "0.98em";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "50px";
      deleteBtn.style.padding = "0.45em 1.1em";
      deleteBtn.style.marginLeft = "12px";
      deleteBtn.style.boxShadow = "0 2px 8px rgba(239,68,68,0.13)";
      deleteBtn.style.display = "none";
      deleteBtn.onclick = async function () {
        const checked = document.querySelectorAll(
          ".select-row-checkbox:checked"
        );
        if (checked.length === 0) return;

        // Message de confirmation personnalisé
        const confirmOverlay = document.createElement("div");
        confirmOverlay.style.position = "fixed";
        confirmOverlay.style.top = 0;
        confirmOverlay.style.left = 0;
        confirmOverlay.style.width = "100vw";
        confirmOverlay.style.height = "100vh";
        confirmOverlay.style.background = "rgba(30,41,59,0.45)";
        confirmOverlay.style.zIndex = 99999;
        confirmOverlay.style.display = "flex";
        confirmOverlay.style.alignItems = "center";
        confirmOverlay.style.justifyContent = "center";

        const confirmBox = document.createElement("div");
        confirmBox.style.background = "#fff";
        confirmBox.style.borderRadius = "18px";
        confirmBox.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
        confirmBox.style.maxWidth = "420px";
        confirmBox.style.width = "96vw";
        confirmBox.style.padding = "0";
        confirmBox.style.position = "relative";
        confirmBox.style.display = "flex";
        confirmBox.style.flexDirection = "column";

        // Header
        const confirmHeader = document.createElement("div");
        confirmHeader.style.background =
          "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
        confirmHeader.style.color = "#fff";
        confirmHeader.style.padding = "22px 32px 12px 32px";
        confirmHeader.style.fontWeight = "bold";
        confirmHeader.style.fontSize = "1.18rem";
        confirmHeader.style.borderTopLeftRadius = "18px";
        confirmHeader.style.borderTopRightRadius = "18px";
        confirmHeader.innerHTML = `<span style='font-size:1.25em;'>🗑️ Confirmation de suppression</span>`;
        confirmBox.appendChild(confirmHeader);

        // Message
        const confirmMsgDiv = document.createElement("div");
        confirmMsgDiv.style.padding = "24px 24px 18px 24px";
        confirmMsgDiv.style.background = "#f8fafc";
        confirmMsgDiv.style.fontSize = "1.08em";
        confirmMsgDiv.style.color = "#1e293b";
        confirmMsgDiv.style.textAlign = "center";
        confirmMsgDiv.innerHTML =
          "<b>Vous êtes sur le point de supprimer définitivement la sélection.</b><br><br>Cette opération est <span style='color:#ef4444;font-weight:600;'>irréversible</span>.<br><br>Voulez-vous vraiment continuer ?";
        confirmBox.appendChild(confirmMsgDiv);

        // Boutons
        const btnsDiv = document.createElement("div");
        btnsDiv.style.display = "flex";
        btnsDiv.style.justifyContent = "center";
        btnsDiv.style.gap = "18px";
        btnsDiv.style.padding = "0 0 22px 0";

        // Bouton Annuler
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Annuler";
        cancelBtn.style.background = "#fff";
        cancelBtn.style.color = "#ef4444";
        cancelBtn.style.fontWeight = "bold";
        cancelBtn.style.fontSize = "1em";
        cancelBtn.style.border = "2px solid #ef4444";
        cancelBtn.style.borderRadius = "8px";
        cancelBtn.style.padding = "0.7em 1.7em";
        cancelBtn.style.cursor = "pointer";
        cancelBtn.onclick = () => confirmOverlay.remove();

        // Bouton Confirmer
        const okBtn = document.createElement("button");
        okBtn.textContent = "Supprimer";
        okBtn.style.background =
          "linear-gradient(90deg,#ef4444 0%,#b91c1c 100%)";
        okBtn.style.color = "#fff";
        okBtn.style.fontWeight = "bold";
        okBtn.style.fontSize = "1em";
        okBtn.style.border = "none";
        okBtn.style.borderRadius = "8px";
        okBtn.style.padding = "0.7em 1.7em";
        okBtn.style.cursor = "pointer";
        okBtn.onclick = async () => {
          confirmOverlay.remove();
          const idsToDelete = Array.from(checked).map((cb) =>
            cb.getAttribute("data-id")
          );
          // Appel API backend pour suppression définitive
          try {
            const response = await fetch("/deliveries/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ids: idsToDelete }),
            });
            const result = await response.json();
            if (result.success) {
              // Suppression locale hfgvj seulement si succès côté serveur
              if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
                window.allDeliveries = window.allDeliveries.filter(
                  (d) => !idsToDelete.includes(String(d.id))
                );
              }
              const dateStartInput = document.getElementById(
                "mainTableDateStartFilter"
              );
              const dateEndInput = document.getElementById(
                "mainTableDateEndFilter"
              );
              if (typeof updateTableForDateRange === "function") {
                updateTableForDateRange(
                  dateStartInput ? dateStartInput.value : "",
                  dateEndInput ? dateEndInput.value : ""
                );
              }
              hideDeleteBtn();

              // Afficher une alerte visuelle "suppression effectuée"
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
              alert(
                "Erreur lors de la suppression côté serveur. Veuillez réessayer."
              );
            }
          } catch (e) {
            alert("Erreur réseau lors de la suppression. Veuillez réessayer.");
          }
        };

        btnsDiv.appendChild(cancelBtn);
        btnsDiv.appendChild(okBtn);
        confirmBox.appendChild(btnsDiv);
        confirmOverlay.appendChild(confirmBox);
        document.body.appendChild(confirmOverlay);
        // Fermer la popup si clic en dehors de la boîte
        confirmOverlay.onclick = (e) => {
          if (e.target === confirmOverlay) confirmOverlay.remove();
        };
      };
      // Trouver le rangeDiv (le conteneur des dates)
      rangeDiv = document.getElementById(
        "mainTableDateStartFilter"
      )?.parentNode;
      if (rangeDiv && rangeDiv.nodeName === "DIV") {
        rangeDiv.appendChild(deleteBtn);
      } else {
        // fallback : insérer après le champ date début
        const dateStartInput = document.getElementById(
          "mainTableDateStartFilter"
        );
        if (dateStartInput && dateStartInput.parentNode) {
          dateStartInput.parentNode.insertBefore(
            deleteBtn,
            dateStartInput.nextSibling
          );
        } else {
          document.body.appendChild(deleteBtn);
        }
      }
    }
    deleteBtn.style.display = "inline-block";
  }
  function hideDeleteBtn() {
    if (deleteBtn) deleteBtn.style.display = "none";
  }
  // Gestion de l'affichage du bouton selonv vhvcb la sélection
  document.addEventListener("change", function (e) {
    if (
      e.target.classList &&
      e.target.classList.contains("select-row-checkbox")
    ) {
      const checked = document.querySelectorAll(".select-row-checkbox:checked");
      if (checked.length > 0) {
        showDeleteBtn();
      } else {
        hideDeleteBtn();
      }
    }
  });
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
          data.delivery &&
          data.delivery.bl_statuses
        ) {
          // Toujours normaliser la livraison reçue comme dans loadAllDeliveries
          function normalizeDelivery(delivery) {
            let tcList = [];

            // PRIORITÉ 1 : Utiliser les données JSON complètes si disponibles
            if (delivery.container_numbers_list) {
              try {
                if (typeof delivery.container_numbers_list === "string") {
                  tcList = JSON.parse(delivery.container_numbers_list);
                } else if (Array.isArray(delivery.container_numbers_list)) {
                  tcList = delivery.container_numbers_list;
                }
                tcList = tcList.filter(Boolean); // Supprimer les valeurs vides
              } catch (e) {
                console.warn("Erreur parsing container_numbers_list:", e);
                tcList = [];
              }
            }

            // PRIORITÉ 2 : Si pas de données JSON, utiliser le champ classique
            if (tcList.length === 0) {
              if (Array.isArray(delivery.container_number)) {
                tcList = delivery.container_number.filter(Boolean);
              } else if (typeof delivery.container_number === "string") {
                tcList = delivery.container_number
                  .split(/[,;\s]+/)
                  .filter(Boolean);
              }
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
          if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
            const idx = window.allDeliveries.findIndex(
              (d) => d.id === normalizedDelivery.id
            );
            if (idx !== -1) {
              window.allDeliveries[idx] = normalizedDelivery;
            }
          }
          // Rafraîchir le tableau si la livraison est dans la plage de dates courante
          const dateStartInput = document.getElementById(
            "mainTableDateStartFilter"
          );
          const dateEndInput = document.getElementById(
            "mainTableDateEndFilter"
          );
          if (typeof updateTableForDateRange === "function") {
            updateTableForDateRange(
              dateStartInput ? dateStartInput.value : "",
              dateEndInput ? dateEndInput.value : ""
            );
          }
        }
        // Ajout : réception automatique d'un nouvel ordre de livraison
        if (data.type === "new_delivery_created" && data.delivery) {
          // Normalise la livraison reçue comme dans loadAllDeliveries
          function normalizeDelivery(delivery) {
            let tcList = [];

            // PRIORITÉ 1 : Utiliser les données JSON complètes si disponibles
            if (delivery.container_numbers_list) {
              try {
                if (typeof delivery.container_numbers_list === "string") {
                  tcList = JSON.parse(delivery.container_numbers_list);
                } else if (Array.isArray(delivery.container_numbers_list)) {
                  tcList = delivery.container_numbers_list;
                }
                tcList = tcList.filter(Boolean); // Supprimer les valeurs vides
              } catch (e) {
                console.warn("Erreur parsing container_numbers_list:", e);
                tcList = [];
              }
            }

            // PRIORITÉ 2 : Si pas de données JSON, utiliser le champ classique
            if (tcList.length === 0) {
              if (Array.isArray(delivery.container_number)) {
                tcList = delivery.container_number.filter(Boolean);
              } else if (typeof delivery.container_number === "string") {
                tcList = delivery.container_number
                  .split(/[,;\s]+/)
                  .filter(Boolean);
              }
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
        // Ajout : gestion du retour instantané d'un dossier au Resp. Acconier
        if (data.type === "delivery_returned_acconier") {
          // Recharge toutes les livraisons et rafraîchit le tableau
          const dateStartInput = document.getElementById(
            "mainTableDateStartFilter"
          );
          const dateEndInput = document.getElementById(
            "mainTableDateEndFilter"
          );
          const startVal = dateStartInput ? dateStartInput.value : "";
          const endVal = dateEndInput ? dateEndInput.value : "";
          loadAllDeliveries().then(() => {
            if (typeof updateTableForDateRange === "function") {
              updateTableForDateRange(startVal, endVal);
            }
          });
          // Affiche l'alerte reçue
          if (data.message) {
            const oldAlert = document.getElementById("restore-dossier-alert");
            if (oldAlert) oldAlert.remove();
            const alert = document.createElement("div");
            alert.id = "restore-dossier-alert";
            alert.textContent = data.message;
            alert.style.position = "fixed";
            alert.style.top = "80px";
            alert.style.left = "50%";
            alert.style.transform = "translateX(-50%)";
            alert.style.background =
              "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
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

          // PRIORITÉ 1 : Utiliser les données JSON complètes si disponibles
          if (delivery.container_numbers_list) {
            try {
              if (typeof delivery.container_numbers_list === "string") {
                tcList = JSON.parse(delivery.container_numbers_list);
              } else if (Array.isArray(delivery.container_numbers_list)) {
                tcList = delivery.container_numbers_list;
              }
              tcList = tcList.filter(Boolean); // Supprimer les valeurs vides
            } catch (e) {
              console.warn("Erreur parsing container_numbers_list:", e);
              tcList = [];
            }
          }

          // PRIORITÉ 2 : Si pas de données JSON, utiliser le champ classique
          if (tcList.length === 0) {
            if (Array.isArray(delivery.container_number)) {
              tcList = delivery.container_number.filter(Boolean);
            } else if (typeof delivery.container_number === "string") {
              tcList = delivery.container_number
                .split(/[,;\s]+/)
                .filter(Boolean);
            }
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
    // Vérification automatique : si la date de début est après la date de fin, on corrige
    if (dateStartStr && dateEndStr && dateStartStr > dateEndStr) {
      // On inverse les dates
      const tmp = dateStartStr;
      dateStartStr = dateEndStr;
      dateEndStr = tmp;
      // On met à jour les champs dans l'UI
      const dateStartInput = document.getElementById(
        "mainTableDateStartFilter"
      );
      const dateEndInput = document.getElementById("mainTableDateEndFilter");
      if (dateStartInput) dateStartInput.value = dateStartStr;
      if (dateEndInput) dateEndInput.value = dateEndStr;
    }
    let filtered = filterDeliveriesByDateRange(dateStartStr, dateEndStr);
    console.log(
      "[DEBUG] updateTableForDateRange - livraisons filtrées:",
      filtered
    );
    // Tri du plus ancien au plus récent (ordre croissant)--
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
    // On charge toutes les livraisons puis on détermine la date la plus ancienne
    loadAllDeliveries().then(() => {
      // Chercher la date la plus ancienne dans toutes les livraisons
      let minDate = null;
      (window.allDeliveries || []).forEach((d) => {
        let dDate = d.delivery_date || d.created_at;
        if (dDate) {
          let dateObj = new Date(dDate);
          if (!isNaN(dateObj.getTime())) {
            if (!minDate || dateObj < minDate) minDate = dateObj;
          }
        }
      });
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      let minDateStr = minDate ? minDate.toISOString().split("T")[0] : todayStr;
      dateStartInput.value = minDateStr;
      dateEndInput.value = todayStr;
      updateTableForDateRange(dateStartInput.value, dateEndInput.value);
      // Après chargement, détecter les dossiers en retard (>2 jours) mais uniquement ceux qui ne sont PAS en livraison
      function getLateDeliveries() {
        const now = new Date();
        // Appliquer le même filtrage que le tableau principal
        return (window.allDeliveries || []).filter((d) => {
          let dDate = d.delivery_date || d.created_at;
          if (!dDate) return false;
          let dateObj = new Date(dDate);
          if (isNaN(dateObj.getTime())) return false;
          const diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
          if (diffDays <= 2) return false;
          // Même logique que renderAgentTableFull :
          // Affiche TOUS les dossiers dont le statut shjacconier est 'en attente de paiement'
          if (d.delivery_status_acconier === "en attente de paiement") {
            return true;
          }
          // Sinon, on garde l'ancien filtrage BL
          let blList = [];
          if (Array.isArray(d.bl_number)) {
            blList = d.bl_number.filter(Boolean);
          } else if (typeof d.bl_number === "string") {
            blList = d.bl_number.split(/[,;\s]+/).filter(Boolean);
          }
          let blStatuses = blList.map((bl) =>
            d.bl_statuses && d.bl_statuses[bl] ? d.bl_statuses[bl] : "aucun"
          );
          // Si tous les BL sont en 'mise_en_livraison', on ne l'affiche pas
          if (
            blStatuses.length > 0 &&
            blStatuses.every((s) => s === "mise_en_livraison")
          ) {
            return false;
          }
          // Exclure aussi si statut acconier est 'mise_en_livraison_acconier'
          if (d.delivery_status_acconier === "mise_en_livraison_acconier") {
            return false;
          }
          return true;
        });
      }
      showLateDeliveriesToast(getLateDeliveries());
      // Affichage toutes les 40 secondes
      setInterval(() => {
        showLateDeliveriesToast(getLateDeliveries());
      }, 40000);

      // Met à jour la liste des dossiers en retard à chaque changement de statut livraison
      document.addEventListener("bl_status_update", function () {
        showLateDeliveriesToast(getLateDeliveries());
      });
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
const AGENT_TABLE_COLUMNS = [
  { id: "select_row", label: "" }, // Colonne pour la sélection
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
    // Détermination de la couleur de l'avatar selon l'ancienneté
    let dDate = delivery.delivery_date || delivery.created_at;
    let dateObj = dDate ? new Date(dDate) : null;
    let now = new Date();
    let avatarColor = "#2563eb"; // bleu par défaut (récent)
    let avatarBg = "linear-gradient(135deg, #2563eb 60%, #1e293b 100%)";
    let badgeColor = "#2563eb";
    if (dateObj && !isNaN(dateObj.getTime())) {
      let diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
      if (diffDays >= 30) {
        avatarColor = "#a3a3a3"; // gris
        avatarBg = "linear-gradient(135deg, #a3a3a3 60%, #6b7280 100%)";
        badgeColor = "#a3a3a3";
      } else if (diffDays >= 7) {
        avatarColor = "#eab308"; // jaune
        avatarBg = "linear-gradient(135deg, #eab308 60%, #facc15 100%)";
        badgeColor = "#eab308";
      } else if (diffDays >= 0) {
        avatarColor = "#2563eb"; // bleu
        avatarBg = "linear-gradient(135deg, #2563eb 60%, #1e293b 100%)";
        badgeColor = "#2563eb";
      }
    }
    AGENT_TABLE_COLUMNS.forEach((col, idx) => {
      const td = document.createElement("td");
      let value = "-";
      if (col.id === "select_row") {
        // Ajout d'une case à cocher pour la sélection
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "select-row-checkbox";
        checkbox.setAttribute("data-id", delivery.id);
        td.appendChild(checkbox);
        td.style.textAlign = "center";
      } else if (col.id === "row_number") {
        value = i + 1;
        // Avatar stylisé moderne avec initiales et couleur dynamique
        const avatar = document.createElement("div");
        avatar.style.display = "flex";
        avatar.style.alignItems = "center";
        avatar.style.justifyContent = "center";
        avatar.style.width = window.innerWidth <= 600 ? "28px" : "38px";
        avatar.style.height = window.innerWidth <= 600 ? "28px" : "38px";
        avatar.style.borderRadius = "50%";
        avatar.style.background = avatarBg;
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
          window.innerWidth <= 600 ? "1em" : "1.15em";
        initialsSpan.style.letterSpacing = "0.5px";
        avatar.appendChild(initialsSpan);
        // Effet de halo
        avatar.style.boxShadow += ", 0 0 0 6px #e0e7ef33";
        // Badge numéro (optionnel, petit rond blanc en bas à droite)
        const badge = document.createElement("span");
        badge.textContent = value;
        badge.style.position = "absolute";
        badge.style.bottom = "-5px";
        badge.style.right = "-5px";
        badge.style.background = "#fff";
        badge.style.color = badgeColor;
        badge.style.fontWeight = "bold";
        badge.style.fontSize = window.innerWidth <= 600 ? "0.8em" : "0.95em";
        badge.style.borderRadius = "50%";
        badge.style.padding = window.innerWidth <= 600 ? "1px 5px" : "2px 7px";
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
      } else if (col.id === "container_number") {
        // Rendu avancé pour Numéro TC(s) avec badge/tag et menu déroulant statut
        let tcList = [];

        // PRIORITÉ 1 : Utiliser les données JSON complètes si disponibles
        if (delivery.container_numbers_list) {
          try {
            if (typeof delivery.container_numbers_list === "string") {
              tcList = JSON.parse(delivery.container_numbers_list);
            } else if (Array.isArray(delivery.container_numbers_list)) {
              tcList = delivery.container_numbers_list;
            }
            tcList = tcList.filter(Boolean); // Supprimer les valeurs vides
          } catch (e) {
            console.warn("Erreur parsing container_numbers_list:", e);
            tcList = [];
          }
        }

        // PRIORITÉ 2 : Si pas de données JSON, utiliser le champ classique
        if (tcList.length === 0) {
          if (Array.isArray(delivery.container_number)) {
            tcList = delivery.container_number.filter(Boolean);
          } else if (typeof delivery.container_number === "string") {
            tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
          }
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
          // Responsive popup width
          popup.style.minWidth = window.innerWidth <= 600 ? "90px" : "120px";
          popup.style.fontSize = window.innerWidth <= 600 ? "0.97em" : "1.05em";
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
          // Fermer le popup au toucher/clic hors du bouton sur mobile
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
        // Fonction pour afficher le menu déroulant de BL (popup) avec statut - VERSION ULTRA COMPACTE 2024
        function showBLDetailPopup(delivery, blNumber) {
          console.log("🚀 POPUP ULTRA COMPACT - Version tablette optimisée");
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
          overlay.style.display = "block"; // Changé de flex à block pour popup déplaçable
          overlay.style.pointerEvents = "none"; // Permettre les clics à travers l'overlay
          // Positionnement initial pour popup déplaçable
          const box = document.createElement("div");
          box.style.background = "#fff";
          box.style.borderRadius = window.innerWidth <= 768 ? "12px" : "16px";
          box.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
          box.style.position = "fixed"; // Position fixe pour drag-and-drop
          box.style.pointerEvents = "auto"; // Restaurer les événements pour la popup
          // Adaptation responsive : popup réduite pour meilleur centrage sur tablette
          if (window.innerWidth <= 480) {
            // Mobile - format compact horizontal
            box.style.maxWidth = "92vw";
            box.style.width = "92vw";
            box.style.maxHeight = "70vh";
          } else if (window.innerWidth <= 768) {
            // Tablette - format réduit pour meilleur centrage
            box.style.maxWidth = "82vw";
            box.style.width = "82vw";
            box.style.maxHeight = "65vh";
          } else if (window.innerWidth <= 1024) {
            // Petits écrans desktop
            box.style.maxWidth = "75vw";
            box.style.width = "75vw";
            box.style.maxHeight = "65vh";
          } else {
            // Desktop large
            box.style.maxWidth = "520px";
            box.style.width = "96vw";
            box.style.maxHeight = "90vh";
          }
          box.style.overflowY = "auto";
          box.style.padding = "0";
          box.style.display = "flex";
          box.style.flexDirection = "column";
          // Rendre la popup déplaçable - positionnement initial centré
          box.style.cursor = "move";
          box.style.zIndex = 10000;

          // Positionner la popup au centre initialement
          const boxWidth =
            window.innerWidth <= 480
              ? window.innerWidth * 0.92
              : window.innerWidth <= 768
              ? window.innerWidth * 0.82
              : window.innerWidth <= 1024
              ? window.innerWidth * 0.75
              : 520;
          const boxHeight =
            window.innerWidth <= 768
              ? window.innerHeight * 0.65
              : window.innerHeight * 0.7;

          box.style.left = (window.innerWidth - boxWidth) / 2 + "px";
          box.style.top =
            window.innerWidth <= 768
              ? "8vh"
              : (window.innerHeight - boxHeight) / 2 + "px";

          const header = document.createElement("div");
          header.style.background = "#2563eb";
          header.style.color = "#fff";
          header.style.cursor = "move";
          // Adaptation responsive du header - très compact
          if (window.innerWidth <= 768) {
            header.style.padding = "8px 12px 6px 12px";
            header.style.fontSize = "0.95rem";
          } else {
            header.style.padding = "18px 28px 12px 28px";
            header.style.fontSize = "1.15rem";
          }
          header.style.fontWeight = "bold";
          header.style.display = "flex";
          header.style.flexDirection = "column";

          // Fonctionnalité de glisser-déposer pour rendre la popup déplaçable
          let isDragging = false;
          let currentX;
          let currentY;
          let initialX;
          let initialY;
          let xOffset = 0;
          let yOffset = 0;

          // Position initiale centrée
          const rect = box.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          setTimeout(() => {
            const boxRect = box.getBoundingClientRect();
            xOffset = (viewportWidth - boxRect.width) / 2;
            yOffset =
              window.innerWidth <= 768
                ? window.innerWidth <= 480
                  ? window.innerHeight * 0.08
                  : window.innerHeight * 0.06
                : (viewportHeight - boxRect.height) / 2;

            box.style.left = xOffset + "px";
            box.style.top = yOffset + "px";
            box.style.transform = "none";
          }, 10);

          function dragStart(e) {
            if (e.type === "touchstart") {
              initialX = e.touches[0].clientX - xOffset;
              initialY = e.touches[0].clientY - yOffset;
            } else {
              initialX = e.clientX - xOffset;
              initialY = e.clientY - yOffset;
            }

            if (e.target === header || header.contains(e.target)) {
              isDragging = true;
              box.style.cursor = "grabbing";
              header.style.cursor = "grabbing";
            }
          }

          function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            box.style.cursor = "move";
            header.style.cursor = "move";
          }

          function drag(e) {
            if (isDragging) {
              e.preventDefault();

              if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
              } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
              }

              xOffset = currentX;
              yOffset = currentY;

              // Contraintes pour garder la popup dans les limites de l'écran
              const boxRect = box.getBoundingClientRect();
              const minX = 0;
              const minY = 0;
              const maxX = viewportWidth - boxRect.width;
              const maxY = viewportHeight - boxRect.height;

              xOffset = Math.max(minX, Math.min(maxX, xOffset));
              yOffset = Math.max(minY, Math.min(maxY, yOffset));

              box.style.left = xOffset + "px";
              box.style.top = yOffset + "px";
            }
          }

          // Event listeners pour desktop
          header.addEventListener("mousedown", dragStart, false);
          document.addEventListener("mouseup", dragEnd, false);
          document.addEventListener("mousemove", drag, false);

          // Event listeners pour mobile/tablette
          header.addEventListener("touchstart", dragStart, false);
          document.addEventListener("touchend", dragEnd, false);
          document.addEventListener("touchmove", drag, false);
          header.style.borderTopLeftRadius =
            window.innerWidth <= 768 ? "12px" : "16px";
          header.style.borderTopRightRadius =
            window.innerWidth <= 768 ? "12px" : "16px";
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
          // Adaptation responsive du bouton fermer - plus compact
          if (window.innerWidth <= 768) {
            closeBtn.style.fontSize = "1.5rem";
            closeBtn.style.top = "2px";
            closeBtn.style.right = "8px";
          } else {
            closeBtn.style.fontSize = "2.1rem";
            closeBtn.style.top = "10px";
            closeBtn.style.right = "18px";
          }
          closeBtn.style.cursor = "pointer";
          closeBtn.style.position = "absolute";
          closeBtn.setAttribute("aria-label", "Fermer");
          closeBtn.onclick = () => overlay.remove();
          header.appendChild(closeBtn);
          box.appendChild(header);
          const content = document.createElement("div");
          // Adaptation responsive du contenu - optimisé pour layout horizontal
          if (window.innerWidth <= 480) {
            // Mobile - padding compact mais suffisant
            content.style.padding = "6px 8px 10px 8px";
          } else if (window.innerWidth <= 768) {
            // Tablette - padding réduit pour maximiser l'espace horizontal
            content.style.padding = "8px 10px 12px 10px";
          } else {
            content.style.padding = "20px 20px 20px 20px";
          }
          content.style.background = "#f8fafc";
          content.style.flex = "1 1 auto";
          content.style.overflowY = "auto";
          // Assurer que le contenu peut défiler pour voir le bouton
          content.style.minHeight = "0";
          const blNum = document.createElement("div");
          // Adaptation responsive de la taille de police - compact horizontal
          if (window.innerWidth <= 768) {
            blNum.style.fontSize = "0.9em";
            blNum.style.marginBottom = "4px";
          } else {
            blNum.style.fontSize = "1.2em";
            blNum.style.marginBottom = "12px";
          }
          blNum.style.fontWeight = "bold";
          blNum.style.textAlign = "center";
          blNum.innerHTML = `N° BL : <span style='color:#2563eb;'>${blNumber}</span>`;
          content.appendChild(blNum);

          // Ajout du sélecteur de statut pour le BL
          const label = document.createElement("label");
          label.textContent = "Statut du BL :";
          label.style.display = "block";
          label.style.marginBottom = "3px";
          label.style.fontWeight = "500";
          label.style.fontSize = window.innerWidth <= 768 ? "0.8em" : "0.95em";
          content.appendChild(label);

          const select = document.createElement("select");
          select.style.width = "100%";
          // Adaptation responsive des inputs - compact horizontal
          if (window.innerWidth <= 768) {
            select.style.padding = "3px 5px";
            select.style.fontSize = "0.85em";
            select.style.marginBottom = "4px";
          } else {
            select.style.padding = "8px 10px";
            select.style.fontSize = "1em";
            select.style.marginBottom = "12px";
          }
          select.style.border = "1.5px solid #2563eb";
          select.style.borderRadius = "7px";
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

          // --- NOUVEAUX CHAMPS D'ÉCHANGE POUR LE SYSTÈME PHP ---

          // Séparateur visuel
          const separator = document.createElement("div");
          separator.style.borderTop = "1px solid #e5e7eb";
          // Réduction de la marge pour layout horizontal
          if (window.innerWidth <= 768) {
            separator.style.margin = "6px 0 4px 0";
          } else {
            separator.style.margin = "16px 0 12px 0";
          }
          content.appendChild(separator);

          // Titre section
          const sectionTitle = document.createElement("div");
          const titleFontSize = window.innerWidth <= 768 ? "0.85em" : "1.05em";
          sectionTitle.innerHTML = `<h4 style="color:#2563eb;font-weight:600;margin-bottom:4px;font-size:${titleFontSize};">📊 Données d'échange</h4>`;
          content.appendChild(sectionTitle);

          // Container pour layout horizontal optimisé - tablette et mobile
          const fieldsContainer = document.createElement("div");
          if (window.innerWidth <= 768) {
            // Layout horizontal sur tablette et mobile pour optimiser l'espace
            fieldsContainer.style.display = "grid";
            if (window.innerWidth <= 480) {
              // Mobile : 2 colonnes compactes
              fieldsContainer.style.gridTemplateColumns = "1fr 1fr";
              fieldsContainer.style.gap = "4px 8px";
            } else {
              // Tablette : 3 colonnes pour maximiser l'horizontal
              fieldsContainer.style.gridTemplateColumns = "1fr 1fr 1fr";
              fieldsContainer.style.gap = "6px 12px";
            }
            fieldsContainer.style.marginBottom = "8px";
          } else {
            // Desktop : layout classique en 2 colonnes
            fieldsContainer.style.display = "grid";
            fieldsContainer.style.gridTemplateColumns = "1fr 1fr";
            fieldsContainer.style.gap = "12px 16px";
            fieldsContainer.style.marginBottom = "12px";
          }
          content.appendChild(fieldsContainer);

          // 1. Paiement Acconage
          const paiementGroup = document.createElement("div");
          // Toujours prendre une seule cellule pour s'adapter au grid

          const paiementLabel = document.createElement("label");
          paiementLabel.textContent = "Paiement Acconage :";
          paiementLabel.style.display = "block";
          paiementLabel.style.marginBottom = "2px";
          paiementLabel.style.fontWeight = "500";
          paiementLabel.style.fontSize =
            window.innerWidth <= 768 ? "0.78em" : "0.92em";
          paiementGroup.appendChild(paiementLabel);

          const paiementInput = document.createElement("input");
          paiementInput.type = "text";
          paiementInput.id = "paiementAcconage";
          paiementInput.style.width = "100%";
          paiementInput.style.padding =
            window.innerWidth <= 768 ? "2px 4px" : "6px 8px";
          paiementInput.style.border = "1.5px solid #d1d5db";
          paiementInput.style.borderRadius = "4px";
          paiementInput.style.fontSize =
            window.innerWidth <= 768 ? "0.8em" : "0.95em";
          paiementInput.style.marginBottom = "0";
          paiementInput.style.background = "#fff";
          paiementInput.placeholder = "Payé, En attente...";
          paiementInput.value = delivery.paiement_acconage || "";
          paiementGroup.appendChild(paiementInput);
          fieldsContainer.appendChild(paiementGroup);

          // 2. Date d'échange BL
          const dateEchangeBLGroup = document.createElement("div");

          const dateEchangeBLLabel = document.createElement("label");
          dateEchangeBLLabel.textContent = "📅 Date échange BL :";
          dateEchangeBLLabel.style.display = "block";
          dateEchangeBLLabel.style.marginBottom = "2px";
          dateEchangeBLLabel.style.fontWeight = "500";
          dateEchangeBLLabel.style.fontSize =
            window.innerWidth <= 768 ? "0.78em" : "0.92em";
          dateEchangeBLGroup.appendChild(dateEchangeBLLabel);

          const dateEchangeBLInput = document.createElement("input");
          dateEchangeBLInput.type = "date";
          dateEchangeBLInput.id = "dateEchangeBL";
          dateEchangeBLInput.style.width = "100%";
          dateEchangeBLInput.style.padding =
            window.innerWidth <= 768 ? "2px 4px" : "6px 8px";
          dateEchangeBLInput.style.border = "1.5px solid #d1d5db";
          dateEchangeBLInput.style.borderRadius = "4px";
          dateEchangeBLInput.style.fontSize =
            window.innerWidth <= 768 ? "0.8em" : "0.95em";
          dateEchangeBLInput.style.marginBottom = "0";
          dateEchangeBLInput.style.background = "#fff";

          // Récupérer la valeur sauvée temporairement ou depuis la BDD
          const tempKeyBL = `temp_date_echange_bl_${delivery.id}`;
          const tempValueBL = localStorage.getItem(tempKeyBL);
          dateEchangeBLInput.value =
            tempValueBL || delivery.date_echange_bl || "";

          // Sauvegarde automatique lors de la modification
          dateEchangeBLInput.addEventListener("change", function () {
            localStorage.setItem(tempKeyBL, this.value);
            // Synchronisation automatique vers le tableau de suivi
            syncToTableauSuivie(delivery.id, "date_echange_bl", this.value);
          });

          dateEchangeBLGroup.appendChild(dateEchangeBLInput);
          fieldsContainer.appendChild(dateEchangeBLGroup);

          // 3. Date de DO
          const dateDOGroup = document.createElement("div");

          const dateDOLabel = document.createElement("label");
          dateDOLabel.textContent = "📅 Date DO :";
          dateDOLabel.style.display = "block";
          dateDOLabel.style.marginBottom = "2px";
          dateDOLabel.style.fontWeight = "500";
          dateDOLabel.style.fontSize =
            window.innerWidth <= 768 ? "0.78em" : "0.92em";
          dateDOGroup.appendChild(dateDOLabel);

          const dateDOInput = document.createElement("input");
          dateDOInput.type = "date";
          dateDOInput.id = "dateDO";
          dateDOInput.style.width = "100%";
          dateDOInput.style.padding =
            window.innerWidth <= 768 ? "2px 4px" : "6px 8px";
          dateDOInput.style.border = "1.5px solid #d1d5db";
          dateDOInput.style.borderRadius = "4px";
          dateDOInput.style.fontSize =
            window.innerWidth <= 768 ? "0.8em" : "0.95em";
          dateDOInput.style.marginBottom = "0";
          dateDOInput.style.background = "#fff";

          // Récupérer la valeur sauvée temporairement ou depuis la BDD
          const tempKeyDO = `temp_date_do_${delivery.id}`;
          const tempValueDO = localStorage.getItem(tempKeyDO);
          dateDOInput.value = tempValueDO || delivery.date_do || "";

          // Sauvegarde automatique lors de la modification
          dateDOInput.addEventListener("change", function () {
            localStorage.setItem(tempKeyDO, this.value);
            // Synchronisation automatique vers le tableau de suivi
            syncToTableauSuivie(delivery.id, "date_do", this.value);
          });

          dateDOGroup.appendChild(dateDOInput);
          fieldsContainer.appendChild(dateDOGroup);

          // 4. Date de BADT
          const dateBADTGroup = document.createElement("div");

          const dateBADTLabel = document.createElement("label");
          dateBADTLabel.textContent = "📅 Date BADT :";
          dateBADTLabel.style.display = "block";
          dateBADTLabel.style.marginBottom = "2px";
          dateBADTLabel.style.fontWeight = "500";
          dateBADTLabel.style.fontSize =
            window.innerWidth <= 768 ? "0.78em" : "0.92em";
          dateBADTGroup.appendChild(dateBADTLabel);

          const dateBADTInput = document.createElement("input");
          dateBADTInput.type = "date";
          dateBADTInput.id = "dateBADT";
          dateBADTInput.style.width = "100%";
          dateBADTInput.style.padding =
            window.innerWidth <= 768 ? "2px 4px" : "6px 8px";
          dateBADTInput.style.border = "1.5px solid #d1d5db";
          dateBADTInput.style.borderRadius = "4px";
          dateBADTInput.style.fontSize =
            window.innerWidth <= 768 ? "0.8em" : "0.95em";
          dateBADTInput.style.marginBottom = "0";
          dateBADTInput.style.background = "#fff";

          // Récupérer la valeur sauvée temporairement ou depuis la BDD
          const tempKeyBADT = `temp_date_badt_${delivery.id}`;
          const tempValueBADT = localStorage.getItem(tempKeyBADT);
          dateBADTInput.value = tempValueBADT || delivery.date_badt || "";

          // Sauvegarde automatique lors de la modification
          dateBADTInput.addEventListener("change", function () {
            localStorage.setItem(tempKeyBADT, this.value);
            // Synchronisation automatique vers le tableau de suivi
            syncToTableauSuivie(delivery.id, "date_badt", this.value);
          });

          dateBADTGroup.appendChild(dateBADTInput);
          fieldsContainer.appendChild(dateBADTGroup);

          // Espacement avant le bouton - optimisé pour layout horizontal
          const buttonSpacer = document.createElement("div");
          if (window.innerWidth <= 768) {
            buttonSpacer.style.marginTop = "6px";
          } else {
            buttonSpacer.style.marginTop = "12px";
          }
          content.appendChild(buttonSpacer);

          const saveBtn = document.createElement("button");
          saveBtn.textContent = "Enregistrer toutes les données";
          saveBtn.className = "btn btn-primary w-full mt-2";
          saveBtn.style.background =
            "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
          saveBtn.style.color = "#fff";
          saveBtn.style.fontWeight = "bold";
          // Adaptation responsive du bouton - ultra compact pour tablette/mobile
          if (window.innerWidth <= 480) {
            // Mobile - bouton compact
            saveBtn.style.fontSize = "0.85em";
            saveBtn.style.padding = "0.6em 1em";
            saveBtn.style.marginTop = "4px";
          } else if (window.innerWidth <= 768) {
            // Tablette - bouton visible mais compact
            saveBtn.style.fontSize = "0.9em";
            saveBtn.style.padding = "0.65em 1.2em";
            saveBtn.style.marginTop = "6px";
            saveBtn.style.width = "100%";
          } else {
            // Desktop
            saveBtn.style.fontSize = "1em";
            saveBtn.style.padding = "0.7em 1.7em";
            saveBtn.style.marginTop = "0";
          }
          saveBtn.style.border = "none";
          saveBtn.style.borderRadius = "8px";
          saveBtn.style.boxShadow = "0 2px 12px rgba(37,99,235,0.13)";
          // Bouton collant en bas pour assurer la visibilité
          saveBtn.style.position = "sticky";
          saveBtn.style.bottom = "0";
          saveBtn.style.zIndex = "10";
          saveBtn.style.backgroundColor = "#f8fafc"; // Fond pour le sticky
          saveBtn.onclick = async () => {
            let statutToSend =
              select.value === "aucun" ? "aucun" : select.value;
            // Si on veut mettre le statut à 'mise_en_livraison', demander confirmation
            if (statutToSend === "mise_en_livraison") {
              // Popup de confirmation personnalisée
              const confirmOverlay = document.createElement("div");
              confirmOverlay.style.position = "fixed";
              confirmOverlay.style.top = 0;
              confirmOverlay.style.left = 0;
              confirmOverlay.style.width = "100vw";
              confirmOverlay.style.height = "100vh";
              confirmOverlay.style.background = "rgba(30,41,59,0.45)";
              confirmOverlay.style.zIndex = 99999;
              confirmOverlay.style.display = "flex";
              confirmOverlay.style.alignItems = "center";
              confirmOverlay.style.justifyContent = "center";
              const confirmBox = document.createElement("div");
              confirmBox.style.background = "#fff";
              confirmBox.style.borderRadius =
                window.innerWidth <= 768 ? "14px" : "18px";
              confirmBox.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
              // Adaptation responsive de la popup de confirmation
              if (window.innerWidth <= 480) {
                confirmBox.style.maxWidth = "95vw";
                confirmBox.style.width = "95vw";
              } else if (window.innerWidth <= 768) {
                confirmBox.style.maxWidth = "85vw";
                confirmBox.style.width = "85vw";
              } else {
                confirmBox.style.maxWidth = "420px";
                confirmBox.style.width = "96vw";
              }
              confirmBox.style.padding = "0";
              confirmBox.style.position = "relative";
              confirmBox.style.display = "flex";
              confirmBox.style.flexDirection = "column";
              // Header
              const confirmHeader = document.createElement("div");
              confirmHeader.style.background =
                "linear-gradient(90deg,#eab308 0%,#2563eb 100%)";
              confirmHeader.style.color = "#fff";
              // Adaptation responsive du header de confirmation
              if (window.innerWidth <= 768) {
                confirmHeader.style.padding = "16px 20px 10px 20px";
                confirmHeader.style.fontSize = "1.1rem";
              } else {
                confirmHeader.style.padding = "22px 32px 12px 32px";
                confirmHeader.style.fontSize = "1.18rem";
              }
              confirmHeader.style.fontWeight = "bold";
              confirmHeader.style.borderTopLeftRadius =
                window.innerWidth <= 768 ? "14px" : "18px";
              confirmHeader.style.borderTopRightRadius =
                window.innerWidth <= 768 ? "14px" : "18px";
              confirmHeader.innerHTML = `<span style='font-size:1.25em;'>⚠️ Confirmation requise</span>`;
              confirmBox.appendChild(confirmHeader);
              // Message
              const confirmMsgDiv = document.createElement("div");
              confirmMsgDiv.style.padding = "24px 24px 18px 24px";
              confirmMsgDiv.style.background = "#f8fafc";
              confirmMsgDiv.style.fontSize = "1.08em";
              confirmMsgDiv.style.color = "#1e293b";
              confirmMsgDiv.style.textAlign = "center";
              confirmMsgDiv.innerHTML =
                "<b>Vous êtes sur le point de valider la mise en livraison pour ce BL.</b><br><br>Cette opération est <span style='color:#eab308;font-weight:600;'>définitive</span> et ne pourra pas être annulée.<br><br>Voulez-vous vraiment continuer ?";
              confirmBox.appendChild(confirmMsgDiv);
              // Boutons
              const btnsDiv = document.createElement("div");
              btnsDiv.style.display = "flex";
              btnsDiv.style.justifyContent = "center";
              btnsDiv.style.gap = "18px";
              btnsDiv.style.padding = "0 0 22px 0";
              // Bouton Annuler
              const cancelBtn = document.createElement("button");
              cancelBtn.textContent = "Annuler";
              cancelBtn.style.background = "#fff";
              cancelBtn.style.color = "#2563eb";
              cancelBtn.style.fontWeight = "bold";
              cancelBtn.style.fontSize = "1em";
              cancelBtn.style.border = "2px solid #2563eb";
              cancelBtn.style.borderRadius = "8px";
              cancelBtn.style.padding = "0.7em 1.7em";
              cancelBtn.style.cursor = "pointer";
              cancelBtn.onclick = () => confirmOverlay.remove();
              // Bouton Confirmer
              const okBtn = document.createElement("button");
              okBtn.textContent = "Confirmer";
              okBtn.style.background =
                "linear-gradient(90deg,#2563eb 0%,#eab308 100%)";
              okBtn.style.color = "#fff";
              okBtn.style.fontWeight = "bold";
              okBtn.style.fontSize = "1em";
              okBtn.style.border = "none";
              okBtn.style.borderRadius = "8px";
              okBtn.style.padding = "0.7em 1.7em";
              okBtn.style.cursor = "pointer";
              okBtn.onclick = () => {
                confirmOverlay.remove();
                // On continue la procédure
                finishBLStatusChange();
              };
              btnsDiv.appendChild(cancelBtn);
              btnsDiv.appendChild(okBtn);
              confirmBox.appendChild(btnsDiv);
              confirmOverlay.appendChild(confirmBox);
              document.body.appendChild(confirmOverlay);
              confirmOverlay.onclick = (e) => {
                if (e.target === confirmOverlay) confirmOverlay.remove();
              };
              // On stoppe ici, finishBLStatusChange sera appelé si l'utilisateur confirme
              return;
              // Fonction pour continuer la procédure après confirmation
              function finishBLStatusChange() {
                // 1. MAJ locale immédiate du statut BL
                delivery.bl_statuses[blNumber] = statutToSend;
                // 2. MAJ instantanée de la colonne Statut Dossier dans la ligne du tableau
                const tableBody = document.getElementById(
                  "deliveriesTableBody"
                );
                if (tableBody) {
                  for (let row of tableBody.rows) {
                    let dossierCellIdx = AGENT_TABLE_COLUMNS.findIndex(
                      (c) => c.id === "dossier_number"
                    );
                    if (
                      dossierCellIdx !== -1 &&
                      row.cells[dossierCellIdx] &&
                      row.cells[dossierCellIdx].textContent ===
                        String(delivery.dossier_number)
                    ) {
                      let colIdx = AGENT_TABLE_COLUMNS.findIndex(
                        (c) => c.id === "container_status"
                      );
                      if (colIdx !== -1 && row.cells[colIdx]) {
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
                  // Récupération des valeurs des nouveaux champs
                  const paiementAcconage = paiementInput.value.trim();
                  const dateEchangeBL = dateEchangeBLInput.value.trim();
                  const dateDO = dateDOInput.value.trim();
                  const dateBADT = dateBADTInput.value.trim();

                  // 1. Mise à jour du statut BL
                  fetch(`/deliveries/${delivery.id}/bl-status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ blNumber, status: statutToSend }),
                  }).then(async (res) => {
                    if (!res.ok) {
                      let msg =
                        "Erreur lors de la mise à jour du statut du BL.";
                      try {
                        const errData = await res.json();
                        if (errData && errData.error)
                          msg += "\n" + errData.error;
                      } catch {}
                      alert(msg);
                      return;
                    }

                    // 2. Mise à jour des données d'échange si présentes
                    const exchangeData = {};
                    if (paiementAcconage)
                      exchangeData.paiement_acconage = paiementAcconage;
                    if (dateEchangeBL)
                      exchangeData.date_echange_bl = dateEchangeBL;
                    if (dateDO) exchangeData.date_do = dateDO;
                    if (dateBADT) exchangeData.date_badt = dateBADT;

                    if (Object.keys(exchangeData).length > 0) {
                      fetch(`/api/exchange/update/${delivery.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(exchangeData),
                      })
                        .then(() => {
                          // Nettoyer le localStorage temporaire après sauvegarde réussie
                          clearTempDatesFromStorage(delivery.id);
                        })
                        .catch((err) => {
                          console.warn(
                            "Erreur lors de la mise à jour des données d'échange:",
                            err
                          );
                        });
                    } else {
                      // Nettoyer le localStorage même s'il n'y a pas de données d'échange à sauvegarder
                      clearTempDatesFromStorage(delivery.id);
                    }

                    overlay.remove();
                    // Afficher l'alerte verte de confirmation
                    showMiseEnLivraisonSuccessAlert();
                  });
                } catch (err) {
                  alert(
                    "Erreur lors de la mise à jour du statut du BL.\n" +
                      (err && err.message ? err.message : "")
                  );
                }
              }

              // Fonction d'alerte verte de confirmation
              function showMiseEnLivraisonSuccessAlert() {
                // Supprimer toute alerte existante
                const oldAlert = document.getElementById(
                  "mise-en-livraison-success-alert"
                );
                if (oldAlert) oldAlert.remove();
                const alert = document.createElement("div");
                alert.id = "mise-en-livraison-success-alert";
                alert.textContent =
                  "Vous avez mis un dossier en mise en livraison";
                alert.style.position = "fixed";
                alert.style.top = "80px";
                alert.style.left = "50%";
                alert.style.transform = "translateX(-50%)";
                alert.style.background =
                  "linear-gradient(90deg,#22c55e 0%,#16a34a 100%)";
                alert.style.color = "#fff";
                alert.style.fontWeight = "bold";
                alert.style.fontSize = "1.12em";
                alert.style.padding = "18px 38px";
                alert.style.borderRadius = "16px";
                alert.style.boxShadow = "0 6px 32px rgba(34,197,94,0.18)";
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
            }
            // 1. MAJ locale immédiate du statut BL
            delivery.bl_statuses[blNumber] = statutToSend;
            // 2. MAJ instantanée de la colonne Statut Dossier dans la ligne du tableau
            const tableBody = document.getElementById("deliveriesTableBody");
            if (tableBody) {
              for (let row of tableBody.rows) {
                let dossierCellIdx = AGENT_TABLE_COLUMNS.findIndex(
                  (c) => c.id === "dossier_number"
                );
                if (
                  dossierCellIdx !== -1 &&
                  row.cells[dossierCellIdx] &&
                  row.cells[dossierCellIdx].textContent ===
                    String(delivery.dossier_number)
                ) {
                  let colIdx = AGENT_TABLE_COLUMNS.findIndex(
                    (c) => c.id === "container_status"
                  );
                  if (colIdx !== -1 && row.cells[colIdx]) {
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
              // Récupération des valeurs des nouveaux champs
              const paiementAcconage = paiementInput.value.trim();
              const dateEchangeBL = dateEchangeBLInput.value.trim();
              const dateDO = dateDOInput.value.trim();
              const dateBADT = dateBADTInput.value.trim();

              // 1. Mise à jour du statut BL
              const blStatusRes = await fetch(
                `/deliveries/${delivery.id}/bl-status`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ blNumber, status: statutToSend }),
                }
              );

              if (!blStatusRes.ok) {
                let msg = "Erreur lors de la mise à jour du statut du BL.";
                try {
                  const errData = await blStatusRes.json();
                  if (errData && errData.error) msg += "\n" + errData.error;
                } catch {}
                alert(msg);
                return;
              }

              // 2. Mise à jour des données d'échange via la nouvelle API
              const exchangeData = {};
              if (paiementAcconage)
                exchangeData.paiement_acconage = paiementAcconage;
              if (dateEchangeBL) exchangeData.date_echange_bl = dateEchangeBL;
              if (dateDO) exchangeData.date_do = dateDO;
              if (dateBADT) exchangeData.date_badt = dateBADT;

              // Si des données d'échange sont présentes, les envoyer
              if (Object.keys(exchangeData).length > 0) {
                const exchangeRes = await fetch(
                  `/api/exchange/update/${delivery.id}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(exchangeData),
                  }
                );

                if (!exchangeRes.ok) {
                  const errData = await exchangeRes.json();
                  console.warn(
                    "Erreur lors de la mise à jour des données d'échange:",
                    errData.message
                  );
                  // Ne pas arrêter le processus si seules les données d'échange échouent
                }
              }

              overlay.remove();
            } catch (err) {
              alert(
                "Erreur lors de la mise à jour des données.\n" +
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
        // Gestion stricte de la session responsable acconier :
        // On utilise UNIQUEMENT respAcconierUser, jamais user !
        let respAcconierUserRaw = null;
        let respAcconierUser = null;
        // Utilise sessionStorage pour éviter la boucle infinie
        let alreadyRedirected = sessionStorage.getItem(
          "__alreadyRedirectedRespAcconier"
        );
        function isLocalStorageAccessible() {
          try {
            const testKey = "__test_ls__";
            localStorage.setItem(testKey, "1");
            localStorage.removeItem(testKey);
            return true;
          } catch (e) {
            return false;
          }
        }
        if (isLocalStorageAccessible()) {
          respAcconierUserRaw = localStorage.getItem("respAcconierUser");
        }
        // Vérifie si on est déjà sur la page de login pour éviter la boucle (même avec paramètres ou hash)
        const isOnLoginPage = /resp_acconier\.html($|[?#])/i.test(
          window.location.pathname +
            window.location.search +
            window.location.hash
        );
        if (
          (!isLocalStorageAccessible() || !respAcconierUserRaw) &&
          !isOnLoginPage
        ) {
          if (!alreadyRedirected) {
            sessionStorage.setItem("__alreadyRedirectedRespAcconier", "1");
            // Redirige immédiatement, sans setTimeout (évite la boucle sur mobile)
            window.location.replace("resp_acconier.html");
          }
          return;
        }
        try {
          respAcconierUser = JSON.parse(respAcconierUserRaw);
          // Si on arrive à parser l'utilisateur, on supprime le flag pour permettre une reconnexion future
          sessionStorage.removeItem("__alreadyRedirectedRespAcconier");
        } catch (e) {
          if (!alreadyRedirected && !isOnLoginPage) {
            sessionStorage.setItem("__alreadyRedirectedRespAcconier", "1");
            window.location.replace("resp_acconier.html");
          }
          return;
        }
        // ...existing code...
      } else if (col.id === "container_status") {
        // Correction : si le statut acconier est 'en attente de paiement', on affiche toujours 'En attente de paiement'
        if (delivery.delivery_status_acconier === "en attente de paiement") {
          td.innerHTML =
            '<span style="display:inline-flex;align-items:center;gap:6px;color:#b45309;font-weight:600;"><i class="fas fa-clock" style="font-size:1.1em;color:#b45309;"></i> En attente de paiement</span>';
        } else {
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
        }
      } else {
        value = delivery[col.id] !== undefined ? delivery[col.id] : "-";
        // Ajout du tooltip custom si texte tronqué
        if (col.id === "observation") {
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
          // Tooltip custom au survol si texte tronqué
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
                // Positionnement près de la cellule
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
                // Émettre l'événement WebSocket après la sauvegarde réussie
                if (ws && ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: "observation_update",
                      deliveryId: delivery.id,
                      observation: val,
                    })
                  );
                }
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
          td.textContent = value;
          // Tooltip custom au survol si texte tronqué
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
        }
      }
      tr.appendChild(td);
      // Fonction pour afficher le menu déroulant TC (popup) : uniquement infos TC, responsive
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
        box.style.borderRadius = window.innerWidth <= 600 ? "10px" : "16px";
        box.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
        box.style.maxWidth = window.innerWidth <= 600 ? "98vw" : "420px";
        box.style.width = window.innerWidth <= 600 ? "98vw" : "96vw";
        box.style.maxHeight = window.innerWidth <= 600 ? "96vh" : "92vh";
        box.style.overflowY = "auto";
        box.style.padding = "0";
        box.style.position = "relative";
        box.style.display = "flex";
        box.style.flexDirection = "column";
        const header = document.createElement("div");
        header.style.background = "#2563eb";
        header.style.color = "#fff";
        header.style.padding =
          window.innerWidth <= 600
            ? "12px 12px 8px 12px"
            : "18px 28px 12px 28px";
        header.style.fontWeight = "bold";
        header.style.fontSize =
          window.innerWidth <= 600 ? "1.01rem" : "1.15rem";
        header.style.display = "flex";
        header.style.flexDirection = "column";
        header.style.borderTopLeftRadius =
          window.innerWidth <= 600 ? "10px" : "16px";
        header.style.borderTopRightRadius =
          window.innerWidth <= 600 ? "10px" : "16px";
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
        closeBtn.style.fontSize =
          window.innerWidth <= 600 ? "1.5rem" : "2.1rem";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = window.innerWidth <= 600 ? "4px" : "10px";
        closeBtn.style.right = window.innerWidth <= 600 ? "8px" : "18px";
        closeBtn.setAttribute("aria-label", "Fermer");
        closeBtn.onclick = () => overlay.remove();
        header.appendChild(closeBtn);
        box.appendChild(header);
        const content = document.createElement("div");
        content.style.padding =
          window.innerWidth <= 600
            ? "14px 10px 14px 10px"
            : "24px 24px 24px 24px";
        content.style.background = "#f8fafc";
        content.style.flex = "1 1 auto";
        content.style.overflowY = "auto";
        const tcNum = document.createElement("div");
        tcNum.style.fontSize = window.innerWidth <= 600 ? "1.08em" : "1.25em";
        tcNum.style.fontWeight = "bold";
        tcNum.style.marginBottom = window.innerWidth <= 600 ? "10px" : "18px";
        tcNum.style.textAlign = "center";
        tcNum.innerHTML = `Numéro du conteneur : <span style='color:#2563eb;'>${containerNumber}</span>`;
        content.appendChild(tcNum);
        box.appendChild(content);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
        // Scroll popup sur mobile si besoin
        if (window.innerWidth <= 600) {
          box.style.overflowY = "auto";
          content.style.maxHeight = "60vh";
        }
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

// Fonction pour générersgv le tableau Agent Acconier complet
function renderAgentTableFull(deliveries, tableBodyElement) {
  const table = tableBodyElement.closest("table");
  // Filtrer les livraisons à afficher dans le tableau principal :
  // On ne montre que les livraisons où au moins un BL n'est pas en 'mise_en_livraison'
  const deliveriesToShow = deliveries.filter((delivery) => {
    // Affiche TOUS les dossiers dont le statut acconier est 'en attente de paiement'
    if (delivery.delivery_status_acconier === "en attente de paiement") {
      return true;
    }
    // Sinon, on garde l'ancien filtrage BL
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
  // Rafraîchissement du tableau :
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
  // Fin de renderAgentTableFull

  // --- Ajout : écouteur pour restaurer une ligne ramenée au Resp. Acconier ---
  if (typeof window.respAcconierRestoreListener === "undefined") {
    window.respAcconierRestoreListener = true;
    window.addEventListener("restoreToRespAcconier", async function (e) {
      // Recharge toutes les livraisons et met à jour le tableau instantanément
      if (
        typeof loadAllDeliveries === "function" &&
        typeof updateTableForDateRange === "function"
      ) {
        await loadAllDeliveries();
        // Utilise la plage de dates actuelle
        const dateStartInput = document.getElementById(
          "mainTableDateStartFilter"
        );
        const dateEndInput = document.getElementById("mainTableDateEndFilter");
        const dateStart = dateStartInput ? dateStartInput.value : null;
        const dateEnd = dateEndInput ? dateEndInput.value : null;
        updateTableForDateRange(dateStart, dateEnd);
      }
      // Affiche une alerte visuelle pour informer le responsable acconier
      const oldAlert = document.getElementById("restore-dossier-alert");
      if (oldAlert) oldAlert.remove();
      const alert = document.createElement("div");
      alert.id = "restore-dossier-alert";
      alert.textContent =
        "Le responsable de livraison a ramené un dossier dans votre tableau.";
      alert.style.position = "fixed";
      alert.style.top = "80px";
      alert.style.left = "50%";
      alert.style.transform = "translateX(-50%)";
      alert.style.background = "linear-gradient(90deg,#eab308 0%,#2563eb 100%)";
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
    });
    // Synchronisation inter-onglets via localStorage
    window.addEventListener("storage", function (event) {
      if (event.key === "restoreToRespAcconierEvent" && event.newValue) {
        // Recharge et met à jour le tableau instantanément
        if (
          typeof loadAllDeliveries === "function" &&
          typeof updateTableForDateRange === "function"
        ) {
          loadAllDeliveries().then(() => {
            const dateStartInput = document.getElementById(
              "mainTableDateStartFilter"
            );
            const dateEndInput = document.getElementById(
              "mainTableDateEndFilter"
            );
            const dateStart = dateStartInput ? dateStartInput.value : null;
            const dateEnd = dateEndInput ? dateEndInput.value : null;
            updateTableForDateRange(dateStart, dateEnd);
          });
        }
        // Affiche l'alerte visuelle
        const oldAlert = document.getElementById("restore-dossier-alert");
        if (oldAlert) oldAlert.remove();
        const alert = document.createElement("div");
        alert.id = "restore-dossier-alert";
        alert.textContent =
          "Le responsable de livraison a ramené un dossier dans votre tableau.";
        alert.style.position = "fixed";
        alert.style.top = "80px";
        alert.style.left = "50%";
        alert.style.transform = "translateX(-50%)";
        alert.style.background =
          "linear-gradient(90deg,#eab308 0%,#2563eb 100%)";
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
    });
  }

  // --- Correction : Rafraîchir le tableau après mise en livraison d'un BL ---
  // On patch la fonction showBLDetailPopup pour déclencher updateTableForDateRange après modification
  // (On ne touche pas à la déclaration d'origine, on monkey-patch si déjà défini)
  if (typeof window.showBLDetailPopupPatched === "undefined") {
    window.showBLDetailPopupPatched = true;
    const oldRenderAgentTableRows = renderAgentTableRows;
    renderAgentTableRows = function (deliveries, tableBodyElement) {
      oldRenderAgentTableRows(deliveries, tableBodyElement);
      // Patcher tous les boutons "Enregistrer le statut" dans les popups BL pour rafraîchir le tableau après MAJ
      setTimeout(() => {
        document.querySelectorAll("#blDetailPopup button").forEach((btn) => {
          if (btn._patched) return;
          if (
            btn.textContent &&
            btn.textContent.includes("Enregistrer le statut")
          ) {
            btn._patched = true;
            const oldOnClick = btn.onclick;
            btn.onclick = async function (e) {
              if (oldOnClick) await oldOnClick.call(this, e);
              // Après la MAJ, on rafraîchit le tableau (date courante)
              const dateStartInput = document.getElementById(
                "mainTableDateStartFilter"
              );
              const dateEndInput = document.getElementById(
                "mainTableDateEndFilter"
              );
              if (typeof updateTableForDateRange === "function") {
                updateTableForDateRange(
                  dateStartInput ? dateStartInput.value : "",
                  dateEndInput ? dateEndInput.value : ""
                );
              }
            };
          }
        });
      }, 100);
    };
  }
}

// Fonction de synchronisation vers le tableau de suivi
function syncToTableauSuivie(deliveryId, dateField, dateValue) {
  try {
    // Vérifier si on est dans la page de tableau de suivi
    if (typeof window.parent !== "undefined" && window.parent !== window) {
      // Communication avec la fenêtre parent si on est dans un iframe
      window.parent.postMessage(
        {
          type: "updateDateField",
          deliveryId: deliveryId,
          field: dateField,
          value: dateValue,
        },
        "*"
      );
    } else {
      // Si on est dans la même page, chercher le tableau
      const tableBody = document.querySelector("#deliveryTable tbody");
      if (tableBody) {
        const rows = tableBody.querySelectorAll("tr");
        rows.forEach((row) => {
          const idCell = row.querySelector('td[data-field="id"]');
          if (idCell && idCell.textContent.trim() === deliveryId.toString()) {
            // Trouver la colonne correspondante et mettre à jour
            let columnIndex;
            switch (dateField) {
              case "date_echange_bl":
                columnIndex = 32; // Index de la colonne Date d'échange BL
                break;
              case "date_do":
                columnIndex = 33; // Index de la colonne Date de DO
                break;
              case "date_badt":
                columnIndex = 34; // Index de la colonne Date de BADT
                break;
            }

            if (columnIndex !== undefined) {
              const cells = row.querySelectorAll("td");
              if (cells[columnIndex]) {
                // Formater la date au format français pour l'affichage
                const formattedDate = dateValue
                  ? new Date(dateValue).toLocaleDateString("fr-FR")
                  : "";
                cells[columnIndex].textContent = formattedDate;
              }
            }
          }
        });
      }
    }
  } catch (error) {
    console.log("Synchronisation non critique:", error);
  }
}

// Fonction pour nettoyer le localStorage temporaire après sauvegarde réussie
function clearTempDatesFromStorage(deliveryId) {
  try {
    localStorage.removeItem(`temp_date_echange_bl_${deliveryId}`);
    localStorage.removeItem(`temp_date_do_${deliveryId}`);
    localStorage.removeItem(`temp_date_badt_${deliveryId}`);
    console.log(
      `Nettoyage localStorage temporaire pour livraison ${deliveryId}`
    );
  } catch (error) {
    console.log("Erreur lors du nettoyage localStorage:", error);
  }
}

//originale12345678910
