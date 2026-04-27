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
  const [formData, setFormData] = useState({ name: '', address: '' });

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
    setFormData(loc ? { name: loc.name, address: loc.address } : { name: '', address: '' });
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer ce lieu ? (Les assets rattachés seront marqués sans lieu)')) {
      await api.deleteLocation(id);
      fetchLocations();
    }
  };

  const filtered = locations.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">{selectedLoc ? 'Modifier le Lieu' : 'Nouveau Lieu'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Nom du site</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="ex: Bureau Paris Sud" />
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
          <h2 className="text-lg font-bold text-slate-900">Sites & Localisations</h2>
          <p className="text-xs text-slate-500">Gestion géographique de votre parc informatique.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Filtrer..." className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-48 focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-100">
            <Plus className="w-4 h-4" /> Nouveau Site
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((loc, idx) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={loc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleOpenModal(loc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                 <button onClick={() => handleDelete(loc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{loc.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 italic mb-4">
              <Navigation className="w-3 h-3" /> {loc.address || 'Aucune adresse'}
            </div>
            <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID_LOC_{loc.id}</span>
               <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Détails Site</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
