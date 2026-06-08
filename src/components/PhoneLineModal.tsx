import React, { useEffect, useState } from 'react';
import { api, PhoneLine, User, Location, Contract, Supplier } from '../services/api';
import { Phone, Save } from 'lucide-react';
import { Modal } from './ui/Modal';
import { theme } from '../lib/theme';
import { cn } from '../lib/utils';

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
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className={theme.formGrid}>
          {/* Basic Info */}
          <div className="space-y-4">
             <div className={theme.formSectionTitle}>Informations de base</div>
             <div>
                <label className={theme.formLabel}>Nom de la ligne</label>
                <input 
                  required
                  type="text" 
                  value={formData.label || ''}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  placeholder="ex: Mobile Alex Dev"
                  className={theme.inputBase}
                />
              </div>

              <div>
                <label className={theme.formLabel}>N° de téléphone</label>
                <input 
                  required
                  type="text" 
                  value={formData.number || ''}
                  onChange={e => setFormData({ ...formData, number: e.target.value })}
                  placeholder="ex: 06 00 00 00 00"
                  className={theme.inputBase}
                />
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
                  <option value="Résilié">Résilié</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>
          </div>

          {/* Attribution & Links */}
          <div className="space-y-4">
             <div className={theme.formSectionTitle}>Attribution & Liens</div>
             <div>
                <label className={theme.formLabel}>Utilisateur</label>
                <select 
                  value={formData.assigned_user_id || ''}
                  onChange={e => setFormData({ ...formData, assigned_user_id: e.target.value || null })}
                  className={theme.inputBase}
                >
                  <option value="">Non assigné</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={theme.formLabel}>Entité / Site</label>
                <select 
                  value={formData.location_id || ''}
                  onChange={e => setFormData({ ...formData, location_id: e.target.value || null })}
                  className={theme.inputBase}
                >
                  <option value="">Sélectionner...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={theme.formLabel}>Contrat lié</label>
                <select 
                  value={formData.contract_id || ''}
                  onChange={e => setFormData({ ...formData, contract_id: e.target.value || null })}
                  className={theme.inputBase}
                >
                  <option value="">Aucun contrat</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>{c.label} ({c.reference})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={theme.formLabel}>Fournisseur / Opérateur</label>
                <select 
                  value={formData.supplier_id || ''}
                  onChange={e => setFormData({ ...formData, supplier_id: e.target.value || null })}
                  className={theme.inputBase}
                >
                  <option value="">Sélectionner...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
          </div>
        </div>

        <div className="mt-4">
          <label className={theme.formLabel}>Commentaires libres</label>
          <textarea 
            value={formData.comments || ''}
            onChange={e => setFormData({ ...formData, comments: e.target.value })}
            rows={2}
            className={cn(theme.inputBase, "resize-none min-h-[80px]")}
            placeholder="Détails du forfait, options (5G, International...)"
          />
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
            disabled={loading || !formData.label || !formData.number}
            className={theme.btnPrimary}
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> {phoneLine ? 'Mettre à jour' : 'Enregistrer la ligne'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
