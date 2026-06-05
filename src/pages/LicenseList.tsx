import React, { useEffect, useState } from 'react';
import { api, License, Asset } from '../services/api';
import { 
  Key, Plus, Search, Calendar, Users, 
  ChevronRight, MoreVertical, Trash2, Edit2, 
  Info, X, Package, ShieldCheck, Clock, Building2, AlertCircle,
  Tag, ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LicenseModal } from '../components/LicenseModal';
import { SoftwareModal } from '../components/SoftwareModal';
import { SoftwareCreateView } from '../components/SoftwareCreateView';
import { LicenseDetailView } from '../components/LicenseDetailView';
import { cn } from '../lib/utils';
import { theme } from '../lib/theme';

import { useNavigate } from 'react-router-dom';

interface LicenseListProps {
  mode?: 'softwares' | 'licenses';
}

export const LicenseList: React.FC<LicenseListProps> = ({ mode: initialMode = 'licenses' }) => {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [softwares, setSoftwares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'licenses' | 'softwares'>(initialMode);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoftwareModalOpen, setIsSoftwareModalOpen] = useState(false);
  const [isCreatingSoftware, setIsCreatingSoftware] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [selectedSoftware, setSelectedSoftware] = useState<any | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [softwareDeleteId, setSoftwareDeleteId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when switching tabs or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [licensesData, softwaresData, suppliersData] = await Promise.all([
        api.getLicenses(),
        api.getSoftwares(),
        api.getSuppliers()
      ]);
      setLicenses(licensesData);
      setSoftwares(softwaresData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [initialMode]);

  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode]);

  const handleEdit = (license: License) => {
    setSelectedLicense(license);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await api.deleteLicense(id);
    setDeleteConfirmId(null);
    fetchData();
  };

  const handleShowDetails = (license: License) => {
    navigate('/licenses/' + license.id);
  };

  const handleEditSoftware = (software: any) => {
    setSelectedSoftware(software);
    setIsSoftwareModalOpen(true);
  };

  const handleDeleteSoftware = async (id: string) => {
    await api.deleteSoftwareById(id);
    setSoftwareDeleteId(null);
    fetchData();
  };

  const allFilteredSoftwares = softwares.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.publisher?.toLowerCase().includes(search.toLowerCase())
  );

  const allFilteredLicenses = licenses.filter(l => 
    l.label.toLowerCase().includes(search.toLowerCase()) || 
    l.software.toLowerCase().includes(search.toLowerCase())
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const filteredSoftwares = allFilteredSoftwares.slice(startIndex, startIndex + PAGE_SIZE);
  const filteredLicenses = allFilteredLicenses.slice(startIndex, startIndex + PAGE_SIZE);

  const totalPages = activeTab === 'softwares' 
    ? Math.ceil(allFilteredSoftwares.length / PAGE_SIZE) 
    : Math.ceil(allFilteredLicenses.length / PAGE_SIZE);

  if (isCreatingSoftware) {
    return (
      <SoftwareCreateView 
        onClose={() => setIsCreatingSoftware(false)}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className={theme.pageHeader}>
        <div className="space-y-1">
          <div className={theme.pageTitleBox}>
             <div className={theme.pageTitleIcon}>
                 {activeTab === 'softwares' ? <Package className="w-5 h-5" /> : <Key className="w-5 h-5" />}
             </div>
             <h2 className={theme.pageTitleText}>
               {activeTab === 'softwares' ? 'Catalogue Logiciels' : 'Parc de Licences'}
             </h2>
          </div>
          <p className={theme.pageSubtitle}>
            Gestion et suivi des {activeTab === 'softwares' ? 'logiciels référencés' : 'licences de votre organisation'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 w-full md:w-[280px]">
            <Search className={theme.searchIcon} />
            <input 
              type="text" 
              placeholder={activeTab === 'softwares' ? "Rechercher dans le catalogue..." : "Rechercher une licence..."}
              className={theme.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { 
              if (activeTab === 'softwares') {
                setIsCreatingSoftware(true);
              } else {
                setSelectedLicense(null);
                setIsModalOpen(true);
              }
            }}
            className={theme.btnPrimary}
          >
            <Plus className="w-4 h-4 text-indigo-100" />
            {activeTab === 'softwares' ? 'Nouveau Logiciel' : 'Nouvelle Licence'}
          </button>
        </div>
      </div>

      {activeTab === 'softwares' ? (
        <div className={cn(theme.card, "flex flex-col min-h-[400px]")}>
          <table className="w-full text-left border-collapse hidden md:table">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 lg:px-8 py-5">ID</th>
                <th className="px-6 lg:px-8 py-5">Logiciel / Éditeur</th>
                <th className="px-6 lg:px-8 py-5 text-center">Type</th>
                <th className="px-6 lg:px-8 py-5">Statut</th>
                <th className="px-6 lg:px-8 py-5">Fournisseur</th>
                <th className="px-6 lg:px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={6}><div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div></td></tr>
              ) : filteredSoftwares.length === 0 ? (
                <tr><td colSpan={6}><div className={theme.emptyPanel}><div className={theme.emptyIconBox}><Package className="w-8 h-8" /></div><p className={theme.emptyText}>Aucun logiciel trouvé dans le catalogue</p></div></td></tr>
              ) : filteredSoftwares.map((s) => (
                <tr 
                  key={s.id} 
                  className="group hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-6 lg:px-8 py-4 lg:py-6 text-xs font-mono font-black text-slate-400">#{s.id}</td>
                  <td className="px-6 lg:px-8 py-4 lg:py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-base">{s.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.publisher || 'Éditeur inconnu'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 lg:px-8 py-4 lg:py-6 text-center">
                    <span className={cn(
                      theme.badge,
                      s.type === 'Abonnement' ? theme.badgeWarning : theme.badgePrimary
                    )}>
                      {s.type}
                    </span>
                  </td>
                  <td className="px-6 lg:px-8 py-4 lg:py-6">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         theme.badge,
                         s.status === 'Actif' ? theme.badgeSuccess : theme.badgeNeutral
                       )}>
                         {s.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 lg:px-8 py-4 lg:py-6 text-sm font-medium text-slate-600">
                    {suppliers.find(sup => sup.id === s.supplier_id)?.name || <span className="opacity-40 italic">---</span>}
                  </td>
                  <td className="px-6 lg:px-8 py-4 lg:py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditSoftware(s)} 
                        className={theme.btnIconGhost}
                        title="Modifier le logiciel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSoftwareDeleteId(s.id)} 
                        className={theme.btnIconDanger}
                        title="Supprimer le logiciel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="md:hidden divide-y divide-slate-100">
             {loading ? (
                <div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div>
             ) : filteredSoftwares.length === 0 ? (
                <div className={theme.emptyPanel}><div className={theme.emptyIconBox}><Package className="w-8 h-8" /></div><p className={theme.emptyText}>Aucun logiciel trouvé</p></div>
             ) : filteredSoftwares.map((s) => (
                <div key={s.id} className="p-5 active:bg-slate-50 transition-colors flex gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                     <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                     <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 truncate pr-2 text-sm">{s.name}</h3>
                        <span className={cn(theme.badge, s.status === 'Actif' ? theme.badgeSuccess : theme.badgeNeutral)}>{s.status}</span>
                     </div>
                     <div className="text-[10px] text-slate-500 font-medium">{s.publisher || 'Éditeur inconnu'}</div>
                     <div className="flex items-center justify-between pt-1">
                        <span className={cn(theme.badge, s.type === 'Abonnement' ? theme.badgeWarning : theme.badgePrimary)}>{s.type}</span>
                        <div className="flex gap-2">
                           <button onClick={() => handleEditSoftware(s)} className={theme.btnIconGhost}><Edit2 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => setSoftwareDeleteId(s.id)} className={theme.btnIconDanger}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                     </div>
                  </div>
                </div>
             ))}
          </div>
        </div>
      ) : (
        <div className={cn(theme.card, "flex flex-col min-h-[400px]")}>
          <table className="w-full text-left border-collapse hidden md:table">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 lg:px-8 py-5">Licence</th>
                <th className="px-6 lg:px-8 py-5">Utilisation</th>
                <th className="px-6 lg:px-8 py-5">Expiration</th>
                <th className="px-6 lg:px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={4}><div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div></td></tr>
              ) : filteredLicenses.length === 0 ? (
                <tr><td colSpan={4}><div className={theme.emptyPanel}><div className={theme.emptyIconBox}><Key className="w-8 h-8" /></div><p className={theme.emptyText}>Aucune licence trouvée</p></div></td></tr>
              ) : filteredLicenses.map((l) => {
              const usedSeats = (l as any).used_seats || 0;
              const ratio = (usedSeats / l.total_seats) * 100;
              const isFull = usedSeats >= l.total_seats;

              return (
                <tr key={l.id} onClick={() => handleShowDetails(l)} className="group hover:bg-slate-50/60 transition-colors cursor-pointer">
                  <td className="px-6 lg:px-8 py-4 lg:py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-base">{l.label}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{l.software}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 lg:px-8 py-4 lg:py-6">
                    <div className="space-y-1.5 w-48">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                        <span className={isFull ? 'text-red-500' : 'text-indigo-600'}>
                          {usedSeats} / {l.total_seats} Sièges
                        </span>
                        <span className="text-slate-400">{Math.round(ratio)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${ratio}%` }}
                          className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 lg:px-8 py-4 lg:py-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">{l.end_date ? new Date(l.end_date).toLocaleDateString() : 'Perpétuelle'}</span>
                    </div>
                  </td>
                  <td className="px-6 lg:px-8 py-4 lg:py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(l); }} 
                        className={theme.btnIconGhost}
                        title="Modifier la licence"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(l.id); }} 
                        className={theme.btnIconDanger}
                        title="Supprimer la licence"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
          <div className="md:hidden divide-y divide-slate-100">
             {loading ? (
                <div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div>
             ) : filteredLicenses.length === 0 ? (
                <div className={theme.emptyPanel}><div className={theme.emptyIconBox}><Key className="w-8 h-8" /></div><p className={theme.emptyText}>Aucune licence trouvée</p></div>
             ) : filteredLicenses.map((l) => {
               const usedSeats = (l as any).used_seats || 0;
               const ratio = (usedSeats / l.total_seats) * 100;
               const isFull = usedSeats >= l.total_seats;
               return (
                  <div key={l.id} onClick={() => handleShowDetails(l)} className="p-5 active:bg-slate-50 transition-colors flex gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                       <Key className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                       <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-900 truncate pr-2 text-sm">{l.label}</h3>
                       </div>
                       <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{l.software}</div>
                       <div className="space-y-1 w-full pt-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                            <span className={isFull ? 'text-red-500' : 'text-indigo-600'}>
                              {usedSeats} / {l.total_seats}
                            </span>
                            <span className="text-slate-400">{Math.round(ratio)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${ratio}%` }}
                              className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-indigo-500'}`}
                            />
                          </div>
                       </div>
                       <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {l.end_date ? new Date(l.end_date).toLocaleDateString() : 'Perpétuelle'}
                          </div>
                       </div>
                    </div>
                  </div>
               )
             })}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Page {currentPage} {totalPages > 0 && `sur ${totalPages}`}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Précédent
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Suivant
          </button>
        </div>
      </div>

      <LicenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchData} 
        license={selectedLicense} 
      />

      <SoftwareModal
        isOpen={isSoftwareModalOpen}
        onClose={() => setIsSoftwareModalOpen(false)}
        onRefresh={fetchData}
        software={selectedSoftware}
      />

      <AnimatePresence>
        {softwareDeleteId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSoftwareDeleteId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2 mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Supprimer du catalogue</h3>
                  <p className="text-sm text-slate-500">Êtes-vous sûr de vouloir supprimer ce logiciel du catalogue ?<br/>Note: Cela ne supprimera pas les licences existantes.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSoftwareDeleteId(null)} className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button onClick={() => handleDeleteSoftware(softwareDeleteId)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100">Supprimer</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2 mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Confirmer la suppression</h3>
                  <p className="text-sm text-slate-500">Êtes-vous sûr de vouloir supprimer cette licence ? Cette action est irréversible et détachera tous les utilisateurs et appareils liés.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100">Supprimer</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
