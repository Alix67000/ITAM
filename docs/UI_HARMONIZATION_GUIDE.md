# Guide d'harmonisation UI (ITAM EMMAÜS)

## 1. Direction Visuelle Retenue
Le projet s'oriente vers un design **professionnel, moderne et sobre**. C'est un outil métier premium qui nécessite une grande lisibilité sans décoration superflue.
- **Densité** : Compacte mais aérée. Les paddings et espacements doivent être intentionnels.
- **Formes** : Rayons de bordure (border-radius) harmonisés principalement autour de `rounded-[2rem]` pour les conteneurs principaux et `rounded-xl` ou `rounded-2xl` pour les boutons/champs de saisie/modales.
- **Couleurs** : Prédominance de `slate-50` à `slate-900` pour la structure, avec `indigo-600` ou `blue-600` comme couleur primaire d'action et accents limités aux statuts et badges.
- **Typographie** : Hiérarchie stricte. Utilisation de typos grasses (`font-bold`, `font-black`) pour les intitulés/en-têtes, textes de section en UPPERCASE (`text-[10px] tracking-widest`), et texte `slate-500` pour les descriptions.

## 2. Bases Communes Définies (`src/lib/theme.ts`)
Nous avons centralisé un ensemble de classes Tailwind réutilisables dans `src/lib/theme.ts` pour éviter les incohérences lors du développement de nouvelles vues :
- **Pages** : `pageHeader`
- **Cartes** : Conteneurs globaux (`rounded-[2rem]`).
- **Boutons** : `btnPrimary`, `btnSecondary`, `btnIconGhost`, `btnIconDanger`.
- **Inputs** : `searchInput`, `inputBase`.
- **Modales** : `modalBackdrop`, `modalOverlay`, `modalPanel`, `modalHeader`, `modalTitleBox`, `modalBody`, `modalFooter`.
- **Formulaires** : `formSection`, `formSectionTitle`, `formLabel`, `formGrid`.
- **Badges** : `badgeSuccess`, `badgeNeutral`, `badgeWarning`, `badgeError`.
- **Vues Détails** : `detailHeader`, `detailSection`, `detailCardBox`.

## 3. Stratégie & État de l'Harmonisation
L'harmonisation est réalisée de manière itérative, sans jamais casser la logique de routage ni le scope métier.

- ✅ **Création de la base UI** : Centralisation dans `theme.ts` et `Layout.tsx`.
- ✅ **Migration des Listes Métier** : Application de la charte unifiée sur tous les tableaux, barres de recherche et listes (`AssetList`, `ContractList`, `LicenseList`, `SoftwareList`, `SupplierList`, `LocationList`, `PhoneLineList`, `UserList`).
- ✅ **Migration des Vues Détail** : Harmonisation des vues de fiches (`AssetDetailView`, `ContractDetailView`, `LicenseDetailView`) et outils complexes (`RelationViewer`).
- ✅ **Modales et Formulaires harmonisés** : Uniformisation de `Modal.tsx`, des fenêtres pop-up (Users, Fournisseurs, Lieux, Lignes pro) et des formulaires principaux d'édition/création (Assets, Logiciels, Licences).

## 4. Prochaines Étapes Logiques
- **Polish Final Global** : Parcourir l'ensemble de l'application (Sidebar latérale, Dashboard, interactions, états de survol persistants).
- **Assurance Qualité UX** : Vérifier que tous les espacements, paddings de formulaires et retours visuels (Toasts) soient impeccablement calibrés.
- Optimiser et stabiliser le design purement responsif pour des écrans de tailles variées.
