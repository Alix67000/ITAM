import React, { useEffect, useState } from 'react';
import { api, License, Asset, Supplier } from '../services/api';
import { 
  Key, Calendar, Users, Package, Clock, Building2, 
  ChevronLeft, Edit2, Trash2, ShieldCheck, ShieldAlert,
  ArrowRight, UserCheck, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LicenseForm } from './forms/LicenseForm';

interface LicenseDetailViewProps {
  licenseId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const LicenseDetailView: React.FC<LicenseDetailViewProps> = ({ licenseId, onClose, onRefresh }) => {
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
    } catch (error) {
      console.error('Update failed:', error);
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
    <div className="space-y-8 pb-20">
      {/* Header with back button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">{license.label}</h1>
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                 license.status === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
               }`}>
                 {license.status}
               </span>
            </div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.3em] flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-300" /> {license.software}
            </p>
          </div>
        </div>
        
        {!isEditing && (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl text-sm font-black hover:bg-indigo-50 transition-all"
            >
              <Edit2 className="w-4 h-4" /> Modifier
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100"
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
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* License Key Hero */}
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] relative overflow-hidden group shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                   <ShieldCheck className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Clé de Licence Officielle</span>
                    <div className="h-[1px] flex-1 bg-white/10" />
                  </div>
                  <div className="text-3xl md:text-4xl font-mono font-black tracking-[0.2em] break-all">
                    {license.license_key || 'AUCUNE-CLE-ENREGISTREE'}
                  </div>
                  <div className="flex flex-wrap gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Type d'acquisition</span>
                      <div className="font-bold flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-indigo-400" /> {license.type}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Date d'expiration</span>
                      <div className="font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" /> {license.end_date ? new Date(license.end_date).toLocaleDateString() : 'Perpétuelle'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignments Section */}
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl">
                   <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${isFull ? 'bg-red-50 border-red-200 text-red-500' : 'bg-emerald-50 border-emerald-200 text-emerald-500'}`}>
                         {isFull ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                      </div>
                      <div>
                         <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Occupation des sièges</div>
                         <div className="text-2xl font-black text-slate-900">{usedSeats} / {license.total_seats} Sièges</div>
                      </div>
                   </div>
                   <div className="w-48 space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tight text-slate-400">
                         <span>{Math.round(ratio)}%</span>
                         <span>Capacité</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${ratio}%` }} />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 pb-4 border-b border-slate-50">
                      <UserCheck className="w-4 h-4" /> Utilisateurs Assignés ({linkedUsers.length})
                    </h3>
                    <div className="space-y-4">
                      {linkedUsers.length > 0 ? linkedUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">{user.name.charAt(0)}</div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{user.email || 'Pas d\'email'}</div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-slate-300 italic p-4">Aucun utilisateur lié</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 pb-4 border-b border-slate-50">
                      <HardDrive className="w-4 h-4" /> Matériels Liés ({linkedAssets.length})
                    </h3>
                    <div className="space-y-4">
                      {linkedAssets.length > 0 ? linkedAssets.map(asset => {
                        const assetUser = allUsers.find(u => String(u.id) === String(asset.assigned_user_id));
                        
                        return (
                          <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-all border border-transparent group-hover:border-indigo-100 shadow-sm">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{asset.label}</div>
                                <div className="text-[10px] text-slate-400 font-mono font-medium">{asset.serial || asset.inventory_number}</div>
                              </div>
                            </div>
                            {assetUser && (
                              <div className="text-right">
                                <div className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-0.5">Utilisateur</div>
                                <div className="text-[11px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-1 rounded-lg">{assetUser.name}</div>
                              </div>
                            )}
                          </div>
                        );
                      }) : (
                        <p className="text-xs text-slate-300 italic p-4">Aucun matériel lié</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-8">
              {/* Supplier Info */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 pb-4">Fournisseur</h3>
                 {supplier ? (
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100">
                            <Building2 className="w-7 h-7" />
                         </div>
                         <div>
                            <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{supplier.name}</div>
                            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Partenaire agréé</div>
                         </div>
                      </div>
                      <div className="space-y-3 pt-4">
                         {supplier.website && (
                           <div className="text-xs font-bold text-slate-400 flex items-center gap-2 truncate">
                              <span className="w-1 h-1 rounded-full bg-slate-300" /> {supplier.website}
                           </div>
                         )}
                         <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-slate-300" /> Contact principal lié
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="text-center py-10 space-y-3">
                      <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-300 font-bold italic tracking-tight">Aucun fournisseur rattaché</p>
                   </div>
                 )}
              </div>

              {/* Maintenance / Support */}
              <div className="bg-indigo-600 text-white p-8 rounded-[3rem] shadow-xl shadow-indigo-100 space-y-6 relative overflow-hidden">
                 <div className="absolute -bottom-6 -right-6 opacity-10">
                    <ShieldCheck className="w-32 h-32" />
                 </div>
                 <div className="relative z-10 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Support & Conformité</h3>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span className="text-sm font-bold tracking-tight">Support Standard Actif</span>
                       </div>
                       <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                          <p className="text-[11px] leading-relaxed opacity-70 font-medium italic">
                            "Cette licence est régulièrement auditée par notre service informatique pour garantir le respect des quotas d'installation."
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
  );
};
