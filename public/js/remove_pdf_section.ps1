# Script pour supprimer la section PDF du fichier scriptRespLiv.js

$inputFile = "scriptRespLiv.js"
$backupFile = "scriptRespLiv_backup.js"

# Créer une sauvegarde
Copy-Item $inputFile $backupFile

# Lire tout le contenu du fichier
$content = Get-Content $inputFile -Raw

# Trouver le début de la section PDF (après les commentaires d'historique)
$startPattern = "// Création du bouton Générer PDF"
$endPattern = "doc\.save\(`"Etat_sorties_conteneurs\.pdf`"\);"

# Trouver les positions
$startIndex = $content.IndexOf($startPattern)
$endIndex = $content.IndexOf($endPattern)

if ($startIndex -ge 0 -and $endIndex -ge 0) {
    # Ajouter la longueur de la ligne de fin pour inclure toute la ligne
    $endIndex = $content.IndexOf("`n", $endIndex) + 1
    
    # Supprimer la section
    $beforeSection = $content.Substring(0, $startIndex)
    $afterSection = $content.Substring($endIndex)
    
    # Reconstruire le contenu
    $newContent = $beforeSection + $afterSection
    
    # Écrire le nouveau contenu
    Set-Content $inputFile $newContent -NoNewline
    
    Write-Host "Section PDF supprimée avec succès. Sauvegarde créée: $backupFile"
} else {
    Write-Host "Impossible de trouver les marqueurs de début ou de fin de la section PDF"
}
