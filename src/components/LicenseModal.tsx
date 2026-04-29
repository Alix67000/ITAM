import React, { useEffect, useState } from 'react';
import { api, License, Asset, Supplier } from '../services/api';
import { Save, Search, Check, Laptop, Smartphone, Monitor, Printer, HardDrive, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Modal } from './ui/Modal';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  license?: License | null;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose, onRefresh, license }) => {
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [assets, users, suppliers] = await Promise.all([
          api.getAssets(),
          api.getUsers(),
          api.getSuppliers()
        ]);
        setAllAssets(assets);
        setAllUsers(users);
        setAllSuppliers(suppliers);

        if (license) {
          setFormData(license);
          const [attachedAssets, attachedUsers] = await Promise.all([
            api.getLicenseAssets(license.id),
            api.getLicenseUsers(license.id)
          ]);
          setLinkedAssets(attachedAssets);
          setLinkedUsers(attachedUsers);
        } else {
          setFormData({
            label: '',
            software: '',
            license_key: '',
            total_seats: 1,
            type: 'Souscription',
            status: 'Actif',
            end_date: '',
            supplier_id: null
          });
          setLinkedAssets([]);
          setLinkedUsers([]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [license, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let licenseId = license?.id;
      if (licenseId) {
        await api.updateLicense(licenseId, formData);
      } else {
        const result = await api.createLicense(formData);
        licenseId = result.id;
      }

      if (licenseId) {
        const currentAttachedAssets = await api.getLicenseAssets(licenseId);
        const currentAssetIds = currentAttachedAssets.map(a => a.id);
        const newAssetIds = linkedAssets.map(a => a.id);

        for (const id of currentAssetIds) {
          if (!newAssetIds.includes(id)) await api.removeAssetFromLicense(licenseId, id);
        }
        for (const id of newAssetIds) {
          if (!currentAssetIds.includes(id)) await api.assignAssetToLicense(licenseId, id);
        }

        const currentAttachedUsers = await api.getLicenseUsers(licenseId);
        const currentUserIds = currentAttachedUsers.map(u => u.id);
        const newUserIds = linkedUsers.map(u => u.id);

        for (const id of currentUserIds) {
          if (!newUserIds.includes(id)) await api.removeUserFromLicense(licenseId, id);
        }
        for (const id of newUserIds) {
          if (!currentUserIds.includes(id)) await api.assignUserToLicense(licenseId, id);
        }
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
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
    a.serial.toLowerCase().includes(searchAsset.toLowerCase())
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={license ? 'Modifier la licence' : 'Nouvelle licence'}
      subtitle={license ? `Clé: ${license.license_key || 'N/A'}` : 'Vérification de la conformité et des usages'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Identification</h4>
             <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Libellé</label>
                <input
                  required
                  type="text"
                  value={formData.label}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  placeholder="ex: Office 365 Bus."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Clé de licence</label>
                <input
                  type="text"
                  value={formData.license_key || ''}
                  onChange={e => setFormData({ ...formData, license_key: e.target.value })}
                  placeholder="XXXXX-XXXXX..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Total Sièges</label>
                  <input
                    type="number"
                    value={formData.total_seats}
                    onChange={e => setFormData({ ...formData, total_seats: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                  >
                    <option value="Souscription">Souscription</option>
                    <option value="Perpétuelle">Perpétuelle</option>
                  </select>
                </div>
              </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Affectations</h4>
             <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchUser}
                    onChange={e => { setSearchUser(e.target.value); setIsUserListOpen(true); }}
                    onFocus={() => { setIsUserListOpen(true); setIsAssetListOpen(false); }}
                    placeholder="Lier à un utilisateur..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <AnimatePresence>
                    {isUserListOpen && searchUser && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {filteredUsers.map(user => (
                          <button key={user.id} type="button" onClick={() => { toggleUser(user); setSearchUser(''); setIsUserListOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between">
                            <span className="text-xs font-medium">{user.name}</span>
                            {linkedUsers.some(u => u.id === user.id) && <Check className="w-3 h-3 text-emerald-600" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-wrap gap-1">
                  {linkedUsers.map(u => (
                    <div key={u.id} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-emerald-100 flex items-center gap-1">
                      {u.name} <button type="button" onClick={() => toggleUser(u)}><X className="w-2.5 h-2.5" /></button>
                    </div>
                  ))}
                </div>
             </div>

             <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchAsset}
                    onChange={e => { setSearchAsset(e.target.value); setIsAssetListOpen(true); }}
                    onFocus={() => { setIsAssetListOpen(true); setIsUserListOpen(false); }}
                    placeholder="Lier à un asset..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <AnimatePresence>
                    {isAssetListOpen && searchAsset && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {filteredAssets.map(asset => (
                          <button key={asset.id} type="button" onClick={() => { toggleAsset(asset); setSearchAsset(''); setIsAssetListOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between">
                            <span className="text-xs font-medium">{asset.label}</span>
                            {linkedAssets.some(a => a.id === asset.id) && <Check className="w-3 h-3 text-blue-600" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-wrap gap-1">
                  {linkedAssets.map(a => (
                    <div key={a.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-blue-100 flex items-center gap-1">
                      {getAssetIcon(a.type)} {a.label} <button type="button" onClick={() => toggleAsset(a)}><X className="w-2.5 h-2.5" /></button>
                    </div>
                  ))}
                </div>
             </div>
          </div>
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
            {loading ? '...' : <><Save className="w-4 h-4" /> Enregistrer</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
