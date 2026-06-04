# Interface de Lecture des Relations (UI)

Ce composant (implémenté dans `src/components/RelationViewer.tsx`) permet d'afficher pour chaque entité du parc informatique une vue unifiée orientée métier exposant toutes les relations liées. 

## 1. Composants ajoutés
- `<RelationViewer />` : Récupère et structure l'affichage complet des données calculées sans impacter le comportement des autres sections de la fiche détaillée. Permet de classer dynamiquement les dépendances de chaque type.

## 2. Fiches où la vue Relations est affichée
Les vues de détail ont été complétées d'une carte "Relations métier" au sein de leur section secondaire (Sidebar).
- `AssetDetailView.tsx` (Matériels)
- `ContractDetailView.tsx` (Contrats)
- `LicenseDetailView.tsx` (Licences)

## 3. Ce qui est supporté aujourd'hui
- La lecture simple et regroupée d'éléments dépendants.
- Des labels avec de petits indicateurs visuels (icones Lucide).
- Cliquer et de naviguer vers la fiche en ouvrant la route existante pour un sous-moteur d'entité : par exemple un clic sur un sous-Asset `/assets/:id`, sur Contrat `/contracts/:id`, Licence `/licenses/:id`. 
- Différenciation des sources (`legacy` versus future gestion `generic`). L'application continue son cours actuel.

## 4. Ce qui n'est pas encore supporté
- On ne navigue pas encore vers ce qui n'a pas de modale plein écran / page de détail attitrée (Utilisateurs `User`, Localisations `Location`, Logiciels `Software`, Fournisseurs `Supplier`, etc.). 
- On ne crée pas de relation via cette composante actuellement.
- On ne remplace pas encore les autres modules spécifiques d'affichages d'onglet déjà hardcodés dans les fiches mères, bien que la finalité soit de les fusionner petit à petit.

## 5. Prochaines étapes logiques (et Statut)
1. Ajout d'une gestion en écriture (Bouton `+ Nouveau` global) : **FAIT** (`GlobalCreateHub`)
2. Formulaire pour ajouter une relation générique.
3. Assistant global de provisioning ("Wizard poste complet") capable de faire les N écritures du `RelationService` : **FAIT** (`WorkstationWizard`)
4. Remplacement total et final des anciens onglets métier hardcodés Legacy.
