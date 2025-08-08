/**
 * Utilitaire pour la gestion du mode admin dans les pages responsables
 * Ce fichier aide à détecter si une page responsable est accédée en mode admin (visualisation)
 * ou en mode normal (édition)
 */

class AdminModeManager {
  constructor() {
    this.isAdminMode = this.detectAdminMode();
    this.initializeAdminMode();
  }

  /**
   * Détecte si la page est accédée en mode admin sv
   */
  detectAdminMode() {
    // Vérifier les paramètres URL
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get("mode");

    // Vérifier le localStorage
    const adminViewMode = localStorage.getItem("adminViewMode");
    const adminTimestamp = localStorage.getItem("adminViewTimestamp");

    // Vérifier si la session admin est valide (moins de 2 heures)
    let isValidAdminSession = false;
    if (adminTimestamp) {
      const timeDiff = Date.now() - parseInt(adminTimestamp);
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      isValidAdminSession = timeDiff < twoHoursInMs;
    }

    return (
      modeParam === "admin" && adminViewMode === "true" && isValidAdminSession
    );
  }

  /**
   * Initialise le mode admin si détecté
   */
  initializeAdminMode() {
    if (this.isAdminMode) {
      console.log(
        "🔒 Mode Admin détecté - Page en mode visualisation uniquement"
      );

      // Attendre que le DOM soit complètement chargé
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          this.applyAdminMode();
        });
      } else {
        this.applyAdminMode();
      }
    }
  }

  /**
   * Applique effectivement le mode admin
   */
  applyAdminMode() {
    console.log("🎭 Application du mode admin...");

    // Ajouter une classe CSS pour identifier le mode admin
    document.body.classList.add("admin-view-mode");

    // 1. Ajouter le thème et les styles
    this.optimizeThemeCompatibility();

    // 2. Ajouter un indicateur visuel
    this.addAdminModeIndicator();

    // 3. Ajouter un message d'information défilant
    this.addScrollingAdminMessage();

    // 4. Optimiser l'affichage du tableau
    this.optimizeTableDisplay();

    // 5. Obtenir la page cible et appliquer les optimisations spécifiques
    const targetPage = localStorage.getItem("adminViewTarget");
    console.log(`📄 Page cible: ${targetPage}`);

    if (targetPage === "acconier") {
      this.optimizeAcconierPage();
    } else if (targetPage === "livraison") {
      this.optimizeLivraisonPage();
    }

    // 6. Désactiver les formulaires et boutons d'édition
    this.disableEditingFeatures();

    // 7. Charger les données du responsable connecté
    this.loadResponsableData();

    // Appliquer toutes les 500ms pendant 5 secondes pour être sûr
    let attempts = 0;
    const maxAttempts = 10;
    const applyInterval = setInterval(() => {
      this.disableEditingFeatures();
      this.optimizeTableDisplay();

      // Réappliquer les optimisations spécifiques
      if (targetPage === "acconier") {
        this.optimizeAcconierPage();
      } else if (targetPage === "livraison") {
        this.optimizeLivraisonPage();
      }

      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(applyInterval);
        console.log(
          "✅ Mode admin complètement appliqué avec toutes les optimisations"
        );
      }
    }, 500);
  }

  /**
   * Ajoute un indicateur visuel du mode admin
   */
  addAdminModeIndicator() {
    const indicator = document.createElement("div");
    indicator.id = "admin-mode-indicator";
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9em;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.2);
      ">
        <i class="fas fa-eye"></i> Mode Visualisation Admin
      </div>
    `;
    document.body.appendChild(indicator);
  }

  /**
   * Désactive les fonctionnalités d'édition
   */
  disableEditingFeatures() {
    console.log("🔒 Désactivation des fonctionnalités d'édition...");

    const targetPage = localStorage.getItem("adminViewTarget");

    // Désactiver spécifiquement le bouton de déconnexion
    // On ne peut pas utiliser :contains, donc on cherche par texte et par classes/id standards
    const allButtons = document.querySelectorAll("button, a");
    allButtons.forEach((btn) => {
      const text = btn.textContent ? btn.textContent.toLowerCase() : "";
      const isLogout =
        text.includes("se deconnecter") ||
        text.includes("déconnecter") ||
        text.includes("logout") ||
        text.includes("se connecter") ||
        text.includes("connecter");
      const isLogoutClass =
        btn.classList.contains("logout-btn") ||
        btn.classList.contains("deconnexion") ||
        btn.classList.contains("login-btn") ||
        btn.id === "logout" ||
        btn.id === "login";
      const isLogoutOnClick =
        btn.getAttribute("onclick") &&
        (btn.getAttribute("onclick").toLowerCase().includes("logout") ||
          btn.getAttribute("onclick").toLowerCase().includes("deconnect") ||
          btn.getAttribute("onclick").toLowerCase().includes("login"));

      // Ne pas bloquer les boutons de thème - détection améliorée
      const isThemeButton =
        btn.classList.contains("theme-toggle") ||
        btn.classList.contains("theme-btn") ||
        btn.classList.contains("theme-switch") ||
        btn.id.includes("theme") ||
        btn.id === "darkModeToggle" ||
        btn.id === "lightModeToggle" ||
        btn.closest(".theme-switcher") ||
        btn.closest(".theme-toggle") ||
        btn.closest("[class*='theme']") ||
        text.includes("thème") ||
        text.includes("theme") ||
        text.includes("clair") ||
        text.includes("sombre") ||
        text.includes("dark") ||
        text.includes("light") ||
        btn.getAttribute("onclick")?.includes("theme") ||
        btn.getAttribute("onclick")?.includes("Mode");

      if ((isLogout || isLogoutClass || isLogoutOnClick) && !isThemeButton) {
        this.disableLogoutButton(btn);
      }
    });

    // Désactiver TOUS les inputs, selects et textareas de façon plus agressive
    const editableElements = document.querySelectorAll(
      'input, select, textarea, button[type="submit"], button:not([data-allow-admin])'
    );

    console.log(`🔒 Éléments trouvés à désactiver: ${editableElements.length}`);

    editableElements.forEach((element) => {
      const buttonText = element.textContent
        ? element.textContent.toLowerCase()
        : "";

      // Vérifier si l'élément est explicitement autorisé en mode admin
      const isAdminAllowed =
        element.getAttribute("data-allow-admin") === "true" ||
        element.classList.contains("admin-allowed-field") ||
        element.classList.contains("admin-allowed-button") ||
        element.classList.contains("admin-allowed-tc") ||
        element.classList.contains("admin-allowed-bl-link");

      const isNavigationButton =
        buttonText.includes("retour") ||
        buttonText.includes("fermer") ||
        buttonText.includes("annuler") ||
        buttonText.includes("close") ||
        buttonText.includes("thème") ||
        buttonText.includes("theme") ||
        buttonText.includes("clair") ||
        buttonText.includes("sombre") ||
        buttonText.includes("dark") ||
        buttonText.includes("light") ||
        element.classList.contains("close") ||
        element.classList.contains("theme-toggle") ||
        element.classList.contains("theme-btn") ||
        element.classList.contains("theme-switch") ||
        element.id.includes("close") ||
        element.id.includes("theme") ||
        element.id === "darkModeToggle" ||
        element.id === "lightModeToggle";

      // Autoriser les interactions avec les thèmes - détection améliorée
      const isThemeElement =
        element.classList.contains("theme-toggle") ||
        element.classList.contains("theme-btn") ||
        element.classList.contains("theme-switch") ||
        element.id.includes("theme") ||
        element.id === "darkModeToggle" ||
        element.id === "lightModeToggle" ||
        element.closest(".theme-switcher") ||
        element.closest(".theme-toggle") ||
        element.closest("[class*='theme']") ||
        element.getAttribute("onclick")?.includes("theme") ||
        element.getAttribute("onclick")?.includes("Mode");

      // Bloquer explicitement les boutons de déconnexion/connexion
      const isLogoutButton =
        buttonText.includes("se deconnecter") ||
        buttonText.includes("déconnecter") ||
        buttonText.includes("logout") ||
        buttonText.includes("se connecter") ||
        buttonText.includes("connecter");

      // Ne pas désactiver si l'élément est autorisé en mode admin
      if (
        (!isNavigationButton && !isThemeElement && !isAdminAllowed) ||
        isLogoutButton
      ) {
        element.disabled = true;
        element.readOnly = true;
        element.style.opacity = "0.5";
        element.style.cursor = "not-allowed";
        element.style.pointerEvents = "none";
        element.title = isLogoutButton
          ? "Déconnexion non autorisée en mode admin"
          : "Modification non autorisée en mode admin";

        // Empêcher tous les événements sauf pour les N° TC en mode acconier
        const isTcElement =
          targetPage === "acconier" &&
          (element.closest(".tc-link") ||
            element.closest("td:nth-child(3)") ||
            element.classList.contains("tc-link"));

        if (!isTcElement || isLogoutButton) {
          ["click", "input", "change", "keydown", "keyup", "focus"].forEach(
            (eventType) => {
              element.addEventListener(
                eventType,
                (e) => {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                  this.showAdminModeAlert(
                    isLogoutButton
                      ? "Déconnexion non autorisée en mode visualisation admin"
                      : "Modification non autorisée en mode visualisation admin"
                  );
                  return false;
                },
                true
              );
            }
          );
        }
      }
    });

    // Empêcher la soumission des formulaires de façon plus agressive
    const forms = document.querySelectorAll("form");
    console.log(`🔒 Formulaires trouvés: ${forms.length}`);

    forms.forEach((form) => {
      form.addEventListener(
        "submit",
        (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.showAdminModeAlert(
            "Modification non autorisée en mode visualisation admin"
          );
          return false;
        },
        true
      );
    });

    // Désactiver tous les boutons d'action de façon globale
    document.addEventListener(
      "click",
      (e) => {
        if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
          const button =
            e.target.tagName === "BUTTON"
              ? e.target
              : e.target.closest("button");
          const buttonText = button.textContent.toLowerCase();

          // Vérifier si l'élément est explicitement autorisé en mode admin
          const isAdminAllowed =
            button.getAttribute("data-allow-admin") === "true" ||
            button.classList.contains("admin-allowed-field") ||
            button.classList.contains("admin-allowed-button") ||
            button.classList.contains("admin-allowed-tc") ||
            button.classList.contains("admin-allowed-bl-link");

          const isNavigationButton =
            buttonText.includes("retour") ||
            buttonText.includes("fermer") ||
            buttonText.includes("annuler") ||
            buttonText.includes("close") ||
            buttonText.includes("thème") ||
            buttonText.includes("theme") ||
            buttonText.includes("clair") ||
            buttonText.includes("sombre") ||
            buttonText.includes("dark") ||
            buttonText.includes("light") ||
            button.classList.contains("close") ||
            button.classList.contains("theme-toggle") ||
            button.classList.contains("theme-btn") ||
            button.classList.contains("theme-switch") ||
            button.id.includes("close") ||
            button.id.includes("theme") ||
            button.id === "darkModeToggle" ||
            button.id === "lightModeToggle" ||
            button.closest(".theme-switcher") ||
            button.closest(".theme-toggle") ||
            button.closest("[class*='theme']") ||
            button.getAttribute("onclick")?.includes("theme") ||
            button.getAttribute("onclick")?.includes("Mode");

          // Vérifier si c'est un élément TC autorisé
          const isTcElement =
            targetPage === "acconier" &&
            (button.closest(".tc-link") ||
              button.classList.contains("tc-link") ||
              button.closest("td:nth-child(3)"));

          // Bloquer explicitement les boutons de déconnexion/connexion
          const isLogoutButton =
            buttonText.includes("se deconnecter") ||
            buttonText.includes("déconnecter") ||
            buttonText.includes("logout") ||
            buttonText.includes("se connecter") ||
            buttonText.includes("connecter");

          if (
            (!isNavigationButton && !isTcElement && !isAdminAllowed) ||
            isLogoutButton
          ) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.showAdminModeAlert(
              isLogoutButton
                ? "Déconnexion non autorisée en mode visualisation admin"
                : "Action non autorisée en mode visualisation admin"
            );
            return false;
          }
        }
      },
      true
    );

    // Gestionnaire spécial pour les liens BL autorisés
    document.addEventListener(
      "click",
      (e) => {
        if (e.target.tagName === "A" || e.target.closest("a")) {
          const link =
            e.target.tagName === "A" ? e.target : e.target.closest("a");

          // Vérifier si c'est un lien BL autorisé
          const isBlLink =
            link.classList.contains("admin-allowed-bl-link") ||
            link.getAttribute("data-allow-admin") === "true" ||
            link.href?.includes("bl") ||
            link.classList.contains("bl-link");

          // Si c'est un lien BL autorisé, laisser l'événement se propager normalement
          if (isBlLink && targetPage === "acconier") {
            // Ne rien faire, laisser le lien fonctionner normalement
            console.log("🔗 Lien BL autorisé cliqué:", link);
            return;
          }

          // Pour les autres liens non autorisés, bloquer
          const isThemeLink =
            link.classList.contains("theme-toggle") ||
            link.getAttribute("onclick")?.includes("theme");

          if (!isThemeLink && !isBlLink) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.showAdminModeAlert(
              "Lien non autorisé en mode visualisation admin"
            );
            return false;
          }
        }
      },
      true
    );
  }

  /**
   * Désactive spécifiquement un bouton de déconnexion
   */
  disableLogoutButton(button) {
    button.disabled = true;
    button.style.opacity = "0.3";
    button.style.cursor = "not-allowed";
    button.style.pointerEvents = "none";
    button.title = "Déconnexion non autorisée en mode admin";

    // Supprimer tous les événements onclick
    button.removeAttribute("onclick");
    button.onclick = null;

    // Ajouter une protection supplémentaire
    ["click", "mousedown", "mouseup", "touchstart"].forEach((eventType) => {
      button.addEventListener(
        eventType,
        (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.showAdminModeAlert(
            "Déconnexion non autorisée en mode visualisation admin"
          );
          return false;
        },
        true
      );
    });

    console.log("🔒 Bouton de déconnexion désactivé:", button);
  }

  /**
   * Ajoute un message défilant en haut de page
   */
  addScrollingAdminMessage() {
    const scrollingMessage = document.createElement("div");
    scrollingMessage.id = "admin-scrolling-message";
    scrollingMessage.innerHTML = `
      <div style="
        background: linear-gradient(90deg, #2563eb, #1d4ed8, #2563eb);
        color: white;
        padding: 8px 0;
        text-align: center;
        font-weight: 600;
        font-size: 0.9em;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        overflow: hidden;
        white-space: nowrap;
      ">
        <div style="
          display: inline-block;
          padding-left: 100%;
          animation: scroll-left 15s linear infinite;
        ">
          🔒 MODE ADMINISTRATEUR - Visualisation uniquement - Données du responsable connecté - Aucune modification possible
        </div>
      </div>
    `;

    // Ajouter l'animation CSS
    if (!document.getElementById("scrolling-animation-style")) {
      const style = document.createElement("style");
      style.id = "scrolling-animation-style";
      style.textContent = `
        @keyframes scroll-left {
          0% { transform: translate3d(100%, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        
        /* Ajuster le padding du body pour compenser le message défilant */
        .admin-view-mode {
          padding-top: 40px !important;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(scrollingMessage);
  }

  /**
   * Ajoute un message d'information compact sur le mode admin
   */
  addCompactAdminModeMessage() {
    const message = document.createElement("div");
    message.id = "admin-mode-message";
    message.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        border: 2px solid #2563eb;
        border-radius: 8px;
        padding: 10px 16px;
        margin: 10px;
        text-align: center;
        font-weight: 600;
        color: #1d4ed8;
        font-size: 0.9em;
        max-width: 600px;
        margin: 10px auto;
      ">
        <i class="fas fa-info-circle"></i>
        Mode administrateur - Visualisation des données du responsable connecté
      </div>
    `;

    // Insérer le message au début du contenu principal
    const mainContent =
      document.querySelector("main, .main-content, .container") ||
      document.body;
    mainContent.insertBefore(message, mainContent.firstChild);
  }

  /**
   * Optimise l'affichage du tableau en mode admin
   */
  optimizeTableDisplay() {
    const targetPage = localStorage.getItem("adminViewTarget");

    // Supprimer toutes les cartes au-dessus du tableau sauf le message admin
    const cardsToRemove = document.querySelectorAll(
      ".card, .widget, .alert, .info-card, .notification"
    );
    cardsToRemove.forEach((card) => {
      const cardText = card.textContent?.toLowerCase() || "";
      // Ne pas supprimer les éléments liés au message défilant
      if (
        !card.id?.includes("admin-scrolling-message") &&
        !card.closest("#admin-scrolling-message") &&
        !cardText.includes("mode administrateur - visualisation uniquement")
      ) {
        card.style.display = "none";
      }
    });

    // Supprimer spécifiquement la carte compacte si elle existe
    const compactMessage = document.getElementById("admin-mode-message");
    if (compactMessage) {
      compactMessage.remove();
    }

    // Remonter le tableau de façon plus aggressive
    const table = document.querySelector(
      "table, .table-container, #deliveriesTable, .table-responsive"
    );
    if (table) {
      const tableContainer =
        table.closest(
          ".container, .table-responsive, .content, .main-content"
        ) || table.parentElement;
      if (tableContainer) {
        tableContainer.style.marginTop = "10px";
        tableContainer.style.paddingTop = "0";
        tableContainer.style.position = "relative";
        tableContainer.style.zIndex = "1";
      }

      // Assurer que le tableau prend toute la hauteur disponible
      table.style.marginTop = "0";
      table.parentElement.style.paddingTop = "0";
    }

    // Réduire l'espace entre le header et le tableau
    const header = document.querySelector("header, .header, .navbar");
    if (header) {
      header.style.marginBottom = "0";
    }

    // Optimiser pour mobile et tablette
    const style = document.createElement("style");
    style.id = "admin-table-optimization";
    if (!document.getElementById("admin-table-optimization")) {
      style.textContent = `
        .admin-view-mode {
          padding-top: 35px !important;
        }
        
        .admin-view-mode .container,
        .admin-view-mode .main-content,
        .admin-view-mode .content {
          padding-top: 5px !important;
          margin-top: 0 !important;
        }
        
        .admin-view-mode table {
          margin-top: 0 !important;
        }
        
        @media (max-width: 768px) {
          .admin-view-mode {
            padding-top: 30px !important;
          }
          
          .admin-view-mode .table-responsive {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          
          .admin-view-mode table {
            font-size: 0.85em;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Optimisations spécifiques à la page acconier
   */
  optimizeAcconierPage() {
    // Rendre les N° BL accessibles pour ouvrir les popups en mode lecture
    const blLinks = document.querySelectorAll(
      'a[href*="bl"], .bl-link, td:nth-child(2) a'
    );
    blLinks.forEach((link) => {
      // Maintenir l'apparence et la fonctionnalité du lien
      link.style.pointerEvents = "auto";
      link.style.color = "#2563eb";
      link.style.textDecoration = "underline";
      link.style.cursor = "pointer";
      link.title = "Cliquez pour voir les détails (lecture seule)";
      link.setAttribute("data-allow-admin", "true");

      // Ajouter un attribut pour identifier ces liens comme autorisés
      link.classList.add("admin-allowed-bl-link");
    });

    // Verrouiller la colonne Observations
    this.lockObservationsColumn();

    // Configurer les N° TC comme informatifs uniquement
    this.setupAcconierTcDisplay();

    // Activer les champs de dates et recherche
    this.enableAdminAllowedFields();

    // Ajouter le bouton de rafraîchissement
    this.addRefreshButton();
  }

  /**
   * Verrouille la colonne Observations en lecture seule
   */
  lockObservationsColumn() {
    const table = document.querySelector("table");
    if (table) {
      const headers = table.querySelectorAll("th");
      let observationsColumnIndex = -1;

      // Trouver l'index de la colonne Observations avec une recherche plus flexible
      headers.forEach((header, index) => {
        const headerText = header.textContent.trim().toLowerCase();
        if (
          headerText.includes("observation") ||
          headerText.includes("obs") ||
          headerText === "observations"
        ) {
          observationsColumnIndex = index;
          console.log(`🔒 Colonne Observations trouvée: index ${index}`);
        }
      });

      // Verrouiller toutes les cellules de la colonne Observations
      if (observationsColumnIndex !== -1) {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (cells[observationsColumnIndex]) {
            this.lockObservationCell(
              cells[observationsColumnIndex],
              "Colonne Observations - Lecture seule en mode admin"
            );
          }
        });

        // Ajouter un style spécial pour indiquer que c'est une colonne en lecture seule
        if (headers[observationsColumnIndex]) {
          headers[observationsColumnIndex].style.background = "#f8f9fa";
          headers[observationsColumnIndex].style.position = "relative";
          headers[observationsColumnIndex].innerHTML +=
            ' <i class="fas fa-lock" style="color: #6c757d; font-size: 0.8em;" title="Lecture seule"></i>';
        }
      }
    }

    // Empêcher aussi toute modification via les événements globaux sur les observations
    setTimeout(() => {
      this.preventObservationEditing();
    }, 1000);
  }

  /**
   * Verrouille spécifiquement une cellule d'observation
   */
  lockObservationCell(cell, tooltipMessage) {
    // Marquer la cellule comme étant une observation
    cell.setAttribute("data-observation-cell", "true");

    // Ajouter la classe CSS pour le style
    cell.classList.add("locked-observation-cell");

    // Style visuel pour indiquer la lecture seule
    cell.style.backgroundColor = "#f8f9fa";
    cell.style.opacity = "0.9";
    cell.style.border = "1px solid #dee2e6";
    cell.style.position = "relative";
    cell.title = tooltipMessage;

    // Verrouiller tous les éléments interactifs dans la cellule
    const interactiveElements = cell.querySelectorAll(
      "input, select, textarea, button, a"
    );

    interactiveElements.forEach((element) => {
      element.readOnly = true;
      element.disabled = true;
      element.style.background = "#f8f9fa";
      element.style.cursor = "not-allowed";
      element.style.opacity = "0.7";
      element.title = tooltipMessage;
      element.setAttribute("data-locked", "true");

      // Empêcher tous les événements de modification
      ["click", "input", "change", "keydown", "keyup", "focus", "blur"].forEach(
        (eventType) => {
          element.addEventListener(
            eventType,
            (e) => {
              e.preventDefault();
              e.stopImmediatePropagation();
              this.showAdminModeAlert(
                "Modification des observations non autorisée en mode admin"
              );
              return false;
            },
            true
          );
        }
      );
    });

    // Si la cellule contient du texte directement, l'afficher proprement
    if (cell.textContent && !interactiveElements.length) {
      const content = cell.textContent.trim();
      cell.innerHTML = `<span style="color: #495057; font-style: italic;">${
        content || "Aucune observation"
      }</span>`;
    }
  }

  /**
   * Empêche toute modification des observations de façon globale
   */
  preventObservationEditing() {
    // Intercepter tous les clics sur les cellules d'observations
    document.addEventListener(
      "click",
      (e) => {
        const observationCell = e.target.closest(
          '[data-observation-cell="true"]'
        );
        if (observationCell) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.showAdminModeAlert(
            "Les observations sont en lecture seule en mode admin"
          );
          return false;
        }
      },
      true
    );

    // Empêcher le double-clic sur les observations
    document.addEventListener(
      "dblclick",
      (e) => {
        const observationCell = e.target.closest(
          '[data-observation-cell="true"]'
        );
        if (observationCell) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }
      },
      true
    );
  }

  /**
   * Ajoute un bouton de rafraîchissement après les champs de dates
   */
  addRefreshButton() {
    // Supprimer tout bouton d'actualisation existant
    document
      .querySelectorAll(".admin-refresh-btn")
      .forEach((btn) => btn.remove());

    // Créer le bouton unique
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "admin-refresh-btn";
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    refreshBtn.title = "Actualiser les données";
    refreshBtn.style.cssText = `
      background: #28a745;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      box-shadow: 0 2px 8px rgba(40,167,69,0.15);
      transition: all 0.3s ease;
      position: relative;
      z-index: 10001;
    `;

    // Centrer le bouton dans le conteneur des dates
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length >= 2) {
      const parent =
        dateInputs[0].parentElement.parentElement ||
        dateInputs[0].parentElement;
      // Insérer le bouton au centre sous les dates
      parent.appendChild(refreshBtn);
    } else {
      // Si pas de dates, ajouter en haut du contenu principal
      const mainContent =
        document.querySelector("main, .main-content, .container") ||
        document.body;
      mainContent.insertBefore(refreshBtn, mainContent.firstChild);
    }

    // Animation et effet hover
    refreshBtn.addEventListener("mouseenter", () => {
      refreshBtn.style.background = "#218838";
      refreshBtn.style.transform = "scale(1.12) rotate(10deg)";
    });
    refreshBtn.addEventListener("mouseleave", () => {
      refreshBtn.style.background = "#28a745";
      refreshBtn.style.transform = "scale(1) rotate(0deg)";
    });

    // Action : recharge la page
    refreshBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.refreshPageData();
    });
    console.log("✅ Bouton d'actualisation unique ajouté");
  }

  /**
   * Rafraîchit les données de la page
   */
  refreshPageData() {
    console.log("🔄 Rafraîchissement des données...");

    // Afficher un indicateur de chargement
    const refreshIndicator = document.createElement("div");
    refreshIndicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(40, 167, 69, 0.9);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
    `;
    refreshIndicator.innerHTML = `
      <i class="fas fa-sync-alt fa-spin"></i>
      Actualisation en cours...
    `;
    document.body.appendChild(refreshIndicator);

    // Simuler le rafraîchissement et recharger la page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  /**
   * Active les champs autorisés en mode admin pour la page acconier
   */
  enableAdminAllowedFields() {
    console.log("🔓 Activation des champs autorisés en mode admin...");

    // 1. Activer les champs de dates
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach((input) => {
      input.disabled = false;
      input.readOnly = false;
      input.style.opacity = "1";
      input.style.cursor = "pointer";
      input.style.pointerEvents = "auto";
      input.style.background = "";
      input.title = "Champ de date - Accessible en mode admin";
      input.setAttribute("data-allow-admin", "true");
      input.classList.add("admin-allowed-field");
    });

    // 2. Activer le champ de recherche et son bouton
    const searchInput = document.querySelector(
      "#searchInput, .search-input, input[placeholder*='recherche'], input[placeholder*='Recherche']"
    );
    if (searchInput) {
      searchInput.disabled = false;
      searchInput.readOnly = false;
      searchInput.style.opacity = "1";
      searchInput.style.cursor = "text";
      searchInput.style.pointerEvents = "auto";
      searchInput.style.background = "";
      searchInput.title = "Champ de recherche - Accessible en mode admin";
      searchInput.setAttribute("data-allow-admin", "true");
      searchInput.classList.add("admin-allowed-field");
    }

    const searchButton = document.querySelector(
      "#searchButton, .search-button, button[type='submit']"
    );
    if (searchButton) {
      searchButton.disabled = false;
      searchButton.style.opacity = "1";
      searchButton.style.cursor = "pointer";
      searchButton.style.pointerEvents = "auto";
      searchButton.style.background = "";
      searchButton.title = "Bouton rechercher - Accessible en mode admin";
      searchButton.setAttribute("data-allow-admin", "true");
      searchButton.classList.add("admin-allowed-button");
    }

    // 3. Activer tous les éléments Numéro TC(s) comme interactifs
    const tcElements = document.querySelectorAll(
      '.tc-link, .numero-tc, td:nth-child(3), [data-field*="tc"]'
    );
    tcElements.forEach((element) => {
      element.style.pointerEvents = "auto";
      element.style.cursor = "pointer";
      element.style.opacity = "1";
      element.title = "Numéro TC - Accessible en mode admin";
      element.setAttribute("data-allow-admin", "true");
      element.classList.add("admin-allowed-tc");

      // Si c'est un input dans une cellule TC
      const tcInputs = element.querySelectorAll("input, textarea");
      tcInputs.forEach((input) => {
        input.disabled = false;
        input.readOnly = false;
        input.style.opacity = "1";
        input.style.cursor = "text";
        input.style.pointerEvents = "auto";
        input.style.background = "";
        input.setAttribute("data-allow-admin", "true");
      });
    });

    // 4. Gérer les popups et modales - rendre accessibles avec restrictions
    this.setupAdminPopupAccess();

    console.log("✅ Champs autorisés activés en mode admin");
  }

  /**
   * Configure l'accès aux popups en mode admin
   */
  setupAdminPopupAccess() {
    // Intercepter l'ouverture des popups pour les modifier en mode lecture
    document.addEventListener("DOMNodeInserted", (e) => {
      if (e.target.nodeType === 1) {
        // Element node
        const modal =
          e.target.querySelector?.(".modal") ||
          (e.target.classList?.contains("modal") ? e.target : null);
        if (modal) {
          setTimeout(() => {
            this.adaptModalForAdminMode(modal);
          }, 100);
        }
      }
    });

    // Observer pour les modales ajoutées dynamiquement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const modal =
              node.querySelector?.(".modal") ||
              (node.classList?.contains("modal") ? node : null);
            if (modal) {
              setTimeout(() => {
                this.adaptModalForAdminMode(modal);
              }, 100);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Adapte une modal pour le mode admin
   */
  adaptModalForAdminMode(modal) {
    console.log("🔧 Adaptation de la modal pour le mode admin...");

    // 1. Rendre le bouton de fermeture X circulaire et accessible
    const closeBtn = modal.querySelector(
      '.close, .close-btn, [data-dismiss="modal"], .btn-close'
    );
    if (closeBtn) {
      closeBtn.disabled = false;
      closeBtn.style.pointerEvents = "auto";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.opacity = "1";
      closeBtn.style.borderRadius = "50%";
      closeBtn.style.width = "35px";
      closeBtn.style.height = "35px";
      closeBtn.style.display = "flex";
      closeBtn.style.alignItems = "center";
      closeBtn.style.justifyContent = "center";
      closeBtn.style.background = "#dc3545";
      closeBtn.style.color = "white";
      closeBtn.style.border = "none";
      closeBtn.style.fontSize = "18px";
      closeBtn.style.fontWeight = "bold";
      closeBtn.setAttribute("data-allow-admin", "true");
      closeBtn.title = "Fermer la popup";
    }

    // 2. Activer les champs de date dans la modal
    const modalDateInputs = modal.querySelectorAll('input[type="date"]');
    modalDateInputs.forEach((input) => {
      input.disabled = false;
      input.readOnly = false;
      input.style.opacity = "1";
      input.style.cursor = "pointer";
      input.style.pointerEvents = "auto";
      input.style.background = "";
      input.setAttribute("data-allow-admin", "true");
    });

    // 3. Activer les champs Numéro TC(s) dans la modal
    const modalTcInputs = modal.querySelectorAll(
      'input[placeholder*="TC"], input[name*="tc"], textarea[placeholder*="TC"], textarea[name*="tc"]'
    );
    modalTcInputs.forEach((input) => {
      input.disabled = false;
      input.readOnly = false;
      input.style.opacity = "1";
      input.style.cursor = "text";
      input.style.pointerEvents = "auto";
      input.style.background = "";
      input.setAttribute("data-allow-admin", "true");
    });

    // 4. Désactiver spécifiquement le bouton "Enregistrer" et similaires
    const saveButtons = modal.querySelectorAll(
      'button[type="submit"], .btn-primary, .save-btn, .enregistrer-btn'
    );
    saveButtons.forEach((btn) => {
      const btnText = btn.textContent.toLowerCase();
      if (
        btnText.includes("enregistrer") ||
        btnText.includes("sauvegarder") ||
        btnText.includes("save")
      ) {
        btn.disabled = true;
        btn.style.opacity = "0.3";
        btn.style.cursor = "not-allowed";
        btn.style.pointerEvents = "none";
        btn.title = "Enregistrement non autorisé en mode admin";

        // Bloquer tous les événements
        ["click", "mousedown", "mouseup"].forEach((eventType) => {
          btn.addEventListener(
            eventType,
            (e) => {
              e.preventDefault();
              e.stopImmediatePropagation();
              this.showAdminModeAlert(
                "Enregistrement non autorisé en mode visualisation admin"
              );
              return false;
            },
            true
          );
        });
      }
    });

    // 5. Ajouter un indicateur visuel à la modal
    if (!modal.querySelector(".admin-modal-indicator")) {
      const indicator = document.createElement("div");
      indicator.className = "admin-modal-indicator";
      indicator.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: #2563eb;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75em;
        font-weight: 600;
        z-index: 1001;
      `;
      indicator.innerHTML = '<i class="fas fa-eye"></i> Mode Lecture';
      modal.style.position = "relative";
      modal.appendChild(indicator);
    }

    console.log("✅ Modal adaptée pour le mode admin");
  }

  /**
   * Configure l'affichage informatif des N° TC pour la page acconier
   */
  setupAcconierTcDisplay() {
    // Chercher les liens/éléments TC dans la 3ème colonne et autres sélecteurs
    const tcSelectors = [
      ".tc-link",
      "td:nth-child(3) a",
      'a[href*="tc"]',
      ".numero-tc",
      'td[data-field*="tc"]',
    ];

    tcSelectors.forEach((selector) => {
      const tcElements = document.querySelectorAll(selector);
      tcElements.forEach((element) => {
        this.convertTcToInformational(element);
      });
    });

    // Chercher aussi dans toutes les cellules qui contiennent "TC"
    const allCells = document.querySelectorAll("td");
    allCells.forEach((cell) => {
      const cellText = cell.textContent.toLowerCase();
      if (cellText.includes("tc") && cellText.match(/\d/)) {
        const links = cell.querySelectorAll("a");
        links.forEach((link) => {
          this.convertTcToInformational(link);
        });
      }
    });
  }

  /**
   * Convertit un élément TC en affichage informatif
   */
  convertTcToInformational(element) {
    // Supprimer le lien href mais garder l'apparence
    if (element.tagName === "A") {
      element.removeAttribute("href");
    }

    element.style.color = "#2563eb";
    element.style.cursor = "pointer";
    element.style.textDecoration = "underline";
    element.style.fontWeight = "500";
    element.title = "Cliquez pour voir les informations TC (lecture seule)";

    // Supprimer tous les anciens événements
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);

    // Ajouter le nouvel événement informatif
    newElement.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tcValue = newElement.textContent.trim();
      this.showTcInformation(tcValue);
    });
  }

  /**
   * Optimisations spécifiques à la page livraison
   */
  optimizeLivraisonPage() {
    // Colonnes exactes à verrouiller en lecture seule
    const readOnlyColumns = [
      "NOM",
      "Agent visiteurs",
      "TRANSPORTEUR",
      "INSPECTEUR",
      "AGENT EN DOUANES",
      "CHAUFFEUR",
      "TEL CHAUFFEUR",
      "DATE LIVRAISON",
      "Observations",
      "Numéro TC(s)",
    ];

    console.log("🔒 Verrouillage des colonnes livraison:", readOnlyColumns);

    // Identifier et verrouiller les colonnes
    const table = document.querySelector("table");
    if (table) {
      const headers = table.querySelectorAll("th");
      const columnIndexes = [];

      // Trouver les index des colonnes à verrouiller
      headers.forEach((header, index) => {
        const headerText = header.textContent.trim();
        if (
          readOnlyColumns.some(
            (col) =>
              headerText.toUpperCase().includes(col.toUpperCase()) ||
              col.toUpperCase().includes(headerText.toUpperCase())
          )
        ) {
          columnIndexes.push(index);
          console.log(`🔒 Colonne verrouillée: ${headerText} (index ${index})`);
        }
      });

      // Verrouiller toutes les cellules des colonnes identifiées
      const rows = table.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        columnIndexes.forEach((colIndex) => {
          if (cells[colIndex]) {
            this.lockTableCell(
              cells[colIndex],
              "Colonne non modifiable en mode admin"
            );
          }
        });
      });
    }

    // Traitement spécial pour les N° TC - affichage informatif uniquement
    this.setupTcInformationalDisplay();
  }

  /**
   * Verrouille une cellule de tableau
   */
  lockTableCell(cell, tooltipMessage) {
    // Ajouter la classe CSS pour le style
    cell.classList.add("locked-cell");

    // Verrouiller tous les éléments interactifs dans la cellule
    const interactiveElements = cell.querySelectorAll(
      "input, select, textarea, button, a"
    );

    interactiveElements.forEach((element) => {
      element.readOnly = true;
      element.disabled = true;
      element.style.background = "#f8f9fa";
      element.style.cursor = "not-allowed";
      element.style.opacity = "0.7";
      element.title = tooltipMessage;

      // Empêcher tous les événements
      ["click", "input", "change", "keydown", "keyup", "focus"].forEach(
        (eventType) => {
          element.addEventListener(
            eventType,
            (e) => {
              e.preventDefault();
              e.stopImmediatePropagation();
              return false;
            },
            true
          );
        }
      );
    });

    // Ajouter un style visuel à la cellule entière
    cell.style.backgroundColor = "#f8f9fa";
    cell.style.opacity = "0.8";
    cell.title = tooltipMessage;
  }

  /**
   * Configure l'affichage informatif des N° TC
   */
  setupTcInformationalDisplay() {
    // Sélectionner toutes les cellules contenant des N° TC (sans utiliser :contains)
    const tcCells = document.querySelectorAll(
      'td[data-field*="tc"], .tc-column, .numero-tc'
    );

    // Chercher aussi par contenu de cellule
    const allCells = document.querySelectorAll("td");
    allCells.forEach((cell) => {
      const cellText = cell.textContent.toLowerCase();
      if (cellText.includes("tc") && cellText.match(/\d/)) {
        this.setupTcCellDisplay(cell);
      }
    });

    tcCells.forEach((cell) => {
      this.setupTcCellDisplay(cell);
    });
  }

  /**
   * Configure une cellule TC pour affichage informatif
   */
  setupTcCellDisplay(cell) {
    const inputs = cell.querySelectorAll("input, textarea");

    inputs.forEach((input) => {
      const tcValue = input.value || input.textContent;

      // Remplacer l'input par un span informatif
      if (tcValue && tcValue.trim()) {
        const infoSpan = document.createElement("span");
        infoSpan.style.cssText = `
          color: #2563eb;
          cursor: pointer;
          text-decoration: underline;
          font-weight: 500;
        `;
        infoSpan.textContent = tcValue;
        infoSpan.title = "Cliquez pour voir les détails (lecture seule)";

        // Ajouter un événement de clic informatif
        infoSpan.addEventListener("click", (e) => {
          e.preventDefault();
          this.showTcInformation(tcValue);
        });

        // Remplacer l'input par le span
        input.parentNode.replaceChild(infoSpan, input);
      } else {
        // Si pas de valeur, juste verrouiller
        input.readOnly = true;
        input.disabled = true;
        input.style.background = "#f8f9fa";
        input.style.cursor = "not-allowed";
        input.title = "N° TC - Information uniquement";
      }
    });
  }

  /**
   * Affiche les informations des N° TC de façon informative
   */
  showTcInformation(tcNumbers) {
    const tcList = tcNumbers
      .split(",")
      .map((tc) => tc.trim())
      .filter((tc) => tc);

    // Détecter le thème actuel
    const isDarkMode =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.body.classList.contains("dark-theme") ||
      document.body.classList.contains("dark-mode");

    const backgroundColor = isDarkMode ? "#374151" : "white";
    const textColor = isDarkMode ? "#e5e7eb" : "#374151";
    const headerColor = isDarkMode ? "#60a5fa" : "#2563eb";
    const listItemBg = isDarkMode ? "#4b5563" : "#f8fafc";
    const borderColor = isDarkMode ? "#60a5fa" : "#2563eb";

    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
      background: ${backgroundColor};
      color: ${textColor};
      padding: 20px;
      border-radius: 10px;
      max-width: 400px;
      max-height: 70vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      position: relative;
      border: 2px solid ${borderColor};
    `;

    content.innerHTML = `
      <button class="close-modal-btn" style="
        position: absolute;
        top: 10px;
        right: 10px;
        background: #dc3545;
        color: white;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        z-index: 10003;
        transition: all 0.2s ease;
      " title="Fermer">
        ×
      </button>
      <h3 style="margin-top: 0; color: ${headerColor}; padding-right: 40px;">
        <i class="fas fa-info-circle"></i> Numéros TC
      </h3>
      <p style="margin: 10px 0; color: ${
        isDarkMode ? "#9ca3af" : "#6b7280"
      }; font-size: 0.9em;">
        Informations en lecture seule
      </p>
      <ul style="list-style: none; padding: 0;">
        ${tcList
          .map(
            (tc) => `
          <li style="
            padding: 8px 12px;
            margin: 5px 0;
            background: ${listItemBg};
            border-left: 3px solid ${borderColor};
            border-radius: 4px;
            color: ${textColor};
          ">
            ${tc}
          </li>
        `
          )
          .join("")}
      </ul>
      <button class="close-modal-bottom-btn" style="
        background: ${borderColor};
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 15px;
        width: 100%;
        transition: all 0.2s ease;
      ">
        Fermer
      </button>
    `;

    modal.className = "modal admin-tc-modal";
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Fonction pour fermer la modal avec animation
    const closeModal = () => {
      modal.style.opacity = "0";
      setTimeout(() => {
        if (modal.parentNode) {
          modal.remove();
        }
      }, 200);
    };

    // Animation d'ouverture
    modal.style.opacity = "0";
    modal.style.transition = "opacity 0.2s ease";
    setTimeout(() => {
      modal.style.opacity = "1";
    }, 10);

    // Fermer en cliquant à l'extérieur du contenu
    // Fermer uniquement avec les boutons dédiés, pas en cliquant sur le fond
    // (ne rien faire ici, la fermeture est gérée par les boutons)

    // Rendre la popup accessible : permet l'interaction avec les éléments de fermeture et autorisés
    content.addEventListener(
      "click",
      (e) => {
        // Vérifier si l'élément cliqué est autorisé en mode admin
        const isAllowedElement =
          e.target.classList.contains("close-modal-btn") ||
          e.target.classList.contains("close-modal-bottom-btn") ||
          e.target.closest(".close-modal-btn") ||
          e.target.closest(".close-modal-bottom-btn") ||
          e.target.getAttribute("data-allow-admin") === "true" ||
          e.target.closest("[data-allow-admin='true']");

        // Si ce n'est PAS un élément autorisé, bloquer l'interaction
        if (!isAllowedElement) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        // Si c'est un élément autorisé, laisser l'événement se propager normalement
      },
      true
    ); // Utiliser la phase de capture pour intercepter le clic avant tout autre script

    // Fermer avec le bouton X - événement renforcé et prioritaire
    const closeBtn = content.querySelector(".close-modal-btn");
    if (closeBtn) {
      // Supprimer tout eventListener existant pour éviter les blocages
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      newCloseBtn.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeModal();
        },
        { capture: true }
      );
      // Effet hover
      newCloseBtn.addEventListener("mouseenter", () => {
        newCloseBtn.style.background = "#c82333";
        newCloseBtn.style.transform = "scale(1.1)";
      });
      newCloseBtn.addEventListener("mouseleave", () => {
        newCloseBtn.style.background = "#dc3545";
        newCloseBtn.style.transform = "scale(1)";
      });
    }

    // Fermer avec le bouton Fermer du bas
    const closeBtnBottom = content.querySelector(".close-modal-bottom-btn");
    if (closeBtnBottom) {
      closeBtnBottom.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });

      // Ajouter des effets hover pour le bouton du bas
      closeBtnBottom.addEventListener("mouseenter", () => {
        closeBtnBottom.style.background = isDarkMode ? "#1d4ed8" : "#1d4ed8";
        closeBtnBottom.style.transform = "scale(1.02)";
      });
      closeBtnBottom.addEventListener("mouseleave", () => {
        closeBtnBottom.style.background = borderColor;
        closeBtnBottom.style.transform = "scale(1)";
      });
    }

    // Fermer avec la touche Escape
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
  }

  /**
   * Optimise la compatibilité avec les thèmes sombre/clair
   */
  optimizeThemeCompatibility() {
    // Ajouter des styles pour le mode sombre et l'optimisation mobile
    if (!document.getElementById("admin-theme-compatibility")) {
      const style = document.createElement("style");
      style.id = "admin-theme-compatibility";
      style.textContent = `
        /* Mode sombre - En-têtes de colonnes en blanc */
        [data-theme="dark"] .admin-view-mode th,
        [data-theme="dark"] .admin-view-mode .table-header {
          color: #ffffff !important;
          background-color: #374151 !important;
        }

        /* Mode sombre - Cellules du tableau */
        [data-theme="dark"] .admin-view-mode td {
          color: #e5e7eb !important;
          border-color: #4b5563 !important;
        }

        /* Mode sombre - Inputs désactivés */
        [data-theme="dark"] .admin-view-mode input:disabled,
        [data-theme="dark"] .admin-view-mode select:disabled,
        [data-theme="dark"] .admin-view-mode textarea:disabled {
          background-color: #374151 !important;
          color: #9ca3af !important;
          border-color: #4b5563 !important;
        }

        /* Mode clair - Assurer la lisibilité */
        .admin-view-mode th {
          background-color: #f8fafc !important;
          color: #1f2937 !important;
          font-weight: 600 !important;
        }

        /* Optimisation pour tablettes et mobiles */
        @media (max-width: 1024px) {
          .admin-view-mode {
            padding-top: 32px !important;
          }
          
          .admin-view-mode .table-responsive {
            margin-top: 0 !important;
            padding-top: 0 !important;
            max-height: calc(100vh - 80px);
            overflow-y: auto;
          }
          
          .admin-view-mode table {
            font-size: 0.9em;
            min-width: 100%;
          }
          
          .admin-view-mode th,
          .admin-view-mode td {
            padding: 6px 4px !important;
            font-size: 0.85em;
          }
        }

        /* Mobile spécifique */
        @media (max-width: 768px) {
          .admin-view-mode {
            padding-top: 30px !important;
          }
          
          #admin-mode-message {
            margin: 5px;
            padding: 8px 12px;
            font-size: 0.8em;
          }
          
          #admin-scrolling-message {
            font-size: 0.8em;
            padding: 6px 0;
          }
          
          .admin-view-mode .table-responsive {
            max-height: calc(100vh - 60px);
            font-size: 0.8em;
          }
          
          .admin-view-mode table {
            font-size: 0.75em;
          }
          
          .admin-view-mode th,
          .admin-view-mode td {
            padding: 4px 2px !important;
            font-size: 0.75em;
            white-space: nowrap;
          }
          
          /* Permettre le scroll horizontal sur mobile */
          .admin-view-mode .table-container,
          .admin-view-mode .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        /* Très petits écrans */
        @media (max-width: 480px) {
          .admin-view-mode .table-responsive {
            max-height: calc(100vh - 50px);
          }
          
          .admin-view-mode table {
            font-size: 0.7em;
          }
          
          .admin-view-mode th,
          .admin-view-mode td {
            padding: 3px 1px !important;
            font-size: 0.7em;
          }
        }

        /* Optimisation des boutons thème en mode admin */
        .admin-view-mode .theme-toggle,
        .admin-view-mode [class*="theme"],
        .admin-view-mode [id*="theme"] {
          opacity: 1 !important;
          pointer-events: auto !important;
          cursor: pointer !important;
          background: inherit !important;
        }

        /* Assurer que les boutons de thème restent actifs */
        .admin-view-mode button[class*="theme"]:not(.close-modal-btn),
        .admin-view-mode button[id*="theme"]:not(.close-modal-btn) {
          disabled: false !important;
          pointer-events: auto !important;
          opacity: 1 !important;
        }

        /* Styles pour les cellules d'observations verrouillées */
        .locked-observation-cell {
          background-color: #f8f9fa !important;
          opacity: 0.9 !important;
          border: 1px solid #dee2e6 !important;
          position: relative !important;
        }

        [data-theme="dark"] .locked-observation-cell {
          background-color: #2d3748 !important;
          border-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }

        .locked-observation-cell input,
        .locked-observation-cell textarea,
        .locked-observation-cell select {
          background-color: #f8f9fa !important;
          cursor: not-allowed !important;
          opacity: 0.7 !important;
        }

        [data-theme="dark"] .locked-observation-cell input,
        [data-theme="dark"] .locked-observation-cell textarea,
        [data-theme="dark"] .locked-observation-cell select {
          background-color: #2d3748 !important;
          color: #e2e8f0 !important;
          border-color: #4a5568 !important;
        }

        /* Modal TC - Compatibilité thème sombre */
        [data-theme="dark"] .admin-tc-modal .close-modal-btn {
          background: #dc3545 !important;
        }

        [data-theme="dark"] .admin-tc-modal div[style*="background: white"] {
          background: #374151 !important;
          color: #e5e7eb !important;
        }

        [data-theme="dark"] .admin-tc-modal h3 {
          color: #60a5fa !important;
        }

        [data-theme="dark"] .modal li {
          background: #4b5563 !important;
          color: #e5e7eb !important;
        }

        /* Bouton de rafraîchissement - Thème sombre */
        [data-theme="dark"] button[title="Actualiser les données"] {
          background: #059669 !important;
        }

        [data-theme="dark"] button[title="Actualiser les données"]:hover {
          background: #047857 !important;
        }

        /* Amélioration de la visibilité du message défilant */
        #admin-scrolling-message {
          font-weight: 700;
          font-size: 0.95em;
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.3);
        }

        /* Cellules verrouillées - meilleur contraste */
        .admin-view-mode .locked-cell {
          background-color: #f8f9fa !important;
          border: 1px dashed #dee2e6 !important;
        }

        [data-theme="dark"] .admin-view-mode .locked-cell {
          background-color: #374151 !important;
          border: 1px dashed #4b5563 !important;
        }

        /* Styles pour les éléments autorisés en mode admin */
        .admin-view-mode .admin-allowed-field,
        .admin-view-mode .admin-allowed-button,
        .admin-view-mode .admin-allowed-tc,
        .admin-view-mode .admin-allowed-bl-link {
          opacity: 1 !important;
          pointer-events: auto !important;
          cursor: pointer !important;
          background: inherit !important;
          border: 2px solid #10b981 !important;
          box-shadow: 0 0 5px rgba(16, 185, 129, 0.3) !important;
        }

        .admin-view-mode input.admin-allowed-field {
          cursor: text !important;
        }

        /* Indicateur visuel pour les liens BL autorisés */
        .admin-view-mode .admin-allowed-bl-link {
          color: #2563eb !important;
          text-decoration: underline !important;
          font-weight: 500 !important;
          position: relative !important;
        }

        .admin-view-mode .admin-allowed-bl-link::after {
          content: "📝";
          position: absolute;
          right: -20px;
          top: -2px;
          font-size: 0.8em;
          opacity: 0.7;
        }

        /* Styles pour les modales adaptées en mode admin */
        .admin-modal-indicator {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        /* Boutons de fermeture circulaires dans les modales */
        .admin-view-mode .modal .close,
        .admin-view-mode .modal .close-btn,
        .admin-view-mode .modal [data-dismiss="modal"] {
          border-radius: 50% !important;
          width: 35px !important;
          height: 35px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: #dc3545 !important;
          color: white !important;
          border: none !important;
          font-size: 18px !important;
          font-weight: bold !important;
          transition: all 0.2s ease !important;
        }

        .admin-view-mode .modal .close:hover,
        .admin-view-mode .modal .close-btn:hover,
        .admin-view-mode .modal [data-dismiss="modal"]:hover {
          background: #c82333 !important;
          transform: scale(1.1) !important;
        }

        /* Thème sombre pour les éléments autorisés */
        [data-theme="dark"] .admin-view-mode .admin-allowed-field,
        [data-theme="dark"] .admin-view-mode .admin-allowed-button,
        [data-theme="dark"] .admin-view-mode .admin-allowed-tc,
        [data-theme="dark"] .admin-view-mode .admin-allowed-bl-link {
          border-color: #10b981 !important;
          box-shadow: 0 0 5px rgba(16, 185, 129, 0.5) !important;
        }

        [data-theme="dark"] .admin-view-mode .admin-allowed-bl-link {
          color: #60a5fa !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Ajoute un message d'information sur le mode admin
   */
  /**
   * Ancienne fonction remplacée par addCompactAdminModeMessage
   */
  addAdminModeMessage() {
    // Cette fonction est maintenant remplacée par addCompactAdminModeMessage
    // Garder pour compatibilité mais ne fait rien
    console.log("addAdminModeMessage remplacée par addCompactAdminModeMessage");
  }

  /**
   * Affiche une alerte personnalisée pour le mode admin
   */
  showAdminModeAlert(message) {
    // Créer une alerte personnalisée avec support du thème sombre
    const alert = document.createElement("div");
    alert.className = "admin-alert-modal";

    // Détecter le thème actuel
    const isDarkMode =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.body.classList.contains("dark-theme") ||
      document.body.classList.contains("dark-mode");

    const backgroundColor = isDarkMode ? "#374151" : "white";
    const textColor = isDarkMode ? "#e5e7eb" : "#374151";
    const borderColor = "#dc3545";

    alert.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${backgroundColor};
      border: 3px solid ${borderColor};
      border-radius: 12px;
      padding: 20px;
      z-index: 10001;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      max-width: 400px;
      text-align: center;
      animation: alertFadeIn 0.3s ease;
    `;

    alert.innerHTML = `
      <div style="color: ${borderColor}; font-size: 1.2em; margin-bottom: 10px;">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div style="color: ${textColor}; font-weight: 600; margin-bottom: 15px;">
        ${message}
      </div>
      <button class="alert-ok-btn" style="
        background: ${borderColor};
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s ease;
      ">
        OK
      </button>
    `;

    // Ajouter l'animation CSS si elle n'existe pas
    if (!document.getElementById("admin-alert-animation")) {
      const style = document.createElement("style");
      style.id = "admin-alert-animation";
      style.textContent = `
        @keyframes alertFadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(alert);

    // Fonction pour fermer l'alerte
    const closeAlert = () => {
      alert.style.opacity = "0";
      alert.style.transform = "translate(-50%, -50%) scale(0.8)";
      setTimeout(() => {
        if (alert.parentElement) {
          alert.remove();
        }
      }, 200);
    };

    // Event listeners pour fermer
    const okBtn = alert.querySelector(".alert-ok-btn");
    okBtn.addEventListener("click", closeAlert);

    // Effet hover sur le bouton
    okBtn.addEventListener("mouseenter", () => {
      okBtn.style.background = "#c82333";
      okBtn.style.transform = "scale(1.05)";
    });
    okBtn.addEventListener("mouseleave", () => {
      okBtn.style.background = borderColor;
      okBtn.style.transform = "scale(1)";
    });

    // Fermer avec Escape
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeAlert();
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // Fermer en cliquant à l'extérieur
    alert.addEventListener("click", (e) => {
      if (e.target === alert) {
        closeAlert();
      }
    });

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      if (alert.parentElement) {
        closeAlert();
      }
    }, 5000);
  }

  /**
   * Vérifie si on est en mode admin
   */
  isInAdminMode() {
    return this.isAdminMode;
  }

  /**
   * Charge les données du responsable connecté pour affichage en mode admin
   */
  loadResponsableData() {
    const targetPage = localStorage.getItem("adminViewTarget");
    console.log(`🔍 Chargement des données pour: ${targetPage}`);

    if (targetPage === "acconier") {
      // Charger les données du responsable acconier connecté
      const respAcconierUser = localStorage.getItem("respAcconierUser");
      if (respAcconierUser) {
        try {
          const userData = JSON.parse(respAcconierUser);
          console.log("👤 Données responsable acconier:", userData);

          // Injecter les données dans l'interface
          this.injectResponsableDataIntoInterface(userData, "acconier");

          // Forcer le rechargement du tableau avec les données du responsable
          this.loadResponsableTableData("acconier", userData);
        } catch (e) {
          console.error("Erreur parsing données responsable acconier:", e);
        }
      }
    } else if (targetPage === "livraison") {
      // Charger les données du responsable livraison connecté
      const respLivUser = localStorage.getItem("respLivUser");
      if (respLivUser) {
        try {
          const userData = JSON.parse(respLivUser);
          console.log("👤 Données responsable livraison:", userData);

          // Injecter les données dans l'interface
          this.injectResponsableDataIntoInterface(userData, "livraison");

          // Forcer le rechargement du tableau avec les données du responsable
          this.loadResponsableTableData("livraison", userData);
        } catch (e) {
          console.error("Erreur parsing données responsable livraison:", e);
        }
      }
    }
  }

  /**
   * Injecte les données du responsable dans l'interface (avatar, nom, etc.)
   */
  injectResponsableDataIntoInterface(userData, type) {
    // Mettre à jour l'avatar et le nom
    const avatar = document.querySelector("#userAvatarCircle, .user-avatar");
    const userName = document.querySelector("#userNameSidebar, .user-name");
    const userProfil = document.querySelector(
      "#userProfilSidebar, .user-profil"
    );

    if (avatar && userData.nom) {
      const initiales = userData.nom
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
      avatar.textContent = initiales;
    }

    if (userName) {
      userName.textContent = userData.nom || `Responsable ${type}`;
    }

    if (userProfil) {
      userProfil.textContent = userData.profil || `Responsable ${type}`;
    }

    console.log(`✅ Interface mise à jour avec les données de ${userData.nom}`);
  }

  /**
   * Charge les données du tableau spécifiques au responsable
   */
  loadResponsableTableData(type, userData) {
    // Déclencher un rechargement du tableau avec un filtre sur l'employé
    if (typeof window.loadDeliveries === "function") {
      console.log(`🔄 Rechargement des données pour ${userData.nom}`);
      window.loadDeliveries();
    } else if (typeof window.chargerDonnees === "function") {
      console.log(`🔄 Rechargement des données pour ${userData.nom}`);
      window.chargerDonnees();
    }

    // Ajouter un filtre automatique sur le nom de l'employé
    setTimeout(() => {
      const searchInput = document.querySelector("#searchInput, .search-input");
      if (searchInput && userData.nom) {
        searchInput.value = userData.nom;

        // Déclencher la recherche
        const searchEvent = new Event("input", { bubbles: true });
        searchInput.dispatchEvent(searchEvent);

        console.log(`🔍 Filtre appliqué sur: ${userData.nom}`);
      }
    }, 1000);
  }

  /**
   * Nettoie la session admin si elle est expirée
   */
  cleanupExpiredAdminSession() {
    const adminTimestamp = localStorage.getItem("adminViewTimestamp");
    if (adminTimestamp) {
      const timeDiff = Date.now() - parseInt(adminTimestamp);
      const twoHoursInMs = 2 * 60 * 60 * 1000;

      if (timeDiff > twoHoursInMs) {
        localStorage.removeItem("adminViewMode");
        localStorage.removeItem("adminViewTimestamp");
        localStorage.removeItem("adminViewTarget");
        console.log("Session admin expirée - nettoyage effectué");

        // Recharger la page pour sortir du mode admin
        if (this.isAdminMode) {
          window.location.reload();
        }
      }
    }
  }
}

// Initialiser le gestionnaire de mode admin
const adminModeManager = new AdminModeManager();

// Nettoyer périodiquement les sessions expirées
setInterval(() => {
  adminModeManager.cleanupExpiredAdminSession();
}, 5 * 60 * 1000); // Toutes les 5 minutes

// Exporter pour utilisation globale
window.adminModeManager = adminModeManager;

// Fonction utilitaire globale pour vérifier le mode admin
window.isAdminMode = () => adminModeManager.isInAdminMode();

console.log("🔧 Gestionnaire de mode admin initialisé");

// Debug: Afficher l'état du mode admin dans la console
if (typeof window !== "undefined") {
  console.log("🔍 État actuel:", {
    url: window.location.href,
    modeParam: new URLSearchParams(window.location.search).get("mode"),
    adminViewMode: localStorage.getItem("adminViewMode"),
    adminTimestamp: localStorage.getItem("adminViewTimestamp"),
    adminTarget: localStorage.getItem("adminViewTarget"),
    isAdminMode: adminModeManager.isInAdminMode(),
  });
}
