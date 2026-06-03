# 🔐 Authentification — ITAM EMMAÜS

## Principe

L'accès à ITAM EMMAÜS est contrôlé par une **liste blanche d'emails**
gérée directement dans Firebase Authentication.

- Tout utilisateur dont l'email est créé dans **Firebase Auth** peut se
  connecter et a un accès **administrateur complet** à l'application.
- Tout utilisateur dont l'email n'est **PAS** dans Firebase Auth ne peut
  ni se connecter, ni accéder aux données.

Il n'y a pas de niveaux de droits (pas de rôles Admin/Viewer/etc.) —
c'est volontairement simple pour une petite équipe.

## Activer l'authentification (à faire une seule fois)

1. Aller sur https://console.firebase.google.com → projet **itam-emmaus**
2. Menu de gauche → **Authentication**
3. Onglet **Sign-in method** → cliquer sur **Email/Password**
4. Activer la bascule **Enable** → **Save**

## Donner accès à une nouvelle personne

1. Console Firebase → **Authentication** → onglet **Users**
2. Bouton **Add user**
3. Renseigner :
   - **Email** de la personne (ex: `prenom.nom@emmaus.fr`)
   - **Password** temporaire fort (≥ 12 caractères, à communiquer en
     sécurité à la personne — Signal, Bitwarden Send, etc.)
4. **Add user**
5. Communiquer à la personne :
   - L'URL de l'application
   - Son email
   - Le mot de passe temporaire (qu'elle pourra changer ensuite)

## Retirer l'accès à une personne

1. Console Firebase → **Authentication** → onglet **Users**
2. Trouver la ligne de l'utilisateur
3. Menu **⋮** à droite → **Delete account**
   (ou **Disable account** si on veut juste suspendre temporairement)

L'accès est révoqué immédiatement lors de la prochaine action de la
personne sur l'application.

## Réinitialiser un mot de passe oublié

1. Console Firebase → **Authentication** → onglet **Users**
2. Menu **⋮** à droite de l'utilisateur → **Reset password**
3. Firebase envoie automatiquement un email de réinitialisation

## Sécurité

- Ne communiquez **jamais** les mots de passe par email non chiffré ou SMS.
- Activez l'**App Check** côté Firebase pour bloquer les clients non
  légitimes (recommandé en prod).
- Pensez à activer la **MFA** (Multi-Factor Authentication) côté
  Firebase pour les comptes admins critiques.
