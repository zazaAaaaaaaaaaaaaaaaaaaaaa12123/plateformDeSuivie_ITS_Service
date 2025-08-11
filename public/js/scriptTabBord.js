// --- Détection automatique de l'URL backend (API et WebSocket) ---
// window.API_BASE_URL = base pour les fetch (http(s)://...)
// window.WS_BASE_HOST = host:port pour WebSocket (sans ws://)
(function setApiBaseUrl() {
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocal) {
    window.API_BASE_URL = "http://localhost:3000";
    window.WS_BASE_HOST = "localhost:3000";
  } else {
    // Render ou prod : même domaine que le frontend
    window.API_BASE_URL = window.location.origin;
    window.WS_BASE_HOST = window.location.host;
  }
})();
// Redirection automatique vers le tableau de bord après connexion réussie
(function () {
  if (window.location.pathname.endsWith("tableauDeBord.html")) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      window.location.href = "index.html";
    }
  }
})();
// --- Affichage des demandes de code entreprise (popup admin) ---
function ouvrirPopupDemandesCodeEntreprise() {
  let popup = document.getElementById("popupDemandeCodeEntreprise");
  if (!popup) return;
  popup.style.display = "flex";
  const tableDiv = document.getElementById("tableDemandesCodeEntreprise");
  const msgDiv = document.getElementById("demandeCodeEntrepriseMsg");
  if (tableDiv)
    tableDiv.innerHTML =
      '<div style="text-align:center;padding:20px 0;color:#2563eb;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
  if (msgDiv) msgDiv.textContent = "";
  fetch(`${window.API_BASE_URL}/api/demande-code-entreprise`)
    .then((res) => res.json())
    .then((data) => {
      // --- Mise à jour du badge du nombre de demandes ---
      let demandes = [];
      if (data && typeof data === "object") {
        if (Array.isArray(data.demandes)) {
          demandes = data.demandes;
        } else if (Array.isArray(data.results)) {
          demandes = data.results;
        } else if (Array.isArray(data.data)) {
          demandes = data.data;
        }
      } else if (Array.isArray(data)) {
        demandes = data;
      }
      const badge = document.getElementById("badgeDemandesCodeEntreprise");
      if (badge) {
        if (Array.isArray(demandes) && demandes.length > 0) {
          badge.textContent = demandes.length;
          badge.style.display = "inline-block";
        } else {
          badge.textContent = "";
          badge.style.display = "none";
        }
      }
      // --- Affichage du tableau comme avant ---
      if (!Array.isArray(demandes)) {
        tableDiv.innerHTML =
          '<div style="color:#dc3545;text-align:center;padding:20px 0;">Format inattendu de la réponse API.<br><pre style="text-align:left;max-width:90vw;overflow-x:auto;background:#f7faff;padding:8px 12px;border-radius:8px;">' +
          JSON.stringify(data, null, 2) +
          "</pre></div>";
        return;
      }
      if (demandes.length === 0) {
        tableDiv.innerHTML =
          '<div style="color:#dc3545;text-align:center;padding:20px 0;">Aucune demande trouvée.</div>';
        return;
      }
      let html = `<div style='overflow-x:auto;max-width:100vw;'><table style='min-width:420px;max-width:700px;margin:auto;border-collapse:collapse;font-size:0.97em;background:#fff;border-radius:10px;box-shadow:0 2px 12px #2563eb11;'>`;
      html += `<thead><tr style='background:#f7faff;'><th style='padding:6px 8px;border-bottom:1px solid #e5e7eb;max-width:110px;'>Nom</th><th style='padding:6px 8px;border-bottom:1px solid #e5e7eb;max-width:150px;'>Email</th><th style='padding:6px 8px;border-bottom:1px solid #e5e7eb;max-width:160px;'>Message</th><th style='padding:6px 8px;border-bottom:1px solid #e5e7eb;max-width:100px;'>Date</th><th style='padding:6px 8px;border-bottom:1px solid #e5e7eb;'>Action</th></tr></thead><tbody>`;
      demandes.forEach((d) => {
        html += `<tr>`;
        html += `<td style='padding:6px 8px;border-bottom:1px solid #f1f1f1;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>${
          d.nom || d.name || "-"
        }</td>`;
        html += `<td style='padding:6px 8px;border-bottom:1px solid #f1f1f1;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>${
          d.email || "-"
        }</td>`;
        html += `<td style='padding:6px 8px;border-bottom:1px solid #f1f1f1;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>${
          d.message || "-"
        }</td>`;
        html += `<td style='padding:6px 8px;border-bottom:1px solid #f1f1f1;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>${
          d.created_at ? new Date(d.created_at).toLocaleString("fr-FR") : "-"
        }</td>`;
        html += `<td style='padding:6px 8px;border-bottom:1px solid #f1f1f1;text-align:center;'><button class='btn-send-code' data-email='${
          d.email || ""
        }' style='padding:4px 10px;font-size:0.97em;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;'>Envoyer code</button></td>`;
        html += `</tr>`;
      });
      html += `</tbody></table></div>`;
      tableDiv.innerHTML = html;
      // Ajout de l'écouteur sur les boutons d'action
      const btns = tableDiv.querySelectorAll(".btn-send-code");
      btns.forEach((btn) => {
        btn.addEventListener("click", function (e) {
          const email = btn.getAttribute("data-email");
          if (!email) {
            showCustomAlert(
              "Email non disponible pour cette demande.",
              "error",
              2500
            );
            return;
          }
          btn.disabled = true;
          btn.textContent = "Envoi...";
          fetch(`${window.API_BASE_URL}/api/envoyer-code-securite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          })
            .then((res) => res.json())
            .then((result) => {
              if (result && result.success) {
                showCustomAlert(
                  "Code de sécurité envoyé à " + email,
                  "success",
                  3000
                );
                btn.textContent = "Envoyé";
                // Masquer la ligne du tableau après envoi réussi
                const tr = btn.closest("tr");
                if (tr) tr.style.display = "none";
              } else {
                showCustomAlert(
                  "Erreur lors de l'envoi du code.",
                  "error",
                  3000
                );
                btn.textContent = "Réessayer";
                btn.disabled = false;
              }
            })
            .catch(() => {
              showCustomAlert("Erreur réseau lors de l'envoi.", "error", 3000);
              btn.textContent = "Réessayer";
              btn.disabled = false;
            });
        });
      });
    })
    .catch((err) => {
      tableDiv.innerHTML =
        '<div style="color:#dc3545;text-align:center;padding:20px 0;">Erreur lors du chargement des demandes.<br>' +
        (err.message || err) +
        "</div>";
    });
}

// --- Attache le bouton sidebar pour ouvrir la popup demandes code entreprise ---
document.addEventListener("DOMContentLoaded", function () {
  // --- Met à jour le badge du nombre de demandes (même si la popup n'est pas ouverte)
  function updateBadgeDemandesCodeEntreprise() {
    fetch(`${window.API_BASE_URL}/api/demande-code-entreprise`)
      .then((res) => res.json())
      .then((data) => {
        let demandes = [];
        if (data && typeof data === "object") {
          if (Array.isArray(data.demandes)) {
            demandes = data.demandes;
          } else if (Array.isArray(data.results)) {
            demandes = data.results;
          } else if (Array.isArray(data.data)) {
            demandes = data.data;
          }
        } else if (Array.isArray(data)) {
          demandes = data;
        }
        const badge = document.getElementById("badgeDemandesCodeEntreprise");
        if (badge) {
          if (Array.isArray(demandes) && demandes.length > 0) {
            badge.textContent = demandes.length;
            badge.style.display = "inline-block";
          } else {
            badge.textContent = "";
            badge.style.display = "none";
          }
        }
      });
  }
  // Appel initial au chargement
  updateBadgeDemandesCodeEntreprise();
  // --- WebSocket temps réel pour demandes de code entreprise ---

  // --- Fallback WebSocket/Polling pour demandes de code entreprise ---
  let wsDemandeCodeEntreprise = null;
  let pollingInterval = null;
  let lastNbDemandes = null;
  function startPollingDemandesCodeEntreprise() {
    if (pollingInterval) return;
    pollingInterval = setInterval(() => {
      fetch(`${window.API_BASE_URL}/api/demande-code-entreprise`)
        .then((res) => res.json())
        .then((data) => {
          let demandes = [];
          if (data && typeof data === "object") {
            if (Array.isArray(data.demandes)) demandes = data.demandes;
            else if (Array.isArray(data.results)) demandes = data.results;
            else if (Array.isArray(data.data)) demandes = data.data;
          } else if (Array.isArray(data)) {
            demandes = data;
          }
          if (
            lastNbDemandes !== null &&
            Array.isArray(demandes) &&
            demandes.length > lastNbDemandes
          ) {
            // Nouvelle demande détectée
            ouvrirPopupDemandesCodeEntreprise();
            updateBadgeDemandesCodeEntreprise();
            showCustomAlert(
              "Nouvelle demande de code entreprise reçue !",
              "success",
              2500
            );
          }
          lastNbDemandes = Array.isArray(demandes) ? demandes.length : null;
        });
    }, 15000); // 15s
    console.warn(
      "[Polling] Fallback AJAX activé pour demandes code entreprise"
    );
  }
  function stopPollingDemandesCodeEntreprise() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }
  function initWebSocketDemandeCodeEntreprise() {
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    let wsUrl = `${wsProtocol}://${window.WS_BASE_HOST}`;
    try {
      wsDemandeCodeEntreprise = new WebSocket(wsUrl);
      wsDemandeCodeEntreprise.onopen = function () {
        console.debug("[WebSocket] Connecté pour demandes code entreprise");
        stopPollingDemandesCodeEntreprise();
      };
      wsDemandeCodeEntreprise.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "nouvelle-demande-code-entreprise") {
            const popup = document.getElementById("popupDemandeCodeEntreprise");
            if (popup && popup.style.display === "none") {
              popup.style.display = "flex";
            }
            ouvrirPopupDemandesCodeEntreprise();
            updateBadgeDemandesCodeEntreprise();
            showCustomAlert(
              "Nouvelle demande de code entreprise reçue !",
              "success",
              2500
            );
          }
          // --- Mise à jour dynamique du statut dossier dans le dashboard ---
          if (data.type === "bl_status_update" && data.dossier_number) {
            const suiviTable = document.querySelector("#suiviContainer table");
            if (suiviTable) {
              const rows = suiviTable.querySelectorAll("tbody tr");
              let updated = false;
              // Trouver les index des colonnes "Statut dossier" et "N° Dossier"
              let dossierCellIndex = -1;
              let statutCellIndex = -1;
              const ths = suiviTable.querySelectorAll("thead th");
              ths.forEach(function (th, idx) {
                if (th.textContent.toLowerCase().includes("statut"))
                  statutCellIndex = idx;
                if (th.textContent.toLowerCase().includes("dossier"))
                  dossierCellIndex = idx;
              });
              rows.forEach(function (row) {
                const cells = row.querySelectorAll("td");
                if (
                  dossierCellIndex !== -1 &&
                  statutCellIndex !== -1 &&
                  cells[dossierCellIndex] &&
                  cells[dossierCellIndex].textContent.trim() ===
                    data.dossier_number
                ) {
                  cells[statutCellIndex].innerHTML =
                    '<span style="color:#f59e0b;font-weight:700;"><i class="fas fa-hourglass-half"></i> Mise en livraison</span>';
                  updated = true;
                }
              });
              if (updated) {
                showCustomAlert(
                  `Dossier ${data.dossier_number} mis en livraison (synchro temps réel) !`,
                  "success",
                  3500
                );
              }
            }
          }
          // --- Ajout : gestion de la notification d'ordre de livraison ---
          // (Suppression de l'alerte ici, elle est désormais gérée dans le tableau de suivi)
        } catch (e) {
          console.warn("[WebSocket] Message non JSON ou erreur :", event.data);
        }
      };
      wsDemandeCodeEntreprise.onclose = function () {
        console.warn("[WebSocket] Déconnecté. Fallback AJAX activé dans 2s...");
        setTimeout(() => {
          startPollingDemandesCodeEntreprise();
          // On retente le WebSocket après 30s
          setTimeout(initWebSocketDemandeCodeEntreprise, 30000);
        }, 2000);
      };
      wsDemandeCodeEntreprise.onerror = function () {
        wsDemandeCodeEntreprise.close();
      };
    } catch (e) {
      console.error("[WebSocket] Erreur d'init :", e);
      startPollingDemandesCodeEntreprise();
    }
  }
  // Lance d'abord le WebSocket, sinon fallback polling
  if (window["WebSocket"]) {
    initWebSocketDemandeCodeEntreprise();
  } else {
    startPollingDemandesCodeEntreprise();
  }
  const btnDemandeCodeEntreprise = document.getElementById(
    "demandeCodeEntrepriseBtn"
  );
  const popupDemande = document.getElementById("popupDemandeCodeEntreprise");
  // Met à jour le badge à chaque ouverture de la popup (pour être sûr)
  if (btnDemandeCodeEntreprise) {
    btnDemandeCodeEntreprise.addEventListener(
      "click",
      updateBadgeDemandesCodeEntreprise
    );
  }
  const closeBtnDemande = document.getElementById("closeDemandeCodeEntreprise");
  if (btnDemandeCodeEntreprise && popupDemande) {
    // --- Ajout : gestion du message WebSocket 'bl_status_update' pour la mise en livraison ---
    if (data.type === "bl_status_update") {
      console.log("[WebSocket] Reçu bl_status_update:", data);
      if (data.status && data.status === "Mise en livraison") {
        showCustomAlert(
          `Dossier ${data.dossier_number || "?"} mis en livraison !`,
          "success",
          3500
        );
        // Rafraîchir la vue si besoin (ex: reload tableau, ou appel API)
        // Ici, on peut forcer le rafraîchissement des indicateurs ou du tableau si présent
        if (typeof window.afficherSuivi === "function") {
          // Si la section suivi est visible, on la recharge
          const suiviContainer = document.getElementById("suiviContainer");
          if (suiviContainer && suiviContainer.style.display !== "none") {
            window.afficherSuivi();
          }
        }
        // Sinon, on peut aussi rafraîchir les indicateurs du dashboard si besoin
        // (ex: résuméHierDashboard, etc.)
        if (typeof resumeHierDashboard === "function") {
          resumeHierDashboard();
        }
      }
    }
    // Toujours détacher d'abord tout ancien onclick pour éviter les doublons
    btnDemandeCodeEntreprise.onclick = null;
    btnDemandeCodeEntreprise.addEventListener("click", function (e) {
      e.preventDefault();
      // On vérifie que le tableau existe, sinon on le crée dynamiquement
      let tableDiv = document.getElementById("tableDemandesCodeEntreprise");
      if (!tableDiv) {
        // On suppose que la popup existe et on ajoute le div manquant
        let popup = document.getElementById("popupDemandeCodeEntreprise");
        if (popup) {
          tableDiv = document.createElement("div");
          tableDiv.id = "tableDemandesCodeEntreprise";
          // On insère avant la fin de la popup (ou à un endroit logique)
          popup.appendChild(tableDiv);
        }
      }
      ouvrirPopupDemandesCodeEntreprise();
    });
  }
  if (closeBtnDemande && popupDemande) {
    closeBtnDemande.onclick = function () {
      popupDemande.style.display = "none";
    };
    popupDemande.addEventListener("click", function (e) {
      if (e.target === popupDemande) popupDemande.style.display = "none";
    });
  }

  // (Suppression du bloc DEBUG : la popup ne s'affiche plus automatiquement)

  // Rafraîchit la liste en temps réel si une demande est envoyée côté employé
  window.addEventListener("demandeCodeEntrepriseEnvoyee", function () {
    const popup = document.getElementById("popupDemandeCodeEntreprise");
    if (popup && popup.style.display === "none") {
      popup.style.display = "flex";
    }
    ouvrirPopupDemandesCodeEntreprise();
  });
});
// --- Résumé dynamique des activités agents pour les jours précédents ---
function afficherPopupResumeJoursPrecedents() {
  const popup = document.getElementById("popupResumeJoursPrecedents");
  const content = document.getElementById("resumeJoursPrecedentsContent");
  if (!popup || !content) return;
  content.innerHTML =
    '<div style="text-align:center;padding:30px 0;color:#2563eb;"><i class="fas fa-spinner fa-spin"></i> Chargement des résumés...</div>';
  fetch("http://localhost:3000/deliveries/status")
    .then((res) => res.json())
    .then((data) => {
      if (!data.success || !Array.isArray(data.deliveries)) {
        content.innerHTML =
          '<div style="color:#dc3545;text-align:center;">Erreur lors du chargement des données de livraisons.</div>';
        return;
      }
      const now = new Date();
      const moisFr = [
        "janvier",
        "février",
        "mars",
        "avril",
        "mai",
        "juin",
        "juillet",
        "août",
        "septembre",
        "octobre",
        "novembre",
        "décembre",
      ];
      let html =
        '<div id="resumeJoursCardsGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;">';
      const joursData = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const iso = `${y}-${m}-${day}`;
        const dateFr = `${day} ${moisFr[d.getMonth()]} ${y}`;
        const livs = data.deliveries.filter((liv) => {
          if (!liv.created_at) return false;
          const ld = new Date(liv.created_at);
          const ly = ld.getFullYear();
          const lm = String(ld.getMonth() + 1).padStart(2, "0");
          const lday = String(ld.getDate()).padStart(2, "0");
          return `${ly}-${lm}-${lday}` === iso;
        });
        const total = livs.length;
        const agents = Array.from(
          new Set(livs.map((l) => l.employee_name).filter(Boolean))
        );
        const clients = Array.from(
          new Set(livs.map((l) => l.client_name).filter(Boolean))
        );
        const statuts = {};
        // Statuts déjà traduits côté backend, mais on gère la casse et les valeurs vides
        livs.forEach((l) => {
          let s = l.status;
          // On ignore les statuts vides ou inconnus pour l'affichage
          if (!s || typeof s !== "string" || !s.trim()) return;
          const sNorm = s.trim().toLowerCase();
          if (sNorm === "inconnu" || sNorm === "unknown") return;
          s = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
          statuts[s] = (statuts[s] || 0) + 1;
        });
        const lieux = Array.from(
          new Set(livs.map((l) => l.lieu).filter(Boolean))
        );
        joursData.push({
          dateFr,
          total,
          agents,
          clients,
          statuts,
          lieux,
          livs,
        });
        html += `<div class='resume-jour-card' data-jour-index='${
          i - 1
        }' style='background:linear-gradient(135deg,#f7faff 60%,#e3e9f7 100%);border-radius:16px;box-shadow:0 4px 18px #2563eb18,0 2px 8px #0001;padding:18px 12px 12px 12px;display:flex;flex-direction:column;align-items:center;min-width:0;max-width:100%;cursor:pointer;transition:box-shadow 0.2s,transform 0.2s;position:relative;'>`;
        // Suppression du bouton de suppression pour les cartes jour
        html += `<div style='font-size:1.08em;font-weight:700;margin-bottom:8px;letter-spacing:0.5px;text-align:center;color:#222e3a;'>${dateFr}</div>`;
        html += `<div style='font-size:2.1em;font-weight:900;margin-bottom:7px;letter-spacing:1px;color:#2563eb;'>${total}</div>`;
        html += `<div style='font-size:1em;font-weight:600;color:#374151;margin-bottom:8px;'>Livraisons</div>`;
        html += `<div style='margin-bottom:6px;'><strong>Statuts :</strong></div>`;
        html += `<div style='margin-bottom:8px;'>${
          Object.keys(statuts).length === 0
            ? "Aucun"
            : Object.entries(statuts)
                .map(([s, n]) => `<span class=\"card-badge\">${n} ${s}</span>`)
                .join(" ")
        }</div>`;
        html += `<div><strong>Agents :</strong> <span>${agents.length}</span></div>`;
        html += `<div><strong>Clients :</strong> <span>${clients.length}</span></div>`;
        html += `<div><strong>Lieux :</strong> <span>${
          lieux.length > 0 ? lieux.join(", ") : "-"
        }</span></div>`;
        html += `</div>`;
      }
      html += "</div>";

      // (Suppression du bouton résumé du mois courant)
      content.innerHTML = html;

      // Gestion du bouton résumé du mois courant
      const btnResumeMoisCourant = document.getElementById(
        "btnResumeMoisCourant"
      );
      if (btnResumeMoisCourant) {
        btnResumeMoisCourant.onclick = function () {
          // Calculer les livraisons du mois courant
          const livsMois = data.deliveries.filter((liv) => {
            if (!liv.created_at) return false;
            const d = new Date(liv.created_at);
            return (
              d.getFullYear() === anneeCourante && d.getMonth() === moisCourant
            );
          });
          const total = livsMois.length;
          const agents = Array.from(
            new Set(livsMois.map((l) => l.employee_name).filter(Boolean))
          );
          const clients = Array.from(
            new Set(livsMois.map((l) => l.client_name).filter(Boolean))
          );
          const statuts = {};
          const traductionStatuts = {
            pending: "En attente",
            delivered: "Livrée",
            // Les statuts acconier sont dynamiques, plus de pending_acconier ici
            "Paiement effectué": "Paiement effectué",
            "Mise en livraison": "Mise en livraison",
          };
          livsMois.forEach((l) => {
            let s = l.status;
            if (!s || typeof s !== "string" || !s.trim()) return;
            let sNorm = s.trim().toLowerCase();
            // Remplacement du statut "pending_acconier" par la vraie valeur métier acconier si dispo
            if (
              sNorm === "pending_acconier" ||
              sNorm === "en attente acconier"
            ) {
              if (
                l["delivery_status_acconier"] &&
                l["delivery_status_acconier"].trim() &&
                l["delivery_status_acconier"].toLowerCase() !==
                  "pending_acconier"
              ) {
                s = l["delivery_status_acconier"];
                sNorm = s.trim().toLowerCase();
              } else if (
                l["Statut de livraison (Resp. Aconiés)"] &&
                l["Statut de livraison (Resp. Aconiés)"].trim() &&
                l["Statut de livraison (Resp. Aconiés)"].toLowerCase() !==
                  "pending_acconier"
              ) {
                s = l["Statut de livraison (Resp. Aconiés)"];
                sNorm = s.trim().toLowerCase();
              } else {
                return; // On ignore si pas de vrai statut métier
              }
            }
            if (sNorm === "inconnu" || sNorm === "unknown") return;
            // On garde la valeur exacte pour "Paiement effectué" et "Mise en livraison"
            if (s === "Paiement effectué" || s === "Mise en livraison") {
              statuts[s] = (statuts[s] || 0) + 1;
            } else {
              s =
                traductionStatuts[s] ||
                s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
              statuts[s] = (statuts[s] || 0) + 1;
            }
          });
          const lieux = Array.from(
            new Set(livsMois.map((l) => l.lieu).filter(Boolean))
          );

          // Générer le HTML du popup
          let recapHtml = `<div style='font-size:1.25em;font-weight:700;color:#2563eb;margin-bottom:10px;text-align:center;'>Résumé du mois de ${moisFrCourant} ${anneeCourante}</div>`;
          recapHtml += `<div style='font-size:2em;font-weight:900;margin-bottom:7px;letter-spacing:1px;color:#2563eb;text-align:center;'>${total} livraisons</div>`;
          recapHtml += `<div style='margin-bottom:8px;'><strong>Statuts :</strong> ${
            Object.keys(statuts).length === 0
              ? "Aucun"
              : Object.entries(statuts)
                  .map(([s, n]) => `<span class="card-badge">${n} ${s}</span>`)
                  .join(" ")
          }</div>`;
          recapHtml += `<div style='margin-bottom:8px;'><strong>Agents :</strong> ${
            agents.length > 0 ? agents.join(", ") : "-"
          }</div>`;
          recapHtml += `<div style='margin-bottom:8px;'><strong>Clients :</strong> ${
            clients.length > 0 ? clients.join(", ") : "-"
          }</div>`;
          recapHtml += `<div style='margin-bottom:8px;'><strong>Lieux :</strong> ${
            lieux.length > 0 ? lieux.join(", ") : "-"
          }</div>`;
          if (livsMois.length > 0) {
            recapHtml += `<div style='margin-top:12px;'><strong>Détails des livraisons :</strong><ul style='margin:6px 0 0 0;padding-left:18px;'>`;
            livsMois.forEach((liv) => {
              // Correction : on remplace explicitement le statut "pending_acconier" par la vraie valeur métier acconier si disponible
              let statutFr = liv.status;
              if (
                statutFr === "pending_acconier" ||
                statutFr === "en attente acconier" ||
                statutFr === "Pending_acconier"
              ) {
                // On cherche la vraie valeur métier acconier si elle existe
                if (
                  liv.statut_acconier &&
                  liv.statut_acconier !== "pending_acconier" &&
                  liv.statut_acconier !== "" &&
                  liv.statut_acconier !== null
                ) {
                  statutFr = liv.statut_acconier;
                } else {
                  statutFr = "-";
                }
              }
              // Traduction si besoin
              statutFr = traductionStatuts[statutFr] || statutFr || "-";
              // Affichage exact pour "Paiement effectué" et "Mise en livraison"
              if (
                statutFr === "Paiement effectué" ||
                statutFr === "Mise en livraison"
              ) {
                statutFr = statutFr;
              }
              recapHtml += `<li style='font-size:0.98em;margin-bottom:2px;'>${
                liv.client_name ? `<b>${liv.client_name}</b>` : ""
              } - ${liv.employee_name || "-"} - ${
                liv.lieu || "-"
              } - <span style='color:#2563eb;'>${statutFr}</span></li>`;
            });
            recapHtml += `</ul></div>`;
          }

          // Afficher dans le popup de détail jour (réutilisé)
          const popupDetail = document.getElementById("popupDetailJourResume");
          const popupContent = document.getElementById("popupDetailJourInfos");
          if (popupDetail && popupContent) {
            popupContent.innerHTML = recapHtml;
            popupDetail.style.display = "flex";
          }
        };
      }

      // Ajout de l'interactivité sur chaque carte
      const cards = content.querySelectorAll(".resume-jour-card");
      cards.forEach((card, idx) => {
        // Ajout suppression visuelle de la carte jour
        const btnSuppr = card.querySelector(".btn-supprimer-jour");
        if (btnSuppr) {
          btnSuppr.addEventListener("click", function (e) {
            e.stopPropagation();
            card.remove();
          });
        }
        card.addEventListener("click", function () {
          const jour = joursData[idx];
          const popupDetail = document.getElementById("popupDetailJourResume");
          const popupContent = document.getElementById("popupDetailJourInfos");
          if (popupDetail && popupContent && jour) {
            let detailHtml = `<div style='font-size:1.15em;font-weight:700;color:#2563eb;margin-bottom:10px;text-align:center;'>${jour.dateFr}</div>`;
            detailHtml += `<div style='font-size:2em;font-weight:900;margin-bottom:7px;letter-spacing:1px;color:#2563eb;text-align:center;'>${jour.total} livraisons</div>`;
            // Statuts
            const statutsSorted = Object.entries(jour.statuts).sort(
              (a, b) => b[1] - a[1]
            );
            detailHtml += `<div style='margin-bottom:8px;'><strong>Statuts :</strong><br>`;
            if (statutsSorted.length === 0) {
              detailHtml += "Aucun";
            } else {
              statutsSorted.forEach(([s, n]) => {
                let color = "#2563eb";
                if (
                  s.toLowerCase().includes("rejet") ||
                  s.toLowerCase().includes("reject")
                )
                  color = "#dc3545";
                if (s.toLowerCase().includes("attente")) color = "#f59e0b";
                if (s.toLowerCase().includes("livr")) color = "#059669";
                if (s.toLowerCase().includes("eir")) color = "#a855f7";
                detailHtml += `<span class=\"card-badge\" style=\"background:${color}22;color:${color};margin-right:8px;margin-bottom:3px;\">${n} ${s}</span><br>`;
              });
            }
            detailHtml += `</div>`;
            // Agents
            detailHtml += `<div style='margin-bottom:8px;'><strong>Agents :</strong><br>`;
            if (jour.agents.length > 0) {
              for (let i = 0; i < jour.agents.length; i += 5) {
                detailHtml += jour.agents.slice(i, i + 5).join(", ") + "<br>";
              }
            } else {
              detailHtml += "-";
            }
            detailHtml += `</div>`;
            // Clients
            detailHtml += `<div style='margin-bottom:8px;'><strong>Clients :</strong><br>`;
            if (jour.clients.length > 0) {
              for (let i = 0; i < jour.clients.length; i += 5) {
                detailHtml += jour.clients.slice(i, i + 5).join(", ") + "<br>";
              }
            } else {
              detailHtml += "-";
            }
            detailHtml += `</div>`;
            // Lieux
            detailHtml += `<div style='margin-bottom:8px;'><strong>Lieux :</strong><br>`;
            if (jour.lieux.length > 0) {
              for (let i = 0; i < jour.lieux.length; i += 4) {
                detailHtml += jour.lieux.slice(i, i + 4).join(", ") + "<br>";
              }
            } else {
              detailHtml += "-";
            }
            detailHtml += `</div>`;
            // Détails des livraisons : tableau
            if (jour.livs.length > 0) {
              detailHtml += `<div style='margin-top:12px;'><strong>Détails des livraisons :</strong><div style='overflow-x:auto;'><table style='width:100%;border-collapse:collapse;font-size:0.98em;margin-top:6px;'>`;
              detailHtml += `<thead><tr style='background:#f7faff;'><th style='padding:4px 8px;border-bottom:1px solid #e5e7eb;'>Client</th><th style='padding:4px 8px;border-bottom:1px solid #e5e7eb;'>Agent</th><th style='padding:4px 8px;border-bottom:1px solid #e5e7eb;'>Lieu</th><th style='padding:4px 8px;border-bottom:1px solid #e5e7eb;'>Statut</th></tr></thead><tbody>`;
              // Table de traduction locale
              const traductionStatuts = {
                pending: "En attente",
                delivered: "Livrée",
                // Les statuts acconier sont dynamiques, plus de pending_acconier ici
                "Paiement effectué": "Paiement effectué",
                "Mise en livraison": "Mise en livraison",
              };
              jour.livs.forEach((liv) => {
                let statutFr =
                  traductionStatuts[liv.status] || liv.status || "-";
                // Affichage exact pour "Paiement effectué" et "Mise en livraison"
                if (
                  liv.status === "Paiement effectué" ||
                  liv.status === "Mise en livraison"
                ) {
                  statutFr = liv.status;
                }
                if (
                  !statutFr ||
                  typeof statutFr !== "string" ||
                  !statutFr.trim()
                ) {
                  statutFr = "-";
                } else {
                  const sNorm = statutFr.trim().toLowerCase();
                  if (sNorm === "inconnu" || sNorm === "unknown")
                    statutFr = "-";
                }
                let color = "#2563eb";
                if (
                  statutFr.toLowerCase().includes("rejet") ||
                  statutFr.toLowerCase().includes("reject")
                )
                  color = "#dc3545";
                if (statutFr.toLowerCase().includes("attente"))
                  color = "#f59e0b";
                if (statutFr.toLowerCase().includes("livr")) color = "#059669";
                if (statutFr.toLowerCase().includes("eir")) color = "#a855f7";
                detailHtml += `<tr><td style='padding:3px 8px;border-bottom:1px solid #f1f1f1;'>${
                  liv.client_name ? `<b>${liv.client_name}</b>` : "-"
                }</td><td style='padding:3px 8px;border-bottom:1px solid #f1f1f1;'>${
                  liv.employee_name || "-"
                }</td><td style='padding:3px 8px;border-bottom:1px solid #f1f1f1;'>${
                  liv.lieu || "-"
                }</td><td style='padding:3px 8px;border-bottom:1px solid #f1f1f1;'><span style='color:${color};font-weight:600;'>${statutFr}</span></td></tr>`;
              });
              detailHtml += `</tbody></table></div></div>`;
            }
            popupContent.innerHTML = detailHtml;
            popupDetail.style.display = "flex";
          }
        });
      });
      // Fermeture du popup détail jour
      const closeDetailBtn = document.getElementById("closePopupDetailJour");
      const popupDetail = document.getElementById("popupDetailJourResume");
      if (closeDetailBtn && popupDetail) {
        closeDetailBtn.onclick = () => {
          popupDetail.style.display = "none";
        };
        popupDetail.addEventListener("click", (e) => {
          if (e.target === popupDetail) popupDetail.style.display = "none";
        });
      }
    })
    .catch(() => {
      content.innerHTML =
        '<div style="color:#dc3545;text-align:center;">Impossible de charger les résumés.</div>';
    });
  popup.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", () => {
  const btnResumeJoursPrecedents = document.getElementById(
    "btnResumeJoursPrecedents"
  );
  const popup = document.getElementById("popupResumeJoursPrecedents");
  const closeBtn = document.getElementById("closeResumeJoursPrecedents");
  if (btnResumeJoursPrecedents && popup && closeBtn) {
    btnResumeJoursPrecedents.onclick = afficherPopupResumeJoursPrecedents;
    closeBtn.onclick = () => {
      popup.style.display = "none";
    };
    popup.addEventListener("click", (e) => {
      if (e.target === popup) popup.style.display = "none";
    });
  }
});
// Fonctions globales (accessibles via onclick et dans le DOMContentLoaded)

/**
 * Ouvre une popup en retirant la classe 'hidden'.
 * @param {string} id L'ID de l'élément popup à ouvrir.
 */
function ouvrirPopup(id) {
  const popup = document.getElementById(id);
  if (popup) {
    popup.classList.remove("hidden");
  }
}

/**
 * Ferme une popup en ajoutant la classe 'hidden'.
 * @param {string} id L'ID de l'élément popup à fermer.
 */
function fermerPopup(id) {
  const popup = document.getElementById(id);
  if (popup) {
    popup.classList.add("hidden");
  }
}

/**
 * Masque les sections de bienvenue et les boutons d'accueil.
 */
function masquerAccueil() {
  const welcome = document.getElementById("welcomeSection");
  const buttons = document.getElementById("bottomButtons");
  if (welcome) welcome.style.display = "none";
  if (buttons) buttons.style.display = "none";
}

/**
 * Réaffiche les sections du tableau de bord par défaut (accueil et boutons, et masque les conteneurs dynamiques).
 */
function showDashboardSections() {
  const welcome = document.getElementById("welcomeSection");
  const buttons = document.getElementById("bottomButtons");
  const messagerieContainer = document.getElementById("messagerieContainer");
  const suiviContainer = document.getElementById("suiviContainer");
  const historiqueAgentsContainer = document.getElementById(
    "historiqueAgentsContainer"
  );

  // Masque tous les conteneurs dynamiques
  if (messagerieContainer) messagerieContainer.style.display = "none";
  if (suiviContainer) suiviContainer.style.display = "none";
  if (historiqueAgentsContainer)
    historiqueAgentsContainer.style.display = "none";

  // Affiche la section de bienvenue et les boutons d'accueil
  if (welcome) welcome.style.display = "flex";
  if (buttons) buttons.style.display = "flex";
}

/**
 * Affiche une alerte personnalisée en haut de la page.
 * @param {string} message Le message à afficher.
 * @param {string} type Le type d'alerte ('success' ou 'error').
 * @param {number} duration La durée d'affichage de l'alerte en ms.
 */
function showCustomAlert(message, type, duration) {
  const alertBox = document.createElement("div");
  alertBox.classList.add("custom-alert", type);
  alertBox.textContent = message;
  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.classList.add("show");
  }, 100);

  setTimeout(() => {
    alertBox.classList.remove("show");
    alertBox.addEventListener("transitionend", () => alertBox.remove());
  }, duration || 3000);
}

/**
 * Charge du contenu HTML et injecte un script JS dans un conteneur cible.
 * @param {HTMLElement} targetContainer L'élément HTML où injecter le contenu.
 * @param {string} htmlPath Le chemin vers le fichier HTML à charger.
 * @param {string|null} scriptPath Le chemin vers le fichier JS à injecter (facultatif).
 */
const loadAndInjectContent = async (
  targetContainer,
  htmlPath,
  scriptPath = null
) => {
  try {
    const response = await fetch(htmlPath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Trouver le contenu pertinent dans le HTML chargé
    const contentToInject =
      doc.querySelector(".suivi-app-wrapper") ||
      doc.querySelector(".chat-app-wrapper") ||
      doc.querySelector(".historique-wrapper") ||
      doc.body; // Fallback au corps entier si aucun wrapper spécifique n'est trouvé

    if (contentToInject) {
      targetContainer.innerHTML = contentToInject.innerHTML;
    } else {
      targetContainer.innerHTML = `<p>Erreur: Contenu à injecter non trouvé dans ${htmlPath}.</p>`;
      return;
    }

    if (scriptPath) {
      // Supprimer les scripts existants avec le même src pour éviter les doublons
      document
        .querySelectorAll(`script[src="${scriptPath}"]`)
        .forEach((s) => s.remove());

      const newScript = document.createElement("script");
      newScript.src = scriptPath;
      newScript.onload = () => {
        console.log(`${scriptPath} chargé avec succès.`);
        // Appeler des fonctions d'initialisation spécifiques si nécessaire,
        // par exemple si scriptHistoriqueAgents.js contient une fonction initHistoriqueAgents()
        if (
          scriptPath === "/js/historiqueAgents.js" &&
          typeof initHistoriqueAgents === "function"
        ) {
          // initHistoriqueAgents();
        }
      };
      newScript.onerror = () =>
        console.error(`Erreur de chargement du script: ${scriptPath}`);
      document.body.appendChild(newScript);
    }
  } catch (error) {
    console.error(`Erreur de chargement de ${htmlPath} :`, error);
    targetContainer.innerHTML = `<p>Erreur de chargement du module. (${error.message})</p>`;
  }
};

// Fonctions pour les boutons de la page d'accueil (rendues globales explicitement)
// Elles masquent les autres sections dynamiques avant d'afficher la leur

// Affichage exclusif des sections dynamiques (une seule visible à la fois)
function masquerToutesSectionsDynamiques() {
  const messagerieContainer = document.getElementById("messagerieContainer");
  const suiviContainer = document.getElementById("suiviContainer");
  const historiqueAgentsContainer = document.getElementById(
    "historiqueAgentsContainer"
  );
  if (messagerieContainer) messagerieContainer.style.display = "none";
  if (suiviContainer) suiviContainer.style.display = "none";
  if (historiqueAgentsContainer)
    historiqueAgentsContainer.style.display = "none";
}

window.afficherMessage = async () => {
  masquerAccueil();
  masquerToutesSectionsDynamiques();
  const messagerieContainer = document.getElementById("messagerieContainer");
  messagerieContainer.style.display = "block";
  await loadAndInjectContent(
    messagerieContainer,
    "message.html",
    "/js/scriptMessage.js"
  );
};

window.afficherSuivi = async () => {
  masquerAccueil();
  masquerToutesSectionsDynamiques();
  const suiviContainer = document.getElementById("suiviContainer");
  suiviContainer.style.display = "block";
  await loadAndInjectContent(
    suiviContainer,
    "interfaceSuivie.html",
    "/js/scriptSuivie.js"
  );
};

window.afficherHistoriqueAgents = async () => {
  masquerAccueil();
  masquerToutesSectionsDynamiques();
  const historiqueAgentsContainer = document.getElementById(
    "historiqueAgentsContainer"
  );
  historiqueAgentsContainer.style.display = "block";
  await loadAndInjectContent(
    historiqueAgentsContainer,
    "historiqueAgents.html",
    "/js/historiqueAgents.js"
  );
};

document.addEventListener("DOMContentLoaded", () => {
  const sidebarTitle = document.getElementById("sidebarTitle");
  const body = document.body;
  // Sécurité : empêcher tout affichage si un agent (employee) est connecté
  const employeeEmail = localStorage.getItem("employeeEmail");
  if (employeeEmail) {
    localStorage.removeItem("employeeEmail");
    localStorage.removeItem("employeeName");
    document.body.innerHTML =
      '<div style="color:#dc2626;font-size:1.3em;text-align:center;margin-top:60px;">Accès interdit : cette interface est réservée aux responsables/admins.</div>';
    return;
  }

  // Authentification du responsable :
  // On utilise uniquement la clé 'user' du localStorage pour afficher le nom/email dans la sidebar.
  // AUCUN lien avec acconier_auth.js ou des variables acconier (respacconierNom, respacconierEmail, etc).
  // Utiliser uniquement les données du responsable acconier
  let respacconierUser = null;
  try {
    respacconierUser = JSON.parse(localStorage.getItem("respacconierUser"));
  } catch (e) {
    respacconierUser = null;
  }
  if (!respacconierUser) {
    // Valeurs par défaut si aucune info responsable acconier
    respacconierUser = {
      nom: "Responsable Acconier",
      email: "respacconier-inconnu@domaine.com",
      profil: "Responsable Acconier",
    };
    localStorage.setItem("respacconierUser", JSON.stringify(respacconierUser));
  }
  // Affichage du nom et email dans la sidebar (avatar)
  const avatarNom = document.getElementById("nomResponsableDashboard");
  const avatarEmail = document.getElementById("emailResponsableDashboard");
  if (avatarNom) avatarNom.textContent = respacconierUser.nom;
  if (avatarEmail) avatarEmail.textContent = respacconierUser.email;

  const bienvenue = document.getElementById("bienvenue");
  const loader = document.getElementById("loader");

  // Récupérer les conteneurs dynamiques (déjà définis globalement, mais bon de les avoir ici aussi pour la clarté)
  const messagerieContainer = document.getElementById("messagerieContainer");
  const suiviContainer = document.getElementById("suiviContainer");
  const historiqueAgentsContainer = document.getElementById(
    "historiqueAgentsContainer"
  );

  // Affichage du message de bienvenue avec l'e-mail du responsable acconier
  if (respacconierUser && respacconierUser.email && bienvenue) {
    bienvenue.textContent = `Bienvenue, ${respacconierUser.email} !`;
  }

  // Gérer l'affichage initial après le loader (si présent)
  if (loader) {
    setTimeout(() => {
      if (bienvenue) bienvenue.textContent = ""; // Cache le message de bienvenue si le loader est terminé
      loader.style.display = "none"; // Masque le loader
      showDashboardSections(); // Affiche la section d'accueil par défaut
    }, 1500);
  } else {
    // Si pas de loader, affiche directement les sections
    showDashboardSections();
  }

  // Afficher un message de succès après connexion si stocké
  const showMessage = localStorage.getItem("showSuccessMessage");
  if (showMessage === "true") {
    showCustomAlert("Connexion réussie !", "success", 3000);
    localStorage.removeItem("showSuccessMessage");
  }

  // Récupération des liens de la sidebar
  const lienMessage = document.getElementById("lienMessage");
  const lienSuivi = document.getElementById("lienSuivi");
  const lienAcceuil = document.querySelector('a[href="tableauDeBord.html"]');
  const lienHistoriqueAgents = document.getElementById("lienHistoriqueAgents");

  // --- GESTION DES CLICS SUR LES LIENS DE LA SIDEBAR ---

  // GESTION DU LIEN "Message"
  if (lienMessage && messagerieContainer) {
    lienMessage.addEventListener("click", async (e) => {
      e.preventDefault();
      window.afficherMessage(); // Utilise la fonction globale pour la messagerie
    });
  }

  // GESTION DU LIEN "Suivi"
  if (lienSuivi && suiviContainer) {
    lienSuivi.addEventListener("click", async (e) => {
      e.preventDefault();
      window.afficherSuivi(); // Utilise la fonction globale pour le suivi
    });
  }

  // GESTION DU LIEN "Accueil"
  if (lienAcceuil) {
    lienAcceuil.addEventListener("click", (e) => {
      e.preventDefault();
      masquerToutesSectionsDynamiques(); // Masque toutes les sections dynamiques
      showDashboardSections(); // Réaffiche les sections du tableau de bord par défaut
    });
  }

  // GESTION DU LIEN "Historique Agents" (si présent)
  if (lienHistoriqueAgents && historiqueAgentsContainer) {
    lienHistoriqueAgents.addEventListener("click", async (e) => {
      e.preventDefault();
      window.afficherHistoriqueAgents(); // Utilise la fonction globale pour l'historique
    });
  }

  // --- Sidebar repliable ---
  if (sidebarTitle && body) {
    sidebarTitle.addEventListener("click", function () {
      body.classList.toggle("sidebar-collapsed");
    });
  }

  // --- Gestion de l'état de la connexion Internet ---
  const connectionStatusIcon = document.getElementById("connectionStatusIcon");

  function updateConnectionStatus() {
    if (!connectionStatusIcon) return; // S'assurer que l'icône existe

    if (navigator.onLine) {
      connectionStatusIcon.classList.remove("offline");
      connectionStatusIcon.title = "Connecté à Internet"; // Texte d'aide au survol
      connectionStatusIcon.querySelector("i").className = "fas fa-wifi";
    } else {
      connectionStatusIcon.classList.add("offline");
      connectionStatusIcon.title = "Déconnecté d'Internet";
      connectionStatusIcon.querySelector("i").className =
        "fas fa-exclamation-triangle";
    }
  }

  updateConnectionStatus(); // Met à jour l'état au chargement de la page

  // Écoute les changements d'état de la connexion
  window.addEventListener("online", () => {
    updateConnectionStatus();
    showCustomAlert("Connexion Internet rétablie !", "success", 3000);
  });

  window.addEventListener("offline", () => {
    updateConnectionStatus();
    showCustomAlert(
      "Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.",
      "error",
      5000
    );
  });

  // --- Affichage automatique de la date actuelle dans le sélecteur de date ---
  const dateInput = document.getElementById("date-selection");
  if (dateInput) {
    const today = new Date();
    // Formater la date en YYYY-MM-DD (format requis par input type="date")
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Mois est 0-indexé, d'où le +1
    const day = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${year}-${month}-${day}`;
  }
}); // Fin de document.addEventListener("DOMContentLoaded")
// --- Résumé dynamique des activités de la veille ---
// --- Styles pour les cartes du dashboard résumé ---
const styleDashboardCards = document.createElement("style");
styleDashboardCards.innerHTML = `
              .dashboard-cards-row {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                justify-items: stretch;
                align-items: stretch;
                margin-bottom: 14px;
                width: 100%;
                max-width: 900px;
                margin-left: auto;
                margin-right: auto;
              }
              .dashboard-card {
                background: linear-gradient(135deg, #f7faff 60%, #e3e9f7 100%);
                border-radius: 16px;
                box-shadow: 0 4px 18px #2563eb18, 0 2px 8px #0001;
                padding: 18px 12px 12px 12px;
                min-width: 0;
                max-width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                transition: box-shadow 0.2s, transform 0.2s;
                border: none;
                cursor: pointer;
              }
              .dashboard-card:hover {
                box-shadow: 0 8px 28px #2563eb22, 0 4px 16px #0002;
                transform: translateY(-3px) scale(1.02);
              }
              .dashboard-card .card-title {
                font-size: 1.08em;
                font-weight: 700;
                margin-bottom: 8px;
                letter-spacing: 0.5px;
                text-align: center;
                color: #222e3a;
              }
              .dashboard-card .card-value {
                font-size: 2.1em;
                font-weight: 900;
                margin-bottom: 7px;
                letter-spacing: 1px;
              }
              .dashboard-card.livraisons {
                border-top: 5px solid #2563eb;
                box-shadow: 0 4px 18px #2563eb22, 0 2px 8px #0001;
              }
              .dashboard-card.agents {
                border-top: 5px solid #059669;
                box-shadow: 0 4px 18px #05966922, 0 2px 8px #0001;
              }
              .dashboard-card.clients {
                border-top: 5px solid #f59e0b;
                box-shadow: 0 4px 18px #f59e0b22, 0 2px 8px #0001;
              }
              .dashboard-card .card-list {
                margin-top: 8px;
                width: 100%;
                text-align: left;
                font-size: 0.98em;
                color: #374151;
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                transition: max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.35s cubic-bezier(0.4,0,0.2,1);
                pointer-events: none;
              }
              .dashboard-card.active .card-list {
                max-height: 300px;
                opacity: 1;
                transition: max-height 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.45s cubic-bezier(0.4,0,0.2,1);
                pointer-events: auto;
              }
              .dashboard-card .card-arrow {
                position: absolute;
                top: 14px;
                right: 14px;
                font-size: 1.1em;
                color: #a0aec0;
                transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
                z-index: 2;
              }
              .dashboard-card.active .card-arrow {
                transform: rotate(90deg) scale(1.08);
                color: #2563eb;
              }
              .dashboard-card .card-list ul {
                padding-left: 12px;
                margin: 0;
              }
              .dashboard-card .card-list li {
                margin-bottom: 2px;
              }
              .dashboard-card .card-badge {
                display: inline-block;
                background: #eaf1fb;
                color: #2563eb;
                border-radius: 7px;
                padding: 2px 8px;
                font-size: 0.98em;
                margin: 0 4px 4px 0;
                font-weight: 600;
              }
              .dashboard-card.livraisons .card-value {
                color: #2563eb;
                text-shadow: 0 2px 8px #2563eb22;
              }
              .dashboard-card.agents .card-value {
                color: #059669;
                text-shadow: 0 2px 8px #05966922;
              }
              .dashboard-card.clients .card-value {
                color: #f59e0b;
                text-shadow: 0 2px 8px #f59e0b22;
              }
              .dashboard-card .card-title i {
                margin-right: 6px;
                font-size: 1em;
              }
              @media (max-width: 1100px) {
                .dashboard-cards-row {
                  grid-template-columns: 1fr;
                  gap: 14px;
                  max-width: 98vw;
                }
              }
              @media (max-width: 700px) {
                .dashboard-card {
                  padding: 10px 4px 8px 4px;
                }
                .dashboard-cards-row {
                  gap: 8px;
                }
              }
            `;
document.head.appendChild(styleDashboardCards);

// Définir dynamiquement la structure métier des colonnes du tableau de suivi général (synchronisée avec scriptSuivie.js)
window.AGENT_TABLE_COLUMNS = [
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
];

(function resumeHierDashboard() {
  const resumeHierDiv = document.getElementById("resumeHier");
  if (!resumeHierDiv) return;
  // Affiche un loader temporaire
  resumeHierDiv.innerHTML =
    '<div style="text-align:center;padding:30px 0;color:#2563eb;"><i class="fas fa-spinner fa-spin"></i> Chargement du résumé de la veille...</div>';

  fetch(`${window.API_BASE_URL}/deliveries/status`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success || !Array.isArray(data.deliveries)) {
        resumeHierDiv.innerHTML =
          '<div style="color:#dc3545;text-align:center;">Erreur lors du chargement des données de livraisons.</div>';
        return;
      }
      // Date d'hier (en local)
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yYear = yesterday.getFullYear();
      const yMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
      const yDay = String(yesterday.getDate()).padStart(2, "0");
      const yesterdayISO = `${yYear}-${yMonth}-${yDay}`;

      // Filtrer les livraisons créées hier
      const livraisonsHier = data.deliveries.filter((liv) => {
        if (!liv.created_at) return false;
        const d = new Date(liv.created_at);
        const dYear = d.getFullYear();
        const dMonth = String(d.getMonth() + 1).padStart(2, "0");
        const dDay = String(d.getDate()).padStart(2, "0");
        return `${dYear}-${dMonth}-${dDay}` === yesterdayISO;
      });

      // Calculs des indicateurs
      const total = livraisonsHier.length;
      const agents = Array.from(
        new Set(livraisonsHier.map((l) => l.employee_name).filter(Boolean))
      );
      const clients = Array.from(
        new Set(livraisonsHier.map((l) => l.client_name).filter(Boolean))
      );
      const statuts = {};
      // Affichage des statuts "Livré" par conteneur (Responsable Livraison)
      livraisonsHier.forEach((l) => {
        // On cherche les statuts de chaque conteneur si disponibles
        let containers = [];
        if (Array.isArray(l.container_number)) {
          containers = l.container_number;
        } else if (typeof l.container_number === "string") {
          containers = l.container_number.split(/[,;\s]+/).filter(Boolean);
        }
        let statuses = l.container_statuses;
        if (
          statuses &&
          typeof statuses === "object" &&
          !Array.isArray(statuses)
        ) {
          // Format { TC1: 'Livré', TC2: 'En attente', ... }
          Object.entries(statuses).forEach(([tc, st]) => {
            let statut = (st || "").toString().trim();
            if (!statut) return;
            // Traduction en français
            let statutFr = statut;
            if (
              statut.toLowerCase().includes("livr") ||
              statut.toLowerCase() === "delivered"
            ) {
              statutFr = "Livré";
            } else if (statut.toLowerCase() === "pending") {
              statutFr = "En attente";
            } else if (statut.toLowerCase() === "in progress") {
              statutFr = "En cours";
            } else if (statut.toLowerCase() === "rejected") {
              statutFr = "Rejeté";
            }
            statuts[`${tc}: ${statutFr}`] =
              (statuts[`${tc}: ${statutFr}`] || 0) + 1;
          });
        } else if (
          Array.isArray(statuses) &&
          containers.length === statuses.length
        ) {
          // Format ["Livré", "En attente", ...] aligné avec container_number
          containers.forEach((tc, idx) => {
            let statut = (statuses[idx] || "").toString().trim();
            if (!statut) return;
            // Traduction en français
            let statutFr = statut;
            if (
              statut.toLowerCase().includes("livr") ||
              statut.toLowerCase() === "delivered"
            ) {
              statutFr = "Livré";
            } else if (statut.toLowerCase() === "pending") {
              statutFr = "En attente";
            } else if (statut.toLowerCase() === "in progress") {
              statutFr = "En cours";
            } else if (statut.toLowerCase() === "rejected") {
              statutFr = "Rejeté";
            }
            statuts[`${tc}: ${statutFr}`] =
              (statuts[`${tc}: ${statutFr}`] || 0) + 1;
          });
        } else if (l.status) {
          // Statut global traduit
          let statut = l.status.toString().trim();
          let statutFr = statut;
          if (
            statut.toLowerCase().includes("livr") ||
            statut.toLowerCase() === "delivered"
          ) {
            statutFr = "Livré";
          } else if (statut.toLowerCase() === "pending") {
            statutFr = "En attente";
          } else if (statut.toLowerCase() === "in progress") {
            statutFr = "En cours";
          } else if (statut.toLowerCase() === "rejected") {
            statutFr = "Rejeté";
          }
          statuts[statutFr] = (statuts[statutFr] || 0) + 1;
        }
        // On ignore les statuts acconier dans la carte
      });
      // Lieux de livraison
      const lieux = Array.from(
        new Set(livraisonsHier.map((l) => l.lieu).filter(Boolean))
      );

      // --- Génération du HTML en 3 cartes flottantes ---
      // Formatage de la date d'hier en français (ex : 1 juillet 2025)
      const moisFr = [
        "janvier",
        "février",
        "mars",
        "avril",
        "mai",
        "juin",
        "juillet",
        "août",
        "septembre",
        "octobre",
        "novembre",
        "décembre",
      ];
      const dateHierFr = `${yDay} ${moisFr[parseInt(yMonth, 10) - 1]} ${yYear}`;

      // --- Calcul des données du mois précédent pour la popup ---
      // Trouver le mois précédent (attention au passage janvier -> décembre)
      let prevMonth = now.getMonth() - 1;
      let prevYear = now.getFullYear();
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
      }
      // Filtrer les livraisons du mois précédent
      const livraisonsMoisPasse = data.deliveries.filter((liv) => {
        if (!liv.created_at) return false;
        const d = new Date(liv.created_at);
        return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
      });
      const totalMoisPasse = livraisonsMoisPasse.length;
      const agentsMoisPasse = Array.from(
        new Set(livraisonsMoisPasse.map((l) => l.employee_name).filter(Boolean))
      );
      const clientsMoisPasse = Array.from(
        new Set(livraisonsMoisPasse.map((l) => l.client_name).filter(Boolean))
      );
      const statutsMoisPasse = {};
      livraisonsMoisPasse.forEach((l) => {
        let s = l.status;
        if (!s || typeof s !== "string" || !s.trim()) return;
        const sNorm = s.trim().toLowerCase();
        if (sNorm === "inconnu" || sNorm === "unknown") return;
        s = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        statutsMoisPasse[s] = (statutsMoisPasse[s] || 0) + 1;
      });
      const lieuxMoisPasse = Array.from(
        new Set(livraisonsMoisPasse.map((l) => l.lieu).filter(Boolean))
      );

      let html = `<h2 style="font-size:2em;font-weight:700;color:#2563eb;margin-bottom:18px;text-align:center;letter-spacing:1px;text-shadow:0 2px 12px #2563eb22;display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;">
                    <span>Résumé des activités depuis</span>
                    <span style="font-size:0.7em;font-weight:600;color:#374151;background:#eaf1fb;padding:6px 18px;border-radius:12px;box-shadow:0 2px 8px #2563eb11;letter-spacing:0.5px;">${dateHierFr}</span>
                  </h2>`;
      html += `<div class="dashboard-cards-row">
        <!-- Carte Livraisons supprimée -->
        <!-- Cartes Agents actifs, Clients différents, Récap. du mois et Dossiers en retard supprimées -->
      </div>`;
      // --- Script pour la carte Agent visiteur programmé ---
      // Nouvelle version : utilise l'API dédiée /agents-visiteurs/programmes
      // Ajout du CSS pour les points clignotants orange/rouge (une seule fois)
      if (!document.getElementById("clignotant-agent-visiteur-css")) {
        const style = document.createElement("style");
        style.id = "clignotant-agent-visiteur-css";
        style.innerHTML = `
          .dot-clignotant {
            display: inline-block;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            margin-right: 5px;
            vertical-align: middle;
            animation: clignote 1.6s infinite cubic-bezier(0.4,0,0.2,1);
            box-shadow: 0 0 4px 1.2px currentColor, 0 0 0 1px #fff;
            border: 1px solid #fff;
          }
          .dot-orange {
            background: #f59e0b;
            color: #f59e0b;
          }
          .dot-rouge {
            background: #dc2626;
            color: #dc2626;
          }
          .dot-bleu {
            background: #2563eb;
            color: #2563eb;
          }
          .dot-vert {
            background: #059669;
            color: #059669;
          }
          @keyframes clignote {
            0% {
              opacity: 1;
              transform: scale(1);
              filter: brightness(1.1) drop-shadow(0 0 5px currentColor);
            }
            70% {
              opacity: 0.4;
              transform: scale(0.85);
              filter: brightness(0.8) drop-shadow(0 0 1px currentColor);
            }
            100% {
              opacity: 1;
              transform: scale(1);
              filter: brightness(1.1) drop-shadow(0 0 5px currentColor);
            }
          }
        `;
        document.head.appendChild(style);
      }

      function majCarteAgentVisiteurProgramme() {
        fetch(`${window.API_BASE_URL}/agents-visiteurs/programmes`)
          .then((res) => res.json())
          .then((data) => {
            const nbDiv = document.getElementById("nbAgentsVisiteurs");
            const listeDiv = document.getElementById("listeAgentsVisiteurs");
            if (!nbDiv || !listeDiv) return;
            if (!data.success || !Array.isArray(data.visites)) {
              nbDiv.textContent = "-";
              listeDiv.innerHTML =
                "<span style='color:#dc3545;'>Erreur de chargement</span>";
              return;
            }
            // On s'assure d'utiliser les bons champs : delivery_date et nom_agent_visiteur
            let visites = data.visites.map((v) => ({
              nom_agent_visiteur:
                v.nom_agent_visiteur || v.visitor_agent_name || "",
              client_name: v.client_name || "",
              lieu: v.lieu || "",
              delivery_date:
                v.delivery_date ||
                v.scheduled_delivery_date ||
                v.date_livraison ||
                "",
              status: v.status || v.statut || "",
            }));
            // Filtrage UI-only : on retire les agents supprimés (par nom+date ou nom seul)
            if (!window.suppressionsAgentsVisiteurs)
              window.suppressionsAgentsVisiteurs = [];
            visites = visites.filter((v) => {
              const nom = v.nom_agent_visiteur || v.visitor_agent_name || "-";
              let rawDate =
                v.delivery_date ||
                v.scheduled_delivery_date ||
                v.date_livraison ||
                "";
              if (rawDate instanceof Date)
                rawDate = rawDate.toISOString().split("T")[0];
              if (
                typeof rawDate === "string" &&
                /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)
              ) {
                const [jour, mois, annee] = rawDate.split("/");
                rawDate = `${annee}-${mois.padStart(2, "0")}-${jour.padStart(
                  2,
                  "0"
                )}`;
              }
              // On filtre si suppression par nom+date OU par nom seul (cas du récap)
              return !window.suppressionsAgentsVisiteurs.some(
                (s) => s.nom === nom && (!s.date || s.date === rawDate)
              );
            });
            nbDiv.textContent = visites.length;
            if (visites.length === 0) {
              listeDiv.innerHTML =
                "<span style='color:#a0aec0;'>Aucun agent visiteur programmé</span>";
              return;
            }
            let html = "<ul style='padding-left:12px;margin:0;'>";
            const now = new Date();
            visites.slice(0, 6).forEach((v) => {
              const nom = v.nom_agent_visiteur || "-";
              const client = v.client_name || "-";
              const lieu = v.lieu || "-";
              let dateStr = "-";
              let point = "";
              let isAttente = false;
              let isDetention = false;
              let isEnCours = false;
              let isLivre = false;
              if (v.delivery_date) {
                const d = new Date(v.delivery_date);
                dateStr = isNaN(d.getTime())
                  ? "-"
                  : d.toLocaleDateString("fr-FR");
                // Statut "en attente" (point orange <3j, rouge >3j)
                if (v.status && v.status.toLowerCase().includes("attente")) {
                  isAttente = true;
                  const diffJours = Math.floor(
                    (now - d) / (1000 * 60 * 60 * 24)
                  );
                  if (diffJours > 3) {
                    isDetention = true;
                  }
                }
                // Statut "en cours" (point bleu)
                if (v.status && v.status.toLowerCase().includes("cours")) {
                  isEnCours = true;
                }
                // Statut "livré" (affichage direct, plus de clignotant)
                if (v.status && v.status.toLowerCase().includes("livr")) {
                  isLivre = true;
                }
              }
              if (isAttente && !isDetention) {
                point = `<span class='dot-clignotant dot-orange' title='En attente'></span>`;
              } else if (isDetention) {
                point = `<span class='dot-clignotant dot-rouge' title='En attente &gt; 3 jours (détention)'></span>`;
              } else if (isEnCours) {
                point = `<span class='dot-clignotant dot-bleu' title='En cours'></span>`;
              } else if (isLivre) {
                point = `<span class='icon-validation-livre' title='Livré' style='color:#059669;font-size:1.15em;margin-right:5px;vertical-align:middle;'><i class='fas fa-check-circle'></i></span>Livré`;
              }
              html += `<li>${point}<strong>${nom}</strong> — <span style='color:#374151;'>${client}</span> <span style='color:#059669;font-weight:600;'>${lieu}</span> <span style='color:#6366f1;'>${dateStr}</span></li>`;
            });
            if (visites.length > 6)
              html += `<li style='color:#6366f1;font-size:0.95em;'>…et ${
                visites.length - 6
              } de plus</li>`;
            html += "</ul>";
            listeDiv.innerHTML = html;
            // Clic sur la carte : popup détaillé
            const card = document.querySelector(
              ".dashboard-card.agents-visiteurs"
            );
            if (card) {
              card.onclick = function () {
                ouvrirPopupAgentVisiteurProgramme(visites);
              };
              card.onkeydown = function (e) {
                if (e.key === "Enter" || e.key === " ")
                  ouvrirPopupAgentVisiteurProgramme(visites);
              };
              card.tabIndex = 0;
              card.setAttribute("role", "button");
              card.setAttribute(
                "aria-label",
                "Voir les agents visiteurs programmés"
              );
            }
          })
          .catch(() => {
            const nbDiv = document.getElementById("nbAgentsVisiteurs");
            const listeDiv = document.getElementById("listeAgentsVisiteurs");
            if (nbDiv) nbDiv.textContent = "-";
            if (listeDiv)
              listeDiv.innerHTML =
                "<span style='color:#dc3545;'>Erreur de connexion</span>";
          });
      }

      function ouvrirPopupAgentVisiteurProgramme(aVenir) {
        let popup = document.getElementById("popupAgentVisiteurProgramme");
        if (!popup) {
          popup = document.createElement("div");
          popup.id = "popupAgentVisiteurProgramme";
          popup.style.display = "none";
          popup.style.position = "fixed";
          popup.style.top = "0";
          popup.style.left = "0";
          popup.style.width = "100vw";
          popup.style.height = "100vh";
          popup.style.background = "rgba(30,41,59,0.55)";
          popup.style.zIndex = "9999";
          popup.style.alignItems = "center";
          popup.style.justifyContent = "center";
          popup.innerHTML = `
            <div id='popupAgentVisiteurProgrammeContent' style='background:linear-gradient(135deg,#f7fff7 60%,#e3f7e9 100%);border-radius:24px;box-shadow:0 12px 48px #05966955;padding:48px 40px 36px 40px;max-width:1100px;width:98vw;max-height:96vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:stretch;'>
              <button id='closePopupAgentVisiteurProgramme' style='position:absolute;top:22px;right:28px;background:none;border:none;font-size:2em;color:#059669;cursor:pointer;transition:color 0.2s;z-index:2;' title='Fermer'>&times;</button>
              <div style='font-size:2em;font-weight:900;color:#059669;margin-bottom:18px;display:flex;align-items:center;gap:16px;justify-content:center;'><i class='fas fa-user-check'></i> Agents visiteurs programmés (à venir)</div>
              <div style='display:flex;align-items:center;gap:18px;margin-bottom:18px;justify-content:flex-end;'>
                <input id='searchAgentVisiteurInput' type='text' placeholder='Rechercher par nom...' style='padding:10px 16px;font-size:1.1em;border:1.5px solid #05966933;border-radius:10px;outline:none;min-width:220px;box-shadow:0 2px 8px #05966911;transition:border 0.2s;'>
                <span style='color:#059669;font-size:1.3em;'><i class='fas fa-search'></i></span>
              </div>
              <div id='contenuPopupAgentVisiteurProgramme'></div>
            </div>
          `;
          document.body.appendChild(popup);
        }
        const contenu = document.getElementById(
          "contenuPopupAgentVisiteurProgramme"
        );
        const searchInput = document.getElementById("searchAgentVisiteurInput");
        if (!contenu) return;

        // Ajout des boutons de filtrage
        let filtreActif = "a_venir";
        let dateFiltreLivres = "";
        const now = new Date();

        function renderBoutons() {
          console.log("[LOG] renderBoutons appelé");
          contenu.innerHTML = `
            <div style='display:flex;gap:12px;justify-content:center;margin-bottom:18px;'>
              <button id='btnVoirLivres' style='padding:8px 18px;border-radius:8px;border:none;background:#22c55e;color:white;font-weight:600;cursor:pointer;'>✅ Voir les agents ayant livré</button>
              <button id='btnVoirAVenir' style='padding:8px 18px;border-radius:8px;border:none;background:#2563eb;color:white;font-weight:600;cursor:pointer;'>🔄 Voir les agents programmés à venir</button>
              <button id='btnRecapAgentsVisiteurs' style='padding:8px 18px;border-radius:8px;border:none;background:#6366f1;color:white;font-weight:600;cursor:pointer;'>🗂️ Récap agents visiteurs</button>
            </div>
            <div id='zoneFiltreDateLivres' style='display:none;justify-content:center;align-items:center;gap:8px;margin-bottom:12px;'></div>
            <div id='zoneTableAgents'></div>
          `;
          // Plus de bouton "Voir les agents en détention" ici
          document.getElementById("btnVoirLivres").onclick = () => {
            filtreActif = "livres";
            render();
          };
          // Le bouton "btnVoirDetention" n'existe plus, la gestion de la détention se fait via le dashboard
          document.getElementById("btnVoirAVenir").onclick = () => {
            filtreActif = "a_venir";
            render();
          };
          document.getElementById("btnRecapAgentsVisiteurs").onclick = () => {
            ouvrirPopupRecapAgentsVisiteurs(aVenir);
          };
        }

        // Nouvelle popup récap agents visiteurs (par date et opération)
        function ouvrirPopupRecapAgentsVisiteurs(visites) {
          // Mémorisation des suppressions en session (UI-only, persistant tant que la page n'est pas rechargée)
          if (!window.suppressionsAgentsVisiteurs) {
            window.suppressionsAgentsVisiteurs = [];
          }
          // Filtrer la liste de base avec suppressions mémorisées (supprime tous les programmes d'un agent supprimé)
          function isSuppressedAgent(nom) {
            return window.suppressionsAgentsVisiteurs.some(
              (s) => s.nom === nom
            );
          }
          const visitesFiltrees = visites.filter((v) => {
            const nom = v.nom_agent_visiteur || v.visitor_agent_name || "-";
            return !isSuppressedAgent(nom);
          });
          let popup = document.getElementById("popupRecapAgentsVisiteurs");
          if (!popup) {
            popup = document.createElement("div");
            popup.id = "popupRecapAgentsVisiteurs";
            popup.style.position = "fixed";
            popup.style.top = "0";
            popup.style.left = "0";
            popup.style.width = "100vw";
            popup.style.height = "100vh";
            popup.style.background = "rgba(30,41,59,0.55)";
            popup.style.zIndex = "10001";
            popup.style.display = "flex";
            popup.style.alignItems = "center";
            popup.style.justifyContent = "center";
            popup.innerHTML = `
              <div id='popupRecapAgentsVisiteursContent' style='background:linear-gradient(135deg,#f7faff 60%,#e3e9f7 100%);border-radius:24px;box-shadow:0 12px 48px #6366f155;padding:44px 40px 36px 40px;max-width:900px;width:98vw;max-height:96vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:stretch;'>
                <button id='closePopupRecapAgentsVisiteurs' style='position:absolute;top:22px;right:28px;background:none;border:none;font-size:2em;color:#6366f1;cursor:pointer;transition:color 0.2s;z-index:2;' title='Fermer'>&times;</button>
                <div style='font-size:2em;font-weight:900;color:#6366f1;margin-bottom:18px;display:flex;align-items:center;gap:16px;justify-content:center;'><i class='fas fa-users'></i> Récapitulatif agents visiteurs</div>
                <div id='contenuRecapAgentsVisiteurs'></div>
              </div>
            `;
            document.body.appendChild(popup);
          }
          // Générer la liste récapitulative
          const contenu = document.getElementById(
            "contenuRecapAgentsVisiteurs"
          );
          if (!contenu) return;
          // Regroupement par agent puis par date
          const agentsMap = {};
          visitesFiltrees.forEach((v) => {
            const nom = v.nom_agent_visiteur || v.visitor_agent_name || "-";
            const date =
              v.delivery_date ||
              v.scheduled_delivery_date ||
              v.date_livraison ||
              "-";
            const dateStr = date
              ? new Date(date).toLocaleDateString("fr-FR")
              : "-";
            const operation =
              v.operation ||
              v.nom_operation ||
              v.operation_name ||
              v.statut ||
              v.status ||
              "-";
            if (!agentsMap[nom]) agentsMap[nom] = [];
            agentsMap[nom].push({ date: dateStr, operation, rawDate: date });
          });
          let html = "";
          const agentNoms = Object.keys(agentsMap);
          if (agentNoms.length === 0) {
            html = `<div style='color:#6366f1;text-align:center;font-size:1.2em;padding:32px 0;'>Aucun agent visiteur trouvé.</div>`;
          } else {
            html = `<div style='display:flex;flex-direction:column;gap:12px;'>`;
            agentNoms.forEach((nom, idx) => {
              const agentId = `agentRecap_${idx}`;
              html += `
                <div style='background:#f7fff7;border-radius:12px;box-shadow:0 2px 8px #6366f111;padding:0;position:relative;'>
                  <button class='agent-recap-btn' data-agent='${agentId}' style='width:100%;text-align:left;padding:14px 18px;font-size:1.13em;font-weight:700;color:#2563eb;background:none;border:none;outline:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;'>
                    <span><i class='fas fa-user' style='margin-right:10px;'></i>${nom}</span>
                    <span style='font-size:0.9em;color:#6366f1;'>${
                      agentsMap[nom].length
                    } programme(s)</span>
                  </button>
                  <button class='btn-suppr-agent-recap' data-nom="${encodeURIComponent(
                    nom
                  )}" style='position:absolute;top:10px;right:18px;background:none;border:none;color:#dc2626;font-size:1.3em;cursor:pointer;z-index:3;' title='Supprimer cet agent'><i class='fas fa-trash-alt'></i></button>
                  <div id='${agentId}' class='agent-programs-list' style='display:none;padding:0 18px 14px 38px;'></div>
                </div>
              `;
            });
            html += `</div>`;
          }
          contenu.innerHTML = html;
          // Ajout de l'interactivité : afficher/masquer les programmes de chaque agent
          agentNoms.forEach((nom, idx) => {
            const agentId = `agentRecap_${idx}`;
            const btn = contenu.querySelector(
              `button[data-agent='${agentId}']`
            );
            const progDiv = contenu.querySelector(`#${agentId}`);
            if (btn && progDiv) {
              btn.onclick = function () {
                if (
                  progDiv.style.display === "none" ||
                  progDiv.style.display === ""
                ) {
                  // Générer la liste des programmes
                  let progHtml =
                    "<ul style='list-style:none;padding:0;margin:0;'>";
                  agentsMap[nom].sort(
                    (a, b) =>
                      new Date(b.date.split("/").reverse().join("-")) -
                      new Date(a.date.split("/").reverse().join("-"))
                  );
                  agentsMap[nom].forEach((item) => {
                    progHtml += `<li style='margin-bottom:8px;padding:8px 0;border-bottom:1px solid #e5e7eb;'><span style='color:#6366f1;font-weight:600;'>${item.date}</span> — <span style='color:#2563eb;'>${item.operation}</span></li>`;
                  });
                  progHtml += "</ul>";
                  progDiv.innerHTML = progHtml;
                  progDiv.style.display = "block";
                } else {
                  progDiv.style.display = "none";
                }
              };
            }
          });

          // Suppression instantanée d'un agent visiteur dans le récap + mémorisation en session
          const btnsSuppr = contenu.querySelectorAll(".btn-suppr-agent-recap");
          btnsSuppr.forEach((btn) => {
            btn.onclick = function (e) {
              e.stopPropagation();
              const nom = decodeURIComponent(btn.getAttribute("data-nom"));
              // Mémoriser la suppression (nom) dans la session JS (supprime tous les programmes de cet agent)
              if (
                !window.suppressionsAgentsVisiteurs.some((s) => s.nom === nom)
              ) {
                window.suppressionsAgentsVisiteurs.push({ nom });
              }
              // Suppression instantanée de la carte agent dans le DOM
              const card = btn.closest('div[style*="background:#f7fff7"]');
              if (card) card.remove();
            };
          });

          popup.style.display = "flex";
          // Fermeture
          const closeBtn = document.getElementById(
            "closePopupRecapAgentsVisiteurs"
          );
          if (closeBtn)
            closeBtn.onclick = () => {
              popup.style.display = "none";
            };
          popup.onclick = function (e) {
            if (e.target === popup) popup.style.display = "none";
          };
        }

        // Liste locale persistante pour la popup (scope fermeture)
        let localList = aVenir.slice();
        // Fonction utilitaire pour savoir si un agent (nom+date) est supprimé
        function isSuppressedAgentVisiteur(nom, date) {
          if (!window.suppressionsAgentsVisiteurs) return false;
          return window.suppressionsAgentsVisiteurs.some(
            (s) => s.nom === nom && s.date === date
          );
        }
        function renderTable(list) {
          const zoneTable = document.getElementById("zoneTableAgents");
          if (!zoneTable) {
            console.log("[LOG] zoneTableAgents introuvable");
            return;
          }
          console.log("[LOG] renderTable appelé, list:", list);
          // Toujours filtrer la liste selon suppressions mémorisées (nom+date)
          let filteredList = (Array.isArray(list) ? list : localList).filter(
            (liv) => {
              const nom =
                liv.nom_agent_visiteur || liv.visitor_agent_name || "-";
              let rawDate =
                liv.delivery_date ||
                liv.scheduled_delivery_date ||
                liv.date_livraison ||
                "";
              if (rawDate instanceof Date) {
                rawDate = rawDate.toISOString().split("T")[0];
              }
              if (
                typeof rawDate === "string" &&
                /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)
              ) {
                const [jour, mois, annee] = rawDate.split("/");
                rawDate = `${annee}-${mois.padStart(2, "0")}-${jour.padStart(
                  2,
                  "0"
                )}`;
              }
              // On filtre si suppression par nom+date OU par nom seul (cas du récap)
              if (!window.suppressionsAgentsVisiteurs) return true;
              return !window.suppressionsAgentsVisiteurs.some(
                (s) => s.nom === nom && (!s.date || s.date === rawDate)
              );
            }
          );
          // On ne modifie localList que si c'est le premier render ou un vrai filtre/recherche
          if (Array.isArray(list) && list !== localList) {
            localList = list.slice();
          }
          if (!Array.isArray(filteredList) || filteredList.length === 0) {
            zoneTable.innerHTML =
              '<div style="color:#059669;text-align:center;font-size:1.2em;padding:32px 0;">Aucun agent trouvé pour ce filtre.</div>';
            return;
          }
          let table = `<div style='overflow-x:auto;'><table style='width:100%;border-collapse:separate;border-spacing:0 6px;font-size:1.08em;margin-top:6px;background:none;'>`;
          table += `<thead><tr style='background:#e3f7e9;'><th style='padding:10px 16px;border-bottom:2px solid #05966922;font-size:1.08em;color:#059669;text-align:left;'>Date de livraison</th><th style='padding:10px 16px;border-bottom:2px solid #05966922;font-size:1.08em;color:#059669;text-align:left;'>Nom agent visiteur</th><th style='padding:10px 16px;border-bottom:2px solid #05966922;font-size:1.08em;color:#059669;text-align:left;'>Client</th><th style='padding:10px 16px;border-bottom:2px solid #05966922;font-size:1.08em;color:#059669;text-align:left;'>Lieu</th><th style='padding:10px 16px;border-bottom:2px solid #05966922;font-size:1.08em;color:#059669;text-align:left;'>Statut</th><th style='padding:10px 16px;border-bottom:2px solid #05966922;font-size:1.08em;color:#059669;text-align:center;'>Supprimer</th></tr></thead><tbody>`;
          filteredList
            .sort((a, b) => {
              const dateA = new Date(
                a.delivery_date ||
                  a.scheduled_delivery_date ||
                  a.date_livraison ||
                  ""
              );
              const dateB = new Date(
                b.delivery_date ||
                  b.scheduled_delivery_date ||
                  b.date_livraison ||
                  ""
              );
              return dateA - dateB;
            })
            .forEach(function (liv, idx) {
              let dateStr = "-";
              let d = null;
              if (
                liv.delivery_date ||
                liv.scheduled_delivery_date ||
                liv.date_livraison
              ) {
                d = new Date(
                  liv.delivery_date ||
                    liv.scheduled_delivery_date ||
                    liv.date_livraison
                );
                dateStr = isNaN(d.getTime())
                  ? "-"
                  : d.toLocaleDateString("fr-FR");
              }
              const nom =
                liv.nom_agent_visiteur || liv.visitor_agent_name || "-";
              const client = liv.client_name || "-";
              const lieu = liv.lieu || "-";
              const statut = liv.status || "-";
              // Animation point selon statut (reprend la logique d'origine)
              let point = "";
              let validation = "";
              const statusLow = statut.toLowerCase();
              const now = new Date();
              let isAttente = false,
                isDetention = false,
                isEnCours = false,
                isLivreClignotant = false,
                isLivre = false;
              if (d) {
                if (statusLow.includes("attente")) {
                  isAttente = true;
                  const diffJours = Math.floor(
                    (now - d) / (1000 * 60 * 60 * 24)
                  );
                  if (diffJours > 3) isDetention = true;
                }
                if (statusLow.includes("cours")) isEnCours = true;
                if (statusLow.includes("livr")) {
                  isLivre = true;
                }
              }
              if (isAttente && !isDetention) {
                point = `<span class='dot-clignotant dot-orange' title='En attente'></span>`;
              } else if (isDetention) {
                point = `<span class='dot-clignotant dot-rouge' title='En attente &gt; 3 jours (détention)'></span>`;
              } else if (isEnCours) {
                point = `<span class='dot-clignotant dot-bleu' title='En cours'></span>`;
              } else if (isLivreClignotant) {
                // plus de clignotant livré
              }
              if (isLivre) {
                validation = `<span class='icon-validation-livre' title='Livré' style='color:#059669;font-size:1.25em;margin-left:7px;vertical-align:middle;'><i class='fas fa-check-circle'></i></span>Livré`;
              }
              // Ajout du bouton supprimer (icône corbeille) avec l'index
              let rawDate =
                liv.delivery_date ||
                liv.scheduled_delivery_date ||
                liv.date_livraison ||
                "";
              if (rawDate instanceof Date) {
                rawDate = rawDate.toISOString().split("T")[0];
              }
              if (
                typeof rawDate === "string" &&
                /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)
              ) {
                const [jour, mois, annee] = rawDate.split("/");
                rawDate = `${annee}-${mois.padStart(2, "0")}-${jour.padStart(
                  2,
                  "0"
                )}`;
              }
              const btnSuppr = `<button class='btn-suppr-agent-visiteur' title='Supprimer cet agent' data-idx="${idx}" data-nom="${encodeURIComponent(
                nom
              )}" data-date="${encodeURIComponent(
                rawDate
              )}" style='background:none;border:none;color:#dc2626;font-size:1.3em;cursor:pointer;'><i class='fas fa-trash-alt'></i></button>`;
              table +=
                `<tr style='background:${
                  idx % 2 === 0 ? "#f7fff7" : "#e3f7e9"
                };box-shadow:0 2px 8px #05966911;'>` +
                `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#059669;'>${dateStr}</td>` +
                `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;'>${point}<b style='color:#2563eb;margin-left:6px;'>${nom}</b>${validation}</td>` +
                `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;'>${client}</td>` +
                `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;'>${lieu}</td>` +
                `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;'>${statut}</td>` +
                `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:center;'>${btnSuppr}</td>` +
                `</tr>`;
            });
          table += `</tbody></table></div>`;
          zoneTable.innerHTML = table;
          console.log("[LOG] Tableau injecté dans zoneTableAgents");
          // Suppression UI-only, sans appel backend, suppression de la ligne dans la liste locale
          const btns = zoneTable.querySelectorAll(".btn-suppr-agent-visiteur");
          btns.forEach((btn) => {
            btn.onclick = function (e) {
              const idx = parseInt(btn.getAttribute("data-idx"), 10);
              const nom = decodeURIComponent(btn.getAttribute("data-nom"));
              const date = decodeURIComponent(btn.getAttribute("data-date"));
              // Popup de confirmation moderne
              let confirmPopup = document.getElementById(
                "popupConfirmSuppressionAgentVisiteur"
              );
              let confirmerBtn;
              if (!confirmPopup) {
                confirmPopup = document.createElement("div");
                confirmPopup.id = "popupConfirmSuppressionAgentVisiteur";
                confirmPopup.style.position = "fixed";
                confirmPopup.style.top = "0";
                confirmPopup.style.left = "0";
                confirmPopup.style.width = "100vw";
                confirmPopup.style.height = "100vh";
                confirmPopup.style.background = "rgba(30,41,59,0.55)";
                confirmPopup.style.zIndex = "10000";
                confirmPopup.style.display = "flex";
                confirmPopup.style.alignItems = "center";
                confirmPopup.style.justifyContent = "center";
                confirmPopup.innerHTML = `
                  <div id='popupConfirmSuppressionAgentVisiteurContent' style='background:linear-gradient(135deg,#fff7f7 60%,#fbeaea 100%);border-radius:22px;box-shadow:0 8px 32px #dc262655;padding:38px 32px 28px 32px;max-width:420px;width:96vw;position:relative;display:flex;flex-direction:column;align-items:center;'>
                    <button id='closePopupConfirmSuppressionAgentVisiteur' style='position:absolute;top:16px;right:18px;background:none;border:none;font-size:1.7em;color:#dc2626;cursor:pointer;transition:color 0.2s;z-index:2;' title='Annuler'>&times;</button>
                    <div style='font-size:1.5em;font-weight:800;color:#dc2626;margin-bottom:12px;display:flex;align-items:center;gap:10px;'><i class='fas fa-trash-alt'></i> Confirmation suppression</div>
                    <div style='font-size:1.08em;color:#374151;margin-bottom:18px;text-align:center;'>
                      Voulez-vous vraiment supprimer l'agent visiteur <br><b style='color:#2563eb;'>"${nom}"</b> du <b style='color:#059669;'>${date}</b> ?<br>
                      <span style='color:#dc2626;font-size:0.98em;font-weight:600;'>Cette action est irréversible.</span>
                    </div>
                    <div style='display:flex;gap:18px;justify-content:center;margin-top:10px;'>
                      <button id='btnConfirmerSuppressionAgentVisiteur' style='padding:10px 22px;font-size:1.08em;font-weight:700;background:#dc2626;color:#fff;border:none;border-radius:8px;box-shadow:0 2px 8px #dc262622;cursor:pointer;transition:background 0.2s;'>Supprimer</button>
                      <button id='btnAnnulerSuppressionAgentVisiteur' style='padding:10px 22px;font-size:1.08em;font-weight:700;background:#e5e7eb;color:#374151;border:none;border-radius:8px;box-shadow:0 2px 8px #37415111;cursor:pointer;transition:background 0.2s;'>Annuler</button>
                    </div>
                  </div>
                `;
                document.body.appendChild(confirmPopup);
                confirmerBtn = document.getElementById(
                  "btnConfirmerSuppressionAgentVisiteur"
                );
              } else {
                confirmPopup.style.display = "flex";
                // Met à jour le contenu si besoin
                const content = document.getElementById(
                  "popupConfirmSuppressionAgentVisiteurContent"
                );
                if (content) {
                  content.querySelector("b").textContent = `\"${nom}\"`;
                  content.querySelectorAll("b")[1].textContent = date;
                }
                confirmerBtn = document.getElementById(
                  "btnConfirmerSuppressionAgentVisiteur"
                );
              }
              // Toujours réactiver le bouton confirmer
              if (confirmerBtn) {
                confirmerBtn.disabled = false;
                confirmerBtn.textContent = "Supprimer";
              }
              // Gestion des boutons
              const closeBtn = document.getElementById(
                "closePopupConfirmSuppressionAgentVisiteur"
              );
              const annulerBtn = document.getElementById(
                "btnAnnulerSuppressionAgentVisiteur"
              );
              function closePopup() {
                confirmPopup.style.display = "none";
              }
              if (closeBtn) closeBtn.onclick = closePopup;
              if (annulerBtn) annulerBtn.onclick = closePopup;
              if (confirmPopup) {
                confirmPopup.onclick = function (e) {
                  if (e.target === confirmPopup) closePopup();
                };
              }
              if (confirmerBtn) {
                confirmerBtn.onclick = function () {
                  confirmerBtn.disabled = true;
                  confirmerBtn.textContent = "Suppression...";
                  // Mémoriser la suppression (nom+date) dans la session JS
                  if (!window.suppressionsAgentsVisiteurs)
                    window.suppressionsAgentsVisiteurs = [];
                  if (
                    !window.suppressionsAgentsVisiteurs.some(
                      (s) => s.nom === nom && s.date === date
                    )
                  ) {
                    window.suppressionsAgentsVisiteurs.push({ nom, date });
                  }
                  closePopup();
                  // Toujours re-filtrer la liste de base (aVenir) après suppression
                  renderTable(aVenir.slice());
                  // Mettre à jour le compteur sur la carte dashboard
                  if (typeof majCarteAgentVisiteurProgramme === "function") {
                    majCarteAgentVisiteurProgramme();
                  }
                };
              }
            };
          });
        }

        function renderFiltreDateLivres() {
          const zone = document.getElementById("zoneFiltreDateLivres");
          if (!zone) return;
          if (filtreActif !== "livres") {
            zone.style.display = "none";
            return;
          }
          zone.style.display = "flex";
          zone.innerHTML = `
            <label for='filtreDateLivres' style='font-weight:600;color:#059669;'>Filtrer par date : </label>
            <input type='date' id='filtreDateLivres' value='${dateFiltreLivres}' style='padding:6px 12px;border-radius:6px;border:1px solid #05966933;'>
            <button id='btnResetDateLivres' style='padding:6px 12px;border-radius:6px;border:none;background:#059669;color:white;font-weight:600;cursor:pointer;'>Réinitialiser</button>
          `;
          document.getElementById("filtreDateLivres").onchange = (e) => {
            dateFiltreLivres = e.target.value;
            render();
          };
          document.getElementById("btnResetDateLivres").onclick = () => {
            dateFiltreLivres = "";
            render();
          };
        }

        function render() {
          renderBoutons();
          renderFiltreDateLivres();
          let filtered = [];
          // --- Filtrage des suppressions UI-only persistantes (nom ou nom+date) ---
          if (!window.suppressionsAgentsVisiteurs)
            window.suppressionsAgentsVisiteurs = [];
          function isSuppressedAgentVisiteur(nom, date) {
            // Supprimé par nom (depuis le récap) OU par nom+date (depuis la popup principale)
            return (
              window.suppressionsAgentsVisiteurs.some((s) => s.nom === nom) ||
              window.suppressionsAgentsVisiteurs.some(
                (s) => s.nom === nom && s.date === date
              )
            );
          }
          if (filtreActif === "livres") {
            filtered = aVenir.filter((v) => {
              const status = (v.status || "").toLowerCase();
              if (!status.includes("livr")) return false;
              if (dateFiltreLivres) {
                // On compare la date de livraison
                const d = new Date(
                  v.delivery_date ||
                    v.scheduled_delivery_date ||
                    v.date_livraison ||
                    ""
                );
                if (isNaN(d.getTime())) return false;
                const dISO = d.toISOString().slice(0, 10);
                return dISO === dateFiltreLivres;
              }
              // --- Filtrage suppression UI-only ---
              const nom = v.nom_agent_visiteur || v.visitor_agent_name || "-";
              let rawDate =
                v.delivery_date ||
                v.scheduled_delivery_date ||
                v.date_livraison ||
                "";
              if (rawDate instanceof Date)
                rawDate = rawDate.toISOString().split("T")[0];
              if (
                typeof rawDate === "string" &&
                /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)
              ) {
                const [jour, mois, annee] = rawDate.split("/");
                rawDate = `${annee}-${mois.padStart(2, "0")}-${jour.padStart(
                  2,
                  "0"
                )}`;
              }
              return !isSuppressedAgentVisiteur(nom, rawDate);
            });
          } else if (filtreActif === "detention") {
            // ...existing code for detention...
            let agentsRetard = [];
            if (
              window.deliveries &&
              typeof window.checkLateContainers === "function"
            ) {
              window.checkLateContainers();
              let lateList = [];
              if (
                window.lateContainers &&
                Array.isArray(window.lateContainers)
              ) {
                lateList = window.lateContainers;
              } else if (window.deliveries) {
                const nowDet = new Date();
                window.deliveries.forEach((delivery) => {
                  if (
                    !delivery.container_statuses ||
                    !delivery.container_statuses_fr
                  )
                    return;
                  Object.entries(delivery.container_statuses).forEach(
                    ([numeroTC, statut]) => {
                      const statutFr =
                        delivery.container_statuses_fr[numeroTC] || statut;
                      let dateEnr = null;
                      if (
                        delivery.containers_info &&
                        delivery.containers_info[numeroTC] &&
                        delivery.containers_info[numeroTC].created_at
                      ) {
                        dateEnr = new Date(
                          delivery.containers_info[numeroTC].created_at
                        );
                      } else if (delivery.created_at) {
                        dateEnr = new Date(delivery.created_at);
                      }
                      if (!dateEnr) return;
                      const isLate =
                        !statutFr.toLowerCase().includes("livr") &&
                        nowDet - dateEnr > 2 * 24 * 60 * 60 * 1000;
                      if (isLate) {
                        agentsRetard.push({
                          agentName:
                            delivery.employee_name ||
                            delivery.agent_name ||
                            (delivery.agents &&
                            Array.isArray(delivery.agents) &&
                            delivery.agents.length > 0
                              ? delivery.agents.join(", ")
                              : null),
                          numeroTC,
                          dossier:
                            delivery.dossier_number || delivery.id || "?",
                          clientName:
                            delivery.client_name || delivery.client || "-",
                          dateEnr: dateEnr,
                        });
                      }
                    }
                  );
                });
              }
              if (lateList.length > 0) {
                lateList.forEach((c) => {
                  agentsRetard.push({
                    agentName: c.agentName,
                    numeroTC: c.numeroTC,
                    dossier: c.dossier,
                    clientName: c.clientName,
                    dateEnr: c.dateEnr,
                  });
                });
              }
            }
            const uniqueAgentsRetard = [];
            const seen = new Set();
            agentsRetard.forEach((a) => {
              const key = (a.agentName || "") + "-" + (a.numeroTC || "");
              if (!seen.has(key)) {
                uniqueAgentsRetard.push(a);
                seen.add(key);
              }
            });
            filtered = aVenir
              .filter((v) => {
                const status = (v.status || "").toLowerCase();
                if (!status.includes("attente")) return false;
                const d = new Date(
                  v.delivery_date ||
                    v.scheduled_delivery_date ||
                    v.date_livraison ||
                    ""
                );
                if (isNaN(d.getTime())) return false;
                const diffJours = Math.floor((now - d) / (1000 * 60 * 60 * 24));
                // --- Filtrage suppression UI-only ---
                const nom = v.nom_agent_visiteur || v.visitor_agent_name || "-";
                let rawDate =
                  v.delivery_date ||
                  v.scheduled_delivery_date ||
                  v.date_livraison ||
                  "";
                if (rawDate instanceof Date)
                  rawDate = rawDate.toISOString().split("T")[0];
                if (
                  typeof rawDate === "string" &&
                  /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)
                ) {
                  const [jour, mois, annee] = rawDate.split("/");
                  rawDate = `${annee}-${mois.padStart(2, "0")}-${jour.padStart(
                    2,
                    "0"
                  )}`;
                }
                if (isSuppressedAgentVisiteur(nom, rawDate)) return false;
                return diffJours > 3;
              })
              .sort((a, b) => {
                const dA = new Date(
                  a.delivery_date ||
                    a.scheduled_delivery_date ||
                    a.date_livraison ||
                    ""
                );
                const dB = new Date(
                  b.delivery_date ||
                    b.scheduled_delivery_date ||
                    b.date_livraison ||
                    ""
                );
                return dA - dB;
              });
            uniqueAgentsRetard.forEach((a) => {
              if (
                !filtered.some(
                  (v) =>
                    (v.nom_agent_visiteur || v.visitor_agent_name || "") ===
                    (a.agentName || "")
                )
              ) {
                filtered.push({
                  nom_agent_visiteur: a.agentName,
                  client_name: a.clientName,
                  lieu: "-",
                  delivery_date: a.dateEnr,
                  status: "Détention (retard suivi)",
                  numeroTC: a.numeroTC,
                  dossier: a.dossier,
                });
              }
            });
          } else {
            // Agents programmés à venir (date future >= aujourd'hui)
            filtered = aVenir.filter((v) => {
              const d = new Date(
                v.delivery_date ||
                  v.scheduled_delivery_date ||
                  v.date_livraison ||
                  ""
              );
              if (isNaN(d.getTime())) return false;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              d.setHours(0, 0, 0, 0);
              // --- Filtrage suppression UI-only ---
              const nom = v.nom_agent_visiteur || v.visitor_agent_name || "-";
              let rawDate =
                v.delivery_date ||
                v.scheduled_delivery_date ||
                v.date_livraison ||
                "";
              if (rawDate instanceof Date)
                rawDate = rawDate.toISOString().split("T")[0];
              if (
                typeof rawDate === "string" &&
                /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)
              ) {
                const [jour, mois, annee] = rawDate.split("/");
                rawDate = `${annee}-${mois.padStart(2, "0")}-${jour.padStart(
                  2,
                  "0"
                )}`;
              }
              return d >= today && !isSuppressedAgentVisiteur(nom, rawDate);
            });
          }
          // Recherche par nom
          if (searchInput && searchInput.value.trim()) {
            const val = searchInput.value.trim().toLowerCase();
            filtered = filtered.filter((v) =>
              (v.nom_agent_visiteur || v.visitor_agent_name || "")
                .toLowerCase()
                .includes(val)
            );
          }
          renderTable(filtered);
        }

        // Initialisation
        filtreActif = "a_venir";
        dateFiltreLivres = "";
        console.log("[LOG] Appel initial à render()");
        render();

        if (searchInput) {
          searchInput.value = "";
          searchInput.oninput = function () {
            render();
          };
        }
        popup.style.display = "flex";
        console.log("[LOG] popupAgentVisiteurProgramme affiché");
        // Fermeture
        const closeBtn = document.getElementById(
          "closePopupAgentVisiteurProgramme"
        );
        if (closeBtn) {
          closeBtn.onclick = () => {
            popup.style.display = "none";
          };
        }
        popup.addEventListener("click", (e) => {
          if (e.target === popup) popup.style.display = "none";
        });
      }

      // Rafraîchissement automatique toutes les 30s
      setInterval(majCarteAgentVisiteurProgramme, 30000);
      // Premier affichage au chargement
      majCarteAgentVisiteurProgramme();
      // Ajout du popup recap mois (hors dashboard-cards-row) avec navigation multi-mois
      html += `<div id="popupRecapMois" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(30,41,59,0.55);z-index:9999;align-items:center;justify-content:center;">
        <div id="popupRecapMoisContent" style="background:linear-gradient(135deg,#f7faff 60%,#e3e9f7 100%);border-radius:28px;box-shadow:0 12px 48px #6366f155;padding:48px 44px 36px 44px;max-width:1200px;width:98vw;max-height:96vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:stretch;">
          <button id="closeRecapMois" style="position:absolute;top:22px;right:32px;background:none;border:none;font-size:2em;color:#6366f1;cursor:pointer;transition:color 0.2s;z-index:2;">&times;</button>
          <div style="font-size:2em;font-weight:900;color:#6366f1;margin-bottom:18px;display:flex;align-items:center;gap:16px;justify-content:center;">
            <i class='fas fa-calendar-alt'></i> Récapitulatif du mois 
            <button id="btnMoisPrecedent" title="Mois précédent" style="margin:0 8px 0 0;padding:6px 14px;font-size:1.3em;background:#eaf1fb;color:#6366f1;border:none;border-radius:50%;box-shadow:0 2px 8px #6366f122;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;width:38px;height:38px;"><i class="fas fa-chevron-left"></i></button>
            <span id="moisAfficheRecap" style='font-size:0.7em;font-weight:600;color:#374151;background:#eaf1fb;padding:6px 18px;border-radius:12px;box-shadow:0 2px 8px #6366f111;letter-spacing:0.5px;'></span>
            <button id="btnMoisSuivant" title="Mois suivant" style="margin:0 0 0 8px;padding:6px 14px;font-size:1.3em;background:#eaf1fb;color:#6366f1;border:none;border-radius:50%;box-shadow:0 2px 8px #6366f122;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;width:38px;height:38px;"><i class="fas fa-chevron-right"></i></button>
          </div>
          <div id="contenuRecapMoisSynthese"></div>
          <div id='recapMoisLivraisonsList' style='margin-top:10px;'></div>
          <div id='recapMoisLivraisonDetail' style='display:none;margin-top:18px;background:#fff;border-radius:14px;box-shadow:0 2px 8px #2563eb11;padding:24px 18px;'></div>
        </div>
      </div>`;
      resumeHierDiv.innerHTML = html;

      // Activation du bouton "Voir les agents en détention" dans la nouvelle carte dashboard
      setTimeout(() => {
        const btnDetention = document.getElementById(
          "btnVoirDetentionDashboard"
        );
        if (btnDetention) {
          let detentionInterval = null;
          // Fonction pour calculer et afficher la popup
          function renderPopupDetentionAgentsRetard() {
            // --- Popup Détention : uniquement les agents en retard livraison conteneur ---
            // Récupération des agents en retard (lateContainers ou fallback)
            let agentsRetard = [];
            if (window.deliveries) {
              let lateList = [];
              if (
                window.lateContainers &&
                Array.isArray(window.lateContainers)
              ) {
                lateList = window.lateContainers;
              } else {
                // Fallback : reconstituer lateList à la volée
                const nowDet = new Date();
                window.deliveries.forEach((delivery) => {
                  if (
                    !delivery.container_statuses ||
                    !delivery.container_statuses_fr
                  )
                    return;
                  Object.entries(delivery.container_statuses).forEach(
                    ([numeroTC, statut]) => {
                      const statutFr =
                        delivery.container_statuses_fr[numeroTC] || statut;
                      let dateEnr = null;
                      if (
                        delivery.containers_info &&
                        delivery.containers_info[numeroTC] &&
                        delivery.containers_info[numeroTC].created_at
                      ) {
                        dateEnr = new Date(
                          delivery.containers_info[numeroTC].created_at
                        );
                      } else if (delivery.created_at) {
                        dateEnr = new Date(delivery.created_at);
                      }
                      if (!dateEnr) return;
                      const isLate =
                        !statutFr.toLowerCase().includes("livr") &&
                        nowDet - dateEnr > 2 * 24 * 60 * 60 * 1000;
                      if (isLate) {
                        lateList.push({
                          agentName:
                            delivery.employee_name ||
                            delivery.agent_name ||
                            (delivery.agents &&
                            Array.isArray(delivery.agents) &&
                            delivery.agents.length > 0
                              ? delivery.agents.join(", ")
                              : null),
                          numeroTC,
                          dossier:
                            delivery.dossier_number || delivery.id || "?",
                          clientName:
                            delivery.client_name || delivery.client || "-",
                          dateEnr: dateEnr,
                        });
                      }
                    }
                  );
                });
              }
              // Nettoyage doublons (agent + TC)
              const seen = new Set();
              lateList.forEach((a) => {
                const key = (a.agentName || "") + "-" + (a.numeroTC || "");
                if (!seen.has(key)) {
                  agentsRetard.push(a);
                  seen.add(key);
                }
              });
            }
            // Affichage popup moderne
            let popup = document.getElementById("popupDetentionAgentsRetard");
            if (!popup) {
              popup = document.createElement("div");
              popup.id = "popupDetentionAgentsRetard";
              popup.style.position = "fixed";
              popup.style.top = "0";
              popup.style.left = "0";
              popup.style.width = "100vw";
              popup.style.height = "100vh";
              popup.style.background = "rgba(30,41,59,0.55)";
              popup.style.zIndex = "10001";
              popup.style.display = "flex";
              popup.style.alignItems = "center";
              popup.style.justifyContent = "center";
              popup.innerHTML = `
                <div style='background:linear-gradient(135deg,#fff7f7 60%,#fbeaea 100%);border-radius:24px;box-shadow:0 12px 48px #ef444455;padding:44px 40px 36px 40px;max-width:900px;width:98vw;max-height:96vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:stretch;'>
                  <button id='closePopupDetentionAgentsRetard' style='position:absolute;top:22px;right:28px;background:none;border:none;font-size:2em;color:#ef4444;cursor:pointer;transition:color 0.2s;z-index:2;' title='Fermer'>&times;</button>
                  <div style='font-size:2em;font-weight:900;color:#ef4444;margin-bottom:18px;display:flex;align-items:center;gap:16px;justify-content:center;'><i class='fas fa-exclamation-triangle'></i> Retard de Dossier <br><span style="font-size:0.7em;font-weight:600;color:#ef4444;"></span></div>
                  <div id='contenuPopupDetentionAgentsRetard'></div>
                </div>
              `;
              document.body.appendChild(popup);
            }
            // Générer la liste
            const contenu = document.getElementById(
              "contenuPopupDetentionAgentsRetard"
            );
            if (contenu) {
              if (!agentsRetard.length) {
                contenu.innerHTML = `<div style='color:#ef4444;text-align:center;font-size:1.2em;padding:32px 0;'>Aucun Dossier en retard pour le moment...</div>`;
              } else {
                let html = `<div style='overflow-x:auto;'><table style='width:100%;border-collapse:separate;border-spacing:0 6px;font-size:1.08em;margin-top:6px;background:none;'>`;
                html += `<thead><tr style='background:#fbeaea;'><th style='padding:10px 16px;border-bottom:2px solid #ef444422;font-size:1.08em;color:#ef4444;text-align:left;'>Nom agent</th><th style='padding:10px 16px;border-bottom:2px solid #ef444422;font-size:1.08em;color:#ef4444;text-align:left;'>Client</th><th style='padding:10px 16px;border-bottom:2px solid #ef444422;font-size:1.08em;color:#ef4444;text-align:left;'>N° Conteneur</th><th style='padding:10px 16px;border-bottom:2px solid #ef444422;font-size:1.08em;color:#ef4444;text-align:left;'>N° Dossier</th><th style='padding:10px 16px;border-bottom:2px solid #ef444422;font-size:1.08em;color:#ef4444;text-align:left;'>Date entrée</th><th style='padding:10px 16px;border-bottom:2px solid #ef444422;font-size:1.08em;color:#ef4444;text-align:left;'>Jours de retard</th></tr></thead><tbody>`;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                agentsRetard.forEach((a, idx) => {
                  let dateEntree = a.dateEnr ? new Date(a.dateEnr) : null;
                  let joursRetard = "-";
                  if (dateEntree && !isNaN(dateEntree.getTime())) {
                    dateEntree.setHours(0, 0, 0, 0);
                    const diff = Math.floor(
                      (today - dateEntree) / (1000 * 60 * 60 * 24)
                    );
                    joursRetard =
                      diff > 0
                        ? diff + (diff === 1 ? " jour" : " jours")
                        : "0 jour";
                  }
                  html +=
                    `<tr style='background:${
                      idx % 2 === 0 ? "#fff7f7" : "#fbeaea"
                    };box-shadow:0 2px 8px #ef444411;'>` +
                    `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#ef4444;'>${
                      a.agentName || "-"
                    }</td>` +
                    `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;'>${
                      a.clientName || "-"
                    }</td>` +
                    `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;'>${
                      a.numeroTC || "-"
                    }</td>` +
                    `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;'>${
                      a.dossier || "-"
                    }</td>` +
                    `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;'>${
                      dateEntree ? dateEntree.toLocaleDateString("fr-FR") : "-"
                    }</td>` +
                    `<td style='padding:10px 16px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#ef4444;'>${joursRetard}</td>` +
                    `</tr>`;
                });
                html += `</tbody></table></div>`;
                contenu.innerHTML = html;
              }
            }
            popup.style.display = "flex";
            // Fermeture
            const closeBtn = document.getElementById(
              "closePopupDetentionAgentsRetard"
            );
            if (closeBtn)
              closeBtn.onclick = () => {
                popup.style.display = "none";
                if (detentionInterval) {
                  clearInterval(detentionInterval);
                  detentionInterval = null;
                }
              };
            popup.onclick = function (e) {
              if (e.target === popup) {
                popup.style.display = "none";
                if (detentionInterval) {
                  clearInterval(detentionInterval);
                  detentionInterval = null;
                }
              }
            };
          }
          btnDetention.onclick = function () {
            renderPopupDetentionAgentsRetard();
            if (detentionInterval) {
              clearInterval(detentionInterval);
              detentionInterval = null;
            }
            detentionInterval = setInterval(() => {
              const popup = document.getElementById(
                "popupDetentionAgentsRetard"
              );
              if (popup && popup.style.display !== "none") {
                renderPopupDetentionAgentsRetard();
              } else {
                clearInterval(detentionInterval);
                detentionInterval = null;
              }
            }, 15000); // 15 secondes
          };
        }
      }, 0);

      // --- Interactivité des menus déroulants sur les 3 cartes principales (Livraisons, Agents, Clients) ---
      setTimeout(() => {
        const cards = document.querySelectorAll(".dashboard-card");
        const focusable = ["livraisons", "agents", "clients"];
        cards.forEach((card) => {
          const type = card.getAttribute("data-card");
          if (!focusable.includes(type)) return;
          const cardList = card.querySelector(".card-list");
          // Toggle au clic sur la carte (hors flèche et contenu de la liste)
          card.addEventListener("click", function (e) {
            if (
              e.target.closest(".card-arrow") ||
              e.target.closest(".card-list")
            )
              return;
            // Ferme les autres cartes principales
            cards.forEach((c) => {
              if (c !== card && focusable.includes(c.getAttribute("data-card")))
                c.classList.remove("active");
            });
            card.classList.toggle("active");
            // Accessibilité : focus sur la liste si ouverte
            if (card.classList.contains("active") && cardList) {
              cardList.setAttribute("tabindex", "-1");
              cardList.focus && cardList.focus();
            }
          });
          // Accessibilité clavier : Entrée ou Espace
          card.tabIndex = 0;
          card.setAttribute("role", "button");
          card.setAttribute(
            "aria-label",
            card.querySelector(".card-title")?.textContent || "Carte dashboard"
          );
          card.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              card.click();
            }
          });
        });
      }, 0);
      // --- Navigation multi-mois dans la popup recap mois ---
      let moisAffiche = prevMonth;
      let anneeAffiche = prevYear;
      let allDeliveries = data.deliveries;
      const moisFrArr = moisFr;

      function renderRecapMoisPopup() {
        // Filtrer les livraisons du mois affiché
        let livraisonsMois = allDeliveries.filter((liv) => {
          if (!liv.created_at) return false;
          const d = new Date(liv.created_at);
          return (
            d.getFullYear() === anneeAffiche && d.getMonth() === moisAffiche
          );
        });
        // Ajout : filtrage par statut si badge cliqué
        let statutFiltreRecap = window.statutFiltreRecap || null;
        if (statutFiltreRecap) {
          livraisonsMois = livraisonsMois.filter((l) => {
            let s = l.status;
            if (!s || typeof s !== "string" || !s.trim()) return false;
            let sNorm = s.trim().toLowerCase();
            let statutFinal = s;
            if (
              sNorm === "pending_acconier" ||
              sNorm === "en attente acconier"
            ) {
              statutFinal = "En attente (Aconiés)";
            } else if (sNorm === "pending" || sNorm === "en attente") {
              statutFinal = "En attente";
            } else if (
              sNorm === "delivered" ||
              sNorm === "livrée" ||
              sNorm === "livré"
            ) {
              statutFinal = "Livrée";
            } else if (sNorm === "rejected" || sNorm === "rejetée") {
              statutFinal = "Rejetée";
            } else if (sNorm === "eir_returned") {
              statutFinal = "EIR retourné";
            } else if (
              sNorm === "in progress" ||
              sNorm === "in_progress" ||
              sNorm === "en_cours" ||
              sNorm === "en cours"
            ) {
              statutFinal = "En cours";
            } else if (sNorm === "paiement effectué") {
              statutFinal = "Paiement effectué";
            } else if (sNorm === "mise en livraison") {
              statutFinal = "Mise en livraison";
            }
            return statutFinal === statutFiltreRecap;
          });
        }
        const totalMois = livraisonsMois.length;
        const agentsMois = Array.from(
          new Set(livraisonsMois.map((l) => l.employee_name).filter(Boolean))
        );
        const clientsMois = Array.from(
          new Set(livraisonsMois.map((l) => l.client_name).filter(Boolean))
        );
        const traductionStatuts = {
          pending: "En attente",
          delivered: "Livrée",
          // pending_acconier: géré dynamiquement ci-dessous
          pending_acconier: "En attente de paiement ",
          rejected: "Rejetée",
          eir_returned: "EIR retourné",
          "in progress": "En cours",
          in_progress: "En cours",
          en_cours: "En cours",
          "en cours": "En cours",
          "paiement effectué": "Paiement effectué",
          "mise en livraison": "Mise en livraison",
        };
        const statutsMois = {};
        livraisonsMois.forEach((l) => {
          let s = l.status;
          if (!s || typeof s !== "string" || !s.trim()) return;
          let sNorm = s.trim().toLowerCase();
          let statutFinal = s;
          // Si "pending_acconier" ou "en attente acconier", on remplace par la vraie valeur métier acconier si dispo
          if (sNorm === "pending_acconier" || sNorm === "en attente acconier") {
            // Affichage en français pour pending_acconier
            statutFinal = "En attente (Aconiés)";
            sNorm = "pending_acconier";
          }
          if (
            !statutFinal ||
            typeof statutFinal !== "string" ||
            !statutFinal.trim()
          )
            return;
          if (sNorm === "inconnu" || sNorm === "unknown") return;
          // On garde la valeur exacte pour "Paiement effectué" et "Mise en livraison"
          if (sNorm === "paiement effectué" || sNorm === "mise en livraison") {
            statutsMois[statutFinal] = (statutsMois[statutFinal] || 0) + 1;
          } else {
            // Traduction si possible, sinon on met la version capitalisée
            let sKey = sNorm.replace(/ /g, "_");
            let sFr =
              traductionStatuts[sKey] ||
              traductionStatuts[sNorm] ||
              statutFinal.charAt(0).toUpperCase() +
                statutFinal.slice(1).toLowerCase();
            statutsMois[sFr] = (statutsMois[sFr] || 0) + 1;
          }
        });
        const lieuxMois = Array.from(
          new Set(livraisonsMois.map((l) => l.lieu).filter(Boolean))
        );

        // Mettre à jour le header mois/année
        const moisAfficheRecap = document.getElementById("moisAfficheRecap");
        if (moisAfficheRecap) {
          moisAfficheRecap.textContent = `${moisFrArr[moisAffiche]} ${anneeAffiche}`;
        }

        // Synthèse
        const synthDiv = document.getElementById("contenuRecapMoisSynthese");
        if (synthDiv) {
          synthDiv.innerHTML = `
            <div style=\"display:flex;flex-wrap:wrap;gap:32px 48px;justify-content:space-between;margin-bottom:24px;\">
              <div style=\"flex:1 1 220px;min-width:220px;max-width:320px;background:#fff7e6;border-radius:16px;padding:22px 18px;box-shadow:0 2px 8px #f59e0b22;\">
                <div style='font-size:1.15em;font-weight:700;color:#f59e0b;margin-bottom:8px;'><i class='fas fa-truck-loading'></i> Livraisons</div>
                <div style='font-size:2.2em;font-weight:900;color:#f59e0b;margin-bottom:7px;text-align:center;'>${totalMois}</div>
              </div>
              <div style=\"flex:1 1 220px;min-width:220px;max-width:320px;background:#e7f9f3;border-radius:16px;padding:22px 18px;box-shadow:0 2px 8px #05966922;\">
                <div style='font-size:1.15em;font-weight:700;color:#059669;margin-bottom:8px;'><i class='fas fa-user-tie'></i> Agents</div>
                <div style='font-size:2.2em;font-weight:900;color:#059669;margin-bottom:7px;text-align:center;'>${
                  agentsMois.length
                }</div>
              </div>
              <div style=\"flex:1 1 220px;min-width:220px;max-width:320px;background:#fffbe6;border-radius:16px;padding:22px 18px;box-shadow:0 2px 8px #f59e0b22;\">
                <div style='font-size:1.15em;font-weight:700;color:#f59e0b;margin-bottom:8px;'><i class='fas fa-users'></i> Clients</div>
                <div style='font-size:2.2em;font-weight:900;color:#f59e0b;margin-bottom:7px;text-align:center;'>${
                  clientsMois.length
                }</div>
              </div>
              <div style=\"flex:1 1 220px;min-width:220px;max-width:320px;background:#eaf1fb;border-radius:16px;padding:22px 18px;box-shadow:0 2px 8px #2563eb22;\">
                <div style='font-size:1.15em;font-weight:700;color:#2563eb;margin-bottom:8px;'><i class='fas fa-map-marker-alt'></i> Lieux</div>
                <div style='font-size:1.1em;font-weight:700;color:#2563eb;margin-bottom:7px;text-align:center;'>${
                  lieuxMois.length > 0 ? lieuxMois.join(", ") : "-"
                }</div>
              </div>
            </div>
            <div style='margin-bottom:18px;'><strong>Statuts :</strong> <span>
              ${
                Object.keys(statutsMois).length === 0
                  ? "Aucun"
                  : Object.entries(statutsMois)
                      .map(
                        ([s, n]) =>
                          `<span class=\"card-badge recap-mois-badge\" data-statut-recap="${s}">${n} ${s}</span>`
                      )
                      .join(" ")
              }
            </span>
            ${
              window.statutFiltreRecap
                ? `<button id='btnResetFiltreRecapMois' style='margin-left:18px;padding:6px 16px;font-size:0.98em;font-weight:600;background:#6366f1;color:#fff;border:none;border-radius:8px;box-shadow:0 2px 8px #6366f122;cursor:pointer;transition:background 0.2s;'>Réinitialiser le filtre</button>`
                : ""
            }
            </div>
            <div style='margin-bottom:18px;'>
              <strong>Liste des livraisons du mois&nbsp;:</strong>
            </div>
          `;
          // Ajout : gestion du clic sur badge statut
          setTimeout(() => {
            const badges = synthDiv.querySelectorAll(".recap-mois-badge");
            badges.forEach((badge) => {
              badge.style.cursor = "pointer";
              badge.onclick = function () {
                window.statutFiltreRecap =
                  badge.getAttribute("data-statut-recap");
                renderRecapMoisPopup();
              };
            });
            const btnReset = document.getElementById("btnResetFiltreRecapMois");
            if (btnReset) {
              btnReset.onclick = function () {
                window.statutFiltreRecap = null;
                renderRecapMoisPopup();
              };
            }
          }, 0);
        }

        // Liste des livraisons
        const recapList = document.getElementById("recapMoisLivraisonsList");
        if (recapList) {
          if (livraisonsMois.length === 0) {
            recapList.innerHTML =
              "<span style='color:#a0aec0;'>Aucune livraison enregistrée pour ce mois.</span>";
          } else {
            recapList.innerHTML = `<ul style='list-style:none;padding:0;margin:0;max-height:320px;overflow-y:auto;'>${livraisonsMois
              .map((liv, idx) => {
                let dateStr = "-";
                if (liv.created_at) {
                  const d = new Date(liv.created_at);
                  dateStr = isNaN(d.getTime())
                    ? "-"
                    : d.toLocaleDateString("fr-FR");
                }
                const client = liv.client_name || "-";
                const agent = liv.employee_name || "-";
                const lieu = liv.lieu || "-";
                return `<li class='recap-mois-liv-item' data-liv-index='${idx}' style='padding:10px 0 10px 0;border-bottom:1px solid #e5e7eb;cursor:pointer;transition:background 0.15s;display:flex;align-items:center;gap:18px;'>
                <span style='font-weight:700;color:#6366f1;width:110px;min-width:90px;'>${dateStr}</span>
                <span style='font-weight:600;color:#059669;width:180px;min-width:120px;'>${agent}</span>
                <span style='color:#374151;width:180px;min-width:120px;'>${client}</span>
                <span style='color:#2563eb;width:180px;min-width:120px;'>${lieu}</span>
                <span style='color:#a0aec0;font-size:1.1em;margin-left:auto;'><i class='fas fa-chevron-right'></i></span>
              </li>`;
              })
              .join("")}</ul>`;
          }
        }

        // Détail livraison au clic
        const recapDetail = document.getElementById("recapMoisLivraisonDetail");
        if (recapList && recapDetail) {
          const items = recapList.querySelectorAll(".recap-mois-liv-item");
          items.forEach((item) => {
            item.onclick = function () {
              const idx = parseInt(item.getAttribute("data-liv-index"), 10);
              const liv = livraisonsMois[idx];
              if (!liv) return;
              // Récupération dynamique des colonnes depuis le module partagé
              let columns = window.AGENT_TABLE_COLUMNS || [];
              // Si le module n'est pas encore chargé (cas rare), attendre et réessayer
              if (!columns.length) {
                setTimeout(() => item.onclick(), 100);
                return;
              }
              // Construction du tableau HTML
              let tableHtml = `<div style=\"font-size:1.35em;font-weight:800;color:#2563eb;margin-bottom:18px;text-align:center;letter-spacing:0.5px;display:flex;align-items:center;gap:10px;\"><i class='fas fa-info-circle'></i> Détail de la livraison</div>`;
              tableHtml += `<button id='closeRecapLivraisonDetail' title='Fermer' style='background:none;border:none;font-size:2em;color:#2563eb;cursor:pointer;transition:color 0.2s;line-height:1;margin-left:18px;position:absolute;top:10px;right:18px;'>&times;</button>`;
              tableHtml += `<div style='overflow-x:auto;'><table style='width:100%;border-collapse:separate;border-spacing:0 6px;font-size:1.08em;background:none;'>`;
              tableHtml += `<thead><tr style='background:#eaf1fb;'>`;
              columns.forEach((col) => {
                tableHtml += `<th style='padding:8px 12px;border-bottom:2px solid #2563eb22;font-size:1.08em;color:#2563eb;text-align:left;'>${col.label}</th>`;
              });
              tableHtml += `</tr></thead><tbody><tr>`;
              columns.forEach((col) => {
                // Recherche de la valeur dans le suivi général si absente dans la livraison du mois
                let val = liv[col.id];
                if (
                  (val === undefined || val === null || val === "") &&
                  window.livraisonsMois &&
                  liv.dossier_number
                ) {
                  // On cherche la valeur dans la livraison du suivi général ayant le même dossier et conteneur
                  const refLiv = window.livraisonsMois.find(
                    (ref) =>
                      ref.dossier_number === liv.dossier_number &&
                      (ref.container_number === liv.container_number ||
                        (Array.isArray(ref.container_number) &&
                          Array.isArray(liv.container_number) &&
                          ref.container_number.join() ===
                            liv.container_number.join()))
                  );
                  if (
                    refLiv &&
                    refLiv[col.id] !== undefined &&
                    refLiv[col.id] !== null &&
                    refLiv[col.id] !== ""
                  ) {
                    val = refLiv[col.id];
                  }
                }

                // Formatage spécial pour certains champs
                if (col.id && col.id.toLowerCase().includes("date") && val) {
                  try {
                    val = new Date(val).toLocaleDateString("fr-FR");
                  } catch (e) {}
                }
                if (col.id && col.id.toLowerCase().includes("heure") && val) {
                  try {
                    val = new Date("1970-01-01T" + val).toLocaleTimeString(
                      "fr-FR",
                      { hour: "2-digit", minute: "2-digit" }
                    );
                  } catch (e) {}
                }

                // Traduction métier pour Statut de livraison (Resp. Aconiés)
                if (col.id === "delivery_status_acconier") {
                  const trad = {
                    pending_acconier: "En attente (Aconiés)",
                    payment_done_acconier: "Paiement effectué (Aconiés)",
                    delivered_acconier: "Livré (Aconiés)",
                    in_progress_acconier: "En cours (Aconiés)",
                    rejected_acconier: "Rejeté (Aconiés)",
                    // Ajoute ici d'autres statuts techniques si besoin
                  };
                  let v = val;
                  if (typeof v === "string" && trad[v.trim()]) {
                    val = trad[v.trim()];
                  } else if (!v || v === "-") {
                    val = "-";
                  }
                }

                // Harmonisation du statut métier (colonne "statut") avec le tableau de suivi général
                if (col.id === "statut") {
                  // Affichage détaillé par conteneur si possible
                  let refLiv = null;
                  if (window.livraisonsMois && liv.dossier_number) {
                    refLiv = window.livraisonsMois.find(
                      (ref) =>
                        ref.dossier_number === liv.dossier_number &&
                        (ref.container_number === liv.container_number ||
                          (Array.isArray(ref.container_number) &&
                            Array.isArray(liv.container_number) &&
                            ref.container_number.join() ===
                              liv.container_number.join()))
                    );
                  }
                  // On récupère les conteneurs et statuts
                  let containers = [];
                  let statuses = null;
                  if (refLiv) {
                    if (Array.isArray(refLiv.container_number)) {
                      containers = refLiv.container_number;
                    } else if (typeof refLiv.container_number === "string") {
                      containers = refLiv.container_number
                        .split(/[,;\s]+/)
                        .filter(Boolean);
                    }
                    statuses = refLiv.container_statuses;
                  } else {
                    if (Array.isArray(liv.container_number)) {
                      containers = liv.container_number;
                    } else if (typeof liv.container_number === "string") {
                      containers = liv.container_number
                        .split(/[,;\s]+/)
                        .filter(Boolean);
                    }
                    statuses = liv.container_statuses;
                  }
                  // Traduction statut
                  function tradStatut(statut) {
                    let s = (statut || "").toString().trim().toLowerCase();
                    if (s.includes("livr") || s === "delivered") return "Livré";
                    if (s === "pending") return "En attente";
                    if (s === "in progress" || s === "in_progress")
                      return "En cours";
                    if (s === "rejected") return "Rejeté";
                    return statut || "-";
                  }
                  let htmlStatuts = "-";
                  if (statuses && containers.length) {
                    // Format objet {TC: statut}
                    if (
                      typeof statuses === "object" &&
                      !Array.isArray(statuses)
                    ) {
                      htmlStatuts = Object.entries(statuses)
                        .map(
                          ([tc, st]) =>
                            `<div><b>${tc}</b> : ${tradStatut(st)}</div>`
                        )
                        .join("");
                    } else if (
                      Array.isArray(statuses) &&
                      containers.length === statuses.length
                    ) {
                      htmlStatuts = containers
                        .map(
                          (tc, idx) =>
                            `<div><b>${tc}</b> : ${tradStatut(
                              statuses[idx]
                            )}</div>`
                        )
                        .join("");
                    }
                  } else if (val) {
                    htmlStatuts = `<span>${tradStatut(val)}</span>`;
                  }
                  tableHtml += `<td style='padding:8px 12px;'><span style='display:inline-block;background:#eaf1fb;color:#2563eb;border-radius:7px;padding:2px 10px;font-size:1em;font-weight:700;border:1.5px solid #2563eb33;'>${htmlStatuts}</span></td>`;
                  return;
                }

                if (Array.isArray(val)) val = val.join(", ");
                if (val === undefined || val === null || val === "") val = "-";
                tableHtml += `<td style='padding:8px 12px;'>${val}</td>`;
              });
              tableHtml += `</tr></tbody></table></div>`;
              recapDetail.innerHTML = tableHtml;
              recapDetail.style.display = "block";
              recapDetail.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              });
              recapDetail.style.background =
                "linear-gradient(135deg,#f7faff 60%,#e3e9f7 100%)";
              recapDetail.style.boxShadow =
                "0 8px 32px #2563eb22, 0 2px 8px #0001";
              recapDetail.style.borderRadius = "18px";
              recapDetail.style.marginTop = "18px";
              recapDetail.style.padding = "28px 22px";
              // Ajout du bouton de fermeture
              const closeBtn = document.getElementById(
                "closeRecapLivraisonDetail"
              );
              if (closeBtn) {
                closeBtn.onclick = function () {
                  recapDetail.style.display = "none";
                };
              }
            };
          });
        }
      }

      // Popup recap mois navigation
      const btnRecapMois = document.getElementById("btnRecapMois");
      const popupRecapMois = document.getElementById("popupRecapMois");
      const closeRecapMois = document.getElementById("closeRecapMois");
      if (btnRecapMois && popupRecapMois && closeRecapMois) {
        btnRecapMois.onclick = () => {
          popupRecapMois.style.display = "flex";
          renderRecapMoisPopup();
          // Navigation mois précédent et suivant
          const btnMoisPrecedent = document.getElementById("btnMoisPrecedent");
          const btnMoisSuivant = document.getElementById("btnMoisSuivant");
          if (btnMoisPrecedent) {
            btnMoisPrecedent.onclick = function () {
              moisAffiche--;
              if (moisAffiche < 0) {
                moisAffiche = 11;
                anneeAffiche--;
              }
              renderRecapMoisPopup();
            };
          }
          if (btnMoisSuivant) {
            btnMoisSuivant.onclick = function () {
              moisAffiche++;
              if (moisAffiche > 11) {
                moisAffiche = 0;
                anneeAffiche++;
              }
              renderRecapMoisPopup();
            };
          }
        };
        closeRecapMois.onclick = () => {
          popupRecapMois.style.display = "none";
        };
        popupRecapMois.addEventListener("click", (e) => {
          if (e.target === popupRecapMois)
            popupRecapMois.style.display = "none";
        });
      }
    })
    .catch(() => {
      const resumeHierDiv = document.getElementById("resumeHier");
      if (resumeHierDiv) {
        resumeHierDiv.innerHTML =
          '<div style="color:#dc3545;text-align:center;">Impossible de charger le résumé de la veille.</div>';
      }
    });
})();
