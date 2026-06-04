import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from './api';
import { 
  EntityType, 
  GenericRelation, 
  NormalizedRelation 
} from './relationTypes';

// ---------------------------------------------------------------------------
// 1. Avenir : Operations on the generic `relations` collection
// ---------------------------------------------------------------------------

export const relationService = {
  /**
   * Créer une nouvelle relation (utilise la collection globale 'relations')
   */
  createRelation: async (relation: Omit<GenericRelation, 'id'>): Promise<{ id: string }> => {
    try {
      const docRef = await addDoc(collection(db, 'relations'), {
        ...relation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { id: docRef.id };
    } catch (e) {
      console.error('Erreur createRelation:', e);
      throw e;
    }
  },

  /**
   * Supprime une relation existante
   */
  deleteRelation: async (relationId: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(db, 'relations', relationId));
      return { success: true };
    } catch (e) {
      console.error('Erreur deleteRelation:', e);
      throw e;
    }
  },

  /**
   * Récupérer les relations sortantes
   */
  getOutgoingRelations: async (entityType: EntityType, entityId: string): Promise<GenericRelation[]> => {
    try {
      const q = query(
        collection(db, 'relations'), 
        where('from_type', '==', entityType), 
        where('from_id', '==', entityId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GenericRelation));
    } catch (e) {
      console.error('Erreur getOutgoingRelations:', e);
      return [];
    }
  },

  /**
   * Récupérer les relations entrantes
   */
  getIncomingRelations: async (entityType: EntityType, entityId: string): Promise<GenericRelation[]> => {
    try {
      const q = query(
        collection(db, 'relations'), 
        where('to_type', '==', entityType), 
        where('to_id', '==', entityId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GenericRelation));
    } catch (e) {
      console.error('Erreur getIncomingRelations:', e);
      return [];
    }
  },

  /**
   * Récupérer toutes les relations (entrantes et sortantes) pour une entité
   */
  getAllRelationsForEntity: async (entityType: EntityType, entityId: string): Promise<GenericRelation[]> => {
    // Parallélisation pour optimiser
    const [incoming, outgoing] = await Promise.all([
      relationService.getIncomingRelations(entityType, entityId),
      relationService.getOutgoingRelations(entityType, entityId),
    ]);
    return [...incoming, ...outgoing];
  },

  // ---------------------------------------------------------------------------
  // 2. Legacy : Normalization of existing specific relations
  // ---------------------------------------------------------------------------

  /**
   * Normaliser les relations historiques liées à un Asset
   */
  getLegacyAssetRelations: async (assetId: string): Promise<NormalizedRelation[]> => {
    const relations: NormalizedRelation[] = [];
    const entity = await api.getAsset(assetId);
    
    if (!entity) return relations;

    // Relations directes (clés étrangères)
    if (entity.assigned_user_id) {
      // Pour une UI plus riche, on pourrait récupérer le nom via un cache, 
      // ici on se limite au mapping basique.
      relations.push({
        id: `legacy_user_${assetId}_${entity.assigned_user_id}`,
        direction: 'outgoing',
        relation_type: 'assigned_to',
        source: { type: 'asset', id: assetId, label: entity.label },
        target: { type: 'user', id: entity.assigned_user_id },
        status: 'active',
        origin: 'legacy'
      });
    }

    if (entity.location_id) {
      relations.push({
        id: `legacy_loc_${assetId}_${entity.location_id}`,
        direction: 'outgoing',
        relation_type: 'located_at',
        source: { type: 'asset', id: assetId, label: entity.label },
        target: { type: 'location', id: entity.location_id },
        status: 'active',
        origin: 'legacy'
      });
    }

    if (entity.supplier_id) {
      relations.push({
        id: `legacy_sup_${assetId}_${entity.supplier_id}`,
        direction: 'outgoing',
        relation_type: 'supplied_by',
        source: { type: 'asset', id: assetId, label: entity.label },
        target: { type: 'supplier', id: entity.supplier_id },
        status: 'active',
        origin: 'legacy'
      });
    }

    if (entity.parent_asset_id) {
      relations.push({
        id: `legacy_parent_${assetId}_${entity.parent_asset_id}`,
        direction: 'outgoing',
        relation_type: 'attached_to',
        source: { type: 'asset', id: assetId, label: entity.label },
        target: { type: 'asset', id: entity.parent_asset_id },
        status: 'active',
        origin: 'legacy'
      });
    }

    if (entity.linkedAssets && entity.linkedAssets.length > 0) {
      entity.linkedAssets.forEach(linkedId => {
        relations.push({
          id: `legacy_linked_${assetId}_${linkedId}`,
          direction: 'outgoing',
          relation_type: 'attached_to',
          source: { type: 'asset', id: assetId, label: entity.label },
          target: { type: 'asset', id: linkedId },
          status: 'active',
          origin: 'legacy'
        });
      });
    }

    // Relations N-N 
    const contracts = await api.getAssetContracts(assetId);
    contracts.forEach(contract => {
      relations.push({
        id: `legacy_contract_${assetId}_${contract.id}`,
        direction: 'outgoing',
        relation_type: 'covered_by',
        source: { type: 'asset', id: assetId, label: entity.label },
        target: { type: 'contract', id: contract.id, label: contract.label },
        status: 'active',
        origin: 'legacy'
      });
    });

    const softwares = await api.getAssetSoftwares(assetId);
    softwares.forEach(software => {
      relations.push({
        id: `legacy_software_${assetId}_${software.id}`,
        direction: 'outgoing',
        relation_type: 'installed_software',
        source: { type: 'asset', id: assetId, label: entity.label },
        target: { type: 'software', id: software.id, label: software.name },
        status: 'active',
        origin: 'legacy'
      });
    });

    const licenses = await api.getAssetLicenses(assetId);
    licenses.forEach(license => {
      relations.push({
        id: `legacy_license_${assetId}_${license.id}`,
        direction: 'outgoing', // l'asset consomme une licence
        relation_type: 'consumes_license',
        source: { type: 'asset', id: assetId, label: entity.label },
        target: { type: 'license', id: license.id, label: license.label },
        status: 'active',
        origin: 'legacy'
      });
    });

    return relations;
  },

  /**
   * Normaliser les relations historiques liées à un Utilisateur
   */
  getLegacyUserRelations: async (userId: string): Promise<NormalizedRelation[]> => {
    const relations: NormalizedRelation[] = [];
    const users = await api.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) return relations;

    if (user.location_id) {
      relations.push({
        id: `legacy_loc_${userId}_${user.location_id}`,
        direction: 'outgoing',
        relation_type: 'located_at',
        source: { type: 'user', id: userId, label: user.name },
        target: { type: 'location', id: user.location_id },
        status: 'active',
        origin: 'legacy'
      });
    }

    // Licences
    const licensesSnapshot = await getDocs(query(collection(db, 'user_licenses'), where('user_id', '==', userId)));
    licensesSnapshot.docs.forEach(doc => {
      relations.push({
        id: `legacy_license_${userId}_${doc.data().license_id}`,
        direction: 'outgoing',
        relation_type: 'consumes_license',
        source: { type: 'user', id: userId, label: user.name },
        target: { type: 'license', id: doc.data().license_id },
        status: 'active',
        origin: 'legacy'
      });
    });

    // Softwares
    const softwaresSnapshot = await getDocs(query(collection(db, 'user_softwares'), where('user_id', '==', userId)));
    softwaresSnapshot.docs.forEach(doc => {
      relations.push({
        id: `legacy_software_${userId}_${doc.data().software_id}`,
        direction: 'outgoing',
        relation_type: 'uses_software',
        source: { type: 'user', id: userId, label: user.name },
        target: { type: 'software', id: doc.data().software_id },
        status: 'active',
        origin: 'legacy'
      });
    });

    // Assets affectés
    const assetsSnapshot = await getDocs(query(collection(db, 'assets'), where('assigned_user_id', '==', userId)));
    assetsSnapshot.docs.forEach(doc => {
      relations.push({
        id: `legacy_asset_${userId}_${doc.id}`,
        direction: 'incoming', // L'asset pointe vers l'utilisateur
        relation_type: 'assigned_to',
        source: { type: 'asset', id: doc.id, label: doc.data().label },
        target: { type: 'user', id: userId, label: user.name },
        status: 'active',
        origin: 'legacy'
      });
    });

    // Lignes téléphoniques
    const phonesSnapshot = await getDocs(query(collection(db, 'phone_lines'), where('assigned_user_id', '==', userId)));
    phonesSnapshot.docs.forEach(doc => {
      relations.push({
        id: `legacy_phone_${userId}_${doc.id}`,
        direction: 'incoming', // La ligne pointe vers l'utilisateur
        relation_type: 'assigned_to',
        source: { type: 'phone_line', id: doc.id, label: doc.data().label },
        target: { type: 'user', id: userId, label: user.name },
        status: 'active',
        origin: 'legacy'
      });
    });

    return relations;
  },

  /**
   * Normaliser les relations historiques liées à un Contrat
   */
  getLegacyContractRelations: async (contractId: string): Promise<NormalizedRelation[]> => {
    const relations: NormalizedRelation[] = [];
    const contracts = await api.getContracts();
    const contract = contracts.find(c => c.id === contractId);

    if (!contract) return relations;

    if (contract.supplier_id) {
      relations.push({
        id: `legacy_supplier_${contractId}_${contract.supplier_id}`,
        direction: 'outgoing',
        relation_type: 'supplied_by',
        source: { type: 'contract', id: contractId, label: contract.label },
        target: { type: 'supplier', id: contract.supplier_id },
        status: 'active',
        origin: 'legacy'
      });
    }

    const assets = await api.getContractAssets(contractId);
    assets.forEach(asset => {
      relations.push({
        id: `legacy_asset_${contractId}_${asset.id}`,
        direction: 'incoming',
        relation_type: 'covered_by',
        source: { type: 'asset', id: asset.id, label: asset.label },
        target: { type: 'contract', id: contractId, label: contract.label },
        status: 'active',
        origin: 'legacy'
      });
    });

    // Lignes téléphoniques liées au contrat
    const phonesSnapshot = await getDocs(query(collection(db, 'phone_lines'), where('contract_id', '==', contractId)));
    phonesSnapshot.docs.forEach(doc => {
      relations.push({
        id: `legacy_phone_${contractId}_${doc.id}`,
        direction: 'incoming',
        relation_type: 'covered_by',
        source: { type: 'phone_line', id: doc.id, label: doc.data().label },
        target: { type: 'contract', id: contractId, label: contract.label },
        status: 'active',
        origin: 'legacy'
      });
    });

    return relations;
  },

  /**
   * Normaliser les relations historiques liées à une Licence
   */
  getLegacyLicenseRelations: async (licenseId: string): Promise<NormalizedRelation[]> => {
    const relations: NormalizedRelation[] = [];
    const license = await api.getLicense(licenseId);

    if (!license) return relations;

    if (license.supplier_id) {
      relations.push({
        id: `legacy_supplier_${licenseId}_${license.supplier_id}`,
        direction: 'outgoing',
        relation_type: 'supplied_by',
        source: { type: 'license', id: licenseId, label: license.label },
        target: { type: 'supplier', id: license.supplier_id },
        status: 'active',
        origin: 'legacy'
      });
    }

    const assets = await api.getLicenseAssets(licenseId);
    assets.forEach(asset => {
      relations.push({
        id: `legacy_asset_${licenseId}_${asset.id}`,
        direction: 'incoming',
        relation_type: 'consumes_license',
        source: { type: 'asset', id: asset.id, label: asset.label },
        target: { type: 'license', id: licenseId, label: license.label },
        status: 'active',
        origin: 'legacy'
      });
    });

    const users = await api.getLicenseUsers(licenseId);
    users.forEach(user => {
      relations.push({
        id: `legacy_user_${licenseId}_${user.id}`,
        direction: 'incoming',
        relation_type: 'consumes_license',
        source: { type: 'user', id: user.id, label: user.name },
        target: { type: 'license', id: licenseId, label: license.label },
        status: 'active',
        origin: 'legacy'
      });
    });

    return relations;
  },

  // ---------------------------------------------------------------------------
  // 3. Vue unifiée : Generic + Legacy
  // ---------------------------------------------------------------------------

  /**
   * Vue unifiée (Overview) agglomérant legacy relations et génériques
   */
  getEntityRelationsOverview: async (entityType: EntityType, entityId: string): Promise<NormalizedRelation[]> => {
    const allRelations: NormalizedRelation[] = [];

    // 1. Récupérer les legacy
    if (entityType === 'asset') {
      const legacy = await relationService.getLegacyAssetRelations(entityId);
      allRelations.push(...legacy);
    } else if (entityType === 'user') {
      const legacy = await relationService.getLegacyUserRelations(entityId);
      allRelations.push(...legacy);
    } else if (entityType === 'contract') {
      const legacy = await relationService.getLegacyContractRelations(entityId);
      allRelations.push(...legacy);
    } else if (entityType === 'license') {
      const legacy = await relationService.getLegacyLicenseRelations(entityId);
      allRelations.push(...legacy);
    }

    // Pour implémenter d'autres types plus tard (location, supplier, etc.)

    // 2. Ajouter les relations génériques pour plus tard (quand elles seront peuplées)
    const genericOut = await relationService.getOutgoingRelations(entityType, entityId);
    const genericIn = await relationService.getIncomingRelations(entityType, entityId);

    const mapGenericToNormalized = (rel: GenericRelation, direction: 'incoming' | 'outgoing'): NormalizedRelation => ({
      id: rel.id || `generic_${rel.from_id}_${rel.to_id}_${rel.relation_type}`,
      direction,
      relation_type: rel.relation_type,
      source: { type: rel.from_type, id: rel.from_id },
      target: { type: rel.to_type, id: rel.to_id },
      label: rel.label,
      status: rel.status,
      origin: 'generic'
    });

    genericOut.forEach(rel => allRelations.push(mapGenericToNormalized(rel, 'outgoing')));
    genericIn.forEach(rel => allRelations.push(mapGenericToNormalized(rel, 'incoming')));

    return allRelations;
  }
};
