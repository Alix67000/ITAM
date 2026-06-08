import React, { useEffect, useState } from 'react';
import { api, License, Asset, Supplier } from '../services/api';
import { 
  Key, Calendar, Users, Package, Clock, Building2, 
  ChevronLeft, Edit2, Trash2, ShieldCheck, ShieldAlert,
  ArrowRight, UserCheck, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { theme } from '../lib/theme';
import { cn } from '../lib/utils';
import { LicenseForm } from './forms/LicenseForm';
import { useToast } from '../services/toastContext';

interface LicenseDetailViewProps {
  licenseId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const LicenseDetailView: React.FC<LicenseDetailViewProps> = ({ licenseId, onClose, onRefresh }) => {
  const { showToast } = useToast();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [linkedUsers, setLinkedUsers] = useState<any[]>([]);
  const [linkedAssets, setLinkedAssets] = useState<Asset[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [licenseData, users, assets, suppliersData, allUsersList] = await Promise.all([
        api.getLicense(licenseId),
        api.getLicenseUsers(licenseId),
        api.getLicenseAssets(licenseId),
        api.getSuppliers(),
        api.getUsers()
      ]);
      setLicense(licenseData);
      setLinkedUsers(users);
      setLinkedAssets(assets);
      setSuppliers(suppliersData);
      setAllUsers(allUsersList);
    } catch (error) {
      console.error('Error loading license details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [licenseId]);

  const handleUpdate = async (formData: Partial<License>, extra: { asset_ids: string[], user_ids: string[] }) => {
    setIsSaving(true);
    try {
      await api.updateLicense(licenseId, formData);
      
      const currentAssetIds = linkedAssets.map(a => a.id);
      const newAssetIds = extra.asset_ids;

      for (const id of currentAssetIds) {
        if (!newAssetIds.includes(id)) await api.removeAssetFromLicense(licenseId, id);
      }
      for (const id of newAssetIds) {
        if (!currentAssetIds.includes(id)) await api.assignAssetToLicense(licenseId, id);
      }

      const currentUserIds = linkedUsers.map(u => u.id);
      const newUserIds = extra.user_ids;

      for (const id of currentUserIds) {
        if (!newUserIds.includes(id)) await api.removeUserFromLicense(licenseId, id);
      }
      for (const id of newUserIds) {
        if (!currentUserIds.includes(id)) await api.assignUserToLicense(licenseId, id);
      }

      await loadData();
      setIsEditing(false);
      onRefresh();
      showToast('Licence mise à jour avec succès', 'success');
    } catch (error) {
      console.error('Update failed:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chargement de la licence...</p>
      </div>
    );
  }

  if (!license) return <div>Licence introuvable</div>;

  const usedSeats = (license as any).used_seats || 0;
  const ratio = (usedSeats / license.total_seats) * 100;
  const isFull = usedSeats >= license.total_seats;
  const supplier = suppliers.find(s => s.id === license.supplier_id);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      <div className={theme.detailHeader}>
        <div className="flex items-center gap-3 flex-1">
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(theme.detailHeaderIconBox, "bg-indigo-50 text-indigo-600 border-indigo-100")}>
               <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-0">
               <h1 className="text-base font-black text-slate-900 tracking-tight truncate">{license.label}</h1>
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                 <span className={cn(
                   theme.badge,
                   license.status === 'Actif' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                 )}>
                   {license.status}
                 </span>
                 <span className="opacity-30">•</span>
                 <span className="truncate flex items-center gap-1">
                   <Package className="w-3 h-3" /> {license.software}
                 </span>
               </div>
            </div>
          </div>
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(true)}
              className={cn(theme.btnSecondary, "py-1.5 px-3 text-xs")}
            >
              <Edit2 className="w-3.5 h-3.5" /> Modifier
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={theme.detailSection}
            >
              <LicenseForm 
                initialData={license}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
                isSaving={isSaving}
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={theme.detailMainGrid}
            >
              {/* Main Details */}
              <div className={theme.detailContent}>
                {/* License Key Hero */}
                <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[1.5rem] border border-slate-800 relative overflow-hidden group shadow-lg">
                  <div className="absolute top-0 right-0 p-8 opacity-5 scale-125 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                     <ShieldCheck className="w-48 h-48 text-white" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Clé de Licence Officielle</span>
                      <div className="h-[1px] flex-1 bg-white/10" />
                    </div>
                    <div className="text-xl md:text-2xl font-mono font-bold tracking-wider break-all">
                      {license.license_key || 'AUCUNE-CLE-ENREGISTREE'}
                    </div>
                    <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Type d'acquisition</span>
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" /> {license.type}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Date d'expiration</span>
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> {license.end_date ? new Date(license.end_date).toLocaleDateString() : 'Perpétuelle'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignments Section */}
                <div className={theme.detailSection}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100 gap-4">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isFull ? 'bg-red-50 border-red-100 text-red-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500'}`}>
                           {isFull ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                        <div className="space-y-0">
                           <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Occupation des sièges</div>
                           <div className="text-xl font-black text-slate-900 tracking-tight">{usedSeats} / {license.total_seats} Sièges</div>
                        </div>
                     </div>
                     <div className="w-full sm:w-48 space-y-2.5">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tight text-slate-500">
                           <span className={isFull ? 'text-red-500' : 'text-emerald-600'}>{Math.round(ratio)}%</span>
                           <span>Capacité</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${ratio}%` }} />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-4">
                      <div className={theme.detailSectionHeader}>
                        <h3 className={theme.detailSectionTitle}>
                          <UserCheck className="w-3.5 h-3.5" /> Utilisateurs Assignés ({linkedUsers.length})
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {linkedUsers.length > 0 ? linkedUsers.map(user => (
                          <div key={user.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-white rounded-xl transition-all group shadow-sm cursor-pointer">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-black group-hover:scale-110 transition-transform">{user.name.charAt(0)}</div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</div>
                              <div className="text-[9px] text-slate-500 font-medium">{user.email || 'Pas d\'email'}</div>
                            </div>
                          </div>
                        )) : (
                          <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
                            <p className={theme.emptyText}>Aucun utilisateur lié</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={theme.detailSectionHeader}>
                        <h3 className={theme.detailSectionTitle}>
                          <HardDrive className="w-3.5 h-3.5" /> Matériels Liés ({linkedAssets.length})
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {linkedAssets.length > 0 ? linkedAssets.map(asset => {
                          const assetUser = allUsers.find(u => String(u.id) === String(asset.assigned_user_id));
                          
                          return (
                            <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-white rounded-xl transition-all group shadow-sm cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white text-slate-500 rounded-lg flex items-center justify-center transition-all border border-slate-200 group-hover:border-indigo-200 group-hover:text-indigo-600 shadow-sm">
                                  <Package className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{asset.label}</div>
                                  <div className="text-[9px] text-slate-500 font-medium">{asset.serial || asset.inventory_number}</div>
                                </div>
                              </div>
                              {assetUser && (
                                <div className="text-right flex flex-col items-end gap-0.5">
                                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Utilisateur</div>
                                  <div className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{assetUser.name}</div>
                                </div>
                              )}
                            </div>
                          );
                        }) : (
                          <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
                            <p className={theme.emptyText}>Aucun matériel lié</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Details */}
              <div className={theme.detailSidebar}>
                {/* Supplier Info */}
                <div className={theme.detailSection}>
                   <div className={theme.detailSectionHeader}>
                     <h3 className={theme.detailSectionTitle}>Fournisseur</h3>
                   </div>
                   {supplier ? (
                     <div className="space-y-4 mt-4">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center border border-slate-100">
                              <Building2 className="w-6 h-6" />
                           </div>
                           <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 text-base">{supplier.name}</div>
                              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Partenaire agréé</div>
                           </div>
                        </div>
                        <div className="space-y-2.5 pt-4">
                           {supplier.website && (
                             <div className="text-sm font-medium text-slate-600 flex items-center gap-2 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline">{supplier.website}</a>
                             </div>
                           )}
                           <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ce fournisseur est actif
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center py-8 mt-4 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-10 h-10 bg-white text-slate-300 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <p className={theme.emptyText}>Aucun fournisseur rattaché</p>
                     </div>
                   )}
                </div>

                {/* Maintenance / Support */}
                <div className={cn(theme.detailSection, "bg-indigo-600 text-white shadow-xl shadow-indigo-100/50 space-y-6 relative overflow-hidden border-indigo-500")}>
                   <div className="absolute -bottom-6 -right-6 opacity-10">
                      <ShieldCheck className="w-32 h-32" />
                   </div>
                   <div className="relative z-10 space-y-5">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60">Support & Conformité</h3>
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-sm font-bold tracking-tight">Support Standard Actif</span>
                         </div>
                         <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                            <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                              "Cette licence est régulièrement auditée par notre service informatique pour garantir le respect des quotas."
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
