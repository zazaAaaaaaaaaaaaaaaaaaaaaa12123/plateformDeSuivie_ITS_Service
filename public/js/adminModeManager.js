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
    // Ajouter une classe CSS pour identifier le mode admin
    document.body.classList.add("admin-view-mode");

    // Ajouter un indicateur visuel
    this.addAdminModeIndicator();

    // Désactiver les formulaires et boutons d'édition
    this.disableEditingFeatures();

    // Ajouter un message d'information
    this.addAdminModeMessage();

    // Charger les données du responsable connecté
    this.loadResponsableData();

    // Appliquer toutes les 500ms pendant 5 secondes pour être sûr
    let attempts = 0;
    const maxAttempts = 10;
    const applyInterval = setInterval(() => {
      this.disableEditingFeatures();
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(applyInterval);
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

    // Désactiver TOUS les inputs, selects et textareas de façon plus agressive
    const editableElements = document.querySelectorAll(
      'input, select, textarea, button[type="submit"], button:not([data-allow-admin])'
    );

    console.log(`🔒 Éléments trouvés à désactiver: ${editableElements.length}`);

    editableElements.forEach((element) => {
      const buttonText = element.textContent
        ? element.textContent.toLowerCase()
        : "";
      const isNavigationButton =
        buttonText.includes("retour") ||
        buttonText.includes("fermer") ||
        buttonText.includes("annuler") ||
        buttonText.includes("close") ||
        element.classList.contains("close") ||
        element.id.includes("close") ||
        element.getAttribute("data-allow-admin") === "true";

      if (!isNavigationButton) {
        element.disabled = true;
        element.readOnly = true;
        element.style.opacity = "0.5";
        element.style.cursor = "not-allowed";
        element.style.pointerEvents = "none";
        element.title = "Modification non autorisée en mode admin";

        // Empêcher tous les événements
        ["click", "input", "change", "keydown", "keyup", "focus"].forEach(
          (eventType) => {
            element.addEventListener(
              eventType,
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
          }
        );
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
          const isNavigationButton =
            buttonText.includes("retour") ||
            buttonText.includes("fermer") ||
            buttonText.includes("annuler") ||
            buttonText.includes("close") ||
            button.classList.contains("close") ||
            button.id.includes("close") ||
            button.getAttribute("data-allow-admin") === "true";

          if (!isNavigationButton) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.showAdminModeAlert(
              "Action non autorisée en mode visualisation admin"
            );
            return false;
          }
        }
      },
      true
    );
  }

  /**
   * Ajoute un message d'information sur le mode admin
   */
  addAdminModeMessage() {
    const message = document.createElement("div");
    message.id = "admin-mode-message";
    message.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        border: 2px solid #2563eb;
        border-radius: 12px;
        padding: 16px;
        margin: 10px;
        text-align: center;
        font-weight: 600;
        color: #1d4ed8;
      ">
        <i class="fas fa-info-circle"></i>
        Vous consultez cette page en mode administrateur. Aucune modification n'est possible.
        <br>
        <small style="font-weight: normal; color: #374151;">
          Les données affichées correspondent au responsable actuellement connecté sur cette interface.
        </small>
      </div>
    `;

    // Insérer le message au début du contenu principal
    const mainContent =
      document.querySelector("main, .main-content, .container") ||
      document.body;
    mainContent.insertBefore(message, mainContent.firstChild);
  }

  /**
   * Affiche une alerte personnalisée pour le mode admin
   */
  showAdminModeAlert(message) {
    // Créer une alerte personnalisée
    const alert = document.createElement("div");
    alert.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 3px solid #dc3545;
      border-radius: 12px;
      padding: 20px;
      z-index: 10001;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 400px;
      text-align: center;
    `;

    alert.innerHTML = `
      <div style="color: #dc3545; font-size: 1.2em; margin-bottom: 10px;">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div style="color: #374151; font-weight: 600; margin-bottom: 15px;">
        ${message}
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      ">
        OK
      </button>
    `;

    document.body.appendChild(alert);

    // Supprimer automatiquement après 3 secondes
    setTimeout(() => {
      if (alert.parentElement) {
        alert.remove();
      }
    }, 3000);
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
