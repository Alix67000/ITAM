# Règles Firestore du Modèle Relationnel

Ce document décrit la structure attendue d'un document `relations` dans Firestore, ainsi que les règles de sécurité et les index qui lui sont associés.

## 1. Structure attendue d'un document `relations`

Un document dans la collection globale `relations` représente une liaison unidirectionnelle entre deux entités, même si elle peut être lue et interprétée de façon bidirectionnelle dans l'UI.

### Champs obligatoires
Pour qu'un document soit enregistré, il doit strictement contenir les champs suivants :
- `from_type` (string) : Type de l'entité source (ex: "asset", "user"). Vérifié parmi un dictionnaire d'entités valides.
- `from_id` (string) : Identifiant de l'entité source (max 128 char).
- `to_type` (string) : Type de l'entité cible.
- `to_id` (string) : Identifiant de l'entité cible.
- `relation_type` (string) : Sémantique de la relation (ex: "assigned_to", "located_at").
- `status` (string) : État de la relation (ex: "active", "historical").

### Champs optionnels
Des champs supplémentaires peuvent enrichir la relation :
- `label` (string) : Nom/étiquette affichable de courtoisie.
- `notes` (string) : Commentaires libres, cas particuliers.
- `is_primary` (boolean) : Si une entité gère un statut primaire/secondaire sur ce lien.
- `created_at` (string) : Date de création ISO.
- `updated_at` (string) : Date de dernière modification ISO.
- `created_by` (string) : Identifiant de l'utilisateur ayant créé la liaison.

*Aucun autre champ non autorisé n'est accepté par la base de données.*

## 2. Règles Firestore (`firestore.rules`)

La collection `relations` est protégée par les règles :
- **Lecture (`allow read`) :** Autorisée si l'utilisateur est authentifié (`isSignedIn()`).
- **Création/Mise à jour (`allow create, update`) :** Autorisées si l'utilisateur est authentifié ET que le document passe la fonction `isValidGenericRelation(incoming())`.
- **Suppression (`allow delete`) :** Autorisée si l'utilisateur est authentifié.

La fonction `isValidGenericRelation` valide :
- La non-pollution des données (`hasOnly(...)`).
- La conformité stricte des types de données et de leurs tailles, prévenant les injections ou le "Denial of Wallet" (chaînes trop longues).

## 3. Indexes Firestore (`firestore.indexes.json`)

Pour permettre à `relationService.ts` d'obtenir les dépendances croisées sans parcourir toute la table, deux index composites majeurs ont été ajoutés sur `collectionGroup: "relations"` :
1. `from_type` (ASCENDING) + `from_id` (ASCENDING) -> Requêtes entrantes sortantes.
2. `to_type` (ASCENDING) + `to_id` (ASCENDING) -> Requêtes entrantes entrantes.

## 4. Limites connues et évolutions futures

**Absence de contrôle de référence forte (`exists()`) :**
Actuellement, bien que les types soient validés, Firestore ne va pas vérifier de manière asynchrone que `from_id` et `to_id` correspondent *réellement* à des documents existants dans `assets` ou `users`. Cela est volontaire dans un premier temps pour ne pas alourdir la consommation de lecture (chaque `exists()` compte comme une lecture) et simplifier le déploiement de cette brique.

**Améliorations futures :**
- **Prévention des doublons :** Utilisation de transactions natives pour éviter l'insertion double de la même relation exacte.
- **Validation stricte des `relation_type` :** Enumération définie dans Firestore limitant la sémantique aux mots clés connus (ex: "assigned_to", "located_at") pour éviter les erreurs typographiques.
- **Suppression en cascade :** Ajouter un comportement (ex: Cloud Function ou Batch API) pour nettoyer les orphelins de la table `relations` quand une entité source ou cible est détruite.
