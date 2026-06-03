/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { UserList } from './pages/UserList';
import { LocationList } from './pages/LocationList';
import { ContractList } from './pages/ContractList';
import { LicenseList } from './pages/LicenseList';
import { SupplierList } from './pages/SupplierList';
import { PhoneLineList } from './pages/PhoneLineList';
import { AssetDetailView } from './components/AssetDetailView';
import { LicenseDetailView } from './components/LicenseDetailView';
import { ContractDetailView } from './components/ContractDetailView';
import { CMDB } from './pages/CMDB';
import { AuthProvider, useAuth } from './services/authContext';
import { ToastProvider } from './services/toastContext';
import { Login } from './pages/Login';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sync activeTab with URL for Layout
  useEffect(() => {
    if (!isAuthenticated) return;
    const path = location.pathname.split('/')[1] || 'dashboard';
    // If current activeTab already starts with the path (e.g. assets:moniteurs), don't overwrite it with just the path (assets)
    if (activeTab !== path && !activeTab.startsWith(`${path}:`)) {
      setActiveTab(path);
    }
  }, [location.pathname, activeTab, isAuthenticated]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab.startsWith('assets:')) {
      const parts = tab.split(':');
      if (parts[1] === 'user') {
        navigate(`/assets?user=${parts[2]}`);
      } else {
        navigate(`/assets?type=${parts[1]}`);
      }
    } else if (tab.startsWith('gestion:')) {
      const sub = tab.split(':')[1];
      if (sub === 'phone-lines') navigate('/phone-lines');
      else navigate(`/licenses?mode=${sub}`);
    } else {
      navigate(`/${tab === 'dashboard' ? '' : tab}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Chargement...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange}>
      <Routes>
        <Route path="/" element={<Dashboard onNavigate={handleTabChange} />} />
        <Route path="/assets" element={<AssetList />} />
        <Route path="/assets/:id" element={<AssetDetailWrapper />} />
        <Route path="/users" element={<UserList onNavigate={handleTabChange} />} />
        <Route path="/locations" element={<LocationList />} />
        <Route path="/suppliers" element={<SupplierList />} />
        <Route path="/contracts" element={<ContractList />} />
        <Route path="/contracts/:id" element={<ContractDetailWrapper />} />
        <Route path="/cmdb" element={<CMDB />} />
        <Route path="/history" element={
          <div className="p-12 text-center border-2 border-dashed border-[#141414]/20 rounded-xl">
             <h3 className="text-xl font-serif italic mb-2">Historique Global</h3>
             <p className="text-sm opacity-40">Consultable via les détails des assets en V1.</p>
          </div>
        } />
        <Route path="/licenses" element={<LicenseListWrapper />} />
        <Route path="/licenses/:id" element={<LicenseDetailWrapper />} />
        <Route path="/phone-lines" element={<PhoneLineList />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
};

// Wrappers extract URL params directly
const AssetDetailWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const id = location.pathname.split('/').filter(Boolean).pop()!;
  return <AssetDetailView assetId={id} onClose={() => navigate('/assets')} onRefresh={() => {}} />;
};

const LicenseDetailWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const id = location.pathname.split('/').filter(Boolean).pop()!;
  return <LicenseDetailView licenseId={id} onClose={() => navigate('/licenses')} onRefresh={() => {}} />;
};

const ContractDetailWrapper = () => {
  const navigate = useNavigate();
  const id = useLocation().pathname.split('/').pop()!;
  return <ContractDetailView contractId={id} onClose={() => navigate('/contracts')} onRefresh={() => {}} />;
};

const LicenseListWrapper = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') as 'softwares' | 'licenses' || 'licenses';
  return <LicenseList mode={mode} />;
};

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}

