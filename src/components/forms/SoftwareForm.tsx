import React, { useState, useEffect } from 'react';
import { api, Asset, Supplier, User } from '../../services/api';
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: General Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Informations catalogue</h4>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Nom du logiciel</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Adobe Photoshop, Office 365..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Éditeur</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                placeholder="Adobe, Microsoft..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                >
                  <option value="Perpétuelle">Perpétuelle</option>
                  <option value="Abonnement">Abonnement</option>
                  <option value="SaaS">SaaS</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Statut</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                >
                  <option value="Actif">Actif</option>
                  <option value="Obsolète">Obsolète</option>
                  <option value="Interdit">Interdit</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Fournisseur</label>
              <select
                value={formData.supplier_id || ''}
                onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
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
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Affectations</h4>
            
            {/* Users */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Utilisateurs ({linkedUsers.length})</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => { setSearchUser(e.target.value); setIsUserListOpen(true); }}
                  onFocus={() => { setIsUserListOpen(true); setIsAssetListOpen(false); }}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <AnimatePresence>
                  {isUserListOpen && searchUser && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <button key={user.id} type="button" onClick={() => { toggleUser(user); setSearchUser(''); setIsUserListOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{user.name}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{user.email}</span>
                            </div>
                            {linkedUsers.some(u => u.id === user.id) && <Check className="w-4 h-4 text-emerald-600" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400 italic">Aucun utilisateur trouvé</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {linkedUsers.map(u => (
                  <div key={u.id} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100">
                    {u.name} 
                    <button type="button" onClick={() => toggleUser(u)} className="hover:bg-emerald-100 p-0.5 rounded-md transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Matériels ({linkedAssets.length})</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchAsset}
                  onChange={e => { setSearchAsset(e.target.value); setIsAssetListOpen(true); }}
                  onFocus={() => { setIsAssetListOpen(true); setIsUserListOpen(false); }}
                  placeholder="Rechercher un matériel..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <AnimatePresence>
                  {isAssetListOpen && searchAsset && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {filteredAssets.length > 0 ? (
                        filteredAssets.map(asset => (
                          <button key={asset.id} type="button" onClick={() => { toggleAsset(asset); setSearchAsset(''); setIsAssetListOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                {getAssetIcon(asset.type)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">{asset.label}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{asset.inventory_number || asset.serial}</span>
                              </div>
                            </div>
                            {linkedAssets.some(a => a.id === asset.id) && <Check className="w-4 h-4 text-indigo-600" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400 italic">Aucun matériel trouvé</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {linkedAssets.map(a => (
                  <div key={a.id} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-indigo-100">
                    {getAssetIcon(a.type)} 
                    {a.label} 
                    <button type="button" onClick={() => toggleAsset(a)} className="hover:bg-indigo-100 p-0.5 rounded-md transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Notes / Description</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Détails supplémentaires, informations de licence, etc..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white resize-none"
        />
      </div>

      <div className="mt-8 pt-8 border-t border-slate-200 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-3 text-sm font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSaving || !formData.name}
          className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save className="w-5 h-5" /> {initialData ? 'Mettre à jour' : 'Enregistrer le logiciel'}</>
          )}
        </button>
      </div>
    </form>
  );
};
