import React, { useEffect, useState } from 'react';
import { api, PhoneLine, User, Location, Contract, Supplier } from '../services/api';
import { Phone, Save } from 'lucide-react';
import { Modal } from './ui/Modal';

interface PhoneLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  phoneLine?: PhoneLine | null;
}

export const PhoneLineModal: React.FC<PhoneLineModalProps> = ({ isOpen, onClose, onSuccess, phoneLine }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<PhoneLine>>({
    label: '',
    number: '',
    status: 'Actif',
    location_id: null,
    assigned_user_id: null,
    supplier_id: null,
    contract_id: null,
    comments: '',
  });

  useEffect(() => {
    if (isOpen) {
      api.getUsers().then(setUsers);
      api.getLocations().then(setLocations);
      api.getContracts().then(setContracts);
      api.getSuppliers().then(setSuppliers);
      
      if (phoneLine) {
        setFormData(phoneLine);
      } else {
        setFormData({
          label: '',
          number: '',
          status: 'Actif',
          location_id: null,
          assigned_user_id: null,
          supplier_id: null,
          contract_id: null,
          comments: '',
        });
      }
    }
  }, [isOpen, phoneLine]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (phoneLine) {
        await api.updatePhoneLine(phoneLine.id, formData);
      } else {
        await api.createPhoneLine(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving phone line:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={phoneLine ? 'Modifier la ligne' : 'Nouvelle ligne téléphonique'}
      subtitle={phoneLine ? `Édition de ${phoneLine.label}` : 'Gestion des abonnements et attributions'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Informations de base</h4>
             <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Nom de la ligne</label>
                <input 
                  required
                  type="text" 
                  value={formData.label || ''}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  placeholder="ex: Mobile Alex Dev"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">N° de téléphone</label>
                <input 
                  required
                  type="text" 
                  value={formData.number || ''}
                  onChange={e => setFormData({ ...formData, number: e.target.value })}
                  placeholder="ex: 06 00 00 00 00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Statut</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="Résilié">Résilié</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>
          </div>

          {/* Attribution & Links */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Attribution & Liens</h4>
             <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Utilisateur</label>
                <select 
                  value={formData.assigned_user_id || ''}
                  onChange={e => setFormData({ ...formData, assigned_user_id: e.target.value || null })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                >
                  <option value="">Non assigné</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Entité / Site</label>
                <select 
                  value={formData.location_id || ''}
                  onChange={e => setFormData({ ...formData, location_id: e.target.value || null })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Contrat lié</label>
                <select 
                  value={formData.contract_id || ''}
                  onChange={e => setFormData({ ...formData, contract_id: e.target.value || null })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                >
                  <option value="">Aucun contrat</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>{c.label} ({c.reference})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Fournisseur / Opérateur</label>
                <select 
                  value={formData.supplier_id || ''}
                  onChange={e => setFormData({ ...formData, supplier_id: e.target.value || null })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Commentaires libres</label>
          <textarea 
            value={formData.comments || ''}
            onChange={e => setFormData({ ...formData, comments: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white resize-none"
            placeholder="Détails du forfait, options (5G, International...)"
          />
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
            disabled={loading || !formData.label || !formData.number}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> {phoneLine ? 'Mettre à jour' : 'Enregistrer la ligne'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
