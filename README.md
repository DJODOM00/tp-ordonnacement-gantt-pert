# Techniques d'Ordonnancement GANTT-PERT

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Description

Cette application web permet de créer et visualiser des diagrammes de GANTT et PERT pour la gestion et la planification de projets. Développée en React, elle offre une interface intuitive pour définir des tâches, leurs durées et leurs dépendances, puis générer automatiquement les représentations graphiques correspondantes.

## ✨ Fonctionnalités

### Diagramme de GANTT
- Création de tâches avec ID, nom et durée
- Définition des dépendances entre tâches (tâches antérieures)
- Calcul automatique des dates de début et de fin
- Visualisation chronologique des tâches

### Diagramme PERT
- Représentation des tâches sous forme d'arcs et des événements sous forme de nœuds
- Calcul automatique des dates au plus tôt et au plus tard
- Identification du chemin critique
- Gestion des tâches avec plusieurs antérieurs via des tâches fictives
- Affichage clair des niveaux et des dépendances

## 🖼️ Captures d'écran

*[Insérez des captures d'écran de votre application ici]*

## 🚀 Installation et démarrage

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/techniques-ordonnancement-gantt-pert.git

# Accéder au répertoire du projet
cd techniques-ordonnancement-gantt-pert

# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm start
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## 🔧 Technologies utilisées

- **React.js** - Framework JavaScript pour l'interface utilisateur
- **SVG** - Pour le rendu des diagrammes PERT
- **CSS** - Pour le style et la mise en page

## 📚 Concepts théoriques

### Diagramme de GANTT
Un diagramme de GANTT est un outil de gestion de projet qui permet de visualiser l'avancement des différentes tâches (activités) constituant un projet. Il s'agit d'un diagramme à barres horizontales, où chaque barre représente une tâche, sa durée, et éventuellement ses dépendances avec d'autres tâches.

### Diagramme PERT
Le diagramme PERT (Program Evaluation and Review Technique) est une méthode d'analyse utilisée pour planifier, organiser et coordonner des tâches dans un projet. Il représente graphiquement les tâches sous forme d'arcs et les événements sous forme de nœuds, permettant d'identifier le chemin critique (séquence de tâches qui détermine la durée minimale du projet).

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- Merci à tous ceux qui ont contribué à ce projet
- Inspiré par les cours de Recherche Opérationnelle et Gestion de Projet
