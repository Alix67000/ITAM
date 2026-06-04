import React from 'react';
import { LayoutDashboard, Laptop, Users, MapPin, FileText, Settings, Database, Activity, Building2, Network, ChevronDown, Monitor, Cpu, Smartphone, Printer, Box, Share2, MousePointer2, Shield, ShieldCheck, ShieldAlert, Key, Phone, X, Plus, LogOut, Package } from 'lucide-react';
import { FooterStatus } from './FooterStatus';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../services/authContext';
import { useNavigate } from 'react-router-dom';

import { GlobalCreateHub } from './GlobalCreateHub';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<{ type: string; id: string; label: string }[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCreateHubOpen, setIsCreateHubOpen] = React.useState(false);
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    assets: true,
    gestion: true
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'assets', 
      label: 'Assets', 
      icon: Laptop,
      subItems: [
        { id: 'ordinateurs', label: 'Ordinateurs', icon: Cpu },
        { id: 'moniteurs', label: 'Moniteurs', icon: Monitor },
        { id: 'matériels réseau', label: 'Réseau', icon: Share2 },
        { id: 'périphériques', label: 'Périphériques', icon: MousePointer2 },
        { id: 'imprimantes', label: 'Imprimantes', icon: Printer },
        { id: 'téléphones', label: 'Téléphones', icon: Smartphone },
        { id: 'autres', label: 'Autres', icon: Package },
      ]
    },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { 
      id: 'gestion', 
      label: 'Gestion', 
      icon: Settings,
      subItems: [
        { id: 'softwares', label: 'Logiciels', icon: Box },
        { id: 'licenses', label: 'Licences', icon: Key },
        { id: 'phone-lines', label: 'Lignes', icon: Phone },
      ]
    },
    { id: 'contracts', label: 'Contrats', icon: FileText },
    { id: 'cmdb', label: 'CMDB', icon: Share2 },
    { id: 'suppliers', label: 'Fournisseurs', icon: Building2 },
    { id: 'locations', label: 'Entités', icon: Network },
  ];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [assets, users, locations, suppliers] = await Promise.all([
        api.getAssets({ fetchAll: true }).then(res => res.assets),
        api.getUsers(),
        api.getLocations(),
        api.getSuppliers(),
      ]);

      const filteredAssets = assets
        .filter(a => a.label.toLowerCase().includes(query.toLowerCase()) || a.serial?.toLowerCase().includes(query.toLowerCase()))
        .map(a => ({ type: 'asset', id: a.id, label: a.label, tab: 'assets' }));

      const filteredUsers = users
        .filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
        .map(u => ({ type: 'user', id: u.id, label: u.name, tab: 'users' }));

      const filteredLocations = locations
        .filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
        .map(l => ({ type: 'location', id: l.id, label: l.name, tab: 'locations' }));

      const filteredSuppliers = suppliers
        .filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
        .map(s => ({ type: 'fournisseur', id: s.id, label: s.name, tab: 'suppliers' }));

      setResults([...filteredAssets, ...filteredUsers, ...filteredLocations, ...filteredSuppliers].slice(0, 8) as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Mobile Nav Items (Simplified for bottom bar)
  const mobileNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'assets', label: 'Assets', icon: Laptop },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'gestion:phone-lines', label: 'Lignes', icon: Phone },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Drawer on mobile, Fixed on Desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[160] w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 hidden md:flex",
        isSidebarOpen ? "translate-x-0 !flex" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">ITAM EMMAÜS</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  if (item.subItems) {
                    toggleSection(item.id);
                    if (!activeTab.startsWith(`${item.id}:`)) {
                      setActiveTab(`${item.id}:${item.subItems[0].id}`);
                    }
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors",
                  activeTab === item.id || activeTab.startsWith(`${item.id}:`)
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5", (activeTab === item.id || activeTab.startsWith(`${item.id}:`)) ? "text-blue-700" : "text-slate-400")} />
                  {item.label}
                </div>
                {item.subItems && (
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", openSections[item.id] ? "rotate-180" : "")} />
                )}
              </button>

              {item.subItems && (
                <AnimatePresence>
                  {openSections[item.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1 ml-4 border-l border-slate-100 pl-4"
                    >
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveTab(`${item.id}:${sub.id}`)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg text-xs font-medium transition-colors",
                            activeTab === `${item.id}:${sub.id}`
                              ? "bg-blue-50/50 text-blue-600" 
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          <sub.icon className={cn("w-3.5 h-3.5", activeTab === `${item.id}:${sub.id}` ? "text-blue-600" : "text-slate-400")} />
                          {sub.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto space-y-3">
          <div className="bg-slate-900 rounded-xl p-4 text-white text-[10px] space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-black text-sm overflow-hidden text-white uppercase">
                 {user?.photoURL ? <img src={user.photoURL} alt={user.displayName || ''} /> : 'AA'}
               </div>
               <div className="flex-1 overflow-hidden">
                 <div className="font-black truncate">{user?.displayName || 'Admin'}</div>
                 <div className="opacity-50 truncate">{user?.email || 'admin@example.com'}</div>
               </div>
             </div>

             {user?.email && (
               <div className="text-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:inline truncate max-w-[160px]">
                   {user.email}
                 </span>
               </div>
             )}

             <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors font-bold uppercase tracking-widest mt-2"
             >
               <LogOut className="w-3 h-3" />
               Déconnexion
             </button>
          </div>
          <FooterStatus />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between flex-shrink-0 relative">
          <div className="flex items-center gap-3 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 md:hidden"
            >
              <Network className="w-6 h-6" />
            </button>

            <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 w-full max-w-md relative sm:flex hidden">
              <Database className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-transparent border-none text-sm w-full focus:ring-0 outline-none" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             <button 
               onClick={() => setIsCreateHubOpen(true)}
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
             >
               <Plus className="w-4 h-4" />
               <span className="hidden md:inline">Nouveau</span>
             </button>
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold uppercase overflow-hidden text-xs">
              {user?.photoURL ? <img src={user.photoURL} alt={user.displayName || ''} /> : (user?.email?.substring(0, 2) || 'AD')}
            </div>
          </div>

          {/* Search Results Dropdown - Full width on mobile if open */}
          {(searchQuery.length > 1) && (
            <div className="absolute top-14 left-0 right-0 md:left-20 md:right-auto md:w-96 bg-white border border-slate-200 md:rounded-2xl shadow-xl z-[200] overflow-hidden">
                <div className="p-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 px-4">
                  Résultats de recherche
                </div>
                {results.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {results.map((res: any) => (
                      <button
                        key={`${res.type}-${res.id}`}
                        onClick={() => {
                          const pathMap: Record<string, string> = {
                            'asset': 'assets',
                            'user': 'users',
                            'location': 'locations',
                            'suppliers': 'suppliers'
                          };
                          
                          if (res.type === 'asset') {
                            navigate(`/assets/${res.id}`);
                          } else {
                            setActiveTab(res.tab);
                          }
                          setSearchQuery('');
                          setResults([]);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{res.label}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{res.type}</div>
                        </div>
                        <div className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          VOIR
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-400 italic">
                    {isSearching ? 'Recherche en cours...' : 'Aucun résultat trouvé.'}
                  </div>
                )}
              </div>
            )}
        </header>

        <div className="flex-1 overflow-y-auto w-full relative">
          <div className="p-4 md:p-8 h-full w-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>

        {/* Bottom Navigation for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-[140] pb-safe">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all",
                (activeTab === item.id || activeTab.startsWith(`${item.id}:`))
                  ? "text-blue-600"
                  : "text-slate-400"
              )}
            >
              <item.icon className={cn("w-5 h-5", (activeTab === item.id || activeTab.startsWith(`${item.id}:`)) ? "text-blue-600" : "text-slate-400")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              {(activeTab === item.id || activeTab.startsWith(`${item.id}:`)) && (
                <motion.div layoutId="mobileNavUnderline" className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
              )}
            </button>
          ))}
        </nav>
        <GlobalCreateHub isOpen={isCreateHubOpen} onClose={() => setIsCreateHubOpen(false)} />
      </main>
    </div>
  );
};
