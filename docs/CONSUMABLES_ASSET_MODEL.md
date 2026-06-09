# Module Consommables / Consumables

## 1. Choix d'Architecture : Extension du modèle Asset

Les consommables (toners, cartouches d'encre, rubans, etc.) sont gérés comme un sous-ensemble de la collection `assets`.
Cette approche a été retenue pour plusieurs raisons :
- Tirer parti du système existant de listes, d'affectations utilisateurs (`assigned_user_id`), d'entités (`location_id`) et de cycle de vie (statuts).
- Éviter la création d'une nouvelle collection Firestore ex-nihilo qui nécessiterait de de dupliquer toute l'interface de gestion (liste, filtres, pagination, création, édition).
- Garder une hiérarchie cohérente dans la CMDB (configuration management database) de l'entreprise où un consommable est aussi un bien physique nécessitant une trace d'achat / inventaire.

## 2. Nouveaux champs supportés

Le modèle `Asset` a été étendu avec des propriétés optionnelles propres aux consommables ou liés :
- `printer_asset_id` (string | null) : Permet de lier le consommable (ex: Cartouche) à une imprimante spécifique déjà inventoriée.
- `account_login` (string | null) : Associé à certaines licences ou comptes logiciels liés aux consommables si nécessaire.
- `account_password` (string | null) : Associé au `account_login` pour documenter un accès spécifique.

Ces champs ont été ajoutés à la fois dans l'interface TypeScript `Asset` (`src/services/api.ts`) et relaxés côté backend via les règles Firestore (`firestore.rules`) dans la fonction `isValidAsset()`.

## 3. Typologie et Filtres

L'identification métier d'un consommable se fait via :
- `type`: Typiquement `'Consommable'`, `'Toner'`, `'Cartouche'`, ou `'Encre'`.
- `subtype`: Libre (ex: `Couleur`, `Noir`).

Le système de filtre principal (`type=consumables`) intègre un mapping intelligent capable de détecter automatiquement ces termes clés, affinant ainsi l'affichage dans la table `AssetList` sans polluer l'inventaire principal par défaut.

## 4. Intégration Navigateur (Menu)

L'accès à l'inventaire des consommables a été déporté dans le sous-menu **"Gestion"** :
- Nom : `Consommables`
- Icone : `Droplet` (Lucide)
- Routage : Point d'entrée virtuel générant la route `/assets?type=consumables`.

## 5. Comportement des Règles de Modèle

- La fonction `isValidAsset` accepte désormais `printer_asset_id`, `account_login`, et `account_password` en tant que textes courts (`isShortText`) ou valeurs nulles.
- Le flux de validation général des assets s'applique toujours (contrôle de taille, nullité, restrictions admin/lecteur).

## 6. Prochaines Étapes : Interfaces Utilisateur (UI) Spécifiques

Dans un second temps, le traitement UI pourra être affiné :
- **Vue Création/Édition** : Intégrer la saisie conditionnelle de ces nouveaux champs dans `AssetForm` quand le type est sélectionné comme `Consommable`.
- **Vue Détail** : Adapter `AssetDetailView` pour exposer clairement le `printer_asset_id` sous forme de lien de relation métier cliquable, ou pour formater discrètement les credentials (`account_login`, `account_password`) si présents.
