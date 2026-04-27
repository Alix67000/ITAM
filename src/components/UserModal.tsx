import React, { useEffect, useState } from 'react';
import { api, User, Location } from '../services/api';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  user?: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onRefresh, user }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    department: '',
    location_id: null,
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
      } else {
        await api.createUser(formData);
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900">
              {user ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nom complet</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ex: Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email PROFESSIONNEL</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="j.dupont@company.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Département / Service</label>
              <input 
                type="text" 
                value={formData.department || ''}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ex: Marketing, IT, RH..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Rattachement Lieu</label>
              <select 
                value={formData.location_id || ''}
                onChange={e => setFormData({ ...formData, location_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Sélectionner un bureau</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : <><Save className="w-4 h-4" /> {user ? 'Enregistrer' : 'Créer'}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
