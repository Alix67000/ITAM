import React, { useEffect, useState } from 'react';
import { api, User, Location } from '../services/api';
import { Save } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useToast } from '../services/toastContext';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  user?: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onRefresh, user }) => {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    department: '',
    location_id: null,
    role: 'User',
  });

  useEffect(() => {
    if (isOpen) {
      api.getLocations().then(setLocations);
      if (user) {
        setFormData(user);
      } else {
        setFormData({
          name: '',
          email: '',
          department: '',
          location_id: null,
          role: 'User',
        });
      }
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user?.id) {
        await api.updateUser(user.id, formData);
        showToast('Collaborateur mis à jour avec succès', 'success');
      } else {
        await api.createUser(formData);
        showToast('Collaborateur créé avec succès', 'success');
      }
      onRefresh();
      onClose();
    } catch (err) {
      showToast('Une erreur est survenue lors de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
      subtitle={user ? `Édition de ${user.name}` : 'Création d\'une fiche utilisateur'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Nom complet</label>
            <input 
              required
              type="text" 
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
              placeholder="ex: Jean Dupont"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Email PROFESSIONNEL</label>
            <input 
              required
              type="email" 
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
              placeholder="j.dupont@company.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Département / Service</label>
            <input 
              type="text" 
              value={formData.department || ''}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
              placeholder="ex: Marketing, IT, RH..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Rattachement Entité</label>
              <select 
                value={formData.location_id || ''}
                onChange={e => setFormData({ ...formData, location_id: e.target.value || null })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
              >
                <option value="">Sélectionner une entité</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Rôle / Accès</label>
              <select 
                value={formData.role || 'User'}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
              >
                <option value="Admin">Administrateur</option>
                <option value="User">Utilisateur</option>
                <option value="Viewer">Observateur</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.name || !formData.email}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> {user ? 'Mettre à jour' : 'Créer l\'utilisateur'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
