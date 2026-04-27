import React, { useEffect, useState } from 'react';
import { api, User } from '../services/api';
import { Plus, Search, User as UserIcon, Mail, Building, MapPin, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { UserModal } from '../components/UserModal';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    api.getUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      await api.deleteUser(id);
      fetchUsers();
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
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchUsers}
        user={selectedUser}
      />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Répertoire Utilisateurs</h2>
          <p className="text-xs text-slate-500">Gestion des collaborateurs et de leurs accès matériels.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Nom, Email, Service..." 
              className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Plus className="w-4 h-4" /> Nouvel Utilisateur
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((user, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={user.id} 
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">{user.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">
                     <Building className="w-3 h-3" /> {user.department || '---'}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleEdit(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                 </button>
                 <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                 </button>
              </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center gap-3 text-sm text-slate-600">
                 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-slate-400" />
                 </div>
                 <span className="truncate">{user.email}</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-600">
                 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-slate-400" />
                 </div>
                 <span>{(user as any).location_name || 'Non rattaché'}</span>
               </div>
            </div>

            <button className="w-full mt-6 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors uppercase tracking-wider">
               Voir Matériel Assigné
            </button>
          </motion.div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-slate-400 italic text-sm">
            Aucun utilisateur ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  );
};
