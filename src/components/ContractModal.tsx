import React, { useEffect, useState } from 'react';
import { api, Contract, Supplier } from '../services/api';
import { Save } from 'lucide-react';
import { Modal } from './ui/Modal';
import { theme } from '../lib/theme';
import { cn } from '../lib/utils';

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
        <div className={theme.formGrid}>
          <div className="space-y-6">
            <div className={theme.formSectionTitle}>Identification</div>
            <div>
              <label className={theme.formLabel}>Libellé du contrat</label>
              <input 
                required
                type="text" 
                value={formData.label || ''}
                onChange={e => setFormData({ ...formData, label: e.target.value })}
                className={theme.inputBase}
                placeholder="ex: Leasing Dell 2024"
              />
            </div>
            <div>
              <label className={theme.formLabel}>Référence interne</label>
              <input 
                type="text" 
                value={formData.reference || ''}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
                className={theme.inputBase}
                placeholder="ex: CONTR-9988"
              />
            </div>
            <div className={theme.formGrid}>
              <div>
                <label className={theme.formLabel}>Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className={theme.inputBase}
                >
                  <option value="Abonnement">Abonnement</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Leasing">Leasing</option>
                  <option value="Garantie">Garantie</option>
                  <option value="Logiciel">Logiciel</option>
                </select>
              </div>
              <div>
                <label className={theme.formLabel}>Statut</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className={theme.inputBase}
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="Expiré">Expiré</option>
                  <option value="Résilié">Résilié</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={theme.formSectionTitle}>Engagement & Coût</div>
            <div>
              <label className={theme.formLabel}>Fournisseur</label>
              <select 
                value={formData.supplier_id || ''}
                onChange={e => setFormData({ ...formData, supplier_id: e.target.value || null })}
                className={theme.inputBase}
              >
                <option value="">Sélectionner</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
            <div className={theme.formGrid}>
              <div>
                <label className={theme.formLabel}>Début</label>
                <input 
                  type="date" 
                  value={formData.start_date || ''}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className={theme.inputBase}
                />
              </div>
              <div>
                <label className={theme.formLabel}>Fin</label>
                <input 
                  type="date" 
                  value={formData.end_date || ''}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className={theme.inputBase}
                />
              </div>
            </div>
            <div>
              <label className={theme.formLabel}>Prix Total (HT)</label>
              <input 
                type="number" 
                value={formData.price || 0}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className={theme.inputBase}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div>
          <label className={theme.formLabel}>Notes / Conditions particulières</label>
          <textarea 
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className={cn(theme.inputBase, "resize-none")}
            placeholder="Détails du contrat..."
          />
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-6 pb-2">
          <button type="button" onClick={onClose} className={theme.btnSecondary}>
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.label}
            className={theme.btnPrimary}
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> {contract ? 'Mettre à jour' : 'Créer le contrat'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
