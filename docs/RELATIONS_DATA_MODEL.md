# Modèle de Données et Services : Relations Métier 

Ce document décrit le socle technique mis en place pour gérer les relations entre entités (Assets, Users, Contrats, etc.) dans l'application ITAM.

## 1. Modèles TypeScript

Le fichier `src/services/relationTypes.ts` définit les interfaces utilisées.

### EntityType
Un typage strict des tables de la base :
```typescript
type EntityType = 'asset' | 'user' | 'location' | 'supplier' | 'contract' | 'license' | 'software' | 'phone_line';
```

### GenericRelation
C'est la structure cible (telle qu'elle sera enregistrée plus tard dans la collection racine Firestore `relations`).
- `from_type` / `from_id` : La source de la relation (ex: asset)
- `to_type` / `to_id` : La cible (ex: user)
- `relation_type` : Sémantique de la relation (ex: `assigned_to`, `installed_software`)

### NormalizedRelation
Format orienté "Vue/UI". C'est un format calculé, utilisé pour afficher uniformément les relations qu'elles soient stockées à l'ancienne (legacy) ou via la nouvelle table.
- `direction` : `incoming` (l'entité est la cible) ou `outgoing` (l'entité est la source)
- `origin` : `legacy` ou `generic`.

## 2. Le Service relationService

Implémenté dans `src/services/relationService.ts`, il sert de façade.

### A. Méthodes liées à Firestore (Générique)
- `createRelation(...)` : Crée un document dans la collection `relations`.
- `deleteRelation(...)` : Supprime une relation.
- `getIncomingRelations(...)` / `getOutgoingRelations(...)` : Requête la table.

*(Attention : L'UI n'appelle pas encore `createRelation`, et les règles de sécurité Firestore n'autorisent pas encore cette collection).*

### B. Méthodes Legacy
Des méthodes `getLegacy[Entité]Relations(id)` récupèrent les données historiques (via `api.ts` ou requêtes directes) et les transforment en objets `NormalizedRelation`.
- Cela traduit une clé étrangère (ex: `assigned_user_id` dans un asset) en une relation `outgoing` (asset -> user) de type `assigned_to`.
- Cela traduit les tables de jointure (ex: `user_licenses`) en deux "vues" relationnelles (une entrante pour user, une sortante pour licence).

### C. Méthode Unifiée
- `getEntityRelationsOverview(entityType, entityId)` : Appelle et agglomère les relations 'legacy' et 'génériques', construisant un tableau complet de toutes les dépendances métier de l'entité.

## 3. Typologie de relations (relation_type)

Pour assurer une certaine cohérence visuelle, le typage des "relation_type" est suggéré selon cette nomenclature :

- `assigned_to` : Un matériel/abonnement est assigné à une personne.
- `located_at` : Un matériel/personne est placé sur un lieu physique.
- `supplied_by` : Matériel fournit par (ou contrat/licence fourni par).
- `covered_by` : Un matériel sous contrat d'entretien/garantie temporaire.
- `consumes_license` : Un matériel (PC) ou une personne utilise un "seat" de licence.
- `installed_software` : Un logiciel physique/stand-alone (sans license traçable).
- `uses_software` : Un utilisateur utilise un logiciel.
- `attached_to` : Une hiérarchie (ex: un PC et son écran, ou un accessoire lié à un autre).

## 4. Stratégie de Cohabitation

**Phase actuelle** : 
L'Application UI (modales, listes) fonctionne toujours sur le pattern legacy et utilise `api.ts` classique. Le `relationService` est actuellement déployé en mode "Read-Only Observateur". 

**Pourquoi cette étape transparente ?**
Cela permet dans un prochain développement UI de remplacer les panneaux hardcodés ("Contrats de l'ordinateur", "Logiciels de l'ordinateur") par un unique et simple composant `<RelationViewer relations={allRelations} />` sans altérer la modification (ajout/suppression legacy) qui perdure avec l'API existante.

Une fois l'UI harmonisée grace aux lectures normalisées, la logique d'écriture pourra être basculée sur la nouvelle table générique sans douleur visuelle.
