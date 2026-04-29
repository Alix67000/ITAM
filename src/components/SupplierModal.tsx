import React, { useEffect, useState } from 'react';
import { api, Supplier } from '../services/api';
import { Save, Building2, User, Phone } from 'lucide-react';
import { Modal } from './ui/Modal';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  supplier?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, onRefresh, supplier }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    contact: '',
    phone: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData(supplier);
      } else {
        setFormData({
          name: '',
          contact: '',
          phone: '',
        });
      }
    }
  }, [isOpen, supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (supplier?.id) {
        await api.updateSupplier(supplier.id, formData);
      } else {
        await api.createSupplier(formData);
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
      title={supplier ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
      subtitle={supplier ? `Édition de ${supplier.name}` : 'Gestion des partenaires et prestataires'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Nom de l'entreprise</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                required 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white" 
                placeholder="ex: Dell France" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Contact Principal</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={formData.contact || ''} 
                onChange={e => setFormData({ ...formData, contact: e.target.value })} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white" 
                placeholder="ex: Jean Dupont" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="tel" 
                value={formData.phone || ''} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white" 
                placeholder="ex: 01 23 45 67 89" 
              />
            </div>
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
            {loading ? '...' : <><Save className="w-4 h-4" /> {supplier ? 'Mettre à jour' : 'Créer'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
