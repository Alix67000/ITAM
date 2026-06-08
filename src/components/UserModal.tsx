import React, { useEffect, useState } from 'react';
import { api, User, Location } from '../services/api';
import { Save } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useToast } from '../services/toastContext';
import { theme } from '../lib/theme';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  user?: User | null;
  onCreated?: (userId: string) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  user,
  onCreated
}) => {
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
        const created = await api.createUser(formData);
        showToast('Collaborateur créé avec succès', 'success');

        if (created?.id && onCreated) {
          onCreated(created.id);
        }
      }

      onRefresh();
      onClose();
    } catch (err) {
      showToast("Une erreur est survenue lors de l'enregistrement", 'error');
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
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="space-y-4">
          <div>
            <label className={theme.formLabel}>Nom complet</label>
            <input 
              required
              type="text" 
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={theme.inputBase}
              placeholder="ex: Jean Dupont"
            />
          </div>

          <div>
            <label className={theme.formLabel}>Email PROFESSIONNEL</label>
            <input 
              required
              type="email" 
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={theme.inputBase}
              placeholder="j.dupont@company.com"
            />
          </div>

          <div>
            <label className={theme.formLabel}>Département / Service</label>
            <input 
              type="text" 
              value={formData.department || ''}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              className={theme.inputBase}
              placeholder="ex: Marketing, IT, RH..."
            />
          </div>

          <div className={theme.formGrid}>
            <div>
              <label className={theme.formLabel}>Rattachement Entité</label>
              <select 
                value={formData.location_id || ''}
                onChange={e => setFormData({ ...formData, location_id: e.target.value || null })}
                className={theme.inputBase}
              >
                <option value="">Sélectionner une entité</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={theme.formLabel}>Rôle / Accès</label>
              <select 
                value={formData.role || 'User'}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className={theme.inputBase}
              >
                <option value="Admin">Administrateur</option>
                <option value="User">Utilisateur</option>
                <option value="Viewer">Observateur</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end gap-2 -mx-5 -mb-5 px-5 py-3 bg-slate-50">
          <button 
            type="button" 
            onClick={onClose}
            className={theme.btnSecondary}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.name || !formData.email}
            className={theme.btnPrimary}
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> {user ? 'Mettre à jour' : 'Créer l\'utilisateur'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
