import React, { useEffect, useState } from 'react';
import { api, Asset, PhoneLine, User, Location } from '../services/api';
import { cn } from '../lib/utils';
import { Plus, Search, Filter, Cpu, Smartphone, Monitor, Printer, HardDrive, Edit2, Trash2, FileText, X, Key, Phone, Box, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneLineModal } from '../components/PhoneLineModal';
import { AssetDetailView } from '../components/AssetDetailView';
import { AssetCreateView } from '../components/AssetCreateView';
import { useAuth } from '../services/authContext';

export const AssetList: React.FC<{ initialType?: string; initialUserId?: string }> = ({ initialType, initialUserId }) => {
  const { canEdit, canDelete, isViewer } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [phoneLines, setPhoneLines] = useState<PhoneLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(initialType || null);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(initialUserId || null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, month, year
  
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // View mode state
  const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);
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
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsData, phoneLinesData, usersData, locationsData] = await Promise.all([
        api.getAssets(),
        api.getPhoneLines(),
        api.getUsers(),
        api.getLocations()
      ]);
      setAssets(assetsData);
      setPhoneLines(phoneLinesData);
      setUsers(usersData);
      setLocations(locationsData);
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

  const handleDelete = (id: string) => {
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
    const userName = users.find(u => String(u.id) === String(a.assigned_user_id))?.name || '';
    const locationName = locations.find(l => String(l.id) === String(a.location_id))?.name || '';
    
    const matchesSearch = 
      a.label.toLowerCase().includes(search.toLowerCase()) || 
      a.serial?.toLowerCase().includes(search.toLowerCase()) ||
      a.inventory_number?.toLowerCase().includes(search.toLowerCase()) ||
      userName.toLowerCase().includes(search.toLowerCase());
    
    if (selectedUserFilter && a.assigned_user_id !== selectedUserFilter) {
      return false;
    }

    if (selectedStatusFilter && a.status !== selectedStatusFilter) {
      return false;
    }

    if (selectedLocationFilter && a.location_id !== selectedLocationFilter) {
      return false;
    }

    if (dateFilter !== 'all') {
      const addedDate = new Date(a.created_at);
      const now = new Date();
      if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        if (addedDate < monthAgo) return false;
      } else if (dateFilter === 'year') {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        if (addedDate < yearAgo) return false;
      }
    }
    
    if (selectedTypeFilter) {
      const normalizedType = a.type.toLowerCase();
      const filter = selectedTypeFilter.toLowerCase();
      
      const typeMap: Record<string, string[]> = {
        'ordinateurs': ['pc', 'ordinateur'],
        'moniteurs': ['écran', 'moniteur'],
        'matériels réseau': ['réseau', 'network'],
        'périphériques': ['périphérique', 'accessoire', 'souris', 'clavier', 'casque'],
        'imprimantes': ['imprimante'],
        'téléphones': ['téléphone']
      };

      if (typeMap[filter]) {
        return matchesSearch && typeMap[filter].includes(normalizedType);
      }
      
      return matchesSearch && normalizedType === filter;
    }
    
    return matchesSearch;
  }).sort((a, b) => (a.inventory_number || '').localeCompare(b.inventory_number || ''));

  const filteredPhoneLines = phoneLines.filter(p => {
    const matchesSearch = 
      p.label.toLowerCase().includes(search.toLowerCase()) || 
      p.number.includes(search) ||
      p.user_name?.toLowerCase().includes(search.toLowerCase());
    
    if (selectedUserFilter && p.assigned_user_id !== selectedUserFilter) {
      return false;
    }

    if (selectedLocationFilter && p.location_id !== selectedLocationFilter) {
      return false;
    }

    if (selectedTypeFilter) {
      return false; // Hide phone lines if any specific asset type filter is active (especially 'Téléphones')
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
          {(selectedTypeFilter || selectedUserFilter || selectedStatusFilter || selectedLocationFilter || dateFilter !== 'all') && (
            <button 
              onClick={() => {
                setSelectedTypeFilter(null);
                setSelectedUserFilter(null);
                setSelectedStatusFilter(null);
                setSelectedLocationFilter(null);
                setDateFilter('all');
              }}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all hover:border-slate-300 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" /> Effacer
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Série, Label, User..." 
              className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-48 md:w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "p-2 rounded-lg border transition-all",
              showAdvancedFilters ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
            title="Filtres avancés"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button 
            disabled={isViewer}
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Nouvel Asset
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Statut</label>
                <select 
                  value={selectedStatusFilter || ''} 
                  onChange={(e) => setSelectedStatusFilter(e.target.value || null)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none"
                >
                  <option value="">Tous les statuts</option>
                  <option value="Stock">En Stock</option>
                  <option value="En service">En Service</option>
                  <option value="Panne">En Panne</option>
                  <option value="Réforme">Réformé</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Utilisateur</label>
                <select 
                  value={selectedUserFilter || ''} 
                  onChange={(e) => setSelectedUserFilter(e.target.value || null)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none"
                >
                  <option value="">Tous les utilisateurs</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Entité</label>
                <select 
                  value={selectedLocationFilter || ''} 
                  onChange={(e) => setSelectedLocationFilter(e.target.value || null)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none"
                >
                  <option value="">Toutes les entités</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date d'ajout</label>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none"
                >
                  <option value="all">Toutes dates</option>
                  <option value="month">Dernier mois</option>
                  <option value="year">Dernière année</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <tr className="border-b border-slate-100">
              <th className="px-8 py-4 font-semibold text-left">N° Inventaire</th>
              <th className="px-8 py-4 font-semibold">Asset / Cycle de vie</th>
              <th className="px-8 py-4 font-semibold">Affectation</th>
              <th className="px-8 py-4 font-semibold">Acquisition</th>
              <th className="px-8 py-4 font-semibold">Finance & Garantie</th>
              <th className="px-8 py-4 font-semibold text-center">État</th>
              <th className="px-8 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {[...filtered].sort((a, b) => (b.inventory_number || '').localeCompare(a.inventory_number || '')).map((asset, idx) => {
              const assignedUser = users.find(u => String(u.id) === String(asset.assigned_user_id));
              const location = locations.find(l => String(l.id) === String(asset.location_id));
              
              return (
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
                    <div className="flex flex-col">
                      <span className="font-mono font-black text-blue-600 text-xs tracking-tight">{asset.inventory_number || '---'}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{asset.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-all">{asset.label}</div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tighter">{asset.subtype}</span>
                          </div>
                          {asset.manufacture_date && (
                            <div className="text-[9px] text-slate-400">
                               Fab: {new Date(asset.manufacture_date).toLocaleDateString('fr-FR')} 
                               {asset.commissioning_date && ` • MES: ${new Date(asset.commissioning_date).toLocaleDateString('fr-FR')}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    {assignedUser ? (
                      <div className="flex flex-col">
                         <span className="font-bold text-slate-900 text-xs">{assignedUser.name}</span>
                         <span className="text-[10px] text-slate-400 flex items-center gap-1">
                           <MapPin className="w-2.5 h-2.5" /> {location ? location.name : 'Stock'}
                         </span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                         <span className="text-slate-300 italic text-[10px]">Non affecté</span>
                         <span className="text-[10px] text-slate-400 flex items-center gap-1">
                           <MapPin className="w-2.5 h-2.5" /> {location ? location.name : 'Stock'}
                         </span>
                      </div>
                    )}
                  </td>
                <td className="px-8 py-4">
                  <div className="flex flex-col">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block w-fit mb-1",
                      asset.condition === 'neuf' ? 'bg-emerald-50 text-emerald-600' :
                      asset.condition === 'occasion' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                    )}>
                      {asset.condition || 'neuf'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono italic">{asset.serial || 'S/N: ---'}</span>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-slate-900">{asset.value_euros?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                    {asset.has_warranty ? (
                       <span className="text-[9px] text-blue-600 font-bold">Garantie au {new Date(asset.warranty_end || '').toLocaleDateString('fr-FR')}</span>
                    ) : (
                       <span className="text-[9px] text-slate-300">Sans garantie</span>
                    )}
                  </div>
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
            );
          })}

            {/* Display Phone Lines in the same list when applicable */}
            {filteredPhoneLines.map((line, idx) => {
              const assignedUser = users.find(u => String(u.id) === String(line.assigned_user_id));
              const location = locations.find(l => String(l.id) === String(line.location_id));
              
              return (
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
                    {location?.name || <span className="opacity-30">---</span>}
                  </td>
                  <td className="px-8 py-4">
                    {assignedUser ? (
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                           {assignedUser.name.charAt(0)}
                         </div>
                         <span className="font-medium text-slate-900">{assignedUser.name}</span>
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
            );
          })}

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
          {filtered.map((asset) => {
            const assignedUser = users.find(u => String(u.id) === String(asset.assigned_user_id));
            
            return (
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
                     {assignedUser ? (
                       <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[8px] font-black border border-blue-100">
                            {assignedUser.name.charAt(0)}
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{assignedUser.name}</span>
                       </div>
                     ) : (
                       <span className="text-[10px] italic text-slate-300">Non affecté</span>
                     )}
                     <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                           {asset.contract_count ? asset.contract_count > 0 && <FileText className="w-3 h-3 text-blue-400" /> : null}
                           {asset.software_count ? asset.software_count > 0 && <Box className="w-3 h-3 text-emerald-400" /> : null}
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPhoneLines.map((line) => {
            const assignedUser = users.find(u => String(u.id) === String(line.assigned_user_id));
            
            return (
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
                     {assignedUser ? (
                       <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-black border border-indigo-100">
                            {assignedUser.name.charAt(0)}
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{assignedUser.name}</span>
                       </div>
                     ) : (
                       <span className="text-[10px] italic text-slate-300">Non affecté</span>
                     )}
                  </div>
                </div>
              </div>
            );
          })}

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

