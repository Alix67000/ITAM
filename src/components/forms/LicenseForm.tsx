import React, { useEffect, useState } from 'react';
import { api, License, Asset, Supplier } from '../../services/api';
import { theme } from '../../lib/theme';
import { cn } from '../../lib/utils';
import { Save, Search, Check, Laptop, Smartphone, Monitor, Printer, HardDrive, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface LicenseFormProps {
  initialData?: Partial<License> | null;
  onSubmit: (data: Partial<License>, extra: { asset_ids: string[], user_ids: string[] }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const LicenseForm: React.FC<LicenseFormProps> = ({ initialData, onSubmit, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<Partial<License>>({
    label: '',
    software: '',
    license_key: '',
    total_seats: 1,
    type: 'Souscription',
    status: 'Actif',
    end_date: '',
    supplier_id: null
  });

  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [linkedAssets, setLinkedAssets] = useState<Asset[]>([]);
  const [searchAsset, setSearchAsset] = useState('');
  const [isAssetListOpen, setIsAssetListOpen] = useState(false);

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [linkedUsers, setLinkedUsers] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [assets, users, suppliers] = await Promise.all([
          api.getAssets({ fetchAll: true }).then(r => r.assets),
          api.getUsers(),
          api.getSuppliers()
        ]);
        setAllAssets(assets);
        setAllUsers(users);
        setAllSuppliers(suppliers);

        if (initialData?.id) {
          setFormData(initialData);
          const [attachedAssets, attachedUsers] = await Promise.all([
            api.getLicenseAssets(initialData.id),
            api.getLicenseUsers(initialData.id)
          ]);
          setLinkedAssets(attachedAssets);
          setLinkedUsers(attachedUsers);
        } else if (initialData) {
          setFormData({ ...formData, ...initialData });
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, {
      asset_ids: linkedAssets.map(a => a.id),
      user_ids: linkedUsers.map(u => u.id)
    });
  };

  const toggleAsset = (asset: Asset) => {
    if (linkedAssets.some(a => a.id === asset.id)) {
      setLinkedAssets(linkedAssets.filter(a => a.id !== asset.id));
    } else {
      if (linkedAssets.length + linkedUsers.length >= (formData.total_seats || 1)) {
        alert('Limite de sièges atteinte');
        return;
      }
      setLinkedAssets([...linkedAssets, asset]);
    }
  };

  const toggleUser = (user: any) => {
    if (linkedUsers.some(u => u.id === user.id)) {
      setLinkedUsers(linkedUsers.filter(u => u.id !== user.id));
    } else {
      if (linkedAssets.length + linkedUsers.length >= (formData.total_seats || 1)) {
        alert('Limite de sièges atteinte');
        return;
      }
      setLinkedUsers([...linkedUsers, user]);
    }
  };

  const filteredAssets = allAssets.filter(a => 
    a.label.toLowerCase().includes(searchAsset.toLowerCase()) || 
    (a.serial && a.serial.toLowerCase().includes(searchAsset.toLowerCase()))
  );

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const getAssetIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'laptop':
      case 'pc': return <Laptop className="w-3 h-3" />;
      case 'téléphone': return <Smartphone className="w-3 h-3" />;
      case 'écran': return <Monitor className="w-3 h-3" />;
      case 'imprimante': return <Printer className="w-3 h-3" />;
      default: return <HardDrive className="w-3 h-3" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={theme.formGrid}>
        <div className="space-y-6">
          <div className={theme.formSection}>
            <div className={theme.formSectionTitle}>Identification</div>
            
            <div>
              <label className={theme.formLabel}>Libellé</label>
              <input
                required
                type="text"
                value={formData.label || ''}
                onChange={e => setFormData({ ...formData, label: e.target.value })}
                placeholder="ex: Office 365 Bus."
                className={theme.inputBase}
              />
            </div>

            <div>
              <label className={theme.formLabel}>Logiciel (Catalogue)</label>
              <input
                required
                type="text"
                value={formData.software || ''}
                onChange={e => setFormData({ ...formData, software: e.target.value })}
                placeholder="ex: Microsoft Office"
                className={theme.inputBase}
              />
            </div>

            <div>
              <label className={theme.formLabel}>Clé de licence</label>
              <input
                type="text"
                value={formData.license_key || ''}
                onChange={e => setFormData({ ...formData, license_key: e.target.value })}
                placeholder="XXXXX-XXXXX..."
                className={cn(theme.inputBase, "font-mono")}
              />
            </div>

            <div className={theme.formGrid}>
              <div>
                <label className={theme.formLabel}>Total Sièges</label>
                <input
                  type="number"
                  value={formData.total_seats}
                  onChange={e => setFormData({ ...formData, total_seats: parseInt(e.target.value) })}
                  className={theme.inputBase}
                />
              </div>
              <div>
                <label className={theme.formLabel}>Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className={theme.inputBase}
                >
                  <option value="Souscription">Souscription</option>
                  <option value="Perpétuelle">Perpétuelle</option>
                </select>
              </div>
            </div>

            <div className={theme.formGrid}>
              <div>
                <label className={theme.formLabel}>Date d'expiration</label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className={theme.inputBase}
                />
              </div>
              <div>
                <label className={theme.formLabel}>Fournisseur</label>
                <select
                  value={formData.supplier_id || ''}
                  onChange={e => setFormData({ ...formData, supplier_id: e.target.value || null })}
                  className={theme.inputBase}
                >
                  <option value="">Sélectionner</option>
                  {allSuppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={theme.formSection}>
            <div className={theme.formSectionTitle}>Affectations</div>
            
            <div>
              <label className={theme.formLabel}>Utilisateurs ({linkedUsers.length})</label>
              <div className="relative">
                <Search className={theme.searchIcon} />
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => { setSearchUser(e.target.value); setIsUserListOpen(true); }}
                  onFocus={() => { setIsUserListOpen(true); setIsAssetListOpen(false); }}
                  placeholder="Lier à un utilisateur..."
                  className={theme.searchInput}
                />
                <AnimatePresence>
                  {isUserListOpen && searchUser && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-40 overflow-y-auto">
                      {filteredUsers.map(user => (
                        <button key={user.id} type="button" onClick={() => { toggleUser(user); setSearchUser(''); setIsUserListOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between">
                          <span className="text-sm font-medium">{user.name}</span>
                          {linkedUsers.some(u => u.id === user.id) && <Check className="w-4 h-4 text-emerald-600" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {linkedUsers.map(u => (
                  <div key={u.id} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-2 transition-all">
                    {u.name} <button type="button" onClick={() => toggleUser(u)} className="hover:text-emerald-900"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className={theme.formLabel}>Matériels ({linkedAssets.length})</label>
              <div className="relative">
                <Search className={theme.searchIcon} />
                <input
                  type="text"
                  value={searchAsset}
                  onChange={e => { setSearchAsset(e.target.value); setIsAssetListOpen(true); }}
                  onFocus={() => { setIsAssetListOpen(true); setIsUserListOpen(false); }}
                  placeholder="Lier à un asset..."
                  className={theme.searchInput}
                />
                <AnimatePresence>
                  {isAssetListOpen && searchAsset && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-40 overflow-y-auto">
                      {filteredAssets.map(asset => (
                        <button key={asset.id} type="button" onClick={() => { toggleAsset(asset); setSearchAsset(''); setIsAssetListOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between">
                          <span className="text-sm font-medium">{asset.label}</span>
                          {linkedAssets.some(a => a.id === asset.id) && <Check className="w-4 h-4 text-indigo-600" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {linkedAssets.map(a => (
                  <div key={a.id} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-xs font-bold border border-indigo-100 flex items-center gap-2 transition-all">
                    {getAssetIcon(a.type)} {a.label} <button type="button" onClick={() => toggleAsset(a)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 pb-2">
        <button type="button" onClick={onCancel} className={theme.btnSecondary}>
          Annuler
        </button>
        <button 
          type="submit" 
          disabled={isSaving || !formData.label}
          className={theme.btnPrimary}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save className="w-4 h-4" /> Enregistrer</>
          )}
        </button>
      </div>
    </form>
  );
};
