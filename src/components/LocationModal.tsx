import React, { useEffect, useState } from 'react';
import { api, Location } from '../services/api';
import { Save } from 'lucide-react';
import { Modal } from './ui/Modal';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  location?: Location | null;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onRefresh, location }) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    parent_id: null as number | null
  });

  useEffect(() => {
    const loadLocations = async () => {
      const data = await api.getLocations();
      setLocations(data);
    };
    if (isOpen) {
      loadLocations();
      if (location) {
        setFormData({
          name: location.name,
          address: location.address || '',
          parent_id: location.parent_id || null
        });
      } else {
        setFormData({
          name: '',
          address: '',
          parent_id: null
        });
      }
    }
  }, [isOpen, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (location?.id) {
        await api.updateLocation(location.id, formData);
      } else {
        await api.createLocation(formData);
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={location ? "Modifier l'Entité" : "Nouvelle Entité"}
      subtitle={location ? `Édition de ${location.name}` : 'Hiérarchie et organisation des sites'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Nom de l'entité</label>
            <input 
              required 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white" 
              placeholder="ex: Emmaüs Scherwiller" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Entité Parente</label>
            <select 
              value={formData.parent_id || ''} 
              onChange={e => setFormData({...formData, parent_id: e.target.value ? parseInt(e.target.value) : null})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
            >
              <option value="">Aucune (Entité principale)</option>
              {locations
                .filter(l => l.id !== location?.id)
                .map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))
              }
            </select>
            <p className="text-[9px] text-slate-400 mt-1 italic ml-1">Permet de structurer vos sites en arborescence.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Adresse / Détails</label>
            <textarea 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white resize-none" 
              placeholder="Adresse physique, étage..."
              rows={3}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.name}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> Enregistrer</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
