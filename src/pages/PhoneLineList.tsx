import React, { useEffect, useState } from 'react';
import { api, PhoneLine, User, Location, Contract, Supplier } from '../services/api';
import { Plus, Search, Filter, Phone, User as UserIcon, MapPin, Building2, FileText, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneLineModal } from '../components/PhoneLineModal';
import { cn } from '../lib/utils';
import { theme } from '../lib/theme';

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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-200"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Supprimer la ligne</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer cette ligne téléphonique ? Cette action est irréversible.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className={theme.pageHeader}>
        <div className="space-y-1">
          <div className={theme.pageTitleBox}>
             <div className={theme.pageTitleIcon}>
                 <Phone className="w-5 h-5" />
             </div>
             <h1 className={theme.pageTitleText}>
               Lignes Téléphoniques
             </h1>
          </div>
          <p className={theme.pageSubtitle}>Gestion de la flotte mobile, abonnements et lignes fixes.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <div className="relative group flex-1 md:w-[280px]">
             <Search className={theme.searchIcon} />
             <input 
               type="text" 
               placeholder="Rechercher..."
               value={search}
               onChange={e => setSearch(e.target.value)}
               className={theme.searchInput}
             />
           </div>
          <button 
            onClick={() => {
              setSelectedLine(null);
              setIsModalOpen(true);
            }}
            className={theme.btnPrimary}
          >
            <Plus className="w-4 h-4 text-indigo-100" /> Nouvelle Ligne
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(theme.card, "flex flex-col min-h-[400px]")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse hidden md:table">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 lg:px-8 py-5">Ligne & Numéro</th>
                <th className="px-6 lg:px-8 py-5">Utilisateur & Site</th>
                <th className="px-6 lg:px-8 py-5">Contrat & Fournisseur</th>
                <th className="px-6 lg:px-8 py-5 text-center">Statut</th>
                <th className="px-6 lg:px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={5}><div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div></td></tr>
              ) : filteredLines.length === 0 ? (
                <tr><td colSpan={5}><div className={theme.emptyPanel}><div className={theme.emptyIconBox}><Phone className="w-8 h-8" /></div><p className={theme.emptyText}>Aucune ligne téléphonique trouvée.</p></div></td></tr>
              ) : filteredLines.map((line, idx) => {
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
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 lg:px-8 py-4 lg:py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-base">{line.number}</div>
                          <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">{line.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-4 lg:py-6">
                      <div className="space-y-2">
                        {assignedUser ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">{assignedUser.name}</span>
                          </div>
                        ) : (
                          <span className={theme.badgeNeutral}>Non assigné</span>
                        )}
                        {location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">{location.name}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-4 lg:py-6">
                      <div className="space-y-2">
                        {contract ? (
                           <div className="flex items-center gap-2">
                             <FileText className="w-3.5 h-3.5 text-slate-400" />
                             <span className="text-sm text-slate-600 font-bold truncate max-w-[150px]">{contract.label}</span>
                           </div>
                         ) : (
                           <span className={theme.badgeNeutral}>Aucun contrat</span>
                         )}
                         {supplier ? (
                           <div className="flex items-center gap-2">
                             <Building2 className="w-3.5 h-3.5 text-slate-400" />
                             <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">{supplier.name}</span>
                           </div>
                         ) : null}
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-4 lg:py-6">
                      <div className="flex justify-center">
                         <span className={line.status === 'Actif' ? theme.badgeSuccess : theme.badgeNeutral}>
                          {line.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-4 lg:py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(line); }}
                          className={theme.btnIconGhost}
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(line.id); }}
                          className={theme.btnIconDanger}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-100">
              {loading ? (
                 <div className={theme.loadingPanel}><div className={theme.loadingSpinner} />Chargement...</div>
              ) : filteredLines.length === 0 ? (
                 <div className={theme.emptyPanel}><div className={theme.emptyIconBox}><Phone className="w-8 h-8" /></div><p className={theme.emptyText}>Aucune ligne téléphonique trouvée.</p></div>
              ) : filteredLines.map((line) => {
                  const assignedUser = users.find(u => u.id === line.assigned_user_id);
                  const location = locations.find(l => l.id === line.location_id);
                  const contract = contracts.find(c => c.id === line.contract_id);
                  const supplier = suppliers.find(s => s.id === line.supplier_id);
                  
                  return (
                    <div key={line.id} onClick={() => handleEdit(line)} className="p-5 active:bg-slate-50 transition-colors flex gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                         <Phone className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                         <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">{line.number}</h3>
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{line.label}</div>
                            </div>
                            <span className={line.status === 'Actif' ? theme.badgeSuccess : theme.badgeNeutral}>
                              {line.status}
                            </span>
                         </div>
                         
                         <div className="flex items-center gap-2 font-medium text-xs text-slate-500">
                           <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                           {assignedUser ? assignedUser.name : <span className="italic">Non assigné</span>}
                         </div>
                         
                         {contract && (
                           <div className="flex items-center gap-2 font-medium text-xs text-slate-500">
                             <FileText className="w-3.5 h-3.5 text-slate-400" />
                             <span className="truncate">{contract.label}</span>
                           </div>
                         )}
                      </div>
                    </div>
                  );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
