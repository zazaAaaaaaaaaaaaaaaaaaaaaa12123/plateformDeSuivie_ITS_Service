const { Pool } = require("pg");

// Configuration de la base de données (URL externe Render)
const pool = new Pool({
  connectionString:
    "postgresql://its_service_ayru_user:vCjBNNtO24Bn2IkoE8pcv36qBOJHPqVA@dpg-d1v43gbe5dus739f0n7g-a.oregon-postgres.render.com/its_service_ayru",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkDatabase() {
  const client = await pool.connect();

  try {
    console.log("🔍 Vérification de la base de données de production...");

    // Lister toutes les tables existantes
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const tables = await client.query(tablesQuery);

    console.log(`\n📋 Tables trouvées (${tables.rows.length}) :`);
    if (tables.rows.length === 0) {
      console.log("   ❌ Aucune table trouvée - Base de données vide !");
    } else {
      tables.rows.forEach((row) => {
        console.log(`   ✅ ${row.table_name}`);
      });
    }

    // Vérifier si la table deliveries existe spécifiquement
    const deliveriesCheck = tables.rows.find(
      (row) => row.table_name === "deliveries"
    );

    if (deliveriesCheck) {
      console.log("\n✅ La table deliveries existe !");

      // Compter les livraisons
      const countQuery = await client.query(
        "SELECT COUNT(*) as total FROM deliveries;"
      );
      console.log(`📦 Nombre de livraisons: ${countQuery.rows[0].total}`);
    } else {
      console.log("\n❌ La table deliveries N'EXISTE PAS en production !");
      console.log(
        "🚨 Votre serveur de production doit être démarré au moins une fois"
      );
      console.log("   pour créer automatiquement les tables.");
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase()
  .then(() => {
    console.log("\n🎉 Vérification terminée !");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
