import React, { useEffect, useState } from 'react';
import { api, Location } from '../services/api';
import { Plus, Search, MapPin, Navigation, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../services/authContext';
import { LocationModal } from '../components/LocationModal';
import { cn } from '../lib/utils';
import { theme } from '../lib/theme';

export const LocationList: React.FC = () => {
  const { canEdit, canDelete, isViewer } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<Location | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchLocations = () => {
    setLoading(true);
    api.getLocations().then(data => {
      setLocations(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenModal = (loc: Location | null = null) => {
    if (isViewer) return;
    setSelectedLoc(loc);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await api.deleteLocation(deleteConfirmId);
        setDeleteConfirmId(null);
        fetchLocations();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
      }
    }
  };

  const buildTree = (nodes: Location[], parentId: string | null = null): (Location & { children?: any[] })[] => {
    return nodes
      .filter(node => node.parent_id === parentId)
      .map(node => ({
        ...node,
        children: buildTree(nodes, node.id)
      }));
  };

  const LocationItem: React.FC<{ loc: any; depth: number; index: number }> = ({ loc, depth, index }) => {
    return (
      <div className="space-y-1">
          <motion.div 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: index * 0.01 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center group hover:border-indigo-100 hover:shadow-md transition-all cursor-pointer"
          style={{ marginLeft: `${depth * 2}rem` }}
          onClick={() => handleOpenModal(loc)}
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 relative flex-shrink-0">
              <MapPin className="w-5 h-5" />
              {depth > 0 && (
                <div className="absolute top-1/2 -left-4 w-4 h-px bg-slate-200" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{loc.name}</h3>
                {loc.children && loc.children.length > 0 && (
                  <span className={theme.badgeNeutral}>
                    {loc.children.length} {loc.children.length > 1 ? 'sites' : 'site'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                <Navigation className="w-3 h-3 text-slate-300" />
                <span className="truncate">{loc.address || 'Aucune adresse enregistrée'}</span>
              </div>
            </div>

            <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={(e) => { e.stopPropagation(); handleOpenModal(loc); }}
                 className={theme.btnIconGhost}
               >
                  <Edit2 className="w-4 h-4" />
               </button>
               <button 
                 disabled={!canDelete}
                 onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(loc.id); }} 
                 className={theme.btnIconDanger}
               >
                <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>
        </motion.div>
        
        {loc.children && loc.children.length > 0 && (
          <div className="relative">
            <div className="absolute top-0 bottom-0 w-px bg-slate-100" style={{ left: `${depth * 2 + 1}rem` }} />
            <div className="space-y-1">
              {loc.children.map((child: any, idx: number) => (
                <LocationItem key={child.id} loc={child} depth={depth + 1} index={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const filtered = locations.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.address && l.address.toLowerCase().includes(search.toLowerCase()))
  );

  const treeData = search ? [] : buildTree(locations);

  return (
    <div className="space-y-6">
      <LocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchLocations} 
        location={selectedLoc} 
      />

      <div className={theme.pageHeader}>
        <div className="space-y-1">
          <div className={theme.pageTitleBox}>
             <div className={theme.pageTitleIcon}>
                 <MapPin className="w-5 h-5" />
             </div>
             <h2 className={theme.pageTitleText}>
               Entités & Sites
             </h2>
          </div>
          <p className={theme.pageSubtitle}>Gestion hiérarchique de l'organisation et des sites.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-[280px]">
             <Search className={theme.searchIcon} />
            <input 
              type="text" 
              placeholder="Filtrer..." 
              className={theme.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            disabled={isViewer}
            onClick={() => handleOpenModal()} 
            className={theme.btnPrimary}
          >
            <Plus className="w-4 h-4 text-indigo-100" /> Nouveau Site
          </button>
        </div>
      </div>

      <div className="space-y-2 min-h-[400px]">
        {loading ? (
            <div className={cn(theme.card, "p-12")}><div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement des sites...</div></div>
        ) : search ? (
           filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((loc, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.05 }} 
                key={loc.id} 
                onClick={() => handleOpenModal(loc)}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col group hover:border-indigo-100 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.25rem] flex items-center justify-center text-white relative shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => { e.stopPropagation(); handleOpenModal(loc); }} className={theme.btnIconGhost}><Edit2 className="w-4 h-4" /></button>
                     <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(loc.id); }} className={theme.btnIconDanger}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors mb-2">{loc.name}</h3>
                <div className="text-[10px] text-slate-500 font-medium italic mt-auto uppercase tracking-widest truncate">
                  {loc.address || 'Pas d\'adresse'}
                </div>
              </motion.div>
            ))}
          </div>
           ) : (
                <div className={cn(theme.card, "p-12")}><div className={theme.emptyPanel}><div className={theme.emptyIconBox}><MapPin className="w-8 h-8" /></div><p className={theme.emptyText}>Aucun site ne correspond à cette recherche.</p></div></div>
           )
        ) : (
          locations.length > 0 ? (
          <div className="space-y-1">
            {treeData.map((loc, idx) => (
              <LocationItem key={loc.id} loc={loc} depth={0} index={idx} />
            ))}
          </div>
          ) : (
             <div className={cn(theme.card, "p-12")}><div className={theme.emptyPanel}><div className={theme.emptyIconBox}><MapPin className="w-8 h-8" /></div><p className={theme.emptyText}>Aucun site n'est enregistré pour le moment.</p></div></div>
          )
        )}
      </div>

      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-slate-200">
               <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                 <AlertCircle className="w-8 h-8" />
               </div>
               <div className="text-center space-y-2 mb-8">
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Supprimer l'entité ?</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Les utilisateurs et matériels rattachés n'auront plus d'entité associée.
                </p>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors">Annuler</button>
                  <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100">Supprimer</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
