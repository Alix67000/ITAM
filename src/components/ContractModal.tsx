import React, { useEffect, useState } from 'react';
import { api, Contract, Supplier, PhoneLine, User, Asset } from '../services/api';
import { Save, Eye, EyeOff, Settings2, Users as UsersIcon, Printer, Phone } from 'lucide-react';
import { Modal } from './ui/Modal';
import { UserModal } from './UserModal';
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
  const [phoneLines, setPhoneLines] = useState<PhoneLine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [printers, setPrinters] = useState<Asset[]>([]);
  
  const [selectedPhoneLineIds, setSelectedPhoneLineIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedPrinterIds, setSelectedPrinterIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const refreshUsers = async () => {
    const usrs = await api.getUsers();
    setUsers(usrs);
  };

  const handleUserCreated = async (newUserId: string) => {
    await refreshUsers();
    setSelectedUserIds(prev => [...prev, newUserId]);
  };

  const [formData, setFormData] = useState<Partial<Contract>>({
    label: '',
    type: 'Maintenance',
    supplier_id: null,
    start_date: '',
    end_date: '',
    price: 0,
    status: 'Actif',
    description: '',
    reference: '',
    account_login: '',
    account_password: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Load referentials
      api.getSuppliers().then(setSuppliers);
      Promise.all([
        api.getPhoneLines(),
        api.getUsers(),
        api.getAssets({ fetchAll: true })
      ]).then(([pLines, usrs, assetsData]) => {
        setPhoneLines(pLines);
        setUsers(usrs);
        setPrinters(assetsData.assets.filter((a: Asset) => a.type === 'Imprimante'));
      });

      if (contract) {
        setFormData({
          ...contract,
          start_date: contract.start_date || '',
          end_date: contract.end_date || '',
          account_login: contract.account_login || contract.account_email || '',
          account_password: contract.account_password || ''
        });
        
        // Load current associations
        Promise.all([
          api.getContractPhoneLines(contract.id),
          api.getContractUsers(contract.id),
          api.getContractPrinters(contract.id)
        ]).then(([cLines, cUsers, cPrinters]) => {
           setSelectedPhoneLineIds(cLines.map(l => l.id));
           setSelectedUserIds(cUsers.map(u => u.id));
           setSelectedPrinterIds(cPrinters.map(p => p.id));
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
          reference: '',
          account_login: '',
          account_password: ''
        });
        setSelectedPhoneLineIds([]);
        setSelectedUserIds([]);
        setSelectedPrinterIds([]);
        setShowAdvanced(false);
        setShowPassword(false);
      }
    }
  }, [isOpen, contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let contractId = contract?.id;
      if (contractId) {
        await api.updateContract(contractId, formData);
      } else {
        const res = await api.createContract(formData);
        if (res?.id) contractId = res.id;
      }
      
      if (contractId) {
        await Promise.all([
          api.syncContractPhoneLines(contractId, selectedPhoneLineIds),
          api.syncContractUsers(contractId, selectedUserIds),
          api.syncContractPrinters(contractId, selectedPrinterIds)
        ]);
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isMobilePlan = formData.type === 'Forfait mobile';
  const isPrinterLease = formData.type === 'Leasing imprimante';
  const showAssociations = showAdvanced || isMobilePlan || isPrinterLease;
  const showAccountBox = showAdvanced || isMobilePlan || !!contract?.account_login || !!contract?.account_email;

  const toggleSelection = (id: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (current.includes(id)) {
      setter(current.filter(x => x !== id));
    } else {
      setter([...current, id]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contract ? 'Modifier le Contrat' : 'Nouveau Contrat'}
      subtitle={contract ? `Référence: ${contract.reference}` : 'Gestion des engagements et leasings'}
      maxWidth="3xl"
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
                  <option value="Location">Location</option>
                  <option value="Garantie">Garantie</option>
                  <option value="Assurance">Assurance</option>
                  <option value="Support">Support</option>
                  <option value="Logiciel">Logiciel</option>
                  <option value="Forfait mobile">Forfait mobile</option>
                  <option value="Leasing imprimante">Leasing imprimante</option>
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

        {/* Compte Opérateur */}
        {showAccountBox && (
          <div className="space-y-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className={theme.formSectionTitle}>Compte de gestion (Espace Client)</div>
            <div className={theme.formGrid}>
              <div>
                <label className={theme.formLabel}>Identifiant de connexion</label>
                <input 
                  type="text" 
                  value={formData.account_login || ''}
                  onChange={e => setFormData({ ...formData, account_login: e.target.value })}
                  className={theme.inputBase}
                  placeholder="Email, pseudo, N° client..."
                />
              </div>
              <div>
                <label className={theme.formLabel}>Mot de passe</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.account_password || ''}
                    onChange={e => setFormData({ ...formData, account_password: e.target.value })}
                    className={theme.inputBase}
                    placeholder="••••••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Associations Multiples */}
        {showAssociations && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className={theme.formSectionTitle}>Liaisons & Attributions</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lignes */}
              {(isMobilePlan || showAdvanced) && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Lignes</label>
                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-2 max-h-48 overflow-y-auto space-y-1">
                    {phoneLines.map(l => (
                      <label key={l.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer group transition-colors">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-600 border-slate-300" checked={selectedPhoneLineIds.includes(l.id)} onChange={() => toggleSelection(l.id, selectedPhoneLineIds, setSelectedPhoneLineIds)} />
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-indigo-700 truncate">{l.number} <span className="opacity-50">({l.label})</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* Utilisateurs */}
              {(isMobilePlan || isPrinterLease || showAdvanced) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5"/> Utilisateurs</label>
                    <button type="button" onClick={() => setIsUserModalOpen(true)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">+ Ajouter</button>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-2 max-h-48 overflow-y-auto space-y-1">
                    {users.map(u => (
                      <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer group transition-colors">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-600 border-slate-300" checked={selectedUserIds.includes(u.id)} onChange={() => toggleSelection(u.id, selectedUserIds, setSelectedUserIds)} />
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-indigo-700 truncate">{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* Imprimantes */}
              {(isPrinterLease || showAdvanced) && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><Printer className="w-3.5 h-3.5"/> Imprimantes</label>
                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-2 max-h-48 overflow-y-auto space-y-1">
                    {printers.map(p => (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer group transition-colors">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-600 border-slate-300" checked={selectedPrinterIds.includes(p.id)} onChange={() => toggleSelection(p.id, selectedPrinterIds, setSelectedPrinterIds)} />
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-indigo-700 truncate">{p.label} - {p.inventory_number || p.serial || p.subtype}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <UserModal 
          isOpen={isUserModalOpen} 
          onClose={() => setIsUserModalOpen(false)} 
          onRefresh={refreshUsers}
        />

        <div>
          <label className={theme.formLabel}>Notes / Conditions particulières</label>
          <textarea 
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className={cn(theme.inputBase, "resize-none")}
            placeholder="Détails du contrat..."
          />
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6 pb-2">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            {showAdvanced ? "Masquer les options avancées" : "Afficher les associations"}
          </button>
          
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={theme.btnSecondary}>
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading || !formData.label}
              className={theme.btnPrimary}
            >
              {loading ? '...' : <><Save className="w-4 h-4" /> {contract ? 'Mettre à jour' : 'Enregistrer'}</>}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
