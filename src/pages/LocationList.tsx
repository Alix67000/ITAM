import React, { useEffect, useState } from 'react';
import { api, Location } from '../services/api';
import { Plus, Search, MapPin, Navigation, Edit2, Trash2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LocationList: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<Location | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', parent_id: null as number | null });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<number | null>(null);

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
    setSelectedLoc(loc);
    setFormData(loc 
      ? { name: loc.name, address: loc.address, parent_id: loc.parent_id || null } 
      : { name: '', address: '', parent_id: null }
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLoc) {
      await api.updateLocation(selectedLoc.id, formData);
    } else {
      await api.createLocation(formData);
    }
    setIsModalOpen(false);
    fetchLocations();
  };

  const confirmDelete = async () => {
    if (locationToDelete) {
      try {
        await api.deleteLocation(locationToDelete);
        setLocationToDelete(null);
        setIsConfirmOpen(false);
        fetchLocations();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert('Une erreur est survenue lors de la suppression de l\'entité.');
      }
    }
  };

  const handleDelete = (id: number) => {
    setLocationToDelete(id);
    setIsConfirmOpen(true);
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
          transition={{ delay: index * 0.05 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center group hover:border-blue-200 hover:shadow-md transition-all"
          style={{ marginLeft: `${depth * 2}rem` }}
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
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Navigation className="w-3 h-3" />
                <span className="truncate">{loc.address || 'Aucune adresse'}</span>
              </div>
            </div>

            <div className="flex gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
               <button onClick={() => handleOpenModal(loc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                <Edit2 className="w-3.5 h-3.5" />
               </button>
               <button onClick={() => handleDelete(loc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                <Trash2 className="w-3.5 h-3.5" />
               </button>
            </div>
          </div>
        </motion.div>
        
        {loc.children && loc.children.length > 0 && (
          <div className="relative">
            <div className="absolute left-[calc(depth*2rem+1rem)] top-0 bottom-0 w-px bg-slate-100" style={{ left: `${depth * 2 + 1}rem` }} />
            <div className="space-y-1">
              {loc.children.map((child: any, idx: number) => (
                <LocationItem key={child.id} loc={child} depth={depth + 1} index={idx + index + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const filtered = locations.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.parent_name && l.parent_name.toLowerCase().includes(search.toLowerCase()))
  );

  const treeData = search ? [] : buildTree(locations);

  return (
    <div className="space-y-6">
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
               <p className="text-sm text-slate-500 mb-6">
                 Êtes-vous sûr de vouloir supprimer cette entité ?<br/><br/>
                 <span className="font-bold text-red-600">Attention :</span> Les utilisateurs et matériels rattachés n'auront plus d'entité associée. Les sous-entités deviendront des entités indépendantes.
               </p>
               <div className="flex gap-3">
                  <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100">Supprimer</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">{selectedLoc ? 'Modifier l\'Entité' : 'Nouvelle Entité'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Nom de l'entité</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="ex: Emmaüs Scherwiller" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Entité Parente (Optionnel)</label>
                  <select 
                    value={formData.parent_id || ''} 
                    onChange={e => setFormData({...formData, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Aucune (Entité principale)</option>
                    {locations
                      .filter(l => l.id !== selectedLoc?.id) // Prevent self-parenting
                      .map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))
                    }
                  </select>
                  <p className="text-[9px] text-slate-400 mt-1 italic">Permet de hiérarchiser vos structures.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Adresse / Détails</label>
                  <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Adresse physique, étage..." />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">Annuler</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Entités & Structures</h2>
          <p className="text-xs text-slate-500">Gestion hiérarchique de vos organisations et sites.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher..." className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-48 focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-100">
            <Plus className="w-4 h-4" /> Nouvelle Entité
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {search ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((loc, idx) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={loc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 relative">
                    <MapPin className="w-5 h-5" />
                    {loc.parent_id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[8px] font-bold border border-white">
                        S
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleOpenModal(loc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier"><Edit2 className="w-3.5 h-3.5" /></button>
                     <button onClick={() => handleDelete(loc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{loc.name}</h3>
                {loc.parent_name && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-2 w-fit">
                    Membre de : <span className="text-blue-600">{loc.parent_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500 italic mb-4">
                  <Navigation className="w-3 h-3" /> {loc.address || 'Aucune adresse'}
                </div>
                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID_{loc.id}</span>
                   <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Détails Entité</button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {treeData.map((loc, idx) => (
              <LocationItem key={loc.id} loc={loc} depth={0} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
