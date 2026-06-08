import React, { useState, useEffect } from 'react';
import { api, Asset, Supplier, User } from '../../services/api';
import { theme } from '../../lib/theme';
import { cn } from '../../lib/utils';
import { Package, Search, Check, Save, Laptop, Smartphone, Monitor, Printer, HardDrive, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SoftwareFormProps {
  initialData?: any;
  onSubmit: (data: any, extra?: { asset_ids?: string[]; user_ids?: string[] }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const SoftwareForm: React.FC<SoftwareFormProps> = ({ initialData, onSubmit, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<any>({
    name: initialData?.name || '',
    publisher: initialData?.publisher || '',
    type: initialData?.type || 'Perpétuelle',
    status: initialData?.status || 'Actif',
    supplier_id: initialData?.supplier_id || '',
    description: initialData?.description || ''
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [linkedAssets, setLinkedAssets] = useState<Asset[]>([]);
  const [searchAsset, setSearchAsset] = useState('');
  const [isAssetListOpen, setIsAssetListOpen] = useState(false);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [linkedUsers, setLinkedUsers] = useState<User[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, a, u] = await Promise.all([
          api.getSuppliers(),
          api.getAssets({ fetchAll: true }).then(r => r.assets),
          api.getUsers()
        ]);
        setSuppliers(s);
        setAllAssets(a);
        setAllUsers(u);

        if (initialData?.id) {
          const [softUsers, softAssets] = await Promise.all([
            api.getSoftwareUsers(initialData.id),
            api.getSoftwareAssets(initialData.id)
          ]);
          setLinkedUsers(softUsers);
          setLinkedAssets(softAssets);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        ...formData,
        supplier_id: formData.supplier_id === '' ? null : formData.supplier_id
      },
      {
        asset_ids: linkedAssets.map(a => a.id),
        user_ids: linkedUsers.map(u => u.id)
      }
    );
  };

  const toggleAsset = (asset: Asset) => {
    if (linkedAssets.some(a => a.id === asset.id)) {
      setLinkedAssets(linkedAssets.filter(a => a.id !== asset.id));
    } else {
      setLinkedAssets([...linkedAssets, asset]);
    }
  };

  const toggleUser = (user: User) => {
    if (linkedUsers.some(u => u.id === user.id)) {
      setLinkedUsers(linkedUsers.filter(u => u.id !== user.id));
    } else {
      setLinkedUsers([...linkedUsers, user]);
    }
  };

  const filteredAssets = allAssets.filter(a => 
    a.label.toLowerCase().includes(searchAsset.toLowerCase()) || 
    a.serial.toLowerCase().includes(searchAsset.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const getAssetIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'laptop':
      case 'pc': return <Laptop className="w-4 h-4" />;
      case 'téléphone': return <Smartphone className="w-4 h-4" />;
      case 'écran': return <Monitor className="w-4 h-4" />;
      case 'imprimante': return <Printer className="w-4 h-4" />;
      default: return <HardDrive className="w-4 h-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className={theme.formGrid}>
        {/* Left Column: General Info */}
        <div className="space-y-4">
          <div className={theme.formSection}>
            <div className={theme.formSectionTitle}>Informations catalogue</div>
            
            <div>
              <label className={theme.formLabel}>Nom du logiciel</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Adobe Photoshop, Office 365..."
                className={theme.inputBase}
              />
            </div>

            <div>
              <label className={theme.formLabel}>Éditeur</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                placeholder="Adobe, Microsoft..."
                className={theme.inputBase}
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
                  <option value="Perpétuelle">Perpétuelle</option>
                  <option value="Abonnement">Abonnement</option>
                  <option value="SaaS">SaaS</option>
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
                  <option value="Obsolète">Obsolète</option>
                  <option value="Interdit">Interdit</option>
                </select>
              </div>
            </div>

            <div>
              <label className={theme.formLabel}>Fournisseur</label>
              <select
                value={formData.supplier_id || ''}
                onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                className={theme.inputBase}
              >
                <option value="">Aucun fournisseur</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Affectations */}
        <div className="space-y-4">
          <div className={theme.formSection}>
            <div className={theme.formSectionTitle}>Affectations</div>
            
            {/* Users */}
            <div>
              <label className={theme.formLabel}>Utilisateurs ({linkedUsers.length})</label>
              <div className="relative">
                <Search className={theme.searchIcon} />
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => { setSearchUser(e.target.value); setIsUserListOpen(true); }}
                  onFocus={() => { setIsUserListOpen(true); setIsAssetListOpen(false); }}
                  placeholder="Rechercher un utilisateur..."
                  className={theme.searchInput}
                />
                <AnimatePresence>
                  {isUserListOpen && searchUser && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <button key={user.id} type="button" onClick={() => { toggleUser(user); setSearchUser(''); setIsUserListOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-xs">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{user.name}</span>
                              <span className="text-[9px] text-slate-400 uppercase font-bold">{user.email}</span>
                            </div>
                            {linkedUsers.some(u => u.id === user.id) && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-[10px] text-slate-400 italic">Aucun utilisateur trouvé</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {linkedUsers.map(u => (
                  <div key={u.id} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 border border-emerald-100">
                    {u.name} 
                    <button type="button" onClick={() => toggleUser(u)} className="hover:bg-emerald-100 p-0.5 rounded transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets */}
            <div className="pt-2">
              <label className={theme.formLabel}>Matériels ({linkedAssets.length})</label>
              <div className="relative">
                <Search className={theme.searchIcon} />
                <input
                  type="text"
                  value={searchAsset}
                  onChange={e => { setSearchAsset(e.target.value); setIsAssetListOpen(true); }}
                  onFocus={() => { setIsAssetListOpen(true); setIsUserListOpen(false); }}
                  placeholder="Rechercher un matériel..."
                  className={theme.searchInput}
                />
                <AnimatePresence>
                  {isAssetListOpen && searchAsset && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                      {filteredAssets.length > 0 ? (
                        filteredAssets.map(asset => (
                          <button key={asset.id} type="button" onClick={() => { toggleAsset(asset); setSearchAsset(''); setIsAssetListOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                                {getAssetIcon(asset.type)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">{asset.label}</span>
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-tight">{asset.inventory_number || asset.serial}</span>
                              </div>
                            </div>
                            {linkedAssets.some(a => a.id === asset.id) && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-[10px] text-slate-400 italic">Aucun matériel trouvé</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {linkedAssets.map(a => (
                  <div key={a.id} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 border border-indigo-100">
                    {getAssetIcon(a.type)} 
                    {a.label} 
                    <button type="button" onClick={() => toggleAsset(a)} className="hover:bg-indigo-100 p-0.5 rounded transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(theme.formSection, "md:col-span-2 mt-4")}>
        <label className={theme.formLabel}>Notes / Description</label>
        <textarea
          rows={2}
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Détails supplémentaires, informations de licence, etc..."
          className={cn(theme.inputBase, "resize-none min-h-[60px]")}
        />
      </div>

      <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-end gap-2 -mx-5 -mb-5 px-5 py-3 bg-slate-50">
        <button
          type="button"
          onClick={onCancel}
          className={theme.btnSecondary}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSaving || !formData.name}
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
