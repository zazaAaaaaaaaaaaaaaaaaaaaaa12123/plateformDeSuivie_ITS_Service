// Script simple pour ajouter les colonnes JSON à la base de données
// Ce script utilise la même logique que votre serverITS.js

const { Pool } = require("pg");

// Configuration pour la base de données locale (modifiez si nécessaire)
const pool = new Pool({
  user: "postgres", // Remplacez par votre utilisateur PostgreSQL
  host: "localhost",
  database: "postgres", // Remplacez par le nom de votre base de données
  password: "password", // Remplacez par votre mot de passe
  port: 5432,
});

async function addColumnsIfNotExists() {
  const client = await pool.connect();

  try {
    console.log("🔍 Vérification et ajout des colonnes JSON...");

    // Méthode simple avec IF NOT EXISTS (PostgreSQL 9.6+)
    const queries = [
      "ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS container_numbers_list JSONB;",
      "ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS container_foot_types_map JSONB;",
    ];

    for (const query of queries) {
      try {
        await client.query(query);
        const columnName = query.includes("container_numbers_list")
          ? "container_numbers_list"
          : "container_foot_types_map";
        console.log(`✅ Colonne ${columnName} vérifiée/ajoutée`);
      } catch (error) {
        console.log(`❌ Erreur pour la colonne: ${error.message}`);
      }
    }

    // Vérification finale
    console.log("\n🧪 Test final des colonnes...");
    const testQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'deliveries' 
      AND column_name IN ('container_numbers_list', 'container_foot_types_map')
      ORDER BY column_name;
    `;

    const result = await client.query(testQuery);

    if (result.rows.length === 2) {
      console.log("🎉 Succès! Les deux colonnes JSON sont présentes:");
      result.rows.forEach((row) => {
        console.log(`   ✅ ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log("⚠️  Attention: Colonnes trouvées:", result.rows.length);
      result.rows.forEach((row) => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Pour tester en production, créez un second script avec les vraies variables
console.log(
  "📝 IMPORTANT: Si vous êtes en production, modifiez la configuration de la base de données ci-dessus"
);
console.log("🔧 Variables à modifier: user, host, database, password, port");
console.log("");

addColumnsIfNotExists()
  .then(() => {
    console.log("\n✨ Script terminé!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
