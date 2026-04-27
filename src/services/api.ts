export const API_URL = '/api';

export interface Asset {
  id: number;
  label: string;
  serial: string;
  type: string;
  subtype: string;
  status: string;
  location_id: number | null;
  supplier_id: number | null;
  assigned_user_id: number | null;
  specs: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  location_name?: string;
  contract_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  location_id: number | null;
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
  };
  recentEvents: any[];
  charts: {
    categories: { name: string; value: number }[];
    statuses: { name: string; value: number }[];
    trends: { month: string; count: number }[];
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) throw new Error('API Error');
  return res.json();
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
  getAssetContracts: (assetId: number): Promise<Contract[]> => fetch(`${API_URL}/assets/${assetId}/contracts`).then(handleResponse),
  assignContractToAsset: (assetId: number, contractId: number) => fetch(`${API_URL}/assets/${assetId}/contracts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contract_id: contractId })
  }).then(handleResponse),
  removeContractFromAsset: (assetId: number, contractId: number) => fetch(`${API_URL}/assets/${assetId}/contracts/${contractId}`, {
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
