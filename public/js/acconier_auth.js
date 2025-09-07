// Gestion du formulaire de connexion/demande d'accès Acconier
const formConnexion = document.getElementById("form-connexion");
const formRequestAccess = document.getElementById("form-request-access");
const formForgotCode = document.getElementById("form-forgot-code");
const requestAccess = document.getElementById("request-access");
const toForgotCode = document.getElementById("to-forgot-code");
const toLoginFromRequest = document.getElementById("to-login-from-request");
const toLoginFromForgot = document.getElementById("to-login-from-forgot");
const loginForm = document.getElementById("loginForm");
const requestAccessForm = document.getElementById("requestAccessForm");
const forgotCodeForm = document.getElementById("forgotCodeForm");
const loginError = document.getElementById("login-error");
const loginSuccess = document.getElementById("login-success");
const requestError = document.getElementById("request-error");
const requestSuccess = document.getElementById("request-success");
const forgotError = document.getElementById("forgot-error");
const forgotSuccess = document.getElementById("forgot-success");

// Switch vers demande d'accès
if (requestAccess)
  requestAccess.onclick = () => {
    formConnexion.style.display = "none";
    formRequestAccess.style.display = "block";
    if (formForgotCode) formForgotCode.style.display = "none";
    loginError.textContent = "";
    loginSuccess.textContent = "";
    requestError.textContent = "";
    requestSuccess.textContent = "";
  };

// Switch vers code d'accès oublié
if (toForgotCode)
  toForgotCode.onclick = () => {
    formConnexion.style.display = "none";
    formRequestAccess.style.display = "none";
    if (formForgotCode) formForgotCode.style.display = "block";
    loginError.textContent = "";
    loginSuccess.textContent = "";
    forgotError.textContent = "";
    forgotSuccess.textContent = "";
  };

// Retour à la connexion depuis demande d'accès
if (toLoginFromRequest)
  toLoginFromRequest.onclick = () => {
    formConnexion.style.display = "block";
    formRequestAccess.style.display = "none";
    if (formForgotCode) formForgotCode.style.display = "none";
    requestError.textContent = "";
    requestSuccess.textContent = "";
  };

// Retour à la connexion depuis code oublié
if (toLoginFromForgot)
  toLoginFromForgot.onclick = () => {
    formConnexion.style.display = "block";
    formRequestAccess.style.display = "none";
    if (formForgotCode) formForgotCode.style.display = "none";
    forgotError.textContent = "";
    forgotSuccess.textContent = "";
  };

// Envoi du formulaire de demande d'accès
if (requestAccessForm)
  requestAccessForm.onsubmit = async (e) => {
    e.preventDefault();
    requestError.textContent = "";
    requestSuccess.textContent = "";
    const nom = document.getElementById("request-nom").value.trim();
    const email = document.getElementById("request-email").value.trim();
    if (!nom || !email) {
      requestError.textContent = "Tous les champs sont obligatoires.";
      return;
    }
    try {
      const res = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nom,
          email,
          actorType: "agent-transit",
          role: "Agent Transit",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        requestSuccess.textContent =
          "Votre demande d'accès a été envoyée. Vous recevrez votre code par email une fois approuvée.";
        document.getElementById("request-nom").value = "";
        document.getElementById("request-email").value = "";
      } else {
        // Gestion spéciale pour l'erreur 409 (conflit)
        if (res.status === 409) {
          requestError.textContent =
            "Une demande d'accès existe déjà pour cet email. Si vous avez déjà reçu votre code d'accès, utilisez le formulaire de connexion.";
        } else {
          requestError.textContent =
            data.message || "Erreur lors de l'envoi de la demande.";
        }
      }
    } catch (err) {
      requestError.textContent = "Erreur réseau.";
    }
  };

// Envoi du formulaire de récupération de code d'accès
if (forgotCodeForm)
  forgotCodeForm.onsubmit = async (e) => {
    e.preventDefault();
    forgotError.textContent = "";
    forgotSuccess.textContent = "";
    const email = document.getElementById("forgot-email").value.trim();
    if (!email) {
      forgotError.textContent = "Veuillez entrer votre email.";
      return;
    }
    try {
      const res = await fetch("/api/acconier/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type: "forgot_code",
          actor_type: "agent-transit",
          source: "acconier_auth",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        forgotSuccess.textContent =
          "Une demande de nouveau code a été envoyée. Vous recevrez votre nouveau code par email une fois approuvée.";
        document.getElementById("forgot-email").value = "";
      } else {
        forgotError.textContent =
          data.message || "Erreur lors de l'envoi de la demande.";
      }
    } catch (err) {
      forgotError.textContent = "Erreur réseau.";
    }
  };

// Connexion avec code d'accès
if (loginForm)
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    loginSuccess.textContent = "";
    const email = document.getElementById("login-email").value.trim();
    const code = document.getElementById("login-code").value;
    if (!email || !code) {
      loginError.textContent = "Tous les champs sont obligatoires.";
      return;
    }
    try {
      const res = await fetch("/api/acconier-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          actorType: "agent-transit",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Sauvegarder les informations utilisateur dans localStorage
        localStorage.setItem(
          "acconier_user",
          JSON.stringify({
            nom: data.user.name,
            email: data.user.email,
          })
        );

        // Également sauvegarder dans les anciennes clés pour la compatibilité
        localStorage.setItem("currentUser", data.user.name);
        localStorage.setItem("currentUserEmail", data.user.email);

        console.log("[AUTH] Informations utilisateur sauvegardées:", {
          nom: data.user.name,
          email: data.user.email,
        });

        // Redirige vers l'interface employeur après connexion
        window.location.href = "../html/interfaceFormulaireEmployer.html";
      } else {
        loginError.textContent = data.message || "Code d'accès invalide.";
      }
    } catch (err) {
      loginError.textContent = "Erreur réseau.";
    }
  };

// Gestion de l'icône œil pour afficher/masquer le code d'accès
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
