const fs = require("fs");
const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const app = express();
// Redirection automatique vers le domaine -1cjx si on accède au domaine principal
app.use((req, res, next) => {
  if (
    req.hostname &&
    req.hostname.includes("plateformdesuivie-its-service.onrender.com") &&
    !req.hostname.includes("plateformdesuivie-its-service-1cjx.onrender.com")
  ) {
    // Redirige vers le domaine -1cjx, en gardant le chemin et la query
    return res.redirect(
      301,
      "https://plateformdesuivie-its-service-1cjx.onrender.com" +
        req.originalUrl
    );
  }
  next();
});

const cors = require("cors");
const path = require("path");
const WebSocket = require("ws");
// const bcrypt = require("bcryptjs"); // SUPPRIMÉ doublon, voir plus bas

// Middleware pour parser les requêtes JSON et URL-encodées
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors()); // Assurez-vous que CORS est appliqué avant vos routes

// ===============================
// ROUTE : PATCH date de livraison pour une livraison
// ===============================

app.patch("/deliveries/:id/date", async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ success: false, message: "Date manquante." });
  }
  try {
    const result = await pool.query(
      "UPDATE livraison_conteneur SET delivery_date = $1 WHERE id = $2 RETURNING id, delivery_date",
      [date, id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livraison non trouvée." });
    }
    res.json({ success: true, delivery: result.rows[0] });
  } catch (err) {
    console.error(
      "Erreur lors de la mise à jour de la date de livraison:",
      err
    );
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});
// CONFIGURATION DES FICHIERS STATIQUES (HTML, CSS, JS, images...)
// Sert tous les fichiers statiques du dossier public (y compris /html, /css, /js...)
app.use(express.static(path.join(__dirname, "public")));

// === DÉMARRAGE DU SERVEUR HTTP POUR RENDER ET LOCAL ===
// ======================================================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur HTTP Express démarré sur le port ${PORT} (0.0.0.0)`);
});

require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs"); // Import unique ici
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  ssl: { rejectUnauthorized: false }, // Ajout pour Render (connexion sécurisée)
});

// ===============================
// API ADMIN REGISTER & LOGIN - PRIORITÉ HAUTE
// ===============================

// Route pour l'inscription des administrateurs
app.post("/api/admin-register", async (req, res) => {
  const { name, email, password, adminCode } = req.body;

  console.log("[ADMIN-REGISTER][API] Tentative d'inscription admin:", {
    name,
    email,
  });

  if (!name || !email || !password || !adminCode) {
    return res.status(400).json({
      success: false,
      message: "Tous les champs sont requis.",
    });
  }

  // Vérifier le code administrateur
  const ADMIN_CODE = "DOSSIVCI-0767039921";
  // Nettoyer le code reçu (supprimer espaces en début/fin)
  const cleanAdminCode = adminCode ? adminCode.trim() : "";

  if (cleanAdminCode !== ADMIN_CODE) {
    console.log("[ADMIN-REGISTER][ERROR] Code administrateur incorrect!");
    return res.status(401).json({
      success: false,
      message: "Code administrateur incorrect.",
    });
  }

  // Vérifier la force du mot de passe
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    });
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      // Si c'est déjà un admin, on refuse
      if (user.role === "admin") {
        console.log(
          "[ADMIN-REGISTER][INFO] Utilisateur déjà administrateur:",
          email
        );
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà enregistré comme administrateur.",
        });
      }

      // Si c'est un utilisateur normal, on le promeut au rôle d'admin
      console.log(
        "[ADMIN-REGISTER][INFO] Promotion utilisateur existant vers admin:",
        email
      );

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mettre à jour l'utilisateur existant (nom, mot de passe et rôle)
      const result = await pool.query(
        `UPDATE users SET name = $1, password = $2, role = 'admin' 
         WHERE email = $3 RETURNING id, name, email, role`,
        [name, hashedPassword, email]
      );

      console.log(
        "[ADMIN-REGISTER][API] Utilisateur promu admin avec succès:",
        result.rows[0]
      );

      return res.status(200).json({
        success: true,
        message:
          "Compte existant mis à jour et promu administrateur avec succès.",
        admin: result.rows[0],
      });
    }

    // Si l'utilisateur n'existe pas, créer un nouveau compte admin
    console.log("[ADMIN-REGISTER][INFO] Création nouveau compte admin:", email);

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'administrateur
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, created_at) 
       VALUES ($1, $2, $3, 'admin', CURRENT_TIMESTAMP) RETURNING id, name, email, role`,
      [name, email, hashedPassword]
    );

    console.log(
      "[ADMIN-REGISTER][API] Nouveau compte admin créé avec succès:",
      result.rows[0]
    );

    res.status(201).json({
      success: true,
      message: "Nouveau compte administrateur créé avec succès.",
      admin: result.rows[0],
    });
  } catch (err) {
    console.error(
      "[ADMIN-REGISTER][API] Erreur lors de la création du compte admin:",
      err
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du compte.",
    });
  }
});

// API admin-login
app.post("/api/admin-login", async (req, res) => {
  const { email, password } = req.body;

  console.log("[ADMIN-LOGIN][API] Tentative de connexion admin:", { email });

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email et mot de passe requis.",
    });
  }

  try {
    // Rechercher l'admin
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role = 'admin'",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Aucun administrateur trouvé avec cet email.",
      });
    }

    const admin = result.rows[0];

    // Vérifier le mot de passe
    const passwordValid = await bcrypt.compare(password, admin.password);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe incorrect.",
      });
    }

    console.log("[ADMIN-LOGIN][API] Connexion admin réussie:", admin.email);

    res.json({
      success: true,
      message: "Connexion réussie.",
      isAdmin: true,
      email: admin.email,
      name: admin.name,
      id: admin.id,
    });
  } catch (err) {
    console.error("[ADMIN-LOGIN][API] Erreur lors de la connexion:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion.",
    });
  }
});

// === AUTO-CRÉATION DES COLONNES JSON AU DÉMARRAGE ===
async function initializeJsonColumns() {
  try {
    console.log("🔧 Vérification/Création des colonnes JSON...");

    // Ajouter les colonnes JSON si elles n'existent pas
    await pool.query(`
      ALTER TABLE livraison_conteneur 
      ADD COLUMN IF NOT EXISTS container_numbers_list JSONB;
    `);

    await pool.query(`
      ALTER TABLE livraison_conteneur 
      ADD COLUMN IF NOT EXISTS container_foot_types_map JSONB;
    `);

    console.log("✅ Colonnes JSON vérifiées/créées avec succès !");
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation des colonnes JSON :",
      error.message
    );
  }
}

// Initialiser les colonnes au démarrage
initializeJsonColumns();
// --- WebSocket Server pour notifications temps réel ---
const wss = new WebSocket.Server({ server });
let wsClients = [];
wss.on("connection", (ws) => {
  wsClients.push(ws);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      // Si un client envoie une mise à jour d'observation, on la diffuse à tous les autres
      if (data.type === "observation_update") {
        broadcastObservationUpdate(data.deliveryId, data.observation);
      }
    } catch (e) {
      // Ignore les messages non JSON
    }
  });

  ws.on("close", () => {
    wsClients = wsClients.filter((c) => c !== ws);
  });
});

// Broadcast WebSocket pour mise à jour de l'observation
function broadcastObservationUpdate(deliveryId, observation) {
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "observation_update",
          deliveryId,
          observation,
        })
      );
    }
  });
}

// ===============================
// ROUTE : PATCH statut BL (bl_statuses) pour une livraison
// ===============================

// ===============================
// ROUTE : PATCH nom d'agent (employee_name) pour une livraison
// ===============================

app.patch("/deliveries/:id/agent", async (req, res) => {
  const { id } = req.params;
  const { employee_name } = req.body;
  if (!employee_name) {
    return res
      .status(400)
      .json({ success: false, message: "Nom d'agent manquant." });
  }
  try {
    const result = await pool.query(
      "UPDATE livraison_conteneur SET employee_name = $1 WHERE id = $2 RETURNING id, employee_name",
      [employee_name, id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livraison non trouvée." });
    }
    res.json({ success: true, delivery: result.rows[0] });
  } catch (err) {
    console.error("Erreur lors de la mise à jour du nom d'agent:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});
app.patch("/deliveries/:id/observation", async (req, res) => {
  const { id } = req.params;
  const { observation } = req.body;

  try {
    const result = await pool.query(
      "UPDATE livraison_conteneur SET observation_acconier = $1 WHERE id = $2 RETURNING id, observation_acconier",
      [observation, id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livraison non trouvée." });
    }

    // Diffuser la mise à jour via WebSocket
    broadcastObservationUpdate(id, observation);

    res.json({ success: true, delivery: result.rows[0] });
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'observation:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// Route pour récupérer les observations d'un utilisateur spécifique (mode admin)
app.get("/api/user-observations", async (req, res) => {
  const { user, userId } = req.query;

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Paramètre 'user' requis",
    });
  }

  try {
    console.log(
      `📝 [API] Recherche des observations pour l'utilisateur: ${user}`
    );

    // Recherche plus exhaustive dans tous les champs possibles
    let query;
    const userPattern = `%${user}%`;
    let params = [userPattern];
    if (userId) {
      query = `
        SELECT 
          id as delivery_id,
          observation_acconier as observation,
          employee_name,
          client_name,
          delivery_date,
          created_at
        FROM livraison_conteneur 
        WHERE 
          (observation_acconier IS NOT NULL AND observation_acconier != '' AND observation_acconier != '-') 
          AND (
            LOWER(employee_name) LIKE LOWER($1) OR
              LOWER(observation_acconier) LIKE LOWER($1) OR
              LOWER(observation_acconier) LIKE LOWER($1) OR
            LOWER(created_by) LIKE LOWER($1) OR
            LOWER(nom_agent_visiteur) LIKE LOWER($1) OR
            LOWER(employee_name) LIKE LOWER($2) OR
              LOWER(observation_acconier) LIKE LOWER($2) OR
              LOWER(observation_acconier) LIKE LOWER($2) OR
            LOWER(created_by) LIKE LOWER($2)
          )
        ORDER BY created_at DESC
        LIMIT 100;
      `;
      params.push(`%${userId}%`);
    } else {
      query = `
        SELECT 
          id as delivery_id,
          observation_acconier as observation,
          employee_name,
          client_name,
          delivery_date,
          created_at
        FROM livraison_conteneur 
        WHERE 
          (observation_acconier IS NOT NULL AND observation_acconier != '' AND observation_acconier != '-') 
          AND (
            LOWER(employee_name) LIKE LOWER($1) OR
              LOWER(observation_acconier) LIKE LOWER($1) OR
              LOWER(observation_acconier) LIKE LOWER($1) OR
            LOWER(created_by) LIKE LOWER($1) OR
            LOWER(nom_agent_visiteur) LIKE LOWER($1)
          )
        ORDER BY created_at DESC
        LIMIT 100;
      `;
    }
    const result = await pool.query(query, params);

    console.log(
      `📝 [API] ${result.rows.length} observations trouvées pour ${user}`
    );

    // Ajouter aussi une recherche danshjv les livraisons récemment modifiées par cet utilisateur
    let recentQuery;
    let recentParams = [userPattern];
    if (userId) {
      recentQuery = `
        SELECT 
          id as delivery_id,
          observation_acconier as observation,
          employee_name,
          client_name,
          delivery_date,
          created_at
        FROM livraison_conteneur 
        WHERE 
          (
            LOWER(employee_name) LIKE LOWER($1) OR
              LOWER(observation_acconier) LIKE LOWER($1) OR
              LOWER(observation_acconier) LIKE LOWER($1) OR
            LOWER(created_by) LIKE LOWER($1) OR
            LOWER(nom_agent_visiteur) LIKE LOWER($1) OR
            LOWER(employee_name) LIKE LOWER($2) OR
              LOWER(observation_acconier) LIKE LOWER($2) OR
              LOWER(observation_acconier) LIKE LOWER($2) OR
            LOWER(created_by) LIKE LOWER($2)
          )
          AND created_at >= NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT 50;
      `;
      recentParams.push(`%${userId}%`);
    } else {
      recentQuery = `
        SELECT 
          id as delivery_id,
          observation_acconier as observation,
          employee_name,
          client_name,
          delivery_date,
          created_at
        FROM livraison_conteneur 
        WHERE 
          (
            LOWER(employee_name) LIKE LOWER($1) OR
              LOWER(observation_acconier) LIKE LOWER($1) OR
              LOWER(observation_acconier) LIKE LOWER($1) OR
            LOWER(created_by) LIKE LOWER($1) OR
            LOWER(nom_agent_visiteur) LIKE LOWER($1)
          )
          AND created_at >= NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT 50;
      `;
    }
    const recentResult = await pool.query(recentQuery, recentParams);

    // Combiner les résultats et supprimer les doublons
    const allObservations = [...result.rows];
    recentResult.rows.forEach((row) => {
      if (!allObservations.find((obs) => obs.delivery_id === row.delivery_id)) {
        allObservations.push(row);
      }
    });

    console.log(
      `📝 [API] Total après fusion: ${allObservations.length} observations`
    );

    res.json({
      success: true,
      observations: allObservations,
      user: user,
      count: allObservations.length,
    });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des observations utilisateur:",
      err
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des observations.",
      error: err.message,
    });
  }
});

// Route pour récupérer les données de livraison d'un utilisateur spécifique (mode admin)
app.get("/api/user-delivery-data", async (req, res) => {
  const { user, userId } = req.query;

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Paramètre 'user' requis",
    });
  }

  try {
    console.log(
      `📝 [API] Recherche des données de livraison pour l'utilisateur: ${user}`
    );

    // Recherche exhaustive dans tous les champs de livraison
    const query = `
      SELECT 
        id as delivery_id,
        nom_agent_visiteur,
        transporter,
        inspecteur,
        agent_en_douanes,
        driver_name,
        driver_phone,
        delivery_date,
        delivery_notes,
        observation_acconier,
        employee_name,
        client_name,
        created_at
      FROM livraison_conteneur 
      WHERE 
        delivery_status_acconier = 'mise_en_livraison_acconier'
        AND (
          LOWER(employee_name) LIKE LOWER($1) OR
          LOWER(responsible_livreur) LIKE LOWER($1) OR
          LOWER(resp_livreur) LIKE LOWER($1) OR
          LOWER(created_by) LIKE LOWER($1) OR
          LOWER(nom_agent_visiteur) LIKE LOWER($1) OR
          LOWER(driver_name) LIKE LOWER($1) OR
          LOWER(transporter) LIKE LOWER($1) OR
          LOWER(inspecteur) LIKE LOWER($1) OR
          LOWER(agent_en_douanes) LIKE LOWER($1) OR
          ($2 IS NOT NULL AND (
            LOWER(employee_name) LIKE LOWER($2) OR
            LOWER(responsible_livreur) LIKE LOWER($2) OR
            LOWER(resp_livreur) LIKE LOWER($2) OR
            LOWER(created_by) LIKE LOWER($2) OR
            LOWER(nom_agent_visiteur) LIKE LOWER($2) OR
            LOWER(driver_name) LIKE LOWER($2)
          ))
        )
        AND (
          (nom_agent_visiteur IS NOT NULL AND nom_agent_visiteur != '' AND nom_agent_visiteur != '-') OR
          (transporter IS NOT NULL AND transporter != '' AND transporter != '-') OR
          (inspecteur IS NOT NULL AND inspecteur != '' AND inspecteur != '-') OR
          (agent_en_douanes IS NOT NULL AND agent_en_douanes != '' AND agent_en_douanes != '-') OR
          (driver_name IS NOT NULL AND driver_name != '' AND driver_name != '-') OR
          (driver_phone IS NOT NULL AND driver_phone != '' AND driver_phone != '-') OR
          (delivery_notes IS NOT NULL AND delivery_notes != '' AND delivery_notes != '-') OR
          (observation_acconier IS NOT NULL AND observation_acconier != '' AND observation_acconier != '-')
        )
      ORDER BY created_at DESC
      LIMIT 100;
    `;

    const userPattern = `%${user}%`;
    const userIdPattern = userId ? `%${userId}%` : null;

    const result = await pool.query(query, [userPattern, userIdPattern]);

    console.log(
      `📝 [API] ${result.rows.length} données de livraison trouvées pour ${user}`
    );

    // Transformer les résultats en format de données détaillées
    const deliveryData = [];

    result.rows.forEach((row) => {
      const fields = [
        {
          name: "nom_agent_visiteur",
          value: row.nom_agent_visiteur,
          label: "Agent Visiteur",
        },
        { name: "transporter", value: row.transporter, label: "Transporteur" },
        { name: "inspecteur", value: row.inspecteur, label: "Inspecteur" },
        {
          name: "agent_en_douanes",
          value: row.agent_en_douanes,
          label: "Agent en Douanes",
        },
        { name: "driver_name", value: row.driver_name, label: "Chauffeur" },
        {
          name: "driver_phone",
          value: row.driver_phone,
          label: "Tel Chauffeur",
        },
        {
          name: "delivery_date",
          value: row.delivery_date,
          label: "Date Livraison",
        },
        {
          name: "delivery_notes",
          value: row.delivery_notes,
          label: "Observations",
        },
        {
          name: "observation_acconier",
          value: row.observation_acconier,
          label: "Observation Acconier",
        },
      ];

      fields.forEach((field) => {
        if (
          field.value &&
          field.value.toString().trim() !== "" &&
          field.value !== "-"
        ) {
          deliveryData.push({
            delivery_id: row.delivery_id,
            field_name: field.name,
            field_value: field.value,
            field_label: field.label,
            client_name: row.client_name,
            employee_name: row.employee_name,
            created_at: row.created_at,
          });
        }
      });
    });

    console.log(
      `📝 [API] Total de données de livraison formatées: ${deliveryData.length}`
    );

    res.json({
      success: true,
      deliveryData: deliveryData,
      user: user,
      count: deliveryData.length,
    });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des données de livraison utilisateur:",
      err
    );
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des données de livraison.",
      error: err.message,
    });
  }
});

// ===============================
// ROUTES API POUR LA SYNCHRONISATION RESPLIVRAISON ↔ SUIVIE
// ===============================

// ROUTE : Sauvegarde des données modifiées depuis RespLiv
app.post("/api/sync-resplivraison", async (req, res) => {
  const { deliveryId, fieldId, value, timestamp } = req.body || {};

  if (!deliveryId || !fieldId || value === undefined) {
    return res.status(400).json({
      success: false,
      message: "Paramètres manquants: deliveryId, fieldId, value requis",
    });
  }

  // Correspondance des champs RespLiv → Base de données
  const fieldMapping = {
    visitor_agent_name: "nom_agent_visiteur",
    transporter: "transporter",
    inspector: "inspecteur",
    customs_agent: "agent_en_douanes",
    driver: "driver_name",
    driver_phone: "driver_phone",
    delivery_date: "delivery_date",
    observation: "delivery_notes",
  };

  const dbFieldName = fieldMapping[fieldId];
  if (!dbFieldName) {
    return res.status(400).json({
      success: false,
      message: `Champ non supporté: ${fieldId}`,
    });
  }

  try {
    // Mise à jour dans la base de données
    let updateQuery, updateValues;

    if (dbFieldName === "delivery_date") {
      // Traitement spécial pour les dates
      const formattedDate = formatDateForDB(value);
      updateQuery = `UPDATE livraison_conteneur SET ${dbFieldName} = $1 WHERE id = $2 RETURNING id, ${dbFieldName}`;
      updateValues = [formattedDate, deliveryId];
    } else {
      // Traitement standard pour les autres champs
      updateQuery = `UPDATE livraison_conteneur SET ${dbFieldName} = $1 WHERE id = $2 RETURNING id, ${dbFieldName}`;
      updateValues = [value, deliveryId];
    }

    const result = await pool.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Livraison non trouvée",
      });
    }

    // Diffusion WebSocket pour mise à jour temps réel
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "resplivraison_sync_update",
            deliveryId,
            fieldId,
            dbFieldName,
            value,
            timestamp: timestamp || Date.now(),
          })
        );
      }
    });

    res.json({
      success: true,
      message: "Données synchronisées avec succès",
      updated: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur synchronisation RespLivraison:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la synchronisation",
    });
  }
});

// ROUTE : Récupération des données synchronisées pour Suivie
app.get("/api/sync-resplivraison/:deliveryId", async (req, res) => {
  const { deliveryId } = req.params;

  if (!deliveryId) {
    return res.status(400).json({
      success: false,
      message: "ID de livraison requis",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, nom_agent_visiteur, transporter, inspecteur, agent_en_douanes, 
              driver_name, driver_phone, delivery_date, delivery_notes 
       FROM livraison_conteneur 
       WHERE id = $1`,
      [deliveryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Livraison non trouvée",
      });
    }

    const delivery = result.rows[0];

    // Formatage de la réponse avec correspondance inverse
    const syncData = {
      nom_agent_visiteur: delivery.nom_agent_visiteur,
      transporter: delivery.transporter,
      inspecteur: delivery.inspecteur,
      agent_en_douanes: delivery.agent_en_douanes,
      driver_name: delivery.driver_name,
      driver_phone: delivery.driver_phone,
      delivery_date: delivery.delivery_date,
      delivery_notes: delivery.delivery_notes,
    };

    res.json({
      success: true,
      deliveryId,
      syncData,
    });
  } catch (err) {
    console.error("Erreur récupération données synchronisées:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération",
    });
  }
});

// ROUTE : Récupération complète des détails d'une livraison
app.post("/api/get-delivery-details", async (req, res) => {
  const { delivery_id } = req.body;

  if (!delivery_id) {
    return res.status(400).json({
      success: false,
      message: "ID de livraison requis",
    });
  }

  try {
    console.log(
      `[DETAIL API] Récupération des détails pour delivery_id: ${delivery_id}`
    );

    const result = await pool.query(
      `SELECT id, dossier_number, container_number, bl_number, client_name, client_phone,
              circuit, shipping_company, nom_agent_visiteur, transporter, inspecteur, 
              agent_en_douanes, driver_name, driver_phone, delivery_date, delivery_notes,
              observation_acconier, employee_name, container_foot_type, weight, ship_name,
              container_type_and_content, created_at, declaration_number, lieu, transporter_mode
       FROM livraison_conteneur 
       WHERE id = $1`,
      [delivery_id]
    );

    if (result.rows.length === 0) {
      console.log(
        `[DETAIL API] Aucune livraison trouvée pour ID: ${delivery_id}`
      );
      return res.status(404).json({
        success: false,
        message: "Livraison non trouvée",
      });
    }

    const delivery = result.rows[0];
    console.log(`[DETAIL API] Données trouvées:`, {
      id: delivery.id,
      nom_agent_visiteur: delivery.nom_agent_visiteur,
      dossier_number: delivery.dossier_number,
      container_number: delivery.container_number,
    });

    res.json({
      success: true,
      delivery: delivery,
    });
  } catch (err) {
    console.error("Erreur récupération détails livraison:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération",
    });
  }
});

// ROUTE : Mise à jour en lot des champs synchronisés
app.put("/api/sync-resplivraison/batch", async (req, res) => {
  const { updates } = req.body || {};

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Liste de mises à jour requise",
    });
  }

  const fieldMapping = {
    visitor_agent_name: "nom_agent_visiteur",
    transporter: "transporter",
    inspector: "inspecteur",
    customs_agent: "agent_en_douanes",
    driver: "driver_name",
    driver_phone: "driver_phone",
    delivery_date: "delivery_date",
    observation: "delivery_notes",
  };

  try {
    const results = [];

    for (const update of updates) {
      const { deliveryId, fieldId, value } = update;
      const dbFieldName = fieldMapping[fieldId];

      if (!dbFieldName || !deliveryId) continue;

      let updateQuery, updateValues;

      if (dbFieldName === "delivery_date") {
        const formattedDate = formatDateForDB(value);
        updateQuery = `UPDATE livraison_conteneur SET ${dbFieldName} = $1 WHERE id = $2 RETURNING id`;
        updateValues = [formattedDate, deliveryId];
      } else {
        updateQuery = `UPDATE livraison_conteneur SET ${dbFieldName} = $1 WHERE id = $2 RETURNING id`;
        updateValues = [value, deliveryId];
      }

      const result = await pool.query(updateQuery, updateValues);
      if (result.rows.length > 0) {
        results.push({ deliveryId, fieldId, success: true });
      }
    }

    // Diffusion WebSocket globale
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "resplivraison_batch_sync",
            updates: results,
            timestamp: Date.now(),
          })
        );
      }
    });

    res.json({
      success: true,
      message: `${results.length} mises à jour effectuées`,
      results,
    });
  } catch (err) {
    console.error("Erreur synchronisation en lot:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la synchronisation en lot",
    });
  }
});

// ===============================
// TABLE POUR RESPONSABLE DE LIVRAISON PERSISTANT
// ===============================
const createDeliveryResponsibleTable = `
  CREATE TABLE IF NOT EXISTS delivery_responsible (
    id SERIAL PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

async function ensureDeliveryResponsibleTable() {
  try {
    await pool.query(createDeliveryResponsibleTable);
    // Si aucune ligne, on en crée une par défaut
    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM delivery_responsible;"
    );
    if (rows[0].count === "0") {
      await pool.query(
        "INSERT INTO delivery_responsible (value) VALUES ($1);",
        [""]
      );
    }
  } catch (err) {
    console.error("Erreur création table delivery_responsible:", err);
  }
}
ensureDeliveryResponsibleTable();

// ===============================
// ROUTE : GET valeur responsable de livraison persistée
// ===============================
app.get("/delivery-responsible", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM delivery_responsible ORDER BY updated_at DESC LIMIT 1;"
    );
    res.json({ success: true, value: rows[0] ? rows[0].value : "" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
});

// ===============================
// ROUTE : POST maj responsable de livraison persistée
// ===============================
app.post("/delivery-responsible", async (req, res) => {
  const { value } = req.body || {};
  if (typeof value !== "string") {
    return res.status(400).json({ success: false, message: "Valeur invalide" });
  }
  try {
    // On update la dernière ligne (ou insert si vide)
    const { rowCount } = await pool.query(
      "UPDATE delivery_responsible SET value = $1, updated_at = NOW() WHERE id = (SELECT id FROM delivery_responsible ORDER BY updated_at DESC LIMIT 1);",
      [value]
    );
    if (rowCount === 0) {
      await pool.query(
        "INSERT INTO delivery_responsible (value) VALUES ($1);",
        [value]
      );
    }
    // Appel du broadcast WebSocket si la valeur correspond à une mise en livraison
    if (
      value &&
      (value === "mise_en_livraison_acconier" || value === "Mise en livraison")
    ) {
      // Ici, il faut passer l'identifiant du dossier concerné
      // Si la requête contient un id, on l'utilise, sinon à adapter selon le contexte
      const dossierId = req.body.dossierId || req.body.id || null;
      if (dossierId) {
        broadcastMiseEnLivraison(dossierId);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
});

function broadcastNouvelleDemandeCodeEntreprise() {
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "nouvelle-demande-code-entreprise" }));
    }
  });
}

// Broadcast WebSocket : notification de mise en livraison instantanée
function broadcastMiseEnLivraison(dossierId) {
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "delivery_update_alert",
          status: "mise_en_livraison_acconier",
          deliveryId: dossierId,
        })
      );
    }
  });
}

// Nouvelle fonction : Broadcast pour synchronisation des compteurs de cartes
function broadcastCardCounterUpdate(type, dossierNumber, action, message) {
  const payload = JSON.stringify({
    type: type,
    dossierNumber: dossierNumber,
    action: action,
    message: message,
    forceCounterUpdate: true,
    timestamp: Date.now(),
  });

  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });

  console.log(
    `[CARD SYNC] 📊 Broadcast: ${type} - ${action} pour dossier ${dossierNumber}`
  );
}

// ===============================
// ===============================
// ROUTE : Notification dossier en retard (envoi email)
// ===============================
app.post("/notify-late-dossier", async (req, res) => {
  const { dossierNumber, agentEmail, agentName } = req.body || {};
  if (!dossierNumber || !agentEmail) {
    return res.status(400).json({
      success: false,
      message:
        "Données manquantes pour l'envoi du rappel (email ou numéro dossier).",
    });
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: agentEmail,
      subject: `Rappel de dossier en retard - Dossier N°${dossierNumber}`,
      text: `Bonjour ${
        agentName || ""
      },\n\nLe dossier N°${dossierNumber} que vous avez traité a dépassé le délai de 2 jours.\nMerci de le régler rapidement pour éviter tout souci.`,
      html: `<p>Bonjour <b>${
        agentName || ""
      }</b>,</p><p style='color:#b91c1c;font-weight:bold;'>Le dossier <b>N°${dossierNumber}</b> que vous avez traité a <span style='color:#dc2626;'>dépassé le délai de 2 jours</span>.</p><p>Merci de le régler rapidement pour éviter tout souci.</p>`,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "Rappel envoyé par email." });
  } catch (err) {
    console.error("[NOTIFY LATE DOSSIER] Erreur envoi email:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erreur lors de l'envoi de l'email." });
  }
});
// ===============================
// TABLE company_code (stocke le code de l'entreprise)
// ===============================
const createCompanyCodeTable = `
  CREATE TABLE IF NOT EXISTS company_code (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

async function ensureCompanyCodeTable() {
  try {
    await pool.query(createCompanyCodeTable);
    // Si aucun code n'existe, insère la valeur par défaut (ex: ITS2010)
    const res = await pool.query("SELECT * FROM company_code LIMIT 1");
    if (res.rows.length === 0) {
      await pool.query("INSERT INTO company_code (code) VALUES ($1)", [
        "ITS2010",
      ]);
      console.log("Code entreprise initialisé à 'ITS2010'.");
    }
    console.log("Table 'company_code' vérifiée/créée.");
  } catch (err) {
    console.error("Erreur création table company_code:", err);
  }
}
ensureCompanyCodeTable();

// ===============================
// ROUTE : Récupérer le code entreprise (GET)
// ===============================
app.get("/api/company-code", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT code FROM company_code ORDER BY updated_at DESC LIMIT 1"
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Code entreprise non trouvé." });
    }
    return res.json({ success: true, code: result.rows[0].code });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ===============================
// ROUTE : Modifier le code entreprise (PUT)
// ===============================
app.put("/api/company-code", async (req, res) => {
  const { code } = req.body || {};
  if (!code || typeof code !== "string" || code.trim().length < 3) {
    return res.status(400).json({ success: false, message: "Code invalide." });
  }
  try {
    const newCode = code.trim();
    await pool.query(
      "UPDATE company_code SET code = $1, updated_at = NOW() WHERE id = (SELECT id FROM company_code ORDER BY updated_at DESC LIMIT 1)",
      [newCode]
    );

    // Notifier tous les clients WebSocket du changement de code
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({ type: "company-code-updated", code: newCode })
        );
      }
    });
    return res.json({ success: true, message: "Code entreprise modifié." });
    // (La route / doit être définie à la racine du fichier, pas ici)
  } catch (err) {
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ===============================
// ROUTE : Envoi du code de l'entreprise par email à partir d'une demande (utilise la valeur dynamique)
// ===============================
app.post("/api/envoyer-code-securite", async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: "Email requis." });
  }
  try {
    // On cherche la demande la plus récente pour cet email qui n'est pas déjà envoyée
    const demandeRes = await pool.query(
      "SELECT * FROM demande_code_entreprise WHERE email = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
      [email]
    );
    if (demandeRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucune demande trouvée pour cet email.",
      });
    }
    // Récupère le code entreprise dynamique
    const codeRes = await pool.query(
      "SELECT code FROM company_code ORDER BY updated_at DESC LIMIT 1"
    );
    const codeEntreprise =
      codeRes.rows.length > 0 ? codeRes.rows[0].code : "ITS2010";
    const nom = demandeRes.rows[0].nom || "utilisateur";
    // Envoi de l'email
    const mailSent = await sendMail({
      to: email,
      subject: "Votre code d'entreprise - ITS Service",
      text: `Bonjour ${nom},\n\nVoici votre code d'entreprise : ${codeEntreprise}\n\nMerci de l'utiliser pour accéder à la plateforme.`,
      html: `<p>Bonjour <b>${nom}</b>,</p><p>Voici votre <b>code d'entreprise</b> : <span style='font-size:1.2em;font-weight:700;color:#2563eb;'>${codeEntreprise}</span></p><p>Merci de l'utiliser pour accéder à la plateforme.</p>`,
    });
    if (!mailSent) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de l'email.",
      });
    }
    // Met à jour le statut de la demande à 'envoye'
    await pool.query(
      "UPDATE demande_code_entreprise SET status = 'envoye' WHERE id = $1",
      [demandeRes.rows[0].id]
    );
    return res.json({ success: true, message: "Code envoyé par email." });
  } catch (err) {
    console.error("[ENVOI CODE ENTREPRISE] Erreur:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});
// ===============================
// ===============================
// TABLE DEMANDE CODE ENTREPRISE
// ===============================
const createDemandeCodeEntrepriseTable = `
  CREATE TABLE IF NOT EXISTS demande_code_entreprise (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(30) NOT NULL DEFAULT 'responsable',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

async function ensureDemandeCodeEntrepriseTable() {
  try {
    await pool.query(createDemandeCodeEntrepriseTable);
    console.log("Table 'demande_code_entreprise' vérifiée/créée.");
  } catch (err) {
    console.error("Erreur création table demande_code_entreprise:", err);
  }
}
ensureDemandeCodeEntrepriseTable();

// ===============================
// ROUTE : Demande de code entreprise (Responsable ou Acconier)
// ===============================
app.post("/api/demande-code-entreprise", async (req, res) => {
  const { nom, email, message, type } = req.body || {};
  if (!nom || !email) {
    return res
      .status(400)
      .json({ success: false, message: "Nom et email requis." });
  }
  try {
    await pool.query(
      "INSERT INTO demande_code_entreprise (nom, email, message, type) VALUES ($1, $2, $3, $4)",
      [nom, email, message || "", type || "responsable"]
    );
    // Notifier tous les admins via WebSocket
    broadcastNouvelleDemandeCodeEntreprise();
    // Optionnel : notifier l'admin par email
    // await sendMail({ to: 'admin@its-service.com', subject: 'Nouvelle demande de code entreprise', text: `Demande de ${nom} (${email}) : ${message}` });
    return res.json({ success: true, message: "Demande enregistrée !" });
  } catch (err) {
    console.error("Erreur enregistrement demande code entreprise:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ===============================
// ROUTE GET : Liste des demandes de code entreprise (pour affichage admin)
// ===============================
app.get("/api/demande-code-entreprise", async (req, res) => {
  try {
    // Ne retourne que les demandes non envoyées (status = 'pending')
    const result = await pool.query(
      "SELECT id, nom, email, message, type, status, created_at FROM demande_code_entreprise WHERE status = 'pending' ORDER BY created_at DESC"
    );
    // Retourne un objet {success, demandes: [...]}
    return res.json({ success: true, demandes: result.rows });
  } catch (err) {
    console.error("Erreur récupération demandes code entreprise:", err);
    return res.status(500).json({ success: false, demandes: [] });
  }
});
// ROUTE : Demande de réinitialisation du mot de passe acconier
// ===============================
app.post("/acconier/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: "Email requis." });
  }
  try {
    const userRes = await pool.query(
      "SELECT * FROM acconier WHERE email = $1",
      [email]
    );
    if (userRes.rows.length === 0) {
      // Toujours répondre OK pour ne pas révéler si l'email existe
      return res.json({
        success: true,
        message: "Si cet email existe, un lien a été envoyé.",
      });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await pool.query(
      "UPDATE acconier SET reset_token = $1, reset_token_expires = $2 WHERE email = $3",
      [token, expires, email]
    );
    al;
    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/acconier/reset-password/${token}`;
    await sendMail({
      to: email,
      subject: "Réinitialisation de votre mot de passe Acconier",
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
      html: `<p>Pour réinitialiser votre mot de passe, cliquez ici : <a href=\"${resetLink}\">Réinitialiser</a></p><p>Ce lien expire dans 30 minutes.</p>`,
    });
    return res.json({
      success: true,
      message: "Si cet email existe, un lien a été envoyé.",
    });
  } catch (err) {
    console.error("[ACCONIER][FORGOT PASSWORD] Erreur:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ===============================
// ROUTE : Affichage et soumission du nouveau mot de passe (reset)
// ===============================
app.get("/acconier/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).send("Lien invalide.");
  try {
    const userRes = await pool.query(
      "SELECT * FROM acconier WHERE reset_token = $1 AND reset_token_expires > NOW()",
      [token]
    );
    if (userRes.rows.length === 0) {
      return res.status(400).send("Lien expiré ou invalide.");
    }
    // Affiche un mini-formulaire HTML (simple)
    return res.send(`
      <html><head><title>Réinitialisation du mot de passe</title></head><body style='font-family:sans-serif;max-width:400px;margin:40px auto;'>
        <h2>Réinitialisation du mot de passe</h2>
        <form method='POST'>
          <input type='password' name='password' placeholder='Nouveau mot de passe' required style='width:100%;padding:8px;margin-bottom:10px;'/><br/>
          <button type='submit' style='padding:8px 16px;'>Réinitialiser</button>
        </form>
      </body></html>
    `);
  } catch (err) {
    return res.status(500).send("Erreur serveur.");
  }
});

app.post(
  "/acconier/reset-password/:token",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    if (!token || !password) return res.status(400).send("Requête invalide.");
    try {
      const userRes = await pool.query(
        "SELECT * FROM acconier WHERE reset_token = $1 AND reset_token_expires > NOW()",
        [token]
      );
      if (userRes.rows.length === 0) {
        return res.status(400).send("Lien expiré ou invalide.");
      }
      const hashedPw = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE acconier SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2",
        [hashedPw, token]
      );
      return res.send(
        "<p>Mot de passe réinitialisé avec succès. Vous pouvez fermer cette page et vous reconnecter.</p>"
      );
    } catch (err) {
      return res.status(500).send("Erreur serveur.");
    }
  }
);

// ===============================
// CONFIGURATION NODEMAILER (GMAIL)
// ===============================
// Remplacez par votre adresse Gmail et mot de passe d'application (jamais le mot de passe principal !)
const GMAIL_USER = process.env.GMAIL_USER || "votre.email@gmail.com";
const GMAIL_PASS = process.env.GMAIL_PASS || "votre_mot_de_passe_application";

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

// Fonction utilitaire pour envoyer un email
async function sendMail({ to, subject, text, html }) {
  try {
    await mailTransporter.sendMail({
      from: `ITS Service <${GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email:", err);
    return false;
  }
}

// ===============================
// CONFIGURATION DE LA BASE DE DONNÉES POSTGRESQL (PLACÉE AVANT TOUT USAGE DE pool)
// ===============================

// ===============================
// TABLE ACCONIER (authentification acconier)
// ===============================
const createAcconierTable = `
  CREATE TABLE IF NOT EXISTS acconier (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

// ===============================
// TABLE RESPONSABLE ACCONIER (authentification RespAcconier)
// ===============================
const createRespAcconierTable = `
  CREATE TABLE IF NOT EXISTS resp_acconier (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

async function ensureRespAcconierTable() {
  try {
    await pool.query(createRespAcconierTable);
    console.log("Table 'resp_acconier' vérifiée/créée.");
  } catch (err) {
    console.error("Erreur création table resp_acconier:", err);
  }
}

// On attend la connexion du pool avant de créer la table resp_acconier
pool
  .connect()
  .then((client) => {
    client.release();
    return ensureRespAcconierTable();
  })
  .catch((err) => {
    console.error(
      "Erreur de connexion à la base PostgreSQL pour la table resp_acconier:",
      err
    );
  });

async function ensureAcconierTable() {
  try {
    await pool.query(createAcconierTable);
    // Ajout des colonnes reset_token et reset_token_expires si elles n'existent pas déjà
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acconier' AND column_name='reset_token') THEN
          ALTER TABLE acconier ADD COLUMN reset_token VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acconier' AND column_name='reset_token_expires') THEN
          ALTER TABLE acconier ADD COLUMN reset_token_expires TIMESTAMP;
        END IF;
      END $$;
    `);
    console.log(
      "Table 'acconier' vérifiée/créée et colonnes reset_token/expire ajoutées si besoin."
    );
  } catch (err) {
    console.error("Erreur création table acconier:", err);
  }
}
// On attend la connexion du pool avant de créer la table acconier
pool
  .connect()
  .then((client) => {
    client.release();
    return ensureAcconierTable();
  })
  .catch((err) => {
    console.error(
      "Erreur de connexion à la base PostgreSQL pour la table acconier:",
      err
    );
  });
// ===============================
// ROUTES AUTHENTIFICATION ACCONIER
// ===============================

// Inscription acconier
app.post("/acconier/register", async (req, res) => {
  let { nom, email, password } = req.body || {};
  if (typeof email === "string") {
    email = email.trim().toLowerCase();
  }
  if (!nom || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Tous les champs sont requis (nom, email, mot de passe).",
    });
  }
  try {
    // Vérifie si l'email existe déjà
    const check = await pool.query("SELECT id FROM acconier WHERE email = $1", [
      email,
    ]);
    if (check.rows.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Cet email est déjà utilisé." });
    }
    const hashedPw = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO acconier (nom, email, password) VALUES ($1, $2, $3)",
      [nom, email, hashedPw]
    );
    return res
      .status(201)
      .json({ success: true, message: "Inscription réussie." });
  } catch (err) {
    console.error("[ACCONIER][REGISTER] Erreur:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'inscription.",
    });
  }
});

// Connexion acconier
app.post("/acconier/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return ress
      .status(400)
      .json({ success: false, message: "Tous les champs sont requis." });
  }
  try {
    const userRes = await pool.query(
      "SELECT * FROM acconier WHERE email = $1",
      [email]
    );
    console.log("[ACCONIER][LOGIN] Recherche utilisateur:", userRes.rows);
    if (userRes.rows.length === 0) {
      console.warn("[ACCONIER][LOGIN] Aucun utilisateur trouvé pour:", email);
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect." });
    }
    const user = userRes.rows[0];
    console.log("[ACCONIER][LOGIN] Utilisateur trouvé:", user);
    console.log("[ACCONIER][LOGIN] Mot de passe reçu:", password);
    console.log("[ACCONIER][LOGIN] Mot de passe hashé en base:", user.password);
    const match = await bcrypt.compare(password, user.password);
    console.log("[ACCONIER][LOGIN] Résultat comparaison mot de passe:", match);
    if (!match) {
      console.warn("[ACCONIER][LOGIN] Mot de passe incorrect pour:", email);
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect." });
    }
    return res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      nom: user.nom,
      email: user.email,
    });
  } catch (err) {
    console.error("[ACCONIER][LOGIN] Erreur:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion.",
    });
  }
});

// ===============================
// ROUTES AUTHENTIFICATION RESPONSABLE ACCONIER (séparées)
// ===============================

// Inscription RespAcconier
app.post("/api/respacconier/register", async (req, res) => {
  let { nom, email, password, phone } = req.body || {};
  if (typeof email === "string") {
    email = email.trim().toLowerCase();
  }
  if (!nom || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message:
        "Tous les champs sont requis (nom, email, mot de passe, téléphone).",
    });
  }
  try {
    // Vérifie si l'email existe déjà
    const check = await pool.query(
      "SELECT id FROM resp_acconier WHERE email = $1",
      [email]
    );
    if (check.rows.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Cet email est déjà utilisé." });
    }
    const hashedPw = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO resp_acconier (nom, email, password) VALUES ($1, $2, $3)",
      [nom, email, hashedPw]
    );
    return res
      .status(201)
      .json({ success: true, message: "Inscription réussie." });
  } catch (err) {
    console.error("[RESPACCONIER][REGISTER] Erreur:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'inscription.",
    });
  }
});

// Connexion RespAcconier
app.post("/api/respacconier/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Tous les champs sont requis." });
  }
  try {
    const userRes = await pool.query(
      "SELECT * FROM resp_acconier WHERE email = $1",
      [email]
    );
    if (userRes.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect." });
    }
    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect." });
    }
    // Renvoie nom et email pour affichage avatar (pas de liaison ailleurs)
    res.json({ success: true, id: user.id, nom: user.nom, email: user.email });
  } catch (err) {
    console.error("[RESPACCONIER][LOGIN] Erreur:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// Validation du code entreprise RespAcconier
// Validation dynamique du code entreprise pour RespAcconier
app.post("/api/respacconier/validate-code", async (req, res) => {
  const { code, id } = req.body || {};
  try {
    const codeRes = await pool.query(
      "SELECT code FROM company_code ORDER BY updated_at DESC LIMIT 1"
    );
    const codeEntreprise =
      codeRes.rows.length > 0 ? codeRes.rows[0].code : "ITS2010";
    if (code === codeEntreprise) {
      res.json({ success: true });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Code entreprise invalide." });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// Suppression d'un agent visiteur programmé (par nom OU nom+date, plus permissif)
app.post("/agents-visiteurs/programmes/supprimer", async (req, res) => {
  const { nom_agent_visiteur, date_livraison } = req.body || {};
  if (!nom_agent_visiteur) {
    return res.status(400).json({
      success: false,
      message: "Nom agent visiteur requis.",
    });
  }

  let query, values;
  if (date_livraison && date_livraison !== "-") {
    const formattedDate = formatDateForDB(date_livraison);
    if (formattedDate) {
      query = `DELETE FROM livraison_conteneur WHERE nom_agent_visiteur = $1 AND delivery_date = $2 RETURNING id;`;
      values = [nom_agent_visiteur, formattedDate];
    } else {
      // Si la date est fournie mais invalide, ignorer la date et supprimer par nom uniquement
      query = `DELETE FROM livraison_conteneur WHERE nom_agent_visiteur = $1 RETURNING id;`;
      values = [nom_agent_visiteur];
    }
  } else {
    // Si pas de date, suppression par nom uniquement
    query = `DELETE FROM livraison_conteneur WHERE nom_agent_visiteur = $1 RETURNING id;`;
    values = [nom_agent_visiteur];
  }
  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Aucun agent visiteur trouvé pour ce nom (et date si fournie).",
      });
    }
    // Peut supprimer plusieurs lignes, retourner tous les IDs supprimés
    res.json({ success: true, deletedIds: result.rows.map((r) => r.id) });
  } catch (err) {
    console.error(
      "Erreur lors de la suppression de l'agent visiteur programmé:",
      err
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression.",
    });
  }
});

// Fonction pour obtenir le texte et l'icône du statut en français (utilisé principalement pour les messages WebSocket)
function getFrenchStatusWithIcon(status) {
  let text = "";
  let iconClass = "";
  let customColorClass = ""; // Utilisé pour les alertes frontend

  switch (status) {
    case "awaiting_payment_acconier":
      text = "En attente de paiement";
      iconClass = "fa-solid fa-clock";
      customColorClass = "info";
      break;
    case "in_progress_payment_acconier":
      text = "En cours de paiement";
      iconClass = "fa-solid fa-credit-card";
      customColorClass = "warning";
      break;
    case "pending_acconier":
      text = "Mise en livraison (ancienne)";
      iconClass = "fa-solid fa-hourglass-half";
      customColorClass = "success";
      break;
    case "mise_en_livraison_acconier":
      text = "Mise en livraison";
      iconClass = "fa-solid fa-hourglass-half";
      customColorClass = "success";
      break;
    case "payment_done_acconier":
      text = "Paiement effectué";
      iconClass = "fa-solid fa-check-circle";
      customColorClass = "success";
      break;
    case "processed_acconier":
      text = "Traité Acconier";
      iconClass = "fa-solid fa-check-circle";
      customColorClass = "success";
      break;
    case "rejected_acconier":
      text = "Rejeté Acconier";
      iconClass = "fa-solid fa-times-circle";
      customColorClass = "error";
      break;
    case "rejected_by_employee":
      text = "Rejeté par l'employé";
      iconClass = "fa-solid fa-ban";
      customColorClass = "error";
      break;
    case "delivered":
      text = "Livré";
      iconClass = "fa-solid fa-circle-check";
      customColorClass = "success";
      break;
    default:
      text = status;
      iconClass = "fa-solid fa-question-circle";
      customColorClass = "info";
      break;
  }
  return { text, iconClass, customColorClass };
}

// Fonction de traduction complète des statuts anglais → français (pour tous les contextes)
function translateStatusToFr(status) {
  if (!status) return "-";
  let s = String(status).toLowerCase().trim();
  // Correction : remplacer toutes les variantes de "mise en livraison (ancienne)" par "mise en livraison"
  if (
    s === "mise en livraison (ancienne)" ||
    s === "mise_en_livraison_ancienne" ||
    s === "pending_acconier"
  ) {
    s = "mise en livraison";
  }
  switch (s) {
    // Statuts livrés
    case "delivered":
    case "completed":
    case "finished":
    case "signed":
    case "livré":
    case "livree":
    case "livreee":
      return "Livré";
    // Statuts attente paiement (NOUVEAU)
    case "awaiting_payment_acconier":
      return "En attente de paiement";
    case "in_progress_payment_acconier":
      return "En cours de paiement";
    case "mise en livraison":
    case "mise_en_livraison":
      return "Mise en livraison";
    case "payment_done_acconier":
      return "Paiement effectué";
    // Statuts attente (génériques)
    case "pending":
    case "awaiting_delivery_acconier":
    case "waiting":
    case "pending_validation":
    case "pending_signature":
    case "pending_payment":
    case "en attente":
    case "attente":
      return "En attente";
    // Statuts en cours
    case "in_progress":
    case "in_progress_acconier":
    case "processing":
    case "en cours":
    case "encours":
      return "En cours";
    // Statuts rejetés
    case "rejected":
    case "rejected_acconier":
    case "rejected_by_employee":
    case "refused":
    case "refused_signature":
    case "rejeté":
    case "rejetee":
    case "refusé":
    case "refuse":
      return "Rejeté";
    // Autres statuts
    case "cancelled":
    case "annulled":
      return "Annulée";
    case "validated":
      return "Validée";
    case "scheduled":
      return "Planifiée";
    case "shipped":
      return "Expédiée";
    case "returned":
      return "Retournée";
    case "draft":
      return "Brouillon";
    case "paid":
      return "Payée";
    case "unpaid":
      return "Impayée";
    case "partially_paid":
      return "Partiellement payée";
    case "closed":
      return "Clôturée";
    case "open":
      return "Ouverte";
    case "processed_acconier":
      return "Traité Acconier";
    default:
      // Si déjà en français ou inconnu, retourne le statut tel quel
      return status;
  }
}

// Mapping simple pour le champ "delivery_status_acconier_fr" (pour le frontend, conservé pour compatibilité)
function mapAcconierStatusToFr(status) {
  return translateStatusToFr(status);
}

wss.on("connection", (ws) => {
  ws.on("error", (error) => {
    console.error("Erreur WebSocket côté serveur:", error);
  });
});

app.set("wss", wss); // Permet d'accéder à wss depuis les routes Express

const uploadDir = path.join(__dirname, "uploads");

// Assurez-vous que le répertoire 'uploads' existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuration de Multer
const upload = multer({
  storage: multer.memoryStorage(), // Stocke le fichier en mémoire (buffer)
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Configuration de la base de données PostgreSQL
// (Déjà déclarée en haut du fichier, ne pas redéclarer ici)

// ===============================
// ===============================
// ROUTE MOT DE PASSE OUBLIÉ (génère un code de réinitialisation)
// ===============================
// ROUTE RÉINITIALISATION DU MOT DE PASSE (valide le code et change le mot de passe)
// ===============================
app.post("/api/reset-password", async (req, res) => {
  let { email, code, newPassword } = req.body || {};
  if (typeof email === "string") email = email.trim().toLowerCase();
  if (!email || !code || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Tous les champs sont requis." });
  }
  // Vérifie le code
  const entry = resetCodes[email];
  if (!entry || entry.code !== code) {
    return res
      .status(400)
      .json({ success: false, message: "Code invalide ou expiré." });
  }
  if (Date.now() > entry.expires) {
    delete resetCodes[email];
    return res.status(400).json({
      success: false,
      message: "Code expiré. Veuillez refaire la demande.",
    });
  }
  try {
    // Hash le nouveau mot de passe
    const hashedPw = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE email = $2 RETURNING id",
      [hashedPw, email]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable." });
    }
    // Invalide le code après usage
    delete resetCodes[email];
    return res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès.",
    });
  } catch (err) {
    console.error("Erreur reset-password:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});
// ===============================
const crypto = require("crypto");
// Stockage temporaire des codes de réinitialisation (en mémoire, pour démo)
const resetCodes = {};

app.post("/api/forgot-password", async (req, res) => {
  let { email } = req.body || {};
  if (typeof email === "string") {
    email = email.trim().toLowerCase();
  }
  if (!email) {
    return res.status(400).json({ success: false, message: "Email requis." });
  }
  try {
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun compte trouvé avec cet email.",
      });
    }
    // Génère un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Stocke le code temporairement (clé = email)
    resetCodes[email] = { code, expires: Date.now() + 15 * 60 * 1000 };

    // Envoi du code par email via Gmail
    const mailSent = await sendMail({
      to: email,
      subject: "Code de réinitialisation de mot de passe - ITS Service",
      text: `Votre code de réinitialisation est : ${code}\nCe code est valable 15 minutes.\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
      html: `<p>Bonjour,</p><p>Votre code de réinitialisation est : <b>${code}</b></p><p>Ce code est valable 15 minutes.<br>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
    });
    if (!mailSent) {
      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard.",
      });
    }
    return res.json({
      success: true,
      message:
        "Un code de réinitialisation a été envoyé à votre adresse email.",
    });
  } catch (err) {
    console.error("Erreur forgot-password:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});
// TABLE UTILISATEURS (authentification)
// ===============================
// (bcrypt déjà importé en haut du fichier)
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

async function ensureUsersTable() {
  try {
    await pool.query(createUsersTable);
    console.log("Table 'users' vérifiée/créée.");

    // Ajouter la colonne role si elle n'existe pas
    try {
      await pool.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'`
      );
      console.log("Colonne 'role' ajoutée à la table users.");
    } catch (err) {
      console.log(
        "La colonne 'role' existe déjà ou erreur mineure:",
        err.message
      );
    }

    // Appel d'admin par défaut désactivé - utiliser l'API /api/admin-register
    console.log(
      "ℹ️  Pour créer un administrateur, utilisez l'API /api/admin-register"
    );
  } catch (err) {
    console.error("Erreur création table users:", err);
  }
}

// Supprimer la création d'admin statique - maintenant dynamique via API
async function createDefaultAdmin() {
  // Fonction désactivée - utiliser l'API /api/admin-register
  console.log(
    "ℹ️  Utilisez l'API /api/admin-register pour créer un compte administrateur"
  );
}

ensureUsersTable();

// Fonction d'initialisation complète
async function initializeDatabase() {
  try {
    console.log("🔧 Initialisation complète de la base de données...");

    // Attendre que toutes les tables soient créées
    await ensureUsersTable();
    await ensureAccessRequestsTable();

    console.log("✅ Base de données initialisée avec succès");
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation de la base de données:",
      error
    );
  }
}

// Initialiser la base de données
initializeDatabase();

// TABLE ACCESS_REQUESTS (demandes d'accès)
// ===============================
const createAccessRequestsTable = `
  CREATE TABLE IF NOT EXISTS access_requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    request_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    processed_by VARCHAR(255) NULL,
    request_type VARCHAR(50) DEFAULT 'new_access'
  );
`;

async function ensureAccessRequestsTable() {
  try {
    // Vérifier si la table existe et la créer seulement si elle n'existe pas
    console.log("🔧 Vérification de la table access_requests...");

    // Vérifier si la table existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'access_requests'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      // La table n'existe pas, la créer
      await pool.query(createAccessRequestsTable);
      console.log("✅ Table 'access_requests' créée avec succès.");
    } else {
      console.log(
        "✅ Table 'access_requests' existe déjà - vérification des colonnes..."
      );

      // Vérifier si la colonne request_type existe
      const columnCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'access_requests' 
          AND column_name = 'request_type'
        );
      `);

      if (!columnCheck.rows[0].exists) {
        // Ajouter la colonne request_type
        await pool.query(`
          ALTER TABLE access_requests 
          ADD COLUMN request_type VARCHAR(50) DEFAULT 'new_access';
        `);
        console.log(
          "✅ Colonne 'request_type' ajoutée à la table access_requests."
        );
      } else {
        console.log("✅ Colonne 'request_type' existe déjà.");
      }

      // Vérifier et ajouter la colonne actor_type
      const actorTypeCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'access_requests' 
          AND column_name = 'actor_type'
        );
      `);

      if (!actorTypeCheck.rows[0].exists) {
        await pool.query(`
          ALTER TABLE access_requests 
          ADD COLUMN actor_type VARCHAR(100);
        `);
        console.log(
          "✅ Colonne 'actor_type' ajoutée à la table access_requests."
        );
      } else {
        console.log("✅ Colonne 'actor_type' existe déjà.");
      }

      // Vérifier et ajouter la colonne role
      const roleCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'access_requests' 
          AND column_name = 'role'
        );
      `);

      if (!roleCheck.rows[0].exists) {
        await pool.query(`
          ALTER TABLE access_requests 
          ADD COLUMN role VARCHAR(100);
        `);
        console.log("✅ Colonne 'role' ajoutée à la table access_requests.");
      } else {
        console.log("✅ Colonne 'role' existe déjà.");
      }

      // Vérifier et ajouter la colonne last_login
      const lastLoginCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'access_requests' 
          AND column_name = 'last_login'
        );
      `);

      if (!lastLoginCheck.rows[0].exists) {
        await pool.query(`
          ALTER TABLE access_requests 
          ADD COLUMN last_login TIMESTAMP;
        `);
        console.log(
          "✅ Colonne 'last_login' ajoutée à la table access_requests."
        );
      } else {
        console.log("✅ Colonne 'last_login' existe déjà.");
      }

      // Vérifier et ajouter la colonne access_code
      const accessCodeCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'access_requests' 
          AND column_name = 'access_code'
        );
      `);

      if (!accessCodeCheck.rows[0].exists) {
        await pool.query(`
          ALTER TABLE access_requests 
          ADD COLUMN access_code VARCHAR(20);
        `);
        console.log(
          "✅ Colonne 'access_code' ajoutée à la table access_requests."
        );
      } else {
        console.log("✅ Colonne 'access_code' existe déjà.");
      }

      // Vérifier et ajouter la colonne societe
      const societeCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'access_requests' 
          AND column_name = 'societe'
        );
      `);

      if (!societeCheck.rows[0].exists) {
        await pool.query(`
          ALTER TABLE access_requests 
          ADD COLUMN societe VARCHAR(255);
        `);
        console.log("✅ Colonne 'societe' ajoutée à la table access_requests.");
      } else {
        console.log("✅ Colonne 'societe' existe déjà.");
      }

      // Vérifier et ajouter la colonne justification
      const justificationCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'access_requests' 
          AND column_name = 'justification'
        );
      `);

      if (!justificationCheck.rows[0].exists) {
        await pool.query(`
          ALTER TABLE access_requests 
          ADD COLUMN justification TEXT;
        `);
        console.log(
          "✅ Colonne 'justification' ajoutée à la table access_requests."
        );
      } else {
        console.log("✅ Colonne 'justification' existe déjà.");
      }
    }
  } catch (err) {
    console.error(
      "Erreur lors de la création/modification de la table access_requests:",
      err
    );
  }
}

// Définition de la table livraison_conteneur
const creationTableLivraisonConteneur = `
    CREATE TABLE IF NOT EXISTS livraison_conteneur (
      id SERIAL PRIMARY KEY,
      employee_name VARCHAR(100) NOT NULL,
      delivery_date DATE NULL, 
      delivery_time TIME NULL, 
      client_name VARCHAR(100) NOT NULL,
      client_phone VARCHAR(15) NOT NULL,
      container_type_and_content TEXT NOT NULL,
      lieu VARCHAR(255) NOT NULL,
      
      container_number VARCHAR(100) NOT NULL,
      container_foot_type VARCHAR(10) NOT NULL,
      declaration_number VARCHAR(100) NOT NULL,
      number_of_containers INTEGER NOT NULL DEFAULT 1,
      
      bl_number VARCHAR(100) NULL,
      dossier_number VARCHAR(100) NULL,
      shipping_company VARCHAR(255) NULL,
      transporter VARCHAR(255) NULL, 
      
      weight VARCHAR(50) NULL,
      ship_name VARCHAR(255) NULL, 
      circuit VARCHAR(100) NULL, 
      number_of_packages INTEGER NULL, 
      
      transporter_mode VARCHAR(100) NULL, 
      
      -- NOUVELLES COLONNES AJOUTÉES
      nom_agent_visiteur VARCHAR(255) NULL, 
      inspecteur VARCHAR(255) NULL, 
      agent_en_douanes VARCHAR(255) NULL,

      driver_name VARCHAR(100) NULL,
      driver_phone VARCHAR(15) NULL,
      truck_registration VARCHAR(50) NULL, 

      delivery_notes TEXT NULL,
      status VARCHAR(50) NOT NULL,
      is_eir_received BOOLEAN DEFAULT FALSE, 
      
      -- AJOUT DES COLONNES SPÉCIFIQUES À L'ACCONIER
      delivery_status_acconier VARCHAR(50) NOT NULL DEFAULT 'pending_acconier',
      observation_acconier TEXT NULL,

      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
`;

// Définition de la table d'archives
const creationTableArchives = `
    CREATE TABLE IF NOT EXISTS archives_dossiers (
      id SERIAL PRIMARY KEY,
      dossier_id INTEGER NULL,
      dossier_reference VARCHAR(100),
      intitule TEXT,
      client_name VARCHAR(255),
      role_source VARCHAR(100) NOT NULL,
      page_origine VARCHAR(255) NOT NULL,
      action_type VARCHAR(50) NOT NULL, -- 'suppression', 'livraison', 'mise_en_livraison'
      archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      archived_by VARCHAR(255),
      archived_by_email VARCHAR(255),
      is_restorable BOOLEAN DEFAULT TRUE,
      dossier_data JSONB, -- Stockage complet des données du dossier pour restauration
      metadata JSONB, -- Métadonnées supplémentaires pour la restauration
      
      CONSTRAINT chk_action_type CHECK (action_type IN ('suppression', 'livraison', 'mise_en_livraison', 'ordre_livraison_etabli'))
    );
`;

async function createTables() {
  try {
    await pool.query(creationTableLivraisonConteneur);
    console.log("Table livraison_conteneur créée ou déjà existante.");

    await pool.query(creationTableArchives);
    console.log("Table archives_dossiers créée ou déjà existante.");

    // Mettre à jour la contrainte action_type pour inclure 'ordre_livraison_etabli'
    try {
      await pool.query(`
        DO $$ BEGIN
          -- Supprimer l'ancienne contrainte si elle existe
          IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'chk_action_type') THEN
            ALTER TABLE archives_dossiers DROP CONSTRAINT chk_action_type;
          END IF;
          
          -- Ajouter la nouvelle contrainte avec le nouveau type d'action
          ALTER TABLE archives_dossiers ADD CONSTRAINT chk_action_type 
          CHECK (action_type IN ('suppression', 'livraison', 'mise_en_livraison', 'ordre_livraison_etabli'));
          
          RAISE NOTICE 'Contrainte chk_action_type mise à jour avec ordre_livraison_etabli';
        END $$;
      `);
    } catch (err) {
      console.warn(
        "Migration de la contrainte chk_action_type échouée :",
        err.message
      );
    }

    //
    // Assurez-vous que delivery_date et delivery_time sont bien NULLABLE
    const columnsToMakeNullable = ["delivery_date", "delivery_time"];

    for (const colName of columnsToMakeNullable) {
      await pool.query(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='livraison_conteneur' AND column_name='${colName}' AND is_nullable='NO') THEN
            ALTER TABLE livraison_conteneur ALTER COLUMN ${colName} DROP NOT NULL;
            RAISE NOTICE 'Colonne ''${colName}'' rendue NULLABLE.';
          END IF;
        END $$;
      `);
    }

    // --- MIGRATION : Agrandir la colonne container_foot_type si trop petite ---
    // Passe à TEXT si < VARCHAR(50)
    try {
      const res = await pool.query(`
        SELECT character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'livraison_conteneur' AND column_name = 'container_foot_type';
      `);
      if (
        res.rows.length > 0 &&
        res.rows[0].character_maximum_length !== null &&
        res.rows[0].character_maximum_length < 50
      ) {
        await pool.query(
          `ALTER TABLE livraison_conteneur ALTER COLUMN container_foot_type TYPE TEXT;`
        );
        console.log(
          "Colonne container_foot_type migrée en TEXT (longueur illimitée)"
        );
      }
    } catch (err) {
      console.warn(
        "Migration auto de la colonne container_foot_type échouée :",
        err
      );
    }

    // Supprimer les colonnes d'URL de fichier si elles existent et ne sont plus utilisées
    const columnsToDelete = ["eir_document_url", "client_signature_photo_url"];

    for (const col of columnsToDelete) {
      await pool.query(`
            DO $$ BEGIN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='livraison_conteneur' AND column_name='${col}') THEN
                ALTER TABLE livraison_conteneur DROP COLUMN ${col};
                RAISE NOTICE 'Colonne ''${col}'' supprimée de la table livraison_conteneur.';
              END IF;
            END $$;
        `);
    }

    // Ajouter de nouvelles colonnes si elles n'existent pas (assure la compatibilité)
    const columnsToAdd = [
      { name: "weight", type: "VARCHAR(50)", nullable: true },
      { name: "ship_name", type: "VARCHAR(255)", nullable: true },
      { name: "circuit", type: "VARCHAR(100)", nullable: true },
      { name: "number_of_packages", type: "INTEGER", nullable: true },
      { name: "declaration_circuit", type: "VARCHAR(100)", nullable: true }, // Not in HTML/JS, but good to have
      { name: "transporter_mode", type: "VARCHAR(100)", nullable: true },
      { name: "driver_name", type: "VARCHAR(100)", nullable: true },
      { name: "driver_phone", type: "VARCHAR(15)", nullable: true },
      { name: "truck_registration", type: "VARCHAR(50)", nullable: true },
      { name: "transporter", type: "VARCHAR(255)", nullable: true },
      // NOUVELLES COLONNES ICI
      { name: "nom_agent_visiteur", type: "VARCHAR(255)", nullable: true },
      { name: "inspecteur", type: "VARCHAR(255)", nullable: true },
      { name: "agent_en_douanes", type: "VARCHAR(255)", nullable: true },
      // AJOUT DES COLONNES SPÉCIFIQUES À L'ACCONIER
      {
        name: "delivery_status_acconier",
        type: "VARCHAR(50)",
        nullable: false,
        defaultValue: "'pending_acconier'",
      },
      { name: "observation_acconier", type: "TEXT", nullable: true },
      // NOUVEAU : Statut par conteneur (JSONB)
      { name: "container_statuses", type: "JSONB", nullable: true },
      // NOUVEAU : Statut par BL (JSONB)
      { name: "bl_statuses", type: "JSONB", nullable: true },
    ];

    for (const col of columnsToAdd) {
      await pool.query(`
            DO $$ BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='livraison_conteneur' AND column_name='${
                col.name
              }') THEN
                ALTER TABLE livraison_conteneur ADD COLUMN ${col.name} ${
        col.type
      } ${col.nullable ? "NULL" : "NOT NULL"} ${
        col.defaultValue ? `DEFAULT ${col.defaultValue}` : ""
      };
                RAISE NOTICE 'Colonne ''${
                  col.name
                }'' ajoutée à la table livraison_conteneur.';
              END IF;
            END $$;
        `);
    }
  } catch (err) {
    console.error(
      "Erreur lors de la création ou mise à jour des tables :",
      err
    );
    process.exit(1);
  }
}
createTables();

// === FONCTION POUR NETTOYER LES DOUBLONS D'ARCHIVES ===
async function cleanArchivesDuplicates() {
  try {
    console.log("🧹 Début du nettoyage des doublons d'archives...");

    // Étape 1: Identifier les doublons par dossier_reference + action_type
    const duplicatesQuery = `
      SELECT dossier_reference, action_type, COUNT(*) as count_duplicates
      FROM archives_dossiers 
      WHERE dossier_reference IS NOT NULL
      GROUP BY dossier_reference, action_type
      HAVING COUNT(*) > 1
      ORDER BY count_duplicates DESC;
    `;

    const duplicatesResult = await pool.query(duplicatesQuery);
    const duplicates = duplicatesResult.rows;

    if (duplicates.length === 0) {
      console.log("✅ Aucun doublon d'archive trouvé.");
      return;
    }

    let totalDeleted = 0;

    // Étape 2: Pour chaque groupe de doublons, garder le plus récent et supprimer les autres
    for (const duplicate of duplicates) {
      const { dossier_reference, action_type } = duplicate;

      // Récupérer tous les enregistrements de ce groupe, triés par date (plus récent en premier)
      const allRecordsQuery = `
        SELECT id, archived_at, archived_by
        FROM archives_dossiers 
        WHERE dossier_reference = $1 AND action_type = $2
        ORDER BY archived_at DESC;
      `;

      const allRecordsResult = await pool.query(allRecordsQuery, [
        dossier_reference,
        action_type,
      ]);
      const allRecords = allRecordsResult.rows;

      if (allRecords.length <= 1) continue;

      // Garder le premier (plus récent) et supprimer les autres
      const toKeep = allRecords[0];
      const toDelete = allRecords.slice(1);

      console.log(`🗑️  Nettoyage ${dossier_reference} (${action_type}):`);
      console.log(
        `   ✅ Garder: ID ${toKeep.id} (${toKeep.archived_at}) par ${toKeep.archived_by}`
      );

      for (const record of toDelete) {
        await pool.query("DELETE FROM archives_dossiers WHERE id = $1", [
          record.id,
        ]);
        console.log(
          `   ❌ Supprimé: ID ${record.id} (${record.archived_at}) par ${record.archived_by}`
        );
        totalDeleted++;
      }
    }

    console.log(`✅ Nettoyage terminé: ${totalDeleted} doublons supprimés.`);

    // Étape 3: Ajouter une contrainte unique pour empêcher les futurs doublons
    try {
      await pool.query(`
        DO $$ BEGIN
          -- Vérifier si la contrainte n'existe pas déjà
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'unique_archive_per_dossier_action'
          ) THEN
            -- Créer un index unique sur dossier_reference + action_type
            CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_archive_per_dossier_action 
            ON archives_dossiers (dossier_reference, action_type) 
            WHERE dossier_reference IS NOT NULL;
            
            RAISE NOTICE 'Contrainte unique ajoutée pour éviter les doublons d''archives';
          END IF;
        END $$;
      `);
      console.log(
        "🔒 Contrainte unique ajoutée pour empêcher les futurs doublons."
      );
    } catch (err) {
      console.warn(
        "⚠️  Impossible d'ajouter la contrainte unique:",
        err.message
      );
    }
  } catch (err) {
    console.error("❌ Erreur lors du nettoyage des doublons d'archives:", err);
  }
}

// Lancer le nettoyage des doublons au démarrage
cleanArchivesDuplicates();

// Helper function to validate and format time strings (HH:MM)
function formatTimeForDB(timeString) {
  if (!timeString) return null;
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0"
      )}`;
    }
  }
  return null; // Return null for invalid or unparseable time strings
}

// Helper function to validate and format date strings (YYYY-MM-DD)
function formatDateForDB(dateString) {
  if (!dateString) return null;

  // Try parsing as ISO format (YYYY-MM-DD) first, or any format new Date() can natively handle
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  // If native parsing failed, try common French formats (DD/MM/YYYY or DD-MM-YYYY)
  const frenchDateMatch = dateString.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );
  if (frenchDateMatch) {
    const day = parseInt(frenchDateMatch[1], 10);
    const month = parseInt(frenchDateMatch[2], 10); // Month is 1-indexed from user input
    const year = parseInt(frenchDateMatch[3], 10);

    // JavaScript Date constructor expects month as 0-indexed (0 for January)
    date = new Date(year, month - 1, day);

    // Validate if the date components actually correspond to the parsed date
    // (e.g., new Date(2024, 1, 30) where Feb only has 29 days will result in March 1,
    // so this check ensures it's a valid date within the given month)
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date.toISOString().split("T")[0];
    }
  }

  console.warn(
    `Backend: Could not parse date string "${dateString}". Returning null.`
  );
  return null; // Return null if all parsing attempts fail
}

// =========================================================================
// --- ROUTES API pour les livraisons uniquement ---
// =========================================================================

// ROUTE : Suppression de livraisons par liste d'ids
app.post("/deliveries/delete", async (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Aucun id fourni." });
  }
  // Vérifie que tous les ids sont des entiers
  const validIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
  if (validIds.length === 0) {
    return res.status(400).json({ success: false, message: "Ids invalides." });
  }
  try {
    const result = await pool.query(
      `DELETE FROM livraison_conteneur WHERE id = ANY($1::int[]) RETURNING id;`,
      [validIds]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Aucune livraison supprimée." });
    }
    return res.json({
      success: true,
      deletedIds: result.rows.map((r) => r.id),
    });
  } catch (err) {
    console.error("[POST /deliveries/delete] Erreur:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// Fonction pour créer les nouvelles colonnes pour l'échange de données
async function ensureExchangeFieldsTable() {
  try {
    // Ajout des nouveaux champs pour l'échange de données
    await pool.query(`
      ALTER TABLE livraison_conteneur 
      ADD COLUMN IF NOT EXISTS paiement_acconage DATE,
      ADD COLUMN IF NOT EXISTS date_echange_bl DATE,
      ADD COLUMN IF NOT EXISTS date_do DATE,
      ADD COLUMN IF NOT EXISTS date_badt DATE
    `);

    // Migration pour changer le type de paiement_acconage de TEXT vers DATE
    try {
      // Vérifier d'abord si la colonne existe et son type
      const result = await pool.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'livraison_conteneur' 
        AND column_name = 'paiement_acconage'
      `);

      if (result.rows.length > 0 && result.rows[0].data_type === "text") {
        console.log(
          "🔄 Migration: Changement du type paiement_acconage de TEXT vers DATE..."
        );

        // Sauvegarder les données TEXT qui peuvent être converties
        await pool.query(`
          UPDATE livraison_conteneur 
          SET paiement_acconage = NULL 
          WHERE paiement_acconage IS NOT NULL 
          AND paiement_acconage !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        `);

        // Changer le type de colonne
        await pool.query(`
          ALTER TABLE livraison_conteneur 
          ALTER COLUMN paiement_acconage TYPE DATE 
          USING CASE 
            WHEN paiement_acconage ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' 
            THEN paiement_acconage::DATE 
            ELSE NULL 
          END
        `);

        console.log(
          "✅ Migration terminée: paiement_acconage est maintenant de type DATE"
        );
      }
    } catch (migrationErr) {
      console.log(
        "ℹ️ Paiement_acconage est déjà de type DATE ou migration non nécessaire"
      );
    }

    console.log("✅ Colonnes d'échange de données vérifiées/créées");
  } catch (err) {
    console.error("❌ Erreur lors de la création des colonnes d'échange:", err);
  }
}

// Appeler la fonction au démarrage
ensureExchangeFieldsTable();

// ROUTE : Liste des livraisons avec statuts (inclut bl_statuses)
app.get("/deliveries/status", async (req, res) => {
  try {
    // Vérifier d'abord si les nouvelles colonnes JSON existent
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'livraison_conteneur' 
      AND column_name IN ('container_numbers_list', 'container_foot_types_map', 'paiement_acconage', 'date_echange_bl', 'date_do', 'date_badt')
    `);

    const hasJsonColumns = columnsCheck.rows.some((row) =>
      ["container_numbers_list", "container_foot_types_map"].includes(
        row.column_name
      )
    );
    const hasExchangeFields = columnsCheck.rows.some((row) =>
      ["paiement_acconage", "date_echange_bl", "date_do", "date_badt"].includes(
        row.column_name
      )
    );

    let query;
    if (hasJsonColumns && hasExchangeFields) {
      // Si toutes les colonnes existent, les inclure dans la requête
      query = `SELECT id, employee_name, delivery_date, delivery_time, client_name, client_phone, container_type_and_content, lieu, container_number, container_foot_type, declaration_number, number_of_containers, bl_number, dossier_number, shipping_company, transporter, weight, ship_name, circuit, number_of_packages, transporter_mode, nom_agent_visiteur, inspecteur, agent_en_douanes, driver_name, driver_phone, truck_registration, delivery_notes, status, is_eir_received, delivery_status_acconier, observation_acconier, created_at, container_statuses, bl_statuses, container_numbers_list, container_foot_types_map, paiement_acconage, date_echange_bl, date_do, date_badt FROM livraison_conteneur ORDER BY created_at DESC`;
    } else if (hasJsonColumns) {
      // Si seulement les colonnes JSON existent, les inclure dans la requête
      query = `SELECT id, employee_name, delivery_date, delivery_time, client_name, client_phone, container_type_and_content, lieu, container_number, container_foot_type, declaration_number, number_of_containers, bl_number, dossier_number, shipping_company, transporter, weight, ship_name, circuit, number_of_packages, transporter_mode, nom_agent_visiteur, inspecteur, agent_en_douanes, driver_name, driver_phone, truck_registration, delivery_notes, status, is_eir_received, delivery_status_acconier, observation_acconier, created_at, container_statuses, bl_statuses, container_numbers_list, container_foot_types_map FROM livraison_conteneur ORDER BY created_at DESC`;
    } else {
      // Sinon, utiliser l'ancienne requête sans les colonnes JSON
      query = `SELECT id, employee_name, delivery_date, delivery_time, client_name, client_phone, container_type_and_content, lieu, container_number, container_foot_type, declaration_number, number_of_containers, bl_number, dossier_number, shipping_company, transporter, weight, ship_name, circuit, number_of_packages, transporter_mode, nom_agent_visiteur, inspecteur, agent_en_douanes, driver_name, driver_phone, truck_registration, delivery_notes, status, is_eir_received, delivery_status_acconier, observation_acconier, created_at, container_statuses, bl_statuses FROM livraison_conteneur ORDER BY created_at DESC`;
    }

    // On sélectionne explicitement bl_statuses (et container_statuses) + NOUVEAUX CHAMPS JSON si disponibles
    const result = await pool.query(query);

    // NORMALISATION DES DATES POUR RENDER - FIX POUR LES DATES DO ET BADT
    const normalizedDeliveries = result.rows.map((delivery) => {
      // Fonction pour normaliser les dates
      const normalizeDate = (dateValue) => {
        if (!dateValue) return null;
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return null;
          // Retourner la date au format ISO (YYYY-MM-DD) pour éviter les problèmes de timezone
          return date.toISOString().split("T")[0];
        } catch (e) {
          console.error(
            "Erreur de normalisation de date:",
            e,
            "pour la valeur:",
            dateValue
          );
          return null;
        }
      };

      return {
        ...delivery,
        // Normaliser toutes les dates importantes
        delivery_date: normalizeDate(delivery.delivery_date),
        date_do: normalizeDate(delivery.date_do),
        date_badt: normalizeDate(delivery.date_badt),
        date_echange_bl: normalizeDate(delivery.date_echange_bl),
        created_at: delivery.created_at, // Garder created_at au format complet pour l'ordre
      };
    });

    res.json({ success: true, deliveries: normalizedDeliveries });
  } catch (err) {
    console.error("[GET /deliveries/status] Erreur:", err);
    res.status(500).json({ success: false, deliveries: [] });
  }
});

// ===============================
// ===============================
// API DÉDIÉE POUR ÉCHANGE DE DONNÉES AVEC SYSTÈME PHP
// ===============================

// ROUTE : GET - Récupération des données d'échange pour le système PHP
app.get("/api/exchange/data", async (req, res) => {
  try {
    const {
      dossier_number,
      bl_number,
      start_date,
      end_date,
      groupe_par_statut,
    } = req.query;

    let query = `
      SELECT 
        id, 
        employee_name,
        delivery_date,
        delivery_time,
        client_name,
        client_phone,
        container_type_and_content,
        lieu,
        container_number,
        container_foot_type,
        declaration_number,
        number_of_containers,
        bl_number,
        dossier_number, 
        shipping_company,
        transporter,
        weight,
        ship_name,
        circuit,
        number_of_packages,
        transporter_mode,
        nom_agent_visiteur,
        inspecteur,
        agent_en_douanes,
        driver_name,
        driver_phone,
        truck_registration,
        delivery_notes,
        status,
        is_eir_received,
        delivery_status_acconier,
        observation_acconier,
        created_at,
        container_statuses,
        bl_statuses,
        paiement_acconage,
        date_echange_bl,
        date_do,
        date_badt
      FROM livraison_conteneur 
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCounter = 1;

    // Filtres optionnels
    if (dossier_number) {
      query += ` AND dossier_number = $${paramCounter}`;
      queryParams.push(dossier_number);
      paramCounter++;
    }

    if (bl_number) {
      query += ` AND bl_number LIKE $${paramCounter}`;
      queryParams.push(`%${bl_number}%`);
      paramCounter++;
    }

    if (start_date) {
      query += ` AND delivery_date >= $${paramCounter}`;
      queryParams.push(start_date);
      paramCounter++;
    }

    if (end_date) {
      query += ` AND delivery_date <= $${paramCounter}`;
      queryParams.push(end_date);
      paramCounter++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, queryParams);

    // Si on demande un groupement par statut (API 3 en 1)
    if (groupe_par_statut === "true") {
      // NORMALISATION DES DATES POUR RENDER - FIX POUR LES DATES DO ET BADT
      const normalizeDate = (dateValue) => {
        if (!dateValue) return null;
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return null;
          // Retourner la date au format ISO (YYYY-MM-DD) pour éviter les problèmes de timezone
          return date.toISOString().split("T")[0];
        } catch (e) {
          console.error(
            "Erreur de normalisation de date:",
            e,
            "pour la valeur:",
            dateValue
          );
          return null;
        }
      };

      const normalizedDossiers = result.rows.map((delivery) => ({
        ...delivery,
        // Normaliser toutes les dates importantes
        delivery_date: normalizeDate(delivery.delivery_date),
        date_do: normalizeDate(delivery.date_do),
        date_badt: normalizeDate(delivery.date_badt),
        date_echange_bl: normalizeDate(delivery.date_echange_bl),
        created_at: delivery.created_at, // Garder created_at au format complet pour l'ordre
      }));

      const groupedData = {
        // TOUS LES DOSSIERS (pas de filtre)
        dossiers_soumis: normalizedDossiers,

        // FILTRÉ : Seulement mise en livraison
        dossiers_mise_en_livraison: normalizedDossiers.filter(
          (d) =>
            d.status === "mise_en_livraison" || d.status === "Mise en livraison"
        ),

        // FILTRÉ : Seulement livrés
        dossiers_livres: normalizedDossiers.filter(
          (d) =>
            d.status === "livre" || d.status === "Livré" || d.status === "livré"
        ),
      };

      res.json({
        success: true,
        data: groupedData,
        count: result.rows.length,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Comportement original (sans groupement) - AVEC NORMALISATION DES DATES
      const normalizeDate = (dateValue) => {
        if (!dateValue) return null;
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return null;
          // Retourner la date au format ISO (YYYY-MM-DD) pour éviter les problèmes de timezone
          return date.toISOString().split("T")[0];
        } catch (e) {
          console.error(
            "Erreur de normalisation de date:",
            e,
            "pour la valeur:",
            dateValue
          );
          return null;
        }
      };

      const normalizedData = result.rows.map((delivery) => ({
        ...delivery,
        // Normaliser toutes les dates importantes
        delivery_date: normalizeDate(delivery.delivery_date),
        date_do: normalizeDate(delivery.date_do),
        date_badt: normalizeDate(delivery.date_badt),
        date_echange_bl: normalizeDate(delivery.date_echange_bl),
        created_at: delivery.created_at, // Garder created_at au format complet pour l'ordre
      }));

      res.json({
        success: true,
        data: normalizedData,
        count: result.rows.length,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("[GET /api/exchange/data] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données",
      error: err.message,
    });
  }
});

// ROUTE : PUT - Mise à jour des champs d'échange
app.put("/api/exchange/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { paiement_acconage, date_echange_bl, date_do, date_badt } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID de livraison requis",
      });
    }

    // Construction dynamique de la requête UPDATE
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (paiement_acconage !== undefined) {
      updates.push(`paiement_acconage = $${paramCounter}`);
      values.push(paiement_acconage);
      paramCounter++;
    }

    if (date_echange_bl !== undefined) {
      updates.push(`date_echange_bl = $${paramCounter}`);
      values.push(date_echange_bl);
      paramCounter++;
    }

    if (date_do !== undefined) {
      updates.push(`date_do = $${paramCounter}`);
      values.push(date_do);
      paramCounter++;
    }

    if (date_badt !== undefined) {
      updates.push(`date_badt = $${paramCounter}`);
      values.push(date_badt);
      paramCounter++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun champ à mettre à jour",
      });
    }

    values.push(id); // ID en dernier paramètre
    const query = `
      UPDATE livraison_conteneur 
      SET ${updates.join(", ")} 
      WHERE id = $${paramCounter}
      RETURNING id, paiement_acconage, date_echange_bl, date_do, date_badt
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Livraison non trouvée",
      });
    }

    // Broadcast WebSocket pour mise à jour en temps réel
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // Normaliser les dates avant d'envoyer via WebSocket
        const normalizeDate = (dateValue) => {
          if (!dateValue) return null;
          try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return null;
            return date.toISOString().split("T")[0];
          } catch (e) {
            return null;
          }
        };

        const normalizedFields = {
          ...result.rows[0],
          date_do: normalizeDate(result.rows[0].date_do),
          date_badt: normalizeDate(result.rows[0].date_badt),
          date_echange_bl: normalizeDate(result.rows[0].date_echange_bl),
        };

        client.send(
          JSON.stringify({
            type: "exchange_data_update",
            deliveryId: id,
            updatedFields: normalizedFields,
          })
        );
      }
    });

    // Normaliser les dates dans la réponse
    const normalizeDate = (dateValue) => {
      if (!dateValue) return null;
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split("T")[0];
      } catch (e) {
        return null;
      }
    };

    const normalizedData = {
      ...result.rows[0],
      date_do: normalizeDate(result.rows[0].date_do),
      date_badt: normalizeDate(result.rows[0].date_badt),
      date_echange_bl: normalizeDate(result.rows[0].date_echange_bl),
    };

    res.json({
      success: true,
      data: normalizedData,
      message: "Données d'échange mises à jour avec succès",
    });
  } catch (err) {
    console.error("[PUT /api/exchange/update] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: err.message,
    });
  }
});

// ROUTE : POST - Création/Mise à jour en lot des données d'échange
app.post("/api/exchange/bulk-update", async (req, res) => {
  try {
    const { updates } = req.body; // Array d'objets {id, paiement_acconage, date_echange_bl, date_do, date_badt, etc.}

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Le paramètre 'updates' doit être un tableau non vide",
      });
    }

    const results = [];

    // Transaction pour assurer la cohérence
    await pool.query("BEGIN");

    try {
      for (const update of updates) {
        const {
          id,
          date_echange,
          paiement_acconage,
          date_echange_bl,
          date_do,
          date_badt,
        } = update;

        if (!id) continue;

        const result = await pool.query(
          `
          UPDATE livraison_conteneur 
          SET 
            date_echange = COALESCE($2, date_echange),
            paiement_acconage = COALESCE($3, paiement_acconage),
            date_echange_bl = COALESCE($4, date_echange_bl),
            date_do = COALESCE($5, date_do),
            date_badt = COALESCE($6, date_badt)
          WHERE id = $1
          RETURNING id, dossier_number, date_echange, paiement_acconage, date_echange_bl, date_do, date_badt
        `,
          [
            id,
            date_echange,
            paiement_acconage,
            date_echange_bl,
            date_do,
            date_badt,
          ]
        );

        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      }

      await pool.query("COMMIT");

      // Broadcast WebSocket pour chaque mise à jour
      results.forEach((updatedDelivery) => {
        wsClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "exchange_data_update",
                deliveryId: updatedDelivery.id,
                updatedFields: updatedDelivery,
              })
            );
          }
        });
      });

      res.json({
        success: true,
        data: results,
        count: results.length,
        message: `${results.length} livraison(s) mise(s) à jour avec succès`,
      });
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
  } catch (err) {
    console.error("[POST /api/exchange/bulk-update] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour en lot",
      error: err.message,
    });
  }
});

// ===============================
// ROUTE INSCRIPTION UTILISATEUR
// ===============================
app.post("/api/signup", async (req, res) => {
  let { name, nom, email, password } = req.body || {};
  if (!name && nom) name = nom;
  // Normalisation de l'email (trim + minuscule)
  if (typeof email === "string") {
    email = email.trim().toLowerCase();
  }
  // Log de debug pour voir ce que reçoit le backend
  console.log("[INSCRIPTION] Données reçues:", {
    name,
    email,
    password,
    body: req.body,
  });
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Tous les champs sont requis." });
  }
  try {
    // Vérifie si l'email existe déjà
    const check = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );
    console.log("[INSCRIPTION] Résultat vérification email:", check.rows);
    if (check.rows.length > 0) {
      // Même si l'email existe déjà, on répond comme si l'inscription était réussie
      return res
        .status(201)
        .json({ success: true, message: "Inscription réussie." });
    }
    // Hash du mot de passe
    const hashedPw = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPw]
    );

    // Envoi d'un mail de bienvenue
    await sendMail({
      to: email,
      subject: "Bienvenue sur ITS Service !",
      text: `Bonjour ${name},\n\nVotre inscription sur ITS Service a bien été prise en compte.\n\nBienvenue !`,
      html: `<p>Bonjour <b>${name}</b>,</p><p>Votre inscription sur <b>ITS Service</b> a bien été prise en compte.<br>Bienvenue !</p>`,
    });

    return res
      .status(201)
      .json({ success: true, message: "Inscription réussie." });
  } catch (err) {
    // Gestion explicite de la violation de contrainte d'unicité (email déjà utilisé)
    if (err && err.code === "23505") {
      // Même en cas de violation d'unicité, on répond comme si l'inscription était réussie
      return res
        .status(201)
        .json({ success: true, message: "Inscription réussie." });
    }
    // Log détaillé de l'erreur pour debug
    console.error("[INSCRIPTION][ERREUR] Erreur inattendue:", err);
    return res.status(500).json({
      success: false,
      message: `Erreur serveur lors de l'inscription: ${
        err && err.message ? err.message : ""
      }`,
    });
  }
});

// ===============================
// ROUTE CONNEXION UTILISATEUR
// ===============================
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  console.log("[LOGIN][API] Données reçues:", {
    email,
    password: password ? "***MASQUÉ***" : undefined,
    body: { ...req.body, password: password ? "***MASQUÉ***" : undefined },
  });

  if (!email || !password) {
    console.warn("[LOGIN][API] Champs manquants:", {
      email,
      password: !!password,
    });
    return res
      .status(400)
      .json({ success: false, message: "Email et code d'accès requis." });
  }

  // ✅ NOUVELLE VALIDATION: Accepter les codes d'accès de 6 à 8 caractères alphanumériques
  // Rejeter les mots de passe email (qui contiennent généralement des caractères spéciaux)
  const accessCodePattern = /^[A-Z0-9]{6,8}$/; // Entre 6 et 8 caractères alphanumériques majuscules

  if (!accessCodePattern.test(password)) {
    console.warn(
      "[LOGIN][API] Format de code d'accès invalide. Doit être 6-8 caractères alphanumériques:",
      password
    );
    return res.status(401).json({
      success: false,
      message:
        "Code d'accès invalide. Utilisez uniquement le code à 6-8 caractères envoyé par email.",
    });
  }

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    console.log("[LOGIN][API] Recherche utilisateur pour:", email);

    if (userRes.rows.length === 0) {
      console.warn(
        "[LOGIN][API] Aucun utilisateur trouvé pour cet email:",
        email
      );
      return res
        .status(401)
        .json({ success: false, message: "Email ou code d'accès incorrect." });
    }

    const user = userRes.rows[0];

    // ✅ NOUVELLE VALIDATION: S'assurer que l'utilisateur a un code d'accès valide
    // Si c'est un admin avec un ancien mot de passe, lui demander de migrer vers un code d'accès
    if (user.role === "admin") {
      console.log("[LOGIN][API] Tentative de connexion admin détectée");

      // Pour les admins, vérifier d'abord le format du code d'accès
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        console.warn("[LOGIN][API] Code d'accès admin incorrect pour:", email);
        return res
          .status(401)
          .json({ success: false, message: "Code d'accès admin incorrect." });
      }

      // Si le code correspond mais que ce n'est pas au format attendu,
      // cela signifie que l'admin utilise un ancien mot de passe hashé
      // On va créer un nouveau code d'accès pour lui
      console.log(
        "[LOGIN][API] Admin connecté avec succès, vérification du format du code..."
      );
    } else {
      // Pour les utilisateurs normaux, vérification standard
      const match = await bcrypt.compare(password, user.password);
      console.log(
        "[LOGIN][API] Vérification code d'accès utilisateur:",
        match ? "✅ Valide" : "❌ Invalide"
      );

      if (!match) {
        console.warn("[LOGIN][API] Code d'accès incorrect pour:", email);
        return res.status(401).json({
          success: false,
          message: "Email ou code d'accès incorrect.",
        });
      }
    }

    // Connexion réussie
    console.log("[LOGIN][API] Connexion réussie pour:", email);

    // Vérifier si c'est un admin en se basant uniquement sur le rôle
    const isAdmin = user.role === "admin";

    return res.status(200).json({
      success: true,
      nom: user.name,
      email: user.email,
      isAdmin: isAdmin,
      profil: user.role || "Responsable",
      // Ajouter l'URL de redirection pour les utilisateurs normaux
      redirectUrl: isAdmin ? null : "https://dossiv.ci/html/tableauDeBord.html",
    });
  } catch (err) {
    console.error("[LOGIN][API] Erreur serveur lors de la connexion:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion.",
    });
  }
});

// ===============================
// ROUTES POUR LE SYSTÈME DE DEMANDE D'ACCÈS
// ===============================

// Route pour récupérer les nouvelles demandes d'accès
app.get("/api/get-new-access-requests", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM access_requests WHERE status = 'pending' ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      requests: result.rows,
    });
  } catch (err) {
    console.error("[GET-ACCESS-REQUESTS][API] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des demandes.",
    });
  }
});

// Route pour créer un compte utilisateur après approbation
app.post("/api/create-user-account", async (req, res) => {
  const { name, email, password } = req.body;

  console.log("[CREATE-USER][API] Création de compte pour:", { name, email });

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Tous les champs sont requis.",
    });
  }

  try {
    // Récupérer le type de demande depuis la base de données
    const requestResult = await pool.query(
      "SELECT request_type FROM access_requests WHERE email = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
      [email]
    );

    const isPasswordReset =
      requestResult.rows.length > 0 &&
      (requestResult.rows[0].request_type === "forgot_password" ||
        requestResult.rows[0].request_type === "forgot_code");

    console.log("[CREATE-USER][API] Type de demande:", {
      email,
      requestType: requestResult.rows[0]?.request_type || "new_access",
      isPasswordReset,
    });

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      // Si c'est déjà un admin, on considère la demande comme traitée avec succès
      if (user.role === "admin") {
        console.log(
          "[CREATE-USER][INFO] Email appartient déjà à un admin, demande marquée comme approuvée:",
          email
        );

        // Mettre à jour la demande d'accès comme approuvée
        await pool.query(
          `UPDATE access_requests 
           SET status = 'approved', processed_at = CURRENT_TIMESTAMP, processed_by = 'admin'
           WHERE email = $1`,
          [email]
        );

        return res.status(200).json({
          success: true,
          message:
            "Demande approuvée. L'utilisateur a déjà un compte administrateur.",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }

      // Si c'est une demande de code oublié, on met à jour le mot de passe et on envoie l'email
      if (isPasswordReset) {
        console.log(
          "[CREATE-USER][INFO] Demande de code oublié pour utilisateur existant:",
          email
        );

        // Mettre à jour le mot de passe de l'utilisateur existant
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query("UPDATE users SET password = $1 WHERE email = $2", [
          hashedPassword,
          email,
        ]);

        // Envoyer le nouveau code d'accès par email
        const emailSent = await sendMail({
          to: email,
          subject: "Votre nouveau code d'accès - ITS Service",
          text: `Bonjour ${user.name},\n\nVotre demande de nouveau code d'accès a été approuvée !\n\nVoici vos identifiants de connexion :\n\nEmail : ${email}\nCode d'accès : ${password}\n\nVous pouvez maintenant vous connecter sur la plateforme.\n\nCordialement,\nL'équipe ITS Service`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb; text-align: center;">Code d'Accès Mis à Jour - ITS Service</h2>
              
              <p>Bonjour <strong>${user.name}</strong>,</p>
              
              <p style="color: #059669; font-weight: bold;">✅ Votre demande de nouveau code d'accès a été approuvée !</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">🔐 Vos identifiants de connexion :</h3>
                
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Code d'accès :</strong> <span style="font-size: 1.2em; font-weight: bold; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">${password}</span></p>
              </div>
              
              <p>Vous pouvez maintenant vous connecter sur la plateforme en utilisant votre email et le nouveau code d'accès fourni.</p>
              
              <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
                Cordialement,<br>
                L'équipe ITS Service
              </p>
            </div>
          `,
        });

        // Mettre à jour la demande d'accès
        await pool.query(
          `UPDATE access_requests 
           SET status = 'approved', processed_at = CURRENT_TIMESTAMP, processed_by = 'admin'
           WHERE email = $1`,
          [email]
        );

        console.log(
          "[CREATE-USER][INFO] Code d'accès mis à jour et email envoyé:",
          {
            email,
            emailSent,
          }
        );

        return res.status(200).json({
          success: true,
          message: `Code d'accès mis à jour avec succès. Le nouveau code a été envoyé par email à ${email}.`,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          emailSent: emailSent,
        });
      }

      // Si c'est un utilisateur normal et une nouvelle demande d'accès, on refuse (doublon réel)
      return res.status(400).json({
        success: false,
        message: "Un compte utilisateur existe déjà avec cet email.",
      });
    }

    // Si l'utilisateur n'existe pas, créer un nouveau compte utilisateur normal
    console.log(
      "[CREATE-USER][INFO] Création nouveau compte utilisateur:",
      email
    );

    // Générer un code d'accès aléatoire (6 caractères)
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Hasher le code d'accès pour le stocker en base (au lieu du mot de passe)
    const hashedAccessCode = await bcrypt.hash(accessCode, 10);

    // Créer l'utilisateur avec le code d'accès hashé
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, created_at) 
       VALUES ($1, $2, $3, 'user', CURRENT_TIMESTAMP) RETURNING id, name, email, role`,
      [name, email, hashedAccessCode]
    );

    // Envoyer le code d'accès par email
    const emailSent = await sendMail({
      to: email,
      subject: "Votre code d'accès - ITS Service",
      text: `Bonjour ${name},\n\nVotre demande d'accès a été approuvée !\n\nVoici vos identifiants de connexion :\n\nEmail : ${email}\nCode d'accès : ${accessCode}\n\nVous pouvez maintenant vous connecter sur la plateforme.\n\nCordialement,\nL'équipe ITS Service`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">Accès Approuvé - ITS Service</h2>
          
          <p>Bonjour <strong>${name}</strong>,</p>
          
          <p style="color: #059669; font-weight: bold;">✅ Votre demande d'accès a été approuvée !</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">🔐 Vos identifiants de connexion :</h3>
            
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Code d'accès :</strong> <span style="font-size: 1.2em; font-weight: bold; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">${accessCode}</span></p>
          </div>
          
          <p>Vous pouvez maintenant vous connecter sur la plateforme en utilisant votre email et le code d'accès fourni.</p>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
            Cordialement,<br>
            L'équipe ITS Service
          </p>
        </div>
      `,
    });

    if (!emailSent) {
      console.log("[CREATE-USER][WARNING] Échec envoi email, mais compte créé");
    } else {
      console.log(
        "[CREATE-USER][INFO] Email avec code d'accès envoyé à:",
        email
      );
    }

    // Mettre à jour la demande d'accès
    await pool.query(
      `UPDATE access_requests 
       SET status = 'approved', processed_at = CURRENT_TIMESTAMP, processed_by = 'admin'
       WHERE email = $1`,
      [email]
    );

    console.log("[CREATE-USER][API] Compte créé avec succès:", result.rows[0]);

    res.status(201).json({
      success: true,
      message: `Compte utilisateur créé avec succès. Le code d'accès a été envoyé par email à ${email}.`,
      user: result.rows[0],
      emailSent: emailSent,
    });
  } catch (err) {
    console.error(
      "[CREATE-USER][API] Erreur lors de la création du compte:",
      err
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du compte.",
    });
  }
});

// Route pour l'authentification admin
app.post("/api/admin-login", async (req, res) => {
  const { email, password } = req.body;

  console.log("[ADMIN-LOGIN][API] Tentative de connexion admin:", { email });

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email et mot de passe requis.",
    });
  }

  try {
    // Rechercher l'utilisateur admin
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role = 'admin'",
      [email]
    );

    if (result.rows.length === 0) {
      console.log("[ADMIN-LOGIN][API] Admin non trouvé pour:", email);
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects ou accès non autorisé.",
      });
    }

    const admin = result.rows[0];

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      console.log("[ADMIN-LOGIN][API] Mot de passe incorrect pour:", email);
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects.",
      });
    }

    // Connexion réussie
    console.log("[ADMIN-LOGIN][API] Connexion admin réussie:", {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    });

    res.json({
      success: true,
      message: "Connexion admin réussie.",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("[ADMIN-LOGIN][API] Erreur lors de la connexion admin:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion.",
    });
  }
});

// Route pour récupérer toutes les demandes d'accès (admin seulement)
app.get("/api/admin/access-requests", async (req, res) => {
  try {
    // S'assurer que la table existe
    await ensureAccessRequestsTable();

    const result = await pool.query(
      `SELECT id, name, email, request_date, status, created_at, processed_at, processed_by, request_type, actor_type, role, societe, justification
       FROM access_requests 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      requests: result.rows,
    });
  } catch (err) {
    console.error("[ADMIN-ACCESS-REQUESTS][API] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des demandes.",
    });
  }
});

// =================== FONCTIONS UTILITAIRES ===================

/**
 * Générer un code d'accès aléatoire
 */
function generateAccessCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Envoyer un code d'accès par email
 */
async function sendAccessCodeEmail(userEmail, userName, accessCode) {
  const transporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: "batienemohamed330@gmail.com",
      pass: "mnmf xtsi nkot ggdn",
    },
  });

  const mailOptions = {
    from: "batienemohamed330@gmail.com",
    to: userEmail,
    subject: "Code d'accès - Plateforme ITS Service",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3c72;">Votre demande d'accès a été approuvée !</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Votre demande d'accès à la plateforme ITS Service a été approuvée avec succès.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e3c72; margin-top: 0;">Votre code d'accès :</h3>
          <div style="font-size: 24px; font-weight: bold; color: #2563eb; background-color: white; padding: 15px; border-radius: 5px; text-align: center; letter-spacing: 2px;">
            ${accessCode}
          </div>
        </div>
        <p><strong>Instructions :</strong></p>
        <ol>
          <li>Rendez-vous sur la page de connexion</li>
          <li>Saisissez votre email : ${userEmail}</li>
          <li>Entrez votre code d'accès : <strong>${accessCode}</strong></li>
          <li>Cliquez sur "Se connecter"</li>
        </ol>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Ce code d'accès est personnel et confidentiel. Ne le partagez avec personne.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Équipe ITS Service<br>
          Ce message a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// =================== ROUTES D'ADMINISTRATION ===================

// Route pour traiter une demande d'accès (approuver/rejeter)
app.post("/api/admin/process-request", async (req, res) => {
  const { requestId, action, adminEmail } = req.body; // action: 'approve' ou 'reject'

  console.log("[ADMIN-PROCESS][API] Traitement de demande:", {
    requestId,
    action,
    adminEmail,
  });

  if (!requestId || !action || !adminEmail) {
    return res.status(400).json({
      success: false,
      message: "ID de demande, action et email admin requis.",
    });
  }

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Action non valide. Utilisez 'approve' ou 'reject'.",
    });
  }

  try {
    // Vérifier que la demande existe et est en attente
    const requestResult = await pool.query(
      "SELECT * FROM access_requests WHERE id = $1 AND status = 'pending'",
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Demande introuvable ou déjà traitée.",
      });
    }

    const request = requestResult.rows[0];
    const newStatus = action === "approve" ? "approved" : "rejected";

    // Mettre à jour le statut de la demande
    await pool.query(
      `UPDATE access_requests 
       SET status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2 
       WHERE id = $3`,
      [newStatus, adminEmail, requestId]
    );

    // Si la demande est approuvée, générer et envoyer un code d'accès
    if (action === "approve") {
      try {
        // Générer un code d'accès
        const accessCode = generateAccessCode();

        // Mettre à jour le code d'accès dans la base de données
        await pool.query(
          `UPDATE access_requests SET access_code = $1 WHERE id = $2`,
          [accessCode, requestId]
        );

        // Envoyer le code d'accès par email
        await sendAccessCodeEmail(request.email, request.name, accessCode);

        console.log(`[ADMIN-PROCESS][API] Code d'accès généré et envoyé:`, {
          requestId,
          email: request.email,
          accessCode: accessCode,
        });
      } catch (emailError) {
        console.error(
          "[ADMIN-PROCESS][API] Erreur lors de l'envoi du code d'accès:",
          emailError
        );
        // Ne pas faire échouer la requête même si l'email échoue
      }
    }

    console.log(`[ADMIN-PROCESS][API] Demande ${action}e avec succès:`, {
      requestId,
      email: request.email,
      name: request.name,
    });

    res.json({
      success: true,
      message: `Demande ${
        action === "approve" ? "approuvée" : "rejetée"
      } avec succès.`,
      request: {
        id: requestId,
        status: newStatus,
        name: request.name,
        email: request.email,
      },
    });
  } catch (err) {
    console.error("[ADMIN-PROCESS][API] Erreur lors du traitement:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du traitement de la demande.",
    });
  }
});

// Route pour demander un nouveau code d'accès (code d'accès oublié)
app.post("/api/forgot-access-code", async (req, res) => {
  const { email } = req.body;

  console.log("[FORGOT-ACCESS-CODE][API] Demande de nouveau code:", { email });

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email requis.",
    });
  }

  try {
    // S'assurer que la table existe
    await ensureAccessRequestsTable();

    // Vérifier si l'utilisateur existe déjà avec un accès approuvé
    const userResult = await pool.query(
      "SELECT * FROM access_requests WHERE email = $1 AND status = 'approved' ORDER BY created_at DESC LIMIT 1",
      [email]
    );

    let requestType = "new_access";
    let actorType = null;
    let role = null;

    if (userResult.rows.length > 0) {
      requestType = "forgot_password";
      actorType = userResult.rows[0].actor_type;
      role = userResult.rows[0].role;
    }

    // Créer une nouvelle demande de type "récupération de code"
    const insertResult = await pool.query(
      `INSERT INTO access_requests (name, email, request_date, status, created_at, request_type, actor_type, role) 
       VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP, $4, $5, $6) 
       RETURNING id`,
      [
        userResult.rows.length > 0 ? userResult.rows[0].name : "Utilisateur",
        email,
        new Date().toISOString().split("T")[0],
        requestType,
        actorType,
        role,
      ]
    );

    console.log("[FORGOT-ACCESS-CODE][API] Demande créée avec succès:", {
      requestId: insertResult.rows[0].id,
      email,
      requestType,
    });

    res.json({
      success: true,
      message: "Demande de nouveau code d'accès enregistrée avec succès.",
      requestId: insertResult.rows[0].id,
      requestType,
    });
  } catch (err) {
    console.error("[FORGOT-ACCESS-CODE][API] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'enregistrement de la demande.",
    });
  }
});

// Route pour envoyer un nouveau code d'accès par email (bouton vert admin)
app.post("/api/admin/send-access-code", async (req, res) => {
  const { requestId, adminEmail, email, role } = req.body;

  console.log("[SEND-ACCESS-CODE][API] Requête reçue:", {
    requestId,
    email,
    role,
    adminEmail,
    emailUser: !!process.env.EMAIL_USER,
    emailPass: !!process.env.EMAIL_PASS,
  });

  // Support de deux modes : par requestId OU par email+role
  if (!requestId && (!email || !role)) {
    return res.status(400).json({
      success: false,
      message: "ID de demande OU (email + rôle) requis.",
    });
  }

  try {
    let request = null;

    if (requestId) {
      // Mode 1: Par requestId (mode admin existant) - ENVOI DIRECT DU CODE

      // Générer automatiquement un nouveau code d'accès
      const newPassword = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      console.log(
        "[SEND-ACCESS-CODE][API] Mode admin - envoi direct du code:",
        {
          requestId,
          newGeneratedCode: newPassword,
        }
      );

      const requestResult = await pool.query(
        "SELECT * FROM access_requests WHERE id = $1",
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Demande introuvable.",
        });
      }

      request = requestResult.rows[0];
    } else {
      // Mode 2: Par email + rôle (mode "code oublié") - CRÉER UNE DEMANDE DE VALIDATION
      console.log(
        "[SEND-ACCESS-CODE][API] Mode code oublié - création d'une demande:",
        {
          email,
          role,
        }
      );

      // Vérifier si l'utilisateur a déjà un accès approuvé
      const existingRequestResult = await pool.query(
        `SELECT * FROM access_requests 
         WHERE email = $1 
         AND (request_type = $2 OR actor_type = $2 OR role = $2)
         AND status = 'approved' 
         ORDER BY created_at DESC LIMIT 1`,
        [email, role]
      );

      if (existingRequestResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Aucun accès approuvé trouvé pour cet email et ce rôle.",
        });
      }

      const originalRequest = existingRequestResult.rows[0];

      // Créer une nouvelle demande de type "forgot_code"
      const newRequestResult = await pool.query(
        `INSERT INTO access_requests 
         (name, email, societe, justification, request_type, actor_type, role, status, created_at, request_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'forgot_code', CURRENT_TIMESTAMP, CURRENT_DATE)
         RETURNING id`,
        [
          originalRequest.name,
          originalRequest.email,
          originalRequest.societe,
          "Demande de nouveau code d'accès (code oublié)",
          originalRequest.request_type || role,
          originalRequest.actor_type || role,
          originalRequest.role || role,
        ]
      );

      console.log("[SEND-ACCESS-CODE][API] Demande de code oublié créée:", {
        newRequestId: newRequestResult.rows[0].id,
        email: originalRequest.email,
        role: role,
      });

      return res.json({
        success: true,
        message:
          "Demande de nouveau code d'accès créée. En attente d'approbation par l'administrateur.",
        requestId: newRequestResult.rows[0].id,
        needsApproval: true,
      });
    }

    // Si on arrive ici, c'est le mode admin (requestId) - Continuer avec l'envoi direct du code
    // Générer automatiquement un nouveau code d'accès
    const newPassword = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    // Vérifier si l'utilisateur existe déjà dans la table users
    let userResult = await pool.query("SELECT * FROM users WHERE email = $1", [
      request.email,
    ]);

    // IMPORTANT: Hasher le nouveau code d'accès pour la table users
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (userResult.rows.length > 0) {
      // Mettre à jour le mot de passe existant dans la table users
      await pool.query("UPDATE users SET password = $1 WHERE email = $2", [
        hashedPassword,
        request.email,
      ]);
      console.log(
        "[SEND-ACCESS-CODE][DEBUG] Table users mise à jour pour:",
        request.email
      );
    } else {
      // Créer un nouveau utilisateur
      await pool.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, 'user')`,
        [request.name, request.email, hashedPassword]
      );
      console.log(
        "[SEND-ACCESS-CODE][DEBUG] Nouvel utilisateur créé dans table users pour:",
        request.email
      );
    }

    // Si on est en mode requestId, marquer la demande comme approuvée
    if (requestId) {
      await pool.query(
        `UPDATE access_requests 
         SET status = 'approved', processed_at = CURRENT_TIMESTAMP, processed_by = $1, access_code = $2 
         WHERE id = $3`,
        [adminEmail || "system", newPassword, requestId]
      );
    }

    // Mettre à jour TOUS les enregistrements approuvés de cet utilisateur avec le nouveau code
    const updateResult = await pool.query(
      `UPDATE access_requests 
       SET access_code = $1 
       WHERE email = $2 AND status = 'approved'`,
      [newPassword, request.email]
    );

    console.log("[SEND-ACCESS-CODE][DEBUG] Résultat mise à jour globale:", {
      rowCount: updateResult.rowCount,
      newCode: newPassword,
      email: request.email,
    });

    // Vérifier si les variables d'environnement email sont configurées
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(
        "[SEND-ACCESS-CODE][API] Configuration email manquante - simulation d'envoi"
      );

      res.json({
        success: true,
        message:
          "Code d'accès mis à jour avec succès ! (Email non configuré - mode développement)",
        request: {
          id: requestId,
          email: request.email,
          name: request.name,
          newPassword: newPassword,
        },
      });
      return;
    }

    // Envoyer l'email avec le nouveau code d'accès
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: request.email,
      subject: "Votre nouveau code d'accès - ITS Service",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center;">
            <h1>ITS Service</h1>
            <h2>Votre nouveau code d'accès</h2>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <p>Bonjour <strong>${request.name}</strong>,</p>
            <p>Votre demande de nouveau code d'accès a été approuvée.</p>
            
            <div style="background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #1e40af; margin-bottom: 10px;">Votre nouveau code d'accès :</h3>
              <div style="background: #fbbf24; color: #1e40af; font-family: monospace; font-size: 18px; font-weight: bold; padding: 15px; border-radius: 5px; letter-spacing: 2px;">
                ${newPassword}
              </div>
            </div>
            
            <p><strong>Informations de connexion :</strong></p>
            <ul>
              <li><strong>Email :</strong> ${request.email}</li>
              <li><strong>Code d'accès :</strong> ${newPassword}</li>
            </ul>
            
            <p>Vous pouvez maintenant vous connecter à votre espace ITS Service avec ces identifiants.</p>
            
            <div style="background: #fef3cd; border: 1px solid #fbbf24; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <strong>Important :</strong> Pour des raisons de sécurité, conservez ce code d'accès en lieu sûr et ne le partagez avec personne.
            </div>
          </div>
          <div style="background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ITS Service - Service de Transit</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("[SEND-ACCESS-CODE][API] Email envoyé avec succès:", {
      requestId,
      email: request.email,
      adminEmail,
    });

    res.json({
      success: true,
      message: "Nouveau code d'accès envoyé par email avec succès.",
      request: {
        id: requestId,
        email: request.email,
        name: request.name,
      },
    });
  } catch (err) {
    console.error("[SEND-ACCESS-CODE][API] Erreur détaillée:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      requestId,
      adminEmail,
    });
    res.status(500).json({
      success: false,
      message: `Erreur serveur lors de l'envoi du code d'accès: ${err.message}`,
      error: err.code || "UNKNOWN_ERROR",
    });
  }
});

// Endpoint pour supprimer des demandes d'accès
app.post("/api/admin/delete-requests", async (req, res) => {
  try {
    console.log("[DELETE-REQUESTS][API] Nouvelle demande de suppression...");

    const { requestIds } = req.body;

    // Validation des données
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Liste des IDs de demandes requise et non vide",
      });
    }

    // Validation que tous les IDs sont des nombres
    const validIds = requestIds.filter((id) => !isNaN(parseInt(id)));
    if (validIds.length !== requestIds.length) {
      return res.status(400).json({
        success: false,
        message: "Tous les IDs doivent être des nombres valides",
      });
    }

    console.log("[DELETE-REQUESTS][API] Suppression des demandes:", validIds);

    // Supprimer les demandes de la base de données (syntaxe PostgreSQL)
    const placeholders = validIds.map((_, index) => `$${index + 1}`).join(",");
    const deleteQuery = `DELETE FROM access_requests WHERE id IN (${placeholders})`;

    const result = await pool.query(deleteQuery, validIds);

    console.log("[DELETE-REQUESTS][API] Résultat de la suppression:", {
      affectedRows: result.rowCount || result.affectedRows,
      requestIds: validIds,
    });

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucune demande trouvée avec les IDs fournis",
      });
    }

    res.json({
      success: true,
      message: `${result.rowCount} demande(s) supprimée(s) avec succès`,
      deletedCount: result.rowCount,
      deletedIds: validIds,
    });
  } catch (err) {
    console.error("[DELETE-REQUESTS][API] Erreur:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });

    res.status(500).json({
      success: false,
      message: `Erreur serveur lors de la suppression: ${err.message}`,
      error: err.code || "UNKNOWN_ERROR",
    });
  }
});

// ===============================
// NOUVELLES ROUTES POUR RESPONSABLE ACCONIER
// ===============================

// Route pour recevoir une demande d'accès de Responsable Acconier
app.post("/api/access-request", async (req, res) => {
  const { email, name, actorType, role, requestDate } = req.body;

  console.log("[ACCESS-REQUEST][API] Nouvelle demande d'accès:", {
    email,
    name,
    actorType,
    role,
  });

  if (!email || !actorType) {
    return res.status(400).json({
      success: false,
      message: "Email et type d'acteur requis.",
    });
  }

  try {
    // S'assurer que la table existe
    await ensureAccessRequestsTable();

    // Vérifier si une demande existe déjà pour cet email et ce type d'acteur
    const existingRequest = await pool.query(
      `SELECT id, status FROM access_requests 
       WHERE email = $1 AND request_type = $2 AND status = 'pending'`,
      [email, actorType]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Une demande d'accès est déjà en cours de traitement pour cet email.",
      });
    }

    // Créer la nouvelle demande
    const result = await pool.query(
      `INSERT INTO access_requests (name, email, request_date, status, created_at, request_type, actor_type, role) 
       VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP, $4, $5, $6) 
       RETURNING id`,
      [
        name || email.split("@")[0],
        email,
        new Date().toISOString(),
        actorType,
        actorType,
        role || "Responsable Acconier",
      ]
    );

    console.log("[ACCESS-REQUEST][API] Demande créée avec succès:", {
      requestId: result.rows[0].id,
      email,
      actorType,
    });

    res.json({
      success: true,
      message:
        "Demande d'accès envoyée avec succès ! Vous recevrez un code d'accès par email une fois approuvée.",
      requestId: result.rows[0].id,
    });
  } catch (err) {
    console.error("[ACCESS-REQUEST][API] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'enregistrement de la demande.",
    });
  }
});

// Route pour recevoir une demande d'accès de Responsable de Livraison
app.post("/api/admin/access-request", async (req, res) => {
  const { nom, email, role } = req.body;

  console.log(
    "[ADMIN-ACCESS-REQUEST][API] Nouvelle demande d'accès responsable livraison:",
    {
      nom,
      email,
      role,
    }
  );

  if (!nom || !email) {
    return res.status(400).json({
      success: false,
      message: "Nom et email requis.",
    });
  }

  try {
    // S'assurer que la table existe
    await ensureAccessRequestsTable();

    // Vérifier si une demande existe déjà pour cet email
    const existingRequest = await pool.query(
      `SELECT id, status FROM access_requests 
       WHERE email = $1 AND request_type = $2 AND status = 'pending'`,
      [email, "responsable_livraison"]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Une demande d'accès est déjà en cours de traitement pour cet email.",
      });
    }

    // Créer la nouvelle demande
    const result = await pool.query(
      `INSERT INTO access_requests (name, email, request_date, status, created_at, request_type, actor_type, role) 
       VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP, $4, $5, $6) 
       RETURNING id`,
      [
        nom,
        email,
        new Date().toISOString(),
        "responsable_livraison",
        "responsable_livraison",
        role || "Responsable de Livraison",
      ]
    );

    console.log("[ADMIN-ACCESS-REQUEST][API] Demande créée avec succès:", {
      requestId: result.rows[0].id,
      email,
      nom,
    });

    res.json({
      success: true,
      message:
        "Demande d'accès envoyée avec succès ! Vous recevrez votre code d'accès par email une fois approuvé.",
      requestId: result.rows[0].id,
    });
  } catch (err) {
    console.error("[ADMIN-ACCESS-REQUEST][API] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'enregistrement de la demande.",
    });
  }
});

// Route pour les demandes de code d'accès oublié
app.post("/api/forgot-access-code", async (req, res) => {
  const { email, name, actorType, role, requestType } = req.body;

  console.log("[FORGOT-CODE][API] Nouvelle demande de code oublié:", {
    email,
    name,
    actorType,
    role,
    requestType,
  });

  if (!email || !name || !actorType) {
    return res.status(400).json({
      success: false,
      message: "Email, nom et type d'acteur requis.",
    });
  }

  try {
    // Vérifier que la demande existe et est approuvée
    const existingRequest = await pool.query(
      `SELECT * FROM access_requests 
       WHERE email = $1 AND status = 'approved' AND (actor_type = $2 OR request_type = $2 OR actorType = $2)
       ORDER BY created_at DESC LIMIT 1`,
      [email, actorType]
    );

    if (existingRequest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Aucun compte approuvé trouvé pour cet email. Veuillez d'abord faire une demande d'accès.",
      });
    }

    // Vérifier la table access_requests
    await ensureAccessRequestsTable();

    // Créer une nouvelle demande de type "forgot_code"
    const result = await pool.query(
      `INSERT INTO access_requests (email, name, request_date, status, request_type, actor_type, role) 
       VALUES ($1, $2, CURRENT_DATE, 'pending', 'forgot_code', $3, $4) 
       RETURNING id`,
      [email, name, actorType, role || "Responsable Acconier"]
    );

    console.log("[FORGOT-CODE][API] Demande créée avec succès:", {
      requestId: result.rows[0].id,
      email,
      actorType,
      requestType: "forgot_code",
    });

    res.json({
      success: true,
      message:
        "Demande de nouveau code d'accès envoyée ! Un administrateur la traitera bientôt.",
      requestId: result.rows[0].id,
    });
  } catch (err) {
    console.error("[FORGOT-CODE][API] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'enregistrement de la demande.",
    });
  }
});

// Route pour la connexion des Responsables Acconier
app.post("/api/acconier-login", async (req, res) => {
  const { email, accessCode, actorType } = req.body;

  console.log("[ACCONIER-LOGIN][API] Tentative de connexion:", {
    email,
    actorType,
    hasAccessCode: !!accessCode,
    accessCodeValue: accessCode,
  });

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email requis.",
    });
  }

  if (!accessCode) {
    return res.status(400).json({
      success: false,
      message: "Code d'accès requis pour la connexion.",
    });
  }

  try {
    // Rechercher l'utilisateur avec ce type d'acteur - privilégier les comptes approuvés avec access_code
    const userResult = await pool.query(
      `SELECT ar.*, u.name, u.email 
       FROM access_requests ar 
       LEFT JOIN users u ON ar.email = u.email 
       WHERE ar.email = $1 AND ar.actor_type = $2 AND ar.status = 'approved' AND ar.access_code IS NOT NULL
       ORDER BY ar.created_at DESC
       LIMIT 1`,
      [email, actorType]
    );

    console.log("[ACCONIER-LOGIN][API] Résultat de recherche:", {
      email,
      actorType,
      foundUsers: userResult.rows.length,
      users: userResult.rows.map((user) => ({
        id: user.id,
        email: user.email,
        status: user.status,
        hasAccessCode: !!user.access_code,
        accessCode: user.access_code,
      })),
    });

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Aucune demande d'accès trouvée pour cet email. Veuillez d'abord faire une demande d'accès.",
      });
    }

    const user = userResult.rows[0];

    // Vérifier si l'accès est approuvé
    if (user.status !== "approved") {
      if (user.status === "pending") {
        return res.status(401).json({
          success: false,
          message:
            "Votre demande d'accès est en cours de traitement. Veuillez patienter.",
        });
      } else if (user.status === "rejected") {
        return res.status(401).json({
          success: false,
          message:
            "Votre demande d'accès a été rejetée. Contactez l'administrateur.",
        });
      }
    }

    // Vérifier le code d'accès depuis la base de données
    if (!user.access_code) {
      return res.status(401).json({
        success: false,
        message:
          "Aucun code d'accès généré pour ce compte. Contactez l'administrateur.",
      });
    }

    if (accessCode !== user.access_code) {
      console.log("[ACCONIER-LOGIN][API] Code incorrect:", {
        fourni: accessCode,
        attendu: user.access_code,
        email,
      });

      return res.status(401).json({
        success: false,
        message: "Code d'accès incorrect.",
      });
    }

    // Mettre à jour la dernière connexion
    await pool.query(
      `UPDATE access_requests SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    console.log("[ACCONIER-LOGIN][API] Connexion réussie:", {
      email,
      actorType,
      userId: user.id,
    });

    res.json({
      success: true,
      message: "Connexion réussie !",
      user: {
        id: user.id,
        name: user.name || user.email.split("@")[0],
        email: user.email,
        actorType: user.actor_type,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[ACCONIER-LOGIN][API] Erreur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion.",
    });
  }
});

// POST deliveries/validate
app.post(
  "/deliveries/validate",
  upload.single("client_signature_photo"),
  async (req, res) => {
    console.log("------------------------------------------");
    console.log("Requête POST /deliveries/validate reçue.");
    console.log("req.body AVANT déstructuration:", req.body);
    console.log("req.file (si upload.single est utilisé):", req.file);
    console.log("------------------------------------------");

    const {
      employee_name,
      client_name,
      client_phone,
      container_type_and_content,
      status, // This 'status' is the initial status from the employee form
      lieu,
      container_number,
      container_foot_type,
      declaration_number,
      number_of_containers,
      bl_number,
      dossier_number,
      shipping_company,
      transporter,
      weight,
      ship_name,
      circuit,
      number_of_packages,
      transporter_mode,
      driver_name,
      driver_phone,
      truck_registration,
      delivery_notes,
      // NOUVEAUX CHAMPS DÉSTRUCTURÉS
      nom_agent_visiteur,
      inspecteur,
      agent_en_douanes,
      delivery_status_acconier,
    } = req.body || {};

    // Use helper functions to process date and time
    const validated_delivery_date = formatDateForDB(req.body.delivery_date);
    const validated_delivery_time = formatTimeForDB(req.body.delivery_time);

    // --- NORMALISATION DU CHAMP container_number ---
    let normalized_container_number = container_number;
    if (Array.isArray(container_number)) {
      // Si c'est un tableau (ex : envoyé par le formulaire en JSON), on join avec des virgules
      normalized_container_number = container_number.filter(Boolean).join(",");
    } else if (typeof container_number === "string") {
      // Vérifier si c'est un texte affiché tronqué du style "FYCH1234567 + 1 autres"
      if (
        container_number.includes(" + ") &&
        container_number.includes(" autres")
      ) {
        // Dans ce cas, utiliser plutôt container_numbers_list si disponible
        if (req.body.container_numbers_list) {
          try {
            let fullList = [];
            if (typeof req.body.container_numbers_list === "string") {
              fullList = JSON.parse(req.body.container_numbers_list);
            } else if (Array.isArray(req.body.container_numbers_list)) {
              fullList = req.body.container_numbers_list;
            }
            normalized_container_number = fullList.filter(Boolean).join(",");
          } catch (e) {
            console.warn(
              "Erreur parsing container_numbers_list pour normalisation:",
              e
            );
            // Fallback : extraire juste le premier TC
            const firstTC = container_number.split(" + ")[0].trim();
            normalized_container_number = firstTC;
          }
        } else {
          // Fallback : extraire juste le premier TC
          const firstTC = container_number.split(" + ")[0].trim();
          normalized_container_number = firstTC;
        }
      } else {
        // Nettoyage normal des espaces et séparateurs multiples
        normalized_container_number = container_number
          .split(/[,;\s]+/)
          .filter(Boolean)
          .join(",");
      }
    } else {
      normalized_container_number = "";
    }

    const is_eir_received = !!req.file;

    // Validation des champs obligatoires (MIS À JOUR)
    if (
      !employee_name ||
      !client_name ||
      //     !container_type_and_content ||
      !lieu ||
      !normalized_container_number ||
      !container_foot_type ||
      !declaration_number ||
      !number_of_containers
      // Temporairement, on rend dossier_number optionnel pour diagnostiquer
      // !dossier_number
    ) {
      console.error("Validation failed: Missing required fields in backend.", {
        employee_name,
        delivery_date: validated_delivery_date, // Use validated value for log
        delivery_time: validated_delivery_time, // Use validated value for log
        client_name,
        client_phone,
        container_type_and_content,
        status,
        lieu,
        container_number: normalized_container_number,
        container_foot_type,
        declaration_number,
        number_of_containers,
      });
      return res.status(400).json({
        success: false,
        message:
          "Tous les champs obligatoires (hors date et heure de livraison qui sont maintenant facultatives) sont requis.",
      });
    }

    // Statuts métier autorisés pour l'acconier
    const allowedStatuses = [
      "awaiting_payment_acconier",
      "in_progress_payment_acconier",
      "pending_acconier",
      "mise_en_livraison_acconier",
      "payment_done_acconier",
      "processed_acconier",
      "rejected_acconier",
      "rejected_by_employee",
    ];
    // Si le statut n'est pas fourni ou invalide, on force la valeur par défaut
    let usedStatus = status;
    if (!usedStatus || !allowedStatuses.includes(usedStatus)) {
      usedStatus = "awaiting_payment_acconier";
    }

    // Traitement des nouveaux champs pour gérer les TC multiples
    let full_container_numbers_list = [];
    let container_foot_types_map = null;

    // Traitement du nouveau champ container_numbers_list (liste complète des TC)
    if (req.body.container_numbers_list) {
      try {
        if (typeof req.body.container_numbers_list === "string") {
          full_container_numbers_list = JSON.parse(
            req.body.container_numbers_list
          );
        } else if (Array.isArray(req.body.container_numbers_list)) {
          full_container_numbers_list = req.body.container_numbers_list;
        }
      } catch (e) {
        console.warn("Erreur parsing container_numbers_list:", e);
        full_container_numbers_list = [];
      }
    }

    // Traitement du nouveau champ container_foot_types_map (mapping complet TC/type/poids)
    if (req.body.container_foot_types_map) {
      try {
        if (typeof req.body.container_foot_types_map === "string") {
          container_foot_types_map = JSON.parse(
            req.body.container_foot_types_map
          );
        } else {
          container_foot_types_map = req.body.container_foot_types_map;
        }
      } catch (e) {
        console.warn("Erreur parsing container_foot_types_map:", e);
        container_foot_types_map = null;
      }
    }

    // Si nous n'avons pas la liste complète, essayer de l'extraire du champ normalized_container_number
    if (
      full_container_numbers_list.length === 0 &&
      normalized_container_number
    ) {
      // Ne pas refaire un split sur normalized_container_number s'il provient déjà de container_numbers_list
      // Vérifier d'abord si le container_number original était tronqué
      if (
        container_number &&
        container_number.includes(" + ") &&
        container_number.includes(" autres")
      ) {
        // Dans ce cas, full_container_numbers_list devrait déjà être rempli par la normalisation ci-dessus
        // Si ce n'est pas le cas, utiliser le premier TC seulement
        if (full_container_numbers_list.length === 0) {
          full_container_numbers_list = [normalized_container_number];
        }
      } else {
        // Cas normal : extraire les TC du champ normalisé
        const tcList = normalized_container_number
          .split(/[,;\s]+/)
          .filter(Boolean);
        full_container_numbers_list = tcList;
      }
    }

    try {
      // Gestion du tableau de statuts par conteneur (container_statuses)
      let container_statuses = null;
      if (req.body.container_statuses) {
        if (typeof req.body.container_statuses === "string") {
          try {
            container_statuses = JSON.parse(req.body.container_statuses);
          } catch (e) {
            container_statuses = null;
          }
        } else {
          container_statuses = req.body.container_statuses;
        }
        // Si c'est un tableau, on le convertit en mapping
        if (Array.isArray(container_statuses)) {
          const tcList =
            full_container_numbers_list.length > 0
              ? full_container_numbers_list
              : normalized_container_number
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
          const mapping = {};
          tcList.forEach((tc, idx) => {
            mapping[tc] = container_statuses[idx] || usedStatus;
          });
          container_statuses = mapping;
        }
      } else {
        // Génère un mapping par défaut avec un statut NEUTRE ("En attente") sauf si le statut global est explicitement "Livré" ou "delivered"
        const tcList =
          full_container_numbers_list.length > 0
            ? full_container_numbers_list
            : normalized_container_number
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        if (tcList.length > 0) {
          const mapping = {};
          // Statut neutre par défaut
          let defaultStatus = "pending";
          if (
            [
              "livré",
              "livree",
              "delivered",
              "completed",
              "finished",
              "signed",
            ].includes(String(usedStatus).toLowerCase())
          ) {
            defaultStatus = "delivered";
          }
          tcList.forEach((tc) => {
            mapping[tc] = defaultStatus;
          });
          container_statuses = mapping;
        }
      }

      // Vérifier si les colonnes JSON et d'échange existent avant de les utiliser
      const columnsCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'livraison_conteneur' 
        AND column_name IN ('container_numbers_list', 'container_foot_types_map', 'date_echange_bl')
      `);

      const hasJsonColumns = columnsCheck.rows.some((row) =>
        ["container_numbers_list", "container_foot_types_map"].includes(
          row.column_name
        )
      );
      const hasDateEchangeBL = columnsCheck.rows.some(
        (row) => row.column_name === "date_echange_bl"
      );

      let query, values;

      if (hasJsonColumns && hasDateEchangeBL) {
        // Si les colonnes JSON existent, les inclure dans l'INSERT (date_echange_bl sera automatiquement créée)
        query = `
          INSERT INTO livraison_conteneur (
            employee_name, delivery_date, delivery_time, client_name, client_phone, 
            container_type_and_content, lieu, status,
            container_number, container_foot_type, declaration_number, number_of_containers,
            bl_number, dossier_number, shipping_company, transporter, 
            weight, ship_name, circuit, number_of_packages, transporter_mode,
            nom_agent_visiteur, inspecteur, agent_en_douanes,
            driver_name, driver_phone, truck_registration,
            delivery_notes, is_eir_received,
            delivery_status_acconier,
            container_statuses, container_numbers_list, container_foot_types_map,
            date_echange_bl
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)
          RETURNING *;
        `;
        values = [
          employee_name,
          validated_delivery_date,
          validated_delivery_time,
          client_name,
          client_phone,
          container_type_and_content,
          lieu,
          usedStatus,
          normalized_container_number,
          container_foot_type,
          declaration_number,
          parseInt(number_of_containers, 10),
          bl_number || null,
          dossier_number || null,
          shipping_company || null,
          transporter || null,
          weight || null,
          ship_name || null,
          circuit || null,
          number_of_packages ? parseInt(number_of_packages, 10) : null,
          transporter_mode || null,
          nom_agent_visiteur || null,
          inspecteur || null,
          agent_en_douanes || null,
          driver_name || null,
          driver_phone || null,
          truck_registration || null,
          delivery_notes || null,
          is_eir_received,
          delivery_status_acconier || usedStatus,
          container_statuses ? JSON.stringify(container_statuses) : null,
          full_container_numbers_list.length > 0
            ? JSON.stringify(full_container_numbers_list)
            : null,
          container_foot_types_map
            ? JSON.stringify(container_foot_types_map)
            : null,
          new Date(), // DERNIER ELEMENT - PAS DE VIRGULE
        ];
      } else if (hasJsonColumns) {
        // Si seules les colonnes JSON existent (sans date_echange)
        query = `
          INSERT INTO livraison_conteneur (
            employee_name, delivery_date, delivery_time, client_name, client_phone, 
            container_type_and_content, lieu, status,
            container_number, container_foot_type, declaration_number, number_of_containers,
            bl_number, dossier_number, shipping_company, transporter, 
            weight, ship_name, circuit, number_of_packages, transporter_mode,
            nom_agent_visiteur, inspecteur, agent_en_douanes,
            driver_name, driver_phone, truck_registration,
            delivery_notes, is_eir_received,
            delivery_status_acconier,
            container_statuses, container_numbers_list, container_foot_types_map
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
          RETURNING *;
        `;
        values = [
          employee_name,
          validated_delivery_date,
          validated_delivery_time,
          client_name,
          client_phone,
          container_type_and_content,
          lieu,
          usedStatus,
          normalized_container_number,
          container_foot_type,
          declaration_number,
          parseInt(number_of_containers, 10),
          bl_number || null,
          dossier_number || null,
          shipping_company || null,
          transporter || null,
          weight || null,
          ship_name || null,
          circuit || null,
          number_of_packages ? parseInt(number_of_packages, 10) : null,
          transporter_mode || null,
          nom_agent_visiteur || null,
          inspecteur || null,
          agent_en_douanes || null,
          driver_name || null,
          driver_phone || null,
          truck_registration || null,
          delivery_notes || null,
          is_eir_received,
          delivery_status_acconier || usedStatus,
          container_statuses ? JSON.stringify(container_statuses) : null,
          full_container_numbers_list.length > 0
            ? JSON.stringify(full_container_numbers_list)
            : null,
          container_foot_types_map
            ? JSON.stringify(container_foot_types_map)
            : null,
        ];
      } else if (hasDateEchangeBL) {
        // Si seule la colonne date_echange_bl existe (sans colonnes JSON)
        query = `
          INSERT INTO livraison_conteneur (
            employee_name, delivery_date, delivery_time, client_name, client_phone, 
            container_type_and_content, lieu, status,
            container_number, container_foot_type, declaration_number, number_of_containers,
            bl_number, dossier_number, shipping_company, transporter, 
            weight, ship_name, circuit, number_of_packages, transporter_mode,
            nom_agent_visiteur, inspecteur, agent_en_douanes,
            driver_name, driver_phone, truck_registration,
            delivery_notes, is_eir_received,
            delivery_status_acconier,
            container_statuses,
            date_echange_bl
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, CURRENT_DATE)
          RETURNING *;
        `;
        values = [
          employee_name,
          validated_delivery_date,
          validated_delivery_time,
          client_name,
          client_phone,
          container_type_and_content,
          lieu,
          usedStatus,
          normalized_container_number,
          container_foot_type,
          declaration_number,
          parseInt(number_of_containers, 10),
          bl_number || null,
          dossier_number || null,
          shipping_company || null,
          transporter || null,
          weight || null,
          ship_name || null,
          circuit || null,
          number_of_packages ? parseInt(number_of_packages, 10) : null,
          transporter_mode || null,
          nom_agent_visiteur || null,
          inspecteur || null,
          agent_en_douanes || null,
          driver_name || null,
          driver_phone || null,
          truck_registration || null,
          delivery_notes || null,
          is_eir_received,
          delivery_status_acconier || usedStatus,
          container_statuses ? JSON.stringify(container_statuses) : null,
        ];
      } else {
        // Si ni les colonnes JSON ni date_echange_bl n'existent, utiliser l'ancienne requête
        query = `
          INSERT INTO livraison_conteneur (
            employee_name, delivery_date, delivery_time, client_name, client_phone, 
            container_type_and_content, lieu, status,
            container_number, container_foot_type, declaration_number, number_of_containers,
            bl_number, dossier_number, shipping_company, transporter, 
            weight, ship_name, circuit, number_of_packages, transporter_mode,
            nom_agent_visiteur, inspecteur, agent_en_douanes,
            driver_name, driver_phone, truck_registration,
            delivery_notes, is_eir_received,
            delivery_status_acconier,
            container_statuses
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
          RETURNING *;
        `;
        values = [
          employee_name,
          validated_delivery_date,
          validated_delivery_time,
          client_name,
          client_phone,
          container_type_and_content,
          lieu,
          usedStatus,
          normalized_container_number,
          container_foot_type,
          declaration_number,
          parseInt(number_of_containers, 10),
          bl_number || null,
          dossier_number || null,
          shipping_company || null,
          transporter || null,
          weight || null,
          ship_name || null,
          circuit || null,
          number_of_packages ? parseInt(number_of_packages, 10) : null,
          transporter_mode || null,
          nom_agent_visiteur || null,
          inspecteur || null,
          agent_en_douanes || null,
          driver_name || null,
          driver_phone || null,
          truck_registration || null,
          delivery_notes || null,
          is_eir_received,
          delivery_status_acconier || usedStatus,
          container_statuses ? JSON.stringify(container_statuses) : null,
        ];
      }
      const result = await pool.query(query, values);
      const newDelivery = result.rows[0];

      const wss = req.app.get("wss");
      // Utilisez le nouveau statut acconier pour l'alerte
      const statusInfo = getFrenchStatusWithIcon(
        newDelivery.delivery_status_acconier
      );
      const alertType = statusInfo.customColorClass;

      const alertMessage = `L'agent acconié "${newDelivery.employee_name}" a établi un ordre de livraison.`;

      // ENVOI EMAIL À TOUS LES RESPONSABLES ACCONIER
      try {
        const respRes = await pool.query(
          "SELECT email, nom FROM resp_acconier"
        );
        if (respRes.rows.length > 0) {
          const emailPromises = respRes.rows.map((resp) => {
            return sendMail({
              to: resp.email,
              subject: "Nouvel ordre de livraison établi",
              text: `Bonjour ${resp.nom},\n\nL'agent acconier '${newDelivery.employee_name}' a établi un ordre de livraison. Veuillez procéder à payer l'acconage.`,
              html: `<p>Bonjour <b>${resp.nom}</b>,</p><p>L'agent acconier <b>${newDelivery.employee_name}</b> a établi un <b>ordre de livraison</b>.<br>Veuillez procéder à payer l'acconage.</p>`,
            });
          });
          await Promise.all(emailPromises);
          console.log("Emails envoyés à tous les responsables acconier.");
        } else {
          console.log(
            "Aucun responsable acconier trouvé pour l'envoi d'email."
          );
        }
      } catch (err) {
        console.error(
          "Erreur lors de l'envoi des emails aux responsables acconier:",
          err
        );
      }

      console.log(alertMessage);

      // Envoi pour compatibilité ancienne version (peut être supprimé plus tard)
      // --- ENVOI WEBSOCKET EN TEMPS RÉEL POUR ACCONIER ---
      if (wss && wss.clients) {
        // Correction : type et payload complet pour compatibilité frontend
        const payloadObj = {
          type: "new_delivery_created",
          delivery: newDelivery, // On envoie tout l'objet newDelivery (tous les champs)
        };
        const payload = JSON.stringify(payloadObj);
        let clientCount = 0;
        wss.clients.forEach((client, idx) => {
          try {
            if (client.readyState === require("ws").OPEN) {
              client.send(payload);
              let clientInfo = "";
              if (client._socket && client._socket.remoteAddress) {
                clientInfo = ` [${client._socket.remoteAddress}:${client._socket.remotePort}]`;
              }
              console.log(
                `[WebSocket] new_delivery_notification envoyé au client #${
                  idx + 1
                }${clientInfo}`
              );
              clientCount++;
            } else {
              let clientInfo = "";
              if (client._socket && client._socket.remoteAddress) {
                clientInfo = ` [${client._socket.remoteAddress}:${client._socket.remotePort}]`;
              }
              console.warn(
                `[WebSocket] Client #${
                  idx + 1
                }${clientInfo} non ouvert (readyState=${
                  client.readyState
                }), message ignoré.`
              );
            }
          } catch (e) {
            let clientInfo = "";
            if (client._socket && client._socket.remoteAddress) {
              clientInfo = ` [${client._socket.remoteAddress}:${client._socket.remotePort}]`;
            }
            console.error(
              `[WebSocket] Erreur lors de l'envoi à client #${
                idx + 1
              }${clientInfo} :`,
              e
            );
          }
        });
        console.log(
          `[WebSocket] new_delivery_notification envoyé à ${clientCount} client(s) sur ${wss.clients.size} connecté(s).`
        );

        // --- ENVOI WEBSOCKET SPÉCIFIQUE POUR LA DATE D'ÉCHANGE BL ---
        if (newDelivery.date_echange_bl && newDelivery.id) {
          const dateEchangeBlPayload = {
            type: "date_echange_bl_update",
            deliveryId: newDelivery.id,
            dateEchangeBl: newDelivery.date_echange_bl,
            timestamp: new Date().toISOString(),
          };
          const datePayload = JSON.stringify(dateEchangeBlPayload);
          let dateClientCount = 0;
          wss.clients.forEach((client, idx) => {
            try {
              if (client.readyState === require("ws").OPEN) {
                client.send(datePayload);
                let clientInfo = "";
                if (client._socket && client._socket.remoteAddress) {
                  clientInfo = ` [${client._socket.remoteAddress}:${client._socket.remotePort}]`;
                }
                console.log(
                  `[WebSocket] date_echange_bl_update envoyé au client #${
                    idx + 1
                  }${clientInfo}`
                );
                dateClientCount++;
              }
            } catch (e) {
              let clientInfo = "";
              if (client._socket && client._socket.remoteAddress) {
                clientInfo = ` [${client._socket.remoteAddress}:${client._socket.remotePort}]`;
              }
              console.error(
                `[WebSocket] Erreur lors de l'envoi date_echange_bl_update à client #${
                  idx + 1
                }${clientInfo} :`,
                e
              );
            }
          });
          console.log(
            `[WebSocket] date_echange_bl_update envoyé à ${dateClientCount} client(s) sur ${wss.clients.size} connecté(s).`
          );
        }
      }

      // RETIRÉ : L'envoi de la liste des agents n'est plus déclenché ici
      // await broadcastAgentList(wss);

      res.status(201).json({
        success: true,
        message: "Statut de livraison enregistré avec succès !",
        delivery: newDelivery,
      });
    } catch (err) {
      console.error(
        "Erreur lors de l'enregistrement du statut de livraison :",
        err
      );
      console.error("Détail de l'erreur SQL:", err.message);
      console.error("Code d'erreur:", err.code);
      console.error("Contrainte violée:", err.constraint);
      res.status(500).json({
        success: false,
        message:
          "Erreur serveur lors de l'enregistrement du statut de livraison.",
        details: err.message, // Ajout du détail de l'erreur pour le debugging
      });
    }
  }
);

// GET delivery by container number, BL number, or dossier number
app.get("/deliveries/search", async (req, res) => {
  const { containerNumber, blNumber, dossierNumber } = req.query;

  if (!containerNumber && !blNumber && !dossierNumber) {
    return res.status(400).json({
      success: false,
      message:
        "Au moins un critère de recherche (containerNumber, blNumber, ou dossierNumber) est requis.",
    });
  }

  let query = `
        SELECT 
          id, employee_name, delivery_date, delivery_time, client_name, client_phone, 
          container_type_and_content, lieu, status, created_at,
          container_number, container_foot_type, declaration_number, number_of_containers,
          bl_number, dossier_number, shipping_company, transporter, 
          weight, ship_name, circuit, number_of_packages, transporter_mode,
          nom_agent_visiteur, inspecteur, agent_en_douanes, -- NOUVELLES COLONNES DANS LE SELECT
          driver_name, driver_phone, truck_registration,
          delivery_notes, is_eir_received,
          delivery_status_acconier, observation_acconier -- AJOUT DES COLONNES ICI
        FROM livraison_conteneur
        WHERE 1 = 1
    `;
  const values = [];
  let paramIndex = 1;

  if (containerNumber) {
    query += ` AND container_number ILIKE $${paramIndex}`;
    values.push(`%${containerNumber}%`);
    paramIndex++;
  }
  if (blNumber) {
    query += ` AND bl_number ILIKE $${paramIndex}`;
    values.push(`%${blNumber}%`);
    paramIndex++;
  }
  if (dossierNumber) {
    query += ` AND dossier_number ILIKE $${paramIndex}`;
    values.push(`%${dossierNumber}%`);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT 1;`; // Limite à la dernière entrée si plusieurs correspondent

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Aucune livraison trouvée." });
    }
    // Ajout du champ traduit
    const delivery = result.rows[0];
    delivery.delivery_status_acconier_fr = mapAcconierStatusToFr(
      delivery.delivery_status_acconier
    );
    // Champ status TOUJOURS en français côté frontend
    delivery.status = translateStatusToFr(delivery.status);
    res.status(200).json({ success: true, delivery });
  } catch (err) {
    console.error("Erreur lors de la recherche de livraison :", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la recherche de livraison.",
    });
  }
});

// SUPPRESSION DE LA ROUTE DUPLIQUÉE - Cette route était en conflit avec la première route /deliveries/status
// La première route (ligne 1847) est conservée car 11elle inclut les champs JSON nécessaires
// PATCH GET /deliveries/status
/*
app.get("/deliveries/status", async (req, res) => {
  try {
    const query = `
      SELECT 
        lc.id, lc.employee_name, lc.delivery_date, lc.delivery_time, lc.client_name, lc.client_phone, 
        lc.container_type_and_content, lc.lieu, lc.status, lc.created_at,
        lc.container_number, lc.container_foot_type, lc.declaration_number, lc.number_of_containers,
        lc.bl_number,
        lc.dossier_number,
        lc.shipping_company,
        lc.transporter, 
        lc.weight, lc.ship_name, lc.circuit, lc.number_of_packages, lc.transporter_mode,
        lc.nom_agent_visiteur, lc.inspecteur, lc.agent_en_douanes,
        lc.driver_name, lc.driver_phone, lc.truck_registration,
        lc.delivery_notes,
        lc.is_eir_received,
        lc.delivery_status_acconier, lc.observation_acconier,
        lc.container_statuses,
        ac.email AS agent_email
      FROM livraison_conteneur lc
      LEFT JOIN acconier ac ON lc.employee_name = ac.nom
      ORDER BY lc.created_at DESC;
    `;
    const result = await pool.query(query);
    const deliveries = result.rows.map((delivery) => {
      // Fonction utilitaire pour traduire le statut CSV ou tableau
      function translateStatusCSV(csv) {
        if (!csv) return "-";
        if (typeof csv === "string") {
          return csv
            .split(",")
            .map((s) => translateStatusToFr(s.trim()))
            .join(",");
        }
        if (Array.isArray(csv)) {
          return csv.map((s) => translateStatusToFr(s)).join(",");
        }
        return String(csv);
      }
      // Parse container_statuses si présent
      let container_statuses = {};
      try {
        if (delivery.container_statuses) {
          if (typeof delivery.container_statuses === "string") {
            container_statuses = JSON.parse(delivery.container_statuses);
          } else if (typeof delivery.container_statuses === "object") {
            container_statuses = delivery.container_statuses;
          }
        }
      } catch (e) {
        container_statuses = {};
      }
      // Fallback dynamique si non présent ou mal formé
      if (!container_statuses || Array.isArray(container_statuses)) {
        const tcList = String(delivery.container_number || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const mapping = {};
        tcList.forEach((tc) => {
          mapping[tc] = delivery.status || "-";
        });
        container_statuses = mapping;
      }
      // Ajout du mapping traduit en français pour chaque TC
      let container_statuses_fr = {};
      if (container_statuses && typeof container_statuses === "object") {
        Object.entries(container_statuses).forEach(([tc, statut]) => {
          container_statuses_fr[tc] = translateStatusToFr(statut);
        });
      }
      // Correction : toujours renvoyer les champs attendus, même si vides
      return {
        ...delivery,
        agent_email: delivery.agent_email || null,
        status: delivery.status,
        status_fr: translateStatusCSV(delivery.status),
        delivery_status_acconier_fr: mapAcconierStatusToFr(
          delivery.delivery_status_acconier
        ),
        delivery_status_acconier_csv_fr: translateStatusCSV(
          delivery.delivery_status_acconier
        ),
        container_statuses: container_statuses,
        container_statuses_fr: container_statuses_fr,
      };
    });
    res.status(200).json({ success: true, deliveries });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des statuts de livraison :",
      err
    );
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des statuts de livraison.",
    });
  }
});
*/

/****Mon affaire */

// PUT deliveries/:id (Mise à jour générale)
app.put("/deliveries/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // --- VALIDATION STATUS ---
  if (updates.hasOwnProperty("status")) {
    let statusVal = updates.status;
    // Si tableau vide
    if (Array.isArray(statusVal) && statusVal.length === 0) {
      console.error(
        "[PUT /deliveries/:id] Refusé : champ status vide (tableau)",
        updates
      );
      return res.status(400).json({
        success: false,
        message: "Champ 'status' vide ou mal formé (tableau).",
      });
    }
    // Si string vide ou ne contenant que des virgules/blancs
    if (typeof statusVal === "string") {
      const cleaned = statusVal.replace(/[,\s]/g, "");
      if (cleaned.length === 0) {
        console.error(
          "[PUT /deliveries/:id] Refusé : champ status vide (string)",
          updates
        );
        return res.status(400).json({
          success: false,
          message: "Champ 'status' vide ou mal formé (string).",
        });
      }
    }
  }

  // --- NEW LOGGING ---
  console.log("PUT /deliveries/:id received.");
  console.log("ID:", id);
  console.log("Updates received:", updates);
  // --- END NEW LOGGING ---

  const allowedFields = [
    "employee_name",
    "delivery_date",
    "delivery_time",
    "client_name",
    "client_phone",
    "container_type_and_content",
    "lieu",
    "status",
    "container_number",
    "container_foot_type",
    "declaration_number",
    "number_of_containers",
    "bl_number",
    "dossier_number",
    "shipping_company",
    "transporter",
    "weight",
    "ship_name",
    "circuit",
    "number_of_packages",
    "declaration_circuit",
    "transporter_mode",
    "driver_name",
    "driver_phone",
    "truck_registration",
    "delivery_notes",
    "is_eir_received",
    // NOUVEAUX CHAMPS AUTORISÉS POUR LA MISE À JOUR
    "nom_agent_visiteur",
    "inspecteur",
    "agent_en_douanes",
    // Statuts spécifiques à l'acconier
    "observation_acconier",
    "delivery_status_acconier",
    // AJOUT : autoriser la mise à jour du tableau de statuts par conteneur
    "container_statuses",
  ];

  const updateFields = [];
  const values = [id]; // Le premier paramètre est toujours l'ID pour la clause WHERE
  let paramIndex = 2; // Commence à 2 car $1 est l'ID

  // Correction : accepter une liste de statuts (tableau ou string CSV) pour le champ status
  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      let value = updates[key];
      // Si on met à jour le champ "status" et que la valeur est un tableau, convertir en string CSV
      if (key === "status") {
        if (Array.isArray(value)) {
          value = value.join(",");
        }
        // Si c'est déjà une chaîne CSV, on laisse tel quel
      }
      // Pour delivery_status_acconier, même logique si besoin d'évolution future
      if (key === "delivery_status_acconier") {
        if (Array.isArray(value)) {
          value = value.join(",");
        }
      }
      // Pour container_statuses, on force le stockage en JSON stringifié
      if (key === "container_statuses") {
        value = JSON.stringify(value);
      }
      updateFields.push(`${key} = $${paramIndex}`);
      // Gérer les conversions pour les nombres, dates et heures
      if (key === "number_of_containers" || key === "number_of_packages") {
        values.push(value !== "" ? parseInt(value, 10) : null);
      } else if (key === "delivery_date") {
        values.push(formatDateForDB(value));
      } else if (key === "delivery_time") {
        values.push(formatTimeForDB(value));
      } else {
        values.push(value === "" ? null : value);
      }
      paramIndex++;
    }
  });

  // --- NEW LOGGING ---
  console.log("updateFields after processing:", updateFields);
  console.log("values after processing:", values);
  // --- END NEW LOGGING ---

  if (updateFields.length === 0) {
    console.error(
      "No valid fields provided for update. Updates object was:",
      updates
    ); // Added specific logging here
    return res.status(400).json({
      success: false,
      message: "Aucun champ valide fourni pour la mise à jour.",
    });
  }

  const setClauses = updateFields.join(", ");

  try {
    const query = `
            UPDATE livraison_conteneur
            SET ${setClauses}
            WHERE id = $1
            RETURNING *;
        `;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livraison non trouvée." });
    }

    const updatedDelivery = result.rows[0];

    const wss = req.app.get("wss");
    // Utilisez le statut acconier pour l'alerte
    const statusInfo = getFrenchStatusWithIcon(
      updatedDelivery.delivery_status_acconier
    );
    const displayStatus = statusInfo.text;
    const alertType = statusInfo.customColorClass;

    let updateMessage;
    // Vérification du statut EIR
    if (updates.hasOwnProperty("is_eir_received")) {
      // Si le champ EIR a été modifié
      if (updatedDelivery.is_eir_received) {
        updateMessage = `L'EIR pour le conteneur '${updatedDelivery.container_number}' a été marqué comme reçu par l'agent ${updatedDelivery.employee_name}.`;
      } else {
        updateMessage = `L'EIR pour le conteneur '${updatedDelivery.container_number}' a été marqué comme non reçu par l'agent ${updatedDelivery.employee_name}.`;
      }
    } else if (updates.hasOwnProperty("status") && updates.status) {
      // Message personnalisé pour la mise à jour du statut de plusieurs conteneurs (tous les TC concernés)
      let tcNumbers = [];
      if (Array.isArray(updates.tcNumbers) && updates.tcNumbers.length > 0) {
        tcNumbers = updates.tcNumbers;
      } else if (updates.tcNumber) {
        tcNumbers = [updates.tcNumber];
      } else {
        tcNumbers = String(updatedDelivery.container_number)
          .split(/[,;\s]+/)
          .filter(Boolean);
      }
      let statutLabel = "";
      switch (updates.status) {
        case "livre":
        case "delivered":
          statutLabel = "livré";
          break;
        case "rejet":
        case "rejected":
          statutLabel = "rejeté";
          break;
        case "en_attente":
        case "pending":
          statutLabel = "en attente";
          break;
        case "en_cours":
        case "in_progress":
          statutLabel = "en cours";
          break;
        default:
          statutLabel = updates.status;
      }
      if (tcNumbers.length > 0) {
        updateMessage = tcNumbers
          .map(
            (tc) =>
              `Vous avez fourni un statut de "${statutLabel}" sur le conteneur "${tc}"`
          )
          .join("\n");
      } else {
        updateMessage = `Vous avez fourni un statut de "${statutLabel}" sur le conteneur."`;
      }
    } else {
      // Message générique pour les autres mises à jour de champs
      updateMessage = "Requête effectuer";
      // Si le statut acconier a été explicitement changé
      if (
        updates.hasOwnProperty("delivery_status_acconier") &&
        updates.delivery_status_acconier !== undefined &&
        updates.delivery_status_acconier !==
          updatedDelivery.delivery_status_acconier
      ) {
        const acconierStatusInfo = getFrenchStatusWithIcon(
          updates.delivery_status_acconier
        );
        updateMessage = `Le statut acconier du conteneur '${updatedDelivery.container_number}' a été mis à jour à "${acconierStatusInfo.text}".`;
      }
    }

    const payload = JSON.stringify({
      type: "delivery_update_alert",
      message: updateMessage,
      deliveryData: updatedDelivery,
      alertType: alertType,
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
    console.log(`Message WebSocket envoyé: ${updateMessage}`);

    res.status(200).json({
      success: true,
      message: "Livraison mise à jour avec succès.",
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la livraison :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour de la livraison.",
    });
  }
});

// DELETE /deliveries/:id
app.delete("/deliveries/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM livraison_conteneur WHERE id = $1 RETURNING id, employee_name, container_number;",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Livraison non trouvée pour suppression.",
      });
    }
    const deletedDelivery = result.rows[0];
    // Utilise la référence globale wss (déjà déclarée en haut du fichier)
    const alertMessage = `La livraison du conteneur '${deletedDelivery.container_number}' de l'agent '${deletedDelivery.employee_name}' a été supprimée.`;
    const payload = JSON.stringify({
      type: "delivery_deletion_alert",
      message: alertMessage,
      deliveryId: deletedDelivery.id,
      alertType: "info",
    });
    wss.clients.forEach((client) => {
      if (client.readyState === require("ws").OPEN) {
        client.send(payload);
      }
    });
    console.log(
      `Message WebSocket envoyé pour la suppression: ${alertMessage}`
    );
    res.status(200).json({
      success: true,
      message: "Livraison supprimée avec succès.",
      deletedId: deletedDelivery.id,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la livraison :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de la livraison.",
    });
  }
});

// DELETE /agents/:employeeName
app.delete("/agents/:employeeName", async (req, res) => {
  const { employeeName } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM livraison_conteneur WHERE employee_name = $1 RETURNING id;",
      [employeeName]
    );

    const deletedCount = result.rowCount;
    let message = "";
    let alertType = "";

    if (deletedCount === 0) {
      message = `Aucune livraison trouvée pour l'agent '${employeeName}'. L'agent (ou ses livraisons) est peut-être déjà absent.`;
      alertType = "info";
    } else {
      message = `Toutes les ${deletedCount} livraisons pour l'agent '${employeeName}' ont été supprimées.`;
      alertType = "success";
    }

    const wss = req.app.get("wss");
    const payload = JSON.stringify({
      type: "agent_deletion_alert",
      message: message,
      employeeName: employeeName,
      deletedCount: deletedCount,
      alertType: alertType,
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
    console.log(
      `Message WebSocket envoyé pour la suppression de l'agent: ${message}`
    );

    // MAINTENU ICI : L'envoi de la liste des agents est pertinent après la suppression d'un agent
    await broadcastAgentList(wss);

    res.status(200).json({
      success: true,
      message: message,
      deletedCount: deletedCount,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression des livraisons de l'agent :",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la suppression des livraisons de l'agent.",
    });
  }
});

// ===============================
// --- FONCTION UTILE AGENTS ---
// ===============================
async function getUniqueAgents() {
  try {
    // MODIFICATION ICI: Utilisation de GROUP BY au lieu de DISTINCT pour résoudre l'erreur SQL
    const result = await pool.query(
      `SELECT employee_name FROM livraison_conteneur WHERE employee_name IS NOT NULL AND employee_name <> '' GROUP BY employee_name ORDER BY LOWER(employee_name) ASC;`
    );
    return result.rows.map((row) => row.employee_name);
  } catch (err) {
    console.error("Erreur lors de la récupération des agents uniques:", err);
    return [];
  }
}

// ===============================
// --- ENDPOINT GET /agents ---
// ===============================
app.get("/agents", async (req, res) => {
  try {
    const agents = await getUniqueAgents();
    res.status(200).json({ success: true, agents });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des agents.",
    });
  }
});

// ===============================
// --- ENVOI WS LISTE AGENTS ---
// ===============================
async function broadcastAgentList(wss) {
  const agents = await getUniqueAgents();
  const payload = JSON.stringify({ type: "updateAgents", agents });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Planifier l'exécution du nettoyage des archives
// Exécute une première fois au démarrage
cleanOldArchives();
// Puis toutes les 24 heures (86400000 ms)
setInterval(cleanOldArchives, 86400000); // 24 heures * 60 minutes * 60 secondes * 1000 millisecondes

// Planifier l'exécution de l'archivage automatique des ordres de livraison
// Exécute une première fois au démarrage
archiveOldOrders();
// Puis toutes les 24 heures
setInterval(archiveOldOrders, 86400000); // 24 heures

// =========================================================================
// --- ROUTES DE FICHIERS STATIQUES (à placer EN DERNIER) ---
// =========================================================================

// --- ROUTE GET /clients pour compatibilité frontend ---
// Retourne la liste des clients distincts (nom, téléphone)
// --- ROUTE STATISTIQUES PAR ACTEUR ---
app.get("/statistiques/acteurs", async (req, res) => {
  try {
    // Récupérer la date passée en paramètre (format YYYY-MM-DD ou autre)
    let { date } = req.query;
    let query = `SELECT * FROM livraison_conteneur`;
    let values = [];
    // Si aucune date n'est fournie, utiliser la date du jour (timezone serveur)
    let usedDate = date;
    if (!usedDate) {
      const today = new Date();
      usedDate = today.toISOString().split("T")[0];
    }
    if (usedDate) {
      const formattedDate = formatDateForDB(usedDate);
      if (formattedDate) {
        // Filtrage sur la date de création (created_at) uniquement (ignorer l'heure)
        query += ` WHERE created_at::date = $1`;
        values.push(formattedDate);
      } else {
        console.warn(
          `Route /statistiques/acteurs : date reçue invalide ('${usedDate}'). Aucun résultat retourné.`
        );
        return res.json({
          success: true,
          agentAcconier: {
            total: 0,
            details: [],
            message: "Aucune donnée pour la date choisie.",
          },
          responsableAcconier: {
            total: 0,
            details: [],
            message: "Aucune donnée pour la date choisie.",
          },
          responsableLivraison: {
            total: 0,
            details: [],
            message: "Aucune donnée pour la date choisie.",
          },
        });
      }
    }
    const result = await pool.query(query, values);
    const rows = result.rows || [];
    const allRows = rows;

    // Fonctions utilitaires pour filtrer par rôle
    function isAgentAcconier(liv) {
      return liv.employee_name && liv.delivery_status_acconier;
    }
    function isResponsableAcconier(liv) {
      return liv.inspecteur || liv.agent_en_douanes;
    }
    function isResponsableLivraison(liv) {
      return liv.nom_agent_visiteur;
    }

    // Colonnes attendues pour chaque rôle (adapter selon le frontend)
    const columnsByRole = {
      agentAcconier: [
        { key: "employee_name", label: "Agent" },
        { key: "client_name", label: "Client (Nom)" },
        { key: "lieu", label: "Lieu" },
        { key: "container_number", label: "Numéro TC(s)" },
        { key: "delivery_status_acconier", label: "Statut" },
        { key: "container_foot_type", label: "Type Conteneur(pied)" },
        { key: "container_type_and_content", label: "Contenu" },
        { key: "declaration_number", label: "N° Déclaration" },
        { key: "bl_number", label: "N° BL" },
        { key: "dossier_number", label: "N° Dossier" },
        { key: "number_of_containers", label: "Nombre de conteneurs" },
        { key: "shipping_company", label: "Compagnie Maritime" },
        { key: "weight", label: "Poids" },
        { key: "ship_name", label: "Nom du navire" },
        { key: "circuit", label: "Circuit" },
        { key: "transporter_mode", label: "Mode de Transport" },
        { key: "created_at", label: "Créé le" },
      ],
      responsableAcconier: [
        { key: "employee_name", label: "Agent" },
        { key: "client_name", label: "Client (Nom)" },
        { key: "lieu", label: "Lieu" },
        { key: "container_number", label: "Numéro TC(s)" },
        { key: "delivery_status_acconier", label: "Statut Acconier" },
        { key: "container_foot_type", label: "Type Conteneur(pied)" },
        { key: "container_type_and_content", label: "Contenu" },
        { key: "declaration_number", label: "N° Déclaration" },
        { key: "bl_number", label: "N° BL" },
        { key: "dossier_number", label: "N° Dossier" },
        { key: "number_of_containers", label: "Nombre de conteneurs" },
        { key: "shipping_company", label: "Compagnie Maritime" },
        { key: "weight", label: "Poids" },
        { key: "ship_name", label: "Nom du navire" },
        { key: "circuit", label: "Circuit" },
        { key: "transporter_mode", label: "Mode de Transport" },
        // Colonnes spécifiques responsable acconier
        { key: "inspecteur", label: "Inspecteur" },
        { key: "agent_en_douanes", label: "Agent en Douanes" },
        { key: "delivery_date", label: "Date Livraison" },
        { key: "status", label: "Statut de livraison (Resp. Aconiés)" },
        { key: "observation_acconier", label: "Observations (Resp. Aconiés)" },
        { key: "created_at", label: "Créé le" },
      ],
      // Pour Responsable Livraison, on affiche toutes les colonnes principales du tableau de suivi + colonnes spécifiques livraison
      responsableLivraison: [
        { key: "employee_name", label: "Agent" },
        { key: "client_name", label: "Client (Nom)" },
        { key: "lieu", label: "Lieu" },
        { key: "container_number", label: "Numéro TC(s)" },
        { key: "delivery_status_acconier", label: "Statut Acconier" },
        { key: "container_foot_type", label: "Type Conteneur(pied)" },
        { key: "container_type_and_content", label: "Contenu" },
        { key: "declaration_number", label: "N° Déclaration" },
        { key: "bl_number", label: "N° BL" },
        { key: "dossier_number", label: "N° Dossier" },
        { key: "number_of_containers", label: "Nombre de conteneurs" },
        { key: "shipping_company", label: "Compagnie Maritime" },
        { key: "weight", label: "Poids" },
        { key: "ship_name", label: "Nom du navire" },
        { key: "circuit", label: "Circuit" },
        { key: "transporter_mode", label: "Mode de Transport" },
        // Colonnes spécifiques livraison
        { key: "nom_agent_visiteur", label: "Nom agent visiteur" },
        { key: "transporter", label: "Transporteur" },
        { key: "inspecteur", label: "Inspecteur" },
        { key: "agent_en_douanes", label: "Agent en Douanes" },
        { key: "driver_name", label: "Chauffeur" },
        { key: "truck_registration", label: "Immatriculation" },
        { key: "driver_phone", label: "Tél. Chauffeur" },
        { key: "delivery_date", label: "Date Livraison" },
        { key: "delivery_time", label: "Heure Livraison" },
        { key: "status", label: "Statut Livraison" },
        { key: "created_at", label: "Créé le" },
      ],
    };

    // Génère le tableau details pour chaque rôle
    function detailsFor(filtered, role) {
      const cols = columnsByRole[role];
      return filtered.map((liv) => {
        const obj = {};
        cols.forEach((col) => {
          let val = liv[col.key];
          // Correction : remplacement systématique de "Mise en livraison (ancienne)" par "Mise en livraison"
          if (
            typeof val === "string" &&
            (val.toLowerCase() === "mise en livraison (ancienne)" ||
              val.toLowerCase() === "mise_en_livraison_ancienne")
          ) {
            val = "Mise en livraison";
          }
          // Formatage spécial pour les dates
          if (col.key === "delivery_date" && val) {
            val = new Date(val).toLocaleDateString("fr-FR");
          }
          if (col.key === "created_at" && val) {
            val = new Date(val).toLocaleString("fr-FR");
          }
          // Formatage spécial pour l'heure de livraison
          if (col.key === "delivery_time" && val) {
            // Si déjà au format HH:mm:ss ou HH:mm
            if (typeof val === "string" && val.length >= 5) {
              val = val.slice(0, 5);
            } else {
              try {
                const d = new Date(`1970-01-01T${val}`);
                val = d.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              } catch (e) {}
            }
          }
          // Statut acconier en français pour toutes les vues (y compris responsableAcconier)
          if (col.key === "delivery_status_acconier" && val) {
            val = translateStatusToFr(val);
          }
          // Statut livraison en français (affiche uniquement la traduction si possible)
          if (col.key === "status" && val) {
            val = translateStatusToFr(val);
          }
          // Pour les champs numériques, afficher "-" si null ou vide
          if (["number_of_containers", "weight"].includes(col.key)) {
            val = val !== undefined && val !== null && val !== "" ? val : "-";
          }
          obj[col.label] = val || "-";
        });
        // Ajout systématique des champs acconier pour le rôle responsableAcconier
        if (role === "responsableAcconier") {
          // On injecte systématiquement les valeurs brutes, même si vides, pour garantir la transmission au frontend
          obj["Statut de livraison (Resp. Aconiés)"] =
            liv.delivery_status_acconier !== undefined
              ? liv.delivery_status_acconier
              : "";
          obj["Observations (Resp. Aconiés)"] =
            liv.observation_acconier !== undefined
              ? liv.observation_acconier
              : "";
        }
        // Ajout des statuts conteneurs pour Responsable Livraison uniquement
        if (role === "responsableLivraison") {
          obj["container_statuses"] = liv.container_statuses || null;
          obj["container_statuses_fr"] = liv.container_statuses_fr || null;
        }
        return obj;
      });
    }

    // Statistiques détaillées pour chaque acteur
    function statsFor(filterFn, role) {
      const filtered = allRows.filter(filterFn);
      const statuts = {
        livree: 0,
        attente: 0,
        rejetee: 0,
        paiement: 0,
        mise_en_livraison: 0,
        autre: 0,
      };
      let lastActivity = null;
      let lieux = {};
      let totalDelai = 0,
        nbDelai = 0;
      filtered.forEach((liv) => {
        // On prend le statut traduit pour le calcul
        let s = translateStatusToFr(
          liv.status || liv.delivery_status_acconier || ""
        )
          .toLowerCase()
          .trim();
        if (!s || s === "-" || s === "inconnu" || s === "unknown") {
          // On ignore les statuts vides ou inconnus dans les stats
          return;
        }
        if (s.includes("livr")) statuts.livree++;
        else if (s.includes("paiement effectué")) statuts.paiement++;
        else if (s.includes("mise en livraison")) statuts.mise_en_livraison++;
        else if (s.includes("attente") || s.includes("pending"))
          statuts.attente++;
        else if (s.includes("rejet")) statuts.rejetee++;
        else statuts.autre++;
        if (liv.created_at) {
          const d = new Date(liv.created_at);
          if (!lastActivity || d > lastActivity) lastActivity = d;
        }
        if (liv.lieu) {
          lieux[liv.lieu] = (lieux[liv.lieu] || 0) + 1;
        }
        if (liv.delivery_date && liv.created_at && s.includes("livr")) {
          const t1 = new Date(liv.created_at);
          const t2 = new Date(liv.delivery_date);
          const diff = Math.abs(t2 - t1) / (1000 * 60 * 60);
          totalDelai += diff;
          nbDelai++;
        }
      });
      const lieuxSorted = Object.entries(lieux).sort((a, b) => b[1] - a[1]);
      return {
        total: filtered.length,
        lastActivity: lastActivity ? lastActivity.toISOString() : null,
        livree: statuts.livree,
        attente: statuts.attente,
        rejetee: statuts.rejetee,
        autre: statuts.autre,
        lieux: lieuxSorted.slice(0, 3).map(([lieu, n]) => ({ lieu, n })),
        tempsMoyenLivraison: nbDelai > 0 ? totalDelai / nbDelai : null,
        details: detailsFor(filtered, role),
      };
    }

    // Si aucune donnée trouvée, message spécial (optionnel)
    if (allRows.length === 0) {
      return res.json({
        success: true,
        agentAcconier: {
          total: 0,
          details: [],
          message: "Aucune donnée pour la date choisie.",
        },
        responsableAcconier: {
          total: 0,
          details: [],
          message: "Aucune donnée pour la date choisie.",
        },
        responsableLivraison: {
          total: 0,
          details: [],
          message: "Aucune donnée pour la date choisie.",
        },
      });
    }
    res.json({
      success: true,
      agentAcconier: statsFor(isAgentAcconier, "agentAcconier"),
      responsableAcconier: statsFor(
        isResponsableAcconier,
        "responsableAcconier"
      ),
      responsableLivraison: statsFor(
        isResponsableLivraison,
        "responsableLivraison"
      ),
    });
  } catch (err) {
    console.error("Erreur statistiques acteurs:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur statistiques acteurs.",
    });
  }
});

// Nouvelle route : Liste des agents visiteurs programmés (filtrable par date)
app.get("/agents-visiteurs/programmes", async (req, res) => {
  try {
    let { date } = req.query;
    let query = `SELECT id, nom_agent_visiteur, client_name, lieu, container_number, delivery_date, delivery_time, created_at, status FROM livraison_conteneur WHERE nom_agent_visiteur IS NOT NULL AND nom_agent_visiteur <> ''`;
    let values = [];
    if (date) {
      // Filtrer sur la date de livraison si fournie
      query += ` AND delivery_date = $1`;
      values.push(date);
    }
    query += ` ORDER BY delivery_date DESC, delivery_time DESC, created_at DESC`;
    const result = await pool.query(query, values);
    // Ajout du champ status traduit pour chaque visiteur
    const visites = result.rows.map((v) => ({
      ...v,
      status: translateStatusToFr(v.status),
    }));
    res.status(200).json({ success: true, visites });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des agents visiteurs programmés :",
      err
    );
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des agents visiteurs programmés.",
    });
  }
});

app.get("/clients", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT client_name, client_phone FROM livraison_conteneur WHERE client_name IS NOT NULL AND client_name <> ''`
    );
    res.status(200).json({ success: true, clients: result.rows });
  } catch (err) {
    console.error("Erreur lors de la récupération des clients :", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des clients.",
    });
  }
});

// ===============================
// ROUTES POUR LE SYSTÈME D'ARCHIVES
// ===============================

// Récupérer toutes les archives avec filtres et pagination
app.get("/api/archives", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      action_type = "",
      role_source = "",
      date_start = "",
      date_end = "",
    } = req.query;

    console.log("[ARCHIVES API] Paramètres reçus:", {
      page,
      limit,
      search,
      action_type,
      role_source,
      date_start,
      date_end,
    });

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Filtres de recherche
    if (search && search.trim()) {
      whereConditions.push(`(
        dossier_reference ILIKE $${paramIndex} OR 
        intitule ILIKE $${paramIndex} OR 
        client_name ILIKE $${paramIndex} OR
        archived_by ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (action_type && action_type.trim()) {
      whereConditions.push(`action_type = $${paramIndex}`);
      queryParams.push(action_type);
      paramIndex++;
    }

    if (role_source && role_source.trim()) {
      whereConditions.push(`role_source = $${paramIndex}`);
      queryParams.push(role_source);
      paramIndex++;
    }

    if (date_start && date_start.trim()) {
      whereConditions.push(`DATE(archived_at) >= $${paramIndex}`);
      queryParams.push(date_start);
      paramIndex++;
    }

    if (date_end && date_end.trim()) {
      whereConditions.push(`DATE(archived_at) <= $${paramIndex}`);
      queryParams.push(date_end);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    console.log("[ARCHIVES API] Clause WHERE:", whereClause);
    console.log("[ARCHIVES API] Paramètres:", queryParams);

    // Traitement spécial pour "mise_en_livraison" et "livraison"
    if (action_type === "mise_en_livraison") {
      console.log(
        "[ARCHIVES API] Requête spéciale pour 'mise_en_livraison' - récupération des dossiers en cours (excluant les livrés)"
      );

      let specialWhereConditions = [
        "delivery_status_acconier = 'mise_en_livraison_acconier'",
        "(delivery_status_acconier != 'livre' AND delivery_status_acconier != 'livré')",
      ];
      let specialParams = [];
      let specialParamIndex = 1;

      // Ajouter les filtres de date si fournis
      if (date_start && date_start.trim()) {
        specialWhereConditions.push(
          `DATE(created_at) >= $${specialParamIndex}`
        );
        specialParams.push(date_start);
        specialParamIndex++;
      }
      if (date_end && date_end.trim()) {
        specialWhereConditions.push(
          `DATE(created_at) <= $${specialParamIndex}`
        );
        specialParams.push(date_end);
        specialParamIndex++;
      }

      // Ajouter la recherche si fournie
      if (search && search.trim()) {
        specialWhereConditions.push(`(
          dossier_number ILIKE $${specialParamIndex} OR 
          container_type_and_content ILIKE $${specialParamIndex} OR 
          client_name ILIKE $${specialParamIndex} OR
          employee_name ILIKE $${specialParamIndex}
        )`);
        specialParams.push(`%${search}%`);
        specialParamIndex++;
      }

      const offset = (page - 1) * limit;
      specialParams.push(limit, offset);

      const specialQuery = `
        SELECT DISTINCT ON (dossier_number)
          id,
          id as dossier_id,
          dossier_number as dossier_reference,
          container_type_and_content as intitule,
          client_name,
          'Responsable Livraison' as role_source,
          'resp_liv.html' as page_origine,
          'mise_en_livraison' as action_type,
          employee_name as archived_by,
          '' as archived_by_email,
          created_at as archived_at,
          '{"source": "active_delivery", "status": "en_cours"}'::json as metadata,
          json_build_object(
            'id', id,
            'dossier_number', dossier_number,
            'client_name', client_name,
            'employee_name', employee_name,
            'container_type_and_content', container_type_and_content,
            'created_at', created_at,
            'container_number', container_number,
            'container_numbers_list', container_numbers_list,
            'bl_number', bl_number,
            'declaration_number', declaration_number,
            'shipping_company', shipping_company,
            'ship_name', ship_name,
            'lieu', lieu,
            'transporter_mode', transporter_mode,
            'weight', weight,
            'circuit', circuit,
            'transporter', transporter,
            'number_of_containers', number_of_containers,
            'container_foot_type', container_foot_type,
            'number_of_packages', number_of_packages
          ) as dossier_data
        FROM livraison_conteneur
        WHERE ${specialWhereConditions.join(" AND ")}
        ORDER BY dossier_number, created_at DESC
        LIMIT $${specialParamIndex} OFFSET $${specialParamIndex + 1}
      `;

      console.log(
        "[ARCHIVES API] Requête SQL pour mise_en_livraison:",
        specialQuery
      );
      const result = await pool.query(specialQuery, specialParams);

      // Compter le total pour la pagination
      const countQuery = `
        SELECT COUNT(DISTINCT dossier_number) as total 
        FROM livraison_conteneur 
        WHERE ${specialWhereConditions.join(" AND ")}
      `;
      const countResult = await pool.query(
        countQuery,
        specialParams.slice(0, -2)
      );
      const total = parseInt(countResult.rows[0].total);

      console.log("[ARCHIVES API] Résultats mise_en_livraison:", {
        foundRows: result.rows.length,
        total: total,
      });

      return res.json({
        success: true,
        archives: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      });
    }

    if (action_type === "livraison") {
      console.log(
        "[ARCHIVES API] Requête spéciale pour 'livraison' - récupération depuis archives_dossiers"
      );

      let specialWhereConditions = ["action_type = 'livraison'"];
      let specialParams = [];
      let specialParamIndex = 1;

      // Ajouter les filtres de date si fournis
      if (date_start && date_start.trim()) {
        specialWhereConditions.push(
          `DATE(archived_at) >= $${specialParamIndex}`
        );
        specialParams.push(date_start);
        specialParamIndex++;
      }
      if (date_end && date_end.trim()) {
        specialWhereConditions.push(
          `DATE(archived_at) <= $${specialParamIndex}`
        );
        specialParams.push(date_end);
        specialParamIndex++;
      }

      // Ajouter la recherche si fournie
      if (search && search.trim()) {
        specialWhereConditions.push(`(
          dossier_reference ILIKE $${specialParamIndex} OR 
          intitule ILIKE $${specialParamIndex} OR 
          client_name ILIKE $${specialParamIndex} OR
          archived_by ILIKE $${specialParamIndex}
        )`);
        specialParams.push(`%${search}%`);
        specialParamIndex++;
      }

      const offset = (page - 1) * limit;
      specialParams.push(limit, offset);

      const specialQuery = `
        SELECT *
        FROM archives_dossiers
        WHERE ${specialWhereConditions.join(" AND ")}
        ORDER BY archived_at DESC
        LIMIT $${specialParamIndex} OFFSET $${specialParamIndex + 1}
      `;

      console.log("[ARCHIVES API] Requête SQL pour livraison:", specialQuery);
      const result = await pool.query(specialQuery, specialParams);

      // Compter le total pour la pagination
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM archives_dossiers 
        WHERE ${specialWhereConditions.join(" AND ")}
      `;
      const countResult = await pool.query(
        countQuery,
        specialParams.slice(0, -2)
      );
      const total = parseInt(countResult.rows[0].total);

      console.log("[ARCHIVES API] Résultats livraison:", {
        foundRows: result.rows.length,
        total: total,
      });

      return res.json({
        success: true,
        archives: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      });
    }

    // Traitement normal pour les autres action_type (suppression, ordre_livraison_etabli, etc.)
    // Pagination
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);

    const query = `
      SELECT * FROM archives_dossiers 
      ${whereClause}
      ORDER BY archived_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    console.log("[ARCHIVES API] Requête SQL:", query);

    const result = await pool.query(query, queryParams);

    // Compter le total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM archives_dossiers ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    console.log("[ARCHIVES API] Résultats:", {
      foundRows: result.rows.length,
      total: total,
    });

    res.json({
      success: true,
      archives: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des archives:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des archives.",
    });
  }
});

// Archiver un dossier (suppression, livraison ou mise en livraison)
app.post("/api/archives", async (req, res) => {
  try {
    const {
      dossier_id,
      dossier_reference,
      intitule,
      client_name,
      role_source,
      page_origine,
      action_type,
      archived_by,
      archived_by_email,
      dossier_data,
      metadata,
    } = req.body;

    // Validation des champs requis
    if (!role_source || !page_origine || !action_type) {
      return res.status(400).json({
        success: false,
        message:
          "Champs requis manquants (role_source, page_origine, action_type)",
      });
    }

    // VÉRIFICATION ANTI-DOUBLONS : Empêcher l'archivage multiple du même dossier pour la même action
    if (dossier_reference) {
      const existingArchive = await pool.query(
        `SELECT id, archived_at, archived_by FROM archives_dossiers 
         WHERE dossier_reference = $1 AND action_type = $2 
         ORDER BY archived_at DESC LIMIT 1`,
        [dossier_reference, action_type]
      );

      if (existingArchive.rows.length > 0) {
        const existing = existingArchive.rows[0];
        console.log(`🚫 Tentative d'archivage en doublon bloquée:`);
        console.log(`   - Dossier: ${dossier_reference}`);
        console.log(`   - Action: ${action_type}`);
        console.log(
          `   - Déjà archivé le: ${existing.archived_at} par ${existing.archived_by}`
        );
        console.log(`   - Tentative par: ${archived_by}`);

        return res.status(409).json({
          success: false,
          message: `Ce dossier (${dossier_reference}) a déjà été archivé pour l'action "${action_type}" le ${new Date(
            existing.archived_at
          ).toLocaleDateString("fr-FR")} par ${existing.archived_by}.`,
          existing_archive: existing,
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO archives_dossiers (
        dossier_id, dossier_reference, intitule, client_name,
        role_source, page_origine, action_type, archived_by,
        archived_by_email, dossier_data, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
      [
        dossier_id,
        dossier_reference,
        intitule,
        client_name,
        role_source,
        page_origine,
        action_type,
        archived_by,
        archived_by_email,
        JSON.stringify(dossier_data),
        JSON.stringify(metadata),
      ]
    );

    console.log(
      `✅ Nouveau dossier archivé: ${dossier_reference} (${action_type}) par ${archived_by}`
    );

    res.status(201).json({
      success: true,
      archive: result.rows[0],
      message: "Dossier archivé avec succès",
    });
  } catch (err) {
    console.error("Erreur lors de l'archivage:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'archivage",
    });
  }
});

// Restaurer un dossier archivé
app.post("/api/archives/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    const { restored_by, restored_by_email } = req.body;

    console.log(`🔄 Tentative de restauration de l'archive ID: ${id}`);
    console.log(`👤 Restauré par: ${restored_by} (${restored_by_email})`);

    // Récupérer l'archive
    const archiveResult = await pool.query(
      "SELECT * FROM archives_dossiers WHERE id = $1",
      [id]
    );

    if (archiveResult.rows.length === 0) {
      console.log(`❌ Archive ${id} non trouvée`);
      return res.status(404).json({
        success: false,
        message: "Archive non trouvée",
      });
    }

    const archive = archiveResult.rows[0];
    console.log(`📊 Archive trouvée:`, {
      id: archive.id,
      reference: archive.dossier_reference,
      is_restorable: archive.is_restorable,
      action_type: archive.action_type,
      has_dossier_data: !!archive.dossier_data,
    });

    // Vérifier le type d'action pour autoriser uniquement la restauration des dossiers supprimés
    if (archive.action_type === "livraison") {
      console.log(`🚫 Tentative de restauration d'un dossier livré refusée`);
      return res.status(403).json({
        success: false,
        message:
          "Désolé, les dossiers livrés ne peuvent pas être restaurés car le responsable l'a déclaré livré.",
      });
    }

    if (archive.action_type === "mise_en_livraison") {
      console.log(
        `🚫 Tentative de restauration d'un dossier mis en livraison refusée`
      );
      return res.status(403).json({
        success: false,
        message:
          "Désolé, les dossiers mis en livraison ne peuvent pas être restaurés car ils sont en cours de traitement.",
      });
    }

    if (archive.action_type !== "suppression") {
      console.log(
        `🚫 Tentative de restauration d'un type non autorisé: ${archive.action_type}`
      );
      return res.status(403).json({
        success: false,
        message: "Seuls les dossiers supprimés peuvent être restaurés.",
      });
    }

    if (!archive.is_restorable) {
      console.log(`⚠️ Archive ${id} non restaurable`);
      return res.status(400).json({
        success: false,
        message: "Cette archive n'est pas restaurable",
      });
    }

    const dossierData = archive.dossier_data;

    if (!dossierData) {
      console.log(`❌ Données du dossier manquantes pour l'archive ${id}`);
      return res.status(400).json({
        success: false,
        message: "Données du dossier non disponibles pour la restauration",
      });
    }

    console.log(`📋 Données du dossier:`, {
      client_name: dossierData.client_name,
      employee_name: dossierData.employee_name,
      delivery_date: dossierData.delivery_date,
      container_number: dossierData.container_number,
      page_origine: archive.page_origine,
    });

    // Restaurer tous les dossiers supprimés dans livraison_conteneur
    // pour qu'ils apparaissent dans l'interface employé (interfaceFormulaireEmployer.html)
    const restoreQuery = `
      INSERT INTO livraison_conteneur (
        employee_name, delivery_date, delivery_time, client_name, client_phone,
        container_type_and_content, lieu, container_number, container_foot_type,
        declaration_number, number_of_containers, bl_number, dossier_number,
        shipping_company, transporter, weight, ship_name, circuit, number_of_packages,
        transporter_mode, nom_agent_visiteur, inspecteur, agent_en_douanes,
        driver_name, driver_phone, truck_registration, delivery_notes, status,
        is_eir_received, delivery_status_acconier, observation_acconier,
        container_numbers_list, container_foot_types_map, bl_statuses, container_statuses
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
      ) RETURNING id
    `;

    const queryParams = [
      dossierData.employee_name,
      dossierData.delivery_date,
      dossierData.delivery_time,
      dossierData.client_name,
      dossierData.client_phone,
      dossierData.container_type_and_content,
      dossierData.lieu,
      dossierData.container_number,
      dossierData.container_foot_type,
      dossierData.declaration_number,
      dossierData.number_of_containers,
      dossierData.bl_number,
      dossierData.dossier_number,
      dossierData.shipping_company,
      dossierData.transporter,
      dossierData.weight,
      dossierData.ship_name,
      dossierData.circuit,
      dossierData.number_of_packages,
      dossierData.transporter_mode,
      dossierData.nom_agent_visiteur,
      dossierData.inspecteur,
      dossierData.agent_en_douanes,
      dossierData.driver_name,
      dossierData.driver_phone,
      dossierData.truck_registration,
      dossierData.delivery_notes,
      dossierData.status || "en_attente", // Statut d'origine pour interface employé
      dossierData.is_eir_received,
      dossierData.delivery_status_acconier,
      dossierData.observation_acconier,
      JSON.stringify(dossierData.container_numbers_list || []),
      JSON.stringify(dossierData.container_foot_types_map || {}),
      JSON.stringify(dossierData.bl_statuses || {}),
      JSON.stringify(dossierData.container_statuses || {}),
    ];

    console.log(
      `💾 Restauration du dossier supprimé dans livraison_conteneur...`
    );

    const restoreResult = await pool.query(restoreQuery, queryParams);

    const restoredId = restoreResult.rows[0].id;
    console.log(
      `✅ Dossier restauré avec succès dans livraison_conteneur - Nouveau ID: ${restoredId}`
    );
    console.log(
      `  Le dossier sera visible dans l'interface employé: interfaceFormulaireEmployer.html`
    );

    // Marquer l'archive comme non restaurable
    await pool.query(
      "UPDATE archives_dossiers SET is_restorable = false WHERE id = $1",
      [id]
    );

    console.log(`🔒 Archive ${id} marquée comme non restaurable`);

    res.json({
      success: true,
      message: "Dossier restauré avec succès dans l'interface employé",
      restored_id: restoredId,
      target_interface: "interfaceFormulaireEmployer.html",
    });
  } catch (err) {
    console.error("🚨 Erreur lors de la restauration:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la restauration: " + err.message,
    });
  }
});

// Supprimer définitivement une archive
app.delete("/api/archives/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM archives_dossiers WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Archive non trouvée",
      });
    }

    res.json({
      success: true,
      message: "Archive supprimée définitivement",
    });
  } catch (err) {
    console.error("Erreur lors de la suppression d'archive:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression",
    });
  }
});

// Route pour récupérer les détails des conteneurs d'un dossier archivé
app.get("/api/archives/container-details/:dossierId", async (req, res) => {
  try {
    const { dossierId } = req.params;

    console.log(
      "[ARCHIVES] Récupération des détails conteneurs pour dossier:",
      dossierId
    );

    // Récupérer les données du dossier depuis livraison_conteneur
    const dossierQuery = `
      SELECT container_numbers_list, container_statuses, container_number, number_of_containers
      FROM livraison_conteneur 
      WHERE id = $1
    `;

    const dossierResult = await pool.query(dossierQuery, [dossierId]);

    if (dossierResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dossier non trouvé",
      });
    }

    const dossierData = dossierResult.rows[0];
    let containers = [];

    // Essayer d'extraire les conteneurs de container_numbers_list
    if (dossierData.container_numbers_list) {
      try {
        if (Array.isArray(dossierData.container_numbers_list)) {
          containers = dossierData.container_numbers_list.filter(
            (c) => c && c.trim()
          );
        } else if (typeof dossierData.container_numbers_list === "string") {
          containers = JSON.parse(dossierData.container_numbers_list).filter(
            (c) => c && c.trim()
          );
        }
      } catch (e) {
        console.warn("Erreur parsing container_numbers_list:", e);
      }
    }

    // Si pas de liste, essayer container_statuses
    if (containers.length === 0 && dossierData.container_statuses) {
      try {
        let statuses = dossierData.container_statuses;
        if (typeof statuses === "string") {
          statuses = JSON.parse(statuses);
        }

        if (typeof statuses === "object" && statuses !== null) {
          containers = Object.keys(statuses).filter((key) => key && key.trim());
        }
      } catch (e) {
        console.warn("Erreur parsing container_statuses:", e);
      }
    }

    // Si toujours pas de conteneurs, utiliser container_number comme fallback
    if (containers.length === 0 && dossierData.container_number) {
      containers = [dossierData.container_number];
    }

    console.log("[ARCHIVES] Conteneurs trouvés:", containers);

    res.json({
      success: true,
      containers: containers,
      totalCount: containers.length,
    });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des détails conteneurs:",
      err
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des détails",
    });
  }
});

// Synchroniser l'historique localStorage avec les archives
app.post("/api/archives/sync-history", async (req, res) => {
  try {
    const { historyData } = req.body;

    console.log(
      "📋 Synchronisation de l'historique localStorage vers les archives..."
    );
    console.log(`📊 Nombre d'éléments reçus: ${historyData?.length || 0}`);

    if (!historyData || !Array.isArray(historyData)) {
      return res.status(400).json({
        success: false,
        message: "Données d'historique invalides",
      });
    }

    const syncedArchives = [];
    let successCount = 0;
    let errorCount = 0;

    for (const item of historyData) {
      try {
        // Créer une référence unique pour ce dossier livré
        const dossier_reference =
          item.declaration_number ||
          item.dossier_number ||
          `delivery_${item.delivery_id}`;

        // VALIDATION : Ignorer les dossiers avec "N/A" comme référence
        if (
          !dossier_reference ||
          dossier_reference.trim() === "N/A" ||
          dossier_reference.trim() === ""
        ) {
          console.log(
            `❌ Dossier ignoré (N/A ou vide): "${dossier_reference}" - ${item.client_name}`
          );
          continue;
        }

        // Vérifier si cet élément existe déjà dans les archives
        const existingArchive = await pool.query(
          `SELECT id FROM archives_dossiers 
           WHERE dossier_reference = $1 AND action_type = 'livraison'`,
          [dossier_reference]
        );

        if (existingArchive.rows.length > 0) {
          console.log(`⏩ Dossier ${dossier_reference} déjà archivé, ignoré`);
          continue;
        }

        // Insérer dans les archives
        const archiveResult = await pool.query(
          `INSERT INTO archives_dossiers (
            dossier_reference, intitule, client_name, role_source, 
            page_origine, action_type, archived_by, archived_by_email,
            dossier_data, metadata, is_restorable
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            dossier_reference,
            item.container_type_and_content ||
              `Livraison conteneur ${item.container_number}`,
            item.client_name,
            "Responsable Livraison",
            "resp_liv.html",
            "livraison",
            item.employee_name || item.visitor_agent_name || "Système",
            "",
            JSON.stringify({
              container_number: item.container_number,
              delivery_date: item.delivery_date,
              delivery_time: item.delivery_time,
              client_name: item.client_name,
              declaration_number: item.declaration_number,
              dossier_number: item.dossier_number,
              employee_name: item.employee_name,
              visitor_agent_name: item.visitor_agent_name,
              transporter: item.transporter,
              container_type_and_content: item.container_type_and_content,
              delivery_id: item.delivery_id,
              original_history_data: item,
            }),
            JSON.stringify({
              sync_source: "localStorage_history",
              sync_date: new Date().toISOString(),
              source_page: "resp_liv.html",
              history_button: "historique",
            }),
            false, // Les livraisons ne sont pas restaurables
          ]
        );

        syncedArchives.push(archiveResult.rows[0]);
        successCount++;

        console.log(`✅ Archivé: ${dossier_reference} - ${item.client_name}`);
      } catch (itemError) {
        console.error(
          `❌ Erreur lors de l'archivage de ${
            item.declaration_number || item.dossier_number
          }:`,
          itemError
        );
        errorCount++;
      }
    }

    console.log(
      `🎯 Synchronisation terminée: ${successCount} succès, ${errorCount} erreurs`
    );

    res.json({
      success: true,
      message: `Synchronisation terminée: ${successCount} dossiers archivés`,
      synced_count: successCount,
      error_count: errorCount,
      synced_archives: syncedArchives,
    });
  } catch (err) {
    console.error("🚨 Erreur lors de la synchronisation de l'historique:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la synchronisation",
    });
  }
});

// Nettoyer les archives avec des références invalides (N/A, NULL, vides)
app.post("/api/archives/clean-invalid", async (req, res) => {
  try {
    console.log("🧹 Nettoyage des archives avec références invalides...");

    // Supprimer tous les dossiers livrés avec des références invalides
    const deleteQuery = `
      DELETE FROM archives_dossiers 
      WHERE action_type = 'livraison' 
      AND (
        dossier_reference IS NULL 
        OR dossier_reference = '' 
        OR dossier_reference = 'N/A'
        OR TRIM(dossier_reference) = ''
      )
      RETURNING id, dossier_reference, client_name
    `;

    const result = await pool.query(deleteQuery);

    console.log(
      `✅ Nettoyage terminé: ${result.rows.length} archives invalides supprimées`
    );

    // Log des éléments supprimés
    result.rows.forEach((row) => {
      console.log(
        `   🗑️ Supprimé: ID=${row.id}, Ref="${row.dossier_reference}", Client="${row.client_name}"`
      );
    });

    res.json({
      success: true,
      message: `Nettoyage terminé: ${result.rows.length} archives invalides supprimées`,
      deleted_count: result.rows.length,
      deleted_archives: result.rows,
    });
  } catch (err) {
    console.error("🚨 Erreur lors du nettoyage des archives:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du nettoyage",
    });
  }
});

// Réparer les dossiers avec références NULL en utilisant les métadonnées
app.post("/api/archives/repair-references", async (req, res) => {
  try {
    console.log("🔧 Réparation des références de dossiers NULL...");

    // Récupérer tous les dossiers de livraison avec référence NULL
    const nullRefQuery = `
      SELECT id, dossier_reference, client_name, metadata, dossier_data
      FROM archives_dossiers 
      WHERE action_type = 'livraison' 
      AND dossier_reference IS NULL
    `;

    const nullRefResult = await pool.query(nullRefQuery);
    console.log(
      `📋 Trouvé ${nullRefResult.rows.length} dossiers avec référence NULL`
    );

    let repairedCount = 0;
    let deletedCount = 0;

    for (const row of nullRefResult.rows) {
      try {
        const metadata = row.metadata;
        const dossierData = row.dossier_data;

        // Chercher le dossier_number dans les métadonnées original_data
        let dossierNumber = null;

        if (
          metadata &&
          metadata.original_data &&
          metadata.original_data.dossier_number
        ) {
          dossierNumber = metadata.original_data.dossier_number;
        } else if (dossierData && dossierData.dossier_number) {
          dossierNumber = dossierData.dossier_number;
        }

        if (
          dossierNumber &&
          dossierNumber !== "N/A" &&
          dossierNumber.trim() !== ""
        ) {
          // Mettre à jour avec le bon numéro de dossier
          await pool.query(
            `UPDATE archives_dossiers 
             SET dossier_reference = $1 
             WHERE id = $2`,
            [dossierNumber, row.id]
          );

          console.log(
            `✅ Réparé: ID=${row.id}, Nouvelle ref="${dossierNumber}", Client="${row.client_name}"`
          );
          repairedCount++;
        } else {
          // Supprimer si aucun numéro de dossier valide trouvé
          await pool.query(`DELETE FROM archives_dossiers WHERE id = $1`, [
            row.id,
          ]);

          console.log(
            ` ️ Supprimé: ID=${row.id}, Aucune ref valide, Client="${row.client_name}"`
          );
          deletedCount++;
        }
      } catch (itemError) {
        console.error(
          `❌ Erreur lors de la réparation de l'ID ${row.id}:`,
          itemError
        );
      }
    }

    console.log(
      `🎯 Réparation terminée: ${repairedCount} réparés, ${deletedCount} supprimés`
    );

    res.json({
      success: true,
      message: `Réparation terminée: ${repairedCount} références réparées, ${deletedCount} dossiers supprimés`,
      repaired_count: repairedCount,
      deleted_count: deletedCount,
    });
  } catch (err) {
    console.error("🚨 Erreur lors de la réparation des références:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la réparation",
    });
  }
});

// Route pour obtenir les statistiques de stockage détaillées
app.get("/api/storage-stats", async (req, res) => {
  try {
    console.log("📊 Calcul des statistiques de stockage côté serveur...");

    // 1. Calculer la taille totale des archives avec métadonnées
    const archivesQuery = `
      SELECT 
        COUNT(*) as total_archives,
        SUM(
          CASE 
            WHEN dossier_data IS NOT NULL THEN LENGTH(dossier_data::text)
            ELSE 0
          END +
          CASE 
            WHEN metadata IS NOT NULL THEN LENGTH(metadata::text)
            ELSE 0
          END
        ) as total_size_bytes,
        action_type,
        DATE_TRUNC('month', archived_at) as month
      FROM archives_dossiers 
      GROUP BY action_type, DATE_TRUNC('month', archived_at)
      ORDER BY month DESC, action_type
    `;

    const archivesResult = await pool.query(archivesQuery);

    // 2. Calculer la taille des fichiers uploadés
    const fs = require("fs");
    const path = require("path");
    const uploadsDir = path.join(__dirname, "uploads");

    let uploadsSize = 0;
    let uploadsCount = 0;

    try {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          uploadsSize += stats.size;
          uploadsCount++;
        }
      }
    } catch (err) {
      console.warn("⚠️ Erreur lors du calcul des uploads:", err.message);
    }

    // 3. Statistiques par type d'action
    const typeStatsQuery = `
      SELECT 
        action_type,
        COUNT(*) as count,
        SUM(
          CASE 
            WHEN dossier_data IS NOT NULL THEN LENGTH(dossier_data::text)
            ELSE 0
          END +
          CASE 
            WHEN metadata IS NOT NULL THEN LENGTH(metadata::text)
            ELSE 0
          END
        ) as size_bytes,
        MIN(archived_at) as oldest_date,
        MAX(archived_at) as newest_date
      FROM archives_dossiers 
      GROUP BY action_type
      ORDER BY size_bytes DESC
    `;

    const typeStatsResult = await pool.query(typeStatsQuery);

    // 4. Statistiques par mois (derniers 12 mois)
    const monthlyQuery = `
      SELECT 
        DATE_TRUNC('month', archived_at) as month,
        COUNT(*) as count,
        SUM(
          CASE 
            WHEN dossier_data IS NOT NULL THEN LENGTH(dossier_data::text)
            ELSE 0
          END +
          CASE 
            WHEN metadata IS NOT NULL THEN LENGTH(metadata::text)
            ELSE 0
          END
        ) as size_bytes
      FROM archives_dossiers 
      WHERE archived_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', archived_at)
      ORDER BY month DESC
    `;

    const monthlyResult = await pool.query(monthlyQuery);

    // 5. Top 10 des plus gros dossiers
    const topSizeQuery = `
      SELECT 
        id,
        dossier_reference,
        client_name,
        action_type,
        (
          CASE 
            WHEN dossier_data IS NOT NULL THEN LENGTH(dossier_data::text)
            ELSE 0
          END +
          CASE 
            WHEN metadata IS NOT NULL THEN LENGTH(metadata::text)
            ELSE 0
          END
        ) as size_bytes,
        archived_at
      FROM archives_dossiers 
      ORDER BY size_bytes DESC
      LIMIT 10
    `;

    const topSizeResult = await pool.query(topSizeQuery);

    // Calculs totaux
    const totalArchivesSize = typeStatsResult.rows.reduce(
      (sum, row) => sum + parseInt(row.size_bytes || 0),
      0
    );
    const totalArchivesCount = typeStatsResult.rows.reduce(
      (sum, row) => sum + parseInt(row.count || 0),
      0
    );
    const totalStorageSize = totalArchivesSize + uploadsSize;

    // Formatage des données
    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const result = {
      summary: {
        total_storage_size: totalStorageSize,
        total_storage_formatted: formatBytes(totalStorageSize),
        archives_size: totalArchivesSize,
        archives_formatted: formatBytes(totalArchivesSize),
        uploads_size: uploadsSize,
        uploads_formatted: formatBytes(uploadsSize),
        total_archives_count: totalArchivesCount,
        uploads_count: uploadsCount,
        estimated_monthly_growth:
          monthlyResult.rows.length > 1
            ? parseInt(monthlyResult.rows[0]?.size_bytes || 0) -
              parseInt(monthlyResult.rows[1]?.size_bytes || 0)
            : 0,
      },
      by_type: typeStatsResult.rows.map((row) => ({
        action_type: row.action_type,
        count: parseInt(row.count),
        size_bytes: parseInt(row.size_bytes || 0),
        size_formatted: formatBytes(parseInt(row.size_bytes || 0)),
        oldest_date: row.oldest_date,
        newest_date: row.newest_date,
      })),
      monthly_stats: monthlyResult.rows.map((row) => ({
        month: row.month,
        count: parseInt(row.count),
        size_bytes: parseInt(row.size_bytes || 0),
        size_formatted: formatBytes(parseInt(row.size_bytes || 0)),
      })),
      top_largest: topSizeResult.rows.map((row) => ({
        id: row.id,
        dossier_reference: row.dossier_reference,
        client_name: row.client_name,
        action_type: row.action_type,
        size_bytes: parseInt(row.size_bytes || 0),
        size_formatted: formatBytes(parseInt(row.size_bytes || 0)),
        archived_at: row.archived_at,
      })),
      generated_at: new Date().toISOString(),
    };

    console.log(
      `📊 Statistiques calculées: ${formatBytes(totalStorageSize)} total`
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(
      "🚨 Erreur lors du calcul des statistiques de stockage:",
      err
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du calcul des statistiques",
    });
  }
});

// Nettoyage automatique des archives de plus de 2 ans
async function cleanOldArchives() {
  console.log("Démarrage du nettoyage des archives de plus de 2 ans...");
  try {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const query = `
      DELETE FROM archives_dossiers
      WHERE archived_at < $1
      RETURNING id;
    `;
    const result = await pool.query(query, [twoYearsAgo]);
    console.log(
      `Nettoyage terminé : ${result.rowCount} archives supprimées automatiquement.`
    );
  } catch (error) {
    console.error("Erreur lors du nettoyage automatique des archives :", error);
  }
}

// Archivage automatique des ordres de livraison de plus de 7 jours
async function archiveOldOrders() {
  console.log(
    "Démarrage de l'archivage automatique des ordres de livraison de plus de 7 jours..."
  );
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Rechercher les dossiers de plus de 7 jours qui ne sont pas encore archivés
    const findQuery = `
      SELECT * FROM livraison_conteneur 
      WHERE created_at < $1 
        AND NOT EXISTS (
          SELECT 1 FROM archives_dossiers 
          WHERE CAST(dossier_id AS TEXT) = CAST(livraison_conteneur.id AS TEXT)
        )
      ORDER BY created_at ASC
    `;

    const oldOrders = await pool.query(findQuery, [oneWeekAgo]);

    console.log(
      `Trouvé ${oldOrders.rowCount} ordres de livraison à archiver automatiquement.`
    );

    let archivedCount = 0;

    for (const order of oldOrders.rows) {
      try {
        // Préparer les données pour l'archivage
        const archiveData = {
          dossier_id: order.id,
          dossier_reference:
            order.dossier_number ||
            order.container_number ||
            `AUTO-${order.id}`,
          intitule: order.container_type_and_content || "",
          client_name: order.client_name || "",
          role_source: "Système - Archivage automatique",
          page_origine: "Historique Ordres de livraison",
          action_type: "ordre_livraison_etabli", // Nouveau type d'action
          archived_by: "Système",
          archived_by_email: "",
          dossier_data: order,
          metadata: {
            archived_from_url: "Auto-archivage",
            user_agent: "Système automatique",
            timestamp: new Date().toISOString(),
            auto_archive_reason: "Ordre de livraison de plus de 7 jours",
          },
        };

        // Insérer dans les archives
        const insertQuery = `
          INSERT INTO archives_dossiers (
            dossier_id, dossier_reference, intitule, client_name,
            role_source, page_origine, action_type, archived_by,
            archived_by_email, dossier_data, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id
        `;

        await pool.query(insertQuery, [
          archiveData.dossier_id,
          archiveData.dossier_reference,
          archiveData.intitule,
          archiveData.client_name,
          archiveData.role_source,
          archiveData.page_origine,
          archiveData.action_type,
          archiveData.archived_by,
          archiveData.archived_by_email,
          JSON.stringify(archiveData.dossier_data),
          JSON.stringify(archiveData.metadata),
        ]);

        archivedCount++;
      } catch (error) {
        console.error(
          `Erreur lors de l'archivage automatique du dossier ${order.id}:`,
          error
        );
      }
    }

    console.log(
      `Archivage automatique terminé : ${archivedCount} ordres de livraison archivés automatiquement.`
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'archivage automatique des ordres de livraison :",
      error
    );
  }
}

app.use("/uploads", express.static(uploadDir));

// (Gardez la route spécifique si besoin)
app.get("/interfaceFormulaireEmployer.html", (req, res) => {
  res.sendFile(path.join(__dirname, "interfaceFormulaireEmployer.html"));
});

// Les deux lignes suivantes sont supprimées car déjà géré plus haut :
// app.use(express.static(path.join(__dirname)));
// app.use(express.static(path.join(__dirname, "public")));

// ===============================
// --- ROUTE PATCH: Mise à jour du statut d'un conteneur individuel ---
// ===============================
// ===============================
// --- ROUTE PATCH: Ramener une livraison au Resp. Acconier ---
// ===============================
app.patch("/deliveries/:id/return-to-resp-acconier", async (req, res) => {
  const { id } = req.params;
  try {
    // Met à jour le statut acconier à 'en attente de paiement' (retour Resp. Acconier)
    const result = await pool.query(
      "UPDATE livraison_conteneur SET delivery_status_acconier = $1 WHERE id = $2 RETURNING *;",
      ["en attente de paiement", id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livraison non trouvée." });
    }
    // Envoi WebSocket pour notification instantanée
    const wss = req.app.get("wss");
    const updatedDelivery = result.rows[0];
    const alertMessage = `La livraison du dossier '${
      updatedDelivery.dossier_number || updatedDelivery.id
    }' a été ramenée au Resp. Acconier.`;
    const payload = JSON.stringify({
      type: "delivery_returned_acconier",
      message: alertMessage,
      deliveryId: updatedDelivery.id,
      delivery: updatedDelivery,
      alertType: "info",
    });
    if (wss && wss.clients) {
      // Correction : utiliser WebSocket.OPEN importé en haut du fichier
      const WebSocket = require("ws");
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
    return res.json({ success: true, delivery: updatedDelivery });
  } catch (err) {
    console.error("Erreur PATCH retour Resp. Acconier:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});
// ===============================
// --- ROUTE PATCH: Mise à jour du statut acconier d'une livraison ---
// ===============================
app.patch("/deliveries/:id/acconier-status", async (req, res) => {
  const { id } = req.params;
  const { delivery_status_acconier } = req.body || {};
  const allowedStatuses = [
    "awaiting_payment_acconier",
    "in_progress_payment_acconier",
    "pending_acconier",
    "mise_en_livraison_acconier",
    "payment_done_acconier",
    "processed_acconier",
    "rejected_acconier",
    "rejected_by_employee",
  ];
  if (
    !delivery_status_acconier ||
    !allowedStatuses.includes(delivery_status_acconier)
  ) {
    return res.status(400).json({
      success: false,
      message: "Statut acconier non autorisé ou manquant.",
    });
  }
  try {
    const result = await pool.query(
      "UPDATE livraison_conteneur SET delivery_status_acconier = $1 WHERE id = $2 RETURNING *;",
      [delivery_status_acconier, id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livraison non trouvée." });
    }
    // Envoi WebSocket uniquement si le statut est 'mise_en_livraison_acconier'
    if (delivery_status_acconier === "mise_en_livraison_acconier") {
      const updatedDelivery = result.rows[0];
      const wss = req.app.get("wss") || global.wss;
      const dossierNumber =
        updatedDelivery.dossier_number || updatedDelivery.id;
      // Envoi du message WebSocket au format attendu par le dashboard
      const payloadDossier = JSON.stringify({
        type: "dossier_status_update",
        dossierNumber: dossierNumber,
        newStatus: "Mise en livraison",
      });
      if (wss && wss.clients) {
        const WebSocket = require("ws");
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payloadDossier);
          }
        });
      }
    }
    return res.json({ success: true, delivery: result.rows[0] });
  } catch (err) {
    console.error("Erreur PATCH delivery_status_acconier:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ===============================
// --- ROUTE PATCH: Mise à jour du statut d'un conteneur individuel ---
// ===============================
app.patch("/deliveries/:id/container-status", async (req, res) => {
  const { id } = req.params;
  const { containerNumber, status } = req.body || {};
  if (!containerNumber || !status) {
    return res.status(400).json({
      success: false,
      message: "Numéro de conteneur et statut requis.",
    });
  }
  try {
    // Récupère la livraison existante
    const result = await pool.query(
      "SELECT container_statuses, container_number FROM livraison_conteneur WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livraison non trouvée." });
    }

    // --- FONCTION DE NORMALISATION (plus robuste) ---
    function normalizeContainerStatuses(raw, container_number_csv) {
      // Si déjà un mapping objet (pas un Array), retourne une copie
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        return { ...raw };
      }
      // Si tableau d'objets {tc, status} ou {numeroTC, statut}
      if (
        Array.isArray(raw) &&
        raw.length > 0 &&
        typeof raw[0] === "object" &&
        raw[0] !== null &&
        ("tc" in raw[0] || "numeroTC" in raw[0])
      ) {
        const mapping = {};
        raw.forEach((item) => {
          const tc = item.tc || item.numeroTC;
          if (tc) mapping[tc] = item.status || item.statut || item.value || "-";
        });
        return mapping;
      }
      // Si tableau de strings (statuts), on mappe sur la liste des TC
      if (
        Array.isArray(raw) &&
        raw.length > 0 &&
        typeof raw[0] === "string" &&
        container_number_csv
      ) {
        const tcList = String(container_number_csv)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const mapping = {};
        tcList.forEach((tc, idx) => {
          mapping[tc] = raw[idx] || "-";
        });
        return mapping;
      }
      // Si tableau vide ou non reconnu
      if (Array.isArray(raw)) {
        return {};
      }
      // Si string JSON
      if (typeof raw === "string") {
        try {
          return normalizeContainerStatuses(
            JSON.parse(raw),
            container_number_csv
          );
        } catch (e) {
          return {};
        }
      }
      // Sinon, retourne objet vide
      return {};
    }

    // --- NORMALISATION ---
    let container_statuses = {};
    if (result.rows[0].container_statuses) {
      try {
        const raw =
          typeof result.rows[0].container_statuses === "string"
            ? JSON.parse(result.rows[0].container_statuses)
            : result.rows[0].container_statuses;
        container_statuses = normalizeContainerStatuses(
          raw,
          result.rows[0].container_number
        );
      } catch (e) {
        container_statuses = {};
      }
    } else {
      container_statuses = normalizeContainerStatuses(
        null,
        result.rows[0].container_number
      );
    }
    console.log(
      `[PATCH][DEBUG] Avant update (normalisé) : container_statuses=`,
      container_statuses
    );
    // Met à jour le statut du conteneur demandé
    container_statuses[containerNumber] = status;
    console.log(
      `[PATCH][DEBUG] Après modification : container_statuses=`,
      container_statuses
    );
    // Met à jour la base
    // Vérifie si tous les conteneurs sont livrés
    let tcListCheck = [];
    if (result.rows[0].container_number) {
      if (Array.isArray(result.rows[0].container_number)) {
        tcListCheck = result.rows[0].container_number.filter(Boolean);
      } else if (typeof result.rows[0].container_number === "string") {
        tcListCheck = result.rows[0].container_number
          .split(/[,;\s]+/)
          .filter(Boolean);
      }
    }
    const allDelivered =
      tcListCheck.length > 0 &&
      tcListCheck.every((tc) => {
        const s = container_statuses[tc];
        return s === "livre" || s === "livré";
      });
    let updateQuery = "UPDATE livraison_conteneur SET container_statuses = $1";
    let updateValues = [JSON.stringify(container_statuses)];
    if (allDelivered) {
      updateQuery += ", delivery_status_acconier = $2";
      updateValues.push("mise_en_livraison_acconier");
      updateQuery += " WHERE id = $3 RETURNING *;";
      updateValues.push(id);
    } else {
      updateQuery += " WHERE id = $2 RETURNING *;";
      updateValues.push(id);
    }
    const updateRes = await pool.query(updateQuery, updateValues);
    if (updateRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Erreur lors de la mise à jour." });
    }
    // Relit la ligne complète pour vérificationszssd
    const checkRes = await pool.query(
      "SELECT id, container_statuses FROM livraison_conteneur WHERE id = $1",
      [id]
    );
    if (checkRes.rows.length > 0) {
      let persisted = checkRes.rows[0].container_statuses;
      if (typeof persisted === "string") {
        try {
          persisted = JSON.parse(persisted);
        } catch (e) {}
      }
      console.log(
        `[PATCH][DEBUG] En base après update (id=${id}) :`,
        persisted
      );
    }
    // Envoi WebSocket (optionnel)
    const wss = req.app.get("wss");
    const updatedDelivery = updateRes.rows[0];
    const alertMessage = `Statut du conteneur '${containerNumber}' mis à jour à '${status}'.`;
    // Calcul du nombre de conteneurs livrés et du total pour cette livraison
    let total = 0;
    let delivered = 0;
    let tcList = [];
    if (updatedDelivery.container_number) {
      if (Array.isArray(updatedDelivery.container_number)) {
        tcList = updatedDelivery.container_number.filter(Boolean);
      } else if (typeof updatedDelivery.container_number === "string") {
        tcList = updatedDelivery.container_number
          .split(/[,;\s]+/)
          .filter(Boolean);
      }
      total = tcList.length;
    }
    let container_statuses_updated = {};
    if (updatedDelivery.container_statuses) {
      try {
        container_statuses_updated =
          typeof updatedDelivery.container_statuses === "string"
            ? JSON.parse(updatedDelivery.container_statuses)
            : updatedDelivery.container_statuses;
      } catch (e) {
        container_statuses_updated = {};
      }
    }
    delivered = tcList.filter((tc) => {
      const s = container_statuses_updated[tc];
      return s === "livre" || s === "livré";
    }).length;

    // Déterminer le changement de statut du dossier pour les compteurs du tableau de bord
    let statusChange = null;
    const wasDeliveredBefore =
      status === "livre" || status === "livré" ? delivered - 1 : delivered;
    const isDeliveredNow = delivered;

    console.log(
      `[STATUS CHANGE DEBUG] Dossier ${updatedDelivery.dossier_number}: ${wasDeliveredBefore}/${total} -> ${isDeliveredNow}/${total}`
    );

    // Cas 1: Le dossier passe de partiellement livré à complètement livré
    if (isDeliveredNow === total && total > 0 && wasDeliveredBefore < total) {
      statusChange = {
        from: "mise_en_livraison",
        to: "livre",
        dossierNumber: updatedDelivery.dossier_number,
        message: `Dossier ${
          updatedDelivery.dossier_number || updatedDelivery.id
        } complètement livré`,
        action: "delivery_completed",
      };

      // Synchronisation des cartes : Dossier passe de "mise en livraison" à "livré"
      broadcastCardCounterUpdate(
        "status-change",
        updatedDelivery.dossier_number || updatedDelivery.id,
        "delivery_completed",
        statusChange.message
      );

      console.log(
        `[STATUS CHANGE] ✅ Dossier complètement livré: ${updatedDelivery.dossier_number}`
      );
    }
    // Cas 2: Premier conteneur livré (0 -> 1+)
    else if (isDeliveredNow > 0 && wasDeliveredBefore === 0) {
      statusChange = {
        from: "en_attente_paiement",
        to: "mise_en_livraison",
        dossierNumber: updatedDelivery.dossier_number,
        message: `Dossier ${
          updatedDelivery.dossier_number || updatedDelivery.id
        } mis en livraison`,
        action: "delivery_started",
      };

      // Synchronisation des cartes : Dossier passe de "en attente" à "mise en livraison"
      broadcastCardCounterUpdate(
        "status-change",
        updatedDelivery.dossier_number || updatedDelivery.id,
        "delivery_started",
        statusChange.message
      );

      console.log(
        `[STATUS CHANGE] ⚡ Premier conteneur livré: ${updatedDelivery.dossier_number}`
      );
    }
    // Cas 3: Ajout d'un conteneur livré (mais pas le dernier)
    else if (isDeliveredNow > wasDeliveredBefore && isDeliveredNow < total) {
      statusChange = {
        from: "mise_en_livraison",
        to: "mise_en_livraison",
        dossierNumber: updatedDelivery.dossier_number,
        message: `Conteneur supplémentaire livré pour le dossier ${
          updatedDelivery.dossier_number || updatedDelivery.id
        }`,
        action: "container_delivered",
      };
      console.log(
        `[STATUS CHANGE] 📦 Conteneur supplémentaire livré: ${updatedDelivery.dossier_number}`
      );
    }

    // Envoi du ratio livré/total pour la livraison concernée (deliveryId)
    const payload = JSON.stringify({
      type: "container_status_update",
      message: alertMessage,
      deliveryId: updatedDelivery.id,
      containerNumber,
      status,
      alertType: "success",
      deliveredCount: delivered,
      totalCount: total,
    });
    wss.clients.forEach((client) => {
      if (client.readyState === require("ws").OPEN) {
        client.send(payload);
      }
    });

    // Envoi spécifique pour mise à jour des compteurs du tableau de bord
    if (statusChange) {
      const dashboardPayload = JSON.stringify({
        type: "status-change",
        statusChange: statusChange,
        deliveryId: updatedDelivery.id,
        dossierNumber: updatedDelivery.dossier_number,
        message: statusChange.message,
        action: statusChange.action,
        deliveredCount: delivered,
        totalCount: total,
      });
      wss.clients.forEach((client) => {
        if (client.readyState === require("ws").OPEN) {
          client.send(dashboardPayload);
        }
      });
      console.log(
        `[DASHBOARD NOTIFICATION] 🚀 Envoi changement de statut:`,
        statusChange
      );
    }

    // Envoi supplémentaire pour forcer mise à jour immédiate des compteurs
    const forceUpdatePayload = JSON.stringify({
      type: "container_status_update",
      message: alertMessage,
      deliveryId: updatedDelivery.id,
      dossierNumber: updatedDelivery.dossier_number,
      containerNumber,
      status,
      alertType: "success",
      deliveredCount: delivered,
      totalCount: total,
      forceCounterUpdate: true,
    });
    wss.clients.forEach((client) => {
      if (client.readyState === require("ws").OPEN) {
        client.send(forceUpdatePayload);
      }
    });
    console.log(
      `[FORCE UPDATE] 💥 Forçage mise à jour compteurs pour conteneur ${containerNumber} -> ${status}`
    );
    res.status(200).json({
      success: true,
      message: alertMessage,
      delivery: updatedDelivery,
      deliveredCount: delivered,
      totalCount: total,
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour du statut du conteneur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du statut du conteneur.",
    });
  }
});

// ===============================
// ROUTE POUR SERVIR index.html À LA RACINE (doit être placée APRÈS toutes les autres routes)
// ===============================

// ===============================
// HEADER CSP pour autoriser Google Translate et ressources externes nécessaires
// ===============================
// ROUTE NOTIFICATION AGENT ACCONIER (envoi email)
// ===============================
//const nodemailer = require("nodemailer");

app.post("/notify-agent", async (req, res) => {
  const { agent, dossier } = req.body || {};
  if (!agent || !dossier) {
    return res
      .status(400)
      .json({ success: false, message: "Agent et dossier requis." });
  }
  try {
    // Recherche l'email de l'agent dans la base acconier
    const result = await pool.query(
      "SELECT email FROM acconier WHERE nom = $1 LIMIT 1",
      [agent]
    );
    if (!result.rows.length || !result.rows[0].email) {
      return res
        .status(404)
        .json({ success: false, message: "Email de l'agent non trouvé." });
    }
    const agentEmail = result.rows[0].email;

    // Prépare le message personnalisé (HTML)
    const subject = `ITS service - Dossier en retard de paiement`;
    const html = `
      <div style="font-family:Arial,sans-serif;font-size:1.08em;color:#222;">
        <div style="font-size:1.15em;font-weight:bold;margin-bottom:12px;">ITS service</div>
        <div style="margin-bottom:18px;">Bonjour monsieur,</div>
        <div style="margin-bottom:18px;">Le dossier <span style='color:#b91c1c;font-weight:bold;font-size:1.15em;'>"${dossier}"</span> est en retard de paiement.</div>
        <div style="margin-bottom:18px;"><span style='color:#b91c1c;font-weight:bold;font-size:1.08em;'>Chercher à régler ce dossier plus tôt que prévu</span>, pour éviter certain soucis.</div>
      </div>
    `;

    // Configure le transporteur SMTP (à adapter selon ton serveur mail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "ton.email@gmail.com", // À remplacer par ton email
        pass: "ton_mot_de_passe", // À remplacer par ton mot de passe ou app password
      },
    });

    await transporter.sendMail({
      from: "ton.email@gmail.com", // À remplacer
      to: agentEmail,
      subject,
      html,
    });
    res.json({ success: true, message: "Email envoyé à l'agent." });
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email agent:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'envoi de l'email.",
    });
  }
});
// ===============================
// ROUTE NOTIFICATION DOSSIER EN RETARD (copie de /notify-agent)123
// ===============================
app.post("/notify-late-dossier", async (req, res) => {
  const { agent, dossier } = req.body || {};
  if (!agent || !dossier) {
    return res
      .status(400)
      .json({ success: false, message: "Agent et dossier requis." });
  }
  try {
    // Recherche l'email de l'agent dans la base acconier
    const result = await pool.query(
      "SELECT email FROM acconier WHERE nom = $1 LIMIT 1",
      [agent]
    );
    if (!result.rows.length || !result.rows[0].email) {
      return res
        .status(404)
        .json({ success: false, message: "Email de l'agent non trouvé." });
    }
    const agentEmail = result.rows[0].email;

    // Prépare le message
    const subject = `Notification dossier en retard`;
    const text = `Bonjour ${agent},\n\nVous avez un dossier ${dossier} en retard. Veuillez revisualiser ce dossier plus vite.`;

    // Configure le transporteur SMTP (à adapter selon ton serveur mail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "ton.email@gmail.com", // À remplacer par ton email
        pass: "ton_mot_de_passe", // À remplacer par ton mot de passe ou app password
      },
    });

    await transporter.sendMail({
      from: "ton.email@gmail.com", // À remplacer
      to: agentEmail,
      subject,
      text,
    });
    res.json({ success: true, message: "Email envoyé à l'agent." });
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email agent:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'envoi de l'email.",
    });
  }
});
// ===============================
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.googleapis.com https://translate.google.com https://www.gstatic.com https://www.google.com https://cdn.tailwindcss.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com https://translate.google.com https://www.gstatic.com https://www.google.com https://cdnjs.cloudflare.com https://cdn.tailwindcss.com",
      "img-src 'self' data: https://translate.googleapis.com https://translate.google.com https://www.gstatic.com https://www.google.com",
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "frame-src 'self' https://translate.google.com https://www.google.com",
      "connect-src 'self' https://translate.googleapis.com https://translate.google.com https://www.gstatic.com https://www.google.com",
    ].join("; ")
  );
  next();
});

// (Déplacé tout en bas du fichier)

// ===============================
// PATCH: Mise à jour du statut BL (bl_statuses) pour une livraison
// ===============================
app.patch("/deliveries/:id/bl-status", async (req, res) => {
  const { id } = req.params;
  const { blNumber, status } = req.body || {};
  if (!blNumber || typeof status !== "string") {
    return res.status(400).json({
      success: false,
      message: "Paramètres manquants (blNumber, status)",
    });
  }
  try {
    // Récupère la livraison existante pour comparaison
    const result = await pool.query(
      "SELECT * FROM livraison_conteneur WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livraison non trouvée" });
    }

    const existingDelivery = result.rows[0];

    let bl_statuses = existingDelivery.bl_statuses || {};
    if (typeof bl_statuses === "string") {
      try {
        bl_statuses = JSON.parse(bl_statuses);
      } catch {
        bl_statuses = {};
      }
    }

    // Garde l'ancien statut pour détecter le changement
    const previousStatus = existingDelivery.delivery_status_acconier;
    const previousBLStatus = bl_statuses[blNumber];

    bl_statuses[blNumber] = status;
    // Vérifie si tous les BL sont en 'mise_en_livraison'
    let blList = [];
    if (existingDelivery.bl_number) {
      if (Array.isArray(existingDelivery.bl_number)) {
        blList = existingDelivery.bl_number.filter(Boolean);
      } else if (typeof existingDelivery.bl_number === "string") {
        blList = existingDelivery.bl_number.split(/[,;\s]+/).filter(Boolean);
      }
    }
    const allMiseEnLivraison =
      blList.length > 0 &&
      blList.every((bl) => bl_statuses[bl] === "mise_en_livraison");

    // Détecte le changement d'état du dossier
    const wasAllMiseEnLivraison =
      previousStatus === "mise_en_livraison_acconier";
    const willBeAllMiseEnLivraison = allMiseEnLivraison;
    // Sauvegarde en base
    let updateQuery = "UPDATE livraison_conteneur SET bl_statuses = $1";
    let updateValues = [JSON.stringify(bl_statuses)];
    if (allMiseEnLivraison) {
      updateQuery += ", delivery_status_acconier = $2";
      updateValues.push("mise_en_livraison_acconier");
      updateQuery += " WHERE id = $3 RETURNING *;";
      updateValues.push(id);
    } else {
      updateQuery += " WHERE id = $2 RETURNING *;";
      updateValues.push(id);
    }
    const updateRes = await pool.query(updateQuery, updateValues);
    if (updateRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Erreur lors de la mise à jour." });
    }
    const updatedDelivery = updateRes.rows[0];
    // Envoi WebSocket à tous les clients
    const wss = req.app.get("wss") || global.wss;
    const alertMsg = `Dossier '${
      updatedDelivery.dossier_number || updatedDelivery.id
    }' a été mis en livraison.`;

    // Gestion des changements d'état pour le dashboard
    if (!wasAllMiseEnLivraison && willBeAllMiseEnLivraison) {
      // Le dossier vient de passer en "mise_en_livraison_acconier"
      // Il va disparaître du tableau resp_acconier, donc décrémenter "En attente de paiement"
      // et incrémenter "Dossiers mis en livraison"
      broadcastCardCounterUpdate(
        "dossier-entre-en-livraison",
        updatedDelivery.dossier_number || updatedDelivery.id,
        "increment_mise_en_livraison_decrement_attente",
        alertMsg
      );

      console.log(
        `[TRANSITION] 📋→🚛 Dossier ${
          updatedDelivery.dossier_number || updatedDelivery.id
        } : en_attente → mise_en_livraison`
      );
    }

    // Message BL (pour la colonne BL)
    const payloadBL = JSON.stringify({
      type: "bl_status_update",
      delivery: updatedDelivery,
      message: alertMsg,
      dossierNumber: updatedDelivery.dossier_number || updatedDelivery.id,
    });
    // Message statut dossier (pour la colonne Responsable Acconier)
    const payloadDossier = JSON.stringify({
      type: "dossier_status_update",
      dossierNumber: updatedDelivery.dossier_number || updatedDelivery.id,
      newStatus: "Mise en livraison",
    });
    if (wss && wss.clients) {
      wss.clients.forEach((client) => {
        if (client.readyState === require("ws").OPEN) {
          client.send(payloadBL);
          client.send(payloadDossier);
        }
      });
    }
    res.status(200).json({ success: true, delivery: updatedDelivery });
  } catch (err) {
    console.error("Erreur lors de la mise à jour du statut BL:", err);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la mise à jour du statut BL.",
    });
  }
});

// Route explicite pour acconier_auth.html
app.get("/html/acconier_auth.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "acconier_auth.html"));
});

// Route explicite pour repoLivAuth.html

app.get("/html/repoLivAuth.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "repoLivAuth.html"));
});

// ===============================
// ROUTE : Dossiers en attente de paiement (pour le tableau de bord)
// ===============================
app.get("/api/dossiers/attente-paiement", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         created_at AS date,
         employee_name AS agent,
         client_name AS nom,
         bl_number AS bl,
         dossier_number AS dossier,
         delivery_status_acconier
       FROM livraison_conteneur
       ORDER BY created_at DESC`
    );
    // Log pour debug : voir ce que la base retourne réellement
    console.log(
      "[DEBUG] Résultats livraison_conteneur:",
      result.rows.map((r) => ({
        id: r.dossier,
        statut: r.delivery_status_acconier,
        agent: r.agent,
        client: r.nom,
      }))
    );
    // Filtrage : inclure aussi 'pending_acconier' et 'in_progress_payment_acconier'
    const dossiers = result.rows.filter((row) => {
      const statut = (row.delivery_status_acconier || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      return (
        (statut.includes("attente") && statut.includes("paiement")) ||
        statut === "pending_acconier" ||
        statut === "in_progress_payment_acconier"
      );
    });
    res.json({
      success: true,
      dossiers,
    });
  } catch (err) {
    console.error("Erreur /api/dossiers/attente-paiement :", err);
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des dossiers en attente de paiement.",
    });
  }
});

// ===============================
// ROUTE : Dossiers en retard (pour le tableau de bord)
// ===============================
app.get("/api/dossiers/retard", async (req, res) => {
  try {
    // Récupérer les dossiers en retard d'acconier (existant)
    const resultAcconier = await pool.query(
      `SELECT * FROM livraison_conteneur ORDER BY created_at DESC`
    );

    const now = new Date();

    // Logique métier pour les dossiers acconier en retard
    const dossiersRetardAcconier = (resultAcconier.rows || []).filter((d) => {
      let dDate = d.delivery_date || d.created_at;
      if (!dDate) return false;
      let dateObj = new Date(dDate);
      if (isNaN(dateObj.getTime())) return false;
      const diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) return false;
      if (d.delivery_status_acconier === "en attente de paiement") {
        return true;
      }
      let blList = [];
      if (Array.isArray(d.bl_number)) {
        blList = d.bl_number.filter(Boolean);
      } else if (typeof d.bl_number === "string") {
        blList = d.bl_number.split(/[,;\s]+/).filter(Boolean);
      }
      let blStatuses = blList.map((bl) =>
        d.bl_statuses && d.bl_statuses[bl] ? d.bl_statuses[bl] : "aucun"
      );
      if (
        blStatuses.length > 0 &&
        blStatuses.every((s) => s === "mise_en_livraison")
      ) {
        return false;
      }
      if (d.delivery_status_acconier === "mise_en_livraison_acconier") {
        return false;
      }
      return true;
    });

    // 🚀 NOUVEAU : Récupérer les dossiers en retard de livraison
    const dossiersRetardLivraison = (resultAcconier.rows || []).filter((d) => {
      // Dossiers en statut "mise_en_livraison_acconier" mais en retard de livraison
      if (d.delivery_status_acconier !== "mise_en_livraison_acconier") {
        return false;
      }

      let dDate = d.delivery_date || d.created_at;
      if (!dDate) return false;
      let dateObj = new Date(dDate);
      if (isNaN(dateObj.getTime())) return false;

      // Critère de retard pour livraison : plus de 3 jours depuis la mise en livraison
      const diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) return false;

      // Vérifier si pas encore livré (pas de données de livraison complétées)
      const hasDeliveryData =
        d.nom_agent_visiteur ||
        d.transporter ||
        d.driver_name ||
        d.delivery_notes;

      // En retard si en mise_en_livraison depuis plus de 3 jours ET pas de données de livraison
      return !hasDeliveryData;
    });

    // Formatage des dossiers acconier en retard
    const dossiersFormatesAcconier = dossiersRetardAcconier.map((d) => ({
      id: d.id,
      numero: d.dossier_number || d.id,
      client: d.client_name || "Client non défini",
      created_at: d.created_at,
      statut: d.delivery_status_acconier,
      type: "acconier", // Type pour différencier
      employee_name: d.employee_name || "Agent non défini",
      delivery_date: d.delivery_date,
    }));

    // 🚀 Formatage des dossiers livraison en retard
    const dossiersFormatesLivraison = dossiersRetardLivraison.map((d) => ({
      id: d.id,
      numero: d.dossier_number || d.id,
      client: d.client_name || "Client non défini",
      created_at: d.created_at,
      statut: "en_retard_livraison",
      type: "livraison", // Type pour différencier
      employee_name:
        d.resp_livreur || d.responsible_livreur || "Livreur non défini",
      delivery_date: d.delivery_date,
    }));

    // Combiner les deux listes
    const tousLesDossiersRetard = [
      ...dossiersFormatesAcconier,
      ...dossiersFormatesLivraison,
    ];

    console.log(
      `[API RETARD] 📋 Dossiers trouvés - Acconier: ${dossiersFormatesAcconier.length}, Livraison: ${dossiersFormatesLivraison.length}`
    );

    res.json(tousLesDossiersRetard);
  } catch (err) {
    console.error("Erreur /api/dossiers/retard :", err);
    res.json([]); // Renvoie un tableau vide en cas d'erreur pour éviter le crash frontend
  }
});

// ===============================
// ROUTE : Compteurs des statuts de dossiers (pour le tableau de bord)
// ===============================
app.get("/api/deliveries/status-counts", async (req, res) => {
  try {
    console.log(
      "[STATUS COUNTS] 🎯 Début du calcul des compteurs précis (par dossier unique)..."
    );

    const result = await pool.query(
      `SELECT * FROM livraison_conteneur ORDER BY created_at DESC`
    );

    const deliveries = result.rows || [];
    console.log(
      `[STATUS COUNTS] 📦 Total livraisons en DB: ${deliveries.length}`
    );

    // ÉTAPE 1: Regrouper par dossier_number pour éviter les doublons
    const dossiersMap = new Map();

    deliveries.forEach((delivery) => {
      const dossierKey = delivery.dossier_number || `AUTO_${delivery.id}`;

      if (!dossiersMap.has(dossierKey)) {
        dossiersMap.set(dossierKey, []);
      }
      dossiersMap.get(dossierKey).push(delivery);
    });

    console.log(
      `[STATUS COUNTS] 📋 Dossiers uniques trouvés: ${dossiersMap.size}`
    );

    const counts = {
      en_attente_paiement: 0,
      mise_en_livraison: 0,
      livres: 0,
      en_retard: 0,
    };

    const now = new Date();
    let debugCounts = {
      fullyDelivered: 0,
      visibleInRespLiv: 0,
      visibleInRespAcconier: 0,
      overdue: 0,
      skipped: 0,
    };

    // Fonction pour vérifier si UN DOSSIER est complètement livré
    function isDossierFullyDelivered(deliveriesInDossier) {
      // Agrégation de tous les conteneurs du dossier
      const allContainers = new Set();
      const allContainerStatuses = {};

      deliveriesInDossier.forEach((delivery) => {
        // Récupérer tous les conteneurs
        let tcList = [];
        if (
          delivery.container_numbers_list &&
          Array.isArray(delivery.container_numbers_list)
        ) {
          tcList = delivery.container_numbers_list.filter(Boolean);
        } else if (delivery.container_number) {
          if (Array.isArray(delivery.container_number)) {
            tcList = delivery.container_number.filter(Boolean);
          } else if (typeof delivery.container_number === "string") {
            tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
          }
        }

        tcList.forEach((tc) => allContainers.add(tc));

        // Récupérer les statuts des conteneurs
        if (delivery.container_statuses) {
          let container_statuses = {};
          try {
            container_statuses =
              typeof delivery.container_statuses === "string"
                ? JSON.parse(delivery.container_statuses)
                : delivery.container_statuses;
          } catch (e) {
            container_statuses = {};
          }

          Object.assign(allContainerStatuses, container_statuses);
        }
      });

      // Si pas de conteneurs, pas livré
      if (allContainers.size === 0) return false;

      // Vérifier que tous les conteneurs sont livrés
      const allDelivered = Array.from(allContainers).every((tc) => {
        const s = allContainerStatuses[tc];
        return s === "livre" || s === "livré";
      });

      return allDelivered;
    }

    // Fonction pour vérifier si UN DOSSIER est visible dans resp_acconier
    function isDossierVisibleInRespAcconier(deliveriesInDossier) {
      // Utiliser la première livraison comme référence pour les statuts de dossier
      const primaryDelivery = deliveriesInDossier[0];

      // Si le statut acconier est explicitement "en attente de paiement"
      if (
        primaryDelivery.delivery_status_acconier === "en attente de paiement"
      ) {
        return true;
      }

      // Exclure si statut acconier est 'mise_en_livraison_acconier' ou 'livré'
      if (
        primaryDelivery.delivery_status_acconier ===
          "mise_en_livraison_acconier" ||
        primaryDelivery.delivery_status_acconier === "livre" ||
        primaryDelivery.delivery_status_acconier === "livré"
      ) {
        return false;
      }

      // Vérifier si tous les BL du dossier sont en 'mise_en_livraison'
      const allBLStatuses = new Set();

      deliveriesInDossier.forEach((delivery) => {
        let blList = [];
        if (Array.isArray(delivery.bl_number)) {
          blList = delivery.bl_number.filter(Boolean);
        } else if (typeof delivery.bl_number === "string") {
          blList = delivery.bl_number.split(/[,;\s]+/).filter(Boolean);
        }

        let bl_statuses = {};
        try {
          bl_statuses =
            typeof delivery.bl_statuses === "string"
              ? JSON.parse(delivery.bl_statuses)
              : delivery.bl_statuses || {};
        } catch (e) {
          bl_statuses = {};
        }

        blList.forEach((bl) => {
          allBLStatuses.add(bl_statuses[bl] || "aucun");
        });
      });

      // Si tous les BL sont en 'mise_en_livraison', n'apparaît plus dans resp_acconier
      if (
        allBLStatuses.size > 0 &&
        Array.from(allBLStatuses).every((s) => s === "mise_en_livraison")
      ) {
        return false;
      }

      return true; // Visible dans resp_acconier (donc en attente de paiement)
    }

    // Fonction pour vérifier si UN DOSSIER est visible dans resp_liv
    function isDossierVisibleInRespLiv(deliveriesInDossier) {
      // Utiliser la première livraison comme référence
      const primaryDelivery = deliveriesInDossier[0];
      return (
        primaryDelivery.delivery_status_acconier ===
        "mise_en_livraison_acconier"
      );
    }

    // ÉTAPE 2: Analyser chaque dossier unique
    let dossierIndex = 0;
    dossiersMap.forEach((deliveriesInDossier, dossierNumber) => {
      dossierIndex++;

      // PRIORITÉ 1: Dossier complètement livré
      if (isDossierFullyDelivered(deliveriesInDossier)) {
        counts.livres++;
        debugCounts.fullyDelivered++;
        console.log(
          `[COUNTS] ✅ #${dossierIndex} Dossier livré: ${dossierNumber}`
        );
      }
      // PRIORITÉ 2: Dossier visible dans resp_liv ET PAS encore complètement livré
      else if (
        isDossierVisibleInRespLiv(deliveriesInDossier) &&
        !isDossierFullyDelivered(deliveriesInDossier)
      ) {
        counts.mise_en_livraison++;
        debugCounts.visibleInRespLiv++;
        console.log(
          `[COUNTS] 🚛 #${dossierIndex} Dossier mis en livraison: ${dossierNumber}`
        );
      }
      // PRIORITÉ 3: Dossier visible dans resp_acconier (en attente de paiement)
      else if (isDossierVisibleInRespAcconier(deliveriesInDossier)) {
        counts.en_attente_paiement++;
        debugCounts.visibleInRespAcconier++;
        console.log(
          `[COUNTS] ⏳ #${dossierIndex} Dossier en attente: ${dossierNumber}`
        );
      }
      // PRIORITÉ 4: Autres cas (archivés, supprimés, etc.)
      else {
        debugCounts.skipped++;
        const primaryDelivery = deliveriesInDossier[0];
        console.log(
          `[COUNTS] ⚪ #${dossierIndex} Dossier ignoré: ${dossierNumber} (statut: ${primaryDelivery.delivery_status_acconier})`
        );
      }

      // Logique pour "En retard" (cross-cutting, indépendant du statut)
      const primaryDelivery = deliveriesInDossier[0];
      let dDate = primaryDelivery.delivery_date || primaryDelivery.created_at;
      if (dDate) {
        let dateObj = new Date(dDate);
        if (!isNaN(dateObj.getTime())) {
          const diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
          if (diffDays > 2 && !isDossierFullyDelivered(deliveriesInDossier)) {
            counts.en_retard++;
            debugCounts.overdue++;
          }
        }
      }
    });

    console.log(`[STATUS COUNTS] 📊 Analyse détaillée terminée:`, {
      "Total livraisons": deliveries.length,
      "Total dossiers uniques": dossiersMap.size,
      "Dossiers entièrement livrés": debugCounts.fullyDelivered,
      "Dossiers visibles resp_liv": debugCounts.visibleInRespLiv,
      "Dossiers visibles resp_acconier": debugCounts.visibleInRespAcconier,
      "Dossiers en retard": debugCounts.overdue,
      "Dossiers ignorés": debugCounts.skipped,
    });

    console.log(
      `[STATUS COUNTS] 🎯 Comptage par dossiers uniques terminé:`,
      counts
    );
    res.json({ success: true, counts: counts });
  } catch (err) {
    console.error("Erreur /api/deliveries/status-counts :", err);
    res.json({
      success: false,
      counts: {
        en_attente_paiement: 0,
        mise_en_livraison: 0,
        livres: 0,
        en_retard: 0,
      },
    });
  }
});

// ===============================
// API ENDPOINTS POUR RÉCUPÉRATION DES DONNÉES DE LIVRAISON
// ===============================

// GET /api/deliveries - Récupère toutes les livraisons avec pagination
app.get("/api/deliveries", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Filtres optionnels
    const status = req.query.status;
    const dateFrom = req.query.date_from;
    const dateTo = req.query.date_to;

    let whereClause = "";
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` WHERE status = $${paramCount}`;
      queryParams.push(status);
    }

    if (dateFrom) {
      paramCount++;
      whereClause += whereClause ? ` AND` : ` WHERE`;
      whereClause += ` created_at >= $${paramCount}`;
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      whereClause += whereClause ? ` AND` : ` WHERE`;
      whereClause += ` created_at <= $${paramCount}`;
      queryParams.push(dateTo + " 23:59:59");
    }

    // Ajouter LIMIT et OFFSET
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const query = `
      SELECT 
        id, employee_name, client_name, client_phone, container_type_and_content,
        lieu, container_number, container_foot_type, declaration_number, 
        number_of_containers, weight, ship_name, circuit, transporter_mode,
        bl_number, dossier_number, shipping_company, status,
        delivery_date, delivery_time, created_at, updated_at
      FROM livraison_conteneur
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await pool.query(query, queryParams);

    // Compter le total pour la pagination
    const countQuery = `SELECT COUNT(*) FROM livraison_conteneur${whereClause}`;
    const countParams = queryParams.slice(0, -2); // Enlever LIMIT et OFFSET
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des livraisons:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des données",
      code: 500,
    });
  }
});

// GET /api/deliveries/:id - Récupère une livraison spécifique
app.get("/api/deliveries/:id", async (req, res) => {
  try {
    const deliveryId = req.params.id;

    const query = `
      SELECT 
        id, employee_name, client_name, client_phone, container_type_and_content,
        lieu, container_number, container_foot_type, declaration_number, 
        number_of_containers, weight, ship_name, circuit, transporter_mode,
        bl_number, dossier_number, shipping_company, status,
        delivery_date, delivery_time, created_at, updated_at,
        container_numbers_list, container_foot_types_map, container_statuses
      FROM livraison_conteneur
      WHERE id = $1
    `;

    const result = await pool.query(query, [deliveryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Livraison non trouvée",
        code: 404,
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la livraison:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des données",
      code: 500,
    });
  }
});

// ===============================
// 📋 DOCUMENTATION API POUR COLLÈGUE PHP
// ===============================
/*
🔗 URL DE BASE: https://plateformdesuivie-its-service-1cjx.onrender.com

📊 ENDPOINTS DISPONIBLES:
1. GET  /api/exchange/data           - Récupérer toutes les données
2. PUT  /api/exchange/update/:id     - Mettre à jour une livraison
3. POST /api/exchange/bulk-update    - Mettre à jour plusieurs livraisons

📋 CHAMPS DISPONIBLES:
LECTURE (tous les GET):
- id, dossier_number, bl_number, client_name, delivery_date, created_at

ÉCRITURE (PUT/POST):
- paiement_acconage (DATE format YYYY-MM-DD)
- date_echange_bl (DATE format YYYY-MM-DD) - AUTOMATIQUE
- date_do (DATE format YYYY-MM-DD)  
- date_badt (DATE format YYYY-MM-DD)

🔍 EXEMPLES PHP:
// 1. Récupérer toutes les données
$response = file_get_contents('https://plateformdesuivie-its-service-1cjx.onrender.com/api/exchange/data');
$data = json_decode($response, true);

// 2. Filtrer par dossier
$response = file_get_contents('https://plateformdesuivie-its-service-1cjx.onrender.com/api/exchange/data?dossier_number=DOS123');

// 3. Mettre à jour une livraison
$livraison_id = 123;
$update_data = [
    'paiement_acconage' => 'Payé',
    'date_echange_bl' => '2025-08-05'
];
$options = [
    'http' => [
        'method' => 'PUT',
        'header' => 'Content-Type: application/json',
        'content' => json_encode($update_data)
    ]
];
$context = stream_context_create($options);
$result = file_get_contents("https://plateformdesuivie-its-service-1cjx.onrender.com/api/exchange/update/$livraison_id", false, $context);
*/

// ===============================
// GESTION DES UTILISATEURS CONNECTÉS EN TEMPS RÉEL
// ===============================

// Structure pour stocker les utilisateurs actifs
let activeUsers = new Map();

// Route POST : Enregistrer un heartbeat utilisateur
app.post("/api/active-users/heartbeat", (req, res) => {
  try {
    const { page, userId, username, nom } = req.body;

    if (!page || !userId) {
      return res.status(400).json({
        success: false,
        message: "Page et userId sont requis",
      });
    }

    const now = Date.now();
    const userKey = `${page}_${userId}`;

    // Enregistrer ou mettre à jour l'utilisateur
    activeUsers.set(userKey, {
      page,
      userId,
      username: username || nom || "Utilisateur",
      nom: nom || username || "Utilisateur",
      lastSeen: now,
      connectedAt: activeUsers.has(userKey)
        ? activeUsers.get(userKey).connectedAt
        : now,
    });

    console.log(
      `🔄 [HEARTBEAT] Utilisateur ${username || nom} actif sur ${page}`
    );

    res.json({
      success: true,
      message: "Heartbeat enregistré",
      timestamp: now,
    });
  } catch (error) {
    console.error("Erreur heartbeat:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// Route GET : Obtenir les statistiques des utilisateurs connectés
app.get("/api/active-users/stats", (req, res) => {
  try {
    const now = Date.now();
    const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes de timeout

    // Nettoyer les utilisateurs inactifs
    for (const [key, user] of activeUsers.entries()) {
      if (now - user.lastSeen > TIMEOUT_MS) {
        activeUsers.delete(key);
      }
    }

    // Grouper par page
    const pageStats = {};
    let totalConnectedUsers = 0;

    for (const [key, user] of activeUsers.entries()) {
      const { page, userId, username, nom, lastSeen, connectedAt } = user;

      if (!pageStats[page]) {
        pageStats[page] = {
          count: 0,
          users: [],
        };
      }

      const timeConnected = Math.floor((now - connectedAt) / 1000); // en secondes

      pageStats[page].users.push({
        userId,
        username,
        nom,
        timeConnected,
        lastSeen,
      });

      pageStats[page].count++;
      totalConnectedUsers++;
    }

    console.log(
      `📊 [STATS] ${totalConnectedUsers} utilisateurs connectés sur ${
        Object.keys(pageStats).length
      } pages`
    );

    res.json({
      success: true,
      totalConnectedUsers,
      pageStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur stats utilisateurs:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

// Route API : Obtenir la capacité réelle de la base de données PostgreSQL
app.get("/api/database/capacity", async (req, res) => {
  try {
    console.log(
      "🗄️ Récupération de la capacité réelle de la base de données..."
    );

    // Requête pour obtenir la taille de la base de données actuelle
    const dbSizeQuery = `
      SELECT 
        pg_database_size(current_database()) as db_size_bytes,
        current_database() as db_name
    `;

    const dbSizeResult = await pool.query(dbSizeQuery);
    const dbSizeBytes = parseInt(dbSizeResult.rows[0].db_size_bytes);

    // Requête pour obtenir les informations sur l'espace disque total (si disponible)
    // Note: Cette requête peut ne pas fonctionner sur tous les hébergeurs
    let totalSpaceBytes = null;
    let availableSpaceBytes = null;
    let isPaidPlan = false; // Déclaration de la variable au bon scope

    try {
      // Pour Render, détection automatique du plan basée sur des requêtes système
      // Vérifions d'abord s'il y a des indicateurs d'un plan payant

      // Méthode 1: Vérifier la configuration de shared_preload_libraries
      try {
        const configQuery = `
          SELECT setting 
          FROM pg_settings 
          WHERE name = 'shared_preload_libraries'
        `;
        const configResult = await pool.query(configQuery);
        // Les plans payants ont souvent des extensions supplémentaires
        if (
          configResult.rows[0]?.setting &&
          configResult.rows[0].setting.includes("pg_stat_statements")
        ) {
          isPaidPlan = true;
        }
      } catch (e) {}

      // Méthode 2: Vérifier les limites de connexion
      try {
        const connQuery = `
          SELECT setting::int as max_connections
          FROM pg_settings 
          WHERE name = 'max_connections'
        `;
        const connResult = await pool.query(connQuery);
        // Les plans payants ont généralement plus de 20 connexions
        if (connResult.rows[0]?.max_connections > 20) {
          isPaidPlan = true;
        }
      } catch (e) {}

      // Méthode 3: Vérifier la version et les fonctionnalités disponibles
      try {
        const versionQuery = `SELECT version()`;
        const versionResult = await pool.query(versionQuery);
        // Les versions plus récentes ou avec des fonctionnalités avancées indiquent souvent un plan payant
        if (
          versionResult.rows[0]?.version &&
          versionResult.rows[0].version.includes("15.")
        ) {
          isPaidPlan = true;
        }
      } catch (e) {}

      // Configuration de la capacité basée sur le plan détecté
      if (isPaidPlan) {
        // Plan payant détecté - Utiliser 10GB comme vous l'avez payé
        totalSpaceBytes = 10 * 1024 * 1024 * 1024; // 10GB
        console.log("✅ Plan payant Render détecté - 10GB de capacité");
      } else {
        // Fallback: Si aucune détection automatique, utiliser la taille actuelle pour estimer
        if (dbSizeBytes > 500 * 1024 * 1024) {
          // Si la DB fait plus de 500MB, c'est probablement un plan payant
          totalSpaceBytes = 10 * 1024 * 1024 * 1024; // 10GB
          isPaidPlan = true;
          console.log(
            "✅ Plan payant estimé basé sur la taille DB - 10GB de capacité"
          );
        } else {
          totalSpaceBytes = 1 * 1024 * 1024 * 1024; // 1GB pour plan gratuit
          console.log("ℹ️ Plan gratuit détecté - 1GB de capacité");
        }
      }

      availableSpaceBytes = totalSpaceBytes - dbSizeBytes;
    } catch (spaceErr) {
      console.warn(
        "⚠️ Impossible d'obtenir l'espace disque total:",
        spaceErr.message
      );
    }

    // Formatage des données
    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const result = {
      database: {
        name: dbSizeResult.rows[0].db_name,
        current_size_bytes: dbSizeBytes,
        current_size_formatted: formatBytes(dbSizeBytes),
        total_capacity_bytes: totalSpaceBytes,
        total_capacity_formatted: totalSpaceBytes
          ? formatBytes(totalSpaceBytes)
          : "Non disponible",
        available_space_bytes: availableSpaceBytes,
        available_space_formatted: availableSpaceBytes
          ? formatBytes(availableSpaceBytes)
          : "Non disponible",
        usage_percentage: totalSpaceBytes
          ? Math.round((dbSizeBytes / totalSpaceBytes) * 100)
          : null,
      },
      render_info: {
        estimated_plan: isPaidPlan ? "Payant (10GB)" : "Gratuit (1GB)",
        current_usage_mb: Math.round(dbSizeBytes / (1024 * 1024)),
        capacity_mb: totalSpaceBytes
          ? Math.round(totalSpaceBytes / (1024 * 1024))
          : 1024,
        is_paid_plan: isPaidPlan,
        detection_method: isPaidPlan
          ? "Configuration avancée détectée"
          : "Plan de base",
      },
    };

    console.log("✅ Capacité DB récupérée:", result.render_info);
    res.json(result);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la capacité DB:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Erreur lors de la récupération de la capacité de la base de données",
      error: error.message,
    });
  }
});

// Nettoyage périodique des utilisateurs inactifs (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now();
  const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
  let cleanedCount = 0;

  for (const [key, user] of activeUsers.entries()) {
    if (now - user.lastSeen > TIMEOUT_MS) {
      activeUsers.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 [CLEANUP] ${cleanedCount} utilisateurs inactifs supprimés`);
  }
}, 5 * 60 * 1000); // 5 minutes

// ===============================
// API POUR RÉCUPÉRER LES VRAIS N° TC D'UN DOSSIER
// ===============================
app.get("/api/dossier/:dossierNumber/real-containers", async (req, res) => {
  const { dossierNumber } = req.params;

  console.log(
    `🔍 [REAL-TC API] Recherche des vrais N° TC pour dossier: ${dossierNumber}`
  );

  try {
    // Requête pour récupérer tous les N° TC d'un dossier
    const containerQuery = `
      SELECT DISTINCT container_number
      FROM livraison_conteneur 
      WHERE dossier_number = $1
      AND container_number IS NOT NULL 
      AND container_number != ''
      ORDER BY container_number
    `;

    const containerResult = await pool.query(containerQuery, [dossierNumber]);

    // Extraire les N° TC de la base de données
    const realContainers = containerResult.rows
      .map((row) => row.container_number)
      .filter(Boolean)
      .flatMap((containerNumbers) => {
        // Séparer les N° TC qui sont stockés avec des virgules
        if (
          typeof containerNumbers === "string" &&
          containerNumbers.includes(",")
        ) {
          return containerNumbers
            .split(",")
            .map((tc) => tc.trim())
            .filter(Boolean);
        }
        return [containerNumbers];
      })
      .filter(Boolean); // Filtrer les valeurs vides après split

    console.log(
      `✅ [REAL-TC API] Trouvé ${realContainers.length} vrais N° TC:`,
      realContainers
    );

    res.json({
      success: true,
      dossier: dossierNumber,
      containers: realContainers,
      count: realContainers.length,
    });
  } catch (error) {
    console.error(
      `❌ [REAL-TC API] Erreur pour dossier ${dossierNumber}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des N° TC",
      error: error.message,
    });
  }
});

// ===============================
// ROUTE CATCH-ALL POUR SERVIR LE RESRFRONTEND (index.html)
// ==================12354=============
// Cette route doit être TOUT EN BAS, après toutes les routes API !
// (Le static public est déjà défini plus haut, mais on s'assure que la route / est bien la dernière)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});
/**hjgD11234567891000 */
