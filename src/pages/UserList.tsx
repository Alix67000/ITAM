import React, { useEffect, useState } from 'react';
import { api, User, Location } from '../services/api';
import { cn } from '../lib/utils';
import { theme } from '../lib/theme';
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
      <div className={theme.pageHeader}>
        <div className="space-y-1">
          <div className={theme.pageTitleBox}>
            <div className={theme.pageTitleIcon}>
              <UserIcon className="w-5 h-5" />
            </div>
            <h2 className={theme.pageTitleText}>
              Collaborateurs
            </h2>
            {/* Compteur */}
            {!loading && (
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold leading-none border border-slate-200">
                {filtered.length}
              </span>
            )}
          </div>
          <p className={theme.pageSubtitle}>Gestion des annuaires et profils utilisateurs</p>
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
            <Plus className="w-4 h-4 text-indigo-100" /> Nouveau
          </button>
        </div>
      </div>

      {/* Liste compacte */}
      <div className={theme.card}>
        {/* Table Header (Desktop only) */}
        <div className={theme.listHeaderRow}>
          <div className="col-span-4">Collaborateur</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-2">Département</div>
          <div className="col-span-2">Site / Entité</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={theme.loadingPanel}>
            <div className={theme.loadingSpinner} />
            Chargement des collaborateurs...
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className={theme.emptyPanel}>
            <div className={theme.emptyIconBox}>
              <Inbox className="w-8 h-8" />
            </div>
            <p className={theme.emptyText}>
              Aucun collaborateur trouvé.
            </p>
          </div>
        )}

        {/* Rows */}
        <div className={theme.listWrapper}>
          {filtered.map((user, idx) => {
            const location = locations.find(l => l.id === user.location_id);
            
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx > 15 ? 0 : Math.min(idx * 0.02, 0.3) }}
                key={user.id} 
                className={theme.listRow}
              >
                {/* Utilisateur */}
                <div className="col-span-4 flex items-center gap-3.5 w-full min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-indigo-100">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                    <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors leading-snug">{user.name}</h3>
                    <span className={cn(
                      theme.badge,
                      user.role === 'Admin' ? theme.badgePrimary :
                      user.role === 'Viewer' ? theme.badgeNeutral :
                      theme.badgePrimary
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
                    className={theme.btnIconGhost} 
                    title="Modifier"
                  >
                     <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={!canDelete}
                    onClick={() => handleDelete(user.id)} 
                    className={theme.btnIconDanger} 
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

