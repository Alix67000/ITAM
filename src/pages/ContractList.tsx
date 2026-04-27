import React, { useEffect, useState } from 'react';
import { api, Contract, Asset, License } from '../services/api';
import { Plus, Search, Filter, FileText, Calendar, Edit2, Trash2, AlertCircle, X, Package, User, MapPin, DollarSign, Info, Key, Box, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContractModal } from '../components/ContractModal';
import { LicenseModal } from '../components/LicenseModal';

export const ContractList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contracts' | 'licenses'>('contracts');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const [detailsContract, setDetailsContract] = useState<Contract | null>(null);
  const [detailsLicense, setDetailsLicense] = useState<License | null>(null);
  
  const [contractAssets, setContractAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsData, licensesData] = await Promise.all([
        api.getContracts(),
        api.getLicenses()
      ]);
      setContracts(contractsData);
      setLicenses(licensesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setIsContractModalOpen(true);
  };

  const handleEditLicense = (license: License) => {
    setSelectedLicense(license);
    setIsLicenseModalOpen(true);
  };

  const handleShowContractDetails = async (contract: Contract) => {
    setDetailsContract(contract);
    setLoadingAssets(true);
    try {
      const assets = await api.getContractAssets(contract.id);
      setContractAssets(assets);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleShowLicenseDetails = async (license: License) => {
    setDetailsLicense(license);
    setLoadingAssets(true);
    try {
      const assets = await api.getLicenseAssets(license.id);
      setContractAssets(assets);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleCreate = () => {
    if (activeTab === 'contracts') {
      setSelectedContract(null);
      setIsContractModalOpen(true);
    } else {
      setSelectedLicense(null);
      setIsLicenseModalOpen(true);
    }
  };

  const handleDeleteContract = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Voulez-vous vraiment supprimer ce contrat ?')) {
      await api.deleteContract(id);
      fetchData();
    }
  };

  const handleDeleteLicense = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Voulez-vous vraiment supprimer cette licence ?')) {
      await api.deleteLicense(id);
      fetchData();
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.label.toLowerCase().includes(search.toLowerCase()) || 
    c.type.toLowerCase().includes(search.toLowerCase()) ||
    c.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLicenses = licenses.filter(l => 
    l.label.toLowerCase().includes(search.toLowerCase()) || 
    l.software.toLowerCase().includes(search.toLowerCase()) ||
    l.type.toLowerCase().includes(search.toLowerCase())
  );

  const isExpiringSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const endDate = new Date(dateStr);
    const today = new Date();
    const diff = endDate.getTime() - today.getTime();
    const days = diff / (1000 * 3600 * 24);
    return days >= 0 && days <= 30;
  };

  if (loading && contracts.length === 0 && licenses.length === 0) return <div className="text-sm font-sans text-slate-400 p-12 text-center animate-pulse italic">Synchronisation des données...</div>;

  return (
    <div className="space-y-6">
      <ContractModal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} onRefresh={fetchData} contract={selectedContract} />
      <LicenseModal isOpen={isLicenseModalOpen} onClose={() => setIsLicenseModalOpen(false)} onRefresh={fetchData} license={selectedLicense} />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Engagements & Licences</h2>
          <p className="text-xs text-slate-500">Flux de maintenance, contrats de leasing et droits d’usage logiciels.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher..." className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={handleCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-100">
            <Plus className="w-4 h-4" /> {activeTab === 'contracts' ? 'Nouveau Contrat' : 'Nouvelle Licence'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 w-fit rounded-xl">
        <button 
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'contracts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-3.5 h-3.5" /> Contrats de Service
        </button>
        <button 
          onClick={() => setActiveTab('licenses')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'licenses' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Key className="w-3.5 h-3.5" /> Licences Logicielles
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'contracts' ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr className="border-b border-slate-100">
                <th className="px-8 py-4">Libellé / Type</th>
                <th className="px-8 py-4">Fournisseur</th>
                <th className="px-8 py-4">Période</th>
                <th className="px-8 py-4 text-center">Assets liés</th>
                <th className="px-8 py-4">Statut</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredContracts.map((c, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} 
                  key={c.id} onClick={() => handleShowContractDetails(c)}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><FileText className="w-5 h-5" /></div>
                      <div>
                        <div className="font-bold text-slate-900">{c.label}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{c.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-slate-600 font-medium">{c.supplier_name || '---'}</td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col text-xs">
                      <span className="text-slate-500">Dès: {c.start_date || 'N/A'}</span>
                      <span className={`font-medium ${isExpiringSoon(c.end_date) ? 'text-orange-600' : 'text-slate-500'}`}>
                        Vient à: {c.end_date || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">{c.assets_count || 0}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{c.status}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleEditContract(c); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDeleteContract(e, c.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredContracts.length === 0 && <tr><td colSpan={6} className="p-20 text-center text-slate-400 italic">Aucun contrat trouvé.</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr className="border-b border-slate-100">
                <th className="px-8 py-4">Logiciel / Éditeur</th>
                <th className="px-8 py-4">Type</th>
                <th className="px-8 py-4">Utilisation</th>
                <th className="px-8 py-4">Expiration</th>
                <th className="px-8 py-4">Statut</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLicenses.map((l, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} 
                  key={l.id} onClick={() => handleShowLicenseDetails(l)}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><Key className="w-4 h-4" /></div>
                      <div>
                        <div className="font-bold text-slate-900">{l.label}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{l.software}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-slate-600 font-medium">{l.type}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                       <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${((l.used_seats || 0) / l.total_seats) > 0.9 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, ((l.used_seats || 0) / l.total_seats) * 100)}%` }} />
                       </div>
                       <span className="text-[10px] font-bold text-slate-500">{l.used_seats || 0} / {l.total_seats}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`text-xs font-medium ${isExpiringSoon(l.end_date) ? 'text-orange-600' : 'text-slate-500'}`}>
                      {l.end_date || 'Perpétuelle'}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${l.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{l.status}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleEditLicense(l); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDeleteLicense(e, l.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredLicenses.length === 0 && <tr><td colSpan={6} className="p-20 text-center text-slate-400 italic">Aucune licence trouvée.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {(detailsContract || detailsLicense) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setDetailsContract(null); setDetailsLicense(null); }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-[101] border-l border-slate-200 flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${detailsLicense ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'} rounded-2xl flex items-center justify-center`}>
                    {detailsLicense ? <Key className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{detailsContract?.label || detailsLicense?.label}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{detailsContract?.type || detailsLicense?.software}</span>
                  </div>
                </div>
                <button onClick={() => { setDetailsContract(null); setDetailsLicense(null); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {detailsLicense && (
                  <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Key className="w-16 h-16" /></div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Clé de licence</label>
                     <div className="text-lg font-mono font-bold tracking-wider mb-4">{detailsLicense.license_key || '--- XXX ---- XXX ---'}</div>
                     <div className="flex gap-6 mt-4 pt-4 border-t border-white/10">
                        <div>
                          <div className="text-[8px] font-bold text-slate-500 uppercase">Postes Total</div>
                          <div className="text-xl font-black">{detailsLicense.total_seats}</div>
                        </div>
                        <div>
                          <div className="text-[8px] font-bold text-slate-500 uppercase">Type</div>
                          <div className="text-sm font-bold text-indigo-400">{detailsLicense.type}</div>
                        </div>
                     </div>
                  </div>
                )}

                {detailsContract && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><DollarSign className="w-3 h-3" /> Coût Annuel</label>
                      <div className="text-lg font-mono font-bold text-slate-900">{detailsContract.price.toLocaleString()} €</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Info className="w-3 h-3" /> Statut</label>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${detailsContract.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{detailsContract.status}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Package className="w-3 h-3" /> Assets rattachés ({contractAssets.length})</label>
                  <div className="space-y-3">
                    {loadingAssets ? <div className="h-16 bg-slate-100 rounded-xl animate-pulse" /> : contractAssets.length > 0 ? (
                      contractAssets.map(asset => (
                        <div key={asset.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><Package className="w-5 h-5" /></div>
                              <div>
                                 <div className="font-bold text-slate-900 text-sm">{asset.label}</div>
                                 <div className="text-[10px] text-slate-400">{asset.serial}</div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-[10px] font-bold text-slate-900">{asset.user_name || 'Stock'}</div>
                              <div className="text-[10px] text-slate-400">{asset.location_name || 'Paris'}</div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 italic text-slate-400 text-xs">Aucun asset rattaché.</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4 mt-auto">
                <button 
                  onClick={() => {
                    if (detailsContract) handleEditContract(detailsContract);
                    if (detailsLicense) handleEditLicense(detailsLicense);
                    setDetailsContract(null); setDetailsLicense(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition"
                >
                  <Edit2 className="w-4 h-4" /> Modifier l'enregistrement
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
