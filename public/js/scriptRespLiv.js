// === DÉTECTION ET APPLICATION DU MODE ADMIN ===
// Cette fonction détecte si on est en mode admin et applique les styles appropriés
function setupAdminMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminMode =
    urlParams.get("mode") === "admin" ||
    document.body.dataset.adminMode === "true";

  if (isAdminMode) {
    document.body.classList.add("admin-view-mode");
    document.body.dataset.adminMode = "true";

    console.log("🔧 [MODE ADMIN] Mode admin activé - Styles appliqués");
  } else {
    document.body.classList.remove("admin-view-mode");
    document.body.dataset.adminMode = "false";
  }
}

// Fonction pour rendre les boutons accessibles en mode admin
function enableAdminButtons() {
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminMode =
    urlParams.get("mode") === "admin" ||
    document.body.dataset.adminMode === "true";

  if (isAdminMode) {
    console.log(
      "🔧 [MODE ADMIN] Mode admin détecté - Tous les boutons restent fonctionnels"
    );

    // En mode admin, on ne fait RIEN de spécial - les boutons fonctionnent normalement
    // comme en local, grâce à la modification du CSS adminMode.css

    // Juste s'assurer que les boutons sont visibles
    setTimeout(() => {
      const buttons = document.querySelectorAll("button");
      buttons.forEach((button) => {
        if (
          button.id === "excelButton" ||
          button.id === "homeButton" ||
          button.textContent.includes("PDF")
        ) {
          console.log(
            `✅ [MODE ADMIN] Bouton trouvé et fonctionnel: ${
              button.id || button.textContent
            }`
          );
        }
      });
    }, 1000);
  }
}

// === CONTRÔLE DE L'ICÔNE D'ACCUEIL SELON LE PARCOURS UTILISATEUR ===
// Cette fonction détermine si l'icône d'accueil doit être affichée
function controlHomeIconVisibility() {
  const homeButton = document.getElementById("homeButton");
  if (!homeButton) return;

  // Vérifier si l'utilisateur vient du parcours principal (index.html → sidebar)
  const isFromMainDashboard =
    sessionStorage.getItem("fromMainDashboard") === "true";
  const hasMainDashboardAccess =
    localStorage.getItem("userAccessLevel") === "main_dashboard";

  // Vérifier les paramètres URL pour détecter la navigation via sidebar
  const urlParams = new URLSearchParams(window.location.search);
  const fromSidebar = urlParams.get("from") === "sidebar";
  const isDirect = urlParams.get("direct") === "true";

  // Afficher l'icône seulement si :
  // 1. L'utilisateur vient du tableau de bord principal, OU
  // 2. Il a navigué via le sidebar, OU
  // 3. Il a un niveau d'accès "main_dashboard"
  if (
    isFromMainDashboard ||
    fromSidebar ||
    hasMainDashboardAccess ||
    isDirect
  ) {
    homeButton.style.display = "flex";
    console.log("🏠 Icône d'accueil affichée - Parcours principal détecté");
  } else {
    homeButton.style.display = "none";
    console.log("🚫 Icône d'accueil masquée - Connexion directe détectée");
  }
}

// Exécuter la vérification dès le chargement du DOM
document.addEventListener("DOMContentLoaded", function () {
  setupAdminMode(); // Détecter et appliquer le mode admin
  controlHomeIconVisibility();
  enableAdminButtons(); // Mode admin simplifié - pas d'interférence avec les boutons
});

// === FIN CONTRÔLE ICÔNE D'ACCUEIL ===

// Injection des styles CSS pour l'historique amélioré
function injectHistoryStyles() {
  if (document.getElementById("historyEnhancedStyles")) return;

  const style = document.createElement("style");
  style.id = "historyEnhancedStyles";
  style.textContent = `
    /* Styles pour l'historique amélioré */
    .history-group-card {
      transition: all 0.3s ease;
    }
    
    .history-group-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
    }
    
    .history-group-header {
      transition: background-color 0.2s ease;
    }
    
    .history-group-header:hover {
      background: linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%) !important;
    }
    
    .container-checkbox:checked {
      accent-color: #059669;
    }
    
    .history-search-input {
      transition: all 0.3s ease;
    }
    
    .history-search-input:focus {
      outline: none;
      border-color: #059669 !important;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
    }
    
    .history-toolbar-btn {
      transition: all 0.2s ease;
    }
    
    .history-toolbar-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .history-toolbar-btn:active {
      transform: translateY(0);
    }
    
    .history-expand-icon {
      transition: transform 0.3s ease;
    }
    
    .history-table-row {
      transition: background-color 0.2s ease;
    }
    
    .history-table-row:hover {
      background-color: #f8fafc !important;
    }
    
    /* Animations pour l'expansion des groupes */
    .history-group-content {
      transition: all 0.3s ease;
      overflow: hidden;
    }
    
    /* Effet de sélection */
    .history-selected-item {
      background-color: #ecfdf5 !important;
      border-left: 4px solid #059669 !important;
    }
    
    /* Responsive pour mobile */
    @media (max-width: 768px) {
      .history-toolbar {
        flex-direction: column !important;
        gap: 10px !important;
      }
      
      .history-search-input {
        width: 100% !important;
        min-width: unset !important;
      }
      
      .history-toolbar-btn {
        width: 100%;
        text-align: center;
      }
      
      .history-group-header {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 10px !important;
      }
      
      .history-table {
        font-size: 0.8em !important;
      }
      
      .history-table th,
      .history-table td {
        padding: 6px 4px !important;
      }
    }
    
    /* Styles pour le scroll horizontal du tableau de l'historique */
    .history-group-content {
      overflow-x: auto;
      max-width: 100%;
    }
    
    .history-table {
      min-width: 900px; /* Force une largeur minimale pour afficher toutes les colonnes */
      white-space: nowrap;
    }
    
    .history-table th,
    .history-table td {
      white-space: nowrap;
      min-width: 120px; /* Largeur minimale pour chaque cellule */
    }
    
    .history-table th:first-child,
    .history-table td:first-child {
      min-width: 60px; /* Colonne de sélection plus petite */
    }
    
    /* Scrollbar personnalisée pour un meilleur design */
    .history-group-content::-webkit-scrollbar {
      height: 8px;
    }
    
    .history-group-content::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }
    
    .history-group-content::-webkit-scrollbar-thumb {
      background: #059669;
      border-radius: 4px;
    }
    
    .history-group-content::-webkit-scrollbar-thumb:hover {
      background: #047857;
    }
    
    /* Styles pour les badges de statut */
    .history-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 600;
    }
    
    .history-status-delivered {
      background-color: #d1fae5;
      color: #065f46;
    }
    
    .history-status-partial {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    /* Animation de chargement */
    .history-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #6b7280;
    }
    
    .history-loading::after {
      content: '';
      width: 20px;
      height: 20px;
      border: 2px solid #e5e7eb;
      border-top-color: #059669;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-left: 10px;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    /* Effet pour les boutons d'action */
    .history-action-btn {
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    
    .history-action-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
      transition: all 0.3s ease;
      transform: translate(-50%, -50%);
    }
    
    .history-action-btn:hover::before {
      width: 100%;
      height: 100%;
    }
    
    /* Styles pour les notifications */
    .history-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #059669;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 100500;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    }
    
    .history-notification.show {
      transform: translateX(0);
    }
    
    /* Styles pour les checkboxes personnalisées */
    .history-custom-checkbox {
      position: relative;
      display: inline-block;
      width: 18px;
      height: 18px;
    }
    
    .history-custom-checkbox input {
      opacity: 0;
      position: absolute;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }
    
    .history-custom-checkbox .checkmark {
      position: absolute;
      top: 0;
      left: 0;
      height: 18px;
      width: 18px;
      background-color: #fff;
      border: 2px solid #d1d5db;
      border-radius: 3px;
      transition: all 0.2s ease;
    }
    
    .history-custom-checkbox input:checked ~ .checkmark {
      background-color: #059669;
      border-color: #059669;
    }
    
    .history-custom-checkbox .checkmark::after {
      content: '';
      position: absolute;
      display: none;
      left: 5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    
    .history-custom-checkbox input:checked ~ .checkmark::after {
      display: block;
    }
    
    /* Animation pulse pour le bouton de suppression */
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
      }
    }
    
    /* Effet de survol pour les cartes de groupe */
    .history-group-card:hover .history-expand-icon {
      color: #059669 !important;
      transform: scale(1.1);
    }
    
    /* Style pour les lignes sélectionnées */
    .history-table-row.history-selected-item {
      background: linear-gradient(90deg, #ecfdf5 0%, #d1fae5 100%) !important;
      border-left: 4px solid #059669 !important;
    }
    
    /* Amélioration des tooltips */
    [title]:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      white-space: nowrap;
      z-index: 1000;
    }
    
    /* Animation d'apparition des groupes */
    .history-group-card {
      animation: slideInUp 0.3s ease-out;
    }
    
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Amélioration de l'accessibilité */
    .history-action-btn:focus,
    .history-toolbar-btn:focus,
    .history-search-input:focus {
      outline: 2px solid #059669;
      outline-offset: 2px;
    }
    
    /* Style pour les messages d'état */
    .history-empty-state {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px dashed #0284c7;
      border-radius: 12px;
      text-align: center;
      padding: 40px 20px;
      margin: 20px 0;
    }
    
    .history-empty-state h3 {
      color: #0369a1;
      margin-bottom: 10px;
    }
    
    .history-empty-state p {
      color: #64748b;
      margin: 0;
    }
    
    /* Styles pour le système de compte à rebours */
    .countdown-container {
      position: fixed;
      top: 60px;
      left: 0;
      right: 0;
      width: 100%;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      padding: 12px 20px;
      box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
      z-index: 999999;
      font-weight: 600;
      font-size: 0.95em;
      cursor: pointer;
      transition: all 0.3s ease;
      border-bottom: 3px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }
    
    .countdown-container:hover {
      box-shadow: 0 6px 25px rgba(245, 158, 11, 0.5);
      transform: none;
    }
    
    .countdown-timer {
      font-size: 1.1em;
      font-weight: 700;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    .countdown-label {
      font-size: 0.8em;
      opacity: 0.9;
      margin-top: 2px;
    }
    
    /* Styles pour la pop-up de confirmation PDF */
    .pdf-confirmation-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100500;
      backdrop-filter: blur(5px);
    }
    
    .pdf-confirmation-content {
      background: white;
      border-radius: 20px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      position: relative;
    }
    
    .pdf-confirmation-title {
      font-size: 1.4em;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 15px;
    }
    
    .pdf-confirmation-message {
      font-size: 1em;
      color: #4b5563;
      margin-bottom: 25px;
      line-height: 1.5;
    }
    
    .pdf-confirmation-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .pdf-confirmation-btn {
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9em;
      min-width: 120px;
    }
    
    .pdf-btn-yes {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }
    
    .pdf-btn-no {
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      color: white;
    }
    
    .pdf-btn-delay {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }
    
    .pdf-confirmation-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    
    /* Animation pour la pop-up de confirmation */
    .pdf-confirmation-modal {
      animation: fadeInModal 0.3s ease-out;
    }
    
    .pdf-confirmation-content {
      animation: slideInUp 0.3s ease-out;
    }
    
    @keyframes fadeInModal {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    /* Pulse animation pour le compte à rebours */
    .countdown-pulse {
      animation: countdownPulse 2s infinite;
    }
    
    @keyframes countdownPulse {
      0%, 100% {
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      }
      50% {
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
      }
    }
  `;
  document.head.appendChild(style);
}

// Fonction globale pour afficher des notifications
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = "history-notification";
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.right = "20px";
  notification.style.background = type === "success" ? "#059669" : "#ef4444";
  notification.style.color = "white";
  notification.style.padding = "12px 20px";
  notification.style.borderRadius = "8px";
  notification.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  notification.style.zIndex = "100500";
  notification.style.transform = "translateX(100%)";
  notification.style.transition = "transform 0.3s ease";
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Fonction pour nettoyer le statut des conteneurs pour l'export Excel
function cleanStatusForExcel(cellText, row) {
  try {
    // Récupérer l'ID de la livraison depuis l'attribut data
    const deliveryId = row.getAttribute("data-delivery-id");
    if (!deliveryId || !window.allDeliveries) {
      return cellText; // Retourner le texte original si pas de données
    }

    // Trouver la livraison correspondante
    const delivery = window.allDeliveries.find(
      (d) => String(d.id) === String(deliveryId)
    );
    if (!delivery) {
      return cellText;
    }

    // Extraire la liste des conteneurs
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

    // Extraire les statuts
    const statuses =
      delivery.container_statuses &&
      typeof delivery.container_statuses === "object"
        ? delivery.container_statuses
        : {};

    if (tcList.length === 0) {
      return "Aucun conteneur";
    }

    // Organiser les conteneurs par statut pour Excel
    const livres = [];
    const nonLivres = [];

    tcList.forEach((tc) => {
      const status = statuses[tc] || "aucun";
      if (status === "livre" || status === "livré") {
        livres.push(tc);
      } else {
        nonLivres.push(tc);
      }
    });

    // Construire le texte Excel organisé
    let excelText = "";

    if (livres.length > 0) {
      excelText += `LIVRÉS (${livres.length}): ${livres.join(", ")}`;
    }

    if (nonLivres.length > 0) {
      if (excelText) excelText += " | ";
      excelText += `NON LIVRÉS (${nonLivres.length}): ${nonLivres.join(", ")}`;
    }

    return excelText || "Statut inconnu";
  } catch (error) {
    console.error("Erreur lors du nettoyage du statut pour Excel:", error);
    return cellText; // Retourner le texte original en cas d'erreur
  }
}

// Fonction pour générer et télécharger un fichier Excel des livraisons
function genererExcelLivraisons() {
  // Récupérer les filtres actifs
  const searchInput = document.getElementById("searchInput");
  const dateStartFilter = document.getElementById("mainTableDateStartFilter");
  const dateEndFilter = document.getElementById("mainTableDateEndFilter");

  const searchTerm = searchInput ? searchInput.value.trim() : "";
  const dateStart = dateStartFilter ? dateStartFilter.value : "";
  const dateEnd = dateEndFilter ? dateEndFilter.value : "";

  let filterInfo = "";
  if (searchTerm) filterInfo += `Recherche: "${searchTerm}"`;
  if (dateStart || dateEnd) {
    if (filterInfo) filterInfo += ", ";
    filterInfo += `Période: ${dateStart || "début"} → ${dateEnd || "fin"}`;
  }

  // Récupérer les données actuellement affichées dans le tableau
  const table = document.getElementById("deliveriesTable");
  if (!table) {
    showNotification("Aucun tableau de données trouvé.", "error");
    return;
  }

  const tbody = table.querySelector("tbody");
  if (!tbody || tbody.rows.length === 0) {
    showNotification(
      "Aucune donnée à exporter. Vérifiez que le tableau contient des données.",
      "error"
    );
    return;
  }

  // Récupérer les en-têtes de colonnes
  const headerRow = table.querySelector("thead tr:last-child");
  const headers = Array.from(headerRow.cells).map((cell) =>
    cell.textContent.trim().replace(/\s+/g, " ")
  );

  // Récupérer les données des lignes
  const data = [];
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    const rowData = {};

    for (let j = 0; j < row.cells.length && j < headers.length; j++) {
      let cellText = row.cells[j].textContent.trim().replace(/\s+/g, " ");

      // Nettoyage spécial pour la colonne Statut (supprimer icônes et améliorer format)
      if (
        headers[j] === "Statut" ||
        headers[j].toLowerCase().includes("statut")
      ) {
        cellText = cleanStatusForExcel(cellText, row);
      }

      rowData[headers[j]] = cellText;
    }

    // Ajouter un numéro de ligne
    rowData["N°"] = i + 1;
    data.push(rowData);
  }

  if (data.length === 0) {
    showNotification("Aucune donnée à exporter.", "error");
    return;
  }

  // Réorganiser les colonnes pour mettre N° en premier
  const excelData = data.map((row) => {
    const orderedRow = { "N°": row["N°"] };
    headers.forEach((header) => {
      if (header !== "N°") {
        orderedRow[header] = row[header] || "";
      }
    });
    return orderedRow;
  });

  try {
    // Utilisation de la librairie SheetJS (xlsx) si disponible
    if (typeof XLSX !== "undefined") {
      // Créer la feuille de calcul
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Amélioration du formatage Excel
      const range = XLSX.utils.decode_range(ws["!ref"]);

      // Ajustement automatique de la largeur des colonnes
      const columnWidths = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10; // Largeur minimale
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            const cellLength = String(cell.v).length;
            maxWidth = Math.max(maxWidth, cellLength + 2);
          }
        }
        columnWidths.push({ width: Math.min(maxWidth, 50) }); // Largeur maximale de 50
      }
      ws["!cols"] = columnWidths;

      // Style pour l'en-tête
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[headerCellAddress]) {
          ws[headerCellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "0E274E" } },
            alignment: { horizontal: "center", vertical: "center" },
          };
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Données Livraisons");

      // Générer le nom du fichier avec la date actuelle
      const dateNow = new Date()
        .toLocaleDateString("fr-FR")
        .replace(/\//g, "-");
      const timeNow = new Date()
        .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        .replace(/:/g, "h");
      const fileName = `Livraisons_ITS_${dateNow}_${timeNow}.xlsx`;

      XLSX.writeFile(wb, fileName);

      // Message de succès avec statistiques
      const stats = `${data.length} ligne${
        data.length > 1 ? "s" : ""
      } exportée${data.length > 1 ? "s" : ""}`;
      const appliedFilters = filterInfo ? ` (${filterInfo})` : "";
      showNotification(
        `📊 Fichier Excel généré avec succès : ${fileName} (${stats}${appliedFilters})`,
        "success"
      );
    } else {
      // Méthode alternative avec CSV si SheetJS n'est pas disponible
      generateCSVFallback(excelData, filterInfo);
    }
  } catch (error) {
    console.error("Erreur lors de la génération du fichier Excel:", error);
    // Fallback vers CSV en cas d'erreur
    generateCSVFallback(excelData, filterInfo);
  }
}

// Fonction de fallback pour générer un CSV si Excel n'est pas disponible
function generateCSVFallback(data, filterInfo = "") {
  try {
    if (data.length === 0) return;

    // Créer l'en-tête CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(";"),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || "";
            // Échapper les guillemets et encapsuler si nécessaire
            return typeof value === "string" &&
              (value.includes(";") ||
                value.includes('"') ||
                value.includes("\n"))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(";")
      ),
    ].join("\n");

    // Créer et télécharger le fichier CSV
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const dateNow = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
    const timeNow = new Date()
      .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      .replace(/:/g, "h");

    link.setAttribute("href", url);
    link.setAttribute("download", `Livraisons_ITS_${dateNow}_${timeNow}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const stats = `${data.length} ligne${data.length > 1 ? "s" : ""} exportée${
      data.length > 1 ? "s" : ""
    }`;
    const appliedFilters = filterInfo ? ` (${filterInfo})` : "";
    showNotification(
      `📄 Fichier CSV généré avec succès : Livraisons_ITS_${dateNow}_${timeNow}.csv (${stats}${appliedFilters})`,
      "success"
    );
  } catch (error) {
    console.error("Erreur lors de la génération du fichier CSV:", error);
    showNotification(
      "Erreur lors de la génération du fichier. Veuillez réessayer.",
      "error"
    );
  }
}

// Fonction pour mettre à jour le texte du bouton Excel selon les filtres actifs
function updateExcelButtonText() {
  const excelButton = document.getElementById("excelButton");
  const searchInput = document.getElementById("searchInput");
  const dateStartFilter = document.getElementById("mainTableDateStartFilter");
  const dateEndFilter = document.getElementById("mainTableDateEndFilter");

  if (!excelButton) return;

  const searchTerm = searchInput ? searchInput.value.trim() : "";
  const dateStart = dateStartFilter ? dateStartFilter.value : "";
  const dateEnd = dateEndFilter ? dateEndFilter.value : "";

  const hasFilters = searchTerm || dateStart || dateEnd;

  const iconHtml = '<i class="fas fa-file-excel me-1"></i>';
  if (hasFilters) {
    excelButton.innerHTML = `${iconHtml}Excel (filtrés)`;
    excelButton.title = "Exporter les données filtrées en Excel";
  } else {
    excelButton.innerHTML = `${iconHtml}Excel`;
    excelButton.title = "Exporter toutes les données en Excel";
  }
}

// Initialiser les listeners pour la mise à jour du bouton Excel
document.addEventListener("DOMContentLoaded", function () {
  // Ajouter les listeners pour mettre à jour le bouton Excel
  const searchInput = document.getElementById("searchInput");
  const dateStartFilter = document.getElementById("mainTableDateStartFilter");
  const dateEndFilter = document.getElementById("mainTableDateEndFilter");

  if (searchInput) {
    searchInput.addEventListener("input", updateExcelButtonText);
    searchInput.addEventListener("keyup", updateExcelButtonText);
  }

  if (dateStartFilter) {
    dateStartFilter.addEventListener("change", updateExcelButtonText);
  }

  if (dateEndFilter) {
    dateEndFilter.addEventListener("change", updateExcelButtonText);
  }

  // Initialiser le texte du bouton
  updateExcelButtonText();
});

// Fonction utilitaire pour récupérer les paramètres URL
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// 🚀 Fonction pour faire clignoter un dossier spécifique en cas de redirection depuis le tableau de bord
function flashTargetDelivery() {
  const targetDossier = getUrlParameter("dossier");
  const shouldFlash = getUrlParameter("flash") === "true";

  if (!targetDossier || !shouldFlash) {
    console.log(
      `❌ [FLASH] Pas de flash requis - dossier: ${targetDossier}, flash: ${shouldFlash}`
    );
    return;
  }

  console.log(
    `✨ [FLASH] Recherche du dossier à faire clignoter: ${targetDossier}`
  );

  // Fonction pour chercher le dossier
  function searchAndFlash() {
    const tableBody = document.getElementById("deliveriesTableBody");
    if (!tableBody) {
      console.log(`❌ [FLASH] Element #deliveriesTableBody non trouvé`);
      return false;
    }

    // Chercher la ligne qui contient ce dossier
    const rows = tableBody.querySelectorAll("tr");
    let targetRow = null;

    console.log(`🔍 [FLASH] Recherche dans ${rows.length} lignes...`);

    rows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      let rowText = "";
      cells.forEach((cell) => {
        rowText += cell.textContent + " ";
      });

      // Recherche plus flexible - par ID, numéro de dossier, ou contenu
      if (
        rowText.includes(targetDossier) ||
        rowText.includes(targetDossier.toString()) ||
        row.dataset.dossierId === targetDossier
      ) {
        targetRow = row;
        console.log(
          `✅ [FLASH] Dossier trouvé dans la ligne ${index}: ${rowText.trim()}`
        );
      }
    });

    if (targetRow) {
      console.log(`✨ [FLASH] Dossier trouvé, démarrage du clignotement`);

      // Styles d'origine
      const originalStyle = {
        background: targetRow.style.background || "",
        transform: targetRow.style.transform || "",
        boxShadow: targetRow.style.boxShadow || "",
        border: targetRow.style.border || "",
      };

      // Animation de flash pendant 5 secondes
      let flashCount = 0;
      const maxFlashes = 10; // 5 secondes à 500ms par flash

      const flashInterval = setInterval(() => {
        if (flashCount >= maxFlashes) {
          // Remettre le style original
          Object.keys(originalStyle).forEach((key) => {
            targetRow.style[key] = originalStyle[key];
          });
          clearInterval(flashInterval);

          // Supprimer les paramètres de l'URL pour éviter de re-flasher
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete("flash");
          window.history.replaceState({}, "", newUrl);

          console.log(`✨ [FLASH] Animation terminée`);
          return;
        }

        // Alterner entre surbrillance et normal
        if (flashCount % 2 === 0) {
          targetRow.style.background =
            "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)";
          targetRow.style.transform = "scale(1.02)";
          targetRow.style.boxShadow = "0 8px 25px rgba(245, 158, 11, 0.4)";
          targetRow.style.border = "2px solid #f59e0b";
        } else {
          targetRow.style.background = originalStyle.background;
          targetRow.style.transform = originalStyle.transform;
          targetRow.style.boxShadow = originalStyle.boxShadow;
          targetRow.style.border = originalStyle.border;
        }

        flashCount++;
      }, 500);

      // Scroll vers la ligne si elle n'est pas visible
      targetRow.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return true;
    } else {
      console.log(
        `⚠️ [FLASH] Dossier ${targetDossier} non trouvé dans le tableau`
      );
      return false;
    }
  }

  // Essayer plusieurs fois avec des délais différents
  setTimeout(() => {
    if (!searchAndFlash()) {
      setTimeout(() => {
        if (!searchAndFlash()) {
          setTimeout(searchAndFlash, 2000); // Dernier essai après 2 secondes
        }
      }, 1000);
    }
  }, 500);
}

// Fonction pour charger les données de livraison d'un utilisateur en mode admin
async function loadUserDeliveryData(targetUser, targetUserId) {
  if (!targetUser) return;

  try {
    console.log(
      `📝 [DELIVERY DATA] Chargement des données de livraison pour l'utilisateur: ${targetUser}`
    );

    // Appel API pour récupérer les données de l'utilisateur
    const response = await fetch(
      `/api/user-delivery-data?user=${encodeURIComponent(
        targetUser
      )}&userId=${encodeURIComponent(targetUserId || "")}`
    );

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.deliveryData) {
        console.log(
          `📝 [DELIVERY DATA] ${data.deliveryData.length} données trouvées pour ${targetUser}`
        );

        // Mettre à jour le localStorage avec les données de l'utilisateur
        data.deliveryData.forEach((item) => {
          if (
            item.delivery_id &&
            item.field_name &&
            item.field_value &&
            item.field_value.trim() !== ""
          ) {
            const key = `${item.field_name}_${item.delivery_id}`;
            localStorage.setItem(key, item.field_value);

            console.log(
              `📝 [DELIVERY DATA] Donnée chargée pour livraison ${item.delivery_id}, champ ${item.field_name}:`,
              item.field_value
            );
          }
        });

        // 🔧 Forcer le re-rendu du tableau en mode admin après chargement des données
        setTimeout(() => refreshTableInAdminModeRespLiv(), 100);

        return data.deliveryData;
      }
    } else if (response.status === 404) {
      console.log(`📝 [DELIVERY DATA] API non disponible pour le moment`);
    } else {
      console.warn(`⚠️ [DELIVERY DATA] Erreur API: ${response.status}`);
    }
  } catch (error) {
    // En cas d'erreur réseau ou API non disponible, essayer une approche locale
    console.warn(
      `⚠️ [DELIVERY DATA] API non disponible, recherche locale:`,
      error.message
    );

    // Recherche dans le localStorage pour toutes les données existantes
    try {
      let localData = [];
      const targetUserLower = targetUser.toLowerCase();

      // Parcourir toutes les clés du localStorage pour les données de livraison
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("agent_visiteur_") ||
            key.includes("transporteur_") ||
            key.includes("inspecteur_") ||
            key.includes("agent_douanes_") ||
            key.includes("chauffeur_") ||
            key.includes("tel_chauffeur_") ||
            key.includes("date_livraison_") ||
            key.includes("observations_") ||
            key.includes("delivery_notes_"))
        ) {
          const value = localStorage.getItem(key);
          if (value && value.trim() !== "") {
            localData.push({
              key: key,
              value: value,
              deliveryId: key.split("_").pop(),
            });
          }
        }
      }

      console.log(
        `📝 [DELIVERY DATA LOCAL] ${localData.length} données trouvées dans le localStorage`
      );
      return localData;
    } catch (localError) {
      console.warn(`⚠️ [DELIVERY DATA] Erreur recherche locale:`, localError);
    }
  }

  // 🔧 Forcer le re-rendu du tableau en mode admin après chargement des données
  setTimeout(() => refreshTableInAdminModeRespLiv(), 100);

  return [];
}

// 🔧 Fonction utilitaire pour forcer le re-rendu du tableau en mode admin (resp_liv)
function refreshTableInAdminModeRespLiv() {
  const isAdminMode =
    new URLSearchParams(window.location.search).get("mode") === "admin" ||
    window.location.search.includes("targetUser") ||
    document.body.dataset.adminMode === "true";
  if (isAdminMode) {
    console.log(`📝 [ADMIN MODE RESP LIV] Re-rendu du tableau demandé`);
    // Forcer un rechargement des données d'affichage
    setTimeout(() => {
      if (typeof loadAllDeliveries === "function") {
        console.log(`📝 [ADMIN MODE RESP LIV] Rechargement des livraisons...`);
        loadAllDeliveries();
      }
    }, 200);
  }
}

// 🔧 Fonction pour charger l'historique de livraison d'un utilisateur en mode admin
function loadUserDeliveryHistory(targetUser) {
  if (!targetUser) return;

  const isAdminMode =
    new URLSearchParams(window.location.search).get("mode") === "admin" ||
    window.location.search.includes("targetUser") ||
    document.body.dataset.adminMode === "true";

  if (!isAdminMode) return;

  console.log(
    `📦 [HISTORIQUE ADMIN] Chargement de l'historique pour: ${targetUser}`
  );

  // Chercher dans les livraisons déjà chargées les conteneurs livrés par cet utilisateur
  if (window.allDeliveries && window.allDeliveries.length > 0) {
    const targetUserLower = targetUser.toLowerCase();
    let addedToHistory = 0;

    window.allDeliveries.forEach((delivery) => {
      // Vérifier si cette livraison appartient à l'utilisateur ciblé
      const userFields = [
        delivery.responsible_livreur,
        delivery.resp_livreur,
        delivery.employee_name,
        delivery.nom_agent_visiteur,
        delivery.driver_name,
        delivery.assigned_to,
        delivery.created_by,
        delivery.updated_by,
      ];

      const belongsToUser = userFields.some(
        (field) =>
          field && field.toString().toLowerCase().includes(targetUserLower)
      );

      if (belongsToUser && delivery.container_statuses) {
        // Parcourir les statuts des conteneurs
        Object.entries(delivery.container_statuses).forEach(
          ([containerNumber, status]) => {
            if (status === "livre" || status === "livré") {
              // Vérifier si ce conteneur n'est pas déjà dans l'historique
              const currentHistory = JSON.parse(
                localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
              );
              const exists = currentHistory.some(
                (entry) =>
                  entry.delivery_id === delivery.id &&
                  entry.container_number === containerNumber
              );

              if (!exists) {
                saveToDeliveryHistory(delivery, containerNumber);
                addedToHistory++;
                console.log(
                  `📦 [HISTORIQUE ADMIN] Conteneur ${containerNumber} ajouté à l'historique pour ${targetUser}`
                );
              }
            }
          }
        );
      }
    });

    if (addedToHistory > 0) {
      console.log(
        `📦 [HISTORIQUE ADMIN] ${addedToHistory} conteneurs ajoutés à l'historique pour ${targetUser}`
      );
      showHistoryButtonIfNeeded();
    } else {
      console.log(
        `📦 [HISTORIQUE ADMIN] Aucun nouveau conteneur à ajouter à l'historique pour ${targetUser}`
      );
    }
  }
}

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
  //   INJECTION DES STYLES CSS pour l'historique amélioré
  injectHistoryStyles();

  //  🆕 AJOUT : Vérification de l'historique professionnel au chargement
  // Création immédiate du bouton historique
  checkAndShowHistoryButton();

  // 🔄 NOUVEAUTÉ : Synchronisation automatique de l'historique vers les archives au chargement
  setTimeout(async () => {
    console.log(
      "[SYNC ARCHIVE] 🚀 Démarrage de la synchronisation automatique au chargement de la page"
    );
    await syncHistoryToArchives();
  }, 3000); // Délai de 3 secondes pour laisser le temps à la page de se charger complètement

  // ⏰ RESTAURATION du compte à rebours si actif
  restoreCountdownIfActive();

  // ✨ FLASH : Déclencher le flash pour les dossiers ciblés depuis le tableau de bord
  setTimeout(() => {
    flashTargetDelivery();
  }, 2000); // Attendre 2 secondes pour que tout soit chargé

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

          // 🔧 CORRECTION WEBSOCKET: Vérifier aussi que le dossier n'a pas de conteneurs livrés
          let hasDeliveredContainers = false;
          if (
            data.delivery.container_statuses &&
            typeof data.delivery.container_statuses === "object"
          ) {
            const containerStatuses = Object.values(
              data.delivery.container_statuses
            );
            hasDeliveredContainers = containerStatuses.some(
              (status) => status === "livre" || status === "livré"
            );
          }

          // Le dossier est éligible pour "Mise en livraison" SEULEMENT si:
          // 1. Tous les BL sont en mise_en_livraison ET
          // 2. Aucun conteneur n'est livré
          const isEligibleForMiseEnLivraison =
            allMiseEnLivraison && !hasDeliveredContainers;

          // Cherche si la livraison est déjà dans allDeliveries
          const idx = window.allDeliveries.findIndex(
            (d) => d.id === data.delivery.id
          );
          if (isEligibleForMiseEnLivraison) {
            // Ajoute ou met à jour la livraison
            if (idx === -1) {
              window.allDeliveries.push(data.delivery);
              updateDeliveredForPdf();
            } else {
              window.allDeliveries[idx] = data.delivery;
              updateDeliveredForPdf();
            }

            // 🔄 Synchronisation automatique après mise à jour WebSocket
            setTimeout(() => {
              syncDeliveredContainersToHistory();
            }, 200);
          } else {
            // Retire la livraison si elle n'est plus éligible (soit BL ne sont plus tous en mise_en_livraison, soit des conteneurs sont livrés)
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
      console.log("🔄 [DEBUG RESP LIV] Début du chargement des livraisons...");
      const response = await fetch("/deliveries/status");
      console.log(
        "🔄 [DEBUG RESP LIV] Réponse reçue:",
        response.status,
        response.statusText
      );
      const data = await response.json();
      console.log(
        "🔄 [DEBUG RESP LIV] Données reçues:",
        data.success,
        "Nombre de livraisons:",
        data.deliveries?.length
      );

      if (data.success && Array.isArray(data.deliveries)) {
        // Récupération des paramètres pour le mode admin
        const isAdminMode = getUrlParameter("mode") === "admin";
        const targetUser =
          getUrlParameter("targetUser") || getUrlParameter("user");
        const targetUserId = getUrlParameter("userId");

        console.log(
          "🔄 [DEBUG RESP LIV] Mode admin:",
          isAdminMode,
          "Target user:",
          targetUser,
          "Target userId:",
          targetUserId
        );

        // 🔧 NOUVEAU: Récupération du paramètre de filtrage depuis l'URL
        const filterParam = getUrlParameter("filter");
        const autoFilter = getUrlParameter("autoFilter") === "true";

        console.log(
          "🔄 [DEBUG RESP LIV] Paramètres de filtrage:",
          "filter:",
          filterParam,
          "autoFilter:",
          autoFilter
        );

        let filteredDeliveries = data.deliveries.filter((delivery) => {
          // 🆕 NOUVELLE LOGIQUE: Si pas d'autoFilter avec paramètre spécifique, AFFICHER TOUS LES DOSSIERS
          if (!autoFilter || !filterParam) {
            console.log(
              "🔄 [DEBUG] Pas de filtrage spécifique - Affichage de TOUS les dossiers (Mise en livraison + Livré)"
            );
            // Retourner true pour tous les dossiers (pas de filtrage par défaut)
            return true;
          }

          // 🆕 FILTRAGE SELON LE PARAMÈTRE URL (uniquement si autoFilter=true ET filterParam existe)
          switch (filterParam) {
            case "mise_en_livraison":
              // Dossiers en mise_en_livraison_acconier SANS conteneurs livrés
              if (
                delivery.delivery_status_acconier !==
                "mise_en_livraison_acconier"
              ) {
                return false;
              }
              if (
                delivery.container_statuses &&
                typeof delivery.container_statuses === "object"
              ) {
                const containerStatuses = Object.values(
                  delivery.container_statuses
                );
                const hasDeliveredContainers = containerStatuses.some(
                  (status) => status === "livre" || status === "livré"
                );
                if (hasDeliveredContainers) {
                  return false;
                }
              }
              return true;

            case "livre":
            case "livré":
              // Dossiers avec TOUS les conteneurs livrés
              if (
                !delivery.container_statuses ||
                typeof delivery.container_statuses !== "object"
              ) {
                return false;
              }

              const containerStatuses = Object.values(
                delivery.container_statuses
              );
              if (containerStatuses.length === 0) {
                return false;
              }

              // Vérifier que TOUS les conteneurs120 sont livrés
              const allDelivered = containerStatuses.every(
                (status) => status === "livre" || status === "livré"
              );
              return allDelivered;

            case "en_attente_paiement":
              // Dossiers en attente de paiement
              return (
                delivery.delivery_status_acconier === "en_attente_paiement" ||
                delivery.delivery_status_acconier === "pending_acconier"
              );

            default:
              // Si paramètre non reconnu, appliquer la logique par défaut
              console.warn(`Paramètre de filtrage non reconnu: ${filterParam}`);
              return (
                delivery.delivery_status_acconier ===
                "mise_en_livraison_acconier"
              );
          }
        });

        console.log(
          `🔄 [DEBUG RESP LIV] Filtrage appliqué: ${
            filterParam || "défaut"
          } (autoFilter: ${autoFilter})`
        );
        console.log(
          `🔄 [DEBUG RESP LIV] Nombre de livraisons après filtrage: ${filteredDeliveries.length}`
        );

        // Filtrage pour le mode admin : affichage intelligent des livraisons
        if (isAdminMode && targetUser) {
          console.log(
            `🔍 [DEBUG RESP LIV FILTRAGE] Recherche pour l'utilisateur "${targetUser}"`
          );
          console.log(
            `🔍 [DEBUG RESP LIV] Nombre total de livraisons avant filtrage: ${filteredDeliveries.length}`
          );

          // Charger les observations/données de l'utilisateur ciblé
          await loadUserDeliveryData(targetUser, targetUserId);

          // Charger l'historique des livraisons de l'utilisateur ciblé
          await loadUserDeliveryHistory(targetUser);

          // ✅ AFFICHAGE COMPLET POUR TOUS LES UTILISATEURS DE LA SIDEBAR
          console.log(
            `📋 [MODE ADMIN RESP LIV] Clic sur utilisateur sidebar ("${targetUser}") - Affichage de TOUS les dossiers disponibles (${filteredDeliveries.length} dossiers)`
          );
          // ✅ En mode admin depuis la sidebar : TOUJOURS afficher tous les dossiers sans filtrage
          // Pas de limitation, pas de filtrage par utilisateur
        }

        // ✅ AFFICHAGE FINAL - Appliquer le filtrage selon les paramètres URL
        window.allDeliveries = filteredDeliveries;

        console.log(
          `[RESP LIV] Filtrage "${filterParam || "défaut"}" appliqué: ${
            filteredDeliveries.length
          } dossier(s) affiché(s)`
        );

        // 🔄 Synchronisation automatique des conteneurs livrés vers l'historique
        setTimeout(() => {
          const syncCount = syncDeliveredContainersToHistory();
          if (syncCount > 0) {
            console.log(
              `[AUTO-SYNC] 📦 ${syncCount} conteneur(s) livré(s) ajouté(s) à l'historique`
            );
          }
        }, 500);
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

      // 🚀 Déclencher le flash si un dossier spécifique est ciblé
      setTimeout(() => {
        flashTargetDelivery();
      }, 1500); // Attendre que le tableau soit complètement rendu
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

              // 🆕 AJOUT : Enregistrer automatiquement dans l'historique si le statut devient "livré"
              if (newStatus === "livre" || newStatus === "livré") {
                console.log(
                  `[DELIVERY HISTORY] 📦 Ajout automatique du conteneur ${tcNumber} à l'historique`
                );
                saveToDeliveryHistory(delivery, tcNumber);
                // Afficher le bouton historique s'il n'est pas déjà visible
                showHistoryButtonIfNeeded();
              }
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
    // 🚫 CONTRAINTE DÉSACTIVÉE : Fonction pour vérifier si tous les champs obligatoires sont remplis
    // function isAllRequiredFilled(delivery, deliveryIndex) {
    //   // Champs obligatoires à vérifier
    //   const requiredFields = [
    //     "visitor_agent_name",
    //     "transporter",
    //     "inspector",
    //     "customs_agent",
    //     "driver",
    //     "driver_phone",
    //     "delivery_date",
    //   ];

    //   // Fonction locale pour générer la clé de stockage
    //   function getStorageKey(delivery, colId, index) {
    //     return `deliverycell_${
    //       delivery.id || delivery.dossier_number || index
    //     }_${colId}`;
    //   }

    //   console.log(
    //     `[VALIDATION] ⚠️ VÉRIFICATION STRICTE pour la livraison ${
    //       delivery.id || delivery.dossier_number
    //     }`
    //   );

    //   // Vérifier chaque champ obligatoire - VALIDATION STRICTE
    //   for (const fieldId of requiredFields) {
    //     const storageKey = getStorageKey(delivery, fieldId, deliveryIndex);
    //     const savedValue = localStorage.getItem(storageKey);

    //     console.log(`[VALIDATION] Champ ${fieldId}:`);
    //     console.log(`  - Clé de stockage: ${storageKey}`);
    //     console.log(`  - Valeur sauvegardée: "${savedValue}"`);

    //     // VALIDATION STRICTE : On vérifie UNIQUEMENT ce qui a été saisi par l'utilisateur
    //     // Si rien n'est sauvegardé dans localStorage, le champ est considéré comme vide
    //     if (
    //       !savedValue ||
    //       savedValue.trim() === "" ||
    //       savedValue === "-" ||
    //       savedValue === "null"
    //     ) {
    //       console.log(`[VALIDATION] ❌ CHAMP MANQUANT: ${fieldId}`);
    //       return false;
    //     }

    //     console.log(`[VALIDATION] ✅ Champ ${fieldId} OK`);
    //   }

    //   console.log(
    //     `[VALIDATION] ✅ TOUS LES CHAMPS OBLIGATOIRES SONT REMPLIS pour la livraison ${
    //       delivery.id || delivery.dossier_number
    //     }`
    //   );
    //   return true;
    // }

    // 🔓 FONCTION DE REMPLACEMENT : Toujours retourner true (pas de validation)
    function isAllRequiredFilled(delivery, deliveryIndex) {
      console.log(
        `[VALIDATION DÉSACTIVÉE] ✅ Validation automatiquement acceptée pour la livraison ${
          delivery.id || delivery.dossier_number
        }`
      );
      return true; // Toujours retourner true pour permettre la livraison
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
                let canModify = isAllRequiredFilled(delivery, i);

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

                // Vérifier si tous les champs obligatoires sont remplis avant de permettre la modification
                canModify = isAllRequiredFilled(delivery, i);

                // Réinitialiser les variables pour cette vérification
                isDeliveryActivated =
                  localStorage.getItem(deliveryKey) === "true";

                // Vérifier si des conteneurs ont déjà eu un statut défini (même "aucun" après avoir été "livré")
                hasStatusHistory = false;
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

                // VALIDATION STRICTE : Les champs obligatoires doivent TOUJOURS être remplis
                // AUCUNE EXCEPTION ! Peu importe l'historique ou l'activation précédente
                if (!canModify) {
                  showAccessMessage(
                    "🚫 ACCÈS REFUSÉ 🚫\n\nVous DEVEZ d'abord remplir TOUS les champs obligatoires :\n• NOM Agent visiteurs\n• TRANSPORTEUR\n• INSPECTEUR\n• AGENT EN DOUANES\n• CHAUFFEUR\n• TEL CHAUFFEUR\n• DATE LIVRAISON\n\nSans exception !",
                    "red"
                  );
                  return;
                }

                showContainerDetailPopup(delivery, item.textContent);
              };
            });

          // Gestion du bouton "Marquer tous comme livrés"
          const markAllBtn = popup.querySelector(".tc-popup-mark-all");
          if (markAllBtn) {
            markAllBtn.onclick = async (ev) => {
              ev.stopPropagation();
              popup.style.display = "none";

              // Vérifier si tous les champs obligatoires sont remplis avant de permettre le marquage
              canModify = isAllRequiredFilled(delivery, i);

              // Réinitialiser les variables pour cette vérification
              isDeliveryActivated =
                localStorage.getItem(deliveryKey) === "true";

              // Vérifier si des conteneurs ont déjà eu un statut défini
              hasStatusHistory = false;
              if (
                delivery.container_statuses &&
                typeof delivery.container_statuses === "object"
              ) {
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

              // VALIDATION STRICTE : Les champs obligatoires doivent TOUJOURS être remplis
              // AUCUNE EXCEPTION pour le marquage en masse !
              if (!canModify) {
                showAccessMessage(
                  "🚫 ACCÈS REFUSÉ 🚫\n\nVous DEVEZ d'abord remplir TOUS les champs obligatoires :\n• NOM Agent visiteurs\n• TRANSPORTEUR\n• INSPECTEUR\n• AGENT EN DOUANES\n• CHAUFFEUR\n• TEL CHAUFFEUR\n• DATE LIVRAISON\n\nSans exception !",
                  "red"
                );
                return;
              }

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

              // Vérifier si tous les champs obligatoires sont remplis avant de permettre le démarquage
              canModify = isAllRequiredFilled(delivery, i);

              // Réinitialiser les variables pour cette vérification
              isDeliveryActivated =
                localStorage.getItem(deliveryKey) === "true";

              // Vérifier si des conteneurs ont déjà eu un statut défini
              hasStatusHistory = false;
              if (
                delivery.container_statuses &&
                typeof delivery.container_statuses === "object"
              ) {
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

              // VALIDATION STRICTE : Les champs obligatoires doivent TOUJOURS être remplis
              // AUCUNE EXCEPTION pour le démarquage !
              if (!canModify) {
                showAccessMessage(
                  "🚫 ACCÈS REFUSÉ 🚫\n\nVous DEVEZ d'abord remplir TOUS les champs obligatoires :\n• NOM Agent visiteurs\n• TRANSPORTEUR\n• INSPECTEUR\n• AGENT EN DOUANES\n• CHAUFFEUR\n• TEL CHAUFFEUR\n• DATE LIVRAISON\n\nSans exception !",
                  "red"
                );
                return;
              }

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
            let canModify = isAllRequiredFilled(delivery, i);

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

            // VALIDATION STRICTE : Les champs obligatoires doivent TOUJOURS être remplis
            // AUCUNE EXCEPTION pour les conteneurs uniques !
            if (!canModify) {
              showAccessMessage(
                "🚫 ACCÈS REFUSÉ 🚫\n\nVous DEVEZ d'abord remplir TOUS les champs obligatoires :\n• NOM Agent visiteurs\n• TRANSPORTEUR\n• INSPECTEUR\n• AGENT EN DOUANES\n• CHAUFFEUR\n• TEL CHAUFFEUR\n• DATE LIVRAISON\n\nSans exception !",
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

        // Logique spéciale pour récupérer les noms d'agents depuis localStorage
        if (col.id === "visitor_agent_name") {
          // Priorité 1: valeur sauvegardée dans la cellule
          const cellStorageKey = getCellStorageKey(delivery, col.id);
          const cellSavedValue = localStorage.getItem(cellStorageKey);

          // Priorité 2: valeur depuis localStorage agent_visiteur_
          const agentStorageKey = `agent_visiteur_${delivery.id}`;
          const agentSavedValue = localStorage.getItem(agentStorageKey);

          // Priorité 3: valeur depuis l'objet delivery
          const deliveryValue = delivery[col.id] || delivery.nom_agent_visiteur;

          value = cellSavedValue || agentSavedValue || deliveryValue || "-";

          console.log(
            `[DEBUG AGENT] Delivery ${delivery.id}: cellSaved="${cellSavedValue}", agentSaved="${agentSavedValue}", delivery="${deliveryValue}", final="${value}"`
          );
        } else {
          value =
            delivery[col.id] !== undefined &&
            delivery[col.id] !== null &&
            delivery[col.id] !== ""
              ? delivery[col.id]
              : "-";
        }

        // Affiche la valeur sauvegardée si elle existe
        let displayValue =
          savedValue !== null && savedValue !== "" ? savedValue : value;

        // 🔧 CORRECTION MODE ADMIN : Priorité aux données de l'utilisateur ciblé
        const isAdminMode =
          new URLSearchParams(window.location.search).get("mode") === "admin" ||
          window.location.search.includes("targetUser") ||
          document.body.dataset.adminMode === "true";
        const targetUser = new URLSearchParams(window.location.search).get(
          "targetUser"
        );

        if (
          isAdminMode &&
          targetUser &&
          savedValue &&
          savedValue.trim() !== "" &&
          savedValue !== "-"
        ) {
          // En mode admin, prioriser les données de l'utilisateur ciblé
          displayValue = savedValue;
          console.log(
            `📝 [ADMIN MODE RESP LIV] Donnée affichée pour livraison ${delivery.id}, champ ${col.id}:`,
            displayValue
          );
        }

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
          if (col.id === "observation" && !isAllRequiredFilled(delivery, i)) {
            showAccessMessage(
              "🚫 ACCÈS REFUSÉ 🚫\n\nVous DEVEZ d'abord remplir TOUS les champs obligatoires :\n• NOM Agent visiteurs\n• TRANSPORTEUR\n• INSPECTEUR\n• AGENT EN DOUANES\n• CHAUFFEUR\n• TEL CHAUFFEUR\n• DATE LIVRAISON\n\nSans exception !",
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
              const storageKey = getCellStorageKey(delivery, col.id);
              localStorage.setItem(storageKey, input.value);

              // Debug spécifique pour les agents
              if (col.id === "visitor_agent_name") {
                console.log(
                  `[DEBUG SAVE AGENT] Livraison ${delivery.id}, sauvegardé avec clé "${storageKey}" = "${input.value}"`
                );
              }

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
            const storageKey = getCellStorageKey(delivery, col.id);
            localStorage.setItem(storageKey, input.value);

            // Debug spécifique pour les agents
            if (col.id === "visitor_agent_name") {
              console.log(
                `[DEBUG SAVE AGENT BLUR] Livraison ${delivery.id}, sauvegardé avec clé "${storageKey}" = "${input.value}"`
              );
            }

            // === SYNCHRONISATION VERS SUIVIE ===
            syncDataToSuivie(delivery, col.id, input.value);
            setTimeout(() => {
              if (isAllRequiredFilled(delivery, i)) {
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
                    console.log(
                      `[DELIVERY HISTORY] 📦 Ajout automatique du conteneur ${containerNumber} à l'historique (mise à jour individuelle)`
                    );
                    saveToDeliveryHistory(
                      updatedDelivery || delivery,
                      containerNumber
                    );
                    showHistoryButtonIfNeeded();
                  }

                  // Met à jour l'affichage du statut
                  if (delivered === total && total > 0) {
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
            delivery.nom_agent_visiteur ||
            delivery.visitor_agent_name ||
            localStorage.getItem(`agent_visiteur_${delivery.id}`) ||
            localStorage.getItem(
              `deliverycell_${delivery.id}_visitor_agent_name`
            ) ||
            "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Transporteur :</b> ${
            delivery.transporter ||
            localStorage.getItem(`transporteur_${delivery.id}`) ||
            localStorage.getItem(`deliverycell_${delivery.id}_transporter`) ||
            "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Inspecteur :</b> ${
            delivery.inspecteur ||
            delivery.inspector ||
            localStorage.getItem(`inspecteur_${delivery.id}`) ||
            localStorage.getItem(`deliverycell_${delivery.id}_inspector`) ||
            "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Agent en douanes :</b> ${
            delivery.agent_en_douanes ||
            delivery.customs_agent ||
            localStorage.getItem(`agent_douanes_${delivery.id}`) ||
            localStorage.getItem(`deliverycell_${delivery.id}_customs_agent`) ||
            "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Chauffeur :</b> ${
            delivery.chauffeur ||
            delivery.driver_name ||
            delivery.driver ||
            localStorage.getItem(`chauffeur_${delivery.id}`) ||
            localStorage.getItem(`deliverycell_${delivery.id}_driver`) ||
            "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Tél chauffeur :</b> ${
            delivery.tel_chauffeur ||
            delivery.driver_phone ||
            localStorage.getItem(`tel_chauffeur_${delivery.id}`) ||
            localStorage.getItem(`deliverycell_${delivery.id}_driver_phone`) ||
            "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Agent visiteur :</b> ${
            delivery.nom_agent_visiteur ||
            delivery.visitor_agent_name ||
            localStorage.getItem(`agent_visiteur_${delivery.id}`) ||
            localStorage.getItem(
              `deliverycell_${delivery.id}_visitor_agent_name`
            ) ||
            "-"
          }</div>
          <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Téléphone client :</b> ${
            delivery.client_phone ||
            delivery.telephone_client ||
            localStorage.getItem(`client_phone_${delivery.id}`) ||
            localStorage.getItem(`deliverycell_${delivery.id}_client_phone`) ||
            "-"
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
              delivery.nom_agent_visiteur ||
              delivery.visitor_agent_name ||
              localStorage.getItem(`agent_visiteur_${delivery.id}`) ||
              localStorage.getItem(
                `deliverycell_${delivery.id}_visitor_agent_name`
              ) ||
              "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Transporteur :</b> ${
              delivery.transporter ||
              localStorage.getItem(`transporteur_${delivery.id}`) ||
              localStorage.getItem(`deliverycell_${delivery.id}_transporter`) ||
              "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Inspecteur :</b> ${
              delivery.inspecteur ||
              delivery.inspector ||
              localStorage.getItem(`inspecteur_${delivery.id}`) ||
              localStorage.getItem(`deliverycell_${delivery.id}_inspector`) ||
              "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Agent en douanes :</b> ${
              delivery.agent_en_douanes ||
              delivery.customs_agent ||
              localStorage.getItem(`agent_douanes_${delivery.id}`) ||
              localStorage.getItem(
                `deliverycell_${delivery.id}_customs_agent`
              ) ||
              "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Chauffeur :</b> ${
              delivery.chauffeur ||
              delivery.driver_name ||
              delivery.driver ||
              localStorage.getItem(`chauffeur_${delivery.id}`) ||
              localStorage.getItem(`deliverycell_${delivery.id}_driver`) ||
              "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Tél chauffeur :</b> ${
              delivery.tel_chauffeur ||
              delivery.driver_phone ||
              localStorage.getItem(`tel_chauffeur_${delivery.id}`) ||
              localStorage.getItem(
                `deliverycell_${delivery.id}_driver_phone`
              ) ||
              "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Agent visiteur :</b> ${
              delivery.nom_agent_visiteur ||
              delivery.visitor_agent_name ||
              localStorage.getItem(`agent_visiteur_${delivery.id}`) ||
              localStorage.getItem(
                `deliverycell_${delivery.id}_visitor_agent_name`
              ) ||
              "-"
            }</div>
            <div style='font-size:0.97em;color:#1e293b;margin-bottom:2px;'><b>Téléphone client :</b> ${
              delivery.client_phone ||
              delivery.telephone_client ||
              localStorage.getItem(`client_phone_${delivery.id}`) ||
              localStorage.getItem(
                `deliverycell_${delivery.id}_client_phone`
              ) ||
              "-"
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

    // Ajouter le bouton PDF à la fin
    parentContainer.appendChild(pdfBtn);
  } else {
    // Fallback : au-dessus du tableau si champ non trouvé
    const mainTable = document.getElementById("deliveriesTable");
    if (mainTable && mainTable.parentNode) {
      mainTable.parentNode.insertBefore(pdfBtn, mainTable);
    }
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
function showPdfFilterModal(userChoice = null) {
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
  radioSingle.checked = true;
  const labelSingle = document.createElement("label");
  labelSingle.textContent = "Une seule date";
  labelSingle.htmlFor = "pdfFilterSingle";
  labelSingle.style.marginRight = "18px";
  const radioRange = document.createElement("input");
  radioRange.type = "radio";
  radioRange.name = "pdfDateFilter";
  radioRange.id = "pdfFilterRange";
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
    dateStart.style.padding = "8px 18px";
    dateStart.style.borderRadius = "8px";
    dateStart.style.border = "1.5px solid #2563eb";
    dateStart.style.fontSize = "1.08em";
    dateStart.style.marginRight = "12px";
    const dateEnd = document.createElement("input");
    dateEnd.type = "date";
    dateEnd.id = "pdfRangeDateEnd";
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

    // Exécuter l'action choisie par l'utilisateur APRÈS génération du PDF
    if (userChoice) {
      setTimeout(() => {
        handlePDFAction(userChoice);
      }, 500); // Petit délai pour laisser le PDF se générer
    }

    overlay.remove();
  };
  content.appendChild(validateBtn);
  box.appendChild(content);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

pdfBtn.onclick = async function () {
  // Afficher la pop-up de confirmation
  const choice = await showPDFConfirmationModal();

  if (choice === null) {
    return; // L'utilisateur a annulé
  }

  // Mettre à jour les données livrées
  updateDeliveredForPdf();

  // Afficher la modal de filtre PDF avec l'action choisie
  showPdfFilterModal(choice);
};

/**
 * Gère l'action choisie par l'utilisateur pour le PDF
 */
function handlePDFAction(choice) {
  switch (choice) {
    case "yes":
      // Supprimer les livraisons du tableau APRÈS génération du PDF
      const removedCount = deliveredForPdf.length;
      removeDeliveredFromMainTable();

      // Mettre à jour la notification avec le nombre d'éléments supprimés
      showNotification(
        `PDF généré ! ${removedCount} livraison(s) supprimée(s) du tableau (conservées dans l'historique)`,
        "success"
      );

      // Forcer une mise à jour de l'affichage après un court délai
      setTimeout(() => {
        updateDeliveredForPdf();
        const dateStartInput = document.getElementById(
          "mainTableDateStartFilter"
        );
        const dateEndInput = document.getElementById("mainTableDateEndFilter");
        if (dateStartInput && dateEndInput) {
          updateTableForDateRange(dateStartInput.value, dateEndInput.value);
        }
      }, 100);
      break;

    case "no":
      // Ne rien faire, garder les livraisons
      showNotification(
        "PDF généré ! Livraisons conservées dans le tableau",
        "success"
      );
      break;

    case "delay":
      // Le compte à rebours a déjà été démarré dans showPDFConfirmationModal
      showNotification(
        "PDF généré ! Compte à rebours de 1 semaine démarré",
        "success"
      );
      break;
  }
}

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
 * Duplique automatiquement toutes les livraisons livrées du tableau principal vers l'historique
 */
function syncDeliveredContainersToHistory() {
  try {
    if (!window.allDeliveries || window.allDeliveries.length === 0) {
      console.log("[SYNC HISTORIQUE] Aucune livraison chargée");
      return;
    }

    let addedCount = 0;
    const currentUser = localStorage.getItem("user_nom") || "Inconnu";

    // Parcourir toutes les livraisons
    window.allDeliveries.forEach((delivery) => {
      if (
        !delivery.container_statuses ||
        typeof delivery.container_statuses !== "object"
      ) {
        return;
      }

      // Vérifier chaque conteneur de la livraison
      Object.entries(delivery.container_statuses).forEach(
        ([containerNumber, status]) => {
          if (status === "livre" || status === "livré") {
            // Vérifier si ce conteneur n'est pas déjà dans l'historique
            const history = JSON.parse(
              localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
            );
            const exists = history.some(
              (entry) =>
                entry.delivery_id === delivery.id &&
                entry.container_number === containerNumber
            );

            if (!exists) {
              // Ajouter à l'historique
              saveToDeliveryHistory(delivery, containerNumber);
              addedCount++;
              console.log(
                `[SYNC HISTORIQUE] ✅ Conteneur ${containerNumber} ajouté automatiquement`
              );
            }
          }
        }
      );
    });

    if (addedCount > 0) {
      console.log(
        `[SYNC HISTORIQUE] 🔄 ${addedCount} conteneur(s) livré(s) synchronisé(s) vers l'historique`
      );
      showHistoryButtonIfNeeded();
    }

    return addedCount;
  } catch (error) {
    console.error(
      "[SYNC HISTORIQUE] ❌ Erreur lors de la synchronisation:",
      error
    );
    return 0;
  }
}

/**
 * Récupère la valeur réelle d'un champ depuis le tableau DOM
 */
function getTableCellValue(deliveryId, fieldId) {
  const tr = document.querySelector(`tr[data-delivery-id='${deliveryId}']`);
  if (tr) {
    const td = tr.querySelector(`td[data-col-id='${fieldId}']`);
    if (td) {
      // Vérifie d'abord s'il y a un input ou textarea
      const input = td.querySelector("input,textarea");
      if (input && input.value && input.value.trim() !== "") {
        return input.value.trim();
      }
      // Sinon récupère le textContent
      const textContent = td.textContent ? td.textContent.trim() : "";
      if (
        textContent &&
        textContent !== "-" &&
        textContent !== "" &&
        textContent !== "Agent inconnu"
      ) {
        return textContent;
      }
    }
  }

  // Si pas trouvé dans le DOM, vérifier localStorage avec la bonne clé
  if (fieldId === "visitor_agent_name") {
    // Debug: lister toutes les clés localStorage liées aux agents
    console.log(`[DEBUG AGENT] Recherche pour deliveryId: ${deliveryId}`);
    const allKeys = Object.keys(localStorage);
    const agentKeys = allKeys.filter(
      (key) =>
        key.includes("agent") ||
        key.includes("visitor") ||
        key.includes(`_${deliveryId}_`) ||
        key.includes(`${deliveryId}_`)
    );
    console.log(`[DEBUG AGENT] Clés trouvées:`, agentKeys);
    agentKeys.forEach((key) => {
      console.log(`[DEBUG AGENT] ${key} = "${localStorage.getItem(key)}"`);
    });

    // Essayer différentes clés possibles avec pattern comme getCellStorageKey
    const keys = [
      `deliverycell_${deliveryId}_visitor_agent_name`,
      `agent_visiteur_${deliveryId}`,
      `deliverycell_${deliveryId}_nom_agent_visiteur`,
    ];

    // Ajouter toutes les clés qui contiennent deliveryId et visitor_agent_name
    const dynamicKeys = allKeys.filter(
      (key) =>
        (key.includes(`${deliveryId}_visitor_agent_name`) ||
          (key.includes(`visitor_agent_name`) && key.includes(deliveryId))) &&
        !keys.includes(key)
    );
    keys.push(...dynamicKeys);

    console.log(`[DEBUG AGENT] Clés testées:`, keys);

    for (const key of keys) {
      const savedValue = localStorage.getItem(key);
      if (
        savedValue &&
        savedValue.trim() !== "" &&
        savedValue !== "-" &&
        savedValue !== "Agent inconnu"
      ) {
        console.log(
          `[DEBUG AGENT] Trouvé nom agent avec clé "${key}": "${savedValue}"`
        );
        return savedValue.trim();
      }
    }
  }

  return null;
}

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

    // Récupère les valeurs réelles depuis le tableau DOM ET depuis delivery
    const realAgentName =
      delivery.nom_agent_visiteur ||
      getTableCellValue(delivery.id, "visitor_agent_name") ||
      delivery.visitor_agent_name ||
      "-";

    const realTransporter =
      delivery.transporter ||
      getTableCellValue(delivery.id, "transporter") ||
      "-";

    // Crée un enregistrement unique pour ce conteneur
    const historyEntry = {
      id: `hist_${Date.now()}_${Math.floor(Math.random() * 10000)}`, // ID unique string
      delivery_id: delivery.id,
      container_number: containerNumber,
      dossier_number: delivery.dossier_number,
      bl_number: delivery.bl_number,
      client_name: delivery.client_name,
      client_phone: delivery.client_phone,
      employee_name: delivery.employee_name,
      circuit: delivery.circuit,
      shipping_company: delivery.shipping_company,
      visitor_agent_name: realAgentName,
      nom_agent_visiteur: realAgentName,
      transporter: realTransporter,
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

      // 🆕 AJOUT : Archiver automatiquement dans les archives centrales
      if (typeof window.archiveDossier === "function") {
        try {
          // Créer un objet dossier pour l'archivage
          const dossierForArchive = {
            id: delivery.id,
            dossier_number: delivery.dossier_number,
            container_number: containerNumber,
            container_type_and_content: delivery.container_foot_type || "",
            client_name: delivery.client_name,
            bl_number: delivery.bl_number,
            client_phone: delivery.client_phone,
            employee_name: delivery.employee_name,
            circuit: delivery.circuit,
            shipping_company: delivery.shipping_company,
            visitor_agent_name: realAgentName,
            transporter: realTransporter,
            inspector: delivery.inspector,
            customs_agent: delivery.customs_agent,
            driver: delivery.driver,
            driver_phone: delivery.driver_phone,
            weight: delivery.weight,
            ship_name: delivery.ship_name,
            delivery_date: delivery.delivery_date,
            observation: delivery.observation,
            delivered_at: historyEntry.delivered_at,
            delivered_by: historyEntry.delivered_by,
          };

          window
            .archiveDossier(
              dossierForArchive,
              "livraison",
              "Responsable Livraison",
              window.location.href
            )
            .then((success) => {
              if (success) {
                console.log(
                  `[ARCHIVE] ✅ Conteneur ${containerNumber} archivé automatiquement depuis l'historique`
                );
              } else {
                console.log(
                  `[ARCHIVE] ⚠️ Échec de l'archivage automatique pour le conteneur ${containerNumber}`
                );
              }
            })
            .catch((error) => {
              console.error(
                `[ARCHIVE] ❌ Erreur lors de l'archivage automatique:`,
                error
              );
            });
        } catch (error) {
          console.error(
            `[ARCHIVE] ❌ Erreur lors de la préparation de l'archivage:`,
            error
          );
        }
      } else {
        console.log("[ARCHIVE] ⚠️ Fonction archiveDossier non disponible");
      }
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
 * Synchronise tout l'historique existant vers les archives centrales
 */
async function syncHistoryToArchives() {
  try {
    if (typeof window.archiveDossier !== "function") {
      console.log("[SYNC ARCHIVE] ⚠️ Fonction archiveDossier non disponible");
      return;
    }

    const history = JSON.parse(
      localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
    );

    if (history.length === 0) {
      console.log("[SYNC ARCHIVE] ℹ️ Aucun historique à synchroniser");
      return;
    }

    console.log(
      `[SYNC ARCHIVE] 🔄 Début de la synchronisation de ${history.length} entrées d'historique vers les archives`
    );

    let syncedCount = 0;
    let errorCount = 0;

    for (const historyEntry of history) {
      try {
        // Créer un objet dossier pour l'archivage
        const dossierForArchive = {
          id: historyEntry.delivery_id,
          dossier_number: historyEntry.dossier_number,
          container_number: historyEntry.container_number,
          container_type_and_content: historyEntry.container_foot_type || "",
          client_name: historyEntry.client_name,
          bl_number: historyEntry.bl_number,
          client_phone: historyEntry.client_phone,
          employee_name: historyEntry.employee_name,
          circuit: historyEntry.circuit,
          shipping_company: historyEntry.shipping_company,
          visitor_agent_name: historyEntry.visitor_agent_name,
          transporter: historyEntry.transporter,
          inspector: historyEntry.inspector,
          customs_agent: historyEntry.customs_agent,
          driver: historyEntry.driver,
          driver_phone: historyEntry.driver_phone,
          weight: historyEntry.weight,
          ship_name: historyEntry.ship_name,
          delivery_date: historyEntry.delivery_date,
          observation: historyEntry.observation,
          delivered_at: historyEntry.delivered_at,
          delivered_by: historyEntry.delivered_by,
        };

        const success = await window.archiveDossier(
          dossierForArchive,
          "livraison",
          "Responsable Livraison (Sync Historique)",
          window.location.href
        );

        if (success) {
          syncedCount++;
          console.log(
            `[SYNC ARCHIVE] ✅ Conteneur ${historyEntry.container_number} synchronisé`
          );
        } else {
          errorCount++;
          console.log(
            `[SYNC ARCHIVE] ⚠️ Échec de synchronisation pour ${historyEntry.container_number}`
          );
        }

        // Petite pause pour éviter de surcharger le serveur
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        errorCount++;
        console.error(
          `[SYNC ARCHIVE] ❌ Erreur lors de la synchronisation de ${historyEntry.container_number}:`,
          error
        );
      }
    }

    console.log(
      `[SYNC ARCHIVE] 📊 Synchronisation terminée: ${syncedCount} succès, ${errorCount} échecs sur ${history.length} entrées`
    );

    // Afficher une notification de résultat
    if (syncedCount > 0) {
      showNotification(
        `Synchronisation réussie: ${syncedCount} conteneurs de l'historique ajoutés aux archives`,
        "success"
      );
    }
  } catch (error) {
    console.error(
      "[SYNC ARCHIVE] ❌ Erreur lors de la synchronisation complète:",
      error
    );
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
 * Affiche la modal de l'historique professionnel avec fonctionnalités avancées
 */
function showProfessionalHistoryModal() {
  // 🔄 Synchronisation complète avant l'affichage
  console.log("[HISTORIQUE] 🔄 Synchronisation des conteneurs livrés...");
  const syncCount = syncDeliveredContainersToHistory();
  if (syncCount > 0) {
    console.log(
      `[HISTORIQUE] ✅ ${syncCount} nouveau(x) conteneur(s) ajouté(s) à l'historique`
    );
  }

  // Injecter les styles CSS
  injectHistoryStyles();

  // Récupère l'historique
  const history = JSON.parse(
    localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
  );

  // Supprime la modal existante si elle existe
  const existingModal = document.getElementById("professionalHistoryModal");
  if (existingModal) existingModal.remove();

  // Regroupe les conteneurs par dossier et date de livraison
  const groupedHistory = groupHistoryByDelivery(history);

  // Variables globales pour la modal
  let filteredData = [...groupedHistory];
  let selectedItems = new Set();

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

  // Conteneur principal
  const container = document.createElement("div");
  container.style.background = "#fff";
  container.style.borderRadius = "16px";
  container.style.boxShadow = "0 20px 60px rgba(0,0,0,0.3)";
  container.style.maxWidth = "95vw";
  container.style.width = "1200px";
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
  closeBtn.style.transition = "all 0.2s ease";
  closeBtn.onmouseover = () =>
    (closeBtn.style.background = "rgba(255,255,255,0.3)");
  closeBtn.onmouseout = () =>
    (closeBtn.style.background = "rgba(255,255,255,0.2)");
  closeBtn.onclick = () => modal.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);
  container.appendChild(header);

  // Statistiques
  const stats = document.createElement("div");
  stats.style.padding = "15px 30px";
  stats.style.background = "#f8fafc";
  stats.style.borderBottom = "1px solid #e5e7eb";

  // Calcul de la date de dernière livraison (la plus récente)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.delivered_at) - new Date(a.delivered_at)
  );
  const lastDeliveryDate =
    sortedHistory.length > 0
      ? new Date(sortedHistory[0].delivered_at).toLocaleDateString("fr-FR")
      : "Aucune";

  stats.innerHTML = `
    <div style="display: flex; gap: 30px; flex-wrap: wrap; align-items: center;">
      <div style="color: #059669; font-weight: bold;">
        📦 Total conteneurs livrés: <span style="color: #047857;">${history.length}</span>
      </div>
      <div style="color: #059669; font-weight: bold;">
        📋 Groupes de livraison: <span style="color: #047857;">${groupedHistory.length}</span>
      </div>
      <div style="color: #059669; font-weight: bold;">
        📅 Dernière livraison: <span style="color: #047857;">${lastDeliveryDate}</span>
      </div>
    </div>
  `;
  container.appendChild(stats);

  // Barre d'outils avec recherche et actions
  const toolbar = document.createElement("div");
  toolbar.className = "history-toolbar";
  toolbar.style.padding = "15px 30px";
  toolbar.style.background = "#f8fafc";
  toolbar.style.borderBottom = "1px solid #e5e7eb";
  toolbar.style.display = "flex";
  toolbar.style.gap = "15px";
  toolbar.style.alignItems = "center";
  toolbar.style.flexWrap = "wrap";

  // Champ de recherche
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "history-search-input";
  searchInput.placeholder =
    "🔍 Rechercher par conteneur, dossier, client, agent ou transporteur...";
  searchInput.style.flex = "1";
  searchInput.style.minWidth = "250px";
  searchInput.style.padding = "10px 15px";
  searchInput.style.border = "2px solid #d1d5db";
  searchInput.style.borderRadius = "8px";
  searchInput.style.fontSize = "0.9em";
  searchInput.style.outline = "none";

  // Boutons d'action
  const selectAllBtn = document.createElement("button");
  selectAllBtn.textContent = "✓ Tout sélectionner";
  selectAllBtn.className = "history-toolbar-btn";
  selectAllBtn.style.background = "#3b82f6";
  selectAllBtn.style.color = "white";
  selectAllBtn.style.border = "none";
  selectAllBtn.style.padding = "10px 15px";
  selectAllBtn.style.borderRadius = "8px";
  selectAllBtn.style.cursor = "pointer";
  selectAllBtn.style.fontSize = "0.85em";
  selectAllBtn.style.fontWeight = "600";

  const deselectAllBtn = document.createElement("button");
  deselectAllBtn.textContent = "✗ Tout désélectionner";
  deselectAllBtn.className = "history-toolbar-btn";
  deselectAllBtn.style.background = "#6b7280";
  deselectAllBtn.style.color = "white";
  deselectAllBtn.style.border = "none";
  deselectAllBtn.style.padding = "10px 15px";
  deselectAllBtn.style.borderRadius = "8px";
  deselectAllBtn.style.cursor = "pointer";
  deselectAllBtn.style.fontSize = "0.85em";
  deselectAllBtn.style.fontWeight = "600";

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑️ Supprimer sélection";
  deleteBtn.className = "history-toolbar-btn";
  deleteBtn.style.background = "#ef4444";
  deleteBtn.style.color = "white";
  deleteBtn.style.border = "none";
  deleteBtn.style.padding = "10px 15px";
  deleteBtn.style.borderRadius = "8px";
  deleteBtn.style.cursor = "pointer";
  deleteBtn.style.fontSize = "0.85em";
  deleteBtn.style.fontWeight = "600";
  deleteBtn.style.display = "none";

  toolbar.appendChild(searchInput);
  toolbar.appendChild(selectAllBtn);
  toolbar.appendChild(deselectAllBtn);
  toolbar.appendChild(deleteBtn);
  container.appendChild(toolbar);

  // Zone de contenu avec scroll
  const content = document.createElement("div");
  content.style.flex = "1";
  content.style.padding = "20px 30px";
  content.style.overflowY = "auto";
  content.style.background = "#fff";
  container.appendChild(content);

  // Fonction pour filtrer les données
  function filterData() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (!searchTerm) {
      filteredData = [...groupedHistory];
    } else {
      filteredData = groupedHistory.filter((group) => {
        return group.containers.some(
          (container) =>
            container.container_number.toLowerCase().includes(searchTerm) ||
            (container.dossier_number &&
              container.dossier_number.toLowerCase().includes(searchTerm)) ||
            (container.client_name &&
              container.client_name.toLowerCase().includes(searchTerm)) ||
            (container.visitor_agent_name &&
              container.visitor_agent_name
                .toLowerCase()
                .includes(searchTerm)) ||
            (container.nom_agent_visiteur &&
              container.nom_agent_visiteur
                .toLowerCase()
                .includes(searchTerm)) ||
            (container.transporter &&
              container.transporter.toLowerCase().includes(searchTerm))
        );
      });
    }
    renderHistoryContent();
  }

  // Fonction pour rendre le contenu
  function renderHistoryContent() {
    content.innerHTML = "";

    if (filteredData.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: #6b7280;">
          <div style="font-size: 3em; margin-bottom: 20px;">📋</div>
          <h3 style="color: #374151; margin-bottom: 10px;">Aucun historique trouvé</h3>
          <p>Aucune livraison ne correspond à votre recherche ou il n'y a pas encore d'historique.</p>
        </div>
      `;
      return;
    }

    // Affichage des groupes de livraisons
    filteredData.forEach((group, groupIndex) => {
      const groupCard = document.createElement("div");
      groupCard.className = "history-group-card";
      groupCard.style.marginBottom = "20px";
      groupCard.style.border = "2px solid #e5e7eb";
      groupCard.style.borderRadius = "16px";
      groupCard.style.overflow = "hidden";
      groupCard.style.background = "#fff";
      groupCard.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";

      // En-tête du groupe (cliquable pour déplier/replier)
      const groupHeader = document.createElement("div");
      groupHeader.className = "history-group-header";
      groupHeader.style.background =
        "linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)";
      groupHeader.style.padding = "18px 25px";
      groupHeader.style.cursor = "pointer";
      groupHeader.style.display = "flex";
      groupHeader.style.alignItems = "center";
      groupHeader.style.justifyContent = "space-between";
      groupHeader.style.borderBottom = "1px solid #e5e7eb";

      const groupInfo = document.createElement("div");
      groupInfo.style.display = "flex";
      groupInfo.style.alignItems = "center";
      groupInfo.style.gap = "20px";

      // Checkbox pour sélectionner tout le groupe
      const groupCheckbox = document.createElement("input");
      groupCheckbox.type = "checkbox";
      groupCheckbox.style.transform = "scale(1.3)";
      groupCheckbox.style.cursor = "pointer";
      groupCheckbox.style.accentColor = "#059669";

      const groupText = document.createElement("div");
      groupText.innerHTML = `
        <div style="font-weight: bold; color: #0369a1; margin-bottom: 5px; font-size: 1.1em;">
          📦 ${group.containers.length} conteneur(s) - ${
        group.dossier && group.dossier.trim() !== ""
          ? group.dossier
          : "Dossier inconnu"
      }
        </div>
        <div style="font-size: 0.9em; color: #64748b; display: flex; gap: 20px; flex-wrap: wrap;">
          <span>📅 ${new Date(group.date).toLocaleDateString("fr-FR")}</span>
          <span>👤 ${
            group.agent &&
            group.agent.trim() !== "" &&
            group.agent !== "Agent inconnu"
              ? group.agent
              : group.containers &&
                group.containers.length > 0 &&
                group.containers[0]
              ? group.containers[0].nom_agent_visiteur ||
                group.containers[0].visitor_agent_name ||
                group.containers[0].agent_visiteur ||
                localStorage.getItem("NOM Agent visiteurs") ||
                localStorage.getItem(
                  `agent_visiteur_${group.containers[0].id}`
                ) ||
                localStorage.getItem(
                  `deliverycell_${group.containers[0].id}_visitor_agent_name`
                ) ||
                localStorage.getItem(
                  `deliverycell_${group.containers[0].id}_nom_agent_visiteur`
                ) ||
                "Agent non défini"
              : "Agent non défini"
          }</span>
          <span>🚛 ${
            group.transporter && group.transporter.trim() !== ""
              ? group.transporter
              : "-"
          }</span>
        </div>
      `;

      const expandArea = document.createElement("div");
      expandArea.style.display = "flex";
      expandArea.style.alignItems = "center";
      expandArea.style.gap = "15px";

      const containerCount = document.createElement("span");
      containerCount.textContent = `${group.containers.length} TC`;
      containerCount.style.background = "#059669";
      containerCount.style.color = "white";
      containerCount.style.padding = "4px 10px";
      containerCount.style.borderRadius = "12px";
      containerCount.style.fontSize = "0.8em";
      containerCount.style.fontWeight = "600";

      const expandIcon = document.createElement("span");
      expandIcon.innerHTML = "▼";
      expandIcon.className = "history-expand-icon";
      expandIcon.style.color = "#6b7280";
      expandIcon.style.fontSize = "1.4em";
      expandIcon.style.fontWeight = "bold";

      expandArea.appendChild(containerCount);
      expandArea.appendChild(expandIcon);

      groupInfo.appendChild(groupCheckbox);
      groupInfo.appendChild(groupText);
      groupHeader.appendChild(groupInfo);
      groupHeader.appendChild(expandArea);

      // Contenu détaillé du groupe (masqué par défaut)
      const groupContent = document.createElement("div");
      groupContent.className = "history-group-content";
      groupContent.style.display = "none";
      groupContent.style.padding = "0";
      groupContent.style.background = "#fafbfc";

      // Table des conteneurs
      const table = document.createElement("table");
      table.className = "history-table";
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.fontSize = "0.9em";

      table.innerHTML = `
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px 15px; text-align: left; font-weight: bold; color: #374151; width: 60px;">Sél.</th>
            <th style="padding: 12px 15px; text-align: left; font-weight: bold; color: #374151;">Conteneur</th>
            <th style="padding: 12px 15px; text-align: left; font-weight: bold; color: #374151;">Dossier</th>
            <th style="padding: 12px 15px; text-align: left; font-weight: bold; color: #374151;">Client</th>
            <th style="padding: 12px 15px; text-align: left; font-weight: bold; color: #374151;">Agent</th>
            <th style="padding: 12px 15px; text-align: left; font-weight: bold; color: #374151;">Transporteur</th>
            <th style="padding: 12px 15px; text-align: center; font-weight: bold; color: #374151;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${group.containers
            .map(
              (container, containerIndex) => `
            <tr class="history-table-row" style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 15px; text-align: center;">
                <input type="checkbox" class="container-checkbox" data-container-id="${String(
                  container.id
                )}" style="transform: scale(1.2); cursor: pointer; accent-color: #059669;">
              </td>
              <td style="padding: 12px 15px; font-weight: bold; color: #059669;">${
                container.container_number
              }</td>
              <td style="padding: 12px 15px; color: #4b5563;">${
                container.dossier_number || "-"
              }</td>
              <td style="padding: 12px 15px; color: #4b5563;">${
                container.client_name || "-"
              }</td>
              <td style="padding: 12px 15px; color: #4b5563;">${
                container.nom_agent_visiteur ||
                container.visitor_agent_name ||
                container.agent_visiteur ||
                localStorage.getItem("NOM Agent visiteurs") ||
                localStorage.getItem(`agent_visiteur_${container.id}`) ||
                localStorage.getItem(
                  `deliverycell_${container.id}_visitor_agent_name`
                ) ||
                localStorage.getItem(
                  `deliverycell_${container.id}_nom_agent_visiteur`
                ) ||
                "Agent non défini"
              }</td>
              <td style="padding: 12px 15px; color: #4b5563;">${
                container.transporter || "-"
              }</td>
              <td style="padding: 12px 15px; text-align: center;">
                <button onclick="showHistoryEntryDetail('${String(
                  container.id
                )}')" 
                  class="history-action-btn"
                  style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: 500;">
                  📄 Détails
                </button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      `;

      groupContent.appendChild(table);
      groupCard.appendChild(groupHeader);
      groupCard.appendChild(groupContent);
      content.appendChild(groupCard);

      // Gestion du clic sur l'en-tête du groupe
      groupHeader.addEventListener("click", (e) => {
        if (e.target.type !== "checkbox") {
          const isExpanded = groupContent.style.display !== "none";
          groupContent.style.display = isExpanded ? "none" : "block";
          expandIcon.style.transform = isExpanded
            ? "rotate(0deg)"
            : "rotate(180deg)";

          // Animation d'expansion
          if (!isExpanded) {
            groupContent.style.opacity = "0";
            groupContent.style.transform = "translateY(-10px)";
            setTimeout(() => {
              groupContent.style.transition = "all 0.3s ease";
              groupContent.style.opacity = "1";
              groupContent.style.transform = "translateY(0)";
            }, 10);
          }
        }
      });

      // Gestion de la sélection du groupe
      groupCheckbox.addEventListener("change", () => {
        const containerCheckboxes = groupContent.querySelectorAll(
          ".container-checkbox"
        );
        containerCheckboxes.forEach((cb) => {
          cb.checked = groupCheckbox.checked;
          const row = cb.closest("tr");
          if (groupCheckbox.checked) {
            selectedItems.add(cb.dataset.containerId);
            row.classList.add("history-selected-item");
          } else {
            selectedItems.delete(cb.dataset.containerId);
            row.classList.remove("history-selected-item");
          }
        });
        updateSelectionUI();
      });

      // Gestion de la sélection des conteneurs individuels
      const containerCheckboxes = groupContent.querySelectorAll(
        ".container-checkbox"
      );
      containerCheckboxes.forEach((cb) => {
        cb.addEventListener("change", () => {
          const row = cb.closest("tr");
          if (cb.checked) {
            selectedItems.add(cb.dataset.containerId);
            row.classList.add("history-selected-item");
          } else {
            selectedItems.delete(cb.dataset.containerId);
            row.classList.remove("history-selected-item");
          }

          // Mise à jour du checkbox du groupe
          const allChecked = [...containerCheckboxes].every(
            (checkbox) => checkbox.checked
          );
          const someChecked = [...containerCheckboxes].some(
            (checkbox) => checkbox.checked
          );
          groupCheckbox.checked = allChecked;
          groupCheckbox.indeterminate = !allChecked && someChecked;

          updateSelectionUI();
        });
      });
    });
  }

  // Fonction pour mettre à jour l'interface de sélection
  function updateSelectionUI() {
    deleteBtn.style.display = selectedItems.size > 0 ? "block" : "none";
    deleteBtn.textContent = `🗑️ Supprimer sélection (${selectedItems.size})`;

    // Animation du bouton de suppression
    if (selectedItems.size > 0) {
      deleteBtn.style.animation = "pulse 2s infinite";
    } else {
      deleteBtn.style.animation = "none";
    }
  }

  // Événements des boutons
  searchInput.addEventListener("input", filterData);

  selectAllBtn.addEventListener("click", () => {
    document.querySelectorAll(".container-checkbox").forEach((cb) => {
      cb.checked = true;
      selectedItems.add(cb.dataset.containerId);
      cb.closest("tr").classList.add("history-selected-item");
    });
    document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      if (cb !== searchInput) cb.checked = true;
    });
    updateSelectionUI();
    showNotification(`${selectedItems.size} conteneur(s) sélectionné(s)`);
  });

  deselectAllBtn.addEventListener("click", () => {
    document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = false;
      cb.indeterminate = false;
    });
    document.querySelectorAll(".history-selected-item").forEach((row) => {
      row.classList.remove("history-selected-item");
    });
    selectedItems.clear();
    updateSelectionUI();
    showNotification("Sélection effacée", "success");
  });

  deleteBtn.addEventListener("click", () => {
    if (selectedItems.size === 0) {
      showNotification("Aucun élément sélectionné", "error");
      return;
    }

    console.log(
      "🗑️ [DELETE] Éléments sélectionnés:",
      Array.from(selectedItems)
    );

    if (
      confirm(
        `⚠️ Êtes-vous sûr de vouloir supprimer définitivement ${selectedItems.size} conteneur(s) de l'historique ?\n\nCette action est irréversible.`
      )
    ) {
      try {
        const currentHistory = JSON.parse(
          localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
        );

        console.log(
          "🗑️ [DELETE] Historique avant suppression:",
          currentHistory.length,
          "entrées"
        );
        console.log(
          "🗑️ [DELETE] IDs dans l'historique:",
          currentHistory.map((entry) => entry.id)
        );

        const updatedHistory = currentHistory.filter((entry) => {
          // Conversion en string pour assurer la comparaison
          const entryId = String(entry.id);
          const shouldKeep = !selectedItems.has(entryId);
          if (!shouldKeep) {
            console.log(
              "🗑️ [DELETE] Suppression de l'entrée:",
              entryId,
              entry.container_number
            );
          }
          return shouldKeep;
        });

        console.log(
          "🗑️ [DELETE] Historique après suppression:",
          updatedHistory.length,
          "entrées"
        );

        // Sauvegarder le nouvel historique
        localStorage.setItem(
          DELIVERY_HISTORY_KEY,
          JSON.stringify(updatedHistory)
        );

        // Vérifier que la sauvegarde a fonctionné
        const verification = JSON.parse(
          localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
        );
        console.log(
          "🗑️ [DELETE] Vérification sauvegarde:",
          verification.length,
          "entrées"
        );

        showNotification(
          `${selectedItems.size} conteneur(s) supprimé(s) de l'historique`
        );

        // Réinitialiser la sélection
        selectedItems.clear();

        // Rechargement immédiat du contenu
        const newGroupedHistory = groupHistoryByDelivery(updatedHistory);
        filteredData = [...newGroupedHistory];

        // Mettre à jour les statistiques
        const stats = container.querySelector(
          'div[style*="padding: 15px 30px"]'
        );
        if (stats) {
          const lastDeliveryDate =
            updatedHistory.length > 0
              ? new Date(
                  Math.max(
                    ...updatedHistory.map((entry) =>
                      new Date(entry.delivered_at).getTime()
                    )
                  )
                ).toLocaleDateString("fr-FR")
              : "Aucune";

          stats.innerHTML = `
            <div style="display: flex; gap: 30px; flex-wrap: wrap; align-items: center;">
              <div style="color: #059669; font-weight: bold;">
                📦 Total conteneurs livrés: <span style="color: #047857;">${updatedHistory.length}</span>
              </div>
              <div style="color: #059669; font-weight: bold;">
                📋 Groupes de livraison: <span style="color: #047857;">${newGroupedHistory.length}</span>
              </div>
              <div style="color: #059669; font-weight: bold;">
                📅 Dernière livraison: <span style="color: #047857;">${lastDeliveryDate}</span>
              </div>
            </div>
          `;
        }

        // Re-render le contenu
        renderHistoryContent();
      } catch (error) {
        console.error("🗑️ [DELETE] Erreur lors de la suppression:", error);
        showNotification("Erreur lors de la suppression", "error");
      }
    }
  });

  // Rendu initial
  renderHistoryContent();

  modal.appendChild(container);
  document.body.appendChild(modal);

  // Fermeture en cliquant à côté
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  // Ajout d'une animation d'entrée
  modal.style.opacity = "0";
  container.style.transform = "scale(0.9)";
  setTimeout(() => {
    modal.style.transition = "opacity 0.3s ease";
    container.style.transition = "transform 0.3s ease";
    modal.style.opacity = "1";
    container.style.transform = "scale(1)";
  }, 10);
}

/**
 * Groupe l'historique par livraison (même dossier, même date, même agent)
 */
function groupHistoryByDelivery(history) {
  const groups = new Map();

  history.forEach((entry) => {
    // Clé de groupement basée sur dossier, date de livraison et agent
    const date = new Date(entry.delivered_at).toDateString();
    const dossier = entry.dossier_number || "UNKNOWN";
    const agent =
      entry.nom_agent_visiteur || entry.visitor_agent_name || "UNKNOWN";
    const transporter = entry.transporter || "UNKNOWN";

    const groupKey = `${dossier}-${date}-${agent}-${transporter}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        dossier: entry.dossier_number,
        date: entry.delivered_at,
        agent: entry.nom_agent_visiteur || entry.visitor_agent_name,
        transporter: entry.transporter,
        containers: [],
      });
    }

    groups.get(groupKey).containers.push(entry);
  });

  // Convertir en tableau et trier par date (plus récent en premier)
  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

/**
 * Récupère les données complètes depuis le serveur
 */
async function fetchDeliveryFromServer(deliveryId) {
  try {
    const response = await fetch("/api/get-delivery-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delivery_id: deliveryId }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.delivery || null;
    }
  } catch (error) {
    console.error("[FETCH ERROR] Erreur lors de la récupération:", error);
  }
  return null;
}

/**
 * Affiche les détails d'une entrée de l'historique
 */
window.showHistoryEntryDetail = async function (entryId) {
  const history = JSON.parse(
    localStorage.getItem(DELIVERY_HISTORY_KEY) || "[]"
  );
  const entry = history.find((e) => e.id == entryId);

  if (!entry) {
    alert("Entrée non trouvée dans l'historique.");
    return;
  }

  // Récupérer les données fraîches depuis le serveur
  console.log(
    `[DETAIL] Récupération des données serveur pour delivery_id: ${entry.delivery_id}`
  );
  const serverData = await fetchDeliveryFromServer(entry.delivery_id);

  // Fusionner les données serveur avec l'historique local
  const enrichedEntry = {
    ...entry,
    ...(serverData || {}), // Les données serveur écrasent les données locales
    // Garder les métadonnées de livraison locales
    delivered_at: entry.delivered_at,
    delivered_by: entry.delivered_by,
  };

  console.log("[DETAIL] Données enrichies:", enrichedEntry);

  // Debug : Vérifier les données dans localStorage
  console.log(
    "[DEBUG DETAIL] Vérification localStorage pour delivery_id:",
    enrichedEntry.delivery_id
  );
  console.log(
    "[DEBUG DETAIL] Agent visiteur localStorage:",
    localStorage.getItem(`agent_visiteur_${enrichedEntry.delivery_id}`)
  );
  console.log(
    "[DEBUG DETAIL] Transporteur localStorage:",
    localStorage.getItem(`transporteur_${enrichedEntry.delivery_id}`)
  );
  console.log(
    "[DEBUG DETAIL] Inspecteur localStorage:",
    localStorage.getItem(`inspecteur_${enrichedEntry.delivery_id}`)
  );
  console.log(
    "[DEBUG DETAIL] Agent douanes localStorage:",
    localStorage.getItem(`agent_douanes_${enrichedEntry.delivery_id}`)
  );
  console.log(
    "[DEBUG DETAIL] Chauffeur localStorage:",
    localStorage.getItem(`chauffeur_${enrichedEntry.delivery_id}`)
  );
  console.log(
    "[DEBUG DETAIL] Tel chauffeur localStorage:",
    localStorage.getItem(`tel_chauffeur_${enrichedEntry.delivery_id}`)
  );

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
  container.style.maxWidth = "95vw";
  container.style.width = "800px";
  container.style.maxHeight = "90vh";
  container.style.overflowY = "auto";
  container.style.padding = "30px";

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 3px solid #059669; padding-bottom: 20px;">
      <h3 style="margin: 0; color: #059669; font-size: 1.3em;">  Détails du Dossier ${
        enrichedEntry.dossier_number ||
        enrichedEntry.file_number ||
        enrichedEntry.container_number
      }</h3>
      <button onclick="document.getElementById('historyDetailModal').remove()" 
        style="background: #ef4444; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
        ✕ Fermer
      </button>
    </div>
    
    <!-- Section Identification -->
    <div style="background: linear-gradient(135deg, #f0f9f4 0%, #e6f7ed 100%); border-left: 4px solid #059669; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 15px 0; color: #059669; font-size: 1.1em; font-weight: 700; display: flex; align-items: center; gap: 8px;">
        🆔 Identification
      </h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Conteneur:</strong> 
          <span style="color: #059669; font-weight: 600;">${
            enrichedEntry.container_number
          }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Dossier:</strong> 
          <span style="color: #1f2937; font-weight: 600;">${
            enrichedEntry.dossier_number || "-"
          }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">BL:</strong> 
          <span style="color: #1f2937; font-weight: 600;">${
            enrichedEntry.bl_number || "-"
          }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Circuit:</strong> 
          <span style="color: #1f2937; font-weight: 600;">${
            enrichedEntry.circuit || "-"
          }</span>
        </div>
      </div>
    </div>

    <!-- Section Client -->
    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #2563eb; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 15px 0; color: #2563eb; font-size: 1.1em; font-weight: 700; display: flex; align-items: center; gap: 8px;">
        👤 Informations Client
      </h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Client:</strong> 
          <span style="color: #1f2937; font-weight: 600;">${
            enrichedEntry.client_name || "-"
          }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Téléphone client:</strong> 
          <span style="color: ${
            enrichedEntry.client_phone &&
            enrichedEntry.client_phone !== "-" &&
            enrichedEntry.client_phone !== ""
              ? "#059669"
              : "#9ca3af"
          }; font-weight: 600;">${
    enrichedEntry.client_phone &&
    enrichedEntry.client_phone !== "" &&
    enrichedEntry.client_phone !== "-"
      ? enrichedEntry.client_phone
      : "-"
  }</span>
        </div>
      </div>
    </div>

    <!-- Section Personnel -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 15px 0; color: #f59e0b; font-size: 1.1em; font-weight: 700; display: flex; align-items: center; gap: 8px;">
        👥 Personnel & Intervenants
      </h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Agent visiteur:</strong> 
          <span style="color: ${
            (enrichedEntry.nom_agent_visiteur ||
              enrichedEntry.visitor_agent_name ||
              localStorage.getItem("NOM Agent visiteurs") ||
              localStorage.getItem(
                `agent_visiteur_${enrichedEntry.delivery_id}`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_visitor_agent_name`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_nom_agent_visiteur`
              )) &&
            (enrichedEntry.nom_agent_visiteur ||
              enrichedEntry.visitor_agent_name ||
              localStorage.getItem("NOM Agent visiteurs") ||
              localStorage.getItem(
                `agent_visiteur_${enrichedEntry.delivery_id}`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_visitor_agent_name`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_nom_agent_visiteur`
              )) !== "-"
              ? "#059669"
              : "#ef4444"
          }; font-weight: 600;">${
    enrichedEntry.nom_agent_visiteur ||
    enrichedEntry.visitor_agent_name ||
    localStorage.getItem("NOM Agent visiteurs") ||
    localStorage.getItem(`agent_visiteur_${enrichedEntry.delivery_id}`) ||
    localStorage.getItem(
      `deliverycell_${enrichedEntry.delivery_id}_visitor_agent_name`
    ) ||
    localStorage.getItem(
      `deliverycell_${enrichedEntry.delivery_id}_nom_agent_visiteur`
    ) ||
    "Non défini"
  }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Transporteur:</strong> 
          <span style="color: ${
            (enrichedEntry.transporter ||
              localStorage.getItem(
                `transporteur_${enrichedEntry.delivery_id}`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_transporter`
              )) &&
            (enrichedEntry.transporter ||
              localStorage.getItem(
                `transporteur_${enrichedEntry.delivery_id}`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_transporter`
              )) !== "-"
              ? "#059669"
              : "#ef4444"
          }; font-weight: 600;">${
    enrichedEntry.transporter ||
    localStorage.getItem(`transporteur_${enrichedEntry.delivery_id}`) ||
    localStorage.getItem(
      `deliverycell_${enrichedEntry.delivery_id}_transporter`
    ) ||
    "Non défini"
  }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Inspecteur:</strong> 
          <span style="color: ${
            (enrichedEntry.inspector ||
              enrichedEntry.inspecteur ||
              localStorage.getItem(`inspecteur_${enrichedEntry.delivery_id}`) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_inspector`
              )) &&
            (enrichedEntry.inspector ||
              enrichedEntry.inspecteur ||
              localStorage.getItem(`inspecteur_${enrichedEntry.delivery_id}`) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_inspector`
              )) !== "-"
              ? "#059669"
              : "#ef4444"
          }; font-weight: 600;">${
    enrichedEntry.inspector ||
    enrichedEntry.inspecteur ||
    localStorage.getItem(`inspecteur_${enrichedEntry.delivery_id}`) ||
    localStorage.getItem(
      `deliverycell_${enrichedEntry.delivery_id}_inspector`
    ) ||
    "Non défini"
  }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Agent en douanes:</strong> 
          <span style="color: ${
            (enrichedEntry.customs_agent ||
              enrichedEntry.agent_en_douanes ||
              localStorage.getItem(
                `agent_douanes_${enrichedEntry.delivery_id}`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_customs_agent`
              )) &&
            (enrichedEntry.customs_agent ||
              enrichedEntry.agent_en_douanes ||
              localStorage.getItem(
                `agent_douanes_${enrichedEntry.delivery_id}`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_customs_agent`
              )) !== "-"
              ? "#059669"
              : "#ef4444"
          }; font-weight: 600;">${
    enrichedEntry.customs_agent ||
    enrichedEntry.agent_en_douanes ||
    localStorage.getItem(`agent_douanes_${enrichedEntry.delivery_id}`) ||
    localStorage.getItem(
      `deliverycell_${enrichedEntry.delivery_id}_customs_agent`
    ) ||
    "Non défini"
  }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Chauffeur:</strong> 
          <span style="color: ${
            (enrichedEntry.driver ||
              enrichedEntry.driver_name ||
              enrichedEntry.chauffeur ||
              localStorage.getItem(`chauffeur_${enrichedEntry.delivery_id}`) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_driver`
              )) &&
            (enrichedEntry.driver ||
              enrichedEntry.driver_name ||
              enrichedEntry.chauffeur ||
              localStorage.getItem(`chauffeur_${enrichedEntry.delivery_id}`) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_driver`
              )) !== "-"
              ? "#059669"
              : "#ef4444"
          }; font-weight: 600;">${
    enrichedEntry.driver ||
    enrichedEntry.driver_name ||
    enrichedEntry.chauffeur ||
    localStorage.getItem(`chauffeur_${enrichedEntry.delivery_id}`) ||
    localStorage.getItem(`deliverycell_${enrichedEntry.delivery_id}_driver`) ||
    "Non défini"
  }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Tél. chauffeur:</strong> 
          <span style="color: ${
            (enrichedEntry.driver_phone ||
              enrichedEntry.tel_chauffeur ||
              localStorage.getItem(
                `tel_chauffeur_${enrichedEntry.delivery_id}`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_driver_phone`
              )) &&
            (enrichedEntry.driver_phone ||
              enrichedEntry.tel_chauffeur ||
              localStorage.getItem(
                `tel_chauffeur_${enrichedEntry.delivery_id}`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_driver_phone`
              )) !== "-" &&
            (enrichedEntry.driver_phone ||
              enrichedEntry.tel_chauffeur ||
              localStorage.getItem(
                `tel_chauffeur_${enrichedEntry.delivery_id}`
              ) ||
              localStorage.getItem(
                `deliverycell_${enrichedEntry.delivery_id}_driver_phone`
              )) !== ""
              ? "#059669"
              : "#ef4444"
          }; font-weight: 600;">${
    enrichedEntry.driver_phone ||
    enrichedEntry.tel_chauffeur ||
    localStorage.getItem(`tel_chauffeur_${enrichedEntry.delivery_id}`) ||
    localStorage.getItem(
      `deliverycell_${enrichedEntry.delivery_id}_driver_phone`
    ) ||
    "Non défini"
  }</span>
        </div>
      </div>
    </div>

    <!-- Section Technique -->
    <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-left: 4px solid #8b5cf6; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 15px 0; color: #8b5cf6; font-size: 1.1em; font-weight: 700; display: flex; align-items: center; gap: 8px;">
        ⚙️ Informations Techniques
      </h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Type conteneur:</strong> 
          <span style="color: #1f2937; font-weight: 600;">${
            enrichedEntry.container_foot_type ||
            enrichedEntry.container_type_and_content ||
            "-"
          }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Poids:</strong> 
          <span style="color: #1f2937; font-weight: 600;">${
            enrichedEntry.weight || "-"
          }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Nom navire:</strong> 
          <span style="color: #1f2937; font-weight: 600;">${
            enrichedEntry.ship_name || "-"
          }</span>
        </div>
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <strong style="color: #374151;">Compagnie maritime:</strong> 
          <span style="color: #1f2937; font-weight: 600;">${
            enrichedEntry.shipping_company || "-"
          }</span>
        </div>
      </div>
    </div>



    <!-- Section Statut de Livraison -->
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
      <h4 style="margin: 0 0 15px 0; font-size: 1.2em; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px;">
        ✅ Statut de Livraison
      </h4>
      <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
        <div style="font-size: 1.1em; font-weight: 600; margin-bottom: 8px;">
          <strong>Livré le:</strong> ${new Date(
            enrichedEntry.delivered_at
          ).toLocaleString("fr-FR")}
        </div>
        <div style="font-size: 1.1em; font-weight: 600;">
          <strong>Livré par:</strong> ${
            enrichedEntry.employee_name ||
            enrichedEntry.delivered_by ||
            enrichedEntry.nom_agent_visiteur ||
            enrichedEntry.visitor_agent_name ||
            localStorage.getItem("NOM Agent visiteurs") ||
            localStorage.getItem(
              `agent_visiteur_${enrichedEntry.delivery_id}`
            ) ||
            localStorage.getItem(
              `deliverycell_${enrichedEntry.delivery_id}_visitor_agent_name`
            ) ||
            localStorage.getItem(
              `deliverycell_${enrichedEntry.delivery_id}_nom_agent_visiteur`
            ) ||
            "-"
          }
        </div>
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
// === SYSTÈME DE COMPTE À REBOURS ET GESTION PDF ===
// ========================================================================

let countdownInterval = null;
let countdownEndTime = null;

/**
 * Affiche la pop-up de confirmation pour la génération PDF
 */
function showPDFConfirmationModal() {
  return new Promise((resolve) => {
    // Supprimer la modal existante si elle existe
    const existingModal = document.getElementById("pdfConfirmationModal");
    if (existingModal) existingModal.remove();

    // Créer la modal
    const modal = document.createElement("div");
    modal.id = "pdfConfirmationModal";
    modal.className = "pdf-confirmation-modal";

    const content = document.createElement("div");
    content.className = "pdf-confirmation-content";

    content.innerHTML = `
      <div class="pdf-confirmation-title">📄 Génération PDF</div>
      <div class="pdf-confirmation-message">
        Voulez-vous garder les dossiers dans le tableau ou les enlever après avoir marqué qu'ils sont livrés ?
      </div>
      <div class="pdf-confirmation-buttons">
        <button class="pdf-confirmation-btn pdf-btn-yes" data-choice="yes">
          ✅ Oui, enlever
        </button>
        <button class="pdf-confirmation-btn pdf-btn-no" data-choice="no">
          ❌ Non, garder
        </button>
        <button class="pdf-confirmation-btn pdf-btn-delay" data-choice="delay">
          ⏰ Garder pendant un moment
        </button>
      </div>
    `;

    // Gestion des clics
    content.addEventListener("click", (e) => {
      if (e.target.classList.contains("pdf-confirmation-btn")) {
        const choice = e.target.dataset.choice;
        modal.remove();

        if (choice === "delay") {
          showDelayConfirmationMessage().then(() => {
            startCountdown();
            resolve(choice);
          });
        } else {
          resolve(choice);
        }
      }
    });

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Fermer en cliquant à côté
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        resolve(null);
      }
    });
  });
}

/**
 * Affiche le message de confirmation pour le délai d'une semaine
 */
function showDelayConfirmationMessage() {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "pdf-confirmation-modal";

    const content = document.createElement("div");
    content.className = "pdf-confirmation-content";

    content.innerHTML = `
      <div class="pdf-confirmation-title">⏰ Délai configuré</div>
      <div class="pdf-confirmation-message">
        Les dossiers seront gardés pendant <strong>1 semaine</strong> avant d'être automatiquement supprimés du tableau.
        <br><br>
        Un compte à rebours apparaîtra à côté du bouton historique.
      </div>
      <div class="pdf-confirmation-buttons">
        <button class="pdf-confirmation-btn pdf-btn-no" onclick="this.closest('.pdf-confirmation-modal').remove()">
          ✅ OK, j'ai compris
        </button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Auto-fermeture après clic sur OK
    content.querySelector("button").addEventListener("click", () => {
      modal.remove();
      resolve();
    });
  });
}

/**
 * Démarre le compte à rebours d'une semaine
 */
function startCountdown() {
  const now = new Date();
  countdownEndTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  // Sauvegarder dans localStorage
  localStorage.setItem("countdownEndTime", countdownEndTime.toISOString());

  createCountdownUI();
  updateCountdown();

  // Mettre à jour chaque seconde
  countdownInterval = setInterval(updateCountdown, 1000);
}

/**
 * Crée l'interface utilisateur du compte à rebours
 */
function createCountdownUI() {
  // Supprimer l'existant
  const existing = document.getElementById("countdownContainer");
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.id = "countdownContainer";
  container.className = "countdown-container countdown-pulse";
  container.title = "Cliquez pour annuler le processus";

  container.innerHTML = `
    <div class="countdown-timer" id="countdownTimer">7j 00h 00m 00s</div>
    <div class="countdown-label">Suppression auto</div>
  `;

  // Gestion du clic pour annuler
  container.addEventListener("click", showCancelCountdownModal);

  document.body.appendChild(container);
}

/**
 * Met à jour l'affichage du compte à rebours
 */
function updateCountdown() {
  if (!countdownEndTime) return;

  const now = new Date();
  const timeLeft = countdownEndTime - now;

  if (timeLeft <= 0) {
    // Temps écoulé - supprimer automatiquement
    executeAutoRemoval();
    return;
  }

  // Calculer les jours, heures, minutes, secondes
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  // Mettre à jour l'affichage
  const timerElement = document.getElementById("countdownTimer");
  if (timerElement) {
    timerElement.textContent = `${days}j ${hours
      .toString()
      .padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds
      .toString()
      .padStart(2, "0")}s`;
  }
}

/**
 * Affiche la modal de confirmation d'annulation
 */
function showCancelCountdownModal() {
  const modal = document.createElement("div");
  modal.className = "pdf-confirmation-modal";

  const content = document.createElement("div");
  content.className = "pdf-confirmation-content";

  content.innerHTML = `
    <div class="pdf-confirmation-title">❓ Annuler le processus</div>
    <div class="pdf-confirmation-message">
      Voulez-vous annuler le processus de suppression automatique ?
      <br><br>
      Les dossiers resteront dans le tableau indéfiniment.
    </div>
    <div class="pdf-confirmation-buttons">
      <button class="pdf-confirmation-btn pdf-btn-yes" data-action="cancel">
        ✅ Oui, annuler
      </button>
      <button class="pdf-confirmation-btn pdf-btn-no" data-action="continue">
        ❌ Non, continuer
      </button>
    </div>
  `;

  content.addEventListener("click", (e) => {
    if (e.target.dataset.action === "cancel") {
      cancelCountdown();
      modal.remove();
    } else if (e.target.dataset.action === "continue") {
      modal.remove();
    }
  });

  modal.appendChild(content);
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Annule le compte à rebours
 */
function cancelCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  countdownEndTime = null;
  localStorage.removeItem("countdownEndTime");

  const container = document.getElementById("countdownContainer");
  if (container) container.remove();

  showNotification("Processus de suppression automatique annulé", "success");
}

/**
 * Exécute la suppression automatique après le délai
 */
function executeAutoRemoval() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  countdownEndTime = null;
  localStorage.removeItem("countdownEndTime");

  const container = document.getElementById("countdownContainer");
  if (container) container.remove();

  // Supprimer les livraisons du tableau principal mais garder dans l'historique
  removeDeliveredFromMainTable();

  showNotification(
    "Livraisons supprimées automatiquement du tableau (conservées dans l'historique)",
    "success"
  );
}

/**
 * Supprime les livraisons livrées du tableau principal
 */
function removeDeliveredFromMainTable() {
  if (!window.allDeliveries) return;

  let removedCount = 0;
  const deliveredToArchive = [];

  // Filtrer pour garder seulement les livraisons non entièrement livrées
  window.allDeliveries = window.allDeliveries.filter((delivery) => {
    // Utiliser la même logique que updateDeliveredForPdf pour déterminer si livré
    let tcList =
      delivery.container_numbers_list &&
      Array.isArray(delivery.container_numbers_list)
        ? delivery.container_numbers_list.filter(Boolean)
        : Array.isArray(delivery.container_number)
        ? delivery.container_number.filter(Boolean)
        : typeof delivery.container_number === "string"
        ? delivery.container_number.split(/[,;\s]+/).filter(Boolean)
        : [];

    let allTcLivres =
      tcList.length > 0 &&
      tcList.every((tc) => {
        let s = delivery.container_statuses && delivery.container_statuses[tc];
        return s === "livre" || s === "livré";
      });

    let globalLivree =
      (delivery.status &&
        (delivery.status === "livre" || delivery.status === "livré")) ||
      (delivery.delivery_status_acconier &&
        (delivery.delivery_status_acconier === "livre" ||
          delivery.delivery_status_acconier === "livré"));

    const isDelivered = allTcLivres || globalLivree;

    if (isDelivered) {
      removedCount++;
      deliveredToArchive.push(delivery);
      return false; // Supprimer du tableau
    }

    return true; // Garder dans le tableau
  });

  // Archiver automatiquement les dossiers livrés
  if (
    deliveredToArchive.length > 0 &&
    typeof window.archiveDossier === "function"
  ) {
    deliveredToArchive.forEach(async (delivery) => {
      try {
        await window.archiveDossier(
          delivery,
          "livraison",
          "Responsable Livraison",
          window.location.href
        );
        console.log(
          `[ARCHIVE] Dossier livré archivé: ${
            delivery.dossier_number || delivery.id
          }`
        );
      } catch (error) {
        console.error(
          "[ARCHIVE] Erreur lors de l'archivage du dossier livré:",
          error
        );
      }
    });
  }

  // Rafraîchir l'affichage
  const dateStartInput = document.getElementById("mainTableDateStartFilter");
  const dateEndInput = document.getElementById("mainTableDateEndFilter");
  if (dateStartInput && dateEndInput) {
    updateTableForDateRange(dateStartInput.value, dateEndInput.value);
  }

  // Déclencher un événement de mise à jour pour informer tous les composants
  window.dispatchEvent(new CustomEvent("allDeliveriesUpdated"));

  // Forcer un rafraîchissement supplémentaire si une fonction de rafraîchissement existe
  if (typeof refreshTableInAdminModeRespLiv === "function") {
    setTimeout(() => refreshTableInAdminModeRespLiv(), 100);
  }

  console.log(
    `[AUTO-REMOVAL] ${removedCount} livraisons supprimées du tableau principal`
  );
}

/**
 * Restaure le compte à rebours si il était en cours lors du rechargement de la page
 */
function restoreCountdownIfActive() {
  const savedEndTime = localStorage.getItem("countdownEndTime");
  if (savedEndTime) {
    countdownEndTime = new Date(savedEndTime);
    const now = new Date();

    if (countdownEndTime > now) {
      // Le compte à rebours est encore valide
      createCountdownUI();
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    } else {
      // Le temps est écoulé, nettoyer
      localStorage.removeItem("countdownEndTime");
    }
  }
}

// ========================================================================
// === FIN HISTORIQUE PROFESSIONNEL ===
// ========================================================================

// ========================================================================
// === GESTION DES DOSSIERS EN RETARD ===
// ========================================================================

let lateDeliveriesData = [];

// Fonction pour calculer les dossiers en retard
function calculateLateDeliveries(deliveries) {
  console.log(
    "📊 DEBUG - Échantillon des données reçues:",
    deliveries.slice(0, 1)
  );
  if (deliveries.length > 0) {
    console.log(
      "📊 DEBUG - Clés du premier objet:",
      Object.keys(deliveries[0])
    );
  }

  const now = new Date();
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 2 jours en millisecondes

  console.log(
    `📅 Date actuelle pour calcul: ${now.toLocaleDateString("fr-FR")}`
  );

  const lateDeliveries = deliveries.filter((delivery) => {
    // Vérifier si le dossier est déjà livré - plusieurs conditions de vérification
    const isDelivered =
      delivery.statut === "Livré" ||
      delivery.statut === "LIVRE" ||
      delivery.statut === "livré" ||
      delivery.statut === "livre" ||
      delivery.statut === "delivered" ||
      delivery.statut === "Delivered" ||
      delivery.statut === "DELIVERED" ||
      delivery.status === "delivered" ||
      delivery.status === "Livré" ||
      delivery.status === "LIVRE" ||
      delivery.status === "Delivered" ||
      delivery.status === "DELIVERED" ||
      delivery.delivery_status === "delivered" ||
      delivery.delivery_status === "Livré" ||
      delivery.delivery_status_acconier === "delivered" ||
      delivery.delivery_status_acconier === "livré" ||
      delivery.delivery_status_acconier === "processed_acconier" ||
      delivery.date_livraison ||
      delivery.delivery_date ||
      delivery.delivered_at;

    if (isDelivered) {
      console.log(`✅ Dossier livré exclu du tableau d'alerte:`, {
        id: delivery.id || delivery.numero_dossier || "inconnu",
        client: delivery.nom_client || delivery.client_name || "Client inconnu",
        statut: delivery.statut || delivery.status,
        delivery_status_acconier: delivery.delivery_status_acconier,
        date_livraison: delivery.date_livraison || delivery.delivery_date,
      });
      return false;
    }

    // Trouver la date de référence (dernière mise à jour ou date de création)
    let referenceDate = null;

    // Priorité aux dates de mise à jour récentes
    const dateFields = [
      "updated_at",
      "date_modification",
      "last_updated",
      "date_creation",
      "created_at",
      "date",
      "date_do",
      "date_badt",
      "date_soumission",
    ];

    for (let field of dateFields) {
      if (delivery[field]) {
        const testDate = new Date(delivery[field]);
        if (!isNaN(testDate.getTime())) {
          referenceDate = testDate;
          break;
        }
      }
    }

    if (!referenceDate) {
      console.warn(
        `⚠️ Aucune date trouvée pour le dossier ID: ${delivery.id || "inconnu"}`
      );
      return false;
    }

    // Calculer la différence en jours
    const diffTime = now.getTime() - referenceDate.getTime();
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));

    const isLate = diffTime > twoDaysInMs;

    if (isLate) {
      console.log(`🚨 Dossier en retard trouvé:`, {
        id: delivery.id || delivery.numero_dossier || "inconnu",
        client: delivery.nom_client || delivery.client_name || "Client inconnu",
        referenceDate: referenceDate.toLocaleDateString("fr-FR"),
        diffDays: diffDays,
        statut: delivery.statut || delivery.status,
      });
    }

    return isLate;
  });

  console.log(
    `📊 Résultat: ${lateDeliveries.length} dossiers en retard sur ${deliveries.length} total`
  );
  return lateDeliveries;
}

// Fonction pour mettre à jour l'alerte des dossiers en retard
function updateLateDeliveriesAlert(deliveries) {
  lateDeliveriesData = calculateLateDeliveries(deliveries);
  const alertElement = document.getElementById("lateDeliveriesAlert");
  const textElement = document.getElementById("lateDeliveriesText");

  if (lateDeliveriesData.length > 0) {
    textElement.textContent = `Alerte : ${lateDeliveriesData.length} dossier(s) en retard (plus de 2 jours)`;
    alertElement.style.display = "block";

    // Animation de pulsation pour attirer l'attention
    alertElement.style.animation = "pulse 2s infinite";
  } else {
    alertElement.style.display = "none";
  }
}

// Fonction pour créer le menu déroulant des numéros TC
function createTCDropdown(tcNumbers) {
  if (!tcNumbers || tcNumbers.length === 0) {
    return "-";
  }

  if (tcNumbers.length === 1) {
    return tcNumbers[0];
  }

  const selectId = `tc-select-${Math.random().toString(36).substr(2, 9)}`;
  let html = `
    <select id="${selectId}" style="
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.8em;
      background: white;
      cursor: pointer;
      max-width: 120px;
    ">
      <option value="">Voir TC (${tcNumbers.length})</option>
  `;

  tcNumbers.forEach((tc, index) => {
    html += `<option value="${tc}">TC ${index + 1}: ${tc}</option>`;
  });

  html += "</select>";
  return html;
}

// Fonction pour formater les dates au format français
function formatDate(dateValue) {
  if (!dateValue || dateValue === "-" || dateValue === "") {
    return "-";
  }

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return dateValue; // Retourner la valeur originale si ce n'est pas une date valide
    }

    // Format français : JJ/MM/AAAA
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return dateValue; // Retourner la valeur originale en cas d'erreur
  }
}

// Fonction pour afficher la modale des dossiers en retard
function showLateDeliveriesModal() {
  const modal = document.getElementById("lateDeliveriesModal");
  const tableBody = document.getElementById("lateDeliveriesTableBody");
  const countElement = document.getElementById("lateDeliveriesCount");

  // Mettre à jour le compteur
  countElement.textContent = `${lateDeliveriesData.length} dossier(s)`;

  // Vider le tableau
  tableBody.innerHTML = "";

  console.log(
    "🎯 Affichage de la modale avec",
    lateDeliveriesData.length,
    "dossiers en retard"
  );

  // Remplir le tableau avec les dossiers en retard
  lateDeliveriesData.forEach((delivery, index) => {
    console.log(`📋 Traitement dossier ${index + 1}:`, delivery);

    // Traiter les numéros TC avec plusieurs variantes de noms de champs
    let tcNumbers = [];
    if (delivery.numero_tc) {
      if (Array.isArray(delivery.numero_tc)) {
        tcNumbers = delivery.numero_tc;
      } else if (typeof delivery.numero_tc === "string") {
        tcNumbers = delivery.numero_tc
          .split(",")
          .map((tc) => tc.trim())
          .filter((tc) => tc);
      }
    } else if (delivery.container_number) {
      if (Array.isArray(delivery.container_number)) {
        tcNumbers = delivery.container_number;
      } else if (typeof delivery.container_number === "string") {
        tcNumbers = delivery.container_number
          .split(",")
          .map((tc) => tc.trim())
          .filter((tc) => tc);
      }
    } else if (
      delivery.container_numbers_list &&
      Array.isArray(delivery.container_numbers_list)
    ) {
      tcNumbers = delivery.container_numbers_list;
    }

    // Fonction helper pour obtenir la valeur avec plusieurs variantes de noms et la convertir en MAJUSCULES
    function getValue(obj, variants) {
      for (let variant of variants) {
        if (
          obj[variant] !== undefined &&
          obj[variant] !== null &&
          obj[variant] !== ""
        ) {
          return String(obj[variant]).toUpperCase();
        }
      }

      // Debug temporaire pour CONTENU uniquement
      if (variants.includes("container_type_and_content")) {
        console.log(
          "🔍 DEBUG CONTENU - Clés disponibles:",
          Object.keys(obj).filter(
            (key) =>
              key.toLowerCase().includes("content") ||
              key.toLowerCase().includes("contenu") ||
              key.toLowerCase().includes("container") ||
              key.toLowerCase().includes("type")
          )
        );
        console.log(
          "🔍 DEBUG CONTENU - Valeurs testées:",
          variants.map((v) => `${v}: ${obj[v]}`)
        );
      }

      return "-";
    }

    // Fonction helper pour obtenir et formater les dates en MAJUSCULES
    function getFormattedDate(obj, variants) {
      const dateValue = getValue(obj, variants);
      if (dateValue === "-") return "-";

      // Extraire la valeur originale (non en majuscules) pour le formatage
      let originalValue = null;
      for (let variant of variants) {
        if (
          obj[variant] !== undefined &&
          obj[variant] !== null &&
          obj[variant] !== ""
        ) {
          originalValue = obj[variant];
          break;
        }
      }

      return formatDate(originalValue).toUpperCase();
    }

    const row = document.createElement("tr");
    row.style.cssText =
      "border-bottom: 1px solid #f1f5f9; transition: background 0.2s ease;";

    row.onmouseover = function () {
      this.style.background = "#f8fafc";
    };
    row.onmouseout = function () {
      this.style.background = "white";
    };

    // Créer le contenu HTML de la ligne avec des informations complètes
    const dateValue = getFormattedDate(delivery, [
      "date",
      "created_at",
      "date_creation",
      "updated_at",
    ]);
    const agentValue = getValue(delivery, [
      "agent_acconier",
      "responsible_acconier",
      "resp_acconier",
      "nom_agent_visiteur",
      "employee_name",
    ]);
    const clientValue = getValue(delivery, [
      "nom_client",
      "client_name",
      "client",
    ]);
    const clientNumberValue = getValue(delivery, [
      "numero_client",
      "client_number",
      "client_id",
    ]);
    const lieuValue = getValue(delivery, ["lieu", "location", "port"]);
    const typeConteneurValue = getValue(delivery, [
      "container_foot_type",
      "type_conteneur",
      "container_type",
      "tc_type",
      "foot_type",
      "container_size",
    ]);
    const contenuValue = getValue(delivery, [
      "container_type_and_content",
      "contenu",
      "content",
      "description",
      "cargo_description",
      "container_content",
      "type_and_content",
      "marchandise",
      "goods",
      "cargo",
      "produit",
      "product",
    ]);
    const modeTransportValue = getValue(delivery, [
      "transporter_mode",
      "mode_transport",
      "transport_mode",
      "transport_type",
      "mode",
      "modeTransport",
      "typeTransport",
      "mode_de_transport",
      "transport",
      "modalite_transport",
      "moyen_transport",
      "category",
      "type_operation",
      "operation_type",
    ]);

    // Dates formatées
    const dateDOValue = getFormattedDate(delivery, [
      "date_do",
      "do_date",
      "discharge_order_date",
    ]);
    const dateBADTValue = getFormattedDate(delivery, [
      "date_badt",
      "badt_date",
      "customs_clearance_date",
    ]);
    const dateLivraisonValue = getFormattedDate(delivery, [
      "date_livraison",
      "delivery_date",
      "delivered_at",
    ]);

    row.innerHTML =
      '<td style="padding: 8px; white-space: nowrap;">' +
      (index + 1) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      dateValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      agentValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      clientValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      clientNumberValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      lieuValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      typeConteneurValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      contenuValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, [
        "numero_declaration",
        "declaration_number",
        "decl_number",
      ]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["numero_bl", "bl_number", "bill_of_lading"]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, [
        "numero_dossier",
        "dossier_number",
        "folder_number",
        "id",
      ]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, [
        "number_of_containers",
        "nombre_conteneurs",
        "container_count",
        "nb_containers",
      ]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, [
        "compagnie_maritime",
        "shipping_company",
        "company",
      ]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["poids", "weight", "gross_weight"]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["nom_navire", "vessel_name", "ship_name"]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["circuit", "flow", "direction"]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      modeTransportValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      dateDOValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      dateBADTValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, [
        "nom_agent_visiteur",
        "agent_visiteur",
        "visitor_agent",
        "employee_name",
      ]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["transporteur", "transporter", "carrier"]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["inspecteur", "inspector", "controller"]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["agent_douanes", "customs_agent", "douane_agent"]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["chauffeur", "driver", "driver_name"]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["tel_chauffeur", "driver_phone", "phone_driver"]) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      dateLivraisonValue +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;">' +
      createTCDropdown(tcNumbers) +
      "</td>" +
      '<td style="padding: 8px; white-space: nowrap;"><span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 500;">EN RETARD</span></td>' +
      '<td style="padding: 8px; white-space: nowrap;">' +
      getValue(delivery, ["observations", "comments", "notes", "remarks"]) +
      "</td>";

    tableBody.appendChild(row);
  });

  // Afficher la modale
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

// Fonction pour fermer la modale des dossiers en retard
function closeLateDeliveriesModal(event) {
  if (event && event.target !== event.currentTarget) {
    return;
  }

  const modal = document.getElementById("lateDeliveriesModal");
  modal.style.display = "none";
  document.body.style.overflow = "auto";
}

// Fonction pour intégrer la vérification des dossiers en retard dans le chargement des données
function integrateLateBelliveriesCheck() {
  // Surveillance de window.allDeliveries pour détecter les changements
  let previousAllDeliveriesLength = 0;

  function checkForDataChanges() {
    if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
      if (window.allDeliveries.length !== previousAllDeliveriesLength) {
        updateLateDeliveriesAlert(window.allDeliveries);
        previousAllDeliveriesLength = window.allDeliveries.length;
      }
    }
  }

  // Vérifier toutes les 2 secondes si les données ont changé
  setInterval(checkForDataChanges, 2000);

  // Vérification initiale
  setTimeout(checkForDataChanges, 1000);

  // Hook pour MutationObserver sur le tableau principal pour détecter les changements
  const targetNode = document.getElementById("deliveriesTableBody");
  if (targetNode) {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "childList" && window.allDeliveries) {
          updateLateDeliveriesAlert(window.allDeliveries);
        }
      });
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });
  }
}

// Ajouter les styles CSS pour l'animation de pulsation
function addLateDeliveriesStyles() {
  if (document.getElementById("lateDeliveriesStyles")) return;

  const style = document.createElement("style");
  style.id = "lateDeliveriesStyles";
  style.textContent = `
    @keyframes pulse {
      0% {
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        transform: scale(1);
      }
      50% {
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        transform: scale(1.02);
      }
      100% {
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        transform: scale(1);
      }
    }
    
    #lateDeliveriesAlert:hover {
      background: linear-gradient(90deg, #fee2e2 0%, #fecaca 100%) !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3) !important;
    }
    
    #lateDeliveriesModal {
      backdrop-filter: blur(4px);
    }
    
    #lateDeliveriesTable tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    #lateDeliveriesTable tbody tr:hover {
      background-color: #f3f4f6 !important;
    }
  `;
  document.head.appendChild(style);
}

// Initialiser le système de dossiers en retard
document.addEventListener("DOMContentLoaded", function () {
  addLateDeliveriesStyles();
  integrateLateBelliveriesCheck();

  // 🚀 Fonction de flash pour dossiers redirigés depuis le tableau de bord
  setTimeout(() => {
    flashTargetDelivery();
  }, 2000); // Attendre 2 secondes que tout soit chargé

  // Vérifier périodiquement les dossiers en retard (toutes les 30 secondes)
  setInterval(function () {
    if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
      updateLateDeliveriesAlert(window.allDeliveries);
    }
  }, 30 * 1000);

  // Vérification initiale après 3 secondes pour laisser le temps au chargement initial
  setTimeout(function () {
    if (window.allDeliveries && Array.isArray(window.allDeliveries)) {
      updateLateDeliveriesAlert(window.allDeliveries);
    }
  }, 3000);
});

// ========================================================================
// === FIN GESTION DES DOSSIERS EN RETARD ===
// ========================================================================
/**12345 */
/**JESUS MA FORCE  */
