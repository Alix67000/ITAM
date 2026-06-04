# Assistant de création : Poste Complet (Wizard V1)

Ce document décrit la logique d'implémentation du Workflow Assistant (V1) qui permet de provisionner un poste de travail complet pour un collaborateur en une seule étape.

## 1. Ce que fait la V1
La V1 du Wizard simplifie l'onboarding équipement/collaborateur. Plutôt que de créer les différents éléments manuellement dans plusieurs pages (collaborateur, ordinateur, périphériques, etc.), cette vue centralise toutes les saisies puis les enregistre en base d'un coup via une séquence robuste utilisant les services existants (`api.ts`).

## 2. Étapes du wizard
1. **Collaborateur** : Sélection d'un utilisateur existant (via liste) ou création simple d'un nouveau (Nom, Email, Service).
2. **Ordinateur principal** : Caractéristiques du poste de base (Label, Modèle, N° de Série, Lieu).
3. **Équipements liés** : Sélection de 0..N périphériques secondaires (Écran, Clavier, Souris, Dock).
4. **Téléphonie (Optionnelle)** : Possibilité de créer simultanément une ligne téléphonique (fixe, mobile) à affecter au collaborateur.
5. **Logiciels & Licences (Optionnelle)** : Affectation d'éléments existants (pas de création incluse pour simplifier l'UX de cette V1).
6. **Validation** : Résumé des saisies puis action de création.

## 3. Ce qui est créé en base
Le flux génère un ensemble de mutations via Firebase (API legacy/base):
1. Création du `user` (si nouveau)
2. Création de l'`asset` (Poste principal) : assigné à `userId`.
3. Créations des `assets` périphériques secondaires : assignés à `userId`.
4. Création de la ligne téléphonique (`phone_lines`) : assignée à `userId`.

## 4. Quelles relations sont créées
- **Assignations hiérarchiques de base :**
  - Ordinateur `assigned_user_id` -> Collaborateur
  - Équipements `assigned_user_id` -> Collaborateur
  - Ligne téléphonique `assigned_user_id` -> Collaborateur
- **Softwares et Licenses :**
  - Appels de `assignAssetToSoftware(softwareId, pcId)`
  - Appels de `assignUserToLicense(licId, userId)`
- **Relations entre assets & Table de jointure (generic relations) :**
  - Utilisation du mécanisme legacy : `linkAsset(pcId, eqAsset.id)`
  - Ajout asynchrone dans la table pivot `relations` via `relationService.createRelation(...)` : Type (from: `asset`, to: `asset`, `attached_to`).

## 5. Ce qui n'est pas encore géré dans la V1
- Pas de création inline de Logiciel ou de Licence (seulement une sélection).
- Pas de transaction atomique au sens de base de données relationnelle rigide : Les étapes s'enchaînent de manière séquentielle dans le front. En cas d'erreur de réseau à mi-chemin, un nettoyage manuel pourrait être nécessaire.
- Pas d'édition d'une conf du Wizard a posteriori (c'est une interface de *création* pure).

## 6. Prochaines évolutions possibles
- Grouper les écritures dans une transaction Firestore ("Batched writes" `writeBatch(db)`) pour prévenir toute exécution partielle en cas de problème de connexion.
- Charger des modèles de postes existants ("Template Développeur", "Template Administratif") pour pré-remplir la composition des périphériques et des logiciels.
- Intégrer la relation hiérarchique au niveau du modèle d'édition legacy qui repose sur d'autres dépendances croisées éventuelles.
