# Document Fonctionnel : Vue Détail Contrat (Extensions)

Ce document complète l'intégration des fonctionnalités avancées (multiples associations et compte) dans la vue **Détail Contrat** (`ContractDetailView.tsx`), respectant l'UI/UX du projet ITAM EMMAÜS.

## 1. Ce qui s'affiche dans la fiche contrat
L'interface de la fiche détaillée s'adapte dynamiquement pour exposer de manière propre et lisible :
- **Compte de gestion** : Si le contrat possède un email ou un mot de passe (ou qu'il est du type `Forfait mobile`), une section "Compte de gestion" apparaît. Elle affiche l'email et le mot de passe masqué.
- **Associations multiples** : 
  - **Lignes associées** : Une liste des numéros et étiquettes des lignes assignées au contrat est générée si des lignes sont détectées.
  - **Imprimantes** : Si des imprimantes ont été explicitement associées, elles s'affichent sous ce bloc dédié. Les imprimantes associées sont explicitement exclues du bloc global générique "Matériel Couvert" pour éviter un doublon visuel (par exemple sur un contrat `Leasing imprimante`).
  - **Utilisateurs gérés** : Affiche les prénoms, noms, adresses email et initiales générées pour le contrat.

## 2. Comportement du mot de passe
Afin de préserver la sécurité de premier niveau dans l'interface, la gestion du compte intègre un fonctionnement spécifique pour le mot de passe :
- Masqué par défaut sous le format statique `••••••••••••`.
- Bouton clair symbolisé par l'icône Œil / Œil barré (`EyeOff` / `Eye`) afin de le révéler temporairement.
- Design sobre en police `font-mono tracking-wider` pour une lecture aisée de caractères spéciaux une fois décodés.
- Cette section disparait ou est minimaliste s'il n'y a pas d'infos de compte, sauf si le type est `Forfait mobile`, pour inciter à sa configuration.

## 3. Types spécifiques
Les nouveaux types intégrés lors des sprints précédents profitent directement à cette fiche :
- **Pour un `Forfait mobile`** : La section compte, la section lignes, et la section utilisateurs trouvent tout leur sens.
- **Pour un `Leasing imprimante`** : La section utilisateurs et imprimantes forment la base de l'exploitation. Le bloc original "Matériel Couvert" peut complètement disparaître visuellement si aucune autre typologie de bien (ordinateur, écran) n'est associée.
- **Autres (Abonnement, Maintenance, etc.)** : Les espaces restent purs et inchangés grâce aux affichages conditionnels stricts (`linkedPhones.length > 0`, `linkedUsers.length > 0`).

## 4. Cohérence Visuelle
Les ajouts exploitent `theme.detailSection`, `theme.detailSectionHeader` et `theme.detailSectionTitle`, ancrant ces informations au flux `detailMainGrid`. On réutilise la charte `slate-50` sur les arrières-plans intermédiaires ainsi que les icônes de la librairie standard (Lucide React) colorées de manière sémantique (`Lock` violet, `Phone` vert émeraude, `Printer` orange, `UsersIcon` bleu).
L'ensemble est visuellement et techniquement sans surcharge (ni library externe ni composant lourd) vis-à-vis des anciennes versions de la fiche.
