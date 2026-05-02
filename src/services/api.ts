export const API_URL = '/api';

export interface AssetEvent {
  id: string;
  type: string;
  date: string;
  author: string;
  description: string;
}

export interface Asset {
  id: string;
  label: string;
  serial: string;
  inventory_number?: string;
  type: string;
  subtype: string;
  status: string;
  location_id: string | null;
  supplier_id: string | null;
  assigned_user_id: string | null;
  parent_asset_id?: string | null;
  linkedAssets?: string[];
  specs: string;
  condition: string;
  value_euros: number;
  manufacture_date: string;
  commissioning_date: string;
  has_warranty: boolean;
  warranty_end?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  location_name?: string;
  contract_count?: number;
  software_count?: number;
  license_count?: number;
  total_contract_price?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  location_id: string | null;
  role: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  parent_id?: string | null;
  parent_name?: string;
}

export interface Contract {
  id: string;
  label: string;
  type: string;
  supplier_id: string | null;
  supplier_name?: string;
  start_date: string;
  end_date: string;
  price: number;
  status: string;
  description: string;
  reference: string | null;
  created_at: string;
  assets_count?: number;
}

export interface License {
  id: string;
  label: string;
  software: string;
  license_key: string;
  total_seats: number;
  used_seats?: number;
  type: string;
  status: string;
  end_date: string;
  reference: string | null;
  supplier_id: string | null;
  supplier_name?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

export interface Stats {
  counts: {
    assets: number;
    users: number;
    locations: number;
    broken: number;
    contracts: number;
    totalValue: number;
    warrantyPercent: number;
    averageAgeYears: number;
  };
  recentEvents: Array<{
    id: string;
    asset_id: string;
    asset_label: string;
    action: string;
    description: string;
    created_at: string;
  }>;
  upcomingExpirations: Array<{
    name: string;
    date: string;
    type: 'License' | 'Contrat';
  }>;
  charts: {
    categories: Array<{ name: string; value: number }>;
    statuses: Array<{ name: string; value: number }>;
    trends: Array<{ month: string; count: number }>;
  };
}

export interface PhoneLine {
  id: string;
  label: string;
  number: string;
  status: string;
  location_id: string | null;
  assigned_user_id: string | null;
  supplier_id: string | null;
  contract_id: string | null;
  comments: string;
  location_name?: string;
  user_name?: string;
  supplier_name?: string;
  contract_name?: string;
  created_at: string;
  updated_at: string;
}

import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDoc,
  startAfter
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const computeStats = (assets: Asset[], phoneLines: PhoneLine[], users: User[], locations: Location[], contracts: Contract[], licenses: License[]): Stats => {
  const totalValue = assets.reduce((acc, a) => acc + (a.value_euros || 0), 0);
  const brokenCount = assets.filter(a => a.status === 'Panne').length;
  const underWarranty = assets.filter(a => a.has_warranty && (!a.warranty_end || new Date(a.warranty_end) > new Date())).length;
  
  const totalAgeDays = assets
    .filter(a => a.manufacture_date)
    .reduce((acc, a) => acc + (new Date().getTime() - new Date(a.manufacture_date).getTime()) / (1000 * 60 * 60 * 24), 0);
  
  const assetsWithDate = assets.filter(a => a.manufacture_date).length;
  const averageAgeYears = assetsWithDate > 0 ? (totalAgeDays / assetsWithDate) / 365.25 : 0;

  const categoriesMap: Record<string, number> = {};
  assets.forEach(a => {
    categoriesMap[a.type] = (categoriesMap[a.type] || 0) + 1;
  });

  const statusesMap: Record<string, number> = {};
  assets.forEach(a => {
    statusesMap[a.status] = (statusesMap[a.status] || 0) + 1;
  });

  // Derived Events: Latest 5 assets created
  const recentEvents = [...assets]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(a => ({
      id: `event-${a.id}`,
      asset_id: a.id,
      asset_label: a.label,
      action: 'Création',
      description: `Nouvel asset enregistré : ${a.label}`,
      created_at: a.created_at
    }));

  // Add some fake status update events if any asset is broken
  const brokenAssets = assets.filter(a => a.status === 'Panne').slice(0, 2);
  brokenAssets.forEach(a => {
     recentEvents.push({
       id: `event-panne-${a.id}`,
       asset_id: a.id,
       asset_label: a.label,
       action: 'Panne',
       description: `Signalement de panne : ${a.label}`,
       created_at: a.updated_at
     });
  });

  // Derived Expirations:
  const now = new Date();
  const sixtyDaysLater = new Date();
  sixtyDaysLater.setDate(now.getDate() + 60);

  const upcomingExpirations: any[] = [];
  
  licenses.forEach(l => {
    if (l.end_date) {
      const d = new Date(l.end_date);
      if (d > now && d < sixtyDaysLater) {
        upcomingExpirations.push({ id: l.id, name: l.label, date: l.end_date, type: 'License' });
      }
    }
  });

  contracts.forEach(c => {
    if (c.end_date) {
      const d = new Date(c.end_date);
      if (d > now && d < sixtyDaysLater) {
        upcomingExpirations.push({ id: c.id, name: c.label, date: c.end_date, type: 'Contrat' });
      }
    }
  });

  // Sorting expirations by date
  upcomingExpirations.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Trends: Group by month
  const monthNames = ['Jan', 'Féb', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const last6Months: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mLabel = monthNames[d.getMonth()];
    const count = assets.filter(a => {
      const ad = new Date(a.created_at);
      return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
    }).length;
    last6Months.push({ month: mLabel, count });
  }

  return {
    counts: {
      assets: assets.length,
      users: users.length,
      locations: locations.length,
      broken: brokenCount,
      contracts: contracts.filter(c => c.status === 'Actif').length,
      totalValue,
      warrantyPercent: assets.length > 0 ? (underWarranty / assets.length) * 100 : 0,
      averageAgeYears
    },
    recentEvents: recentEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    upcomingExpirations: upcomingExpirations.slice(0, 5), 
    charts: {
      categories: Object.entries(categoriesMap).map(([name, value]) => ({ name, value })),
      statuses: Object.entries(statusesMap).map(([name, value]) => ({ name, value })),
      trends: last6Months
    }
  };
};

export const api = {
  getStats: async (): Promise<Stats> => {
    // Legacy mapping - now we prefer computeStats client-side
    return {} as Stats;
  },

  getAsset: async (id: string): Promise<Asset | null> => {
    try {
      const docSnap = await getDoc(doc(db, 'assets', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Asset;
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `assets/${id}`);
      return null;
    }
  },

  getLicense: async (id: string): Promise<License | null> => {
    try {
      const [docSnap, assetLinks, userLinks] = await Promise.all([
        getDoc(doc(db, 'licenses', id)),
        getDocs(query(collection(db, 'asset_licenses'), where('license_id', '==', id))),
        getDocs(query(collection(db, 'user_licenses'), where('license_id', '==', id)))
      ]);

      if (docSnap.exists()) {
        return { 
          id: docSnap.id, 
          ...docSnap.data(),
          used_seats: assetLinks.size + userLinks.size
        } as License;
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `licenses/${id}`);
      return null;
    }
  },

  addAssetEvent: async (assetId: string, event: Omit<AssetEvent, 'id'>): Promise<string> => {
    try {
      const parentRef = doc(db, 'assets', assetId);
      const eventsRef = collection(parentRef, 'events');
      const docRef = await addDoc(eventsRef, { ...event });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `assets/${assetId}/events`);
      throw e;
    }
  },

  getAssetEvents: async (assetId: string): Promise<AssetEvent[]> => {
    try {
      const parentRef = doc(db, 'assets', assetId);
      const q = query(collection(parentRef, 'events'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AssetEvent));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `assets/${assetId}/events`);
      return [];
    }
  },

  getAssets: async (constraints?: { limitCount?: number, lastDoc?: any, fetchAll?: boolean }): Promise<{ assets: Asset[], lastDoc?: any, hasMore: boolean }> => {
    try {
      let q = query(collection(db, 'assets'));
      
      // Si fetchAll est vrai (par ex: recherche active), on charge tout
      if (constraints?.fetchAll) {
        const snapshot = await getDocs(q);
        return { 
          assets: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Asset)),
          hasMore: false
        };
      }

      // Par défaut on trie par created_at desc (il faut que la base ait le champ)
      // Si ça bug sans index, on utilise simplement pas de tri explicite ou on trie par document ID
      
      if (constraints?.limitCount) {
        q = query(q, limit(constraints.limitCount + 1));
      }
      if (constraints?.lastDoc) {
        q = query(q, startAfter(constraints.lastDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      let hasMore = false;
      let results = docs;
      
      if (constraints?.limitCount && docs.length > constraints.limitCount) {
        hasMore = true;
        results = docs.slice(0, constraints.limitCount);
      }

      const nextLastDoc = hasMore ? results[results.length - 1] : undefined;

      return { 
        assets: results.map(d => ({ id: d.id, ...d.data() } as Asset)), 
        lastDoc: nextLastDoc, 
        hasMore 
      };
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'assets');
      return { assets: [], hasMore: false };
    }
  },

  createAsset: async (data: Partial<Asset>) => {
    try {
      console.log('Tentative de création d\'asset dans Firestore...', data);
      const docRef = await addDoc(collection(db, 'assets'), {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('Asset créé avec succès ! ID Firestore :', docRef.id);
      return { id: docRef.id };
    } catch (e) {
      console.error('Erreur lors de l\'écriture dans Firestore :', e);
      handleFirestoreError(e, OperationType.CREATE, 'assets');
    }
  },

  updateAsset: async (id: string, data: Partial<Asset>) => {
    try {
      await updateDoc(doc(db, 'assets', id), {
        ...data,
        updated_at: new Date().toISOString()
      });
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `assets/${id}`);
    }
  },

  deleteAsset: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'assets', id));
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `assets/${id}`);
    }
  },

  getNextInventoryNumber: async (assetType: string): Promise<{ nextNumber: string }> => {
    const year = new Date().getFullYear().toString().slice(-2);
    const mapping: Record<string, string> = {
      'PC': 'PC',
      'PC fixe': 'PC',
      'PC portable': 'PL',
      'Tablette': 'TB',
      'Téléphone': 'TEL',
      'Imprimante': 'IMP',
      'Écran': 'ECR',
      'Périphérique': 'PER',
      'Souris': 'PER',
      'Clavier': 'PER',
      'Casque': 'PER'
    };
    const prefix = mapping[assetType] || 'ASSET';
    try {
      const q = query(
        collection(db, 'assets'), 
        where('inventory_number', '>=', `${prefix}-${year}-`),
        where('inventory_number', '<=', `${prefix}-${year}-\uf8ff`),
        orderBy('inventory_number', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      let nextNum = 1;
      if (!snapshot.empty) {
        const lastNumStr = snapshot.docs[0].data().inventory_number;
        const parts = lastNumStr.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) nextNum = lastSeq + 1;
      }
      return { nextNumber: `${prefix}-${year}-${nextNum.toString().padStart(3, '0')}` };
    } catch (e) {
      return { nextNumber: `${prefix}-${year}-001` };
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
      return [];
    }
  },

  createUser: async (data: Partial<User>) => {
    try {
      const docRef = await addDoc(collection(db, 'users'), data);
      return { id: docRef.id };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'users');
    }
  },

  updateUser: async (id: string, data: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', id), data);
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${id}`);
    }
  },

  deleteUser: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
    }
  },

  getLocations: async (): Promise<Location[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'locations'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Location));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'locations');
      return [];
    }
  },

  createLocation: async (data: Partial<Location>) => {
    try {
      const docRef = await addDoc(collection(db, 'locations'), data);
      return { id: docRef.id };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'locations');
    }
  },

  updateLocation: async (id: string, data: Partial<Location>) => {
    try {
      await updateDoc(doc(db, 'locations', id), data);
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `locations/${id}`);
    }
  },

  deleteLocation: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'locations', id));
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `locations/${id}`);
    }
  },

  getContracts: async (): Promise<Contract[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'contracts'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contract));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'contracts');
      return [];
    }
  },

  createContract: async (data: Partial<Contract>) => {
    try {
      const docRef = await addDoc(collection(db, 'contracts'), data);
      return { id: docRef.id };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'contracts');
    }
  },

  updateContract: async (id: string, data: Partial<Contract>) => {
    try {
      await updateDoc(doc(db, 'contracts', id), data);
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `contracts/${id}`);
    }
  },

  deleteContract: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contracts', id));
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `contracts/${id}`);
    }
  },

  getLicenses: async (): Promise<License[]> => {
    try {
      const [licenseSnap, assetLinksSnap, userLinksSnap] = await Promise.all([
        getDocs(collection(db, 'licenses')),
        getDocs(collection(db, 'asset_licenses')),
        getDocs(collection(db, 'user_licenses'))
      ]);
      
      const licenses = licenseSnap.docs.map(d => ({ id: d.id, ...d.data() } as License));
      
      const assetCounts: Record<string, number> = {};
      assetLinksSnap.docs.forEach(d => {
        const lid = d.data().license_id;
        assetCounts[lid] = (assetCounts[lid] || 0) + 1;
      });

      const userCounts: Record<string, number> = {};
      userLinksSnap.docs.forEach(d => {
        const lid = d.data().license_id;
        userCounts[lid] = (userCounts[lid] || 0) + 1;
      });

      return licenses.map(l => ({
        ...l,
        used_seats: (assetCounts[l.id] || 0) + (userCounts[l.id] || 0)
      }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'licenses');
      return [];
    }
  },

  createLicense: async (data: Partial<License>) => {
    try {
      const docRef = await addDoc(collection(db, 'licenses'), data);
      return { id: docRef.id };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'licenses');
    }
  },

  updateLicense: async (id: string, data: Partial<License>) => {
    try {
      await updateDoc(doc(db, 'licenses', id), data);
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `licenses/${id}`);
    }
  },

  deleteLicense: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'licenses', id));
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `licenses/${id}`);
    }
  },

  getSoftwares: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'softwares'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'softwares');
      return [];
    }
  },

  createSoftware: async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'softwares'), data);
      return { id: docRef.id };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'softwares');
    }
  },

  getPhoneLines: async (): Promise<PhoneLine[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'phone_lines'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PhoneLine));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'phone_lines');
      return [];
    }
  },

  updatePhoneLine: async (id: string, line: Partial<PhoneLine>) => {
    try {
      await updateDoc(doc(db, 'phone_lines', id), line);
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `phone_lines/${id}`);
    }
  },

  getSuppliers: async (): Promise<Supplier[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'suppliers'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'suppliers');
      return [];
    }
  },
  
  createSupplier: async (data: Partial<Supplier>) => {
    try {
      const docRef = await addDoc(collection(db, 'suppliers'), data);
      return { id: docRef.id };
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'suppliers');
    }
  },

  updateSupplier: async (id: string, data: Partial<Supplier>) => {
    try {
      await updateDoc(doc(db, 'suppliers', id), data);
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `suppliers/${id}`);
    }
  },

  deleteSupplier: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
      return { success: true };
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `suppliers/${id}`);
    }
  },

  // Relationship implementations
  getAssetContracts: async (assetId: string): Promise<Contract[]> => {
    try {
      const q = query(collection(db, 'asset_contracts'), where('asset_id', '==', assetId));
      const snap = await getDocs(q);
      const contractIds = snap.docs.map(d => d.data().contract_id);
      if (contractIds.length === 0) return [];
      
      const contracts = await Promise.all(contractIds.map(async (cid: string) => {
        const d = await getDoc(doc(db, 'contracts', cid));
        return d.exists() ? { id: d.id, ...d.data() } as Contract : null;
      }));
      return contracts.filter(c => c !== null) as Contract[];
    } catch (e) { return []; }
  },

  assignContractToAsset: async (assetId: string, contractId: string) => {
    try {
      await addDoc(collection(db, 'asset_contracts'), { asset_id: assetId, contract_id: contractId });
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'asset_contracts'); }
  },

  removeContractFromAsset: async (assetId: string, contractId: string) => {
    try {
      const q = query(collection(db, 'asset_contracts'), where('asset_id', '==', assetId), where('contract_id', '==', contractId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'asset_contracts'); }
  },

  getContractAssets: async (contractId: string): Promise<Asset[]> => {
    try {
      const q = query(collection(db, 'asset_contracts'), where('contract_id', '==', contractId));
      const snap = await getDocs(q);
      const assetIds = snap.docs.map(d => d.data().asset_id);
      if (assetIds.length === 0) return [];
      const assets = await Promise.all(assetIds.map(async (aid: string) => {
        const d = await getDoc(doc(db, 'assets', aid));
        return d.exists() ? { id: d.id, ...d.data() } as Asset : null;
      }));
      return assets.filter(a => a !== null) as Asset[];
    } catch (e) { return []; }
  },

  getAssetSoftwares: async (assetId: string): Promise<any[]> => {
    try {
      const q = query(collection(db, 'asset_softwares'), where('asset_id', '==', assetId));
      const snap = await getDocs(q);
      const softwareIds = snap.docs.map(d => d.data().software_id);
      if (softwareIds.length === 0) return [];
      const softwares = await Promise.all(softwareIds.map(async (sid: string) => {
        const d = await getDoc(doc(db, 'softwares', sid));
        return d.exists() ? { id: d.id, ...d.data() } : null;
      }));
      return softwares.filter(s => s !== null);
    } catch (e) { return []; }
  },

  getAssetLicenses: async (assetId: string): Promise<License[]> => {
    try {
      const q = query(collection(db, 'asset_licenses'), where('asset_id', '==', assetId));
      const snap = await getDocs(q);
      const ids = snap.docs.map(d => d.data().license_id);
      if (ids.length === 0) return [];
      const items = await Promise.all(ids.map(async (id: string) => {
        const d = await getDoc(doc(db, 'licenses', id));
        return d.exists() ? { id: d.id, ...d.data() } as License : null;
      }));
      return items.filter(x => x !== null) as License[];
    } catch (e) { return []; }
  },

  assignAssetToSoftware: async (softwareId: string, assetId: string) => {
    try {
      await addDoc(collection(db, 'asset_softwares'), { asset_id: assetId, software_id: softwareId });
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'asset_softwares'); }
  },

  removeAssetFromSoftware: async (softwareId: string, assetId: string) => {
    try {
      const q = query(collection(db, 'asset_softwares'), where('asset_id', '==', assetId), where('software_id', '==', softwareId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'asset_softwares'); }
  },

  getAssetChildren: async (parentId: string): Promise<Asset[]> => {
    try {
      const parentDoc = await getDoc(doc(db, 'assets', parentId));
      if (!parentDoc.exists()) return [];
      const linkedIds = parentDoc.data().linkedAssets || [];
      if (linkedIds.length === 0) return [];
      
      const promises = linkedIds.map((id: string) => getDoc(doc(db, 'assets', id)));
      const docs = await Promise.all(promises);
      return docs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() } as Asset));
    } catch (e) { return []; }
  },

  linkAsset: async (parentId: string, childId: string) => {
    try {
      const parentRef = doc(db, 'assets', parentId);
      const parentDoc = await getDoc(parentRef);
      if (parentDoc.exists()) {
        const currentLinks = parentDoc.data().linkedAssets || [];
        if (!currentLinks.includes(childId)) {
          await updateDoc(parentRef, { linkedAssets: [...currentLinks, childId] });
        }
      }
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `assets/${parentId}`); }
  },

  unlinkAsset: async (parentId: string, childId: string) => {
    try {
      const parentRef = doc(db, 'assets', parentId);
      const parentDoc = await getDoc(parentRef);
      if (parentDoc.exists()) {
        const currentLinks = parentDoc.data().linkedAssets || [];
        await updateDoc(parentRef, { linkedAssets: currentLinks.filter((id: string) => id !== childId) });
      }
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `assets/${parentId}`); }
  },

  getLicenseAssets: async (licenseId: string): Promise<Asset[]> => {
    try {
      const q = query(collection(db, 'asset_licenses'), where('license_id', '==', licenseId));
      const snap = await getDocs(q);
      const ids = snap.docs.map(d => d.data().asset_id);
      if (ids.length === 0) return [];
      const items = await Promise.all(ids.map(async (id: string) => {
        const d = await getDoc(doc(db, 'assets', id));
        return d.exists() ? { id: d.id, ...d.data() } as Asset : null;
      }));
      return items.filter(x => x !== null) as Asset[];
    } catch (e) { return []; }
  },

  getLicenseUsers: async (licenseId: string): Promise<User[]> => {
    try {
      const q = query(collection(db, 'user_licenses'), where('license_id', '==', licenseId));
      const snap = await getDocs(q);
      const ids = snap.docs.map(d => d.data().user_id);
      if (ids.length === 0) return [];
      const items = await Promise.all(ids.map(async (id: string) => {
        const d = await getDoc(doc(db, 'users', id));
        return d.exists() ? { id: d.id, ...d.data() } as User : null;
      }));
      return items.filter(x => x !== null) as User[];
    } catch (e) { return []; }
  },

  assignAssetToLicense: async (licenseId: string, assetId: string) => {
    try {
      await addDoc(collection(db, 'asset_licenses'), { asset_id: assetId, license_id: licenseId });
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'asset_licenses'); }
  },

  removeAssetFromLicense: async (licenseId: string, assetId: string) => {
    try {
      const q = query(collection(db, 'asset_licenses'), where('asset_id', '==', assetId), where('license_id', '==', licenseId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'asset_licenses'); }
  },

  assignUserToLicense: async (licenseId: string, userId: string) => {
    try {
      await addDoc(collection(db, 'user_licenses'), { user_id: userId, license_id: licenseId });
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'user_licenses'); }
  },

  removeUserFromLicense: async (licenseId: string, userId: string) => {
    try {
      const q = query(collection(db, 'user_licenses'), where('user_id', '==', userId), where('license_id', '==', licenseId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'user_licenses'); }
  },

  createPhoneLine: async (data: Partial<PhoneLine>) => {
    try {
      const docRef = await addDoc(collection(db, 'phone_lines'), {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { id: docRef.id };
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'phone_lines'); }
  },

  deletePhoneLine: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'phone_lines', id));
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, `phone_lines/${id}`); }
  },

  getSoftwareUsers: async (softwareId: string): Promise<User[]> => {
    try {
      const q = query(collection(db, 'user_softwares'), where('software_id', '==', softwareId));
      const snap = await getDocs(q);
      const ids = snap.docs.map(d => d.data().user_id);
      if (ids.length === 0) return [];
      const items = await Promise.all(ids.map(async (id: string) => {
        const d = await getDoc(doc(db, 'users', id));
        return d.exists() ? { id: d.id, ...d.data() } as User : null;
      }));
      return items.filter(x => x !== null) as User[];
    } catch (e) { return []; }
  },

  getSoftwareAssets: async (softwareId: string): Promise<Asset[]> => {
    try {
      const q = query(collection(db, 'asset_softwares'), where('software_id', '==', softwareId));
      const snap = await getDocs(q);
      const ids = snap.docs.map(d => d.data().asset_id);
      if (ids.length === 0) return [];
      const items = await Promise.all(ids.map(async (id: string) => {
        const d = await getDoc(doc(db, 'assets', id));
        return d.exists() ? { id: d.id, ...d.data() } as Asset : null;
      }));
      return items.filter(x => x !== null) as Asset[];
    } catch (e) { return []; }
  },

  updateSoftwareById: async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'softwares', id), data);
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `softwares/${id}`); }
  },

  deleteSoftwareById: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'softwares', id));
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, `softwares/${id}`); }
  },

  assignUserToSoftware: async (softwareId: string, userId: string) => {
    try {
      await addDoc(collection(db, 'user_softwares'), { user_id: userId, software_id: softwareId });
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'user_softwares'); }
  },

  removeUserFromSoftware: async (softwareId: string, userId: string) => {
    try {
      const q = query(collection(db, 'user_softwares'), where('user_id', '==', userId), where('software_id', '==', softwareId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      return { success: true };
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'user_softwares'); }
  },
};
;
