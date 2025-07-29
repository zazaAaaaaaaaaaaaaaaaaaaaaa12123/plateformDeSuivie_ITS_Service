// === Génération dynamique du tableau principal des dossiers en retard ===
// === INJECTION DU STYLE RESPONSIVE POUR LES BOUTONS DU TABLEAU DE SUIVI ===
(function injectResponsiveButtonStyle() {
  if (document.getElementById("responsiveButtonStyle")) return;
  const style = document.createElement("style");
  style.id = "responsiveButtonStyle";
  style.textContent = `
    @media (max-width: 900px) {
      .boutons-container, .tableau-boutons, .table-buttons, .table-btns, .tableauPrincipalRetards .btn-container, .tableauPrincipalRetards .boutons-container {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px !important;
        width: 100% !important;
        margin-bottom: 12px !important;
      }
      .boutons-container button, .tableau-boutons button, .table-buttons button, .table-btns button, .tableauPrincipalRetards .btn-container button, .tableauPrincipalRetards .boutons-container button {
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
        font-size: 1em !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
function renderLateDossiersTable() {
  // Cherche le conteneur du tableau principal (à adapter selon ton HTML)
  const tableContainer = document.getElementById("tableauPrincipalRetards");
  if (!tableContainer) return;
  const lateList =
    window.lateContainers && Array.isArray(window.lateContainers)
      ? window.lateContainers
      : [];
  if (!lateList.length) {
    tableContainer.innerHTML = `<div style='color:#ef4444;text-align:center;font-size:1em;padding:10px 0;'>Aucun dossier en retard</div>`;
    return;
  }
  let html = `<div style='overflow-x:auto;'><table style='width:100%;border-collapse:collapse;font-size:0.98em;margin-top:0;background:none;'>`;
  html += `<thead><tr style='background:#fbeaea;'><th style='padding:6px 10px;'>TC</th><th style='padding:6px 10px;'>Agent</th><th style='padding:6px 10px;'>Date enregistrement</th><th style='padding:6px 10px;'>Date livraison</th><th style='padding:6px 10px;'>Heure livraison</th></tr></thead><tbody>`;
  lateList.forEach((c) => {
    let agent = c.agentName ? c.agentName : "-";
    let dateLiv = c.deliveryDate || "-";
    let heureLiv = "-";
    if (typeof dateLiv === "string" && dateLiv.includes(" ")) {
      const parts = dateLiv.split(" ");
      dateLiv = parts[0];
      heureLiv = parts[1] || "-";
    } else if (
      dateLiv &&
      typeof dateLiv === "object" &&
      dateLiv instanceof Date
    ) {
      dateLiv = dateLiv.toLocaleDateString("fr-FR");
    }
    html += `<tr><td style='padding:6px 10px;'>${
      c.numeroTC
    }</td><td style='padding:6px 10px;'>${agent}</td><td style='padding:6px 10px;'>${
      c.dateEnr || "-"
    }</td><td style='padding:6px 10px;'>${dateLiv}</td><td style='padding:6px 10px;'>${heureLiv}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  tableContainer.innerHTML = html;
}
// === SYSTÈME D'ALERTE AUTOMATIQUE POUR CONTENEURS NON LIVRÉS APRÈS 2 JOURS ===

function checkLateContainers() {
  // === LOG DIAGNOSTIC : Affiche l'état de window.deliveries à chaque appel ===
  console.log(
    "[SYNC DIAG] window.deliveries (avant recalcul lateContainers) :",
    window.deliveries
  );
  // === LOG DIAGNOSTIC SYNCHRO ===
  console.log("[SYNC DIAG][AVANT] window.deliveries :", window.deliveries);
  console.log(
    "[SYNC DIAG][AVANT] lateContainers (avant recalcul) :",
    typeof lateContainers !== "undefined" ? lateContainers : "(non défini)"
  );
  // Si la popup de liste des dossiers en retard est ouverte, on la met à jour dynamiquement
  const lateListModal = document.querySelector(".late-list-modal-popup");
  if (lateListModal) {
    if (!lateContainers || lateContainers.length === 0) {
      // Si plus aucun dossier en retard, fermer la popup automatiquement
      lateListModal.remove();
      console.log(
        "[SYNC DIAG][UI] Popup dossiers en retard fermée automatiquement (plus aucun dossier en retard)"
      );
    } else {
      // On régénère le contenu du tableau à partir des lateContainers à jour
      const tbody = lateListModal.querySelector("tbody");
      if (tbody) {
        tbody.innerHTML = lateContainers
          .map((c, idx) => {
            let agent = c.agentName ? c.agentName : "-";
            let dateLiv = c.deliveryDate || "-";
            let heureLiv = "-";
            if (typeof dateLiv === "string" && dateLiv.includes(" ")) {
              const parts = dateLiv.split(" ");
              dateLiv = parts[0];
              heureLiv = parts[1] || "-";
            } else if (
              dateLiv &&
              typeof dateLiv === "object" &&
              dateLiv instanceof Date
            ) {
              dateLiv = dateLiv.toLocaleDateString("fr-FR");
            }
            return `<tr>
              <td style='padding:7px 10px;'>${c.numeroTC}</td>
              <td style='padding:7px 10px;'>${agent}</td>
              <td style='padding:7px 10px;'>${c.dateEnr || "-"}</td>
              <td style='padding:7px 10px;'>${dateLiv}</td>
              <td style='padding:7px 10px;'>${heureLiv}</td>
              <td style='padding:7px 10px;'><button class='notifier-btn' data-agent='${
                c.agentName || ""
              }' data-email='${c.agentEmail || ""}' data-tc='${
              c.numeroTC
            }'>Notifier</button></td>
              <td style='padding:7px 10px;'><a href='#' class='late-detail-link' data-idx='${idx}' style='color:#2563eb;font-weight:600;text-decoration:underline;cursor:pointer;font-size:0.97em;'>Détail</a></td>
            </tr>`;
          })
          .join("");
        // Ajout du listener sur les boutons Notifier
        tbody.querySelectorAll(".notifier-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const agent = this.getAttribute("data-agent");
            const dossier = this.getAttribute("data-tc");
            fetch("/notify-agent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ agent, dossier }),
            })
              .then((res) => res.json())
              .then((data) => {
                alert(data.message || "Notification envoyée !");
              })
              .catch(() => {
                alert("Erreur lors de l’envoi de la notification.");
              });
          });
        });
      }
    }
  }
  if (!window.deliveries) return;
  const now = new Date();
  lateContainers = [];
  const lateDossiersSet = new Set();
  window.deliveries.forEach((delivery) => {
    if (!delivery.container_statuses || !delivery.container_statuses_fr) return;
    let total = 0;
    let delivered = 0;
    let hasLate = false;
    let oldestUnlivDate = null;
    Object.entries(delivery.container_statuses).forEach(
      ([numeroTC, statut]) => {
        total++;
        const statutFr = delivery.container_statuses_fr[numeroTC] || statut;
        const isDelivered = statutFr.toLowerCase().includes("livr");
        if (isDelivered) {
          delivered++;
        }
        let dateEnr = null;
        if (
          delivery.containers_info &&
          delivery.containers_info[numeroTC] &&
          delivery.containers_info[numeroTC].created_at
        ) {
          dateEnr = new Date(delivery.containers_info[numeroTC].created_at);
        } else if (delivery.created_at) {
          dateEnr = new Date(delivery.created_at);
        }
        if (!dateEnr) return;
        // Si ce conteneur n'est pas livré et dépasse 2 jours (48h), il est en retard
        if (!isDelivered && now - dateEnr > 2 * 24 * 60 * 60 * 1000) {
          // 2 jours (48h)
          hasLate = true;
          if (!oldestUnlivDate || dateEnr < oldestUnlivDate)
            oldestUnlivDate = dateEnr;
          let deliveryDate =
            delivery.delivery_date ||
            (delivery.containers_info &&
              delivery.containers_info[numeroTC] &&
              delivery.containers_info[numeroTC].delivery_date) ||
            "-";
          lateContainers.push({
            numeroTC,
            dossier: delivery.dossier_number || delivery.id || "?",
            dateEnr: dateEnr.toLocaleDateString("fr-FR"),
            statut: statutFr,
            agentName:
              delivery.employee_name ||
              delivery.agent_name ||
              (delivery.agents &&
              Array.isArray(delivery.agents) &&
              delivery.agents.length > 0
                ? delivery.agents.join(", ")
                : null),
            agentEmail: delivery.agent_email || null,
            deliveryDate: deliveryDate,
            clientName: delivery.client_name || delivery.client || "-",
          });
        }
      }
    );
    // Un dossier est en retard si au moins un conteneur est en retard ET qu'il reste au moins un conteneur non livré
    if (hasLate && delivered < total) {
      lateDossiersSet.add(delivery.dossier_number || delivery.id || "?");
    }
  });
  showLateContainersAlert(lateContainers, lateDossiersSet.size);

  // === LOG DIAGNOSTIC SYNCHRO ===
  console.log(
    "[SYNC DIAG][APRES] lateContainers (après recalcul) :",
    lateContainers
  );

  // Met à jour dynamiquement le tableau principal des dossiers en retard
  if (typeof renderLateDossiersTable === "function") renderLateDossiersTable();
}
// Appel initial pour afficher le tableau principal au chargement
window.addEventListener("DOMContentLoaded", function () {
  if (typeof renderLateDossiersTable === "function") renderLateDossiersTable();
});

// Affiche une alerte compacte pour les conteneurs en retard
function showLateContainersAlert(lateContainers, lateDossiersCount) {
  // Supprime toute ancienne alerte
  let oldAlert = document.getElementById("lateContainersAlertBox");
  if (oldAlert) oldAlert.remove();
  if (!lateContainers || lateContainers.length === 0 || !lateDossiersCount)
    return;

  // Affichage compact et pro avec effet toast animé + bouton rafraîchir
  const alertBox = document.createElement("div");
  alertBox.id = "lateContainersAlertBox";
  alertBox.innerHTML = `
    <div style="display:flex;align-items:center;gap:13px;min-width:0;">
      <span style="font-size:1.7em;color:#ef4444;flex-shrink:0;">&#9888;</span>
      <div style="min-width:0;"> 
        <div style="font-weight:700;font-size:1.05em;color:#ef4444;margin-bottom:2px;">Dossier en retard</div>
        <div style="font-size:0.98em;color:#1e293b;line-height:1.5;">${lateDossiersCount} dossier(s) en retard (au moins un conteneur non livré après 2 jours).</div>
        <button id="showLateListBtn" style="margin-top:8px;background:none;border:none;color:#2563eb;font-weight:600;cursor:pointer;font-size:1em;padding:0;text-decoration:underline;">Cliquez pour voir la liste</button>
        <button id="refreshLateAlertBtn" style="margin-top:8px;margin-left:12px;background:#f1f5f9;border:1.5px solid #2563eb;color:#2563eb;font-weight:600;cursor:pointer;font-size:0.97em;padding:4px 14px;border-radius:7px;">Rafraîchir</button>
        <div style="margin-top:5px;color:#64748b;font-size:0.93em;">Merci de vérifier et relancer le suivi documentaire.</div>
      </div>
    </div>  
    <button id="closeLateContainersAlertBtn" style="position:absolute;top:7px;right:10px;background:none;border:none;font-size:1.3em;color:#64748b;cursor:pointer;">&times;</button>
    <style>
      @keyframes late-alert-slidein-right {
        0% { opacity: 0; transform: translate(80vw, 0) scale(0.98); }
        60% { opacity: 1; transform: translate(-10px, 0) scale(1.01); }
        100% { opacity: 1; transform: translate(0, 0) scale(1); }
      }
    </style>
  `;
  alertBox.style.position = "fixed";
  alertBox.style.top = "18px";
  alertBox.style.right = "24px";
  alertBox.style.left = "unset";
  alertBox.style.transform = "none";
  alertBox.style.background = "#fff";
  alertBox.style.border = "2.5px solid #ef4444";
  alertBox.style.borderRadius = "16px";
  alertBox.style.boxShadow =
    "0 8px 32px rgba(239,68,68,0.13), 0 2px 12px 0 rgba(37,99,235,0.09)";
  alertBox.style.padding = "22px 32px 18px 32px";
  alertBox.style.zIndex = 100000;
  alertBox.style.minWidth = "320px";
  alertBox.style.maxWidth = "600px";
  alertBox.style.fontFamily = "'Inter',Segoe UI,sans-serif";
  alertBox.style.fontSize = "1.13em";
  alertBox.style.display = "flex";
  alertBox.style.alignItems = "center";
  alertBox.style.justifyContent = "center";
  alertBox.style.gap = "18px";
  alertBox.style.boxSizing = "border-box";
  alertBox.style.overflowX = "visible";
  alertBox.style.pointerEvents = "auto";
  alertBox.style.overflow = "visible";
  alertBox.style.animation =
    "late-alert-slidein-right 0.55s cubic-bezier(.23,1.12,.32,1)";

  document.body.appendChild(alertBox);
  document.getElementById("closeLateContainersAlertBtn").onclick = () =>
    alertBox.remove();
  // Bouton rafraîchir manuel
  const refreshLateAlertBtn = alertBox.querySelector("#refreshLateAlertBtn");
  if (refreshLateAlertBtn) {
    refreshLateAlertBtn.addEventListener("click", async function () {
      if (typeof window.loadDeliveries === "function") {
        await window.loadDeliveries();
        if (typeof checkLateContainers === "function") checkLateContainers();
      }
    });
  }
  // Affichage de la liste détaillée au clic sur "Cliquez pour voir la liste"
  const showLateListBtn = alertBox.querySelector("#showLateListBtn");
  if (showLateListBtn) {
    showLateListBtn.addEventListener("click", async function () {
      if (typeof window.loadDeliveries === "function") {
        console.log(
          "[SYNC DIAG][POPUP] Rechargement des livraisons avant affichage du popup dossiers en retard..."
        );
        await window.loadDeliveries();
        if (typeof checkLateContainers === "function") checkLateContainers();
        console.log(
          "[SYNC DIAG][POPUP] window.deliveries après rechargement :",
          window.deliveries
        );
      }
      // Création d'une popup modale simple avec scroll horizontal
      const modal = document.createElement("div");
      modal.className = "late-list-modal-popup";
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100vw";
      modal.style.height = "100vh";
      modal.style.background = "rgba(30,41,59,0.18)";
      modal.style.zIndex = 100001;
      modal.style.display = "flex";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(239,68,68,0.13),0 2px 12px 0 rgba(37,99,235,0.09);padding:32px 24px 24px 24px;min-width:340px;max-width:90vw;max-height:90vh;overflow:auto;position:relative;">
          <button id="closeLateListModalBtn" style="position:absolute;top:10px;right:16px;background:none;border:none;font-size:1.5em;color:#64748b;cursor:pointer;">&times;</button>
          <div style="font-weight:700;font-size:1.15em;color:#ef4444;margin-bottom:10px;">Dossier en retard</div>
          <button id="refreshLateListBtn" style="margin-bottom:12px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:7px 18px;font-weight:600;cursor:pointer;font-size:1em;">Rafraîchir la liste</button>
          <div style="overflow-x:auto;max-width:80vw;">
            <table style='border-collapse:collapse;width:100%;min-width:700px;'>
              <thead>
                <tr style='background:#f3f4f6;'>
                  <th style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>TC</th>

                  <th style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Agent</th>
                  <th style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Date enregistrement</th>
                  <th style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Date livraison</th>
                  <th style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Heure livraison</th>
                  <th style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Notifier</th>
                  <th style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Détail</th>
                </tr>
              </thead>
              <tbody id="lateListTableBody">
                ${lateContainers
                  .map((c, idx) => {
                    let agent = c.agentName ? c.agentName : "-";
                    let dateLiv = c.deliveryDate || "-";
                    let heureLiv = "-";
                    if (typeof dateLiv === "string" && dateLiv.includes(" ")) {
                      const parts = dateLiv.split(" ");
                      dateLiv = parts[0];
                      heureLiv = parts[1] || "-";
                    } else if (
                      dateLiv &&
                      typeof dateLiv === "object" &&
                      dateLiv instanceof Date
                    ) {
                      dateLiv = dateLiv.toLocaleDateString("fr-FR");
                    }
                    return `<tr>
                      <td style='padding:7px 10px;'>${c.numeroTC}</td>
                      <td style='padding:7px 10px;'>${agent}</td>
                      <td style='padding:7px 10px;'>${c.dateEnr || "-"}</td>
                      <td style='padding:7px 10px;'>${dateLiv}</td>
                      <td style='padding:7px 10px;'>${heureLiv}</td>
                      <td style='padding:7px 10px;'><a href='#' class='notifier-agent-link' data-agent='${
                        c.agentName || ""
                      }' data-email='${c.agentEmail || ""}' data-tc='${
                      c.numeroTC
                    }' style='color:#eab308;font-weight:700;text-decoration:underline;cursor:pointer;font-size:0.97em;'>Notifier</a></td>
                      <td style='padding:7px 10px;'><a href='#' class='late-detail-link' data-idx='${idx}' style='color:#2563eb;font-weight:600;text-decoration:underline;cursor:pointer;font-size:0.97em;'>Détail</a></td>
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      // Fermeture de la popup
      modal.querySelector("#closeLateListModalBtn").onclick = () =>
        modal.remove();
      // Bouton de rafraîchissement de la liste
      const refreshBtn = modal.querySelector("#refreshLateListBtn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", async function () {
          // Rafraîchit la donnée du tableau principal ET de la popup sans recharger la page
          if (typeof window.loadDeliveries === "function") {
            await window.loadDeliveries();
            checkLateContainers();
            // Si la popup existe encore, on met à jour son contenu (sinon elle sera fermée automatiquement)
            const lateListModal = document.querySelector(
              ".late-list-modal-popup"
            );
            if (lateListModal) {
              const tbody = lateListModal.querySelector("tbody");
              if (tbody) {
                tbody.innerHTML = lateContainers
                  .map((c, idx) => {
                    let agent = c.agentName ? c.agentName : "-";
                    let dateLiv = c.deliveryDate || "-";
                    let heureLiv = "-";
                    if (typeof dateLiv === "string" && dateLiv.includes(" ")) {
                      const parts = dateLiv.split(" ");
                      dateLiv = parts[0];
                      heureLiv = parts[1] || "-";
                    } else if (
                      dateLiv &&
                      typeof dateLiv === "object" &&
                      dateLiv instanceof Date
                    ) {
                      dateLiv = dateLiv.toLocaleDateString("fr-FR");
                    }
                    return `<tr>
                      <td style='padding:7px 10px;'>${c.numeroTC}</td>
                      <td style='padding:7px 10px;'>${agent}</td>
                      <td style='padding:7px 10px;'>${c.dateEnr || "-"}</td>
                      <td style='padding:7px 10px;'>${dateLiv}</td>
                      <td style='padding:7px 10px;'>${heureLiv}</td>
                      <td style='padding:7px 10px;'><a href='#' class='notifier-agent-link' data-agent='${
                        c.agentName || ""
                      }' data-tc='${
                      c.numeroTC
                    }' style='color:#eab308;font-weight:700;text-decoration:underline;cursor:pointer;font-size:0.97em;'>Notifier</a></td>
                      <td style='padding:7px 10px;'><a href='#' class='late-detail-link' data-idx='${idx}' style='color:#2563eb;font-weight:600;text-decoration:underline;cursor:pointer;font-size:0.97em;'>Détail</a></td>
                    </tr>`;
                  })
                  .join("");
              }
            }
            // Met à jour dynamiquement le tableau principal des dossiers en retard
            if (typeof renderLateDossiersTable === "function")
              renderLateDossiersTable();
          } else {
            checkLateContainers();
            if (typeof renderLateDossiersTable === "function")
              renderLateDossiersTable();
          }
        });
      }
      // Listeners Notifier
      modal.querySelectorAll(".notifier-agent-link").forEach((link) => {
        link.addEventListener("click", async function (e) {
          e.preventDefault();
          const agentEmail = link.getAttribute("data-email") || "";
          const agentName = link.getAttribute("data-agent") || "";
          const numeroTC = link.getAttribute("data-tc") || "";
          // Recherche le dossier et l'email de l'agent dans lateContainers
          const idx = Array.from(
            modal.querySelectorAll(".notifier-agent-link")
          ).indexOf(link);
          const c =
            window.lateContainers && window.lateContainers[idx]
              ? window.lateContainers[idx]
              : null;
          if (!c) {
            showCustomAlert(
              "Impossible de retrouver les infos du dossier.",
              "error"
            );
            return;
          }
          const dossierNumber = c.dossier || c.dossier_number || "";
          link.textContent = "Envoi...";
          link.style.pointerEvents = "none";
          try {
            const response = await fetch("/notify-late-dossier", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dossierNumber: dossierNumber,
                agentEmail: agentEmail,
                agentName: agentName,
              }),
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.message || "Erreur lors de l'envoi de l'email."
              );
            }
            showCustomAlert("Rappel envoyé par email à l'agent.", "success");
          } catch (err) {
            showCustomAlert(
              "Erreur lors de l'envoi du rappel : " + err.message,
              "error"
            );
          } finally {
            link.textContent = "Notifier";
            link.style.pointerEvents = "auto";
          }
        });
      });
      // Listeners Détail
      modal.querySelectorAll(".late-detail-link").forEach((link) => {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          const idx = parseInt(link.getAttribute("data-idx"), 10);
          const c = lateContainers[idx];
          let agent = c.agentName ? c.agentName : "-";
          let dossier = c.dossier || "-";
          let client = c.clientName || c.client || "-";
          // Affichage STRICTEMENT la date du suivi (champ deliveryDate), format JJ/MM/AAAA uniquement
          let dateProgrammee = "Non renseignée";
          if (typeof c.deliveryDate === "string" && c.deliveryDate !== "-") {
            const d = c.deliveryDate.trim();
            // Essaye de parser comme ISO (avec ou sans heure/T)
            const parsed = Date.parse(d);
            if (!isNaN(parsed)) {
              const dateObj = new Date(parsed);
              const day = String(dateObj.getDate()).padStart(2, "0");
              const month = String(dateObj.getMonth() + 1).padStart(2, "0");
              const year = dateObj.getFullYear();
              dateProgrammee = `${day}/${month}/${year}`;
            } else if (d.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              // Déjà au format JJ/MM/AAAA
              dateProgrammee = d;
            }
          } else if (c.deliveryDate && c.deliveryDate !== "-") {
            // Si c'est un objet Date ou autre, tentative de formatage
            try {
              const dateObj = new Date(c.deliveryDate);
              if (!isNaN(dateObj.getTime())) {
                const day = String(dateObj.getDate()).padStart(2, "0");
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const year = dateObj.getFullYear();
                dateProgrammee = `${day}/${month}/${year}`;
              }
            } catch {}
          }
          if (
            !dateProgrammee ||
            dateProgrammee === "-" ||
            dateProgrammee === "Invalid Date"
          ) {
            dateProgrammee = "Non renseignée";
          }
          // Supprimer toute ancienne boîte flottante de détail
          let oldDetailBox = document.getElementById("lateDetailFloatingBox");
          if (oldDetailBox) oldDetailBox.remove();

          // Créer la boîte flottante
          const detailBox = document.createElement("div");
          detailBox.id = "lateDetailFloatingBox";
          detailBox.style.position = "fixed";
          detailBox.style.top = "60px";
          detailBox.style.right = "40px";
          detailBox.style.zIndex = 100010;
          detailBox.style.background = "#fff";
          detailBox.style.border = "2.5px solid #ef4444";
          detailBox.style.borderRadius = "16px";
          detailBox.style.boxShadow =
            "0 8px 32px rgba(239,68,68,0.13), 0 2px 12px 0 rgba(37,99,235,0.09)";
          detailBox.style.padding = "28px 36px 22px 32px";
          detailBox.style.minWidth = "320px";
          detailBox.style.maxWidth = "420px";
          detailBox.style.fontFamily = "'Inter',Segoe UI,sans-serif";
          detailBox.style.fontSize = "1.08em";
          detailBox.style.display = "flex";
          detailBox.style.flexDirection = "column";
          detailBox.style.gap = "12px";

          detailBox.innerHTML = `
            <button id=\"closeLateDetailFloatingBoxBtn\" style=\"position:absolute;top:10px;right:16px;background:none;border:none;font-size:1.5em;color:#64748b;cursor:pointer;\">&times;</button>
            <div style=\"display:flex;align-items:center;gap:13px;margin-bottom:8px;\">
              <span style=\"font-size:2em;color:#ef4444;flex-shrink:0;\">&#9888;</span>
              <span style=\"font-size:1.18em;font-weight:700;color:#ef4444;\">Retard de livraison</span>
            </div>
            <div style=\"background:#f3f4f6;border-radius:10px;padding:18px 22px 14px 22px;box-shadow:0 2px 8px rgba(239,68,68,0.07);margin-bottom:2px;\">
              <div style=\"margin-bottom:8px;\"><span style=\"color:#64748b;font-weight:600;\">N° de dossier :</span> <span style=\"color:#1e293b;font-weight:500;\">${dossier}</span></div>
              <div style=\"margin-bottom:8px;\"><span style=\"color:#64748b;font-weight:600;\">Nom du client :</span> <span style=\"color:#1e293b;font-weight:500;\">${client}</span></div>
              <div><span style=\"color:#64748b;font-weight:600;\">Date de livraison programmée non respectée :</span> <span style=\"color:#ef4444;font-weight:700;\">${dateProgrammee}</span></div>
              <div style=\"margin-top:8px;color:#64748b;font-size:0.93em;\"><b>Debug deliveryDate brut :</b> <span style=\"color:#334155;\">${
                typeof c.deliveryDate === "object"
                  ? JSON.stringify(c.deliveryDate)
                  : String(c.deliveryDate)
              }</span></div>
            </div>
            <div style=\"margin-top:10px;color:#64748b;font-size:0.98em;\">Merci de relancer le suivi documentaire pour ce dossier.</div>
          `;
          document.body.appendChild(detailBox);
          // Fermeture de la boîte flottante
          document.getElementById("closeLateDetailFloatingBoxBtn").onclick =
            () => detailBox.remove();
        });
      });
      // Fermer la popup si on clique en dehors du contenu
      modal.addEventListener("click", function (e) {
        if (e.target === modal) modal.remove();
      });
    });
  }
}
function normalizeStatusString(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
// scriptSuivie.js

// === Appel automatique de l'alerte toutes les 10 secondes ===
setInterval(() => {
  checkLateContainers();
  console.log(
    "[ALERTE RETARD] Vérification automatique des conteneurs non livrés (toutes les 20 secondes)"
  );
}, 20000); // 20 000 ms = 20 secondes
// Appel initial au chargement
window.addEventListener("DOMContentLoaded", checkLateContainers);

// --- WebSocket temps réel pour les nouvelles livraisons (ordre de livraison créé) ---
let wsLivraison = null;
function initWebSocketLivraison() {
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  let wsUrl = `${wsProtocol}://${window.WS_BASE_HOST}`;
  try {
    wsLivraison = new WebSocket(wsUrl);
    wsLivraison.onopen = function () {
      console.debug("[WebSocket] Connecté pour livraisons (scriptSuivie)");
    };
    wsLivraison.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_delivery_created") {
          // Affiche le message personnalisé envoyé par le backend (ex: "L'agent X a établi un ordre de livraison.")
          showCustomAlert(
            data.message || "Nouvel ordre de livraison reçu !",
            "success",
            3000
          );
          // Recharge les livraisons instantanément
          if (typeof loadDeliveries === "function") {
            loadDeliveries();
          }
        }
      } catch (e) {
        console.warn("[WebSocket] Message non JSON ou erreur :", event.data);
      }
    };
    wsLivraison.onclose = function () {
      console.warn("[WebSocket] Livraison déconnecté. Reconnexion dans 10s...");
      setTimeout(initWebSocketLivraison, 10000);
    };
    wsLivraison.onerror = function () {
      wsLivraison.close();
    };
  } catch (e) {
    console.error("[WebSocket] Erreur d'init livraison :", e);
  }
}
if (window["WebSocket"]) {
  // Détection automatique de l'URL WebSocket (comme dans scriptTabBord.js)
  if (!window.WS_BASE_HOST) {
    const isLocal = ["localhost", "127.0.0.1"].includes(
      window.location.hostname
    );
    window.WS_BASE_HOST = isLocal ? "localhost:3000" : window.location.host;
  }
  initWebSocketLivraison();
}

(async () => {
  // === Désactivation de l'autocomplétion sur les champs sensibles ===
  window.addEventListener("DOMContentLoaded", function () {
    // Champ de recherche principal
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.setAttribute("autocomplete", "off");
      searchInput.setAttribute("autocorrect", "off");
      searchInput.setAttribute("autocapitalize", "off");
      searchInput.setAttribute("spellcheck", "false");
    }
    // Champ Responsable de livraison (supposé avoir l'id 'deliveryResponsibleInput')
    const deliveryResponsibleInput = document.getElementById(
      "deliveryResponsibleInput"
    );
    if (deliveryResponsibleInput) {
      deliveryResponsibleInput.setAttribute("autocomplete", "off");
      deliveryResponsibleInput.setAttribute("autocorrect", "off");
      deliveryResponsibleInput.setAttribute("autocapitalize", "off");
      deliveryResponsibleInput.setAttribute("spellcheck", "false");

      // Récupère la valeur depuis le backend (GET)
      fetch("/delivery-responsible")
        .then((response) => {
          if (!response.ok)
            throw new Error(
              "Erreur lors de la récupération du responsable de livraison"
            );
          return response.json();
        })
        .then((data) => {
          if (data && data.value) {
            deliveryResponsibleInput.value = data.value;
          }
        })
        .catch((err) => {
          console.error(
            "Erreur lors de la récupération du responsable de livraison:",
            err
          );
        });

      // Sauvegarde à chaque modification (POST)
      deliveryResponsibleInput.addEventListener("input", function () {
        fetch("/delivery-responsible", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: deliveryResponsibleInput.value }),
        })
          .then((response) => {
            if (!response.ok)
              throw new Error(
                "Erreur lors de la sauvegarde du responsable de livraison"
              );
          })
          .catch((err) => {
            console.error(
              "Erreur lors de la sauvegarde du responsable de livraison:",
              err
            );
          });
      });
    }
  });
  // --- SYNCHRONISATION TEMPS RÉEL : WebSocket + Fallback AJAX Polling ---
  // Détection automatique de l'environnement pour l'URL WebSocket
  let wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  let wsHost = window.location.hostname;
  let wsPort = window.location.port || "3000";
  let wsUrl;
  if (wsHost === "localhost" || wsHost === "127.0.0.1") {
    wsUrl = `${wsProtocol}://${wsHost}:3000`;
  } else {
    // Production : onrender.com ou autre domaine
    wsUrl = `${wsProtocol}://plateformdesuivie-its-service.onrender.com`;
  }
  let ws = null;
  let pollingInterval = null;
  let lastDeliveriesCount = null;

  function startPollingDeliveries() {
    if (pollingInterval) return;
    pollingInterval = setInterval(() => {
      loadDeliveries().then(() => {
        if (typeof checkLateContainers === "function") checkLateContainers();
        // Détection d'une nouvelle livraison (optionnel)
        if (Array.isArray(window.deliveries)) {
          if (
            lastDeliveriesCount !== null &&
            window.deliveries.length > lastDeliveriesCount
          ) {
            // Nouvelle livraison détectée
            showCustomAlert(
              "Nouvelle livraison reçue ! (mode fallback)",
              "success",
              2500
            );
          }
          lastDeliveriesCount = window.deliveries.length;
        }
      });
    }, 15000); // 15s
    console.warn("[Polling] Fallback AJAX activé pour la synchro livraisons");
  }
  function stopPollingDeliveries() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }
  function initWebSocketLivraisons() {
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = function () {
        console.debug("[WebSocket] Connecté pour synchro livraisons");
        stopPollingDeliveries();
      };
      ws.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data);
          const typesToRefresh = [
            "delivery_update_alert",
            "container_status_update",
            "delivery_deletion_alert",
            "new_delivery_notification",
          ];
          if (data && data.type && typesToRefresh.includes(data.type)) {
            loadDeliveries().then(() => {
              if (typeof checkLateContainers === "function")
                checkLateContainers();
            });
          }
        } catch (e) {
          console.warn(
            "[WebSocket] Message non JSON ou erreur :",
            event.data,
            e
          );
        }
      };
      ws.onclose = function (event) {
        let reason = "Connexion WebSocket perdue.";
        if (event && typeof event.code !== "undefined") {
          reason += ` (Code: ${event.code}`;
          if (event.reason) reason += `, Motif: ${event.reason}`;
          reason += ")";
        }
        showCustomAlert(
          reason +
            "\nLa synchronisation temps réel est désactivée, passage en mode fallback.",
          "error",
          7000
        );
        console.warn(
          "[WebSocket] Déconnecté. Fallback AJAX activé dans 2s...",
          event
        );
        setTimeout(() => {
          startPollingDeliveries();
          // On retente le WebSocket après 30s
          setTimeout(initWebSocketLivraisons, 30000);
        }, 2000);
      };
      ws.onerror = function (event) {
        showCustomAlert(
          "Erreur WebSocket : " +
            (event && event.message ? event.message : "Erreur inconnue."),
          "error",
          7000
        );
        ws.close();
      };
    } catch (e) {
      console.error("[WebSocket] Erreur d'init :", e);
      showCustomAlert(
        "Erreur d'initialisation WebSocket : " + e.message,
        "error",
        7000
      );
      startPollingDeliveries();
    }
  }
  // Lance d'abord le WebSocket, sinon fallback polling
  if (window["WebSocket"]) {
    initWebSocketLivraisons();
  } else {
    startPollingDeliveries();
  }
  // Inject CSS for pulsating dot animation and new dropdown styles
  // This style block is dynamically added to the document's head.
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      0% {
        transform: scale(0.8);
        opacity: 0.7;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
      }
      100% {
        transform: scale(0.8);
        opacity: 0.7;
      }
    }

    .pulsing-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      background-color: red;
      border-radius: 50%;
      margin-left: 5px; /* Space between text and dot */
      animation: pulse 1.5s infinite ease-in-out;
      vertical-align: middle; /* Align the dot with the text */
    }

    /* Styles pour la combinaison image + date/heure */
    .eir-display-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px; /* Small space between image and date/time */
      font-size: 0.8em; /* Make text slightly smaller */
      color: #555;
    }
    .eir-datetime {
        white-space: nowrap; /* Prevent date/time from wrapping */
    }
    /* Style pour l'indicateur EIR retourné */
    .eir-returned-indicator {
        display: flex;
        align-items: center;
        gap: 4px; /* Space between icon and text */
        font-weight: bold;
        color: #28a745; /* Green color for success */
        font-size: 0.9em;
    }
    .eir-returned-indicator i {
        font-size: 1.1em; /* Slightly larger icon */
    }


    /* Styles for summary items in agent activity box */
    .summary-item {
        margin-bottom: 5px; /* Space between summary lines */
        font-size: 0.9em; /* Slightly smaller font for summary */
    }
    .summary-item strong {
        color: #333;
    }
    .summary-item span {
        color: #666;
    }

    /* Styles for Agent Specific Table (agentDailyDeliveriesTableBody) - Enlarged for readability */
    #agentDailyDeliveriesTableBody {
        font-size: 1em; /* Increased font size for better readability */
    }
    #agentDailyDeliveriesTableBody td {
        padding: 10px 8px; /* Adjusted padding for better spacing */
        word-wrap: break-word; /* Ensures long text breaks to new lines */
        white-space: normal; /* Allow text to wrap naturally */
    }
    #agentDailyDeliveriesTableBody th {
        padding: 12px 8px; /* Adjusted padding for headers */
    }
    /* Ensure table itself can handle content */
    .agent-activity-content table {
        table-layout: auto; /* Allow table to adjust column widths based on content */
        width: 100%; /* Ensure it takes full width of its container */
    }
    /* Add these styles for the "Voir EIR" button */
    .eir-link-button {
        display: inline-block;
        padding: 4px 8px;
        background-color: #4CAF50; /* Green background */
        color: white;
        border-radius: 5px;
        text-decoration: none;
        font-weight: bold;
        font-size: 0.85em; /* Slightly smaller text */
        transition: background-color 0.3s ease;
    }

    .eir-link-button:hover {
        background-color: #45a049; /* Darker green on hover */
    }

    .eir-link-button i {
        margin-right: 5px;
    }

    /* New styles for monthly history */
    .monthly-history-section {
        margin-top: 20px;
        border-top: 1px solid #eee;
        padding-top: 15px;
    }
    .monthly-history-section h4 {
        margin-bottom: 10px;
        color: #333;
    }
    .monthly-history-month {
        margin-bottom: 15px;
        padding: 10px;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .monthly-history-month h5 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #0056b3;
    }
    .daily-summary-item {
        margin-bottom: 5px;
        font-size: 0.85em;
        padding-left: 10px;
    }
    .daily-summary-item strong {
        color: #555;
    }
    .daily-summary-item span {
        color: #777;
    }

    /* Styles for the floating agent activity box */
    #agentActivityBox {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        width: 90%; /* Increased width */
        max-width: 1200px; /* Maximum width on larger screens */
        height: auto; /* Height adapts to content */
        max-height: 95vh; /* Maximum height to fit within the viewport */
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
        display: flex; /* Use flexbox for header and content layout */
        flex-direction: column; /* Stack header, summary, and table vertically */
        overflow-y: auto; /* Enable vertical scrolling for the entire box content if it exceeds max-height */
        padding-bottom: 20px; /* Add some padding at the bottom to prevent content from touching the edge */
    }

    #agentActivityBox.active {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, -50%) scale(1);
    }

    #agentActivityBox.dragging {
        transition: none; /* Disable transition during drag */
    }

    /* Ensure header does not scroll with content */
    .agent-activity-header {
        flex-shrink: 0; /* Prevents header from shrinking */
        padding: 15px 20px; /* Consistent padding for the header */
        border-bottom: 1px solid #eee; /* Separator for the header */
        display: flex; /* Use flexbox for header content */
        align-items: center; /* Vertically center items */
        justify-content: space-between; /* Space out title and buttons */
        flex-wrap: wrap; /* Allow wrapping on smaller screens */
        background-color: #ffc107; /* Changed to yellow */
    }

    .agent-activity-header .header-title {
        font-size: 1.5em; /* Larger title */
        font-weight: bold;
        color: #212529; /* Changed to dark for visibility on yellow background */
        margin-right: auto; /* Push buttons to the right */
    }

    .agent-activity-header .header-buttons {
        display: flex;
        gap: 10px; /* Space between buttons */
        margin-top: 5px; /* Adjust if title wraps */
    }



    /* Bouton Suivie spécifique agent : alignement à droite (fix flexbox) */
    .employee-tracking-btn-wrapper {
        display: flex !important;
        justify-content: flex-end !important;
        align-items: center !important;
        width: 100% !important;
        /* Empêche les media queries ou autres styles de casser l'alignement */
    }
    #employeeTrackingBtn {
        margin-left: auto !important;
        margin-right: 0 !important;
        display: inline-block !important;
        float: none !important;
        position: static !important;
    }

    /* Désactive tout alignement à gauche sur tablette/desktop si media queries présentes */
    @media (max-width: 1200px), (max-width: 992px), (max-width: 768px) {
      .employee-tracking-btn-wrapper {
        display: flex !important;
        justify-content: flex-end !important;
        align-items: center !important;
        width: 100% !important;
      }
      #employeeTrackingBtn {
        margin-left: auto !important;
        margin-right: 0 !important;
        display: inline-block !important;
        float: none !important;
        position: static !important;
      }
    }

    /* Padding for the main content sections within the agent activity box */
    #agentSummarySection,
    .agent-activity-table-wrapper, /* Assuming a wrapper for the table */
    .monthly-history-section {
        padding-left: 20px;
        padding-right: 20px;
    }

    /* Adjust padding for the table body to avoid double padding if the table wrapper also has it */
    #agentDailyDeliveriesTableBody {
        /* This already has padding in its td/th, so direct padding on tbody isn't strictly necessary for spacing cells,
           but adding left/right padding to the container is important. */
    }

    /* New styles for the toggle history button */
    #toggleMonthlyHistoryBtn {
      background-color: #007bff; /* Bootstrap primary blue */
      color: white;
      border: none;
      border-radius: 8px; /* Slightly more rounded */
      padding: 10px 20px;
      font-size: 1em;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Subtle shadow */
    }

    #toggleMonthlyHistoryBtn:hover {
      background-color: #0056b3; /* Darker blue on hover */
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15); /* More pronounced shadow on hover */
      transform: translateY(-2px); /* Slight lift effect */
    }

    #toggleMonthlyHistoryBtn:active {
      background-color: #004085; /* Even darker blue on click */
      box-shadow: 0 2px 4px (0, 0, 0, 0.1);
      transform: translateY(0); /* Return to original position */
    }

    /* Styles for the agent delete button */
    .delete-agent-btn {
      background: none;
      border: none;
      color: #dc3545; /* Red for danger */
      font-size: 1.2em; /* Slightly larger icon */
      cursor: pointer;
      margin-left: 15px; /* Space from title */
      padding: 5px; /* Make it easier to click */
      border-radius: 50%; /* Make it round */
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .delete-agent-btn:hover {
      background-color: rgba(220, 53, 69, 0.1); /* Light red background on hover */
      color: #b02a37; /* Darker red on hover */
    }

    .delete-agent-btn:active {
      background-color: rgba(220, 53, 69, 0.2); /* More intense red on click */
      color: #881c2d;
    }

    /* NEW: Styles for the delete button within the employee list */
    .delete-agent-list-item-btn {
        background: none;
        border: none;
        color: #dc3545; /* Red for danger */
        font-size: 1em; /* Adjust size as needed */
        cursor: pointer;
        margin-left: auto; /* Push to the right */
        padding: 5px;
        border-radius: 50%;
        transition: background-color 0.3s ease, color 0.3s ease;
        display: flex; /* Use flex to center icon */
        align-items: center;
        justify-content: center;
    }

    .delete-agent-list-item-btn:hover {
        background-color: rgba(220, 53, 69, 0.1);
        color: #b02a37;
    }

    /* New styles for inline dropdowns */
    .dropdown-cell-container {
        position: relative; /* The TD is now the positioning context */
        width: 100%; /* The TD itself should take full width */
        text-align: center; /* Center the button within the TD */
        /* IMPORTANT: Removed display: inline-block; as <td> are already table-cell elements */
        overflow: visible; /* Ensure the dropdown menu is not clipped by the cell */
    }

    .dropdown-toggle-button {
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.9em;
        width: 100%; /* Button takes full width of container */
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
        transition: background-color 0.2s ease;
        /* Removed 'color: black;' here to allow dynamic text color from JS */
    }
    .dropdown-toggle-button:hover {
        background-color: #e0e0e0;
    }
    .dropdown-toggle-button i {
        margin-left: 5px;
        font-size: 0.8em; /* Smaller arrow icon */
    }

    .dropdown-content {
        display: none;
        position: absolute;
        background-color: #f9f9f9;
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1001; /* INCREASED z-index to ensure it's on top */
        border-radius: 5px;
        overflow: hidden; /* For rounded corners on options */
        left: 50%; /* Center dropdown relative to parent */
        transform: translateX(-50%); /* Adjust for horizontal centering */
        margin-top: 5px; /* Space below button */
        white-space: nowrap; /* ADDED: Prevent text wrapping in dropdown options */
    }

    .dropdown-content.show {
        display: block;
    }

    .dropdown-content button {
        /* Removed 'color: black;' here to allow dynamic text color from JS */
        padding: 8px 12px;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.9em;
        transition: background-color 0.2s ease;
    }

    .dropdown-content button:hover {
        background-color: #ddd;
    }

    /* Specific colors for dropdown options ONLY */
    /* These are now applied dynamically via JS using text-[color] classes */
    /* .dropdown-content .status-delivered { color: #28a745; } */
    /* .dropdown-content .status-rejected { color: #dc3545; } */
    /* .dropdown-content .status-pending { color: #ffc107; } */

    .dropdown-content .eir-provided { color: #28a745; }
    .dropdown-content .eir-not-provided { color: #dc3545; }

    /* Styles pour la colonne "Statut de livraison (Resp. Aconiés)" */
    .table thead th:nth-child(18),
    .table tbody td:nth-child(18) {
        min-width: 150px;
        width: 200px;
        max-width: 250px;
        white-space: normal;
        word-break: break-word;
    }

    /* NOUVEAU STYLE POUR LA COLONNE "OBSERVATIONS (RESP. ACCONIÉS)" (19ème colonne) */
    .table thead th:nth-child(19),
    .table tbody td:nth-child(19) {
        min-width: 180px; /* Peut être plus large pour les observations */
        width: 250px;
        max-width: 350px;
        white-space: normal;
        word-break: break-word;
    }

    /* Styles pour stabiliser d'autres colonnes importantes si nécessaire (ajuster les nombres d'enfants si l'ordre change) */
    .table thead th:nth-child(2), /* Date & Heure */
    .table tbody td:nth-child(2) {
        min-width: 130px;
    }

    .table thead th:nth-child(4), /* Client (Nom) */
    .table tbody td:nth-child(4) {
        min-width: 120px;
    }

    .table thead th:nth-child(5), /* Client (Tél) */
    .table tbody td:nth-child(5) {
        min-width: 100px;
    }

    .table thead th:nth-child(6), /* Numéro TC(s) */
    .table tbody td:nth-child(6) {
        min-width: 120px;
    }

    .table thead th:nth-child(17), /* Mode de Transport */
    .table tbody td:nth-child(17) {
        min-width: 120px;
    }

    .table thead th:nth-child(25), /* Chauffeur (maintenant 25ème après la nouvelle observation) */
    .table tbody td:nth-child(25) {
        min-width: 120px;
    }

    .table thead th:nth-child(28), /* Date Livraison (maintenant 28ème) */
    .table tbody td:nth-child(28) {
        min-width: 100px;
    }

    .table thead th:nth-child(29), /* Heure Livraison (maintenant 29ème) */
    .table tbody td:nth-child(29) {
        min-width: 90px;
    }

    .table thead th:nth-child(30), /* Statut (maintenant 30ème) */
    .table tbody td:nth-child(30) {
        min-width: 120px;
    }

    /* NOUVEAUX STYLES POUR LES BLOCS DE RÉSUMÉ D'AGENT */
    .summary-block {
        background-color: #f8f9fa; /* Light grey background */
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .summary-block-header {
        font-size: 1.4em; /* Larger font for headers */
        font-weight: bold;
        color: #343a40; /* Darker text */
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #007bff; /* Blue underline */
    }

    .summary-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px dashed #dee2e6; /* Dashed line for items */
    }

    .summary-item:last-child {
        border-bottom: none; /* No border for the last item */
    }

    .summary-item strong {
        color: #495057; /* Slightly darker label */
        flex-basis: 40%; /* Give labels some fixed width */
    }

    .summary-item span {
        color: #6c757d; /* Lighter value text */
        text-align: right;
        flex-basis: 60%; /* Values take remaining width */
    }

    /* Styles spécifiques pour le Grand Total Historique */
    .grand-total-summary {
        background-color: #e6f7ff; /* Light blue background */
        border: 1px solid #b3e0ff;
        border-left: 5px solid #007bff; /* Stronger left border */
        border-radius: 8px;
        padding: 20px;
        margin-top: 30px; /* More space from previous block */
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .grand-total-summary .summary-block-header {
        border-bottom: 2px solid #0056b3; /* Darker blue underline */
        color: #004085; /* Even darker blue text */
    }

    /* Styles pour le tableau de suivi spécifique des agents */
    #agentDailyDeliveriesTable {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden; /* Ensures rounded corners apply to content */
    }

    #agentDailyDeliveriesTable thead th {
        background-color: #007bff; /* Blue header */
        color: white;
        padding: 12px 15px;
        text-align: left;
        border-bottom: 2px solid #0056b3;
        font-weight: bold;
        font-size: 0.95em;
    }

    #agentDailyDeliveriesTable tbody td {
        padding: 10px 15px;
        border-bottom: 1px solid #e9ecef;
        vertical-align: top; /* Align content to top */
        font-size: 0.9em;
    }

    #agentDailyDeliveriesTable tbody tr:nth-child(even) {
        background-color: #f2f2f2; /* Striped rows */
    }

    #agentDailyDeliveriesTable tbody tr:hover {
        background-color: #e0f2ff; /* Light blue hover effect */
        cursor: pointer;
    }

    #agentDailyDeliveriesTable tbody tr:last-child td {
        border-bottom: none; /* No border on last row */
    }
    /* Style for individual delete button in agent table */
    .delete-individual-delivery-btn {
        background-color: #dc3545; /* Red */
        color: white;
        border: none;
        border-radius: 5px;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 0.85em;
        transition: background-color 0.2s ease;
    }
    .delete-individual-delivery-btn:hover {
        background-color: #c82333; /* Darker red */
    }

    /* Styles for the confirmation modal */
    #confirmationModalOverlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7); /* Darker, more prominent overlay */
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999; /* Very high z-index */
        opacity: 0;
        visibility: hidden;
        transform: translateY(-20px); /* Slight animation effect */
        transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
    }

    #confirmationModalOverlay.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }

    #confirmationModalOverlay .modal-content-box {
        background-color: #ffffff;
        padding: 30px; /* More padding */
        border-radius: 12px; /* More rounded corners */
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4); /* Stronger shadow */
        max-width: 450px; /* Slightly wider */
        width: 90%;
        text-align: center;
        transform: translateY(-20px); /* Slight animation effect */
        transition: transform 0.3s ease;
    }

    #confirmationModalOverlay.show .modal-content-box {
        transform: translateY(0);
    }

    #confirmationModalOverlay h4 {
        font-size: 1.8em; /* Larger title */
        color: #333;
        margin-bottom: 15px;
    }

    #confirmationModalOverlay p {
        font-size: 1.1em; /* Larger message text */
        color: #555;
        margin-bottom: 25px;
        line-height: 1.5;
    }

    #confirmationModalOverlay .confirm-buttons {
        display: flex;
        justify-content: center; /* CORRECTION ICI: Changé de 'justify-content.center;' à 'justify-content: center;' */
        gap: 15px; /* More space between buttons */
    }

    #confirmationModalOverlay .confirm-buttons button {
        padding: 10px 25px; /* Larger buttons */
        border-radius: 8px; /* More rounded buttons */
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    #confirmationModalOverlay #confirmActionBtn {
        background-color: #dc3545; /* Red for danger */
        color: white;
        border: none;
    }

    #confirmationModalOverlay #confirmActionBtn:hover {
        background-color: #c82333;
        transform: translateY(-2px);
    }

    #confirmationModalOverlay #cancelConfirmBtn {
        background-color: #6c757d; /* Gray for cancel */
        color: white;
        border: none;
    }

    #confirmationModalOverlay #cancelConfirmBtn:hover {
        background-color: #5a6268;
        transform: translateY(-2px);
    }

    /* NEW: Styles for the daily agent deliveries delete button */
    .delete-daily-agent-deliveries-btn {
        background-color: #ef4444; /* Tailwind red-500 */
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .delete-daily-agent-deliveries-btn:hover {
        background-color: #dc2626; /* Tailwind red-600 */
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .delete-daily-agent-deliveries-btn:active {
        background-color: #b91c1c; /* Tailwind red-700 */
        transform: translateY(0);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Custom Alert Styles */
    .custom-alert {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 15px 25px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-20px);
        transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
        z-index: 2000; /* Ensure it's above other elements like modals */
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        max-width: 350px;
    }

    .custom-alert.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }

    .custom-alert-content {
        display: flex;
        flex-direction: column;
    }

    .custom-alert h4 {
        font-size: 1.1em;
        font-weight: bold;
        margin-bottom: 5px;
        color: #333; /* Default text color, overridden by type-specific rules */
    }

    .custom-alert p {
        font-size: 0.95em;
        color: #555; /* Default text color, overridden by type-specific rules */
        margin: 0;
    }

    /* Specific styles for alert types */
    .custom-alert.success {
        border-left: 5px solid #28a745;
        background-color: #28a745; /* Green background for success alert */
        color: white; /* White text for success alert */
    }
    .custom-alert.success h4,
    .custom-alert.success p {
        color: white !important; /* Ensure text inside success alert is white, using !important for strong override */
    }
    .custom-alert.error {
        border-left: 5px solid #dc3545;
        background-color: #dc3545; /* Red background for error alert */
        color: white;
    }
    .custom-alert.error h4,
    .custom-alert.error p {
        color: white !important;
    }
    .custom-alert.info {
        border-left: 5px solid #007bff;
        background-color: #007bff; /* Blue background for info alert */
        color: white;
    }
    .custom-alert.info h4,
    .custom-alert.info p {
        color: white !important;
    }
    .custom-alert.warning {
        border-left: 5px solid #ffc107;
        background-color: #ffc107; /* Yellow background for warning alert */
        color: #333; /* Dark text for warning to contrast with yellow */
    }
    .custom-alert.warning h4,
    .custom-alert.warning p {
        color: #333 !important;
    }
        
  `;
  document.head.appendChild(style);

  // Load jsPDF and html2canvas libraries
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Wait for both libraries to load
  await Promise.all([
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    ),
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
    ),
  ]);

  // Global variables (now local to this IIFE - Immediately Invoked Function Expression)
  let deliveries = []; // Stores all loaded deliveries
  let allDeliveries = []; // Stores all raw deliveries fetched from backend (used for history/agent views)
  let currentPendingDeliveries = []; // Deliveries for today with 'pending_acconier' status
  let recentHistoricalDeliveries = []; // Processed/rejected deliveries within the last 3 days
  let archivedDeliveries = []; // All deliveries older than 3 days
  let selectedDeliveryId = null; // ID of the delivery currently displayed in the main dashboard

  // Tracks what kind of content the modal is currently displaying: 'recent', 'archives', or 'agent_view'
  let activeModalContentSource = "recent"; // 'recent', 'archives' or 'agent_view'
  // Stores the name of the agent currently being filtered in the modal, null otherwise.
  let activeAgentFilterName = null;

  let socket; // WebSocket connection

  // Define ALL possible backend statuses with their display info for GLOBAL DISPLAY
  const GLOBAL_DISPLAY_STATUS_INFO = {
    mise_en_livraison_acconier: {
      text: "Mise en livraison",
      icon: "fa-hourglass-half",
      tailwindColorClass: "text-yellow-500",
      hexColor: "#f59e0b",
    },
    // Ajout mapping texte direct pour compatibilité (évite warning si jamais le texte est utilisé comme clé)

    mise_en_livraison_acconier: {
      text: "Mise en livraison",
      icon: "fa-hourglass-half",
      tailwindColorClass: "text-yellow-500",
      hexColor: "#f59e0b",
    },
    in_progress_payment_acconier: {
      text: "En cours de paiement",
      icon: "fa-credit-card",
      tailwindColorClass: "text-blue-500",
      hexColor: "#007bff",
    },
    payment_done_acconier: {
      text: "Paiement effectué",
      icon: "fa-check-circle",
      tailwindColorClass: "text-green-500",
      hexColor: "#22c55e",
    },
    awaiting_payment_acconier: {
      text: "",
      icon: "",
      tailwindColorClass: "",
      hexColor: "",
    },
    // L'ancien statut "Mise en livraison (ancienne)" n'est plus utilisé, mais on garde le mapping pour l'historique
    "Mise en livraison (ancienne)": {
      text: "Attente paiement",
      icon: "fa-clock",
      tailwindColorClass: "text-gray-500",
      hexColor: "#6b7280",
    },
    in_progress_acconier: {
      text: "En cours de livraison",
      icon: "fa-truck-moving",
      tailwindColorClass: "text-blue-500",
      hexColor: "#3b82f6",
    },
    processed_acconier: {
      text: "Traité Acconier",
      icon: "fa-check-circle",
      tailwindColorClass: "text-green-500",
      hexColor: "#22c55e",
    },
    rejected_acconier: {
      text: "Rejeté Acconier",
      icon: "fa-times-circle",
      tailwindColorClass: "text-red-500",
      hexColor: "#ef4444",
    },
    awaiting_delivery_acconier: {
      text: "En attente de livraison",
      icon: "fa-clock",
      tailwindColorClass: "text-gray-500",
      hexColor: "#6b7280",
    },
    // Statuts acconier manquants pour éviter les warnings et assurer l'affichage correct

    // General statuses
    delivered: {
      text: "Livré",
      icon: "fa-check-circle",
      tailwindColorClass: "text-green-500",
      hexColor: "#22c55e",
    },
    livre: {
      text: "Livré",
      icon: "fa-check-circle",
      tailwindColorClass: "text-green-500",
      hexColor: "#22c55e",
    },
    rejected: {
      text: "Rejeté",
      icon: "fa-times-circle",
      tailwindColorClass: "text-red-500",
      hexColor: "#ef4444",
    },
    rejet: {
      text: "Rejeté",
      icon: "fa-times-circle",
      tailwindColorClass: "text-red-500",
      hexColor: "#ef4444",
    },
    rejected_by_employee: {
      text: "Rejeté",
      icon: "fa-times-circle",
      tailwindColorClass: "text-red-500",
      hexColor: "#ef4444",
    },
    pending: {
      text: "En attente",
      icon: "fa-hourglass-half",
      tailwindColorClass: "text-yellow-500", // Changed to yellow/orange
      hexColor: "#f59e0b", // Changed to yellow/orange
    },
    in_progress: {
      text: "En cours",
      icon: "fa-truck-moving",
      tailwindColorClass: "text-blue-500", // Changed to blue
      hexColor: "#3b82f6", // Changed to blue
    },
  };

  // Define ONLY selectable options for the dropdown in the delivery card (if applicable)
  // This list is specific to what the user can *set* as a status.
  const ACCONIER_STATUS_OPTIONS_SELECTABLE = [
    {
      value: "in_progress_acconier",
      text: "En cours de livraison",
      icon: "fa-truck-moving",
      tailwindColorClass: "text-blue-500",
      hexColor: "#3b82f6",
    },
    {
      value: "processed_acconier",
      text: "Traité Acconier",
      icon: "fa-check-circle",
      tailwindColorClass: "text-green-500",
      hexColor: "#22c55e",
    },
    {
      value: "rejected_acconier",
      text: "Rejeté Acconier",
      icon: "fa-times-circle",
      tailwindColorClass: "text-red-500",
      hexColor: "#ef4444",
    },
    {
      value: "awaiting_delivery_acconier",
      text: "En attente de livraison",
      icon: "fa-clock",
      tailwindColorClass: "text-gray-500",
      hexColor: "#6b7280",
    },
  ];

  // Define ONLY selectable options for the main table's status filter dropdown
  const GLOBAL_STATUS_OPTIONS = [
    /* {
      value: "pending_acconier",
      text: "En attente de paiement",
      apiValue: "pending_acconier",
      icon: "fa-clock",
      tailwindColorClass: "text-gray-500",
      hexColor: "#6b7280",
    },*/
    {
      value: "livre",
      text: "Livré",
      apiValue: "delivered",
      icon: "fa-check-circle",
      tailwindColorClass: "text-green-500",
      hexColor: "#22c55e",
    },
    {
      value: "rejet",
      text: "Rejeté",
      apiValue: "rejected",
      icon: "fa-times-circle",
      tailwindColorClass: "text-red-500",
      hexColor: "#ef4444",
    },
    {
      value: "pending",
      text: "En attente",
      apiValue: "pending",
      icon: "fa-hourglass-half",
      tailwindColorClass: "text-yellow-500", // Changed to yellow/orange
      hexColor: "#f59e0b", // Changed to yellow/orange
    },
    {
      value: "in_progress",
      text: "En cours",
      apiValue: "in_progress",
      icon: "fa-truck-moving",
      tailwindColorClass: "text-blue-500", // Changed to blue
      hexColor: "#3b82f6", // Changed to blue
    },
  ];

  // Define fields that are always inline editable, regardless of global editing mode
  // Removed "status" from here as it's handled by its own dropdown logic
  const ALWAYS_INLINE_EDITABLE_FIELDS = [
    "transporter",
    "driver_name",
    "truck_registration",
    "driver_phone",
    "delivery_date",
    "delivery_time",
    "nom_agent_visiteur",
    "inspecteur",
    "agent_en_douanes",
    "delivery_notes",
  ];

  // DOM variables for the main table
  const deliveriesTable = document.getElementById("deliveriesTable"); // Get the full table element
  const deliveriesTableBody = document.getElementById("deliveriesTableBody");
  const generatePdfBtn = document.getElementById("generatePdfBtn"); // Global PDF button
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  // Removed loadingSpinner variable as it's no longer needed
  // let loadingSpinner = searchButton ? searchButton.querySelector(".loading-spinner") : null;

  // FIX: Declare loadingOverlay here
  const loadingOverlay = document.getElementById("loadingOverlay");

  // --- Correction alignement bouton Suivi spécifique Agent ---
  window.addEventListener("DOMContentLoaded", function () {
    var wrapper = document.querySelector(".employee-tracking-btn-wrapper");
    var btn = document.getElementById("employeeTrackingBtn");
    if (wrapper) {
      wrapper.style.display = "flex";
      wrapper.style.justifyContent = "flex-end";
      wrapper.style.alignItems = "center";
      wrapper.style.width = "100%";
    }
    if (btn) {
      btn.style.marginLeft = "auto";
      btn.style.marginRight = "0";
      btn.style.display = "inline-block";
      btn.style.float = "none";
      btn.style.position = "static";
    }
  });

  // DOM element for the status filter

  const statusFilterSelect = document.getElementById("statusFilterSelect");
  const mainTableDateFilter = document.getElementById("mainTableDateFilter");

  const agentStatusIndicator = document.getElementById("agentStatusIndicator");
  const agentStatusText = document.getElementById("agentStatusText");
  // --- DOM elements for editing and the secret code POPUP ---
  const activateEditBtn = document.getElementById("activateEditBtn");
  const codeEntryPopup = document.getElementById("codeEntryPopup");
  const closePopupBtnCode = codeEntryPopup
    ? codeEntryPopup.querySelector(".close-btn")
    : null;
  const editCodeInput = document.getElementById("editCodeInput");
  const submitCodeBtn = document.getElementById("submitCodeBtn");
  const codeError = document.getElementById("codeError");

  // Secret code for editing (VERY IMPORTANT: TO CHANGE for a real security system in production!)
  const EDIT_SECRET_CODE = "1234";
  let isEditingMode = false;

  // Refresh interval duration (in milliseconds)
  const REFRESH_INTERVAL = 24000;

  // --- Variables for the NEW employee popup ---
  const employeePopup = document.getElementById("employeePopup");
  const employeeTrackingBtn = document.getElementById("employeeTrackingBtn");
  const closeEmployeePopupBtn = employeePopup
    ? employeePopup.querySelector(".close-popup-btn")
    : null;
  const employeeList = document.getElementById("employeeList");
  const employeeSearchInput = document.getElementById("employeeSearchInput");

  let uniqueEmployees = [];
  let filteredEmployees = [];

  // --- NEW DOM elements for the floating agent activity BOX ---
  const agentActivityBox = document.getElementById("agentActivityBox");
  const agentActivityHeaderTitle = document.getElementById(
    "agentActivityHeaderTitle"
  );
  const closeAgentActivityBoxBtn = document.getElementById(
    "closeAgentActivityBoxBtn"
  );
  // Corrected: Reference to the full table by its new ID
  const agentDailyDeliveriesTable = document.getElementById(
    "agentDailyDeliveriesTable"
  );
  const agentDailyDeliveriesTableBody = document.getElementById(
    "agentDailyDeliveriesTableBody"
  );
  const agentSummarySection = document.getElementById("agentSummarySection");
  const evaluateAgentBtn = document.getElementById("evaluateAgentBtn");
  const generateAgentPdfBtn = document.getElementById("generateAgentPdfBtn");

  // NEW: Date navigation buttons for agent activity
  const prevDayBtn = document.getElementById("prevDayBtn");
  const nextDayBtn = document.getElementById("nextDayBtn");
  // NEW VARIABLES: To manage the displayed date and selected agent
  let currentAgentActivityDate = new Date();
  let selectedAgentName = null;

  // Variables for selection and deletion (MOVED TO GLOBAL SCOPE)
  let selectionMode = false;
  const toggleSelectionBtn = document.getElementById("toggleSelectionBtn");
  const deleteSelectedDeliveriesBtn = document.getElementById(
    "deleteSelectedDeliveriesBtn"
  );
  const thNumero = document.getElementById("thNumero");
  const checkboxHeaderPlaceholder = document.getElementById(
    "checkboxHeaderPlaceholder"
  );

  // Elements for the custom alert
  const customAlert = document.createElement("div");
  customAlert.id = "customAlert";
  customAlert.className = "custom-alert";
  customAlert.innerHTML = `
    <div class="custom-alert-content">
      <h4 id="customAlertTitle"></h4>
      <p id="customAlertMessage"></p>
    </div>
  `;
  document.body.appendChild(customAlert);

  console.log("Initializing admin dashboard...");

  let currentMainFilterDate = (() => {
    const storedDate = localStorage.getItem("mainTableFilterDate");
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of today in local time

    if (storedDate) {
      const storedDateObj = new Date(storedDate);
      storedDateObj.setHours(0, 0, 0, 0); // Normalize stored date to start of day in local time

      if (storedDateObj.getTime() === today.getTime()) {
        console.log("Using stored date (today):", storedDate);
        return storedDateObj;
      } else {
        console.log(
          "Stored date outdated, updating to today:",
          today.toISOString().split("T")[0]
        );
      }
    } else {
      console.log(
        "No date stored, initializing to today:",
        today.toISOString().split("T")[0]
      );
    }
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const formattedToday = `${year}-${month}-${day}`;
    localStorage.setItem("mainTableFilterDate", formattedToday);
    return today;
  })();

  // DOM elements for the history sidebar (modal)
  const historySidebar = document.getElementById("historySidebar");
  const historyOverlay = document.getElementById("historyOverlay");
  const historyModalTitle = document.getElementById("historyModalTitle");
  const historySearchInput = document.createElement("input"); // This needs to be created and appended
  const newRequestsSummaryBar = document.getElementById(
    "newRequestsSummaryBar"
  );
  const newRequestsCount = document.getElementById("newRequestsCount");
  const noNewRequestsMessage = document.getElementById("noNewRequestsMessage");
  const singleDeliveryView = document.getElementById("singleDeliveryView");
  const expandedHistoryView = document.getElementById("expandedHistoryView");
  const newRequestsSection = document.getElementById("newRequestsSection");
  const historyContent = document.getElementById("historyContent"); // Added for history card selection
  const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
  const toggleArchivesBtn = document.getElementById("toggleArchivesBtn");
  const closeHistoryBtn = document.getElementById("closeHistoryBtn");
  const noHistoryMessage = document.getElementById("noHistoryMessage"); // Added to ensure it's defined

  // =====================================================================
  // --- Fonctions utilitaires (déclarées en premier pour accessibilité) ---
  // =====================================================================

  function showCustomAlert(messageText, type = "info", duration = 5000) {
    console.log(`showCustomAlert called: "${messageText}" (Type: ${type})`);
    const titleMap = {
      success: "Succès !",
      error: "Erreur !",
      info: "Information :",
      warning: "Attention :",
    };
    const titleElement = customAlert.querySelector("#customAlertTitle"); // Use customAlert directly
    const messageElement = customAlert.querySelector("#customAlertMessage"); // Use customAlert directly

    if (customAlert && titleElement && messageElement) {
      // Clear previous types and ensure default text colors are reset before applying new ones
      customAlert.classList.remove("success", "error", "info", "warning");
      titleElement.style.color = ""; // Reset inline style
      messageElement.style.color = ""; // Reset inline style

      titleElement.textContent = titleMap[type] || titleMap.info;
      messageElement.textContent = messageText;

      // Add the new type class to apply specific background and text colors
      customAlert.classList.add("show", type);

      setTimeout(() => {
        console.log("Hiding custom alert.");
        customAlert.classList.remove("show"); // Remove 'show' after duration
      }, duration);
    } else {
      console.error(
        "Alert elements not found or customAlert is null. Cannot display custom alert."
      );
      // Fallback to native alert if DOM elements are missing, though this should not happen.
      // alert(`${titleMap[type] || titleMap.info}: ${messageText}`);
    }
  }

  function normalizeDateToMidnight(date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }
  /**
   * Gets French status text and icon/color classes for a given status.
   * @param {string} status - The status string (e.g., 'delivered', 'pending_acconier').
   * @returns {{text: string, iconClass: string, tailwindColorClass: string, hexColor: string, badgeClass: string}}
   */
  function getStatusInfo(status) {
    if (!status || typeof status !== "string" || !status.trim()) {
      return {
        text: "-",
        iconClass: "",
        tailwindColorClass: "text-gray-400",
        hexColor: "#d1d5db",
        badgeClass: "empty",
      };
    }
    const trimmedStatus = status.trim();
    // Normalisation accent-insensible et insensible à la casse
    const normalizedStatus = normalizeStatusString(trimmedStatus);
    // Recherche dans GLOBAL_DISPLAY_STATUS_INFO (clé exacte ou normalisée)
    let info = GLOBAL_DISPLAY_STATUS_INFO[trimmedStatus];
    if (!info) info = GLOBAL_DISPLAY_STATUS_INFO[normalizedStatus];
    // Correction : si le statut est une version "text" (ex: "Rejeté", "En attente", "En cours")
    // on tente de remapper vers la clé technique correspondante
    if (!info) {
      switch (normalizedStatus) {
        case "rejete":
        case "rejetee":
        case "rejeté":
        case "rejetée":
        case "rejet":
          info =
            GLOBAL_DISPLAY_STATUS_INFO["rejet"] ||
            GLOBAL_DISPLAY_STATUS_INFO["rejected"];
          break;
        case "en attente":
        case "enattente":
          info = GLOBAL_DISPLAY_STATUS_INFO["pending"];
          break;
        case "en cours":
        case "encours":
          info = GLOBAL_DISPLAY_STATUS_INFO["in_progress"];
          break;
      }
    }
    if (info) {
      return {
        text: info.text,
        iconClass: info.icon,
        tailwindColorClass: info.tailwindColorClass,
        hexColor: info.hexColor,
        badgeClass: normalizedStatus,
      };
    }
    // Si on arrive ici, le statut n'est pas mappé explicitement : log d'avertissement
    if (window && window.console) {
      console.warn("[STATUS MAPPING] Statut inconnu non mappé :", status);
    }
    // Fallback sur les statuts génériques (switch)
    let text = "-";
    let iconClass = "";
    let tailwindColorClass = "text-gray-400";
    let hexColor = "#d1d5db";
    let badgeClass = "empty";
    switch (normalizedStatus) {
      case "delivered":
      case "livre":
        text = "Livré";
        iconClass = "fa-check-circle";
        tailwindColorClass = "text-green-500";
        hexColor = "#22c55e";
        badgeClass = "delivered";
        break;
      case "rejected":
      case "rejet":
      case "rejected_by_employee":
        text = "Rejeté";
        iconClass = "fa-times-circle";
        tailwindColorClass = "text-red-500";
        hexColor = "#ef4444";
        badgeClass = "rejected";
        break;
      case "pending":
        text = "En attente";
        iconClass = "fa-hourglass-half";
        tailwindColorClass = "text-yellow-500";
        hexColor = "#f59e0b";
        badgeClass = "pending";
        break;
      case "in_progress":
        text = "En cours";
        iconClass = "fa-truck-moving";
        tailwindColorClass = "text-blue-500";
        hexColor = "#3b82f6";
        badgeClass = "in_progress";
        break;
      case "inconnu":
      case "unknown":
        text = "-";
        iconClass = "";
        tailwindColorClass = "text-gray-400";
        hexColor = "#d1d5db";
        badgeClass = "empty";
        break;
      default:
        // Correction : si le statut est une chaîne non vide, on l'affiche tel quel (proprement formaté)
        if (
          trimmedStatus &&
          trimmedStatus !== "-" &&
          trimmedStatus.length > 1
        ) {
          text =
            trimmedStatus.charAt(0).toUpperCase() +
            trimmedStatus.slice(1).toLowerCase();
        }
        // Fallback robuste : icône question grise
        iconClass = "fa-question-circle";
        tailwindColorClass = "text-gray-400";
        hexColor = "#d1d5db";
        badgeClass = "empty";
        break;
    }
    return { text, iconClass, tailwindColorClass, hexColor, badgeClass };
  }

  /**
   * Parses a date string from common French formats (DD/MM/YYYY, DD-MM-YYYY) or ISO (YYYY-MM-DD)
   * and returns it in ISO-8601 format (YYYY-MM-DD), or null if parsing fails.
   * This function now constructs the Date object in UTC to prevent timezone-related day shifts.
   * @param {string} dateString - The date string to parse.
   * @returns {string|null} The date in ISO-MM-DD format, or null.
   */
  function parseFrenchDateToISO(dateString) {
    if (!dateString) return null;
    dateString = dateString.trim();

    // Try parsing as ISO format (YYYY-MM-DD) first
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      // For ISO format, directly creating a Date object and then getting ISO string is fine
      // as new Date("YYYY-MM-DD") is parsed as UTC midnight.
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }

    // Try common French formats (DD/MM/YYYY or DD-MM-YYYY)
    const frenchDateMatch = dateString.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );
    if (frenchDateMatch) {
      const day = parseInt(frenchDateMatch[1], 10);
      const month = parseInt(frenchDateMatch[2], 10) - 1; // JS months are 0-indexed (0-11)
      const year = parseInt(frenchDateMatch[3], 10);

      // IMPORTANT FIX: Create date using Date.UTC to avoid local timezone issues
      const date = new Date(Date.UTC(year, month, day));

      // Validate if the date components actually correspond to the parsed date
      // This check is still useful to catch invalid dates like Feb 30th
      if (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month &&
        date.getUTCDate() === day
      ) {
        return date.toISOString().split("T")[0];
      }
    }
    console.warn(
      `Could not parse date string "${dateString}". Returning null.`
    );
    return null; // Return null if all parsing attempts fail
  }

  /**
   * Displays a custom confirmation modal.
   * @param {string} messageText - The message to display in the confirmation.
   * @param {function} onConfirmCallback - Callback function to execute if user confirms.
   */
  function showConfirmationModal(messageText, onConfirmCallback) {
    let modalOverlay = document.getElementById("confirmationModalOverlay");
    if (!modalOverlay) {
      modalOverlay = document.createElement("div");
      modalOverlay.id = "confirmationModalOverlay";
      // Initial state: hidden, will be shown via .show class
      modalOverlay.innerHTML = `
            <div class="modal-content-box">
              <h4 class="text-xl font-bold text-gray-800 mb-4">Confirmer l'action</h4>
              <p id="confirmationModalMessage" class="mb-6 text-gray-700"></p>
              <div class="confirm-buttons">
                <button id="cancelConfirmBtn" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors">Annuler</button>
                <button id="confirmActionBtn" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">Confirmer</button>
              </div>
            </div>
            `;
      document.body.appendChild(modalOverlay);
    }

    const messageElement = modalOverlay.querySelector(
      "#confirmationModalMessage"
    );
    const confirmBtn = modalOverlay.querySelector("#confirmActionBtn");
    const cancelBtn = modalOverlay.querySelector("#cancelConfirmBtn");

    messageElement.textContent = messageText;

    // Remove existing event listeners to prevent multiple calls
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener("click", () => {
      onConfirmCallback();
      modalOverlay.classList.remove("show"); // Hide with transition
    });

    newCancelBtn.addEventListener("click", () => {
      modalOverlay.classList.remove("show"); // Hide with transition
    });

    modalOverlay.classList.add("show"); // Show with transition
  }

  /**
   * Formats a Date object or a date string into ISO-MM-DD format using UTC components.
   * This ensures consistency regardless of the local timezone.
   * @param {Date|string} dateInput - The date object or ISO string to format.
   * @returns {string} The date in ISO-MM-DD format (UTC based). Returns empty string if invalid.
   */
  function formatDateToISO(dateInput) {
    if (!dateInput) return "";
    let d;
    if (dateInput instanceof Date) {
      d = dateInput;
    } else {
      // Attempt to parse string as a date.
      // new Date("YYYY-MM-DD") is parsed as UTC midnight.
      // new Date("YYYY-MM-DDTHH:MM:SSZ") is also UTC.
      // For other string formats, new Date() might parse it in local timezone.
      // To ensure UTC interpretation, we can try to parse it as UTC explicitly if it's not already ISO.
      if (
        typeof dateInput === "string" &&
        !dateInput.endsWith("Z") &&
        !dateInput.includes("T")
      ) {
        // If it's a plain date string like "2023-01-15", parse it as UTC to avoid local timezone issues
        const parts = dateInput.split("-");
        if (parts.length === 3) {
          d = new Date(
            Date.UTC(
              parseInt(parts[0]),
              parseInt(parts[1]) - 1,
              parseInt(parts[2])
            )
          );
        } else {
          d = new Date(dateInput); // Fallback for other formats
        }
      } else {
        d = new Date(dateInput);
      }

      if (isNaN(d.getTime())) {
        console.warn(
          `formatDateToISO: Invalid date input string: "${dateInput}"`
        );
        return ""; // Return empty string for invalid date strings
      }
    }

    // Use UTC methods to get year, month, day to avoid local timezone shifts
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Normalizes a Date object to midnight UTC for consistent daily comparisons.
   * This function is still useful for general date manipulation, but for "same day" comparison
   * of `created_at` from the DB, string comparison of ISO dates is more reliable.
   * @param {Date} date - The date object to normalize.
   * @returns {Date} A new Date object set to midnight UTC.
   */
  function normalizeDateToMidnightUTC(date) {
    const d = new Date(date);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  /**
   * Generates a formatted date range string for history/archives buttons.
   * @param {Array<Object>} deliveries - The array of delivery objects.
   * @param {'recent'|'archives'} type - The type of history ('recent' or 'archives').
   * @returns {string} Formatted string like "Historique (25 juin - 27 juin)" ou "Archives (Anciennes)".
   */
  function getFormattedDateRange(deliveries, type) {
    if (deliveries.length === 0) {
      return type === "recent" ? "Historique (Récent)" : "Archives (Anciennes)";
    }

    // Sort by created_at to easily find min and max dates
    const sortedDeliveries = [...deliveries].sort(
      (a, b) => a.created_at.getTime() - b.created_at.getTime()
    );

    const oldestDate = sortedDeliveries[0].created_at;
    const newestDate = sortedDeliveries[sortedDeliveries.length - 1].created_at;

    const options = { day: "numeric", month: "short", year: "numeric" };
    const oldestFormatted = oldestDate.toLocaleDateString("fr-FR", options);
    const newestFormatted = newestDate.toLocaleDateString("fr-FR", options);

    if (oldestFormatted === newestFormatted) {
      return `${
        type === "recent" ? "Historique" : "Archives"
      } (${oldestFormatted})`;
    } else {
      return `${
        type === "recent" ? "Historique" : "Archives"
      } (${oldestFormatted} - ${newestFormatted})`;
    }
  }
  // =====================================================================
  // --- Fonctions de chargement et de rendu des données ---
  // =====================================================================

  async function loadDeliveries() {
    console.log("Loading deliveries...");
    // LOG DIAG: Affiche la réponse brute du backend
    // (pour vérifier si le statut Livré est bien présent après validation)
    let debugRawData = null;
    if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
    }
    try {
      // Détection automatique de l'URL API selon l'environnement
      let apiUrl;
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        apiUrl = "http://localhost:3000/deliveries/status";
      } else {
        apiUrl = window.location.origin + "/deliveries/status";
      }
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      debugRawData = JSON.parse(JSON.stringify(data)); // Copie profonde pour log
      console.log(
        "[SYNC DIAG][loadDeliveries] Données brutes reçues:",
        debugRawData
      );
      if (data.success) {
        deliveries = data.deliveries.map((delivery) => {
          if (delivery.created_at) {
            delivery.created_at = new Date(delivery.created_at);
          }
          if (delivery.delivery_date) {
            // Ensure delivery_date is a Date object if it exists
            delivery.delivery_date = new Date(delivery.delivery_date);
          }
          return delivery;
        });
        allDeliveries = [...deliveries]; // Keep a copy of all original deliveries

        uniqueEmployees = [
          ...new Set(deliveries.map((d) => d.employee_name).filter(Boolean)),
        ].sort();
        const employeeCountDisplay = document.getElementById(
          "employeeCountDisplay"
        );
        if (employeeCountDisplay) {
          employeeCountDisplay.textContent = `(${uniqueEmployees.length} agents)`;
        }

        filterDeliveriesIntoCategories(); // Ensure this is called to update categories
        // LOG DIAG: Affiche window.deliveries juste après update
        setTimeout(() => {
          console.log(
            "[SYNC DIAG][loadDeliveries] window.deliveries après update:",
            window.deliveries
          );
        }, 100);
        if (typeof checkLateContainers === "function") checkLateContainers();
        applyCombinedFilters();
      } else {
        showCustomAlert(
          `Erreur lors du chargement des livraisons: ${data.message}`,
          "error"
        );
        console.error("Failed to load deliveries:", data.message);
      }
    } catch (error) {
      showCustomAlert(
        `Erreur réseau ou serveur lors du chargement des livraisons: ${error.message}`,
        "error"
      );
      console.error("Error loading deliveries:", error);
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
      // Removed hideSpinner() call here as spinner is removed
    }
  }

  /**
   * Filters deliveries into currentPendingDeliveries, recentHistoricalDeliveries, and archivedDeliveries.
   * Applies daily filter for pending and a 3-day threshold for historical/archived.
   */
  function filterDeliveriesIntoCategories() {
    currentPendingDeliveries = [];
    recentHistoricalDeliveries = [];
    archivedDeliveries = [];

    // Get today's date, normalized to local midnight
    const todayLocalMidnight = normalizeDateToMidnight(new Date());

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0); // Normalize to start of the day for consistent comparison

    deliveries.forEach((delivery) => {
      let deliveryCreatedAtLocalMidnight = null;
      if (delivery.created_at) {
        deliveryCreatedAtLocalMidnight = normalizeDateToMidnight(
          delivery.created_at
        );
      }

      if (
        (delivery.delivery_status_acconier === "pending_acconier" ||
          delivery.delivery_status_acconier === "awaiting_delivery_acconier") &&
        deliveryCreatedAtLocalMidnight && // Ensure it's a valid date
        deliveryCreatedAtLocalMidnight.getTime() ===
          todayLocalMidnight.getTime() // Compare timestamps
      ) {
        currentPendingDeliveries.push(delivery);
      } else {
        // Determine if it's recent historical (within 3 days) or archived (older than 3 days)
        if (
          delivery.delivery_status_acconier !== "pending_acconier" &&
          delivery.delivery_status_acconier !== "awaiting_delivery_acconier" &&
          delivery.created_at &&
          delivery.created_at.getTime() >= threeDaysAgo.getTime()
        ) {
          recentHistoricalDeliveries.push(delivery);
        } else if (
          delivery.delivery_status_acconier !== "pending_acconier" &&
          delivery.delivery_status_acconier !== "awaiting_delivery_acconier"
        ) {
          archivedDeliveries.push(delivery);
        }
      }
    });

    currentPendingDeliveries.sort(
      (a, b) => a.created_at.getTime() - b.created_at.getTime()
    );
    recentHistoricalDeliveries.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    );
    archivedDeliveries.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    );
  }

  /**
   * Renders the summary of new pending requests for the current day.
   */
  function renderNewRequestsSummary() {
    newRequestsSummaryBar.innerHTML = "";
    if (currentPendingDeliveries.length === 0) {
      noNewRequestsMessage.style.display = "block";
      newRequestsCount.textContent = "0";
    } else {
      noNewRequestsMessage.style.display = "none";
      newRequestsCount.textContent = currentPendingDeliveries.length;
      currentPendingDeliveries.forEach((delivery) => {
        const item = document.createElement("span");
        item.className = "new-request-item";
        item.dataset.deliveryId = delivery.id;
        item.textContent = `${delivery.client_name} - ${
          delivery.container_number || delivery.bl_number || "N/A"
        }`;
        if (delivery.id === selectedDeliveryId) {
          item.classList.add("selected");
        }
        item.addEventListener("click", () => {
          const currentSelected = newRequestsSummaryBar.querySelector(
            ".new-request-item.selected"
          );
          if (currentSelected) {
            currentSelected.classList.remove("selected");
          }
          const currentSelectedHistoryCard = historyContent.querySelector(
            ".history-card.selected"
          );
          if (currentSelectedHistoryCard) {
            currentSelectedHistoryCard.classList.remove("selected");
          }

          item.classList.add("selected");
          selectedDeliveryId = delivery.id;

          displaySelectedDeliveryCard(delivery);

          expandedHistoryView.classList.add("hidden");
          singleDeliveryView.classList.remove("hidden");
          newRequestsSection.classList.remove("hidden");
        });
        newRequestsSummaryBar.appendChild(item);
      });
    }
  }
  /**
   * Displays the detailed card for a selected delivery in the main dashboard area.
   * @param {object} delivery - The delivery object to display.
   */
  function displaySelectedDeliveryCard(delivery) {
    singleDeliveryView.innerHTML = "";
    singleDeliveryView.classList.remove(
      "flex",
      "items-center",
      "justify-content-center",
      "flex-col"
    );
    singleDeliveryView.classList.add("p-6");
    const card = document.createElement("div");
    card.className =
      "delivery-card bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200";
    card.dataset.deliveryId = delivery.id;

    const agentAcconierNameForHeader =
      delivery.employee_name || "Agent Acconier";

    // Bloc Dossier en haut, très visible
    const dossierBlock = document.createElement("div");
    dossierBlock.className = "flex items-center gap-3 mb-4";
    dossierBlock.innerHTML = `
      <span class="inline-flex items-center px-4 py-2 bg-yellow-200 text-yellow-900 font-bold text-lg rounded-lg border-2 border-yellow-300 shadow-sm">
        <i class="fas fa-folder-open mr-2"></i> Dossier : <span class="ml-2">${
          delivery.dossier ? delivery.dossier : "-"
        }</span>
      </span>
    `;
    card.appendChild(dossierBlock);

    // ...le reste du code pour afficher les autres champs (Client, etc.)
    // (Ancien code supprimé, tout est géré dans la nouvelle version ci-dessus)

    rejectButton.addEventListener("click", async () => {
      const newObservation = observationTextarea.value.trim();
      const newStatus = "rejected_acconier";
      await updateAcconierDelivery(delivery.id, newObservation, newStatus);
    });

    // Ajout de l'écouteur pour le bouton Notifier
    if (notifyButton) {
      notifyButton.addEventListener("click", async () => {
        // Envoi du rappel sans exiger l'email (le backend le retrouve via le nom)
        notifyButton.disabled = true;
        notifyButton.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Envoi...';
        try {
          const response = await fetch(
            "http://localhost:3000/notify-late-dossier",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dossierNumber:
                  delivery.dossier_number || delivery.dossier || "",
                agentName: delivery.employee_name || "",
              }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Erreur lors de l'envoi de l'email."
            );
          }
          showCustomAlert("Rappel envoyé par email à l'agent.", "success");
        } catch (err) {
          showCustomAlert(
            "Erreur lors de l'envoi du rappel : " + err.message,
            "error"
          );
        } finally {
          notifyButton.disabled = false;
          notifyButton.innerHTML =
            '<i class="fas fa-bell mr-2"></i> Notifier (Rappel dossier en retard)';
        }
      });
    }
  }
  /**
   * Deletes a delivery from the backend after user confirmation.
   * @param {string} deliveryId - The ID of the delivery to delete.
   */
  async function deleteDelivery(deliveryId) {
    showConfirmationModal(
      "Êtes-vous sûr de vouloir supprimer cette livraison ? Cette action est irréversible.",
      async () => {
        if (loadingOverlay) loadingOverlay.style.display = "flex";
        try {
          const response = await fetch(
            `http://localhost:3000/deliveries/${deliveryId}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Échec de la suppression de la livraison: ${
                errorData.message || response.statusText
              }`
            );
          }

          showCustomAlert(
            `Livraison ${deliveryId} supprimée avec succès.`,
            "success"
          );
          console.log(`Delivery ${deliveryId} deleted successfully.`);

          await loadDeliveries();
          // If the deleted item was the selected one in the main view, clear the main view
          if (selectedDeliveryId === deliveryId) {
            singleDeliveryView.innerHTML = `
                            <i class="fas fa-hand-pointer text-5xl mb-4 text-gray-300"></i>
                            <p>Cliquez sur une demande ci-dessus pour la consulter en détail.</p>
                        `;
            singleDeliveryView.classList.add(
              "flex",
              "items-center",
              "justify-content-center",
              "flex-col"
            );
            selectedDeliveryId = null;
          }
          // If agent activity box is open and relates to the updated data, refresh it
          if (
            agentActivityBox &&
            agentActivityBox.classList.contains("active") &&
            selectedAgentName // Use selectedAgentName from global scope
          ) {
            // Find the delivery in the current deliveries array to get its agent name
            const deletedDelivery = allDeliveries.find(
              (d) => d.id === deliveryId
            );
            if (
              deletedDelivery &&
              deletedDelivery.employee_name === selectedAgentName
            ) {
              showAgentActivity(
                selectedAgentName, // Use selectedAgentName from global scope
                currentAgentActivityDate // Use currentAgentActivityDate from global scope
              );
            }
          }
        } catch (error) {
          showCustomAlert(
            `Erreur lors de la suppression: ${error.message}`,
            "error",
            7000
          );
          console.error("Error deleting delivery:", error);
        } finally {
          if (loadingOverlay) {
            loadingOverlay.style.display = "none";
          }
        }
      }
    );
  }

  /**
   * Deletes multiple deliveries from the backend after user confirmation.
   * @param {Array<string>} deliveryIds - An array of IDs of deliveries to delete.
   */
  async function deleteDeliveries(deliveryIds) {
    if (loadingOverlay) loadingOverlay.style.display = "flex";
    try {
      const deletePromises = deliveryIds.map((id) =>
        fetch(`/deliveries/${id}`, {
          method: "DELETE",
        }).then((response) => {
          if (!response.ok) {
            return response.json().then((errorData) => {
              throw new Error(
                `Échec de la suppression de la livraison ${id}: ${
                  errorData.message || response.statusText
                }`
              );
            });
          }
          return response.json();
        })
      );

      await Promise.all(deletePromises);

      showCustomAlert(
        `${deliveryIds.length} livraisons supprimées avec succès.`,
        "success"
      );
      console.log(`${deliveryIds.length} deliveries deleted successfully.`);

      // Suppression instantanée dans le tableau principal (lateContainers)
      if (window.lateContainers && Array.isArray(window.lateContainers)) {
        window.lateContainers = window.lateContainers.filter(
          (item) =>
            !deliveryIds.includes(item.id) &&
            !deliveryIds.includes(item.dossier)
        );
        if (typeof renderLateDossiersTable === "function")
          renderLateDossiersTable();
      }

      // Clear main view if the selected delivery was among the deleted ones
      if (selectedDeliveryId && deliveryIds.includes(selectedDeliveryId)) {
        singleDeliveryView.innerHTML = `
                        <i class=\"fas fa-hand-pointer text-5xl mb-4 text-gray-300\"></i>
                        <p>Cliquez sur une demande ci-dessus pour la consulter en détail.</p>
                    `;
        singleDeliveryView.classList.add(
          "flex",
          "items-center",
          "justify-content-center",
          "flex-col"
        );
        selectedDeliveryId = null;
      }
      // If agent activity box is open and relates to the updated data, refresh it
      if (
        agentActivityBox &&
        agentActivityBox.classList.contains("active") &&
        selectedAgentName // Use selectedAgentName from global scope
      ) {
        // We need to re-evaluate if the current agent's view needs refreshing
        // by checking if any of the deleted deliveries belonged to this agent.
        const affectedByDeletion = allDeliveries.some(
          (d) =>
            deliveryIds.includes(d.id) && d.employee_name === selectedAgentName
        );
        if (affectedByDeletion) {
          showAgentActivity(
            selectedAgentName, // Use selectedAgentName from global scope
            currentAgentActivityDate // Use currentAgentActivityDate from global scope
          );
        }
      }
    } catch (error) {
      showCustomAlert(
        `Erreur lors de la suppression de plusieurs livraisons: ${error.message}`,
        "error",
        7000
      );
      console.error("Error deleting multiple deliveries:", error);
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
    }
  }

  /**
   * Renders deliveries in the history sidebar (modal).
   * @param {'recent'|'archives'|'agent_view'} viewType - The primary view type for the modal.
   * @param {string|null} [agentFilterName=null] - Optional: Filter by this agent name.
   * @param {string} [modalSearchTerm=''] - Search term for filtering within the modal.
   */
  function renderHistoryDeliveries(
    viewType,
    agentFilterName = null,
    modalSearchTerm = ""
  ) {
    historyContent.innerHTML = "";
    let deliveriesSource = [];
    let emptyMessage = "";

    if (viewType === "recent") {
      deliveriesSource = [...recentHistoricalDeliveries];
      historyModalTitle.textContent = "Historique des Livraisons Récentes";
      emptyMessage = "Aucune livraison récente traitée pour le moment.";
    } else if (viewType === "archives") {
      deliveriesSource = [...archivedDeliveries];
      historyModalTitle.textContent =
        "Archives des Livraisons (plus de 3 jours)";
      emptyMessage = "Aucune livraison archivée pour le moment.";
    } else if (viewType === "agent_view") {
      deliveriesSource = [...allDeliveries]; // Use the global 'allDeliveries'
      historyModalTitle.textContent = `Opérations de l'Agent : ${agentFilterName}`;
      emptyMessage = `Aucune opération trouvée pour l'agent "${agentFilterName}".`;

      const backToAgentsBtn = document.createElement("button");
      backToAgentsBtn.className =
        "bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow transition duration-200 mb-4";
      backToAgentsBtn.innerHTML =
        '<i class="fas fa-arrow-left mr-2"></i> Retour aux agents';
      backToAgentsBtn.addEventListener("click", () => {
        // This function needs to be defined or passed.
        // Assuming manageHistoryModal is a global function.
        // manageHistoryModal("open", activeModalContentSource, null);
        showEmployeePopup();
        if (historySidebar.classList.contains("open")) {
          historySidebar.classList.remove("open");
          historyOverlay.classList.add("hidden");
        }
      });
      historyContent.appendChild(backToAgentsBtn);
    }

    let deliveriesToRender = [...deliveriesSource];

    if (agentFilterName) {
      deliveriesToRender = deliveriesToRender.filter(
        (d) => d.employee_name === agentFilterName
      );
      historyModalTitle.textContent = `Opérations de l'Agent : ${agentFilterName}`;
      emptyMessage = `Aucune opération trouvée pour l'agent "${agentFilterName}".`;

      const backToAgentsBtn = document.createElement("button");
      backToAgentsBtn.className =
        "bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow transition duration-200 mb-4";
      backToAgentsBtn.innerHTML =
        '<i class="fas fa-arrow-left mr-2"></i> Retour aux agents';
      backToAgentsBtn.addEventListener("click", () => {
        // This function needs to be defined or passed.
        // Assuming manageHistoryModal is a global function.
        // manageHistoryModal("open", activeModalContentSource, null); // This function is not defined in this script
        // Instead, directly show employee popup
        showEmployeePopup();
        if (historySidebar.classList.contains("open")) {
          historySidebar.classList.remove("open");
          historyOverlay.classList.add("hidden");
        }
      });
      historyContent.appendChild(backToAgentsBtn);
    }

    if (modalSearchTerm) {
      const lowerCaseSearchTerm = modalSearchTerm.toLowerCase();
      deliveriesToRender = deliveriesToRender.filter((delivery) => {
        return (
          (delivery.declaration_number &&
            String(delivery.declaration_number)
              .toLowerCase()
              .includes(lowerCaseSearchTerm)) ||
          (delivery.bl_number &&
            String(delivery.bl_number)
              .toLowerCase()
              .includes(lowerCaseSearchTerm)) ||
          (delivery.container_number &&
            String(delivery.container_number)
              .toLowerCase()
              .includes(lowerCaseSearchTerm)) ||
          (delivery.client_name &&
            String(delivery.client_name)
              .toLowerCase()
              .includes(lowerCaseSearchTerm)) ||
          (delivery.employee_name &&
            String(delivery.employee_name)
              .toLowerCase()
              .includes(lowerCaseSearchTerm))
        );
      });
    }

    deliveriesToRender.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    );

    if (deliveriesToRender.length === 0) {
      noHistoryMessage.textContent = emptyMessage;
      noHistoryMessage.style.display = "block";
      return;
    } else {
      noHistoryMessage.style.display = "none";
    }

    const dateGroupedContent = {};
    deliveriesToRender.forEach((delivery) => {
      const deliveryDateISO = formatDateToISO(delivery.created_at);
      if (!dateGroupedContent[deliveryDateISO]) {
        dateGroupedContent[deliveryDateISO] = {
          agents: {},
          deliveries: [],
        };
      }

      if (agentFilterName) {
        dateGroupedContent[deliveryDateISO].deliveries.push(delivery);
      } else {
        if (delivery.employee_name) {
          if (
            !dateGroupedContent[deliveryDateISO].agents[delivery.employee_name]
          ) {
            dateGroupedContent[deliveryDateISO].agents[
              delivery.employee_name
            ] = 0;
          }
          dateGroupedContent[deliveryDateISO].agents[delivery.employee_name]++;
        }
      }
    });
    const sortedDates = Object.keys(dateGroupedContent).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    const todayISO = formatDateToISO(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = formatDateToISO(yesterday);

    sortedDates.forEach((dateISO) => {
      const dateHeader = document.createElement("h4");
      dateHeader.className = "text-lg font-bold text-gray-700 mt-4 mb-2";
      if (dateISO === todayISO) {
        dateHeader.textContent = "Aujourd'hui";
      } else if (dateISO === yesterdayISO) {
        dateHeader.textContent = "Hier";
      } else {
        dateHeader.textContent = new Date(dateISO).toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      historyContent.appendChild(dateHeader);

      if (agentFilterName) {
        const sortedDeliveriesForDate = dateGroupedContent[
          dateISO
        ].deliveries.sort(
          (a, b) => b.created_at.getTime() - a.created_at.getTime()
        );
        // Render individual delivery cards for the specific agent
        sortedDeliveriesForDate.forEach((delivery) => {
          const card = document.createElement("div");
          card.className = "history-card relative";
          card.dataset.deliveryId = delivery.id;

          card.innerHTML = `
                                <div class="history-info-group">
                                    <strong>Client:</strong> <span>${
                                      delivery.client_name || "-"
                                    }</span>
                                </div>
                                <div class="history-info-group">
                                    <strong>TC:</strong> <span>${
                                      delivery.container_number || "-"
                                    }</span>
                                </div>
                                <div class="history-info-group">
                                    <strong>BL:</strong> <span>${
                                      delivery.bl_number || "-"
                                    }</span>
                                </div>
                                <div class="history-info-group">
                                    <strong>Date:</strong> <span>${
                                      delivery.created_at
                                        ? delivery.created_at.toLocaleDateString(
                                            "fr-FR"
                                          )
                                        : "-"
                                    }</span>
                                </div>
                                <div class="history-info-group">
                                    <strong>Obs:</strong> <span>${(
                                      delivery.observation_acconier || "-"
                                    ).substring(0, 50)}...</span>
                                </div>
                                <div class="history-info-group">
                                    <strong>Statut Acconier:</strong> <span class="badge ${
                                      getStatusInfo(
                                        delivery.delivery_status_acconier
                                      ).badgeClass
                                    }">${
            getStatusInfo(delivery.delivery_status_acconier).text
          }</span>
                                </div>
                                <button class="delete-history-item-btn absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                                    <i class="fas fa-trash-alt text-sm"></i>
                                </button>
                            `;
          historyContent.appendChild(card);

          const deleteBtn = card.querySelector(".delete-history-item-btn");
          if (deleteBtn) {
            deleteBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              deleteDelivery(delivery.id);
            });
          }

          card.addEventListener("click", () => {
            const currentSelectedNewRequest =
              newRequestsSummaryBar.querySelector(".new-request-item.selected");
            if (currentSelectedNewRequest) {
              currentSelectedNewRequest.classList.remove("selected");
            }
            const currentSelectedHistoryCardSidebar =
              historyContent.querySelector(".history-card.selected");
            if (currentSelectedHistoryCardSidebar) {
              currentSelectedHistoryCardSidebar.classList.remove("selected");
            }
            card.classList.add("selected");
            selectedDeliveryId = delivery.id; // Define selectedDeliveryId here
            displaySelectedDeliveryCard(delivery);
            // This function needs to be defined or passed.
            // Assuming manageHistoryModal is a global function.
            // manageHistoryModal("close"); // This function is not defined in this script
            // Instead, directly show agent activity
            expandedHistoryView.classList.add("hidden");
            singleDeliveryView.classList.remove("hidden");
            newRequestsSection.classList.remove("hidden");
          });
        });
      } else {
        const agentsForThisDate = dateGroupedContent[dateISO].agents;
        const sortedAgentsForThisDate = Object.keys(agentsForThisDate).sort();

        sortedAgentsForThisDate.forEach((agentName) => {
          const agentItem = document.createElement("div");
          agentItem.className =
            "history-agent-item p-4 mb-2 bg-blue-100 rounded-lg shadow-sm cursor-pointer hover:bg-blue-200 transition-colors duration-200";
          agentItem.innerHTML = `
                                <p class="font-bold text-lg text-blue-800">${agentName}</p>
                                <span class="text-sm text-blue-600">${agentsForThisDate[agentName]} opération(s)</span>
                            `;
          agentItem.addEventListener("click", () => {
            // This function needs to be defined or passed.
            // Assuming manageHistoryModal is a global function.
            // manageHistoryModal("open", viewType, agentName); // This function is not defined in this script
            // Instead, directly show agent activity
            selectedAgentName = agentName; // Use global selectedAgentName
            currentAgentActivityDate = new Date(dateISO); // Set date to the selected history date
            showAgentActivity(selectedAgentName, currentAgentActivityDate);
            // Close the history sidebar if it's open
            if (historySidebar.classList.contains("open")) {
              historySidebar.classList.remove("open");
              historyOverlay.classList.add("hidden");
            }
          });
          historyContent.appendChild(agentItem);
        });
      }
    });
  }

  /**
   * This function is no longer actively used to display content,
   * as the "Étaler Historique" button has been removed and history is in the modal.
   * It's kept as a placeholder in case future requirements change.
   */
  function renderExpandedHistoryInMainView() {
    expandedHistoryView.innerHTML = `
            <div class="empty-state text-center p-8 col-span-full">
                <i class="fas fa-info-circle text-6xl text-gray-400 mb-4"></i>
                <p class="text-xl text-gray-600">L'historique complet est désormais disponible dans la boîte flottante "Historique".</p>
                <p class="text-gray-500 mt-2">Cliquez sur le bouton "Historique" en haut à droite.</p>
            </div>
            `;
    expandedHistoryView.classList.add("hidden");
  }

  /**
   * Updates the acconier's observation and status for a specific delivery.
   * This function now triggers re-rendering of both pending and history sections.
   * @param {string} deliveryId - The ID of the delivery to update.
   * @param {string} observation - The new observation text.
   * @param {string} status - The new acconier status.
   */
  async function updateAcconierDelivery(deliveryId, observation, status) {
    if (loadingOverlay) loadingOverlay.style.display = "flex";
    try {
      // Optimisme : MAJ immédiate locale
      const currentDelivery = deliveries.find((d) => d.id === deliveryId);
      if (currentDelivery) {
        currentDelivery.observation_acconier = observation;
        currentDelivery.delivery_status_acconier = status;
      }
      // MAJ aussi dans allDeliveries si besoin
      const currentDeliveryAll = allDeliveries.find((d) => d.id === deliveryId);
      if (currentDeliveryAll) {
        currentDeliveryAll.observation_acconier = observation;
        currentDeliveryAll.delivery_status_acconier = status;
      }
      // Rafraîchir l'affichage immédiatement
      filterDeliveriesIntoCategories();
      applyCombinedFilters();
      if (selectedDeliveryId === deliveryId && currentDelivery) {
        displaySelectedDeliveryCard(currentDelivery);
      }

      // Requête réseau en arrière-plan
      fetch(`http://localhost:3000/deliveries/${deliveryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          observation_acconier: observation,
          delivery_status_acconier: status,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Failed to update delivery status: ${
                errorData.message || response.statusText
              }`
            );
          }
          const result = await response.json();
          showCustomAlert(
            `Livraison ${result.delivery.id} mise à jour avec succès !`,
            "success"
          );
          // Après succès, recharge les données pour être sûr d'être à jour
          await loadDeliveries();
          // Ajout d'un délai pour garantir la synchro DOM avant recalcul de l'alerte
          setTimeout(() => {
            if (typeof checkLateContainers === "function") {
              checkLateContainers();
              // Si la popup de liste est ouverte et il n'y a plus de dossiers en retard, on la ferme
              const lateListModal = document.querySelector(
                ".late-list-modal-popup"
              );
              if (
                lateListModal &&
                (!window.lateContainers || window.lateContainers.length === 0)
              ) {
                lateListModal.remove();
              }
            }
          }, 200);
          if (historySidebar && historySidebar.classList.contains("open")) {
            renderHistoryDeliveries(
              activeModalContentSource,
              activeAgentFilterName,
              historySearchInput.value
            );
          }
        })
        .catch((error) => {
          showCustomAlert(
            `Erreur lors de la mise à jour de la livraison: ${error.message}`,
            "error",
            7000
          );
          // En cas d'erreur, recharge les données pour resynchroniser
          loadDeliveries();
        })
        .finally(() => {
          if (loadingOverlay) loadingOverlay.style.display = "none";
        });
    } catch (error) {
      showCustomAlert(
        `Erreur lors de la mise à jour de la livraison: ${error.message}`,
        "error",
        7000
      );
      if (loadingOverlay) loadingOverlay.style.display = "none";
    }
  }

  /**
   * Updates a specific field of a delivery in the backend.
   * @param {string} deliveryId - The ID of the delivery to update.
   * @param {string} fieldName - The name of the field to update (e.g., 'status', 'transporter').
   * @param {*} newValue - The new value for the field.
   */
  async function updateDeliveryStatus(deliveryId, fieldName, newValue) {
    if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
    }
    try {
      const payload = {};
      payload[fieldName] = newValue;
      console.log("Sending payload for general update:", payload); // Log payload

      const response = await fetch(
        `http://localhost:3000/deliveries/${deliveryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to update delivery: ${
            errorData.message || response.statusText
          }`
        );
      }

      const result = await response.json();
      console.log(
        `Delivery ${result.delivery.id} field '${fieldName}' updated successfully to '${newValue}'.`
      );

      // Re-load all deliveries to update the main table and categories
      await loadDeliveries();
      // Mise à jour instantanée du tableau de suivi après modification
      filterDeliveriesIntoCategories();
      applyCombinedFilters();

      // Si la boîte d'activité agent est ouverte et concerne la donnée modifiée, on la rafraîchit
      if (
        agentActivityBox &&
        agentActivityBox.classList.contains("active") &&
        selectedAgentName // Use selectedAgentName from global scope
      ) {
        const updatedDelivery = deliveries.find((d) => d.id === deliveryId);
        if (
          updatedDelivery &&
          updatedDelivery.employee_name === selectedAgentName // Use selectedAgentName from global scope
        ) {
          showAgentActivity(
            selectedAgentName, // Use selectedAgentName from global scope
            currentAgentActivityDate // Use currentAgentActivityDate from global scope
          );
        }
      }
    } catch (error) {
      showCustomAlert(
        `Erreur lors de la mise à jour du champ ${fieldName}: ${error.message}`,
        "error",
        5000
      );
      console.error(`Error updating delivery field ${fieldName}:`, error);
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
    }
  }
  /**
   * Renders the main admin deliveries table.
   * @param {Array<Object>} deliveriesToRender - The array of delivery objects to display.
   */
  function renderAdminDeliveriesTable(deliveriesToRender) {
    if (!deliveriesTableBody) {
      console.error("Element #deliveriesTableBody not found.");
      return;
    }
    deliveriesTableBody.innerHTML = "";

    // Total columns: 29 original + 1 (Statut de livraison Acc.) + 1 (Observation Acc.) = 31
    const ACTUAL_COLUMN_COUNT = 31;

    if (deliveriesToRender.length === 0) {
      deliveriesTableBody.innerHTML = `
                <tr>
                    <td colspan="${ACTUAL_COLUMN_COUNT}" class="text-center py-4 text-gray-500">Aucune livraison trouvée pour les filtres appliqués.</td>
                </tr>
            `;
      return;
    }
    deliveriesToRender.forEach((delivery, index) => {
      const row = deliveriesTableBody.insertRow();
      row.id = `delivery-row-${delivery.id}`;
      row.dataset.deliveryId = delivery.id;

      if (selectionMode) {
        const checkboxCell = row.insertCell();
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "form-check-input delivery-select-checkbox";
        checkbox.dataset.deliveryId = delivery.id;
        checkbox.addEventListener("change", () => {
          const anyChecked = deliveriesTableBody.querySelector(
            ".delivery-select-checkbox:checked"
          );
          if (deleteSelectedDeliveriesBtn) {
            deleteSelectedDeliveriesBtn.style.display = anyChecked
              ? "inline-block"
              : "none";
          }
        });
        checkboxCell.appendChild(checkbox);
      } else {
        row.insertCell().textContent = index + 1; // N°
      }
      // Helper function to create interactive or display cells
      const createCell = (value, fieldName, type = "text", options = {}) => {
        const cell = row.insertCell();
        cell.dataset.fieldName = fieldName;
        cell.dataset.type = type;
        cell.dataset.actualValue = value;

        let displayValue;
        // --- Affichage spécial pour la colonne Numéro TC(s) ---
        if (fieldName === "container_number") {
          // On accepte soit une string séparée par "," ou ";" ou un tableau
          let tcList = [];
          if (Array.isArray(value)) {
            tcList = value.filter(Boolean);
          } else if (typeof value === "string") {
            tcList = value.split(/[,;\s]+/).filter(Boolean);
          }
          // Fonction pour ouvrir la pop-up détaillée
          function showContainerDetailPopup(delivery, containerNumber) {
            // Supprime toute ancienne pop-up
            const oldPopup = document.getElementById("containerDetailPopup");
            if (oldPopup) oldPopup.remove();
            // Overlay
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
            // Boîte centrale
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
            // Header
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
            // Bouton de fermeture
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
            // Corps
            const content = document.createElement("div");
            content.style.padding = "24px 24px 24px 24px";
            content.style.background = "#f8fafc";
            content.style.flex = "1 1 auto";
            content.style.overflowY = "auto";
            // Numéro du conteneur
            const tcNum = document.createElement("div");
            tcNum.style.fontSize = "1.25em";
            tcNum.style.fontWeight = "bold";
            tcNum.style.marginBottom = "18px";
            tcNum.style.textAlign = "center";
            tcNum.innerHTML = `Numéro du conteneur : <span style='color:#2563eb;'>${containerNumber}</span>`;
            content.appendChild(tcNum);
            // Menu déroulant statut
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
              { value: "delivered", label: "Livré" },
              { value: "rejected", label: "Rejeté" },
              { value: "pending", label: "En attente" },
              { value: "in_progress", label: "En cours" },
            ];
            // Statut actuel (on cherche le statut du conteneur si stocké, sinon celui de la livraison)
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
            // Bouton enregistrer
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
              // Appel API PATCH pour mettre à jour le statut du conteneur individuellement
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
                  showCustomAlert(
                    `Statut du conteneur mis à jour : ${
                      select.options[select.selectedIndex].text
                    }`,
                    "success"
                  );
                  overlay.remove();
                  // Rafraîchir les données pour mettre à jour le compteur "X sur Y livrés"
                  if (typeof loadDeliveries === "function") {
                    await loadDeliveries();
                  }
                  // Mise à jour immédiate de l'alerte dossier en retard après changement de statut conteneur
                  if (typeof checkLateContainers === "function")
                    checkLateContainers();
                } else {
                  showCustomAlert(
                    data.message ||
                      "Erreur lors de la mise à jour du statut du conteneur.",
                    "error"
                  );
                }
              } catch (err) {
                showCustomAlert(
                  "Erreur réseau lors de la mise à jour du statut du conteneur.",
                  "error"
                );
              }
            };
            content.appendChild(saveBtn);
            box.appendChild(content);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            // Fermeture par clic sur le fond
            overlay.onclick = (e) => {
              if (e.target === overlay) overlay.remove();
            };
          }
          if (tcList.length > 1) {
            // Plusieurs TC : bouton cliquable qui ouvre une boîte flottante
            cell.classList.add("tc-multi-cell");
            const btn = document.createElement("button");
            btn.className = "tc-tags-btn";
            btn.type = "button";
            btn.innerHTML =
              tcList
                .slice(0, 2)
                .map((tc) => `<span class="tc-tag">${tc}</span>`)
                .join("") +
              (tcList.length > 2
                ? ` <span class="tc-tag tc-tag-more">+${
                    tcList.length - 2
                  }</span>`
                : "") +
              ' <i class="fas fa-chevron-down tc-chevron"></i>';
            // Création de la boîte flottante
            const popup = document.createElement("div");
            popup.className = "tc-popup";
            popup.style.display = "none";
            popup.innerHTML = tcList
              .map(
                (tc) =>
                  `<div class="tc-popup-item" style='cursor:pointer;'>${tc}</div>`
              )
              .join("");
            // Affichage/masquage
            btn.onclick = (e) => {
              e.stopPropagation();
              // Fermer les autres popups
              document.querySelectorAll(".tc-popup").forEach((p) => {
                if (p !== popup) p.style.display = "none";
              });
              popup.style.display =
                popup.style.display === "block" ? "none" : "block";
            };
            // Clic sur un TC dans la liste : pop-up détaillée
            popup.querySelectorAll(".tc-popup-item").forEach((item) => {
              item.onclick = (ev) => {
                ev.stopPropagation();
                popup.style.display = "none";
                showContainerDetailPopup(delivery, item.textContent);
              };
            });
            // Fermer si clic ailleurs
            document.addEventListener("click", function hidePopup(e) {
              if (!cell.contains(e.target)) popup.style.display = "none";
            });
            cell.appendChild(btn);
            cell.appendChild(popup);
            displayValue = tcList.join(", ");
          } else if (tcList.length === 1) {
            // Un seul TC : badge simple
            const tag = document.createElement("span");
            tag.className = "tc-tag";
            tag.textContent = tcList[0];
            tag.style.cursor = "pointer";
            tag.onclick = (e) => {
              e.stopPropagation();
              showContainerDetailPopup(delivery, tcList[0]);
            };
            cell.appendChild(tag);
            displayValue = tcList[0];
          } else {
            cell.textContent = "-";
            displayValue = "-";
          }
        }
        // --- Fin affichage spécial TC ---
        else if (value instanceof Date && type === "datetime-local") {
          displayValue = value
            .toLocaleString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })
            .replace(",", "");
        } else if (value instanceof Date && fieldName === "delivery_date") {
          displayValue = value.toLocaleDateString("fr-FR");
        } else if (value instanceof Date) {
          displayValue = value.toLocaleDateString("fr-FR");
        } else if (fieldName === "status") {
          // Affichage du statut dans l'entête : forcer "En attente de paiement" si statut = "pending_acconier"
          let displayStatus = value;
          if (value === "pending_acconier") {
            displayStatus = "awaiting_payment_acconier";
          }
          cell.classList.add("dropdown-cell-container");
          const dropdownToggleId = `status-toggle-${delivery.id}`;
          const dropdownContentId = `status-content-${delivery.id}`;

          const toggleButton = document.createElement("button");
          toggleButton.id = dropdownToggleId;
          toggleButton.className = "dropdown-toggle-button"; // Base class

          // Set initial display for the toggle button based on current value
          let currentStatusInfo = getStatusInfo(displayStatus);
          // (Debug désactivé)
          const statusWrapper = document.createElement("span");
          statusWrapper.style.display = "inline-flex";
          statusWrapper.style.alignItems = "center";
          // Toujours forcer une icône valide, sinon icône "fa-question-circle" grise
          const iconElement = document.createElement("i");
          let iconClass =
            currentStatusInfo.iconClass && currentStatusInfo.iconClass !== ""
              ? currentStatusInfo.iconClass
              : "fa-question-circle";
          let tailwindColorClass =
            currentStatusInfo.tailwindColorClass &&
            currentStatusInfo.tailwindColorClass !== ""
              ? currentStatusInfo.tailwindColorClass
              : "text-gray-400";
          let hexColor =
            currentStatusInfo.hexColor && currentStatusInfo.hexColor !== ""
              ? currentStatusInfo.hexColor
              : "#9ca3af";
          iconElement.className = `fas ${iconClass} ${tailwindColorClass}`;
          iconElement.style.color = hexColor;
          iconElement.style.marginRight = "6px";
          statusWrapper.appendChild(iconElement);
          const textSpan = document.createElement("span");
          textSpan.textContent = currentStatusInfo.text;
          statusWrapper.appendChild(textSpan);
          toggleButton.innerHTML = "";
          toggleButton.appendChild(statusWrapper);
          const chevronIcon = document.createElement("i");
          chevronIcon.className = "fas fa-chevron-down";
          chevronIcon.style.marginLeft = "8px";
          toggleButton.appendChild(chevronIcon);

          toggleButton.onclick = (e) => {
            e.stopPropagation(); // Prevent row click from interfering
            document
              .querySelectorAll(".dropdown-content.show")
              .forEach((openDropdown) => {
                if (openDropdown.id !== dropdownContentId) {
                  openDropdown.classList.remove("show");
                }
              });
            document.getElementById(dropdownContentId).classList.toggle("show");
          };
          const dropdownContent = document.createElement("div");
          dropdownContent.id = dropdownContentId;
          dropdownContent.className = "dropdown-content";
          // Use GLOBAL_STATUS_OPTIONS for the dropdown in the main table
          GLOBAL_STATUS_OPTIONS.forEach((option) => {
            const optionButton = document.createElement("button");
            // Get status info for the option to apply icon and color
            const optionStatusInfo = getStatusInfo(option.apiValue);
            // Construction du HTML identique pour l'option
            let optionHtml = "";
            if (
              optionStatusInfo.iconClass &&
              optionStatusInfo.iconClass !== ""
            ) {
              optionHtml += `<i class=\"fas ${optionStatusInfo.iconClass} ${optionStatusInfo.tailwindColorClass}\" style=\"color:${optionStatusInfo.hexColor};margin-right:6px;\"></i>`;
            }
            optionHtml += `<span>${option.text}</span>`;
            optionButton.innerHTML = optionHtml;

            optionButton.onclick = async () => {
              // Affiche exactement le même HTML que l'option sélectionnée dans le bouton (immédiatement)
              // Reconstruit le bouton avec l'icône et le texte
              const selectedStatusInfo = getStatusInfo(option.apiValue);
              const statusWrapper = document.createElement("span");
              statusWrapper.style.display = "inline-flex";
              statusWrapper.style.alignItems = "center";
              const iconElement = document.createElement("i");
              iconElement.className = `fas ${selectedStatusInfo.iconClass} ${selectedStatusInfo.tailwindColorClass}`;
              iconElement.style.color = selectedStatusInfo.hexColor;
              iconElement.style.marginRight = "6px";
              statusWrapper.appendChild(iconElement);
              const textSpan = document.createElement("span");
              textSpan.textContent = selectedStatusInfo.text;
              statusWrapper.appendChild(textSpan);
              toggleButton.innerHTML = "";
              toggleButton.appendChild(statusWrapper);
              const updatedChevronIcon = document.createElement("i");
              updatedChevronIcon.className = "fas fa-chevron-down";
              updatedChevronIcon.style.marginLeft = "8px";
              toggleButton.appendChild(updatedChevronIcon);
              // Update the actualValue dataset to reflect the new state for PDF cloning
              cell.dataset.actualValue = option.apiValue;
              dropdownContent.classList.remove("show");
              // Mise à jour backend et alertes APRES le rendu visuel immédiat
              setTimeout(async () => {
                await updateDeliveryStatus(
                  delivery.id,
                  fieldName,
                  option.apiValue
                );
                const alertType =
                  option.apiValue === "rejected" ? "error" : "success";
                showCustomAlert(
                  `Le statut a été défini sur ${option.text} pour l’agent ${
                    delivery.employee_name || "inconnu"
                  }.`,
                  alertType,
                  3000
                );
              }, 10);
            };
            dropdownContent.appendChild(optionButton);
          });

          cell.innerHTML = ""; // Clear previous display
          cell.appendChild(toggleButton);
          cell.appendChild(dropdownContent);
          return cell;
        } else if (fieldName === "delivery_status_acconier") {
          // Affichage du statut acconier dans la colonne : forcer "En attente de paiement" si statut = "pending_acconier"
          let displayStatus = value;
          if (value === "pending_acconier") {
            displayStatus = "awaiting_payment_acconier";
          }
          const statusInfo = getStatusInfo(displayStatus);
          // Only add icon if it's not empty
          const iconHtml = statusInfo.iconClass
            ? `<i class=\"fas ${statusInfo.iconClass} mr-1\" style=\"color:${statusInfo.hexColor};\"></i>` // Apply inline style here
            : "";
          cell.innerHTML = `<span class=\"${statusInfo.tailwindColorClass}\">${iconHtml} ${statusInfo.text}</span>`;
          displayValue = statusInfo.text; // Set displayValue for originalValue storage
        } else {
          displayValue = value || "-"; // Changed from "N/A" to "-"
        }

        // Set initial text content for non-dropdown cells (if not already set by specific logic above)
        if (cell.innerHTML === "") {
          // Only set if not already populated by specific logic
          cell.textContent = displayValue;
        }

        // Store original value for comparison in a consistent string format
        // This block runs when the cell is initially created, before any editing.
        if (fieldName === "delivery_date") {
          // Store the initial delivery_date in ISO format for consistent comparison later
          cell.dataset.originalValue = value ? formatDateToISO(value) : null;
        } else if (fieldName === "delivery_time") {
          // Store the initial delivery_time as is (should be HH:MM or similar)
          cell.dataset.originalValue = value || null;
        } else if (fieldName === "created_at" && value instanceof Date) {
          // Store created_at as ISO string
          cell.dataset.originalValue = value.toISOString();
        } else {
          // For all other text/general fields, store as string, handling null/undefined
          cell.dataset.originalValue = String(value || "");
        }

        // Add inline editing functionality for other fields if in editing mode OR it's an always editable field
        // MODIFIED CONDITION HERE: Explicitly exclude 'delivery_status_acconier' AND 'created_at' from inline editing
        if (
          fieldName !== "status" &&
          fieldName !== "delivery_status_acconier" &&
          fieldName !== "created_at" && // <-- ADDED THIS LINE
          (isEditingMode || ALWAYS_INLINE_EDITABLE_FIELDS.includes(fieldName))
        ) {
          cell.classList.add("editable-cell"); // Optional: Add a class for styling

          // The click handler function for inline editing
          const clickToEditHandler = function handler() {
            // Prevent multiple clicks creating multiple inputs
            if (cell.querySelector("input, select, textarea")) return; // Added textarea check

            cell.innerHTML = ""; // Clear existing display content

            let input;
            if (type === "select") {
              // This path is now only for generic selects
              input = document.createElement("select");
              options.selectOptions.forEach((opt) => {
                const option = document.createElement("option");
                option.value = opt.apiValue;
                option.textContent = opt.text;
                if (opt.apiValue === value) {
                  option.selected = true;
                }
                input.appendChild(option);
              });
            } else if (type === "checkbox") {
              // This path is now only for generic checkboxes
              input = document.createElement("input");
              input.type = "checkbox";
              input.checked = value;
            } else if (fieldName === "delivery_date") {
              // Utiliser un input de type "date" (sélecteur de date natif)
              input = document.createElement("input");
              input.type = "date";
              if (value instanceof Date && !isNaN(value.getTime())) {
                // Format Date object to yyyy-mm-dd
                const year = value.getFullYear();
                const month = String(value.getMonth() + 1).padStart(2, "0");
                const day = String(value.getDate()).padStart(2, "0");
                input.value = `${year}-${month}-${day}`;
              } else if (
                typeof value === "string" &&
                value.match(/^\d{4}-\d{2}-\d{2}$/)
              ) {
                input.value = value;
              } else {
                input.value = "";
              }
            } else if (fieldName === "delivery_time") {
              // Utiliser un input de type "time" (sélecteur d'heure natif)
              input = document.createElement("input");
              input.type = "time";
              // Si value est déjà au format HH:MM, l'utiliser, sinon essayer de le formater
              if (typeof value === "string" && value.match(/^\d{2}:\d{2}$/)) {
                input.value = value;
              } else if (value instanceof Date && !isNaN(value.getTime())) {
                // Si value est un objet Date, extraire l'heure
                const hours = String(value.getHours()).padStart(2, "0");
                const minutes = String(value.getMinutes()).padStart(2, "0");
                input.value = `${hours}:${minutes}`;
              } else {
                input.value = "";
              }
            } else if (
              fieldName === "delivery_notes" ||
              fieldName === "observation_acconier"
            ) {
              // Specific handling for delivery_notes and observation_acconier (textarea)
              input = document.createElement("textarea");
              input.value = displayValue; // Use the formatted display value for textarea
              input.rows = 3; // Give it a few rows
              input.classList.add("w-full", "resize-y"); // Allow vertical resizing
            } else if (type === "datetime-local") {
              // for created_at
              input = document.createElement("input");
              input.type = "datetime-local";
              if (value instanceof Date && !isNaN(value.getTime())) {
                // Format Date object to ISO-8601 for datetime-local input
                const year = value.getFullYear();
                const month = String(value.getMonth() + 1).padStart(2, "0");
                const day = String(value.getDate()).padStart(2, "0");
                const hours = String(value.getHours()).padStart(2, "0");
                const minutes = String(value.getMinutes()).padStart(2, "0");
                input.value = `${year}-${month}-${day}T${hours}:${minutes}`;
              } else {
                input.value = "";
              }
            } else if (fieldName === "delivery_date") {
              // Utiliser un input de type "date" (sélecteur de date natif)
              input = document.createElement("input");
              input.type = "date";
              if (value instanceof Date && !isNaN(value.getTime())) {
                // Format Date object to yyyy-mm-dd
                const year = value.getFullYear();
                const month = String(value.getMonth() + 1).padStart(2, "0");
                const day = String(value.getDate()).padStart(2, "0");
                input.value = `${year}-${month}-${day}`;
              } else if (
                typeof value === "string" &&
                value.match(/^\d{4}-\d{2}-\d{2}$/)
              ) {
                input.value = value;
              } else {
                input.value = "";
              }
            } else if (type === "number") {
              input = document.createElement("input");
              input.type = "number";
              input.value = value;
            } else {
              // Default to text input
              input = document.createElement("input");
              input.type = "text";
              input.value = displayValue; // Use the formatted display value for text input
            }

            input.className = "form-control form-control-sm w-full"; // Bootstrap styling
            cell.appendChild(input);
            input.focus();

            const saveChanges = async () => {
              let currentValueFromInput = input.value; // Get raw value from input

              let formattedNewValueForComparison = null;
              let valueToSendToBackend = currentValueFromInput; // Default to sending raw string for now

              if (fieldName === "delivery_date") {
                // Use the new helper function to consistently parse and format for comparison
                formattedNewValueForComparison = parseFrenchDateToISO(
                  currentValueFromInput
                );
                valueToSendToBackend = formattedNewValueForComparison; // This will be ISO-8601 or null
              } else if (fieldName === "delivery_time") {
                // Frontend already has basic formatting for HH:MM, reuse it
                const parts = currentValueFromInput.split(":");
                if (parts.length >= 2) {
                  let hours = parseInt(parts[0], 10);
                  let minutes = parseInt(parts[1], 10);
                  if (
                    !isNaN(hours) &&
                    hours >= 0 &&
                    hours <= 23 &&
                    !isNaN(minutes) &&
                    minutes >= 0 &&
                    minutes >= 0 &&
                    minutes <= 59
                  ) {
                    formattedNewValueForComparison = `${String(hours).padStart(
                      2,
                      "0"
                    )}:${String(minutes).padStart(2, "0")}`;
                    valueToSendToBackend = formattedNewValueForComparison;
                  } else {
                    formattedNewValueForComparison = null; // Mark as invalid for comparison
                    valueToSendToBackend = null; // Send null to backend for invalid time
                  }
                } else {
                  formattedNewValueForComparison = null; // Mark as invalid for comparison
                  valueToSendToBackend = null; // Send null to backend for invalid time
                }
              } else if (type === "datetime-local") {
                // for created_at
                let parsedDateTime = new Date(currentValueFromInput);
                if (!isNaN(parsedDateTime.getTime())) {
                  formattedNewValueForComparison = parsedDateTime.toISOString(); // Keep full ISO for comparison
                  valueToSendToBackend = parsedDateTime.toISOString();
                } else {
                  formattedNewValueForComparison = null;
                  valueToSendToBackend = null;
                }
              } else {
                // For other text/number fields, compare directly as strings
                formattedNewValueForComparison =
                  currentValueFromInput === "" ? null : currentValueFromInput;
                valueToSendToBackend = formattedNewValueForComparison;
              }

              // Prepare original value for consistent comparison
              // originalValue from dataset is already in ISO-8601 for date, full ISO for datetime, or raw string for others.
              let originalFormattedValueForComparison =
                cell.dataset.originalValue === ""
                  ? null
                  : cell.dataset.originalValue;
              // For delivery_date which originally came as a Date object, it's stored as ISO-8601 in dataset.originalValue
              // For delivery_time, it's stored as string in dataset.originalValue
              // For created_at, it's stored as ISO string in dataset.originalValue

              // Compare the formatted values
              if (
                formattedNewValueForComparison !==
                originalFormattedValueForComparison
              ) {
                console.log(
                  `Change detected for ${fieldName}: Old: "${originalFormattedValueForComparison}", New: "${formattedNewValueForComparison}"`
                );
                await updateDeliveryStatus(
                  delivery.id,
                  fieldName,
                  valueToSendToBackend // Send the backend-ready value
                );
                cell.dataset.originalValue = valueToSendToBackend; // Store the backend-ready value as original for next edit
                cell.dataset.actualValue = valueToSendToBackend; // Update actual value for PDF cloning
              } else {
                console.log(
                  `No change detected for ${fieldName}. Old: "${originalFormattedValueForComparison}", New: "${formattedNewValueForComparison}"`
                );
              }

              // Revert to display mode regardless of whether change was sent
              cell.innerHTML = "";
              updateCellContent(
                cell,
                valueToSendToBackend !== null
                  ? valueToSendToBackend
                  : currentValueFromInput,
                fieldName,
                type
              ); // Use the formatted value for display, or original if it was invalid
              cell.addEventListener("click", handler);
            };

            // Suppression de la sauvegarde automatique sur blur
            // La sauvegarde ne se fait que sur validation explicite (Entrée)
            input.addEventListener("keypress", (e) => {
              if (e.key === "Enter") {
                if (
                  fieldName === "delivery_notes" ||
                  fieldName === "observation_acconier"
                ) {
                  // Pour textarea, Entrée valide la modification (empêche retour à la ligne)
                  e.preventDefault();
                  saveChanges();
                } else {
                  // Validation explicite uniquement sur Entrée pour les autres champs
                  saveChanges();
                }
              }
            });

            // Retirer temporairement l'écouteur de clic pour éviter les déclenchements multiples lors de l'édition
            cell.removeEventListener("click", handler);
          };

          cell.addEventListener("click", clickToEditHandler);
        }
        return cell;
      };

      // Ordre strictement synchronisé avec l'en-tête HTML
      // N° (déjà géré par la logique selectionMode ou index + 1)
      createCell(delivery.created_at, "created_at", "datetime-local", {}); // Date & Heure
      createCell(delivery.employee_name, "employee_name"); // Agent
      createCell(delivery.client_name, "client_name"); // Client (Nom)
      createCell(delivery.client_phone, "client_phone"); // Client (Tél)
      createCell(delivery.container_number, "container_number"); // Numéro TC(s)
      createCell(delivery.lieu, "lieu", "text", {}); // Lieu
      createCell(delivery.container_foot_type, "container_foot_type"); // Type Conteneur (pied)
      createCell(
        delivery.container_type_and_content,
        "container_type_and_content"
      ); // Contenu
      createCell(delivery.declaration_number, "declaration_number"); // N° Déclaration
      createCell(delivery.bl_number, "bl_number"); // N° BL
      createCell(delivery.dossier_number, "dossier_number"); // N° Dossier
      createCell(
        delivery.number_of_containers,
        "number_of_containers",
        "number",
        {}
      ); // Nombre de conteneurs
      createCell(delivery.shipping_company, "shipping_company"); // Compagnie Maritime
      createCell(delivery.weight, "weight"); // Poids
      createCell(delivery.ship_name, "ship_name"); // Nom du navire
      createCell(delivery.circuit, "circuit"); // Circuit
      createCell(delivery.transporter_mode, "transporter_mode"); // Mode de Transport
      createCell(delivery.delivery_status_acconier, "delivery_status_acconier"); // Statut de livraison (Resp. Aconiés)
      createCell(
        delivery.observation_acconier,
        "observation_acconier",
        "textarea",
        {}
      ); // Observations (Resp. Aconiés)
      createCell(delivery.nom_agent_visiteur, "nom_agent_visiteur", "text", {}); // Nom agent visiteur
      createCell(delivery.transporter, "transporter", "text", {}); // Transporteur
      createCell(delivery.inspecteur, "inspecteur", "text", {}); // Inspecteur
      createCell(delivery.agent_en_douanes, "agent_en_douanes", "text", {}); // Agent en Douanes
      createCell(delivery.driver_name, "driver_name", "text", {}); // Chauffeur
      createCell(delivery.truck_registration, "truck_registration", "text", {}); // Immatriculation
      createCell(delivery.driver_phone, "driver_phone", "text", {}); // Tél. Chauffeur
      createCell(delivery.delivery_date, "delivery_date", "date", {}); // Date Livraison
      createCell(delivery.delivery_time, "delivery_time", "time", {}); // Heure Livraison

      // === Statut multi-conteneurs : carte dynamique ===
      (function () {
        const cell = row.insertCell();
        cell.dataset.fieldName = "status";
        // Récupère le numéro de dossier pour regrouper les livraisons
        const dossierNumber = delivery.dossier_number;
        // Filtre toutes les livraisons du même dossier (même n° dossier)
        const allSameDossier = deliveriesToRender.filter(
          (d) => d.dossier_number === dossierNumber
        );
        // Agrège tous les numéros de conteneur du dossier (pour éviter les doublons)
        let allContainers = [];
        allSameDossier.forEach((d) => {
          let tcList = [];
          if (Array.isArray(d.container_number)) {
            tcList = d.container_number.filter(Boolean);
          } else if (typeof d.container_number === "string") {
            tcList = d.container_number.split(/[,;\s]+/).filter(Boolean);
          }
          allContainers = allContainers.concat(tcList);
        });
        // Unicité des conteneurs
        allContainers = Array.from(new Set(allContainers));
        const total = allContainers.length;
        // Statut de chaque conteneur : livré ou non ?
        // On cherche dans chaque livraison du dossier si le conteneur est livré, en utilisant container_statuses si présent
        let delivered = 0;
        allContainers.forEach((tc) => {
          // On cherche la livraison qui correspond à ce TC dans le dossier
          const found = allSameDossier.find((d) => {
            let tcList = [];
            if (Array.isArray(d.container_number)) {
              tcList = d.container_number.filter(Boolean);
            } else if (typeof d.container_number === "string") {
              tcList = d.container_number.split(/[,;\s]+/).filter(Boolean);
            }
            return tcList.includes(tc);
          });
          // Utilisation du mapping container_statuses si présent
          let isDelivered = false;
          if (found && found.container_statuses) {
            // mapping objet (clé = numéro TC)
            if (
              typeof found.container_statuses === "object" &&
              !Array.isArray(found.container_statuses)
            ) {
              const status = found.container_statuses[tc];
              if (
                typeof status === "string" &&
                ["delivered", "livré", "livree", "livreee"].includes(
                  status.trim().toLowerCase()
                )
              ) {
                isDelivered = true;
              }
            } else if (Array.isArray(found.container_statuses)) {
              // fallback tableau (rare)
              let tcList = [];
              if (Array.isArray(found.container_number)) {
                tcList = found.container_number.filter(Boolean);
              } else if (typeof found.container_number === "string") {
                tcList = found.container_number
                  .split(/[,;\s]+/)
                  .filter(Boolean);
              }
              const idx = tcList.indexOf(tc);
              if (
                idx !== -1 &&
                typeof found.container_statuses[idx] === "string" &&
                found.container_statuses[idx].trim().toLowerCase() ===
                  "delivered"
              ) {
                isDelivered = true;
              }
            }
          } else if (found && typeof found.status === "string") {
            // fallback compatibilité ancienne version
            // On considère livré uniquement si le statut est strictement "Livré" (français) ou "delivered" (anglais)
            const s = found.status.trim().toLowerCase();
            if (s === "livré" || s === "delivered") {
              isDelivered = true;
            }
          }
          // Seuls les conteneurs actuellement marqués "Livré" sont comptés
          if (isDelivered) {
            delivered++;
          }
        });
        // Affichage dynamique
        const box = document.createElement("div");
        box.style.display = "inline-block";
        box.style.padding = "4px 12px";
        box.style.borderRadius = "8px";
        box.style.fontWeight = "bold";
        box.style.fontSize = "0.98em";
        box.style.letterSpacing = "0.5px";
        box.style.boxShadow = "0 1px 6px rgba(30,41,59,0.07)";
        box.style.border = "1.5px solid #eab308";
        box.style.background =
          delivered === total && total > 0 ? "#dcfce7" : "#fef9c3";
        box.style.color =
          delivered === total && total > 0 ? "#15803d" : "#a16207";

        // Texte principal
        if (total === 0) {
          box.textContent = "-";
        } else if (delivered === 0) {
          box.textContent = `0 sur ${total} livrés`;
        } else if (delivered === total) {
          box.textContent = total === 1 ? "Livré" : `${total}/${total} livrés`;
        } else {
          box.textContent = `${delivered} sur ${total} livrés`;
        }
        cell.appendChild(box);

        // --- Tooltip conteneurs détaillés au survol ---
        // Nouveau tooltip robuste : disparition immédiate et sans bug
        box.addEventListener("mouseenter", (e) => {
          const tooltip = document.createElement("div");
          tooltip.className = "status-tooltip-containers";
          tooltip.style.position = "fixed";
          tooltip.style.zIndex = 99999;
          tooltip.style.background = "#fff";
          tooltip.style.border = "1.5px solid #eab308";
          tooltip.style.borderRadius = "10px";
          tooltip.style.boxShadow = "0 6px 32px #eab30822, 0 2px 8px #0001";
          tooltip.style.padding = "14px 18px 12px 18px";
          tooltip.style.fontSize = "1em";
          tooltip.style.color = "#222e3a";
          tooltip.style.minWidth = "220px";
          tooltip.style.maxWidth = "340px";
          tooltip.style.pointerEvents = "auto";
          tooltip.style.transition = "opacity 0.18s";
          tooltip.style.opacity = "0";
          // Liste des conteneurs et statuts
          let html = `<div style='font-weight:700;font-size:1.08em;margin-bottom:7px;color:#a16207;'>Détail des conteneurs</div><ul style='list-style:none;padding:0;margin:0;'>`;
          allContainers.forEach((tc) => {
            let found = allSameDossier.find((d) => {
              let tcList = [];
              if (Array.isArray(d.container_number)) {
                tcList = d.container_number.filter(Boolean);
              } else if (typeof d.container_number === "string") {
                tcList = d.container_number.split(/[,;\s]+/).filter(Boolean);
              }
              return tcList.includes(tc);
            });
            let statut = "-";
            let icon = "<span style='color:#a0aec0;'>&#9675;</span>";
            if (found && found.container_statuses) {
              if (
                typeof found.container_statuses === "object" &&
                !Array.isArray(found.container_statuses)
              ) {
                let s = found.container_statuses[tc];
                if (typeof s === "string") statut = s.trim();
              } else if (Array.isArray(found.container_statuses)) {
                let tcList = [];
                if (Array.isArray(found.container_number)) {
                  tcList = found.container_number.filter(Boolean);
                } else if (typeof found.container_number === "string") {
                  tcList = found.container_number
                    .split(/[,;\s]+/)
                    .filter(Boolean);
                }
                const idx = tcList.indexOf(tc);
                if (
                  idx !== -1 &&
                  typeof found.container_statuses[idx] === "string"
                ) {
                  statut = found.container_statuses[idx].trim();
                }
              }
            } else if (found && typeof found.status === "string") {
              statut = found.status.trim();
            }
            let sNorm = statut.toLowerCase();
            if (
              ["livré", "delivered", "livree", "livreee", "livrée"].includes(
                sNorm
              )
            ) {
              icon =
                "<span style='color:#22c55e;font-size:1.1em;vertical-align:-2px;'><i class='fas fa-check-circle'></i></span>";
              statut = "Livré";
            } else if (
              [
                "en attente",
                "pending",
                "attente",
                "waiting",
                "à livrer",
                "a livrer",
                "pending_acconier",
                "pending_aconnier",
              ].includes(sNorm)
            ) {
              icon =
                "<span style='color:#f59e0b;font-size:1.1em;vertical-align:-2px;'><i class='fas fa-clock'></i></span>";
              // Correction : distinguer "pending_acconier"/"pending_aconnier" de "pending" classique
              if (["pending_acconier", "pending_aconnier"].includes(sNorm)) {
                statut = "En attente de paiement";
              } else {
                statut = "En attente";
              }
            } else if (
              ["rejeté", "rejetee", "refusé", "refuse", "rejected"].includes(
                sNorm
              )
            ) {
              icon =
                "<span style='color:#ef4444;font-size:1.1em;vertical-align:-2px;'><i class='fas fa-times-circle'></i></span>";
              statut = "Rejeté";
            } else if (
              [
                "en cours",
                "in_progress",
                "in progress",
                "encours",
                "en-cours",
              ].includes(sNorm)
            ) {
              icon =
                "<span style='color:#2563eb;font-size:1.1em;vertical-align:-2px;'><i class='fas fa-spinner fa-spin'></i></span>";
              statut = "En cours";
            } else if (
              [
                "problème",
                "probleme",
                "bloqué",
                "bloquee",
                "detenu",
                "détention",
                "detention",
                "retard",
              ].some((x) => sNorm.includes(x))
            ) {
              icon =
                "<span style='color:#ef4444;font-size:1.1em;vertical-align:-2px;'><i class='fas fa-exclamation-triangle'></i></span>";
              statut = "Problème";
            } else if (sNorm && sNorm !== "-") {
              icon =
                "<span style='color:#2563eb;font-size:1.1em;vertical-align:-2px;'><i class='fas fa-info-circle'></i></span>";
            }
            html += `<li style='display:flex;align-items:center;gap:10px;margin-bottom:2px;'><span style='font-family:monospace;font-weight:700;color:#374151;'>${tc}</span> ${icon} <span style='font-size:0.98em;'>${statut}</span></li>`;
          });
          html += `</ul>`;
          tooltip.innerHTML = html;
          document.body.appendChild(tooltip);
          // Positionnement initial
          const rect = box.getBoundingClientRect();
          let top = rect.bottom + 8;
          let left = rect.left;
          if (left + tooltip.offsetWidth > window.innerWidth - 12) {
            left = window.innerWidth - tooltip.offsetWidth - 12;
          }
          if (top + tooltip.offsetHeight > window.innerHeight - 12) {
            top = rect.top - tooltip.offsetHeight - 8;
          }
          tooltip.style.left = left + "px";
          tooltip.style.top = top + "px";
          setTimeout(() => {
            tooltip.style.opacity = "1";
          }, 10);

          // Gestion disparition immédiate et sans bug
          function removeTooltip() {
            if (tooltip && tooltip.parentNode)
              tooltip.parentNode.removeChild(tooltip);
            box.removeEventListener("mouseleave", onMouseLeave);
            tooltip.removeEventListener("mouseenter", onTooltipEnter);
            tooltip.removeEventListener("mouseleave", onTooltipLeave);
            window.removeEventListener("scroll", removeTooltip, true);
            window.removeEventListener("resize", removeTooltip, true);
          }
          let isOverTooltip = false;
          function onMouseLeave(e) {
            if (
              e.relatedTarget === tooltip ||
              (tooltip && tooltip.contains(e.relatedTarget))
            )
              return;
            removeTooltip();
          }
          function onTooltipEnter() {
            isOverTooltip = true;
          }
          function onTooltipLeave(e) {
            if (
              e.relatedTarget === box ||
              (box && box.contains(e.relatedTarget))
            )
              return;
            removeTooltip();
          }
          box.addEventListener("mouseleave", onMouseLeave);
          tooltip.addEventListener("mouseenter", onTooltipEnter);
          tooltip.addEventListener("mouseleave", onTooltipLeave);
          window.addEventListener("scroll", removeTooltip, true);
          window.addEventListener("resize", removeTooltip, true);
        });
      })();

      // Ajout Statut Dossier (toujours avant Observations)
      let statutDossier = delivery.statut_dossier;
      if (
        !statutDossier ||
        statutDossier === "-" ||
        statutDossier === undefined ||
        statutDossier === null ||
        (typeof statutDossier === "string" && statutDossier.trim() === "")
      ) {
        statutDossier = "en attente de paiement";
      }
      createCell(statutDossier, "statut_dossier", "text", {}); // Statut Dossier
      // Observation : valeur par défaut si absente
      let observation = delivery.delivery_notes;
      if (
        !observation ||
        observation === "-" ||
        observation === undefined ||
        observation === null
      ) {
        observation = "-";
      }
      createCell(observation, "delivery_notes", "textarea", {}); // Observations
    });
    // =====================
    // Effet de surlignage interactif par section (flash coloré)
    // =====================
    // Gestion du flash coloré uniquement, les couleurs sont désormais en CSS
    const bandeAgent = document.getElementById("agentAcconierHeader");
    const bandeResp = document.getElementById("respAcconierHeader");
    const bandeLivraison = document.getElementById("respLivraisonHeader");
    const table = document.querySelector("table.table");
    if (!table) return;
    if (bandeAgent) {
      bandeAgent.onclick = function () {
        flashCells(COLS_AGENT, "highlight-blue-flash");
      };
    }
    if (bandeResp) {
      bandeResp.onclick = function () {
        flashCells(COLS_RESP, "highlight-yellow-flash");
      };
    }
    if (bandeLivraison) {
      bandeLivraison.onclick = function () {
        flashCells(COLS_LIVRAISON, "highlight-green-flash");
      };
    }
    const COLS_AGENT = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    const COLS_RESP = [18, 19];
    const COLS_LIVRAISON = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
    function flashCells(colIndexes, flashClass) {
      const rows = table.tBodies[0]?.rows;
      if (!rows) return;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        colIndexes.forEach((idx) => {
          const cell = row.cells[idx];
          if (cell) {
            cell.classList.add(flashClass);
            setTimeout(() => cell.classList.remove(flashClass), 600);
          }
        });
      }
    }
  }

  // This function is now primarily used for displaying content after inline editing or initial render (non-editing mode)
  function updateCellContent(cell, displayValue, fieldName, type) {
    if (fieldName === "statut_dossier") {
      // Affichage du statut dossier avec valeur par défaut
      let statut = displayValue;
      if (
        !statut ||
        statut === "-" ||
        statut === undefined ||
        statut === null ||
        (typeof statut === "string" && statut.trim() === "")
      ) {
        statut = "en attente de paiement";
      }
      cell.textContent = statut;
      return;
    }
    if (fieldName === "delivery_notes") {
      // Affichage de l'observation avec valeur par défaut
      let obs = displayValue;
      if (!obs || obs === undefined || obs === null) {
        obs = "-";
      }
      // Si on est en mode édition, afficher un textarea
      if (cell.classList.contains("editable-cell")) {
        cell.innerHTML = "";
        const textarea = document.createElement("textarea");
        textarea.value = obs;
        textarea.rows = 3;
        textarea.classList.add("w-full", "resize-y");
        cell.appendChild(textarea);
      } else {
        // Sinon, affichage simple
        cell.textContent = obs;
      }
      return;
    }
    // Renamed newValue to displayValue for clarity
    cell.innerHTML = ""; // Clear content before updating

    if (fieldName === "status") {
      const statusInfo = getStatusInfo(displayValue);
      const iconElement = document.createElement("i");
      iconElement.className = `fas ${statusInfo.iconClass} mr-1 ${statusInfo.tailwindColorClass}`;
      iconElement.style.color = statusInfo.hexColor; // Apply inline style for strong override

      const textSpan = document.createElement("span");
      textSpan.textContent = statusInfo.text;
      textSpan.classList.add(statusInfo.tailwindColorClass); // Also apply Tailwind class to span

      cell.appendChild(iconElement);
      cell.appendChild(textSpan);
    } else if (fieldName === "delivery_status_acconier") {
      // NEW: Handle acconier status display
      const statusInfo = getStatusInfo(displayValue);
      const iconElement = document.createElement("i");
      iconElement.className = `fas ${statusInfo.iconClass} mr-1 ${statusInfo.tailwindColorClass}`;
      iconElement.style.color = statusInfo.hexColor; // Apply inline style for strong override

      const textSpan = document.createElement("span");
      textSpan.textContent = statusInfo.text;
      textSpan.classList.add(statusInfo.tailwindColorClass); // Also apply Tailwind class to span

      cell.appendChild(iconElement);
      cell.appendChild(textSpan);
    } else if (fieldName === "is_eir_received") {
      // This block is now effectively unused for rendering the main table,
      // but kept for other potential uses or if the field is re-added elsewhere.
      if (displayValue) {
        cell.innerHTML = `<span class="eir-returned-indicator"><i class="fas fa-file-invoice"></i> Reçu</span>`;
      } else {
        cell.innerHTML = `<span>Non Reçu</span>`;
      }
    } else if (fieldName === "delivery_date") {
      // N'affiche rien si la date n'est pas renseignée ou vide
      if (displayValue) {
        const dateObj = new Date(displayValue);
        if (!isNaN(dateObj.getTime())) {
          cell.textContent = dateObj.toLocaleDateString("fr-FR");
        } else {
          cell.textContent = displayValue;
        }
      } else {
        cell.textContent = "-";
      }
    } else if (fieldName === "delivery_time" && displayValue) {
      // For delivery_time (text input), display directly (it should already be HH:MM or similar)
      cell.textContent = displayValue;
    } else if (
      fieldName === "delivery_notes" ||
      fieldName === "observation_acconier"
    ) {
      // Specific display for delivery_notes and observation_acconier
      // Replace newlines with <br> for proper display in HTML
      cell.innerHTML = (displayValue || "-").replace(/\n/g, "<br>");
    } else if (type === "datetime-local" && displayValue instanceof Date) {
      // For created_at which is a Date object
      // Affichage de la date et heure au format français
      cell.textContent = displayValue
        .toLocaleString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(",", "");
    } else if (type === "datetime-local" && typeof displayValue === "string") {
      // For created_at from backend (string)
      // If it's a string, attempt to parse it as a date and format
      const dateObj = new Date(displayValue);
      if (!isNaN(dateObj.getTime())) {
        cell.textContent = dateObj
          .toLocaleString("fr-FR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
          .replace(",", "");
      } else {
        cell.textContent = displayValue; // Fallback to raw string
      }
    } else {
      // Default for other types, including new text fields, and if displayValue is null/undefined
      cell.textContent = displayValue || "-";
    }
  }
  // =====================================================================
  // --- Fonctions de gestion de l'interface utilisateur ---
  // =====================================================================

  /**
   * Shows the loading spinner within the search button.
   * Disables the search button to prevent multiple clicks.
   * Removed all content as per user request.
   */
  function showSpinner() {
    // No longer shows spinner or disables button
  }

  /**
   * Hides the loading spinner within the search button.
   * Re-enables the search button.
   * Removed all content as per user request.
   */
  function hideSpinner() {
    // No longer hides spinner or enables button
  }

  const updateAgentStatusIndicator = () => {
    if (!agentStatusIndicator) return;

    // This indicator should always reflect "today" for the scrolling bar,
    // not necessarily the main table filter.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If mainTableDateFilter is set to a past date, the indicator might show "Agents (Date Passée)"
    // but the scrolling bar itself will still show "today's" agents.
    const selectedDateStr = mainTableDateFilter.value;
    if (selectedDateStr) {
      const selectedDate = new Date(selectedDateStr);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate.getTime() < today.getTime()) {
        agentStatusIndicator.classList.remove("status-active");
        agentStatusIndicator.classList.add("status-past-date");
        if (agentStatusText)
          agentStatusText.textContent = "Agents (Date Passée)";
        return;
      }
    }
    // Default to active for today or future dates
    agentStatusIndicator.classList.remove("status-past-date");
    agentStatusIndicator.classList.add("status-active");
    if (agentStatusText)
      agentStatusText.textContent = "Agents Actifs (Aujourd'hui)";
  };
  /**
   * Returns a sorted list of unique agent names who have performed an operation
   * (either created or delivered a delivery) on the currently selected filter date.
   * This function now strictly uses `currentMainFilterDate` for filtering.
   * @returns {Array<string>} Sorted array of unique agent names.
   */
  function getAgentsForCurrentMainDate() {
    // Get the ISO string for the date selected in the main filter, using UTC components for consistency
    // This ensures that currentMainFilterDate (which is a Date object) is normalized to UTCYYYY-MM-DD
    const selectedFilterDateISO = formatDateToISO(currentMainFilterDate);
    console.log(
      "getAgentsForCurrentMainDate: Selected filter date ISO (from filter):",
      selectedFilterDateISO
    );

    // If the selected date is in the future, no agents should appear.
    // We can check this by comparing the selectedFilterDateISO with today's ISO.
    const todayISO = formatDateToISO(new Date());
    if (selectedFilterDateISO > todayISO) {
      console.log(
        "Selected date is in the future. No agents will be displayed."
      );
      return [];
    }

    const agentsSet = new Set();
    deliveries.forEach((delivery) => {
      let isAgentActiveOnFilterDate = false;

      // Check if the delivery was created on the selected filter date (UTC comparison)
      if (delivery.created_at) {
        // Ensure delivery.created_at is treated as a Date object and then converted to UTCYYYY-MM-DD
        const createdAtDate = new Date(delivery.created_at); // Ensure it's a Date object
        const createdAtISO = formatDateToISO(createdAtDate); // Uses the now UTC-based formatDateToISO
        if (createdAtISO === selectedFilterDateISO) {
          isAgentActiveOnFilterDate = true;
          // console.log(`Agent ${delivery.employee_name} active on ${selectedFilterDateISO} via created_at: ${createdAtISO}`);
        }
      }
      // Also check if the delivery was *delivered* on the selected filter date (UTC comparison).
      // An agent is considered "active" on a day if they performed any relevant operation.
      if (!isAgentActiveOnFilterDate && delivery.delivery_date) {
        // Ensure delivery.delivery_date is treated as a Date object and then converted to UTCYYYY-MM-DD
        const deliveryDateObj = new Date(delivery.delivery_date); // Ensure it's a Date object
        if (!isNaN(deliveryDateObj.getTime())) {
          const deliveryDateISO = formatDateToISO(deliveryDateObj); // Uses the now UTC-based formatDateToISO
          if (deliveryDateISO === selectedFilterDateISO) {
            isAgentActiveOnFilterDate = true;
            // console.log(`Agent ${delivery.employee_name} active on ${selectedFilterDateISO} via delivery_date: ${deliveryDateISO}`);
          }
        }
      }

      if (isAgentActiveOnFilterDate && delivery.employee_name) {
        agentsSet.add(delivery.employee_name);
      }
    });
    const sortedAgents = Array.from(agentsSet).sort();
    console.log(
      `getAgentsForCurrentMainDate: Active agents for ${selectedFilterDateISO}:`,
      sortedAgents
    );
    return sortedAgents;
  }
  function populateStatusFilter() {
    if (!statusFilterSelect) {
      console.error("Element #statusFilterSelect not found.");
      return;
    }
    statusFilterSelect.innerHTML = '<option value="">Tous les statuts</option>';
    GLOBAL_STATUS_OPTIONS.forEach((option) => {
      const optElement = document.createElement("option");
      optElement.value = option.value;
      optElement.textContent = option.text;
      statusFilterSelect.appendChild(optElement);
    });
  }

  function applyCombinedFilters(shouldRenderTable = true) {
    // Removed showSpinner() call here as spinner is removed
    let filteredData = [...deliveries];

    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm !== "") {
      filteredData = filteredData.filter((delivery) => {
        // Check container_number, declaration_number, bl_number, dossier_number
        const containerNumberMatch =
          delivery.container_number &&
          String(delivery.container_number).toLowerCase().includes(searchTerm);
        const declarationNumberMatch =
          delivery.declaration_number &&
          String(delivery.declaration_number)
            .toLowerCase()
            .includes(searchTerm);
        const blNumberMatch =
          delivery.bl_number &&
          String(delivery.bl_number).toLowerCase().includes(searchTerm);
        const dossierNumberMatch =
          delivery.dossier_number &&
          String(delivery.dossier_number).toLowerCase().includes(searchTerm);

        return (
          containerNumberMatch ||
          declarationNumberMatch ||
          blNumberMatch ||
          dossierNumberMatch
        );
      });
    }
    const selectedStatusValue = statusFilterSelect.value;
    if (selectedStatusValue !== "") {
      const matchedOption = GLOBAL_STATUS_OPTIONS.find(
        (opt) => opt.value === selectedStatusValue
      );
      if (matchedOption) {
        const apiStatusToFilter = matchedOption.apiValue;
        filteredData = filteredData.filter((delivery) => {
          return delivery.status === apiStatusToFilter;
        });
      }
    }
    if (currentMainFilterDate) {
      console.log(
        "Applying date filter (based on created_at):", // Changed log for clarity
        currentMainFilterDate.toLocaleDateString("fr-FR")
      );
      const filterDate = normalizeDateToMidnight(currentMainFilterDate);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filteredData = filteredData.filter((delivery) => {
        let createdAtDate = null; // Only check created_at for the main filter
        if (delivery.created_at) {
          createdAtDate = new Date(delivery.created_at);
        }
        if (!createdAtDate || isNaN(createdAtDate.getTime())) return false;
        createdAtDate = normalizeDateToMidnight(createdAtDate);
        return createdAtDate >= filterDate && createdAtDate < nextDay;
      });
    } else {
      console.log("No main filter date selected.");
    }

    if (shouldRenderTable) {
      renderAdminDeliveriesTable(filteredData);
    }
    // Note: hideSpinner() is called in loadDeliveries().finally, which is triggered by applyCombinedFilters.
    // This ensures the spinner is hidden after data is fully loaded and rendered.
    return filteredData;
  }

  // =====================================================================
  // --- Fonctions de gestion des popups et modes d'édition ---
  // =====================================================================

  function handleEditButtonClick() {
    if (isEditingMode) {
      toggleEditMode(false);
    } else {
      showCodeEntryPopup();
    }
  }
  function showCodeEntryPopup() {
    if (codeEntryPopup) {
      codeEntryPopup.style.display = "flex";
      codeEntryPopup.classList.add("is-visible");
      editCodeInput.value = "";
      codeError.style.display = "none";
      editCodeInput.focus();
    }
  }

  function hideCodeEntryPopup() {
    if (codeEntryPopup) {
      codeEntryPopup.classList.remove("is-visible");
      setTimeout(() => {
        codeEntryPopup.style.display = "none";
      }, 300);
    }
  }

  function validateEditCode() {
    const enteredCode = editCodeInput.value;
    if (enteredCode === EDIT_SECRET_CODE) {
      toggleEditMode(true);
      hideCodeEntryPopup();
      showCustomAlert(
        "Vous pouvez maintenant modifier les données du tableau.",
        "info",
        3000
      );
    } else {
      codeError.style.display = "block";
      editCodeInput.value = "";
      editCodeInput.focus();
      setTimeout(() => {
        codeError.style.display = "none";
      }, 3000);
    }
  }

  function toggleEditMode(activate) {
    isEditingMode = activate;
    if (isEditingMode) {
      activateEditBtn.textContent = "Désactiver l'édition";
      activateEditBtn.classList.remove("icon-btn-company-color");
      activateEditBtn.classList.add("btn-secondary");
    } else {
      activateEditBtn.textContent = "Activer l'édition";
      activateEditBtn.classList.remove("btn-secondary");
      activateEditBtn.classList.add("icon-btn-company-color");
    }
    applyCombinedFilters();
  }

  function toggleEmployeePopup() {
    if (!employeePopup) {
      console.error("The element #employeePopup was not found!");
      return;
    }

    if (employeePopup.classList.contains("is-visible")) {
      hideEmployeePopup();
    } else {
      showEmployeePopup();
    }
  }

  function showEmployeePopup() {
    if (employeePopup) {
      employeePopup.classList.add("is-visible");
      if (employeeSearchInput) {
        employeeSearchInput.value = "";
      }
      filteredEmployees = [...uniqueEmployees];
      populateEmployeeList(filteredEmployees);

      const employeeCountDisplay = document.getElementById(
        "employeeCountDisplay"
      );
      if (employeeCountDisplay) {
        employeeCountDisplay.textContent = `(${uniqueEmployees.length} agents)`;
      }
    } else {
      console.error("The element #employeePopup was not found.");
    }
  }

  function hideEmployeePopup() {
    if (employeePopup) {
      employeePopup.classList.remove("is-visible");
    }
  }

  function filterEmployeeList() {
    const searchTerm = employeeSearchInput.value.toLowerCase().trim();
    if (searchTerm === "") {
      filteredEmployees = [...uniqueEmployees];
    } else {
      filteredEmployees = uniqueEmployees.filter((employee) =>
        employee.toLowerCase().includes(searchTerm)
      );
    }
    populateEmployeeList(filteredEmployees);
  }

  function populateEmployeeList(employeesToDisplay) {
    employeeList.innerHTML = "";

    if (employeesToDisplay.length === 0) {
      employeeList.innerHTML =
        '<li class="no-employees-message"><span>Aucun employé trouvé.</span></li>';
      return;
    }
    employeesToDisplay.forEach((employeeName) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer"; // Added flex for layout

      const spanName = document.createElement("span");
      spanName.textContent = employeeName;
      li.appendChild(spanName);

      // Add delete button for each agent
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-agent-list-item-btn";
      deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteButton.title = `Supprimer l'agent ${employeeName} et toutes ses livraisons`;
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent the li's click event from firing
        handleDeleteAgent(employeeName);
      });
      li.appendChild(deleteButton);

      li.addEventListener("click", () => {
        selectedAgentName = employeeName; // Use global selectedAgentName
        currentAgentActivityDate = new Date(); // Use global currentAgentActivityDate
        showAgentActivity(selectedAgentName, currentAgentActivityDate);
        hideEmployeePopup();
      });
      employeeList.appendChild(li);
    });
  }

  // --- Functions for the floating agent activity BOX ---
  function showAgentActivityBox() {
    if (agentActivityBox) {
      agentActivityBox.classList.add("active");
    }
  }

  function hideAgentActivityBox() {
    if (agentActivityBox) {
      agentActivityBox.style.left = "50%";
      agentActivityBox.style.top = "50%";
      agentActivityBox.style.transform = "translate(-50%, -50%) scale(0.9)";
      agentActivityBox.classList.remove("active");
    }
  }

  function navigateAgentActivityDate(offset) {
    if (!selectedAgentName) {
      // Use global selectedAgentName
      console.warn("No agent selected for date navigation.");
      return;
    }
    const newDate = new Date(currentAgentActivityDate); // Use global currentAgentActivityDate
    newDate.setDate(newDate.getDate() + offset);

    // JavaScript's Date.setDate() automatically handles month/year rollovers.
    // For example, new Date(2025, 5, 30).setDate(31) will correctly result in July 1, 2025.
    // No special logic needed for 31/06.

    currentAgentActivityDate = newDate; // Update global currentAgentActivityDate
    showAgentActivity(selectedAgentName, currentAgentActivityDate);
  }

  // Define column mappings for the agent activity table
  // Ajout d'une propriété de couleur pour les entêtes clés
  // Colonnes strictement dans l'ordre métier, sans colonnes parasites
  // Colonnes strictement selon la demande utilisateur
  // Colonnes strictement selon la demande utilisateur (sans les colonnes à exclure)
  const AGENT_TABLE_COLUMNS = [
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
    { id: "statut_dossier", label: "Statut Dossier" },
    { id: "observation", label: "Observation" },
  ];

  // Function to save column visibility to localStorage - REMOVED
  // function saveColumnVisibility(agentName, hiddenColumns) {
  //   localStorage.setItem(`agentColumns_${agentName}`, JSON.stringify(hiddenColumns));
  // }

  // Function to load column visibility from localStorage - REMOVED
  // function loadColumnVisibility(agentName) {
  //   const saved = localStorage.getItem(`agentColumns_${agentName}`);
  //   return saved ? JSON.parse(saved) : [];
  // }

  // Function to apply column visibility - REMOVED (no longer needed without column management)
  // function applyColumnVisibility(tableElement, hiddenColumns) {
  //   AGENT_TABLE_COLUMNS.forEach(col => {
  //     const elements = tableElement.querySelectorAll(`[data-column-id="${col.id}"]`);
  //     elements.forEach(el => {
  //       if (hiddenColumns.includes(col.id)) {
  //         el.classList.add("hidden-column");
  //       } else {
  //         el.classList.remove("hidden-column");
  //       }
  //     });
  //   });
  // }

  // Function to populate and manage the column selector panel - REMOVED
  // function populateColumnSelectorPanel(agentName) {
  //   let columnSelectorPanel = document.getElementById("columnSelectorPanel");
  //   if (!columnSelectorPanel) {
  //     columnSelectorPanel = document.createElement("div");
  //     columnSelectorPanel.id = "columnSelectorPanel";
  //     agentActivityBox.querySelector(".agent-activity-header").appendChild(columnSelectorPanel);
  //   }
  //   columnSelectorPanel.innerHTML = ""; // Clear previous content

  //   const savedHiddenColumns = loadColumnVisibility(agentName);

  //   AGENT_TABLE_COLUMNS.forEach(col => {
  //     if (col.fixed) return; // Skip fixed columns

  //     const label = document.createElement("label");
  //     const checkbox = document.createElement("input");
  //     checkbox.type = "checkbox";
  //     checkbox.dataset.columnId = col.id;
  //     checkbox.checked = !savedHiddenColumns.includes(col.id); // Checked if NOT hidden

  //     checkbox.addEventListener("change", (e) => {
  //       const columnId = e.target.dataset.columnId;
  //       const isChecked = e.target.checked;
  //       const currentHidden = loadColumnVisibility(agentName);

  //       let newHiddenColumns;
  //       if (isChecked) {
  //         newHiddenColumns = currentHidden.filter(id => id !== columnId);
  //       } else {
  //         newHiddenColumns = [...currentHidden, columnId];
  //       }
  //       saveColumnVisibility(agentName, newHiddenColumns);
  //       applyColumnVisibility(agentDailyDeliveriesTable, newHiddenColumns);
  //     });

  //     label.appendChild(checkbox);
  //     label.appendChild(document.createTextNode(col.label));
  //     columnSelectorPanel.appendChild(label);
  //   });

  //   // Close panel when clicking outside
  //   document.addEventListener("click", (e) => {
  //     if (columnSelectorPanel.classList.contains("show") &&
  //         !columnSelectorPanel.contains(e.target) &&
  //         !e.target.closest('.manage-columns-btn')) {
  //   }
  // });
  //}
  //       columnSelectorPanel.classList.remove("show");
  //     }
  //   });
  // }

  async function showAgentActivity(agentName, dateToDisplay = new Date()) {
    if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
    }

    try {
      if (
        !agentActivityBox ||
        !agentActivityHeaderTitle ||
        !agentDailyDeliveriesTableBody ||
        !agentSummarySection ||
        !agentDailyDeliveriesTable // Added check for the full table element
      ) {
        console.error("Missing agent activity box DOM elements.");
        showCustomAlert(
          "Impossible d'afficher le suivi de l'agent (éléments manquants).",
          "error"
        );
        return;
      }

      dateToDisplay = normalizeDateToMidnight(dateToDisplay);
      const nextDay = new Date(dateToDisplay);
      nextDay.setDate(nextDay.getDate() + 1);

      // MODIFICATION ICI : Filtrer par `created_at` au lieu de `delivery_date`
      const agentDailyDeliveries = deliveries.filter((d) => {
        // Ensure d.created_at is a valid Date object before comparison.
        const createdAtDate =
          d.created_at instanceof Date && !isNaN(d.created_at.getTime())
            ? normalizeDateToMidnight(d.created_at)
            : null; // Set to null if not a valid Date

        return (
          d.employee_name === agentName &&
          createdAtDate && // Ensure createdAtDate is not null
          createdAtDate.getTime() === dateToDisplay.getTime() // Compare timestamps
        );
      });

      // Calculate 3 years ago from today's date
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      threeYearsAgo.setHours(0, 0, 0, 0); // Normalize to start of the day

      // Filter all agent deliveries to only include those within the last 3 years
      const allAgentDeliveriesFilteredByDate = deliveries.filter(
        (d) =>
          d.employee_name === agentName &&
          d.created_at instanceof Date &&
          !isNaN(d.created_at.getTime()) &&
          d.created_at.getTime() >= threeYearsAgo.getTime()
      );

      agentDailyDeliveries.sort((a, b) => {
        // Sort by created_at (submission time) for chronological order of agent's actions
        const timeA = a.created_at || new Date(0); // Fallback to epoch if created_at is missing
        const timeB = b.created_at || new Date(0); // Fallback to epoch if created_at is missing
        return timeA.getTime() - timeB.getTime();
      });

      const formattedDate = dateToDisplay.toLocaleDateString("fr-FR");
      // Update header title and buttons
      agentActivityHeaderTitle.innerHTML = `
        <div class="header-title">Suivi de l'agent : ${agentName} — ${formattedDate}</div>
        <div class="header-buttons">
          <!-- Removed "Gérer les colonnes" button -->
          <button class="delete-daily-agent-deliveries-btn" title="Supprimer les opérations de cet agent pour cette journée">
            <i class="fas fa-trash-alt mr-1"></i> Supprimer les opérations du jour
          </button>
        </div>
      `;

      // Get the new buttons by their specific classes
      const deleteDailyDeliveriesButton =
        agentActivityHeaderTitle.querySelector(
          ".delete-daily-agent-deliveries-btn"
        );
      if (deleteDailyDeliveriesButton) {
        deleteDailyDeliveriesButton.addEventListener("click", () => {
          const deliveryIdsToDelete = agentDailyDeliveries.map((d) => d.id);
          if (deliveryIdsToDelete.length === 0) {
            showCustomAlert(
              "Aucune opération à supprimer pour cette journée.",
              "info"
            );
            return;
          }
          showConfirmationModal(
            `Êtes-vous sûr de vouloir supprimer les ${deliveryIdsToDelete.length} opérations de l'agent "${agentName}" pour le ${formattedDate} ? Cette action est irréversible.`,
            async () => {
              await deleteDeliveries(deliveryIdsToDelete);
              // After deletion, refresh the agent activity box to reflect changes
              showAgentActivity(agentName, dateToDisplay);
            }
          );
        });
      }

      // Removed manageColumnsBtn logic as the button is removed

      // Total columns for agent activity table (should match the HTML's <thead> count)
      // Count them manually from HTML: N°, Agent, Client (Nom), Client (Tél), Numéro TC(s), Lieu, Type Conteneur (pied), Contenu, N° Déclaration, N° BL, N° Dossier, Nombre de conteneurs, Compagnie Maritime, Poids, Nom du navire, Circuit, Mode de Transport, Statut de livraison (Resp. Aconiés), Observations (Resp. Aconiés), Nom agent visiteur, Transporteur, Inspecteur, Agent en Douanes, Chauffeur, Immatriculation, Tél. Chauffeur, Date Livraison, Heure Livraison, Statut, Observations
      // Total: 29 columns + 1 (Action) = 30 columns
      const AGENT_TABLE_COLUMN_COUNT = AGENT_TABLE_COLUMNS.length; // Use the defined array length

      agentDailyDeliveriesTableBody.innerHTML = "";
      // Appliquer la couleur sur les entêtes concernés (bleu, jaune, vert)
      if (agentDailyDeliveriesTable && agentDailyDeliveriesTable.tHead) {
        const ths = agentDailyDeliveriesTable.tHead.querySelectorAll("th");
        AGENT_TABLE_COLUMNS.forEach((col, idx) => {
          if (col.id === "employee_name" && ths[idx]) {
            ths[idx].classList.add("th-agent-acconier");
          }
          if (col.id === "delivery_status_acconier" && ths[idx]) {
            ths[idx].classList.add("th-resp-acconier");
          }
          if (col.id === "driver_name" && ths[idx]) {
            ths[idx].classList.add("th-resp-livraison");
          }
        });
      }
      if (agentDailyDeliveries.length === 0) {
        agentDailyDeliveriesTableBody.innerHTML = `
                                <tr>
                                    <td colspan="${AGENT_TABLE_COLUMN_COUNT}" class="text-center py-4 text-gray-500">Aucune livraison trouvée pour cet agent à cette date.</td>
                                </tr>
                            `;
      } else {
        agentDailyDeliveries.forEach((delivery, idx) => {
          const row = agentDailyDeliveriesTableBody.insertRow();
          // Populate cells based on AGENT_TABLE_COLUMNS definition
          AGENT_TABLE_COLUMNS.forEach((col) => {
            const cell = row.insertCell();
            cell.dataset.columnId = col.id; // Add data attribute for column identification
            if (col.id === "numero") {
              cell.textContent = idx + 1;
            } else if (col.id === "delivery_status_acconier") {
              const acconierStatusInfo = getStatusInfo(
                delivery.delivery_status_acconier
              );
              cell.innerHTML = `<span class="${acconierStatusInfo.tailwindColorClass}"><i class="fas ${acconierStatusInfo.iconClass} mr-1" style="color:${acconierStatusInfo.hexColor};"></i> ${acconierStatusInfo.text}</span>`;
            } else if (col.id === "created_at") {
              cell.textContent = delivery.created_at
                ? delivery.created_at.toLocaleString("fr-FR")
                : "-";
            } else if (col.id === "statut" || col.id === "status") {
              // Affichage du statut "X sur Y livrés" comme dans le tableau général
              // On récupère toutes les livraisons du même dossier
              const dossierNumber = delivery.dossier_number;
              const allSameDossier = deliveries.filter(
                (d) => d.dossier_number === dossierNumber
              );
              // Agrège tous les numéros de conteneur du dossier (pour éviter les doublons)
              let allContainers = [];
              allSameDossier.forEach((d) => {
                let tcList = [];
                if (Array.isArray(d.container_number)) {
                  tcList = d.container_number.filter(Boolean);
                } else if (typeof d.container_number === "string") {
                  tcList = d.container_number.split(/[,;\s]+/).filter(Boolean);
                }
                allContainers = allContainers.concat(tcList);
              });
              allContainers = Array.from(new Set(allContainers));
              const total = allContainers.length;
              // Statut de chaque conteneur : livré ou non ?
              let delivered = 0;
              allContainers.forEach((tc) => {
                const found = allSameDossier.find((d) => {
                  let tcList = [];
                  if (Array.isArray(d.container_number)) {
                    tcList = d.container_number.filter(Boolean);
                  } else if (typeof d.container_number === "string") {
                    tcList = d.container_number
                      .split(/[,;\s]+/)
                      .filter(Boolean);
                  }
                  return tcList.includes(tc);
                });
                let isDelivered = false;
                if (found && found.container_statuses) {
                  if (
                    typeof found.container_statuses === "object" &&
                    !Array.isArray(found.container_statuses)
                  ) {
                    const status = found.container_statuses[tc];
                    if (
                      typeof status === "string" &&
                      ["delivered", "livré", "livree", "livreee"].includes(
                        status.trim().toLowerCase()
                      )
                    ) {
                      isDelivered = true;
                    }
                  } else if (Array.isArray(found.container_statuses)) {
                    let tcList = [];
                    if (Array.isArray(found.container_number)) {
                      tcList = found.container_number.filter(Boolean);
                    } else if (typeof found.container_number === "string") {
                      tcList = found.container_number
                        .split(/[,;\s]+/)
                        .filter(Boolean);
                    }
                    const idx = tcList.indexOf(tc);
                    if (
                      idx !== -1 &&
                      typeof found.container_statuses[idx] === "string" &&
                      found.container_statuses[idx].trim().toLowerCase() ===
                        "delivered"
                    ) {
                      isDelivered = true;
                    }
                  }
                } else if (found && typeof found.status === "string") {
                  const s = found.status.trim().toLowerCase();
                  if (s === "livré" || s === "delivered") {
                    isDelivered = true;
                  }
                }
                if (isDelivered) {
                  delivered++;
                }
              });
              // Affichage dynamique
              const box = document.createElement("div");
              box.style.display = "inline-block";
              box.style.padding = "4px 12px";
              box.style.borderRadius = "8px";
              box.style.fontWeight = "bold";
              box.style.fontSize = "0.98em";
              box.style.letterSpacing = "0.5px";
              box.style.boxShadow = "0 1px 6px rgba(30,41,59,0.07)";
              box.style.border = "1.5px solid #eab308";
              box.style.background =
                delivered === total && total > 0 ? "#dcfce7" : "#fef9c3";
              box.style.color =
                delivered === total && total > 0 ? "#15803d" : "#a16207";
              if (total === 0) {
                box.textContent = "-";
              } else if (delivered === 0) {
                box.textContent = `0 sur ${total} livrés`;
              } else if (delivered === total) {
                box.textContent =
                  total === 1 ? "Livré" : `${total}/${total} livrés`;
              } else {
                box.textContent = `${delivered} sur ${total} livrés`;
              }
              // Ajout du tooltip flottant au survol du statut
              box.style.cursor = "pointer";
              box.addEventListener("mouseenter", function (e) {
                // Supprimer tout tooltip existant
                document
                  .querySelectorAll(".agent-status-tooltip")
                  .forEach((t) => t.remove());
                const tooltip = document.createElement("div");
                tooltip.className = "agent-status-tooltip";
                tooltip.style.position = "fixed";
                tooltip.style.zIndex = 9999;
                tooltip.style.background = "#fffbe8";
                tooltip.style.border = "1.5px solid #eab308";
                tooltip.style.borderRadius = "10px";
                tooltip.style.boxShadow = "0 4px 24px rgba(30,41,59,0.13)";
                tooltip.style.padding = "12px 18px";
                tooltip.style.fontSize = "1em";
                tooltip.style.color = "#444";
                tooltip.style.minWidth = "220px";
                tooltip.style.maxWidth = "350px";
                tooltip.style.pointerEvents = "none";
                tooltip.style.transition = "opacity 0.18s";
                // Construction du contenu détaillé
                let html = `<div style='font-weight:bold;margin-bottom:6px;'>Détail des statuts des conteneurs :</div>`;
                if (allContainers.length === 0) {
                  html += `<div style='color:#888;'>Aucun conteneur trouvé pour ce dossier.</div>`;
                } else {
                  html += `<ul style='padding-left:0;margin:0;'>`;
                  allContainers.forEach((tc) => {
                    const found = allSameDossier.find((d) => {
                      let tcList = [];
                      if (Array.isArray(d.container_number)) {
                        tcList = d.container_number.filter(Boolean);
                      } else if (typeof d.container_number === "string") {
                        tcList = d.container_number
                          .split(/[,;\s]+/)
                          .filter(Boolean);
                      }
                      return tcList.includes(tc);
                    });
                    let status = "-";
                    let color = "#a16207";
                    let icon = "fa-box";
                    if (found && found.container_statuses) {
                      if (
                        typeof found.container_statuses === "object" &&
                        !Array.isArray(found.container_statuses)
                      ) {
                        const s = found.container_statuses[tc];
                        if (typeof s === "string") {
                          if (
                            [
                              "delivered",
                              "livré",
                              "livree",
                              "livreee",
                            ].includes(s.trim().toLowerCase())
                          ) {
                            status = "Livré";
                            color = "#15803d";
                            icon = "fa-check-circle";
                          } else {
                            status = s;
                          }
                        }
                      } else if (Array.isArray(found.container_statuses)) {
                        let tcList = [];
                        if (Array.isArray(found.container_number)) {
                          tcList = found.container_number.filter(Boolean);
                        } else if (typeof found.container_number === "string") {
                          tcList = found.container_number
                            .split(/[,;\s]+/)
                            .filter(Boolean);
                        }
                        const idx = tcList.indexOf(tc);
                        if (
                          idx !== -1 &&
                          typeof found.container_statuses[idx] === "string"
                        ) {
                          const s = found.container_statuses[idx];
                          if (s.trim().toLowerCase() === "delivered") {
                            status = "Livré";
                            color = "#15803d";
                            icon = "fa-check-circle";
                          } else {
                            status = s;
                          }
                        }
                      }
                    } else if (found && typeof found.status === "string") {
                      const s = found.status.trim().toLowerCase();
                      if (s === "livré" || s === "delivered") {
                        status = "Livré";
                        color = "#15803d";
                        icon = "fa-check-circle";
                      } else {
                        status = found.status;
                      }
                    }
                    html += `<li style='list-style:none;margin-bottom:2px;display:flex;align-items:center;'><i class='fas ${icon}' style='color:${color};margin-right:7px;'></i><span style='font-weight:500;'>${tc}</span> <span style='margin-left:10px;color:${color};font-weight:bold;'>${status}</span></li>`;
                  });
                  html += `</ul>`;
                }
                tooltip.innerHTML = html;
                document.body.appendChild(tooltip);
                // Positionnement du tooltip
                const rect = box.getBoundingClientRect();
                let top = rect.bottom + 8;
                let left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
                if (left < 8) left = 8;
                if (left + tooltip.offsetWidth > window.innerWidth - 8)
                  left = window.innerWidth - tooltip.offsetWidth - 8;
                if (top + tooltip.offsetHeight > window.innerHeight - 8)
                  top = rect.top - tooltip.offsetHeight - 8;
                if (top < 8) top = 8;
                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
                tooltip.style.opacity = 1;
                // Disparition automatique
                const removeTooltip = () => {
                  tooltip.style.opacity = 0;
                  setTimeout(() => {
                    tooltip.remove();
                  }, 180);
                };
                box.addEventListener("mouseleave", removeTooltip, {
                  once: true,
                });
                window.addEventListener("scroll", removeTooltip, {
                  once: true,
                });
                window.addEventListener("resize", removeTooltip, {
                  once: true,
                });
              });
              cell.appendChild(box);
            } else if (col.id === "actions") {
              const deleteButton = document.createElement("button");
              deleteButton.className =
                "btn btn-sm btn-danger delete-individual-delivery-btn";
              deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
              deleteButton.title = "Supprimer cette opération";
              deleteButton.addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent row click from interfering
                deleteDelivery(delivery.id); // Call the function to delete a single delivery
              });
              cell.appendChild(deleteButton);
            } else {
              cell.textContent = delivery[col.id] || "-";
            }
          });
        });
      }
      // Apply column visibility after rendering the table - REMOVED
      // applyColumnVisibility(agentDailyDeliveriesTable, loadColumnVisibility(agentName));

      // Call updateAgentSummary AFTER the table is populated
      updateAgentSummary(
        agentName,
        agentDailyDeliveries,
        allAgentDeliveriesFilteredByDate
      ); // Use filtered data here
      showAgentActivityBox();
    } catch (error) {
      console.error("Error displaying agent activity:", error);
      showCustomAlert(`Erreur : ${error.message}`, "error");
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
    }
  }
  async function handleDeleteAgent(agentName) {
    if (!uniqueEmployees.includes(agentName)) {
      showCustomAlert(
        `Agent \"${agentName}\" non trouvé localement. Il a peut-être déjà été supprimé.`,
        "info",
        5000
      );
      hideAgentActivityBox();
      await loadDeliveries();
      applyCombinedFilters();
      selectedAgentName = null; // Use global selectedAgentName
      return;
    }

    const confirmOverlay = document.createElement("div");
    confirmOverlay.className = "confirm-overlay";
    confirmOverlay.style.position = "fixed";
    confirmOverlay.style.top = "0";
    confirmOverlay.style.left = "0";
    confirmOverlay.style.width = "100%";
    confirmOverlay.style.height = "100%";
    confirmOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    confirmOverlay.style.display = "flex";
    confirmOverlay.style.justifyContent = "center";
    confirmOverlay.style.alignItems = "center";
    confirmOverlay.style.zIndex = "9999"; // Ensure it's on top
    confirmOverlay.innerHTML = `
                <div class="confirm-box">
                  <p>Êtes-vous sûr de vouloir supprimer l'agent "${agentName}" et TOUTES ses livraisons associées de la base de données ? Cette action est irréversible.</p>
                  <div class="confirm-buttons">
                    <button id="confirmYes" class="btn btn-danger">Oui, Supprimer</button>
                    <button id="confirmNo" class="btn btn-secondary">Non, Annuler</button>
                  </div>
                </div>
            `;
    document.body.appendChild(confirmOverlay);
    document.body.style.overflow = "hidden";

    const confirmDelete = await new Promise((resolve) => {
      const handleKeyDown = (e) => {
        if (e.key === "Enter") {
          document.removeEventListener("keydown", handleKeyDown);
          confirmOverlay.remove();
          document.body.style.overflow = "";
          resolve(true);
        } else if (e.key === "Escape") {
          document.removeEventListener("keydown", handleKeyDown);
          confirmOverlay.remove();
          document.body.style.overflow = "";
          resolve(false);
        }
      };
      document.addEventListener("keydown", handleKeyDown);

      document.getElementById("confirmYes").onclick = () => {
        document.removeEventListener("keydown", handleKeyDown);
        confirmOverlay.remove();
        document.body.style.overflow = "";
        resolve(true);
      };
      document.getElementById("confirmNo").onclick = () => {
        document.removeEventListener("keydown", handleKeyDown);
        confirmOverlay.remove();
        document.body.style.overflow = "";
        resolve(false);
      };
    });

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/agents/${encodeURIComponent(agentName)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (jsonError) {
          console.warn(
            `Could not parse error response as JSON for agent deletion. Response:`,
            errorText
          );
          errorData.message = "Server response format error.";
        }
        throw new Error(
          `Server Error: ${errorData.message || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Agent deletion successful:", result);
      showCustomAlert(
        `Agent \"${agentName}\" et toutes ses livraisons ont été supprimés.`,
        "success",
        5000
      );

      // Refresh all data and UI
      await loadDeliveries();
      hideAgentActivityBox();
      applyCombinedFilters();
      selectedAgentName = null; // Use global selectedAgentName
    } catch (error) {
      console.error("Agent deletion failed:", error);
      showCustomAlert(
        `La suppression de l'agent a échoué : ${error.message}`,
        "error",
        7000
      );
    }
  }
  /**
   * Calculates summary data for a given array of deliveries.
   * @param {Array<Object>} deliveriesArray - The array of delivery objects.
   * @returns {Object} An object containing aggregated summary data.
   */
  function calculateSummaryData(deliveriesArray) {
    const data = {
      totalDeliveries: deliveriesArray.length,
      containerContents: {}, // { 'Type A': count, 'Type B': count }
      uniqueDeclarationNumbers: new Set(),
      uniqueBLNumbers: new Set(),
      uniqueDossierNumbers: new Set(),
      totalContainers: 0,
      acconierStatusCounts: {}, // { 'Mise en livraison': count, 'Traité Acconier': count }
      generalStatusCounts: {}, // { 'Livré': count, 'En attente': count }
      uniqueDeliveryLocations: new Set(), // Pour "Lieu de livraison"
      transporterModes: {}, // Pour Mode de Transport
    };

    deliveriesArray.forEach((d) => {
      // Contenu
      const contentKey = d.container_type_and_content || "Non spécifié";
      data.containerContents[contentKey] =
        (data.containerContents[contentKey] || 0) +
        (d.number_of_containers || 1);

      // N° Déclaration, N° BL, N° Dossier
      if (d.declaration_number)
        data.uniqueDeclarationNumbers.add(d.declaration_number);
      if (d.bl_number) data.uniqueBLNumbers.add(d.bl_number);
      if (d.dossier_number) data.uniqueDossierNumbers.add(d.dossier_number);

      // Nombre de conteneurs
      data.totalContainers += d.number_of_containers || 0;

      // Statut de livraison (Resp. Aconiés) : traduction Cleared_by_acconier en français
      const acconierStatusInfo = getStatusInfo(d.delivery_status_acconier);
      let statutAcconier = acconierStatusInfo.text;
      if (statutAcconier && typeof statutAcconier === "string") {
        const txt = statutAcconier.trim().toLowerCase();
        if (
          [
            "cleared_by_acconier",
            "clearedbyacconier",
            "cleared-acconier",
            "cleared acconier",
          ].includes(txt)
        ) {
          statutAcconier = "Validé par Acconier";
        }
      }
      data.acconierStatusCounts[statutAcconier] =
        (data.acconierStatusCounts[statutAcconier] || 0) + 1;

      // Statut (Général) : calculé comme dans le tableau agent (X sur Y livrés)
      // On récupère toutes les livraisons du même dossier
      const dossierNumber = d.dossier_number;
      const allSameDossier = deliveriesArray.filter(
        (d2) => d2.dossier_number === dossierNumber
      );
      // Agrège tous les numéros de conteneur du dossier (pour éviter les doublons)
      let allContainers = [];
      allSameDossier.forEach((d2) => {
        let tcList = [];
        if (Array.isArray(d2.container_number)) {
          tcList = d2.container_number.filter(Boolean);
        } else if (typeof d2.container_number === "string") {
          tcList = d2.container_number.split(/[,;\s]+/).filter(Boolean);
        }
        allContainers = allContainers.concat(tcList);
      });
      allContainers = Array.from(new Set(allContainers));
      const total = allContainers.length;
      let delivered = 0;
      allContainers.forEach((tc) => {
        const found = allSameDossier.find((d2) => {
          let tcList = [];
          if (Array.isArray(d2.container_number)) {
            tcList = d2.container_number.filter(Boolean);
          } else if (typeof d2.container_number === "string") {
            tcList = d2.container_number.split(/[,;\s]+/).filter(Boolean);
          }
          return tcList.includes(tc);
        });
        let isDelivered = false;
        if (found && found.container_statuses) {
          if (
            typeof found.container_statuses === "object" &&
            !Array.isArray(found.container_statuses)
          ) {
            const status = found.container_statuses[tc];
            if (
              typeof status === "string" &&
              ["delivered", "livré", "livree", "livreee"].includes(
                status.trim().toLowerCase()
              )
            ) {
              isDelivered = true;
            }
          } else if (Array.isArray(found.container_statuses)) {
            let tcList = [];
            if (Array.isArray(found.container_number)) {
              tcList = found.container_number.filter(Boolean);
            } else if (typeof found.container_number === "string") {
              tcList = found.container_number.split(/[,;\s]+/).filter(Boolean);
            }
            const idx = tcList.indexOf(tc);
            if (
              idx !== -1 &&
              typeof found.container_statuses[idx] === "string" &&
              found.container_statuses[idx].trim().toLowerCase() === "delivered"
            ) {
              isDelivered = true;
            }
          }
        } else if (found && typeof found.status === "string") {
          const s = found.status.trim().toLowerCase();
          if (s === "livré" || s === "delivered") {
            isDelivered = true;
          }
        }
        if (isDelivered) {
          delivered++;
        }
      });
      // Génère le texte comme dans le tableau agent
      let statutGeneral = "-";
      if (total === 0) {
        statutGeneral = "-";
      } else if (delivered === 0) {
        statutGeneral = `0 sur ${total} livrés`;
      } else if (delivered === total) {
        statutGeneral = total === 1 ? "Livré" : `${total}/${total} livrés`;
      } else {
        statutGeneral = `${delivered} sur ${total} livrés`;
      }
      data.generalStatusCounts[statutGeneral] =
        (data.generalStatusCounts[statutGeneral] || 0) + 1;

      // Lieu de livraison
      if (d.lieu) data.uniqueDeliveryLocations.add(d.lieu);

      // Mode de Transport
      if (d.transporter_mode) {
        const mode = d.transporter_mode;
        data.transporterModes[mode] = (data.transporterModes[mode] || 0) + 1;
      }
    });

    return data;
  }

  /**
   * Renders summary items into a given parent element.
   * @param {HTMLElement} parentElement - The DOM element to append summary items to.
   * @param {Object} summaryData - The data calculated by `calculateSummaryData`.
   */
  function renderSummaryItems(parentElement, summaryData) {
    const createSummaryItem = (label, value) => {
      const div = document.createElement("div");
      div.classList.add("summary-item");
      div.innerHTML = `<strong>${label} :</strong> <span>${value}</span>`;
      return div;
    };

    parentElement.appendChild(
      createSummaryItem("Livraisons totales", summaryData.totalDeliveries)
    );

    // Contenu
    let containerContentsText = Object.entries(summaryData.containerContents)
      .map(([type, count]) => `${count} x ${type}`)
      .join(", ");
    parentElement.appendChild(
      createSummaryItem("Contenu", containerContentsText || "-")
    );

    // N° Déclaration
    parentElement.appendChild(
      createSummaryItem(
        "N° Déclaration",
        summaryData.uniqueDeclarationNumbers.size || "-"
      )
    );

    // N° BL
    parentElement.appendChild(
      createSummaryItem("N° BL", summaryData.uniqueBLNumbers.size || "-")
    );

    // N° Dossier
    parentElement.appendChild(
      createSummaryItem(
        "N° Dossier",
        summaryData.uniqueDossierNumbers.size || "-"
      )
    );

    // Nombre de conteneurs
    parentElement.appendChild(
      createSummaryItem(
        "Nombre de conteneurs",
        summaryData.totalContainers || "-"
      )
    );

    // Mode de Transport
    let transporterModesText = Object.entries(summaryData.transporterModes)
      .map(([mode, count]) => `${count} x ${mode}`)
      .join(", ");
    parentElement.appendChild(
      createSummaryItem("Mode de Transport", transporterModesText || "-")
    );

    // Statut Dossier
    let statutDossierText = Object.entries(
      summaryData.statutDossierCounts || {}
    )
      .map(([status, count]) => `${count} ${status}`)
      .join(", ");
    parentElement.appendChild(
      createSummaryItem("Statut Dossier", statutDossierText || "-")
    );

    // Observation
    let observationText = Object.entries(summaryData.observationCounts || {})
      .map(([obs, count]) => `${count} ${obs}`)
      .join(", ");
    parentElement.appendChild(
      createSummaryItem("Observation", observationText || "-")
    );

    // Statut (Général)
    let generalStatusText = Object.entries(summaryData.generalStatusCounts)
      .map(([status, count]) => `${count} ${status}`)
      .join(", ");
    parentElement.appendChild(
      createSummaryItem("Statut (Général)", generalStatusText || "-")
    );

    // Lieu de livraison
    let deliveryLocationsText = Array.from(
      summaryData.uniqueDeliveryLocations
    ).join(", ");
    parentElement.appendChild(
      createSummaryItem("Lieu de livraison", deliveryLocationsText || "-")
    );
  }

  function updateAgentSummary(
    employeeName,
    dailyDeliveries,
    allAgentDeliveriesFilteredByDate // Use the filtered data here
  ) {
    if (!agentSummarySection) {
      console.error(
        "The DOM element for agent summary (#agentSummarySection) is missing."
      );
      return;
    }
    agentSummarySection.innerHTML = ""; // Clear previous content

    // Create a wrapper for the table to ensure it appears first
    const tableContainerWrapper = document.createElement("div");
    tableContainerWrapper.classList.add(
      "agent-activity-table-wrapper",
      "overflow-x-auto",
      "mb-6"
    );
    tableContainerWrapper.appendChild(agentDailyDeliveriesTable); // Append the actual table element here

    // Append the table wrapper to the agentSummarySection (which is the main content area)
    agentSummarySection.appendChild(tableContainerWrapper);

    // --- Daily Summary Calculations ---
    const dailySummaryData = calculateSummaryData(dailyDeliveries);

    // --- Daily Summary Section ---
    const currentDaySummaryBlock = document.createElement("div");
    currentDaySummaryBlock.classList.add("summary-block"); // Add new styling class

    const currentDayHeader = document.createElement("h4");
    currentDayHeader.textContent = `Résumé du jour actuel (${currentAgentActivityDate.toLocaleDateString(
      "fr-FR"
    )})`;
    currentDayHeader.classList.add("summary-block-header"); // Add new styling class
    currentDaySummaryBlock.appendChild(currentDayHeader);
    renderSummaryItems(currentDaySummaryBlock, dailySummaryData);
    agentSummarySection.appendChild(currentDaySummaryBlock);

    // --- Grand Totals Calculations ---
    const grandTotalSummaryData = calculateSummaryData(
      allAgentDeliveriesFilteredByDate
    ); // Use filtered data here

    // --- Grand Totals Section ---
    const grandTotalContainer = document.createElement("div");
    grandTotalContainer.classList.add("grand-total-summary"); // Existing class, now with enhanced styles

    const grandTotalHeader = document.createElement("h4");
    grandTotalHeader.textContent = `Grand Total Historique`;
    grandTotalHeader.classList.add("summary-block-header"); // Add new styling class
    grandTotalContainer.appendChild(grandTotalHeader);
    renderSummaryItems(grandTotalContainer, grandTotalSummaryData);
    agentSummarySection.appendChild(grandTotalContainer);

    // --- Add the "View Full History" button ---
    const toggleHistoryButton = document.createElement("button");
    toggleHistoryButton.id = "toggleMonthlyHistoryBtn";
    toggleHistoryButton.classList.add(
      "btn",
      "btn-primary",
      "mt-3",
      "mb-3",
      "w-full",
      "py-2"
    );
    toggleHistoryButton.textContent = "Voir Historique Complet";
    agentSummarySection.appendChild(toggleHistoryButton);

    // --- Monthly History (New Section) ---
    const monthlyHistoryContainer = document.createElement("div");
    monthlyHistoryContainer.classList.add("monthly-history-section");
    monthlyHistoryContainer.id = "agentMonthlyHistorySection";
    monthlyHistoryContainer.style.display = "none"; // Initially hidden

    const monthlyHistoryHeader = document.createElement("h4");
    monthlyHistoryHeader.textContent = `Historique par mois`;
    monthlyHistoryHeader.classList.add(
      "text-lg",
      "font-bold",
      "text-gray-700",
      "mt-4",
      "mb-2"
    );
    monthlyHistoryContainer.appendChild(monthlyHistoryHeader);

    const monthlyData = {}; // { 'YYYY-MM': { 'YYYY-MM-DD': { deliveries: [], eirValidated: 0, eirPending: 0 } } }

    allAgentDeliveriesFilteredByDate.sort(
      // Use filtered data here
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    ); // Sort by created_at descending
    allAgentDeliveriesFilteredByDate.forEach((d) => {
      // Iterate over filtered data
      const monthKey = d.created_at.toISOString().substring(0, 7); //YYYY-MM
      const dayKey = d.created_at.toISOString().substring(0, 10); //YYYY-MM-DD

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      if (!monthlyData[monthKey][dayKey]) {
        monthlyData[monthKey][dayKey] = {
          deliveriesCount: 0,
          eirValidated: 0, // Keeping for internal calculation if needed, but not displayed
          eirPending: 0, // Keeping for internal calculation if needed, but not displayed
          statuses: {},
          acconierStatuses: {}, // Added for acconier status
          containerTypes: {},
          uniqueDeclarationNumbers: new Set(),
          uniqueBLNumbers: new Set(),
          uniqueDossierNumbers: new Set(),
          totalContainers: 0,
          uniqueDeliveryLocations: new Set(), // NOUVEAU: Lieu de livraison pour l'historique mensuel
        };
      }

      monthlyData[monthKey][dayKey].deliveriesCount++;
      if (d.is_eir_received) {
        monthlyData[monthKey][dayKey].eirValidated++;
      } else if (d.status === "delivered") {
        monthlyData[monthKey][dayKey].eirPending++;
      }

      const frenchStatusForHistory = getStatusInfo(d.status).text;
      if (frenchStatusForHistory) {
        monthlyData[monthKey][dayKey].statuses[frenchStatusForHistory] =
          (monthlyData[monthKey][dayKey].statuses[frenchStatusForHistory] ||
            0) + 1;
      }

      const acconierStatusForHistory = getStatusInfo(
        d.delivery_status_acconier
      ).text;
      if (acconierStatusForHistory) {
        monthlyData[monthKey][dayKey].acconierStatuses[
          acconierStatusForHistory
        ] =
          (monthlyData[monthKey][dayKey].acconierStatuses[
            acconierStatusForHistory
          ] || 0) + 1;
      }

      const containerType = d.container_type_and_content || "Non spécifié";
      monthlyData[monthKey][dayKey].containerTypes[containerType] =
        (monthlyData[monthKey][dayKey].containerTypes[containerType] || 0) +
        (d.number_of_containers || 1);

      if (d.declaration_number)
        monthlyData[monthKey][dayKey].uniqueDeclarationNumbers.add(
          d.declaration_number
        );
      if (d.bl_number)
        monthlyData[monthKey][dayKey].uniqueBLNumbers.add(d.bl_number);
      if (d.dossier_number)
        monthlyData[monthKey][dayKey].uniqueDossierNumbers.add(
          d.dossier_number
        );
      monthlyData[monthKey][dayKey].totalContainers +=
        d.number_of_containers || 0;
      if (d.lieu)
        monthlyData[monthKey][dayKey].uniqueDeliveryLocations.add(d.lieu); // NOUVEAU: Lieu de livraison
    });

    const sortedMonthKeys = Object.keys(monthlyData).sort().reverse();

    sortedMonthKeys.forEach((monthKey) => {
      const monthDiv = document.createElement("div");
      monthDiv.classList.add("monthly-history-month");

      const monthName = new Date(monthKey + "-01").toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
      });
      const monthHeader = document.createElement("h5");
      monthHeader.textContent = monthName;
      monthDiv.appendChild(monthHeader);

      const sortedDayKeys = Object.keys(monthlyData[monthKey]).sort().reverse();

      sortedDayKeys.forEach((dayKey) => {
        const dayData = monthlyData[monthKey][dayKey];
        const formattedDay = new Date(dayKey).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        const daySummaryDiv = document.createElement("div");
        daySummaryDiv.classList.add("daily-summary-item");

        let statusSummary = Object.entries(dayData.statuses)
          .map(([status, count]) => `${count} ${status}`)
          .join(", ");
        if (statusSummary)
          statusSummary = ` (Statut Général: ${statusSummary})`;

        let acconierStatusSummary = Object.entries(dayData.acconierStatuses)
          .map(([status, count]) => `${count} ${status}`)
          .join(", ");
        if (acconierStatusSummary)
          acconierStatusSummary = ` (Statut Acconier: ${acconierStatusSummary})`;

        let containerTypeSummary = Object.entries(dayData.containerTypes)
          .map(([type, count]) => `${count}x ${type}`)
          .join(", ");
        if (containerTypeSummary)
          containerTypeSummary = ` (Contenu: ${containerTypeSummary})`;

        let deliveryLocationsSummary = Array.from(
          dayData.uniqueDeliveryLocations
        ).join(", ");
        if (deliveryLocationsSummary)
          deliveryLocationsSummary = ` (Lieux: ${deliveryLocationsSummary})`;

        daySummaryDiv.innerHTML = `<strong>${formattedDay} :</strong>
                                        <span>${dayData.deliveriesCount} livraisons.
                                        N° Déclaration: ${dayData.uniqueDeclarationNumbers.size}, N° BL: ${dayData.uniqueBLNumbers.size}, N° Dossier: ${dayData.uniqueDossierNumbers.size}, Conteneurs: ${dayData.totalContainers}.
                                        ${statusSummary}${acconierStatusSummary}${containerTypeSummary}${deliveryLocationsSummary}
                                        </span>`;
        monthDiv.appendChild(daySummaryDiv);
      });
      monthlyHistoryContainer.appendChild(monthDiv);
    });

    if (Object.keys(monthlyData).length === 0) {
      const noHistoryMsg = document.createElement("p");
      noHistoryMsg.textContent =
        "Aucun historique mensuel trouvé pour cet agent.";
      noHistoryMsg.style.textAlign = "center";
      noHistoryMsg.style.color = "#777";
      monthlyHistoryContainer.appendChild(noHistoryMsg);
    }
    agentSummarySection.appendChild(monthlyHistoryContainer);

    toggleHistoryButton.onclick = () => {
      if (monthlyHistoryContainer.style.display === "none") {
        monthlyHistoryContainer.style.display = "block";
        toggleHistoryButton.textContent = "Masquer Historique";
        agentActivityBox.scrollTop = agentActivityBox.scrollHeight;
      } else {
        monthlyHistoryContainer.style.display = "none";
        toggleHistoryButton.textContent = "Voir Historique Complet";
      }
    };
  }

  /**
   * Generates a PDF of the current agent-specific deliveries table.
   */
  async function generateAgentPdf() {
    if (!agentDailyDeliveriesTable) {
      showCustomAlert(
        "Le tableau de suivi de l'agent n'a pas été trouvé pour la génération PDF.",
        "error"
      );
      return;
    }

    if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
    }

    let tempTableContainer;
    try {
      const { jsPDF } = window.jspdf;
      if (!jsPDF) {
        throw new Error("jsPDF library not loaded.");
      }
      if (!window.html2canvas) {
        throw new Error("html2canvas library not loaded.");
      }

      const doc = new jsPDF("l", "pt", "a4"); // Landscape, points, A4 size
      const margin = 20;

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      tempTableContainer = document.createElement("div");
      tempTableContainer.style.position = "absolute";
      tempTableContainer.style.left = "-9999px";
      tempTableContainer.style.width = `${pageWidth}pt`;
      document.body.appendChild(tempTableContainer);

      // Clone the agent's table
      const clonedTable = agentDailyDeliveriesTable.cloneNode(true);

      // Apply PDF-specific styles to the cloned table
      clonedTable.style.width = "100%";
      clonedTable.style.maxWidth = "none";
      clonedTable.style.borderCollapse = "collapse";
      clonedTable.style.tableLayout = "fixed"; // Use fixed layout for predictable column widths in PDF

      // Ensure all cells have borders and padding for PDF
      clonedTable.querySelectorAll("th, td").forEach((cell) => {
        cell.style.padding = "8px";
        cell.style.border = "1px solid #ddd";
        cell.style.whiteSpace = "normal"; // Allow text wrapping
        cell.style.wordBreak = "break-word"; // Ensure long words break
        // Remove any interactive elements or their specific styling
        const statusSpan = cell.querySelector("span[class*='text-']");
        if (statusSpan) {
          const icon = statusSpan.querySelector("i");
          if (icon) {
            icon.style.color = statusSpan.style.color || ""; // Keep explicit color if set
          }
        }
      });
      // Hide the individual delete buttons in the cloned table for PDF
      clonedTable
        .querySelectorAll(".delete-individual-delivery-btn")
        .forEach((btn) => {
          btn.style.display = "none";
        });

      tempTableContainer.appendChild(clonedTable);

      const canvas = await html2canvas(clonedTable, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      doc.setFontSize(10);

      while (heightLeft > 0) {
        if (position > 0) {
          doc.addPage();
        }

        const pageContentHeight = pageHeight - 2 * margin;

        doc.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          imgWidth,
          imgHeight,
          null,
          null,
          null,
          0,
          -position
        );

        // Add page number at the bottom right
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          pageWidth - margin,
          pageHeight - margin,
          { align: "right" }
        );

        heightLeft -= pageContentHeight; // Subtract full page height
        position += pageContentHeight; // Move to the next slice position
      }

      doc.save(
        `Suivi_Agent_${selectedAgentName}_${currentAgentActivityDate.toLocaleDateString(
          "fr-FR"
        )}.pdf`
      );
      showCustomAlert(
        "Le PDF du suivi de l'agent a été généré avec succès !",
        "success"
      );
    } catch (error) {
      showCustomAlert(
        `Erreur lors de la génération du PDF de l'agent: ${error.message}`,
        "error",
        7000
      );
      console.error("Error generating agent PDF:", error);
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
      if (tempTableContainer && tempTableContainer.parentNode) {
        tempTableContainer.parentNode.removeChild(tempTableContainer);
      }
    }
  }

  // NEW: Function to generate PDF of the main deliveries table
  async function generateDeliveriesPdf() {
    if (!deliveriesTable) {
      showCustomAlert(
        "Le tableau principal des livraisons n'a pas été trouvé pour la génération PDF.",
        "error"
      );
      return;
    }

    if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
    }

    let tempTableContainer;
    try {
      const { jsPDF } = window.jspdf;
      if (!jsPDF) {
        throw new Error("jsPDF library not loaded.");
      }
      if (!window.html2canvas) {
        throw new Error("html2canvas library not loaded.");
      }

      const doc = new jsPDF("l", "pt", "a4"); // Landscape, points, A4 size
      const margin = 20;

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      tempTableContainer = document.createElement("div");
      tempTableContainer.style.position = "absolute";
      tempTableContainer.style.left = "-9999px";
      tempTableContainer.style.width = `${pageWidth}pt`;
      document.body.appendChild(tempTableContainer);

      // Clone the main table
      const clonedTable = deliveriesTable.cloneNode(true);

      // Apply PDF-specific styles to the cloned table
      clonedTable.style.width = "100%";
      clonedTable.style.maxWidth = "none";
      clonedTable.style.borderCollapse = "collapse";
      clonedTable.style.tableLayout = "fixed"; // Use fixed layout for predictable column widths in PDF

      // Ensure all cells have borders and padding for PDF
      clonedTable.querySelectorAll("th, td").forEach((cell) => {
        cell.style.padding = "8px";
        cell.style.border = "1px solid #ddd";
        cell.style.whiteSpace = "normal"; // Allow text wrapping
        cell.style.wordBreak = "break-word"; // Ensure long words break

        // Handle dropdowns: replace with static text
        if (cell.classList.contains("dropdown-cell-container")) {
          const toggleButton = cell.querySelector(".dropdown-toggle-button");
          if (toggleButton) {
            const textSpan = toggleButton.querySelector("span");
            const icon = toggleButton.querySelector("i");
            let statusText = textSpan ? textSpan.textContent : "";
            let iconHtml = icon ? icon.outerHTML : ""; // Keep icon HTML for display

            // Use the actualValue dataset if available for the most accurate state
            const actualValue = cell.dataset.actualValue;
            if (actualValue) {
              const statusInfo = getStatusInfo(actualValue);
              statusText = statusInfo.text;
              iconHtml = `<i class="fas ${statusInfo.iconClass}" style="color:${statusInfo.hexColor};"></i>`;
            }

            cell.innerHTML = `${iconHtml} ${statusText}`;
          }
        }
        // Handle editable cells: replace input/textarea with their current value
        else if (cell.classList.contains("editable-cell")) {
          const inputElement = cell.querySelector("input, textarea");
          if (inputElement) {
            // Restore original content based on the stored actualValue or originalValue
            let displayValue =
              cell.dataset.actualValue ||
              cell.dataset.originalValue ||
              inputElement.value ||
              "-";
            let fieldName = cell.dataset.fieldName;
            let type = cell.dataset.type;
            cell.innerHTML = ""; // Clear current input
            updateCellContent(cell, displayValue, fieldName, type); // Re-render as static text
          }
        }
      });

      // Hide selection checkboxes if they were visible
      clonedTable
        .querySelectorAll(".delivery-select-checkbox")
        .forEach((cb) => {
          cb.style.display = "none";
        });
      // Hide the master select all checkbox if it exists
      const masterCheckbox = clonedTable.querySelector("#masterSelectAll");
      if (masterCheckbox) {
        masterCheckbox.style.display = "none";
      }
      // Restore the "N°" header if selection mode was active
      const thNumeroCloned = clonedTable.querySelector("#thNumero");
      if (thNumeroCloned && thNumeroCloned.textContent === "") {
        thNumeroCloned.textContent = "N°";
      }
      const checkboxHeaderPlaceholderCloned = clonedTable.querySelector(
        "#checkboxHeaderPlaceholder"
      );
      if (checkboxHeaderPlaceholderCloned) {
        checkboxHeaderPlaceholderCloned.innerHTML = "";
      }

      tempTableContainer.appendChild(clonedTable);

      const canvas = await html2canvas(clonedTable, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      doc.setFontSize(10);

      while (heightLeft > 0) {
        if (position > 0) {
          doc.addPage();
        }

        const pageContentHeight = pageHeight - 2 * margin;

        doc.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          imgWidth,
          imgHeight,
          null,
          null,
          null,
          0,
          -position
        );

        // Add page number at the bottom right
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          pageWidth - margin,
          pageHeight - margin,
          { align: "right" }
        );

        heightLeft -= pageContentHeight; // Subtract full page height
        position += pageContentHeight; // Move to the next slice position
      }

      doc.save(
        `Suivi_Livraisons_${currentMainFilterDate.toLocaleDateString(
          "fr-FR"
        )}.pdf`
      );
      showCustomAlert(
        "Le PDF du tableau principal a été généré avec succès !",
        "success"
      );
    } catch (error) {
      showCustomAlert(
        `Erreur lors de la génération du PDF du tableau principal: ${error.message}`,
        "error",
        7000
      );
      console.error("Error generating main table PDF:", error);
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
      if (tempTableContainer && tempTableContainer.parentNode) {
        tempTableContainer.parentNode.removeChild(tempTableContainer);
      }
      // Re-render the original table to restore interactive elements and checkboxes
      applyCombinedFilters();
    }
  }

  // =====================================================================
  // --- WebSocket Initialization ---
  // =====================================================================
  function initializeWebSocket() {
    // Close existing socket if it's open to prevent multiple connections
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("Closing existing WebSocket connection.");
      socket.close();
    }

    console.log("Attempting to connect to WebSocket...");
    // Détection automatique de l'URL WebSocket selon l'environnement
    let wsUrl;
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      wsUrl = "ws://localhost:3000";
    } else {
      // Utilise le protocole et l'hôte du site actuel, adapte pour ws/wss
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = protocol + "//" + window.location.host;
    }
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established.");
      // Optionally send a message to the server to identify this client
      // socket.send(JSON.stringify({ type: 'client_connected', role: 'admin' }));
    };

    socket.onmessage = async (event) => {
      console.log("[WS][FRONT] Message WebSocket brut reçu:", event.data);
      // --- Affichage d'un message lors des notifications WebSocket (modification, suppression, etc.) ---
      function showWebSocketNotification(data) {
        console.log(
          "[WS][FRONT] showWebSocketNotification appelée avec:",
          data
        );
        if (!data || !data.type) return;
        let message = "";
        let type = "info";
        // On affiche le message du backend si présent
        if (data.type === "new_delivery_notification") {
          // Message personnalisé pour la création d'une nouvelle livraison
          const agent =
            data.delivery && data.delivery.employee_name
              ? data.delivery.employee_name
              : "Un agent";
          message = `L'agent <b>${agent}</b> a établi un ordre de livraison.`;
          type = "success";
        } else if (data.message) {
          message = data.message;
        } else {
          switch (data.type) {
            case "delivery_update_alert":
              message = "Une livraison a été modifiée.";
              type = "info";
              break;
            case "container_status_update":
              message = "Statut d'un conteneur mis à jour.";
              type = "info";
              break;
            case "delivery_deletion_alert":
              message = "Une livraison a été supprimée.";
              type = "warning";
              break;
            case "updateAgents":
              message = "La liste des agents a été mise à jour.";
              type = "info";
              break;
            default:
              message = "Mise à jour reçue.";
          }
        }
        showCustomAlert(message, type, 4000);
      }
      try {
        const message = JSON.parse(event.data);
        console.log("[WS][FRONT] Message WebSocket parsé:", message);
        // Affiche une notification à chaque réception d'un message pertinent
        const typesToNotify = [
          "delivery_update_alert",
          "container_status_update",
          "delivery_deletion_alert",
          "new_delivery_notification",
          "updateAgents",
        ];
        if (message && message.type && typesToNotify.includes(message.type)) {
          showWebSocketNotification(message);
        }
        // Rafraîchissement des données selon le type
        if (
          message.type === "new_delivery" ||
          message.type === "delivery_updated" ||
          message.type === "delivery_deleted" ||
          message.type === "delivery_update_alert" ||
          message.type === "container_status_update" ||
          message.type === "delivery_deletion_alert" ||
          message.type === "new_delivery_notification" ||
          message.type === "updateAgents"
        ) {
          await loadDeliveries();
          applyCombinedFilters();
          // Rafraîchit la boîte d'activité agent si besoin
          if (
            agentActivityBox &&
            agentActivityBox.classList.contains("active") &&
            selectedAgentName
          ) {
            showAgentActivity(selectedAgentName, currentAgentActivityDate);
          }
          // Rafraîchit la liste des employés si besoin
          if (
            message.type === "updateAgents" &&
            employeePopup &&
            employeePopup.classList.contains("is-visible")
          ) {
            filterEmployeeList();
          }
        }
      } catch (error) {
        console.error("[WS][FRONT] Erreur parsing WebSocket message:", error);
      }
    };

    socket.onclose = (event) => {
      let reason = "Erreur de connexion WebSocket.";
      if (event && typeof event.code !== "undefined") {
        reason += ` (Code: ${event.code}`;
        if (event.reason) reason += `, Motif: ${event.reason}`;
        reason += ")";
      }
      showCustomAlert(reason + " Tentative de reconnexion...", "error", 7000);
      // Attempt to reconnect after a delay if the closure was not intentional
      if (event.code !== 1000) {
        // 1000 is normal closure
        console.log("Attempting to reconnect WebSocket in 5 seconds...");
        setTimeout(initializeWebSocket, 5000);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Affichage professionnel de l'erreur WebSocket
      let errorMsg =
        `<div style="display:flex;align-items:center;gap:14px;">` +
        `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" style="background:linear-gradient(90deg,#f87171 60%,#facc15 100%);border-radius:8px;padding:2px;"><rect width="32" height="32" rx="8" fill="#fde047"/><path d="M16 10v6m0 4h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg>` +
        `<span style="font-size:1.08em;font-weight:700;color:#ef4444;">Erreur WebSocket</span>` +
        `</div>`;
      errorMsg += `<div style="margin-top:8px;font-size:0.98em;color:#334155;">${
        error && error.message ? error.message : "Erreur inconnue."
      }</div>`;
      errorMsg += `<div style="margin-top:6px;font-size:0.93em;color:#64748b;">La connexion en temps réel est perdue. Veuillez vérifier votre réseau ou contacter le support si le problème persiste.</div>`;
      showCustomAlert(errorMsg, "error", 9000);
      socket.close();
    };
  }

  // =====================================================================
  // --- Initialisation et boucles de rafraîchissement ---
  // =====================================================================

  // Exécute ces fonctions si les éléments DOM principaux sont présents
  if (deliveriesTableBody) {
    // === AJOUT BOUTON VUE DOSSIERS CLIENTS ENTRE ACTIVER SÉLECTION ET GÉNÉRER PDF ===
    const toggleSelectionBtn = document.getElementById("toggleSelectionBtn");
    const generatePdfBtn = document.getElementById("generatePdfBtn");

    const dossiersBtn = document.createElement("button");
    dossiersBtn.id = "viewClientFoldersBtn";
    dossiersBtn.textContent = "📁 Vue Dossiers Clients";
    dossiersBtn.className = "btn btn-primary mb-3";
    dossiersBtn.style.background =
      "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
    dossiersBtn.style.color = "#fff";
    dossiersBtn.style.fontWeight = "bold";
    dossiersBtn.style.fontSize = "0.8em";
    dossiersBtn.style.border = "none";
    dossiersBtn.style.borderRadius = "8px";
    dossiersBtn.style.padding = "0.7em 1.7em";
    dossiersBtn.style.boxShadow = "0 2px 12px rgba(37,99,235,0.13)";
    dossiersBtn.style.letterSpacing = "0.5px";
    dossiersBtn.style.transition = "background 0.2s,box-shadow 0.2s";
    dossiersBtn.onmouseover = () => {
      dossiersBtn.style.background = "#1e293b";
      dossiersBtn.style.boxShadow = "0 4px 18px rgba(30,41,59,0.18)";
    };
    dossiersBtn.onmouseout = () => {
      dossiersBtn.style.background =
        "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
      dossiersBtn.style.boxShadow = "0 2px 12px rgba(37,99,235,0.13)";
    };
    dossiersBtn.addEventListener("click", showClientFoldersModal);

    // Insère le bouton entre Activer Sélection et Générer PDF
    if (
      toggleSelectionBtn &&
      generatePdfBtn &&
      toggleSelectionBtn.parentNode === generatePdfBtn.parentNode
    ) {
      toggleSelectionBtn.parentNode.insertBefore(dossiersBtn, generatePdfBtn);
    } else if (generatePdfBtn && generatePdfBtn.parentNode) {
      generatePdfBtn.parentNode.insertBefore(dossiersBtn, generatePdfBtn);
    } else if (toggleSelectionBtn && toggleSelectionBtn.parentNode) {
      toggleSelectionBtn.parentNode.appendChild(dossiersBtn);
    } else if (deliveriesTable && deliveriesTable.parentNode) {
      deliveriesTable.parentNode.insertBefore(dossiersBtn, deliveriesTable);
    }

    // Crée un conteneur pour la vue dossiers (masqué par défaut)
    const clientFoldersContainer = document.createElement("div");
    clientFoldersContainer.id = "clientFoldersContainer";
    clientFoldersContainer.style.display = "none";
    deliveriesTable.parentNode.insertBefore(
      clientFoldersContainer,
      deliveriesTable
    );

    // Fonction pour regrouper les opérations par agent > client > date
    function buildClientFoldersData(deliveries) {
      const data = {};
      deliveries.forEach((d) => {
        const agent = d.employee_name || "Agent inconnu";
        const client = d.client_name || "Client inconnu";
        const date = d.created_at
          ? new Date(d.created_at).toLocaleDateString("fr-FR")
          : "Date inconnue";
        if (!data[agent]) data[agent] = {};
        if (!data[agent][client]) data[agent][client] = {};
        if (!data[agent][client][date]) data[agent][client][date] = [];
        data[agent][client][date].push(d);
      });
      return data;
    }

    // Fonction utilitaire pour exporter un dossier client en CSV
    function exportClientFolderToCSV(agent, client, operations) {
      const headers = [
        "Agent",
        "Client",
        "Date",
        "Conteneur",
        "Statut",
        "Observation",
      ];
      const rows = operations.map((op) => [
        '"' + (op.employee_name || "") + '"',
        '"' + (op.client_name || "") + '"',
        '"' +
          (op.created_at
            ? new Date(op.created_at).toLocaleDateString("fr-FR")
            : "") +
          '"',
        '"' + (op.container_number || "") + '"',
        '"' + (op.delivery_status_acconier || op.status || "") + '"',
        '"' + (op.observation_acconier || op.delivery_notes || "") + '"',
      ]);
      let csvContent =
        headers.join(";") + "\n" + rows.map((r) => r.join(";")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Dossier_${agent.replace(/\s+/g, "_")}_${client.replace(
        /\s+/g,
        "_"
      )}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Fonction pour ouvrir une modale de détail d'opération (réutilise la modale globale si possible)
    function showOperationDetailModal(op) {
      // Expose l'objet d'opération dans la console pour debug
      window.lastOpDetail = op;
      let modal = document.getElementById("detailsModal");
      let modalContent = document.getElementById("modalContent");
      let closeModalBtn = document.getElementById("closeModalBtn");
      if (!modal || !modalContent || !closeModalBtn) {
        // Si la modale n'existe pas (rare), on la crée rapidement
        modal = document.createElement("div");
        modal.id = "detailsModal";
        modal.className =
          "fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50";
        modal.innerHTML = `<div class='bg-white p-6 rounded-lg shadow-xl max-w-lg w-full m-4 relative'>
          <button id='closeModalBtn' class='absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold'>&times;</button>
          <h3 class='text-2xl font-bold mb-4 text-gray-800'>Détails de l'opération</h3>
          <div id='modalContent' class='text-gray-700 space-y-2 max-h-96 overflow-y-auto p-4'></div>
        </div>`;
        document.body.appendChild(modal);
        modalContent = document.getElementById("modalContent");
        closeModalBtn = document.getElementById("closeModalBtn");
      }
      // Remplir le contenu

      // Utilise le champ backend si dispo, sinon fallback JS
      function mapStatus(status) {
        if (!status) return "-";
        const normalized = status.toLowerCase();
        if (["livré", "livre", "livree", "livrée"].includes(normalized))
          return "livré";
        if (
          [
            "rejeté",
            "rejete",
            "rejetee",
            "rejetée",
            "rejected_acconier",
            "rejected_by_employee",
          ].includes(normalized)
        )
          return "rejeté";
        if (
          [
            "en attente",
            "attente",
            "pending",
            "pending_acconier",
            "awaiting_delivery_acconier",
          ].includes(normalized)
        )
          return "en attente";
        if (
          [
            "en cours",
            "encours",
            "in progress",
            "en-cours",
            "in_progress_acconier",
          ].includes(normalized)
        )
          return "en cours";
        return "en cours";
      }
      let displayStatus =
        op.delivery_status_acconier_fr ||
        mapStatus(op.delivery_status_acconier || op.status || "");

      // Nouvelle version : chaque info dans une "carte" moderne, responsive, business-friendly
      modalContent.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px 28px;">
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:13px;box-shadow:0 2px 12px #2563eb11;padding:18px 20px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.98em;color:#64748b;font-weight:600;margin-bottom:4px;">Agent</span>
            <span style="font-size:1.13em;font-weight:700;color:#1e293b;">${
              op.employee_name || "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:13px;box-shadow:0 2px 12px #2563eb11;padding:18px 20px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.98em;color:#64748b;font-weight:600;margin-bottom:4px;">Date</span>
            <span style="font-size:1.13em;font-weight:700;color:#1e293b;">${
              op.created_at
                ? new Date(op.created_at).toLocaleDateString("fr-FR")
                : "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#fde047 60%,#facc15 100%);border-radius:13px;box-shadow:0 2px 12px #facc1533;padding:18px 20px;display:flex;flex-direction:column;align-items:flex-start;border:2px solid #eab308;">
            <span style="font-size:0.98em;color:#78350f;font-weight:600;margin-bottom:4px;">Client</span>
            <span style="font-size:1.13em;font-weight:700;color:#78350f;">${
              op.client_name || "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#fde047 60%,#facc15 100%);border-radius:13px;box-shadow:0 2px 12px #facc1533;padding:18px 20px;display:flex;flex-direction:column;align-items:flex-start;border:2px solid #eab308;">
            <span style="font-size:0.98em;color:#78350f;font-weight:600;margin-bottom:4px;">N° Dossier</span>
            <span style="font-size:1.13em;font-weight:800;color:#78350f;letter-spacing:0.5px;">${
              op.dossier_number || op.dossier || "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:13px;box-shadow:0 2px 12px #2563eb11;padding:18px 20px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.98em;color:#64748b;font-weight:600;margin-bottom:4px;">Conteneur</span>
            <span style="font-size:1.13em;font-weight:700;color:#1e293b;">${
              op.container_number || "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:13px;box-shadow:0 2px 12px #2563eb11;padding:18px 20px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.98em;color:#64748b;font-weight:600;margin-bottom:4px;">Statut</span>
            <span style="font-size:1.13em;font-weight:700;color:#2563eb;">${displayStatus}</span>
          </div>
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:13px;box-shadow:0 2px 12px #2563eb11;padding:18px 20px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.98em;color:#64748b;font-weight:600;margin-bottom:4px;">Observation</span>
            <span style="font-size:1.13em;font-weight:500;color:#334155;">${
              op.observation_acconier || op.delivery_notes || "-"
            }</span>
          </div>
        </div>
      `;
      modal.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
      closeModalBtn.onclick = () => {
        modal.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
      };
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.classList.add("hidden");
          document.body.classList.remove("overflow-hidden");
        }
      };
    }

    function showClientFoldersView() {
      clientFoldersContainer.innerHTML = "";
      const foldersData = buildClientFoldersData(deliveries);
      for (const agent in foldersData) {
        const agentSection = document.createElement("div");
        agentSection.className = "agent-folder-section mb-6";
        agentSection.innerHTML = `<h3 class='text-xl font-bold mb-2'>${agent}</h3>`;
        for (const client in foldersData[agent]) {
          const clientFolder = document.createElement("div");
          clientFolder.className =
            "client-folder border rounded-lg p-3 mb-4 bg-gray-50";
          clientFolder.innerHTML = `<h4 class='text-lg font-semibold mb-1'>Dossier client : ${client}</h4>`;

          // Bouton d'export CSV pour ce dossier client
          const exportBtn = document.createElement("button");
          exportBtn.className = "btn btn-success mb-2";
          exportBtn.textContent = "Exporter ce dossier client";
          exportBtn.onclick = () => {
            // Récupère toutes les opérations de ce client pour cet agent (toutes dates)
            let allOps = [];
            for (const date in foldersData[agent][client]) {
              allOps = allOps.concat(foldersData[agent][client][date]);
            }
            exportClientFolderToCSV(agent, client, allOps);
          };
          clientFolder.appendChild(exportBtn);

          for (const date in foldersData[agent][client]) {
            const dateBlock = document.createElement("div");
            dateBlock.className = "client-folder-date mb-2";
            dateBlock.innerHTML = `<div class='font-medium text-gray-700'>${date}</div>`;
            const ul = document.createElement("ul");
            foldersData[agent][client][date].forEach((op) => {
              const li = document.createElement("li");
              li.className = "ml-4 list-disc flex items-center gap-2";
              li.innerHTML = `<span><strong>Conteneur :</strong> ${
                op.container_number || "-"
              } | <strong>Statut :</strong> ${
                op.delivery_status_acconier_fr ||
                mapStatus(op.delivery_status_acconier || op.status || "-")
              } | <strong>Obs. :</strong> ${
                op.observation_acconier || op.delivery_notes || "-"
              }</span>`;
              // Bouton détail
              const detailBtn = document.createElement("button");
              detailBtn.className = "btn btn-info btn-sm ml-2";
              detailBtn.textContent = "Détail";
              detailBtn.onclick = (e) => {
                e.stopPropagation();
                showOperationDetailModal(op);
              };
              li.appendChild(detailBtn);
              ul.appendChild(li);
            });
            dateBlock.appendChild(ul);
            clientFolder.appendChild(dateBlock);
          }
          agentSection.appendChild(clientFolder);
        }
        clientFoldersContainer.appendChild(agentSection);
      }
      // Affiche la vue dossiers, masque le tableau
      clientFoldersContainer.style.display = "block";
      deliveriesTable.style.display = "none";
      dossiersBtn.style.display = "none";
    }

    // Fonction retour à la vue tableau
    function showTableView() {
      clientFoldersContainer.style.display = "none";
      deliveriesTable.style.display = "table";
      dossiersBtn.style.display = "inline-block";
    }

    dossiersBtn.addEventListener("click", showClientFoldersView);
    // Remplace l'affichage classique par une modale flottante professionnelle
    // Nouvelle version Vue Dossiers Clients : navigation agents/dossiers, layout pro, navigation retour
    function showClientFoldersModal() {
      // Supprime toute ancienne modale si présente
      const oldModal = document.getElementById("clientFoldersModal");
      if (oldModal) oldModal.remove();
      if (typeof deliveriesTable !== "undefined" && deliveriesTable)
        deliveriesTable.style.display = "none";
      const clientFoldersContainer = document.getElementById(
        "clientFoldersContainer"
      );
      if (clientFoldersContainer) clientFoldersContainer.style.display = "none";

      // Création overlay et boîte modale
      const overlay = document.createElement("div");
      overlay.id = "clientFoldersModal";
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
      box.style.maxWidth = "1100px";
      box.style.width = "98vw";
      box.style.maxHeight = "92vh";
      box.style.overflowY = "auto";
      box.style.padding = "0";
      box.style.position = "relative";
      box.style.display = "flex";
      box.style.flexDirection = "column";

      // Header flottant
      const header = document.createElement("div");
      header.style.background =
        "linear-gradient(90deg,#2563eb 0%,#1e293b 100%)";
      header.style.color = "#fff";
      header.style.padding = "28px 38px 18px 38px";
      header.style.fontWeight = "bold";
      header.style.fontSize = "1.7rem";
      header.style.display = "flex";
      header.style.justifyContent = "flex-start";
      header.style.alignItems = "center";
      header.style.borderTopLeftRadius = "16px";
      header.style.borderTopRightRadius = "16px";
      header.style.boxShadow = "0 4px 18px rgba(30,41,59,0.13)";
      header.style.letterSpacing = "0.5px";
      header.style.position = "relative";
      header.innerHTML = `
        <span style="display:flex;align-items:center;gap:14px;">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="background:linear-gradient(90deg,#facc15 60%,#fde047 100%);border-radius:8px;padding:3px;"><rect width="32" height="32" rx="8" fill="#fde047"/><path d="M8 10a2 2 0 0 1 2-2h3.17a2 2 0 0 1 1.41.59l1.83 1.83A2 2 0 0 0 18.83 11H22a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8z" fill="#facc15" stroke="#eab308" stroke-width="1.5"/><rect x="12" y="16" width="8" height="2" rx="1" fill="#eab308"/><rect x="12" y="13" width="5" height="2" rx="1" fill="#eab308"/></svg>
          <span style="font-size:1.35em;font-weight:700;letter-spacing:0.5px;">Dossiers des clients</span>
          <span style="background:linear-gradient(90deg,#facc15 60%,#fde047 100%);color:#78350f;font-size:0.95em;font-weight:600;padding:2px 12px;border-radius:7px;margin-left:8px;box-shadow:0 1px 6px #fde04755;">Vue entreprise</span>
        </span>
      `;
      // Bouton de fermeture
      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "&times;";
      closeBtn.style.background = "none";
      closeBtn.style.border = "none";
      closeBtn.style.color = "#fff";
      closeBtn.style.fontSize = "2.2rem";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.marginLeft = "18px";
      closeBtn.setAttribute("aria-label", "Fermer");
      closeBtn.onclick = () => {
        overlay.remove();
        if (typeof deliveriesTable !== "undefined" && deliveriesTable)
          deliveriesTable.style.display = "table";
        if (clientFoldersContainer)
          clientFoldersContainer.style.display = "none";
        if (typeof dossiersBtn !== "undefined" && dossiersBtn)
          dossiersBtn.style.display = "inline-block";
      };
      header.appendChild(closeBtn);
      box.appendChild(header);

      // Contenu scrollable
      const content = document.createElement("div");
      content.style.padding = "24px 24px 24px 24px";
      content.style.background = "#f8fafc";
      content.style.flex = "1 1 auto";
      content.style.overflowY = "auto";
      box.appendChild(content);

      // --- Barre de recherche dynamique ---
      let currentAgent = null;
      let searchValue = "";
      const searchBar = document.createElement("input");
      searchBar.type = "text";
      searchBar.placeholder = "Rechercher...";
      searchBar.style.width = "100%";
      searchBar.style.marginBottom = "18px";
      searchBar.style.padding = "10px 14px";
      searchBar.style.border = "1.5px solid #2563eb";
      searchBar.style.borderRadius = "7px";
      searchBar.style.fontSize = "1.08em";
      searchBar.style.outline = "none";
      searchBar.style.background = "#fff";
      searchBar.style.boxShadow = "0 1px 4px rgba(30,41,59,0.04)";

      // Affiche la liste des agents (vue initiale)
      // Nouvelle version : la barre de recherche et la boîte principale sont créées une seule fois
      let agentListMainBox = null;
      let agentListTitle = null;
      let agentListNoResult = null;
      let agentListClientToggleBtn = null;
      let agentListClientListContainer = null;
      let showArchives = false;
      function renderAgentList(filter = "") {
        // Création unique des éléments DOM persistants
        if (!content.querySelector(".agent-list-search-bar")) {
          content.innerHTML = "";
          currentAgent = null;
          // --- Barre boutons Liste/Archives ---
          const btnBar = document.createElement("div");
          btnBar.style.display = "flex";
          btnBar.style.gap = "12px";
          btnBar.style.marginBottom = "18px";
          btnBar.style.alignItems = "center";
          // Bouton Liste
          const btnListe = document.createElement("button");
          btnListe.textContent = "Retour vers les dossiers";
          btnListe.className = "btn btn-primary";
          btnListe.style.background = showArchives ? "#e5e7eb" : "#2563eb";
          btnListe.style.color = showArchives ? "#222" : "#fff";
          btnListe.style.fontWeight = "bold";
          btnListe.style.borderRadius = "7px";
          btnListe.style.padding = "8px 18px";
          btnListe.onclick = () => {
            showArchives = false;
            renderAgentList(searchBar.value);
          };
          // Bouton Archives
          const btnArchives = document.createElement("button");
          btnArchives.textContent = "Archives";
          btnArchives.className = "btn btn-secondary";
          btnArchives.style.background = showArchives ? "#2563eb" : "#e5e7eb";
          btnArchives.style.color = showArchives ? "#fff" : "#222";
          btnArchives.style.fontWeight = "bold";
          btnArchives.style.borderRadius = "7px";
          btnArchives.style.padding = "8px 18px";
          btnArchives.onclick = () => {
            showArchives = true;
            renderAgentList(searchBar.value);
          };
          btnBar.appendChild(btnListe);
          btnBar.appendChild(btnArchives);
          content.appendChild(btnBar);
          // Crée la barre de recherche
          searchBar.classList.add("agent-list-search-bar");
          searchBar.value = filter;
          searchBar.setAttribute("autocomplete", "off");
          searchBar.setAttribute("spellcheck", "false");
          searchBar.style.caretColor = "#2563eb";
          searchBar.style.transition = "border 0.18s, box-shadow 0.18s";
          searchBar.onfocus = () => {
            searchBar.style.border = "2.5px solid #2563eb";
            searchBar.style.boxShadow = "0 2px 12px rgba(37,99,235,0.13)";
          };
          searchBar.onblur = () => {
            searchBar.style.border = "1.5px solid #2563eb";
            searchBar.style.boxShadow = "0 1px 4px rgba(30,41,59,0.04)";
          };
          content.appendChild(searchBar);
          // Titre
          agentListTitle = document.createElement("div");
          agentListTitle.textContent = showArchives
            ? "<span style='color:#2563eb;font-weight:700;'>Agents ayant des dossiers archivés</span> <span style='font-size:0.98em;color:#64748b;'>(plus de 40 jours, moins de 3 ans 6 mois)</span> :"
            : `<span style='display:flex;align-items:center;gap:12px;'><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2"/></svg> <span style='font-weight:700;color:#2563eb;'>Sélectionnez un agent</span> <span style='font-size:0.98em;color:#64748b;'>pour voir ses dossiers clients</span> <span style='background:linear-gradient(90deg,#facc15 60%,#fde047 100%);color:#78350f;font-size:0.93em;font-weight:600;padding:2px 10px;border-radius:7px;margin-left:10px;box-shadow:0 1px 6px #fde04733;'>Mode entreprise</span></span>`;
          agentListTitle.style.fontWeight = "600";
          agentListTitle.style.fontSize = "1.18em";
          agentListTitle.style.marginBottom = "1.2em";
          agentListTitle.style.letterSpacing = "0.2px";
          agentListTitle.style.lineHeight = "1.3";
          agentListTitle.innerHTML = agentListTitle.textContent;
          content.appendChild(agentListTitle);
          // Boîte principale
          agentListMainBox = document.createElement("div");
          agentListMainBox.className = "agent-list-main-box";
          agentListMainBox.style.background = "#fff";
          agentListMainBox.style.borderRadius = "14px";
          agentListMainBox.style.boxShadow = "0 4px 18px rgba(30,41,59,0.10)";
          agentListMainBox.style.border = "1px solid #e5e7eb";
          agentListMainBox.style.padding = "18px 12px 18px 12px";
          agentListMainBox.style.margin = "0 auto";
          agentListMainBox.style.maxWidth = "900px";
          agentListMainBox.style.width = "100%";
          agentListMainBox.style.maxHeight = "54vh";
          agentListMainBox.style.overflowY = "auto";
          agentListMainBox.style.display = "flex";
          agentListMainBox.style.flexDirection = "column";
          agentListMainBox.style.gap = "1em";
          content.appendChild(agentListMainBox);
          // Message "aucun résultat"
          agentListNoResult = document.createElement("div");
          agentListNoResult.style.textAlign = "center";
          agentListNoResult.style.color = "#888";
          agentListNoResult.style.fontSize = "1.1rem";
          agentListNoResult.style.padding = "2em";
          agentListNoResult.style.display = "none";
          content.appendChild(agentListNoResult);
          // Ajoute l'eventListener une seule fois
          searchBar.oninput = (e) => {
            renderAgentList(e.target.value);
          };
        }
        // On met à jour la valeur du champ si besoin
        if (searchBar.value !== filter) searchBar.value = filter;
        // On construit foldersData une seule fois ici pour toute la fonction
        let foldersData = buildClientFoldersData(deliveries);
        // Recherche avancée : filtre sur agent, client, N° BL, N° Déclaration + FILTRAGE ARCHIVES
        let agentNames = Object.keys(foldersData)
          .filter((agent) => {
            // On filtre les dossiers selon la vue (archives ou liste principale)
            let hasValidClient = false;
            for (const client in foldersData[agent]) {
              // On fusionne toutes les opérations de toutes les dates pour ce client
              const dossiersArray = Object.values(
                foldersData[agent][client] || {}
              ).flat();
              if (dossiersArray.length > 0) {
                // On prend la date la plus récente du dossier (dernier op)
                const lastOp = dossiersArray.reduce((a, b) =>
                  new Date(a.created_at) > new Date(b.created_at) ? a : b
                );
                const createdAt = new Date(lastOp.created_at);
                const now = new Date();
                const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
                if (!showArchives && diffDays < 40) hasValidClient = true;
                if (showArchives && diffDays >= 40 && diffDays < 3.5 * 365)
                  hasValidClient = true;
              }
            }
            if (!hasValidClient) return false;
            if (!filter) return true;
            const filterLower = filter.toLowerCase();
            // Recherche sur nom agent
            if (agent.toLowerCase().includes(filterLower)) return true;
            // Recherche sur clients, N° BL, N° Déclaration
            const clients = Object.keys(foldersData[agent] || {});
            for (const client of clients) {
              if (client.toLowerCase().includes(filterLower)) return true;
              // Parcours toutes les opérations de ce client
              const dates = Object.keys(foldersData[agent][client] || {});
              for (const date of dates) {
                const ops = foldersData[agent][client][date] || [];
                for (const op of ops) {
                  if (
                    (op.bl_number &&
                      op.bl_number.toLowerCase().includes(filterLower)) ||
                    (op.declaration_number &&
                      op.declaration_number.toLowerCase().includes(filterLower))
                  ) {
                    return true;
                  }
                }
              }
            }
            return false;
          })
          .sort();
        // Affichage "aucun résultat"
        if (agentNames.length === 0) {
          agentListMainBox.innerHTML = "";
          agentListNoResult.textContent =
            "Aucun agent ou dossier ne correspond à la recherche.";
          agentListNoResult.style.display = "block";
          return;
        } else {
          agentListNoResult.style.display = "none";
        }
        // --- Liste de tous les dossiers (clients) sous forme de cartes ---
        // On affiche la liste de tous les clients (dossiers) présents dans toutes les livraisons
        let allClientsSet = new Set();
        Object.values(foldersData).forEach((agentObj) => {
          Object.keys(agentObj).forEach((client) => {
            // On fusionne toutes les opérations de toutes les dates pour ce client
            const dossiersArray = Object.values(agentObj[client] || {}).flat();
            if (dossiersArray.length > 0) {
              // On prend la date la plus récente du dossier (dernier op)
              const lastOp = dossiersArray.reduce((a, b) =>
                new Date(a.created_at) > new Date(b.created_at) ? a : b
              );
              const createdAt = new Date(lastOp.created_at);
              const now = new Date();
              const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
              if (!showArchives && diffDays < 40) allClientsSet.add(client);
              if (showArchives && diffDays >= 40 && diffDays < 3.5 * 365)
                allClientsSet.add(client);
            }
          });
        });
        const allClients = Array.from(allClientsSet).sort((a, b) =>
          a.localeCompare(b, "fr")
        );
        // Création unique du bouton et de la liste clients
        if (!agentListClientToggleBtn) {
          agentListClientToggleBtn = document.createElement("button");
          agentListClientToggleBtn.textContent =
            "Liste de tous les dossiers (clients)";
          agentListClientToggleBtn.style.background = "#2563eb";
          agentListClientToggleBtn.style.color = "#fff";
          agentListClientToggleBtn.style.fontWeight = "600";
          agentListClientToggleBtn.style.fontSize = "1.01em";
          agentListClientToggleBtn.style.border = "none";
          agentListClientToggleBtn.style.borderRadius = "7px";
          agentListClientToggleBtn.style.padding = "0.6em 1.3em";
          agentListClientToggleBtn.style.margin = "1.2em 0 0.5em 0";
          agentListClientToggleBtn.style.cursor = "pointer";
          agentListClientToggleBtn.style.boxShadow =
            "0 1px 6px rgba(37,99,235,0.09)";
          agentListClientToggleBtn.style.transition =
            "background 0.18s, box-shadow 0.18s";
          agentListClientToggleBtn.onmouseover = () => {
            agentListClientToggleBtn.style.background = "#1e293b";
            agentListClientToggleBtn.style.boxShadow =
              "0 2px 12px rgba(30,41,59,0.13)";
          };
          agentListClientToggleBtn.onmouseout = () => {
            agentListClientToggleBtn.style.background = "#2563eb";
            agentListClientToggleBtn.style.boxShadow =
              "0 1px 6px rgba(37,99,235,0.09)";
          };
          content.appendChild(agentListClientToggleBtn);
        }
        if (!agentListClientListContainer) {
          agentListClientListContainer = document.createElement("div");
          agentListClientListContainer.style.display = "none";
          agentListClientListContainer.style.margin = "0.7em 0 2.2em 0";
          agentListClientListContainer.style.padding =
            "0.5em 0.5em 0.5em 0.5em";
          agentListClientListContainer.style.background = "#f8fafc";
          agentListClientListContainer.style.border = "1.5px solid #2563eb";
          agentListClientListContainer.style.borderRadius = "8px";
          agentListClientListContainer.style.boxShadow =
            "0 1px 6px rgba(30,41,59,0.07)";
          agentListClientListContainer.style.maxWidth = "600px";
          agentListClientListContainer.style.marginLeft = "auto";
          agentListClientListContainer.style.marginRight = "auto";
          content.appendChild(agentListClientListContainer);
        }
        // Mise à jour de la liste des clients
        agentListClientListContainer.innerHTML = "";
        allClients.forEach((client) => {
          const card = document.createElement("div");
          card.style.display = "flex";
          card.style.alignItems = "center";
          card.style.background =
            "linear-gradient(90deg,#f8fafc 60%,#e0e7ef 100%)";
          card.style.border = "2px solid #2563eb22";
          card.style.borderRadius = "13px";
          card.style.boxShadow = "0 2px 12px #2563eb0a, 0 1.5px 0 #2563eb11";
          card.style.padding = "14px 22px";
          card.style.margin = "10px 0";
          card.style.cursor = "pointer";
          card.style.transition =
            "box-shadow 0.18s, border 0.18s, background 0.18s";
          card.style.fontWeight = "600";
          card.style.fontSize = "1.13em";
          card.style.color = "#1e293b";
          card.onmouseover = () => {
            card.style.boxShadow = "0 4px 18px #2563eb22, 0 2px 0 #2563eb22";
            card.style.background =
              "linear-gradient(90deg,#e0e7ef 60%,#f8fafc 100%)";
            card.style.border = "2.5px solid #2563eb55";
          };
          card.onmouseout = () => {
            card.style.boxShadow = "0 2px 12px #2563eb0a, 0 1.5px 0 #2563eb11";
            card.style.background =
              "linear-gradient(90deg,#f8fafc 60%,#e0e7ef 100%)";
            card.style.border = "2px solid #2563eb22";
          };
          card.innerHTML = `
            <span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;background:linear-gradient(135deg,#2563eb 60%,#1e293b 100%);border-radius:8px;margin-right:16px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2"/></svg>
            </span>
            <span style="flex:1;">${client}</span>
            <span style="background:linear-gradient(90deg,#facc15 60%,#fde047 100%);color:#78350f;font-size:0.93em;font-weight:600;padding:2px 10px;border-radius:7px;margin-left:10px;box-shadow:0 1px 6px #fde04733;">Dossier client</span>
          `;
          card.onclick = () => {
            // ... logique pour afficher les dossiers de ce client ...
            // Peut-être filtrer et afficher la liste des agents ayant traité ce client
          };
          agentListClientListContainer.appendChild(card);
        });
        // Toggle bouton liste clients
        let clientsVisible =
          agentListClientListContainer.style.display === "flex";
        agentListClientToggleBtn.onclick = () => {
          clientsVisible = !clientsVisible;
          agentListClientListContainer.style.display = clientsVisible
            ? "flex"
            : "none";
          agentListClientListContainer.style.flexWrap = "wrap";
          agentListClientListContainer.style.justifyContent = "flex-start";
        };
        // --- Affichage agents XXL, responsive, regroupés par lettre, dans une boîte scrollable ---
        agentListMainBox.innerHTML = "";
        // Regroupement alphabétique
        let grouped = {};
        agentNames.forEach((name) => {
          const firstLetter = name[0].toUpperCase();
          if (!grouped[firstLetter]) grouped[firstLetter] = [];
          grouped[firstLetter].push(name);
        });
        const letters = Object.keys(grouped).sort();
        letters.forEach((letter) => {
          // Titre de la lettre (lettre alphabétique en noir, gras, taille 1.3em)
          const letterTitle = document.createElement("div");
          letterTitle.textContent = letter;
          letterTitle.className = "agent-list-letter-title";
          letterTitle.style.fontWeight = "bold";
          letterTitle.style.fontSize = "1.3em";
          letterTitle.style.margin = "1.2em 0 0.5em 0";
          letterTitle.style.color = "#111";
          agentListMainBox.appendChild(letterTitle);
          // Grille responsive pour les agents de cette lettre
          const grid = document.createElement("div");
          grid.style.display = "grid";
          grid.style.gridTemplateColumns =
            "repeat(auto-fit, minmax(340px, 1fr))";
          grid.style.gap = "2em 2.5em";
          grouped[letter].forEach((agent) => {
            // Carte agent XXL business (sans icône utilisateur)
            const card = document.createElement("div");
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.alignItems = "center";
            card.style.background =
              "linear-gradient(120deg,#f8fafc 60%,#e0e7ef 100%)";
            card.style.border = "2.5px solid #2563eb22";
            card.style.borderRadius = "18px";
            card.style.boxShadow = "0 6px 24px #2563eb13, 0 2px 0 #2563eb11";
            card.style.padding = "2.2em 1.7em 1.5em 1.7em";
            card.style.marginBottom = "0.7em";
            card.style.gap = "1.2em";
            card.style.position = "relative";
            card.style.cursor = "pointer";
            card.style.transition =
              "box-shadow 0.18s, border 0.18s, background 0.18s";
            card.onmouseover = () => {
              card.style.boxShadow = "0 12px 36px #2563eb22, 0 2px 0 #2563eb22";
              card.style.background =
                "linear-gradient(120deg,#e0e7ef 60%,#f8fafc 100%)";
              card.style.border = "2.5px solid #2563eb55";
            };
            card.onmouseout = () => {
              card.style.boxShadow = "0 6px 24px #2563eb13, 0 2px 0 #2563eb11";
              card.style.background =
                "linear-gradient(120deg,#f8fafc 60%,#e0e7ef 100%)";
              card.style.border = "2.5px solid #2563eb22";
            };
            // Avatar XXL rond avec initiales (sans icône utilisateur)
            const avatar = document.createElement("div");
            avatar.className = "agent-avatar-xxl";
            avatar.textContent = agent
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();
            avatar.style.background =
              "linear-gradient(135deg,#2563eb 60%,#eab308 100%)";
            avatar.style.color = "#fff";
            avatar.style.width = "64px";
            avatar.style.height = "64px";
            avatar.style.display = "flex";
            avatar.style.alignItems = "center";
            avatar.style.justifyContent = "center";
            avatar.style.fontWeight = "bold";
            avatar.style.fontSize = "2em";
            avatar.style.borderRadius = "50%";
            avatar.style.boxShadow = "0 2px 8px #b3c6e7";
            avatar.style.marginBottom = "0.7em";
            // On s'assure qu'aucune icône utilisateur n'est présente
            while (avatar.firstChild && avatar.firstChild.nodeType !== 3) {
              // 3 = TEXT_NODE
              avatar.removeChild(avatar.firstChild);
            }
            card.appendChild(avatar);
            // Infos agent
            const info = document.createElement("div");
            info.style.flex = "1 1 auto";
            info.style.display = "flex";
            info.style.flexDirection = "column";
            info.style.alignItems = "center";
            // Nom agent + badge
            const name = document.createElement("div");
            name.textContent = agent;
            name.style.fontWeight = "700";
            name.style.fontSize = "1.18em";
            name.style.letterSpacing = "0.5px";
            name.style.marginBottom = "0.2em";
            name.style.textAlign = "center";
            info.appendChild(name);
            // Nombre de dossiers clients
            const badge = document.createElement("span");
            const clientCount = Object.keys(foldersData[agent] || {}).length;
            badge.textContent =
              clientCount + " dossier" + (clientCount > 1 ? "s" : "");
            badge.style.background =
              "linear-gradient(90deg,#facc15 60%,#fde047 100%)";
            badge.style.color = "#78350f";
            badge.style.fontWeight = "600";
            badge.style.fontSize = "1.08em";
            badge.style.padding = "0.4em 1.2em";
            badge.style.borderRadius = "8px";
            badge.style.margin = "0.5em 0 0.5em 0";
            badge.style.boxShadow = "0 1px 6px #fde04733";
            info.appendChild(badge);
            // Aperçu des 3 derniers clients (dossiers)
            const clientNames = Object.keys(foldersData[agent] || {});
            if (clientNames.length > 0) {
              const preview = document.createElement("div");
              preview.style.fontSize = "1.01em";
              preview.style.color = "#2563eb";
              preview.style.margin = "0.5em 0 0.2em 0";
              preview.style.textAlign = "center";
              preview.innerHTML = `<b>Clients récents :</b> <span style='color:#1e293b;'>${clientNames
                .slice(-3)
                .reverse()
                .join(", ")}${clientNames.length > 3 ? ", ..." : ""}</span>`;
              info.appendChild(preview);
            }
            // Dates (max 2)
            // Regroupement des dossiers par date (tous clients)
            let dateMap = {};
            clientNames.forEach((client) => {
              Object.keys(foldersData[agent][client]).forEach((date) => {
                if (!dateMap[date]) dateMap[date] = [];
                dateMap[date].push(client);
              });
            });
            const sortedDates = Object.keys(dateMap).sort((a, b) => {
              const da = a.split("/").reverse().join("-");
              const db = b.split("/").reverse().join("-");
              return db.localeCompare(da);
            });
            if (sortedDates.length > 0) {
              const datePreview = document.createElement("div");
              datePreview.style.fontSize = "0.98em";
              datePreview.style.color = "#666";
              datePreview.style.marginTop = "0.2em";
              datePreview.style.textAlign = "center";
              let previewHtml = "<b>Dates récentes :</b> ";
              previewHtml += sortedDates
                .slice(0, 2)
                .map(
                  (date) =>
                    `<span style='color:#2563eb;font-weight:500;'>${date}</span>`
                )
                .join(", ");
              if (sortedDates.length > 2) previewHtml += `, ...`;
              datePreview.innerHTML = previewHtml;
              info.appendChild(datePreview);
            }
            card.appendChild(info);
            // Bouton suppression agent (en bas à droite de la carte)
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-agent-btn";
            deleteBtn.title = "Supprimer l'agent";
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.style.position = "absolute";
            deleteBtn.style.bottom = "18px";
            deleteBtn.style.right = "18px";
            deleteBtn.style.background =
              "linear-gradient(90deg,#facc15 60%,#fde047 100%)";
            deleteBtn.style.color = "#78350f";
            deleteBtn.style.border = "none";
            deleteBtn.style.borderRadius = "50%";
            deleteBtn.style.width = "38px";
            deleteBtn.style.height = "38px";
            deleteBtn.style.display = "flex";
            deleteBtn.style.alignItems = "center";
            deleteBtn.style.justifyContent = "center";
            deleteBtn.style.fontSize = "1.2em";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.boxShadow = "0 2px 8px #fde04755";
            deleteBtn.style.transition = "background 0.18s";
            deleteBtn.onmouseover = () => {
              deleteBtn.style.background = "#b45309";
              deleteBtn.style.color = "#fff";
            };
            deleteBtn.onmouseout = () => {
              deleteBtn.style.background =
                "linear-gradient(90deg,#facc15 60%,#fde047 100%)";
              deleteBtn.style.color = "#78350f";
            };
            deleteBtn.onclick = (e) => {
              e.stopPropagation();
              handleDeleteAgent(agent);
            };
            card.appendChild(deleteBtn);
            // Clic sur la carte = voir dossiers de l'agent
            card.onclick = (e) => {
              if (e.target === deleteBtn) return;
              renderAgentFolders(agent);
            };
            grid.appendChild(card);
          });
          agentListMainBox.appendChild(grid);
        });
      }

      // Affiche tous les dossiers clients traités par un agent
      function renderAgentFolders(agentName, filter = "") {
        content.innerHTML = "";
        currentAgent = agentName;
        // Bouton retour
        const backBtn = document.createElement("button");
        backBtn.innerHTML =
          '<i class="fas fa-arrow-left"></i> Retour vers les dossiers';
        backBtn.style.background = "#2563eb";
        backBtn.style.color = "#fff";
        backBtn.style.fontWeight = "600";
        backBtn.style.fontSize = "1em";
        backBtn.style.border = "none";
        backBtn.style.borderRadius = "8px";
        backBtn.style.padding = "0.5em 1.2em";
        backBtn.style.cursor = "pointer";
        backBtn.style.marginBottom = "1.2em";
        backBtn.onclick = () => {
          // On revient à la liste des agents dans la modale (vue professionnelle)
          renderAgentList("");
        };
        content.appendChild(backBtn);

        // Barre de recherche dossiers
        // On crée un nouvel input pour la recherche dans les dossiers de l'agent
        const dossierSearch = document.createElement("input");
        dossierSearch.type = "text";
        dossierSearch.value = filter;
        dossierSearch.placeholder =
          "Rechercher dans les dossiers de l'agent...";
        dossierSearch.style.width = "100%";
        dossierSearch.style.marginBottom = "18px";
        dossierSearch.style.padding = "10px 14px";
        dossierSearch.style.border = "1.5px solid #2563eb";
        dossierSearch.style.borderRadius = "7px";
        dossierSearch.style.fontSize = "1.08em";
        dossierSearch.style.outline = "none";
        dossierSearch.style.background = "#fff";
        dossierSearch.style.boxShadow = "0 1px 4px rgba(30,41,59,0.04)";
        dossierSearch.setAttribute("autocomplete", "off");
        dossierSearch.setAttribute("spellcheck", "false");
        dossierSearch.style.caretColor = "#2563eb";
        dossierSearch.style.transition = "border 0.18s, box-shadow 0.18s";
        dossierSearch.onfocus = () => {
          dossierSearch.style.border = "2.5px solid #2563eb";
          dossierSearch.style.boxShadow = "0 2px 12px rgba(37,99,235,0.13)";
        };
        dossierSearch.onblur = () => {
          dossierSearch.style.border = "1.5px solid #2563eb";
          dossierSearch.style.boxShadow = "0 1px 4px rgba(30,41,59,0.04)";
        };
        dossierSearch.oninput = (e) =>
          renderAgentFolders(agentName, e.target.value);
        content.appendChild(dossierSearch);

        // Regroupement par client > date
        const foldersData = buildClientFoldersData(
          deliveries.filter(
            (d) => (d.employee_name || "Agent inconnu") === agentName
          )
        );
        let clientNames = Object.keys(foldersData[agentName] || {}).sort();
        // Filtrage dossiers
        if (filter) {
          clientNames = clientNames.filter((client) =>
            client.toLowerCase().includes(filter.toLowerCase())
          );
        }
        if (clientNames.length === 0) {
          content.innerHTML += `<div style='text-align:center;color:#888;font-size:1.1rem;padding:2em;'>Aucun dossier trouvé pour cet agent.</div>`;
          return;
        }
        // --- NOUVEL AFFICHAGE EN GRILLE DE BLOCS JAUNES ---
        // --- NOUVEL AFFICHAGE EN GRILLE DE BLOCS JAUNES (amélioré) ---
        const dossiersGrid = document.createElement("div");
        dossiersGrid.style.display = "grid";
        dossiersGrid.style.gridTemplateColumns =
          "repeat(auto-fit, minmax(320px, 1fr))";
        dossiersGrid.style.gap = "2.2em 2.5em";
        dossiersGrid.style.marginTop = "1.5em";
        dossiersGrid.style.marginBottom = "2em";

        clientNames.forEach((client) => {
          // Bloc client (jaune)
          const clientBlock = document.createElement("div");
          clientBlock.style.background =
            "linear-gradient(120deg,#fef08a 60%,#fde047 100%)";
          clientBlock.style.border = "2.5px solid #eab308";
          clientBlock.style.borderRadius = "18px";
          clientBlock.style.boxShadow = "0 4px 24px rgba(234,179,8,0.13)";
          clientBlock.style.padding = "1.2em 1.5em 1.1em 1.5em";
          clientBlock.style.margin = "0";
          clientBlock.style.display = "flex";
          clientBlock.style.flexDirection = "column";
          clientBlock.style.justifyContent = "flex-start";
          clientBlock.style.alignItems = "stretch";
          clientBlock.style.overflow = "hidden";
          clientBlock.style.position = "relative";
          clientBlock.style.transition = "box-shadow 0.18s";
          clientBlock.onmouseover = () => {
            clientBlock.style.boxShadow = "0 8px 32px rgba(234,179,8,0.22)";
          };
          clientBlock.onmouseout = () => {
            clientBlock.style.boxShadow = "0 4px 24px rgba(234,179,8,0.13)";
          };

          // Titre client
          const clientTitle = document.createElement("div");
          clientTitle.textContent = client;
          clientTitle.style.fontWeight = "bold";
          clientTitle.style.fontSize = "1.13em";
          clientTitle.style.color = "#b45309";
          clientTitle.style.marginBottom = "0.7em";
          clientBlock.appendChild(clientTitle);

          // On stocke toutes les opérations de ce client pour cet agent (toutes dates)
          let allOps = [];
          const dates = Object.keys(foldersData[agentName][client] || {})
            .sort()
            .reverse();
          dates.forEach((date) => {
            allOps = allOps.concat(foldersData[agentName][client][date]);
          });

          // On affiche un résumé (ex : nombre d'opérations, dernières dates, etc.)
          const summary = document.createElement("div");
          summary.style.fontSize = "0.98em";
          summary.style.color = "#a16207";
          summary.style.marginBottom = "0.5em";
          summary.textContent = `${allOps.length} opération${
            allOps.length > 1 ? "s" : ""
          } | Dernière date : ${dates[0] || "-"}`;
          clientBlock.appendChild(summary);

          // Bouton exporter CSV (pour tout le dossier)
          const exportBtn = document.createElement("button");
          exportBtn.textContent = "Exporter CSV";
          exportBtn.style.background = "#fde047";
          exportBtn.style.color = "#78350f";
          exportBtn.style.fontWeight = "600";
          exportBtn.style.fontSize = "0.92em";
          exportBtn.style.border = "none";
          exportBtn.style.borderRadius = "6px";
          exportBtn.style.padding = "3px 10px";
          exportBtn.style.marginBottom = "0.2em";
          exportBtn.style.cursor = "pointer";
          exportBtn.style.boxShadow = "0 1px 4px rgba(234,179,8,0.10)";
          exportBtn.onclick = (e) => {
            e.stopPropagation();
            exportClientFolderToCSV(agentName, client, allOps);
          };
          clientBlock.appendChild(exportBtn);

          // Quand on clique sur le bloc jaune, on ouvre une popup avec le détail du dossier (toutes opérations)
          clientBlock.style.cursor = "pointer";
          clientBlock.onclick = (e) => {
            // Empêche le clic sur le bouton d'export de déclencher le popup
            if (e.target === exportBtn) return;
            // Création du popup professionnel
            let modal = document.getElementById("clientFolderDetailModal");
            if (modal) modal.remove();
            modal = document.createElement("div");
            modal.id = "clientFolderDetailModal";
            modal.style.position = "fixed";
            modal.style.top = 0;
            modal.style.left = 0;
            modal.style.width = "100vw";
            modal.style.height = "100vh";
            modal.style.background = "rgba(30,41,59,0.60)";
            modal.style.zIndex = 99999;
            modal.style.display = "flex";
            modal.style.alignItems = "center";
            modal.style.justifyContent = "center";
            modal.style.transition = "opacity 0.25s";
            modal.style.opacity = 0;
            setTimeout(() => {
              modal.style.opacity = 1;
            }, 10);

            // Boîte centrale
            const box = document.createElement("div");
            box.className = "popup-client-folder-details";
            box.style.background = "#fff";
            box.style.borderRadius = "18px";
            box.style.boxShadow = "0 16px 48px rgba(30,41,59,0.22)";
            box.style.maxWidth = "900px";
            box.style.minWidth = "600px";
            box.style.width = "96vw";
            box.style.maxHeight = "95vh";
            box.style.overflow = "hidden";
            box.style.position = "relative";
            box.style.display = "flex";
            box.style.flexDirection = "column";
            box.style.animation = "popupFadeIn 0.25s";

            // Header
            const header = document.createElement("div");
            header.style.background =
              "linear-gradient(90deg,#2563eb 60%,#1e293b 100%)";
            header.style.color = "#fff";
            header.style.padding = "22px 40px 16px 40px";
            header.style.fontWeight = "bold";
            header.style.fontSize = "1.45rem";
            header.style.display = "flex";
            header.style.justifyContent = "space-between";
            header.style.alignItems = "center";
            header.style.borderTopLeftRadius = "18px";
            header.style.borderTopRightRadius = "18px";
            header.innerHTML = `<span style='letter-spacing:0.5px;'>Dossier client</span>`;
            // Bouton fermeture
            const closeBtn = document.createElement("button");
            closeBtn.innerHTML = "&times;";
            closeBtn.style.background = "none";
            closeBtn.style.border = "none";
            closeBtn.style.color = "#fff";
            closeBtn.style.fontSize = "2.2rem";
            closeBtn.style.cursor = "pointer";
            closeBtn.style.marginLeft = "18px";
            closeBtn.setAttribute("aria-label", "Fermer");
            closeBtn.onclick = () => {
              modal.remove();
              document.body.classList.remove("overflow-hidden");
            };
            header.appendChild(closeBtn);
            box.appendChild(header);

            // Bandeau infos dossier
            const infoBar = document.createElement("div");
            infoBar.style.background = "#f3f4f6";
            infoBar.style.padding = "18px 40px 12px 40px";
            infoBar.style.display = "flex";
            infoBar.style.flexWrap = "wrap";
            infoBar.style.gap = "32px 48px";
            infoBar.style.alignItems = "center";
            infoBar.style.borderBottom = "1.5px solid #e5e7eb";
            // Recherche des infos principales du dossier (première opération)
            const op0 = allOps[0] || {};
            infoBar.innerHTML = `
              <div style="font-size:1.13em;font-weight:700;color:#78350f;background:linear-gradient(90deg,#fde047 60%,#facc15 100%);padding:2px 16px;border-radius:7px;border:2px solid #eab308;box-shadow:0 0 0 2px #fde047;">N° Dossier : ${
                op0.dossier_number || op0.dossier || "-"
              }</div>
              <div style="font-size:1.08em;color:#1e293b;"><b>Client :</b> ${
                op0.client_name || "-"
              }</div>
              <div style="font-size:1.08em;color:#1e293b;"><b>Téléphone :</b> ${
                op0.client_phone || "-"
              }</div>
              <div style="font-size:1.08em;color:#1e293b;"><b>Agent :</b> ${
                op0.agent_name || "-"
              }</div>
              <div style="font-size:1.08em;color:#1e293b;"><b>Nombre d'opérations :</b> ${
                allOps.length
              }</div>
            `;
            box.appendChild(infoBar);

            // Contenu scrollable avec tableau des opérations
            const detailContent = document.createElement("div");
            detailContent.style.padding = "24px 32px 28px 32px";
            detailContent.style.background = "#f8fafc";
            detailContent.style.flex = "1 1 auto";
            detailContent.style.overflowY = "auto";
            detailContent.style.maxHeight = "calc(95vh - 120px)";
            detailContent.style.fontSize = "1.04em";

            // Tableau des opérations
            // Liste des opérations (style carte/liste)
            let opsHtml = "";
            if (allOps.length > 0) {
              allOps.sort((a, b) => {
                const da = a.created_at ? new Date(a.created_at) : new Date(0);
                const db = b.created_at ? new Date(b.created_at) : new Date(0);
                return db - da;
              });
              opsHtml += `<ol style='display:flex;flex-direction:column;gap:22px;counter-reset:opnum;margin:0;padding:0;list-style:none;'>`;
              allOps.forEach((op, idx) => {
                opsHtml += `
      <li style="background:#fff;border-radius:14px;box-shadow:0 4px 18px #e0e7ef;padding:22px 28px 18px 28px;border-left:7px solid #2563eb;position:relative;counter-increment:opnum;">
        <span style='position:absolute;left:-32px;top:24px;font-size:1.25em;font-weight:700;color:#2563eb;opacity:0.18;user-select:none;'>#${
          idx + 1
        }</span>
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:10px;flex-wrap:wrap;">
          <span style="font-size:1.18em;font-weight:700;color:#2563eb;letter-spacing:0.5px;">${
            op.created_at
              ? new Date(op.created_at).toLocaleDateString("fr-FR")
              : "-"
          }</span>
          <span style="background:linear-gradient(90deg,#fde047 60%,#facc15 100%);color:#78350f;padding:2px 16px;border-radius:7px;font-weight:700;border:2px solid #eab308;box-shadow:0 0 0 2px #fde047;">${
            op.container_number || "-"
          }</span>
        </div>
                <div style="display:grid;grid-template-columns:repeat(2, minmax(220px, 1fr));gap:10px 38px;margin-top:6px;">
          <div style='display:flex;'><span style='display:inline-block;width:120px;font-weight:600;color:#64748b;'>Mise en livraison :</span><span style='color:#1e293b;font-weight:600;'>${
            op.delivery_status_acconier_fr ||
            mapStatus(op.delivery_status_acconier || op.status || "-")
          }</span></div>
          <div style='display:flex;'><span style='display:inline-block;width:120px;font-weight:600;color:#64748b;'>Observation :</span><span style='color:#334155;'>${
            op.observation_acconier || op.delivery_notes || "-"
          }</span></div>
          <div style='display:flex;'><span style='display:inline-block;width:120px;font-weight:600;color:#64748b;'>N° BL :</span><span style='color:#334155;'>${
            op.bl_number || "-"
          }</span></div>
          <div style='display:flex;'><span style='display:inline-block;width:120px;font-weight:600;color:#64748b;'>N° Déclaration :</span><span style='color:#334155;'>${
            op.declaration_number || "-"
          }</span></div>
          <div style='display:flex;'><span style='display:inline-block;width:120px;font-weight:600;color:#64748b;'>Lieu :</span><span style='color:#334155;'>${
            op.lieu || "-"
          }</span></div>
          <div style='display:flex;'><span style='display:inline-block;width:120px;font-weight:600;color:#64748b;'>Compagnie :</span><span style='color:#334155;'>${
            op.shipping_company || "-"
          }</span></div>
          <div style='display:flex;'><span style='display:inline-block;width:120px;font-weight:600;color:#64748b;'>Navire :</span><span style='color:#334155;'>${
            op.ship_name || "-"
          }</span></div>
          <div style='display:flex;'><span style='display:inline-block;width:120px;font-weight:600;color:#64748b;'>Contenu :</span><span style='color:#334155;'>${
            op.container_type_and_content || "-"
          }</span></div>
          <div style='display:flex;'><span style='display:inline-block;width:120px;font-weight:600;color:#64748b;'>Transport :</span><span style='color:#334155;'>${
            op.transporter_mode || "-"
          }</span></div>
        </div>
      </li>
    `;
              });
              opsHtml += `</ol>`;
            } else {
              opsHtml =
                "<div style='text-align:center;color:#888;font-size:1.1em;padding:2em;'>Aucune opération trouvée.</div>";
            }
            detailContent.innerHTML = opsHtml;
            box.appendChild(detailContent);

            // Ajout du box à la modale
            modal.appendChild(box);
            document.body.appendChild(modal);

            // Animation d'apparition
            setTimeout(() => {
              modal.style.opacity = 1;
            }, 10);

            // Fermeture par clic sur le fond
            modal.onclick = (evt) => {
              if (evt.target === modal) {
                modal.remove();
                document.body.classList.remove("overflow-hidden");
              }
            };
            document.body.classList.add("overflow-hidden");
            // Petite animation CSS (optionnelle)
            if (!document.getElementById("popupClientFolderDetailsStyle")) {
              const style = document.createElement("style");
              style.id = "popupClientFolderDetailsStyle";
              style.innerHTML = `@keyframes popupFadeIn { from { transform: scale(0.97) translateY(30px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                .popup-client-folder-details table th, .popup-client-folder-details table td { border-right:1px solid #f1f5f9; }
                .popup-client-folder-details table th:last-child, .popup-client-folder-details table td:last-child { border-right:none; }
                .popup-client-folder-details table tbody tr:hover { background:#fef9c3; }
              `;
              document.head.appendChild(style);
            }
          };

          dossiersGrid.appendChild(clientBlock);
        });
        content.appendChild(dossiersGrid);
      }

      // Recherche dynamique agents
      // (Déplacé dans renderAgentList ci-dessus, pour éviter le bug d'écrasement de saisie)

      // Affichage initial : liste des agents
      renderAgentList("");

      // Drag & drop de la boîte
      let isDragging = false,
        dragOffset = { x: 0, y: 0 };
      header.style.cursor = "move";
      header.onmousedown = (e) => {
        isDragging = true;
        dragOffset.x = e.clientX - box.getBoundingClientRect().left;
        dragOffset.y = e.clientY - box.getBoundingClientRect().top;
        document.body.style.userSelect = "none";
      };
      document.onmousemove = (e) => {
        if (!isDragging) return;
        let left = e.clientX - dragOffset.x;
        let top = e.clientY - dragOffset.y;
        left = Math.max(
          10,
          Math.min(left, window.innerWidth - box.offsetWidth - 10)
        );
        top = Math.max(
          10,
          Math.min(top, window.innerHeight - box.offsetHeight - 10)
        );
        box.style.position = "fixed";
        box.style.left = left + "px";
        box.style.top = top + "px";
        box.style.transform = "none";
      };
      document.onmouseup = () => {
        isDragging = false;
        document.body.style.userSelect = "";
      };

      // Ajout de la modale au DOM
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      // Fermeture par clic sur le fond
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          if (typeof deliveriesTable !== "undefined" && deliveriesTable)
            deliveriesTable.style.display = "table";
          if (clientFoldersContainer)
            clientFoldersContainer.style.display = "none";
          if (typeof dossiersBtn !== "undefined" && dossiersBtn)
            dossiersBtn.style.display = "inline-block";
        }
      };
    }

    // Fonction pour filtrer la modale sur un agent donné (tous clients)
    function showClientFoldersModalForAgent(agentName) {
      // Supprime la modale actuelle
      const oldModal = document.getElementById("clientFoldersModal");
      if (oldModal) oldModal.remove();
      // Filtre les livraisons de cet agent
      const filteredDeliveries = deliveries.filter(
        (d) => (d.employee_name || "Agent inconnu") === agentName
      );
      // Ouvre la modale avec uniquement les dossiers de cet agent
      showClientFoldersModalWithData(filteredDeliveries, agentName);
    }

    // Variante de showClientFoldersModal pour un sous-ensemble de livraisons (filtrage agent)
    function showClientFoldersModalWithData(filteredDeliveries, agentName) {
      // Supprime toute ancienne modale si présente
      const oldModal = document.getElementById("clientFoldersModal");
      if (oldModal) oldModal.remove();

      // Création du fond semi-transparent
      const overlay = document.createElement("div");
      overlay.id = "clientFoldersModal";
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

      // Boîte centrale flottante
      const box = document.createElement("div");
      box.style.background = "#fff";
      box.style.borderRadius = "16px";
      box.style.boxShadow = "0 12px 40px rgba(30,41,59,0.22)";
      box.style.maxWidth = "1100px";
      box.style.width = "98vw";
      box.style.maxHeight = "92vh";
      box.style.overflowY = "auto";
      box.style.padding = "0";
      box.style.position = "relative";
      box.style.display = "flex";
      box.style.flexDirection = "column";

      // Header flottant
      const header = document.createElement("div");
      header.style.background = "#2563eb";
      header.style.color = "#fff";
      header.style.padding = "20px 32px 16px 32px";
      header.style.fontWeight = "bold";
      header.style.fontSize = "1.35rem";
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.borderTopLeftRadius = "16px";
      header.style.borderTopRightRadius = "16px";
      header.innerHTML = `<span>Dossiers de l'agent <span style='color:#eab308;'>${agentName}</span> (tous clients)</span>`;

      // Bouton de fermeture
      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "&times;";
      closeBtn.style.background = "none";
      closeBtn.style.border = "none";
      closeBtn.style.color = "#fff";
      closeBtn.style.fontSize = "2.2rem";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.marginLeft = "18px";
      closeBtn.setAttribute("aria-label", "Fermer");
      closeBtn.onclick = () => {
        overlay.remove();
        if (typeof deliveriesTable !== "undefined" && deliveriesTable)
          deliveriesTable.style.display = "table";
        const clientFoldersContainer = document.getElementById(
          "clientFoldersContainer"
        );
        if (clientFoldersContainer)
          clientFoldersContainer.style.display = "none";
        if (typeof dossiersBtn !== "undefined" && dossiersBtn)
          dossiersBtn.style.display = "inline-block";
      };
      header.appendChild(closeBtn);
      box.appendChild(header);

      // Contenu scrollable
      const content = document.createElement("div");
      content.style.padding = "24px 24px 24px 24px";
      content.style.background = "#f8fafc";
      content.style.flex = "1 1 auto";
      content.style.overflowY = "auto";

      // Regroupement par client > date
      const foldersData = buildClientFoldersData(filteredDeliveries);
      if (Object.keys(foldersData).length === 0) {
        content.innerHTML = `<div style='text-align:center;color:#888;font-size:1.1rem;padding:2em;'>Aucun dossier trouvé pour cet agent.</div>`;
      } else {
        for (const agent in foldersData) {
          for (const client in foldersData[agent]) {
            for (const date in foldersData[agent][client]) {
              const dossiers = foldersData[agent][client][date];
              dossiers.forEach((dossier) => {
                const dossierDiv = document.createElement("div");
                dossierDiv.className =
                  "client-folder-block mb-3 p-3 rounded shadow-sm";
                dossierDiv.style.background =
                  "linear-gradient(120deg,#fffbe6 80%,#fef9c3 100%)";
                dossierDiv.style.borderLeft = "7px solid #eab308";
                dossierDiv.style.marginBottom = "2.3em";
                dossierDiv.style.boxShadow =
                  "0 8px 32px rgba(234,179,8,0.13), 0 1.5px 0 #fde047 inset";
                dossierDiv.style.display = "flex";
                dossierDiv.style.flexDirection = "column";
                dossierDiv.style.gap = "1.2em";

                // Bandeau infos dossier
                const bandeau = document.createElement("div");
                bandeau.style.display = "flex";
                bandeau.style.alignItems = "center";
                bandeau.style.gap = "1.3em";
                bandeau.style.flexWrap = "wrap";
                bandeau.style.marginBottom = "0.2em";
                bandeau.innerHTML = `
                  <span style='font-weight:600;color:#2563eb;'>${
                    dossier.client_name || "Client inconnu"
                  }</span>
                  <span style='color:#888;font-size:0.98em;'><i class="fa fa-calendar"></i> ${
                    dossier.created_at
                      ? new Date(dossier.created_at).toLocaleDateString("fr-FR")
                      : "Date inconnue"
                  }</span>
                  <span style='color:#2563eb;font-size:0.98em;font-weight:500;cursor:pointer;text-decoration:underline dotted #2563eb;' class='agent-name-link' data-agent="${
                    dossier.employee_name || agent
                  }">${dossier.employee_name || agent}</span>
                `;
                dossierDiv.appendChild(bandeau);

                // Infos principales dossier
                const infos = document.createElement("div");
                infos.style.display = "flex";
                infos.style.flexWrap = "wrap";
                infos.style.gap = "1.5em";
                infos.style.marginTop = "0.4em";
                infos.style.marginBottom = "0.2em";
                infos.innerHTML = `
                  <span><strong>N° BL :</strong> ${
                    dossier.bl_number || "-"
                  }</span>
                  <span><strong>N° Déclaration :</strong> ${
                    dossier.declaration_number || "-"
                  }</span>
                  <span><strong>N° TC(s) :</strong> ${
                    dossier.container_number || "-"
                  }</span>
                  <span><strong>Lieu de livraison :</strong> ${
                    dossier.lieu || "-"
                  }</span>
                  <span><strong>Période :</strong> ${
                    dossier.created_at
                      ? new Date(dossier.created_at).toLocaleDateString("fr-FR")
                      : "-"
                  }</span>
                  <span><strong>Statut :</strong> ${
                    dossier.delivery_status_acconier || dossier.status || "-"
                  }</span>
                  <span><strong>Compagnie maritime :</strong> ${
                    dossier.shipping_company || "-"
                  }</span>
                  <span><strong>Navire :</strong> ${
                    dossier.ship_name || "-"
                  }</span>
                  <span><strong>Contenu :</strong> ${
                    dossier.container_type_and_content || "-"
                  }</span>
                  <span><strong>Mode de transport :</strong> ${
                    dossier.transporter_mode || "-"
                  }</span>
                  <span><strong>Client :</strong> ${
                    dossier.client_name || "-"
                  }</span>
                  <span><strong>Téléphone :</strong> ${
                    dossier.client_phone || "-"
                  }</span>
                `;
                dossierDiv.appendChild(infos);

                // Liste ordonnée des opérations (cartes stylées)
                if (
                  Array.isArray(dossier.operations) &&
                  dossier.operations.length > 0
                ) {
                  const opList = document.createElement("ol");
                  opList.style.listStyle = "none";
                  opList.style.padding = "0";
                  opList.style.margin = "1.7em 0 0 0";
                  opList.style.display = "flex";
                  opList.style.flexDirection = "column";
                  opList.style.gap = "1.7em";
                  dossier.operations.forEach((op, idx) => {
                    const opCard = document.createElement("li");
                    opCard.style.background =
                      "linear-gradient(120deg,#f1f5f9 80%,#e0e7ff 100%)";
                    opCard.style.border = "2.5px solid #2563eb";
                    opCard.style.borderRadius = "13px";
                    opCard.style.boxShadow = "0 4px 18px rgba(37,99,235,0.13)";
                    opCard.style.padding = "1.3em 2.3em 1.1em 2.3em";
                    opCard.style.display = "flex";
                    opCard.style.alignItems = "center";
                    opCard.style.gap = "1.7em";
                    opCard.style.position = "relative";
                    opCard.style.transition = "box-shadow 0.16s, border 0.16s";
                    opCard.onmouseover = () => {
                      opCard.style.boxShadow =
                        "0 12px 32px rgba(37,99,235,0.18)";
                      opCard.style.border = "2.5px solid #1e293b";
                    };
                    opCard.onmouseout = () => {
                      opCard.style.boxShadow =
                        "0 4px 18px rgba(37,99,235,0.13)";
                      opCard.style.border = "2.5px solid #2563eb";
                    };
                    // Numéro d'ordre
                    const opNum = document.createElement("div");
                    opNum.textContent = `#${idx + 1}`;
                    opNum.style.background =
                      "linear-gradient(90deg,#2563eb 60%,#1e293b 100%)";
                    opNum.style.color = "#fff";
                    opNum.style.fontWeight = "bold";
                    opNum.style.fontSize = "1.18em";
                    opNum.style.borderRadius = "10px";
                    opNum.style.padding = "7px 24px";
                    opNum.style.marginRight = "1.7em";
                    opNum.style.boxShadow = "0 2px 8px rgba(30,41,59,0.13)";
                    opCard.appendChild(opNum);
                    // Infos principales (plus lisible)
                    const opInfo = document.createElement("div");
                    opInfo.style.flex = "1 1 auto";
                    opInfo.style.display = "flex";
                    opInfo.style.flexDirection = "column";
                    opInfo.style.gap = "0.5em";
                    opInfo.innerHTML = `
                      <span style='font-weight:600;color:#1e293b;font-size:1.08em;'>${
                        op.container_number || "Conteneur ?"
                      }</span>
                      <span style='color:#64748b;font-size:0.99em;'>${
                        op.created_at
                          ? new Date(op.created_at).toLocaleDateString("fr-FR")
                          : "-"
                      }</span>
                      <span style='color:#2563eb;font-weight:600;font-size:1em;'>${
                        op.delivery_status_acconier_fr ||
                        op.delivery_status_acconier ||
                        op.status ||
                        "-"
                      }</span>
                    `;
                    opCard.appendChild(opInfo);
                    // Observation (si présente)
                    if (op.observation_acconier || op.delivery_notes) {
                      const obs = document.createElement("div");
                      obs.textContent =
                        op.observation_acconier || op.delivery_notes;
                      obs.style.fontSize = "1em";
                      obs.style.color = "#eab308";
                      obs.style.marginTop = "0.5em";
                      obs.style.fontStyle = "italic";
                      opInfo.appendChild(obs);
                    }
                    // Bouton détail
                    const detailBtn = document.createElement("button");
                    detailBtn.textContent = "Détail";
                    detailBtn.className = "btn btn-outline-primary";
                    detailBtn.style.marginLeft = "auto";
                    detailBtn.style.fontWeight = "600";
                    detailBtn.style.fontSize = "1em";
                    detailBtn.style.borderRadius = "10px";
                    detailBtn.style.border = "2px solid #2563eb";
                    detailBtn.style.background = "#fff";
                    detailBtn.style.color = "#2563eb";
                    detailBtn.style.padding = "8px 28px";
                    detailBtn.style.cursor = "pointer";
                    detailBtn.style.boxShadow =
                      "0 2px 8px rgba(37,99,235,0.10)";
                    detailBtn.onclick = (e) => {
                      e.stopPropagation();
                      showOperationDetailModal(op);
                    };
                    opCard.appendChild(detailBtn);
                    opList.appendChild(opCard);
                  });
                  dossierDiv.appendChild(opList);
                }
                content.appendChild(dossierDiv);
              });
            }
          }
        }
      }
      box.appendChild(content);

      // Ajout du filtrage par agent au clic sur le nom de l'agent
      content.querySelectorAll(".agent-name-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          const agentName = e.target.getAttribute("data-agent");
          showClientFoldersModalForAgent(agentName);
        });
      });

      // Drag & drop de la boîte
      let isDragging = false,
        dragOffset = { x: 0, y: 0 };
      header.style.cursor = "move";
      header.onmousedown = (e) => {
        isDragging = true;
        dragOffset.x = e.clientX - box.getBoundingClientRect().left;
        dragOffset.y = e.clientY - box.getBoundingClientRect().top;
        document.body.style.userSelect = "none";
      };
      document.onmousemove = (e) => {
        if (!isDragging) return;
        let left = e.clientX - dragOffset.x;
        let top = e.clientY - dragOffset.y;
        left = Math.max(
          10,
          Math.min(left, window.innerWidth - box.offsetWidth - 10)
        );
        top = Math.max(
          10,
          Math.min(top, window.innerHeight - box.offsetHeight - 10)
        );
        box.style.position = "fixed";
        box.style.left = left + "px";
        box.style.top = top + "px";
        box.style.transform = "none";
      };
      document.onmouseup = () => {
        isDragging = false;
        document.body.style.userSelect = "";
      };

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          if (typeof deliveriesTable !== "undefined" && deliveriesTable)
            deliveriesTable.style.display = "table";
          const clientFoldersContainer = document.getElementById(
            "clientFoldersContainer"
          );
          if (clientFoldersContainer)
            clientFoldersContainer.style.display = "none";
          if (typeof dossiersBtn !== "undefined" && dossiersBtn)
            dossiersBtn.style.display = "inline-block";
        }
      };
    }
  }

  // (supprimé, déjà ajouté dans le bloc ci-dessus)
  // backToTableBtn inutile avec la modale
  // Add a global click listener to close any open dropdowns when clicking outside
  document.addEventListener("click", (event) => {
    document
      .querySelectorAll(".dropdown-content.show")
      .forEach((openDropdown) => {
        const dropdownCell = openDropdown.closest(".dropdown-cell-container");
        if (dropdownCell && !dropdownCell.contains(event.target)) {
          openDropdown.classList.remove("show");
        }
      });
  });

  if (mainTableDateFilter) {
    const year = currentMainFilterDate.getFullYear();
    const month = String(currentMainFilterDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentMainFilterDate.getDate()).padStart(2, "0");

    const formattedDateForInput = `${year}-${month}-${day}`;

    console.log("Applying date to filter input:", formattedDateForInput);
    mainTableDateFilter.value = formattedDateForInput;
    updateAgentStatusIndicator();
    mainTableDateFilter.addEventListener("change", () => {
      updateAgentStatusIndicator();
    });
  } else {
    console.error(
      "Error: The element #mainTableDateFilter was not found in the DOM!"
    );
  }
  await loadDeliveries(); // This now triggers applyCombinedFilters()

  // Initialize WebSocket connection AFTER initial data load
  initializeWebSocket(); // <--- MOVED HERE

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        // The old filterDeliveriesByContainerNumber is replaced by applyCombinedFilters
        applyCombinedFilters();
      }
    });

    searchInput.addEventListener("search", () => {
      if (searchInput.value.trim() === "") {
        console.log("Search field cleared, resetting filter.");
        applyCombinedFilters();
      }
    });
  }

  // (Sécurité) Désactive l'autocomplétion sur le champ de recherche si jamais il est généré dynamiquement
  if (searchInput) {
    searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute("autocorrect", "off");
    searchInput.setAttribute("autocapitalize", "off");
    searchInput.setAttribute("spellcheck", "false");
  }

  // (Sécurité) Désactive l'autocomplétion sur le champ Responsable de livraison si jamais il est généré dynamiquement
  const deliveryResponsibleInput = document.getElementById(
    "deliveryResponsibleInput"
  );
  if (deliveryResponsibleInput) {
    deliveryResponsibleInput.setAttribute("autocomplete", "off");
    deliveryResponsibleInput.setAttribute("autocorrect", "off");
    deliveryResponsibleInput.setAttribute("autocapitalize", "off");
    deliveryResponsibleInput.setAttribute("spellcheck", "false");
    // Restaure la valeur sauvegardée si présente
    const savedValue = localStorage.getItem("deliveryResponsibleValue");
    if (savedValue) deliveryResponsibleInput.value = savedValue;
    // Sauvegarde à chaque modification
    deliveryResponsibleInput.addEventListener("input", function () {
      localStorage.setItem(
        "deliveryResponsibleValue",
        deliveryResponsibleInput.value
      );
    });
  }

  if (statusFilterSelect) {
    statusFilterSelect.addEventListener("change", applyCombinedFilters);
    populateStatusFilter();
  }

  if (mainTableDateFilter) {
    mainTableDateFilter.addEventListener("change", (e) => {
      currentMainFilterDate = normalizeDateToMidnight(new Date(e.target.value));
      localStorage.setItem("mainTableFilterDate", e.target.value);
      applyCombinedFilters();
    });
    mainTableDateFilter.addEventListener("input", () => {
      if (!mainTableDateFilter.value) {
        // If the date input is cleared, set currentMainFilterDate to today for the scrolling bar
        // and clear the main table filter.
        currentMainFilterDate = normalizeDateToMidnight(new Date()); // Default to today for scrolling bar
        localStorage.removeItem("mainTableFilterDate");
        applyCombinedFilters(); // This will render the main table for all dates if filter is empty
      }
    });
  }

  if (searchButton) {
    searchButton.addEventListener("click", () => {
      // The old filterDeliveriesByContainerNumber is replaced by applyCombinedFilters
      applyCombinedFilters();
    });
  }

  if (statusFilterSelect) {
    statusFilterSelect.addEventListener("change", applyCombinedFilters);
    populateStatusFilter();
  }

  if (activateEditBtn) {
    activateEditBtn.addEventListener("click", handleEditButtonClick);
  }
  if (closePopupBtnCode) {
    closePopupBtnCode.addEventListener("click", hideCodeEntryPopup);
  }
  if (submitCodeBtn) {
    submitCodeBtn.addEventListener("click", validateEditCode);
  }
  if (editCodeInput) {
    editCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        validateEditCode();
      }
    });
  }
  if (codeEntryPopup) {
    codeEntryPopup.addEventListener("click", (e) => {
      if (e.target === codeEntryPopup) {
        hideCodeEntryPopup();
      }
    });
  }

  // Event listener for "Suivi spécifique agent" button
  if (employeeTrackingBtn) {
    employeeTrackingBtn.addEventListener("click", toggleEmployeePopup);
  }

  // Event listener for closing employee popup button
  if (closeEmployeePopupBtn) {
    closeEmployeePopupBtn.addEventListener("click", hideEmployeePopup);
  }

  // Global click listener to close employee popup if clicking outside
  document.addEventListener("click", (e) => {
    // Ensure employeePopup, employeeTrackingBtn, and codeEntryPopup exist before checking contains
    const isClickInsideEmployeePopup =
      employeePopup && employeePopup.contains(e.target);
    const isClickOnEmployeeTrackingBtn =
      employeeTrackingBtn && employeeTrackingBtn.contains(e.target);
    const isClickInsideCodeEntryPopup =
      codeEntryPopup && codeEntryPopup.contains(e.target);

    if (
      employeePopup &&
      employeePopup.classList.contains("is-visible") &&
      !isClickInsideEmployeePopup &&
      !isClickOnEmployeeTrackingBtn &&
      !isClickInsideCodeEntryPopup
    ) {
      hideEmployeePopup();
    }
  });

  if (employeeSearchInput) {
    employeeSearchInput.addEventListener("input", filterEmployeeList);
  }

  if (closeAgentActivityBoxBtn) {
    closeAgentActivityBoxBtn.addEventListener("click", hideAgentActivityBox);
  }
  if (evaluateAgentBtn) {
    evaluateAgentBtn.addEventListener("click", () => {
      showCustomAlert(
        "La fonction d'évaluation de l'agent sera implémentée ici !",
        "info"
      );
    });
  }

  // NEW: Add event listener for PDF generation button for agent table
  if (generateAgentPdfBtn) {
    generateAgentPdfBtn.addEventListener("click", generateAgentPdf);
  }

  if (prevDayBtn) {
    prevDayBtn.addEventListener("click", () => navigateAgentActivityDate(-1));
  }
  if (nextDayBtn) {
    nextDayBtn.addEventListener("click", () => navigateAgentActivityDate(1));
  }

  if (agentActivityBox) {
    let isDraggingAgentBox = false;
    let offset = { x: 0, y: 0 };
    const header = agentActivityBox.querySelector(".agent-activity-header");

    if (header) {
      header.addEventListener("mousedown", (e) => {
        isDraggingAgentBox = true;
        agentActivityBox.classList.add("dragging");
        offset = {
          x: agentActivityBox.offsetLeft - e.clientX,
          y: agentActivityBox.offsetTop - e.clientY,
        };
      });

      document.addEventListener("mousemove", (e) => {
        if (!isDraggingAgentBox) return;
        let newLeft = e.clientX + offset.x;
        let newTop = e.clientY + offset.y;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const boxWidth = agentActivityBox.offsetWidth;
        const boxHeight = agentActivityBox.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, viewportWidth - boxWidth));
        newTop = Math.max(0, Math.min(newTop, viewportHeight - boxHeight));

        agentActivityBox.style.left = newLeft + "px";
        agentActivityBox.style.top = newTop + "px";
        agentActivityBox.style.transform = "none";
      });

      document.addEventListener("mouseup", () => {
        isDraggingAgentBox = false;
        agentActivityBox.classList.remove("dragging");
      });

      header.addEventListener("touchstart", (e) => {
        isDraggingAgentBox = true;
        agentActivityBox.classList.add("dragging");
        const touch = e.touches[0];
        offset = {
          x: agentActivityBox.offsetLeft - touch.clientX,
          y: agentActivityBox.offsetTop - touch.clientY,
        };
        e.preventDefault();
      });

      document.addEventListener("touchmove", (e) => {
        if (!isDraggingAgentBox) return;
        const touch = e.touches[0];
        let newLeft = touch.clientX + offset.x;
        let newTop = touch.clientY + offset.y;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const boxWidth = agentActivityBox.offsetWidth;
        const boxHeight = agentActivityBox.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, viewportWidth - boxWidth));
        newTop = Math.max(0, Math.min(newTop, viewportHeight - boxHeight));

        agentActivityBox.style.left = newLeft + "px";
        agentActivityBox.style.top = newTop + "px";
        agentActivityBox.style.transform = "none";
        e.preventDefault();
      });

      document.addEventListener("touchend", () => {
        isDraggingAgentBox = false;
        agentActivityBox.classList.remove("dragging");
      });
    }
  }

  if (toggleSelectionBtn) {
    toggleSelectionBtn.addEventListener("click", () => {
      selectionMode = !selectionMode;

      if (thNumero && checkboxHeaderPlaceholder) {
        checkboxHeaderPlaceholder.innerHTML = "";
        if (selectionMode) {
          thNumero.textContent = "";
          const masterCheckbox = document.createElement("input");
          masterCheckbox.type = "checkbox";
          masterCheckbox.id = "masterSelectAll";
          masterCheckbox.className = "form-check-input ms-2";
          masterCheckbox.addEventListener("change", (e) => {
            const checkboxes = deliveriesTableBody.querySelectorAll(
              ".delivery-select-checkbox"
            );
            checkboxes.forEach((cb) => (cb.checked = e.target.checked));
            if (deleteSelectedDeliveriesBtn) {
              deleteSelectedDeliveriesBtn.style.display = e.target.checked
                ? "inline-block"
                : "none";
            }
          });
          checkboxHeaderPlaceholder.appendChild(masterCheckbox);
        } else {
          thNumero.textContent = "N°";
        }
      }

      if (deleteSelectedDeliveriesBtn) {
        deleteSelectedDeliveriesBtn.style.display = "none";
      }

      applyCombinedFilters();
    });
  }

  if (deleteSelectedDeliveriesBtn) {
    deleteSelectedDeliveriesBtn.addEventListener("click", async () => {
      const checkedBoxes = deliveriesTableBody.querySelectorAll(
        ".delivery-select-checkbox:checked"
      );
      if (checkedBoxes.length === 0) {
        showCustomAlert("Aucune livraison sélectionnée à supprimer.", "info");
        return;
      }

      const confirmOverlay = document.createElement("div");
      confirmOverlay.className = "confirm-overlay";
      confirmOverlay.style.position = "fixed";
      confirmOverlay.style.top = "0";
      confirmOverlay.style.left = "0";
      confirmOverlay.style.width = "100%";
      confirmOverlay.style.height = "100%";
      confirmOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      confirmOverlay.style.display = "flex";
      confirmOverlay.style.justifyContent = "center";
      confirmOverlay.style.alignItems = "center";
      confirmOverlay.style.zIndex = "9999"; // Ensure it's on top of other elements, including dropdowns
      confirmOverlay.innerHTML = `
                                <div class="confirm-box">
                                  <p>Êtes-vous sûr de vouloir supprimer ${
                                    checkedBoxes.length > 1
                                      ? `les ${checkedBoxes.length} livraisons sélectionnées`
                                      : `la livraison sélectionnée`
                                  } ?</p>
                                  <div class="confirm-buttons">
                                    <button id="confirmYes" class="btn btn-danger">Oui</button>
                                    <button id="confirmNo" class="btn btn-secondary">Non</button>
                                  </div>
                                </div>
                            `;
      document.body.appendChild(confirmOverlay);
      document.body.style.overflow = "hidden";

      const confirmDelete = await new Promise((resolve) => {
        const handleKeyDown = (e) => {
          if (e.key === "Enter") {
            document.removeEventListener("keydown", handleKeyDown);
            confirmOverlay.remove();
            document.body.style.overflow = "";
            resolve(true);
          } else if (e.key === "Escape") {
            document.removeEventListener("keydown", handleKeyDown);
            confirmOverlay.remove();
            document.body.style.overflow = "";
            resolve(false);
          }
        };
        document.addEventListener("keydown", handleKeyDown);

        document.getElementById("confirmYes").onclick = () => {
          document.removeEventListener("keydown", handleKeyDown);
          confirmOverlay.remove();
          document.body.style.overflow = "";
          resolve(true);
        };
        document.getElementById("confirmNo").onclick = () => {
          document.removeEventListener("keydown", handleKeyDown);
          confirmOverlay.remove();
          document.body.style.overflow = "";
          resolve(false);
        };
      });

      if (!confirmDelete) {
        return;
      }

      const idsToDelete = Array.from(checkedBoxes).map(
        (cb) => cb.dataset.deliveryId
      );
      await deleteDeliveries(idsToDelete);
      // Mise à jour immédiate de l'alerte dossier en retard
      if (typeof checkLateContainers === "function") checkLateContainers();
      deleteSelectedDeliveriesBtn.style.display = "none";
      selectionMode = false;
      thNumero.textContent = "N°";
      const masterCheckbox = document.getElementById("masterSelectAll");
      if (masterCheckbox) {
        masterCheckbox.remove();
      }
      applyCombinedFilters();
    });
  }

  // NEW: Add event listener for the PDF generation button
  if (generatePdfBtn) {
    generatePdfBtn.addEventListener("click", generateDeliveriesPdf);
  }

  console.log(`Automatic refresh every ${REFRESH_INTERVAL / 1000} seconds.`);

  // Keep the polling interval for now as a fallback or for other data that doesn't trigger WebSocket
  setInterval(async () => {
    console.log("Automatic delivery refresh (polling)...");
    if (
      !isEditingMode &&
      (!codeEntryPopup || codeEntryPopup.style.display === "none")
    ) {
      await loadDeliveries();
      // L'alerte sera réactualisée dans loadDeliveries
      if (
        agentActivityBox &&
        agentActivityBox.classList.contains("active") &&
        selectedAgentName // Use global selectedAgentName
      ) {
        showAgentActivity(
          selectedAgentName, // Use global selectedAgentName
          currentAgentActivityDate // Use global currentAgentActivityDate
        );
      }
    } else {
      console.log(
        "Automatic delivery refresh (polling) suspended (edit mode or popup active)."
      );
    }
  }, REFRESH_INTERVAL);
  // Expose global variables and functions for other scripts (if needed, though generally discouraged)
  window.deliveries = deliveries;
  window.uniqueEmployees = uniqueEmployees;
  window.loadDeliveries = loadDeliveries;
  window.showCustomAlert = showCustomAlert;
  window.normalizeDateToMidnight = normalizeDateToMidnight;
  window.getStatusInfo = getStatusInfo;
  window.selectedAgentName = selectedAgentName;
  window.currentAgentActivityDate = currentAgentActivityDate;
  window.showAgentActivity = showAgentActivity;

  // ================= AJOUT : Rafraîchissement dynamique du tableau dossiers en retard =================
  // Fonction utilitaire pour détecter les agents en retard (à adapter selon ta logique métier)
  function getLateAgentsFromDeliveries(deliveries) {
    // On considère qu'un agent est en retard s'il a au moins un conteneur non livré
    const lateAgents = {};
    // === LOG DIAGNOSTIC (avant recalcul) ===
    console.log("[SYNC DIAG][BEFORE] window.deliveries :", deliveries);
    deliveries.forEach((d, idx) => {
      const agent = d.employee_name || "Agent inconnu";
      const status = d.status;
      const acconierStatus = d.delivery_status_acconier;
      const isDelivered = (status || acconierStatus || "")
        .toString()
        .toLowerCase()
        .includes("livr");
      // === LOG DÉTAILLÉ PAR LIVRAISON ===
      console.log(
        `[SYNC DIAG][LIVRAISON][#${idx}] Agent: ${agent} | status: '${status}' | acconier: '${acconierStatus}' | isDelivered:`,
        isDelivered
      );
      if (!isDelivered) {
        if (!lateAgents[agent]) lateAgents[agent] = 0;
        lateAgents[agent]++;
      }
    });
    // === LOG DIAGNOSTIC (après recalcul) ===
    console.log("[SYNC DIAG][AFTER] lateAgents (avant return) :", lateAgents);
    return Object.keys(lateAgents);
  }

  // Fonction pour rafraîchir le tableau des dossiers en retard
  function refreshLateFoldersTable() {
    // Sélectionne le tableau (adapte l'ID ou la classe selon ton HTML)
    const lateTable = document.getElementById("lateFoldersTable");
    if (!lateTable) return;
    // Vide le tableau
    lateTable.querySelector("tbody").innerHTML = "";
    // Récalcule la liste des agents en retard
    const lateAgents = getLateAgentsFromDeliveries(deliveries);
    // === LOG DIAGNOSTIC ===
    console.log(
      "[SYNC DIAG][AVANT] lateAgents (avant affichage) :",
      lateAgents
    );
    // Pour chaque agent en retard, ajoute une ligne
    lateAgents.forEach((agent) => {
      const tr = document.createElement("tr");
      const tdAgent = document.createElement("td");
      tdAgent.textContent = agent;
      tr.appendChild(tdAgent);

      // Recherche le premier dossier non livré pour cet agent
      let dossier = null;
      for (const d of deliveries) {
        if (
          (d.employee_name || "Agent inconnu") === agent &&
          d.dossier_number
        ) {
          const status = d.status || d.delivery_status_acconier || "";
          if (!status.toString().toLowerCase().includes("livr")) {
            dossier = d.dossier_number;
            break;
          }
        }
      }

      // Ajoute le numéro de dossier si trouvé
      const tdDossier = document.createElement("td");
      tdDossier.textContent = dossier || "-";
      tr.appendChild(tdDossier);

      // Ajoute le bouton Notifier
      const tdAction = document.createElement("td");
      const notifyBtn = document.createElement("button");
      notifyBtn.textContent = "Notifier";
      notifyBtn.className = "btn btn-warning btn-sm";
      notifyBtn.style.marginLeft = "8px";
      if (!dossier) {
        notifyBtn.disabled = true;
        notifyBtn.title = "Aucun dossier à notifier pour cet agent";
        notifyBtn.style.opacity = "0.6";
      } else {
        notifyBtn.onclick = async function () {
          notifyBtn.disabled = true;
          notifyBtn.textContent = "Envoi...";
          try {
            const response = await fetch("/notify-late-dossier", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agent, dossier }),
            });
            const result = await response.json();
            if (result.success) {
              showCustomAlert("Notification envoyée à l'agent.", "success");
              notifyBtn.textContent = "Envoyé";
            } else {
              showCustomAlert(
                result.message || "Erreur lors de l'envoi.",
                "error"
              );
              notifyBtn.textContent = "Erreur";
            }
          } catch (err) {
            showCustomAlert("Erreur réseau ou serveur.", "error");
            notifyBtn.textContent = "Erreur";
          }
          setTimeout(() => {
            notifyBtn.disabled = false;
            notifyBtn.textContent = "Notifier";
          }, 3000);
        };
      }
      tdAction.appendChild(notifyBtn);
      tr.appendChild(tdAction);

      lateTable.querySelector("tbody").appendChild(tr);
    });
    // Si aucun agent en retard
    if (lateAgents.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 10;
      td.textContent = "Aucun agent en retard.";
      tr.appendChild(td);
      lateTable.querySelector("tbody").appendChild(tr);
    }
  }

  // Ajoute l'eventListener sur le bouton "Rafraîchir la liste" (adapte l'ID selon ton HTML)
  const refreshLateListBtn = document.getElementById("refreshLateListBtn");
  if (refreshLateListBtn) {
    refreshLateListBtn.addEventListener("click", async function () {
      console.log(
        "[SYNC DIAG][BTN] Rafraîchir la liste : rechargement des données..."
      );
      await loadDeliveries();
      console.log(
        "[SYNC DIAG][BTN] Données rechargées, recalcul de la liste des agents en retard..."
      );
      refreshLateFoldersTable();
    });
  }

  // Optionnel : expose la fonction pour l'appeler ailleurs si besoin
  window.refreshLateFoldersTable = refreshLateFoldersTable;

  // ================== CLIGNOTEMENT VERT NOUVELLE LIGNE (FORCÉ) ==================
  // Patch direct sur le tableau principal
  let previousDeliveryIds = new Set();
  function forceBlinkOnNewRows() {
    if (!deliveriesTableBody) return;
    const trs = deliveriesTableBody.querySelectorAll("tr");
    const currentIds = new Set();
    trs.forEach((tr) => {
      // On récupère l'ID de livraison
      let id = tr.getAttribute("data-delivery-id");
      // Si pas d'ID, on utilise l'index
      if (!id) id = tr.rowIndex;
      currentIds.add(id);
      if (!previousDeliveryIds.has(id)) {
        tr.classList.add("row-green-blink");
        tr.querySelectorAll("td").forEach((td) => {
          td.style.transition = "background-color 0.3s";
          td.style.backgroundColor = "#34d399";
        });
        setTimeout(() => {
          tr.classList.remove("row-green-blink");
          tr.querySelectorAll("td").forEach((td) => {
            td.style.backgroundColor = "";
          });
        }, 5000);
        console.log("[FORCE BLINK] Ligne clignotante:", tr);
      }
    });
    previousDeliveryIds = currentIds;
  }

  // Ajoute le style CSS si absent
  (function injectBlinkStyle() {
    if (document.getElementById("rowGreenBlinkStyle")) return;
    const style = document.createElement("style");
    style.id = "rowGreenBlinkStyle";
    style.textContent = `
      @keyframes green-blink {
        0% { background-color: #d1fae5; }
        20% { background-color: #34d399; }
        40% { background-color: #6ee7b7; }
        60% { background-color: #34d399; }
        80% { background-color: #d1fae5; }
        100% { background-color: inherit; }
      }
      .row-green-blink td {
        animation: green-blink 1s linear 0s 5;
        background-color: #34d399 !important;
      }
    `;
    document.head.appendChild(style);
  })();

  // Appelle le clignotement après chaque rendu du tableau principal
  const originalApplyCombinedFilters =
    window.applyCombinedFilters || applyCombinedFilters;
  window.applyCombinedFilters = function (...args) {
    originalApplyCombinedFilters.apply(this, args);
    setTimeout(forceBlinkOnNewRows, 50); // Laisse le DOM se mettre à jour
  };
  // ================== FIN CLIGNOTEMENT VERT ==================
})();
/****** Script a ajouter en cas de pertubxnchbjation 125 GGGAAAA34 ***/
