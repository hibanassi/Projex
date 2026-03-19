# Projex – Plateforme Collaborative de Gestion de Projets Étudiants

Projex est une plateforme web collaborative pour étudiants qui permet de créer, gérer et partager des projets et des ressources pédagogiques. Chaque étudiant peut créer ses projets, gérer les tâches, collaborer avec d’autres et suivre la progression

*Technologies*

Frontend : Angular (standalone components, HTML, CSS)
Backend : Node.js + Express
Base de données : SQLite 
Authentification : Sessions avec HttpOnly cookies
Icônes : Flaticon

*Fonctionnalités principales*

-Création et gestion de projets personnels
-Gestion des tâches par projet (CRUD + progression)
-Collaboration entre utilisateurs (invitation, acceptation/refus)
-Dashboard interactif avec filtres et progression
-Sidebar responsive avec navigation : Nouveau Projet, Dashboard, Mes projets, Collaborations, Invitations
-Design responsive pour mobile et desktop

*Installation rapide*

1. Cloner le projet:
git clone <url-du-repo>
cd project dashboard

2. Installer les dépendances
cd frontend
npm install

3. Initialiser la base de données
cd backend
node initDB.js

4. Lancer L'application
# backend
node server.js
# frontend
ng serve

*Utilisation*

-Créer un compte ou se connecter
-Accéder au Dashboard pour suivre vos projets et tâches
-Créer un nouveau projet depuis la sidebar
-Gérer Mes projets, les collaborations et les invitations
-Suivre la progression des tâches et l’état des projets
