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
const port = 3000;

// Middleware pour parser les requêtes JSON et URL-encodées
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors()); // Assurez-vous que CORS est appliqué avant vos routes

// ===============================
// CONFIGURATION DES FICHIERS STATIQUES (HTML, CSS, JS, images...)
// Sert tous les fichiers statiques du dossier public (y compris /html, /css, /js...)
app.use(express.static(path.join(__dirname, "public")));

// === DÉMARRAGE DU SERVEUR HTTP POUR RENDER ET LOCAL ===
// ===============================
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
    return res
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

async function ensureUsersTable() {
  try {
    await pool.query(createUsersTable);
    console.log("Table 'users' vérifiée/créée.");
  } catch (err) {
    console.error("Erreur création table users:", err);
  }
}
ensureUsersTable();

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

async function createTables() {
  try {
    await pool.query(creationTableLivraisonConteneur);
    console.log("Table livraison_conteneur créée ou déjà existante.");
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
      ADD COLUMN IF NOT EXISTS paiement_acconage TEXT,
      ADD COLUMN IF NOT EXISTS date_echange_bl DATE,
      ADD COLUMN IF NOT EXISTS date_do DATE,
      ADD COLUMN IF NOT EXISTS date_badt DATE
    `);
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
    res.json({ success: true, deliveries: result.rows });
  } catch (err) {
    console.error("[GET /deliveries/status] Erreur:", err);
    res.status(500).json({ success: false, deliveries: [] });
  }
});

// ===============================
// API DÉDIÉE POUR ÉCHANGE DE DONNÉES AVEC SYSTÈME PHP
// ===============================

// ROUTE : GET - Récupération des données d'échange pour le système PHP
app.get("/api/exchange/data", async (req, res) => {
  try {
    const { dossier_number, bl_number, start_date, end_date } = req.query;

    let query = `
      SELECT 
        id, 
        dossier_number, 
        bl_number, 
        paiement_acconage,
        date_echange_bl,
        date_do,
        date_badt,
        client_name,
        created_at,
        delivery_date
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

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString(),
    });
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
        client.send(
          JSON.stringify({
            type: "exchange_data_update",
            deliveryId: id,
            updatedFields: result.rows[0],
          })
        );
      }
    });

    res.json({
      success: true,
      data: result.rows[0],
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
    password,
    body: req.body,
  });
  if (!email || !password) {
    console.warn("[LOGIN][API] Champs manquants:", { email, password });
    return res
      .status(400)
      .json({ success: false, message: "Tous les champs sont requis." });
  }
  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    console.log("[LOGIN][API] Résultat recherche utilisateur:", userRes.rows);
    if (userRes.rows.length === 0) {
      console.warn(
        "[LOGIN][API] Aucun utilisateur trouvé pour cet email:",
        email
      );
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect." });
    }
    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password);
    console.log("[LOGIN][API] Résultat comparaison mot de passe:", match);
    if (!match) {
      console.warn("[LOGIN][API] Mot de passe incorrect pour:", email);
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect." });
    }
    // Connexion réussie : renvoyer aussi le nom et l'email
    console.log("[LOGIN][API] Connexion réussie pour:", email);
    return res.status(200).json({
      success: true,
      nom: user.name, // renvoie le nom sous la clé 'nom' pour compatibilité frontend
      email: user.email,
    });
  } catch (err) {
    console.error("[LOGIN][API] Erreur serveur lors de la connexion:", err);
    return res.status(500).json({
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
      date_echange_bl,
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
      // Nettoyage des espaces et séparateurs multiples
      normalized_container_number = container_number
        .split(/[,;\s]+/)
        .filter(Boolean)
        .join(",");
    } else {
      normalized_container_number = "";
    }

    const is_eir_received = !!req.file;

    // *** DÉBOGAGE : AFFICHER LES VALEURS DES CHAMPS OBLIGATOIRES REÇUES PAR LE BACKEND ***
    console.log("Backend Validation Debug - Basic fields:");
    console.log("   employee_name:", employee_name);
    console.log("   client_name:", client_name);
    console.log("   client_phone:", client_phone);
    console.log("   container_type_and_content:", container_type_and_content);
    console.log("   status (from employee form):", status);
    console.log("   lieu:", lieu);
    console.log(
      "   container_number (normalized):",
      normalized_container_number
    );
    console.log("   container_foot_type:", container_foot_type);
    console.log("   declaration_number:", declaration_number);
    console.log("   number_of_containers:", number_of_containers);
    console.log("   dossier_number:", dossier_number);
    console.log("   bl_number:", bl_number);
    console.log("   shipping_company:", shipping_company);
    console.log("   date_echange_bl:", date_echange_bl);
    console.log("   delivery_status_acconier:", delivery_status_acconier);
    // *** FIN DÉBOGAGE BASIC FIELDS ***

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
      const tcList = normalized_container_number
        .split(/[,;\s]+/)
        .filter(Boolean);
      full_container_numbers_list = tcList;
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

      // *** DÉBOGAGE : AFFICHER LES VALEURS DES NOUVEAUX CHAMPS APRÈS TRAITEMENT ***
      console.log("Backend Validation Debug - Processed JSON fields:");
      console.log(
        "   full_container_numbers_list:",
        full_container_numbers_list
      );
      console.log("   container_foot_types_map:", container_foot_types_map);
      console.log("   container_statuses:", container_statuses);
      // *** FIN DÉBOGAGE PROCESSED FIELDS ***

      // Vérifier si les colonnes JSON et d'échange existent avant de les utiliser
      const columnsCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'livraison_conteneur' 
        AND column_name IN ('container_numbers_list', 'container_foot_types_map', 'date_echange')
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
        // Si les colonnes JSON et date_echange_bl existent, les inclure dans l'INSERT
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
          date_echange_bl || null,
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
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
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
          date_echange_bl || null,
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
        console.log("[WebSocket][DEBUG] Payload envoyé :", payloadObj);
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

// PATCH GET /deliveries/status
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

// --- Fonction de nettoyage des archives de plus de 3 ans ---
async function cleanOldArchives() {
  console.log("Démarrage du nettoyage des archives de plus de 3 ans...");
  try {
    // Calcule la date limite (3 ans avant la date actuelle)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const query = `
      DELETE FROM livraison_conteneur
      WHERE created_at < $1
      RETURNING id;
    `;
    const result = await pool.query(query, [threeYearsAgo]);
    console.log(`Nettoyage terminé : ${result.rowCount} archives supprimées.`);
  } catch (error) {
    console.error("Erreur lors du nettoyage des archives :", error);
  }
}

// Planifier l'exécution du nettoyage des archives
// Exécute une première fois au démarrage
cleanOldArchives();
// Puis toutes les 24 heures (86400000 ms)
setInterval(cleanOldArchives, 86400000); // 24 heures * 60 minutes * 60 secondes * 1000 millisecondes

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
// ROUTE NOTIFICATION DOSSIER EN RETARD (copie de /notify-agent)
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
    const result = await pool.query(
      `SELECT * FROM livraison_conteneur ORDER BY created_at DESC`
    );
    const now = new Date();
    // Logique métier identique à getLateDeliveries JS
    const dossiersRetard = (result.rows || []).filter((d) => {
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
    // Formatage minimal pour le frontend (numéro, client, date, statut)
    const dossiersFormates = dossiersRetard.map((d) => ({
      numero: d.dossier_number || d.id,
      client: d.client_name,
      created_at: d.created_at,
      statut: d.delivery_status_acconier,
    }));
    res.json(dossiersFormates);
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
    const result = await pool.query(
      `SELECT * FROM livraison_conteneur ORDER BY created_at DESC`
    );

    const deliveries = result.rows || [];
    const counts = {
      en_attente_paiement: 0,
      mise_en_livraison: 0,
      livres: 0,
      en_retard: 0,
    };

    const now = new Date();

    // Fonction pour vérifier si un dossier est complètement livré
    function isDeliveryFullyDelivered(delivery) {
      if (!delivery.container_statuses) return false;

      let container_statuses = {};
      try {
        container_statuses =
          typeof delivery.container_statuses === "string"
            ? JSON.parse(delivery.container_statuses)
            : delivery.container_statuses;
      } catch (e) {
        return false;
      }

      // Récupérer la liste des conteneurs
      let tcList = [];
      if (delivery.container_number) {
        if (Array.isArray(delivery.container_number)) {
          tcList = delivery.container_number.filter(Boolean);
        } else if (typeof delivery.container_number === "string") {
          tcList = delivery.container_number.split(/[,;\s]+/).filter(Boolean);
        }
      }

      // Si pas de conteneurs, pas livré
      if (tcList.length === 0) return false;

      // Vérifier que tous les conteneurs sont livrés
      return tcList.every((tc) => {
        const s = container_statuses[tc];
        return s === "livre" || s === "livré";
      });
    }

    // Fonction pour vérifier si un dossier est visible dans resp_acconier (en attente de paiement)
    function isVisibleInRespAcconier(delivery) {
      // Si le statut acconier est explicitement "en attente de paiement"
      if (delivery.delivery_status_acconier === "en attente de paiement") {
        return true;
      }

      // Exclure si statut acconier est 'mise_en_livraison_acconier' ou 'livré'
      if (
        delivery.delivery_status_acconier === "mise_en_livraison_acconier" ||
        delivery.delivery_status_acconier === "livre" ||
        delivery.delivery_status_acconier === "livré"
      ) {
        return false;
      }

      // Exclure si tous les BL sont en 'mise_en_livraison'
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

      let blStatuses = blList.map((bl) => bl_statuses[bl] || "aucun");

      if (
        blStatuses.length > 0 &&
        blStatuses.every((s) => s === "mise_en_livraison")
      ) {
        return false; // N'apparaît plus dans resp_acconier
      }

      return true; // Visible dans resp_acconier (donc en attente de paiement)
    }

    // Fonction pour vérifier si un dossier est visible dans resp_liv (mis en livraison)
    function isVisibleInRespLiv(delivery) {
      // Visible dans resp_liv UNIQUEMENT si delivery_status_acconier === "mise_en_livraison_acconier"
      // Cette logique correspond exactement au filtrage de scriptRespLiv.js
      return delivery.delivery_status_acconier === "mise_en_livraison_acconier";
    }

    deliveries.forEach((delivery) => {
      // PRIORITÉ 1: Dossier complètement livré (tous conteneurs livrés)
      if (isDeliveryFullyDelivered(delivery)) {
        counts.livres++;
        console.log(`[COUNTS] ✅ Dossier livré: ${delivery.dossier_number}`);
      }
      // PRIORITÉ 2: Dossier visible dans resp_liv ET PAS encore complètement livré
      else if (
        isVisibleInRespLiv(delivery) &&
        !isDeliveryFullyDelivered(delivery)
      ) {
        counts.mise_en_livraison++;
        console.log(
          `[COUNTS] � Dossier mis en livraison: ${delivery.dossier_number}`
        );
      }
      // PRIORITÉ 3: Dossier visible dans resp_acconier (en attente de paiement)
      else if (isVisibleInRespAcconier(delivery)) {
        counts.en_attente_paiement++;
        console.log(
          `[COUNTS] ⏳ Dossier en attente: ${delivery.dossier_number}`
        );
      }
      // PRIORITÉ 4: Autres cas (ne rien compter par défaut pour éviter la double comptabilisation)
      // Ces dossiers ne doivent plus être comptés par défaut

      // Logique pour "En retard" (cross-cutting, indépendant du statut)
      let dDate = delivery.delivery_date || delivery.created_at;
      if (dDate) {
        let dateObj = new Date(dDate);
        if (!isNaN(dateObj.getTime())) {
          const diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
          if (diffDays > 2 && !isDeliveryFullyDelivered(delivery)) {
            // Compter en retard seulement si pas complètement livré et > 2 jours
            counts.en_retard++;
          }
        }
      }
    });

    console.log(`[STATUS COUNTS] 📊 Comptage précis terminé:`, counts);
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
- paiement_acconage (TEXT)
- date_echange_bl (DATE format YYYY-MM-DD)
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
// ROUTE CATCH-ALL POUR SERVIR LE FRONTEND (index.html)
// ===============================
// Cette route doit être TOUT EN BAS, après toutes les routes API !
// (Le static public est déjà défini plus haut, mais on s'assure que la route / est bien la dernière)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});
