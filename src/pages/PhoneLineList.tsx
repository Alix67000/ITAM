import React, { useEffect, useState } from 'react';
import { api, PhoneLine, User, Location, Contract, Supplier } from '../services/api';
import { Plus, Search, Filter, Phone, User as UserIcon, MapPin, Building2, FileText, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneLineModal } from '../components/PhoneLineModal';

export const PhoneLineList: React.FC = () => {
  const [phoneLines, setPhoneLines] = useState<PhoneLine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<PhoneLine | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [lineToDelete, setLineToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linesData, usersData, locationsData, contractsData, suppliersData] = await Promise.all([
        api.getPhoneLines(),
        api.getUsers(),
        api.getLocations(),
        api.getContracts(),
        api.getSuppliers()
      ]);
      setPhoneLines(linesData);
      setUsers(usersData);
      setLocations(locationsData);
      setContracts(contractsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching phone lines data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (line: PhoneLine) => {
    setSelectedLine(line);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setLineToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (lineToDelete) {
      await api.deletePhoneLine(lineToDelete);
      setLineToDelete(null);
      setIsConfirmOpen(false);
      fetchData();
    }
  };

  const filteredLines = phoneLines.filter(line => {
    const assignedUser = users.find(u => u.id === line.assigned_user_id);
    const location = locations.find(l => l.id === line.location_id);
    const contract = contracts.find(c => c.id === line.contract_id);
    const supplier = suppliers.find(s => s.id === line.supplier_id);

    return (
      line.label.toLowerCase().includes(search.toLowerCase()) ||
      line.number.includes(search) ||
      assignedUser?.name.toLowerCase().includes(search.toLowerCase()) ||
      location?.name.toLowerCase().includes(search.toLowerCase()) ||
      contract?.label.toLowerCase().includes(search.toLowerCase()) ||
      supplier?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 pb-20">
      <PhoneLineModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLine(null);
        }}
        onSuccess={fetchData}
        phoneLine={selectedLine}
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-900">Confirmer la suppression</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer cette ligne téléphonique ? Cette action est irréversible.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-1.5 flex-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                 <Phone className="w-5 h-5" />
             </div>
             Lignes Téléphoniques
          </h1>
          <p className="text-sm font-medium text-slate-500 pl-13">Gestion de la flotte mobile, abonnements et lignes fixes.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button 
            onClick={() => {
              setSelectedLine(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 group whitespace-nowrap"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Nouvelle Ligne
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher une ligne, un n°, un utilisateur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-500 tracking-[0.15em]">
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5">Ligne & Numéro</th>
                <th className="px-8 py-5">Utilisateur & Site</th>
                <th className="px-8 py-5">Contrat & Fournisseur</th>
                <th className="px-8 py-5 text-center">Statut</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50 text-sm">
              {filteredLines.map((line, idx) => {
                const assignedUser = users.find(u => u.id === line.assigned_user_id);
                const location = locations.find(l => l.id === line.location_id);
                const contract = contracts.find(c => c.id === line.contract_id);
                const supplier = suppliers.find(s => s.id === line.supplier_id);

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={line.id} 
                    onClick={() => handleEdit(line)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{line.number}</div>
                          <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">{line.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        {assignedUser ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">{assignedUser.name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-300">Non assigné</span>
                        )}
                        {location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">{location.name}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        {contract ? (
                           <div className="flex items-center gap-2">
                             <FileText className="w-3.5 h-3.5 text-slate-400" />
                             <span className="text-sm text-slate-600 font-bold truncate max-w-[150px]">{contract.label}</span>
                           </div>
                         ) : (
                           <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-300">Aucun contrat</span>
                         )}
                         {supplier ? (
                           <div className="flex items-center gap-2">
                             <Building2 className="w-3.5 h-3.5 text-slate-400" />
                             <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">{supplier.name}</span>
                           </div>
                         ) : null}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                         <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block min-w-[90px] text-center ${
                           line.status === 'Actif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-200'
                         }`}>
                          {line.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(line)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(line.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredLines.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic text-sm border-t border-slate-50">
                    Aucune ligne téléphonique trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
