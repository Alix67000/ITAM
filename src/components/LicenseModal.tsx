import React, { useEffect, useState } from 'react';
import { api, License } from '../services/api';
import { X, Save, Box, Key, Users, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  license?: License | null;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose, onRefresh, license }) => {
  const [formData, setFormData] = useState<Partial<License>>({
    label: '',
    software: '',
    license_key: '',
    total_seats: 1,
    type: 'Souscription',
    status: 'Actif',
    end_date: ''
  });

  useEffect(() => {
    if (license) {
      setFormData(license);
    } else {
      setFormData({
        label: '',
        software: '',
        license_key: '',
        total_seats: 1,
        type: 'Souscription',
        status: 'Actif',
        end_date: ''
      });
    }
  }, [license, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (license) {
        await api.updateLicense(license.id, formData);
      } else {
        await api.createLicense(formData);
      }
      onRefresh();
      onClose();
    } catch (error) {
      alert('Erreur lors de l’enregistrement');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{license ? 'Modifier la licence' : 'Nouvelle licence'}</h2>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3" /> Libellé de la licence
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                    placeholder="ex: Pack Office 365 Business Premium"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Box className="w-3 h-3" /> Logiciel / Éditeur
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.software}
                    onChange={e => setFormData({ ...formData, software: e.target.value })}
                    placeholder="ex: Microsoft"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3 h-3" /> Nombre de postes
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.total_seats}
                    onChange={e => setFormData({ ...formData, total_seats: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" /> Clé de licence
                  </label>
                  <input
                    type="text"
                    value={formData.license_key}
                    onChange={e => setFormData({ ...formData, license_key: e.target.value })}
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                   <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                   >
                     <option value="Souscription">Souscription (SaaS)</option>
                     <option value="Perpétuelle">Perpétuelle</option>
                     <option value="Volume">Volume (VL)</option>
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</label>
                   <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                   >
                     <option value="Actif">Actif</option>
                     <option value="Expiré">Expiré</option>
                     <option value="Inactif">Inactif</option>
                   </select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Date d'expiration
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
