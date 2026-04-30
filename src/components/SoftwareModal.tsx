import React, { useState, useEffect } from 'react';
import { api, Asset } from '../services/api';
import { Package, Search, Check, Save, Laptop, Smartphone, Monitor, Printer, FileText, HardDrive, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from './ui/Modal';

interface SoftwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  software?: any | null;
}

export const SoftwareModal: React.FC<SoftwareModalProps> = ({ isOpen, onClose, onRefresh, software }) => {
  const [formData, setFormData] = useState<any>({
    name: '',
    publisher: '',
    type: 'Perpétuelle',
    status: 'Actif',
    supplier_id: '',
    description: ''
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
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
    const loadStaticData = async () => {
      try {
        const [s, a, u] = await Promise.all([
          api.getSuppliers(),
          api.getAssets(),
          api.getUsers()
        ]);
        setSuppliers(s);
        setAllAssets(a);
        setAllUsers(u);
      } catch (err) {
        console.error('Error loading static data:', err);
      }
    };
    loadStaticData();
  }, []);

  useEffect(() => {
    if (software) {
      setFormData({
        name: software.name || '',
        publisher: software.publisher || '',
        type: software.type || 'Perpétuelle',
        status: software.status || 'Actif',
        supplier_id: software.supplier_id || '',
        description: software.description || ''
      });
      Promise.all([
        api.getSoftwareUsers(software.id),
        api.getSoftwareAssets(software.id)
      ]).then(([users, assets]) => {
        setLinkedUsers(users);
        setLinkedAssets(assets);
      });
    } else {
      setFormData({
        name: '',
        publisher: '',
        type: 'Perpétuelle',
        status: 'Actif',
        supplier_id: '',
        description: ''
      });
      setLinkedUsers([]);
      setLinkedAssets([]);
    }
  }, [software, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        supplier_id: formData.supplier_id === '' ? null : parseInt(formData.supplier_id)
      };

      let softwareId = software?.id;
      if (softwareId) {
        await api.updateSoftwareById(softwareId, payload);
      } else {
        const result = await api.createSoftware(payload);
        softwareId = result.id;
      }

      if (softwareId) {
        const currentAttachedAssets = await api.getSoftwareAssets(softwareId);
        const currentAssetIds = currentAttachedAssets.map((a: any) => a.id);
        const newAssetIds = linkedAssets.map(a => a.id);

        for (const id of currentAssetIds) {
          if (!newAssetIds.includes(id)) await api.removeAssetFromSoftware(softwareId, id);
        }
        for (const id of newAssetIds) {
          if (!currentAssetIds.includes(id)) await api.assignAssetToSoftware(softwareId, id);
        }

        const currentAttachedUsers = await api.getSoftwareUsers(softwareId);
        const currentUserIds = currentAttachedUsers.map((u: any) => u.id);
        const newUserIds = linkedUsers.map(u => u.id);

        for (const id of currentUserIds) {
          if (!newUserIds.includes(id)) await api.removeUserFromSoftware(softwareId, id);
        }
        for (const id of newUserIds) {
          if (!currentUserIds.includes(id)) await api.assignUserToSoftware(softwareId, id);
        }
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving software:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAsset = (asset: Asset) => {
    if (linkedAssets.some(a => a.id === asset.id)) {
      setLinkedAssets(linkedAssets.filter(a => a.id !== asset.id));
    } else {
      setLinkedAssets([...linkedAssets, asset]);
    }
  };

  const toggleUser = (user: any) => {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={software ? 'Modifier le logiciel' : 'Nouveau Logiciel'}
      subtitle={software ? `Édition de ${software.name}` : 'Gestion du catalogue logiciel'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Informations catalogue</h4>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Nom du logiciel</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Adobe Photoshop, Office 365..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Éditeur</label>
              <input
                type="text"
                value={formData.publisher || ''}
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
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Affectations</h4>
            
            {/* Users Links */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Utilisateurs ({linkedUsers.length})</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => { setSearchUser(e.target.value); setIsUserListOpen(true); }}
                  onFocus={() => { setIsUserListOpen(true); setIsAssetListOpen(false); }}
                  placeholder="Lier un utilisateur..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
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
              <div className="flex flex-wrap gap-1 mt-2">
                {linkedUsers.map(u => (
                  <div key={u.id} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 border border-emerald-100">
                    {u.name} <button type="button" onClick={() => toggleUser(u)}><X className="w-2.5 h-2.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets Links */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Matériels ({linkedAssets.length})</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchAsset}
                  onChange={e => { setSearchAsset(e.target.value); setIsAssetListOpen(true); }}
                  onFocus={() => { setIsAssetListOpen(true); setIsUserListOpen(false); }}
                  placeholder="Lier un asset..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <AnimatePresence>
                  {isAssetListOpen && searchAsset && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                      {filteredAssets.map(asset => (
                        <button key={asset.id} type="button" onClick={() => { toggleAsset(asset); setSearchAsset(''); setIsAssetListOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between">
                          <span className="text-xs font-medium">{asset.label}</span>
                          {linkedAssets.some(a => a.id === asset.id) && <Check className="w-3 h-3 text-indigo-600" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {linkedAssets.map(a => (
                  <div key={a.id} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 border border-indigo-100">
                    {getAssetIcon(a.type)} {a.label} <button type="button" onClick={() => toggleAsset(a)}><X className="w-2.5 h-2.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">Notes / Description</label>
          <textarea
            rows={2}
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white resize-none"
          />
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.name}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? '...' : <><Save className="w-4 h-4" /> {software ? 'Mettre à jour' : 'Enregistrer'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
