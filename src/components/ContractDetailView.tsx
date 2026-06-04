import React, { useEffect, useState } from 'react';
import { api, Contract, Asset, Supplier } from '../services/api';
import { cn } from '../lib/utils';
import { 
  X, FileText, Calendar, Landmark, CreditCard, Box, 
  Edit2, Plus, ArrowRight, ShieldCheck, Clock, ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '../services/toastContext';
import { RelationViewer } from './RelationViewer';

interface ContractDetailViewProps {
  contractId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const ContractDetailView: React.FC<ContractDetailViewProps> = ({ contractId, onClose, onRefresh }) => {
  const { showToast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [linkedAssets, setLinkedAssets] = useState<Asset[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContract, setEditedContract] = useState<Partial<Contract>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const contractsList = await api.getContracts();
        const found = contractsList.find(c => c.id === contractId);
        if (found) {
          setContract(found);
          setEditedContract(found);
          
          const [assets, suppliers] = await Promise.all([
            api.getContractAssets(contractId),
            api.getSuppliers()
          ]);
          setLinkedAssets(assets);
          setAllSuppliers(suppliers);
        }
      } catch (error) {
        console.error('Error fetching contract details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contractId]);

  const handleGlobalSave = async () => {
    if (!contract) return;
    setIsSaving(true);
    try {
      await api.updateContract(contract.id, editedContract);
      onRefresh();
      
      const updatedList = await api.getContracts();
      const fresh = updatedList.find(c => c.id === contractId);
      if (fresh) {
        setContract(fresh);
        setEditedContract(fresh);
      }
      
      setIsEditing(false);
      showToast('Contrat mis à jour avec succès', 'success');
    } catch (e) {
      showToast('Erreur lors de la sauvegarde du contrat', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'actif': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'expiré': return 'bg-red-50 text-red-600 border-red-100';
      case 'résilié': return 'bg-slate-50 text-slate-400 border-slate-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-50 min-h-screen"
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[100] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="h-6 md:h-8 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-950 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-400 flex-shrink-0">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <div className="min-w-0 flex-1">
               {!isEditing ? (
                 <>
                   <h1 className="text-base md:text-2xl font-black text-slate-900 tracking-tight truncate">{contract.label}</h1>
                   <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                     <span className="truncate">{contract.reference}</span>
                     <span className="hidden sm:inline">•</span>
                     <span className={cn(
                       "px-2 py-0.5 rounded-full border text-[8px] md:text-[10px]",
                       getStatusColor(contract.status)
                     )}>
                       {contract.status}
                     </span>
                   </div>
                 </>
               ) : (
                 <div className="space-y-2">
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold"
                      value={editedContract.label}
                      onChange={e => setEditedContract({ ...editedContract, label: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[10px] font-mono"
                        value={editedContract.reference}
                        onChange={e => setEditedContract({ ...editedContract, reference: e.target.value })}
                        placeholder="Référence"
                      />
                      <select 
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[10px] font-bold"
                        value={editedContract.status}
                        onChange={e => setEditedContract({ ...editedContract, status: e.target.value })}
                      >
                        <option value="Actif">Actif</option>
                        <option value="Inactif">Inactif</option>
                        <option value="Expiré">Expiré</option>
                        <option value="Résilie">Résilie</option>
                      </select>
                    </div>
                 </div>
               )}
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 md:px-6 md:py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> <span className="hidden md:inline">Modifier</span>
            </button>
          ) : (
            <div className="flex gap-2">
               <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-500 font-bold uppercase text-[10px]"
              >
                Annuler
              </button>
              <button 
                onClick={handleGlobalSave}
                disabled={isSaving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                {isSaving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Sauver
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
          
          {/* Main Content (2/3) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* General Info Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                   <FileText className="w-5 h-5" />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Détails du Contrat</h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type de Contrat</p>
                   {!isEditing ? (
                     <p className="font-bold text-slate-900">{contract.type}</p>
                   ) : (
                     <select 
                       className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold"
                       value={editedContract.type}
                       onChange={e => setEditedContract({ ...editedContract, type: e.target.value })}
                     >
                       <option value="Abonnement">Abonnement</option>
                       <option value="Maintenance">Maintenance</option>
                       <option value="Location">Location</option>
                       <option value="Garantie">Garantie</option>
                       <option value="Assurance">Assurance</option>
                       <option value="Support">Support</option>
                     </select>
                   )}
                 </div>

                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coût Annuel / Total</p>
                   {!isEditing ? (
                     <p className="font-bold text-indigo-600 text-lg">{contract.price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                   ) : (
                     <div className="relative">
                       <input 
                         type="number"
                         className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold pl-6"
                         value={editedContract.price}
                         onChange={e => setEditedContract({ ...editedContract, price: Number(e.target.value) })}
                       />
                       <CreditCard className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                     </div>
                   )}
                 </div>

                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de Début</p>
                    {!isEditing ? (
                      <p className="font-bold text-slate-900">{new Date(contract.start_date).toLocaleDateString('fr-FR')}</p>
                    ) : (
                      <input 
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold"
                        value={editedContract.start_date?.split('T')[0]}
                        onChange={e => setEditedContract({ ...editedContract, start_date: e.target.value })}
                      />
                    )}
                 </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de Fin</p>
                    {!isEditing ? (
                      <p className={cn(
                        "font-bold",
                        new Date(contract.end_date) < new Date() ? 'text-red-500' : 'text-slate-900'
                      )}>
                        {new Date(contract.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    ) : (
                      <input 
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold"
                        value={editedContract.end_date?.split('T')[0]}
                        onChange={e => setEditedContract({ ...editedContract, end_date: e.target.value })}
                      />
                    )}
                 </div>
              </div>
            </div>

            {/* Linked Assets Grid */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                     <Box className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">Matériel Couvert ({linkedAssets.length})</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkedAssets.length > 0 ? linkedAssets.map(asset => (
                   <div key={asset.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-colors">
                           <Box className="w-5 h-5" />
                         </div>
                         <div className="min-w-0">
                           <p className="text-sm font-black text-slate-900 truncate">{asset.label}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{asset.serial}</p>
                         </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                   </div>
                )) : (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 italic text-sm">
                    Aucun matériel n'est spécifiquement rattaché à ce contrat.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar (1/3) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Supplier Quick Card */}
            <div className="bg-indigo-950 rounded-3xl p-8 border border-indigo-900 shadow-xl text-white space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
               
               <div className="space-y-2 relative">
                 <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Fournisseur / Prestataire</h3>
                 {!isEditing ? (
                   <div className="flex items-center justify-between">
                     <h4 className="text-2xl font-black">{contract.supplier_name || 'Inconnu'}</h4>
                     <ExternalLink className="w-5 h-5 text-indigo-400" />
                   </div>
                 ) : (
                   <select 
                      className="w-full bg-indigo-900/50 border border-indigo-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editedContract.supplier_id || ''}
                      onChange={e => setEditedContract({ ...editedContract, supplier_id: Number(e.target.value), supplier_name: e.target.options[e.target.selectedIndex].text })}
                    >
                      {allSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-4 relative pt-6 border-t border-indigo-900/50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", contract.status === 'Actif' ? 'bg-emerald-400' : 'bg-red-400')} />
                      <span className="font-bold text-sm tracking-tight">{contract.status}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Validité</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-sm tracking-tight">
                        {Math.ceil((new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} jours
                      </span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Action Card Placeholder */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Actions de gestion</h3>
               <div className="flex flex-col gap-3">
                  <button className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" /> Gérer la facturation
                  </button>
                  <button className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                    <Landmark className="w-4 h-4" /> Consulter les CGV
                  </button>
               </div>
            </div>
            
            <RelationViewer
              entityType="contract"
              entityId={contractId}
              title="Relations métier"
              className="border-slate-200 shadow-sm rounded-3xl"
            />

          </div>

        </div>
      </div>
    </motion.div>
  );
};
