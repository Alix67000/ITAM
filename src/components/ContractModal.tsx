import React, { useEffect, useState } from 'react';
import { api, Contract, Supplier } from '../services/api';
import { Save } from 'lucide-react';
import { Modal } from './ui/Modal';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  contract?: Contract | null;
}

export const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, onRefresh, contract }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    reference: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.getSuppliers().then(setSuppliers);
      if (contract) {
        setFormData({
          ...contract,
          start_date: contract.start_date || '',
          end_date: contract.end_date || ''
        });
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
          reference: ''
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contract ? 'Modifier le Contrat' : 'Nouveau Contrat'}
      subtitle={contract ? `Référence: ${contract.reference}` : 'Gestion des engagements et leasings'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Identification</h4>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Libellé du contrat</label>
              <input 
                required
                type="text" 
                value={formData.label || ''}
                onChange={e => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                placeholder="ex: Leasing Dell 2024"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Référence interne</label>
              <input 
                type="text" 
                value={formData.reference || ''}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                placeholder="ex: CONTR-9988"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                >
                  <option value="Abonnement">Abonnement</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Leasing">Leasing</option>
                  <option value="Garantie">Garantie</option>
                  <option value="Logiciel">Logiciel</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Statut</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="Expiré">Expiré</option>
                  <option value="Résilié">Résilié</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Engagement & Coût</h4>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Fournisseur</label>
              <select 
                value={formData.supplier_id || ''}
                onChange={e => setFormData({ ...formData, supplier_id: e.target.value || null })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
              >
                <option value="">Sélectionner</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Début</label>
                <input 
                  type="date" 
                  value={formData.start_date || ''}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Fin</label>
                <input 
                  type="date" 
                  value={formData.end_date || ''}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Prix Total (HT)</label>
              <input 
                type="number" 
                value={formData.price || 0}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Notes / Conditions particulières</label>
          <textarea 
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white resize-none"
            placeholder="Détails du contrat..."
          />
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.label}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> {contract ? 'Mettre à jour' : 'Créer le contrat'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
