import React, { useEffect, useState } from 'react';
import { api, Contract, Asset, Supplier } from '../services/api';
import { cn } from '../lib/utils';
import { theme } from '../lib/theme';
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
      (supplier?.name || '').toLowerCase().includes(search.toLowerCase());
      
    const cStatus = getContractStatus(c.end_date);
    const matchesStatus = statusFilter === 'all' || cStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <ContractModal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} onRefresh={fetchData} contract={selectedContract} />

      <div className={theme.pageHeader}>
        <div className="space-y-1">
          <div className={theme.pageTitleBox}>
             <div className={theme.pageTitleIcon}>
                 <FileText className="w-5 h-5" />
             </div>
             <h2 className={theme.pageTitleText}>
               Gestion des Contrats
             </h2>
          </div>
          <p className={theme.pageSubtitle}>Suivi des contrats de maintenance, leasing et prestations.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-[240px]">
            <Search className={theme.searchIcon} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className={theme.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={theme.inputBase}
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="bientot_expire">Expire &lt; 30 j.</option>
            <option value="expire">Expiré</option>
          </select>
          <button 
             disabled={isViewer}
             onClick={handleCreate} 
             className={theme.btnPrimary}
          >
            <Plus className="w-4 h-4 text-indigo-100" /> Nouveau
          </button>
        </div>
      </div>

      <div className={cn(theme.card, "flex flex-col min-h-[400px]")}>
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Libellé / Type</th>
              <th className="px-6 py-4">Fournisseur</th>
              <th className="px-6 py-4">Période</th>
              <th className="px-6 py-4 text-center">Assets liés</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={6}><div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div></td></tr>
            ) : filteredContracts.length === 0 ? (
              <tr><td colSpan={6}><div className={theme.emptyPanel}><div className={theme.emptyIconBox}><FileText className="w-8 h-8" /></div><p className={theme.emptyText}>Aucun contrat trouvé.</p></div></td></tr>
            ) : filteredContracts.map((c, idx) => {
              const supplier = suppliers.find(s => s.id === c.supplier_id);
              
              return (
                <motion.tr 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} 
                  key={c.id} onClick={() => handleShowContractDetails(c)}
                  className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm truncate">{c.label}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{c.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600 font-medium text-xs">{supplier ? supplier.name : '---'}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col text-xs space-y-0.5">
                      <div className="text-slate-500">Début: {c.start_date || 'N/A'}</div>
                      <div className={isExpiringSoon(c.end_date) ? 'text-orange-600 font-bold' : 'text-slate-500'}>
                        Fin: {c.end_date || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600">{c.assets_count || 0}</span>
                  </td>
                  <td className="px-6 py-3">
                       <span className={cn(
                         theme.badge,
                         c.status === 'Actif' ? theme.badgeSuccess : theme.badgeNeutral
                       )}>
                         {c.status}
                       </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditContract(c); }} 
                        className={theme.btnIconGhost}
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        disabled={!canDelete}
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(c.id); }} 
                        className={theme.btnIconDanger}
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile View - Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
             <div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div>
          ) : filteredContracts.length === 0 ? (
             <div className={theme.emptyPanel}><div className={theme.emptyIconBox}><FileText className="w-8 h-8" /></div><p className={theme.emptyText}>Aucun contrat trouvé.</p></div>
          ) : filteredContracts.map((c) => {
            const supplier = suppliers.find(s => s.id === c.supplier_id);

            return (
              <div 
                key={`contract-card-${c.id}`}
                onClick={() => handleShowContractDetails(c)}
                className="p-5 active:bg-slate-50 transition-colors flex gap-4"
              >
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 truncate pr-2 text-sm">{c.label}</h3>
                    <span className={cn(
                      theme.badge,
                      c.status === 'Actif' ? theme.badgeSuccess : theme.badgeNeutral
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
                     <div className="text-[10px] bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded font-black text-slate-600">
                       {c.assets_count || 0} ASSETS
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200"
          >
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
               <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Confirmer la suppression</h3>
              <p className="text-sm text-slate-500">Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => deleteConfirmId && handleDeleteContract(deleteConfirmId)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

