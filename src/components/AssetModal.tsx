import React, { useEffect, useState } from 'react';
import { api, Asset, User, Location } from '../services/api';
import { X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  asset?: Asset | null;
}

export const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onRefresh, asset }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Asset>>({
    label: '',
    serial: '',
    type: 'PC',
    subtype: 'Laptop',
    status: 'Stock',
    location_id: null,
    assigned_user_id: null,
  });

  useEffect(() => {
    if (isOpen) {
      api.getUsers().then(setUsers);
      api.getLocations().then(setLocations);
      if (asset) {
        setFormData(asset);
      } else {
        setFormData({
          label: '',
          serial: '',
          type: 'PC',
          subtype: 'Laptop',
          status: 'Stock',
          location_id: null,
          assigned_user_id: null,
        });
      }
    }
  }, [isOpen, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (asset?.id) {
        await api.updateAsset(asset.id, formData);
      } else {
        await api.createAsset(formData);
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
          className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900">
              {asset ? 'Modifier l\'Asset' : 'Nouvel Asset'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Libellé / Nom</label>
                <input 
                  required
                  type="text" 
                  value={formData.label}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="ex: Dell XPS 15"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Numéro de Série</label>
                <input 
                  type="text" 
                  value={formData.serial || ''}
                  onChange={e => setFormData({ ...formData, serial: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="SN-XXXX-XXXX"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Type d'Asset</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PC">Ordinateur (PC)</option>
                  <option value="Téléphone">Téléphone Mobile</option>
                  <option value="Imprimante">Imprimante</option>
                  <option value="Écran">Écran</option>
                  <option value="Autre">Autre Périphérique</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Sous-type / Modèle</label>
                <input 
                  type="text" 
                  value={formData.subtype || ''}
                  onChange={e => setFormData({ ...formData, subtype: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Laptop, Fixe, Tablette..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Localisation</label>
                <select 
                  value={formData.location_id || ''}
                  onChange={e => setFormData({ ...formData, location_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Sélectionner un lieu</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Affecté à</label>
                <select 
                  value={formData.assigned_user_id || ''}
                  onChange={e => setFormData({ ...formData, assigned_user_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Non affecté (Stock)</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.department})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Statut</label>
                <div className="flex gap-2">
                   {['Stock', 'En service', 'Panne', 'Réformé'].map(s => (
                     <button
                       key={s}
                       type="button"
                       onClick={() => setFormData({ ...formData, status: s })}
                       className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border transition-all ${
                         formData.status === s 
                           ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                           : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                       }`}
                     >
                       {s}
                     </button>
                   ))}
                </div>
              </div>
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
                {loading ? 'Enregistrement...' : (
                  <>
                    <Save className="w-4 h-4" />
                    {asset ? 'Mettre à jour' : 'Créer l\'Asset'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
