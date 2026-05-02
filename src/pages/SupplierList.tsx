import React, { useEffect, useState } from 'react';
import { api, Supplier } from '../services/api';
import { Plus, Search, Building2, User, Phone, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupplierModal } from '../components/SupplierModal';
import { useAuth } from '../services/authContext';

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

  if (loading && suppliers.length === 0) return <div className="text-sm font-sans text-slate-400 p-12 text-center animate-pulse italic">Chargement des fournisseurs...</div>;

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
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

      <SupplierModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchSuppliers} 
        supplier={selectedSupplier} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-1.5 flex-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                 <Building2 className="w-5 h-5" />
             </div>
             Fournisseurs
          </h2>
          <p className="text-sm font-medium text-slate-500 pl-13">Gestion de vos partenaires et prestataires de services.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group flex-1 sm:flex-initial">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 min-w-[240px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            disabled={isViewer}
            onClick={handleCreate} 
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:grayscale group whitespace-nowrap"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Nouveau Fournisseur
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-500 tracking-[0.15em]">
            <tr className="border-b border-slate-100">
              <th className="px-8 py-5">Entreprise</th>
              <th className="px-8 py-5">Contact</th>
              <th className="px-8 py-5">Téléphone</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/50 text-sm">
            {filtered.map((s, idx) => (
              <motion.tr 
                key={s.id}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.05 }} 
                onClick={() => handleEdit(s)}
                className="hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-[0.75rem] flex items-center justify-center font-black text-lg">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{s.name}</div>
                  </div>
                </td>
                <td className="px-8 py-6 text-slate-600">
                   <div className="flex items-center gap-2 font-medium">
                     <User className="w-4 h-4 text-slate-400" />
                     {s.contact || <span className="text-slate-400 italic font-normal">Non renseigné</span>}
                   </div>
                </td>
                <td className="px-8 py-6 text-slate-600">
                   <div className="flex items-center gap-2">
                     <Phone className="w-4 h-4 text-slate-400" />
                     {s.phone ? <span className="font-mono text-xs">{s.phone}</span> : <span className="text-slate-400 italic">Non renseigné</span>}
                   </div>
                </td>
                <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                       <button 
                         disabled={!canEdit}
                         onClick={() => handleEdit(s)} 
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed" 
                         title="Modifier"
                       >
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button 
                         disabled={!canDelete}
                         onClick={() => handleDelete(s.id)} 
                         className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed" 
                         title="Supprimer"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && !loading && (
               <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic text-sm">Aucun fournisseur trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
