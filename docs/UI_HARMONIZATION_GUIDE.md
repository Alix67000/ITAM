# Guide d'harmonisation UI (ITAM EMMAÜS)

## 1. Direction Visuelle Retenue
Le projet s'oriente vers un design **professionnel, moderne et sobre**. C'est un outil métier premium qui nécessite une grande lisibilité sans décoration superflue.
- **Densité** : Compacte mais aérée. Les paddings et espacements doivent être intentionnels.
- **Formes** : Rayons de bordure (border-radius) harmonisés principalement autour de `rounded-[2rem]` pour les conteneurs principaux et `rounded-xl` ou `rounded-2xl` pour les boutons/champs de saisie.
- **Couleurs** : Prédominance de `slate-50` à `slate-900` pour la structure, avec `indigo-600` comme couleur primaire d'action et accents limités aux statuts et badges.
- **Typographie** : Hiérarchie stricte. Utilisation de typos grasses (`font-bold`, `font-black`) pour les intitulés/en-têtes, et de texte `slate-500` pour les descriptions.

## 2. Bases Communes Définies (`src/lib/theme.ts`)
Nous avons centralisé un ensemble de classes Tailwind réutilisables dans `src/lib/theme.ts` pour éviter les incohérences lors du développement de nouvelles vues :
- **`pageHeader`** : En-tête de page standard (Titre, Icône, Sous-titre, Actions, Barre de recherche).
- **`card`** : Conteneurs de listes (`rounded-[2rem]`).
- **Boutons** : `btnPrimary`, `btnSecondary`, `btnIconGhost`, `btnIconDanger`.
- **Inputs** : `searchInput`, champs de recherche unifiés.
- **Badges** : `badgeSuccess`, `badgeNeutral`, `badgeWarning`, `badgeError`.
- **États** : `loadingPanel`, `emptyPanel` avec spinners et icônes grisées.

## 3. Stratégie de Déploiement Progressif
L'harmonisation ne doit en aucun cas casser la logique métier ou effectuer de modifications destructrices massives. La stratégie est la suivante :
1. **Pose de la base** : (Fait) Création de `theme.ts` et ajustement de `Layout.tsx`.
2. **Harmonisation Douce** : (Fait) Intégration sur `UserList.tsx`.
3. **Migration des Listes Métier** : (Fait) Application de la charte unifiée sur `AssetList`, `ContractList`, `LicenseList`, `SupplierList`, `LocationList`, `PhoneLineList`. Les en-têtes de page, barres de recherche, tableaux et modales de confirmation ont été standardisés.

## 4. Prochaines Étapes Logiques
- Reprendre les "wizards" et formulaires de création/édition en pleine page ou modale (ex: `AssetCreateView`, `UserModal`, `AssetModal`) pour standardiser leurs en-têtes, boutons d'action et champs de formulaire.
- Standardiser la vue "Résumé/Détail" d'un actif (`AssetDetailView`) avec les mêmes conventions visuelles de grid et sections.
- Épurer les barres d'outils avancées (filtres complémentaires) avec les inputs unifiés.
