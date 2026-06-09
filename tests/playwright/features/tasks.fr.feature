# language: fr
@tasks
Fonctionnalité: Gestion des tâches
  Afin de m'organiser
  En tant qu'utilisateur connecté
  Je veux créer, terminer, supprimer et filtrer mes tâches

  Contexte:
    Étant donné que je suis connecté

  @smoke
  Scénario: Ajouter une tâche met à jour le compteur
    Quand j'ajoute la tâche "Préparer le devis client"
    Alors la tâche "Préparer le devis client" est visible
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
    Alors le nombre de tâches affichées est <nombre>

    Exemples:
      | filtre    | nombre |
      | Toutes    | 2      |
      | À faire   | 1      |
      | Terminées | 1      |
