// Gestion de la connexion utilisateur - Version Système d'Accès
document.addEventListener("DOMContentLoaded", function () {
  // --- Déclarations des éléments DOM utilisés dans toute la fonction ---
  const loginForm = document.getElementById("loginForm");

  // Gestion de la connexion avec le nouveau système
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const accessCode = document.getElementById("loginPassword").value;
      const errorDiv = document.getElementById("loginError");

      if (errorDiv) errorDiv.textContent = "";

      if (!email || !accessCode) {
        if (errorDiv) {
          errorDiv.textContent = "Veuillez remplir tous les champs.";
        } else {
          alert("Veuillez remplir tous les champs.");
        }
        return;
      }

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: accessCode }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          // Stocke le profil complet dans localStorage pour le dashboard
          if (data.name && data.email) {
            localStorage.setItem(
              "user",
              JSON.stringify({
                nom: data.name,
                email: data.email,
                profil: data.profil || "Responsable",
              })
            );
            localStorage.setItem("showSuccessMessage", "true");
            localStorage.setItem("userEmail", email);
          }

          // Vérification si c'est un admin
          if (data.isAdmin) {
            localStorage.setItem("isAdminLoggedIn", "true");
          } else {
            localStorage.removeItem("isAdminLoggedIn");
          }

          // Redirection selon le type d'utilisateur
          if (data.isAdmin) {
            window.location.href = "/html/access-management.html";
          } else {
            window.location.href = "https://dossiv.ci/html/tableauDeBord.html";
          }
        } else {
          if (errorDiv) {
            errorDiv.textContent =
              data.message || "Email ou code d'accès incorrect.";
          } else {
            alert(data.message || "Email ou code d'accès incorrect.");
          }
        }
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent =
            "Erreur réseau ou serveur. Veuillez réessayer.";
        } else {
          alert("Erreur réseau ou serveur. Veuillez réessayer.");
        }
      }
    });
  }
});

// Fonction pour ajouter une nouvelle demande d'accès (appelée depuis l'index)
function submitAccessRequest(requestData) {
  // Envoyer au serveur
  fetch("/api/access-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Demande d'accès envoyée:", data);

      // Notifier l'interface d'administration si elle est ouverte
      if (
        window.addNewAccessRequest &&
        typeof window.addNewAccessRequest === "function"
      ) {
        window.addNewAccessRequest(requestData);
      }

      // Sauvegarder localement aussi pour la démo
      const existingRequests = JSON.parse(
        localStorage.getItem("accessRequests") || "[]"
      );
      const newRequest = {
        id: Date.now() + Math.random(),
        name: requestData.name,
        email: requestData.email,
        date: requestData.date,
        status: "pending",
        timestamp: new Date().getTime(),
      };

      existingRequests.push(newRequest);
      localStorage.setItem("accessRequests", JSON.stringify(existingRequests));
    })
    .catch((error) => {
      console.error("Erreur lors de l'envoi:", error);

      // Même en cas d'erreur, sauvegarder localement pour la démo
      const existingRequests = JSON.parse(
        localStorage.getItem("accessRequests") || "[]"
      );
      const newRequest = {
        id: Date.now() + Math.random(),
        name: requestData.name,
        email: requestData.email,
        date: requestData.date,
        status: "pending",
        timestamp: new Date().getTime(),
      };

      existingRequests.push(newRequest);
      localStorage.setItem("accessRequests", JSON.stringify(existingRequests));
    });
}

// Exposer la fonction globalement
window.submitAccessRequest = submitAccessRequest;
