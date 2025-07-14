// Gestion de la connexion utilisateur
document.addEventListener("DOMContentLoaded", function () {
  // --- Déclarations des éléments DOM utilisés dans toute la fonction ---
  const resetPwForm = document.getElementById("resetPwForm");
  const backToForgotBtn = document.getElementById("backToForgotBtn");
  const resetPwMsg = document.getElementById("resetPwMsg");
  const loginForm = document.getElementById("loginForm");
  const forgotPwForm = document.getElementById("forgotPwForm");
  const forgotPwLink = document.getElementById("forgotPwLink");
  const backToLoginBtn = document.getElementById("backToLoginBtn");
  const forgotPwMsg = document.getElementById("forgotPwMsg");

  // Afficher le formulaire de reset après demande code
  function showResetPwForm(email) {
    if (forgotPwForm) forgotPwForm.classList.add("hidden");
    if (resetPwForm) {
      resetPwForm.classList.remove("hidden");
      document.getElementById("resetPwEmail").value = email || "";
      if (resetPwMsg) resetPwMsg.textContent = "";
    }
  }

  // Depuis le formulaire de demande code, bouton pour passer à la saisie du code
  if (forgotPwForm) {
    // Ajout d'un bouton "J'ai déjà un code" si besoin (optionnel)
    // ...
  }

  // Retour du reset vers la demande code
  if (backToForgotBtn && resetPwForm && forgotPwForm) {
    backToForgotBtn.addEventListener("click", function () {
      resetPwForm.classList.add("hidden");
      forgotPwForm.classList.remove("hidden");
      if (resetPwMsg) resetPwMsg.textContent = "";
    });
  }

  // Affiche le formulaire mot de passe oublié
  if (forgotPwLink && forgotPwForm && loginForm) {
    forgotPwLink.addEventListener("click", function (e) {
      e.preventDefault();
      loginForm.classList.add("hidden");
      forgotPwForm.classList.remove("hidden");
      if (forgotPwMsg) forgotPwMsg.textContent = "";
    });
  }
  // Retour à la connexion
  if (backToLoginBtn && forgotPwForm && loginForm) {
    backToLoginBtn.addEventListener("click", function () {
      forgotPwForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
      if (forgotPwMsg) forgotPwMsg.textContent = "";
    });
  }

  // Soumission du formulaire mot de passe oublié
  if (forgotPwForm) {
    forgotPwForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("forgotPwEmail").value.trim();
      if (!email) {
        if (forgotPwMsg) {
          forgotPwMsg.textContent = "Veuillez entrer votre email.";
          forgotPwMsg.style.color = "red";
        }
        return;
      }
      try {
        const res = await fetch("/api/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (forgotPwMsg) {
            forgotPwMsg.textContent =
              data.message || "Un code a été généré (voir ci-dessus).";
            forgotPwMsg.style.color = "green";
          }
          // Affiche le formulaire de reset après succès (3s pour laisser le temps de copier le code)
          setTimeout(function () {
            showResetPwForm(email);
          }, 3000);
        } else {
          if (forgotPwMsg) {
            forgotPwMsg.textContent =
              data.message || "Erreur lors de la demande.";
            forgotPwMsg.style.color = "red";
          }
        }
      } catch (err) {
        if (forgotPwMsg) {
          forgotPwMsg.textContent =
            "Erreur réseau ou serveur. Veuillez réessayer.";
          forgotPwMsg.style.color = "red";
        }
      }
    });
  }

  // Soumission du formulaire de réinitialisation du mot de passe
  if (resetPwForm) {
    resetPwForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("resetPwEmail").value.trim();
      const code = document.getElementById("resetPwCode").value.trim();
      const newPassword = document.getElementById("resetPwNew").value;
      if (!email || !code || !newPassword) {
        if (resetPwMsg) {
          resetPwMsg.textContent = "Veuillez remplir tous les champs.";
          resetPwMsg.style.color = "red";
        }
        return;
      }
      try {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, newPassword }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (resetPwMsg) {
            resetPwMsg.textContent =
              data.message || "Mot de passe réinitialisé avec succès.";
            resetPwMsg.style.color = "green";
          }
          // Retour à la connexion après 2s
          setTimeout(function () {
            resetPwForm.classList.add("hidden");
            loginForm.classList.remove("hidden");
            if (resetPwMsg) resetPwMsg.textContent = "";
          }, 2000);
        } else {
          if (resetPwMsg) {
            resetPwMsg.textContent =
              data.message || "Erreur lors de la réinitialisation.";
            resetPwMsg.style.color = "red";
          }
        }
      } catch (err) {
        if (resetPwMsg) {
          resetPwMsg.textContent =
            "Erreur réseau ou serveur. Veuillez réessayer.";
          resetPwMsg.style.color = "red";
        }
      }
    });
  }
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const errorDiv = document.getElementById("loginError");
      if (errorDiv) errorDiv.textContent = "";
      if (!email || !password) {
        if (errorDiv) {
          errorDiv.textContent = "Veuillez remplir tous les champs.";
          errorDiv.style.color = "red";
        } else {
          alert("Veuillez remplir tous les champs.");
        }
        return;
      }
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
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
                profil: "Responsable",
              })
            );
            localStorage.setItem("showSuccessMessage", "true");
          }
          // Redirection tableau de bord pour tout utilisateur inscrit ici (admin/responsable)
          if (data.isAdmin) {
            localStorage.setItem("isAdminLoggedIn", "true");
          } else {
            localStorage.removeItem("isAdminLoggedIn");
          }
          window.location.href = "/html/tableauDeBord.html";
        } else {
          if (errorDiv) {
            errorDiv.textContent =
              data.message || "Erreur lors de la connexion.";
            errorDiv.style.color = "red";
            errorDiv.style.marginTop = "8px";
          } else {
            alert(data.message || "Erreur lors de la connexion.");
          }
        }
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent =
            "Erreur réseau ou serveur. Veuillez réessayer.";
          errorDiv.style.color = "red";
        } else {
          alert("Erreur réseau ou serveur. Veuillez réessayer.");
        }
      }
    });
  }
});
// Gestion de l'inscription utilisateur
document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      // Simple validation côté client
      if (!name || !email || !password) {
        alert("Veuillez remplir tous les champs.");
        return;
      }
      // Efface le message d'erreur dès la soumission
      const errorDiv = document.getElementById("signupError");
      if (errorDiv) errorDiv.textContent = "";
      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          // Succès : inscription, on affiche un message personnalisé avec l'email
          let welcomeMsg =
            "Inscription réussie. Bienvenue, " +
            (email ? email : "!") +
            " Vous pouvez maintenant vous connecter.";
          if (errorDiv) {
            errorDiv.textContent = welcomeMsg;
            errorDiv.style.color = "green";
            errorDiv.style.marginTop = "8px";
          } else {
            alert(welcomeMsg);
          }
          signupForm.reset();
        } else {
          // Affichage message d'erreur sous le formulaire, pas de redirection
          if (errorDiv) {
            // On ne montre PAS le message "Cet email est déjà utilisé." si la connexion a déjà réussi
            if (data.message === "Cet email est déjà utilisé.") {
              errorDiv.textContent = data.message;
              errorDiv.style.color = "red";
              errorDiv.style.marginTop = "8px";
            } else {
              errorDiv.textContent =
                data.message || "Erreur lors de l'inscription.";
              errorDiv.style.color = "red";
              errorDiv.style.marginTop = "8px";
            }
          } else {
            alert(data.message || "Erreur lors de l'inscription.");
          }
        }
      } catch (err) {
        alert("Erreur réseau ou serveur. Veuillez réessayer.");
      }
    });

    // Efface le message d'erreur dès qu'on modifie un champ du formulaire d'inscription
    ["signupName", "signupEmail", "signupPassword"].forEach(function (id) {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", function () {
          const errorDiv = document.getElementById("signupError");
          if (errorDiv) errorDiv.textContent = "";
        });
      }
    });
  }
});
