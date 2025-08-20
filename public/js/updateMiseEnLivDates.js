// Fonction pour mettre à jour les dates d'un dossier dans la liste des mises en livraison
function updateDossierMiseEnLivDates(deliveryId, dateField, dateValue) {
  try {
    // Récupérer la liste actuelle des dossiers
    const dossiers = JSON.parse(
      localStorage.getItem("dossiersMisEnLiv") || "[]"
    );

    // Trouver le dossier à mettre à jour
    const index = dossiers.findIndex((d) => d.id === deliveryId);
    if (index === -1) {
      console.warn(
        `[SYNC] Dossier ${deliveryId} non trouvé dans la liste des mises en livraison`
      );
      return;
    }

    // Mettre à jour la date spécifiée
    if (dateValue) {
      // Convertir la date en ISO string
      dossiers[index][dateField] = new Date(dateValue).toISOString();
    } else {
      delete dossiers[index][dateField];
    }

    // Sauvegarder la liste mise à jour
    localStorage.setItem("dossiersMisEnLiv", JSON.stringify(dossiers));
    console.log(
      `[SYNC] Date ${dateField} mise à jour pour le dossier ${deliveryId}`
    );

    // Rafraîchir l'affichage si nécessaire
    if (typeof refreshMiseEnLivList === "function") {
      refreshMiseEnLivList();
    }
  } catch (error) {
    console.error("[SYNC] Erreur lors de la mise à jour des dates:", error);
  }
}
