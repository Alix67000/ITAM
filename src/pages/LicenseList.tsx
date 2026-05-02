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

  // Removed viewingLicenseId logic since route handles it

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm gap-6">
        <div className="flex items-center gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {activeTab === 'softwares' ? 'Catalogue Logiciels' : 'Parc de Licences'}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Gestion et suivi des {activeTab === 'softwares' ? 'logiciels référencés' : 'licences de votre organisation'}
            </p>
          </div>
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
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          {activeTab === 'softwares' ? 'Nouveau Logiciel' : 'Nouvelle Licence'}
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder={activeTab === 'softwares' ? "Rechercher dans le catalogue..." : "Rechercher une licence..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {activeTab === 'softwares' ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-500 tracking-[0.15em]">
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5">ID</th>
                <th className="px-8 py-5">Logiciel / Éditeur</th>
                <th className="px-8 py-5 text-center">Type</th>
                <th className="px-8 py-5">Statut</th>
                <th className="px-8 py-5">Fournisseur</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50 text-sm">
              {filteredSoftwares.map((s) => (
                <tr 
                  key={s.id} 
                  className="group hover:bg-slate-50 transition-colors"
                >
                  <td className="px-8 py-6 text-xs font-mono font-black text-slate-400">#{s.id}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center font-bold">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{s.name}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{s.publisher || 'Éditeur inconnu'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block min-w-[90px] ${
                      s.type === 'Abonnement' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {s.type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block min-w-[90px] text-center ${
                         s.status === 'Actif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-200'
                       }`}>
                         {s.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600">
                    {suppliers.find(sup => sup.id === s.supplier_id)?.name || <span className="opacity-40 italic">---</span>}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditSoftware(s)} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Modifier le logiciel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSoftwareDeleteId(s.id)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
          {filteredSoftwares.length === 0 && (
            <div className="py-20 text-center">
              <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium tracking-tight">Aucun logiciel trouvé dans le catalogue</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-500 tracking-[0.15em]">
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5">Licence</th>
                <th className="px-8 py-5">Utilisation</th>
                <th className="px-8 py-5">Expiration</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50 text-sm">
              {filteredLicenses.map((l) => {
              const usedSeats = (l as any).used_seats || 0;
              const ratio = (usedSeats / l.total_seats) * 100;
              const isFull = usedSeats >= l.total_seats;

              return (
                <tr key={l.id} onClick={() => handleShowDetails(l)} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{l.label}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{l.software}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
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
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">{l.end_date ? new Date(l.end_date).toLocaleDateString() : 'Perpétuelle'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(l); }} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Modifier la licence"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(l.id); }} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
      </div>
      )}

      {/* Pagination Controls */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400">
          Page {currentPage} {totalPages > 0 && `sur ${totalPages}`}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Précédent
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSoftwareDeleteId(null)} 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[201] p-8 space-y-6"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Supprimer du catalogue</h3>
                <p className="text-sm text-slate-500">Êtes-vous sûr de vouloir supprimer ce logiciel du catalogue ?<br/>Note: Cela ne supprimera pas les licences existantes, mais elles n'auront plus de référence catalogue.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSoftwareDeleteId(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => handleDeleteSoftware(softwareDeleteId)}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setDeleteConfirmId(null)} 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[201] p-8 space-y-6"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Confirmer la suppression</h3>
                <p className="text-sm text-slate-500">Êtes-vous sûr de vouloir supprimer cette licence ? Cette action est irréversible et détachera tous les utilisateurs et appareils liés.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
