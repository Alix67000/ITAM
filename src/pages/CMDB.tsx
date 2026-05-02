import React, { useEffect, useState } from 'react';
import { api, Asset, User, Location } from '../services/api';
import { Network, Server, Monitor, HardDrive, Filter, Users, MapPin, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export const CMDB = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allAssets, allUsers, allLocations] = await Promise.all([
        api.getAssets({ fetchAll: true }).then(r => r.assets),
        api.getUsers(),
        api.getLocations()
      ]);
      setAssets(allAssets);
      setUsers(allUsers);
      setLocations(allLocations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAssets = assets.filter(a => {
    const matchUser = !userFilter || String(a.assigned_user_id) === String(userFilter);
    const matchLocation = !locationFilter || String(a.location_id) === String(locationFilter);
    return matchUser && matchLocation;
  });

  // Calculate statistics from filtered assets
  const typeStats = filteredAssets.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {} as Record<string, number>);
  const statusStats = filteredAssets.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const locationStats = filteredAssets.reduce((acc, a) => { 
    if (a.location_id) {
       acc[a.location_id] = (acc[a.location_id] || 0) + 1; 
    }
    return acc; 
  }, {} as Record<string, number>);

  // Find linked roots (parents)
  const parents = filteredAssets.filter(a => {
    // If it has children inside the pool of assets, Or if it's a PC/Server (major type)
    const children = assets.filter(child => child.linkedAssets?.includes(a.id) || a.linkedAssets?.includes(child.id));
    return (a.type === 'PC' || a.type === 'Serveur' || a.type === 'Imprimante') || children.length > 0;
  });

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-indigo-400 font-bold italic">Chargement CMDB...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 text-indigo-50/50">
          <Network className="w-64 h-64" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vue CMDB</h1>
              <p className="text-sm font-medium text-slate-500">Cartographie logicielle et matérielle</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto relative z-10">
          <div className="space-y-1 w-full sm:w-48">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Filtrer par utilisateur</label>
            <select 
              value={userFilter} onChange={(e) => setUserFilter(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
            >
              <option value="">Tous les utilisateurs</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 w-full sm:w-48">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Filtrer par entité</label>
            <select 
              value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
            >
              <option value="">Toutes les entités</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Monitor className="w-3 h-3 text-blue-500"/> Par Type
          </h3>
          <div className="space-y-2">
            {Object.entries(typeStats).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-600">{type || 'Autre'}</span>
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs">{count}</span>
              </div>
            ))}
            {Object.keys(typeStats).length === 0 && <div className="text-xs text-slate-400">Aucune donnée</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-500"/> Par Statut
          </h3>
          <div className="space-y-2">
            {Object.entries(statusStats).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-600">{status || 'Inconnu'}</span>
                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-xs">{count}</span>
              </div>
            ))}
            {Object.keys(statusStats).length === 0 && <div className="text-xs text-slate-400">Aucune donnée</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin className="w-3 h-3 text-amber-500"/> Par Emplacement (Top 5)
          </h3>
          <div className="space-y-2">
            {Object.entries(locationStats).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).slice(0, 5).map(([locId, count]) => {
              const loc = locations.find(l => String(l.id) === String(locId));
              return (
                <div key={locId} className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-600 truncate pr-2">{loc ? loc.name : 'Inconnu'}</span>
                  <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-xs">{count}</span>
                </div>
              );
            })}
            {Object.keys(locationStats).length === 0 && <div className="text-xs text-slate-400">Aucune donnée</div>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-black text-slate-900 tracking-tight">Cartographie des liaisons</h3>
           <p className="text-xs font-semibold text-slate-400">Affichage des actifs principaux et leurs dépendances</p>
        </div>
        <div className="divide-y divide-slate-100">
          {parents.length > 0 ? parents.map(parent => {
            const children = assets.filter(a => parent.linkedAssets?.includes(a.id));
            if (children.length === 0 && (parentFilter => userFilter || locationFilter)(parent)) {
              // Si filtre actif et pas d'enfants, on l'affiche quand même si c'est un asset filtré.
            } else if (children.length === 0 && parent.type !== 'PC' && parent.type !== 'Serveur') {
              return null; // On cache les petits assets sans enfant si on est pas filtré
            }
            
            const pUser = users.find(u => String(u.id) === String(parent.assigned_user_id));
            
            return (
              <div key={parent.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                  onClick={() => navigate('/assets/' + parent.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {parent.type === 'Serveur' ? <Server className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{parent.label}</h4>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1">
                        <span className="uppercase text-[9px] font-black tracking-widest">{parent.type}</span>
                        {pUser && <><span className="w-1 h-1 rounded-full bg-slate-300" /><span>{pUser.name}</span></>}
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg w-fit",
                    parent.status === 'En service' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {parent.status}
                  </span>
                </div>

                {children.length > 0 && (
                  <div className="mt-4 pl-14 sm:pl-16 space-y-3">
                    {children.map(child => (
                      <div 
                        key={child.id} 
                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                        onClick={(e) => { e.stopPropagation(); navigate('/assets/' + child.id); }}
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-500">
                           <HardDrive className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600">{child.label}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{child.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="p-12 text-center text-slate-500 font-medium text-sm italic">
              Aucun actif principal trouvé.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
