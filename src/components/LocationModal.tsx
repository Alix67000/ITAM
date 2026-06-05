import React, { useEffect, useState } from 'react';
import { api, Location } from '../services/api';
import { Save } from 'lucide-react';
import { Modal } from './ui/Modal';
import { theme } from '../lib/theme';
import { cn } from '../lib/utils';

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
    parent_id: null as string | null
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
        <div className="space-y-6">
          <div>
            <label className={theme.formLabel}>Nom de l'entité</label>
            <input 
              required 
              type="text" 
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className={theme.inputBase} 
              placeholder="ex: Emmaüs Scherwiller" 
            />
          </div>
          
          <div>
            <label className={theme.formLabel}>Entité Parente</label>
            <select 
              value={formData.parent_id || ''} 
              onChange={e => setFormData({...formData, parent_id: e.target.value || null})}
              className={theme.inputBase}
            >
              <option value="">Aucune (Entité principale)</option>
              {locations
                .filter(l => l.id !== location?.id)
                .map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))
              }
            </select>
            <p className="text-[9px] text-slate-400 mt-1 italic ml-1 font-medium">Permet de structurer vos sites en arborescence.</p>
          </div>

          <div>
            <label className={theme.formLabel}>Adresse / Détails</label>
            <textarea 
              value={formData.address || ''} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              className={cn(theme.inputBase, "resize-none")} 
              placeholder="Adresse physique, étage..."
              rows={3}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-6 pb-2">
          <button type="button" onClick={onClose} className={theme.btnSecondary}>
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.name}
            className={theme.btnPrimary}
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> Enregistrer</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
