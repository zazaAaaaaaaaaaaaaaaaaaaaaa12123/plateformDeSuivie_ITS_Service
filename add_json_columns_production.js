// Script pour ajouter les colonnes JSON en PRODUCTION (Render)
// Ce script utilise les variables d'environnement de production

const { Pool } = require("pg");

// Configuration pour Render (utilise les variables d'environnement)
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function addColumnsProduction() {
  const client = await pool.connect();

  try {
    console.log("🚀 PRODUCTION: Vérification et ajout des colonnes JSON...");
    console.log("📊 Base de données:", process.env.PGDATABASE);
    console.log("🖥️  Host:", process.env.PGHOST);

    // Méthode sûre avec IF NOT EXISTS
    const queries = [
      {
        sql: "ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS container_numbers_list JSONB;",
        name: "container_numbers_list",
      },
      {
        sql: "ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS container_foot_types_map JSONB;",
        name: "container_foot_types_map",
      },
    ];

    for (const query of queries) {
      try {
        console.log(`📝 Ajout de la colonne ${query.name}...`);
        await client.query(query.sql);
        console.log(`✅ Colonne ${query.name} vérifiée/ajoutée avec succès`);
      } catch (error) {
        console.log(`❌ Erreur pour ${query.name}: ${error.message}`);
      }
    }

    // Vérification finale avec comptage des livraisons
    console.log("\n🧪 Vérification finale...");

    // 1. Vérifier que les colonnes existent
    const checkColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'deliveries' 
      AND column_name IN ('container_numbers_list', 'container_foot_types_map')
      ORDER BY column_name;
    `);

    console.log(`📋 Colonnes JSON trouvées: ${checkColumns.rows.length}/2`);
    checkColumns.rows.forEach((row) => {
      console.log(`   ✅ ${row.column_name} (${row.data_type})`);
    });

    // 2. Vérifier le nombre total de livraisons
    const countQuery = await client.query(
      "SELECT COUNT(*) as total FROM deliveries;"
    );
    console.log(`📦 Nombre total de livraisons: ${countQuery.rows[0].total}`);

    // 3. Test d'une requête avec les nouvelles colonnes
    const testQuery = await client.query(`
      SELECT id, container_number, container_numbers_list, container_foot_types_map 
      FROM deliveries 
      LIMIT 2;
    `);

    console.log(
      `🔬 Test de requête: ${testQuery.rows.length} lignes récupérées`
    );
    testQuery.rows.forEach((row, index) => {
      console.log(`   Ligne ${index + 1}:`);
      console.log(`     - ID: ${row.id}`);
      console.log(`     - container_number: ${row.container_number}`);
      console.log(
        `     - container_numbers_list: ${row.container_numbers_list || "NULL"}`
      );
      console.log(
        `     - container_foot_types_map: ${
          row.container_foot_types_map || "NULL"
        }`
      );
    });

    if (checkColumns.rows.length === 2) {
      console.log(
        "\n🎉 SUCCÈS! Toutes les colonnes JSON sont configurées correctement en production!"
      );
    } else {
      console.log(
        "\n⚠️  ATTENTION: Il manque des colonnes. Vérifiez les erreurs ci-dessus."
      );
    }
  } catch (error) {
    console.error("❌ Erreur en production:", error.message);
    console.error("Stack trace:", error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

addColumnsProduction()
  .then(() => {
    console.log("\n✨ Script de production terminé!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale en production:", error);
    process.exit(1);
  });
