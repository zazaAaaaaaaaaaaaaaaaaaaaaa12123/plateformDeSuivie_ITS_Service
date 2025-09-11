// === SYSTÈME DE MODE SOMBRE SYNCHRONISÉ ===
(function initDarkModeSync() {
  // === FONCTION POUR APPLIQUER LES COULEURS CONDITIONNELLES EN MODE SOMBRE ===
  window.applyDarkModeConditionalColors = function () {
    // Vérifier si le mode sombre est activé
    const isDarkMode = document.body.classList.contains("dark-mode");
    console.log("🎨 [COLORS] Vérification mode sombre:", isDarkMode);
    console.log("🎨 [COLORS] Classes du body:", document.body.className);

    // Appliquer aux deux tableaux : principal et agent
    const tables = [
      document.getElementById("deliveriesTable"),
      document.getElementById("agentDailyDeliveriesTable"),
    ];

    tables.forEach((table) => {
      if (!table) return;
      console.log("🎨 [COLORS] Traitement du tableau:", table.id);

      const rows = table.querySelectorAll("tbody tr");
      console.log("🎨 [COLORS] Nombre de lignes trouvées:", rows.length);

      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll("td");

        cells.forEach((cell, index) => {
          const fieldName = cell.dataset.fieldName;
          const cellText = cell.textContent ? cell.textContent.trim() : "";

          if (isDarkMode) {
            // APPLIQUER les couleurs en mode sombre
            // Méthode 1: Utiliser les data-field-name si disponibles
            if (fieldName) {
              applyColorByFieldName(cell, fieldName);
            }
            // Méthode 2: Utiliser les positions des colonnes (pour les tableaux sans data-field-name)
            else {
              applyColorByColumnIndex(cell, index, table);
            }
          } else {
            // SUPPRIMER les couleurs en mode clair
            cell.style.color = "";
          }
        });
      });
    });
  };

  // Fonction pour appliquer les couleurs par nom de champ
  function applyColorByFieldName(cell, fieldName) {
    const cellText = cell.textContent ? cell.textContent.trim() : "";
    console.log(
      `🎨 [FIELD] Traitement champ: ${fieldName}, valeur: "${cellText}"`
    );

    switch (fieldName) {
      // N° Déclaration: Bleu vif
      case "declaration_number":
        if (
          cellText &&
          cellText !== "-" &&
          !cell.tagName.toLowerCase().includes("th")
        ) {
          cell.style.color = "#00bfff";
          console.log(
            `� [FIELD] Bleu vif appliqué à N° Déclaration: ${cellText}`
          );
        }
        break;

      // N° BL: Jaune vif (seulement les valeurs, pas l'en-tête)
      case "bl_number":
        if (
          cellText &&
          cellText !== "-" &&
          !cell.tagName.toLowerCase().includes("th")
        ) {
          cell.style.color = "#ffff00";
          console.log(`🟡 [FIELD] Jaune vif appliqué à N° BL: ${cellText}`);
        }
        break;

      // N° Dossier: Rouge vif
      case "dossier_number":
        if (
          cellText &&
          cellText !== "-" &&
          !cell.tagName.toLowerCase().includes("th")
        ) {
          cell.style.color = "#ff0000";
          console.log(`� [FIELD] Rouge vif appliqué à N° Dossier: ${cellText}`);
        }
        break;

      // Date DO, Date BADT, Date de paiement Acconage: Cyan brillant
      case "date_do":
      case "date_badt":
      case "paiement_acconage":
        if (
          cellText &&
          cellText !== "-" &&
          !cell.tagName.toLowerCase().includes("th")
        ) {
          cell.style.color = "#00ffff";
          cell.style.textShadow = "0 0 5px rgba(0, 255, 255, 0.5)";
          console.log(
            `💫 [FIELD] Cyan brillant appliqué à ${fieldName}: ${cellText}`
          );
        }
        break;

      // Colonnes numériques en cyan brillant
      case "position":
      case "total_containers":
      case "weight":
      case "reference_number":
        if (
          cellText &&
          cellText !== "-" &&
          !cell.tagName.toLowerCase().includes("th")
        ) {
          cell.style.color = "#00ffff";
          cell.style.textShadow = "0 0 5px rgba(0, 255, 255, 0.5)";
          console.log(
            `💫 [FIELD] Cyan brillant appliqué à ${fieldName}: ${cellText}`
          );
        }
        break;

      // Nom du Navire: Orange fluo
      case "ship_name":
        if (
          cellText &&
          cellText !== "-" &&
          !cell.tagName.toLowerCase().includes("th")
        ) {
          cell.style.color = "#ff8c00";
          console.log(
            `🟠 [FIELD] Orange fluo appliqué au nom du navire: ${cellText}`
          );
        }
        break;

      // Circuit: Couleurs selon la valeur
      case "circuit":
        applyCircuitColors(cell);
        break;
    }
  }

  // Fonction pour appliquer les couleurs par index de colonne
  function applyColorByColumnIndex(cell, index, table) {
    const text = cell.textContent ? cell.textContent.trim() : "";
    if (!text || text === "-") return;

    console.log(
      `🎨 [INDEX] Colonne ${index}, valeur: "${text}", tableau: ${
        table ? table.id : "inconnu"
      }`
    );

    // Pour le tableau principal (deliveriesTable)
    if (table && table.id === "deliveriesTable") {
      switch (index) {
        case 9: // N° Déclaration (position dans le tableau principal)
          cell.style.color = "#ff4444"; // Rouge
          console.log(
            `🔴 [INDEX] Rouge appliqué colonne 9 (N° Déclaration): ${text}`
          );
          break;
        case 10: // N° BL
          cell.style.color = "#ffeb3b"; // Jaune
          console.log(`🟡 [INDEX] Jaune appliqué colonne 10 (N° BL): ${text}`);
          break;
        case 11: // N° Dossier
          cell.style.color = "#ff6600"; // Orange fluo
          console.log(
            `🟠 [INDEX] Orange appliqué colonne 11 (N° Dossier): ${text}`
          );
          break;
        case 20: // Date Paiement Acconage
        case 21: // Date DO
        case 22: // Date BADT
          cell.style.color = "#ff4500"; // Orange red
          console.log(
            `🟧 [INDEX] Orange red appliqué colonne ${index}: ${text}`
          );
          break;
        case 16: // Circuit
          applyCircuitColors(cell);
          break;
      }
    }
    // Pour le tableau agent (agentDailyDeliveriesTable)
    else if (table && table.id === "agentDailyDeliveriesTable") {
      switch (index) {
        case 7: // N° Déclaration
          cell.style.color = "#ff4444"; // Rouge
          console.log(
            `🔴 [INDEX] Rouge appliqué colonne 7 (N° Déclaration): ${text}`
          );
          break;
        case 8: // N° BL
          cell.style.color = "#ffeb3b"; // Jaune
          console.log(`🟡 [INDEX] Jaune appliqué colonne 8 (N° BL): ${text}`);
          break;
        case 9: // N° Dossier
          cell.style.color = "#ff6600"; // Orange fluo
          console.log(
            `🟠 [INDEX] Orange appliqué colonne 9 (N° Dossier): ${text}`
          );
          break;
        case 14: // Circuit
          applyCircuitColors(cell);
          break;
      }
    }
  }

  // Fonction pour appliquer les couleurs du circuit
  function applyCircuitColors(cell) {
    const circuitValue = cell.textContent
      ? cell.textContent.trim().toUpperCase()
      : "";
    if (circuitValue && circuitValue !== "-") {
      switch (circuitValue) {
        case "VAD":
          cell.style.color = "#00FF00"; // Vert
          cell.style.textShadow = "0 0 5px rgba(0, 255, 0, 0.5)";
          break;
        case "VAQ":
          cell.style.color = "#000080"; // Bleu foncé
          cell.style.textShadow = "0 0 5px rgba(0, 0, 128, 0.5)";
          break;
        case "SCANNER":
          cell.style.color = "#800080"; // Violet
          cell.style.textShadow = "0 0 5px rgba(128, 0, 128, 0.5)";
          break;
        case "BAE":
          cell.style.color = "#808080"; // Gris
          cell.style.textShadow = "0 0 5px rgba(128, 128, 128, 0.5)";
          break;
      }
    }
  }

  // Fonction pour forcer le nettoyage complet des couleurs
  function forceCleanColors() {
    const elements = document.querySelectorAll("table td, table th");
    elements.forEach((el) => {
      el.style.removeProperty("color");
      el.style.removeProperty("text-shadow");
      el.style.removeProperty("background-color");
      el.style.removeProperty("border-color");
      if (el.tagName.toLowerCase() === "td") {
        el.style.color = "#000000";
      }
    });
  }

  // Gestionnaire des intervalles de nettoyage
  const cleaningManager = {
    interval: null,
    start: function () {
      if (this.interval) this.stop();
      this.interval = setInterval(() => {
        if (localStorage.getItem("darkMode") !== "enabled") {
          forceCleanColors();
        }
      }, 1000);
    },
    stop: function () {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
  };

  // Fonction pour appliquer le mode sombre ou clair avec persistance renforcée
  function applyDarkMode() {
    const savedMode = localStorage.getItem("darkMode");
    const isDarkMode = savedMode === "enabled";

    // Sauvegarder le timestamp de la dernière mise à jour
    localStorage.setItem("lastModeUpdate", Date.now().toString());

    // Appliquer la classe appropriée
    document.body.classList.toggle("dark-mode", isDarkMode);

    if (!isDarkMode) {
      // Mode clair : Forcer le nettoyage des couleurs
      forceCleanColors();
      localStorage.setItem("colorsEnabled", "false");

      // Démarrer le nettoyage périodique
      cleaningManager.start();
    } else {
      // Mode sombre : arrêter le nettoyage périodique
      cleaningManager.stop();

      // Activer les couleurs
      localStorage.setItem("colorsEnabled", "true");

      // En-têtes en blanc en mode sombre
      const headers = document.querySelectorAll("table th");
      headers.forEach((header) => {
        header.style.color = "#FFFFFF";
        header.style.backgroundColor = "#1f2937";
        header.style.borderColor = "#374151";
      });
    }

    // Synchroniser le modal d'agents si visible
    synchronizeAgentModalStyles();

    // Fonction pour appliquer les couleurs conditionnelles
    const applyColors = () => {
      // Vérifier à nouveau le mode actuel
      const currentMode = localStorage.getItem("darkMode");
      if (
        currentMode === "enabled" &&
        typeof window.applyDarkModeConditionalColors === "function"
      ) {
        window.applyDarkModeConditionalColors();
      }
    };

    // En mode sombre, appliquer les couleurs avec vérification
    if (isDarkMode) {
      setTimeout(applyColors, 100);
      setTimeout(applyColors, 1000);
    }
  }

  // Fonction pour synchroniser les styles du modal d'agents
  function synchronizeAgentModalStyles() {
    const employeePopup = document.getElementById("employeePopup");
    if (employeePopup && employeePopup.classList.contains("is-visible")) {
      // Relancer les styles du modal si il est ouvert
      const event = new CustomEvent("darkModeChanged");
      window.dispatchEvent(event);
    }
  }

  // Système de surveillance global pour la cohérence du mode
  const modeWatcher = {
    checkInterval: null,
    start: function () {
      if (this.checkInterval) this.stop();
      this.checkInterval = setInterval(() => {
        const savedMode = localStorage.getItem("darkMode");
        const lastUpdate = parseInt(
          localStorage.getItem("lastModeUpdate") || "0"
        );
        const timeSinceUpdate = Date.now() - lastUpdate;

        // Réappliquer le mode si nécessaire
        if (timeSinceUpdate > 5000) {
          console.log("🔄 Vérification de cohérence du mode...");
          applyDarkMode();
        }
      }, 5000);
    },
    stop: function () {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    },
  };

  // Initialisation au chargement de la page
  function initializeThemeSystem() {
    applyDarkMode();
    modeWatcher.start();
  }

  // Démarrer la surveillance au chargement
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeThemeSystem);
  } else {
    initializeThemeSystem();
  }

  // Écouter les changements de mode sombre depuis d'autres pages
  window.addEventListener("storage", function (event) {
    if (event.key === "darkMode") {
      applyDarkMode();
      // Appliquer ou supprimer les couleurs conditionnelles selon le nouveau mode
      setTimeout(() => {
        if (typeof window.applyDarkModeConditionalColors === "function") {
          window.applyDarkModeConditionalColors();
        }
      }, 100);

      // Appliquer aussi après un délai plus long pour s'assurer que les tableaux sont rendus
      setTimeout(() => {
        if (typeof window.applyDarkModeConditionalColors === "function") {
          window.applyDarkModeConditionalColors();
        }
      }, 1000);
    }
  });

  // Si la page est déjà chargée, appliquer immédiatement
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyDarkMode);
  } else {
    applyDarkMode();
  }

  // APPEL FORCÉ POUR TEST - RÉESSAYER PLUSIEURS FOIS
  setTimeout(() => {
    console.log("🎨 [TEST] Premier appel forcé après 2s");
    if (typeof window.applyDarkModeConditionalColors === "function") {
      window.applyDarkModeConditionalColors();
    }
  }, 2000);

  setTimeout(() => {
    console.log("🎨 [TEST] Deuxième appel forcé après 5s");
    if (typeof window.applyDarkModeConditionalColors === "function") {
      window.applyDarkModeConditionalColors();
    }
  }, 5000);

  setTimeout(() => {
    console.log("🎨 [TEST] Troisième appel forcé après 10s");
    if (typeof window.applyDarkModeConditionalColors === "function") {
      window.applyDarkModeConditionalColors();
    }
  }, 10000);

  // Surveiller les changements de DOM pour appliquer les couleurs automatiquement
  const observer = new MutationObserver((mutations) => {
    let shouldApplyColors = false;
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        // Vérifier s'il y a eu des ajouts de lignes de tableau
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            (node.tagName === "TR" ||
              (node.querySelector && node.querySelector("tr")))
          ) {
            shouldApplyColors = true;
          }
        });
      }
    });

    if (shouldApplyColors) {
      setTimeout(() => {
        // Toujours appeler la fonction qui va vérifier le mode et appliquer/supprimer les couleurs
        if (typeof window.applyDarkModeConditionalColors === "function") {
          window.applyDarkModeConditionalColors();
        }
      }, 50);
    }
  });

  // Observer les tableaux pour les changements
  setTimeout(() => {
    const tables = document.querySelectorAll(
      "table, #deliveriesTable, #agentDailyDeliveriesTable"
    );
    tables.forEach((table) => {
      if (table) {
        observer.observe(table, { childList: true, subtree: true });
      }
    });
  }, 500);
})();

// === Génération dynamique du tableau principal des dossiers en retard ===
// === INJECTION DU STYLE RESPONSIVE POUR LES BOUTONS DU TABLEAU DE SUIVI ===

// === SYSTÈME DE SYNCHRONISATION DEPUIS RESP_LIV ===
(function initRespLivSynchronization() {
  // Fonction pour appliquer les données synchronisées depuis RespLiv
  function applySyncDataFromRespLiv() {
    // Parcourt tous les éléments de synchronisation dans localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sync_")) {
        try {
          const syncData = JSON.parse(localStorage.getItem(key));
          const { deliveryId, fieldId, value, timestamp } = syncData;

          // Trouve la ligne correspondante dans le tableau principal
          const table = document.getElementById("deliveriesTable");
          if (!table) continue;

          const rows = table.querySelectorAll("tbody tr[data-delivery-id]");
          rows.forEach((row) => {
            const rowDeliveryId = row.getAttribute("data-delivery-id");
            if (String(rowDeliveryId) === String(deliveryId)) {
              // Trouve la cellule correspondante
              const cell = row.querySelector(
                `td[data-field-name="${fieldId}"]`
              );
              if (cell) {
                // Met à jour la valeur affichée
                updateCellDisplayValue(cell, value, fieldId);
              }
            }
          });
        } catch (e) {
          console.error("Erreur lors de la synchronisation:", e);
        }
      }
    }
  }

  // Fonction pour mettre à jour l'affichage d'une cellule
  function updateCellDisplayValue(cell, value, fieldId) {
    if (!value || value === "-") {
      cell.textContent = "-";
      return;
    }

    // Traitement spécial pour les dates
    if (fieldId === "delivery_date") {
      if (value) {
        try {
          const dateObj = new Date(value);
          if (!isNaN(dateObj.getTime())) {
            cell.textContent = dateObj.toLocaleDateString("fr-FR");
          } else {
            cell.textContent = value;
          }
        } catch (e) {
          cell.textContent = value;
        }
      } else {
        cell.textContent = "-";
      }
    } else {
      // Pour les autres champs texte
      cell.textContent = value;
    }

    // Marquer la cellule comme synchronisée
    cell.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
    cell.style.borderLeft = "3px solid #22c55e";
    cell.title = `Synchronisé depuis Resp. Livraison - ${value}`;
  }

  // Écouter les événements de synchronisation en temps réel
  window.addEventListener("respLivDataUpdate", function (event) {
    const { deliveryId, fieldId, value } = event.detail;

    // Met à jour immédiatement le tableau si il est affiché
    const table = document.getElementById("deliveriesTable");
    if (table) {
      const rows = table.querySelectorAll("tbody tr[data-delivery-id]");
      rows.forEach((row) => {
        const rowDeliveryId = row.getAttribute("data-delivery-id");
        if (String(rowDeliveryId) === String(deliveryId)) {
          const cell = row.querySelector(`td[data-field-name="${fieldId}"]`);
          if (cell) {
            updateCellDisplayValue(cell, value, fieldId);
          }
        }
      });
    }
  });

  // Écouter les changements dans localStorage d'autres onglets
  window.addEventListener("storage", function (event) {
    if (event.key && event.key.startsWith("sync_") && event.newValue) {
      try {
        const syncData = JSON.parse(event.newValue);
        // Déclencher la mise à jour
        window.dispatchEvent(
          new CustomEvent("respLivDataUpdate", {
            detail: syncData,
          })
        );
      } catch (e) {
        console.error("Erreur parsing sync data:", e);
      }
    }
  });

  // Appliquer les données existantes au chargement de la page
  document.addEventListener("DOMContentLoaded", function () {
    // Délai pour s'assurer que le tableau est rendu
    setTimeout(applySyncDataFromRespLiv, 1000);
  });

  // Également appliquer après chaque rendu du tableau
  window.addEventListener("deliveriesTableRendered", applySyncDataFromRespLiv);

  // === FONCTION DE TEST POUR LA SYNCHRONISATION ===
  window.testSyncReception = function () {
    console.log(
      "=== TEST RÉCEPTION SYNCHRONISATION DEPUIS RESPLIVDELIVERY ==="
    );

    // Vérifier les données dans localStorage
    const syncKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith("sync_")
    );
    console.log("Clés de synchronisation trouvées:", syncKeys);

    syncKeys.forEach((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`${key}:`, data);
      } catch (e) {
        console.error("Erreur parsing:", key, e);
      }
    });

    // Appliquer manuellement la synchronisation locale
    applySyncDataFromRespLiv();

    // Tester la récupération depuis le backend
    loadSyncDataFromBackend().then(() => {
      console.log("Données synchronisées rechargées depuis le backend.");
    });

    console.log(
      "Test réception terminé. Vérifiez le tableau pour les données synchronisées."
    );
  };

  // === FONCTION : Récupération des données synchronisées depuis le backend ===
  async function loadSyncDataFromBackend() {
    if (!window.deliveries || !Array.isArray(window.deliveries)) return;

    try {
      const syncPromises = window.deliveries.map(async (delivery) => {
        try {
          const response = await fetch(
            `/api/sync-resplivraison/${delivery.id}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.syncData) {
              // Mettre à jour les données de la livraison avec les données synchronisées
              Object.keys(data.syncData).forEach((fieldName) => {
                if (
                  data.syncData[fieldName] !== null &&
                  data.syncData[fieldName] !== undefined
                ) {
                  delivery[fieldName] = data.syncData[fieldName];
                }
              });
              return { deliveryId: delivery.id, syncData: data.syncData };
            }
          }
        } catch (error) {
          console.warn(
            `Erreur récupération sync pour livraison ${delivery.id}:`,
            error
          );
        }
        return null;
      });

      const results = await Promise.all(syncPromises);
      const syncedDeliveries = results.filter((r) => r !== null);

      if (syncedDeliveries.length > 0) {
        console.log(
          `[SYNC BACKEND] ${syncedDeliveries.length} livraisons synchronisées depuis le backend`
        );

        // Régénérer le tableau pour afficher les données synchronisées
        if (typeof renderAdminDeliveriesTable === "function") {
          renderAdminDeliveriesTable(window.deliveries);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données synchronisées:",
        error
      );
    }
  }

  // Charger les données synchronisées après le chargement initial des livraisons
  const originalLoadDeliveries = window.loadDeliveries;
  if (typeof originalLoadDeliveries === "function") {
    window.loadDeliveries = async function (...args) {
      const result = await originalLoadDeliveries.apply(this, args);
      // Charger les données synchronisées après le chargement des livraisons
      await loadSyncDataFromBackend();
      return result;
    };
  }
})();
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
  html += `<thead><tr style='background:#fbeaea;'><th style='padding:6px 10px;'>TC</th><th style='padding:6px 10px;'>Agent</th><th style='padding:6px 10px;'>Date enregistrement</th><th style='padding:6px 10px;'>Date livraison</th></tr></thead><tbody>`;
  lateList.forEach((c) => {
    let agent = c.agentName ? c.agentName : "-";
    let dateLiv = c.deliveryDate || "-";
    if (dateLiv && typeof dateLiv === "object" && dateLiv instanceof Date) {
      dateLiv = dateLiv.toLocaleDateString("fr-FR");
    }
    html += `<tr><td style='padding:6px 10px;'>${
      c.numeroTC
    }</td><td style='padding:6px 10px;'>${agent}</td><td style='padding:6px 10px;'>${
      c.dateEnr || "-"
    }</td><td style='padding:6px 10px;'>${dateLiv}</td></tr>`;
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
                  <th style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Notifier</th>
                  <th style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Détail</th>
                </tr>
              </thead>
              <tbody id="lateListTableBody">
                ${lateContainers
                  .map((c, idx) => {
                    let agent = c.agentName ? c.agentName : "-";
                    let dateLiv = c.deliveryDate || "-";
                    if (
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
window.wsLivraison = null;
function initWebSocketLivraison() {
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  let wsUrl = `${wsProtocol}://${window.WS_BASE_HOST}`;
  try {
    window.wsLivraison = new WebSocket(wsUrl);
    window.wsLivraison.onopen = function () {
      console.debug("[WebSocket] Connecté pour livraisons (scriptSuivie)");
    };
    window.wsLivraison.onmessage = function (event) {
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
        } else if (data.type === "observation_update") {
          // Mise à jour de l'observation dans le tableau principal
          const { deliveryId, observation } = data;
          const row = document.getElementById(`delivery-row-${deliveryId}`);
          if (row) {
            // La colonne des observations est la 20ème (index 19)
            const cell = row.cells[19];
            if (cell) {
              cell.innerHTML = observation.replace(/\n/g, "<br>");
            }
          }
        } else if (data.type === "resplivraison_sync_update") {
          // === NOUVELLE GESTION : Synchronisation depuis RespLivraison ===
          const { deliveryId, fieldId, dbFieldName, value, timestamp } = data;
          console.log(`[SYNC] Données reçues depuis RespLiv:`, data);

          // Mise à jour du tableau principal
          const row = document.getElementById(`delivery-row-${deliveryId}`);
          if (row) {
            // Trouver la cellule correspondante par le fieldName
            const cell = row.querySelector(
              `td[data-field-name="${dbFieldName}"]`
            );
            if (cell) {
              // Mise à jour de la valeur affichée
              if (dbFieldName === "delivery_date" && value) {
                const dateObj = new Date(value);
                if (!isNaN(dateObj.getTime())) {
                  cell.textContent = dateObj.toLocaleDateString("fr-FR");
                } else {
                  cell.textContent = value;
                }
              } else {
                cell.textContent = value || "-";
              }

              // Style visuel pour indiquer la synchronisation
              cell.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
              cell.style.borderLeft = "3px solid #22c55e";
              cell.style.fontWeight = "bold";
              cell.title = `Synchronisé depuis Resp. Livraison: ${value}`;

              // Animation de flash pour attirer l'attention
              cell.style.transition = "background-color 0.3s ease";
              const originalBg = cell.style.backgroundColor;
              cell.style.backgroundColor = "rgba(34, 197, 94, 0.3)";
              setTimeout(() => {
                cell.style.backgroundColor = originalBg;
              }, 1000);
            }
          }

          // Mettre à jour les données en mémoire si elles existent
          if (window.deliveries && Array.isArray(window.deliveries)) {
            const delivery = window.deliveries.find(
              (d) => String(d.id) === String(deliveryId)
            );
            if (delivery) {
              delivery[dbFieldName] = value;
            }
          }

          // Afficher une notification discrète
          showCustomAlert(
            `Données synchronisées: ${dbFieldName} = ${value}`,
            "info",
            2000
          );
        } else if (data.type === "resplivraison_batch_sync") {
          // === GESTION DES MISES À JOUR EN LOT ===
          console.log(`[SYNC BATCH] Données reçues:`, data);

          // Recharger entièrement les données pour éviter les incohérences
          if (typeof loadDeliveries === "function") {
            loadDeliveries().then(() => {
              showCustomAlert(
                `${data.updates.length} champs synchronisés depuis RespLivraison`,
                "success",
                3000
              );
            });
          }
        }
      } catch (e) {
        console.warn("[WebSocket] Message non JSON ou erreur :", event.data);
      }
    };
    window.wsLivraison.onclose = function () {
      console.warn("[WebSocket] Livraison déconnecté. Reconnexion dans 10s...");
      setTimeout(initWebSocketLivraison, 10000);
    };
    window.wsLivraison.onerror = function () {
      window.wsLivraison.close();
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

// Fonction globale pour mapper les statuts
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
    // Production : dossiv.ci
    wsUrl = `${wsProtocol}://dossiv.ci`;
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

  /**
   * Gère la mise à jour en temps réel des statuts de conteneurs depuis scriptRespLiv.js
   * SYNCHRONISATION UNIDIRECTIONNELLE : resp_liv.html → tableauDeBord.html
   * @param {Object} data - Données de mise à jour du statut: {deliveryId, containerNumber, status, timestamp}
   */
  function handleContainerStatusUpdate(data) {
    try {
      console.log(
        "[SYNC] Mise à jour statut conteneur reçue depuis resp_liv:",
        data
      );

      if (!data.deliveryId || !data.containerNumber || !data.status) {
        console.warn(
          "[SYNC] Données incomplètes pour la mise à jour du statut"
        );
        return;
      }

      // 1. Mettre à jour les données locales dans tous les tableaux correspondants
      const deliveryIndex = deliveries.findIndex(
        (d) => d.id === data.deliveryId
      );
      if (deliveryIndex !== -1) {
        if (!deliveries[deliveryIndex].container_statuses) {
          deliveries[deliveryIndex].container_statuses = {};
        }

        // Convertir le statut pour la cohérence
        const normalizedStatus =
          data.status === "livre" ? "livré" : data.status;
        deliveries[deliveryIndex].container_statuses[data.containerNumber] =
          normalizedStatus;

        console.log(
          `[SYNC] Statut mis à jour localement: ${data.containerNumber} = ${normalizedStatus}`
        );
      }

      // Mettre à jour aussi dans allDeliveries pour les vues historiques
      const allDeliveryIndex = allDeliveries.findIndex(
        (d) => d.id === data.deliveryId
      );
      if (allDeliveryIndex !== -1) {
        if (!allDeliveries[allDeliveryIndex].container_statuses) {
          allDeliveries[allDeliveryIndex].container_statuses = {};
        }
        const normalizedStatus =
          data.status === "livre" ? "livré" : data.status;
        allDeliveries[allDeliveryIndex].container_statuses[
          data.containerNumber
        ] = normalizedStatus;
      }

      // 2. Mettre à jour l'affichage du tableau principal sans le re-rendre complètement
      updateContainerStatusDisplay(
        data.deliveryId,
        data.containerNumber,
        data.status
      );

      // 3. Afficher une notification discrète
      const statusText = data.status === "livre" ? "Livré" : data.status;
      showCustomAlert(
        `Statut conteneur ${data.containerNumber} mis à jour: ${statusText}`,
        "success",
        2500
      );

      // 4. Mettre à jour les alertes de retard si nécessaire
      if (typeof checkLateContainers === "function") {
        checkLateContainers();
      }

      // 5. Forcer la mise à jour de l'affichage des filtres si nécessaire
      // (utile si la modification change le statut global d'une livraison)
      setTimeout(() => {
        const event = new Event("bl_status_update");
        document.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error(
        "[SYNC] Erreur lors de la mise à jour du statut conteneur:",
        error
      );
    }
  }

  /**
   * Gère la mise à jour en temps réel des dates d'échange BL depuis le formulaire employé
   * SYNCHRONISATION UNIDIRECTIONNELLE : formulaire employé → tableauDeBord.html
   * @param {Object} data - Données de mise à jour: {deliveryId, dateEchangeBl, timestamp}
   */
  function handleDateEchangeBlUpdate(data) {
    try {
      console.log(
        "[SYNC] Mise à jour date échange BL reçue depuis formulaire employé:",
        data
      );

      if (!data.deliveryId) {
        console.warn(
          "[SYNC] Données incomplètes pour la mise à jour de la date d'échange BL"
        );
        return;
      }

      // 1. Mettre à jour les données locales dans tous les tableaux correspondants
      const deliveryIndex = deliveries.findIndex(
        (d) => d.id === data.deliveryId
      );
      if (deliveryIndex !== -1) {
        deliveries[deliveryIndex].date_echange_bl = data.dateEchangeBl
          ? new Date(data.dateEchangeBl)
          : null;
        console.log(
          `[SYNC] Date échange BL mise à jour localement: ${data.deliveryId} = ${data.dateEchangeBl}`
        );
      }

      // Mettre à jour aussi dans allDeliveries pour les vues historiques
      const allDeliveryIndex = allDeliveries.findIndex(
        (d) => d.id === data.deliveryId
      );
      if (allDeliveryIndex !== -1) {
        allDeliveries[allDeliveryIndex].date_echange_bl = data.dateEchangeBl
          ? new Date(data.dateEchangeBl)
          : null;
      }

      // 2. Mettre à jour l'affichage spécifique de la cellule date_echange_bl dans le tableau
      updateDateEchangeBlDisplay(data.deliveryId, data.dateEchangeBl);

      // 3. Afficher une notification discrète
      showCustomAlert(
        `Date d'échange BL mise à jour pour le dossier ${data.deliveryId}`,
        "success",
        2500
      );

      // 4. Forcer la mise à jour des filtres si nécessaire
      setTimeout(() => {
        const event = new Event("bl_status_update");
        document.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error(
        "[SYNC] Erreur lors de la mise à jour de la date d'échange BL:",
        error
      );
    }
  }

  /**
   * Force la synchronisation d'une livraison pour reconstruire les données tronquées
   * @param {Object} delivery - Objet livraison
   * @returns {Object|null} - Données synchronisées ou null si aucune reconstruction nécessaire
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
          `[SYNC SUIVIE] 🔧 Reconstruction pour ${delivery.id}: base="${basePart}", +${additionalCount} autres`
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
          `[SYNC SUIVIE] ✅ Reconstruction réussie: ${tcNumbers.length} TC générés`
        );

        return {
          container_numbers_list: tcNumbers,
          container_foot_types_map: delivery.container_foot_types_map,
        };
      }
    } catch (error) {
      console.error(
        "[SYNC SUIVIE] ❌ Erreur lors de la reconstruction:",
        error
      );
    }
    return null;
  }

  /**
   * Met à jour l'affichage des statuts de conteneurs dans le tableau principal
   * Cette fonction s'assure que les changements depuis resp_liv.html sont visibles immédiatement
   * @param {string} deliveryId - ID de la livraison
   * @param {string} containerNumber - Numéro du conteneur
   * @param {string} status - Nouveau statut
   */
  function updateContainerStatusDisplay(deliveryId, containerNumber, status) {
    try {
      console.log(
        `[SYNC] Mise à jour affichage pour delivery ${deliveryId}, container ${containerNumber}, status ${status}`
      );

      // Trouve toutes les lignes concernées par cette livraison dans le tableau principal
      const tableBody = document.getElementById("deliveriesTableBody");
      if (tableBody) {
        const rows = tableBody.querySelectorAll("tr[data-delivery-id]");
        rows.forEach((row) => {
          const rowDeliveryId = row.getAttribute("data-delivery-id");
          if (rowDeliveryId === deliveryId) {
            // Trouve la cellule de statut dans cette ligne
            const statusCell = row.querySelector(
              'td[data-field-name="status"]'
            );
            if (statusCell) {
              // Re-calculer et mettre à jour l'affichage du statut
              updateSingleRowStatusCell(row, deliveryId);
              console.log(
                `[SYNC] Cellule statut mise à jour pour delivery ${deliveryId}`
              );
            }
          }
        });
      }

      // Mettre à jour aussi dans la vue agent si elle est ouverte
      const agentTableBody = document.getElementById(
        "agentDailyDeliveriesTableBody"
      );
      if (agentTableBody) {
        const agentRows = agentTableBody.querySelectorAll("tr");
        agentRows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          // Vérifie si cette ligne correspond à la livraison modifiée
          if (cells.length > 0) {
            // Recherche la cellule qui contient l'ID de la livraison pour vérification
            const hasMatchingDelivery = Array.from(cells).some(
              (cell) =>
                cell.textContent && cell.textContent.includes(deliveryId)
            );
            if (hasMatchingDelivery) {
              updateSingleRowStatusCell(row, deliveryId);
              console.log(
                `[SYNC] Vue agent mise à jour pour delivery ${deliveryId}`
              );
            }
          }
        });
      }

      // Mettre à jour les vues historiques si elles sont ouvertes
      const historyCards = document.querySelectorAll(".delivery-card");
      historyCards.forEach((card) => {
        const cardDeliveryId = card.getAttribute("data-delivery-id");
        if (cardDeliveryId === deliveryId) {
          // Déclencher un événement pour forcer la mise à jour de la carte
          const updateEvent = new CustomEvent("updateDeliveryCard", {
            detail: { deliveryId, containerNumber, status },
          });
          card.dispatchEvent(updateEvent);
        }
      });
    } catch (error) {
      console.error(
        "[SYNC] Erreur lors de la mise à jour de l'affichage:",
        error
      );
    }
  }

  /**
   * Met à jour l'affichage de la date d'échange BL pour une livraison spécifique
   * @param {string} deliveryId - ID de la livraison
   * @param {string|null} dateEchangeBl - Nouvelle date d'échange BL (format ISO ou null)
   */
  function updateDateEchangeBlDisplay(deliveryId, dateEchangeBl) {
    try {
      console.log(
        `[SYNC] Mise à jour affichage date échange BL pour delivery ${deliveryId}, date ${dateEchangeBl}`
      );

      // Trouve toutes les lignes concernées par cette livraison dans le tableau principal
      const tableBody = document.getElementById("deliveriesTableBody");
      if (tableBody) {
        const rows = tableBody.querySelectorAll("tr[data-delivery-id]");
        rows.forEach((row) => {
          const rowDeliveryId = row.getAttribute("data-delivery-id");
          if (rowDeliveryId === deliveryId) {
            // Trouve la cellule date_echange_bl dans cette ligne
            const dateCell = row.querySelector(
              'td[data-field-name="date_echange_bl"]'
            );
            if (dateCell) {
              // Mettre à jour le contenu de la cellule
              if (dateEchangeBl) {
                const formattedDate = new Date(
                  dateEchangeBl
                ).toLocaleDateString("fr-FR");
                dateCell.innerHTML = `<span style="color: #059669; font-weight: 500;">${formattedDate}</span>`;
              } else {
                dateCell.innerHTML = '<span style="color: #6b7280;">-</span>';
              }
              console.log(
                `[SYNC] Cellule date échange BL mise à jour pour delivery ${deliveryId}`
              );
            }
          }
        });
      }

      // Mettre à jour aussi dans la vue agent si elle est ouverte
      const agentTableBody = document.getElementById(
        "agentDailyDeliveriesTableBody"
      );
      if (agentTableBody) {
        const agentRows = agentTableBody.querySelectorAll("tr");
        agentRows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          // Vérifie si cette ligne correspond à la livraison modifiée
          if (cells.length > 0) {
            // Recherche la cellule qui contient l'ID de la livraison pour vérification
            const hasMatchingDelivery = Array.from(cells).some(
              (cell) =>
                cell.textContent && cell.textContent.includes(deliveryId)
            );
            if (hasMatchingDelivery) {
              // Trouve la cellule date_echange_bl dans la vue agent
              const dateCell = row.querySelector(
                'td[data-field-name="date_echange_bl"]'
              );
              if (dateCell) {
                if (dateEchangeBl) {
                  const formattedDate = new Date(
                    dateEchangeBl
                  ).toLocaleDateString("fr-FR");
                  dateCell.innerHTML = `<span style="color: #059669; font-weight: 500;">${formattedDate}</span>`;
                } else {
                  dateCell.innerHTML = '<span style="color: #6b7280;">-</span>';
                }
              }
              console.log(
                `[SYNC] Vue agent date échange BL mise à jour pour delivery ${deliveryId}`
              );
            }
          }
        });
      }

      // Mettre à jour les vues historiques si elles sont ouvertes
      const historyCards = document.querySelectorAll(".delivery-card");
      historyCards.forEach((card) => {
        const cardDeliveryId = card.getAttribute("data-delivery-id");
        if (cardDeliveryId === deliveryId) {
          // Déclencher un événement pour forcer la mise à jour de la carte
          const updateEvent = new CustomEvent("updateDeliveryCard", {
            detail: { deliveryId, dateEchangeBl },
          });
          card.dispatchEvent(updateEvent);
        }
      });
    } catch (error) {
      console.error(
        "[SYNC] Erreur lors de la mise à jour de l'affichage date échange BL:",
        error
      );
    }
  }

  /**
   * Met à jour la cellule de statut d'une ligne spécifique
   * Recalcule le statut basé sur tous les conteneurs du même dossier
   * @param {HTMLElement} row - Ligne du tableau
   * @param {string} deliveryId - ID de la livraison
   */
  async function updateSingleRowStatusCell(row, deliveryId) {
    try {
      const delivery = deliveries.find((d) => d.id === deliveryId);
      if (!delivery) {
        console.warn(
          `[SYNC] Livraison ${deliveryId} non trouvée dans les données locales`
        );
        return;
      }

      const statusCell = row.querySelector('td[data-field-name="status"]');
      if (!statusCell) {
        console.warn(
          `[SYNC] Cellule de statut non trouvée pour delivery ${deliveryId}`
        );
        return;
      }

      // Re-calculer le statut selon la logique simplifiée
      const dossierNumber = delivery.dossier_number;

      // Mettre à jour le contenu de la cellule
      const box = statusCell.querySelector("div");
      if (box) {
        // Calculer le statut réel basé sur les conteneurs
        let statusText = "-";
        let statusColor = "#374151";
        let statusBg = "#f8fafc";

        // Vérifier si la livraison a des conteneurs et leurs statuts
        if (
          delivery.container_statuses &&
          typeof delivery.container_statuses === "object"
        ) {
          let tcList = [];

          // Prioriser container_numbers_list sur container_number
          if (
            delivery.container_numbers_list &&
            Array.isArray(delivery.container_numbers_list) &&
            delivery.container_numbers_list.length > 0
          ) {
            tcList = delivery.container_numbers_list.filter(Boolean);
          } else if (delivery.container_number) {
            // Gestion des données tronquées - tentative de synchronisation
            const syncData = await forceSyncDelivery(delivery);
            if (syncData && syncData.container_numbers_list) {
              tcList = syncData.container_numbers_list;
            } else if (delivery.container_number.includes("+")) {
              console.warn(
                `[SUIVIE SYNC] ⚠️ Données tronquées détectées pour ${delivery.id}: ${delivery.container_number}`
              );
              tcList = [delivery.container_number.split("+")[0].trim()];
            } else if (Array.isArray(delivery.container_number)) {
              tcList = delivery.container_number.filter(Boolean);
            } else if (typeof delivery.container_number === "string") {
              tcList = delivery.container_number
                .split(/[,;\s]+/)
                .filter(Boolean);
            }
          }

          if (tcList.length > 0) {
            // Compter les conteneurs livrés
            const deliveredContainers = tcList.filter((tc) => {
              const status = delivery.container_statuses[tc];
              return status === "livre" || status === "livré";
            });

            if (deliveredContainers.length === tcList.length) {
              // Tous les conteneurs sont livrés
              statusText =
                '<i class="fas fa-check-circle" style="margin-right: 6px;"></i>Livré';
              statusColor = "#fff";
              statusBg = "#22c55e";
            } else if (deliveredContainers.length > 0) {
              // Partiellement livré
              statusText = `<i class="fas fa-clock" style="margin-right: 6px;"></i>${deliveredContainers.length}/${tcList.length} Livré`;
              statusColor = "#fff";
              statusBg = "#f59e0b";
            } else {
              // Aucun conteneur livré
              statusText =
                '<i class="fas fa-hourglass-half" style="margin-right: 6px;"></i>En attente';
              statusColor = "#374151";
              statusBg = "#f3f4f6";
            }
          }
        }

        box.style.background = statusBg;
        box.style.color = statusColor;
        box.style.padding = "4px 8px";
        box.style.borderRadius = "4px";
        box.style.fontWeight = "500";
        box.style.fontSize = "0.9em";
        box.innerHTML = statusText;

        // Ajouter les événements de survol pour le tooltip
        box.style.cursor = "pointer";
        box.addEventListener("mouseenter", async (e) => {
          await createContainerStatusTooltip(delivery, box);
        });
        box.addEventListener("mouseleave", () => {
          removeContainerStatusTooltip();
        });

        console.log(
          `[SYNC] Cellule mise à jour: statut "${statusText}" pour dossier ${dossierNumber}`
        );
      } else {
        console.warn(
          `[SYNC] Élément div de statut non trouvé dans la cellule pour delivery ${deliveryId}`
        );
      }
    } catch (error) {
      console.error(
        "[SYNC] Erreur lors de la mise à jour de la cellule:",
        error
      );
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
            "date_echange_bl_update",
          ];
          if (data && data.type && typesToRefresh.includes(data.type)) {
            // === TRAITEMENT SPÉCIFIQUE POUR LES STATUTS DE CONTENEURS ===
            if (data.type === "container_status_update") {
              handleContainerStatusUpdate(data);
              return; // Ne pas recharger toutes les données pour un simple statut
            }

            // === TRAITEMENT SPÉCIFIQUE POUR LES DATES D'ÉCHANGE BL ===
            if (data.type === "date_echange_bl_update") {
              handleDateEchangeBlUpdate(data);
              return; // Ne pas recharger toutes les données pour une simple date
            }

            loadDeliveries().then(() => {
              if (typeof checkLateContainers === "function")
                checkLateContainers();
              // Ajout : si le statut est passé à "Mise en livraison", affiche l'alerte instantanée
              if (
                data.type === "delivery_update_alert" &&
                (data.status === "mise_en_livraison_acconier" ||
                  data.status === "Mise en livraison") &&
                data.deliveryId
              ) {
                showCustomAlert(
                  `Le dossier [${data.deliveryId}] a été mis en livraison.`,
                  "success",
                  3500
                );
              }
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

    /* Styles pour la combinaison image + date */
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
         // Correction : déclenchement d'un événement custom pour forcer la mise à jour de la colonne Statut Dossier
         document.dispatchEvent(new Event("bl_status_update"));

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


    /* Ajustement léger des largeurs pour Responsable Acconier (colonnes 19 à 23) */
    .table thead th:nth-child(19),
    .table tbody td:nth-child(19),
    .table thead th:nth-child(20),
    .table tbody td:nth-child(20),
    .table thead th:nth-child(21),
    .table tbody td:nth-child(21),
    .table thead th:nth-child(22),
    .table tbody td:nth-child(22),
    .table thead th:nth-child(23),
    .table tbody td:nth-child(23) {
        min-width: 140px;
        width: 170px;
        max-width: 200px;
        white-space: normal;
        word-break: break-word;
    }

    /* Styles pour stabiliser d'autres colonnes importantes si nécessaire (ajuster les nombres d'enfants si l'ordre change) */
    .table thead th:nth-child(2), /* Date */
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

    .table thead th:nth-child(29), /* Statut (maintenant 29ème) */
    .table tbody td:nth-child(29) {
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
      text: "En attente de paiement",
      icon: "fa-clock",
      tailwindColorClass: "text-gray-500",
      hexColor: "#6b7280",
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
      value: "pending_acconier",
      text: "En attente de paiement",
      icon: "fa-clock",
      tailwindColorClass: "text-gray-500",
      hexColor: "#6b7280",
    },
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
    // Aucune option disponible - filtre de statut désactivé
  ];

  // Define fields that are always inline editable, regardless of global editing mode
  // Removed "status" from here as it's handled by its own dropdown logic
  const ALWAYS_INLINE_EDITABLE_FIELDS = ["truck_registration"];

  // Champs qui ne doivent jamais être éditables (même en mode édition)
  const NON_EDITABLE_FIELDS = [
    "nom_agent_visiteur",
    "transporter",
    "inspecteur",
    "agent_en_douanes",
    "driver_name",
    "driver_phone",
    "delivery_date",
    "delivery_notes",
  ];

  // DOM variables for the main table
  const deliveriesTable = document.getElementById("deliveriesTable"); // Get the full table element
  const deliveriesTableBody = document.getElementById("deliveriesTableBody");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  // Removed loadingSpinner variable as it's no longer needed
  // let loadingSpinner = searchButton ? searchButton.querySelector(".loading-spinner") : null;

  // FIX: Declare loadingOverlay here
  const loadingOverlay = document.getElementById("loadingOverlay");

  // --- Correction alignement bouton Suivi spécifique Agent ---
  window.addEventListener("DOMContentLoaded", function () {
    const wrapper = document.querySelector(".employee-tracking-btn-wrapper");
    const btn = document.getElementById("employeeTrackingBtn");
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

  // Les variables mainTableDateStartFilter et mainTableDateEndFilter sont déclarées dynamiquement plus bas
  // const mainTableDateStartFilter = document.getElementById("mainTableDateStartFilter");
  // const mainTableDateEndFilter = document.getElementById("mainTableDateEndFilter");

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

  // Fonction pour obtenir la plage de dates par défaut
  function getDefaultDateRange() {
    if (!deliveries || deliveries.length === 0) {
      // Si pas de données, utiliser aujourd'hui pour les deux
      const today = new Date();
      return {
        startDate: today,
        endDate: today,
      };
    }

    // Trouver la plus ancienne date de création
    let earliestDate = null;
    deliveries.forEach((delivery) => {
      if (delivery.created_at) {
        const date = new Date(delivery.created_at);
        if (!isNaN(date.getTime())) {
          if (!earliestDate || date < earliestDate) {
            earliestDate = date;
          }
        }
      }
    });

    const today = new Date();
    return {
      startDate: earliestDate || today,
      endDate: today,
    };
  }

  // Fonction pour formater une date en format YYYY-MM-DD pour les inputs
  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
          if (delivery.date_echange_bl) {
            // Ensure date_echange_bl is a Date object if it exists
            delivery.date_echange_bl = new Date(delivery.date_echange_bl);
          }
          if (delivery.date_do) {
            // Ensure date_do is a Date object if it exists
            delivery.date_do = new Date(delivery.date_do);
          }
          if (delivery.date_badt) {
            // Ensure date_badt is a Date object if it exists
            delivery.date_badt = new Date(delivery.date_badt);
          }
          return delivery;
        });
        allDeliveries = [...deliveries]; // Keep a copydz of all original deliveries

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

    // Total columns: 29 original + 1 (Date d'échange) + 1 (Statut de livraison Acc.) + 1 (Observation Acc.) + 1 (Date Paiement Acconage) + 3 (nouvelles dates) = 36
    const ACTUAL_COLUMN_COUNT = 36;

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

        // === VÉRIFICATION DES DONNÉES SYNCHRONISÉES DEPUIS RESP_LIV ===
        const syncKey = `sync_${
          delivery.id || delivery.dossier_number
        }_${fieldName}`;
        const syncData = localStorage.getItem(syncKey);
        let syncedValue = null;

        if (syncData) {
          try {
            const parsedSyncData = JSON.parse(syncData);
            if (parsedSyncData && parsedSyncData.value) {
              syncedValue = parsedSyncData.value;
              // Utiliser la valeur synchronisée à la place de la valeur originale
              value = syncedValue;
              cell.dataset.actualValue = syncedValue;
            }
          } catch (e) {
            console.error("Erreur parsing sync data:", e);
          }
        }

        let displayValue;
        // --- Affichage spécial pour la colonne Numéro TC(s) ---
        if (fieldName === "container_number") {
          // PRIORITÉ 1 : Utiliser les données JSON complètes si disponibles
          let tcList = [];

          // Essayer d'abord le champ JSON container_numbers_list
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
            if (Array.isArray(value)) {
              tcList = value.filter(Boolean);
            } else if (typeof value === "string") {
              tcList = value.split(/[,;\s]+/).filter(Boolean);
            }
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

            // Détection du mode sombre pour ce contenu
            const isDarkMode = document.body.classList.contains("dark-mode");

            // Numéro du conteneur avec style conditionnel
            const tcNum = document.createElement("div");
            tcNum.style.fontSize = "1.25em";
            tcNum.style.fontWeight = "bold";
            tcNum.style.marginBottom = "18px";
            tcNum.style.textAlign = "center";

            // Couleur conditionnelle selon le mode - CORRECTION VISIBILITÉ
            const textColor = isDarkMode ? "#1f2937" : "#000"; // Gris très foncé en mode sombre
            const numberColor = isDarkMode ? "#1e40af" : "#2563eb"; // Bleu foncé en mode sombre

            tcNum.style.color = textColor;
            tcNum.innerHTML = `Numéro du conteneur : <span style='color:${numberColor};'>${containerNumber}</span>`;
            content.appendChild(tcNum);

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
          // Pour created_at, afficher seulement la date (sans l'heure)
          if (fieldName === "created_at") {
            displayValue = value.toLocaleDateString("fr-FR");
          } else {
            // Pour d'autres champs datetime-local, garder l'affichage complet
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
          }
        } else if (value instanceof Date && fieldName === "delivery_date") {
          displayValue = value.toLocaleDateString("fr-FR");
        } else if (value instanceof Date && fieldName === "date_echange_bl") {
          displayValue = value.toLocaleDateString("fr-FR");
        } else if (value instanceof Date && fieldName === "paiement_acconage") {
          displayValue = value.toLocaleDateString("fr-FR");
        } else if (fieldName === "paiement_acconage" && value) {
          // Forcer la conversion pour paiement_acconage même si ce n'est pas un objet Date
          try {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              displayValue = dateObj.toLocaleDateString("fr-FR");
            } else {
              displayValue = value;
            }
          } catch (e) {
            displayValue = value;
          }
        } else if (value instanceof Date && fieldName === "date_do") {
          displayValue = value.toLocaleDateString("fr-FR");
        } else if (fieldName === "date_do" && value) {
          // Forcer la conversion pour date_do
          try {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              displayValue = dateObj.toLocaleDateString("fr-FR");
            } else {
              displayValue = value;
            }
          } catch (e) {
            displayValue = value;
          }
        } else if (value instanceof Date && fieldName === "date_badt") {
          displayValue = value.toLocaleDateString("fr-FR");
        } else if (fieldName === "date_badt" && value) {
          // Forcer la conversion pour date_badt
          try {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              displayValue = dateObj.toLocaleDateString("fr-FR");
            } else {
              displayValue = value;
            }
          } catch (e) {
            displayValue = value;
          }
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
              // Update the actualValue dataset to reflect the new state
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
          // Affichage du statut acconier dans la colonne :
          // - Forcer "En attente de paiement" si statut vide ou "pending_acconier"
          // - Sinon afficher la valeur réelle (ex : "mise_en_livraison_acconier")
          let displayStatus = value;
          if (!value || value === "pending_acconier") {
            displayStatus = "awaiting_payment_acconier";
          }

          // LOGIQUE DE DÉTECTION DES DOSSIERS EN RETARD
          let isOverdue = false;
          let overrideStatusText = null;
          let overrideStatusColor = null;
          let overrideStatusBg = null;

          // Vérifier si c'est en retard seulement pour "en attente de paiement"
          if (displayStatus === "awaiting_payment_acconier") {
            // Utiliser created_at pour la date de création du dossier
            let creationDate = null;
            if (delivery.created_at) {
              creationDate = new Date(delivery.created_at);
            } else if (delivery.delivery_date) {
              creationDate = new Date(delivery.delivery_date);
            }

            if (creationDate) {
              const currentDate = new Date();
              const daysDifference = Math.floor(
                (currentDate - creationDate) / (1000 * 60 * 60 * 24)
              );

              // Log de débogage
              console.log(
                `[DEBUG RETARD ACCONIER] Livraison ID: ${delivery.id || "N/A"}`
              );
              console.log(
                `[DEBUG RETARD ACCONIER] Date création: ${
                  delivery.created_at || delivery.delivery_date
                }`
              );
              console.log(
                `[DEBUG RETARD ACCONIER] Jours de différence: ${daysDifference}`
              );
              console.log(
                `[DEBUG RETARD ACCONIER] Statut acconier: "${displayStatus}"`
              );

              if (daysDifference > 2) {
                isOverdue = true;
                overrideStatusText = "Dossier en retard";
                overrideStatusColor = "#fff";
                overrideStatusBg = "#dc2626";
                console.log(
                  `[DEBUG RETARD ACCONIER] ✅ DOSSIER EN RETARD DÉTECTÉ!`
                );
              }
            }
          }

          if (isOverdue) {
            // Affichage spécial pour dossier en retard avec clignotement
            const box = document.createElement("div");
            box.style.display = "inline-block";
            box.style.padding = "4px 12px";
            box.style.borderRadius = "8px";
            box.style.fontWeight = "bold";
            box.style.fontSize = "0.98em";
            box.style.letterSpacing = "0.5px";
            box.style.boxShadow = "0 1px 6px rgba(30,41,59,0.07)";
            box.style.border = "1.5px solid #d1d5db";
            box.style.background = overrideStatusBg;
            box.style.color = overrideStatusColor;
            box.innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i>${overrideStatusText}`;

            // Ajouter l'animation clignotante
            box.style.animation = "blinkRed 1.5s infinite";
            box.classList.add("overdue-status");

            cell.innerHTML = "";
            cell.appendChild(box);
            console.log(
              `[DEBUG RETARD ACCONIER] ✅ Animation clignotante appliquée!`
            );
          } else {
            // Affichage normal du statut acconier
            const statusInfo = getStatusInfo(displayStatus);
            const iconHtml = statusInfo.iconClass
              ? `<i class=\"fas ${statusInfo.iconClass} mr-1\" style=\"color:${statusInfo.hexColor};\"></i>`
              : "";
            cell.innerHTML = `<span class=\"${statusInfo.tailwindColorClass}\">${iconHtml} ${statusInfo.text}</span>`;
          }
          displayValue = isOverdue
            ? overrideStatusText
            : getStatusInfo(displayStatus).text;
        } else {
          displayValue = value || "-"; // Changed from "N/A" to "-"
        }

        // Set initial text content for non-dropdown cells (if not already set by specific logic above)
        if (cell.innerHTML === "") {
          // Only set if not already populated by specific logic
          // === TRANSFORMATION EN MAJUSCULES POUR LES COLONNES SPÉCIFIÉES ===
          const fieldsToUppercase = [
            "employee_name", // Agent
            "client_name", // Client (Nom)
            "client_phone", // Client (Tél)
            "container_number", // Numéro TC(s)
            "lieu", // Lieu
            "container_foot_type", // Type Conteneur(pied)
            "container_type_and_content", // Contenu
            "declaration_number", // N° Déclaration
            "bl_number", // N° BL
            "dossier_number", // N° Dossier
            "number_of_containers", // Nombre de conteneurs
            "shipping_company", // Compagnie Maritime
            "weight", // Poids
            "ship_name", // Nom du navire
            "circuit", // Circuit
            "transporter_mode", // Mode de Transport
            "observation_acconier", // Observation
            "nom_agent_visiteur", // Nom agent visiteur
            "transporter", // Transporteur
            "inspecteur", // Inspecteur
            "agent_en_douanes", // Agent en Douanes
            "driver_name", // Chauffeur
            "driver_phone", // Tél. Chauffeur
          ];

          let finalDisplayValue = displayValue;
          if (
            fieldsToUppercase.includes(fieldName) &&
            finalDisplayValue !== "-"
          ) {
            finalDisplayValue = String(finalDisplayValue).toUpperCase();
          }

          cell.textContent = finalDisplayValue;
        }

        // Store original value for comparison in a consistent string format
        // This block runs when the cell is initially created, before any editing.
        if (fieldName === "delivery_date") {
          // Store the initial delivery_date in ISO format for consistent comparison later
          cell.dataset.originalValue = value ? formatDateToISO(value) : null;
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
          !NON_EDITABLE_FIELDS.includes(fieldName) && // <-- ADDED: Vérifier si le champ n'est pas dans la liste des non-éditables
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
            } else if (
              fieldName === "paiement_acconage" ||
              fieldName === "date_echange_bl" ||
              fieldName === "date_do" ||
              fieldName === "date_badt"
            ) {
              // Gestion des champs de date du responsable acconier
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
                cell.dataset.actualValue = valueToSendToBackend; // Update actual value
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

        // === MISE EN FORME VISUELLE POUR LES CELLULES SYNCHRONISÉES ===
        if (syncedValue !== null) {
          cell.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
          cell.style.borderLeft = "3px solid #22c55e";
          cell.style.fontWeight = "bold";
          cell.title = `Synchronisé depuis Resp. Livraison: ${syncedValue}`;
        }

        return cell;
      };

      // Ordre strictement synchronisé avec l'en-tête HTML
      // N° (déjà géré par la logique selectionMode ou index + 1)
      createCell(delivery.created_at, "created_at", "datetime-local", {}); // Date
      createCell(delivery.employee_name, "employee_name"); // Agent
      createCell(delivery.client_name, "client_name"); // Client (Nom)
      createCell(delivery.client_phone, "client_phone"); // Client (Tél)
      createCell(delivery.container_number, "container_number"); // Numéro TC(s) - utilise container_numbers_list JSON en priorité avec fallback
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
      createCell(delivery.date_echange_bl, "date_echange_bl", "date", {}); // Date d'échange BL
      createCell(delivery.delivery_status_acconier, "delivery_status_acconier"); // Statut de livraison (Resp. Aconiés)
      createCell(delivery.paiement_acconage, "paiement_acconage", "date", {}); // Date Paiement Acconage
      createCell(delivery.date_do, "date_do", "date", {}); // Date de DO
      createCell(delivery.date_badt, "date_badt", "date", {}); // Date de BADT
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
      createCell(delivery.driver_phone, "driver_phone", "text", {}); // Tél. Chauffeur
      createCell(delivery.delivery_date, "delivery_date", "date", {}); // Date Livraison

      // === Statut basé sur les conteneurs ===
      (function () {
        const cell = row.insertCell();
        cell.dataset.fieldName = "status";

        // Calculer le statut réel basé sur les conteneurs
        let statusText = "-";
        let statusColor = "#374151";
        let statusBg = "#f8fafc";

        // Vérifier si la livraison a des conteneurs et leurs statuts
        if (
          delivery.container_statuses &&
          typeof delivery.container_statuses === "object"
        ) {
          let tcList = [];

          // Prioriser container_numbers_list sur container_number
          if (
            delivery.container_numbers_list &&
            Array.isArray(delivery.container_numbers_list) &&
            delivery.container_numbers_list.length > 0
          ) {
            tcList = delivery.container_numbers_list.filter(Boolean);
          } else if (delivery.container_number) {
            // Gestion des données tronquées - synchronisation si nécessaire
            if (delivery.container_number.includes("+")) {
              console.warn(
                `[TABLEAU SYNC] ⚠️ Données tronquées détectées pour ${delivery.id}: ${delivery.container_number}`
              );
              // Reconstruction basique pour l'affichage en attendant la synchronisation complète
              tcList = [delivery.container_number.split("+")[0].trim()];
            } else if (Array.isArray(delivery.container_number)) {
              tcList = delivery.container_number.filter(Boolean);
            } else if (typeof delivery.container_number === "string") {
              tcList = delivery.container_number
                .split(/[,;\s]+/)
                .filter(Boolean);
            }
          }

          if (tcList.length > 0) {
            // Compter les conteneurs livrés
            const deliveredContainers = tcList.filter((tc) => {
              const status = delivery.container_statuses[tc];
              return status === "livre" || status === "livré";
            });

            if (deliveredContainers.length === tcList.length) {
              // Tous les conteneurs sont livrés
              statusText =
                '<i class="fas fa-check-circle" style="margin-right: 6px;"></i>Livré';
              statusColor = "#fff";
              statusBg = "#22c55e";
            } else if (deliveredContainers.length > 0) {
              // Partiellement livré
              statusText = `<i class="fas fa-clock" style="margin-right: 6px;"></i>${deliveredContainers.length}/${tcList.length} Livré`;
              statusColor = "#fff";
              statusBg = "#f59e0b";
            } else {
              // Aucun conteneur livré
              statusText =
                '<i class="fas fa-hourglass-half" style="margin-right: 6px;"></i>En attente';
              statusColor = "#374151";
              statusBg = "#f3f4f6";
            }

            // Plus de logique de retard ici - déplacée vers delivery_status_acconier
          }
        }

        const box = document.createElement("div");
        box.style.display = "inline-block";
        box.style.padding = "4px 12px";
        box.style.borderRadius = "8px";
        box.style.fontWeight = "bold";
        box.style.fontSize = "0.98em";
        box.style.letterSpacing = "0.5px";
        box.style.boxShadow = "0 1px 6px rgba(30,41,59,0.07)";
        box.style.border = "1.5px solid #d1d5db";
        box.style.background = statusBg;
        box.style.color = statusColor;
        box.innerHTML = statusText;

        // Ajouter les événements de survol pour le tooltip
        box.style.cursor = "pointer";
        box.addEventListener("mouseenter", async (e) => {
          await createContainerStatusTooltip(delivery, box);
        });
        box.addEventListener("mouseleave", () => {
          removeContainerStatusTooltip();
        });

        cell.appendChild(box);
      })();

      createCell(delivery.delivery_notes, "delivery_notes", "textarea", {}); // Observations
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
    const COLS_AGENT = [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    ]; // Colonnes Agent Acconier (avec Date d'échange BL maintenant à la position 18)
    const COLS_RESP = [19, 20, 21, 22, 23]; // 19=Statut Dossier, 20=Date Paiement Acconage, 21=Date DO, 22=Date BADT, 23=Observation
    const COLS_LIVRAISON = [24, 25, 26, 27, 28, 29, 30, 31, 32]; // Colonnes Responsable de livraison (avec Nom agent visiteur à la position 24)
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

  // === APPLICATION DES COULEURS CONDITIONNELLES EN MODE SOMBRE ===
  window.applyDarkModeConditionalColors();

  // === DÉCLENCHEMENT DE L'ÉVÉNEMENT APRÈS RENDU DU TABLEAU ===
  // Déclencher l'événement personnalisé pour indiquer que le tableau a été rendu
  window.dispatchEvent(new Event("deliveriesTableRendered"));

  // This function is now primarily used for displaying content after inline editing or initial render (non-editing mode)
  function updateCellContent(cell, displayValue, fieldName, type) {
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
    } else if (
      fieldName === "delivery_notes" ||
      fieldName === "observation_acconier"
    ) {
      // Specific display for delivery_notes and observation_acconier
      // Replace newlines with <br> for proper display in HTML
      cell.innerHTML = (displayValue || "-").replace(/\n/g, "<br>");
    } else if (type === "datetime-local" && displayValue instanceof Date) {
      // Pour created_at qui est un objet Date
      // Si la date a une heure de 00:00:00, essayer d'utiliser l'heure réelle de création
      if (
        fieldName === "created_at" &&
        displayValue.getHours() === 0 &&
        displayValue.getMinutes() === 0 &&
        displayValue.getSeconds() === 0
      ) {
        // Chercher dans les données de livraison pour obtenir une heure plus précise
        const deliveryRow = cell.closest("tr");
        let delivery = null;

        // Essayer de récupérer les données de livraison depuis l'index de la ligne
        if (deliveryRow && window.deliveries) {
          const rowIndex = Array.from(deliveryRow.parentNode.children).indexOf(
            deliveryRow
          );
          delivery = window.deliveries[rowIndex];
        }

        let realCreatedAt = null;
        if (
          delivery &&
          delivery.containers_info &&
          Object.keys(delivery.containers_info).length > 0
        ) {
          // Prendre la première date de création trouvée dans les conteneurs
          for (const tcInfo of Object.values(delivery.containers_info)) {
            if (tcInfo.created_at) {
              realCreatedAt = new Date(tcInfo.created_at);
              if (
                realCreatedAt.getHours() !== 0 ||
                realCreatedAt.getMinutes() !== 0 ||
                realCreatedAt.getSeconds() !== 0
              ) {
                break; // Utiliser cette heure si elle n'est pas 00:00:00
              }
            }
          }
        }

        // Si on a trouvé une heure réelle, l'utiliser, sinon utiliser l'heure actuelle avec la date originale
        if (
          realCreatedAt &&
          (realCreatedAt.getHours() !== 0 ||
            realCreatedAt.getMinutes() !== 0 ||
            realCreatedAt.getSeconds() !== 0)
        ) {
          cell.textContent = realCreatedAt
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
          // Utiliser la date originale avec l'heure actuelle comme approximation
          const now = new Date();
          const dateWithCurrentTime = new Date(displayValue);
          dateWithCurrentTime.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
          );
          cell.textContent = dateWithCurrentTime
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
        }
      } else {
        // Utilisation normale si l'heure n'est pas 00:00:00
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
      }
    } else if (type === "datetime-local" && typeof displayValue === "string") {
      // For created_at from backend (string)
      // If it's a string, attempt to parse it as a date and format
      const dateObj = new Date(displayValue);
      if (!isNaN(dateObj.getTime())) {
        // Pour created_at, afficher seulement la date (sans l'heure)
        if (fieldName === "created_at") {
          cell.textContent = dateObj.toLocaleDateString("fr-FR");
        } else {
          // Pour d'autres champs datetime-local, garder l'affichage complet
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
        }
      } else {
        cell.textContent = displayValue; // Fallback to raw string
      }
    } else {
      // Default for other types, including new text fields, and if displayValue is null/undefined
      let finalDisplayValue = displayValue || "-";

      // === TRANSFORMATION EN MAJUSCULES POUR LES COLONNES SPÉCIFIÉES ===
      const fieldsToUppercase = [
        "employee_name", // Agent
        "client_name", // Client (Nom)
        "client_phone", // Client (Tél)
        "container_number", // Numéro TC(s)
        "lieu", // Lieu
        "container_foot_type", // Type Conteneur(pied)
        "container_type_and_content", // Contenu
        "declaration_number", // N° Déclaration
        "bl_number", // N° BL
        "dossier_number", // N° Dossier
        "number_of_containers", // Nombre de conteneurs
        "shipping_company", // Compagnie Maritime
        "weight", // Poids
        "ship_name", // Nom du navire
        "circuit", // Circuit
        "transporter_mode", // Mode de Transport
        "observation_acconier", // Observation
        "nom_agent_visiteur", // Nom agent visiteur
        "transporter", // Transporteur
        "inspecteur", // Inspecteur
        "agent_en_douanes", // Agent en Douanes
        "driver_name", // Chauffeur
        "driver_phone", // Tél. Chauffeur
      ];

      if (fieldsToUppercase.includes(fieldName) && finalDisplayValue !== "-") {
        finalDisplayValue = String(finalDisplayValue).toUpperCase();
      }

      cell.textContent = finalDisplayValue;
    }
  }
  // =====================================================================
  // --- Fonction pour créer un tooltip de statut des conteneurs ---
  // =====================================================================

  async function createContainerStatusTooltip(delivery, targetElement) {
    // Supprime tout tooltip existant
    const existingTooltip = document.getElementById("containerStatusTooltip");
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Création du tooltip
    const tooltip = document.createElement("div");
    tooltip.id = "containerStatusTooltip";
    tooltip.style.position = "fixed";
    tooltip.style.background = "rgba(30, 41, 59, 0.95)";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "12px 16px";
    tooltip.style.borderRadius = "10px";
    tooltip.style.fontSize = "0.9em";
    tooltip.style.fontWeight = "500";
    tooltip.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";
    tooltip.style.zIndex = "10000";
    tooltip.style.maxWidth = "280px";
    tooltip.style.border = "1px solid rgba(255, 255, 255, 0.1)";
    tooltip.style.backdropFilter = "blur(8px)";
    tooltip.style.opacity = "0";
    tooltip.style.transform = "translateY(10px)";
    tooltip.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    tooltip.style.pointerEvents = "none";

    // Obtenir la liste des conteneurs
    let tcList = [];

    // Prioriser container_numbers_list sur container_number
    if (
      delivery.container_numbers_list &&
      Array.isArray(delivery.container_numbers_list) &&
      delivery.container_numbers_list.length > 0
    ) {
      tcList = delivery.container_numbers_list.filter(Boolean);
    } else if (delivery.container_number) {
      // Gestion des données tronquées - tentative de synchronisation
      if (delivery.container_number.includes("+")) {
        console.warn(
          `[TOOLTIP SYNC] ⚠️ Données tronquées détectées pour ${delivery.id}: ${delivery.container_number}`
        );

        // Essayer de forcer la synchronisation
        const syncData = await forceSyncDelivery(delivery);
        if (syncData && syncData.container_numbers_list) {
          tcList = syncData.container_numbers_list;
          console.log(
            `[TOOLTIP SYNC] ✅ Reconstruction réussie: ${tcList.length} conteneurs générés`
          );
        } else {
          // Fallback - utiliser seulement le premier conteneur visible
          tcList = [delivery.container_number.split("+")[0].trim()];
        }
      } else if (Array.isArray(delivery.container_number)) {
        tcList = delivery.container_number.filter(Boolean);
      } else if (typeof delivery.container_number === "string") {
        tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
      }
    }

    // Contenu du tooltip
    let tooltipContent =
      '<div style="font-weight: 600; margin-bottom: 8px; color: #fbbf24;">Détail des conteneurs :</div>';

    if (
      tcList.length > 0 &&
      delivery.container_statuses &&
      typeof delivery.container_statuses === "object"
    ) {
      tcList.forEach((tc, index) => {
        const status = delivery.container_statuses[tc];
        const isDelivered = status === "livre" || status === "livré";
        const statusIcon = isDelivered
          ? '<i class="fas fa-check-circle" style="color: #22c55e; margin-right: 6px;"></i>'
          : '<i class="fas fa-hourglass-half" style="color: #f59e0b; margin-right: 6px;"></i>';
        const statusText = isDelivered ? "Livré" : "En attente";
        const statusColor = isDelivered ? "#22c55e" : "#f59e0b";

        tooltipContent += `
          <div style="display: flex; align-items: center; margin: 4px 0; padding: 4px 8px; background: rgba(255, 255, 255, 0.1); border-radius: 6px;">
            ${statusIcon}
            <span style="font-weight: 600; margin-right: 8px;">${tc}</span>
            <span style="color: ${statusColor}; font-size: 0.85em;">${statusText}</span>
          </div>
        `;
      });
    } else if (tcList.length > 0) {
      // Si pas de container_statuses, afficher juste les conteneurs
      tcList.forEach((tc) => {
        tooltipContent += `
          <div style="display: flex; align-items: center; margin: 4px 0; padding: 4px 8px; background: rgba(255, 255, 255, 0.1); border-radius: 6px;">
            <i class="fas fa-hourglass-half" style="color: #f59e0b; margin-right: 6px;"></i>
            <span style="font-weight: 600; margin-right: 8px;">${tc}</span>
            <span style="color: #f59e0b; font-size: 0.85em;">En attente</span>
          </div>
        `;
      });
    } else {
      tooltipContent +=
        '<div style="color: #9ca3af; font-style: italic;">Aucun conteneur spécifié</div>';
    }

    tooltip.innerHTML = tooltipContent;
    document.body.appendChild(tooltip);

    // Fonction pour positionner le tooltip
    const updateTooltipPosition = (e) => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      let top = rect.top - tooltipRect.height - 10;

      // Ajustements pour rester dans la fenêtre
      if (left < 10) left = 10;
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      if (top < 10) {
        top = rect.bottom + 10;
      }

      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
    };

    // Position initiale et animation d'apparition
    updateTooltipPosition();
    setTimeout(() => {
      tooltip.style.opacity = "1";
      tooltip.style.transform = "translateY(0)";
    }, 10);

    return tooltip;
  }

  function removeContainerStatusTooltip() {
    const tooltip = document.getElementById("containerStatusTooltip");
    if (tooltip) {
      tooltip.style.opacity = "0";
      tooltip.style.transform = "translateY(10px)";
      setTimeout(() => {
        tooltip.remove();
      }, 200);
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

    // Cette fonction maintient l'indication des agents actifs
    // Elle ne dépend plus du filtre de date principal
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Toujours afficher comme actifs car on travaille avec une plage de dates maintenant
    agentStatusIndicator.classList.remove("status-past-date");
    agentStatusIndicator.classList.add("status-active");
    if (agentStatusText) agentStatusText.textContent = "Agents Actifs";
  };
  /**
   * Returns a sorted list of unique agent names who have performed an operation
   * (either created or delivered a delivery) on today's date.
   * @returns {Array<string>} Sorted array of unique agent names.
   */
  function getAgentsForCurrentMainDate() {
    // Utilise la date d'aujourd'hui pour l'affichage des agents actifs
    const today = new Date();
    const selectedFilterDateISO = formatDateToISO(today);
    console.log(
      "getAgentsForCurrentMainDate: Using today's date for active agents:",
      selectedFilterDateISO
    );

    const agentsSet = new Set();
    deliveries.forEach((delivery) => {
      let isAgentActiveOnFilterDate = false;

      // Check if the delivery was created on today's date (UTC comparison)
      if (delivery.created_at) {
        const createdAtDate = new Date(delivery.created_at);
        const createdAtISO = formatDateToISO(createdAtDate);
        if (createdAtISO === selectedFilterDateISO) {
          isAgentActiveOnFilterDate = true;
        }
      }

      // Also check if the delivery was delivered on today's date (UTC comparison)
      if (!isAgentActiveOnFilterDate && delivery.delivery_date) {
        const deliveryDateObj = new Date(delivery.delivery_date);
        if (!isNaN(deliveryDateObj.getTime())) {
          const deliveryDateISO = formatDateToISO(deliveryDateObj);
          if (deliveryDateISO === selectedFilterDateISO) {
            isAgentActiveOnFilterDate = true;
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

  function applyCombinedFilters(shouldRenderTable = true) {
    // Removed showSpinner() call here as spinner is removed
    let filteredData = [...deliveries];

    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm !== "") {
      filteredData = filteredData.filter((delivery) => {
        // Check container_number, declaration_number, bl_number, dossier_number, client_name
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
        const clientNameMatch =
          delivery.client_name &&
          String(delivery.client_name).toLowerCase().includes(searchTerm);

        return (
          containerNumberMatch ||
          declarationNumberMatch ||
          blNumberMatch ||
          dossierNumberMatch ||
          clientNameMatch
        );
      });
    }

    // Filtrage par plage de dates (début et fin)
    const startDateValue = mainTableDateStartFilter
      ? mainTableDateStartFilter.value
      : null;
    const endDateValue = mainTableDateEndFilter
      ? mainTableDateEndFilter.value
      : null;

    if (startDateValue || endDateValue) {
      filteredData = filteredData.filter((delivery) => {
        let createdAtDate = null;
        if (delivery.created_at) {
          createdAtDate = new Date(delivery.created_at);
        }
        if (!createdAtDate || isNaN(createdAtDate.getTime())) return false;
        createdAtDate = normalizeDateToMidnight(createdAtDate);

        // Vérifier date de début
        if (startDateValue) {
          const startDate = normalizeDateToMidnight(new Date(startDateValue));
          if (createdAtDate < startDate) return false;
        }

        // Vérifier date de fin
        if (endDateValue) {
          const endDate = normalizeDateToMidnight(new Date(endDateValue));
          const nextDay = new Date(endDate);
          nextDay.setDate(nextDay.getDate() + 1);
          if (createdAtDate >= nextDay) return false;
        }

        return true;
      });

      console.log(
        `Applying date range filter: ${startDateValue || "pas de début"} to ${
          endDateValue || "pas de fin"
        }`
      );
    } else {
      console.log("No main filter date selected.");
    }

    // === TRI PAR ORDRE CHRONOLOGIQUE : RÉCENTS EN HAUT, ANCIENS EN BAS ===
    filteredData.sort((a, b) => {
      const dateA = new Date(a.created_at || a.delivery_date || 0);
      const dateB = new Date(b.created_at || b.delivery_date || 0);
      return dateA - dateB; // Ordre décroissant : plus récent en haut, plus ancien en bas
    });

    if (shouldRenderTable) {
      renderAdminDeliveriesTable(filteredData);
    }
    // Note: hideSpinner() is called in loadDeliveries().finally, which is triggered by applyCombinedFilters.
    // This ensures the spinner is hidden aftygjer data is fully loaded and rendered.
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

      // DÉTECTION DU MODE ET APPLICATION CONDITIONNELLE
      const isDarkMode = document.body.classList.contains("dark-mode");

      if (isDarkMode) {
        // MODE SOMBRE - Forcer TOUS les éléments à être sombres
        setTimeout(() => {
          // Modal principal
          employeePopup.style.cssText = `
            background-color: #111827 !important;
            border: 1px solid #374151 !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
          `;

          // FORCER L'EN-TÊTE - SOMBRE
          const header = employeePopup.querySelector(".popup-header");
          if (header) {
            header.style.cssText = `
              background-color: #1f2937 !important;
              background: #1f2937 !important;
              border-bottom: 1px solid #374151 !important;
              color: #ffffff !important;
            `;

            // Forcer TOUS les enfants de l'en-tête
            const headerChildren = header.querySelectorAll("*");
            headerChildren.forEach((child) => {
              child.style.setProperty(
                "background-color",
                "#1f2937",
                "important"
              );
              child.style.setProperty("background", "#1f2937", "important");
              child.style.setProperty("color", "#ffffff", "important");
            });
          }

          // FORCER LE TITRE
          const title = employeePopup.querySelector(".popup-title");
          if (title) {
            title.style.cssText = `
              color: #ffffff !important;
              background-color: #1f2937 !important;
              background: #1f2937 !important;
            `;
          }

          // FORCER LE COMPTEUR D'AGENTS
          const countDisplay = employeePopup.querySelector(
            "#employeeCountDisplay"
          );
          if (countDisplay) {
            countDisplay.style.cssText = `
              color: #ffffff !important;
              background-color: #1f2937 !important;
              background: #1f2937 !important;
            `;
          }

          // FORCER TOUS LES DIVS ET SPANS À ÊTRE TRANSPARENTS (sauf header)
          const allDivs = employeePopup.querySelectorAll(
            "div:not(.popup-header)"
          );
          allDivs.forEach((div) => {
            div.style.setProperty(
              "background-color",
              "transparent",
              "important"
            );
            div.style.setProperty("background", "transparent", "important");
          });

          // FORCER SPÉCIFIQUEMENT LA ZONE DU HEADER
          const headerElements = employeePopup.querySelectorAll(
            ".popup-header, .popup-header *"
          );
          headerElements.forEach((el) => {
            el.style.setProperty("background-color", "#1f2937", "important");
            el.style.setProperty("background", "#1f2937", "important");
            el.style.setProperty("color", "#ffffff", "important");
          });

          // FORCER LE CHAMP DE RECHERCHE À ÊTRE SOMBRE AVEC TEXTE BLANC
          const searchInput = employeePopup.querySelector(
            ".popup-search-input"
          );
          if (searchInput) {
            searchInput.style.cssText = `
              background-color: #374151 !important;
              border: 1px solid #6b7280 !important;
              color: #ffffff !important;
              font-size: 14px !important;
              padding: 8px 12px !important;
              border-radius: 6px !important;
            `;

            // Forcer aussi le placeholder
            searchInput.setAttribute(
              "style",
              searchInput.getAttribute("style") +
                " ::placeholder { color: #9ca3af !important; opacity: 0.8 !important; }"
            );
          }

          // Forcer TOUS les inputs dans le modal
          const allInputs = employeePopup.querySelectorAll("input");
          allInputs.forEach((input) => {
            input.style.cssText = `
              background-color: #374151 !important;
              border: 1px solid #6b7280 !important;
              color: #ffffff !important;
              font-size: 14px !important;
              padding: 8px 12px !important;
              border-radius: 6px !important;
            `;
          });
        }, 10);
      } else {
        // MODE CLAIR - Nettoyer TOUS les styles forcés
        setTimeout(() => {
          // Supprimer tous les styles inline forcés
          employeePopup.removeAttribute("style");

          // Nettoyer tous les éléments avec des styles forcés
          const allElements = employeePopup.querySelectorAll("*");
          allElements.forEach((el) => {
            const style = el.getAttribute("style");
            if (style && style.includes("!important")) {
              el.removeAttribute("style");
            }
          });

          // Réappliquer les classes CSS originales pour le mode clair
          const header = employeePopup.querySelector(".popup-header");
          if (header) {
            header.removeAttribute("style");
          }

          const title = employeePopup.querySelector(".popup-title");
          if (title) {
            title.removeAttribute("style");
          }

          const countDisplay = employeePopup.querySelector(
            "#employeeCountDisplay"
          );
          if (countDisplay) {
            countDisplay.removeAttribute("style");
          }
        }, 10);
      }

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
    const isDarkMode = document.body.classList.contains("dark-mode");

    if (employeesToDisplay.length === 0) {
      const noEmployeesLi = document.createElement("li");
      noEmployeesLi.className = "no-employees-message";
      noEmployeesLi.innerHTML = "<span>Aucun employé trouvé.</span>";

      // Style SEULEMENT en mode sombre
      if (isDarkMode) {
        noEmployeesLi.setAttribute(
          "style",
          `
          color: #d1d5db !important;
          background-color: #1f2937 !important;
          padding: 16px !important;
          text-align: center !important;
          border-radius: 6px !important;
        `
        );
      }

      employeeList.appendChild(noEmployeesLi);
      return;
    }

    employeesToDisplay.forEach((employeeName) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer";

      const spanName = document.createElement("span");
      spanName.textContent = employeeName;

      // Bouton de suppression
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-agent-list-item-btn";
      deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteButton.title = `Supprimer l'agent ${employeeName} et toutes ses livraisons`;

      // APPLICATION CONDITIONNELLE DES STYLES
      if (isDarkMode) {
        // MODE SOMBRE - Styles forcés
        li.style.cssText = `
          background-color: #1f2937 !important;
          border-bottom: 1px solid #374151 !important;
          color: #ffffff !important;
          margin-bottom: 4px !important;
          border-radius: 6px !important;
        `;

        spanName.style.cssText = `
          color: #ffffff !important;
          font-weight: 500 !important;
          background-color: transparent !important;
        `;

        deleteButton.setAttribute(
          "style",
          `color: #ef4444 !important; 
           font-size: 16px !important; 
           background-color: transparent !important;
           border: none !important;
           padding: 4px !important;
           border-radius: 4px !important;
           opacity: 1 !important;
           visibility: visible !important;
           display: inline-block !important;`
        );

        // Gestion du survol en mode sombre
        li.addEventListener("mouseenter", () => {
          li.setAttribute(
            "style",
            `
            background-color: #374151 !important;
            border-bottom: 1px solid #4b5563 !important;
            color: #ffffff !important;
            margin-bottom: 4px !important;
            border-radius: 6px !important;
            box-shadow: inset 3px 0 0 #3b82f6, 0 2px 8px rgba(59, 130, 246, 0.3) !important;
            transform: translateX(2px) !important;
            `
          );
        });

        li.addEventListener("mouseleave", () => {
          li.setAttribute(
            "style",
            `
            background-color: #1f2937 !important;
            border-bottom: 1px solid #374151 !important;
            color: #ffffff !important;
            margin-bottom: 4px !important;
            border-radius: 6px !important;
            transform: translateX(0) !important;
            `
          );
        });
      } else {
        // MODE CLAIR - Pas de styles forcés, utiliser les classes CSS normales
        // Le CSS par défaut s'appliquera automatiquement
      }

      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        handleDeleteAgent(employeeName);
      });

      // Gestion du clic sur l'élément
      li.addEventListener("click", () => {
        selectedAgentName = employeeName;
        currentAgentActivityDate = new Date();
        showAgentActivity(selectedAgentName, currentAgentActivityDate);
        hideEmployeePopup();
      });

      li.appendChild(spanName);
      li.appendChild(deleteButton);
      employeeList.appendChild(li);
    });
  }

  // --- Functions for the floating agent activity BOX ---
  function showAgentActivityBox() {
    if (agentActivityBox) {
      agentActivityBox.classList.add("active");

      // ADAPTER LA MODAL D'ACTIVITÉ AU MODE ACTUEL (SOMBRE OU CLAIR)
      setTimeout(() => {
        forceAgentActivityBoxAdaptiveMode();
      }, 10);
    }
  }

  // Fonction pour adapter la modal d'activité au mode actuel
  function forceAgentActivityBoxAdaptiveMode() {
    if (agentActivityBox) {
      const isDarkMode = document.body.classList.contains("dark-mode");

      if (isDarkMode) {
        // MODE SOMBRE - Forcer tous les éléments à être sombres
        agentActivityBox.style.cssText = `
          background-color: #1f2937 !important;
          color: #ffffff !important;
          border: 1px solid #374151 !important;
        `;

        // Forcer tous les éléments enfants à être sombres
        const allElements = agentActivityBox.querySelectorAll("*");
        allElements.forEach((el) => {
          el.style.cssText += `
            background-color: transparent !important;
            color: #ffffff !important;
            border-color: #374151 !important;
          `;
        });

        // Forcer spécifiquement les conteneurs principaux
        const containers = agentActivityBox.querySelectorAll(
          ".modal-content, .modal-body, .modal-header, .tab-navigation, .tab-content"
        );
        containers.forEach((container) => {
          container.style.cssText = `
            background-color: #1f2937 !important;
            color: #ffffff !important;
            border-color: #374151 !important;
          `;
        });

        // Forcer les boutons d'onglets
        const tabBtns = agentActivityBox.querySelectorAll(".tab-btn");
        tabBtns.forEach((btn) => {
          btn.style.cssText = `
            background-color: #374151 !important;
            color: #ffffff !important;
            border-color: #4b5563 !important;
          `;

          if (btn.classList.contains("active")) {
            btn.style.cssText = `
              background-color: #4b5563 !important;
              color: #ffffff !important;
              border-bottom-color: #3b82f6 !important;
            `;
          }
        });

        // Forcer les tableaux
        const tables = agentActivityBox.querySelectorAll("table, th, td");
        tables.forEach((table) => {
          table.style.cssText = `
            background-color: #1f2937 !important;
            color: #ffffff !important;
            border-color: #374151 !important;
          `;
        });

        // Forcer les états vides
        const emptyStates = agentActivityBox.querySelectorAll(
          ".empty-state, .empty-state h4, .empty-state p"
        );
        emptyStates.forEach((empty) => {
          empty.style.cssText = `
            background-color: #374151 !important;
            color: #ffffff !important;
          `;
        });

        // Forcer les boutons
        const buttons = agentActivityBox.querySelectorAll(
          "button, .btn, .modern-btn"
        );
        buttons.forEach((btn) => {
          btn.style.cssText = `
            background-color: #374151 !important;
            color: #ffffff !important;
            border: 1px solid #4b5563 !important;
          `;
        });
      } else {
        // MODE CLAIR - Styles par défaut
        agentActivityBox.style.cssText = `
          background-color: #ffffff !important;
          color: #000000 !important;
        `;

        // Nettoyer les styles forcés en mode sombre
        const allElements = agentActivityBox.querySelectorAll("*");
        allElements.forEach((el) => {
          const style = el.getAttribute("style");
          if (
            style &&
            (style.includes("#1f2937") ||
              style.includes("#374151") ||
              style.includes("#111827"))
          ) {
            el.removeAttribute("style");
          }
        });
      }
    }
  }

  // Fonction pour forcer la modal d'activité à rester en mode clair (ANCIENNE VERSION - GARDÉE POUR COMPATIBILITÉ)
  function forceAgentActivityBoxLightMode() {
    if (agentActivityBox) {
      // Nettoyer tous les styles de mode sombre
      agentActivityBox.style.cssText = `
        background-color: #ffffff !important;
        color: #000000 !important;
      `;

      // Forcer tous les éléments enfants à rester clairs
      const allElements = agentActivityBox.querySelectorAll("*");
      allElements.forEach((el) => {
        // Supprimer les styles de mode sombre
        const style = el.getAttribute("style");
        if (
          style &&
          (style.includes("#1f2937") ||
            style.includes("#374151") ||
            style.includes("#111827"))
        ) {
          el.removeAttribute("style");
        }
      });

      // Forcer spécifiquement les éléments importants
      const modalContent = agentActivityBox.querySelector(".modal-content");
      if (modalContent) {
        modalContent.style.cssText = `
          background-color: #ffffff !important;
          color: #000000 !important;
        `;
      }

      const modalBody = agentActivityBox.querySelector(".modal-body");
      if (modalBody) {
        modalBody.style.cssText = `
          background-color: #ffffff !important;
          color: #000000 !important;
        `;
      }

      const tables = agentActivityBox.querySelectorAll("table, th, td");
      tables.forEach((table) => {
        table.style.cssText = `
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #e5e7eb !important;
        `;
      });

      const inputs = agentActivityBox.querySelectorAll("input, .form-control");
      inputs.forEach((input) => {
        input.style.cssText = `
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #d1d5db !important;
        `;
      });
    }
  }

  // Fonction pour forcer la modal moderne d'activité à rester en mode clair
  // Fonction pour adapter la modal d'activité au mode actuel
  function forceModalActivityAdaptiveMode(modalElement) {
    if (!modalElement) return;

    const isDarkMode = document.body.classList.contains("dark-mode");

    if (isDarkMode) {
      // MODE SOMBRE - Forcer tous les éléments à être sombres
      const modal = modalElement.querySelector(".modern-agent-modal");
      if (modal) {
        modal.style.cssText = `
          background-color: #1f2937 !important;
          color: #ffffff !important;
          border: 1px solid #374151 !important;
        `;
      }

      // Forcer tous les éléments enfants
      const allElements = modalElement.querySelectorAll("*");
      allElements.forEach((el) => {
        if (!el.classList.contains("modern-agent-modal-overlay")) {
          el.style.cssText += `
            background-color: transparent !important;
            color: #ffffff !important;
            border-color: #374151 !important;
          `;
        }
      });

      // Forcer l'overlay
      modalElement.style.cssText = `
        background-color: rgba(0, 0, 0, 0.8) !important;
      `;

      // Forcer les conteneurs principaux
      const containers = modalElement.querySelectorAll(
        ".modern-modal-header, .modern-modal-body, .tab-navigation, .tab-content"
      );
      containers.forEach((container) => {
        container.style.cssText = `
          background-color: #1f2937 !important;
          color: #ffffff !important;
          border-color: #374151 !important;
        `;
      });

      // Forcer les boutons d'onglets
      const tabBtns = modalElement.querySelectorAll(".tab-btn");
      tabBtns.forEach((btn) => {
        btn.style.cssText = `
          background-color: #374151 !important;
          color: #ffffff !important;
          border-color: #4b5563 !important;
        `;

        if (btn.classList.contains("active")) {
          btn.style.cssText = `
            background-color: #4b5563 !important;
            color: #ffffff !important;
            border-bottom-color: #3b82f6 !important;
          `;
        }
      });

      // Trouver tous les tableaux et appliquer le système de couleurs intelligent
      const tables = modalElement.querySelectorAll(".modern-operations-table");
      tables.forEach((table) => {
        // Forcer les styles de base du tableau
        table.style.cssText = `
          background-color: #1f2937 !important;
          color: #ffffff !important;
          border-color: #374151 !important;
        `;

        // Identifier les en-têtes et leurs types de colonnes
        const headers = table.querySelectorAll("th");
        const columnTypes = [];

        headers.forEach((header, index) => {
          const headerText = header.textContent.trim().toLowerCase();
          let columnType = "default";

          // DEBUG - Afficher le texte de l'en-tête pour diagnostic
          console.log(
            `🔍 ANALYSE COLONNE ${index}: "${header.textContent.trim()}" (normalized: "${headerText}")`
          );

          // Identifier le type de colonne selon le texte de l'en-tête avec plus de précision
          if (
            headerText.includes("déclaration") ||
            headerText.includes("declaration") ||
            headerText.includes("n° déclaration") ||
            headerText.includes("n°déclaration") ||
            headerText.includes("numero declaration") ||
            headerText.match(/n\s*°?\s*d[eé]claration/i)
          ) {
            columnType = "declaration";
            console.log(`✅ DÉTECTÉ: Colonne DÉCLARATION`);
          } else if (
            (headerText.includes("bl") || headerText.includes("b.l")) &&
            !headerText.includes("dossier") &&
            (headerText.includes("n°") ||
              headerText.includes("numero") ||
              headerText.match(/n\s*°?\s*bl/i))
          ) {
            columnType = "bl";
            console.log(`✅ DÉTECTÉ: Colonne BL`);
          } else if (
            headerText.includes("dossier") ||
            headerText.includes("n° dossier") ||
            headerText.includes("n°dossier") ||
            headerText.includes("numero dossier") ||
            headerText.match(/n\s*°?\s*dossier/i)
          ) {
            columnType = "dossier";
            console.log(`✅ DÉTECTÉ: Colonne DOSSIER`);
          } else if (headerText.includes("date") && headerText.includes("do")) {
            columnType = "date_do";
            console.log(`✅ DÉTECTÉ: Colonne DATE DO`);
          } else if (
            headerText.includes("date") &&
            headerText.includes("badt")
          ) {
            columnType = "date_badt";
            console.log(`✅ DÉTECTÉ: Colonne DATE BADT`);
          } else if (
            headerText.includes("date") &&
            (headerText.includes("paiement") || headerText.includes("acconage"))
          ) {
            columnType = "date_paiement";
            console.log(`✅ DÉTECTÉ: Colonne DATE PAIEMENT`);
          } else if (headerText.includes("circuit")) {
            columnType = "circuit";
            console.log(`✅ DÉTECTÉ: Colonne CIRCUIT`);
          } else {
            console.log(`⚠️ COLONNE NON RECONNUE: "${headerText}" -> default`);
          }

          columnTypes[index] = columnType;
          header.setAttribute("data-column", columnType);

          // DEBUG - Confirmer l'attribution du type
          console.log(`🎯 COLONNE ${index} -> TYPE: ${columnType}`);
        });

        // Appliquer les styles aux en-têtes
        headers.forEach((header) => {
          header.style.cssText = `
            background-color: #374151 !important;
            color: #ffffff !important;
            font-weight: 700 !important;
            border-bottom: 2px solid #4b5563 !important;
            text-align: center !important;
            padding: 12px 8px !important;
            border-color: #374151 !important;
          `;
        });

        // Appliquer les couleurs aux cellules de données
        const dataRows = table.querySelectorAll("tbody tr");
        dataRows.forEach((row, rowIndex) => {
          // Alternance des couleurs de fond des lignes
          row.style.cssText = `
            background-color: ${
              rowIndex % 2 === 0 ? "#1f2937" : "#374151"
            } !important;
            color: #ffffff !important;
          `;

          const dataCells = row.querySelectorAll("td");
          dataCells.forEach((cell, cellIndex) => {
            const columnType = columnTypes[cellIndex] || "default";
            const cellContent = cell.textContent.trim();

            // Styles de base pour toutes les cellules
            cell.style.cssText = `
              background-color: transparent !important;
              border-color: #374151 !important;
              padding: 8px !important;
            `;

            // Couleurs spécifiques selon le type de colonne
            switch (columnType) {
              case "declaration":
                cell.style.color = "#ef4444 !important"; // Rouge
                cell.style.fontWeight = "600 !important";
                break;
              case "bl":
                cell.style.color = "#fbbf24 !important"; // Jaune
                cell.style.fontWeight = "600 !important";
                break;
              case "dossier":
                cell.style.color = "#ff6600 !important"; // Orange fluo
                cell.style.fontWeight = "600 !important";
                break;
              case "date":
                cell.style.color = "#ff4500 !important"; // Orange red
                cell.style.fontWeight = "500 !important";
                break;
              case "circuit":
                // Couleurs conditionnelles selon la valeur du circuit
                const circuitValue = cellContent.toUpperCase();
                if (circuitValue.includes("VAD")) {
                  cell.style.color = "#10b981 !important"; // Vert
                } else if (circuitValue.includes("VAQ")) {
                  cell.style.color = "#38bdf8 !important"; // Bleu clair
                } else if (circuitValue.includes("SCANNER")) {
                  cell.style.color = "#8b5cf6 !important"; // Violet
                } else if (circuitValue.includes("BAE")) {
                  cell.style.color = "#9ca3af !important"; // Gris
                } else {
                  cell.style.color = "#d1d5db !important"; // Gris clair par défaut
                }
                cell.style.fontWeight = "600 !important";
                break;
              default:
                cell.style.color = "#ffffff !important";
                break;
            }

            // Forcer tous les éléments enfants des cellules
            const cellChildren = cell.querySelectorAll("*");
            cellChildren.forEach((child) => {
              child.style.cssText = `
                background-color: transparent !important;
                color: inherit !important;
              `;
            });
          });
        });
      });

      // Forcer les états vides avec style amélioré
      const emptyStates = modalElement.querySelectorAll(
        ".empty-state, .empty-state h4, .empty-state p"
      );
      emptyStates.forEach((empty) => {
        empty.style.cssText = `
          background-color: #374151 !important;
          color: #d1d5db !important;
          border: 1px dashed #60a5fa !important;
          border-radius: 8px !important;
          padding: 20px !important;
          text-align: center !important;
        `;
      });

      // Forcer les boutons de fermeture
      const closeButtons = modalElement.querySelectorAll(
        ".modern-modal-close, .btn-close, .close-btn"
      );
      closeButtons.forEach((btn) => {
        btn.style.cssText = `
          background-color: #374151 !important;
          color: #ffffff !important;
          border-radius: 50% !important;
          width: 60px !important;
          height: 60px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 0 20px rgba(96, 165, 250, 0.3) !important;
        `;
      });

      // Ajouter un observateur pour surveiller les changements dans le contenu du tableau
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList" || mutation.type === "subtree") {
            // Re-appliquer les styles quand le contenu change
            setTimeout(() => {
              forceModalActivityAdaptiveMode(modalElement);
            }, 10);
          }
        });
      });

      // Observer les changements dans la modal
      observer.observe(modalElement, {
        childList: true,
        subtree: true,
        attributes: false,
      });

      // Stocker l'observateur pour pouvoir l'arrêter plus tard
      modalElement._darkModeObserver = observer;
    } else {
      // MODE CLAIR - Utiliser la fonction existante
      forceModalActivityLightMode(modalElement);
    }
  }

  function forceModalActivityLightMode(modalElement) {
    if (modalElement) {
      // Forcer la modal principale à rester claire
      modalElement.style.cssText = `
        background-color: rgba(0, 0, 0, 0.5) !important;
      `;

      const modal = modalElement.querySelector(".modern-agent-modal");
      if (modal) {
        modal.style.cssText = `
          background-color: #ffffff !important;
          color: #000000 !important;
        `;
      }

      // Forcer tous les éléments à rester clairs
      const allElements = modalElement.querySelectorAll("*");
      allElements.forEach((el) => {
        // Supprimer les styles de mode sombre
        const style = el.getAttribute("style");
        if (
          style &&
          (style.includes("#1f2937") ||
            style.includes("#374151") ||
            style.includes("#111827"))
        ) {
          el.removeAttribute("style");
        }
      });

      // Forcer spécifiquement certains éléments
      const headers = modalElement.querySelectorAll(".modern-modal-header");
      headers.forEach((header) => {
        header.style.cssText = `
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
          color: #ffffff !important;
        `;
      });

      const bodies = modalElement.querySelectorAll(
        ".modern-modal-body, .tab-content"
      );
      bodies.forEach((body) => {
        body.style.cssText = `
          background-color: #ffffff !important;
          color: #000000 !important;
        `;
      });

      const tables = modalElement.querySelectorAll(
        "table, th, td, .modern-operations-table"
      );
      tables.forEach((table) => {
        table.style.cssText = `
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #e5e7eb !important;
        `;
      });

      const buttons = modalElement.querySelectorAll(".btn, button");
      buttons.forEach((btn) => {
        // Ne pas modifier les boutons qui ont déjà des couleurs spécifiques
        if (
          !btn.classList.contains("btn-primary") &&
          !btn.classList.contains("btn-danger")
        ) {
          btn.style.backgroundColor = "#ffffff";
          btn.style.color = "#000000";
          btn.style.borderColor = "#d1d5db";
        }
      });

      const inputs = modalElement.querySelectorAll(
        "input, .form-control, select"
      );
      inputs.forEach((input) => {
        input.style.cssText = `
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #d1d5db !important;
        `;
      });
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
    { id: "statut", label: "Statut" },
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
      dateToDisplay = normalizeDateToMidnight(dateToDisplay);

      // Filtrer par `created_at` au lieu de `delivery_date`
      const agentDailyDeliveries = deliveries.filter((d) => {
        const createdAtDate =
          d.created_at instanceof Date && !isNaN(d.created_at.getTime())
            ? normalizeDateToMidnight(d.created_at)
            : null;

        return (
          d.employee_name === agentName &&
          createdAtDate &&
          createdAtDate.getTime() === dateToDisplay.getTime()
        );
      });

      // Calculer les données des 3 dernières années
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      threeYearsAgo.setHours(0, 0, 0, 0);

      const allAgentDeliveriesFilteredByDate = deliveries.filter(
        (d) =>
          d.employee_name === agentName &&
          d.created_at instanceof Date &&
          !isNaN(d.created_at.getTime()) &&
          d.created_at.getTime() >= threeYearsAgo.getTime()
      );

      agentDailyDeliveries.sort((a, b) => {
        const timeA = a.created_at || new Date(0);
        const timeB = b.created_at || new Date(0);
        return timeA.getTime() - timeB.getTime();
      });

      // Créer la nouvelle modal moderne
      createModernAgentModal(
        agentName,
        dateToDisplay,
        agentDailyDeliveries,
        allAgentDeliveriesFilteredByDate
      );
    } catch (error) {
      console.error("Error displaying agent activity:", error);
      showCustomAlert(`Erreur : ${error.message}`, "error");
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
    }
  }

  function createModernAgentModal(
    agentName,
    dateToDisplay,
    dailyDeliveries,
    allDeliveries
  ) {
    // Supprimer toute modal existante
    const existingModal = document.querySelector(".modern-agent-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const formattedDate = dateToDisplay.toLocaleDateString("fr-FR");

    // Créer l'overlay principal
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modern-agent-modal-overlay";
    modalOverlay.innerHTML = `
      <div class="modern-agent-modal">
        <div class="modern-modal-header">
          <div class="agent-header-info">
            <div class="agent-avatar-circle">
              <i class="fas fa-user-tie"></i>
            </div>
            <div class="agent-title-section">
              <h1 class="agent-modal-title">${agentName}</h1>
              <div class="date-navigation">
                <button class="date-nav-btn" id="prevDate" title="Jour précédent">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <p class="agent-modal-subtitle">Activité du ${formattedDate}</p>
                <button class="date-nav-btn" id="nextDate" title="Jour suivant">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
              <div class="quick-stats">
                <span class="stat-badge">
                  <i class="fas fa-tasks"></i>
                  ${dailyDeliveries.length} opération(s) aujourd'hui
                </span>
                <span class="stat-badge">
                  <i class="fas fa-history"></i>
                  ${allDeliveries.length} opérations totales
                </span>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="modern-btn danger-btn" id="deleteAllDailyOps">
              <i class="fas fa-trash-alt"></i>
              Supprimer les opérations du jour
            </button>
            <button class="modern-btn secondary-btn" id="closeAgentModal">
              <i class="fas fa-times"></i>
              Fermer
            </button>
          </div>
        </div>

        <div class="modern-modal-body">
          <div class="tab-navigation">
            <button class="tab-btn active" data-tab="operations">
              <i class="fas fa-list"></i>
              Opérations du jour
            </button>
            <button class="tab-btn" data-tab="analytics">
              <i class="fas fa-chart-bar"></i>
              Analyses & Statistiques
            </button>
            <button class="tab-btn" data-tab="history">
              <i class="fas fa-history"></i>
              Historique complet
            </button>
          </div>

          <div class="tab-content">
            <div class="tab-panel active" id="operations-panel">
              <div class="operations-header">
                <h3>Opérations du ${formattedDate}</h3>
                <div class="operations-summary">
                  ${
                    dailyDeliveries.length > 0
                      ? `
                    <div class="summary-cards">
                      <div class="summary-card operations-card">
                        <i class="fas fa-shipping-fast"></i>
                        <div class="card-content">
                          <span class="card-number">${
                            dailyDeliveries.length
                          }</span>
                          <span class="card-label">Opérations</span>
                        </div>
                      </div>
                      <div class="summary-card containers-card">
                        <i class="fas fa-boxes"></i>
                        <div class="card-content">
                          <span class="card-number">${dailyDeliveries.reduce(
                            (sum, d) => sum + (d.number_of_containers || 0),
                            0
                          )}</span>
                          <span class="card-label">Conteneurs</span>
                        </div>
                      </div>
                      <div class="summary-card dossiers-card">
                        <i class="fas fa-file-alt"></i>
                        <div class="card-content">
                          <span class="card-number">${
                            new Set(
                              dailyDeliveries
                                .map((d) => d.dossier_number)
                                .filter(Boolean)
                            ).size
                          }</span>
                          <span class="card-label">Dossiers</span>
                        </div>
                      </div>
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
              <div class="operations-table-container">
                ${createOperationsTable(dailyDeliveries)}
              </div>
            </div>

            <div class="tab-panel" id="analytics-panel">
              ${createAnalyticsPanel(allDeliveries)}
            </div>

            <div class="tab-panel" id="history-panel">
              ${createHistoryPanel(allDeliveries)}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    // ADAPTER LA MODAL D'ACTIVITÉ AU MODE ACTUEL (SOMBRE OU CLAIR)
    setTimeout(() => {
      forceModalActivityAdaptiveMode(modalOverlay);
    }, 10);

    // Ajouter les event listeners
    setupModalEventListeners(
      modalOverlay,
      agentName,
      dateToDisplay,
      dailyDeliveries
    );
  }

  function createOperationsTable(deliveries) {
    if (deliveries.length === 0) {
      return `
        <div class="empty-state">
          <i class="fas fa-clipboard-list"></i>
          <h4>Aucune opération</h4>
          <p>Aucune opération trouvée pour cette date.</p>
        </div>
      `;
    }

    let tableHTML = `
      <div class="modern-table-wrapper">
        <table class="modern-operations-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Client</th>
              <th>Conteneurs</th>
              <th>Lieu</th>
              <th>Contenu</th>
              <th>N° Dossier</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    deliveries.forEach((delivery, index) => {
      const statusInfo = getStatusInfo(delivery.delivery_status_acconier);

      tableHTML += `
        <tr class="table-row" data-delivery-id="${delivery.id}">
          <td><span class="row-number">${index + 1}</span></td>
          <td>
            <div class="client-info">
              <div class="client-name">${delivery.client_name || "-"}</div>
              ${
                delivery.client_phone
                  ? `<div class="client-phone">${delivery.client_phone}</div>`
                  : ""
              }
            </div>
          </td>
          <td>
            <div class="container-info">
              <span class="container-count">${
                delivery.number_of_containers || 1
              }</span>
              <span class="container-numbers">${
                delivery.container_number || "-"
              }</span>
            </div>
          </td>
          <td><span class="location">${delivery.lieu || "-"}</span></td>
          <td><span class="content">${
            delivery.container_type_and_content || "-"
          }</span></td>
          <td><span class="dossier">${
            delivery.dossier_number || "-"
          }</span></td>
          <td>
            <span class="modern-status-badge" data-status="${
              delivery.delivery_status_acconier || "unknown"
            }" data-status-text="${statusInfo.text}">
              <i class="fas ${statusInfo.iconClass}"></i>
              <span class="status-text">${statusInfo.text}</span>
            </span>
          </td>
          <td>
            <button class="action-btn delete-btn" data-delivery-id="${
              delivery.id
            }" title="Supprimer">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tableHTML += `
          </tbody>
        </table>
      </div>
    `;

    return tableHTML;
  }

  function createAnalyticsPanel(allDeliveries) {
    const monthlyStats = calculateMonthlyStats(allDeliveries);
    const statusDistribution = calculateStatusDistribution(allDeliveries);
    const containerTypes = calculateContainerTypes(allDeliveries);

    return `
      <div class="analytics-container">
        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="card-header">
              <h4><i class="fas fa-chart-line"></i> Statistiques générales</h4>
            </div>
            <div class="card-body">
              <div class="stat-row">
                <span class="stat-label">Total opérations :</span>
                <span class="stat-value">${allDeliveries.length}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Conteneurs traités :</span>
                <span class="stat-value">${allDeliveries.reduce(
                  (sum, d) => sum + (d.number_of_containers || 0),
                  0
                )}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Dossiers uniques :</span>
                <span class="stat-value">${
                  new Set(
                    allDeliveries.map((d) => d.dossier_number).filter(Boolean)
                  ).size
                }</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Première opération :</span>
                <span class="stat-value">${
                  allDeliveries.length > 0
                    ? new Date(
                        Math.min(
                          ...allDeliveries.map(
                            (d) => d.created_at?.getTime() || 0
                          )
                        )
                      ).toLocaleDateString("fr-FR")
                    : "-"
                }</span>
              </div>
            </div>
          </div>

          <div class="analytics-card">
            <div class="card-header">
              <h4><i class="fas fa-chart-pie"></i> Répartition des statuts</h4>
            </div>
            <div class="card-body">
              ${Object.entries(statusDistribution)
                .map(
                  ([status, count]) => `
                <div class="status-row">
                  <span class="status-label">${status}</span>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${
                      (count / allDeliveries.length) * 100
                    }%"></div>
                  </div>
                  <span class="status-count">${count}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="analytics-card full-width">
            <div class="card-header">
              <h4><i class="fas fa-boxes"></i> Types de conteneurs</h4>
            </div>
            <div class="card-body">
              <div class="container-types-grid">
                ${Object.entries(containerTypes)
                  .map(
                    ([type, count]) => `
                  <div class="container-type-item">
                    <span class="type-name">${type}</span>
                    <span class="type-count">${count}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function createHistoryPanel(allDeliveries) {
    const dailyData = groupDeliveriesByDay(allDeliveries);
    const sortedDays = Object.keys(dailyData).sort((a, b) =>
      b.localeCompare(a)
    );

    return `
      <div class="history-container">
        <div class="history-header">
          <h3><i class="fas fa-history"></i> Historique des opérations</h3>
          <p class="history-subtitle">Consultez les opérations par date</p>
          <div class="date-selector">
            <label for="historyDatePicker">Sélectionner une date :</label>
            <input type="date" id="historyDatePicker" class="date-picker-input" max="${
              new Date().toISOString().split("T")[0]
            }">
            <button id="viewDateOperations" class="view-date-btn">
              <i class="fas fa-search"></i>
              Voir les opérations
            </button>
          </div>
        </div>
        
        <div id="selectedDateOperations" class="selected-date-section" style="display: none;">
          <!-- Les opérations de la date sélectionnée apparaîtront ici -->
        </div>
        
        <div class="history-timeline">
          <h4 class="timeline-title">Chronologie des dernières opérations</h4>
          ${sortedDays
            .slice(0, 10)
            .map((date) => {
              const deliveries = dailyData[date];
              return `
            <div class="timeline-item" data-date="${date}">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <h4>${formatDateFr(date)}</h4>
                  <span class="timeline-count">${
                    deliveries.length
                  } opération(s)</span>
                </div>
                <div class="timeline-stats">
                  <div class="timeline-stat">
                    <i class="fas fa-boxes"></i>
                    <span>${deliveries.reduce(
                      (sum, d) => sum + (d.number_of_containers || 0),
                      0
                    )} conteneurs</span>
                  </div>
                  <div class="timeline-stat">
                    <i class="fas fa-file-alt"></i>
                    <span>${
                      new Set(
                        deliveries.map((d) => d.dossier_number).filter(Boolean)
                      ).size
                    } dossiers</span>
                  </div>
                </div>
                <div class="timeline-details">
                  <button class="view-day-btn" data-date="${date}">
                    <i class="fas fa-eye"></i>
                    Voir les opérations du jour
                  </button>
                </div>
              </div>
            </div>
          `;
            })
            .join("")}
          ${
            sortedDays.length > 10
              ? `
            <div class="timeline-more">
              <p>Et ${
                sortedDays.length - 10
              } autres jours avec des opérations...</p>
              <p class="text-small">Utilisez le sélecteur de date ci-dessus pour consulter une date spécifique.</p>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  function setupModalEventListeners(
    modalOverlay,
    agentName,
    dateToDisplay,
    dailyDeliveries
  ) {
    // Fermeture de la modal
    const closeBtn = modalOverlay.querySelector("#closeAgentModal");
    const overlay = modalOverlay; // L'overlay est l'élément racine

    closeBtn.addEventListener("click", () => {
      // Nettoyer l'observateur avant de supprimer la modal
      if (modalOverlay._darkModeObserver) {
        modalOverlay._darkModeObserver.disconnect();
      }
      modalOverlay.remove();
      hideAgentActivityBox();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        // Nettoyer l'observateur avant de supprimer la modal
        if (modalOverlay._darkModeObserver) {
          modalOverlay._darkModeObserver.disconnect();
        }
        modalOverlay.remove();
        hideAgentActivityBox();
      }
    });

    // Navigation entre les dates
    const prevDateBtn = modalOverlay.querySelector("#prevDate");
    const nextDateBtn = modalOverlay.querySelector("#nextDate");

    // Vérifier si nous sommes à la date d'aujourd'hui pour désactiver le bouton suivant
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDisplayDate = new Date(dateToDisplay);
    currentDisplayDate.setHours(0, 0, 0, 0);

    if (currentDisplayDate.getTime() >= today.getTime()) {
      nextDateBtn.disabled = true;
      nextDateBtn.style.opacity = "0.5";
      nextDateBtn.style.cursor = "not-allowed";
    }

    prevDateBtn.addEventListener("click", () => {
      const newDate = new Date(dateToDisplay);
      newDate.setDate(newDate.getDate() - 1);
      modalOverlay.remove();
      showAgentActivity(agentName, newDate);
    });

    nextDateBtn.addEventListener("click", () => {
      const newDate = new Date(dateToDisplay);
      newDate.setDate(newDate.getDate() + 1);
      // Ne pas permettre d'aller dans le futur
      if (newDate <= new Date()) {
        modalOverlay.remove();
        showAgentActivity(agentName, newDate);
      }
    });

    // Suppression des opérations du jour
    const deleteAllBtn = modalOverlay.querySelector("#deleteAllDailyOps");
    deleteAllBtn.addEventListener("click", () => {
      const deliveryIdsToDelete = dailyDeliveries.map((d) => d.id);
      if (deliveryIdsToDelete.length === 0) {
        showCustomAlert(
          "Aucune opération à supprimer pour cette journée.",
          "info"
        );
        return;
      }

      showConfirmationModal(
        `Êtes-vous sûr de vouloir supprimer les ${
          deliveryIdsToDelete.length
        } opérations de l'agent "${agentName}" pour le ${dateToDisplay.toLocaleDateString(
          "fr-FR"
        )} ? Cette action est irréversible.`,
        async () => {
          await deleteDeliveries(deliveryIdsToDelete);
          modalOverlay.remove();
          showAgentActivity(agentName, dateToDisplay);
        }
      );
    });

    // Navigation par onglets
    const tabBtns = modalOverlay.querySelectorAll(".tab-btn");
    const tabPanels = modalOverlay.querySelectorAll(".tab-panel");

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab;

        // Mise à jour des boutons
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Mise à jour des panneaux
        tabPanels.forEach((panel) => {
          panel.classList.remove("active");
          if (panel.id === `${targetTab}-panel`) {
            panel.classList.add("active");
          }
        });
      });
    });

    // Suppression d'opérations individuelles
    const deleteButtons = modalOverlay.querySelectorAll(".delete-btn");
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const deliveryId = btn.dataset.deliveryId;
        deleteDelivery(deliveryId);
      });
    });

    // Gestion du sélecteur de date dans l'historique
    const historyDatePicker = modalOverlay.querySelector("#historyDatePicker");
    const viewDateBtn = modalOverlay.querySelector("#viewDateOperations");
    const selectedDateSection = modalOverlay.querySelector(
      "#selectedDateOperations"
    );

    if (historyDatePicker && viewDateBtn && selectedDateSection) {
      viewDateBtn.addEventListener("click", () => {
        const selectedDate = historyDatePicker.value;
        if (selectedDate) {
          // Filtrer les livraisons pour la date sélectionnée
          const allAgentDeliveries = deliveries.filter(
            (d) => d.employee_name === agentName
          );
          const selectedDateDeliveries = allAgentDeliveries.filter((d) => {
            const createdDate = d.created_at?.toISOString().substring(0, 10);
            return createdDate === selectedDate;
          });

          // Afficher les opérations de la date sélectionnée
          selectedDateSection.style.display = "block";
          selectedDateSection.innerHTML = `
            <div class="selected-date-header">
              <h4><i class="fas fa-calendar-day"></i> Opérations du ${formatDateFr(
                selectedDate
              )}</h4>
              <span class="operation-count">${
                selectedDateDeliveries.length
              } opération(s)</span>
            </div>
            <div class="selected-date-operations">
              ${createOperationsTable(selectedDateDeliveries)}
            </div>
          `;

          // Scroll vers la section
          selectedDateSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    }

    // Gestion des boutons "Voir les opérations du jour"
    const viewDayButtons = modalOverlay.querySelectorAll(".view-day-btn");
    viewDayButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const date = btn.dataset.date;
        if (historyDatePicker && selectedDateSection) {
          historyDatePicker.value = date;
          viewDateBtn.click(); // Déclencher l'affichage
        }
      });
    });

    // Échapper pour fermer
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        modalOverlay.remove();
        hideAgentActivityBox();
      }
    });
  }

  // Fonctions utilitaires pour les analyses
  function calculateMonthlyStats(deliveries) {
    const monthly = {};
    deliveries.forEach((d) => {
      const month = d.created_at?.toISOString().substring(0, 7) || "Unknown";
      if (!monthly[month]) monthly[month] = 0;
      monthly[month]++;
    });
    return monthly;
  }

  function calculateStatusDistribution(deliveries) {
    const distribution = {};
    deliveries.forEach((d) => {
      const statusInfo = getStatusInfo(d.delivery_status_acconier);
      const status = statusInfo.text || "Non défini";
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return distribution;
  }

  function calculateContainerTypes(deliveries) {
    const types = {};
    deliveries.forEach((d) => {
      const type = d.container_type_and_content || "Non spécifié";
      types[type] = (types[type] || 0) + (d.number_of_containers || 1);
    });
    return types;
  }

  function groupDeliveriesByMonth(deliveries) {
    const monthly = {};
    deliveries.forEach((d) => {
      const month = d.created_at?.toISOString().substring(0, 7) || "Unknown";
      if (!monthly[month]) monthly[month] = [];
      monthly[month].push(d);
    });
    return monthly;
  }

  function formatMonthYear(monthStr) {
    if (monthStr === "Unknown") return "Date inconnue";
    const [year, month] = monthStr.split("-");
    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  function groupDeliveriesByDay(deliveries) {
    const daily = {};
    deliveries.forEach((d) => {
      const day = d.created_at?.toISOString().substring(0, 10) || "Unknown";
      if (!daily[day]) daily[day] = [];
      daily[day].push(d);
    });
    return daily;
  }

  function formatDateFr(dateStr) {
    if (dateStr === "Unknown") return "Date inconnue";
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

        // Prioriser container_numbers_list sur container_number
        if (
          d2.container_numbers_list &&
          Array.isArray(d2.container_numbers_list) &&
          d2.container_numbers_list.length > 0
        ) {
          tcList = d2.container_numbers_list.filter(Boolean);
        } else if (d2.container_number) {
          if (d2.container_number.includes("+")) {
            console.warn(
              `[STAT SYNC] ⚠️ Données tronquées détectées pour ${d2.id}: ${d2.container_number}`
            );
            tcList = [d2.container_number.split("+")[0].trim()];
          } else if (Array.isArray(d2.container_number)) {
            tcList = d2.container_number.filter(Boolean);
          } else if (typeof d2.container_number === "string") {
            tcList = d2.container_number.split(/[,;\s]+/).filter(Boolean);
          }
        }

        allContainers = allContainers.concat(tcList);
      });
      allContainers = Array.from(new Set(allContainers));
      const total = allContainers.length;
      let delivered = 0;
      allContainers.forEach((tc) => {
        const found = allSameDossier.find((d2) => {
          let tcList = [];

          // Prioriser container_numbers_list sur container_number
          if (
            d2.container_numbers_list &&
            Array.isArray(d2.container_numbers_list) &&
            d2.container_numbers_list.length > 0
          ) {
            tcList = d2.container_numbers_list.filter(Boolean);
          } else if (d2.container_number) {
            if (d2.container_number.includes("+")) {
              tcList = [d2.container_number.split("+")[0].trim()];
            } else if (Array.isArray(d2.container_number)) {
              tcList = d2.container_number.filter(Boolean);
            } else if (typeof d2.container_number === "string") {
              tcList = d2.container_number.split(/[,;\s]+/).filter(Boolean);
            }
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
      // Génère le texte simplifié
      let statutGeneral = "-";
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

    // Statut de livraison (Resp. Aconiés)
    let acconierStatusText = Object.entries(summaryData.acconierStatusCounts)
      .map(([status, count]) => `${count} ${status}`)
      .join(", ");
    parentElement.appendChild(
      createSummaryItem(
        "Statut de livraison (Resp. Acconiers)",
        acconierStatusText || "-"
      )
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

    // --- Daily Summary Section with professional styling ---
    const currentDaySummaryBlock = document.createElement("div");
    currentDaySummaryBlock.classList.add(
      "professional-summary-block",
      "daily-summary"
    );

    const currentDayHeader = document.createElement("div");
    currentDayHeader.classList.add("professional-summary-header");
    currentDayHeader.innerHTML = `
      <div class="summary-header-content">
        <div class="summary-icon">
          <i class="fas fa-calendar-day"></i>
        </div>
        <div class="summary-title">
          <h4>Résumé du jour actuel</h4>
          <p class="summary-subtitle">${currentAgentActivityDate.toLocaleDateString(
            "fr-FR"
          )}</p>
        </div>
      </div>
    `;
    currentDaySummaryBlock.appendChild(currentDayHeader);
    renderSummaryItems(currentDaySummaryBlock, dailySummaryData);
    agentSummarySection.appendChild(currentDaySummaryBlock);

    // --- Grand Totals Calculations ---
    const grandTotalSummaryData = calculateSummaryData(
      allAgentDeliveriesFilteredByDate
    ); // Use filtered data here

    // --- Grand Totals Section with professional styling ---
    const grandTotalContainer = document.createElement("div");
    grandTotalContainer.classList.add(
      "professional-summary-block",
      "grand-total-summary"
    );

    const grandTotalHeader = document.createElement("div");
    grandTotalHeader.classList.add("professional-summary-header");
    grandTotalHeader.innerHTML = `
      <div class="summary-header-content">
        <div class="summary-icon grand-total-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="summary-title">
          <h4>Grand Total Historique</h4>
          <p class="summary-subtitle">Données complètes sur 3 ans</p>
        </div>
      </div>
    `;
    grandTotalContainer.appendChild(grandTotalHeader);
    renderSummaryItems(grandTotalContainer, grandTotalSummaryData);
    agentSummarySection.appendChild(grandTotalContainer);

    // --- Add the professional "View Full History" button ---
    const toggleHistoryButton = document.createElement("button");
    toggleHistoryButton.id = "toggleMonthlyHistoryBtn";
    toggleHistoryButton.classList.add(
      "professional-btn",
      "professional-btn-primary",
      "history-toggle-btn"
    );
    toggleHistoryButton.innerHTML = `
      <i class="fas fa-history"></i>
      <span>Voir Historique Complet</span>
      <i class="fas fa-chevron-down toggle-icon"></i>
    `;
    agentSummarySection.appendChild(toggleHistoryButton);

    // --- Monthly History (New Section) ---
    const monthlyHistoryContainer = document.createElement("div");
    monthlyHistoryContainer.classList.add("monthly-history-section");
    monthlyHistoryContainer.id = "agentMonthlyHistorySection";
    monthlyHistoryContainer.style.display = "none"; // Initially hidden

    const monthlyHistoryHeader = document.createElement("div");
    monthlyHistoryHeader.classList.add("professional-summary-header");
    monthlyHistoryHeader.innerHTML = `
      <div class="summary-header-content">
        <div class="summary-icon">
          <i class="fas fa-history"></i>
        </div>
        <div class="summary-title">
          <h4>Historique par mois</h4>
          <p class="summary-subtitle">Détail des opérations sur 3 ans</p>
        </div>
      </div>
    `;
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
      monthDiv.classList.add("monthly-summary-item");

      const monthName = new Date(monthKey + "-01").toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
      });
      const monthHeader = document.createElement("h5");
      monthHeader.innerHTML = `<i class="fas fa-calendar-alt"></i> ${monthName}`;
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
        toggleHistoryButton.innerHTML = `
          <i class="fas fa-history"></i>
          <span>Masquer Historique</span>
          <i class="fas fa-chevron-up toggle-icon"></i>
        `;
        toggleHistoryButton.classList.add("active");
        agentActivityBox.scrollTop = agentActivityBox.scrollHeight;
      } else {
        monthlyHistoryContainer.style.display = "none";
        toggleHistoryButton.innerHTML = `
          <i class="fas fa-history"></i>
          <span>Voir Historique Complet</span>
          <i class="fas fa-chevron-down toggle-icon"></i>
        `;
        toggleHistoryButton.classList.remove("active");
      }
    };
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
          "bl_status_update", // Ajout ici pour notifier et rafraîchir sur ce type
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
          message.type === "bl_status_update" || // Ajout ici pour rafraîchir le tableau
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
    // === AJOUT BOUTON VUE DOSSIERS CLIENTS ===
    const toggleSelectionBtn = document.getElementById("toggleSelectionBtn");

    // Vérifier si le bouton existe déjà pour éviter la duplication
    let dossiersBtn = document.getElementById("viewClientFoldersBtn");
    if (!dossiersBtn) {
      dossiersBtn = document.createElement("button");
      dossiersBtn.id = "viewClientFoldersBtn";
      dossiersBtn.innerHTML =
        '<i class="fas fa-folder" style="color: #f59e0b;"></i> Vue Dossiers Clients';
      dossiersBtn.className = "icon-btn-company-color";
      dossiersBtn.style.fontSize = "0.8em";
      dossiersBtn.style.padding = "6px 12px";
      dossiersBtn.style.marginLeft = "20px";
      dossiersBtn.style.marginRight = "20px";
      dossiersBtn.addEventListener("click", showClientFoldersModal);

      // Insère le bouton après Activer Sélection
      if (toggleSelectionBtn && toggleSelectionBtn.parentNode) {
        toggleSelectionBtn.parentNode.insertBefore(
          dossiersBtn,
          toggleSelectionBtn.nextSibling
        );
      } else if (deliveriesTable && deliveriesTable.parentNode) {
        deliveriesTable.parentNode.insertBefore(dossiersBtn, deliveriesTable);
      }
    }

    // Crée un conteneur pour la vue dossiers (masqué par défaut) - vérifier s'il existe déjà
    let clientFoldersContainer = document.getElementById(
      "clientFoldersContainer"
    );
    if (!clientFoldersContainer) {
      clientFoldersContainer = document.createElement("div");
      clientFoldersContainer.id = "clientFoldersContainer";
      clientFoldersContainer.style.display = "none";
      deliveriesTable.parentNode.insertBefore(
        clientFoldersContainer,
        deliveriesTable
      );
    }

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

      let displayStatus =
        op.delivery_status_acconier_fr ||
        mapStatus(op.delivery_status_acconier || op.status || "");

      // Nouvelle version : chaque info dans une "carte" moderne, responsive, business-friendly
      modalContent.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px 20px;">
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:10px;box-shadow:0 2px 12px #2563eb11;padding:12px 14px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.85em;color:#64748b;font-weight:600;margin-bottom:3px;">Agent</span>
            <span style="font-size:1.0em;font-weight:700;color:#1e293b;">${
              op.employee_name || "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:10px;box-shadow:0 2px 12px #2563eb11;padding:12px 14px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.85em;color:#64748b;font-weight:600;margin-bottom:3px;">Date</span>
            <span style="font-size:1.0em;font-weight:700;color:#1e293b;">${
              op.created_at
                ? new Date(op.created_at).toLocaleDateString("fr-FR")
                : "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#fde047 60%,#facc15 100%);border-radius:10px;box-shadow:0 2px 12px #facc1533;padding:12px 14px;display:flex;flex-direction:column;align-items:flex-start;border:2px solid #eab308;">
            <span style="font-size:0.85em;color:#78350f;font-weight:600;margin-bottom:3px;">Client</span>
            <span style="font-size:1.0em;font-weight:700;color:#78350f;">${
              op.client_name || "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#fde047 60%,#facc15 100%);border-radius:10px;box-shadow:0 2px 12px #facc1533;padding:12px 14px;display:flex;flex-direction:column;align-items:flex-start;border:2px solid #eab308;">
            <span style="font-size:0.85em;color:#78350f;font-weight:600;margin-bottom:3px;">N° Dossier</span>
            <span style="font-size:1.0em;font-weight:800;color:#78350f;letter-spacing:0.5px;">${
              op.dossier_number || op.dossier || "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:10px;box-shadow:0 2px 12px #2563eb11;padding:12px 14px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.85em;color:#64748b;font-weight:600;margin-bottom:3px;">Conteneur</span>
            <span style="font-size:1.0em;font-weight:700;color:#1e293b;">${
              op.container_number || "-"
            }</span>
          </div>
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:10px;box-shadow:0 2px 12px #2563eb11;padding:12px 14px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.85em;color:#64748b;font-weight:600;margin-bottom:3px;">Statut</span>
            <span style="font-size:1.0em;font-weight:700;color:#2563eb;">${displayStatus}</span>
          </div>
          <div style="background:linear-gradient(90deg,#f1f5f9 60%,#e0e7ef 100%);border-radius:10px;box-shadow:0 2px 12px #2563eb11;padding:12px 14px;display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.85em;color:#64748b;font-weight:600;margin-bottom:3px;">Observation</span>
            <span style="font-size:1.0em;font-weight:500;color:#334155;">${
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
    // === NOUVELLE MODAL ULTRA-MODERNE ET PROFESSIONNELLE POUR DOSSIERS CLIENTS ===
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

      // Overlay ultra-moderne PLEIN ÉCRAN
      const overlay = document.createElement("div");
      overlay.id = "clientFoldersModal";
      overlay.className = "enterprise-modal-overlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
        backdrop-filter: blur(25px) saturate(160%);
        -webkit-backdrop-filter: blur(25px) saturate(160%);
        z-index: 10000;
        display: flex;
        align-items: stretch;
        justify-content: stretch;
        opacity: 0;
        transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        padding: 0;
        margin: 0;
        overflow: hidden;
      `;

      // Container principal PLEIN ÉCRAN avec design ultra-premium
      const box = document.createElement("div");
      box.className = "enterprise-modal-container";
      box.style.cssText = `
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
        border-radius: 0;
        box-shadow: 
          inset 0 2px 0 rgba(255, 255, 255, 0.9),
          inset 0 -2px 0 rgba(0, 0, 0, 0.05);
        width: 100vw;
        height: 100vh;
        position: relative;
        overflow: hidden;
        transform: scale(0.85) translateY(80px);
        transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        border: none;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(15px);
        margin: 0;
        padding: 0;
      `;

      // Header ultra-premium PLEIN ÉCRAN avec gradient animé
      const header = document.createElement("div");
      header.className = "enterprise-modal-header";
      header.style.cssText = `
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #3b82f6 50%, #06b6d4 75%, #0891b2 100%);
        background-size: 300% 300%;
        animation: gradientShift 6s ease infinite;
        padding: 32px 48px;
        position: relative;
        overflow: hidden;
        border-radius: 0;
        box-shadow: 
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          0 4px 20px rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
        min-height: 100px;
      `;

      // Effet de particules animées dans le header
      const headerParticles = document.createElement("div");
      headerParticles.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.15) 2px, transparent 2px),
          radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
        background-size: 100px 100px, 60px 60px, 80px 80px, 120px 120px;
        animation: particlesFloat 8s linear infinite;
        opacity: 0.6;
      `;
      header.appendChild(headerParticles);

      // Effet de brillance premium dans le header
      const headerShine = document.createElement("div");
      headerShine.style.cssText = `
        position: absolute;
        top: 0;
        left: -150%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(255, 255, 255, 0.4) 25%,
          rgba(255, 255, 255, 0.6) 50%,
          rgba(255, 255, 255, 0.4) 75%,
          transparent 100%);
        animation: shine 4s ease-in-out infinite;
        transform: skewX(-20deg);
      `;
      header.appendChild(headerShine);

      // Contenu du header avec design premium + contrôles
      const headerContent = document.createElement("div");
      headerContent.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        z-index: 3;
        width: 100%;
      `;

      // Section gauche : Icône et titre
      const headerLeft = document.createElement("div");
      headerLeft.style.cssText = `
        display: flex;
        align-items: center;
        gap: 20px;
        color: white;
      `;

      // Création du conteneur de titre modifiable
      const headerTitle = document.createElement("div");
      const headerTitleContent = `
        <div style="text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">
          <div style="
            font-size: 1.75rem; 
            font-weight: 800; 
            margin-bottom: 6px;
            letter-spacing: -0.5px;
            background: linear-gradient(90deg, #ffffff 0%, #e2e8f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">
            Dossiers des clients
          </div>
          <div style="
            background: linear-gradient(90deg, #facc15 0%, #fbbf24 100%);
            color: #78350f;
            font-size: 0.95rem;
            font-weight: 700;
            padding: 6px 16px;
            border-radius: 25px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
            border: 1px solid rgba(120, 53, 15, 0.2);
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
            </svg>
            Vue entreprise premium
          </div>
        </div>
      `;
      headerTitle.innerHTML = headerTitleContent;

      headerLeft.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #facc15 0%, #f59e0b 50%, #d97706 100%);
          padding: 16px;
          border-radius: 20px;
          box-shadow: 
            0 12px 24px rgba(251, 191, 36, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
            animation: iconShine 3s ease-in-out infinite;
          "></div>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#78350f" stroke-width="2.5" style="position: relative; z-index: 1;">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <path d="M8 11h8M8 15h6"/>
            <circle cx="6" cy="6" r="2" fill="#78350f" opacity="0.3"/>
          </svg>
        </div>
      `;

      // Ajouter le titre au header gauche
      headerLeft.appendChild(headerTitle);

      // Section centre : Contrôles (recherche + boutons)
      const headerCenter = document.createElement("div");
      headerCenter.style.cssText = `
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        max-width: 600px;
        margin: 0 40px;
      `;

      // Barre de recherche dans le header
      const headerSearchBar = document.createElement("input");
      headerSearchBar.type = "text";
      headerSearchBar.placeholder =
        "🔍 Rechercher un agent, client ou dossier...";
      headerSearchBar.style.cssText = `
        flex: 1;
        padding: 10px 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        color: white;
        font-size: 14px;
        outline: none;
        transition: all 0.3s ease;
        ::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
      `;
      headerSearchBar.setAttribute("autocomplete", "off");
      headerSearchBar.setAttribute("spellcheck", "false");

      headerSearchBar.onfocus = () => {
        headerSearchBar.style.background = "rgba(255, 255, 255, 0.2)";
        headerSearchBar.style.borderColor = "rgba(255, 255, 255, 0.4)";
        headerSearchBar.style.boxShadow = "0 4px 12px rgba(255, 255, 255, 0.1)";
      };
      headerSearchBar.onblur = () => {
        headerSearchBar.style.background = "rgba(255, 255, 255, 0.1)";
        headerSearchBar.style.borderColor = "rgba(255, 255, 255, 0.2)";
        headerSearchBar.style.boxShadow = "none";
      };

      // Boutons Liste/Archives dans le header
      const headerBtnContainer = document.createElement("div");
      headerBtnContainer.style.cssText = `
        display: flex;
        gap: 8px;
      `;

      // Bouton Liste
      const headerBtnListe = document.createElement("button");
      headerBtnListe.textContent = "📋 Dossiers actifs";
      headerBtnListe.style.cssText = `
        padding: 8px 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 15px;
        background: rgba(37, 99, 235, 0.8);
        color: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      `;

      // Bouton Archives
      const headerBtnArchives = document.createElement("button");
      headerBtnArchives.textContent = "📦 Archives";
      headerBtnArchives.style.cssText = `
        padding: 8px 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      `;

      headerBtnContainer.appendChild(headerBtnListe);
      headerBtnContainer.appendChild(headerBtnArchives);

      headerCenter.appendChild(headerSearchBar);
      headerCenter.appendChild(headerBtnContainer);

      // Section droite : Bouton fermeture
      const headerRight = document.createElement("div");
      headerRight.style.cssText = `
        display: flex;
        align-items: center;
      `;

      // Bouton de fermeture ultra-moderne
      const closeBtn = document.createElement("button");
      closeBtn.className = "enterprise-close-btn";
      closeBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.15);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        backdrop-filter: blur(15px);
        color: white;
        font-size: 1.8rem;
        font-weight: 300;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      `;
      closeBtn.innerHTML = "×";

      headerRight.appendChild(closeBtn);

      // Effet de hover ultra-premium pour le bouton fermer
      closeBtn.onmouseover = () => {
        closeBtn.style.background = "rgba(239, 68, 68, 0.9)";
        closeBtn.style.transform = "scale(1.15) rotate(90deg)";
        closeBtn.style.borderColor = "rgba(255, 255, 255, 0.6)";
        closeBtn.style.boxShadow = "0 8px 24px rgba(239, 68, 68, 0.4)";
      };
      closeBtn.onmouseout = () => {
        closeBtn.style.background = "rgba(255, 255, 255, 0.15)";
        closeBtn.style.transform = "scale(1) rotate(0deg)";
        closeBtn.style.borderColor = "rgba(255, 255, 255, 0.3)";
        closeBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
      };

      // Assemblage du header
      headerContent.appendChild(headerLeft);
      headerContent.appendChild(headerCenter);
      headerContent.appendChild(headerRight);
      header.appendChild(headerContent);

      // Corps de la modal PLEIN ÉCRAN avec plus d'espace pour les cartes
      const content = document.createElement("div");
      content.className = "enterprise-modal-body";
      content.style.cssText = `
        padding: 20px 48px 40px 48px;
        overflow-y: hidden;
        flex: 1;
        background: 
          linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%),
          radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.03) 0%, transparent 50%);
        border-radius: 0;
        position: relative;
        display: flex;
        flex-direction: column;
        height: calc(100vh - 120px);
        max-height: none;
      `;

      // Assemblage de la modal
      box.appendChild(header);
      box.appendChild(content);
      overlay.appendChild(box);

      // Animation d'entrée ultra-fluide
      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        overlay.style.opacity = "1";
        box.style.transform = "scale(1) translateY(0)";
      });

      // Gestion de la fermeture avec animation PLEIN ÉCRAN
      closeBtn.onclick = () => {
        overlay.style.opacity = "0";
        box.style.transform = "scale(0.85) translateY(80px)";
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = "auto";
          if (typeof deliveriesTable !== "undefined" && deliveriesTable)
            deliveriesTable.style.display = "table";
          if (clientFoldersContainer)
            clientFoldersContainer.style.display = "none";
          if (dossiersBtn) dossiersBtn.style.display = "inline-block";
        }, 600);
      };

      // Fermeture par clic sur l'overlay
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          closeBtn.click();
        }
      };

      // Fermeture par échap
      document.addEventListener("keydown", function escapeHandler(e) {
        if (e.key === "Escape") {
          closeBtn.click();
          document.removeEventListener("keydown", escapeHandler);
        }
      });

      // --- Configuration des contrôles du header ---
      let currentAgent = null;
      let searchValue = "";
      let agentListMainBox = null;
      let agentListTitle = null;
      let agentListNoResult = null;
      let agentListClientToggleBtn = null;
      let agentListClientListContainer = null;
      let showArchives = false;

      // Connexion des événements des contrôles du header
      headerSearchBar.oninput = (e) => {
        searchValue = e.target.value;
        renderAgentList(searchValue);
      };

      headerBtnListe.onclick = () => {
        showArchives = false;
        updateHeaderButtons();
        renderAgentList(searchValue);
      };

      headerBtnArchives.onclick = () => {
        showArchives = true;
        updateHeaderButtons();
        renderAgentList(searchValue);
      };

      function updateHeaderButtons() {
        if (showArchives) {
          headerBtnListe.style.background = "rgba(255, 255, 255, 0.1)";
          headerBtnListe.style.color = "rgba(255, 255, 255, 0.8)";
          headerBtnListe.style.borderColor = "rgba(255, 255, 255, 0.2)";

          headerBtnArchives.style.background = "rgba(37, 99, 235, 0.8)";
          headerBtnArchives.style.color = "white";
          headerBtnArchives.style.borderColor = "rgba(255, 255, 255, 0.3)";
        } else {
          headerBtnListe.style.background = "rgba(37, 99, 235, 0.8)";
          headerBtnListe.style.color = "white";
          headerBtnListe.style.borderColor = "rgba(255, 255, 255, 0.3)";

          headerBtnArchives.style.background = "rgba(255, 255, 255, 0.1)";
          headerBtnArchives.style.color = "rgba(255, 255, 255, 0.8)";
          headerBtnArchives.style.borderColor = "rgba(255, 255, 255, 0.2)";
        }
      }

      function renderAgentList(filter = "") {
        // Création unique des éléments DOM persistants
        if (!agentListMainBox) {
          content.innerHTML = "";
          currentAgent = null;

          // Titre avec design premium
          agentListTitle = document.createElement("div");
          agentListTitle.style.cssText = `
            font-weight: 700;
            font-size: 1.3em;
            margin-bottom: 24px;
            letter-spacing: -0.3px;
            line-height: 1.4;
            text-align: center;
            background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          `;

          const titleContent = showArchives
            ? `<div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Agents avec dossiers archivés</span>
                <span style="background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); color: #ffffff; font-size: 0.8em; font-weight: 600; padding: 4px 12px; border-radius: 12px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);">
                  +40 jours
                </span>
              </div>`
            : `<div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.5">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
                <span>Sélectionnez un agent</span>
                <span style="background: linear-gradient(90deg, #facc15 0%, #f59e0b 100%); color: #78350f; font-size: 0.8em; font-weight: 700; padding: 4px 12px; border-radius: 12px; box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);">
                  Premium
                </span>
              </div>`;

          agentListTitle.innerHTML = titleContent;
          content.appendChild(agentListTitle);

          // Boîte principale ultra-moderne PLEIN ÉCRAN avec plus d'espace
          agentListMainBox = document.createElement("div");
          agentListMainBox.className = "enterprise-main-box";
          agentListMainBox.style.cssText = `
            background: 
              linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%),
              radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 50%);
            border-radius: 16px;
            box-shadow: 
              0 8px 24px rgba(0, 0, 0, 0.08),
              0 4px 12px rgba(37, 99, 235, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(37, 99, 235, 0.08);
            padding: 32px 24px;
            margin: 0;
            max-width: none;
            width: 100%;
            flex: 1;
            height: calc(100vh - 200px);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 24px;
            backdrop-filter: blur(12px);
            position: relative;
          `;
          content.appendChild(agentListMainBox);

          // Message "aucun résultat" ultra-moderne
          agentListNoResult = document.createElement("div");
          agentListNoResult.style.cssText = `
            text-align: center;
            padding: 48px 32px;
            display: none;
            background: 
              linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%),
              radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.05) 0%, transparent 70%);
            border-radius: 20px;
            border: 2px solid rgba(37, 99, 235, 0.1);
            margin: 24px 0;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          `;

          agentListNoResult.innerHTML = `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
            ">
              <div style="
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 8px;
              ">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
              </div>
              <div style="
                font-size: 1.3em;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 8px;
              ">Aucun résultat trouvé</div>
              <div style="
                font-size: 1em;
                color: #64748b;
                font-weight: 500;
                max-width: 400px;
                line-height: 1.5;
              ">Aucun agent ou dossier ne correspond à votre recherche. Essayez avec des termes différents.</div>
            </div>
          `;
          content.appendChild(agentListNoResult);
          // Ajoute l'eventListener une seule fois
          headerSearchBar.oninput = (e) => {
            renderAgentList(e.target.value);
          };
        }
        // On met à jour la valeur du champ si besoin
        if (headerSearchBar.value !== filter) headerSearchBar.value = filter;
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
        // Affichage "aucun résultat" avec animation
        if (agentNames.length === 0) {
          agentListMainBox.innerHTML = "";
          agentListNoResult.style.display = "block";
          agentListNoResult.style.animation =
            "fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
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
        // --- Affichage agents ultra-premium, responsive, regroupés par lettre ---
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
          // Titre de la lettre avec design ultra-moderne
          const letterTitle = document.createElement("div");
          letterTitle.textContent = letter;
          letterTitle.style.cssText = `
            font-weight: 800;
            font-size: 1.8em;
            margin: 32px 0 20px 0;
            color: transparent;
            background: linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-align: center;
            position: relative;
            letter-spacing: 2px;
          `;
          agentListMainBox.appendChild(letterTitle);

          // Grille ultra-moderne pour les agents
          const grid = document.createElement("div");
          grid.className = "enterprise-agents-grid";

          grouped[letter].forEach((agent) => {
            // Carte agent ultra-premium
            const card = document.createElement("div");
            card.className = "enterprise-agent-card";

            // Avatar ultra-moderne
            const avatar = document.createElement("div");
            avatar.className = "enterprise-agent-avatar";
            avatar.textContent = agent
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();
            card.appendChild(avatar);

            // Container des informations
            const info = document.createElement("div");
            info.style.cssText = `
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              position: relative;
              z-index: 2;
            `;

            // Nom agent avec typo premium
            const name = document.createElement("div");
            name.textContent = agent;
            name.style.cssText = `
              font-weight: 800;
              font-size: 1.3em;
              letter-spacing: -0.3px;
              margin-bottom: 12px;
              color: #1e293b;
              background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            `;
            info.appendChild(name);

            // Badge ultra-moderne de dossiers
            const badge = document.createElement("span");
            const clientCount = Object.keys(foldersData[agent] || {}).length;
            badge.textContent =
              clientCount + " dossier" + (clientCount > 1 ? "s" : "");
            badge.className = "enterprise-dossier-badge";
            info.appendChild(badge);

            // Aperçu des clients avec design ultra-premium
            const clientNames = Object.keys(foldersData[agent] || {});
            if (clientNames.length > 0) {
              const preview = document.createElement("div");
              preview.style.cssText = `
                margin-top: 16px;
                padding: 16px;
                background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
                border-radius: 12px;
                border: 1px solid rgba(37, 99, 235, 0.1);
                width: 100%;
              `;

              const clientHeader = document.createElement("div");
              clientHeader.style.cssText = `
                font-weight: 700;
                color: #2563eb;
                margin-bottom: 8px;
                font-size: 0.95em;
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
              `;
              clientHeader.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Clients récents
              `;

              const clientList = document.createElement("div");
              clientList.style.cssText = `
                color: #1e293b;
                font-weight: 600;
                font-size: 0.9em;
                line-height: 1.4;
              `;
              clientList.textContent =
                clientNames.slice(-3).reverse().join(", ") +
                (clientNames.length > 3 ? "..." : "");

              preview.appendChild(clientHeader);
              preview.appendChild(clientList);
              info.appendChild(preview);
            }

            // Dates avec design ultra-premium
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
              datePreview.style.cssText = `
                margin-top: 12px;
                padding: 12px;
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
                border-radius: 12px;
                border: 1px solid rgba(16, 185, 129, 0.1);
                width: 100%;
              `;

              const dateHeader = document.createElement("div");
              dateHeader.style.cssText = `
                font-weight: 700;
                color: #10b981;
                margin-bottom: 6px;
                font-size: 0.9em;
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
              `;
              dateHeader.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                Dates récentes
              `;

              const dateList = document.createElement("div");
              dateList.style.cssText = `
                color: #1e293b;
                font-weight: 500;
                font-size: 0.85em;
              `;
              dateList.innerHTML =
                sortedDates
                  .slice(0, 2)
                  .map(
                    (date) =>
                      `<span style="color:#10b981;font-weight:600;">${date}</span>`
                  )
                  .join(", ") + (sortedDates.length > 2 ? "..." : "");

              datePreview.appendChild(dateHeader);
              datePreview.appendChild(dateList);
              info.appendChild(datePreview);
            }

            card.appendChild(info);

            // Bouton suppression ultra-moderne
            const deleteBtn = document.createElement("button");
            deleteBtn.title = "Supprimer l'agent";
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.style.cssText = `
              position: absolute;
              bottom: 16px;
              right: 16px;
              background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
              color: #78350f;
              border: none;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
              transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
              z-index: 10;
            `;

            deleteBtn.onmouseover = () => {
              deleteBtn.style.transform = "scale(1.15)";
              deleteBtn.style.background =
                "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";
              deleteBtn.style.color = "#ffffff";
              deleteBtn.style.boxShadow = "0 6px 20px rgba(220, 38, 38, 0.4)";
            };
            deleteBtn.onmouseout = () => {
              deleteBtn.style.transform = "scale(1)";
              deleteBtn.style.background =
                "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)";
              deleteBtn.style.color = "#78350f";
              deleteBtn.style.boxShadow = "0 4px 12px rgba(251, 191, 36, 0.3)";
            };

            deleteBtn.onclick = (e) => {
              e.stopPropagation();
              handleDeleteAgent(agent);
            };
            card.appendChild(deleteBtn);

            // Clic sur1 la carte = voir dossiers de l'agent
            card.onclick = (e) => {
              if (
                e.target === deleteBtn ||
                e.target.closest("button") === deleteBtn
              )
                return;
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

        // On met à jour le header pour indiquer qu'on est dans les dossiers d'un agent
        headerTitle.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <button id="backToAgentList" style="
              background: rgba(255, 255, 255, 0.2);
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 10px;
              padding: 8px 12px;
              color: white;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 0.9rem;
              font-weight: 600;
              transition: all 0.3s ease;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Retour
            </button>
            <div style="
              font-size: 1.5rem; 
              font-weight: 800; 
              color: white;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            ">
              Dossiers de ${agentName}
            </div>
          </div>
        `;

        // Événement pour le bouton retour
        document.getElementById("backToAgentList").onclick = () => {
          // Remettre le titre original
          headerTitle.innerHTML = headerTitleContent;
          // Réinitialiser les variables d'état
          currentAgent = null;
          searchValue = "";
          showArchives = false;
          // Réinitialiser les éléments DOM pour forcer le recréation
          agentListMainBox = null;
          agentListTitle = null;
          agentListNoResult = null;
          // Retourner à la vue principale initiale (image 2 - liste des agents)
          renderAgentList(
            "",
            content,
            headerSearchBar,
            foldersData,
            headerTitleContent,
            headerTitle
          );
          // Mettre à jour les boutons du header
          updateHeaderButtons();
        };

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
        // --- GRILLE ULTRA-COMPACTE AVEC SCROLL OPTIMISÉE ---
        const dossiersGrid = document.createElement("div");
        dossiersGrid.style.display = "grid";
        dossiersGrid.style.gridTemplateColumns =
          "repeat(auto-fill, minmax(280px, 1fr))";
        dossiersGrid.style.gap = "16px";
        dossiersGrid.style.marginTop = "12px";
        dossiersGrid.style.padding = "6px";
        dossiersGrid.style.maxHeight = "calc(100vh - 320px)";
        dossiersGrid.style.overflowY = "auto";
        dossiersGrid.style.overflowX = "hidden";
        dossiersGrid.style.scrollbarWidth = "thin";
        dossiersGrid.style.scrollbarColor =
          "rgba(37, 99, 235, 0.3) transparent";

        // Amélioration du scroll pour une expérience plus fluide
        dossiersGrid.style.scrollBehavior = "smooth";
        dossiersGrid.style.webkitOverflowScrolling = "touch";
        dossiersGrid.style.overscrollBehavior = "contain";

        // Styles personnalisés pour la scrollbar WebKit
        const scrollbarStyle = document.createElement("style");
        scrollbarStyle.textContent = `
          .dossiers-grid::-webkit-scrollbar {
            width: 12px;
          }
          .dossiers-grid::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 6px;
          }
          .dossiers-grid::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(59, 130, 246, 0.6) 100%);
            border-radius: 6px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          .dossiers-grid::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.6) 0%, rgba(59, 130, 246, 0.8) 100%);
          }
          .dossiers-grid::-webkit-scrollbar-thumb:active {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.8) 0%, rgba(59, 130, 246, 1) 100%);
          }
        `;
        document.head.appendChild(scrollbarStyle);
        dossiersGrid.classList.add("dossiers-grid");

        // Support tactile amélioré pour les appareils mobiles seulement
        let startY = 0;
        let currentY = 0;
        let isScrolling = false;

        dossiersGrid.addEventListener(
          "touchstart",
          function (e) {
            startY = e.touches[0].clientY;
            isScrolling = true;
            this.style.scrollBehavior = "auto";
          },
          { passive: true }
        );

        dossiersGrid.addEventListener(
          "touchmove",
          function (e) {
            if (!isScrolling) return;
            currentY = e.touches[0].clientY;
            const deltaY = startY - currentY;
            this.scrollTop += deltaY;
            startY = currentY;
          },
          { passive: true }
        );

        dossiersGrid.addEventListener(
          "touchend",
          function () {
            isScrolling = false;
            this.style.scrollBehavior = "smooth";
          },
          { passive: true }
        );

        clientNames.forEach((client) => {
          // Bloc client ultra-moderne compact (cartes jaunes optimisées)
          const clientBlock = document.createElement("div");
          clientBlock.style.cssText = `
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
            border: 2px solid rgba(217, 119, 6, 0.3);
            border-radius: 12px;
            box-shadow: 
              0 4px 16px rgba(251, 191, 36, 0.12),
              0 2px 8px rgba(217, 119, 6, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            padding: 16px;
            margin: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: stretch;
            overflow: hidden;
            position: relative;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            cursor: pointer;
            min-height: 160px;
            backdrop-filter: blur(10px);
          `;

          // Effet de brillance
          const shine = document.createElement("div");
          shine.style.cssText = `
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
            transform: rotate(45deg);
            transition: transform 0.6s ease;
            pointer-events: none;
          `;
          clientBlock.appendChild(shine);

          clientBlock.onmouseover = () => {
            clientBlock.style.transform = "translateY(-4px) scale(1.015)";
            clientBlock.style.boxShadow = `
              0 8px 24px rgba(251, 191, 36, 0.2),
              0 4px 12px rgba(217, 119, 6, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.4)
            `;
            shine.style.transform = "rotate(45deg) translateX(100%)";
          };
          clientBlock.onmouseout = () => {
            clientBlock.style.transform = "translateY(0) scale(1)";
            clientBlock.style.boxShadow = `
              0 6px 24px rgba(251, 191, 36, 0.15),
              0 3px 12px rgba(217, 119, 6, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.3)
            `;
            shine.style.transform = "rotate(45deg) translateX(-100%)";
          };

          // Header TRÈS compact avec icône et titre mini
          const headerSection = document.createElement("div");
          headerSection.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            position: relative;
            z-index: 2;
          `;

          const clientIcon = document.createElement("div");
          clientIcon.style.cssText = `
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
          `;
          clientIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#78350f" stroke-width="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          `;

          const clientTitle = document.createElement("div");
          clientTitle.textContent = client;
          clientTitle.style.cssText = `
            font-weight: 800;
            font-size: 0.95em;
            color: #78350f;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            letter-spacing: -0.1px;
            flex: 1;
            line-height: 1.2;
          `;

          headerSection.appendChild(clientIcon);
          headerSection.appendChild(clientTitle);
          clientBlock.appendChild(headerSection);

          // On stocke toutes les opérations de ce client pour cet agent (toutes dates)
          let allOps = [];
          const dates = Object.keys(foldersData[agentName][client] || {})
            .sort()
            .reverse();
          dates.forEach((date) => {
            allOps = allOps.concat(foldersData[agentName][client][date]);
          });

          // Section des statistiques modernes
          const statsSection = document.createElement("div");
          statsSection.style.cssText = `
            display: flex;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 24px;
            position: relative;
            z-index: 2;
          `;

          const operationsCount = document.createElement("div");
          operationsCount.style.cssText = `
            background: rgba(255, 255, 255, 0.25);
            border-radius: 12px;
            padding: 16px;
            flex: 1;
            text-align: center;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          `;
          operationsCount.innerHTML = `
            <div style="font-size: 1.8em; font-weight: 800; color: #78350f; margin-bottom: 6px;">
              ${allOps.length}
            </div>
            <div style="font-size: 0.9em; color: #92400e; font-weight: 600;">
              Opération${allOps.length > 1 ? "s" : ""}
            </div>
          `;

          const lastDate = document.createElement("div");
          lastDate.style.cssText = `
            background: rgba(255, 255, 255, 0.25);
            border-radius: 12px;
            padding: 16px;
            flex: 1;
            text-align: center;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          `;
          lastDate.innerHTML = `
            <div style="font-size: 1.3em; font-weight: 700; color: #78350f; margin-bottom: 6px;">
              ${dates[0] || "-"}
            </div>
            <div style="font-size: 0.9em; color: #92400e; font-weight: 600;">
              Dernière date
            </div>
          `;

          statsSection.appendChild(operationsCount);
          statsSection.appendChild(lastDate);
          clientBlock.appendChild(statsSection);

          // Footer avec bouton d'export moderne
          const footerSection = document.createElement("div");
          footerSection.style.cssText = `
            margin-top: auto;
            position: relative;
            z-index: 2;
          `;

          const exportBtn = document.createElement("button");
          exportBtn.style.cssText = `
            width: 100%;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
            color: #78350f;
            font-weight: 700;
            font-size: 0.9em;
            border: 2px solid rgba(120, 53, 15, 0.2);
            border-radius: 10px;
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          `;
          exportBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              <path d="M15,13H13V17H11V13H9L12,10L15,13Z"/>
            </svg>
            Export
          `;

          exportBtn.onmouseover = () => {
            exportBtn.style.transform = "translateY(-2px)";
            exportBtn.style.background =
              "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 0.9) 100%)";
            exportBtn.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.15)";
          };
          exportBtn.onmouseout = () => {
            exportBtn.style.transform = "translateY(0)";
            exportBtn.style.background =
              "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)";
            exportBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
          };

          exportBtn.onclick = (e) => {
            e.stopPropagation();
            exportClientFolderToCSV(agentName, client, allOps);
          };

          footerSection.appendChild(exportBtn);
          clientBlock.appendChild(footerSection);

          // Quand on clique sur le bloc jaune, on ouvre une popup avec le détail du dossier (toutes opérations)
          clientBlock.style.cursor = "pointer";
          clientBlock.onclick = (e) => {
            // Empêche le clic sur le bouton d'export de déclencher le popup
            if (e.target === exportBtn) return;
            // Création du popup professionnel avec support mode sombre
            // Suppression forcée de toutes les modales existantes
            const existingModals = document.querySelectorAll(
              "#clientFolderDetailModal, .popup-client-folder-details"
            );
            existingModals.forEach((modal) => modal.remove());

            let modal = document.createElement("div");
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

            // Détection du mode sombre normale
            const isDarkMode = document.body.classList.contains("dark-mode");
            const finalDarkMode = isDarkMode;

            // Boîte centrale avec style conditionnel
            const box = document.createElement("div");
            box.className = "popup-client-folder-details";
            if (finalDarkMode) {
              box.style.background = "#1a1a2e";
              box.style.color = "#e2e8f0";
              box.style.border = "1px solid #374151";
            } else {
              box.style.background = "#fff";
              box.style.color = "#000";
            }
            box.style.borderRadius = "18px";
            box.style.boxShadow = finalDarkMode
              ? "0 16px 48px rgba(0,0,0,0.5)"
              : "0 16px 48px rgba(30,41,59,0.22)";
            box.style.maxWidth = "900px";
            box.style.minWidth = "600px";
            box.style.width = "96vw";
            box.style.maxHeight = "95vh";
            box.style.overflow = "hidden";
            box.style.position = "relative";
            box.style.display = "flex";
            box.style.flexDirection = "column";
            box.style.animation = "popupFadeIn 0.25s";

            // Header ultra-moderne avec adaptation au mode sombre
            const header = document.createElement("div");
            const headerBackground = finalDarkMode
              ? "linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)"
              : "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)";

            header.style.cssText = `
              background: ${headerBackground};
              color: #fff;
              padding: 24px 40px;
              font-weight: 800;
              font-size: 1.5rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top-left-radius: 18px;
              border-top-right-radius: 18px;
              position: relative;
              overflow: hidden;
            `;

            // Effet de brillance dans le header adapté au mode
            const headerShine = document.createElement("div");
            const shineColor = finalDarkMode
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.3)";

            headerShine.style.cssText = `
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, ${shineColor}, transparent);
              animation: shine 3s infinite;
            `;
            header.appendChild(headerShine);

            const headerContent = document.createElement("div");
            headerContent.style.cssText = `
              display: flex;
              align-items: center;
              gap: 16px;
              position: relative;
              z-index: 2;
            `;

            const iconBackground = finalDarkMode
              ? "linear-gradient(135deg, #d97706 0%, #ea580c 100%)"
              : "linear-gradient(135deg, #facc15 0%, #fbbf24 100%)";
            const iconColor = finalDarkMode ? "#fbbf24" : "#78350f";

            headerContent.innerHTML = `
              <div style="
                background: ${iconBackground};
                padding: 12px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
              ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  <path d="M8 11h8M8 15h6"/>
                </svg>
              </div>
              <span style='letter-spacing: -0.3px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);'>Dossier client</span>
            `;

            // Bouton fermeture ultra-moderne
            const closeBtn = document.createElement("button");
            closeBtn.innerHTML = "&times;";
            closeBtn.style.cssText = `
              background: rgba(255, 255, 255, 0.15);
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              color: #fff;
              font-size: 2rem;
              cursor: pointer;
              width: 48px;
              height: 48px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
              backdrop-filter: blur(10px);
              position: relative;
              z-index: 2;
            `;
            closeBtn.setAttribute("aria-label", "Fermer");
            closeBtn.onmouseover = () => {
              closeBtn.style.background = "rgba(239, 68, 68, 0.8)";
              closeBtn.style.transform = "scale(1.1) rotate(90deg)";
            };
            closeBtn.onmouseout = () => {
              closeBtn.style.background = "rgba(255, 255, 255, 0.15)";
              closeBtn.style.transform = "scale(1) rotate(0deg)";
            };
            closeBtn.onclick = () => {
              modal.remove();
              document.body.classList.remove("overflow-hidden");
            };

            header.appendChild(headerContent);
            header.appendChild(closeBtn);
            box.appendChild(header);

            // Bandeau infos dossier avec style conditionnel
            const infoBar = document.createElement("div");
            if (isDarkMode) {
              infoBar.style.background = "#374151";
              infoBar.style.borderBottom = "1.5px solid #4b5563";
            } else {
              infoBar.style.background = "#f3f4f6";
              infoBar.style.borderBottom = "1.5px solid #e5e7eb";
            }
            infoBar.style.padding = "18px 40px 12px 40px";
            infoBar.style.display = "flex";
            infoBar.style.flexWrap = "wrap";
            infoBar.style.gap = "32px 48px";
            infoBar.style.alignItems = "center";
            // Recherche des infos principales du dossier (première opération)
            const op0 = allOps[0] || {};
            infoBar.innerHTML = `
              <div style="font-size:1.13em;font-weight:700;color:#78350f;background:linear-gradient(90deg,#fde047 60%,#facc15 100%);padding:2px 16px;border-radius:7px;border:2px solid #eab308;box-shadow:0 0 0 2px #fde047;">N° Dossier : ${
                op0.dossier_number || op0.dossier || "-"
              }</div>
              <div style="font-size:1.08em;color:${
                isDarkMode ? "#e2e8f0" : "#1e293b"
              };"><b>Client :</b> ${op0.client_name || "-"}</div>
              <div style="font-size:1.08em;color:${
                isDarkMode ? "#e2e8f0" : "#1e293b"
              };"><b>Téléphone :</b> ${op0.client_phone || "-"}</div>
              <div style="font-size:1.08em;color:${
                isDarkMode ? "#e2e8f0" : "#1e293b"
              };"><b>Agent :</b> ${op0.agent_name || "-"}</div>
              <div style="font-size:1.08em;color:${
                isDarkMode ? "#e2e8f0" : "#1e293b"
              };"><b>Nombre d'opérations :</b> ${allOps.length}</div>
            `;
            box.appendChild(infoBar);

            // Contenu scrollable avec tableau des opérations
            const detailContent = document.createElement("div");
            detailContent.style.padding = "24px 32px 28px 32px";
            if (isDarkMode) {
              detailContent.style.background = "#1e293b";
            } else {
              detailContent.style.background = "#f8fafc";
            }
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
                // Styles conditionnels pour mode sombre
                const cardBackground = isDarkMode
                  ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";
                const cardBorder = isDarkMode
                  ? "1px solid #4b5563"
                  : "1px solid rgba(59, 130, 246, 0.1)";
                const cardShadow = isDarkMode
                  ? "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)"
                  : "0 8px 32px rgba(37, 99, 235, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)";
                const cardHoverShadow = isDarkMode
                  ? "0 16px 48px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2)"
                  : "0 16px 48px rgba(37, 99, 235, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)";

                opsHtml += `
      <li style="
        background: ${cardBackground};
        border-radius: 16px;
        box-shadow: ${cardShadow};
        padding: 24px 32px;
        border-left: 6px solid #3b82f6;
        position: relative;
        counter-increment: opnum;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        border: ${cardBorder};
      " 
      onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='${cardHoverShadow}'; this.style.borderLeftColor='#1d4ed8';"
      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='${cardShadow}'; this.style.borderLeftColor='#3b82f6';">
        
        <!-- Badge numéro d'opération -->
        <div style='
          position: absolute;
          left: -20px;
          top: 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          border: 3px solid ${isDarkMode ? "#1f2937" : "white"};
        '>#${idx + 1}</div>

        <!-- Header avec date et conteneur -->
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:16px;flex-wrap:wrap;">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            background: ${
              isDarkMode
                ? "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
                : "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
            };
            padding: 8px 16px;
            border-radius: 12px;
            border: 1px solid ${isDarkMode ? "#6b7280" : "#93c5fd"};
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${
              isDarkMode ? "#60a5fa" : "#3b82f6"
            }" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style="font-size:1.1rem;font-weight:700;color:${
              isDarkMode ? "#e5e7eb" : "#1e40af"
            };">${
                  op.created_at
                    ? new Date(op.created_at).toLocaleDateString("fr-FR")
                    : "-"
                }</span>
          </div>
          
          <div style="
            background: ${
              isDarkMode
                ? "linear-gradient(135deg, #78350f 0%, #92400e 100%)"
                : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
            };
            color: ${isDarkMode ? "#fbbf24" : "#92400e"};
            padding: 8px 16px;
            border-radius: 12px;
            font-weight: 700;
            border: 2px solid ${isDarkMode ? "#d97706" : "#f59e0b"};
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            ${op.container_number || "-"}
          </div>
        </div>
                <!-- Grille d'informations moderne -->
                <div style="
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 14px;
                  margin-top: 16px;
                ">
                  <div style='
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    padding: 10px;
                    background: ${
                      isDarkMode
                        ? "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
                        : "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)"
                    };
                    border-radius: 8px;
                    border-left: 3px solid #64748b;
                  '>
                    <span style='font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;'>Observation</span>
                    <span style='color: ${
                      isDarkMode ? "#e5e7eb" : "#334155"
                    }; font-weight: 500; word-break: break-word; font-size: 0.9rem;'>${
                  op.observation_acconier || op.delivery_notes || "-"
                }</span>
                  </div>
                  
                  <div style='
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: ${
                      isDarkMode
                        ? "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)"
                        : "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
                    };
                    border-radius: 10px;
                    border-left: 3px solid #3b82f6;
                  '>
                    <span style='font-size: 0.75rem; color: ${
                      isDarkMode ? "#93c5fd" : "#1e40af"
                    }; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;'>N° BL</span>
                    <span style='color: ${
                      isDarkMode ? "#f3f4f6" : "#1e293b"
                    }; font-weight: 600;'>${op.bl_number || "-"}</span>
                  </div>
                  
                  <div style='
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: ${
                      isDarkMode
                        ? "linear-gradient(135deg, #065f46 0%, #059669 100%)"
                        : "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                    };
                    border-radius: 10px;
                    border-left: 3px solid #10b981;
                  '>
                    <span style='font-size: 0.75rem; color: ${
                      isDarkMode ? "#6ee7b7" : "#047857"
                    }; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;'>N° Déclaration</span>
                    <span style='color: ${
                      isDarkMode ? "#f3f4f6" : "#1e293b"
                    }; font-weight: 500;'>${op.declaration_number || "-"}</span>
                  </div>
                  
                  <div style='
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: ${
                      isDarkMode
                        ? "linear-gradient(135deg, #78350f 0%, #d97706 100%)"
                        : "linear-gradient(135deg, #fef7cd 0%, #fde68a 100%)"
                    };
                    border-radius: 10px;
                    border-left: 3px solid #f59e0b;
                  '>
                    <span style='font-size: 0.75rem; color: ${
                      isDarkMode ? "#fcd34d" : "#92400e"
                    }; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;'>Lieu</span>
                    <span style='color: ${
                      isDarkMode ? "#f3f4f6" : "#1e293b"
                    }; font-weight: 500;'>${op.lieu || "-"}</span>
                  </div>
                  
                  <div style='
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: ${
                      isDarkMode
                        ? "linear-gradient(135deg, #831843 0%, #be185d 100%)"
                        : "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)"
                    };
                    border-radius: 10px;
                    border-left: 3px solid #ec4899;
                  '>
                    <span style='font-size: 0.75rem; color: ${
                      isDarkMode ? "#f9a8d4" : "#be185d"
                    }; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;'>Compagnie</span>
                    <span style='color: ${
                      isDarkMode ? "#f3f4f6" : "#1e293b"
                    }; font-weight: 500;'>${op.shipping_company || "-"}</span>
                  </div>
                  
                  <div style='
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: ${
                      isDarkMode
                        ? "linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)"
                        : "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"
                    };
                    border-radius: 10px;
                    border-left: 3px solid #0284c7;
                  '>
                    <span style='font-size: 0.75rem; color: ${
                      isDarkMode ? "#7dd3fc" : "#0369a1"
                    }; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;'>Navire</span>
                    <span style='color: ${
                      isDarkMode ? "#f3f4f6" : "#1e293b"
                    }; font-weight: 500;'>${op.ship_name || "-"}</span>
                  </div>
                  
                  <div style='
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: ${
                      isDarkMode
                        ? "linear-gradient(135deg, #581c87 0%, #7c3aed 100%)"
                        : "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)"
                    };
                    border-radius: 10px;
                    border-left: 3px solid #8b5cf6;
                  '>
                    <span style='font-size: 0.75rem; color: ${
                      isDarkMode ? "#c4b5fd" : "#7c3aed"
                    }; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;'>Contenu</span>
                    <span style='color: ${
                      isDarkMode ? "#f3f4f6" : "#1e293b"
                    }; font-weight: 500;'>${
                  op.container_type_and_content || "-"
                }</span>
                  </div>
                  
                  <div style='
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: ${
                      isDarkMode
                        ? "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)"
                        : "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)"
                    };
                    border-radius: 10px;
                    border-left: 3px solid #ef4444;  
                  '>
                    <span style='font-size: 0.75rem; color: ${
                      isDarkMode ? "#fca5a5" : "#dc2626"
                    }; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;'>Transport</span>
                    <span style='color: ${
                      isDarkMode ? "#f3f4f6" : "#1e293b"
                    }; font-weight: 500;'>${op.transporter_mode || "-"}</span>
                  </div>
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

  // === RÉFÉRENCE AUX CHAMPS DE DATE ===
  // Fonction utilitaire pour normaliser la date à minuit
  function normalizeDateToMidnight(date) {
    if (!(date instanceof Date)) date = new Date(date);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Récupérer les champs de date depuis le HTML
  let mainTableDateStartFilter = document.getElementById(
    "mainTableDateStartFilter"
  );
  let mainTableDateEndFilter = document.getElementById(
    "mainTableDateEndFilter"
  );

  // Initialiser la date de fin à la date courante si elle est vide
  if (mainTableDateEndFilter && !mainTableDateEndFilter.value) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // Format YYYY-MM-DD
    mainTableDateEndFilter.value = todayStr;
  }

  // Ajouter les événements de style aux champs de date s'ils existent
  if (mainTableDateStartFilter) {
    mainTableDateStartFilter.addEventListener("focus", function () {
      this.style.borderColor = "#3b82f6";
      this.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.1)";
    });

    mainTableDateStartFilter.addEventListener("blur", function () {
      this.style.borderColor = "#d1d5db";
      this.style.boxShadow = "none";
    });
  }

  if (mainTableDateEndFilter) {
    mainTableDateEndFilter.addEventListener("focus", function () {
      this.style.borderColor = "#3b82f6";
      this.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.1)";
    });

    mainTableDateEndFilter.addEventListener("blur", function () {
      this.style.borderColor = "#d1d5db";
      this.style.boxShadow = "none";
    });
  }

  // Fonction principale pour afficher les livraisons filtrées par date
  function updateTableForDateRange(dateStartStr, dateEndStr) {
    // Vérification automatique : si la date de début est après la date de fin, on corrige
    if (dateStartStr && dateEndStr && dateStartStr > dateEndStr) {
      // On inverse les dates
      const tmp = dateStartStr;
      dateStartStr = dateEndStr;
      dateEndStr = tmp;
      // On met à jour les champs dans l'UI
      if (mainTableDateStartFilter)
        mainTableDateStartFilter.value = dateStartStr;
      if (mainTableDateEndFilter) mainTableDateEndFilter.value = dateEndStr;
    }

    // Utiliser applyCombinedFilters qui gère déjà le filtrage par date
    if (typeof applyCombinedFilters === "function") {
      applyCombinedFilters();
    }
  }

  // Faire la fonction updateTableForDateRange disponible globalement
  window.updateTableForDateRange = updateTableForDateRange;

  // === INITIALISATION DES CHAMPS DE DATE APRÈS CRÉATION ===
  if (mainTableDateStartFilter && mainTableDateEndFilter) {
    // Fonction pour initialiser les dates par défaut
    const initializeDefaultDates = () => {
      const storedStartDate = localStorage.getItem("mainTableDateStartFilter");
      const storedEndDate = localStorage.getItem("mainTableDateEndFilter");

      if (storedStartDate && storedEndDate) {
        mainTableDateStartFilter.value = storedStartDate;
        mainTableDateEndFilter.value = storedEndDate;
      } else {
        // Utiliser les dates par défaut : depuis la date la plus ancienne jusqu'à aujourd'hui
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        // Chercher la date la plus ancienne dans toutes les livraisons
        let minDate = null;
        if (window.deliveries && window.deliveries.length > 0) {
          window.deliveries.forEach((d) => {
            let dDate = d.delivery_date || d.created_at;
            if (dDate) {
              let dateObj = new Date(dDate);
              if (!isNaN(dateObj.getTime())) {
                if (!minDate || dateObj < minDate) minDate = dateObj;
              }
            }
          });
        }

        const minDateStr = minDate
          ? minDate.toISOString().split("T")[0]
          : todayStr;

        mainTableDateStartFilter.value = minDateStr;
        mainTableDateEndFilter.value = todayStr;

        localStorage.setItem("mainTableDateStartFilter", minDateStr);
        localStorage.setItem("mainTableDateEndFilter", todayStr);
      }
    };

    // Événements pour la date de début
    mainTableDateStartFilter.addEventListener("change", (e) => {
      localStorage.setItem("mainTableDateStartFilter", e.target.value);
      updateTableForDateRange(e.target.value, mainTableDateEndFilter.value);
    });

    // Événements pour la date de fin
    mainTableDateEndFilter.addEventListener("change", (e) => {
      localStorage.setItem("mainTableDateEndFilter", e.target.value);
      updateTableForDateRange(mainTableDateStartFilter.value, e.target.value);
    });

    // Initialiser les dates par défaut après le chargement des données
    setTimeout(() => {
      initializeDefaultDates();
      // Appliquer le filtrage initial
      updateTableForDateRange(
        mainTableDateStartFilter.value,
        mainTableDateEndFilter.value
      );
    }, 500);
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

  // L'initialisation des champs de date est maintenant gérée après leur création dynamique

  if (searchButton) {
    searchButton.addEventListener("click", () => {
      // The old filterDeliveriesByContainerNumber is replaced by applyCombinedFilters
      applyCombinedFilters();
    });
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
  if (employeeTrackingBtn && !employeeTrackingBtn.hasEventListener) {
    employeeTrackingBtn.addEventListener("click", toggleEmployeePopup);
    employeeTrackingBtn.hasEventListener = true; // Marquer que le gestionnaire a été attaché
  }

  // Event listener for closing employee popup button
  if (closeEmployeePopupBtn && !closeEmployeePopupBtn.hasEventListener) {
    closeEmployeePopupBtn.addEventListener("click", hideEmployeePopup);
    closeEmployeePopupBtn.hasEventListener = true;
  }

  // Global click listener to close employee popup if clicking outside
  if (!window.employeePopupGlobalListenerAttached) {
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
    window.employeePopupGlobalListenerAttached = true;
  }

  if (employeeSearchInput && !employeeSearchInput.hasEventListener) {
    employeeSearchInput.addEventListener("input", filterEmployeeList);
    employeeSearchInput.hasEventListener = true;
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
      @keyframes blinkRed {
        0% { background-color: #dc2626; opacity: 1; }
        50% { background-color: #ef4444; opacity: 0.7; }
        100% { background-color: #dc2626; opacity: 1; }
      }
      .overdue-status {
        animation: blinkRed 1.5s infinite !important;
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

  // ================== GESTIONNAIRES D'ÉVÉNEMENTS POUR LA SYNCHRONISATION ==================

  // Gestionnaire d'événements personnalisé pour la synchronisation des statuts de conteneurs
  window.addEventListener("containerStatusUpdate", function (event) {
    console.log("[SYNC] Événement containerStatusUpdate reçu:", event.detail);
    handleContainerStatusUpdate(event.detail);
  });

  // Gestionnaire pour les événements storage (synchronisation cross-tab)
  window.addEventListener("storage", function (event) {
    if (event.key && event.key.startsWith("container_status_")) {
      try {
        const data = JSON.parse(event.newValue);
        console.log("[SYNC] Synchronisation cross-tab détectée:", data);
        handleContainerStatusUpdate(data);
      } catch (error) {
        console.warn(
          "[SYNC] Erreur lors de la lecture des données storage:",
          error
        );
      }
    }
  });

  // ================== FIN SYNCHRONISATION ==================

  // ================== FONCTION DE TEST POUR LA SYNCHRONISATION ==================

  /**
   * Fonction de test pour vérifier la synchronisation des statuts de conteneurs
   * Cette fonction peut être appelée depuis la console pour tester la synchronisation
   */
  window.testContainerStatusSync = function (
    deliveryId,
    containerNumber,
    status
  ) {
    console.log(
      `[TEST] Test de synchronisation: delivery=${deliveryId}, container=${containerNumber}, status=${status}`
    );

    const testData = {
      deliveryId: deliveryId,
      containerNumber: containerNumber,
      status: status,
      timestamp: new Date().toISOString(),
      source: "test",
    };

    // Simuler la réception d'une mise à jour depuis scriptRespLiv.js
    handleContainerStatusUpdate(testData);

    console.log(
      "[TEST] Test de synchronisation terminé - vérifiez l'affichage du tableau"
    );
  };

  // Fonction pour afficher des informations de debug sur la synchronisation
  window.debugContainerSync = function () {
    console.log("[DEBUG] État actuel de la synchronisation:");
    console.log(
      "- WebSocket connecté:",
      ws && ws.readyState === WebSocket.OPEN
    );
    console.log("- Nombre de livraisons chargées:", deliveries.length);
    console.log(
      "- Gestionnaires d'événements actifs:",
      window.oncontainerstatusupdate ? "Oui" : "Non"
    );

    // Vérifier si les cellules de statut sont présentes
    const statusCells = document.querySelectorAll(
      'td[data-field-name="status"]'
    );
    console.log(
      "- Cellules de statut trouvées dans le tableau:",
      statusCells.length
    );

    return {
      websocketConnected: ws && ws.readyState === WebSocket.OPEN,
      deliveriesCount: deliveries.length,
      statusCellsCount: statusCells.length,
    };
  };

  // Fonction pour forcer la reconstruction des données tronquées
  window.forceReconstruction = async function (deliveryId) {
    console.log(
      `[FORCE RECONSTRUCTION] Reconstruction forcée pour delivery ID: ${deliveryId}`
    );

    const delivery = deliveries.find((d) => d.id == deliveryId);
    if (!delivery) {
      console.error(
        `[FORCE RECONSTRUCTION] Livraison ${deliveryId} non trouvée`
      );
      return;
    }

    console.log(`[FORCE RECONSTRUCTION] Données avant:`, {
      container_number: delivery.container_number,
      container_numbers_list: delivery.container_numbers_list,
    });

    if (delivery.container_number && delivery.container_number.includes("+")) {
      const syncResult = await forceSyncDelivery(delivery);
      if (syncResult) {
        console.log(
          `[FORCE RECONSTRUCTION] ✅ Données reconstruites:`,
          syncResult
        );

        // Mettre à jour les données dans la liste globale
        const index = deliveries.findIndex((d) => d.id == deliveryId);
        if (index !== -1) {
          deliveries[index] = { ...deliveries[index], ...syncResult };
          console.log(
            `[FORCE RECONSTRUCTION] ✅ Données mises à jour dans deliveries[${index}]`
          );

          // Forcer le rafraîchissement du tableau
          if (typeof applyCombinedFilters === "function") {
            applyCombinedFilters();
          }
        }
      }
    } else {
      console.log(`[FORCE RECONSTRUCTION] Aucune donnée tronquée détectée`);
    }
  };
  console.log("[SYNC] Synchronisation des statuts de conteneurs initialisée");
  console.log(
    "[SYNC] Fonctions de test disponibles: testContainerStatusSync(), debugContainerSync(), forceReconstruction(deliveryId)"
  );
})();
/****** Script a ajouter en cas de pertubation 125 AAAA sjkd*gvh**/
