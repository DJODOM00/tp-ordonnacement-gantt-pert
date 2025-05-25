import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: '',
    duration: '',
    predecessors: ''
  });
  const [ganttTasks, setGanttTasks] = useState([]);
  const [pertTasks, setPertTasks] = useState([]);
  const [showPert, setShowPert] = useState(false);
  const startDate = new Date(); // Date fixe (aujourd'hui) comme date de début du projet
  const [errorMessage, setErrorMessage] = useState('');
  const [projectEndDate, setProjectEndDate] = useState(null);
  const ganttRef = useRef(null);
  const pertRef = useRef(null);

  // Fonction pour gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value
    });
  };

  // Obtenir le plus grand ID existant
  const getMaxId = () => {
    if (tasks.length === 0) return 0;
    
    return Math.max(...tasks.map(task => {
      const idNum = parseInt(task.id, 10);
      return isNaN(idNum) ? 0 : idNum;
    }));
  };
  
  // Générer un ID unique pour une nouvelle tâche
  const generateUniqueId = () => {
    return (getMaxId() + 1).toString();
  };
  
 

  // Fonction pour ajouter une tâche
  const addTask = (e) => {
    e.preventDefault();
    
    // Vérification que les champs obligatoires sont remplis
    if (!newTask.name || !newTask.duration) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Vérification que l'ID n'existe pas déjà
    if (tasks.some(task => task.id === newTask.id)) {
      setErrorMessage('Cet ID de tâche existe déjà');
      return;
    }
    
    // Vérification que la durée est un nombre positif
    if (isNaN(newTask.duration) || parseInt(newTask.duration) <= 0) {
      setErrorMessage('La durée doit être un nombre positif');
      return;
    }
    
    // Vérification que les prédécesseurs existent
    const predecessorsArray = newTask.predecessors ? newTask.predecessors.split(',').map(p => p.trim()) : [];
    if (predecessorsArray.length > 0) {
      const invalidPredecessors = predecessorsArray.filter(p => !tasks.some(task => task.id === p));
      if (invalidPredecessors.length > 0) {
        setErrorMessage(`Les prédécesseurs suivants n'existent pas: ${invalidPredecessors.join(', ')}`);
        return;
      }
    }
    
    // Création de la tâche avec un ID généré automatiquement
    const taskToAdd = {
      id: generateUniqueId(),
      name: newTask.name,
      duration: parseInt(newTask.duration),
      predecessors: predecessorsArray
    };
    
    setTasks([...tasks, taskToAdd]);
    setNewTask({
      name: '',
      duration: '',
      predecessors: ''
    });
    setErrorMessage('');
  };

  // Fonction pour supprimer une tâche
  const deleteTask = (id) => {
    // Vérifier si cette tâche est un prédécesseur d'une autre tâche
    const isUsedAsPredecessor = tasks.some(task => 
      task.predecessors && task.predecessors.includes(id)
    );
    
    if (isUsedAsPredecessor) {
      setErrorMessage(`Impossible de supprimer la tâche ${id} car elle est utilisée comme prédécesseur`);
      return;
    }
    
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Fonction pour calculer les dates de début et de fin des tâches
  const calculateTaskDates = () => {
    if (tasks.length === 0) return [];
    
    // Copie des tâches pour ne pas modifier l'original
    const tasksCopy = JSON.parse(JSON.stringify(tasks));
    
    // Initialisation des dates de début et de fin
    tasksCopy.forEach(task => {
      task.startDate = null;
      task.endDate = null;
    });
    
    // Fonction pour vérifier si toutes les tâches prédécesseurs ont été planifiées
    const arePredecessorsScheduled = (task) => {
      if (!task.predecessors || task.predecessors.length === 0) return true;
      
      return task.predecessors.every(predId => {
        const predTask = tasksCopy.find(t => t.id === predId);
        return predTask && predTask.endDate !== null;
      });
    };
    
    // Fonction pour obtenir la date de fin la plus tardive des prédécesseurs
    const getLatestPredecessorEndDate = (task) => {
      if (!task.predecessors || task.predecessors.length === 0) return startDate;
      
      let latestDate = startDate;
      task.predecessors.forEach(predId => {
        const predTask = tasksCopy.find(t => t.id === predId);
        if (predTask && predTask.endDate > latestDate) {
          latestDate = new Date(predTask.endDate);
        }
      });
      
      return latestDate;
    };
    
    // Planification des tâches
    let allTasksScheduled = false;
    let iterations = 0;
    const maxIterations = tasksCopy.length * 2; // Éviter les boucles infinies
    
    while (!allTasksScheduled && iterations < maxIterations) {
      allTasksScheduled = true;
      iterations++;
      
      for (const task of tasksCopy) {
        if (task.startDate !== null) continue; // Tâche déjà planifiée
        
        if (arePredecessorsScheduled(task)) {
          // Planifier la tâche
          const taskStartDate = getLatestPredecessorEndDate(task);
          task.startDate = taskStartDate;
          
          // Calculer la date de fin
          const endDate = new Date(taskStartDate);
          endDate.setDate(endDate.getDate() + task.duration);
          task.endDate = endDate;
        } else {
          allTasksScheduled = false;
        }
      }
    }
    
    // Vérifier s'il y a des cycles
    if (!allTasksScheduled) {
      setErrorMessage('Impossible de planifier toutes les tâches. Il y a probablement un cycle dans les dépendances.');
      return [];
    }
    
    // Formater les tâches pour le diagramme de Gantt
    return tasksCopy.map(task => ({
      id: task.id,
      name: task.name,
      start: task.startDate,
      end: task.endDate
    }));
  };

  // Fonction pour calculer la date de fin du projet
  const calculateProjectEndDate = (tasks) => {
    if (tasks.length === 0) return null;
    
    let latestEndDate = new Date(tasks[0].end);
    tasks.forEach(task => {
      const taskEndDate = new Date(task.end);
      if (taskEndDate > latestEndDate) {
        latestEndDate = taskEndDate;
      }
    });
    
    return latestEndDate;
  };
  
  // Générer le diagramme de Gantt
  const generateGantt = () => {
    const calculatedTasks = calculateTaskDates();
    if (calculatedTasks.length > 0) {
      setGanttTasks(calculatedTasks);
      setProjectEndDate(calculateProjectEndDate(calculatedTasks));
      setShowPert(false);
    }
  };
  
  // Générer le diagramme PERT
  const generatePert = () => {
    const calculatedTasks = calculateTaskDates();
    if (calculatedTasks.length > 0) {
      // Créer le graphe PERT avec sommets et arcs
      const pertGraph = createPertGraph(tasks);
      setPertTasks(pertGraph);
      setProjectEndDate(calculateProjectEndDate(calculatedTasks));
      setShowPert(true);
    }
  };
  
  // Fonction pour créer le graphe PERT avec sommets et arcs selon la méthode PERT
  const createPertGraph = (tasksList) => {
    if (tasksList.length === 0) return { nodes: [], edges: [] };
    
    // Copie des tâches pour ne pas modifier l'original
    const tasksCopy = JSON.parse(JSON.stringify(tasksList));
    
    // Créer un sommet de départ (événement 0)
    let nodes = [{ id: '0', type: 'event', earlyDate: 0, lateDate: 0, level: 0 }];
    let edges = [];
    let nodeCounter = 1;
    
    // Créer un graphe où chaque tâche est représentée par un arc entre deux sommets
    // Première étape : créer les arcs pour les tâches sans prédécesseurs
    const tasksWithoutPredecessors = tasksCopy.filter(task => !task.predecessors || task.predecessors.length === 0);
    
    // Créer un arc pour chaque tâche sans prédécesseur depuis le sommet 0
    tasksWithoutPredecessors.forEach(task => {
      const targetNodeId = nodeCounter.toString();
      nodeCounter++;
      
      // Ajouter un nouveau sommet (événement) avec niveau 1
      nodes.push({ id: targetNodeId, type: 'event', earlyDate: task.duration, lateDate: null, level: 1 });
      
      // Ajouter un arc représentant la tâche
      edges.push({
        id: `edge-${task.id}`,
        source: '0',
        target: targetNodeId,
        taskId: task.id,
        taskName: task.name,
        duration: task.duration,
        isCritical: false, // Sera déterminé plus tard
        level: 1 // Niveau de la tâche
      });
    });
    
    // Deuxième étape : traiter les tâches avec prédécesseurs
    // Nous allons les traiter niveau par niveau
    let processedTasks = tasksWithoutPredecessors.map(t => t.id);
    let remainingTasks = tasksCopy.filter(task => !processedTasks.includes(task.id));
    let currentLevel = 2; // Commencer au niveau 2 (après les tâches sans prédécesseurs qui sont au niveau 1)
    
    while (remainingTasks.length > 0) {
      // Trouver les tâches dont tous les prédécesseurs ont été traités
      // Capturer la valeur actuelle de processedTasks pour éviter les problèmes de fermeture
      const currentProcessedTasks = [...processedTasks];
      
      const tasksToProcess = remainingTasks.filter(task => 
        task.predecessors && task.predecessors.every(predId => currentProcessedTasks.includes(predId))
      );
      
      if (tasksToProcess.length === 0) {
        // S'il reste des tâches mais qu'aucune ne peut être traitée, c'est qu'il y a un cycle
        setErrorMessage('Impossible de créer le diagramme PERT. Il y a probablement un cycle dans les dépendances.');
        return { nodes: [], edges: [] };
      }
      
      // Traiter chaque tâche de ce niveau
      for (let i = 0; i < tasksToProcess.length; i++) {
        const task = tasksToProcess[i];
        // Trouver les sommets correspondant aux prédécesseurs
        const predecessorEdges = edges.filter(edge => task.predecessors.includes(edge.taskId));
        
        // Capturer la valeur actuelle de nodeCounter pour éviter les problèmes de fermeture
        const currentNodeCounter = nodeCounter;
        
        // Créer un nouveau sommet pour cette tâche
        const targetNodeId = currentNodeCounter.toString();
        nodeCounter++;
        
        // Ajouter le sommet avec le niveau courant
        nodes.push({ 
          id: targetNodeId, 
          type: 'event', 
          earlyDate: null, 
          lateDate: null,
          level: currentLevel // Ajouter le niveau au sommet
        });
        
        // Si la tâche a plusieurs prédécesseurs, on doit gérer différemment
        if (predecessorEdges.length > 1) {
          // Trouver le prédécesseur avec la plus grande durée
          let maxDurationPredEdge = predecessorEdges[0];
          for (let j = 1; j < predecessorEdges.length; j++) {
            if (predecessorEdges[j].duration > maxDurationPredEdge.duration) {
              maxDurationPredEdge = predecessorEdges[j];
            }
          }
          
          // Créer un arc depuis le sommet cible du prédécesseur principal vers le nouveau sommet
          edges.push({
            id: `edge-${task.id}-from-${maxDurationPredEdge.taskId}`,
            source: maxDurationPredEdge.target,
            target: targetNodeId,
            taskId: task.id,
            taskName: task.name,
            duration: task.duration,
            isCritical: false,
            level: currentLevel
          });
          
          // Pour les autres prédécesseurs, créer des tâches fictives de durée 0
          for (let j = 0; j < predecessorEdges.length; j++) {
            const predEdge = predecessorEdges[j];
            if (predEdge.id !== maxDurationPredEdge.id) {
              // Créer un arc fictif depuis le sommet cible du prédécesseur secondaire vers le sommet cible du prédécesseur principal
              edges.push({
                id: `edge-fictitious-${task.id}-from-${predEdge.taskId}`,
                source: predEdge.target,
                target: maxDurationPredEdge.target, // Connecter au sommet cible du prédécesseur principal
                taskId: `${task.id}0-${j}`, // Identifiant unique pour la tâche fictive
                taskName: `${task.name}0`, // Nom de la tâche fictive (ex: A0)
                duration: 0, // Durée 0 pour les tâches fictives
                isCritical: false,
                level: currentLevel,
                isFictitious: true // Marquer comme tâche fictive
              });
            }
          }
        } else {
          // Cas simple avec un seul prédécesseur
          const predEdge = predecessorEdges[0];
          // Créer un arc depuis le sommet cible du prédécesseur vers le nouveau sommet
          edges.push({
            id: `edge-${task.id}-from-${predEdge.taskId}`,
            source: predEdge.target,
            target: targetNodeId,
            taskId: task.id,
            taskName: task.name,
            duration: task.duration,
            isCritical: false, // Sera déterminé plus tard
            level: currentLevel // Ajouter le niveau à l'arc
          });
        }
      }
      
      // Mettre à jour les tâches traitées et restantes
      processedTasks = [...processedTasks, ...tasksToProcess.map(t => t.id)];
      
      // Capturer la valeur actuelle de processedTasks pour éviter les problèmes de fermeture
      const updatedProcessedTasks = [...processedTasks];
      remainingTasks = remainingTasks.filter(task => !updatedProcessedTasks.includes(task.id));
      
      // Passer au niveau suivant
      currentLevel++;
    }
    
    // Calculer les dates au plus tôt (early dates) - Forward pass
    calculateEarlyDates(nodes, edges);
    
    // Calculer les dates au plus tard (late dates) - Backward pass
    calculateLateDates(nodes, edges);
    
    // Identifier le chemin critique
    identifyCriticalPath(nodes, edges);
    
    return { nodes, edges };
  };
  
  // Calculer les dates au plus tôt (forward pass)
  const calculateEarlyDates = (nodes, edges) => {
    // Initialiser tous les sommets sauf le départ à 0
    nodes.forEach(node => {
      node.earlyDate = node.id === '0' ? 0 : 0;
    });
    
    // Utiliser une approche itérative pour s'assurer que tous les sommets sont visités
    let changed = true;
    let iterations = 0;
    const maxIterations = nodes.length * 2; // Éviter les boucles infinies
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      // Pour chaque sommet
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // Trouver tous les arcs entrants vers ce sommet
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        
        if (incomingEdges.length === 0 && node.id !== '0') {
          // Si ce n'est pas le sommet de départ et qu'il n'a pas d'arcs entrants, c'est une erreur
          continue;
        }
        
        if (node.id === '0') {
          // Le sommet de départ reste à 0
          continue;
        }
        
        // Calculer la date au plus tôt comme le maximum des dates de fin des prédécesseurs
        let maxEarlyDate = 0;
        incomingEdges.forEach(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          if (sourceNode) {
            const edgeEndDate = sourceNode.earlyDate + edge.duration;
            maxEarlyDate = Math.max(maxEarlyDate, edgeEndDate);
          }
        });
        
        // Mettre à jour la date au plus tôt si elle a changé
        if (node.earlyDate !== maxEarlyDate) {
          node.earlyDate = maxEarlyDate;
          changed = true;
        }
      }
    }
  };
  
  // Calculer les dates au plus tard (backward pass)
  const calculateLateDates = (nodes, edges) => {
    // Trouver le sommet final (celui qui n'a pas d'arcs sortants)
    const finalNodes = nodes.filter(node => 
      !edges.some(edge => edge.source === node.id)
    );
    
    if (finalNodes.length === 0) return;
    
    // Trouver la date au plus tôt maximale (durée du projet)
    const projectDuration = Math.max(...nodes.map(node => node.earlyDate));
    
    // Initialiser les dates au plus tard
    // Pour tous les sommets, initialiser à la durée du projet
    nodes.forEach(node => {
      node.lateDate = projectDuration;
    });
    
    // Utiliser une approche itérative pour s'assurer que tous les sommets sont visités
    let changed = true;
    let iterations = 0;
    const maxIterations = nodes.length * 2; // Éviter les boucles infinies
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      // Pour chaque sommet, en partant de la fin
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        
        // Trouver tous les arcs sortants de ce sommet
        const outgoingEdges = edges.filter(edge => edge.source === node.id);
        
        if (outgoingEdges.length === 0) {
          // Sommet final, sa date au plus tard est égale à sa date au plus tôt
          if (node.lateDate !== node.earlyDate) {
            node.lateDate = node.earlyDate;
            changed = true;
          }
          continue;
        }
        
        // Calculer la date au plus tard comme le minimum des dates de début au plus tard des successeurs
        let minLateDate = projectDuration;
        outgoingEdges.forEach(edge => {
          const targetNode = nodes.find(n => n.id === edge.target);
          if (targetNode) {
            const edgeStartDate = targetNode.lateDate - edge.duration;
            minLateDate = Math.min(minLateDate, edgeStartDate);
          }
        });
        
        // Mettre à jour la date au plus tard si elle a changé
        if (node.lateDate !== minLateDate) {
          node.lateDate = minLateDate;
          changed = true;
        }
      }
    }
  };
  
  // Identifier le chemin critique
  const identifyCriticalPath = (nodes, edges) => {
    // Réinitialiser le statut critique pour tous les arcs
    edges.forEach(edge => {
      // Ne pas marquer les arcs fictifs comme critiques
      if (edge.isFictitious) {
        edge.isCritical = false;
        return;
      }
      
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        // Un arc est sur le chemin critique si la marge est nulle
        // Vérifier que la date au plus tôt du sommet source + durée = date au plus tôt du sommet cible
        // ET que la date au plus tard du sommet source + durée = date au plus tard du sommet cible
        const isEarlyPathCritical = sourceNode.earlyDate + edge.duration === targetNode.earlyDate;
        const isLatePathCritical = sourceNode.lateDate + edge.duration === targetNode.lateDate;
        
        // Vérifier également que les deux nœuds ont une marge nulle
        const sourceHasZeroMargin = sourceNode.earlyDate === sourceNode.lateDate;
        const targetHasZeroMargin = targetNode.earlyDate === targetNode.lateDate;
        
        edge.isCritical = isEarlyPathCritical && isLatePathCritical && sourceHasZeroMargin && targetHasZeroMargin;
      }
    });
  };
  
  // Générer la séquence des tâches du chemin critique
  const getCriticalPathSequence = (nodes, edges) => {
    // Filtrer les arcs critiques (non fictifs)
    const criticalEdges = edges.filter(edge => edge.isCritical && !edge.isFictitious);
    
    if (criticalEdges.length === 0) return 'Aucun';
    
    // Identifier les nœuds du chemin critique (ceux avec marge nulle)
    const criticalNodes = nodes.filter(node => node.earlyDate === node.lateDate);
    const criticalNodeIds = criticalNodes.map(node => node.id);
    
    // Trouver le premier arc (celui qui part du nœud 0 ou du premier nœud critique)
    let startNodeId = criticalNodeIds.includes('0') ? '0' : criticalNodeIds[0];
    let currentEdge = criticalEdges.find(edge => edge.source === startNodeId);
    
    // Si aucun arc n'est trouvé, prendre le premier arc critique
    if (!currentEdge && criticalEdges.length > 0) {
      currentEdge = criticalEdges[0];
    }
    
    // Si toujours aucun arc, retourner les nœuds critiques
    if (!currentEdge) {
      if (criticalNodeIds.length > 0) {
        return 'Nœuds critiques: ' + criticalNodeIds.join(' → ');
      }
      return 'Aucun';
    }
    
    // Construire la séquence des tâches
    const sequence = [currentEdge.taskName];
    let currentTarget = currentEdge.target;
    
    // Parcourir le chemin critique en suivant les arcs
    let maxIterations = criticalEdges.length * 2; // Gérer les boucles potentielles
    let iterations = 0;
    
    while (iterations < maxIterations) {
      iterations++;
      
      // Capture la valeur actuelle de currentTarget pour éviter les problèmes de fermeture
      const currentNodeTarget = currentTarget;
      
      // Trouver le prochain arc critique qui part du nœud cible actuel
      const nextEdge = criticalEdges.find(edge => 
        edge.source === currentNodeTarget && 
        !sequence.includes(edge.taskName)
      );
      
      if (!nextEdge) {
        break; // Fin du chemin critique
      } else {
        sequence.push(nextEdge.taskName);
        currentTarget = nextEdge.target;
      }
    }
    
    // Si la séquence est vide ou incomplète, afficher les noms des tâches critiques
    if (sequence.length === 0 || sequence.length < criticalEdges.length / 2) {
      return criticalEdges.map(edge => edge.taskName).join(' → ');
    }
    
    return sequence.join(' → ');
  };
  
  // Nous n'avons plus besoin de formater les dates car nous ne les affichons plus
  // Fonction pour calculer la position d'une tâche en fonction des unités de temps
  const calculateTaskPosition = (task) => {
    const projectStart = new Date(startDate);
    
    // Trouver la durée maximale des tâches pour s'assurer que toutes sont visibles
    const maxTaskDuration = Math.max(...ganttTasks.map(t => {
      const tStart = new Date(t.start);
      const tEnd = new Date(t.end);
      return Math.ceil((tEnd - tStart) / (1000 * 60 * 60 * 24));
    }), 0);
    
    // Trouver la date de fin la plus tardive parmi toutes les tâches
    const latestTaskEnd = Math.max(...ganttTasks.map(t => new Date(t.end).getTime()));
    
    // Calculer le nombre total de jours à afficher (au moins 30 ou la durée maximale + 5)
    const totalDays = Math.max(30, maxTaskDuration + 5, Math.ceil((latestTaskEnd - projectStart) / (1000 * 60 * 60 * 24)) + 3);
    
    if (totalDays <= 0) return { left: 0, width: 0 };
    
    // Calculer la position et la largeur en fonction des jours
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);
    const taskDuration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24));
    
    const startDay = Math.ceil((taskStart - projectStart) / (1000 * 60 * 60 * 24));
    
    // Calculer la position en pourcentage
    const left = (startDay / totalDays) * 100;
    const width = (taskDuration / totalDays) * 100;
    
    return { 
      left: `${left}%`, 
      width: `${width}%`,
      days: taskDuration
    };
  };
  
  // Fonction pour générer les unités de temps de la timeline
  const generateTimeUnits = () => {
    if (!projectEndDate && ganttTasks.length === 0) return [];
    
    const projectStart = new Date(startDate);
    
    // Trouver la durée maximale des tâches
    const maxTaskDuration = Math.max(...ganttTasks.map(task => {
      const taskStart = new Date(task.start);
      const taskEnd = new Date(task.end);
      return Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24));
    }), 0);
    
    // Trouver la date de fin la plus tardive parmi toutes les tâches
    const latestTaskEnd = Math.max(...ganttTasks.map(task => new Date(task.end).getTime()));
    const daysToLatestEnd = Math.ceil((latestTaskEnd - projectStart) / (1000 * 60 * 60 * 24));
    
    // Calculer le nombre total de jours à afficher (au moins 30 ou la durée maximale + 5)
    const displayDays = Math.max(30, maxTaskDuration + 5, daysToLatestEnd + 3);
    
    // Déterminer le nombre d'unités à afficher (entre 30 et 50)
    const numUnits = Math.min(Math.max(30, displayDays), 50);
    const step = Math.max(1, Math.ceil(displayDays / numUnits));
    
    // Générer les unités avec un pas adaptatif
    const units = [];
    for (let i = 0; i <= displayDays; i += step) {
      units.push(i);
    }
    
    // S'assurer que le dernier jour est affiché
    if (units[units.length - 1] < displayDays) {
      units.push(displayDays);
    }
    
    return units;
  };
  
  // Effet pour dessiner le diagramme de Gantt
  useEffect(() => {
    if (ganttRef.current && ganttTasks.length > 0) {
      // Le diagramme est du00e9ju00e0 rendu par React, pas besoin de code supplu00e9mentaire ici
    }
  }, [ganttTasks]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Techniques d'Ordonnancement GANTT--PERT</h1>
      </header>
      
      <main className="App-main">
        <section className="task-form-section">
          <h2>Ajouter une tâche</h2>
          
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
              <button onClick={() => setErrorMessage('')}>×</button>
            </div>
          )}
          
          <form onSubmit={addTask} className="task-form">
            <div className="form-group">
              <label>ID de la tâche:</label>
              <div className="auto-generated-id">
                {generateUniqueId()}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="name">Nom de la tâche*:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newTask.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="duration">Durée (jours)*:</label>
              <input
                type="number"
                id="duration"
                name="duration"
                min="1"
                value={newTask.duration}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="predecessors">Tâches antérieures (IDs séparés par des virgules):</label>
              <input
                type="text"
                id="predecessors"
                name="predecessors"
                value={newTask.predecessors}
                onChange={handleInputChange}
                placeholder="ex: 1,2,4"
              />
            </div>
            
            <button type="submit" className="btn-add">Ajouter la tâche</button>
          </form>
        </section>
        
        <section className="task-list-section">
          <h2>Liste des tâches</h2>
          
          {tasks.length === 0 ? (
            <p>Aucune tâche ajoutée pour le moment.</p>
          ) : (
            <table className="task-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Durée (jours)</th>
                  <th>Tâches antérieures</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.id}</td>
                    <td>{task.name}</td>
                    <td>{task.duration}</td>
                    <td>{task.predecessors && task.predecessors.length > 0 ? task.predecessors.map(predId => {
                        const predTask = tasks.find(t => t.id === predId);
                        return predTask ? predTask.name : predId;
                      }).join(', ') : '-'}</td>
                    <td>
                      <button 
                        onClick={() => deleteTask(task.id)} 
                        className="btn-delete"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          <div className="gantt-controls">
            <button 
              onClick={generateGantt} 
              className="btn-generate"
              disabled={tasks.length === 0}
            >
              Générer le diagramme de GANTT
            </button>
            <button 
              onClick={generatePert} 
              className="btn-generate"
              disabled={tasks.length === 0}
            >
              Générer le diagramme PERT
            </button>
          </div>
        </section>
        
        <section className="gantt-section">
          <h2>{showPert ? 'Diagramme PERT' : 'Diagramme de Gantt'}</h2>
          
          {showPert && pertTasks && pertTasks.nodes && pertTasks.nodes.length > 0 ? (
            <div className="pert-container" ref={pertRef}>
              <div className="pert-chart">
                <svg className="pert-svg" viewBox="0 0 1500 800" preserveAspectRatio="xMinYMin meet" width="100%" height="auto">
                  {/* Définir les flèches pour les arcs */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="12"
                      markerHeight="9"
                      refX="6"
                      refY="4.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 12 4.5, 0 9" fill="#3498db" />
                    </marker>
                    <marker
                      id="arrowhead-critical"
                      markerWidth="12"
                      markerHeight="9"
                      refX="6"
                      refY="4.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 12 4.5, 0 9" fill="#e74c3c" />
                    </marker>
                    
                    {/* Filtre d'ombre pour les u00e9tiquettes */}
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="rgba(0,0,0,0.3)" />
                    </filter>
                  </defs>
                  
                  {/* Organiser et dessiner les sommets et les arcs par niveaux */}
                  {(() => {
                    // Calculer le nombre de niveaux et le nombre de sommets par niveau
                    const levels = {};
                    pertTasks.nodes.forEach(node => {
                      const level = node.level || 0;
                      if (!levels[level]) levels[level] = [];
                      levels[level].push(node);
                    });
                    
                    // Calculer les positions des sommets par niveau
                    const nodePositions = {};
                    
                    // Calcul des dimensions responsives en fonction de la taille du SVG
                    const svgWidth = 1500;
                    const svgHeight = 800;
                    
                    // Calculer les espacements en fonction du nombre de niveaux et de nœuds
                    const numLevels = Object.keys(levels).length;
                    const maxNodesInAnyLevel = Math.max(...Object.values(levels).map(nodes => nodes.length));
                    
                    // Calcul dynamique des espacements
                    const baseX = svgWidth * 0.1; // 10% de la largeur du SVG
                    const baseY = svgHeight * 0.15; // 15% de la hauteur du SVG
                    const xSpacing = numLevels > 1 ? (svgWidth * 0.8) / (numLevels - 1) : svgWidth * 0.4; // 80% de la largeur divisée par le nombre de niveaux - 1
                    const ySpacing = maxNodesInAnyLevel > 1 ? (svgHeight * 0.7) / (maxNodesInAnyLevel - 1) : svgHeight * 0.35; // 70% de la hauteur divisée par le nombre max de nœuds - 1
                    
                    // Optimisation du placement des sommets pour minimiser les croisements
                    // D'abord, trier les sommets dans chaque niveau pour réduire les croisements
                    Object.keys(levels).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
                      const nodesInLevel = levels[level];
                      const levelX = baseX + parseInt(level) * xSpacing;
                      
                      // Pour les niveaux > 0, essayer d'ordonner les sommets pour minimiser les croisements
                      if (parseInt(level) > 0 && nodesInLevel.length > 1) {
                        // Calculer un score pour chaque nœud basé sur ses connexions
                        nodesInLevel.forEach(node => {
                          // Trouver les arcs entrants vers ce nœud
                          const incomingEdges = pertTasks.edges.filter(edge => edge.target === node.id);
                          
                          // Calculer la position moyenne des sources
                          let avgSourceY = 0;
                          let sourceCount = 0;
                          
                          incomingEdges.forEach(edge => {
                            const sourceNode = pertTasks.nodes.find(n => n.id === edge.source);
                            if (sourceNode && nodePositions[sourceNode.id]) {
                              avgSourceY += nodePositions[sourceNode.id].y;
                              sourceCount++;
                            }
                          });
                          
                          // Stocker cette position moyenne comme score pour le tri
                          node.positionScore = sourceCount > 0 ? avgSourceY / sourceCount : 0;
                        });
                        
                        // Trier les nœuds par leur score de position
                        nodesInLevel.sort((a, b) => a.positionScore - b.positionScore);
                      }
                      
                      // Centrer les sommets verticalement dans leur niveau de manière responsive
                      const levelHeight = (nodesInLevel.length - 1) * ySpacing;
                      const startY = baseY + (svgHeight * 0.7 - levelHeight) / 2;
                      
                      nodesInLevel.forEach((node, idx) => {
                        nodePositions[node.id] = {
                          x: levelX,
                          y: startY + idx * ySpacing
                        };
                      });
                    });
                    
                    // Générer les éléments JSX pour les arcs et les sommets
                    const elements = [];
                    
                    // Pré-traitement pour éviter les chevauchements d'étiquettes
                    // Stocker les positions des étiquettes pour détecter les chevauchements
                    const labelPositions = [];
                    
                    // Dessiner les arcs (tâches)
                    pertTasks.edges.forEach((edge, index) => {
                      // Trouver les positions des sommets source et cible
                      const sourceNode = pertTasks.nodes.find(n => n.id === edge.source);
                      const targetNode = pertTasks.nodes.find(n => n.id === edge.target);
                      
                      if (!sourceNode || !targetNode) return;
                      
                      // Utiliser les positions calculées
                      const sourcePos = nodePositions[sourceNode.id];
                      const targetPos = nodePositions[targetNode.id];
                      
                      if (!sourcePos || !targetPos) return;
                      
                      const sourceX = sourcePos.x;
                      const sourceY = sourcePos.y;
                      const targetX = targetPos.x;
                      const targetY = targetPos.y;
                      
                      // Calculer le point de contrôle pour la courbe
                      // Ajuster la courbure en fonction de la distance entre les sommets
                      const dx = targetX - sourceX;
                      const dy = targetY - sourceY;
                      const distance = Math.sqrt(dx * dx + dy * dy);
                      
                      // Stratégie avancée pour éviter les croisements d'arcs
                      let curveDirection = 0;
                      let curveMagnitude = 1.0; // Facteur d'amplification de la courbure
                      
                      // Déterminer si cet arc risque de croiser d'autres arcs
                      const potentialCrossings = pertTasks.edges.filter(otherEdge => {
                        if (otherEdge.id === edge.id) return false; // Ignorer l'arc lui-même
                        
                        // Vérifier si les arcs partagent le même niveau source ou cible
                        const sameSourceLevel = pertTasks.nodes.find(n => n.id === otherEdge.source)?.level === sourceNode.level;
                        const sameTargetLevel = pertTasks.nodes.find(n => n.id === otherEdge.target)?.level === targetNode.level;
                        
                        // Vérifier si les arcs se croisent potentiellement
                        if (sameSourceLevel || sameTargetLevel) {
                          const otherSourcePos = nodePositions[otherEdge.source];
                          const otherTargetPos = nodePositions[otherEdge.target];
                          
                          if (!otherSourcePos || !otherTargetPos) return false;
                          
                          // Vérifier si les arcs se croisent en comparant leurs positions verticales
                          return (sourceY < otherSourcePos.y && targetY > otherTargetPos.y) || 
                                 (sourceY > otherSourcePos.y && targetY < otherTargetPos.y);
                        }
                        
                        return false;
                      });
                      
                      // Traitement spécial pour les arcs partant du nœud 0 (initial)
                      if (edge.source === '0') {
                        // Compter combien d'arcs partent du nœud 0
                        const arcsFromStart = pertTasks.edges.filter(e => e.source === '0').length;
                        
                        // Distribuer les arcs de manière plus étalée
                        const arcIndex = pertTasks.edges.filter(e => e.source === '0').findIndex(e => e.id === edge.id);
                        
                        // Calculer une direction de courbure basée sur la position de l'arc
                        if (arcsFromStart > 1) {
                          // Répartir les arcs en éventail
                          curveDirection = -1 + (2 * arcIndex / (arcsFromStart - 1));
                          curveMagnitude = 2.0; // Augmenter la courbure pour les arcs du début
                        }
                      } else if (potentialCrossings.length > 0) {
                        // Si l'arc risque de croiser d'autres arcs, ajuster sa courbure
                        curveDirection = (index % 2 === 0) ? -1.5 : 1.5; // Courbure plus prononcée
                        curveMagnitude = 1.5 + (potentialCrossings.length * 0.2); // Augmenter la courbure en fonction du nombre de croisements potentiels
                      } else if (Math.abs(dy) < 50) { // Si les sommets sont presque au même niveau vertical
                        curveDirection = (index % 2 === 0) ? -1 : 1; // Alterner les courbures
                      } else {
                        curveDirection = (dy > 0) ? -1 : 1; // Courber dans la direction opposée à la pente
                      }
                      
                      // Calculer le point de contrôle avec une courbure optimisée
                      const controlX = sourceX + dx * 0.5;
                      let controlY;
                      
                      // Ajuster le point de contrôle en fonction du type d'arc
                      if (edge.isFictitious) {
                        // Les arcs fictifs ont une courbure plus légère
                        const flattenFactor = 0.7;
                        controlY = sourceY + dy * 0.5 + curveDirection * Math.min(distance * 0.15, 40) * flattenFactor;
                      } else {
                        // Arcs normaux avec courbure standard
                        controlY = sourceY + dy * 0.5 + curveDirection * Math.min(distance * 0.25, 70) * curveMagnitude;
                      }
                    
                      // Ajouter l'arc (ligne courbe) aux éléments
                      elements.push(
                        <g key={`edge-${index}`}>
                          <path
                            d={`M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`}
                            stroke={edge.isCritical ? '#e74c3c' : '#3498db'}
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={edge.isFictitious ? '5,5' : 'none'} // Ligne en pointillés pour les tâches fictives
                            markerEnd={edge.isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
                          />
                          {/* Calculer la position optimale de l'étiquette */}
                          {(() => {
                            // Position de base pour l'étiquette
                            let labelX = sourceX + dx * (edge.isFictitious ? 0.45 : 0.5);
                            let labelY = sourceY + dy * (edge.isFictitious ? 0.35 : 0.4) + 
                                      (curveDirection * Math.min(Math.abs(dy) * (edge.isFictitious ? 0.1 : 0.15), 
                                      edge.isFictitious ? 15 : 25));
                            
                            // Texte de l'étiquette
                            const labelText = `${edge.taskName} (${edge.duration})`;
                            const fontSize = edge.isFictitious ? 12 : 14;
                            
                            // Estimer la largeur et la hauteur de l'étiquette
                            const estimatedWidth = labelText.length * fontSize * 0.6;
                            const estimatedHeight = fontSize * 1.2;
                            
                            // Définir la zone de l'étiquette
                            const labelBounds = {
                              x1: labelX - estimatedWidth / 2,
                              y1: labelY - estimatedHeight / 2,
                              x2: labelX + estimatedWidth / 2,
                              y2: labelY + estimatedHeight / 2
                            };
                            
                            // Vérifier les chevauchements avec les étiquettes existantes
                            let overlap = false;
                            let adjustmentAttempts = 0;
                            const maxAdjustments = 5;
                            
                            while (adjustmentAttempts < maxAdjustments) {
                              overlap = false;
                              
                              // Vérifier le chevauchement avec chaque étiquette existante
                              for (const existingLabel of labelPositions) {
                                if (
                                  labelBounds.x1 < existingLabel.x2 &&
                                  labelBounds.x2 > existingLabel.x1 &&
                                  labelBounds.y1 < existingLabel.y2 &&
                                  labelBounds.y2 > existingLabel.y1
                                ) {
                                  overlap = true;
                                  break;
                                }
                              }
                              
                              if (!overlap) break;
                              
                              // Ajuster la position si chevauchement détecté
                              if (Math.abs(dx) > Math.abs(dy)) {
                                // Ajuster verticalement si l'arc est plus horizontal
                                labelY += (adjustmentAttempts % 2 === 0 ? 1 : -1) * (estimatedHeight * 0.8) * (adjustmentAttempts + 1);
                              } else {
                                // Ajuster horizontalement si l'arc est plus vertical
                                labelX += (adjustmentAttempts % 2 === 0 ? 1 : -1) * (estimatedWidth * 0.3) * (adjustmentAttempts + 1);
                              }
                              
                              // Mettre à jour les limites après ajustement
                              labelBounds.x1 = labelX - estimatedWidth / 2;
                              labelBounds.y1 = labelY - estimatedHeight / 2;
                              labelBounds.x2 = labelX + estimatedWidth / 2;
                              labelBounds.y2 = labelY + estimatedHeight / 2;
                              
                              adjustmentAttempts++;
                            }
                            
                            // Ajouter cette étiquette à la liste des positions
                            labelPositions.push({...labelBounds, id: edge.id});
                            
                            return (
                              <text
                                x={labelX}
                                y={labelY}
                                textAnchor="middle"
                                fill={edge.isCritical ? '#e74c3c' : '#3498db'}
                                fontWeight="bold"
                                fontSize={edge.isFictitious ? "12" : "14"}
                                className="pert-edge-label"
                                dominantBaseline="middle"
                                stroke="white"
                                strokeWidth="0.7"
                                paintOrder="stroke"
                                filter="url(#shadow)"
                                opacity={edge.isFictitious ? "0.9" : "1"}
                              >
                                {labelText}
                              </text>
                            );
                          })()}
                        </g>
                      );
                    });
                    
                    // Dessiner les sommets (événements)
                    pertTasks.nodes.forEach((node, index) => {
                      // Utiliser les positions calculées
                      const pos = nodePositions[node.id];
                      if (!pos) return;
                      
                      const x = pos.x;
                      const y = pos.y;
                      
                      // Vérifier si le sommet est sur le chemin critique
                      // Un nœud est sur le chemin critique si sa marge est nulle (date au plus tôt = date au plus tard)
                      const isOnCriticalPath = node.earlyDate === node.lateDate;
                      
                      // Alternative: un nœud est sur le chemin critique s'il est connecté par des arcs critiques
                      // (sauf pour le premier et dernier nœud qui n'ont qu'un seul arc)
                      /*
                      const incomingCriticalEdges = pertTasks.edges.filter(edge => edge.isCritical && edge.target === node.id);
                      const outgoingCriticalEdges = pertTasks.edges.filter(edge => edge.isCritical && edge.source === node.id);
                      
                      const isOnCriticalPath = 
                        // Premier nœud (seulement des arcs sortants)
                        (node.id === '0' && outgoingCriticalEdges.length > 0) || 
                        // Dernier nœud (seulement des arcs entrants)
                        (outgoingCriticalEdges.length === 0 && incomingCriticalEdges.length > 0) ||
                        // Nœuds intermédiaires (arcs entrants ET sortants)
                        (incomingCriticalEdges.length > 0 && outgoingCriticalEdges.length > 0);
                      */
                      
                      // Ajouter le sommet aux éléments
                      elements.push(
                        <g key={`node-${index}`}>
                          {/* Cercle du sommet avec taille augmentée */}
                          <circle
                            cx={x}
                            cy={y}
                            r="40"
                            stroke={isOnCriticalPath ? '#e74c3c' : '#3498db'}
                            strokeWidth="3"
                            fill="white"
                          />
                          
                          {/* Identifiant du sommet (positioné plus bas) */}
                          <text
                            x={x}
                            y={y + 10}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontWeight="bold"
                            fontSize="20"
                          >
                            {node.id}
                          </text>
                          
                          {/* Date au plus tôt */}
                          <text
                            x={x - 20}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="14"
                            fill="#27ae60"
                            fontWeight="bold"
                          >
                            {node.earlyDate !== undefined && node.earlyDate !== -1 ? node.earlyDate : '0'}
                          </text>
                          
                          {/* Date au plus tard */}
                          <text
                            x={x + 20}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="14"
                            fill="#e74c3c"
                            fontWeight="bold"
                          >
                            {node.lateDate !== undefined && node.lateDate !== Number.MAX_SAFE_INTEGER ? node.lateDate : '0'}
                          </text>
                        </g>
                      );
                      
                      // Ajouter une étiquette de niveau
                      if (node.id !== '0' && parseInt(node.id) === Math.min(...levels[node.level].map(n => parseInt(n.id)))) {
                        elements.push(
                          <text
                            key={`level-${node.level}`}
                            x={x}
                            y={baseY - 50}
                            textAnchor="middle"
                            fontWeight="bold"
                            fontSize="14"
                            fill="#2c3e50"
                          >
                            Niveau {node.level}
                          </text>
                        );
                      }
                    });
                    
                    return elements;
                  })()}
                </svg>
                
                {/* Légende */}
                <div className="pert-legend">
                  <div className="pert-legend-title">Légende</div>
                  
                  <div className="pert-legend-item">
                    <div className="pert-legend-color critical-path"></div>
                    <div className="pert-legend-text">
                      <strong>Chemin critique:</strong> {getCriticalPathSequence(pertTasks.nodes, pertTasks.edges)}
                    </div>
                  </div>
                  
                  <div className="pert-legend-item">
                    <div className="pert-legend-color" style={{ backgroundColor: '#27ae60' }}></div>
                    <div className="pert-legend-text">
                      <strong>Date au plus tôt:</strong> Valeur à gauche dans les cercles
                    </div>
                  </div>
                  
                  <div className="pert-legend-item">
                    <div className="pert-legend-color" style={{ backgroundColor: '#e74c3c' }}></div>
                    <div className="pert-legend-text">
                      <strong>Date au plus tard:</strong> Valeur à droite dans les cercles
                    </div>
                  </div>
                  
                  <div className="pert-legend-item">
                    <div className="pert-legend-color" style={{ backgroundColor: '#3498db' }}></div>
                    <div className="pert-legend-text">
                      <strong>Tâches normales</strong>
                    </div>
                  </div>
                  
                  <div className="pert-legend-item" style={{ borderTop: '1px dashed #e0e0e0', paddingTop: '15px' }}>
                    <svg width="65" height="20" style={{ marginRight: '10px' }}>
                      <path
                        d="M 5 10 L 60 10"
                        stroke="#3498db"
                        strokeWidth="3"
                        fill="none"
                      />
                      <polygon points="55,5 60,10 55,15" fill="#3498db" />
                    </svg>
                    <div className="pert-legend-text">
                      <strong>Arc normal</strong>
                    </div>
                  </div>
                  
                  <div className="pert-legend-item">
                    <svg width="65" height="20" style={{ marginRight: '10px' }}>
                      <path
                        d="M 5 10 L 60 10"
                        stroke="#3498db"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                        fill="none"
                      />
                    </svg>
                    <div className="pert-legend-text">
                      <strong>Arc fictif</strong> (durée 0)
                    </div>
                  </div>
                  <div className="pert-legend-item">
                    <div className="pert-legend-text">
                      Les arcs représentent les tâches avec leur durée.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : !showPert && ganttTasks.length > 0 ? (
            <div className="gantt-container" ref={ganttRef}>
              <div className="gantt-chart">
                <div className="gantt-chart-header">
                  <div className="gantt-chart-header-task">Tâche</div>
                  <div className="gantt-chart-header-timeline">
                    <div className="timeline-units">
                      {generateTimeUnits().map((day, index) => (
                        <span key={index} className="timeline-unit">{day}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="gantt-chart-body">
                  
                  {ganttTasks.map(task => {
                    const position = calculateTaskPosition(task);
                    
                    return (
                      <div key={task.id} className="gantt-chart-row">
                        <div className="gantt-chart-task">
                          <div className="gantt-task-info">
                            <div className="gantt-task-name">{task.name}</div>

                          </div>
                        </div>
                        <div className="gantt-chart-timeline">
                          <div 
                            className="gantt-task-bar"
                            style={{
                              left: position.left,
                              width: position.width,
                            }}
                            title={`${task.name}`}
                          >
                            <span className="gantt-task-id">{task.id}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p>Ajoutez des tâches et cliquez sur "Générer le diagramme de {showPert ? 'PERT' : 'Gantt'}" pour visualiser le diagramme.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
