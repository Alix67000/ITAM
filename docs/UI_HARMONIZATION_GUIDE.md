# Guide d'harmonisation UI (ITAM EMMAÜS)

## 1. Direction Visuelle Retenue
Le projet s'oriente vers un design **professionnel, moderne et sobre**. C'est un outil métier premium qui nécessite une grande lisibilité sans décoration superflue.
- **Densité** : Compacte mais aérée. Les paddings et espacements doivent être intentionnels.
- **Formes** : Rayons de bordure (border-radius) harmonisés de façon cohérente, privilégiant `rounded-[2rem]` pour les cartes de listes et `rounded-2xl` pour les modales ou bordures.
- **Couleurs** : Prédominance de `slate-50` à `slate-900` pour la structure. L'action primaire est `indigo-600` (historiquement `blue-600` ponctuellement).
- **Typographie** : Hiérarchie stricte. Textes en `font-black` pour les données principales, `slate-500 font-bold uppercase tracking-widest` pour les labels ou labels de formulaire.

## 2. Bases Communes (`src/lib/theme.ts`)
Nous avons centralisé un ensemble de classes Tailwind réutilisables dans `src/lib/theme.ts` pour garantir une UI propre et sans divergence :
- **Layouts** : `pageContainer`, `pageHeader`, `pageTitleBox`, `pageSubtitle`.
- **Cartes** : `card` (`rounded-[2rem]`), `cardHeader`.
- **Boutons** : `btnPrimary`, `btnSecondary`, `btnIconGhost`, `btnIconDanger`.
- **Inputs** : `inputBase`, `searchInput`, `searchIcon`.
- **Badges** : Uniformisation sur les classes `badge` (font-black, rounded-lg, uppercase, border).
- **Listes & Tableaux** : `listWrapper`, `listRow`, `listHeaderRow`. Responsive: les listes sont en Flex sur mobile et en Grid/Table sur desktop.
- **Détails & Sidebar** : `detailHeader`, `detailMainGrid`, `detailContent`, `detailSidebar`, `detailSection`.
- **Modales & Formulaires** : `modalBackdrop`, `modalPanel`, `formSection`, `formLabel`, `formGrid`.
- **États** : `loadingPanel`, `emptyPanel`, classes uniformes pour les états de chargement ou listes vides.

## 3. État Global de l'Harmonisation
L'application a bénéficié d'une **refonte harmonisée UX/UI complète** et d'une **passe de compaction** pour une meilleure densité métier.

- ✅ **Création de la base UI** : Typographie, couleurs, radius centralisés.
- ✅ **Migration des Listes Métier** : Toutes les listes (`AssetList`, `UserList`, etc.) utilisent `theme.card` et `theme.pageHeader` ainsi que le format responsif (Grilles desktop, Cartes mobiles) avec un design compact (`UserList` comme référence).
- ✅ **Modales & Formulaires** : 100% des modales (ex: `PhoneLineModal`, `UserModal`, `SupplierModal`) utilisent les sous-composants centralisés (Header, labels "uppercase").
- ✅ **Vue Détail Compacte** : Layout scindé (Header Sticky, Sidebar latérale, Sections "Cards") pour `AssetDetailView`, `ContractDetailView`, `LicenseDetailView` et `RelationViewer`. Le design global a été compacté au maximum (espacements réduits, headers plus denses) pour se rapprocher d'un outil métier performant et limiter le scroll.
- ✅ **Polish Final Global** :
  - **Layout (Sidebar & Mobile Nav)** : Les marqueurs actifs (`bg-indigo-50 text-indigo-700 font-bold`), l'UI utilisateur (initiales logo, ombres) et la safe-area sur mobile ont été harmonisées.
  - **Dashboard** : Simplification des widgets `bg-white p-6 rounded-[2rem]` pour s'aligner exactement sur `theme.card` là où c'était possible, ou uniformiser les radius.
  - **États Vides / Loading** : Ajustements des bordures et placeholders pour minimiser la fracture visuelle.

## 4. Prochaines étapes de polish
- **Formulaires** : Compacter et densifier les formulaires d'édition (`AssetForm`, `ContractForm`, `LicenseForm`) pour qu'ils soient moins massifs.
- **Modales de création** : Continuer la densification sur les modales plus complexes.
- **Dashboard** : Rendre les cartes de métriques et listes d'alerte plus compactes.

## 5. Garde-fous préservés
- Le routage et la logique Firestore ont été préservés as-is.
- Aucun composant customisé inutile n'a été ajouté (tout se fait en Tailwind atomique).
- Aucune fonctionnalité métier (Export PDF, Filtres Avancés, Graphiques) n'a été supprimée.