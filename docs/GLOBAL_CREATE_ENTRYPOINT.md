# Point d'Entrée Global de Création

Ce document décrit l'implémentation du centre de création unifié ajouté à l'application.

## 1. Emplacement du bouton
Un bouton global `+ Nouveau` a été intégré dans l'en-tête (Header) de la barre de navigation principale de `Layout.tsx`.
Il est visible depuis n'importe quelle vue de l'application (compact sur mobile, avec badge sur desktop).

## 2. Types de création supportés
Le hub lance les fenêtres modales dédiées ou les composants préexistants pour les entités :
- Matériel (`Asset`)
- Utilisateur (`User`)
- Ligne téléphonique (`PhoneLine`)
- Contrat (`Contract`)
- Licence (`License`)
- Logiciel (`Software`)
- Fournisseur (`Supplier`)
- Lieu/Entité (`Location`)

## 3. Mécanique de réutilisation
Plutôt que de dupliquer les logiques formelles, le `GlobalCreateHub` stocke un état local contenant le nom du module actif (ex: `activeType = 'user'`), ce qui déclenche simplement l'affichage du composant préexistant correspondant (par ex `UserModal` ou `AssetCreateView`), instancié à un niveau global.
Cela permet de créer depuis n'importe quelle page sans interrompre sa navigation, tout en garantissant un coût d'implémentation minime en exploitant l'UI native du projet.

## 4. Ce qui n'est pas encore implémenté
- L'actualisation conditionnelle ciblée : après création, c'est l'unmount naturel du composant de liste (lorsque l'utilisateur va sur la page correspondante) qui assurera l'affichage des nouveaux éléments, ou une actualisation automatique si la ressource gère des événements.
- La création de dépendances croisées en un clic n'est pas encore supportée (le composant `AssetCreateView` garde néanmoins sa logique isolée s'il relie ses objets liés).

## 5. Prochaine étape logique (Complétée)
L'intégration du **Poste complet (Wizard)** est désormais finalisée. La tuile libère le flux permettant à l'utilisateur de procéder à une affectation groupée (Asset + User + Ligne + Logiciels/Licences).
