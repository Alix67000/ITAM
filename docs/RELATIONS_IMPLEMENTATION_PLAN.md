# Plan d'Implémentation des Relations & Workflows Métier

## 1. État actuel du projet
L'application ITAM EMMAÜS est fonctionnelle avec une architecture React + TypeScript + Firebase (Firestore & Auth).
- **Backend** : Uniquement Firestore (sécurisé via `firestore.rules`).
- **Data Access** : Regroupé dans `src/services/api.ts`, qui exécute les appels directs vers Firebase.
- **Vues UI** : Des pages listant les entités (`AssetList`, `UserList`, etc.), des modales de création/édition (`AssetForm`, `UserModal`), et des vues détaillées (`AssetDetailView`).
- **Modèle relationnel actuel** : Un mix hybride entre :
  - **Clés étrangères directes** (1-N) (ex: `location_id` dans un asset).
  - **Tables de jointure explicites** (N-N) via collections dédiées à la racine (ex: `asset_contracts`, `user_licenses`).

## 2. Cartographie des relations existantes (selon `api.ts` et `firestore.rules`)

### Relations Directes (Foreign Keys)
- `Asset` ➡️ `Location` (`location_id`)
- `Asset` ➡️ `Supplier` (`supplier_id`)
- `Asset` ➡️ `User` (`assigned_user_id`)
- `Asset` ➡️ `Asset` (`parent_asset_id` & `linkedAssets` pour la hiérarchie)
- `User` ➡️ `Location` (`location_id`)
- `Location` ➡️ `Location` (`parent_id`)
- `Contract` ➡️ `Supplier` (`supplier_id`)
- `License` ➡️ `Supplier` (`supplier_id`)
- `License` ➡️ `Software` (`software` string, possiblement nom ou ID)
- `PhoneLine` ➡️ `Location`, `User`, `Supplier`, `Contract`

### Relations Transverses / Jointures (N-N par collections distinctes)
- `asset_contracts` : lie un Asset à des Contrats
- `asset_softwares` : lie un Asset à des Logiciels
- `asset_licenses` : lie un Asset à des Licences
- `user_licenses` : lie un Utilisateur à des Licences
- `user_softwares` : lie un Utilisateur à des Logiciels

## 3. Limites du modèle actuel
- **Multiplication des collections de jointure** : Ajouter un nouveau lien métier nécessite la création d'une nouvelle collection de jointure, des règles dans Firestore, et de nouvelles fonctions dans `api.ts`.
- **Manque de réciprocité garantie** : Difficile ou lent de requêter depuis une Location pour trouver tous les Assets et PhoneLines qui y sont associés (nécessite de multiples requêtes `where`).
- **Gestion du cycle de vie (Orphelins)** : Lors de la suppression d'un Asset, `api.ts` (`deleteAsset`) ne nettoie actuellement pas automatiquement les tables de jointure (`asset_contracts`, etc.), créant des relations orphelines.
- **UI éclatée** : Les éléments liés s'affichent uniquement dans des onglets ou listes en dur dans les composants de détail (ex: `AssetDetailView`), rendant difficile l'unification visuelle.
- **Saisie morcelée** : Créer un "poste de travail" pour un nouvel employé nécessite de naviguer sur 5 écrans différents (Utilisateur, PC, Écran, Ligne Mobile, Logiciels).

## 4. Architecture cible proposée
Plutôt qu'un refactor destructeur ("big bang"), l'objectif est une migration douce :

- **Étape A : Consolidation via une collection `relations` (Générique)**
  Introduire une structure unifiée `{ id, source_id, source_type, target_id, target_type, relation_type }`.
  Exemple: `source: {id: 123, type: 'asset'}`, `target: {id: 456, type: 'user'}`, `relation: 'assigned_to'`.
  *Note: Les Foreign keys simples (`location_id`) peuvent rester pour la performance du filtrage de base, mais les N-N complexes migrent vers cette collection unifiée.*

- **Étape B : Composant `RelationViewer` transversal**
  Un composant unique qui prend l'ID/Type d'une entité et liste toutes ses dépendances directes, avec navigation rapide entre elles.

- **Étape C : Point d'entrée "Wizard 360°" (Nouveau Poste Complet)**
  Un assistant à plusieurs étapes permettant de provisionner simultanément :
  1. Utilisateur
  2. Matériel complet (PC + Accessoires)
  3. Téléphonie (Ligne + Mobile)
  4. Logiciels standard
  => Le tout enregistré et lié formellement via la nouvelle logique de relations.

- **Étape D : Centralisation des actions (Bouton "+ Nouveau" global)**
  Au lieu d'aller dans chaque section pour créer, un bouton flottant ou fixe dans le Layout ouvre un menu rapide : "Créer un Asset", "Créer un Utilisateur", "Créer un Poste Complet".

## 5. Plan d'implémentation par phases

- **Phase 1 : Socle technique (Non destructeur)**
  - Modifier `firestore.rules` pour autoriser la collection `relations`.
  - Créer un `src/services/relationService.ts` gérant la création, suppression, et la récupération bidirectionnelle.

- **Phase 2 : Composants visuels de la vue relationnelle**
  - Construire `<RelationBlock />` et l'intégrer progressivement dans `AssetDetailView`, `UserModal`, etc., en parallèle de l'existant.

- **Phase 3 : Bouton d'action global et Wizard**
  - Intégrer un bouton floating action ("+ Nouveau") dans `Layout.tsx`.
  - Développer le modal Wizard (`CompleteWorkstationWizard.tsx`) utilisant `relationService.ts`.

- **Phase 4 : Migration des anciennes jointures (Nettoyage - Optionnel)**
  - Déprécier les collections de jointure dans `api.ts` au profit du service générique.

## 6. Fichiers pressentis à modifier
*Modifications futures, après validation du plan :*
- **Ajouts** : 
  - `src/services/relationService.ts`
  - `src/components/shared/RelationViewer.tsx`
  - `src/components/wizards/WorkstationWizard.tsx`
- **Modifications** :
  - `firestore.rules` (ajouter la collection globale `relations`)
  - `src/services/api.ts` (ajouter des suppressions en cascade pour éviter les orphelins)
  - `src/components/Layout.tsx` (ajouter le Floating Action Button global)
  - `src/components/AssetDetailView.tsx` (remplacer les onglets par `<RelationViewer>`)

## 7. Risques de régression à surveiller
- **Perte de relations existantes** : En migrant d'une méthode de jointure à l'autre sans script de reprise des données.
- **Faille de sécurité (Firestore)** : La nouvelle collection `relations` permet potentiellement de lier n'importe quoi si elle n'a pas des limites strictes dans les `.rules`.
- **Performance Firestore** : Un wizard insère massivement (User + 2 Assets + Ligne + Licences = ~10 écritures). Nécessité d'utiliser les `writeBatch` (batch de requêtes) pour assurer l'atomicité.

## 8. Stratégie progressive de déploiement
- Déployer d'abord la structure DB et les services.
- Activer l'affichage en lecture seule.
- Intégrer le Wizard 360° pour les *nouvelles* saisies.
- Basculer progressivement les vues d'édition classiques vers la nouvelle logique de relations génériques, tout en maintenant les `_id` locaux pour la rétrocompatibilité.
