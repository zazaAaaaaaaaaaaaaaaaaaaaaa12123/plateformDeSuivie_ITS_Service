// Fonction pour supprimer un dossier de la liste des mises en livraison
function supprimerDossierMiseEnLiv(dossier) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?")) {
    const dossiers = getDossiersMisEnLiv();
    const index = dossiers.findIndex(
      (d) =>
        d.container_number === dossier.container_number || d.id === dossier.id
    );

    if (index !== -1) {
      dossiers.splice(index, 1);
      saveDossiersMisEnLiv(dossiers);
      refreshMiseEnLivList();
      // Afficher une notification de succès
      alert("Le dossier a été supprimé avec succès.");
    }
  }
}
