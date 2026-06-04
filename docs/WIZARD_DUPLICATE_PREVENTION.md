# Prévention des doublons dans le Workstation Wizard

Ce document explique la stratégie adoptée pour éviter la création de ressources orphelines ou de doublons lors de l'utilisation de l'Assistant global de provisioning (Workstation Wizard).

## 1. Le problème initial
Le Wizard effectue une série d'opérations de création de manière séquentielle (Utilisateur -> Ordinateur -> Équipements -> Téléphonie -> Liaisons).
Puisque ces créations ne sont pas exécutées dans une transaction "vrai" (atomique) au niveau de Firestore (les ID ne sont pas toujours connus à l'avance et la logique legacy rend complexe un `writeBatch` monobloc temporaire), une erreur réseau ou fonctionnelle survenant au milieu du processus entraînait la persistance des premiers éléments créés.

Lors d'une nouvelle tentative par l'utilisateur, ces mêmes éléments étaient alors recréés, générant des doublons dans l'inventaire.

## 2. La stratégie de Rollback Compensatoire
Pour pallier ce problème, le Wizard intègre un mécanisme de **rollback compensatoire**. 
Un contexte de provisionnement (`ProvisioningContext`) est mis en place au début du `handleSubmit`, gardant une trace exacte de toutes les ressources et relations générées avec succès.

En cas d'échec :
1. L'erreur est interceptée par un `catch`.
2. Le processus itère sur le contexte en ordre inversé (du plus récent au plus ancien).
3. Les liens (logiciels, licences, relations génériques, asset legacy) sont supprimés.
4. Les entités créées par le flux sont supprimées (Équipements, Ligne, PC, puis Utilisateur **s'il vient d'être créé**).
5. Un message approprié est affiché à l'utilisateur (nettoyage complet vs partiel).

## 3. Ce qui est concerné par le rollback
* Les assignations "asset ↔ software" effectuées par le wizard.
* Les assignations "user ↔ license" effectuées par le wizard.
* Les relations pivot créées entre le PC et ses équipements.
* Les équipements eux-mêmes (écrans, claviers, etc.).
* La ligne téléphonique créée dans cette foulée.
* L'ordinateur principal.
* L'utilisateur, UNIQUEMENT s'il a été instancié via l'option "Nouvel Utilisateur" du wizard.

## 4. Ce qui n'est **jamais** supprimé
* Un utilisateur sélectionné via l'option "Utilisateur existant" (même si la création du poste échoue pour lui).
* Les licences existantes.
* Les logiciels existants.
* Tout élément préexistant dans la base de données.

## 5. Limites
* Si l'utilisateur quitte violemment l'application (Fermeture du navigateur, crash) pendant le flux réseau de création, le rollback côté client ne pourra pas s'exécuter.
* Dans une version future, il sera souhaitable de migrer cette logique sur des Cloud Functions ou vers une transaction Firestore `writeBatch` si l'API le permet de bout en bout structurellement, éliminant totalement le risque résiduel.
