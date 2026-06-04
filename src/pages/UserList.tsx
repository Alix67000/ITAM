import React, { useEffect, useState } from 'react';
import { api, User, Location } from '../services/api';
import { cn } from '../lib/utils';
import { Plus, Search, User as UserIcon, Mail, Building, Network, Edit2, Trash2, Package, Inbox } from 'lucide-react';
import { motion } from 'motion/react';
import { UserModal } from '../components/UserModal';
import { useAuth } from '../services/authContext';

export const UserList: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { canEdit, canDelete, isViewer } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state (Kept for creation/edit)
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

      {/* Header compact */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl">
              <UserIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              Collaborateurs
            </h2>
            {/* Compteur */}
            {!loading && (
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold leading-none border border-slate-200">
                {filtered.length}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 ml-[52px]">Gestion des annuaires et profils utilisateurs</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            disabled={isViewer}
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-indigo-200 hover:shadow-md disabled:opacity-50 disabled:grayscale whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-indigo-100" /> Nouveau
          </button>
        </div>
      </div>

      {/* Liste compacte */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header (Desktop only) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
          <div className="col-span-4">Collaborateur</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-2">Département</div>
          <div className="col-span-2">Site / Entité</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-16 text-center text-slate-400 text-sm font-medium animate-pulse flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            Chargement des collaborateurs...
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-medium text-sm">
              Aucun collaborateur trouvé.
            </p>
          </div>
        )}

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {filtered.map((user, idx) => {
            const location = locations.find(l => l.id === user.location_id);
            
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx > 15 ? 0 : Math.min(idx * 0.02, 0.3) }}
                key={user.id} 
                className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 px-6 py-4 lg:py-3 hover:bg-slate-50/60 transition-colors items-start lg:items-center group"
              >
                {/* Utilisateur */}
                <div className="col-span-4 flex items-center gap-3.5 w-full min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-indigo-100">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                    <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors leading-snug">{user.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-[5px] text-[10px] font-bold uppercase tracking-wider w-max border",
                      user.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100/50' :
                      user.role === 'Viewer' ? 'bg-slate-50 text-slate-600 border-slate-200/60' :
                      'bg-blue-50 text-blue-700 border-blue-100/50'
                    )}>
                      {user.role || 'User'}
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="col-span-3 flex items-center gap-2.5 w-full min-w-0">
                  <Mail className="w-4 h-4 text-slate-300 shrink-0 lg:hidden" />
                  <span className="text-sm text-slate-600 truncate">{user.email}</span>
                </div>

                {/* Département */}
                <div className="col-span-2 flex items-center gap-2.5 w-full min-w-0">
                  <Building className="w-4 h-4 text-slate-300 shrink-0 lg:hidden" />
                  <span className="text-sm text-slate-600 truncate">{user.department || <span className="text-slate-300 italic">Non spécifié</span>}</span>
                </div>

                {/* Site */}
                <div className="col-span-2 flex items-center gap-2.5 w-full min-w-0">
                  <Network className="w-4 h-4 text-slate-300 shrink-0 lg:hidden" />
                  <span className="text-sm text-slate-600 truncate">{location ? location.name : 'Stock Central'}</span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center lg:justify-end gap-1.5 w-full mt-3 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-0 border-slate-100 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onNavigate?.(`assets:user:${user.id}`)}
                    className="flex lg:hidden items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors flex-1"
                  >
                    <Package className="w-3.5 h-3.5" /> Parc Assigné
                  </button>
                  <button 
                    onClick={() => onNavigate?.(`assets:user:${user.id}`)}
                    className="hidden lg:flex p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors" 
                    title="Consulter le parc"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={!canEdit}
                    onClick={() => handleEdit(user)} 
                    className="p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-0" 
                    title="Modifier"
                  >
                     <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={!canDelete}
                    onClick={() => handleDelete(user.id)} 
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-0" 
                    title="Supprimer"
                  >
                     <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

