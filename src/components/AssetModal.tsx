import React, { useEffect, useState } from 'react';
import { api, Asset, User, Location, Contract, Supplier } from '../services/api';
import { X, Save, AlertCircle, FileText, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  asset?: Asset | null;
}

export const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onRefresh, asset }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [availableContracts, setAvailableContracts] = useState<Contract[]>([]);
  const [assetContracts, setAssetContracts] = useState<Contract[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'contracts'>('details');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Asset>>({
    label: '',
    serial: '',
    type: 'PC',
    subtype: 'Laptop',
    status: 'Stock',
    location_id: null,
    supplier_id: null,
    assigned_user_id: null,
  });

  useEffect(() => {
    if (isOpen) {
      api.getUsers().then(setUsers);
      api.getLocations().then(setLocations);
      api.getSuppliers().then(setSuppliers);
      api.getContracts().then(setAvailableContracts);
      setActiveTab('details');
      if (asset) {
        setFormData(asset);
        api.getAssetContracts(asset.id).then(setAssetContracts);
      } else {
        setFormData({
          label: '',
          serial: '',
          type: 'PC',
          subtype: 'Laptop',
          status: 'Stock',
          location_id: null,
          supplier_id: null,
          assigned_user_id: null,
        });
        setAssetContracts([]);
      }
    }
  }, [isOpen, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (asset?.id) {
        await api.updateAsset(asset.id, formData);
      } else {
        await api.createAsset(formData);
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignContract = async (contractId: number) => {
    if (!asset?.id) return;
    try {
      await api.assignContractToAsset(asset.id, contractId);
      const updated = await api.getAssetContracts(asset.id);
      setAssetContracts(updated);
    } catch (err) {
      alert('Contrat déjà associé');
    }
  };

  const handleRemoveContract = async (contractId: number) => {
    if (!asset?.id) return;
    await api.removeContractFromAsset(asset.id, contractId);
    const updated = await api.getAssetContracts(asset.id);
    setAssetContracts(updated);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900">
              {asset ? 'Modifier l\'Asset' : 'Nouvel Asset'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {asset && (
            <div className="flex px-6 bg-slate-50 border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                }`}
              >
                Informations
              </button>
              <button 
                onClick={() => setActiveTab('contracts')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'contracts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                }`}
              >
                Contrats & Licences ({assetContracts.length})
              </button>
            </div>
          )}

          <div className="p-6">
            {activeTab === 'details' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Libellé / Nom</label>
                    <input 
                      required
                      type="text" 
                      value={formData.label || ''}
                      onChange={e => setFormData({ ...formData, label: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="ex: Dell XPS 15"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Numéro de Série</label>
                    <input 
                      type="text" 
                      value={formData.serial || ''}
                      onChange={e => setFormData({ ...formData, serial: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                      placeholder="SN-XXXX-XXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Type d'Asset</label>
                    <select 
                      value={formData.type || 'PC'}
                      onChange={e => {
                        const newType = e.target.value;
                        let newSubtype = '';
                        if (newType === 'PC') newSubtype = 'Laptop';
                        if (newType === 'Téléphone') newSubtype = 'Smartphone';
                        setFormData({ ...formData, type: newType, subtype: newSubtype });
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="PC">Ordinateur (PC)</option>
                      <option value="Téléphone">Téléphone Mobile</option>
                      <option value="Imprimante">Imprimante</option>
                      <option value="Écran">Écran</option>
                      <option value="Autre">Autre Périphérique</option>
                    </select>
                  </div>

                  {['PC', 'Téléphone'].includes(formData.type || '') ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Sous-type</label>
                      <select 
                        value={formData.subtype || ''}
                        onChange={e => setFormData({ ...formData, subtype: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {formData.type === 'PC' && (
                          <>
                            <option value="Laptop">PC Portable</option>
                            <option value="Desktop">PC Fixe</option>
                            <option value="Tablette">Tablette</option>
                          </>
                        )}
                        {formData.type === 'Téléphone' && (
                          <>
                            <option value="Smartphone">Smartphone</option>
                            <option value="Feature Phone">Mobile simple</option>
                          </>
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="hidden"></div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Entité</label>
                    <select 
                      value={formData.location_id || ''}
                      onChange={e => setFormData({ ...formData, location_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Sélectionner une entité</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Affecté à</label>
                    <select 
                      value={formData.assigned_user_id || ''}
                      onChange={e => setFormData({ ...formData, assigned_user_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Non affecté (Stock)</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.department})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Fournisseur d'acquisition</label>
                    <select 
                      value={formData.supplier_id || ''}
                      onChange={e => setFormData({ ...formData, supplier_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Statut</label>
                    <div className="flex gap-2">
                       {['Stock', 'En service', 'Panne', 'Réformé'].map(s => (
                         <button
                           key={s}
                           type="button"
                           onClick={() => setFormData({ ...formData, status: s })}
                           className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border transition-all ${
                             formData.status === s 
                               ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                               : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                           }`}
                         >
                           {s}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {loading ? 'Enregistrement...' : (
                      <>
                        <Save className="w-4 h-4" />
                        {asset ? 'Mettre à jour' : 'Créer l\'Asset'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
                  <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">Gestion des contrats associés</h4>
                    <p className="text-xs text-blue-700">Sélectionnez une licence ou un contrat de maintenance pour le lier à cet appareil.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Ajouter un contrat</label>
                  <div className="flex gap-2">
                    <select 
                      id="contract-select"
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Sélectionner...</option>
                      {availableContracts
                        .filter(c => !assetContracts.some(ac => ac.id === c.id))
                        .map(c => (
                        <option key={c.id} value={c.id}>{c.label} ({c.type})</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById('contract-select') as HTMLSelectElement;
                        if (sel.value) handleAssignContract(parseInt(sel.value));
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Lier
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Contrats Actuels</label>
                  <div className="grid grid-cols-1 gap-2">
                    {assetContracts.map(ac => (
                      <div key={ac.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                             <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{ac.label}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{ac.type} • Fin le {ac.end_date || 'N/A'}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveContract(ac.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {assetContracts.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-xl">
                        Aucun contrat associé.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
