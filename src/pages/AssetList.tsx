import React, { useEffect, useState } from 'react';
import { api, Asset, PhoneLine, User, Location } from '../services/api';
import { cn } from '../lib/utils';
import { theme } from '../lib/theme';
import { Plus, Search, Filter, Cpu, Smartphone, Monitor, Printer, HardDrive, Edit2, Trash2, FileText, X, Key, Phone, Box, MapPin, Package, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneLineModal } from '../components/PhoneLineModal';
import { AssetDetailView } from '../components/AssetDetailView';
import { AssetCreateView } from '../components/AssetCreateView';
import { useAuth } from '../services/authContext';
import { exportAssetListToPDF } from '../services/pdfService';

import { useLocation, useNavigate } from 'react-router-dom';

export const AssetList: React.FC<{ initialType?: string; initialUserId?: string }> = ({ initialType, initialUserId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const queryType = queryParams.get('type') || initialType;
  const queryUserId = queryParams.get('user') || initialUserId;
  
  const { canEdit, canDelete, isViewer } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [phoneLines, setPhoneLines] = useState<PhoneLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(queryType || null);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(queryUserId || null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, month, year
  
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // View mode state
  const [isCreating, setIsCreating] = useState(false);

  // Update filter when URL params or initial props change
  useEffect(() => {
    setSelectedTypeFilter(queryType || null);
    setSelectedUserFilter(queryUserId || null);
  }, [queryType, queryUserId]);

  // Modal state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedPhoneLine, setSelectedPhoneLine] = useState<PhoneLine | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const [historyDocs, setHistoryDocs] = useState<any[]>([]); // To store prev pages
  const [currentLastDoc, setCurrentLastDoc] = useState<any>(undefined);
  const [hasMore, setHasMore] = useState(false);

  const fetchData = async (page = 1, lastVisible?: any) => {
    setLoading(true);
    try {
      const isFiltering = search || selectedTypeFilter || selectedUserFilter || selectedStatusFilter || selectedLocationFilter || dateFilter !== 'all';

      // Always load related data
      const [phoneLinesData, usersData, locationsData] = await Promise.all([
        api.getPhoneLines(),
        api.getUsers(),
        api.getLocations()
      ]);
      setPhoneLines(phoneLinesData);
      setUsers(usersData);
      setLocations(locationsData);

      // Load assets
      // If filtering, load all and paginate on client side
      // Otherwise use Firestore pagination
      const assetsResponse = await api.getAssets({
        fetchAll: Boolean(isFiltering),
        limitCount: isFiltering ? undefined : PAGE_SIZE,
        lastDoc: lastVisible
      });

      setAssets(assetsResponse.assets);
      setHasMore(assetsResponse.hasMore);
      setCurrentLastDoc(assetsResponse.lastDoc);
      setCurrentPage(page);

    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset pagination when filter changes
    setHistoryDocs([]);
    fetchData(1);
  }, [search, selectedTypeFilter, selectedUserFilter, selectedStatusFilter, selectedLocationFilter, dateFilter]);

  const handleNextPage = () => {
    const isFiltering = search || selectedTypeFilter || selectedUserFilter || selectedStatusFilter || selectedLocationFilter || dateFilter !== 'all';
    if (isFiltering) {
      setCurrentPage(prev => prev + 1);
    } else if (hasMore) {
      setHistoryDocs(prev => [...prev, currentLastDoc]);
      fetchData(currentPage + 1, currentLastDoc);
    }
  };

  const handlePrevPage = () => {
    const isFiltering = search || selectedTypeFilter || selectedUserFilter || selectedStatusFilter || selectedLocationFilter || dateFilter !== 'all';
    if (isFiltering) {
      if (currentPage > 1) setCurrentPage(prev => prev - 1);
    } else if (currentPage > 1) {
      const newHistory = [...historyDocs];
      newHistory.pop(); // remove current last
      const prevLast = newHistory.length > 0 ? newHistory[newHistory.length - 1] : undefined;
      setHistoryDocs(newHistory);
      fetchData(currentPage - 1, prevLast);
    }
  };

  const handleEdit = (asset: Asset) => {
    if (!canEdit) return;
    navigate('/assets/' + asset.id);
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
      case 'autre':
      case 'autres': return <Package className="w-4 h-4" />;
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
        'ordinateurs': ['pc', 'ordinateur', 'laptop', 'desktop', 'serveur'],
        'moniteurs': ['écran', 'moniteur', 'monitor', 'display'],
        'matériels réseau': ['réseau', 'network', 'switch', 'routeur', 'borne'],
        'périphériques': ['périphérique', 'accessoire', 'souris', 'clavier', 'casque', 'webcam', 'dock'],
        'imprimantes': ['imprimante', 'printer', 'scanner', 'copieur'],
        'téléphones': ['téléphone', 'mobile', 'smartphone', 'fixe'],
        'autres': ['autre', 'autres', 'divers', 'tpe', 'badgeur', 'caméra']
      };

      if (typeMap[filter]) {
        // Return true if any of the mapped types are found as a substring in the asset type
        return matchesSearch && typeMap[filter].some(t => normalizedType.includes(t));
      }
      
      return matchesSearch && (normalizedType === filter || normalizedType.includes(filter));
    }
    
    return matchesSearch;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Maintain stable sort

  const isFiltering = search || selectedTypeFilter || selectedUserFilter || selectedStatusFilter || selectedLocationFilter || dateFilter !== 'all';
  
  // Calculate displayed items:
  let displayedAssets = filtered;
  let clientHasMore = false;
  
  if (isFiltering) {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    displayedAssets = filtered.slice(startIndex, startIndex + PAGE_SIZE);
    clientHasMore = startIndex + PAGE_SIZE < filtered.length;
  } else {
    // We rely on Firestore pagination which returned exact page
    displayedAssets = filtered;
  }

  const finalHasMore = isFiltering ? clientHasMore : hasMore;

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

  // Removed viewing asset logic since route handles it
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

      <div className={theme.pageHeader}>
        <div className="space-y-1">
          <div className={theme.pageTitleBox}>
            <div className={theme.pageTitleIcon}>
              <Box className="w-5 h-5" />
            </div>
            <h2 className={theme.pageTitleText}>
              {selectedTypeFilter 
                ? `Inventaire : ${selectedTypeFilter.charAt(0).toUpperCase() + selectedTypeFilter.slice(1)}` 
                : selectedUserFilter
                  ? `Matériel & Lignes assignés`
                  : 'Inventaire Global'}
            </h2>
          </div>
          <p className={theme.pageSubtitle}>
            {selectedTypeFilter 
              ? `Affichage des matériels de type ${selectedTypeFilter}.` 
              : selectedUserFilter
                ? `Affichage du matériel et des lignes téléphoniques pour l'utilisateur sélectionné.`
                : `Gestion et suivi des ${assets.length + phoneLines.length} éléments répertoriés.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {(selectedTypeFilter || selectedUserFilter || selectedStatusFilter || selectedLocationFilter || dateFilter !== 'all') && (
            <button 
              onClick={() => {
                setSelectedTypeFilter(null);
                setSelectedUserFilter(null);
                setSelectedStatusFilter(null);
                setSelectedLocationFilter(null);
                setDateFilter('all');
              }}
              className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all hover:border-slate-300 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" /> Effacer
            </button>
          )}
          <div className="relative group flex-1 md:w-[280px]">
            <Search className={theme.searchIcon} />
            <input 
              type="text" 
              placeholder="Série, Label, User..." 
              className={theme.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "p-2.5 rounded-xl border transition-all flex items-center justify-center",
              showAdvancedFilters ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700"
            )}
            title="Filtres avancés"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              const title = selectedTypeFilter 
                ? `Inventaire : ${selectedTypeFilter.charAt(0).toUpperCase() + selectedTypeFilter.slice(1)}` 
                : 'Inventaire Global Assets';
              exportAssetListToPDF(filtered, users, locations, title);
            }}
            className={theme.btnSecondary}
            title="Exporter l'inventaire en PDF"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            disabled={isViewer}
            onClick={handleCreate}
            className={theme.btnPrimary}
          >
            <Plus className="w-4 h-4 text-indigo-100" /> Nouvel Asset
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

      <div className={cn(theme.card, "flex flex-col min-h-[400px]")}>
        <table className="w-full text-left border-collapse hidden md:table">
          <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-8 py-5 text-left">N° Inventaire</th>
              <th className="px-8 py-5">Asset / Cycle de vie</th>
              <th className="px-8 py-5">Affectation</th>
              <th className="px-8 py-5">Acquisition</th>
              <th className="px-8 py-5">Finance & Garantie</th>
              <th className="px-8 py-5 text-center">État</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/50 text-sm">
            {[...displayedAssets].sort((a, b) => (b.inventory_number || '').localeCompare(a.inventory_number || '')).map((asset, idx) => {
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
                    navigate('/assets/' + asset.id);
                  }}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-mono font-black text-blue-600 text-xs tracking-tight">{asset.inventory_number || '---'}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-[0.2em] mt-1">{asset.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center font-bold">
                        {getTypeIcon(asset.type)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base">{asset.label}</div>
                        <div className="flex flex-col gap-1 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{asset.subtype}</span>
                          </div>
                          {asset.manufacture_date && (
                            <div className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
                               Fab: {new Date(asset.manufacture_date).toLocaleDateString('fr-FR')} 
                               {asset.commissioning_date && <><span className="w-1 h-1 rounded-full bg-slate-300"></span> MES: {new Date(asset.commissioning_date).toLocaleDateString('fr-FR')}</>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {assignedUser ? (
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                           {assignedUser.name.charAt(0)}
                         </div>
                         <div className="flex flex-col">
                           <span className="font-bold text-slate-900 text-sm">{assignedUser.name}</span>
                           <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                             <MapPin className="w-3 h-3 text-slate-400" /> {location ? location.name : 'Stock'}
                           </span>
                         </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                         <span className="text-slate-400 italic text-xs font-medium">Non affecté</span>
                         <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                           <MapPin className="w-3 h-3 text-slate-400" /> {location ? location.name : 'Stock'}
                         </span>
                      </div>
                    )}
                  </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className={cn(
                      "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest",
                      asset.condition === 'neuf' ? 'bg-emerald-50 text-emerald-600' :
                      asset.condition === 'occasion' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                    )}>
                      {asset.condition || 'neuf'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-medium">{asset.serial || 'S/N: ---'}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="font-mono font-black text-slate-900 text-sm">{asset.value_euros?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                    {asset.has_warranty ? (
                       <span className="text-[10px] text-emerald-600 font-bold mt-0.5">Garantie au {new Date(asset.warranty_end || '').toLocaleDateString('fr-FR')}</span>
                    ) : (
                       <span className="text-[10px] text-slate-400 font-medium mt-0.5">Sans garantie</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block min-w-[90px] ${
                    asset.status === 'Stock' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                    asset.status === 'Panne' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
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
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{line.label}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Ligne Téléphonique</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono text-sm font-bold text-slate-600">
                    {line.number}
                  </td>
                  <td className="px-8 py-6 text-slate-500 font-medium text-sm">
                    {location?.name || <span className="opacity-40">---</span>}
                  </td>
                  <td className="px-8 py-6">
                    {assignedUser ? (
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                           {assignedUser.name.charAt(0)}
                         </div>
                         <span className="font-bold text-slate-900 text-sm">{assignedUser.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs font-medium">Non affecté</span>
                    )}
                  </td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block min-w-[90px] ${
                    line.status === 'Actif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                    'bg-slate-50 text-slate-600 border border-slate-200'
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

            {displayedAssets.length === 0 && filteredPhoneLines.length === 0 && !loading && (
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
          {displayedAssets.map((asset) => {
            const assignedUser = users.find(u => String(u.id) === String(asset.assigned_user_id));
            
            return (
              <div 
                key={`asset-card-${asset.id}`}
                onClick={() => navigate('/assets/' + asset.id)}
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
        
        {/* Pagination Controls */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 md:px-8 py-4 flex items-center justify-between mt-auto">
          <span className="text-xs font-bold text-slate-400">
            Page {currentPage}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Précédent
            </button>
            <button 
              onClick={handleNextPage}
              disabled={!finalHasMore}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

