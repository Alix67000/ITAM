export const API_URL = '/api';

export interface Asset {
  id: number;
  label: string;
  serial: string;
  inventory_number?: string;
  type: string;
  subtype: string;
  status: string;
  location_id: number | null;
  supplier_id: number | null;
  assigned_user_id: number | null;
  parent_asset_id?: number | null;
  specs: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  location_name?: string;
  contract_count?: number;
  software_count?: number;
  license_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  location_id: number | null;
  role: string;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  parent_id?: number | null;
  parent_name?: string;
}

export interface Contract {
  id: number;
  label: string;
  type: string;
  supplier_id: number | null;
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
  id: number;
  label: string;
  software: string;
  license_key: string;
  total_seats: number;
  used_seats?: number;
  type: string;
  status: string;
  end_date: string;
  reference: string | null;
  supplier_id: number | null;
  supplier_name?: string;
}

export interface Supplier {
  id: number;
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
  };
  recentEvents: Array<{
    id: number;
    asset_id: number;
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

async function handleResponse(res: Response) {
  if (!res.ok) throw new Error('API Error');
  return res.json();
}

export interface PhoneLine {
  id: number;
  label: string;
  number: string;
  status: string;
  location_id: number | null;
  assigned_user_id: number | null;
  supplier_id: number | null;
  contract_id: number | null;
  comments: string;
  location_name?: string;
  user_name?: string;
  supplier_name?: string;
  contract_name?: string;
  created_at: string;
  updated_at: string;
}

export const api = {
  getStats: (): Promise<Stats> => fetch(`${API_URL}/stats`).then(handleResponse),
  getAssets: (): Promise<Asset[]> => fetch(`${API_URL}/assets`).then(handleResponse),
  createAsset: (data: Partial<Asset>) => fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateAsset: (id: number, data: Partial<Asset>) => fetch(`${API_URL}/assets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteAsset: (id: number) => fetch(`${API_URL}/assets/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  getUsers: (): Promise<User[]> => fetch(`${API_URL}/users`).then(handleResponse),
  createUser: (data: Partial<User>) => fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateUser: (id: number, data: Partial<User>) => fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteUser: (id: number) => fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  getLocations: (): Promise<Location[]> => fetch(`${API_URL}/locations`).then(handleResponse),
  createLocation: (data: Partial<Location>) => fetch(`${API_URL}/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateLocation: (id: number, data: Partial<Location>) => fetch(`${API_URL}/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteLocation: (id: number) => fetch(`${API_URL}/locations/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  getContracts: (): Promise<Contract[]> => fetch(`${API_URL}/contracts`).then(handleResponse),
  createContract: (data: Partial<Contract>) => fetch(`${API_URL}/contracts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateContract: (id: number, data: Partial<Contract>) => fetch(`${API_URL}/contracts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteContract: (id: number) => fetch(`${API_URL}/contracts/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  getContractAssets: (contractId: number): Promise<Asset[]> => fetch(`${API_URL}/contracts/${contractId}/assets`).then(handleResponse),
  getLicenses: (): Promise<License[]> => fetch(`${API_URL}/licenses`).then(handleResponse),
  createLicense: (data: Partial<License>) => fetch(`${API_URL}/licenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateLicense: (id: number, data: Partial<License>) => fetch(`${API_URL}/licenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteLicense: (id: number) => fetch(`${API_URL}/licenses/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  getLicenseAssets: (licenseId: number): Promise<Asset[]> => fetch(`${API_URL}/licenses/${licenseId}/assets`).then(handleResponse),
  getAssetLicenses: (assetId: number): Promise<License[]> => fetch(`${API_URL}/assets/${assetId}/licenses`).then(handleResponse),
  getAssetSoftwares: (assetId: number): Promise<any[]> => fetch(`${API_URL}/assets/${assetId}/softwares`).then(handleResponse),
  getAssetChildren: (assetId: number): Promise<Asset[]> => fetch(`${API_URL}/assets/${assetId}/children`).then(handleResponse),
  linkAsset: (parentId: number, childId: number) => fetch(`${API_URL}/assets/${parentId}/link/${childId}`, { method: 'POST' }).then(handleResponse),
  unlinkAsset: (parentId: number, childId: number) => fetch(`${API_URL}/assets/${parentId}/unlink/${childId}`, { method: 'POST' }).then(handleResponse),
  getLicenseUsers: (licenseId: number): Promise<any[]> => fetch(`${API_URL}/licenses/${licenseId}/users`).then(handleResponse),
  assignAssetToLicense: (licenseId: number, assetId: number) => fetch(`${API_URL}/licenses/${licenseId}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset_id: assetId })
  }).then(handleResponse),
  assignUserToLicense: (licenseId: number, userId: number) => fetch(`${API_URL}/licenses/${licenseId}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  }).then(handleResponse),
  removeAssetFromLicense: (licenseId: number, assetId: number) => fetch(`${API_URL}/licenses/${licenseId}/assets/${assetId}`, {
    method: 'DELETE'
  }).then(handleResponse),
  removeUserFromLicense: (licenseId: number, userId: number) => fetch(`${API_URL}/licenses/${licenseId}/users/${userId}`, {
    method: 'DELETE'
  }).then(handleResponse),
  updateSoftware: (oldName: string, data: { newName: string; type?: string; supplier_id?: number | null }) => fetch(`${API_URL}/softwares-bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldName, ...data })
  }).then(handleResponse),
  getSoftwares: () => fetch(`${API_URL}/softwares`).then(handleResponse),
  createSoftware: (data: any) => fetch(`${API_URL}/softwares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateSoftwareById: (id: number, data: any) => fetch(`${API_URL}/softwares/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteSoftwareById: (id: number) => fetch(`${API_URL}/softwares/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  getSoftwareUsers: (id: number) => fetch(`${API_URL}/softwares/${id}/users`).then(handleResponse),
  assignUserToSoftware: (softwareId: number, userId: number) => fetch(`${API_URL}/softwares/${softwareId}/users/${userId}`, { method: 'POST' }).then(handleResponse),
  removeUserFromSoftware: (softwareId: number, userId: number) => fetch(`${API_URL}/softwares/${softwareId}/users/${userId}`, { method: 'DELETE' }).then(handleResponse),
  getSoftwareAssets: (id: number) => fetch(`${API_URL}/softwares/${id}/assets`).then(handleResponse),
  assignAssetToSoftware: (softwareId: number, assetId: number) => fetch(`${API_URL}/softwares/${softwareId}/assets/${assetId}`, { method: 'POST' }).then(handleResponse),
  removeAssetFromSoftware: (softwareId: number, assetId: number) => fetch(`${API_URL}/softwares/${softwareId}/assets/${assetId}`, { method: 'DELETE' }).then(handleResponse),
  deleteSoftware: (name: string) => fetch(`${API_URL}/softwares/${encodeURIComponent(name)}`, {
    method: 'DELETE'
  }).then(handleResponse),
  getAssetContracts: (assetId: number): Promise<Contract[]> => fetch(`${API_URL}/assets/${assetId}/contracts`).then(handleResponse),
  assignContractToAsset: (assetId: number, contractId: number) => fetch(`${API_URL}/assets/${assetId}/contracts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contract_id: contractId })
  }).then(handleResponse),
  removeContractFromAsset: (assetId: number, contractId: number) => fetch(`${API_URL}/assets/${assetId}/contracts/${contractId}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Phone Lines
  getPhoneLines: (): Promise<PhoneLine[]> => fetch(`${API_URL}/phone-lines`).then(handleResponse),
  createPhoneLine: (line: Partial<PhoneLine>) => fetch(`${API_URL}/phone-lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(line)
  }).then(handleResponse),
  updatePhoneLine: (id: number, line: Partial<PhoneLine>) => fetch(`${API_URL}/phone-lines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(line)
  }).then(handleResponse),
  deletePhoneLine: (id: number) => fetch(`${API_URL}/phone-lines/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  getSuppliers: (): Promise<Supplier[]> => fetch(`${API_URL}/suppliers`).then(handleResponse),
  createSupplier: (data: Partial<Supplier>) => fetch(`${API_URL}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateSupplier: (id: number, data: Partial<Supplier>) => fetch(`${API_URL}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteSupplier: (id: number) => fetch(`${API_URL}/suppliers/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
};
