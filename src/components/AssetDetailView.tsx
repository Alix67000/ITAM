import React, { useEffect, useState } from 'react';
import { api, Asset, License, Contract, User, Location } from '../services/api';
import { cn } from '../lib/utils';
import { 
  X, Cpu, Smartphone, Monitor, Printer, HardDrive, Edit2, 
  FileText, Key, MapPin, Calendar, Plus, 
  MousePointer2, Keyboard, Headphones, Speaker, Settings, Network, Trash2, Package, Eye, EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { theme } from '../lib/theme';
import { AssetForm } from './forms/AssetForm';
import { useToast } from '../services/toastContext';

import { useNavigate } from 'react-router-dom';

interface AssetDetailViewProps {
  assetId: string;
  onClose: () => void;
  onRefresh: () => void;
  onEdit?: (asset: Asset) => void;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({ assetId, onClose, onRefresh }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [softwares, setSoftwares] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [allSoftwares, setAllSoftwares] = useState<any[]>([]);
  const [allLicenses, setAllLicenses] = useState<any[]>([]);
  const [allContracts, setAllContracts] = useState<any[]>([]);
  
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [showPassword, setShowPassword] = useState(false);

  const [showSoftwareAdd, setShowSoftwareAdd] = useState(false);
  const [showLicenseAdd, setShowLicenseAdd] = useState(false);
  const [showContractAdd, setShowContractAdd] = useState(false);

  const [events, setEvents] = useState<any[]>([]);
  const [showEventAdd, setShowEventAdd] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const foundAsset = await api.getAsset(assetId);
      if (foundAsset) {
        const [assetContracts, assetSoftwares, assetLicenses, assetEvents, softwaresList, licensesList, contractsList, usersList, locationsList, allAssetsList] = await Promise.all([
          api.getAssetContracts(assetId),
          api.getAssetSoftwares(assetId),
          api.getAssetLicenses(assetId),
          api.getAssetEvents(assetId),
          api.getSoftwares(),
          api.getLicenses(),
          api.getContracts(),
          api.getUsers(),
          api.getLocations(),
          api.getAssets({ fetchAll: true }).then(res => res.assets)
        ]);
        
        // Update all states at once for consistent rendering
        setContracts(assetContracts);
        setSoftwares(assetSoftwares);
        setLicenses(assetLicenses);
        setEvents(assetEvents);
        setAllSoftwares(softwaresList);
        setAllLicenses(licensesList);
        setAllContracts(contractsList);
        setUsers(usersList);
        setLocations(locationsList);
        setAllAssets(allAssetsList);
        setAsset(foundAsset);
      }
    } catch (error) {
      console.error('Error fetching asset details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear asset when ID changes to avoid flickering stale data
    setAsset(null);
    fetchData();
  }, [assetId]);

  const handleUpdate = async (data: Partial<Asset>) => {
    setIsSaving(true);
    try {
      await api.updateAsset(assetId, data);
      await fetchData();
      setIsEditing(false);
      onRefresh();
      showToast('Asset mis à jour avec succès', 'success');
    } catch (err) {
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkSoftware = async (softwareId: string) => {
    try {
      await api.assignAssetToSoftware(softwareId, assetId);
      const updated = await api.getAssetSoftwares(assetId);
      setSoftwares(updated);
      setShowSoftwareAdd(false);
      showToast('Logiciel rattaché', 'success');
    } catch (e) { 
      showToast('Échec du rattachage logiciel', 'error');
    }
  };

  const handleLinkLicense = async (licenseId: string) => {
    try {
      await api.assignAssetToLicense(licenseId, assetId);
      const updated = await api.getAssetLicenses(assetId);
      setLicenses(updated);
      setShowLicenseAdd(false);
    } catch (e) { console.error(e); }
  };

  const handleLinkContract = async (contractId: string) => {
    try {
      await api.assignContractToAsset(assetId, contractId);
      const updated = await api.getAssetContracts(assetId);
      setContracts(updated);
      setShowContractAdd(false);
    } catch (e) { console.error(e); }
  };

  const getAssetIcon = (type: string, size = "w-8 h-8") => {
    switch (type?.toLowerCase()) {
      case 'pc': 
      case 'ordinateur': return <Cpu className={size} />;
      case 'téléphone': 
      case 'mobile': return <Smartphone className={size} />;
      case 'écran': 
      case 'moniteur': return <Monitor className={size} />;
      case 'imprimante': return <Printer className={size} />;
      case 'périphérique': return <MousePointer2 className={size} />;
      case 'réseau': return <Network className={size} />;
      case 'clavier': return <Keyboard className={size} />;
      case 'souris': return <MousePointer2 className={size} />;
      case 'casque': return <Headphones className={size} />;
      case 'haut-parleur': return <Speaker className={size} />;
      case 'autre':
      case 'autres': return <Package className={size} />;
      default: return <Box className={size} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!asset) return null;

  const assignedUser = users.find(u => String(u.id) === String(asset.assigned_user_id));
  const location = locations.find(l => String(l.id) === String(asset.location_id));

  // Auto-linking logic: assets with the same assigned user
  const combinedAssets = asset.assigned_user_id 
    ? allAssets.filter(a => a.id !== assetId && String(a.assigned_user_id) === String(asset.assigned_user_id))
    : [];

  if (isEditing) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-[100] px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-slate-200" />
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">Modifier l'Asset</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{asset.label}</p>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <AssetForm 
            initialData={asset}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
          />
        </div>
      </div>
    );
  }

  let specs: any = {};
  let specsIsJson = false;
  try {
    if (asset?.specs) {
      const parsed = JSON.parse(asset.specs);
      if (typeof parsed === 'object' && parsed !== null) {
        specs = parsed;
        specsIsJson = true;
      }
    }
  } catch (e) {
    specsIsJson = false;
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20 md:pb-0 font-sans">
      <div className={theme.detailHeader}>
        <div className="flex items-center gap-3 flex-1">
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
             <div className={cn(
               theme.detailHeaderIconBox,
               asset.status === 'En service' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
             )}>
                {getAssetIcon(asset.type, "w-5 h-5")}
             </div>
             <div className="min-w-0 flex-1 space-y-0">
                <h1 className="text-base font-black text-slate-900 tracking-tight truncate">{asset.label}</h1>
                <div className="flex items-center flex-wrap gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                  <span className="truncate">S/N: {asset.serial || '---'}</span>
                  {asset.inventory_number && (
                    <>
                      <span className="opacity-30">•</span>
                      <span className="text-blue-600 font-black">{asset.inventory_number}</span>
                    </>
                  )}
                  <span className="opacity-30">•</span>
                  <span className={cn(
                    theme.badge,
                    asset.status === 'En service' ? theme.badgeSuccess : 
                    asset.status === 'Panne' ? theme.badgeDanger : theme.badgeWarning
                  )}>
                    {asset.status}
                  </span>
                </div>
             </div>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className={cn(theme.btnSecondary, "py-1.5 px-3 text-xs")}
        >
          <Edit2 className="w-3.5 h-3.5" /> Modifier
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
        <div className={theme.detailMainGrid}>
          
          {/* Main Column */}
          <div className={theme.detailContent}>
            
             {asset.type?.toLowerCase() === 'consommable' ? (
               <div className={theme.detailSection}>
                 <div className={theme.detailSectionHeader}>
                   <h2 className={theme.detailSectionTitle}>
                     Détails du Consommable
                   </h2>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-0.5">
                     <label className={theme.detailMetaLabel}>Imprimante Liée</label>
                     {asset.printer_asset_id ? (
                       <button 
                         onClick={() => { onClose(); navigate('/assets/' + asset.printer_asset_id); }}
                         className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors hover:underline text-xs block text-left"
                       >
                         {allAssets.find(a => a.id === asset.printer_asset_id)?.label || 'Imprimante'}
                       </button>
                     ) : (
                       <p className={theme.detailMetaValue}>Non définie</p>
                     )}
                   </div>
                   <div className="space-y-0.5">
                     <label className={theme.detailMetaLabel}>Prix</label>
                     <p className={cn(theme.detailMetaValue, "font-mono font-bold")}>{asset.value_euros?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                   </div>
                   <div className="space-y-0.5">
                     <label className={theme.detailMetaLabel}>Identifiant</label>
                     <p className={theme.detailMetaValue}>{asset.account_login || '---'}</p>
                   </div>
                   <div className="space-y-0.5">
                     <label className={theme.detailMetaLabel}>Mot de passe</label>
                     {asset.account_password ? (
                       <div className="flex items-center gap-2">
                         <p className={cn(theme.detailMetaValue, "font-mono")}>
                           {showPassword ? asset.account_password : '••••••••'}
                         </p>
                         <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                           {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                         </button>
                       </div>
                     ) : (
                       <p className={theme.detailMetaValue}>---</p>
                     )}
                   </div>
                   <div className="space-y-0.5 max-w-full">
                     <label className={theme.detailMetaLabel}>Utilisateur Assigné</label>
                     <p className={cn(theme.detailMetaValue, "truncate")}>{assignedUser ? assignedUser.name : 'En stock'}</p>
                   </div>
                   <div className="space-y-0.5 max-w-full">
                     <label className={theme.detailMetaLabel}>Lieu / Stockage</label>
                     <p className={theme.detailMetaValue}>{location ? location.name : 'Non assigné'}</p>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className={theme.detailSection}>
                   <div className={theme.detailSectionHeader}>
                     <h2 className={theme.detailSectionTitle}>
                       Cycle de Vie
                     </h2>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-0.5">
                       <label className={theme.detailMetaLabel}>État</label>
                       <p className={cn(theme.detailMetaValue, "capitalize")}>{asset.condition || 'neuf'}</p>
                     </div>
                     <div className="space-y-0.5">
                       <label className={theme.detailMetaLabel}>Âge estimé</label>
                       <p className={theme.detailMetaValue}>
                         {asset.manufacture_date ? `${Math.floor((new Date().getTime() - new Date(asset.manufacture_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25 * 10) / 0.1)} ans` : '---'}
                       </p>
                     </div>
                     <div className="space-y-0.5">
                       <label className={theme.detailMetaLabel}>Fabrication</label>
                       <p className={theme.detailMetaValue}>{asset.manufacture_date ? new Date(asset.manufacture_date).toLocaleDateString('fr-FR') : '---'}</p>
                     </div>
                     <div className="space-y-0.5">
                       <label className={theme.detailMetaLabel}>Mise en service</label>
                       <p className={theme.detailMetaValue}>{asset.commissioning_date ? new Date(asset.commissioning_date).toLocaleDateString('fr-FR') : '---'}</p>
                     </div>
                   </div>
                 </div>
  
                 <div className={theme.detailSection}>
                   <div className={theme.detailSectionHeader}>
                     <h2 className={theme.detailSectionTitle}>
                       Finance & Garantie
                     </h2>
                   </div>
                   <div className="space-y-3">
                     <div className="flex justify-between items-end border-b border-slate-50 pb-3">
                       <div className="space-y-0.5">
                         <label className={theme.detailMetaLabel}>Valeur d'acquisition</label>
                         <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{asset.value_euros?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                       </div>
                     </div>
                     <div className={cn(
                       "p-3 rounded-lg flex items-center justify-between border",
                       asset.has_warranty ? "bg-emerald-50/50 text-emerald-700 border-emerald-100" : "bg-slate-50/50 text-slate-500 border-slate-100"
                     )}>
                       <div className="space-y-0.5">
                         <p className="text-[9px] font-black uppercase tracking-[0.1em]">Couverture Garantie</p>
                         <p className="text-xs font-bold">{asset.has_warranty ? `Active jusqu'au ${new Date(asset.warranty_end || '').toLocaleDateString('fr-FR')}` : 'Aucune garantie active'}</p>
                       </div>
                       <Key className={cn("w-4 h-4", asset.has_warranty ? "opacity-100 text-emerald-600" : "opacity-30")} />
                     </div>
                   </div>
                 </div>
               </div>
             )}

            {/* Tech Specs Summary */}
            <div className={theme.detailSection}>
              <div className={theme.detailSectionHeader}>
                <h2 className={theme.detailSectionTitle}>Détails Techniques</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {specsIsJson ? (
                  Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="space-y-0.5">
                      <label className={theme.detailMetaLabel}>{key}</label>
                      <p className={theme.detailMetaValue}>{String(value) || '---'}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full">
                    <p className="text-xs font-medium text-slate-600 whitespace-pre-wrap">{asset.specs || 'Aucune spécification technique détaillée'}</p>
                  </div>
                )}
                <div className="space-y-0.5">
                  <label className={theme.detailMetaLabel}>Type précis</label>
                  <p className={theme.detailMetaValue}>{asset.subtype || '---'}</p>
                </div>
              </div>
            </div>

            {/* Software, Licenses, Contracts Sections (Simplified) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Licenses */}
              <div className={theme.detailSection}>
                <div className={theme.detailSectionHeader}>
                  <h3 className={theme.detailSectionTitle}>
                    <Key className="w-4 h-4" /> Licences ({licenses.length})
                  </h3>
                  <button onClick={() => setShowLicenseAdd(!showLicenseAdd)} className={theme.btnIconGhost}><Plus className="w-4 h-4" /></button>
                </div>
                {showLicenseAdd && (
                  <select onChange={(e) => handleLinkLicense(e.target.value)} className={cn(theme.inputBase, "p-2 text-xs")}>
                    <option value="">Lier une licence...</option>
                    {allLicenses.map(l => <option key={l.id} value={l.id}>{l.label} ({l.software})</option>)}
                  </select>
                )}
                <div className="space-y-1">
                  {licenses.map(lic => (
                    <div key={lic.id} className="p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-700 border border-slate-100 flex justify-between">
                      <span>{lic.label}</span>
                      <span className="text-[9px] opacity-60 font-black tracking-widest uppercase">{lic.software}</span>
                    </div>
                  ))}
                  {licenses.length === 0 && !showLicenseAdd && (
                     <div className="text-center py-2 text-xs font-medium text-slate-400 italic">Aucune licence</div>
                  )}
                </div>
              </div>

              {/* Contracts */}
              <div className={theme.detailSection}>
                <div className={theme.detailSectionHeader}>
                  <h3 className={theme.detailSectionTitle}>
                    <FileText className="w-4 h-4" /> Contrats ({contracts.length})
                  </h3>
                  <button onClick={() => setShowContractAdd(!showContractAdd)} className={theme.btnIconGhost}><Plus className="w-4 h-4" /></button>
                </div>
                {showContractAdd && (
                  <select onChange={(e) => handleLinkContract(e.target.value)} className={cn(theme.inputBase, "p-2 text-xs")}>
                    <option value="">Lier un contrat...</option>
                    {allContracts.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                )}
                <div className="space-y-1">
                  {contracts.map(c => {
                    const diffDays = Math.ceil((new Date(c.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    const isExpiring = diffDays > 0 && diffDays <= 30;
                    const isExpired = diffDays <= 0;
                    
                    return (
                      <div key={c.id} className={cn(
                        "p-2 rounded-lg border flex flex-col gap-1",
                        isExpired ? "bg-red-50 border-red-200 text-red-900" : 
                        isExpiring ? "bg-amber-50 border-amber-200 text-amber-900" : 
                        "bg-slate-50 border-slate-200 text-slate-900"
                      )}>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold">{c.label}</span>
                          {(isExpiring || isExpired) && (
                            <span className={cn(
                               theme.badge,
                               isExpired ? theme.badgeDanger : theme.badgeWarning
                            )}>
                              {isExpired ? 'Expiré' : `Expire dans ${diffDays}j`}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-[9px] font-medium opacity-60">
                          <span>{c.reference || c.type}</span>
                          <span>{new Date(c.end_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    );
                  })}
                  {contracts.length === 0 && !showContractAdd && (
                     <div className="text-center py-2 text-xs font-medium text-slate-400 italic">Aucun contrat</div>
                  )}
                </div>
              </div>
            </div>

            {/* Peripherals */}
            <div className={theme.detailSection}>
               <div className={theme.detailSectionHeader}>
                 <h3 className={theme.detailSectionTitle}>
                   <Monitor className="w-4 h-4 text-blue-500" /> Matériels rattachés ({combinedAssets.length})
                 </h3>
               </div>
               
               {combinedAssets.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {combinedAssets.map(child => {
                     return (
                       <div 
                          key={child.id} 
                          className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-2 hover:border-indigo-300 hover:bg-slate-50 transition-all group cursor-pointer"
                          onClick={() => {
                            navigate(`/assets/${child.id}`);
                          }}
                        >
                         <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors border border-slate-100">
                           {getAssetIcon(child.type, "w-4 h-4")}
                         </div>
                         <div className="min-w-0 flex-1 space-y-0">
                           <div className="flex items-center justify-between gap-2">
                             <div className="text-xs font-bold text-slate-900 truncate">{child.label}</div>
                           </div>
                           <div className="flex items-center gap-1.5">
                             <span className={cn(
                               theme.badge,
                               child.status === 'En service' ? theme.badgeSuccess : theme.badgeWarning
                             )}>
                               {child.status}
                             </span>
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                               {child.subtype || child.type}
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Settings className="w-6 h-6 text-slate-300 mb-1" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aucun matériel lié</p>
                 </div>
               )}
            </div>

            {/* Events Section */}
            <div className={cn(theme.detailSection, "relative overflow-hidden group mt-5")}>
               <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                 <Calendar className="w-32 h-32 text-indigo-500" />
               </div>
               
               <div className="flex items-center justify-between mb-4 relative">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                     <Calendar className="w-4 h-4" />
                   </div>
                   <div>
                     <h2 className="text-sm font-bold text-slate-900 tracking-tight">Journal d'événements</h2>
                   </div>
                 </div>
                 <button 
                   onClick={() => setShowEventAdd(true)}
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition shadow-sm"
                 >
                   <Plus className="w-3 h-3" />
                   Ajouter
                 </button>
               </div>

               {showEventAdd && (
                 <motion.form 
                   initial={{ opacity: 0, height: 0 }} 
                   animate={{ opacity: 1, height: 'auto' }}
                   className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl relative"
                   onSubmit={async (e) => {
                     e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     const type = formData.get('type') as string;
                     const author = formData.get('author') as string;
                     const description = formData.get('description') as string;
                     if (!type || !author || !description) return;
                     
                     try {
                       await api.addAssetEvent(assetId, {
                         type,
                         author,
                         description,
                         date: new Date().toISOString()
                       });
                       const updated = await api.getAssetEvents(assetId);
                       setEvents(updated);
                       setShowEventAdd(false);
                       showToast('Événement ajouté', 'success');
                     } catch (err) {
                       showToast("Erreur lors de l'ajout", 'error');
                     }
                   }}
                 >
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opération</label>
                       <select name="type" required className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                         <option value="">Sélectionner...</option>
                         <option value="Affectation">Affectation</option>
                         <option value="Modification">Modification</option>
                         <option value="Déplacement">Déplacement</option>
                         <option value="Retour">Retour</option>
                         <option value="Mise en panne">Signalisation de panne</option>
                         <option value="Mise au rebut">Mise au rebut</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auteur</label>
                       <input name="author" required placeholder="Votre nom" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                     </div>
                     <div className="space-y-2 sm:col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                       <input name="description" required placeholder="Description détaillée..." className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                     </div>
                   </div>
                   <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 mt-4">
                     <button type="button" onClick={() => setShowEventAdd(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-white rounded-lg transition-colors">Annuler</button>
                     <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">Ajouter l'événement</button>
                   </div>
                 </motion.form>
               )}

               {events.length > 0 ? (
                 <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                   {events.map((evt) => (
                     <div key={evt.id} className="relative">
                       <div className="absolute -left-[30px] w-4 h-4 bg-white border-2 border-indigo-200 rounded-full flex items-center justify-center top-1">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                       </div>
                       <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                         <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                           {evt.type}
                         </span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {new Date(evt.date).toLocaleDateString('fr-FR', {
                             day: '2-digit', month: 'short', year: 'numeric',
                             hour: '2-digit', minute: '2-digit'
                           })}
                         </span>
                       </div>
                       <p className="text-sm font-medium text-slate-700 mb-1">{evt.description}</p>
                       <p className="text-[10px] font-black text-slate-400 tracking-wide uppercase">Par {evt.author}</p>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-sm font-bold text-slate-400">Aucun événement enregistré.</p>
                 </div>
               )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className={theme.detailSidebar}>
            <div className={cn(theme.detailSection, "flex flex-col items-center gap-4 text-center")}>
              <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 text-2xl font-black shadow-inner border border-indigo-100">
                {assignedUser ? assignedUser.name.charAt(0) : '?'}
              </div>
              <div className="space-y-1 w-full">
                <p className={theme.detailMetaLabel}>Utilisateur Assigné</p>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">{assignedUser ? assignedUser.name : 'Non assigné'}</h4>
              </div>
              
              <div className="w-full pt-3 mt-1 border-t border-slate-100">
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-400 shadow-sm"><MapPin className="w-4 h-4 text-slate-500" /></div>
                    <div className="text-left space-y-0.5">
                      <p className={theme.detailMetaLabel}>Emplacement</p>
                      <p className="text-xs font-bold text-slate-900">{location ? location.name : 'Stock central'}</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const Box = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
