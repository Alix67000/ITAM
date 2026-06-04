# Guide d'harmonisation UI (ITAM EMMAÜS)

## 1. Direction Visuelle Retenue
Le projet s'oriente vers un design **professionnel, moderne et sobre**. C'est un outil métier premium qui nécessite une grande lisibilité sans décoration superflue.
- **Densité** : Compacte mais aérée. Les paddings et espacements doivent être intentionnels.
- **Formes** : Rayons de bordure (border-radius) harmonisés principalement autour de `rounded-2xl` pour les conteneurs principaux et `rounded-xl` pour les boutons/champs de saisie.
- **Couleurs** : Prédominance de `slate-50` à `slate-900` pour la structure, avec `indigo-600` comme couleur primaire d'action et accents (emerald, rose, blue, red) limités aux statuts et badges.
- **Typographie** : Hiérarchie stricte. Utilisation de typos grasses (`font-bold`, `font-black`) pour les intitulés et en-têtes, et de texte `slate-500` pour les descriptions.

## 2. Bases Communes Définies (`src/lib/theme.ts`)
Nous avons centralisé un ensemble de classes Tailwind réutilisables dans `src/lib/theme.ts` pour éviter les incohérences lors du développement de nouvelles vues :
- **`pageContainer`** : Conteneur principal (avec animation d'entrée).
- **`pageHeader`** : En-tête de page standard listant (Titre, Icône, Sous-titre, Actions).
- **`card`** et **`cardHeader`** : Panels contenant les listes ou formulaires.
- **Boutons** : `btnPrimary`, `btnSecondary`, `btnDanger`, `btnIconGhost`, `btnIconDanger`.
- **Inputs** : `inputBase`, `searchInput` avec icône intégrée.
- **Listes (Rows)** : Styles standardisés pour les entêtes `listHeaderRow` et lignes `listRow`.
- **États** : `loadingPanel` et `emptyPanel`.

## 3. Stratégie de Déploiement Progressif
L'harmonisation ne doit en aucun cas casser la logique métier ou effectuer de modifications destructrices massives. La stratégie est la suivante :
1. **Pose de la base** : (Fait) Création de `theme.ts` et ajustement de `Layout.tsx`.
2. **Harmonisation Douce** : (Fait) Intégration sur `UserList.tsx` et le header d'`AssetList.tsx` pour servir d'exemple.
3. **Migration itérative** : Lors d'améliorations futures (ou prochains prompts), utiliser cet objet `theme` pour migrer progressivement `ContractList.tsx`, `SupplierList.tsx`, `PhoneLineList.tsx`, etc., fichier par fichier.

## 4. Prochaines Étapes Logiques
- Mettre à jour les tableaux restants (`AssetList` corps du tableau, `ContractList`, `LicenseList`, `LocationList`) pour utiliser `theme.card` et `theme.listHeaderRow`/`theme.listRow`.
- Reprendre les modales de création (ex: `AssetCreateView`, `UserModal`) pour standardiser leurs en-têtes, boutons d'action et champs de formulaire avec `theme.inputBase`.
- Standardiser la vue "Détail" d'un actif (`AssetDetailView`) avec les mêmes conventions visuelles de cartes et sections.
- Épurer les barres d'outils (filtres avancés) avec les inputs unifiés.
