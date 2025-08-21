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
window.afficherMessage = async () => {
  masquerAccueil();
  // Masque spécifiquement les autres conteneurs dynamiques
  document.getElementById("suiviContainer").style.display = "none";
  document.getElementById("historiqueAgentsContainer").style.display = "none";

  const messagerieContainer = document.getElementById("messagerieContainer");
  messagerieContainer.style.display = "block"; // Affiche le conteneur de la messagerie
  await loadAndInjectContent(
    messagerieContainer,
    "message.html",
    "/js/scriptMessage.js"
  );
};

window.afficherSuivi = async () => {
  masquerAccueil();
  // Masque spécifiquement les autres conteneurs dynamiques
  document.getElementById("messagerieContainer").style.display = "none";
  document.getElementById("historiqueAgentsContainer").style.display = "none";

  const suiviContainer = document.getElementById("suiviContainer");
  suiviContainer.style.display = "block"; // Affiche le conteneur de suivi
  await loadAndInjectContent(
    suiviContainer,
    "interfaceSuivie.html",
    "/js/scriptSuivie.js"
  );
};

// Fonction pour afficher l'historique des agents (si implémenté)
window.afficherHistoriqueAgents = async () => {
  masquerAccueil();
  document.getElementById("messagerieContainer").style.display = "none";
  document.getElementById("suiviContainer").style.display = "none";

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
  const email = localStorage.getItem("emailConnecte");
  const bienvenue = document.getElementById("bienvenue");
  const loader = document.getElementById("loader");

  // Récupérer les conteneurs dynamiques (déjà définis globalement, mais bon de les avoir ici aussi pour la clarté)
  const messagerieContainer = document.getElementById("messagerieContainer");
  const suiviContainer = document.getElementById("suiviContainer");
  const historiqueAgentsContainer = document.getElementById(
    "historiqueAgentsContainer"
  );

  // Affichage du message de bienvenue avec l'e-mail de l'utilisateur
  if (email && bienvenue) {
    bienvenue.textContent = `Bienvenue, ${email} !`;
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
  const lienArchive = document.getElementById("lienArchive");

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

  // GESTION DU LIEN "Archive"
  if (lienArchive) {
    lienArchive.addEventListener("click", (e) => {
      e.preventDefault();
      // Fonctionnalité d'archive - à implémenter selon vos besoins
      showCustomAlert(
        "Fonction Archives en cours de développement",
        "info",
        3000
      );
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
