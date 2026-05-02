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
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Lignes Téléphoniques</h1>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              Gestion de la flotte mobile et fixe
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            setSelectedLine(null);
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" /> Nouvelle Ligne
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher une ligne, un n°, un utilisateur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Ligne & Numéro</th>
                <th className="px-8 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Utilisateur & Site</th>
                <th className="px-8 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">Contrat & Fournisseur</th>
                <th className="px-8 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">Statut</th>
                <th className="px-8 py-4 text-[10px] uppercase font-black text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLines.map((line, idx) => {
                const assignedUser = users.find(u => u.id === line.assigned_user_id);
                const location = locations.find(l => l.id === line.location_id);
                const contract = contracts.find(c => c.id === line.contract_id);
                const supplier = suppliers.find(s => s.id === line.supplier_id);

                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={line.id} 
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{line.label}</div>
                          <div className="text-xs font-mono text-slate-400 tracking-tighter">{line.number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          {assignedUser ? assignedUser.name : 'Non assigné'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <MapPin className="w-3 h-3" />
                          {location ? location.name : 'NON SPÉCIFIÉ'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <FileText className="w-3 h-3 text-slate-400" />
                          {contract ? contract.label : 'Pas de contrat'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <Building2 className="w-3 h-3" />
                          {supplier ? supplier.name : 'INCONNU'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          line.status === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 
                          line.status === 'Inactif' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600'
                        }`}>
                          {line.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleEdit(line)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(line.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm"
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
