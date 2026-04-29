import React, { useEffect, useState } from 'react';
import { api, Contract, Asset } from '../services/api';
import { cn } from '../lib/utils';
import { Plus, Search, FileText, Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ContractModal } from '../components/ContractModal';
import { ContractDetailView } from '../components/ContractDetailView';
import { useAuth } from '../services/authContext';

export const ContractList: React.FC = () => {
  const { canEdit, canDelete, isViewer } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [viewingContractId, setViewingContractId] = useState<number | null>(null);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getContracts();
      setContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditContract = (contract: Contract) => {
    if (!canEdit) return;
    setSelectedContract(contract);
    setIsContractModalOpen(true);
  };

  const handleShowContractDetails = (contract: Contract) => {
    setViewingContractId(contract.id);
  };

  const handleCreate = () => {
    if (isViewer) return;
    setSelectedContract(null);
    setIsContractModalOpen(true);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleDeleteContract = async (id: number) => {
    if (!canDelete) return;
    await api.deleteContract(id);
    setDeleteConfirmId(null);
    fetchData();
  };

  const filteredContracts = contracts.filter(c => 
    c.label.toLowerCase().includes(search.toLowerCase()) || 
    c.type.toLowerCase().includes(search.toLowerCase()) ||
    c.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  const isExpiringSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const endDate = new Date(dateStr);
    const today = new Date();
    const diff = endDate.getTime() - today.getTime();
    const days = diff / (1000 * 3600 * 24);
    return days >= 0 && days <= 30;
  };

  if (loading && contracts.length === 0) return <div className="text-sm font-sans text-slate-400 p-12 text-center animate-pulse italic">Chargement des contrats...</div>;

  if (viewingContractId) {
    return (
      <ContractDetailView 
        contractId={viewingContractId}
        onClose={() => setViewingContractId(null)}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ContractModal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} onRefresh={fetchData} contract={selectedContract} />

      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Gestion des Contrats</h2>
          <p className="text-[11px] md:text-xs text-slate-500">Suivi des contrats de maintenance, leasing et prestations.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <button 
            disabled={isViewer}
            onClick={handleCreate} 
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 md:py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            <Plus className="w-4 h-4" /> <span className="md:inline">Nouveau</span>
          </button>
        </div>
      </div>

      <div className="bg-white md:rounded-2xl border border-slate-200 md:shadow-sm overflow-hidden min-h-[400px]">
        {/* Table View - Desktop Only */}
        <table className="hidden md:table w-full text-left border-collapse">
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
                  <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditContract(c); }} 
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      disabled={!canDelete}
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(c.id); }} 
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filteredContracts.length === 0 && <tr><td colSpan={6} className="p-20 text-center text-slate-400 italic">Aucun contrat trouvé.</td></tr>}
          </tbody>
        </table>

        {/* Mobile View - Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredContracts.map((c) => (
            <div 
              key={`contract-card-${c.id}`}
              onClick={() => handleShowContractDetails(c)}
              className="p-4 active:bg-slate-50 transition-colors flex gap-4"
            >
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 truncate pr-2 text-sm">{c.label}</h3>
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                    c.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                  )}>
                    {c.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {c.supplier_name || 'Sans fournisseur'} • {c.type}
                </div>
                <div className="flex items-center justify-between pt-1">
                   <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                     <Calendar className="w-3 h-3" />
                     <span className={isExpiringSoon(c.end_date) ? 'text-orange-600' : ''}>
                       Expire: {c.end_date || 'N/A'}
                     </span>
                   </div>
                   <div className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-black text-slate-600">
                     {c.assets_count || 0} ASSETS
                   </div>
                </div>
              </div>
            </div>
          ))}
          {filteredContracts.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-400 italic text-xs">
              Aucun contrat trouvé.
            </div>
          )}
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-center">
               <AlertCircle className="w-8 h-8 mx-auto" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Confirmer la suppression</h3>
              <p className="text-sm text-slate-500">Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={() => deleteConfirmId && handleDeleteContract(deleteConfirmId)}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
