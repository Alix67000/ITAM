# Document Fonctionnel : Évolution du Formulaire Contrat

Ce document décrit les améliorations visuelles et fonctionnelles apportées à la modale de contrat (`ContractModal`) pour intégrer les évolutions récentes.

## 1. Nouveaux types pris en charge
Le champ "Type" intègre désormais les nouvelles options suivantes, sans altérer les anciens choix :
- `Forfait mobile`
- `Leasing imprimante`

## 2. Logique d'affichage conditionnel
L'interface de la modale évolue dynamiquement selon le type de contrat sélectionné :
- **Si `Forfait mobile`** : La section d'identification du compte opérateur (Identifiant & Mot de passe) s'affiche de manière proactive, ainsi que les panneaux d'association des « Lignes téléphoniques » et « Utilisateurs ».
- **Si `Leasing imprimante`** : Les panneaux d'association des « Imprimantes » et « Utilisateurs » s'affichent automatiquement.
- **Autrement** : Ces sections restent masquées par défaut pour préserver la compacité visuelle de la fenêtre (pour des contrats classiques de Maintenance ou Assurance).

Un bouton **"Afficher les associations"** (avec une icône de réglages) permet à tout moment de forcer l'affichage horizontal de toutes les zones de multisélection ou de compte, quel que soit le type initial. 

## 3. Gestion experte des associations multiples
Nous avons implémenté des listes sélectionnables natives avec des cases à cocher `checkbox` stylisées en `indigo-600`. Les blocs sont scrollables s'ils contiennent plusieurs éléments et se divisent organiquement selon la largeur d'écran :
- **Lignes** : Permet de choisir plusieurs lignes téléphoniques existantes pour les associer via `contract_id`.
- **Utilisateurs** : Permet de choisir plusieurs utilisateurs de l'organisation via une table pivot `relations`.
- **Imprimantes** : Permet de lister les actifs matériels (filtrés par le type `Imprimante`) et de les relier au contrat de la même manière que des portables.

Ces choix sont récupérés à l'ouverture (en mode Édition) et sauvegardés nativement lors de l'enregistrement.

## 4. Champs de compte opérateur
Afin de centraliser l'accès, le formulaire permet de saisir un identifiant de connexion (email, numéro d'abonné...) et un mot de passe optionnels.
Le mot de passe de l'opérateur bénéficie d'une ergonomie sécurisée :
- Il est masqué par défaut (`type="password"`).
- Une icône "Oeil/Oeil barré" permet d'estamper ou masquer la valeur affichée en mode texte plein.

## 5. Mode Édition et Sauvegarde
Le composant charge initialement les référentiels métiers complets (lignes, utilisateurs, imprimantes).
S'il s'agit d'une **modification**, on résout en amont les identifiants qui correspondent au contrat depuis l'API Firestore pour pré-cocheter les boîtes adéquates.
À la sauvegarde, l'ordre d'exécution est le suivant :
1. UPDATE ou CREATE du document central de contrat
2. Si succès généré, déclenchement simultané (`Promise.all`) des trois helpers de synchronisation (`syncContractPhoneLines`, `syncContractUsers`, `syncContractPrinters`).
3. Rafraîchissement automatique de la vue arrière.

## 6. Limites connues
- Ces associations n'ont actuellement pas d'aperçu d'impact détaillé dans l'interface liste des contrats (il faudrait ajouter les colonnes au tableau plus tard s'ils le demandent).
- Les données de l'API sont chargées de manière non paginée. Les entreprises de très grande envergure avec plus de 5000 lignes ou 5000 imprimantes verront un ralentissement de l'UI des boîtes de liste ; actuellement adapté pour l'écosystème ITAM EMMAÜS envisagé.
