const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const dbPath = path.resolve(__dirname, 'database', 'db.sqlite');
const db = new sqlite3.Database(dbPath);

// Configuration CORS
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));

// Middleware pour protéger les pages
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Non authentifié' });
    }
}

function isProjectAuthorized(projectId, userId) {

    return new Promise((resolve) => {

        db.get(
            `SELECT * FROM projects WHERE id = ?`,
            [projectId],
            (err, project) => {

                if (!project) return resolve(false);

                if (project.owner_id === userId) {
                    return resolve(true);
                }

                db.get(
                    `SELECT * FROM collaborations 
                    WHERE project_id = ?
                    AND user_id = ?
                    AND status = 'accepted'`,
                    [projectId, userId],
                    (err, collab) => {

                        if (collab) return resolve(true);

                        resolve(false);
                    }
                );

            }
        );

    });

}

// ==================== ROUTES D'AUTHENTIFICATION ====================

// Inscription
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const hashed = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        [username, email, hashed],
        function (err) {
            if (err) {
                return res.status(500).json({ error: "Email ou username déjà utilisé" });
            }

            req.session.userId = this.lastID;
            req.session.username = username;

            res.json({
                success: true,
                user: { id: this.lastID, username, email }
            });
        }
    );
});

// Connexion
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Erreur de base de données" });
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({
            success: true,
            user: { id: user.id, username: user.username, email: user.email }
        });
    });
});

// Déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// ==================== ROUTES DES PROJETS ====================

// Tableau de bord - récupérer tous les projets
app.get('/projects', isAuthenticated, (req, res) => {
    db.all(
        `SELECT projects.id, projects.name, projects.description, projects.owner_id, users.username AS owner_name
        FROM projects
        JOIN users ON projects.owner_id = users.id`,
        [],
        async (err, projects) => {

            if (err) {
                return res.status(500).json({ error: "Erreur de base de données" });
            }

            for (let project of projects) {

                // 🔹 récupérer les tâches
                await new Promise(resolve => {
                    db.all(
                        `SELECT * FROM tasks WHERE project_id = ?`,
                        [project.id],
                        (err, tasks) => {

                            project.tasks = tasks || [];

                            // compteur tâches
                            project.tasks_count = project.tasks.length;

                            // progression
                            if (!tasks || tasks.length === 0) {
                                project.progress = 0;
                            } else {
                                let score = 0;
                                tasks.forEach(t => {
                                    if (t.status === 'done') score += 100;
                                    else if (t.status === 'in_progress') score += 50;
                                });
                                project.progress = Math.round(score / tasks.length);
                            }

                            resolve();
                        }
                    );
                });

                // 🔹 compter collaborateurs acceptés
                await new Promise(resolve => {
                    db.get(
                        `SELECT COUNT(*) AS total 
                         FROM collaborations 
                         WHERE project_id = ? AND status = 'accepted'`,
                        [project.id],
                        (err, result) => {

                            project.collaborators_count = result ? result.total : 0;

                            resolve();
                        }
                    );
                });

            }

            res.json(projects);
        }
    );
});

// Récupérer uniquement les projets créés par l'utilisateur
app.get('/projects/my-projects', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    db.all(
        `SELECT * FROM projects WHERE owner_id = ?`,
        [userId],
        (err, projects) => {
            if (err) return res.status(500).json({ error: "Erreur base de données" });
            res.json(projects);
        }
    );
});
app.get('/debug/user', (req, res) => {
    res.json({ userId: req.session.userId });
});
// Créer un nouveau projet
app.post('/projects/new', isAuthenticated, (req, res) => {
    const { name, description } = req.body;

    db.run(
        `INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)`,
        [name, description, req.session.userId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: "Échec de la création du projet" });
            }

            res.json({
                success: true,
                project: {
                    id: this.lastID,
                    name,
                    description,
                    owner_id: req.session.userId
                }
            });
        }
    );
});

// Récupérer un projet et ses tâches
app.get('/projects/:id', isAuthenticated, (req, res) => {

    const projectId = req.params.id;
    const userId = req.session.userId;

    db.get(
        `SELECT * FROM projects WHERE id = ?`,
        [projectId],
        (err, project) => {

            if (err || !project) {
                return res.status(404).json({ error: "Projet introuvable" });
            }

            db.get(
                `SELECT * FROM collaborations
                WHERE project_id = ?
                AND user_id = ?
                AND status = 'accepted'`,
                [projectId, userId],
                (err, collab) => {

                    const isCollaborator = !!collab;

                    db.all(
                        `SELECT tasks.*, users.username AS creator_name
                        FROM tasks
                        LEFT JOIN users ON tasks.created_by = users.id
                        WHERE project_id = ?`,
                        [projectId],
                        (err, tasks) => {

                            res.json({
                                project,
                                tasks,
                                isCollaborator
                            });

                        }
                    );

                }
            );

        }
    );
});

// Obtenir le projet pour modification
app.get('/projects/:id/edit', isAuthenticated, (req, res) => {
    const projectId = req.params.id;

    db.get(
        `SELECT * FROM projects WHERE id = ?`,
        [projectId],
        (err, project) => {
            if (err || !project) {
                return res.status(404).json({ error: "Projet introuvable" });
            }
            res.json({ project });
        }
    );
});

// Mettre à jour un projet
app.put('/projects/:id', isAuthenticated, (req, res) => {
    const projectId = req.params.id;
    const { name, description } = req.body;

    db.run(
        `UPDATE projects SET name = ?, description = ? WHERE id = ? AND owner_id = ?`,
        [name, description, projectId, req.session.userId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: "Échec de la mise à jour du projet" });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: "Projet introuvable" });
            }

            res.json({
                success: true,
                message: 'Projet mis à jour avec succès'
            });
        }
    );
});

// Supprimer un projet
app.delete('/projects/:id', isAuthenticated, (req, res) => {
    const projectId = req.params.id;

    // First delete all tasks of the project
    db.run(`DELETE FROM tasks WHERE project_id = ?`, [projectId], (err) => {
        if (err) {
            return res.status(500).json({ error: "Échec de la suppression des tâches" });
        }

        // Then delete the project
        db.run(
            `DELETE FROM projects WHERE id = ? AND owner_id = ?`,
            [projectId, req.session.userId],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: "Échec de la suppression du projet" });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: "Projet introuvable" });
                }

                res.json({
                    success: true,
                    message: 'Projet supprimé avec succès'
                });
            }
        );
    });
});

// Récupérer la liste des collaborateurs d’un projet
app.get('/projects/:id/collaborators', isAuthenticated, (req, res) => {
    const projectId = req.params.id;

    // Vérifier si le projet existe
    db.get(`SELECT * FROM projects WHERE id = ?`, [projectId], (err, project) => {
        if (err || !project) return res.status(404).json({ error: "Projet introuvable" });

        // Récupérer les collaborateurs acceptés
        db.all(
            `SELECT u.id, u.username
            FROM collaborations c
            JOIN users u ON c.user_id = u.id
            WHERE c.project_id = ? AND c.status = 'accepted'`,
            [projectId],
            (err, collaborators) => {
                if (err) return res.status(500).json({ error: "Erreur base de données" });

                res.json({
                    collaborators,
                    isOwner: project.owner_id === req.session.userId
                });
            }
        );
    });
});

// Supprimer un collaborateur (propriétaire uniquement)
app.delete('/projects/:id/collaborators/:userId', isAuthenticated, (req, res) => {
    const projectId = req.params.id;
    const userIdToRemove = req.params.userId;

    // Vérifier que l'utilisateur connecté est le propriétaire
    db.get(`SELECT * FROM projects WHERE id = ?`, [projectId], (err, project) => {
        if (err || !project) return res.status(404).json({ error: "Projet introuvable" });

        if (project.owner_id !== req.session.userId) {
            return res.status(403).json({ error: "Non autorisé" });
        }

        // Supprimer le collaborateur
        db.run(
            `DELETE FROM collaborations WHERE project_id = ? AND user_id = ?`,
            [projectId, userIdToRemove],
            function(err) {
                if (err) return res.status(500).json({ error: "Erreur suppression collaborateur" });
                if (this.changes === 0) return res.status(404).json({ error: "Collaborateur introuvable" });

                res.json({ success: true });
            }
        );
    });
});
// ==================== ROUTES DES TÂCHES ====================

// Ajouter une tâche
app.post('/tasks', isAuthenticated, async (req, res) => {

    const { title, description, project_id } = req.body;
    const userId = req.session.userId;

    const authorized = await isProjectAuthorized(project_id, userId);

    if (!authorized) {
        return res.status(403).json({ 
            error: "Seul le propriétaire ou un collaborateur peut ajouter une tâche"
        });
    }

    db.run(
        `INSERT INTO tasks (title, description, status, project_id, created_by)
        VALUES (?, ?, 'pending', ?, ?)`,
        [title, description, project_id, userId],
        function (err) {

            if (err) {
                return res.status(500).json({ error: "Erreur création tâche" });
            }

            res.json({
                success: true,
                task: {
                    id: this.lastID,
                    title,
                    description,
                    status: 'pending',
                    project_id,
                    created_by: userId,
                    creator_name: req.session.username
                }
            });

        }
    );

});


// Récupérer une tâche
app.get('/tasks/:id', isAuthenticated, (req, res) => {
    const taskId = req.params.id;

    db.get(
        `SELECT tasks.*, tasks.project_id
        FROM tasks
        WHERE tasks.id = ?`,
        [taskId],
        async (err, task) => {
            if (err || !task) {
                return res.status(404).json({ error: "Tâche introuvable" });
            }

            const authorized = await isProjectAuthorized(task.project_id, req.session.userId);
            if (!authorized) {
                return res.status(403).json({ error: "Non autorisé" });
            }

            res.json({ task });
        }
    );
});


// Mettre à jour une tâche
app.put('/tasks/:id', isAuthenticated, (req, res) => {

    const taskId = req.params.id;
    const { title, description, status } = req.body;
    const userId = req.session.userId;

    db.get(
        `SELECT tasks.created_by, projects.owner_id
        FROM tasks
        JOIN projects ON tasks.project_id = projects.id
        WHERE tasks.id = ?`,
        [taskId],
        (err, task) => {

            if (!task) {
                return res.status(404).json({ error: "Tâche introuvable" });
            }

            const isOwner = task.owner_id === userId;
            const isCreator = task.created_by === userId;

            if (!isOwner && !isCreator) {
                return res.status(403).json({ error: "Permission refusée" });
            }

            db.run(
                `UPDATE tasks
                SET title = ?, description = ?, status = ?
                WHERE id = ?`,
                [title, description, status, taskId],
                function (err) {

                    if (err) {
                        return res.status(500).json({ error: "Erreur modification" });
                    }

                    res.json({ success: true });

                }
            );

        }
    );

});



// Modifier seulement le statut
app.patch('/tasks/:id/status', isAuthenticated, async (req, res) => {

    const taskId = req.params.id;
    const { status } = req.body;

    db.get(
        `SELECT tasks.*, projects.owner_id
        FROM tasks
        JOIN projects ON tasks.project_id = projects.id
        WHERE tasks.id = ?`,
        [taskId],
        (err, task) => {

            if (!task) {
                return res.status(404).json({ error: "Tâche introuvable" });
            }

            const isOwner = task.owner_id === req.session.userId;
            const isCreator = task.created_by === req.session.userId;

            if (!isOwner && !isCreator) {
            return res.status(403).json({ error: "Permission refusée" });
            }

            db.run(
                `UPDATE tasks SET status = ? WHERE id = ?`,
                [status, taskId],
                function (err) {

                    if (err) {
                        return res.status(500).json({ error: "Erreur mise à jour statut" });
                    }

                    res.json({ success: true });
                }
            );

        }
    );
});


// Supprimer une tâche
app.delete('/tasks/:id', isAuthenticated, (req, res) => {

    const taskId = req.params.id;
    const userId = req.session.userId;

    db.get(
        `SELECT tasks.created_by, projects.owner_id
        FROM tasks
        JOIN projects ON tasks.project_id = projects.id
        WHERE tasks.id = ?`,
        [taskId],
        (err, task) => {

            if (!task) {
                return res.status(404).json({ error: "Tâche introuvable" });
            }

            const isOwner = task.owner_id === userId;
            const isCreator = task.created_by === userId;

            if (!isOwner && !isCreator) {
                return res.status(403).json({ error: "Permission refusée" });
            }

            db.run(
                `DELETE FROM tasks WHERE id = ?`,
                [taskId],
                function (err) {

                    if (err) {
                        return res.status(500).json({ error: "Erreur suppression" });
                    }

                    res.json({ success: true });

                }
            );

        }
    );

});


// ==================== ROUTES COLLABORATIONS ====================

// Envoyer une invitation
app.post('/collaborations/request', isAuthenticated, (req, res) => {
    const { project_id } = req.body;
    const userId = req.session.userId;

    db.get(`SELECT * FROM projects WHERE id = ?`, [project_id], (err, project) => {
        if (!project) {
            return res.status(404).json({ error: "Projet introuvable" });
        }

        if (project.owner_id === userId) {
            return res.status(400).json({ error: "Vous êtes le propriétaire" });
        }

        db.run(
            `INSERT INTO collaborations (project_id, user_id, status)
            VALUES (?, ?, 'pending')`,
            [project_id, userId],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: "Invitation déjà envoyée" });
                }

                res.json({ success: true });
            }
        );
    });
});

// Voir les invitations reçues (pour le propriétaire)
app.get('/collaborations/invitations', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    db.all(
        `SELECT c.id, c.project_id, c.status, p.name AS project_name, u.username AS inviter_name
        FROM collaborations c
        JOIN projects p ON c.project_id = p.id
        JOIN users u ON u.id = c.user_id
        WHERE p.owner_id = ? AND c.status = 'pending'`,
        [userId],
        (err, invitations) => {
            if (err) return res.status(500).json({ error: "Erreur base de données" });
            res.json(invitations);
        }
    );
});

// Accepter ou refuser une invitation
app.put('/collaborations/respond/:inviteId', isAuthenticated, (req, res) => {
    const inviteId = req.params.inviteId;
    const { status } = req.body; // 'accepted' ou 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Statut invalide" });
    }

    // Vérifier que le propriétaire de ce projet est bien l'utilisateur connecté
    db.get(
        `SELECT c.id, c.project_id, p.owner_id
        FROM collaborations c
        JOIN projects p ON c.project_id = p.id
        WHERE c.id = ?`,
        [inviteId],
        (err, invite) => {
            if (err || !invite) return res.status(404).json({ error: "Invitation introuvable" });
            if (invite.owner_id !== req.session.userId) {
                return res.status(403).json({ error: "Non autorisé" });
            }

            // Mettre à jour le statut
            db.run(
                `UPDATE collaborations SET status = ? WHERE id = ?`,
                [status, inviteId],
                function(err) {
                    if (err) return res.status(500).json({ error: "Erreur lors de la mise à jour" });
                    res.json({ success: true });
                }
            );
        }
    );
});

// Voir mes projets collaborés

app.get('/collaborations/my-projects', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    db.all(
        `SELECT DISTINCT projects.*
        FROM projects
        LEFT JOIN collaborations ON collaborations.project_id = projects.id
        WHERE (collaborations.user_id = ? AND collaborations.status = 'accepted')
            OR (projects.owner_id = ? AND EXISTS (
                SELECT 1 FROM collaborations
                WHERE collaborations.project_id = projects.id AND collaborations.status = 'accepted'
            ))`,
        [userId, userId],
        (err, projects) => {
            if (err) return res.status(500).json({ error: "Erreur base de données" });
            res.json(projects);
        }
    );
});

app.get('/invitations/sent', isAuthenticated, (req, res) => {

    const userId = req.session.userId;

    db.all(
    `SELECT 
    c.id,
    c.status,
    c.created_at,
    p.name AS project_name,
    u.username AS owner_name
    FROM collaborations c
    JOIN projects p ON c.project_id = p.id
    JOIN users u ON p.owner_id = u.id
    WHERE c.user_id = ?`,
    [userId],
    (err, invitations) => {

        if (err) {
        return res.status(500).json({ error: "Erreur base de données" });
        }

        res.json(invitations);
    }
);
});

app.get('/invitations/count', isAuthenticated, (req, res) => {

  const userId = req.session.userId;

  db.get(
    `SELECT COUNT(*) AS total
     FROM collaborations c
     JOIN projects p ON c.project_id = p.id
     WHERE p.owner_id = ?
     AND c.status = 'pending'`,
    [userId],
    (err, row) => {

      if (err) {
        return res.status(500).json({ error: "Erreur base de données" });
      }

      res.json({ total: row.total });

    }
  );

});


// ==================== START SERVER ====================
app.listen(3000, () => console.log("Serveur démarré sur http://localhost:3000"));