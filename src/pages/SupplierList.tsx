import React, { useEffect, useState } from 'react';
import { api, Supplier } from '../services/api';
import { Plus, Search, Building2, User, Phone, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupplierModal } from '../components/SupplierModal';
import { useAuth } from '../services/authContext';
import { cn } from '../lib/utils';
import { theme } from '../lib/theme';

export const SupplierList: React.FC = () => {
  const { canEdit, canDelete, isViewer } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  const fetchSuppliers = () => {
    setLoading(true);
    api.getSuppliers().then(data => {
      setSuppliers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleEdit = (supplier: Supplier) => {
    if (!canEdit) return;
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    if (isViewer) return;
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    setSupplierToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (supplierToDelete) {
      await api.deleteSupplier(supplierToDelete);
      setSupplierToDelete(null);
      setIsConfirmOpen(false);
      fetchSuppliers();
    }
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.contact && s.contact.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <SupplierModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchSuppliers} 
        supplier={selectedSupplier} 
      />

      <div className={theme.pageHeader}>
        <div className="space-y-1">
          <div className={theme.pageTitleBox}>
             <div className={theme.pageTitleIcon}>
                 <Building2 className="w-5 h-5" />
             </div>
             <h2 className={theme.pageTitleText}>
               Fournisseurs
             </h2>
          </div>
          <p className={theme.pageSubtitle}>Gestion de vos partenaires et prestataires de services.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-[280px]">
            <Search className={theme.searchIcon} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className={theme.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            disabled={isViewer}
            onClick={handleCreate} 
            className={theme.btnPrimary}
          >
            <Plus className="w-4 h-4 text-indigo-100" /> Nouveau Fournisseur
          </button>
        </div>
      </div>

      <div className={cn(theme.card, "flex flex-col min-h-[400px]")}>
        <table className="w-full text-left border-collapse hidden md:table">
          <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Entreprise</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Téléphone</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
               <tr><td colSpan={4}><div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div></td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan={4}><div className={theme.emptyPanel}><div className={theme.emptyIconBox}><Building2 className="w-8 h-8" /></div><p className={theme.emptyText}>Aucun fournisseur trouvé.</p></div></td></tr>
            ) : filtered.map((s, idx) => (
              <motion.tr 
                key={s.id}
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: idx * 0.02 }} 
                onClick={() => handleEdit(s)}
                className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm">{s.name}</div>
                  </div>
                </td>
                <td className="px-6 py-3 text-slate-600">
                   <div className="flex items-center gap-2 text-xs">
                     <User className="w-3.5 h-3.5 text-slate-400" />
                     {s.contact || <span className="text-slate-400 italic font-normal">Non renseigné</span>}
                   </div>
                </td>
                <td className="px-6 py-3 text-slate-600">
                   <div className="flex items-center gap-2 text-xs">
                     <Phone className="w-3.5 h-3.5 text-slate-400" />
                     {s.phone ? <span className="font-mono">{s.phone}</span> : <span className="text-slate-400 italic">Non renseigné</span>}
                   </div>
                </td>
                <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                       <button 
                         disabled={!canEdit}
                         onClick={(e) => { e.stopPropagation(); handleEdit(s); }} 
                         className={theme.btnIconGhost}
                         title="Modifier"
                       >
                         <Edit2 className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         disabled={!canDelete}
                         onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} 
                         className={theme.btnIconDanger}
                         title="Supprimer"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
             {loading ? (
                <div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div>
             ) : filtered.length === 0 ? (
                <div className={theme.emptyPanel}><div className={theme.emptyIconBox}><Building2 className="w-8 h-8" /></div><p className={theme.emptyText}>Aucun fournisseur trouvé.</p></div>
             ) : filtered.map((s) => (
                <div key={s.id} onClick={() => handleEdit(s)} className="p-5 active:bg-slate-50 transition-colors flex gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0 font-black text-lg">
                     {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                     <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 truncate pr-2 text-sm">{s.name}</h3>
                     </div>
                     <div className="flex items-center gap-2 font-medium text-xs text-slate-500">
                       <User className="w-3.5 h-3.5 text-slate-400" />
                       {s.contact || <span className="italic">Non renseigné</span>}
                     </div>
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                       <Phone className="w-3.5 h-3.5 text-slate-400" />
                       {s.phone ? <span className="font-mono">{s.phone}</span> : <span className="italic">Non renseigné</span>}
                     </div>
                  </div>
                </div>
             ))}
        </div>
      </div>

      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsConfirmOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200">
               <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                 <Trash2 className="w-6 h-6" />
               </div>
               <h3 className="font-bold text-slate-900 text-lg mb-2">Supprimer le fournisseur</h3>
               <p className="text-sm text-slate-500 mb-6">
                 Êtes-vous sûr de vouloir supprimer ce fournisseur ?<br/><br/>
                 <span className="font-bold text-red-600">Attention :</span> Tous les assets et contrats liés n'auront plus de fournisseur associé. Cette action est irréversible.
               </p>
               <div className="flex gap-3">
                  <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100">Supprimer</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
