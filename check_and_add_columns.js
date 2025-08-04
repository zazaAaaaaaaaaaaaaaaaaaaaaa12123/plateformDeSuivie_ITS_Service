const { Pool } = require("pg");

// Configuration de la base de données (URL externe Render)
const pool = new Pool({
  connectionString:
    "postgresql://its_service_ayru_user:vCjBNNtO24Bn2IkoE8pcv36qBOJHPqVA@dpg-d1v43gbe5dus739f0n7g-a.oregon-postgres.render.com/its_service_ayru",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkAndAddColumns() {
  const client = await pool.connect();

  try {
    console.log("🔍 Vérification des colonnes dans la table deliveries...");

    // Vérifier quelles colonnes existent
    const checkColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'deliveries' 
      AND column_name IN ('container_numbers_list', 'container_foot_types_map')
      ORDER BY column_name;
    `;

    const existingColumns = await client.query(checkColumnsQuery);

    console.log("\n📋 Colonnes JSON existantes:");
    if (existingColumns.rows.length === 0) {
      console.log("   ❌ Aucune colonne JSON trouvée");
    } else {
      existingColumns.rows.forEach((row) => {
        console.log(`   ✅ ${row.column_name} (${row.data_type})`);
      });
    }

    // Vérifier si container_numbers_list existe
    const hasContainerNumbersList = existingColumns.rows.some(
      (row) => row.column_name === "container_numbers_list"
    );

    // Vérifier si container_foot_types_map existe
    const hasContainerFootTypesMap = existingColumns.rows.some(
      (row) => row.column_name === "container_foot_types_map"
    );

    console.log("\n🔧 Actions à effectuer:");

    // Ajouter container_numbers_list si elle n'existe pas
    if (!hasContainerNumbersList) {
      console.log("   📝 Ajout de la colonne container_numbers_list...");
      await client.query(
        "ALTER TABLE deliveries ADD COLUMN container_numbers_list JSONB;"
      );
      console.log("   ✅ Colonne container_numbers_list ajoutée");
    } else {
      console.log("   ℹ️  Colonne container_numbers_list déjà présente");
    }

    // Ajouter container_foot_types_map si elle n'existe pas
    if (!hasContainerFootTypesMap) {
      console.log("   📝 Ajout de la colonne container_foot_types_map...");
      await client.query(
        "ALTER TABLE deliveries ADD COLUMN container_foot_types_map JSONB;"
      );
      console.log("   ✅ Colonne container_foot_types_map ajoutée");
    } else {
      console.log("   ℹ️  Colonne container_foot_types_map déjà présente");
    }

    // Vérification finale
    console.log("\n🎯 Vérification finale:");
    const finalCheck = await client.query(checkColumnsQuery);
    if (finalCheck.rows.length === 2) {
      console.log("   ✅ Toutes les colonnes JSON sont présentes!");

      // Test d'une requête pour voir si tout fonctionne
      console.log("\n🧪 Test de requête avec les nouvelles colonnes...");
      const testQuery = `
        SELECT id, container_number, container_numbers_list, container_foot_types_map 
        FROM deliveries 
        LIMIT 1;
      `;
      const testResult = await client.query(testQuery);
      console.log("   ✅ Requête test réussie!");

      if (testResult.rows.length > 0) {
        const row = testResult.rows[0];
        console.log(`   📄 Exemple de données:
          - ID: ${row.id}
          - container_number: ${row.container_number}
          - container_numbers_list: ${row.container_numbers_list || "NULL"}
          - container_foot_types_map: ${
            row.container_foot_types_map || "NULL"
          }`);
      }
    } else {
      console.log("   ❌ Problème: Toutes les colonnes ne sont pas présentes");
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le script
checkAndAddColumns()
  .then(() => {
    console.log("\n🎉 Script terminé avec succès!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
