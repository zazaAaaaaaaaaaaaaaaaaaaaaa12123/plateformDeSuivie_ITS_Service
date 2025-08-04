require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  ssl: { rejectUnauthorized: false },
});

async function checkAndAddColumns() {
  try {
    console.log("Vérification des colonnes JSON...");

    // Vérifier les colonnes existantes
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'livraison_conteneur' 
      AND column_name IN ('container_numbers_list', 'container_foot_types_map')
      ORDER BY column_name
    `);

    console.log("Colonnes JSON existantes:", result.rows);

    const existingColumns = result.rows.map((row) => row.column_name);

    // Ajouter container_numbers_list si elle n'existe pas
    if (!existingColumns.includes("container_numbers_list")) {
      console.log("Ajout de la colonne container_numbers_list...");
      await pool.query(`
        ALTER TABLE livraison_conteneur 
        ADD COLUMN container_numbers_list JSONB
      `);
      console.log("Colonne container_numbers_list ajoutée avec succès.");
    }

    // Ajouter container_foot_types_map si elle n'existe pas
    if (!existingColumns.includes("container_foot_types_map")) {
      console.log("Ajout de la colonne container_foot_types_map...");
      await pool.query(`
        ALTER TABLE livraison_conteneur 
        ADD COLUMN container_foot_types_map JSONB
      `);
      console.log("Colonne container_foot_types_map ajoutée avec succès.");
    }

    if (existingColumns.length === 2) {
      console.log("Toutes les colonnes JSON existent déjà.");
    }

    await pool.end();
    console.log("Opération terminée.");
  } catch (err) {
    console.error("Erreur:", err);
    process.exit(1);
  }
}

checkAndAddColumns();
