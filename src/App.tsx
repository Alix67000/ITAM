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
import { SupplierList } from './pages/SupplierList';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    if (activeTab.startsWith('assets:')) {
      const type = activeTab.split(':')[1];
      return <AssetList initialType={type} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'assets':
        return <AssetList />;
      case 'users':
        return <UserList />;
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
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

