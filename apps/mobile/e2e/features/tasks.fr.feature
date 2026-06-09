# language: fr
@tasks
Fonctionnalité: Gestion des tâches (mobile)
  En tant qu'utilisateur connecté
  Je veux gérer mes tâches sur mobile

  Contexte:
    Étant donné que je suis connecté

  @smoke
  Scénario: Ajouter une tâche
    Quand j'ajoute la tâche "Préparer le devis"
    Alors la tâche "Préparer le devis" est visible
    Et le compteur indique "1 tâche à faire"

  Scénario: Terminer une tâche
    Étant donné la tâche "Configurer la CI"
    Quand je marque la tâche "Configurer la CI" comme terminée
    Alors le compteur indique "0 tâche à faire"

  Scénario: Supprimer une tâche
    Étant donné la tâche "Tâche jetable"
    Quand je supprime la tâche "Tâche jetable"
    Alors la tâche "Tâche jetable" n'est pas visible

  @filter
  Plan du Scénario: Filtrer les tâches
    Étant donné la tâche "Active 1"
    Et la tâche "Terminée 1"
    Et je marque la tâche "Terminée 1" comme terminée
    Quand je filtre sur "<filtre>"
    Alors la tâche "<visible>" est visible

    Exemples:
      | filtre    | visible    |
      | À faire   | Active 1   |
      | Terminées | Terminée 1 |
