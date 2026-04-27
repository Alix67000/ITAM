import React, { useEffect, useState } from 'react';
import { api, Supplier } from '../services/api';
import { Plus, Search, Building2, User, Phone, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupplierModal } from '../components/SupplierModal';

export const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

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
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
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

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Fournisseurs</h2>
          <p className="text-xs text-slate-500">Gestion de vos partenaires et prestataires.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un fournisseur..." 
              className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <button onClick={handleCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-100">
            <Plus className="w-4 h-4" /> Nouveau Fournisseur
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <tr className="border-b border-slate-100">
              <th className="px-8 py-4">Entreprise</th>
              <th className="px-8 py-4">Contact</th>
              <th className="px-8 py-4">Téléphone</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.map((s, idx) => (
              <motion.tr 
                key={s.id}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.05 }} 
                className="hover:bg-slate-50 transition-colors group"
              >
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-bold text-slate-900">{s.name}</div>
                  </div>
                </td>
                <td className="px-8 py-4 text-slate-600">
                   <div className="flex items-center gap-2">
                     <User className="w-3.5 h-3.5 text-slate-400" />
                     {s.contact || '---'}
                   </div>
                </td>
                <td className="px-8 py-4 text-slate-600">
                   <div className="flex items-center gap-2">
                     <Phone className="w-3.5 h-3.5 text-slate-400" />
                     {s.phone || '---'}
                   </div>
                </td>
                <td className="px-8 py-4 text-right">
                   <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
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
