const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://its_service_ayru_user:vCjBNNtO24Bn2IkoE8pcv36qBOJHPqVA@dpg-d1v43gbe5dus739f0n7g-a.oregon-postgres.render.com/its_service_ayru",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkLivraisonTable() {
  const client = await pool.connect();

  try {
    console.log("🔍 Vérification de la table livraison_conteneur...");

    // Vérifier la structure de la table livraison_conteneur
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'livraison_conteneur'
      ORDER BY ordinal_position;
    `;

    const columns = await client.query(columnsQuery);

    console.log(
      `\n📋 Structure de la table livraison_conteneur (${columns.rows.length} colonnes) :`
    );
    columns.rows.forEach((row) => {
      console.log(
        `   - ${row.column_name} (${row.data_type}) ${
          row.is_nullable === "YES" ? "NULL" : "NOT NULL"
        }`
      );
    });

    // Vérifier si les colonnes JSON existent déjà
    const hasContainerNumbersList = columns.rows.some(
      (row) => row.column_name === "container_numbers_list"
    );
    const hasContainerFootTypesMap = columns.rows.some(
      (row) => row.column_name === "container_foot_types_map"
    );

    console.log("\n🔍 Colonnes JSON :");
    console.log(
      `   container_numbers_list: ${
        hasContainerNumbersList ? "✅ Existe" : "❌ Manquante"
      }`
    );
    console.log(
      `   container_foot_types_map: ${
        hasContainerFootTypesMap ? "✅ Existe" : "❌ Manquante"
      }`
    );

    // Compter les données
    const countQuery = await client.query(
      "SELECT COUNT(*) as total FROM livraison_conteneur;"
    );
    console.log(`\n📦 Nombre d'enregistrements: ${countQuery.rows[0].total}`);

    // Afficher un échantillon si il y a des données
    if (countQuery.rows[0].total > 0) {
      const sampleQuery = await client.query(
        "SELECT * FROM livraison_conteneur LIMIT 1;"
      );
      console.log("\n📄 Échantillon de données:");
      console.log(JSON.stringify(sampleQuery.rows[0], null, 2));
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkLivraisonTable()
  .then(() => {
    console.log("\n🎉 Vérification terminée !");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
