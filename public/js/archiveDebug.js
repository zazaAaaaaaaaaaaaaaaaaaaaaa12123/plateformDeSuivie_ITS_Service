/**
 * Script de débogage et correction des archives
 * Utilise les nouvelles routes d'analyse et migration
 */

class ArchiveDebugger {
  constructor() {
    this.baseUrl = window.location.origin;
  }

  // Analyser l'état actuel des archives
  async analyzeCurrentState() {
    try {
      console.log("🔍 Analyse des archives en cours...");

      const response = await fetch(`${this.baseUrl}/api/archives/analyze`);
      const data = await response.json();

      if (data.success) {
        console.log("📊 Analyse terminée :", data);
        this.displayAnalysis(data);
        return data;
      } else {
        console.error("❌ Erreur d'analyse :", data.message);
        return null;
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'analyse :", error);
      return null;
    }
  }

  // Afficher l'analyse dans la console de manière lisible
  displayAnalysis(data) {
    console.log("\n=== ANALYSE DES ARCHIVES ===");

    console.log("\n📈 Répartition actuelle :");
    data.analysis.forEach((item) => {
      console.log(
        `  ${item.action_type} (${item.page_origine || "N/A"}) : ${
          item.count
        } dossiers`
      );
      if (item.sample_references && item.sample_references.length > 0) {
        console.log(`    Exemples : ${item.sample_references.join(", ")}`);
      }
    });

    if (data.problematic_entries.length > 0) {
      console.log("\n⚠️ Dossiers mal catégorisés :");
      data.problematic_entries.forEach((entry) => {
        console.log(
          `  ${entry.dossier_reference} : ${entry.action_type} → ${entry.suggested_category}`
        );
      });
    } else {
      console.log("\n✅ Aucun dossier mal catégorisé détecté");
    }

    console.log(
      `\n📝 Résumé : ${data.summary.total_problematic} dossiers nécessitent une migration`
    );
  }

  // Migrer les données mal catégorisées
  async migrateData() {
    try {
      console.log("🔄 Migration des données en cours...");

      const response = await fetch(
        `${this.baseUrl}/api/archives/migrate-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ Migration terminée :", data);
        this.displayMigrationResults(data.results);
        return data;
      } else {
        console.error("❌ Erreur de migration :", data.message);
        return null;
      }
    } catch (error) {
      console.error("❌ Erreur lors de la migration :", error);
      return null;
    }
  }

  // Afficher les résultats de migration
  displayMigrationResults(results) {
    console.log("\n=== RÉSULTATS DE MIGRATION ===");
    console.log(
      `📦 Ordres de livraison corrigés : ${results.ordres_livraison_corriges}`
    );
    console.log(
      `🚛 Mise en livraison corrigés : ${results.mise_en_livraison_corriges}`
    );

    if (results.orders_updated.length > 0) {
      console.log("\n📋 Ordres de livraison mis à jour :");
      results.orders_updated.forEach((order) => {
        console.log(`  - ${order.dossier_reference} (${order.action_type})`);
      });
    }

    if (results.mise_en_livraison_updated.length > 0) {
      console.log("\n🚛 Mise en livraison mis à jour :");
      results.mise_en_livraison_updated.forEach((delivery) => {
        console.log(
          `  - ${delivery.dossier_reference} (${delivery.action_type})`
        );
      });
    }
  }

  // Processus complet : analyser puis migrer
  async fullDiagnostic() {
    console.log("🚀 Démarrage du diagnostic complet des archives...");

    // Étape 1 : Analyser
    const analysis = await this.analyzeCurrentState();

    if (!analysis) {
      console.error("❌ Impossible de continuer sans analyse");
      return;
    }

    // Étape 2 : Migrer si nécessaire
    if (analysis.summary.needs_migration) {
      console.log("\n⚡ Migration nécessaire, démarrage...");
      const migration = await this.migrateData();

      if (migration) {
        console.log("\n🔄 Nouvelle analyse après migration...");
        await this.analyzeCurrentState();
      }
    } else {
      console.log(
        "\n✅ Aucune migration nécessaire, les données sont correctes"
      );
    }

    console.log("\n🎉 Diagnostic terminé !");
  }

  // Tester les filtres d'archives
  async testArchiveFilters() {
    console.log("🧪 Test des filtres d'archives...");

    const filters = [
      { name: "Ordres de Livraison", action_type: "ordre_livraison_etabli" },
      { name: "Mise en Livraison", action_type: "mise_en_livraison" },
      { name: "Tous", action_type: "" },
    ];

    for (const filter of filters) {
      try {
        const response = await fetch(
          `${this.baseUrl}/api/archives?action_type=${filter.action_type}&limit=5`
        );
        const data = await response.json();

        console.log(`\n📂 ${filter.name} (${filter.action_type || "tous"}) :`);
        console.log(`  Total : ${data.total || 0} dossiers`);

        if (data.archives && data.archives.length > 0) {
          data.archives.forEach((archive) => {
            console.log(
              `  - ${archive.dossier_reference} (${archive.action_type}) - ${
                archive.page_origine || "N/A"
              }`
            );
          });
        } else {
          console.log("  Aucun dossier trouvé");
        }
      } catch (error) {
        console.error(`❌ Erreur pour le filtre ${filter.name} :`, error);
      }
    }
  }
}

// Créer une instance globale pour utilisation facile
window.archiveDebugger = new ArchiveDebugger();

// Instructions d'utilisation
console.log(`
🛠️ DEBUGGER D'ARCHIVES DISPONIBLE

Commandes disponibles :
- archiveDebugger.analyzeCurrentState()     : Analyser l'état actuel
- archiveDebugger.migrateData()             : Migrer les données mal catégorisées  
- archiveDebugger.fullDiagnostic()          : Diagnostic complet (recommandé)
- archiveDebugger.testArchiveFilters()      : Tester les filtres d'affichage

Pour résoudre votre problème, exécutez :
archiveDebugger.fullDiagnostic()
`);
