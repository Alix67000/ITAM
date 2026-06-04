# Assistant de création : Poste Complet (Wizard V1)

Ce document décrit la logique d'implémentation du Workflow Assistant (V1) qui permet de provisionner un poste de travail complet pour un collaborateur en une seule étape.

## 1. Ce que fait la V1
La V1 du Wizard simplifie l'onboarding équipement/collaborateur. Plutôt que de créer les différents éléments manuellement dans plusieurs pages, cette vue centralise toutes les saisies puis les enregistre en base d'un coup via une séquence robuste utilisant les services existants (`api.ts`).

## 2. Étapes du wizard
1. **Collaborateur** : Sélection d'un utilisateur existant (via liste) ou création simple d'un nouveau.
2. **Ordinateur principal** : Caractéristiques du poste de base (Label, Modèle, N° de Série, Lieu, Fournisseur).
3. **Équipements liés** : Sélection de 0..N périphériques secondaires (Écran, Périphérique, Téléphone).
4. **Téléphonie (Optionnelle)** : Possibilité de créer simultanément une ligne téléphonique affectée au collaborateur.
5. **Logiciels & Licences (Optionnelle)** : Affectation d'éléments existants.
6. **Validation** : Résumé des saisies puis action de création.

## 3. Ce qui est créé en base
Le flux génère un ensemble de mutations via Firebase (API legacy/base) en utilisant les vraies valeurs du métier :
1. Génération des numéros d'inventaire (`getNextInventoryNumber`)
2. Création du `user` (si nouveau)
3. Création de l'`asset` (Poste principal) : assigné à `userId` (Statut "En service", Condition "Neuf", Type "PC").
4. Créations des `assets` périphériques secondaires : assignés à `userId`.
5. Création de la ligne téléphonique (`phone_lines`) : assignée à `userId` (Statut "Actif", Type dans `comments`).

## 4. Quelles relations sont créées
- **Assignations hiérarchiques de base :**
  - Ordinateur `assigned_user_id` -> Collaborateur
  - Équipements `assigned_user_id` -> Collaborateur
  - Ligne téléphonique `assigned_user_id` -> Collaborateur
- **Softwares et Licenses :**
  - Appels de `assignAssetToSoftware(softwareId, pcId)`
  - Appels de `assignUserToLicense(licId, userId)`
- **Relations :**
  - Utilisation du mécanisme legacy : `linkAsset(pcId, eqAsset.id)`
  - Ajout dans la collection `relations` via `relationService.createRelation(...)` : Type (`attached_to`).

## 5. Ce qui n'est pas encore géré dans la V1
- Pas de création inline de Logiciel ou de Licence (seulement de l'affectation).
- Pas de "vrai" transaction batch Firestore atomique : Les étapes de création s'enchaînent dans le front-end.
- Fermeture automatique complète du Hub après validation via la propagation d'état `onSuccess`.

## 6. Prochaines évolutions
- Grouper les écritures dans un `writeBatch(db)`.
- Modèles de postes existants (Templates d'équipement).
