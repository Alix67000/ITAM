import React, { useEffect, useState } from 'react';
import { api, Asset, PhoneLine } from '../services/api';
import { cn } from '../lib/utils';
import { Plus, Search, Filter, Cpu, Smartphone, Monitor, Printer, HardDrive, Edit2, Trash2, FileText, X, Key, Phone, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneLineModal } from '../components/PhoneLineModal';
import { AssetDetailView } from '../components/AssetDetailView';
import { AssetCreateView } from '../components/AssetCreateView';
import { useAuth } from '../services/authContext';

export const AssetList: React.FC<{ initialType?: string; initialUserId?: number }> = ({ initialType, initialUserId }) => {
  const { canEdit, canDelete, isViewer } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [phoneLines, setPhoneLines] = useState<PhoneLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(initialType || null);
  const [selectedUserFilter, setSelectedUserFilter] = useState<number | null>(initialUserId || null);
  
  // View mode state
  const [viewingAssetId, setViewingAssetId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Update filter when initialType or initialUserId changes
  useEffect(() => {
    setSelectedTypeFilter(initialType || null);
    setSelectedUserFilter(initialUserId || null);
    setViewingAssetId(null); // Close view when changing filters
  }, [initialType, initialUserId]);

  // Modal state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedPhoneLine, setSelectedPhoneLine] = useState<PhoneLine | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsData, phoneLinesData] = await Promise.all([
        api.getAssets(),
        api.getPhoneLines()
      ]);
      setAssets(assetsData);
      setPhoneLines(phoneLinesData);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (asset: Asset) => {
    if (!canEdit) return;
    setViewingAssetId(asset.id);
  };

  const handleEditPhone = (line: PhoneLine) => {
    if (!canEdit) return;
    setSelectedPhoneLine(line);
    setIsPhoneModalOpen(true);
  };

  const handleCreate = () => {
    if (isViewer) return;
    setIsCreating(true);
  };

  const confirmDelete = async () => {
    if (assetToDelete && canDelete) {
      await api.deleteAsset(assetToDelete);
      setAssetToDelete(null);
      setIsConfirmOpen(false);
      fetchData();
    }
  };

  const handleDelete = (id: number) => {
    if (!canDelete) return;
    setAssetToDelete(id);
    setIsConfirmOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pc': return <Cpu className="w-4 h-4" />;
      case 'téléphone': return <Smartphone className="w-4 h-4" />;
      case 'écran': return <Monitor className="w-4 h-4" />;
      case 'imprimante': return <Printer className="w-4 h-4" />;
      default: return <HardDrive className="w-4 h-4" />;
    }
  };

  const filtered = assets.filter(a => {
    const matchesSearch = 
      a.label.toLowerCase().includes(search.toLowerCase()) || 
      a.serial?.toLowerCase().includes(search.toLowerCase()) ||
      a.user_name?.toLowerCase().includes(search.toLowerCase());
    
    if (selectedUserFilter && a.assigned_user_id !== selectedUserFilter) {
      return false;
    }
    
    if (selectedTypeFilter) {
      // Mapping user-friendly names to database types if necessary
      // For now we assume the filter matches the type exactly or we normalize
      const normalizedType = a.type.toLowerCase();
      const filter = selectedTypeFilter.toLowerCase();
      
      // Some mappings if the values from the menu don't match the DB exactly
      const typeMap: Record<string, string[]> = {
        'ordinateurs': ['pc', 'ordinateur'],
        'moniteurs': ['écran', 'moniteur'],
        'matériels réseau': ['réseau', 'network'],
        'péripheriques': ['périphérique', 'accessoire'],
        'imprimante': ['imprimante'],
        'telephones': ['téléphone']
      };

      if (typeMap[filter]) {
        return matchesSearch && typeMap[filter].includes(normalizedType);
      }
      
      return matchesSearch && normalizedType === filter;
    }
    
    return matchesSearch;
  });

  const filteredPhoneLines = phoneLines.filter(p => {
    const matchesSearch = 
      p.label.toLowerCase().includes(search.toLowerCase()) || 
      p.number.includes(search) ||
      p.user_name?.toLowerCase().includes(search.toLowerCase());
    
    if (selectedUserFilter && p.assigned_user_id !== selectedUserFilter) {
      return false;
    }

    if (selectedTypeFilter && selectedTypeFilter.toLowerCase() !== 'téléphones') {
      return false; // Phone lines only show in global or when 'telephones' is selected or when user filter is active
    }

    return matchesSearch;
  });

  if (loading && assets.length === 0 && phoneLines.length === 0) return <div className="text-sm font-sans text-slate-400 p-12 text-center animate-pulse italic">Synchronisation de la base de données...</div>;

  if (viewingAssetId) {
    return (
      <AssetDetailView 
        assetId={viewingAssetId} 
        onClose={() => setViewingAssetId(null)} 
        onEdit={(asset) => {
          setViewingAssetId(null);
          handleEdit(asset);
        }}
        onRefresh={fetchData}
      />
    );
  }

  if (isCreating) {
    return (
      <AssetCreateView 
        onClose={() => setIsCreating(false)}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PhoneLineModal 
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={fetchData}
        phoneLine={selectedPhoneLine}
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsConfirmOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200">
               <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                 <Trash2 className="w-6 h-6" />
               </div>
               <h3 className="font-bold text-slate-900 text-lg mb-2">Confirmer la suppression</h3>
               <p className="text-sm text-slate-500 mb-6">Cette action est irréversible. L'historique lié à cet asset sera également supprimé.</p>
               <div className="flex gap-3">
                  <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100">Supprimer</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">
            {selectedTypeFilter 
              ? `Inventaire : ${selectedTypeFilter.charAt(0).toUpperCase() + selectedTypeFilter.slice(1)}` 
              : selectedUserFilter
                ? `Matériel & Lignes assignés`
                : 'Inventaire Global'}
          </h2>
          <p className="text-xs text-slate-500">
            {selectedTypeFilter 
              ? `Affichage des matériels de type ${selectedTypeFilter}.` 
              : selectedUserFilter
                ? `Affichage du matériel et des lignes téléphoniques pour l'utilisateur sélectionné.`
                : `Gestion et suivi des ${assets.length + phoneLines.length} éléments répertoriés.`}
          </p>
        </div>
        <div className="flex gap-3">
          {(selectedTypeFilter || selectedUserFilter) && (
            <button 
              onClick={() => {
                setSelectedTypeFilter(null);
                setSelectedUserFilter(null);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all hover:border-slate-300"
            >
              <X className="w-3.5 h-3.5" /> Effacer le filtre
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Série, Label, User..." 
              className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            disabled={isViewer}
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Nouvel Asset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <tr className="border-b border-slate-100">
              <th className="px-8 py-4 font-semibold">Matériel</th>
              <th className="px-8 py-4 font-semibold">Identifiant</th>
              <th className="px-8 py-4 font-semibold">Entité</th>
              <th className="px-8 py-4 font-semibold">Affecté à</th>
              <th className="px-8 py-4 font-semibold text-center">État</th>
              <th className="px-8 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.map((asset, idx) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={`asset-${asset.id}`} 
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button')) return;
                  setViewingAssetId(asset.id);
                }}
                className="hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200">
                      {getTypeIcon(asset.type)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-all">{asset.label}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="text-[10px] text-slate-400 uppercase font-mono tracking-tighter">{asset.type} {asset.subtype ? `• ${asset.subtype}` : ''}</div>
                        {asset.contract_count ? asset.contract_count > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold border border-blue-100" title="Contrats">
                            <FileText className="w-2.5 h-2.5" />
                            {asset.contract_count}
                          </div>
                        ) : null}
                        {asset.software_count ? asset.software_count > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold border border-emerald-100" title="Logiciels">
                            <FileText className="w-2.5 h-2.5" />
                            {asset.software_count}
                          </div>
                        ) : null}
                        {asset.license_count ? asset.license_count > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold border border-indigo-100" title="Licences">
                            <Key className="w-2.5 h-2.5" />
                            {asset.license_count}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4 font-mono text-[11px] text-slate-500">
                  {asset.serial || 'N/A'}
                </td>
                <td className="px-8 py-4 text-slate-600">
                  {asset.location_name || <span className="opacity-30">---</span>}
                </td>
                <td className="px-8 py-4">
                  {asset.user_name ? (
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                         {asset.user_name.charAt(0)}
                       </div>
                       <span className="font-medium text-slate-900">{asset.user_name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 italic text-xs">Non affecté</span>
                  )}
                </td>
                <td className="px-8 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase inline-block min-w-[80px] ${
                    asset.status === 'Stock' ? 'bg-blue-100 text-blue-700' : 
                    asset.status === 'Panne' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                       <button 
                         disabled={!canDelete}
                         onClick={() => handleDelete(asset.id)}
                         className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                         title="Supprimer"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                </td>
              </motion.tr>
            ))}

            {/* Display Phone Lines in the same list when applicable */}
            {filteredPhoneLines.map((line, idx) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (filtered.length + idx) * 0.05 }}
                key={`phone-${line.id}`} 
                className="hover:bg-slate-50 transition-colors group border-l-4 border-l-indigo-400"
              >
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-white transition-colors border border-transparent group-hover:border-indigo-200">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-all">{line.label}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="text-[10px] text-slate-400 uppercase font-mono tracking-tighter">Ligne Téléphonique</div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4 font-mono text-[11px] text-slate-500">
                  {line.number}
                </td>
                <td className="px-8 py-4 text-slate-600">
                  {line.location_name || <span className="opacity-30">---</span>}
                </td>
                <td className="px-8 py-4">
                  {line.user_name ? (
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                         {line.user_name.charAt(0)}
                       </div>
                       <span className="font-medium text-slate-900">{line.user_name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 italic text-xs">Non affecté</span>
                  )}
                </td>
                <td className="px-8 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase inline-block min-w-[80px] ${
                    line.status === 'Actif' ? 'bg-emerald-100 text-emerald-700' : 
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {line.status}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                       {/* Actions (Delete only if needed) */}
                    </div>
                </td>
              </motion.tr>
            ))}

            {filtered.length === 0 && filteredPhoneLines.length === 0 && !loading && (
               <tr>
                 <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic text-sm">
                   Aucun matériel ou ligne ne correspond à votre recherche.
                 </td>
               </tr>
            )}
          </tbody>
        </table>

        {/* Mobile Card List - Mobile Only */}
        <div className="md:hidden divide-y divide-slate-100 h-full">
          {filtered.map((asset) => (
            <div 
              key={`asset-card-${asset.id}`}
              onClick={() => setViewingAssetId(asset.id)}
              className="p-4 active:bg-slate-50 transition-colors flex gap-4"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 flex-shrink-0">
                {getTypeIcon(asset.type)}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 truncate pr-2">{asset.label}</h3>
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                    asset.status === 'Stock' ? 'bg-blue-100 text-blue-700' : 
                    asset.status === 'Panne' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  )}>
                    {asset.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                  <span className="uppercase">{asset.type}</span>
                  {asset.serial && <span>• {asset.serial}</span>}
                </div>
                <div className="flex items-center justify-between pt-1">
                   {asset.user_name ? (
                     <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[8px] font-black border border-blue-100">
                          {asset.user_name.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{asset.user_name}</span>
                     </div>
                   ) : (
                     <span className="text-[10px] italic text-slate-300">Non affecté</span>
                   )}
                   <div className="flex gap-1">
                      {asset.contract_count ? asset.contract_count > 0 && <FileText className="w-3 h-3 text-blue-400" /> : null}
                      {asset.software_count ? asset.software_count > 0 && <Box className="w-3 h-3 text-emerald-400" /> : null}
                   </div>
                </div>
              </div>
            </div>
          ))}

          {filteredPhoneLines.map((line) => (
            <div 
              key={`phone-card-${line.id}`}
              onClick={() => handleEditPhone(line)}
              className="p-4 active:bg-slate-50 transition-colors flex gap-4 border-l-4 border-l-indigo-400"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 truncate pr-2">{line.label}</h3>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter bg-emerald-100 text-emerald-700">
                    {line.status}
                  </span>
                </div>
                <div className="text-[10px] text-indigo-500 font-mono font-bold tracking-tight">
                  {line.number}
                </div>
                <div className="flex items-center justify-between pt-1">
                   {line.user_name ? (
                     <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-black border border-indigo-100">
                          {line.user_name.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{line.user_name}</span>
                     </div>
                   ) : (
                     <span className="text-[10px] italic text-slate-300">Non affecté</span>
                   )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && filteredPhoneLines.length === 0 && !loading && (
             <div className="p-12 text-center text-slate-400 italic text-xs">
               Aucun résultat trouvé.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

