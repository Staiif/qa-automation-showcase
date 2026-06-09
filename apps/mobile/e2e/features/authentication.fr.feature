# language: fr
@auth
Fonctionnalité: Authentification (mobile)
  En tant qu'utilisateur de l'app mobile
  Je veux me connecter à Taskly

  @smoke
  Scénario: Connexion avec des identifiants valides
    Étant donné que je suis sur la page de connexion
    Quand je me connecte avec des identifiants valides
    Alors je vois mon tableau de tâches
    Et mon adresse email est affichée

  Scénario: Connexion refusée avec un mauvais mot de passe
    Étant donné que je suis sur la page de connexion
    Quand je me connecte avec un mauvais mot de passe
    Alors un message d'erreur s'affiche

  Scénario: Déconnexion
    Étant donné que je suis connecté
    Quand je me déconnecte
    Alors je reviens à la page de connexion
