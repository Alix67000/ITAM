import React, { useEffect, useState } from 'react';
import { api, Location } from '../services/api';
import { Plus, Search, MapPin, Navigation, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../services/authContext';
import { LocationModal } from '../components/LocationModal';

export const LocationList: React.FC = () => {
  const { canEdit, canDelete, isViewer } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<Location | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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

  const buildTree = (nodes: Location[], parentId: number | null = null): (Location & { children?: any[] })[] => {
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
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center group hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
          style={{ marginLeft: `${depth * 2}rem` }}
          onClick={() => handleOpenModal(loc)}
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 relative flex-shrink-0">
              <MapPin className="w-4 h-4" />
              {depth > 0 && (
                <div className="absolute top-1/2 -left-4 w-4 h-px bg-slate-200" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 truncate">{loc.name}</h3>
                {loc.children && loc.children.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                    {loc.children.length} {loc.children.length > 1 ? 'sites' : 'site'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                <Navigation className="w-3 h-3" />
                <span className="truncate">{loc.address || 'Aucune adresse enregistrée'}</span>
              </div>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={(e) => { e.stopPropagation(); handleOpenModal(loc); }}
                 className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
               >
                  <Edit2 className="w-4 h-4" />
               </button>
               <button 
                 disabled={!canDelete}
                 onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(loc.id); }} 
                 className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-slate-200">
               <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                 <AlertCircle className="w-8 h-8" />
               </div>
               <div className="text-center space-y-2 mb-8">
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Supprimer l'entité ?</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Les utilisateurs et matériels rattachés n'auront plus d'entité associée.
                </p>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Annuler</button>
                  <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-xs font-bold hover:bg-red-700 transition shadow-lg shadow-red-100">Supprimer</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Entités & Sites</h2>
          <p className="text-xs text-slate-500">Gestion hiérarchique de l'organisation.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Filtrer..." className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button 
            disabled={isViewer}
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {search ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((loc, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.05 }} 
                key={loc.id} 
                onClick={() => handleOpenModal(loc)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:border-blue-200 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 relative">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => { e.stopPropagation(); handleOpenModal(loc); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                     <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(loc.id); }} className="p-2 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="font-black text-slate-900 mb-1 tracking-tight">{loc.name}</h3>
                <div className="text-[10px] text-slate-500 font-medium italic mb-4">
                  {loc.address || 'Pas d\'adresse'}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {treeData.map((loc, idx) => (
              <LocationItem key={loc.id} loc={loc} depth={0} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
