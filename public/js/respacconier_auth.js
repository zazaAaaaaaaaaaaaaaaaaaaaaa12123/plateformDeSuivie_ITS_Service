// JS pour la gestion du formulaire Responsable Acconier (inscription, connexion, code entreprise)

document.addEventListener("DOMContentLoaded", function () {
  // Gestion du lien 'Code entreprise oublié ?' avec formulaire dynamique
  const codeOublieLink = document.getElementById("code-entreprise-oublie");
  const codeOublieFormContainer = document.getElementById(
    "code-entreprise-oublie-form-container"
  );
  // Gestion du lien 'Code entreprise oublié ?' : uniquement formulaire dynamique, suppression de toute alerte statique
  if (codeOublieLink && codeOublieFormContainer) {
    codeOublieLink.onclick = function () {
      codeOublieFormContainer.innerHTML = `
        <div style='background:#f8fafc;border-radius:10px;padding:16px 12px;margin-top:10px;border:1px solid #2563eb;'>
          <input id='demandeCodeNomResp' type='text' placeholder='Votre nom' style='width:100%;margin-bottom:7px;padding:7px 10px;border-radius:7px;border:1px solid #2563eb;font-size:1em;'>
          <input id='demandeCodeEmailResp' type='email' placeholder='Votre email' style='width:100%;margin-bottom:7px;padding:7px 10px;border-radius:7px;border:1px solid #2563eb;font-size:1em;'>
          <textarea id='demandeCodeMessageResp' rows='2' placeholder='Message (optionnel)' style='width:100%;margin-bottom:7px;padding:7px 10px;border-radius:7px;border:1px solid #2563eb;font-size:1em;'></textarea>
          <button id='envoyerDemandeCodeEntrepriseBtnResp' style='background:linear-gradient(90deg,#2563eb 0%,#06b6d4 100%);color:#fff;border:none;border-radius:8px;padding:7px 18px;font-size:0.98em;font-weight:600;box-shadow:0 2px 8px #2563eb22;cursor:pointer;'>Envoyer la demande</button>
          <div id='demandeCodeEntrepriseMsgResp' style='margin-top:7px;font-size:0.98em;text-align:center;'></div>
        </div>
      `;
      codeOublieLink.style.display = "none";
      // Préremplir nom/email si dispo
      const user =
        window.currentUser || JSON.parse(localStorage.getItem("user")) || {};
      document.getElementById("demandeCodeNomResp").value = user.nom || "";
      document.getElementById("demandeCodeEmailResp").value = user.email || "";
      // Gestion envoi demande
      document.getElementById("envoyerDemandeCodeEntrepriseBtnResp").onclick =
        async function () {
          const nom = document
            .getElementById("demandeCodeNomResp")
            .value.trim();
          const email = document
            .getElementById("demandeCodeEmailResp")
            .value.trim();
          const message = document
            .getElementById("demandeCodeMessageResp")
            .value.trim();
          const msgDiv = document.getElementById(
            "demandeCodeEntrepriseMsgResp"
          );
          msgDiv.textContent = "";
          if (!nom || !email) {
            msgDiv.textContent = "Veuillez renseigner votre nom et email.";
            msgDiv.style.color = "#dc3545";
            return;
          }
          document.getElementById(
            "envoyerDemandeCodeEntrepriseBtnResp"
          ).disabled = true;
          try {
            const res = await fetch("/api/demande-code-entreprise", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nom,
                email,
                message,
                type: "responsable",
              }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
              msgDiv.textContent =
                "Demande envoyée ! Vous recevrez le code par email.";
              msgDiv.style.color = "#059669";
              setTimeout(() => {
                codeOublieFormContainer.style.display = "none";
              }, 2000);
            } else {
              msgDiv.textContent = data.message || "Erreur lors de l'envoi.";
              msgDiv.style.color = "#dc3545";
            }
          } catch (err) {
            msgDiv.textContent = "Erreur réseau ou serveur. Réessayez.";
            msgDiv.style.color = "#dc3545";
          }
          document.getElementById(
            "envoyerDemandeCodeEntrepriseBtnResp"
          ).disabled = false;
        };
    };
  }
  // Switch affichage entre inscription et connexion
  const formInscription = document.getElementById(
    "form-inscription-respacconier"
  );
  const formConnexion = document.getElementById("form-connexion-respacconier");
  const formCodeEntreprise = document.getElementById("form-code-entreprise");

  document.getElementById("to-login-respacconier").onclick = function () {
    formInscription.style.display = "none";
    formConnexion.style.display = "block";
    formCodeEntreprise.style.display = "none";
  };
  document.getElementById("to-register-respacconier").onclick = function () {
    formInscription.style.display = "block";
    formConnexion.style.display = "none";
    formCodeEntreprise.style.display = "none";
  };

  // Soumission inscription
  document
    .getElementById("registerFormRespAcconier")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const nom = document
        .getElementById("register-nom-respacconier")
        .value.trim();
      const email = document
        .getElementById("register-email-respacconier")
        .value.trim();
      // Le champ entreprise n’existe plus
      const password = document.getElementById(
        "register-password-respacconier"
      ).value;
      const errorDiv = document.getElementById("register-error-respacconier");
      const successDiv = document.getElementById(
        "register-success-respacconier"
      );
      errorDiv.textContent = "";
      successDiv.textContent = "";
      if (!nom || !email || !password) {
        errorDiv.textContent = "Veuillez remplir tous les champs.";
        return;
      }
      try {
        const res = await fetch("/api/respacconier/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom, email, password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          successDiv.textContent =
            "Inscription réussie. Vous pouvez vous connecter.";
          this.reset();
        } else {
          errorDiv.textContent =
            data.message || "Erreur lors de l'inscription.";
        }
      } catch (err) {
        errorDiv.textContent = "Erreur réseau ou serveur. Veuillez réessayer.";
      }
    });

  // Soumission connexion
  document
    .getElementById("loginFormRespAcconier")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document
        .getElementById("login-email-respacconier")
        .value.trim();
      const password = document.getElementById(
        "login-password-respacconier"
      ).value;
      const errorDiv = document.getElementById("login-error-respacconier");
      errorDiv.textContent = "";
      if (!email || !password) {
        errorDiv.textContent = "Veuillez remplir tous les champs.";
        return;
      }
      try {
        const res = await fetch("/api/respacconier/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          // Stocker dans une seule clé dédiée pour le responsable acconier
          localStorage.setItem(
            "respacconierUser",
            JSON.stringify({
              id: data.id || "",
              nom: data.nom || "",
              email: data.email || "",
              entreprise: data.entreprise || "",
            })
          );
          // NE JAMAIS ÉCRIRE DANS LA CLÉ 'user' OU AUTRE !
          formInscription.style.display = "none";
          formConnexion.style.display = "none";
          formCodeEntreprise.style.display = "block";
        } else {
          errorDiv.textContent = data.message || "Erreur lors de la connexion.";
        }
      } catch (err) {
        errorDiv.textContent = "Erreur réseau ou serveur. Veuillez réessayer.";
      }
    });

  // Soumission code entreprise (validation dynamique via API)
  document
    .getElementById("codeEntrepriseFormRespAcconier")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const code = document
        .getElementById("code-entreprise-respacconier")
        .value.trim();
      const errorDiv = document.getElementById("code-error-respacconier");
      errorDiv.textContent = "";
      if (!code) {
        errorDiv.textContent = "Veuillez entrer le code d'entreprise.";
        return;
      }
      // Validation dynamique via API
      try {
        const res = await fetch("/api/company-code");
        const data = await res.json();
        if (data.success && code === data.code) {
          // Redirection et rechargement pour garantir l'affichage de l'avatar
          window.location.href = "interfaceRespAconier.html";
          setTimeout(function () {
            window.location.reload();
          }, 300);
        } else {
          errorDiv.textContent = "Code invalide ou non reconnu.";
        }
      } catch (err) {
        errorDiv.textContent = "Erreur réseau ou serveur. Veuillez réessayer.";
      }
    });

  // --- WebSocket pour synchronisation temps réel du code entreprise ---
  let wsCodeEntreprise = null;
  function setupCompanyCodeWebSocket() {
    try {
      wsCodeEntreprise = new WebSocket(
        window.location.protocol === "https:"
          ? "wss://"
          : "ws://" + window.location.host
      );
      wsCodeEntreprise.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "company-code-updated") {
            alert(
              "Le code d'entreprise a été modifié par l'administrateur. Veuillez saisir le nouveau code."
            );
            const codeInput = document.getElementById(
              "code-entreprise-respacconier"
            );
            if (codeInput) codeInput.value = "";
            const codeForm = document.getElementById("form-code-entreprise");
            if (codeForm) codeForm.style.display = "block";
          }
        } catch (e) {}
      };
    } catch (e) {}
  }
  setupCompanyCodeWebSocket();
});
