import React, { useEffect, useState } from 'react';
import { api, Supplier } from '../services/api';
import { Save, Building2, User, Phone } from 'lucide-react';
import { Modal } from './ui/Modal';
import { theme } from '../lib/theme';
import { cn } from '../lib/utils';

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
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="space-y-4">
          <div>
            <label className={theme.formLabel}>Nom de l'entreprise</label>
            <div className="relative">
              <Building2 className={theme.searchIcon} />
              <input 
                required 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                className={cn(theme.inputBase, "pl-9")} 
                placeholder="ex: Dell France" 
              />
            </div>
          </div>

          <div>
            <label className={theme.formLabel}>Contact Principal</label>
            <div className="relative">
              <User className={theme.searchIcon} />
              <input 
                type="text" 
                value={formData.contact || ''} 
                onChange={e => setFormData({ ...formData, contact: e.target.value })} 
                className={cn(theme.inputBase, "pl-9")} 
                placeholder="ex: Jean Dupont" 
              />
            </div>
          </div>

          <div>
            <label className={theme.formLabel}>Téléphone</label>
            <div className="relative">
              <Phone className={theme.searchIcon} />
              <input 
                type="tel" 
                value={formData.phone || ''} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                className={cn(theme.inputBase, "pl-9")} 
                placeholder="ex: 01 23 45 67 89" 
              />
            </div>
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end gap-2 -mx-5 -mb-5 px-5 py-3 bg-slate-50">
          <button type="button" onClick={onClose} className={theme.btnSecondary}>
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.name}
            className={theme.btnPrimary}
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> {supplier ? 'Mettre à jour' : 'Créer'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
