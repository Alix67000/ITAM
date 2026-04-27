import React, { useEffect, useState } from 'react';
import { api, Contract } from '../services/api';
import { X, Save, FileText, Calendar, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  contract?: Contract | null;
}

export const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, onRefresh, contract }) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Contract>>({
    label: '',
    type: 'Maintenance',
    supplier_id: null,
    start_date: '',
    end_date: '',
    price: 0,
    status: 'Actif',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      api.getSuppliers().then(setSuppliers);
      if (contract) {
        setFormData(contract);
      } else {
        setFormData({
          label: '',
          type: 'Maintenance',
          supplier_id: null,
          start_date: '',
          end_date: '',
          price: 0,
          status: 'Actif',
          description: '',
        });
      }
    }
  }, [isOpen, contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (contract?.id) {
        await api.updateContract(contract.id, formData);
      } else {
        await api.createContract(formData);
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {contract ? 'Modifier le Contrat' : 'Nouveau Contrat'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Libellé du Contrat</label>
              <input required type="text" value={formData.label || ''} onChange={e => setFormData({ ...formData, label: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: Microsoft 365 Business" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Type</label>
                <select value={formData.type || 'Maintenance'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                  <option value="Maintenance">Contrat de Maintenance</option>
                  <option value="Leasing">Leasing / Location</option>
                  <option value="Support">Support Technique</option>
                  <option value="Assurance">Assurance</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Statut</label>
                <select value={formData.status || 'Actif'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                  <option value="Actif">Actif</option>
                  <option value="En attente">En attente</option>
                  <option value="Résilié">Résilié</option>
                  <option value="Expiré">Expiré</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Fournisseur</label>
              <select value={formData.supplier_id || ''} onChange={e => setFormData({ ...formData, supplier_id: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                <option value="">Sélectionner un fournisseur</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Date de début</label>
                <input type="date" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Date de fin</label>
                <input type="date" value={formData.end_date || ''} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Prix / Redevance (€)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" step="0.01" value={formData.price || 0} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Notes / Description</label>
              <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none h-24 resize-none" placeholder="Détails du contrat..." />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg">Annuler</button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50">
                {loading ? 'Enregistrement...' : <><Save className="w-4 h-4" /> {contract ? 'Enregistrer' : 'Créer'}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
