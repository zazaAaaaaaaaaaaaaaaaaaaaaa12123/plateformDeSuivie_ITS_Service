// auth.js - Gestion de l'inscription et de la connexion pour ITS Service

// --- Améliorations responsive/mobile/tablette/ordi ---
document.addEventListener("DOMContentLoaded", function () {
  // Focus automatique sur le premier champ visible selon l'onglet
  function focusFirstInput() {
    if (window.innerWidth <= 900) {
      // Sur mobile/tablette, scroll en haut et focus sur le champ actif
      setTimeout(() => {
        const activeForm = document.querySelector("form.active");
        if (activeForm) {
          const firstInput = activeForm.querySelector(
            "input[type='text'],input[type='email'],input[type='password']"
          );
          if (firstInput) {
            firstInput.focus();
            // Scroll pour éviter que le clavier masque le champ
            firstInput.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 200);
    }
  }
  // Focus au chargement
  focusFirstInput();
  // Focus lors du changement d'onglet
  const tabSignup = document.getElementById("tab-signup");
  const tabLogin = document.getElementById("tab-login");
  if (tabSignup) tabSignup.addEventListener("click", focusFirstInput);
  if (tabLogin) tabLogin.addEventListener("click", focusFirstInput);

  // Sur mobile/tablette, améliore le feedback lors de la soumission
  function addMobileFeedback(form, messageEl) {
    if (!form) return;
    form.addEventListener("submit", function () {
      if (window.innerWidth <= 900) {
        setTimeout(() => {
          if (messageEl && messageEl.textContent) {
            messageEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 350);
      }
    });
  }
  addMobileFeedback(signupForm, signupMessage);
  addMobileFeedback(loginForm, loginMessage);
});

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
        // Forcer le stockage et la redirection acconier
        if (data.user) {
          localStorage.setItem("respAcconierUser", JSON.stringify(data.user));
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
