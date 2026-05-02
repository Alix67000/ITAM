import React, { useEffect, useState } from 'react';
import { api, User } from '../services/api';
import { cn } from '../lib/utils';
import { Plus, Search, User as UserIcon, Mail, Building, Network, Edit2, Trash2, Package } from 'lucide-react';
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-indigo-600" /> Répertoire Collaborateurs
          </h2>
          <p className="text-sm font-medium text-slate-500">Gestion des profils et accès au parc informatique</p>
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
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Nouveau Profil
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
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group overflow-hidden flex flex-col h-full"
            >
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-100 font-black text-2xl relative overflow-hidden group-hover:scale-105 transition-transform">
                      {user.name.charAt(0)}
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                          user.role === 'Admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                          user.role === 'Viewer' ? 'bg-slate-50 text-slate-500 border border-slate-200' :
                          'bg-blue-50 text-blue-600 border border-blue-100'
                        )}>
                          {user.role || 'User'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        disabled={!canEdit}
                        onClick={() => handleEdit(user)} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-0" 
                        title="Modifier"
                      >
                         <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        disabled={!canDelete}
                        onClick={() => handleDelete(user.id)} 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-0" 
                        title="Supprimer"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        <Mail className="w-4 h-4" />
                     </div>
                     <div className="min-w-0 flex-1 space-y-0.5">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Email</p>
                       <p className="text-sm font-bold text-slate-700 truncate">{user.email}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                        <Building className="w-4 h-4" />
                     </div>
                     <div className="min-w-0 flex-1 space-y-0.5">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Département</p>
                       <p className="text-sm font-bold text-slate-700 truncate">{user.department || 'Non spécifié'}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                        <Network className="w-4 h-4" />
                     </div>
                     <div className="min-w-0 flex-1 space-y-0.5">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Site / Entité</p>
                       <p className="text-sm font-bold text-slate-700 truncate">{location ? location.name : 'Stock Central'}</p>
                     </div>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => onNavigate?.(`assets:user:${user.id}`)}
                className="w-full py-5 bg-slate-50 text-slate-500 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all border-t border-slate-100 flex items-center justify-center gap-2"
              >
                 <Package className="w-4 h-4" /> Consulter le parc de l'utilisateur
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
