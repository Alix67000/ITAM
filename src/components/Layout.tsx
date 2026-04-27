import React from 'react';
import { LayoutDashboard, Laptop, Users, MapPin, FileText, Settings, Database, Activity } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../services/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<{ type: string; id: number; label: string }[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Assets', icon: Laptop },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'contracts', label: 'Contrats & Licences', icon: FileText },
    { id: 'locations', label: 'Lieux', icon: MapPin },
  ];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [assets, users, locations] = await Promise.all([
        api.getAssets(),
        api.getUsers(),
        api.getLocations(),
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

      setResults([...filteredAssets, ...filteredUsers, ...filteredLocations].slice(0, 8) as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">G</div>
          <span className="font-bold text-lg tracking-tight">MiniGLPI <span className="text-blue-600">v1</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-blue-700" : "text-slate-400")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <div className="bg-slate-900 rounded-xl p-4 text-white text-[10px]">
             <p className="opacity-70 mb-1 font-sans uppercase tracking-wider">Database Version</p>
             <p className="font-mono">SQLite v3.x • Core v1</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 relative">
          <div className="flex flex-col">
            <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 w-96 relative">
              <Database className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Rechercher un asset, SN, utilisateur..." 
                className="bg-transparent border-none text-sm w-full focus:ring-0 outline-none" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            {/* Search Results Dropdown */}
            {(searchQuery.length > 1) && (
              <div className="absolute top-14 left-8 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 px-4">
                  Résultats de recherche
                </div>
                {results.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {results.map((res: any) => (
                      <button
                        key={`${res.type}-${res.id}`}
                        onClick={() => {
                          setActiveTab(res.tab);
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
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              + Nouvel Asset
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold">
              IT
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 h-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
