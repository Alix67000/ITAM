/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { UserList } from './pages/UserList';
import { LocationList } from './pages/LocationList';
import { ContractList } from './pages/ContractList';
import { LicenseList } from './pages/LicenseList';
import { SupplierList } from './pages/SupplierList';
import { PhoneLineList } from './pages/PhoneLineList';
import { AuthProvider } from './services/authContext';
import { ToastProvider } from './services/toastContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    if (activeTab.startsWith('assets:')) {
      const parts = activeTab.split(':');
      if (parts[1] === 'user') {
        return <AssetList initialUserId={parseInt(parts[2])} />;
      }
      const type = parts[1];
      return <AssetList initialType={type} />;
    }

    if (activeTab.startsWith('gestion:')) {
      const subTab = activeTab.split(':')[1];
      if (subTab === 'phone-lines') return <PhoneLineList />;
      return <LicenseList mode={subTab as 'softwares' | 'licenses'} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'assets':
        return <AssetList />;
      case 'users':
        return <UserList onNavigate={setActiveTab} />;
      case 'locations':
        return <LocationList />;
      case 'suppliers':
        return <SupplierList />;
      case 'contracts':
        return <ContractList />;
      case 'history':
        return (
          <div className="p-12 text-center border-2 border-dashed border-[#141414]/20 rounded-xl">
             <h3 className="text-xl font-serif italic mb-2">Historique Global</h3>
             <p className="text-sm opacity-40">Consultable via les détails des assets en V1.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <ToastProvider>
      <AuthProvider>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
          {renderContent()}
        </Layout>
      </AuthProvider>
    </ToastProvider>
  );
}

