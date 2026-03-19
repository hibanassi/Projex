// initDB.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Créer le répertoire de base de données s'il n'existe pas
const dbDir = path.resolve(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Répertoire créé : ${dbDir}`);
}

const dbPath = path.resolve(__dirname, 'database', 'db.sqlite');
const db = new sqlite3.Database(dbPath);

let completedTables = 0;

db.serialize(() => {
    // Table des utilisateurs
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )`, function(err) {
        if (err) {
            console.error("Erreur lors de la création de la table users :", err.message);
        } else {
            console.log('✓ Table users créée');
        }
        completedTables++;
        checkCompletion();
    });

    // Table des projets
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        owner_id INTEGER,
        FOREIGN KEY(owner_id) REFERENCES users(id)
    )`, function(err) {
        if (err) {
            console.error("Erreur lors de la création de la table projects :", err.message);
        } else {
            console.log('✓ Table projects créée');
        }
        completedTables++;
        checkCompletion();
    });

    // Table des tâches
// Table des tâches
db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    project_id INTEGER,
    assigned_to INTEGER,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(assigned_to) REFERENCES users(id)
)`, function(err) {

    if (err) {
        console.error("Erreur lors de la création de la table tasks :", err.message);
    } else {
        console.log('✓ Table tasks créée ou déjà existante');

        // Vérifier si la colonne created_by existe
        db.all("PRAGMA table_info(tasks)", (err, columns) => {

            if (err) {
                console.error("Erreur lors de la vérification des colonnes :", err.message);
                return;
            }

            const columnExists = columns.some(col => col.name === "created_by");

            if (!columnExists) {

                db.run(`ALTER TABLE tasks ADD COLUMN created_by INTEGER`, (err) => {

                    if (err) {
                        console.error("Erreur lors de l'ajout de la colonne created_by :", err.message);
                    } else {
                        console.log("✓ Colonne created_by ajoutée à la table tasks");
                    }

                });

            } else {
                console.log("✓ Colonne created_by existe déjà");
            }

        });
    }

    completedTables++;
    checkCompletion();
});
    // Table des collaborations
db.run(`CREATE TABLE IF NOT EXISTS collaborations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending','accepted','rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
)`, function(err) {
    if (err) {
        console.error("Erreur lors de la création de la table collaborations :", err.message);
    } else {
        console.log('✓ Table collaborations créée');
    }
    completedTables++;
    checkCompletion();
});
});

function checkCompletion() {
    if (completedTables === 4) {
        console.log('\n✓ Toutes les tables créées avec succès !');
        db.close((err) => {
            if (err) {
                console.error("Erreur lors de la fermeture de la base :", err.message);
                process.exit(1);
            } else {
                console.log('Connexion à la base fermée.\n');
            }
        });
    }
}

db.on('error', (err) => {
    console.error("Erreur de base de données :", err.message);
    process.exit(1);
});

