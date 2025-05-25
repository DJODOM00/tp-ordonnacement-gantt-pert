# Documentation d'Implémentation - Application de Diagramme de Gantt

## Table des matières
1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture Technique](#2-architecture-technique)
   - [Technologies Utilisées](#21-technologies-utilisées)
   - [Structure des Fichiers](#22-structure-des-fichiers)
3. [Composants Principaux](#3-composants-principaux)
   - [État de l'Application](#31-état-de-lapplication)
   - [Fonctionnalités Clés](#32-fonctionnalités-clés)
4. [Algorithmes Clés](#4-algorithmes-clés)
   - [Calcul des Dates des Tâches](#41-calcul-des-dates-des-tâches)
   - [Génération de la Timeline](#42-génération-de-la-timeline)
5. [Interface Utilisateur](#5-interface-utilisateur)
   - [Formulaire d'Ajout de Tâche](#51-formulaire-dajout-de-tâche)
   - [Liste des Tâches](#52-liste-des-tâches)
   - [Diagramme de Gantt](#53-diagramme-de-gantt)
6. [Gestion des Erreurs](#6-gestion-des-erreurs)
7. [Améliorations Possibles](#7-améliorations-possibles)
8. [Dépendances](#8-dépendances)
9. [Installation et Exécution](#9-installation-et-exécution)
10. [Tests](#10-tests)
11. [Maintenance](#11-maintenance)

## 1. Vue d'ensemble

Cette application web React permet de créer et de visualiser des diagrammes de Gantt pour la gestion de projet. Elle offre une interface simple pour ajouter des tâches avec leurs durées et dépendances, puis génère une représentation visuelle du planning.

## 2. Architecture Technique

### 2.1 Technologies Utilisées

- **Frontend**: React (v17+), JavaScript (ES6+), CSS3, HTML5

### 2.2 Structure des Fichiers

```
src/
├── App.js          # Composant principal de l'application
├── App.css         # Styles globaux
└── index.js        # Point d'entrée de l'application
```

## 3. Composants Principaux

### 3.1 État de l'Application

```javascript
const [tasks, setTasks] = useState([]);
const [newTask, setNewTask] = useState({
  name: '',
  duration: '',
  predecessors: ''
});
const [ganttTasks, setGanttTasks] = useState([]);
const [errorMessage, setErrorMessage] = useState('');
const [projectEndDate, setProjectEndDate] = useState(null);
```

### 3.2 Fonctionnalités Clés

1. **Gestion des Tâches**
   - Ajout de nouvelles tâches avec nom, durée et prédécesseurs
   - Génération automatique d'ID
   - Validation des entrées
   - Suppression de tâches

2. **Calcul des Dates**
   - Détermination des dates de début et de fin pour chaque tâche
   - Gestion des dépendances entre tâches
   - Calcul du chemin critique

3. **Affichage du Diagramme de Gantt**
   - Représentation visuelle des tâches
   - Échelle de temps ajustable
   - Affichage des dépendances

## 4. Algorithmes Clés

### 4.1 Calcul des Dates des Tâches

```javascript
const calculateTaskDates = () => {
  const tasksCopy = JSON.parse(JSON.stringify(tasks));
  const taskMap = {};
  
  tasksCopy.forEach(task => {
    task.start = null;
    task.end = null;
    taskMap[task.id] = task;
  });
  
  const calculateDates = (taskId, startDate) => {
    const task = taskMap[taskId];
    if (!task) return null;
    
    if (task.start && task.end) {
      return new Date(task.end);
    }
    
    let maxEndDate = new Date(startDate);
    if (task.predecessors && task.predecessors.length > 0) {
      task.predecessors.forEach(predId => {
        const predEnd = calculateDates(predId, startDate);
        if (predEnd && predEnd > maxEndDate) {
          maxEndDate = new Date(predEnd);
        }
      });
    }
    
    task.start = maxEndDate;
    task.end = new Date(maxEndDate.getTime() + task.duration * 24 * 60 * 60 * 1000);
    
    return new Date(task.end);
  };
  
  tasksCopy.forEach(task => {
    if (!task.start || !task.end) {
      calculateDates(task.id, new Date(startDate));
    }
  });
  
  return tasksCopy;
};
```

### 4.2 Génération de la Timeline

```javascript
const generateTimeUnits = () => {
  if (!projectEndDate) return [];
  
  const projectStart = new Date(startDate);
  const totalDays = Math.max(20, Math.ceil((projectEndDate - projectStart) / (1000 * 60 * 60 * 24)));
  const step = Math.ceil(totalDays / 20);
  
  const units = [];
  for (let i = 0; i <= totalDays; i += step) {
    units.push(i);
  }
  
  if (units[units.length - 1] < totalDays - 1) {
    units.push(totalDays - 1);
  }
  
  return units;
};
```

## 5. Interface Utilisateur

### 5.1 Formulaire d'Ajout de Tâche
- Champ pour le nom de la tâche (obligatoire)
- Champ pour la durée en jours (obligatoire, nombre positif)
- Champ pour les prédécesseurs (optionnel, séparés par des virgules)
- Affichage de l'ID généré automatiquement

### 5.2 Liste des Tâches
- Tableau affichant toutes les tâches ajoutées
- Colonnes : ID, Nom, Durée, Prédécesseurs, Actions
- Bouton de suppression pour chaque tâche

### 5.3 Diagramme de Gantt
- Représentation visuelle des tâches sur une échelle de temps
- Barres de tâches positionnées en fonction de leurs dates de début et de fin
- Légende des unités de temps en haut du diagramme

## 6. Gestion des Erreurs

- Vérification des champs obligatoires
- Validation des durées (doivent être des nombres positifs)
- Vérification de l'existence des tâches prédécesseures
- Gestion des dépendances circulaires

## 7. Améliorations Possibles

1. **Persistance des Données**
   - Sauvegarde des tâches dans le localStorage
   - Export/import des projets

2. **Fonctionnalités Avancées**
   - Édition des tâches existantes
   - Glisser-déposer pour modifier les durées
   - Zoom sur le diagramme

3. **Interface Utilisateur**
   - Thèmes clair/sombre
   - Personnalisation des couleurs des tâches
   - Affichage des dépendances par des flèches

## 8. Dépendances

- React (v17.0.2+)
- React DOM (v17.0.2+)

## 9. Installation et Exécution

1. Cloner le dépôt
2. Installer les dépendances : `npm install`
3. Démarrer l'application : `npm start`
4. Ouvrir http://localhost:3000 dans un navigateur

## 10. Tests

L'application peut être testée manuellement en :
- Ajoutant plusieurs tâches avec différentes durées
- Créant des dépendances entre les tâches
- Vérifiant que le diagramme s'ajuste correctement
- Testant les cas d'erreur (durées invalides, dépendances inexistantes)

## 11. Maintenance

Pour maintenir l'application :
- Mettre à jour régulièrement les dépendances
- Tester après chaque mise à jour majeure de React
- Documenter les nouvelles fonctionnalités
- Optimiser les performances pour les grands projets
