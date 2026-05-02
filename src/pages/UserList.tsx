import React, { useEffect, useState } from 'react';
import { api, User } from '../services/api';
import { cn } from '../lib/utils';
import { Plus, Search, User as UserIcon, Mail, Building, Network, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { UserModal } from '../components/UserModal';
import { useAuth } from '../services/authContext';

export const UserList: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { canEdit, canDelete, isViewer } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state (Kept for creation)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, locationData] = await Promise.all([
        api.getUsers(),
        api.getLocations()
      ]);
      setUsers(userData);
      setLocations(locationData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    if (isViewer) return;
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    if (!canEdit) return;
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      await api.deleteUser(id);
      fetchData();
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }} 
        onRefresh={fetchData}
        user={selectedUser}
      />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" /> Répertoire Collaborateurs
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestion des profils et accès</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="bg-slate-100 border border-transparent rounded-xl pl-10 pr-4 py-2 text-sm w-48 md:w-64 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            disabled={isViewer}
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:grayscale"
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((user, idx) => {
          const location = locations.find(l => l.id === user.location_id);
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={user.id} 
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group overflow-hidden flex flex-col h-full"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 font-bold text-xl relative overflow-hidden">
                      {user.name.charAt(0)}
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 leading-tight">{user.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                          user.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' :
                          user.role === 'Viewer' ? 'bg-slate-50 text-slate-400' :
                          'bg-blue-50 text-blue-600'
                        )}>
                          {user.role || 'User'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                      <button 
                        disabled={!canEdit}
                        onClick={() => handleEdit(user)} 
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-0" 
                        title="Modifier"
                      >
                         <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        disabled={!canDelete}
                        onClick={() => handleDelete(user.id)} 
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0" 
                        title="Supprimer"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <Mail className="w-4 h-4" />
                     </div>
                     <div className="min-w-0 flex-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                       <p className="text-sm font-bold text-slate-600 truncate">{user.email}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                        <Building className="w-4 h-4" />
                     </div>
                     <div className="min-w-0 flex-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Département</p>
                       <p className="text-sm font-bold text-slate-600 truncate">{user.department || 'Non spécifié'}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                        <Network className="w-4 h-4" />
                     </div>
                     <div className="min-w-0 flex-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Site / Entité</p>
                       <p className="text-sm font-bold text-slate-600 truncate">{location ? location.name : 'Stock Central'}</p>
                     </div>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => onNavigate?.(`assets:user:${user.id}`)}
                className="w-full py-4 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border-t border-slate-100 mt-auto"
              >
                 Consulter son parc matériel
              </button>
            </motion.div>
          );
        })}
        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-slate-400 italic text-sm">
            Aucun utilisateur ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  );
};
