# Document Technique : Extensions du Modèle Contrat

Ce document décrit le socle technique mis en place pour enrichir la gestion des contrats dans le projet ITAM EMMAÜS, en respectant la structure existante.

## 1. Nouveaux types de contrat
La liste des types supportés par un contrat (`Contract`) a été étendue pour inclure notamment :
- **Forfait mobile** : permet de lier facturation et lignes téléphoniques
- **Leasing imprimante** : permet de lier des contrats d'impression au parc matériel "Imprimante"

Liste complète autorisée dans les formulaires (`ContractModal`, `ContractDetailView`) :
- Abonnement
- Maintenance
- Leasing
- Location
- Garantie
- Assurance
- Support
- Logiciel
- Forfait mobile
- Leasing imprimante

## 2. Nouveaux champs ajoutés au contrat
Le modèle TypeScript `Contract` (`src/services/api.ts`) inclut désormais des identifiants d'accès liés au compte du contrat :
- `account_login?: string | null` (remplace théoriquement et fonctionnellement `account_email` pour plus de flexibilité : numéro de compte, pseudo, etc.)
- `account_email?: string | null` (conservé pour rétrocompatibilité avec les anciens contrats créés avant cette mise à jour)
- `account_password?: string | null`

Ces champs permettent de stocker les informations de connexion aux comptes (ex: espace client opérateur). La sécurisation par règles Firestore a également été mise à jour dans `isValidContract` (`firestore.rules`).

## 3. Stratégie d'associations & Helpers (`src/services/api.ts`)

Pour garder la base propre et rétro-compatible, la synchronisation des données s'appuie sur le mécanisme le plus adéquat déjà disponible dans l'application :

### A. Lignes téléphoniques (`PhoneLine`)
- **Modèle existant** : `PhoneLine` possède déjà un champ `contract_id`.
- **Helpers créés** :
  - `api.getContractPhoneLines(contractId)` : Récupère les `phone_lines` où `contract_id == contractId`.
  - `api.syncContractPhoneLines(contractId, phoneLineIds)` : Met à jour la champ `contract_id` des lignes sélectionnées (ajout / dissociation).

### B. Utilisateurs liés au contrat (`User`)
- **Modèle existant** : Pas de lien direct (`User` n'a pas de `contract_id`). Nous utilisons la table pivot générique `relations`.
- **Type de relation** : `contract_user` (from_type: 'contract' -> to_type: 'user').
- **Helpers créés** :
  - `api.getContractUsers(contractId)` : Récupère la liste via une requête `relations` puis la table `users`.
  - `api.syncContractUsers(contractId, userIds)` : Supprime les liaisons obsolètes et crée de nouveaux documents de liaison dans `relations`.

### C. Imprimantes liées au contrat (`Asset` de type Imprimante)
- **Modèle existant** : Les `Asset` (matériel) sont liés aux contrats via la table pivot dédiée `asset_contracts`.
- **Helpers créés** :
  - `api.getContractPrinters(contractId)` : Filtre en mémoire le retour de `api.getContractAssets(contractId)` sur `a.type === 'Imprimante'`.
  - `api.syncContractPrinters(contractId, printerIds)` : Assigne et désassigne les IDs d'imprimantes via les fonctions existantes `api.assignContractToAsset` et `api.removeContractFromAsset`, **sans toucher** aux autres assets (ex: Laptops) liés au même contrat.

## 4. Impact sur l'UI à venir
Les modales d'édition et création (`ContractModal`) n'ont été modifiées que sur l'ajout des nouveaux types (liste sélecteur). L'interface utilisateur finale tirera parti de ces nouveaux helpers pour construire des blocs avec gestion d'état locale (champs de saisie email/password avec toggle d'affichage, tabulations Users, Printers, Lignes) sans refactoring majeur à réaliser.

## 5. Compatibilité
- **`firestore.rules`** : Étendu de manière non-destructrice pour autoriser `account_email` et `account_password`, restant `isShortText`.
- **Rétrocompatibilité** : Aucune logique d'application (`relations`, `asset_contracts`, listes) n'a été altérée ou supprimée. Les vieux contrats fonctionneront sans régression.
