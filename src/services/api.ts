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
}

export interface Stats {
  counts: {
    assets: number;
    users: number;
    locations: number;
    broken: number;
  };
  recentEvents: any[];
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
  getSuppliers: () => fetch(`${API_URL}/suppliers`).then(handleResponse),
};
