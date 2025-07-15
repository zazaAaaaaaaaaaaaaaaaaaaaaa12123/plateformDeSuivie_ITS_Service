// Gestion du formulaire d'inscription/connexion Acconier
const formInscription = document.getElementById("form-inscription");
const formConnexion = document.getElementById("form-connexion");
const formForgot = document.getElementById("form-forgot-password");
const toLogin = document.getElementById("to-login");
const toRegister = document.getElementById("to-register");
const toForgot = document.getElementById("to-forgot-password");
const toLoginFromForgot = document.getElementById("to-login-from-forgot");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const forgotForm = document.getElementById("forgotPasswordForm");
const registerError = document.getElementById("register-error");
const registerSuccess = document.getElementById("register-success");
const loginError = document.getElementById("login-error");
const forgotError = document.getElementById("forgot-error");
const forgotSuccess = document.getElementById("forgot-success");

// Switch entre inscription et connexion
if (toLogin)
  toLogin.onclick = () => {
    formInscription.style.display = "none";
    formConnexion.style.display = "block";
    if (formForgot) formForgot.style.display = "none";
    registerError.textContent = "";
    registerSuccess.textContent = "";
  };
if (toRegister)
  toRegister.onclick = () => {
    formInscription.style.display = "block";
    formConnexion.style.display = "none";
    if (formForgot) formForgot.style.display = "none";
    loginError.textContent = "";
  };

// Switch vers mot de passe oublié
if (toForgot)
  toForgot.onclick = () => {
    formInscription.style.display = "none";
    formConnexion.style.display = "none";
    if (formForgot) formForgot.style.display = "block";
    loginError.textContent = "";
    forgotError.textContent = "";
    forgotSuccess.textContent = "";
  };
if (toLoginFromForgot)
  toLoginFromForgot.onclick = () => {
    formInscription.style.display = "none";
    formConnexion.style.display = "block";
    if (formForgot) formForgot.style.display = "none";
    forgotError.textContent = "";
    forgotSuccess.textContent = "";
  };

// Envoi du formulaire de récupération de mot de passe
if (forgotForm)
  forgotForm.onsubmit = async (e) => {
    e.preventDefault();
    forgotError.textContent = "";
    forgotSuccess.textContent = "";
    const email = document.getElementById("forgot-email").value.trim();
    if (!email) {
      forgotError.textContent = "Veuillez entrer votre email.";
      return;
    }
    try {
      const res = await fetch("/acconier/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        forgotSuccess.textContent =
          "Un email de réinitialisation a été envoyé si l'adresse existe.";
      } else {
        forgotError.textContent = data.message || "Erreur lors de l'envoi.";
      }
    } catch (err) {
      forgotError.textContent = "Erreur réseau.";
    }
  };

// Inscription
if (registerForm)
  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    registerError.textContent = "";
    registerSuccess.textContent = "";
    const nom = document.getElementById("register-nom").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    if (!nom || !email || !password) {
      registerError.textContent = "Tous les champs sont obligatoires.";
      return;
    }
    try {
      const res = await fetch("/acconier/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        registerSuccess.textContent = "Inscription réussie ! Connectez-vous.";
        setTimeout(() => {
          formInscription.style.display = "none";
          formConnexion.style.display = "block";
        }, 1200);
      } else {
        registerError.textContent =
          data.message || "Erreur lors de l'inscription.";
      }
    } catch (err) {
      registerError.textContent = "Erreur réseau.";
    }
  };

// Connexion
if (loginForm)
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    if (!email || !password) {
      loginError.textContent = "Tous les champs sont obligatoires.";
      return;
    }
    try {
      const res = await fetch("/acconier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Redirige vers l'interface employeur après connexion
        window.location.href = "../html/interfaceFormulaireEmployer.html";
      } else {
        loginError.textContent = data.message || "Identifiants invalides.";
      }
    } catch (err) {
      loginError.textContent = "Erreur réseau.";
    }
  };

// Gestion de l'icône œil déjà présente dans le HTML pour afficher/masquer le mot de passe
document.addEventListener("DOMContentLoaded", function () {
  const toggles = document.querySelectorAll(".toggle-password-fa");
  toggles.forEach(function (toggle) {
    const inputId = toggle.getAttribute("data-target");
    const input = document.getElementById(inputId);
    let visible = false;
    toggle.addEventListener("click", function () {
      visible = !visible;
      if (input) {
        input.type = visible ? "text" : "password";
        // Toujours cibler l'icône enfant (FontAwesome)
        const icon =
          toggle.tagName === "I" ? toggle : toggle.querySelector("i");
        if (icon) {
          icon.classList.toggle("fa-eye-slash", visible);
          icon.classList.toggle("fa-eye", !visible);
        }
      }
    });
  });
});
