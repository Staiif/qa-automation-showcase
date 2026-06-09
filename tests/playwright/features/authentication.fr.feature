# language: fr
@auth
Fonctionnalité: Authentification
  Afin de gérer mes tâches en toute sécurité
  En tant qu'utilisateur
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
    Et je reste sur la page de connexion

  Scénario: La session survit à un rechargement
    Étant donné que je suis connecté
    Quand je recharge la page
    Alors je vois mon tableau de tâches
