const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const pool = new Pool(
  process.env.DATABASE_URL 
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
        ssl: { rejectUnauthorized: false },
      }
);

async function createTables() {
  console.log('🏗️  Création des tables...');
  
  try {
    // Table des administrateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Table des livraisons
    await pool.query(`
      CREATE TABLE IF NOT EXISTS livraison_conteneur (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(100),
        delivery_date DATE,
        delivery_time TIME,
        client_name VARCHAR(100),
        client_phone VARCHAR(20),
        container_type_and_content TEXT,
        location VARCHAR(200),
        delivery_status VARCHAR(50) DEFAULT 'en_attente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table des utilisateurs (employés)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'employee',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table des sessions (si nécessaire)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tables créées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  }
}

async function seedData() {
  console.log('🌱 Insertion des données de base...');
  
  try {
    // Créer un administrateur par défaut
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO admin_users (username, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING;
    `, ['admin', 'admin@dossiv.ci', defaultPassword]);

    console.log('✅ Données de base insérées !');
    console.log('👤 Administrateur par défaut créé:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Changez ce mot de passe après le premier login !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error);
    throw error;
  }
}

async function testConnection() {
  console.log('🔌 Test de la connexion à la base de données...');
  
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connexion réussie !');
    console.log('🕒 Heure du serveur:', result.rows[0].current_time);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    throw error;
  }
}

async function runMigration() {
  console.log('🚀 Démarrage de la migration...');
  console.log('=====================================');
  
  try {
    await testConnection();
    await createTables();
    await seedData();
    
    console.log('=====================================');
    console.log('🎉 Migration terminée avec succès !');
  } catch (error) {
    console.error('💥 Échec de la migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  runMigration();
}

module.exports = {
  createTables,
  seedData,
  testConnection,
  runMigration
};