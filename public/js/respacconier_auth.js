// JS pour la gestion du formulaire Responsable Acconier (inscription, connexion, code entreprise)

document.addEventListener("DOMContentLoaded", function () {
  // Switch affichage entre inscription et connexion
  const formInscription = document.getElementById(
    "form-inscription-respacconier"
  );
  const formConnexion = document.getElementById("form-connexion-respacconier");

  document.getElementById("to-login-respacconier").onclick = function () {
    formInscription.style.display = "none";
    formConnexion.style.display = "block";
  };
  document.getElementById("to-register-respacconier").onclick = function () {
    formInscription.style.display = "block";
    formConnexion.style.display = "none";
  };

  // Soumission inscription
  document
    .getElementById("registerFormRespAcconier")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document
        .getElementById("register-nom-respacconier")
        .value.trim();
      const email = document
        .getElementById("register-email-respacconier")
        .value.trim();
      const password = document.getElementById(
        "register-password-respacconier"
      ).value;
      const errorDiv = document.getElementById("register-error-respacconier");
      const successDiv = document.getElementById(
        "register-success-respacconier"
      );
      errorDiv.textContent = "";
      successDiv.textContent = "";
      if (!name || !email || !password) {
        errorDiv.textContent = "Veuillez remplir tous les champs.";
        return;
      }
      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
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
        const res = await fetch("/api/login", {
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
              nom: data.name || "",
              email: data.email || "",
            })
          );
          // NE JAMAIS ÉCRIRE DANS LA CLÉ 'user' OU AUTRE !
          // Redirection directe vers le tableau de bord Acconier
          window.location.href =
            "https://plateformdesuivie-its-service-1cjx.onrender.com/html/interfaceRespAconier.html";
        } else {
          errorDiv.textContent = data.message || "Erreur lors de la connexion.";
        }
      } catch (err) {
        errorDiv.textContent = "Erreur réseau ou serveur. Veuillez réessayer.";
      }
    });
});
