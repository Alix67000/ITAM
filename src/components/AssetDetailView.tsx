import React, { useEffect, useState } from 'react';
import { api, Asset, License, Contract } from '../services/api';
import { cn } from '../lib/utils';
import { 
  X, Cpu, Smartphone, Monitor, Printer, HardDrive, Edit2, 
  FileText, Key, MapPin, Calendar, Plus, 
  MousePointer2, Keyboard, Headphones, Speaker, Settings, Network, Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { AssetForm } from './forms/AssetForm';
import { useToast } from '../services/toastContext';

interface AssetDetailViewProps {
  assetId: number;
  onClose: () => void;
  onRefresh: () => void;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({ assetId, onClose, onRefresh }) => {
  const { showToast } = useToast();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [softwares, setSoftwares] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [linkedAssets, setLinkedAssets] = useState<Asset[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [allSoftwares, setAllSoftwares] = useState<any[]>([]);
  const [allLicenses, setAllLicenses] = useState<any[]>([]);
  const [allContracts, setAllContracts] = useState<any[]>([]);
  
  const [showSoftwareAdd, setShowSoftwareAdd] = useState(false);
  const [showLicenseAdd, setShowLicenseAdd] = useState(false);
  const [showContractAdd, setShowContractAdd] = useState(false);
  const [showAssetLink, setShowAssetLink] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const assets = await api.getAssets();
      setAllAssets(assets);
      const foundAsset = assets.find(a => a.id === assetId);
      if (foundAsset) {
        setAsset(foundAsset);
        const [assetContracts, assetSoftwares, assetLicenses, assetChildren, softwaresList, licensesList, contractsList] = await Promise.all([
          api.getAssetContracts(assetId),
          api.getAssetSoftwares(assetId),
          api.getAssetLicenses(assetId),
          api.getAssetChildren(assetId),
          api.getSoftwares(),
          api.getLicenses(),
          api.getContracts()
        ]);
        setContracts(assetContracts);
        setSoftwares(assetSoftwares);
        setLicenses(assetLicenses);
        setLinkedAssets(assetChildren);
        setAllSoftwares(softwaresList);
        setAllLicenses(licensesList);
        setAllContracts(contractsList);
      }
    } catch (error) {
      console.error('Error fetching asset details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleLinkSoftware = async (softwareId: number) => {
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

  const handleLinkLicense = async (licenseId: number) => {
    try {
      await api.assignAssetToLicense(licenseId, assetId);
      const updated = await api.getAssetLicenses(assetId);
      setLicenses(updated);
      setShowLicenseAdd(false);
    } catch (e) { console.error(e); }
  };

  const handleLinkContract = async (contractId: number) => {
    try {
      await api.assignContractToAsset(assetId, contractId);
      const updated = await api.getAssetContracts(assetId);
      setContracts(updated);
      setShowContractAdd(false);
    } catch (e) { console.error(e); }
  };

  const handleLinkAsset = async (childId: number) => {
    try {
      await api.linkAsset(assetId, childId);
      const updated = await api.getAssetChildren(assetId);
      setLinkedAssets(updated);
      setShowAssetLink(false);
      showToast('Matériel rattaché', 'success');
    } catch (e) { 
      showToast('Échec du rattachage', 'error');
    }
  };

  const handleUnlinkAsset = async (childId: number) => {
    if (!confirm('Voulez-vous vraiment détacher ce matériel ?')) return;
    try {
      await api.unlinkAsset(assetId, childId);
      const updated = await api.getAssetChildren(assetId);
      setLinkedAssets(updated);
      showToast('Matériel détaché', 'success');
    } catch (e) {
      showToast('Échec du détachage', 'error');
    }
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
      default: return <Box className={size} />;
    }
  };

  if (loading && !asset) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!asset) return null;

  if (isEditing) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-[100] px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
              <X className="w-6 h-6" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Modifier l'Asset</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asset.label}</p>
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
             <div className={cn(
               "p-2 md:p-3 rounded-xl md:rounded-2xl flex-shrink-0",
               asset.status === 'En service' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
             )}>
                {getAssetIcon(asset.type)}
             </div>
             <div className="min-w-0 flex-1">
                <h1 className="text-base md:text-2xl font-black text-slate-900 tracking-tight truncate">{asset.label}</h1>
                <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 md:gap-2">
                  <span className="truncate">S/N: {asset.serial}</span>
                  {asset.inventory_number && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-indigo-600 font-black">INV: {asset.inventory_number}</span>
                    </>
                  )}
                  <span className="hidden sm:inline">•</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] md:text-[10px]",
                    asset.status === 'En service' ? 'bg-emerald-50 text-emerald-600' : 
                    asset.status === 'Panne' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  )}>
                    {asset.status}
                  </span>
                </div>
             </div>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <Edit2 className="w-3 h-3" /> Modifier
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">
            
            {/* Life Cycle & Finance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cycle de Vie</h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">État</label>
                    <p className="font-bold text-slate-900 capitalize">{asset.condition || 'neuf'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Âge</label>
                    <p className="font-bold text-slate-900">
                      {asset.manufacture_date ? `${Math.floor((new Date().getTime() - new Date(asset.manufacture_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25 * 10) / 0.1)} ans` : '---'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fabrication</label>
                    <p className="font-bold text-slate-900 text-sm">{asset.manufacture_date ? new Date(asset.manufacture_date).toLocaleDateString('fr-FR') : '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mise en service</label>
                    <p className="font-bold text-slate-900 text-sm">{asset.commissioning_date ? new Date(asset.commissioning_date).toLocaleDateString('fr-FR') : '---'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Finance & Garantie</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Valeur d'acquisition</label>
                      <p className="text-2xl font-black text-slate-900 font-mono">{asset.value_euros?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                    </div>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl flex items-center justify-between",
                    asset.has_warranty ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                  )}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Garantie</p>
                      <p className="text-xs font-bold">{asset.has_warranty ? `Active jusqu'au ${new Date(asset.warranty_end || '').toLocaleDateString('fr-FR')}` : 'Aucune garantie active'}</p>
                    </div>
                    <Key className={cn("w-5 h-5", asset.has_warranty ? "opacity-100" : "opacity-20")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tech Specs Summary */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Détails Techniques</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-8">
                {specsIsJson ? (
                  Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{key}</label>
                      <p className="font-bold text-slate-900 text-sm md:text-base">{String(value) || '---'}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full">
                    <p className="text-sm font-medium text-slate-600 whitespace-pre-wrap">{asset.specs || 'Aucune spécification technique détaillée'}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Type précis</label>
                  <p className="font-bold text-slate-900 text-sm md:text-base">{asset.subtype || '---'}</p>
                </div>
              </div>
            </div>

            {/* Software, Licenses, Contracts Sections (Simplified) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Licenses */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" /> Licences ({licenses.length})
                  </h3>
                  <button onClick={() => setShowLicenseAdd(!showLicenseAdd)} className="p-1.5 hover:bg-slate-50 rounded-lg"><Plus className="w-3 h-3" /></button>
                </div>
                {showLicenseAdd && (
                  <select onChange={(e) => handleLinkLicense(Number(e.target.value))} className="w-full p-2 text-xs border rounded-lg">
                    <option value="">Lier une licence...</option>
                    {allLicenses.map(l => <option key={l.id} value={l.id}>{l.label} ({l.software})</option>)}
                  </select>
                )}
                <div className="space-y-2">
                  {licenses.map(lic => (
                    <div key={lic.id} className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-100 flex justify-between">
                      <span>{lic.label}</span>
                      <span className="text-[8px] opacity-50">{lic.software}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contracts */}
              <div className="bg-indigo-900 rounded-3xl p-6 border border-indigo-800 shadow-xl text-white space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-800/50 pb-3">
                  <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Contrats ({contracts.length})
                  </h3>
                  <button onClick={() => setShowContractAdd(!showContractAdd)} className="p-1.5 hover:bg-white/10 rounded-lg"><Plus className="w-3 h-3" /></button>
                </div>
                {showContractAdd && (
                  <select onChange={(e) => handleLinkContract(Number(e.target.value))} className="w-full p-2 text-xs border rounded-lg bg-indigo-950 text-white">
                    <option value="">Lier un contrat...</option>
                    {allContracts.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                )}
                <div className="space-y-2">
                  {contracts.map(c => (
                    <div key={c.id} className="p-3 bg-indigo-800/50 rounded-xl text-xs font-bold border border-indigo-700 flex flex-col gap-1">
                      <span>{c.label}</span>
                      <div className="flex justify-between text-[8px] opacity-60">
                        <span>{c.reference}</span>
                        <span>{c.end_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Peripherals */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
               <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Monitor className="w-4 h-4 text-blue-500" /> Matériels rattachés ({linkedAssets.length})
                 </h3>
                 <button 
                   onClick={() => setShowAssetLink(!showAssetLink)}
                   className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 group transition-all"
                 >
                   <Plus className={cn("w-4 h-4 transition-transform", showAssetLink && "rotate-45")} />
                 </button>
               </div>

               {showAssetLink && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                 >
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Lier un matériel existant</label>
                   <select 
                     onChange={(e) => e.target.value && handleLinkAsset(Number(e.target.value))}
                     className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                   >
                     <option value="">Sélectionner un asset...</option>
                     {allAssets
                       .filter(a => a.id !== assetId && !linkedAssets.some(la => la.id === a.id) && (a.type === 'Écran' || a.type === 'Périphérique'))
                       .map(a => (
                         <option key={a.id} value={a.id}>{a.label} ({a.type} - {a.serial})</option>
                       ))
                     }
                   </select>
                 </motion.div>
               )}
               
               {linkedAssets.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {linkedAssets.map(child => (
                     <div key={child.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4 hover:border-blue-200 hover:bg-blue-50/10 transition-all group">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm border border-slate-50 transition-colors">
                         {getAssetIcon(child.type, "w-6 h-6")}
                       </div>
                       <div className="min-w-0 flex-1 space-y-1">
                         <div className="flex items-center justify-between gap-2">
                           <div className="text-sm font-bold text-slate-900 truncate">{child.label}</div>
                           <span className={cn(
                             "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                             child.status === 'En service' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                           )}>
                             {child.status}
                           </span>
                         </div>
                         <div className="flex flex-col gap-0.5">
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{child.subtype || child.type}</div>
                           {child.serial && (
                             <div className="text-[9px] font-mono text-slate-400">S/N: {child.serial}</div>
                           )}
                         </div>
                       </div>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleUnlinkAsset(child.id);
                         }}
                         className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                    <Settings className="w-10 h-10 text-slate-100 mb-2" />
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">Aucun matériel lié</p>
                 </div>
               )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8 order-1 lg:order-2">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-slate-200">
                {asset.user_name ? asset.user_name.charAt(0) : '?'}
              </div>
              <div className="text-center space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilisateur Assigné</p>
                <h4 className="text-xl font-bold text-slate-900">{asset.user_name || 'Non assigné'}</h4>
              </div>
              <div className="w-full pt-6 border-t border-slate-50 space-y-4">
                 <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">Emplacement</p>
                      <p className="text-xs font-bold text-slate-900">{asset.location_name || 'Stock central'}</p>
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
