import React, { useEffect, useState } from 'react';
import { api, Contract, Supplier, PhoneLine, User, Asset } from '../../services/api';
import { Save, Users as UsersIcon, Printer, Phone, Settings2, Eye, EyeOff } from 'lucide-react';
import { theme } from '../../lib/theme';
import { cn } from '../../lib/utils';
import { UserModal } from '../UserModal';

interface ContractFormProps {
  initialData?: Partial<Contract>;
  onSubmit: (data: Partial<Contract>, associations: { phoneLineIds: string[], userIds: string[], printerIds: string[] }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export const ContractForm: React.FC<ContractFormProps> = ({ initialData, onSubmit, onCancel, isSaving }) => {
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
    account_password: '',
    ...initialData
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [phoneLines, setPhoneLines] = useState<PhoneLine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [printers, setPrinters] = useState<Asset[]>([]);

  const [selectedPhoneLineIds, setSelectedPhoneLineIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedPrinterIds, setSelectedPrinterIds] = useState<string[]>([]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const refreshUsers = async () => {
    const usrs = await api.getUsers();
    setUsers(usrs);
  };

  const handleUserCreated = async (newUserId: string) => {
    await refreshUsers();
    setSelectedUserIds(prev =>
      prev.includes(newUserId) ? prev : [...prev, newUserId]
    );
    setIsUserModalOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [s, pLines, usrs, assetsData] = await Promise.all([
        api.getSuppliers(),
        api.getPhoneLines(),
        api.getUsers(),
        api.getAssets({ fetchAll: true })
      ]);
      setSuppliers(s);
      setPhoneLines(pLines);
      setUsers(usrs);
      setPrinters(assetsData.assets.filter((a: Asset) => a.type === 'Imprimante'));

      if (initialData?.id) {
        const [cLines, cUsers, cPrinters] = await Promise.all([
          api.getContractPhoneLines(initialData.id),
          api.getContractUsers(initialData.id),
          api.getContractPrinters(initialData.id)
        ]);
        setSelectedPhoneLineIds(cLines.map(l => l.id));
        setSelectedUserIds(cUsers.map(u => u.id));
        setSelectedPrinterIds(cPrinters.map(p => p.id));
      }
    };
    fetchData();
  }, [initialData?.id]);

  const toggleSelection = (id: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const isMobilePlan = formData.type === 'Forfait mobile';
  const isPrinterLease = formData.type === 'Leasing imprimante';
  const showAssociations = showAdvanced || isMobilePlan || isPrinterLease;
  const showAccountBox = showAdvanced || isMobilePlan || !!formData.account_login || !!formData.account_email;

  return (
    <div className="space-y-4">
      <div className={theme.formGrid}>
        <div className="space-y-4">
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

        <div className="space-y-4">
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

      {showAccountBox && (
        <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className={theme.formSectionTitle}>Compte de gestion</div>
          <div className={theme.formGrid}>
            <div>
              <label className={theme.formLabel}>Identifiant</label>
              <input 
                type="text" 
                value={formData.account_login || ''}
                onChange={e => setFormData({ ...formData, account_login: e.target.value })}
                className={theme.inputBase}
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
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssociations && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className={theme.formSectionTitle}>Associations</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><Phone className="w-3 h-3"/> Lignes</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 max-h-40 overflow-y-auto space-y-0.5">
                {phoneLines.map(l => (
                  <label key={l.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer text-xs">
                    <input type="checkbox" className="rounded text-indigo-600 border-slate-300" checked={selectedPhoneLineIds.includes(l.id)} onChange={() => toggleSelection(l.id, selectedPhoneLineIds, setSelectedPhoneLineIds)} />
                    {l.number} ({l.label})
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                  <UsersIcon className="w-3 h-3" />
                  Utilisateurs
                </label>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(true)}
                  className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  + Ajouter
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 max-h-40 overflow-y-auto space-y-0.5">
                {users.map(u => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      className="rounded text-indigo-600 border-slate-300"
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => toggleSelection(u.id, selectedUserIds, setSelectedUserIds)}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-700 truncate">{u.name}</span>
                      {u.email && (
                        <span className="text-[9px] text-slate-400 truncate">{u.email}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><Printer className="w-3 h-3"/> Imprimantes</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 max-h-40 overflow-y-auto space-y-0.5">
                {printers.map(p => (
                  <label key={p.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer text-xs">
                    <input type="checkbox" className="rounded text-indigo-600 border-slate-300" checked={selectedPrinterIds.includes(p.id)} onChange={() => toggleSelection(p.id, selectedPrinterIds, setSelectedPrinterIds)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={theme.formLabel}>Notes</label>
        <textarea 
          value={formData.description || ''}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className={cn(theme.inputBase, "resize-none")}
        />
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
          <Settings2 className="w-3.5 h-3.5" /> {showAdvanced ? "Masquer options" : "Afficher associations"}
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className={theme.btnSecondary}>Annuler</button>
          <button type="button" onClick={() => onSubmit(formData, { phoneLineIds: selectedPhoneLineIds, userIds: selectedUserIds, printerIds: selectedPrinterIds })} disabled={isSaving} className={theme.btnPrimary}>
            {isSaving ? '...' : <><Save className="w-4 h-4" /> Enregistrer</>}
          </button>
        </div>
      </div>
      
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onRefresh={refreshUsers}
        onCreated={handleUserCreated}
      />
    </div>
  );
};
