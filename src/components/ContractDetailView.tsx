import React, { useEffect, useState } from 'react';
import { api, Contract, Asset, Supplier, PhoneLine, User } from '../services/api';
import { cn } from '../lib/utils';
import { 
  X, FileText, Calendar, Landmark, CreditCard, Box, 
  Edit2, Plus, ArrowRight, ShieldCheck, Clock, ExternalLink,
  Phone, Users as UsersIcon, Printer, Eye, EyeOff, UserCircle, Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { theme } from '../lib/theme';
import { useToast } from '../services/toastContext';
import { RelationViewer } from './RelationViewer';
import { ContractForm } from './forms/ContractForm';

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
  
  const [linkedPhones, setLinkedPhones] = useState<PhoneLine[]>([]);
  const [linkedUsers, setLinkedUsers] = useState<User[]>([]);
  const [linkedPrinters, setLinkedPrinters] = useState<Asset[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

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
          
          const [assets, suppliers, phones, users, printers] = await Promise.all([
            api.getContractAssets(contractId),
            api.getSuppliers(),
            api.getContractPhoneLines(contractId),
            api.getContractUsers(contractId),
            api.getContractPrinters(contractId)
          ]);
          
          // Séparer les imprimantes des autres assets pour éviter les doublons visuels
          setLinkedAssets(assets.filter(a => !printers.find(p => p.id === a.id)));
          
          setAllSuppliers(suppliers);
          setLinkedPhones(phones);
          setLinkedUsers(users);
          setLinkedPrinters(printers);
        }
      } catch (error) {
        console.error('Error fetching contract details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contractId]);

  const handleGlobalSave = async (formData: Partial<Contract>, associations: { phoneLineIds: string[], userIds: string[], printerIds: string[] }) => {
    if (!contract) return;
    setIsSaving(true);
    try {
      await api.updateContract(contract.id, formData);
      await Promise.all([
        api.syncContractPhoneLines(contract.id, associations.phoneLineIds),
        api.syncContractUsers(contract.id, associations.userIds),
        api.syncContractPrinters(contract.id, associations.printerIds)
      ]);
      
      onRefresh();
      
      const updatedList = await api.getContracts();
      const fresh = updatedList.find(c => c.id === contractId);
      if (fresh) {
        setContract(fresh);
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

  if (isEditing) {
    return (
      <div className="bg-slate-50 min-h-screen pb-20 font-sans">
        <div className={theme.detailHeader}>
           <div className="flex items-center gap-3 flex-1">
             <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center">
               <X className="w-5 h-5" />
             </button>
             <div className="h-6 w-[1px] bg-slate-200" />
             <div className="min-w-0 flex-1">
                <h1 className="text-base font-black text-slate-900 tracking-tight">Modifier le contrat</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{contract.label}</p>
             </div>
           </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
             <ContractForm
               initialData={contract}
               onSubmit={handleGlobalSave}
               onCancel={() => setIsEditing(false)}
               isSaving={isSaving}
             />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-50 min-h-screen"
    >
       <div className={theme.detailHeader}>
        <div className="flex items-center gap-2 flex-1">
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
             <div className={cn(theme.detailHeaderIconBox, "bg-indigo-50 text-indigo-600 border-indigo-100")}>
               <ShieldCheck className="w-5 h-5" />
             </div>
             <div className="min-w-0 flex-1">
               <h1 className="text-base font-black text-slate-900 tracking-tight truncate">{contract.label}</h1>
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                 <span className="truncate">{contract.reference}</span>
                 <span className="opacity-30">•</span>
                 <span className={cn(
                   theme.badge,
                   getStatusColor(contract.status)
                 )}>
                   {contract.status}
                 </span>
               </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditing(true)}
            className={cn(theme.btnSecondary, "py-1.5 px-3 text-xs")}
          >
            <Edit2 className="w-3.5 h-3.5" /> Modifier
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
        <div className={theme.detailMainGrid}>
          
          {/* Main Content */}
          <div className={theme.detailContent}>
            
            {/* General Info Card */}
            <div className={theme.detailSection}>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                   <FileText className="w-5 h-5" />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Détails du Contrat</h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                 <div className="space-y-0.5">
                   <p className={theme.detailMetaLabel}>Type de Contrat</p>
                   <p className={theme.detailMetaValue}>{contract.type}</p>
                 </div>

                 <div className="space-y-0.5">
                   <p className={theme.detailMetaLabel}>Coût Annuel / Total</p>
                   <p className="font-bold text-indigo-600 text-lg">{contract.price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                 </div>

                 <div className="space-y-0.5">
                    <p className={theme.detailMetaLabel}>Date de Début</p>
                    <p className={theme.detailMetaValue}>{new Date(contract.start_date).toLocaleDateString('fr-FR')}</p>
                 </div>

                  <div className="space-y-0.5">
                    <p className={theme.detailMetaLabel}>Date de Fin</p>
                    <p className={cn(
                      theme.detailMetaValue,
                      new Date(contract.end_date) < new Date() ? 'text-red-500' : 'text-slate-900'
                    )}>
                      {new Date(contract.end_date).toLocaleDateString('fr-FR')}
                    </p>
                 </div>
              </div>
            </div>

            {/* Account Info (Forfait mobile or generic account) */}
            {(contract.account_login || contract.account_email || contract.account_password || contract.type === 'Forfait mobile') && (
               <div className={theme.detailSection}>
                  <div className={theme.detailSectionHeader}>
                    <h3 className={theme.detailSectionTitle}>
                       <Lock className="w-4 h-4 text-indigo-500" /> Compte de gestion
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <UserCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Identifiant</p>
                          <p className="text-sm font-black text-slate-900 truncate">{contract.account_login || contract.account_email || 'Non renseigné'}</p>
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Mot de passe</p>
                            <p className="text-sm font-black text-slate-900 font-mono mt-0.5 tracking-wider truncate">
                              {contract.account_password ? (showPassword ? contract.account_password : '••••••••••••') : 'Non renseigné'}
                            </p>
                          </div>
                        </div>
                        {contract.account_password && (
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                             {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {/* Dynamic Multi-Associations */}
            {(linkedPhones.length > 0 || linkedUsers.length > 0 || linkedPrinters.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Lignes Téléphoniques */}
                {linkedPhones.length > 0 && (
                   <div className={theme.detailSection}>
                      <div className={theme.detailSectionHeader}>
                        <h3 className={theme.detailSectionTitle}>
                           <Phone className="w-4 h-4 text-emerald-500" /> Lignes associées ({linkedPhones.length})
                        </h3>
                      </div>
                      <div className="mt-4 space-y-2">
                        {linkedPhones.map(l => (
                          <div key={l.id} className="p-3 bg-slate-50 flex items-center justify-between rounded-xl border border-slate-100">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{l.number}</p>
                              <p className="text-[10px] uppercase font-bold text-slate-400">{l.label}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                          </div>
                        ))}
                      </div>
                   </div>
                )}
                
                {/* Imprimantes associées */}
                {linkedPrinters.length > 0 && (
                   <div className={theme.detailSection}>
                      <div className={theme.detailSectionHeader}>
                        <h3 className={theme.detailSectionTitle}>
                           <Printer className="w-4 h-4 text-orange-500" /> Imprimantes ({linkedPrinters.length})
                        </h3>
                      </div>
                      <div className="mt-4 space-y-2">
                        {linkedPrinters.map(p => (
                          <div key={p.id} className="p-3 bg-slate-50 flex items-center justify-between rounded-xl border border-slate-100">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{p.brand} {p.model}</p>
                              <p className="text-[10px] uppercase font-bold text-slate-400">{p.serial}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                          </div>
                        ))}
                      </div>
                   </div>
                )}

                {/* Utilisateurs associés */}
                {linkedUsers.length > 0 && (
                   <div className={theme.detailSection}>
                      <div className={theme.detailSectionHeader}>
                        <h3 className={theme.detailSectionTitle}>
                           <UsersIcon className="w-4 h-4 text-blue-500" /> Utilisateurs gérés ({linkedUsers.length})
                        </h3>
                      </div>
                      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                        {linkedUsers.map(u => (
                          <div key={u.id} className="p-3 bg-slate-50 flex items-center justify-between rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 uppercase">
                                  {u.name?.[0] || 'U'}
                               </div>
                               <div>
                                 <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                 <p className="text-[10px] uppercase font-bold text-slate-400">{u.email}</p>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                )}
              </div>
            )}

            {/* Linked Assets Grid */}
            <div className={theme.detailSection}>
              <div className={theme.detailSectionHeader}>
                <h3 className={theme.detailSectionTitle}>
                   <Box className="w-4 h-4 text-orange-500" /> Matériel Couvert ({linkedAssets.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {linkedAssets.length > 0 ? linkedAssets.map(asset => (
                   <div key={asset.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all cursor-pointer">
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
                  <div className="col-span-full py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className={theme.emptyText}>Aucun matériel n'est spécifiquement rattaché à ce contrat.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className={theme.detailSidebar}>
            
            {/* Supplier Quick Card */}
            <div className={cn(theme.detailSection, "bg-indigo-950 border-indigo-900 shadow-xl text-white relative overflow-hidden")}>
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />
               
               <div className="space-y-1 relative">
                 <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Fournisseur / Prestataire</h3>
                 <div className="flex items-center justify-between">
                   <h4 className="text-xl font-black">{contract.supplier_name || 'Inconnu'}</h4>
                   <ExternalLink className="w-4 h-4 text-indigo-400" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 relative pt-4 border-t border-indigo-900/50 mt-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", contract.status === 'Actif' ? 'bg-emerald-400' : 'bg-red-400')} />
                      <span className="font-bold text-sm tracking-tight">{contract.status}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Validité</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-bold text-sm tracking-tight">
                        {Math.ceil((new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} j
                      </span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Action Card Placeholder */}
            <div className={theme.detailSection}>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Actions de gestion</h3>
               <div className="flex flex-col gap-3">
                  <button className="w-full py-4 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" /> Gérer la facturation
                  </button>
                  <button className="w-full py-4 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                    <Landmark className="w-4 h-4" /> Consulter les CGV
                  </button>
               </div>
            </div>
            
            <RelationViewer
              entityType="contract"
              entityId={contractId}
              title="Relations métier"
              className={cn(theme.detailSection, "p-0 overflow-hidden border-none shadow-none")}
            />

          </div>

        </div>
      </div>
    </motion.div>
  );
};
