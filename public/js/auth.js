// auth.js - Gestion de l'inscription et de la connexion pour ITS Service

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const signupMessage = document.getElementById("signup-message");
const loginMessage = document.getElementById("login-message");

// Helper pour affichage message
function showMessage(el, msg, isSuccess = false) {
  el.textContent = msg;
  el.classList.toggle("success", isSuccess);
}

// Fonction globale pour afficher/masquer le mot de passe
window.togglePassword = function (inputId, el) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    el.innerHTML = '<i class="fa fa-eye-slash"></i>';
  } else {
    input.type = "password";
    el.innerHTML = '<i class="fa fa-eye"></i>';
  }
};

// Inscription
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage(signupMessage, "");
    const nom = signupForm["signup-nom"].value.trim();
    const email = signupForm["signup-email"].value.trim();
    const password = signupForm["signup-password"].value;
    if (!nom || !email || !password) {
      showMessage(signupMessage, "Tous les champs sont requis.");
      return;
    }
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage(
          signupMessage,
          "Inscription réussie ! Redirection...",
          true
        );
        setTimeout(() => {
          // Redirige automatiquement vers l'onglet Connexion
          document.getElementById("tab-login").click();
        }, 1200);
      } else {
        showMessage(
          signupMessage,
          data.message || "Erreur lors de l'inscription."
        );
      }
    } catch (err) {
      showMessage(signupMessage, "Erreur réseau ou serveur.");
    }
  });
}

// Connexion
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage(loginMessage, "");
    const email = loginForm["login-email"].value.trim();
    const password = loginForm["login-password"].value;
    if (!email || !password) {
      showMessage(loginMessage, "Tous les champs sont requis.");
      return;
    }
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        // Stocke le nom et l'email dans le localStorage pour la page profil
        if (data.user && data.user.nom && data.user.email) {
          localStorage.setItem("userName", data.user.nom);
          localStorage.setItem("userEmail", data.user.email);
        } else {
          // Pour compatibilité si l'API ne renvoie pas user, on stocke ce qu'on a
          localStorage.setItem("userName", data.nom || "");
          localStorage.setItem("userEmail", data.email || email);
        }
        showMessage(loginMessage, "Connexion réussie ! Redirection...", true);
        setTimeout(() => {
          window.location.href =
            "https://plateformdesuivie-its-service-1cjx.onrender.com/html/resp_acconier.html";
        }, 1000);
      } else {
        showMessage(
          loginMessage,
          data.message || "Email ou mot de passe incorrect."
        );
      }
    } catch (err) {
      showMessage(loginMessage, "Erreur réseau ou serveur.");
    }
  });
}
