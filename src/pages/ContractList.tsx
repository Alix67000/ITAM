import React, { useEffect, useState } from 'react';
import { api, Contract, Asset, Supplier } from '../services/api';
import { cn } from '../lib/utils';
import { Plus, Search, FileText, Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ContractModal } from '../components/ContractModal';
import { ContractDetailView } from '../components/ContractDetailView';
import { useAuth } from '../services/authContext';

import { useNavigate } from 'react-router-dom';

export const ContractList: React.FC = () => {
  const navigate = useNavigate();
  const { canEdit, canDelete, isViewer } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsData, suppliersData] = await Promise.all([
        api.getContracts(),
        api.getSuppliers()
      ]);
      setContracts(contractsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching contracts data:', error);
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
    navigate('/contracts/' + contract.id);
  };

  const handleCreate = () => {
    if (isViewer) return;
    setSelectedContract(null);
    setIsContractModalOpen(true);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'expire' | 'bientot_expire'>('all');

  const handleDeleteContract = async (id: string) => {
    if (!canDelete) return;
    await api.deleteContract(id);
    setDeleteConfirmId(null);
    fetchData();
  };

  const getContractStatus = (dateStr: string) => {
    if (!dateStr) return 'actif';
    const endDate = new Date(dateStr);
    const today = new Date();
    const days = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (days < 0) return 'expire';
    if (days >= 0 && days <= 30) return 'bientot_expire';
    return 'actif';
  };

  const isExpiringSoon = (dateStr: string) => getContractStatus(dateStr) === 'bientot_expire';

  const filteredContracts = contracts.filter(c => {
    const supplier = suppliers.find(s => s.id === c.supplier_id);
    const matchesSearch = c.label.toLowerCase().includes(search.toLowerCase()) || 
      c.type.toLowerCase().includes(search.toLowerCase()) ||
      supplier?.name.toLowerCase().includes(search.toLowerCase());
      
    const cStatus = getContractStatus(c.end_date);
    const matchesStatus = statusFilter === 'all' || cStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading && contracts.length === 0) return <div className="text-sm font-sans text-slate-400 p-12 text-center animate-pulse italic">Chargement des contrats...</div>;

  return (
    <div className="space-y-6">
      <ContractModal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} onRefresh={fetchData} contract={selectedContract} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-1.5 flex-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                 <FileText className="w-5 h-5" />
             </div>
             Gestion des Contrats
          </h2>
          <p className="text-sm font-medium text-slate-500 pl-13">Suivi des contrats de maintenance, leasing et prestations.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group flex-1 sm:flex-initial">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 min-w-[240px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-slate-600 outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="bientot_expire">Expire &lt; 30 jours</option>
            <option value="expire">Expiré</option>
          </select>
          <button 
            disabled={isViewer}
            onClick={handleCreate} 
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:grayscale group whitespace-nowrap"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Nouveau Contrat
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {/* Table View - Desktop Only */}
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-500 tracking-[0.15em]">
            <tr className="border-b border-slate-100">
              <th className="px-8 py-5">Libellé / Type</th>
              <th className="px-8 py-5">Fournisseur</th>
              <th className="px-8 py-5">Période</th>
              <th className="px-8 py-5 text-center">Assets liés</th>
              <th className="px-8 py-5">Statut</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/50 text-sm">
            {filteredContracts.map((c, idx) => {
              const supplier = suppliers.find(s => s.id === c.supplier_id);
              
              return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} 
                  key={c.id} onClick={() => handleShowContractDetails(c)}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{c.label}</div>
                        <div className="text-[10px] uppercase font-black tracking-[0.1em] text-slate-400">{c.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-slate-600 font-bold text-sm tracking-tight">{supplier ? supplier.name : '---'}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col text-sm space-y-0.5">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-500 font-medium">Début: {c.start_date || 'N/A'}</span></div>
                      <div className={`flex items-center gap-1.5 font-medium ${isExpiringSoon(c.end_date) ? 'text-orange-600 blur-[0.3px] brightness-150 animate-pulse' : 'text-slate-500'}`}>
                        <Calendar className="w-3.5 h-3.5" />Fin: {c.end_date || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black text-slate-600">{c.assets_count || 0}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-start">
                       <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block min-w-[90px] text-center ${
                         c.status === 'Actif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-200'
                       }`}>
                         {c.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditContract(c); }} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        disabled={!canDelete}
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(c.id); }} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            {filteredContracts.length === 0 && <tr><td colSpan={6} className="p-20 text-center text-slate-400 italic">Aucun contrat trouvé.</td></tr>}
          </tbody>
        </table>

        {/* Mobile View - Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredContracts.map((c) => {
            const supplier = suppliers.find(s => s.id === c.supplier_id);

            return (
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
                    {supplier ? supplier.name : 'Sans fournisseur'} • {c.type}
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
            );
          })}
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
