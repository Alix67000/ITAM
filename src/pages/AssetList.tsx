import React, { useEffect, useState } from 'react';
import { api, Asset } from '../services/api';
import { Plus, Search, Filter, Cpu, Smartphone, Monitor, Printer, HardDrive, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssetModal } from '../components/AssetModal';

export const AssetList: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);

  const fetchAssets = () => {
    setLoading(true);
    api.getAssets().then(data => {
      setAssets(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedAsset(null);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (assetToDelete) {
      await api.deleteAsset(assetToDelete);
      setAssetToDelete(null);
      setIsConfirmOpen(false);
      fetchAssets();
    }
  };

  const handleDelete = (id: number) => {
    setAssetToDelete(id);
    setIsConfirmOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pc': return <Cpu className="w-4 h-4" />;
      case 'téléphone': return <Smartphone className="w-4 h-4" />;
      case 'écran': return <Monitor className="w-4 h-4" />;
      case 'imprimante': return <Printer className="w-4 h-4" />;
      default: return <HardDrive className="w-4 h-4" />;
    }
  };

  const filtered = assets.filter(a => 
    a.label.toLowerCase().includes(search.toLowerCase()) || 
    a.serial?.toLowerCase().includes(search.toLowerCase()) ||
    a.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && assets.length === 0) return <div className="text-sm font-sans text-slate-400 p-12 text-center animate-pulse italic">Synchronisation de la base de données...</div>;

  return (
    <div className="space-y-6">
      <AssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchAssets}
        asset={selectedAsset}
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsConfirmOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200">
               <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                 <Trash2 className="w-6 h-6" />
               </div>
               <h3 className="font-bold text-slate-900 text-lg mb-2">Confirmer la suppression</h3>
               <p className="text-sm text-slate-500 mb-6">Cette action est irréversible. L'historique lié à cet asset sera également supprimé.</p>
               <div className="flex gap-3">
                  <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100">Supprimer</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Inventaire Global</h2>
          <p className="text-xs text-slate-500">Gestion et suivi des {assets.length} matériels répertoriés.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Série, Label, User..." 
              className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Plus className="w-4 h-4" /> Nouvel Asset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <tr className="border-b border-slate-100">
              <th className="px-8 py-4 font-semibold">Matériel</th>
              <th className="px-8 py-4 font-semibold">Identifiant</th>
              <th className="px-8 py-4 font-semibold">Lieu</th>
              <th className="px-8 py-4 font-semibold">Affecté à</th>
              <th className="px-8 py-4 font-semibold text-center">État</th>
              <th className="px-8 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.map((asset, idx) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={asset.id} 
                className="hover:bg-slate-50 transition-colors group"
              >
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200">
                      {getTypeIcon(asset.type)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{asset.label}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono tracking-tighter">{asset.type} {asset.subtype ? `• ${asset.subtype}` : ''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4 font-mono text-[11px] text-slate-500">
                  {asset.serial || 'N/A'}
                </td>
                <td className="px-8 py-4 text-slate-600">
                  {asset.location_name || <span className="opacity-30">---</span>}
                </td>
                <td className="px-8 py-4">
                  {asset.user_name ? (
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                         {asset.user_name.charAt(0)}
                       </div>
                       <span className="font-medium text-slate-900">{asset.user_name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 italic text-xs">Non affecté</span>
                  )}
                </td>
                <td className="px-8 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase inline-block min-w-[80px] ${
                    asset.status === 'Stock' ? 'bg-blue-100 text-blue-700' : 
                    asset.status === 'Panne' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(asset)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(asset.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && !loading && (
               <tr>
                 <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic text-sm">
                   Aucun matériel ne correspond à votre recherche.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

