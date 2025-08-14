const { Pool } = require("pg");
const fs = require("fs");

// === MODIFIEZ ICI POUR LA NOUVELLE BASE RESTAURÉE ===
const pool = new Pool({
  user: "its_service_ayru_user", // ex: 'postgres'
  host: "dpg-d2ehtpadbo4c738fav0g-a.oregon-postgres.render.com", // ex: 'db-xxxxxx.render.com'
  database: "its_service_ayru_fx8i", // ex: 'ITS_service-copy'
  password: "vCjBNNtO24Bn2IkoE8pcv36qBOJHPqVA",
  port: 5432, // ou le port donné par Render
  ssl: { rejectUnauthorized: false },
});
// ================================================

(async () => {
  try {
    // Récupère toutes les tables du schéma public
    const tablesRes = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
    );
    const tables = tablesRes.rows.map((r) => r.table_name);
    const exportData = {};

    for (const table of tables) {
      const dataRes = await pool.query(`SELECT * FROM ${table};`);
      exportData[table] = dataRes.rows;
      console.log(`Table exportée : ${table} (${dataRes.rows.length} lignes)`);
    }

    fs.writeFileSync(
      "export_bdd.json",
      JSON.stringify(exportData, null, 2),
      "utf8"
    );
    console.log("Export terminé ! Fichier : export_bdd.json");
    await pool.end();
  } catch (err) {
    console.error("Erreur lors de l'export :", err);
    await pool.end();
  }
})();
